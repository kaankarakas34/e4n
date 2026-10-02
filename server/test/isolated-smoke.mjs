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
  if (firstMigration.applied.length !== 5 || secondMigration.applied.length !== 0) {
    throw new Error('Versioned schema setup did not apply exactly once');
  }
  const migrationCommand = spawnSync(process.execPath, ['src/config/run-versioned-schema.js'], {
    cwd: serverDir, env: process.env, encoding: 'utf8', timeout: 30_000, windowsHide: true,
  });
  if (migrationCommand.status !== 0 || !migrationCommand.stdout.includes('applied=0 total=5')) {
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
  await pool.query("DELETE FROM schema_migrations WHERE version = '0005_public_visitor_inviter'");
  await pool.query('ALTER TABLE public_visitors DROP COLUMN inviter_id');
  const oldVisitorId = randomUUID();
  await pool.query("INSERT INTO public_visitors (id, name) VALUES ($1, 'Existing Fixture Visitor')", [oldVisitorId]);
  const visitorUpgrade = await applyVersionedSchema();
  const oldVisitor = await pool.query('SELECT name, inviter_id FROM public_visitors WHERE id = $1', [oldVisitorId]);
  if (visitorUpgrade.applied.length !== 1 || visitorUpgrade.applied[0] !== '0005_public_visitor_inviter'
      || oldVisitor.rows[0]?.name !== 'Existing Fixture Visitor' || oldVisitor.rows[0].inviter_id !== null) {
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
    if (!legacyAdoption.adoptedLegacyInit || legacyAdoption.applied.length !== 4
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
  const noInviteRegistration = await fetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'No Invite Fixture', email: 'no-invite@example.invalid', password: 'fixture-password', profession: 'Fixture', role: 'MEMBER' }),
    signal: AbortSignal.timeout(10_000),
  });
  const noInviteUserCount = (await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE email = 'no-invite@example.invalid'")).rows[0].count;
  if (noInviteRegistration.status !== 403 || noInviteUserCount !== 0) {
    throw new Error('Active registration invite gate baseline changed');
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
