import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(serverDir, '..');
const container = `e4n-p34-jobs-${randomUUID().slice(0, 8)}`;
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
  process.env.VERCEL = '1';
  process.env.JWT_SECRET = 'isolated_fixture_signing_key_p34';

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

  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  const migrationResult = await applyVersionedSchema();
  assert.equal(migrationResult.applied.length, 28, 'All 28 versioned migrations must apply cleanly');
  assert.equal((await applyVersionedSchema()).applied.length, 0, 'Re-running migrations must be idempotent (0 applied)');

  const tablesCount = (await pool.query(`
    SELECT count(*)::int AS count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'
  `)).rows[0].count;
  assert.equal(tablesCount, 50, 'Table invariant must remain 50 application tables');

  const { runAuditedWebJob, jobNames, manualJobs } = await import('../src/web-job-operations.js');
  assert.deepEqual(jobNames, ['event-completion', 'subscription-reminders', 'champion-calculation']);
  assert.deepEqual(manualJobs, ['event-completion', 'subscription-reminders']);

  const [adminId, memberId, overdueId, pastEventId] = Array.from({ length: 4 }, () => randomUUID());

  await pool.query(`
    INSERT INTO users(id, email, name, profession, password_hash, role, account_status, subscription_end_date)
    VALUES
      ($1, 'admin@example.invalid', 'Admin Fixture', 'Yönetici', 'x', 'ADMIN', 'ACTIVE', now() + interval '30 days'),
      ($2, 'member@example.invalid', 'Member Remind Fixture', 'Mimar', 'x', 'MEMBER', 'ACTIVE', now() + interval '3 days'),
      ($3, 'overdue@example.invalid', 'Overdue Member Fixture', 'Avukat', 'x', 'MEMBER', 'ACTIVE', now() - interval '5 days')
  `, [adminId, memberId, overdueId]);

  await pool.query(`
    INSERT INTO events(id, title, start_at, end_at, status, is_public, type, created_by)
    VALUES ($1, 'Geçmiş Etkinlik', now() - interval '2 days', now() - interval '1 day', 'PUBLISHED', true, 'meeting', $2)
  `, [pastEventId, adminId]);

  // 1. Target Job 1: event-completion
  const eventJobResult = await runAuditedWebJob(pool, { job: 'event-completion', source: 'ADMIN' });
  assert.equal(eventJobResult.state, 'SUCCESS');
  assert.equal(eventJobResult.summary.changed, 1);
  const updatedEvent = (await pool.query('SELECT status FROM events WHERE id = $1', [pastEventId])).rows[0];
  assert.equal(updatedEvent.status, 'COMPLETED');

  // 2. Target Job 2: subscription-reminders (D07 restriction on day -5 and overdue sweep)
  let fakeMailsSent = 0;
  const reminderResult = await runAuditedWebJob(pool, {
    job: 'subscription-reminders',
    source: 'ADMIN',
    sendMail: async () => {
      fakeMailsSent++;
      return { success: true };
    }
  });
  assert.equal(reminderResult.state, 'SUCCESS');
  assert.ok(reminderResult.summary.claimed >= 2);
  assert.equal(reminderResult.summary.emailsSent, fakeMailsSent);

  // Overdue user must have transitioned from ACTIVE to RESTRICTED (D07 rule)
  const overdueDb = (await pool.query('SELECT account_status FROM users WHERE id = $1', [overdueId])).rows[0];
  assert.equal(overdueDb.account_status, 'RESTRICTED', 'User overdue by 5 days must be RESTRICTED (D07)');

  // Member with 3 days left must have delivery record and SYSTEM notification
  const memberDeliveries = (await pool.query('SELECT trigger_days, delivery_state FROM subscription_reminder_deliveries WHERE user_id = $1', [memberId])).rows;
  assert.equal(memberDeliveries.length, 1);
  assert.equal(memberDeliveries[0].trigger_days, 3);
  assert.equal(memberDeliveries[0].delivery_state, 'SENT');

  // Idempotent re-run on same day claims 0 new deliveries
  const reminderReplay = await runAuditedWebJob(pool, { job: 'subscription-reminders', source: 'ADMIN' });
  assert.equal(reminderReplay.summary.claimed, 0);

  // 3. Target Job 3: champion-calculation (Default window calculation & Period calculation)
  await pool.query(`
    INSERT INTO referrals(id, giver_id, receiver_id, status, amount, created_at)
    VALUES ($1, $2, $3, 'SUCCESSFUL', 5000, now() - interval '2 days')
  `, [randomUUID(), memberId, adminId]);

  const championResult = await runAuditedWebJob(pool, { job: 'champion-calculation', source: 'SCHEDULE' });
  assert.equal(championResult.state, 'SUCCESS');
  assert.ok(championResult.summary.inserted >= 1);
  assert.equal(championResult.summary.periodType, 'WEEK');

  // Idempotent replay for same period
  const championReplay = await runAuditedWebJob(pool, {
    job: 'champion-calculation',
    source: 'SCHEDULE',
    championOptions: {
      periodType: 'WEEK',
      startDate: championResult.summary.startDate,
      endDate: championResult.summary.endDate,
      runDate: new Date().toISOString().slice(0, 10),
    }
  });
  assert.equal(championReplay.state, 'SKIPPED');
  assert.ok(championReplay.summary.existing >= 0);

  // 4. Session Advisory Lock Concurrency
  let finishJob, startJob;
  const runningPromise = new Promise(r => startJob = r);
  const holdPromise = new Promise(r => finishJob = r);

  const concurrentJob1 = runAuditedWebJob(pool, {
    job: 'event-completion',
    execute: async () => {
      startJob();
      await holdPromise;
      return { status: 'SUCCESS', changed: 0 };
    }
  });
  await runningPromise;

  const concurrentJob2 = await runAuditedWebJob(pool, {
    job: 'event-completion',
    execute: async () => {
      throw new Error('Concurrent job must not execute while lock is held');
    }
  });
  assert.equal(concurrentJob2.state, 'SKIPPED', 'Concurrent job invocation must be SKIPPED due to lock');

  finishJob();
  const concurrent1Result = await concurrentJob1;
  assert.equal(concurrent1Result.state, 'SUCCESS');

  // 5. Express App Setup & Admin Web Jobs APIs
  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const baseUrl = `http://127.0.0.1:${appServer.address().port}`;

  const token = id => jwt.sign({ id, role: 'ADMIN' }, process.env.JWT_SECRET);
  const getAdminJobs = (q = '') => fetch(`${baseUrl}/api/admin/web-jobs${q}`, {
    headers: { Authorization: `Bearer ${token(adminId)}` }
  });
  const getHealth = () => fetch(`${baseUrl}/api/admin/web-jobs/health`, {
    headers: { Authorization: `Bearer ${token(adminId)}` }
  });
  const recoverStaleRuns = () => fetch(`${baseUrl}/api/admin/web-jobs/stale-runs/recover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token(adminId)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Verify Admin Jobs list & Initial Health
  const initialJobsRes = await getAdminJobs();
  assert.equal(initialJobsRes.status, 200);
  const initialJobsData = await initialJobsRes.json();
  assert.ok(Array.isArray(initialJobsData.manualJobs));
  assert.equal(initialJobsData.manualJobs.length, 2);
  assert.equal(initialJobsData.health.status, 'HEALTHY');
  assert.equal(initialJobsData.health.staleRunningCount, 0);

  // 6. Stale RUNNING Detection & Health Alerts
  const staleRunId = randomUUID();
  await pool.query(`
    INSERT INTO web_job_runs(id, job, source, state, started_at)
    VALUES ($1, 'event-completion', 'SCHEDULE', 'RUNNING', now() - interval '20 minutes')
  `, [staleRunId]);

  const healthRes = await getHealth();
  assert.equal(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.equal(healthData.status, 'CRITICAL', 'Stale RUNNING run (>15 min) must trigger CRITICAL health status');
  assert.equal(healthData.staleRunningCount, 1);
  assert.ok(healthData.alerts.some(a => a.code === 'STALE_RUNNING_JOB' && a.runId === staleRunId));

  // Recover Stale Runs
  const recoverRes = await recoverStaleRuns();
  assert.equal(recoverRes.status, 200);
  const recoverData = await recoverRes.json();
  assert.equal(recoverData.recoveredCount, 1);

  const staleDbRow = (await pool.query('SELECT state, error_code FROM web_job_runs WHERE id = $1', [staleRunId])).rows[0];
  assert.equal(staleDbRow.state, 'UNKNOWN');
  assert.equal(staleDbRow.error_code, 'STALE_TIMEOUT');

  const recoveredHealthRes = await getHealth();
  const recoveredHealthData = await recoveredHealthRes.json();
  assert.equal(recoveredHealthData.staleRunningCount, 0);

  // 7. External CRON endpoint with CRON_SECRET & Bearer Authentication
  process.env.WEB_JOB_INVOCATION_ENABLED = 'true';
  process.env.CRON_SECRET = 'isolated_secret_for_cron_with_32_characters_minimum';

  const cronReq = (path, authHeader, method = 'GET') => fetch(`${baseUrl}/api/cron/web-jobs/${path}`, {
    method,
    headers: authHeader ? { Authorization: authHeader } : {}
  });

  assert.equal((await cronReq('event-completion', null)).status, 401, 'Unauthenticated cron call must return 401');
  assert.equal((await cronReq('event-completion', 'Bearer invalid_token')).status, 401, 'Invalid Bearer token must return 401');
  assert.equal((await cronReq('event-completion', `Bearer ${process.env.CRON_SECRET}`, 'HEAD')).status, 400, 'Non-GET method must return 400');
  assert.equal((await cronReq('event-completion?foo=bar', `Bearer ${process.env.CRON_SECRET}`)).status, 400, 'Query params on cron must return 400');
  assert.equal((await cronReq('champion-calculation', `Bearer ${process.env.CRON_SECRET}`)).status, 400, 'Champion external invocation must be rejected with 400');
  assert.equal((await cronReq('non-existent-job', `Bearer ${process.env.CRON_SECRET}`)).status, 400, 'Unknown cron job must return 400');

  const validCronRes = await cronReq('event-completion', `Bearer ${process.env.CRON_SECRET}`);
  assert.equal(validCronRes.status, 200, 'Authorized external cron call must succeed with 200');
  const validCronData = await validCronRes.json();
  assert.equal(validCronData.job, 'event-completion');
  assert.equal(validCronData.state, 'SUCCESS');

  // 8. Vercel Crons Configuration Validation
  const vercelJsonPath = path.join(repoRoot, 'vercel.json');
  const vercelConfig = JSON.parse(readFileSync(vercelJsonPath, 'utf8'));
  assert.ok(Array.isArray(vercelConfig.crons), 'vercel.json must define crons array');
  assert.equal(vercelConfig.crons.length, 2, 'vercel.json must define exactly 2 external scheduled jobs');
  const configuredPaths = vercelConfig.crons.map(c => c.path);
  assert.ok(configuredPaths.includes('/api/cron/web-jobs/event-completion'));
  assert.ok(configuredPaths.includes('/api/cron/web-jobs/subscription-reminders'));

  for (const cronItem of vercelConfig.crons) {
    assert.ok(typeof cronItem.path === 'string' && cronItem.path.startsWith('/api/cron/web-jobs/'));
    assert.ok(typeof cronItem.schedule === 'string' && cronItem.schedule.trim().length > 0);
  }

  console.log('Target rules and scheduler contract PASS: 28 migrations applied, 50 tables intact, event completion verified, D07 subscription reminder & restriction verified, champion calculation default window & replay verified, advisory lock concurrency verified, stale RUNNING detected & recovered, CRON_SECRET Bearer authenticated, vercel.json crons verified.');
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error('Target rules and scheduler contract failed:', error);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try {
      docker(['stop', '--time', '3', container], { timeout: 15_000 });
    } catch (error) {
      exitCode = 1;
      console.error(error.message);
    }
  }
  process.exit(exitCode);
}
