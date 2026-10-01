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
  const { runMigrations } = await import('../src/config/migrate.js');
  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  const firstMigration = await applyVersionedSchema();
  const secondMigration = await applyVersionedSchema();
  if (firstMigration.applied.length !== 4 || secondMigration.applied.length !== 0) {
    throw new Error('Versioned schema setup did not apply exactly once');
  }

  const tableResult = await pool.query(`
    SELECT COUNT(*)::int AS count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'
  `);
  const tableCount = tableResult.rows[0].count;
  const postgresVersion = (await pool.query('SHOW server_version')).rows[0].server_version;
  if (tableCount !== 34) throw new Error(`Repository schema bootstrap expected 34 tables, found ${tableCount}`);
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
    if (!legacyAdoption.adoptedLegacyInit || legacyAdoption.applied.length !== 3
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
  const attendanceList = await fetch(`${base}/api/events/${futureEventId}/attendance`, {
    headers: authHeaders, signal: AbortSignal.timeout(10_000),
  });
  const attendanceRows = await attendanceList.json();
  if (attendanceList.status !== 200 || attendanceRows.length !== 2) {
    throw new Error(`Event attendance route baseline changed: ${attendanceList.status}`);
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
    checksumGuard,
    existingSchemaGuard,
    legacyDriftGuard,
    legacyAdoption: legacyAdoption?.applied,
    legacyRepeatAppliedVersions: legacyRepeat?.applied.length,
    legacyRowsPreserved,
    migrationFailureCode,
    localCompatibilityShim: null,
    apiHealth: health.status,
    fixtureLogin: login.status,
    fixtureAdminLogin: adminLogin.status,
    adminMembersAsMember: adminMembersAsMember.status,
    adminMembersAsAdmin: adminMembers.status,
    adminMembersHasCompanyField: adminMemberRows.length > 0 && Object.hasOwn(adminMemberRows[0], 'company'),
    userGroupsWithoutId: { status: userGroupsWithoutId.status, count: userGroupsWithoutIdBody.length },
    userGroupsOtherId: { status: userGroupsOtherId.status, count: userGroupsOtherIdBody.length },
    adminStatsAsMember: adminStatsAsMember.status,
    adminStatsAsAdmin: adminStats.status,
    attendanceList: attendanceList.status,
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
  console.error(`Isolated smoke failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
