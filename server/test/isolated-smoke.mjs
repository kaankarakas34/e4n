import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import pg from 'pg';
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
  if (firstMigration.applied.length !== 6 || secondMigration.applied.length !== 0) {
    throw new Error('Versioned schema setup did not apply exactly once');
  }
  const migrationCommand = spawnSync(process.execPath, ['src/config/run-versioned-schema.js'], {
    cwd: serverDir, env: process.env, encoding: 'utf8', timeout: 30_000, windowsHide: true,
  });
  if (migrationCommand.status !== 0 || !migrationCommand.stdout.includes('applied=0 total=6')) {
    throw new Error(`Versioned migration command failed: ${migrationCommand.stderr || migrationCommand.stdout}`);
  }

  const tableResult = await pool.query(`
    SELECT COUNT(*)::int AS count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'
  `);
  const tableCount = tableResult.rows[0].count;
  const postgresVersion = (await pool.query('SHOW server_version')).rows[0].server_version;
  if (tableCount !== 34) throw new Error(`Repository schema bootstrap expected 34 tables, found ${tableCount}`);
  // Rehearse an already-versioned 0001-0004 database with an existing visitor row.
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
  if (visitorUpgrade.applied.length !== 2 || visitorUpgrade.applied[0] !== '0005_public_visitor_inviter'
      || visitorUpgrade.applied[1] !== '0006_registration_consents'
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
    if (!legacyAdoption.adoptedLegacyInit || legacyAdoption.applied.length !== 5
        || legacyRepeat.applied.length !== 0 || legacyTableCount.rows[0].count !== 34 || !legacyRowsPreserved) {
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
  if (Object.values(statusResults).some(code => code !== '23514')) {
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
  if (statusHttpBaseline.groupReject !== 500 || statusHttpBaseline.groupStatusAfterReject !== 'ACTIVE'
      || statusHttpBaseline.powerTeamReject !== 500 || statusHttpBaseline.powerTeamStatusAfterReject !== 'REQUESTED'
      || statusHttpBaseline.moveMember !== 500 || statusHttpBaseline.sourceStatusAfterMove !== 'ACTIVE'
      || statusHttpBaseline.targetRowsAfterMove !== 0 || statusHttpBaseline.visitorConvertAsMember !== 403
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
  if (paymentCallbackBaseline.firstSuccess !== 200 || paymentCallbackBaseline.repeatedSuccess !== 200
      || paymentCallbackBaseline.lateFail !== 200 || !paymentCallbackBaseline.transactionUserMissing
      || paymentCallbackBaseline.transactionAfterFirst !== 'SUCCESS' || paymentCallbackBaseline.membershipPlanAfterFirst !== '1_MONTH'
      || !paymentCallbackBaseline.membershipEndWritten || paymentCallbackBaseline.repeatChangedEnd
      || paymentCallbackBaseline.transactionAfterLateFail !== 'FAILED' || paymentCallbackBaseline.userAfterLateFail !== 'ACTIVE'
      || !paymentCallbackBaseline.membershipEndAfterLateFail) {
    throw new Error(`Payment callback baseline changed: ${JSON.stringify(paymentCallbackBaseline)}`);
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
  await pool.query(
    "INSERT INTO users (id, email, name, profession, password_hash, account_status) VALUES ($1, 'pending-applicant@example.invalid', 'Pending Applicant', 'Fixture', 'not-a-real-password', 'PENDING')",
    [pendingApplicantId],
  );
  const pendingApplicantDbCount = (await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE id = $1 AND account_status = 'PENDING'", [pendingApplicantId])).rows[0].count;
  const mobileAdminUserList = await fetch(`${base}/api/users`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const mobileAdminUserRows = await mobileAdminUserList.json();
  const mobileAdminPendingRows = mobileAdminUserRows.filter(row => row.status === 'PENDING' || row.account_status === 'PENDING');
  const pendingApplicantResponse = mobileAdminUserRows.find(row => row.id === pendingApplicantId);
  const mobileVisitorApplications = await fetch(`${base}/api/public-visitors`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const adminVisitorApplications = await fetch(`${base}/api/admin/public-visitors`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  if (pendingApplicantDbCount !== 1 || mobileAdminUserList.status !== 200 || !pendingApplicantResponse
      || Object.hasOwn(pendingApplicantResponse, 'account_status') || mobileAdminPendingRows.length !== 0
      || mobileVisitorApplications.status !== 404 || adminVisitorApplications.status !== 200) {
    throw new Error('Mobile admin applications field contract baseline changed');
  }
  const referralCountBefore = (await pool.query('SELECT COUNT(*)::int AS count FROM referrals')).rows[0].count;
  const mobileReferral = await fetch(`${base}/api/referrals`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: otherUserId, type: 'INTERNAL', temperature: 'HOT', description: 'Mobile payload fixture' }),
    signal: AbortSignal.timeout(10_000),
  });
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
  if (mobileReferral.status !== 500 || referralCountAfterMobile !== referralCountBefore
      || webReferral.status !== 201 || webReferralBody.receiver_id !== otherUserId
      || referralCountAfterWeb !== referralCountBefore + 1 || referralList.status !== 200
      || !referralRows.some(row => row.id === webReferralBody.id)) {
    throw new Error('Web/mobile referral payload and persistence baseline changed');
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
  const supportCountAfterMobile = (await pool.query('SELECT COUNT(*)::int AS count FROM tickets')).rows[0].count;
  const webTicketCreate = await fetch(`${base}/api/tickets`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Web ticket fixture', message: 'Fixture message' }),
    signal: AbortSignal.timeout(10_000),
  });
  const webTicketBody = await webTicketCreate.json();
  const supportCountAfterWeb = (await pool.query('SELECT COUNT(*)::int AS count FROM tickets')).rows[0].count;
  const mobileAdminSupportList = await fetch(`${base}/api/support`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const webAdminTicketList = await fetch(`${base}/api/tickets`, { headers: adminHeaders, signal: AbortSignal.timeout(10_000) });
  const webAdminTicketRows = await webAdminTicketList.json();
  if (mobileSupportCreate.status !== 404 || supportCountAfterMobile !== supportCountBefore
      || webTicketCreate.status !== 201 || supportCountAfterWeb !== supportCountBefore + 1
      || mobileAdminSupportList.status !== 404 || webAdminTicketList.status !== 200
      || !webAdminTicketRows.some(row => row.id === webTicketBody.id)) {
    throw new Error('Web/mobile support path and persistence baseline changed');
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
  if (registrationCountBefore !== 1 || repeatRegistration.status !== 200 || repeatRegistrationBody.message !== 'Already registered'
      || registrationCountAfter !== 1 || missingEventRegistration.status !== 404 || unauthenticatedRegistration.status !== 401) {
    throw new Error('Common event registration repeat/missing/auth baseline changed');
  }
  const reportStats = await fetch(`${base}/api/reports/stats`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const reportStatsBody = await reportStats.json();
  const reportCharts = await fetch(`${base}/api/reports/charts`, { headers: authHeaders, signal: AbortSignal.timeout(10_000) });
  const reportChartsBody = await reportCharts.json();
  const health = await fetch(`${base}/api/health-check`, { signal: AbortSignal.timeout(10_000) });
  const healthBody = await health.json();
  const events = await fetch(`${base}/api/events`, { signal: AbortSignal.timeout(10_000) });
  const publicEvents = await events.json();
  const adminEvents = await fetch(`${base}/api/events?mode=admin`, { signal: AbortSignal.timeout(10_000) });
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
  if (capacityBaseline.before !== 34 || capacityBaseline.approvals.some(status => status !== 200)
      || capacityBaseline.after !== 36) {
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
  if (interviewApprovalBaseline.memberHttpStatus !== 200 || interviewApprovalBaseline.membershipStatus !== 'ACTIVE') {
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
      || scoreHistoryBaseline.scoreAfterRepeated !== 20 || scoreHistoryBaseline.hasScoreHistoryTable) {
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
    reportCharts: { status: reportCharts.status, revenuePoints: reportChartsBody.revenue?.length },
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
    professionConflictBaseline,
    capacityBaseline,
    interviewApprovalBaseline,
    placementHistoryBaseline,
    scoreHistoryBaseline,
    monthlyScoreBaseline,
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
