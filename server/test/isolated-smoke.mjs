import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-isolated-${randomUUID().slice(0, 8)}`;
const dbName = 'e4n_isolated_test';
const dbUser = 'e4n_isolated_test';
const dbPassword = 'local_fixture_only';
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

  const sourceSql = readFileSync(path.join(serverDir, 'init.sql'), 'utf8');
  const seedMarker = '-- SEED DATA (Örnek Veriler)';
  if (!sourceSql.includes(seedMarker)) throw new Error('init.sql seed boundary was not found');
  const initSql = sourceSql.split(seedMarker)[0];
  docker(['exec', '-i', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', dbUser, '-d', dbName], {
    input: initSql, timeout: 60_000,
  });

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

  ({ default: pool } = await import('../src/config/db.js'));
  const { runMigrations } = await import('../src/config/migrate.js');
  await runMigrations();
  await runMigrations(); // Reapplying the existing schema setup must remain safe.

  const tableResult = await pool.query(`
    SELECT COUNT(*)::int AS count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  const tableCount = tableResult.rows[0].count;
  const postgresVersion = (await pool.query('SHOW server_version')).rows[0].server_version;
  if (tableCount < 30) throw new Error(`Repository schema bootstrap is incomplete: ${tableCount} tables`);

  const userId = randomUUID();
  const groupId = randomUUID();
  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, profession, role)
     VALUES ($1, 'fixture@example.invalid', 'not-a-real-password', 'Fixture Member', 'Fixture Profession', 'MEMBER')`,
    [userId],
  );
  await pool.query(`INSERT INTO groups (id, name, status) VALUES ($1, 'Fixture Group', 'ACTIVE')`, [groupId]);
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

  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;
  const health = await fetch(`${base}/api/health-check`, { signal: AbortSignal.timeout(10_000) });
  const healthBody = await health.json();
  const events = await fetch(`${base}/api/events`, { signal: AbortSignal.timeout(10_000) });
  const publicEvents = await events.json();
  const adminEvents = await fetch(`${base}/api/events?mode=admin`, { signal: AbortSignal.timeout(10_000) });
  const allEvents = await adminEvents.json();
  const eventRows = (await pool.query('SELECT title, status FROM events ORDER BY title')).rows;

  if (health.status !== 200 || healthBody.dbAttempt !== 'success') throw new Error('Isolated API health check failed');
  if (events.status !== 200 || publicEvents.length !== 1 || publicEvents[0].title !== 'Future Fixture Event') {
    throw new Error(`Public event list did not filter as expected: ${events.status}`);
  }
  if (adminEvents.status !== 200 || allEvents.length !== 3) throw new Error('Admin event list did not return all fixtures');
  if (eventRows.length !== 3 || eventRows.find(row => row.title === 'Past Fixture Event')?.status !== 'PUBLISHED'
      || eventRows.find(row => row.title === 'Draft Fixture Event')?.status !== 'DRAFT') {
    throw new Error('GET /api/events changed fixture event statuses');
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
  console.log(JSON.stringify({
    isolated: true,
    postgresImage: 'postgres:17',
    postgresVersion,
    sourceTables: tableCount,
    migrationRuns: 2,
    migrationFailureCode,
    localCompatibilityShim: null,
    apiHealth: health.status,
    publicEventList: events.status,
    publicEventCount: publicEvents.length,
    adminEventList: adminEvents.status,
    adminEventCount: allEvents.length,
    inactiveStatusSqlState: inactiveSqlState,
    fixtureEventsAfterGet: eventRows.length,
    eventStatusesAfterGet: eventRows.map(row => row.status),
  }, null, 2));
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
