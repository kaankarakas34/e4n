import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { readPublicSchemaCatalog } from '../src/config/schema-catalog.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-isolated-${randomUUID().slice(0, 8)}`;
const dbName = 'e4n_isolated_test';
const dbUser = 'e4n_isolated_test';
const dbPassword = 'local_fixture_only';
const serveForDevice = process.argv.includes('--serve');
let appServer;
let pool;
let containerStarted = false;

function docker(args, { input, timeout = 30_000 } = {}) {
  const result = spawnSync('docker', args, {
    cwd: serverDir,
    encoding: 'utf8',
    input,
    timeout,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Docker ${args[0]} failed: ${(result.stderr || result.error?.message || '').trim()}`);
  }
  return result.stdout.trim();
}

async function waitForPostgres() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = spawnSync('docker', ['exec', container, 'pg_isready', '-U', dbUser, '-d', dbName], {
      encoding: 'utf8', timeout: 5_000, windowsHide: true,
    });
    if (result.status === 0) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Isolated PostgreSQL did not become ready within 30 seconds');
}

async function main() {
  docker([
    'run', '--rm', '-d', '--pull=never', '--name', container,
    '-e', `POSTGRES_USER=${dbUser}`,
    '-e', `POSTGRES_PASSWORD=${dbPassword}`,
    '-e', `POSTGRES_DB=${dbName}`,
    '-p', '127.0.0.1::5432', 'postgres:17',
  ], { timeout: 60_000 });
  containerStarted = true;
  await waitForPostgres();

  const portOutput = docker(['port', container, '5432/tcp']);
  const port = Number(portOutput.match(/127\.0\.0\.1:(\d+)/)?.[1]);
  if (!Number.isInteger(port) || port <= 0) throw new Error('Could not determine isolated loopback port');

  // Override every database setting before loading application modules. Never use a .env file here.
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.SUPABASE_DB_URL;
  process.env.DOTENV_CONFIG_PATH = path.join(serverDir, 'test', '.nonexistent-env');
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(port);
  process.env.DB_USER = dbUser;
  process.env.DB_PASSWORD = dbPassword;
  process.env.DB_NAME = dbName;
  process.env.NODE_ENV = 'test';
  // Callback regression must never consult a real payment provider.
  for (const key of ['SIPAY_API_URL','SIPAY_APP_ID','SIPAY_APP_SECRET','SIPAY_MERCHANT_KEY']) delete process.env[key];
  process.env.VERCEL = '1'; // Prevent automatic migrations and network listening on module import.
  process.env.JWT_SECRET = 'isolated_fixture_signing_key';

  ({ default: pool } = await import('../src/config/db.js'));
  let databaseReady = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      databaseReady = true;
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  if (!databaseReady) throw new Error('Isolated PostgreSQL did not accept a SQL connection');
  const { runMigrations } = await import('../src/config/migrate.js');
  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  const firstMigration = await applyVersionedSchema();
  const secondMigration = await applyVersionedSchema();
  if (firstMigration.applied.length !== 24 || secondMigration.applied.length !== 0) {
    throw new Error('Versioned schema setup did not apply exactly once');
  }
  const migrationCommand = spawnSync(process.execPath, ['src/config/run-versioned-schema.js'], {
    cwd: serverDir, env: process.env, encoding: 'utf8', timeout: 30_000, windowsHide: true,
  });
  if (migrationCommand.status !== 0 || !migrationCommand.stdout.includes('applied=0 total=24')) {
    throw new Error(`Versioned migration command failed: ${migrationCommand.stderr || migrationCommand.stdout}`);
  }

  const tableResult = await pool.query(`
    SELECT COUNT(*)::int AS count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'
  `);
  const tableCount = tableResult.rows[0].count;
  const postgresVersion = (await pool.query('SHOW server_version')).rows[0].server_version;
  if (tableCount !== 46) throw new Error(`Repository schema bootstrap expected 46 tables, found ${tableCount}`);
  // Rehearse an already-versioned 0001-0004 database with an existing visitor row.
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0025_membership_operation_context'; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check; ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK(status IN('ACTIVE','REQUESTED')); ALTER TABLE users DROP COLUMN group_title; DELETE FROM schema_migrations WHERE version='0015_group_membership_state'");
  await pool.query("ALTER TABLE groups DROP COLUMN meeting_time, DROP COLUMN meeting_link; DELETE FROM schema_migrations WHERE version='0014_group_meeting_settings'");
  await pool.query("DROP TABLE invoice_files; DELETE FROM schema_migrations WHERE version='0013_invoice_files'");
  await pool.query("DROP TABLE document_files,document_library; DELETE FROM schema_migrations WHERE version='0012_document_library'");
  await pool.query("DROP TABLE direct_messages; DELETE FROM schema_migrations WHERE version='0011_direct_messages'");
  await pool.query("DROP TABLE user_score_history; DELETE FROM schema_migrations WHERE version='0010_score_history'");
  await pool.query("DROP TABLE support_mutations; DELETE FROM schema_migrations WHERE version='0009_support_mutations'");
  await pool.query("DELETE FROM schema_migrations WHERE version='0008_payment_initiation'");
  await pool.query('ALTER TABLE payment_transactions DROP CONSTRAINT payment_request_key_unique, DROP CONSTRAINT payment_initiation_metadata_check, DROP COLUMN request_key, DROP COLUMN request_fingerprint, DROP COLUMN initiation_state');
  await pool.query("DELETE FROM schema_migrations WHERE version = '0007_meeting_requests'");
  await pool.query('DROP TABLE one_to_one_requests');
  await pool.query('ALTER TABLE one_to_ones DROP COLUMN updated_at');
  await pool.query("DELETE FROM schema_migrations WHERE version = '0006_registration_consents'");
  await pool.query("DELETE FROM schema_migrations WHERE version = '0005_public_visitor_inviter'");
  await pool.query('ALTER TABLE users DROP COLUMN kvkk_consent, DROP COLUMN marketing_consent, DROP COLUMN explicit_consent, DROP COLUMN consent_date');
  await pool.query('ALTER TABLE public_visitors DROP COLUMN inviter_id');
  const oldVisitorId = randomUUID();
  const oldConsentUserId = randomUUID();
  await pool.query("INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'old-consent-fixture@example.invalid', 'Old Consent Fixture', 'Fixture', 'fixture-only')", [oldConsentUserId]);
  await pool.query("INSERT INTO public_visitors (id, name) VALUES ($1, 'Existing Fixture Visitor')", [oldVisitorId]);
  const visitorUpgrade = await applyVersionedSchema();
  const oldVisitor = await pool.query('SELECT name, inviter_id FROM public_visitors WHERE id = $1', [oldVisitorId]);
  const oldConsent = (await pool.query('SELECT kvkk_consent, marketing_consent, explicit_consent, consent_date FROM users WHERE id = $1', [oldConsentUserId])).rows[0];
  if (visitorUpgrade.applied.length !== 20 || visitorUpgrade.applied[0] !== '0005_public_visitor_inviter'
      || visitorUpgrade.applied[1] !== '0006_registration_consents'
      || visitorUpgrade.applied[2] !== '0007_meeting_requests'
      || visitorUpgrade.applied[3] !== '0008_payment_initiation'
      || visitorUpgrade.applied[4] !== '0009_support_mutations' || visitorUpgrade.applied[5] !== '0010_score_history' || visitorUpgrade.applied[6] !== '0011_direct_messages' || visitorUpgrade.applied[7] !== '0012_document_library' || visitorUpgrade.applied[8] !== '0013_invoice_files' || visitorUpgrade.applied[9] !== '0014_group_meeting_settings' || visitorUpgrade.applied[10] !== '0015_group_membership_state' || visitorUpgrade.applied[11] !== '0016_group_capacity_invariant' || visitorUpgrade.applied[12] !== '0017_subscription_reminder_delivery' || visitorUpgrade.applied[13] !== '0018_web_job_runs' || visitorUpgrade.applied[14] !== '0019_shuffle_execution_history' || visitorUpgrade.applied[15] !== '0020_group_membership_history'
      || oldVisitor.rows[0]?.name !== 'Existing Fixture Visitor' || oldVisitor.rows[0].inviter_id !== null
      || Object.values(oldConsent).some(value => value !== null)) {
    throw new Error('Existing versioned visitor row was not preserved during 0005 upgrade');
  }
  if (process.env.E4N_SOURCE_SCHEMA_OUTPUT) {
    const { rows } = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name <> 'schema_migrations'
      ORDER BY table_name, ordinal_position
    `);
    writeFileSync(process.env.E4N_SOURCE_SCHEMA_OUTPUT, JSON.stringify(rows, null, 2));
  }
  if (process.env.E4N_SOURCE_SCHEMA_OBJECTS_OUTPUT) {
    const { rows } = await pool.query(`
      SELECT 'constraint' AS kind, cls.relname AS table_name, con.conname AS object_name,
             pg_get_constraintdef(con.oid, true) AS definition
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      WHERE ns.nspname = 'public' AND cls.relname <> 'schema_migrations'
      UNION ALL
      SELECT 'index', tablename, indexname, indexdef
      FROM pg_indexes WHERE schemaname = 'public' AND tablename <> 'schema_migrations'
      UNION ALL
      SELECT 'trigger', cls.relname, trig.tgname, pg_get_triggerdef(trig.oid, true)
      FROM pg_trigger trig
      JOIN pg_class cls ON cls.oid = trig.tgrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      WHERE ns.nspname = 'public' AND cls.relname <> 'schema_migrations' AND NOT trig.tgisinternal
      ORDER BY kind, table_name, object_name
    `);
    writeFileSync(process.env.E4N_SOURCE_SCHEMA_OBJECTS_OUTPUT, JSON.stringify(rows, null, 2));
  }
  await pool.query('CREATE DATABASE e4n_legacy_probe');
  const legacyPool = new pg.Pool({
    host: '127.0.0.1', port, user: dbUser, password: dbPassword, database: 'e4n_legacy_probe',
  });
  let legacyAdoption;
  let legacyRepeat;
  let legacyDriftGuard = false;
  let legacyRowsPreserved = false;
  try {
    const initSource = readFileSync(path.join(serverDir, 'init.sql'), 'utf8');
    await legacyPool.query(initSource.split('-- SEED DATA (Örnek Veriler)')[0]);
    const client = await legacyPool.connect();
    try {
      const catalog = await readPublicSchemaCatalog(client);
      if (process.env.E4N_INIT_MANIFEST_OUTPUT) {
        writeFileSync(process.env.E4N_INIT_MANIFEST_OUTPUT, JSON.stringify(catalog, null, 2));
      }
    } finally { client.release(); }
    const legacyUserId = randomUUID();
    await legacyPool.query(
      "INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'legacy-fixture@example.invalid', 'Legacy Fixture', 'Legacy Profession', 'fixture-only')",
      [legacyUserId],
    );
    await legacyPool.query('ALTER TABLE groups ADD COLUMN drift_probe TEXT');
    try { await applyVersionedSchema({ dbPool: legacyPool, adoptLegacyInit: true }); }
    catch (error) { legacyDriftGuard = error.message.includes('does not match the known init.sql baseline'); }
    const ledgerAfterRejectedAdoption = await legacyPool.query("SELECT to_regclass('public.schema_migrations') AS ledger");
    if (!legacyDriftGuard || ledgerAfterRejectedAdoption.rows[0].ledger !== null) {
      throw new Error('Legacy adoption accepted drift or left a partial migration ledger');
    }
    await legacyPool.query('ALTER TABLE groups DROP COLUMN drift_probe');
    legacyAdoption = await applyVersionedSchema({ dbPool: legacyPool, adoptLegacyInit: true });
    legacyRepeat = await applyVersionedSchema({ dbPool: legacyPool });
    const legacyTableCount = await legacyPool.query(`
      SELECT COUNT(*)::int AS count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'
    `);
    const legacyUserCount = await legacyPool.query('SELECT COUNT(*)::int AS count FROM users WHERE id = $1', [legacyUserId]);
    legacyRowsPreserved = legacyUserCount.rows[0].count === 1;
    if (!legacyAdoption.adoptedLegacyInit || legacyAdoption.applied.length !== 23
        || legacyRepeat.applied.length !== 0 || legacyTableCount.rows[0].count !== 46 || !legacyRowsPreserved) {
      throw new Error('Known init.sql database did not upgrade safely');
    }
  } finally { await legacyPool.end(); }
  const recordedVersions = (await pool.query('SELECT version, checksum FROM schema_migrations')).rows;
  let checksumGuard = false;
  await pool.query("UPDATE schema_migrations SET checksum = 'tampered' WHERE version = '0003_legacy_tables'");
  try { await applyVersionedSchema(); }
  catch (error) { checksumGuard = error.message.includes('checksum changed'); }
  finally {
    const original = recordedVersions.find(row => row.version === '0003_legacy_tables');
    await pool.query('UPDATE schema_migrations SET checksum = $1 WHERE version = $2', [original.checksum, original.version]);
  }
  if (!checksumGuard) throw new Error('Versioned schema accepted changed migration source');

  let existingSchemaGuard = false;
  await pool.query('DELETE FROM schema_migrations');
  try { await applyVersionedSchema(); }
  catch (error) { existingSchemaGuard = error.message.includes('reviewed baseline adoption'); }
  finally {
    for (const row of recordedVersions) {
      await pool.query('INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)', [row.version, row.checksum]);
    }
  }
  if (!existingSchemaGuard) throw new Error('Versioned schema accepted an unreviewed existing database');

  const userId = randomUUID();
  const otherUserId = randomUUID();
  const adminUserId = randomUUID();
  const groupId = randomUUID();
  const fixturePasswordHash = await bcrypt.hash('fixture-password', 10);
  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, profession, role)
     VALUES ($1, 'fixture@example.invalid', $2, 'Fixture Member', 'Fixture Profession', 'MEMBER')`,
    [userId, fixturePasswordHash],
  );
  const inviterFk = await pool.query(`
    SELECT COUNT(*)::int AS count FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY(con.conkey)
    WHERE rel.relname = 'public_visitors' AND con.contype = 'f' AND attr.attname = 'inviter_id'
  `);
  if (inviterFk.rows[0].count !== 1) throw new Error('Versioned public visitor inviter FK is missing');
  const invitedVisitor = await pool.query(
    `INSERT INTO public_visitors (name, inviter_id) VALUES ('Invited Fixture', $1)
     RETURNING inviter_id`, [userId],
  );
  if (invitedVisitor.rows[0].inviter_id !== userId) throw new Error('Public visitor inviter was not persisted');
  await pool.query(`INSERT INTO groups (id, name, status) VALUES ($1, 'Fixture Group', 'ACTIVE')`, [groupId]);
  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, profession, role)
     VALUES ($1, 'other-fixture@example.invalid', 'not-a-real-password', 'Other Fixture', 'Other Profession', 'MEMBER')`,
    [otherUserId],
  );
  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, profession, role)
     VALUES ($1, 'admin-fixture@example.invalid', $2, 'Fixture Admin', 'Fixture Profession', 'ADMIN')`,
    [adminUserId, fixturePasswordHash],
  );
  await pool.query(
    `INSERT INTO events (title, start_at, end_at, created_by, group_id, type)
     VALUES ('Future Fixture Event', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', $1, $2, 'meeting')`,
    [userId, groupId],
  );
  await pool.query(
    `INSERT INTO events (title, start_at, end_at, created_by, group_id, type, status)
     VALUES ('Past Fixture Event', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', $1, $2, 'meeting', 'PUBLISHED')`,
    [userId, groupId],
  );
  await pool.query(
    `INSERT INTO events (title, start_at, end_at, created_by, group_id, type, status)
     VALUES ('Draft Fixture Event', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1 hour', $1, $2, 'meeting', 'DRAFT')`,
    [userId, groupId],
  );

  const client = await pool.connect();
  let inactiveSqlState = null;
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, $3)', [userId, groupId, 'ACTIVE']);
    try {
      await client.query("UPDATE group_members SET status = 'INACTIVE' WHERE user_id = $1", [userId]);
    } catch (error) {
      inactiveSqlState = error.code;
    }
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
  const statusResults = { groupInactive: inactiveSqlState };
  const statusClient = await pool.connect();
  try {
    await statusClient.query('BEGIN');
    await statusClient.query('INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, $3)', [userId, groupId, 'ACTIVE']);
    try { await statusClient.query("UPDATE group_members SET status = 'REJECTED' WHERE user_id = $1", [userId]); }
    catch (error) { statusResults.groupRejected = error.code; }
    await statusClient.query('ROLLBACK');

    await statusClient.query('BEGIN');
    const powerTeamId = randomUUID();
    await statusClient.query("INSERT INTO power_teams (id, name, status) VALUES ($1, 'Fixture Power Team', 'ACTIVE')", [powerTeamId]);
    await statusClient.query('INSERT INTO power_team_members (user_id, power_team_id, status) VALUES ($1, $2, $3)', [userId, powerTeamId, 'ACTIVE']);
    try { await statusClient.query("UPDATE power_team_members SET status = 'REJECTED' WHERE user_id = $1", [userId]); }
    catch (error) { statusResults.powerTeamRejected = error.code; }
    await statusClient.query('ROLLBACK');

    await statusClient.query('BEGIN');
    await statusClient.query("INSERT INTO visitors (inviter_id, name, visited_at) VALUES ($1, 'Fixture Visitor', NOW())", [userId]);
    try { await statusClient.query("UPDATE visitors SET status = 'CONVERTED' WHERE inviter_id = $1", [userId]); }
    catch (error) { statusResults.visitorConverted = error.code; }
    await statusClient.query('ROLLBACK');
  } finally {
    statusClient.release();
  }
  if (statusResults.groupInactive !== null || Object.entries(statusResults).some(([key,code])=>key!=='groupInactive'&&code!=='23514')) {
    throw new Error(`Status constraint baseline changed: ${JSON.stringify(statusResults)}`);
  }

  await pool.query(
    "INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, 'ACTIVE')",
    [otherUserId, groupId],
  );
  const futureEventId = (await pool.query("SELECT id FROM events WHERE title = 'Future Fixture Event'")).rows[0].id;
  await pool.query(
    "INSERT INTO attendance (event_id, user_id, status) VALUES ($1, $2, 'PRESENT'), ($1, $3, 'PRESENT')",
    [futureEventId, userId, otherUserId],
  );

  const { default: app } = await import('../src/index.js');
  appServer = app.listen(serveForDevice ? 4000 : 0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fixture@example.invalid', password: 'fixture-password' }),
    signal: AbortSignal.timeout(10_000),
  });
  const loginBody = await login.json();
  if (login.status !== 200 || !loginBody.token) throw new Error(`Fixture login failed: ${login.status}`);
  const authHeaders = { Authorization: `Bearer ${loginBody.token}` };
  const inviteSnapshot = (await pool.query('SELECT id, name, email FROM users ORDER BY id')).rows;
  const invitePayload = { type: 'visitor_invite', email: 'invite@example.invalid', inviter_id: userId };
  const signInvite = (payload, options = {}) => jwt.sign(payload, process.env.JWT_SECRET, options);
  const probeInvite = async token => {
    const response = await fetch(`${base}/api/visitor-invite/verify${token === undefined ? '' : `?token=${encodeURIComponent(token)}`}`, { signal: AbortSignal.timeout(10_000) });
    return { status: response.status, body: await response.json() };
  };
  const inviteValid = await probeInvite(signInvite(invitePayload));
  const inviteInvalid = [];
  for (const token of [undefined, 'invalid.fixture', signInvite(invitePayload, { expiresIn: -1 }),
    signInvite({ ...invitePayload, type: 'membership' }), signInvite({ ...invitePayload, inviter_id: 'invalid-id' }),
    signInvite({ ...invitePayload, email: null })]) {
    inviteInvalid.push(await probeInvite(token));
  }
  const originalInviteQuery = pool.query;
  let inviteDatabaseFailure;
  try {
    pool.query = function (sql, ...args) {
      if (sql === 'SELECT name FROM users WHERE id = $1') return Promise.reject(new Error('Fixture invite lookup unavailable'));
      return originalInviteQuery.call(this, sql, ...args);
    };
    inviteDatabaseFailure = await probeInvite(signInvite(invitePayload));
  } finally { pool.query = originalInviteQuery; }
  const inviteRecovery = await probeInvite(signInvite(invitePayload));
  const inviteSnapshotAfter = (await pool.query('SELECT id, name, email FROM users ORDER BY id')).rows;
  if (inviteValid.status !== 200 || inviteValid.body.valid !== true || inviteValid.body.email !== invitePayload.email
      || inviteValid.body.inviter_id !== userId || inviteInvalid.some(result => result.status !== 400 || result.body.valid !== false || result.body.code !== 'INVALID_INVITE' || Object.hasOwn(result.body, 'email'))
      || inviteDatabaseFailure.status !== 500 || inviteDatabaseFailure.body.code !== 'INVITE_CHECK_FAILED' || Object.hasOwn(inviteDatabaseFailure.body, 'valid')
      || Object.hasOwn(inviteDatabaseFailure.body, 'message') || inviteRecovery.status !== 200
      || JSON.stringify(inviteSnapshot) !== JSON.stringify(inviteSnapshotAfter)) {
    throw new Error('Invite validation must distinguish invalid credentials from failed database lookup without writes');
  }
  const inviteVerification = { valid: inviteValid.status, invalid: inviteInvalid.map(result => result.status), databaseFailure: inviteDatabaseFailure.status, recovery: inviteRecovery.status, usersUnchanged: true };
  const adminLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin-fixture@example.invalid', password: 'fixture-password' }),
    signal: AbortSignal.timeout(10_000),
  });
  const adminLoginBody = await adminLogin.json();
  if (adminLogin.status !== 200 || !adminLoginBody.token) throw new Error(`Fixture admin login failed: ${adminLogin.status}`);
  const adminMembersAsMember = await fetch(`${base}/api/admin/members`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const adminMembers = await fetch(`${base}/api/admin/members`, {
    headers: { Authorization: `Bearer ${adminLoginBody.token}` }, signal: AbortSignal.timeout(10_000),
  });
  const adminMemberRows = await adminMembers.json();
  if (adminMembersAsMember.status !== 403 || adminMembers.status !== 200 || !Array.isArray(adminMemberRows)) {
    throw new Error(`Admin member route baseline changed: MEMBER ${adminMembersAsMember.status}, ADMIN ${adminMembers.status}`);
  }
  const userGroupsWithoutId = await fetch(`${base}/api/user/groups`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const userGroupsWithoutIdBody = await userGroupsWithoutId.json();
  const userGroupsOtherId = await fetch(`${base}/api/user/groups?userId=${otherUserId}`, {
    headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const userGroupsOtherIdBody = await userGroupsOtherId.json();
  const adminStatsAsMember = await fetch(`${base}/api/admin/stats/dashboard`, {
    headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const adminStats = await fetch(`${base}/api/admin/stats/dashboard`, {
    headers: { Authorization: `Bearer ${adminLoginBody.token}` }, signal: AbortSignal.timeout(10_000),
  });
  if (adminStatsAsMember.status !== 403 || adminStats.status !== 200) {
    throw new Error(`Admin stats route baseline changed: MEMBER ${adminStatsAsMember.status}, ADMIN ${adminStats.status}`);
  }
  const adminHeaders = { Authorization: `Bearer ${adminLoginBody.token}` };
  const jsonAdminHeaders = { ...adminHeaders, 'Content-Type': 'application/json' };
  // Map the existing read contract before adding a mobile admin detail route.
  const auditGroupId = randomUUID(), auditTeamId = randomUUID(), auditPresidentId = randomUUID();
  await pool.query("INSERT INTO users (id, email, name, profession, role) VALUES ($1, 'group-audit@example.invalid', 'Group Audit President', 'Audit Profession', 'PRESIDENT')", [auditPresidentId]);
  await pool.query("INSERT INTO groups (id, name, status) VALUES ($1, 'Audit Group', 'ACTIVE')", [auditGroupId]);
  await pool.query("INSERT INTO power_teams (id, name, status) VALUES ($1, 'Audit Team', 'ACTIVE')", [auditTeamId]);
  for (const [fixtureId, status] of [[userId, 'ACTIVE'], [auditPresidentId, 'REQUESTED']]) {
    await pool.query('INSERT INTO group_members (group_id, user_id, status) VALUES ($1, $2, $3)', [auditGroupId, fixtureId, status]);
    await pool.query('INSERT INTO power_team_members (power_team_id, user_id, status, role) VALUES ($1, $2, $3, $4)', [auditTeamId, fixtureId, status, 'MEMBER']);
  }
  const auditSnapshot = async () => ({
    groups: (await pool.query('SELECT * FROM groups WHERE id = $1', [auditGroupId])).rows,
    teams: (await pool.query('SELECT * FROM power_teams WHERE id = $1', [auditTeamId])).rows,
    groupMembers: (await pool.query('SELECT * FROM group_members WHERE group_id = $1 ORDER BY user_id', [auditGroupId])).rows,
    teamMembers: (await pool.query('SELECT * FROM power_team_members WHERE power_team_id = $1 ORDER BY user_id', [auditTeamId])).rows,
  });
  const auditBefore = await auditSnapshot();
  const presidentHeaders = { Authorization: `Bearer ${jwt.sign({ id: auditPresidentId, role: 'PRESIDENT' }, process.env.JWT_SECRET)}` };
  const readContract = [];
  for (const [role, headers] of [['ADMIN', adminHeaders], ['MEMBER', authHeaders], ['PRESIDENT', presidentHeaders], ['ANON', {}], ['INVALID', { Authorization: 'Bearer invalid.fixture' }]]) {
    const statuses = [], bodies = [];
    for (const route of [`/groups/${auditGroupId}`, `/groups/${auditGroupId}/members`, '/power-teams', `/power-teams/${auditTeamId}/members`]) {
      const result = await fetch(`${base}/api${route}`, { headers, signal: AbortSignal.timeout(10_000) });
      statuses.push(result.status); bodies.push(result.ok ? await result.json() : null);
    }
    const expected = role === 'ANON' ? 401 : role === 'INVALID' ? 403 : 200;
    if (statuses.some(status => status !== expected)) throw new Error(`Group read role baseline changed: ${role}/${statuses}`);
    if (expected === 200 && (bodies[0].id !== auditGroupId || bodies[0].member_count !== 2 || !Array.isArray(bodies[0].meeting_dates)
        || bodies[1].length !== 2 || bodies[3].length !== 2 || !bodies[2].some(team => team.id === auditTeamId)
        || bodies[1].some(member => !Object.hasOwn(member, 'full_name') || !Object.hasOwn(member, 'email') || Object.hasOwn(member, 'password_hash'))
        || !bodies[1].some(member => member.status === 'REQUESTED') || !bodies[3].every(member => member.group_title === 'MEMBER'))) {
      throw new Error('Group/team read shape changed');
    }
    readContract.push({ role, statuses, includesEmail: expected === 200, groupCountIncludesRequested: expected === 200 });
  }
  const missingGroup = await fetch(`${base}/api/groups/${randomUUID()}`, { headers: adminHeaders });
  const missingMembers = await fetch(`${base}/api/groups/${randomUUID()}/members`, { headers: adminHeaders });
  const missingTeamDetail = await fetch(`${base}/api/power-teams/${auditTeamId}`, { headers: adminHeaders });
  if (missingGroup.status !== 404 || missingMembers.status !== 200 || (await missingMembers.json()).length !== 0 || missingTeamDetail.status !== 404
      || JSON.stringify(auditBefore) !== JSON.stringify(await auditSnapshot())) throw new Error('Read-only group missing-route or persistence baseline changed');
  const groupDetailReadContract = { roles: readContract, missingGroup: 404, missingGroupMembers: '200/[]', singleTeamRoute: 404, fixturesUnchanged: true };
  await pool.query('DELETE FROM group_members WHERE group_id = $1', [auditGroupId]);
  await pool.query('DELETE FROM power_team_members WHERE power_team_id = $1', [auditTeamId]);
  await pool.query('DELETE FROM groups WHERE id = $1', [auditGroupId]);
  await pool.query('DELETE FROM power_teams WHERE id = $1', [auditTeamId]);
  await pool.query('DELETE FROM users WHERE id = $1', [auditPresidentId]);
  const rejectedGroup = await fetch(`${base}/api/groups/${groupId}/members/${otherUserId}`, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ status: 'REJECTED' }), signal: AbortSignal.timeout(10_000),
  });
  const groupStatusAfterReject = (await pool.query('SELECT status FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, otherUserId])).rows[0]?.status;
  const powerTeamId = randomUUID();
  await pool.query("INSERT INTO power_teams (id, name, status) VALUES ($1, 'HTTP Fixture Power Team', 'ACTIVE')", [powerTeamId]);
  await pool.query("INSERT INTO power_team_members (user_id, power_team_id, status) VALUES ($1, $2, 'REQUESTED')", [otherUserId, powerTeamId]);
  const rejectedPowerTeam = await fetch(`${base}/api/power-teams/${powerTeamId}/members/${otherUserId}`, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ status: 'REJECTED' }), signal: AbortSignal.timeout(10_000),
  });
  const powerTeamStatusAfterReject = (await pool.query('SELECT status FROM power_team_members WHERE power_team_id = $1 AND user_id = $2', [powerTeamId, otherUserId])).rows[0]?.status;
  const targetGroupId = randomUUID();
  await pool.query("INSERT INTO groups (id, name, status) VALUES ($1, 'Move Target Fixture', 'ACTIVE')", [targetGroupId]);
  const movedMember = await fetch(`${base}/api/admin/move-member`, {
    method: 'POST', headers: jsonAdminHeaders, body: JSON.stringify({ userId: otherUserId, groupId: targetGroupId }), signal: AbortSignal.timeout(10_000),
  });
  const moveStatuses = (await pool.query('SELECT group_id, status FROM group_members WHERE user_id = $1', [otherUserId])).rows;
  const conversionVisitorId = randomUUID();
  const conversionEmail = 'status-convert-fixture@example.invalid';
  await pool.query("INSERT INTO visitors (id, inviter_id, name, email, visited_at, status) VALUES ($1, $2, 'Convert Fixture', $3, NOW(), 'ATTENDED')", [conversionVisitorId, userId, conversionEmail]);
  const convertAsMember = await fetch(`${base}/api/visitors/${conversionVisitorId}/convert`, {
    method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const convertedVisitor = await fetch(`${base}/api/visitors/${conversionVisitorId}/convert`, {
    method: 'POST', headers: adminHeaders, signal: AbortSignal.timeout(10_000),
  });
  const conversionStatusAfter = (await pool.query('SELECT status FROM visitors WHERE id = $1', [conversionVisitorId])).rows[0]?.status;
  const conversionUserCount = (await pool.query('SELECT COUNT(*)::int AS count FROM users WHERE email = $1', [conversionEmail])).rows[0].count;
  const statusHttpBaseline = { groupReject: rejectedGroup.status, groupStatusAfterReject,
    powerTeamReject: rejectedPowerTeam.status, powerTeamStatusAfterReject,
    moveMember: movedMember.status, sourceStatusAfterMove: moveStatuses.find(row => row.group_id === groupId)?.status,
    targetRowsAfterMove: moveStatuses.filter(row => row.group_id === targetGroupId).length,
    visitorConvertAsMember: convertAsMember.status, visitorConvertAsAdmin: convertedVisitor.status,
    visitorStatusAfterConvert: conversionStatusAfter, conversionUsersAdded: conversionUserCount };
  if (statusHttpBaseline.groupReject !== 400 || statusHttpBaseline.groupStatusAfterReject !== 'ACTIVE'
      || statusHttpBaseline.powerTeamReject !== 400 || statusHttpBaseline.powerTeamStatusAfterReject !== 'REQUESTED'
      || statusHttpBaseline.moveMember !== 200 || statusHttpBaseline.sourceStatusAfterMove !== 'INACTIVE'
      || statusHttpBaseline.targetRowsAfterMove !== 1 || statusHttpBaseline.visitorConvertAsMember !== 403
      || statusHttpBaseline.visitorConvertAsAdmin !== 500 || statusHttpBaseline.visitorStatusAfterConvert !== 'ATTENDED'
      || statusHttpBaseline.conversionUsersAdded !== 0) {
    throw new Error(`Status HTTP baseline changed: ${JSON.stringify(statusHttpBaseline)}`);
  }
  const noSubscription = (await pool.query('SELECT account_status, subscription_plan, subscription_end_date, company FROM users WHERE id = $1', [userId])).rows[0];
  const activeGroupJoin = await fetch(`${base}/api/groups/${groupId}/join`, {
    method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const activePowerTeamJoin = await fetch(`${base}/api/power-teams/${powerTeamId}/join`, {
    method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const activeJoinStatuses = (await pool.query(
    'SELECT status FROM group_members WHERE user_id = $1 AND group_id = $2', [userId, groupId],
  )).rows.map(row => row.status);
  await pool.query("UPDATE users SET account_status = 'PENDING' WHERE id = $1", [userId]);
  const pendingGroupJoin = await fetch(`${base}/api/groups/${groupId}/join`, {
    method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const pendingPowerTeamJoin = await fetch(`${base}/api/power-teams/${powerTeamId}/join`, {
    method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  await pool.query("UPDATE users SET account_status = 'ACTIVE' WHERE id = $1", [userId]);
  const membershipGateBaseline = { accountStatus: noSubscription.account_status,
    hasPlan: noSubscription.subscription_plan !== null, hasEndDate: noSubscription.subscription_end_date !== null,
    companyMissing: noSubscription.company === null || noSubscription.company === '',
    activeGroupJoin: activeGroupJoin.status, activePowerTeamJoin: activePowerTeamJoin.status,
    groupRequestStatuses: activeJoinStatuses, pendingGroupJoin: pendingGroupJoin.status,
    pendingPowerTeamJoin: pendingPowerTeamJoin.status };
  if (membershipGateBaseline.accountStatus !== 'ACTIVE' || membershipGateBaseline.hasPlan || membershipGateBaseline.hasEndDate
      || !membershipGateBaseline.companyMissing
      || membershipGateBaseline.activeGroupJoin !== 200 || membershipGateBaseline.activePowerTeamJoin !== 200
      || membershipGateBaseline.groupRequestStatuses.join(',') !== 'REQUESTED'
      || membershipGateBaseline.pendingGroupJoin !== 403 || membershipGateBaseline.pendingPowerTeamJoin !== 403) {
    throw new Error(`Membership gate baseline changed: ${JSON.stringify(membershipGateBaseline)}`);
  }
  const approvePowerTeamJoin = await fetch(`${base}/api/power-teams/${powerTeamId}/members/${userId}`, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ status: 'ACTIVE' }), signal: AbortSignal.timeout(10_000),
  });
  const approvedPowerTeamMembership = (await pool.query(
    'SELECT status, role FROM power_team_members WHERE power_team_id = $1 AND user_id = $2', [powerTeamId, userId],
  )).rows;
  const openPowerTeamBaseline = { join: activePowerTeamJoin.status, approved: approvePowerTeamJoin.status,
    membershipRows: approvedPowerTeamMembership.length, status: approvedPowerTeamMembership[0]?.status,
    role: approvedPowerTeamMembership[0]?.role };
  if (openPowerTeamBaseline.approved !== 200 || openPowerTeamBaseline.membershipRows !== 1
      || openPowerTeamBaseline.status !== 'ACTIVE' || openPowerTeamBaseline.role !== 'MEMBER') {
    throw new Error(`Open power team baseline changed: ${JSON.stringify(openPowerTeamBaseline)}`);
  }
  const paymentOid = `fixture-${randomUUID()}`;
  await pool.query(
    "INSERT INTO payment_transactions (merchant_oid, user_id, plan_id, amount, status, action_type, action_data) VALUES ($1, NULL, '1_MONTH', 100, 'PENDING', 'membership', $2)",
    [paymentOid, JSON.stringify({ user_id: userId, plan: '1_MONTH', amount: 100 })],
  );
  const callbackUrl = `${base}/api/payment/sipay-callback`;
  const callbackHeaders = { 'Content-Type': 'application/json' };
  const firstPaymentSuccess = await fetch(`${callbackUrl}/success`, {
    method: 'POST', headers: callbackHeaders, body: JSON.stringify({ invoice_id: paymentOid }), signal: AbortSignal.timeout(10_000),
  });
  const paymentAfterFirst = (await pool.query('SELECT status, user_id FROM payment_transactions WHERE merchant_oid = $1', [paymentOid])).rows[0];
  const userAfterFirst = (await pool.query('SELECT account_status, subscription_plan, subscription_end_date FROM users WHERE id = $1', [userId])).rows[0];
  const repeatedPaymentSuccess = await fetch(`${callbackUrl}/success`, {
    method: 'POST', headers: callbackHeaders, body: JSON.stringify({ invoice_id: paymentOid }), signal: AbortSignal.timeout(10_000),
  });
  const userAfterRepeat = (await pool.query('SELECT subscription_end_date FROM users WHERE id = $1', [userId])).rows[0];
  const latePaymentFailure = await fetch(`${callbackUrl}/fail`, {
    method: 'POST', headers: callbackHeaders, body: JSON.stringify({ invoice_id: paymentOid, status_description: 'Fixture late failure' }), signal: AbortSignal.timeout(10_000),
  });
  const paymentAfterLateFail = (await pool.query('SELECT status, user_id FROM payment_transactions WHERE merchant_oid = $1', [paymentOid])).rows[0];
  const userAfterLateFail = (await pool.query('SELECT account_status, subscription_end_date FROM users WHERE id = $1', [userId])).rows[0];
  const paymentCallbackBaseline = { firstSuccess: firstPaymentSuccess.status, repeatedSuccess: repeatedPaymentSuccess.status,
    lateFail: latePaymentFailure.status, transactionUserMissing: paymentAfterFirst.user_id === null,
    transactionAfterFirst: paymentAfterFirst.status, membershipPlanAfterFirst: userAfterFirst.subscription_plan,
    membershipEndWritten: Boolean(userAfterFirst.subscription_end_date),
    repeatChangedEnd: userAfterRepeat.subscription_end_date?.getTime() !== userAfterFirst.subscription_end_date?.getTime(),
    transactionAfterLateFail: paymentAfterLateFail.status, userAfterLateFail: userAfterLateFail.account_status,
    membershipEndAfterLateFail: Boolean(userAfterLateFail.subscription_end_date) };
  if (paymentCallbackBaseline.firstSuccess !== 503 || paymentCallbackBaseline.repeatedSuccess !== 503
      || paymentCallbackBaseline.lateFail !== 503 || !paymentCallbackBaseline.transactionUserMissing
      || paymentCallbackBaseline.transactionAfterFirst !== 'PENDING'
      || paymentCallbackBaseline.membershipEndWritten || paymentCallbackBaseline.repeatChangedEnd
      || paymentCallbackBaseline.transactionAfterLateFail !== 'PENDING' || paymentCallbackBaseline.userAfterLateFail !== 'ACTIVE'
      || paymentCallbackBaseline.membershipEndAfterLateFail) {
    throw new Error(`Unverified payment callback changed state: ${JSON.stringify(paymentCallbackBaseline)}`);
  }
  const noInviteRegistration = await fetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'No Invite Fixture', email: 'no-invite@example.invalid', password: 'fixture-password', profession: 'Fixture', role: 'MEMBER' }),
    signal: AbortSignal.timeout(10_000),
  });
  const noInviteUserCount = (await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE email = 'no-invite@example.invalid'")).rows[0].count;
  if (noInviteRegistration.status !== 403 || noInviteUserCount !== 0) {
    throw new Error('Active registration invite gate baseline changed');
  }
  const noCompanyCommunityRegistration = await fetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'No Company Community Fixture', email: 'no-company-community@example.invalid',
      password: 'fixture-password', profession: 'Fixture', role: 'COMMUNITY_MEMBER' }),
    signal: AbortSignal.timeout(10_000),
  });
  const noCompanyCommunityBody = await noCompanyCommunityRegistration.json();
  const communityWithoutCompany = (await pool.query(
    "SELECT account_status, role, company, kvkk_consent, marketing_consent, explicit_consent, consent_date FROM users WHERE email = 'no-company-community@example.invalid'",
  )).rows;
  if (noCompanyCommunityRegistration.status !== 201 || communityWithoutCompany.length !== 1
      || communityWithoutCompany[0].account_status !== 'ACTIVE' || communityWithoutCompany[0].role !== 'COMMUNITY_MEMBER'
      || communityWithoutCompany[0].company !== '' || communityWithoutCompany[0].kvkk_consent !== false
      || communityWithoutCompany[0].marketing_consent !== false || communityWithoutCompany[0].explicit_consent !== false
      || !communityWithoutCompany[0].consent_date) {
    throw new Error(`No-company community registration baseline changed: ${JSON.stringify({ status: noCompanyCommunityRegistration.status, body: noCompanyCommunityBody, rows: communityWithoutCompany })}`);
  }
  const pendingApplicantId = randomUUID();
  const approvalProfessionId = randomUUID();
  const deleteProfessionId = randomUUID();
  await pool.query("INSERT INTO professions (id, name, category, status) VALUES ($1, 'Delete Profession Fixture', 'Fixture', 'APPROVED')", [deleteProfessionId]);
  const deleteProfessionUrl = `${base}/api/professions/${deleteProfessionId}`;
  const publicProfessionDelete = await fetch(deleteProfessionUrl, { method: 'DELETE' });
  const memberProfessionDelete = await fetch(deleteProfessionUrl, { method: 'DELETE', headers: authHeaders });
  const deniedProfessionDeleteCount = (await pool.query('SELECT COUNT(*)::int AS count FROM professions WHERE id = $1', [deleteProfessionId])).rows[0].count;
  const adminProfessionDelete = await fetch(deleteProfessionUrl, { method: 'DELETE', headers: adminHeaders });
  const deletedProfessionCount = (await pool.query('SELECT COUNT(*)::int AS count FROM professions WHERE id = $1', [deleteProfessionId])).rows[0].count;
  const repeatedProfessionDelete = await fetch(deleteProfessionUrl, { method: 'DELETE', headers: adminHeaders });
  const missingProfessionDelete = await fetch(`${base}/api/professions/${randomUUID()}`, { method: 'DELETE', headers: adminHeaders });
  if (publicProfessionDelete.status !== 401 || memberProfessionDelete.status !== 403 || deniedProfessionDeleteCount !== 1
      || adminProfessionDelete.status !== 204 || deletedProfessionCount !== 0
      || repeatedProfessionDelete.status !== 404 || missingProfessionDelete.status !== 404) {
    throw new Error('Profession delete role boundary or missing record response changed');
  }
  const createProfessionPayload = { name: 'Created Profession Fixture', category: 'Fixture', status: 'APPROVED' };
  const createProfession = (headers, payload = createProfessionPayload) => fetch(`${base}/api/professions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload),
  });
  const publicProfessionCreate = await createProfession({});
  const memberProfessionCreate = await createProfession(authHeaders);
  const deniedProfessionCreateCount = (await pool.query("SELECT COUNT(*)::int AS count FROM professions WHERE name = $1", [createProfessionPayload.name])).rows[0].count;
  const adminProfessionCreate = await createProfession(adminHeaders);
  const createdProfession = await adminProfessionCreate.json();
  const createdProfessionDbStatus = (await pool.query('SELECT status FROM professions WHERE id = $1', [createdProfession.id])).rows[0]?.status;
  const defaultProfessionCreate = await createProfession(adminHeaders, { name: 'Default Profession Fixture', category: 'Fixture' });
  const defaultProfession = await defaultProfessionCreate.json();
  const invalidProfessionCreate = await createProfession(adminHeaders, { name: 'Invalid Profession Fixture', status: 42 });
  const invalidProfessionCreateCount = (await pool.query("SELECT COUNT(*)::int AS count FROM professions WHERE name = 'Invalid Profession Fixture'")).rows[0].count;
  if (publicProfessionCreate.status !== 401 || memberProfessionCreate.status !== 403 || deniedProfessionCreateCount !== 0
      || adminProfessionCreate.status !== 201 || createdProfession.status !== 'APPROVED' || createdProfessionDbStatus !== 'APPROVED'
      || defaultProfessionCreate.status !== 201 || defaultProfession.status !== 'ACTIVE'
      || invalidProfessionCreate.status !== 400 || invalidProfessionCreateCount !== 0) {
    throw new Error('Profession create status persistence or role boundary changed');
  }
  await pool.query('DELETE FROM professions WHERE id = ANY($1::uuid[])', [[createdProfession.id, defaultProfession.id]]);
  await pool.query("INSERT INTO professions (id, name, category, status, created_at) VALUES ($1, 'Approval Profession Fixture', 'Fixture', 'PENDING', '2026-02-03T10:00:00Z')", [approvalProfessionId]);
  const professionApprovalPayload = { name: 'Approval Profession Fixture', category: 'Fixture', status: 'APPROVED' };
  const professionListFixtures = await pool.query(`
    INSERT INTO professions (name, category, status)
    SELECT 'AAA Profession Fixture ' || LPAD(n::text, 2, '0'), 'Fixture', 'APPROVED'
    FROM generate_series(1, 51) AS n RETURNING id
  `);
  const professionDbCount = (await pool.query('SELECT COUNT(*)::int AS count FROM professions')).rows[0].count;
  const adminProfessionList = await fetch(`${base}/api/professions`, { headers: adminHeaders });
  const adminProfessionRows = await adminProfessionList.json();
  const publicProfessionList = await fetch(`${base}/api/professions`);
  const publicProfessionRows = await publicProfessionList.json();
  const memberProfessionList = await fetch(`${base}/api/professions`, { headers: authHeaders });
  const memberProfessionRows = await memberProfessionList.json();
  const searchedProfessionList = await fetch(`${base}/api/professions?q=Approval%20Profession%20Fixture`, { headers: adminHeaders });
  const searchedProfessionRows = await searchedProfessionList.json();
  const invalidProfessionToken = await fetch(`${base}/api/professions`, { headers: { Authorization: 'Bearer invalid' } });
  if (adminProfessionList.status !== 200 || adminProfessionRows.length !== professionDbCount
      || !adminProfessionRows.some(row => row.id === approvalProfessionId && row.status === 'PENDING' && row.created_at === '2026-02-03T10:00:00.000Z')
      || publicProfessionList.status !== 200 || publicProfessionRows.length !== 50 || publicProfessionRows.some(row => Object.hasOwn(row, 'status'))
      || memberProfessionList.status !== 200 || memberProfessionRows.length !== 50 || memberProfessionRows.some(row => Object.hasOwn(row, 'status'))
      || searchedProfessionList.status !== 200 || searchedProfessionRows.length !== 1 || searchedProfessionRows[0].id !== approvalProfessionId
      || publicProfessionRows.some(row => Object.hasOwn(row, 'created_at'))
      || memberProfessionRows.some(row => Object.hasOwn(row, 'created_at'))
      || invalidProfessionToken.status !== 403) {
    throw new Error('Profession admin list completeness or status boundary changed');
  }
  await pool.query('DELETE FROM professions WHERE id = ANY($1::uuid[])', [professionListFixtures.rows.map(row => row.id)]);
  const professionApprovalUrl = `${base}/api/professions/${approvalProfessionId}`;
  const publicProfessionApproval = await fetch(professionApprovalUrl, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(professionApprovalPayload),
  });
  const memberProfessionApproval = await fetch(professionApprovalUrl, {
    method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(professionApprovalPayload),
  });
  const professionAfterDenied = (await pool.query('SELECT status FROM professions WHERE id = $1', [approvalProfessionId])).rows[0].status;
  const adminProfessionApproval = await fetch(professionApprovalUrl, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify(professionApprovalPayload),
  });
  const approvedProfession = await adminProfessionApproval.json();
  const adminProfessionEdit = await fetch(professionApprovalUrl, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ name: 'Approval Profession Fixture', category: 'Updated Fixture' }),
  });
  const editedProfession = await adminProfessionEdit.json();
  const invalidProfessionStatus = await fetch(professionApprovalUrl, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ ...professionApprovalPayload, status: 42 }),
  });
  const missingProfessionEdit = await fetch(`${base}/api/professions/${randomUUID()}`, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify(professionApprovalPayload),
  });
  const professionAfterApproval = (await pool.query('SELECT status FROM professions WHERE id = $1', [approvalProfessionId])).rows[0].status;
  if (publicProfessionApproval.status !== 401 || memberProfessionApproval.status !== 403 || professionAfterDenied !== 'PENDING'
      || adminProfessionApproval.status !== 200 || approvedProfession.status !== 'APPROVED'
      || adminProfessionEdit.status !== 200 || editedProfession.status !== 'APPROVED' || editedProfession.category !== 'Updated Fixture'
      || invalidProfessionStatus.status !== 400 || missingProfessionEdit.status !== 404 || professionAfterApproval !== 'APPROVED') {
    throw new Error('Profession approval persistence or role boundary changed');
  }
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash, account_status) VALUES ($1, 'pending-applicant@example.invalid', 'Pending Applicant', 'Fixture', 'not-a-real-password', 'PENDING')",
    [pendingApplicantId],
  );
  const pendingApplicantDbCount = (await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE id = $1 AND account_status = 'PENDING'", [pendingApplicantId])).rows[0].count;
  const directoryFixtures = await pool.query(`
    INSERT INTO users (id, email, name, profession, account_status)
    SELECT gen_random_uuid(), 'directory-' || n || '@example.invalid',
      'AAA Directory Fixture ' || LPAD(n::text, 2, '0'), 'Directory Fixture', 'ACTIVE'
    FROM generate_series(1, 51) AS n RETURNING id
  `);
  const adminDirectoryDbCount = (await pool.query('SELECT COUNT(*)::int AS count FROM users')).rows[0].count;
  const mobileAdminUserList = await fetch(`${base}/api/users`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const mobileAdminUserRows = await mobileAdminUserList.json();
  const mobileAdminPendingRows = mobileAdminUserRows.filter(row => row.status === 'PENDING' || row.account_status === 'PENDING');
  const pendingApplicantResponse = mobileAdminUserRows.find(row => row.id === pendingApplicantId);
  const mobileVisitorApplicantId = randomUUID();
  await pool.query("INSERT INTO public_visitors (id, name, email) VALUES ($1, 'Mobile Applicant Fixture', 'mobile-applicant@example.invalid')", [mobileVisitorApplicantId]);
  const mobileVisitorApplications = await fetch(`${base}/api/public-visitors`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const adminVisitorApplications = await fetch(`${base}/api/admin/public-visitors`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const mobileVisitorApplicationRows = await mobileVisitorApplications.json();
  const adminVisitorApplicationRows = await adminVisitorApplications.json();
  const memberApplicantList = await fetch(`${base}/api/users`, { headers: authHeaders });
  const memberApplicantRows = await memberApplicantList.json();
  const filteredAdminDirectory = await fetch(`${base}/api/users?name=AAA%20Directory%20Fixture`, { headers: adminHeaders });
  const filteredAdminDirectoryRows = await filteredAdminDirectory.json();
  const memberVisitorApplications = await fetch(`${base}/api/public-visitors`, { headers: authHeaders });
  const unauthenticatedVisitorApplications = await fetch(`${base}/api/public-visitors`);
  if (pendingApplicantDbCount !== 1 || mobileAdminUserList.status !== 200 || !pendingApplicantResponse
      || pendingApplicantResponse.account_status !== 'PENDING'
      || !mobileAdminPendingRows.some(row => row.id === pendingApplicantId)
      || mobileAdminUserRows.length !== adminDirectoryDbCount
      || filteredAdminDirectory.status !== 200 || filteredAdminDirectoryRows.length !== 51
      || mobileVisitorApplications.status !== 200 || adminVisitorApplications.status !== 200
      || JSON.stringify(mobileVisitorApplicationRows) !== JSON.stringify(adminVisitorApplicationRows)
      || !mobileVisitorApplicationRows.some(row => row.id === mobileVisitorApplicantId)
      || memberApplicantList.status !== 200 || memberApplicantRows.some(row => Object.hasOwn(row, 'account_status'))
      || memberApplicantRows.length !== 50
      || memberVisitorApplications.status !== 403 || unauthenticatedVisitorApplications.status !== 401) {
    throw new Error('Mobile admin applications field contract baseline changed');
  }
  await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [directoryFixtures.rows.map(row => row.id)]);
  const referralCountBefore = (await pool.query('SELECT COUNT(*)::int AS count FROM referrals')).rows[0].count;
  const mobileReferral = await fetch(`${base}/api/referrals`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: otherUserId, giverId: adminUserId, giver_id: adminUserId,
      type: 'INTERNAL', temperature: 'HOT', description: 'Mobile payload fixture' }),
    signal: AbortSignal.timeout(10_000),
  });
  const mobileReferralBody = await mobileReferral.json();
  const referralCountAfterMobile = (await pool.query('SELECT COUNT(*)::int AS count FROM referrals')).rows[0].count;
  const webReferral = await fetch(`${base}/api/referrals`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiverId: otherUserId, type: 'INTERNAL', temperature: 'HOT', description: 'Web payload fixture', amount: 0 }),
    signal: AbortSignal.timeout(10_000),
  });
  const webReferralBody = await webReferral.json();
  const referralCountAfterWeb = (await pool.query('SELECT COUNT(*)::int AS count FROM referrals')).rows[0].count;
  const referralList = await fetch(`${base}/api/referrals`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const referralRows = await referralList.json();
  if (mobileReferral.status !== 201 || referralCountAfterMobile !== referralCountBefore + 1
      || mobileReferralBody.receiver_id !== otherUserId || mobileReferralBody.giver_id !== userId
      || webReferral.status !== 201 || webReferralBody.receiver_id !== otherUserId
      || referralCountAfterWeb !== referralCountBefore + 2 || referralList.status !== 200
      || !referralRows.some(row => row.id === webReferralBody.id)
      || !referralRows.some(row => row.id === mobileReferralBody.id)) {
    throw new Error('Web/mobile referral payload and persistence baseline changed');
  }
  for (const payload of [{}, { receiverId: 'not-a-uuid' }, { receiver_id: '' },
    { receiverId: otherUserId, receiver_id: adminUserId }]) {
    const invalidReferral = await fetch(`${base}/api/referrals`, {
      method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(10_000),
    });
    if (invalidReferral.status !== 400) throw new Error('Invalid referral recipient must return 400');
  }
  const unauthenticatedReferral = await fetch(`${base}/api/referrals`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: otherUserId }), signal: AbortSignal.timeout(10_000),
  });
  const unrelatedReferralList = await fetch(`${base}/api/referrals?userId=${userId}`, {
    headers: adminHeaders, signal: AbortSignal.timeout(10_000),
  });
  const unrelatedReferralRows = await unrelatedReferralList.json();
  const referralCountAfterInvalid = (await pool.query('SELECT COUNT(*)::int AS count FROM referrals')).rows[0].count;
  if (unauthenticatedReferral.status !== 401 || unrelatedReferralList.status !== 200
      || unrelatedReferralRows.some(row => [webReferralBody.id, mobileReferralBody.id].includes(row.id))
      || referralCountAfterInvalid !== referralCountAfterWeb) {
    throw new Error('Referral sender/list scope or invalid-write boundary changed');
  }
  const memberChampionTrigger = await fetch(`${base}/api/admin/trigger-champions`, {
    method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const adminChampionTrigger = await fetch(`${base}/api/admin/trigger-champions`, {
    method: 'POST', headers: adminHeaders, signal: AbortSignal.timeout(10_000),
  });
  const adminChampionBody = await adminChampionTrigger.json();
  if (memberChampionTrigger.status !== 403 || adminChampionTrigger.status !== 200
      || adminChampionBody.message !== 'Champions calculation triggered.') {
    throw new Error('First admin champions handler did not preserve its role and response contract');
  }
  const disposableUserId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'disposable@example.invalid', 'Disposable Fixture', 'Fixture', 'not-a-real-password')",
    [disposableUserId],
  );
  const memberDelete = await fetch(`${base}/api/admin/members/${disposableUserId}`, {
    method: 'DELETE', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const adminDelete = await fetch(`${base}/api/admin/members/${disposableUserId}`, {
    method: 'DELETE', headers: adminHeaders, signal: AbortSignal.timeout(10_000),
  });
  const deletedUserCount = await pool.query('SELECT COUNT(*)::int AS count FROM users WHERE id = $1', [disposableUserId]);
  if (memberDelete.status !== 403 || adminDelete.status !== 200 || deletedUserCount.rows[0].count !== 0) {
    throw new Error(`First admin delete handler changed: MEMBER ${memberDelete.status}, ADMIN ${adminDelete.status}`);
  }
  const invitedMemberId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'invited-member@example.invalid', 'Invited Member', 'Fixture', 'not-a-real-password')",
    [invitedMemberId],
  );
  const publicVisitorForDelete = await pool.query(
    "INSERT INTO public_visitors (name, inviter_id) VALUES ('Member Delete Visitor Fixture', $1) RETURNING id", [invitedMemberId],
  );
  const invitedMemberDelete = await fetch(`${base}/api/admin/members/${invitedMemberId}`, {
    method: 'DELETE', headers: adminHeaders, signal: AbortSignal.timeout(10_000),
  });
  const invitedMemberAfter = (await pool.query('SELECT COUNT(*)::int AS count FROM users WHERE id = $1', [invitedMemberId])).rows[0].count;
  const publicVisitorAfter = (await pool.query('SELECT COUNT(*)::int AS count FROM public_visitors WHERE id = $1 AND inviter_id = $2', [publicVisitorForDelete.rows[0].id, invitedMemberId])).rows[0].count;
  if (invitedMemberDelete.status !== 500 || invitedMemberAfter !== 1 || publicVisitorAfter !== 1) {
    throw new Error('Member delete public visitor FK rollback baseline changed');
  }
  const manualMigration = await fetch(`${base}/api/admin/run-migrations`, {
    method: 'POST', headers: adminHeaders, signal: AbortSignal.timeout(10_000),
  });
  if (manualMigration.status !== 404) throw new Error('HTTP migration endpoint is still active');
  const visitorApply = await fetch(`${base}/api/visitors/apply`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Schema Fixture Visitor', email: 'schema-fixture@example.invalid', inviter_id: userId }),
    signal: AbortSignal.timeout(10_000),
  });
  const visitorApplyBody = await visitorApply.json();
  const visitorStatus = await fetch(`${base}/api/admin/public-visitors/${visitorApplyBody.id}/status`, {
    method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CONTACTED', form_data: { fixture: true } }),
    signal: AbortSignal.timeout(10_000),
  });
  const visitorRow = await pool.query('SELECT inviter_id, status, form_data FROM public_visitors WHERE id = $1', [visitorApplyBody.id]);
  if (visitorApply.status !== 201 || visitorStatus.status !== 200 || visitorRow.rows[0]?.inviter_id !== userId
      || visitorRow.rows[0].status !== 'CONTACTED' || visitorRow.rows[0].form_data.fixture !== true) {
    throw new Error(`Visitor API failed without request-time DDL: apply ${visitorApply.status}, status ${visitorStatus.status}`);
  }
  const memberTickets = await fetch(`${base}/api/tickets`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  if (memberTickets.status !== 200 || !Array.isArray(await memberTickets.json())) {
    throw new Error(`Ticket list failed without import-time DDL: ${memberTickets.status}`);
  }
  const supportCountBefore = (await pool.query('SELECT COUNT(*)::int AS count FROM tickets')).rows[0].count;
  const activityCountBefore = (await pool.query('SELECT COUNT(*)::int AS count FROM one_to_ones')).rows[0].count;
  const mobileActivityList = await fetch(`${base}/api/activities`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const mobileActivityCreate = await fetch(`${base}/api/activities`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id_2: otherUserId, status: 'TAMAMLANDI', notes: 'Mobile meeting fixture' }),
    signal: AbortSignal.timeout(10_000),
  });
  const activityCountAfterMobile = (await pool.query('SELECT COUNT(*)::int AS count FROM one_to_ones')).rows[0].count;
  const webOneToOneCreate = await fetch(`${base}/api/one-to-ones`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ partnerId: otherUserId, meetingDate: new Date().toISOString(), notes: 'Web meeting fixture' }),
    signal: AbortSignal.timeout(10_000),
  });
  const webOneToOneBody = await webOneToOneCreate.json();
  const activityCountAfterWeb = (await pool.query('SELECT COUNT(*)::int AS count FROM one_to_ones')).rows[0].count;
  const webOneToOneList = await fetch(`${base}/api/one-to-ones`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const webOneToOneRows = await webOneToOneList.json();
  if (mobileActivityList.status !== 404 || mobileActivityCreate.status !== 404
      || activityCountAfterMobile !== activityCountBefore || webOneToOneCreate.status !== 201
      || activityCountAfterWeb !== activityCountBefore + 1 || webOneToOneList.status !== 200
      || !webOneToOneRows.some(row => row.id === webOneToOneBody.id)) {
    throw new Error('Web/mobile one-to-one activity contract baseline changed');
  }
  const mobileSupportCreate = await fetch(`${base}/api/support`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Mobile support fixture', message: 'Fixture message' }),
    signal: AbortSignal.timeout(10_000),
  });
  const mobileSupportBody = await mobileSupportCreate.json();
  const supportCountAfterMobile = (await pool.query('SELECT COUNT(*)::int AS count FROM tickets')).rows[0].count;
  const webTicketCreate = await fetch(`${base}/api/tickets`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Web ticket fixture', message: 'Fixture message' }),
    signal: AbortSignal.timeout(10_000),
  });
  const webTicketBody = await webTicketCreate.json();
  const supportCountAfterWeb = (await pool.query('SELECT COUNT(*)::int AS count FROM tickets')).rows[0].count;
  const mobileAdminSupportList = await fetch(`${base}/api/support`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const mobileAdminSupportRows = await mobileAdminSupportList.json();
  const webAdminTicketList = await fetch(`${base}/api/tickets`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const webAdminTicketRows = await webAdminTicketList.json();
  if (mobileSupportCreate.status !== 201 || supportCountAfterMobile !== supportCountBefore + 1
      || mobileSupportBody.user_id !== userId
      || webTicketCreate.status !== 201 || supportCountAfterWeb !== supportCountBefore + 2
      || mobileAdminSupportList.status !== 200 || webAdminTicketList.status !== 200
      || !mobileAdminSupportRows.some(row => row.id === mobileSupportBody.id)
      || !webAdminTicketRows.some(row => row.id === webTicketBody.id)) {
    throw new Error('Web/mobile support path and persistence baseline changed');
  }
  const memberSupportStatus = await fetch(`${base}/api/support/${mobileSupportBody.id}/status`, {
    method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CLOSED' }),
  });
  const statusAfterMemberSupport = (await pool.query('SELECT status FROM tickets WHERE id = $1', [mobileSupportBody.id])).rows[0].status;
  const adminSupportStatus = await fetch(`${base}/api/support/${mobileSupportBody.id}/status`, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ status: 'CLOSED' }),
  });
  const statusAfterAdminSupport = (await pool.query('SELECT status FROM tickets WHERE id = $1', [mobileSupportBody.id])).rows[0].status;
  const unauthenticatedSupport = await fetch(`${base}/api/support`);
  const privateSupportId = randomUUID();
  await pool.query("INSERT INTO tickets (id, user_id, subject, status) VALUES ($1, $2, 'Private fixture', 'OPEN')", [privateSupportId, adminUserId]);
  const memberSupportList = await fetch(`${base}/api/support`, { headers: authHeaders });
  const memberSupportRows = await memberSupportList.json();
  if (memberSupportStatus.status !== 403 || statusAfterMemberSupport !== 'OPEN'
      || adminSupportStatus.status !== 200 || statusAfterAdminSupport !== 'CLOSED'
      || unauthenticatedSupport.status !== 401 || memberSupportList.status !== 200
      || memberSupportRows.some(row => row.id === privateSupportId)
      || memberSupportRows.some(row => row.user_id !== userId)) {
    throw new Error('Mobile support aliases must preserve member/admin/data boundaries');
  }
  const adminRouteChecks = {};
  for (const path of ['email-config', 'stats/charts', 'stats/groups', 'stats/geo']) {
    const memberResponse = await fetch(`${base}/api/admin/${path}`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
    const adminResponse = await fetch(`${base}/api/admin/${path}`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
    const adminBody = await adminResponse.json();
    if (memberResponse.status !== 403 || adminResponse.status !== 200
      || (path !== 'stats/charts' && !Array.isArray(adminBody))) {
      throw new Error(`Admin ${path} route baseline changed: MEMBER ${memberResponse.status}, ADMIN ${adminResponse.status}`);
    }
    adminRouteChecks[path] = { member: memberResponse.status, admin: adminResponse.status };
  }
  const attendanceList = await fetch(`${base}/api/events/${futureEventId}/attendance`, {
    headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const attendanceRows = await attendanceList.json();
  const registrationCountBefore = (await pool.query('SELECT COUNT(*)::int AS count FROM attendance WHERE event_id = $1 AND user_id = $2', [futureEventId, userId])).rows[0].count;
  const repeatRegistration = await fetch(`${base}/api/events/${futureEventId}/register`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10_000),
  });
  const repeatRegistrationBody = await repeatRegistration.json();
  const registrationCountAfter = (await pool.query('SELECT COUNT(*)::int AS count FROM attendance WHERE event_id = $1 AND user_id = $2', [futureEventId, userId])).rows[0].count;
  const missingEventRegistration = await fetch(`${base}/api/events/${randomUUID()}/register`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10_000),
  });
  const unauthenticatedRegistration = await fetch(`${base}/api/events/${futureEventId}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10_000),
  });
  if (attendanceList.status !== 200 || attendanceRows.length !== 2) {
    throw new Error(`Event attendance route baseline changed: ${attendanceList.status}`);
  }
  if (registrationCountBefore !== 1 || repeatRegistration.status !== 200 || repeatRegistrationBody.version !== 1
      ||repeatRegistrationBody.replayed !== true||repeatRegistrationBody.ownerId!==userId||repeatRegistrationBody.eventId!==futureEventId
      || registrationCountAfter !== 1 || missingEventRegistration.status !== 404 || unauthenticatedRegistration.status !== 401) {
    throw new Error('Common event registration repeat/missing/auth baseline changed');
  }
  const reportStats = await fetch(`${base}/api/reports/stats`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const accountingMembers = [randomUUID(), randomUUID(), randomUUID()];
  const accountingVisitors = [randomUUID(), randomUUID(), randomUUID()];
  for (let n = 0; n < 3; n++) {
    await pool.query(`INSERT INTO users (id, email, name, profession, subscription_plan, subscription_end_date, last_membership_payment_amount)
      VALUES ($1, $2, 'Accounting Fixture', 'Fixture', $3, NOW() + INTERVAL '1 month', $4)`,
      [accountingMembers[n], `accounting-${n}@example.invalid`, ['1_MONTH', '6_MONTHS', '12_MONTHS'][n], [null, 0, 125][n]]);
    await pool.query(`INSERT INTO public_visitors (id, name, email, source, kvkk_accepted, form_data)
      VALUES ($1, 'Accounting Visitor Fixture', $2, 'visitor_payment', true, $3)`,
      [accountingVisitors[n], `accounting-visitor-${n}@example.invalid`, JSON.stringify(n === 0 ? { payment_status: 'PAID' } : { payment_status: 'PAID', payment_amount: [null, 0, 25][n] })]);
  }
  const accountingList = await fetch(`${base}/api/admin/accounting/payments`, { headers: adminHeaders });
  const accountingRows = await accountingList.json();
  const accountingMemberDenied = await fetch(`${base}/api/admin/accounting/payments`, { headers: authHeaders });
  const accountingPublicDenied = await fetch(`${base}/api/admin/accounting/payments`);
  if (accountingList.status !== 200 || accountingMemberDenied.status !== 403 || accountingPublicDenied.status !== 401
      || accountingMembers.some((id, n) => accountingRows.find(row => row.id === id && row.type === 'MEMBER')?.amount !== [null, 0, 125][n])
      || accountingVisitors.some((id, n) => accountingRows.find(row => row.id === id && row.type === 'VISITOR')?.amount !== [null, 0, 25][n])) {
    throw new Error('Accounting recorded amount, real zero, unavailable amount or role contract changed');
  }
  await pool.query('DELETE FROM public_visitors WHERE id = ANY($1::uuid[])', [accountingVisitors]);
  await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [accountingMembers]);
  const linkedHistoryOid = `history-linked-${randomUUID()}`;
  const unlinkedHistoryOid = `history-unlinked-${randomUUID()}`;
  await pool.query(`INSERT INTO payment_transactions (merchant_oid, user_id, amount, status, action_type, action_data)
    VALUES ($1, $2, 0, 'SUCCESS', 'membership', '{"private":"not-for-list"}'),
      ($3, NULL, NULL, 'PENDING', 'membership', $4)`,
    [linkedHistoryOid, userId, unlinkedHistoryOid, JSON.stringify({ user_id: userId })]);
  const paymentHistoryBefore = (await pool.query('SELECT * FROM payment_transactions ORDER BY merchant_oid')).rows;
  const adminPaymentHistory = await fetch(`${base}/api/payments/history`, { headers: adminHeaders });
  const paymentHistoryRows = await adminPaymentHistory.json();
  const memberPaymentHistory = await fetch(`${base}/api/payments/history`, { headers: authHeaders });
  const publicPaymentHistory = await fetch(`${base}/api/payments/history`);
  const linkedHistoryRow = paymentHistoryRows.find(row => row.id === linkedHistoryOid);
  const unlinkedHistoryRow = paymentHistoryRows.find(row => row.id === unlinkedHistoryOid);
  const historyUserName = (await pool.query('SELECT name FROM users WHERE id = $1', [userId])).rows[0].name;
  const paymentHistoryAfter = (await pool.query('SELECT * FROM payment_transactions ORDER BY merchant_oid')).rows;
  if (adminPaymentHistory.status !== 200 || memberPaymentHistory.status !== 403 || publicPaymentHistory.status !== 401
      || paymentHistoryRows.length !== paymentHistoryBefore.length
      || linkedHistoryRow?.amount !== 0 || linkedHistoryRow?.status !== 'SUCCESS' || linkedHistoryRow?.member?.id !== userId
      || linkedHistoryRow?.member?.full_name !== historyUserName || !linkedHistoryRow?.created_at
      || unlinkedHistoryRow?.amount !== null || unlinkedHistoryRow?.member !== null || unlinkedHistoryRow?.user_id !== null
      || unlinkedHistoryRow?.status !== 'PENDING' || paymentHistoryRows.some(row => Object.hasOwn(row, 'action_data'))
      || JSON.stringify(paymentHistoryBefore) !== JSON.stringify(paymentHistoryAfter)) {
    throw new Error('Payment history recorded ownership, read-only or admin role contract changed');
  }
  await pool.query('DELETE FROM payment_transactions WHERE merchant_oid = ANY($1::text[])', [[linkedHistoryOid, unlinkedHistoryOid]]);
  const reportStatsBody = await reportStats.json();
  const adminDashboardStats = await fetch(`${base}/api/reports/stats`, { headers: adminHeaders });
  const adminDashboardStatsBody = await adminDashboardStats.json();
  const dashboardCounts = (await pool.query(`SELECT
    (SELECT COUNT(*)::int FROM users) AS users,
    (SELECT COUNT(*)::int FROM groups) AS groups,
    (SELECT COUNT(*)::int FROM events) AS events`)).rows[0];
  if (adminDashboardStats.status !== 200 || adminDashboardStatsBody.totalMembers !== dashboardCounts.users
      || adminDashboardStatsBody.totalGroups !== dashboardCounts.groups || adminDashboardStatsBody.totalEvents !== dashboardCounts.events) {
    throw new Error('Mobile admin dashboard summary does not match database record counts');
  }
  if (reportStats.status !== 200 || reportStatsBody.totalRevenue !== null
      || reportStatsBody.internalRevenue !== null || reportStatsBody.externalRevenue !== null
      || reportStatsBody.lostMembers !== null || reportStatsBody.visitorConversionRate !== null) {
    throw new Error('Unavailable stats must not contain fabricated or zero metrics');
  }
  // Disposable fixture source only: absent -> empty -> sum -> broken query.
  await pool.query('CREATE TABLE revenue_entries (amount NUMERIC)');
  const emptyRevenueReport = await fetch(`${base}/api/reports/stats`, { headers: authHeaders });
  const emptyRevenueBody = await emptyRevenueReport.json();
  await pool.query('INSERT INTO revenue_entries (amount) VALUES (100), (25)');
  const summedRevenueReport = await fetch(`${base}/api/reports/stats`, { headers: authHeaders });
  const summedRevenueBody = await summedRevenueReport.json();
  await pool.query('ALTER TABLE revenue_entries DROP COLUMN amount');
  const brokenRevenueReport = await fetch(`${base}/api/reports/stats`, { headers: authHeaders });
  await pool.query('DROP TABLE revenue_entries');
  const unauthenticatedStats = await fetch(`${base}/api/reports/stats`);
  if (emptyRevenueReport.status !== 200 || emptyRevenueBody.totalRevenue !== 0
      || summedRevenueReport.status !== 200 || summedRevenueBody.totalRevenue !== 125
      || summedRevenueBody.internalRevenue !== null || summedRevenueBody.externalRevenue !== null
      || brokenRevenueReport.status !== 500 || unauthenticatedStats.status !== 401) {
    throw new Error('Revenue source empty/sum/query failure/auth contract changed');
  }
  const reportCharts = await fetch(`${base}/api/reports/charts`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const reportChartsBody = await reportCharts.json();
  const unauthenticatedCharts = await fetch(`${base}/api/reports/charts`, { signal: AbortSignal.timeout(10_000) });
  if (reportCharts.status !== 200 || reportChartsBody.revenue?.length !== 0 || reportChartsBody.growth?.length !== 0
      || reportChartsBody.availability?.revenue !== false || reportChartsBody.availability?.growth !== false
      || unauthenticatedCharts.status !== 401) {
    throw new Error('Unavailable monthly report series/auth contract changed');
  }
  const health = await fetch(`${base}/api/health-check`, { signal: AbortSignal.timeout(10_000) });
  const healthBody = await health.json();
  const events = await fetch(`${base}/api/events`, { signal: AbortSignal.timeout(10_000) });
  const publicEvents = await events.json();
  const adminEvents = await fetch(`${base}/api/events?mode=admin`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const allEvents = await adminEvents.json();
  const eventRows = (await pool.query('SELECT title, status FROM events ORDER BY title')).rows;

  const { rows: ownNotifications } = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, read)
     VALUES ($1, 'SYSTEM', 'First fixture', 'First message', FALSE),
            ($1, 'SYSTEM', 'Second fixture', 'Second message', FALSE)
     RETURNING id`, [userId],
  );
  const { rows: otherNotifications } = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, read)
     VALUES ($1, 'SYSTEM', 'Other fixture', 'Other message', FALSE) RETURNING id`, [otherUserId],
  );
  const notificationList = await fetch(`${base}/api/notifications`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const listedNotifications = await notificationList.json();
  const readOne = await fetch(`${base}/api/notifications/${ownNotifications[0].id}/read`, {
    method: 'PUT', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const readOneBody = await readOne.json();
  const afterReadOne = (await pool.query('SELECT id, read FROM notifications WHERE user_id = $1 ORDER BY id', [userId])).rows;
  const readAll = await fetch(`${base}/api/notifications/read-all`, {
    method: 'PUT', headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const afterReadAll = (await pool.query('SELECT id, read FROM notifications WHERE user_id = $1', [userId])).rows;
  const otherRead = (await pool.query('SELECT read FROM notifications WHERE id = $1', [otherNotifications[0].id])).rows[0].read;

  if (health.status !== 200 || healthBody.dbAttempt !== 'success') throw new Error('Isolated API health check failed');
  if (events.status !== 200 || publicEvents.length !== 1 || publicEvents[0].title !== 'Future Fixture Event') {
    throw new Error(`Public event list did not filter as expected: ${events.status}`);
  }
  if (adminEvents.status !== 200 || allEvents.length !== 3) throw new Error('Admin event list did not return all fixtures');
  if (eventRows.length !== 3 || eventRows.find(row => row.title === 'Past Fixture Event')?.status !== 'PUBLISHED'
      || eventRows.find(row => row.title === 'Draft Fixture Event')?.status !== 'DRAFT') {
    throw new Error('GET /api/events changed fixture event statuses');
  }
  if (notificationList.status !== 200 || listedNotifications.length !== 2
      || listedNotifications.some(row => !row.title || !row.message || row.read !== false || 'content' in row || 'is_read' in row)) {
    throw new Error('Notification list did not return the canonical contract');
  }
  if (readOne.status !== 200 || afterReadOne.filter(row => row.read).length !== 1) {
    throw new Error('Single notification read failed');
  }
  if (readAll.status !== 200 || afterReadAll.some(row => !row.read) || otherRead) {
    throw new Error('Bulk notification read crossed user boundaries or left unread rows');
  }
  let migrationFailureCode = null;
  await pool.query('ALTER TABLE users RENAME TO users_temporarily_hidden');
  const originalConsoleError = console.error;
  try {
    console.error = (...args) => {
      if (args[0] !== '❌ Migration Error:') originalConsoleError(...args);
    };
    try { await runMigrations(); }
    catch (error) { migrationFailureCode = error.code; }
  } finally {
    console.error = originalConsoleError;
    await pool.query('ALTER TABLE users_temporarily_hidden RENAME TO users');
  }
  if (migrationFailureCode !== '42P01') throw new Error('Migration error was not propagated to its caller');
  const notificationSql = readFileSync(path.join(serverDir, 'migrations/0004_notifications_contract.sql'), 'utf8');
  const variantClient = await pool.connect();
  const notificationVariants = {};
  try {
    await variantClient.query('BEGIN');
    await variantClient.query('DROP TABLE subscription_reminder_deliveries');
    await variantClient.query('DROP TABLE notifications');
    await variantClient.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type VARCHAR(50), content TEXT,
        is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await variantClient.query("INSERT INTO notifications (type, content, is_read) VALUES ('SYSTEM', 'Legacy fixture message', TRUE)");
    await variantClient.query(notificationSql);
    const oldRow = (await variantClient.query('SELECT title, message, read FROM notifications')).rows[0];
    notificationVariants.legacy = oldRow.title === 'Bildirim' && oldRow.message === 'Legacy fixture message' && oldRow.read === true;
    await variantClient.query('ROLLBACK');

    await variantClient.query('BEGIN');
    await variantClient.query('DROP TABLE subscription_reminder_deliveries');
    await variantClient.query('DROP TABLE notifications');
    await variantClient.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, message TEXT NOT NULL,
        type TEXT NOT NULL, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await variantClient.query("INSERT INTO notifications (title, message, type, read) VALUES ('Live fixture', 'Live message', 'SYSTEM', TRUE)");
    await variantClient.query(notificationSql);
    const liveRow = (await variantClient.query('SELECT title, message, read FROM notifications')).rows[0];
    notificationVariants.liveShape = liveRow.title === 'Live fixture' && liveRow.message === 'Live message' && liveRow.read === true;
    await variantClient.query('ROLLBACK');
  } finally {
    await variantClient.query('ROLLBACK');
    variantClient.release();
  }
  if (!notificationVariants.legacy || !notificationVariants.liveShape) {
    throw new Error(`Notification migration variant failed: ${JSON.stringify(notificationVariants)}`);
  }
  const sameProfessionApplicantId = randomUUID();
  // Earlier transfer now succeeds; explicitly restore the profession-conflict fixture.
  await pool.query("UPDATE group_members SET status='INACTIVE' WHERE user_id=$1 AND group_id<>$2",[otherUserId,groupId]);
  await pool.query("UPDATE group_members SET status='ACTIVE' WHERE user_id=$1 AND group_id=$2",[otherUserId,groupId]);
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'same-profession-applicant@example.invalid', 'Same Profession Applicant', 'Other Profession', 'fixture-only')",
    [sameProfessionApplicantId],
  );
  let requestedIntoOccupiedGroupSqlState = null;
  try { await pool.query("INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, 'REQUESTED')", [sameProfessionApplicantId, groupId]); }
  catch (error) { requestedIntoOccupiedGroupSqlState = error.code; }
  const conflictGroupId = randomUUID();
  await pool.query("INSERT INTO groups (id, name, status) VALUES ($1, 'Profession Conflict Fixture', 'ACTIVE')", [conflictGroupId]);
  const directSameProfessionId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'direct-same-profession@example.invalid', 'Direct Same Profession', 'Other Profession', 'fixture-only')",
    [directSameProfessionId],
  );
  await pool.query("INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, 'REQUESTED'), ($3, $2, 'REQUESTED')", [sameProfessionApplicantId, conflictGroupId, directSameProfessionId]);
  const approveSameProfession = await fetch(`${base}/api/groups/${conflictGroupId}/members/${sameProfessionApplicantId}`, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ status: 'ACTIVE' }), signal: AbortSignal.timeout(10_000),
  });
  const approveSecondSameProfession = await fetch(`${base}/api/groups/${conflictGroupId}/members/${directSameProfessionId}`, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ status: 'ACTIVE' }), signal: AbortSignal.timeout(10_000),
  });
  const activeSameProfessionCount = (await pool.query(
    "SELECT COUNT(*)::int AS count FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = $1 AND gm.status = 'ACTIVE' AND u.profession = 'Other Profession'",
    [conflictGroupId],
  )).rows[0].count;
  const thirdSameProfessionId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'third-same-profession@example.invalid', 'Third Same Profession', 'Other Profession', 'fixture-only')",
    [thirdSameProfessionId],
  );
  let directSameProfessionSqlState = null;
  try { await pool.query("INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, 'ACTIVE')", [thirdSameProfessionId, conflictGroupId]); }
  catch (error) { directSameProfessionSqlState = error.code; }
  const professionConflictBaseline = { requestedIntoOccupiedGroupSqlState,
    firstApproval: approveSameProfession.status, secondApproval: approveSecondSameProfession.status,
    activeSameProfessionCount, directInsertSqlState: directSameProfessionSqlState };
  if (professionConflictBaseline.requestedIntoOccupiedGroupSqlState !== 'P0001'
      || professionConflictBaseline.firstApproval !== 200 || professionConflictBaseline.secondApproval !== 200
      || professionConflictBaseline.activeSameProfessionCount !== 2 || professionConflictBaseline.directInsertSqlState !== 'P0001') {
    throw new Error(`Profession conflict baseline changed: ${JSON.stringify(professionConflictBaseline)}`);
  }
  const capacityGroupId = randomUUID();
  await pool.query("INSERT INTO groups (id, name, status) VALUES ($1, 'Capacity Fixture Group', 'ACTIVE')", [capacityGroupId]);
  await pool.query(`
    INSERT INTO users (email, name, profession, password_hash)
    SELECT 'capacity-' || n || '@example.invalid', 'Capacity Fixture ' || n,
           'Capacity Profession ' || n, 'fixture-only'
    FROM generate_series(1, 34) AS n
  `);
  await pool.query(`
    INSERT INTO group_members (user_id, group_id, status)
    SELECT id, $1, 'ACTIVE' FROM users WHERE email LIKE 'capacity-%@example.invalid'
  `, [capacityGroupId]);
  const capacityCountBefore = (await pool.query("SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1 AND status = 'ACTIVE'", [capacityGroupId])).rows[0].count;
  const capacityApplicantIds = [randomUUID(), randomUUID()];
  for (const [index, applicantId] of capacityApplicantIds.entries()) {
    await pool.query(
      'INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, $2, $3, $4, $5)',
      [applicantId, `capacity-applicant-${index}@example.invalid`, `Capacity Applicant ${index}`, `Capacity Applicant Profession ${index}`, 'fixture-only'],
    );
    await pool.query("INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, 'REQUESTED')", [applicantId, capacityGroupId]);
  }
  const capacityApprovals = await Promise.all(capacityApplicantIds.map(applicantId => fetch(
    `${base}/api/groups/${capacityGroupId}/members/${applicantId}`,
    { method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ status: 'ACTIVE' }), signal: AbortSignal.timeout(10_000) },
  )));
  const capacityCountAfter = (await pool.query("SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1 AND status = 'ACTIVE'", [capacityGroupId])).rows[0].count;
  const capacityBaseline = { before: capacityCountBefore, approvals: capacityApprovals.map(response => response.status),
    after: capacityCountAfter };
  if (capacityBaseline.before !== 34 || JSON.stringify([...capacityBaseline.approvals].sort()) !== JSON.stringify([200,409])
      || capacityBaseline.after !== 35) {
    throw new Error(`Capacity baseline changed: ${JSON.stringify(capacityBaseline)}`);
  }
  const interviewGroupId = randomUUID();
  const interviewApplicantId = randomUUID();
  await pool.query("INSERT INTO groups (id, name, status) VALUES ($1, 'Interview Fixture Group', 'ACTIVE')", [interviewGroupId]);
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'interview-applicant@example.invalid', 'Interview Applicant', 'Interview Profession', 'fixture-only')",
    [interviewApplicantId],
  );
  await pool.query("INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, 'REQUESTED')", [interviewApplicantId, interviewGroupId]);
  const memberApprovedWithoutInterview = await fetch(`${base}/api/groups/${interviewGroupId}/members/${interviewApplicantId}`, {
    method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ACTIVE' }), signal: AbortSignal.timeout(10_000),
  });
  const interviewApprovalStatus = (await pool.query(
    'SELECT status FROM group_members WHERE user_id = $1 AND group_id = $2', [interviewApplicantId, interviewGroupId],
  )).rows[0]?.status;
  const interviewApprovalBaseline = { memberHttpStatus: memberApprovedWithoutInterview.status,
    membershipStatus: interviewApprovalStatus };
  if (interviewApprovalBaseline.memberHttpStatus !== 403 || interviewApprovalBaseline.membershipStatus !== 'REQUESTED') {
    throw new Error(`Interview approval baseline changed: ${JSON.stringify(interviewApprovalBaseline)}`);
  }
  await pool.query("INSERT INTO group_members (user_id, group_id, status) VALUES ($1, $2, 'ACTIVE')", [otherUserId, interviewGroupId]);
  const multipleActiveGroups = (await pool.query(
    "SELECT COUNT(*)::int AS count FROM group_members WHERE user_id = $1 AND status = 'ACTIVE'", [otherUserId],
  )).rows[0].count;
  const removeAcceptedGroupMember = await fetch(`${base}/api/groups/${interviewGroupId}/members/${interviewApplicantId}`, {
    method: 'DELETE', headers: adminHeaders, signal: AbortSignal.timeout(10_000),
  });
  const removedMembershipCount = (await pool.query(
    'SELECT COUNT(*)::int AS count FROM group_members WHERE user_id = $1 AND group_id = $2', [interviewApplicantId, interviewGroupId],
  )).rows[0].count;
  const removedMemberAccountStatus = (await pool.query('SELECT account_status FROM users WHERE id = $1', [interviewApplicantId])).rows[0]?.account_status;
  const placementHistoryTable = (await pool.query("SELECT to_regclass('public.group_placement_events') AS table_name")).rows[0].table_name;
  const placementHistoryBaseline = { multipleActiveGroups, removeHttpStatus: removeAcceptedGroupMember.status,
    remainingMembershipRows: removedMembershipCount, accountStatus: removedMemberAccountStatus,
    hasPlacementHistoryTable: placementHistoryTable !== null };
  if (placementHistoryBaseline.multipleActiveGroups !== 2 || placementHistoryBaseline.removeHttpStatus !== 200
      || placementHistoryBaseline.remainingMembershipRows !== 0 || placementHistoryBaseline.accountStatus !== 'ACTIVE'
      || placementHistoryBaseline.hasPlacementHistoryTable) {
    throw new Error(`Placement history baseline changed: ${JSON.stringify(placementHistoryBaseline)}`);
  }
  const scoreUserId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash) VALUES ($1, 'score-fixture@example.invalid', 'Score Fixture', 'Score Profession', $2)",
    [scoreUserId, fixturePasswordHash],
  );
  const scoreLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'score-fixture@example.invalid', password: 'fixture-password' }),
    signal: AbortSignal.timeout(10_000),
  });
  const scoreToken = (await scoreLogin.json()).token;
  if (scoreLogin.status !== 200 || !scoreToken) throw new Error('Score fixture login failed');
  const visitorScoreBody = { name: 'Repeated Score Visitor', email: 'repeated-score-visitor@example.invalid',
    visitedAt: new Date().toISOString(), status: 'ATTENDED' };
  const scoreVisitorHeaders = { Authorization: `Bearer ${scoreToken}`, 'Content-Type': 'application/json' };
  const firstScoreVisitor = await fetch(`${base}/api/visitors`, {
    method: 'POST', headers: scoreVisitorHeaders, body: JSON.stringify(visitorScoreBody), signal: AbortSignal.timeout(10_000),
  });
  const scoreAfterFirstVisitor = (await pool.query('SELECT performance_score FROM users WHERE id = $1', [scoreUserId])).rows[0].performance_score;
  const repeatedScoreVisitor = await fetch(`${base}/api/visitors`, {
    method: 'POST', headers: scoreVisitorHeaders, body: JSON.stringify(visitorScoreBody), signal: AbortSignal.timeout(10_000),
  });
  const scoreAfterRepeatedVisitor = (await pool.query('SELECT performance_score FROM users WHERE id = $1', [scoreUserId])).rows[0].performance_score;
  const repeatedVisitorRows = (await pool.query('SELECT COUNT(*)::int AS count FROM visitors WHERE inviter_id = $1 AND email = $2',
    [scoreUserId, visitorScoreBody.email])).rows[0].count;
  const scoreHistoryTable = (await pool.query("SELECT to_regclass('public.user_score_history') AS table_name")).rows[0].table_name;
  const scoreHistoryBaseline = { firstVisitor: firstScoreVisitor.status, repeatedVisitor: repeatedScoreVisitor.status,
    visitorRows: repeatedVisitorRows, scoreAfterFirst: scoreAfterFirstVisitor,
    scoreAfterRepeated: scoreAfterRepeatedVisitor, hasScoreHistoryTable: scoreHistoryTable !== null };
  if (scoreHistoryBaseline.firstVisitor !== 201 || scoreHistoryBaseline.repeatedVisitor !== 201
      || scoreHistoryBaseline.visitorRows !== 2 || scoreHistoryBaseline.scoreAfterFirst !== 10
      || scoreHistoryBaseline.scoreAfterRepeated !== 20 || !scoreHistoryBaseline.hasScoreHistoryTable) {
    throw new Error(`Score history baseline changed: ${JSON.stringify(scoreHistoryBaseline)}`);
  }
  const trafficLights = await fetch(`${base}/api/reports/traffic-lights`, {
    headers: { Authorization: `Bearer ${scoreToken}` }, signal: AbortSignal.timeout(10_000),
  });
  const trafficLightRows = await trafficLights.json();
  const scoreTrafficLight = trafficLightRows.find(row => row.id === scoreUserId);
  const monthlyScoreBaseline = { status: trafficLights.status, score: scoreTrafficLight?.score,
    hasMonth: Object.hasOwn(scoreTrafficLight || {}, 'month'),
    hasSource: Object.hasOwn(scoreTrafficLight || {}, 'source'),
    hasRuleVersion: Object.hasOwn(scoreTrafficLight || {}, 'rule_version') };
  if (monthlyScoreBaseline.status !== 200 || monthlyScoreBaseline.score !== 20
      || monthlyScoreBaseline.hasMonth || monthlyScoreBaseline.hasSource || monthlyScoreBaseline.hasRuleVersion) {
    throw new Error(`Monthly score baseline changed: ${JSON.stringify(monthlyScoreBaseline)}`);
  }
  await pool.query("UPDATE users SET role = 'PRESIDENT' WHERE id = $1", [otherUserId]);
  const groupRowsBeforeShuffle = (await pool.query("SELECT COUNT(*)::int AS count FROM group_members WHERE status = 'ACTIVE'")).rows[0].count;
  const shuffleMember = await fetch(`${base}/api/shuffle/save`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignments: {} }), signal: AbortSignal.timeout(10_000),
  });
  const shuffleAdmin = await fetch(`${base}/api/shuffle/save`, {
    method: 'POST', headers: jsonAdminHeaders, body: JSON.stringify({ assignments: {} }), signal: AbortSignal.timeout(10_000),
  });
  const groupRowsAfterShuffle = (await pool.query("SELECT COUNT(*)::int AS count FROM group_members WHERE status = 'ACTIVE'")).rows[0].count;
  const presidentRoleAfterShuffle = (await pool.query('SELECT role FROM users WHERE id = $1', [otherUserId])).rows[0].role;
  const missingShuffleNotify = await fetch(`${base}/api/shuffle/notify`, {
    method: 'POST', headers: jsonAdminHeaders, body: JSON.stringify({ items: {} }), signal: AbortSignal.timeout(10_000),
  });
  const shuffleApplyBaseline = { memberStatus: shuffleMember.status, adminStatus: shuffleAdmin.status,
    activeBefore: groupRowsBeforeShuffle, activeAfter: groupRowsAfterShuffle,
    presidentRoleAfter: presidentRoleAfterShuffle, notifyStatus: missingShuffleNotify.status };
  if (shuffleApplyBaseline.memberStatus !== 403 || shuffleApplyBaseline.adminStatus !== 400
      || shuffleApplyBaseline.activeBefore !== shuffleApplyBaseline.activeAfter
      || shuffleApplyBaseline.presidentRoleAfter !== 'PRESIDENT' || shuffleApplyBaseline.notifyStatus !== 404) {
    throw new Error(`Shuffle apply baseline changed: ${JSON.stringify(shuffleApplyBaseline)}`);
  }
  // Card summaries must count the same rows as the participant dialog, not only PRESENT.
  const countEventResponse = await fetch(`${base}/api/events`, {
    method: 'POST', headers: jsonAdminHeaders,
    body: JSON.stringify({ title: 'Participant Count Fixture', start_at: '2099-01-01T20:00:00Z', is_public: true, type: 'meeting', max_attendees: 50 }),
  });
  const countEvent = await countEventResponse.json();
  if (countEventResponse.status !== 201 || countEvent.attendees_count !== 0) throw new Error('New event count must be real zero');
  const getCountEvent = async () => {
    const response = await fetch(`${base}/api/events?mode=admin`, { headers: adminHeaders });
    const rows = await response.json();
    if (response.status !== 200) throw new Error('Count list failed');
    return rows.find(row => row.id === countEvent.id);
  };
  if ((await getCountEvent()).attendees_count !== 0) throw new Error('Empty event list count failed');
  await pool.query("INSERT INTO attendance (event_id, user_id, status) VALUES ($1, $2, 'PRESENT'), ($1, $3, 'ABSENT')", [countEvent.id, userId, otherUserId]);
  const countList = await getCountEvent();
  const countDetail = await (await fetch(`${base}/api/events/${countEvent.id}`, { headers: adminHeaders })).json();
  const countDialog = await (await fetch(`${base}/api/events/${countEvent.id}/attendance`, { headers: adminHeaders })).json();
  const countPublic = await (await fetch(`${base}/api/events`)).json();
  if (countList.attendees_count !== 2 || countDialog.length !== 2 || countDetail.attendees_count !== 2
      || countDetail.attendees.length !== 2 || countPublic.find(row => row.id === countEvent.id)?.attendees_count !== 2
      || Object.hasOwn(countList, 'attendees')) throw new Error('Participant count list/detail/dialog mismatch or list exposed identities');
  const countEditResponse = await fetch(`${base}/api/events/${countEvent.id}`, {
    method: 'PUT', headers: jsonAdminHeaders, body: JSON.stringify({ title: 'Participant Count Edited' }),
  });
  if (countEditResponse.status !== 200 || (await countEditResponse.json()).attendees_count !== 2) throw new Error('Editing erased participant count');
  const countDenied = await fetch(`${base}/api/admin/events/${countEvent.id}/attendance/${otherUserId}`, { method: 'DELETE', headers: authHeaders });
  if (countDenied.status !== 403 || (await getCountEvent()).attendees_count !== 2) throw new Error('Member altered participant count');
  const countRemove = await fetch(`${base}/api/admin/events/${countEvent.id}/attendance/${otherUserId}`, { method: 'DELETE', headers: adminHeaders });
  const countAfterRemove = await getCountEvent();
  const countDialogAfter = await (await fetch(`${base}/api/events/${countEvent.id}/attendance`, { headers: adminHeaders })).json();
  if (countRemove.status !== 200 || countAfterRemove.attendees_count !== 1 || countDialogAfter.length !== 1) throw new Error('Removal did not refresh participant count');
  console.log('Participant count PASS: new/empty=0, mixed attendance=2, edit=2, denied removal=2, admin removal=1; no list identities.');
  const eventCommand = (method, url, headers, body) => fetch(`${base}/api/events${url}`, {
    method, headers, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10_000),
  });
  const eventFixture = { title: 'Event lifecycle fixture', start_at: '2099-02-01T20:00:00Z', end_at: '2099-02-01T21:00:00Z', type: 'meeting', is_public: true, online_link: 'https://meeting.example.invalid/private' };
  const memberEvent = await eventCommand('POST', '', { ...authHeaders, 'Content-Type': 'application/json' }, eventFixture);
  const anonymousAdminList = await eventCommand('GET', '?mode=admin', {});
  const memberAdminList = await eventCommand('GET', '?mode=admin', authHeaders);
  const forgedAdminHeaders = { Authorization: `Bearer ${jwt.sign({ id: userId, role: 'ADMIN' }, process.env.JWT_SECRET)}` };
  const forgedAdminList = await eventCommand('GET', '?mode=admin', forgedAdminHeaders);
  const forgedAdminWrite = await eventCommand('POST', '', { ...forgedAdminHeaders, 'Content-Type': 'application/json' }, eventFixture);
  const badEvent = await eventCommand('POST', '', jsonAdminHeaders, { ...eventFixture, end_at: '2099-01-01T21:00:00Z' });
  if (memberEvent.status !== 403 || anonymousAdminList.status !== 401 || memberAdminList.status !== 403
      || forgedAdminList.status !== 403 || forgedAdminWrite.status !== 403 || badEvent.status !== 400) throw new Error('Event lifecycle authorization/validation failed');
  const createdResponse = await eventCommand('POST', '', jsonAdminHeaders, eventFixture);
  const createdEvent = await createdResponse.json();
  if (createdResponse.status !== 201 || !createdEvent.id) throw new Error('Admin event create failed');
  const guestEvent = await (await eventCommand('GET', `/${createdEvent.id}`, {})).json();
  const adminEvent = await (await eventCommand('GET', `/${createdEvent.id}`, adminHeaders)).json();
  const memberEdit = await eventCommand('PUT', `/${createdEvent.id}`, { ...authHeaders, 'Content-Type': 'application/json' }, { title: 'Forged edit' });
  const memberEventDelete = await eventCommand('DELETE', `/${createdEvent.id}`, authHeaders);
  const invalidEdit = await eventCommand('PUT', `/${createdEvent.id}`, jsonAdminHeaders, { max_attendees: 0 });
  const missingEdit = await eventCommand('PUT', `/${randomUUID()}`, jsonAdminHeaders, { title: 'Missing' });
  if (guestEvent.online_link !== undefined || guestEvent.attendees?.length !== 0 || adminEvent.online_link !== eventFixture.online_link
      || memberEdit.status !== 403 || memberEventDelete.status !== 403 || invalidEdit.status !== 400 || missingEdit.status !== 404) throw new Error('Event read/write boundary failed');
  const editResponse = await eventCommand('PUT', `/${createdEvent.id}`, jsonAdminHeaders, { title: 'Event lifecycle edited', status: 'DRAFT' });
  const hiddenDraft = await eventCommand('GET', `/${createdEvent.id}`, {});
  const deleteResponse = await eventCommand('DELETE', `/${createdEvent.id}`, adminHeaders);
  const missingDelete = await eventCommand('DELETE', `/${createdEvent.id}`, adminHeaders);
  const completedEdit = await eventCommand('PUT', `/${countEvent.id}`, jsonAdminHeaders, { status: 'COMPLETED' });
  const completedRead = await eventCommand('GET', `/${countEvent.id}`, {});
  const linkedDelete = await eventCommand('DELETE', `/${countEvent.id}`, adminHeaders);
  if (editResponse.status !== 200 || (await editResponse.json()).title !== 'Event lifecycle edited'
      || hiddenDraft.status !== 404 || deleteResponse.status !== 200 || missingDelete.status !== 404
      || completedEdit.status !== 200 || completedRead.status !== 200 || linkedDelete.status !== 409
      || !(await getCountEvent())) throw new Error('Event edit/draft/delete/history integrity failed');
  const privateResponse = await eventCommand('POST', '', jsonAdminHeaders, { ...eventFixture, title: 'Private event fixture', is_public: false });
  const privateEvent = await privateResponse.json();
  if (privateResponse.status !== 201 || !privateEvent.id) throw new Error('Private event create failed');
  const privateGuest = await eventCommand('GET', `/${privateEvent.id}`, {});
  const privateStranger = await eventCommand('GET', `/${privateEvent.id}`, authHeaders);
  await pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'REGISTERED')", [privateEvent.id,userId]);
  const privateOwner = await eventCommand('GET', `/${privateEvent.id}`, authHeaders);
  if (privateGuest.status !== 404 || privateStranger.status !== 404 || privateOwner.status !== 200) throw new Error('Private event participant boundary failed');
  const privateGroupId = randomUUID();
  await pool.query("INSERT INTO groups(id,name) VALUES($1,'Private event boundary group')", [privateGroupId]);
  const groupPrivateResponse = await eventCommand('POST', '', jsonAdminHeaders, { ...eventFixture, title: 'Group private fixture', group_id: privateGroupId, is_public: false });
  const groupPrivate = await groupPrivateResponse.json();
  const groupPublicResponse = await eventCommand('POST', '', jsonAdminHeaders, { ...eventFixture, title: 'Group public fixture', group_id: privateGroupId });
  const groupPublic = await groupPublicResponse.json();
  if (groupPrivateResponse.status !== 201 || groupPublicResponse.status !== 201) throw new Error('Group event fixtures failed');
  const groupEventList = async headers => {
    const response = await fetch(`${base}/api/groups/${privateGroupId}/events`, { headers, signal: AbortSignal.timeout(10_000) });
    return { status: response.status, rows: await response.json() };
  };
  const outsiderGroupEvents = await groupEventList(authHeaders);
  const forgedGroupEvents = await groupEventList(forgedAdminHeaders);
  const adminGroupEvents = await groupEventList(adminHeaders);
  if (outsiderGroupEvents.status !== 200 || outsiderGroupEvents.rows.length !== 1 || outsiderGroupEvents.rows[0].id !== groupPublic.id
      || Object.hasOwn(outsiderGroupEvents.rows[0], 'online_link') || forgedGroupEvents.rows.length !== 1
      || adminGroupEvents.rows.length !== 2 || !adminGroupEvents.rows.some(row => row.id === groupPrivate.id)) throw new Error('Group event list exposed private/draft or online link');
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE')", [userId, privateGroupId]);
  const memberGroupEvents = await groupEventList(authHeaders);
  if (memberGroupEvents.rows.length !== 2 || !memberGroupEvents.rows.some(row => row.id === groupPrivate.id)) throw new Error('Active group member could not read private group event');
  console.log('Event lifecycle PASS: admin-only list/mutations, public detail redaction, validation, draft isolation, linked-record protection and precise acknowledgements.');
  console.log(JSON.stringify({
    isolated: true,
    postgresImage: 'postgres:17',
    postgresVersion,
    sourceTables: tableCount,
    versionedMigrations: firstMigration.applied,
    repeatAppliedVersions: secondMigration.applied.length,
    migrationCommandAppliedVersions: 0,
    checksumGuard,
    existingSchemaGuard,
    legacyDriftGuard,
    legacyAdoption: legacyAdoption?.applied,
    legacyRepeatAppliedVersions: legacyRepeat?.applied.length,
    legacyRowsPreserved,
    publicVisitorInviterFk: inviterFk.rows[0].count === 1,
    existingVisitorUpgrade: visitorUpgrade.applied,
    visitorApplyWithoutDdl: visitorApply.status,
    visitorStatusWithoutDdl: visitorStatus.status,
    ticketListWithoutDdl: memberTickets.status,
    supportPathParity: { mobileCreate: mobileSupportCreate.status, mobileRowsAdded: supportCountAfterMobile - supportCountBefore,
      webCreate: webTicketCreate.status, webRowsAdded: supportCountAfterWeb - supportCountAfterMobile,
      mobileAdminList: mobileAdminSupportList.status, webAdminList: webAdminTicketList.status },
    activityPathParity: { mobileList: mobileActivityList.status, mobileCreate: mobileActivityCreate.status,
      mobileRowsAdded: activityCountAfterMobile - activityCountBefore, webCreate: webOneToOneCreate.status,
      webRowsAdded: activityCountAfterWeb - activityCountAfterMobile, webList: webOneToOneList.status },
    manualMigrationEndpoint: manualMigration.status,
    migrationFailureCode,
    localCompatibilityShim: null,
    apiHealth: health.status,
    fixtureLogin: login.status,
    fixtureAdminLogin: adminLogin.status,
    registrationWithoutInvite: { status: noInviteRegistration.status, rowsAdded: noInviteUserCount },
    communityRegistrationWithoutCompany: { status: noCompanyCommunityRegistration.status,
      rowsAdded: communityWithoutCompany.length, accountStatus: communityWithoutCompany[0].account_status,
      companyBlank: communityWithoutCompany[0].company === '' },
    adminMembersAsMember: adminMembersAsMember.status,
    adminMembersAsAdmin: adminMembers.status,
    adminMembersHasCompanyField: adminMemberRows.length > 0 && Object.hasOwn(adminMemberRows[0], 'company'),
    mobileAdminApplications: { databasePendingRows: pendingApplicantDbCount, usersStatus: mobileAdminUserList.status,
      responseHasApplicant: Boolean(pendingApplicantResponse), responseHasAccountStatus: Object.hasOwn(pendingApplicantResponse, 'account_status'),
      mobileFilterPendingRows: mobileAdminPendingRows.length, mobileVisitorPathStatus: mobileVisitorApplications.status,
      adminVisitorPathStatus: adminVisitorApplications.status },
    referralPayloadParity: { mobileStatus: mobileReferral.status, mobileRowsAdded: referralCountAfterMobile - referralCountBefore,
      webStatus: webReferral.status, webRowsAdded: referralCountAfterWeb - referralCountAfterMobile, listStatus: referralList.status },
    championTrigger: { member: memberChampionTrigger.status, admin: adminChampionTrigger.status, firstHandlerMessage: adminChampionBody.message },
    disposableMemberDelete: { member: memberDelete.status, admin: adminDelete.status, remainingRows: deletedUserCount.rows[0].count },
    invitedMemberDelete: { status: invitedMemberDelete.status, memberRowsAfter: invitedMemberAfter, visitorRowsAfter: publicVisitorAfter },
    userGroupsWithoutId: { status: userGroupsWithoutId.status, count: userGroupsWithoutIdBody.length },
    userGroupsOtherId: { status: userGroupsOtherId.status, count: userGroupsOtherIdBody.length },
    adminStatsAsMember: adminStatsAsMember.status,
    adminStatsAsAdmin: adminStats.status,
    adminRouteChecks,
    attendanceList: attendanceList.status,
    eventRegistrationSharedPath: { repeatStatus: repeatRegistration.status, repeatMessage: repeatRegistrationBody.message,
      rowsBefore: registrationCountBefore, rowsAfter: registrationCountAfter,
      missingEventStatus: missingEventRegistration.status, unauthenticatedStatus: unauthenticatedRegistration.status },
    attendanceHasUserNameAlias: Object.hasOwn(attendanceRows[0], 'user_name'),
    reportStats: { status: reportStats.status, visitorConversionRate: reportStatsBody.visitorConversionRate },
    reportCharts: { status: reportCharts.status, revenuePoints: reportChartsBody.revenue?.length,
      growthPoints: reportChartsBody.growth?.length, availability: reportChartsBody.availability,
      unauthenticatedStatus: unauthenticatedCharts.status },
    publicEventList: events.status,
    publicEventCount: publicEvents.length,
    adminEventList: adminEvents.status,
    adminEventCount: allEvents.length,
    notificationList: notificationList.status,
    ownNotificationCount: listedNotifications.length,
    readOne: readOne.status,
    readOneReturnsSuccessOnly: readOneBody.success === true && !Object.hasOwn(readOneBody, 'id'),
    readAll: readAll.status,
    otherUserNotificationUnchanged: !otherRead,
    notificationMigrationVariants: notificationVariants,
    statusConstraintSqlStates: statusResults,
    statusHttpBaseline,
    membershipGateBaseline,
    openPowerTeamBaseline,
    paymentCallbackBaseline,
    inviteVerification,
    groupDetailReadContract,
    professionConflictBaseline,
    capacityBaseline,
    interviewApprovalBaseline,
    placementHistoryBaseline,
    scoreHistoryBaseline,
    monthlyScoreBaseline,
    shuffleApplyBaseline,
    fixtureEventsAfterGet: eventRows.length,
    eventStatusesAfterGet: eventRows.map(row => row.status),
  }, null, 2));
  if (serveForDevice) {
    console.log('Isolated fixture API listening on http://127.0.0.1:4000/api; stop with Ctrl+C.');
    await new Promise(resolve => {
      process.once('SIGINT', resolve);
      process.once('SIGTERM', resolve);
    });
  }
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Isolated smoke failed: ${error.stack || error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
