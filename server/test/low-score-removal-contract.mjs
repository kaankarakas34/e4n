import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-removal-${randomUUID().slice(0, 8)}`;
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
  for (const key of ['SIPAY_API_URL','SIPAY_APP_ID','SIPAY_APP_SECRET','SIPAY_MERCHANT_KEY']) delete process.env[key];
  process.env.VERCEL = '1';
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

  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  const migrationResult = await applyVersionedSchema();
  assert.equal(migrationResult.applied.length, 28, 'Expected 28 migrations applied');

  const { default: app } = await import('../src/index.js');
  const { formatPeriodKey } = await import('../src/utils/scoring.js');

  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const token = (id, role = 'MEMBER') => jwt.sign({ id, role }, process.env.JWT_SECRET);

  const adminId = randomUUID();
  const presidentId = randomUUID();
  const lowScoreMemberId = randomUUID();
  const highScoreMemberId = randomUUID();
  const exemptCandidateId = randomUUID();
  const groupId = randomUUID();
  const currentPeriod = formatPeriodKey(new Date());

  // 1. Create Users
  await pool.query(`
    INSERT INTO users (id, name, email, phone, role, company, profession, account_status, performance_score, performance_color, created_at)
    VALUES 
      ($1, 'Sistem Yöneticisi', 'admin@example.com', '5550000001', 'ADMIN', 'E4N HQ', 'Yönetim', 'ACTIVE', 100, 'GREEN', NOW()),
      ($2, 'Grup Başkanı', 'president@example.com', '5550000002', 'PRESIDENT', 'Liderlik A.Ş.', 'Danışman', 'ACTIVE', 20, 'RED', NOW()),
      ($3, 'Düşük Puanlı Üye', 'low@example.com', '5550000003', 'MEMBER', 'Düşük Ltd.', 'Tasarım', 'ACTIVE', 15, 'RED', NOW()),
      ($4, 'Yüksek Puanlı Üye', 'high@example.com', '5550000004', 'MEMBER', 'Yüksek A.Ş.', 'Yazılım', 'ACTIVE', 90, 'GREEN', NOW()),
      ($5, 'Muaf Tutulacak Üye', 'exempt@example.com', '5550000005', 'MEMBER', 'Muaf Ltd.', 'Mimar', 'ACTIVE', 10, 'RED', NOW())
  `, [adminId, presidentId, lowScoreMemberId, highScoreMemberId, exemptCandidateId]);

  // 2. Create Group & Memberships
  await pool.query(`
    INSERT INTO groups (id, name, status, created_at)
    VALUES ($1, 'Boğaziçi Grubu', 'ACTIVE', NOW())
  `, [groupId]);

  await pool.query(`
    INSERT INTO group_members (group_id, user_id, role, status, joined_at)
    VALUES 
      ($1, $2, 'PRESIDENT', 'ACTIVE', NOW()),
      ($1, $3, 'MEMBER', 'ACTIVE', NOW()),
      ($1, $4, 'MEMBER', 'ACTIVE', NOW()),
      ($1, $5, 'MEMBER', 'ACTIVE', NOW())
  `, [groupId, presidentId, lowScoreMemberId, highScoreMemberId, exemptCandidateId]);

  // 3. Create score activities
  // - High score member: 4 present attendances = 40 pts, 4 completed 1-to-1 = 40 pts = 80 pts
  // - Low score member: 1 present attendance = 10 pts (below 50 threshold)
  // - Exempt member: 1 attendance = 10 pts
  const eventId = randomUUID();
  await pool.query(`
    INSERT INTO events (id, title, created_by, start_at, type)
    VALUES ($1, 'Haftalık Toplantı', $2, NOW() - interval '2 days', 'meeting')
  `, [eventId, adminId]);

  await pool.query(`
    INSERT INTO attendance (id, user_id, event_id, status, created_at)
    VALUES 
      ($1, $2, $5, 'PRESENT', NOW()),
      ($3, $4, $5, 'PRESENT', NOW())
  `, [randomUUID(), lowScoreMemberId, randomUUID(), exemptCandidateId, eventId]);

  for (let i = 0; i < 4; i++) {
    const eId = randomUUID();
    await pool.query(`
      INSERT INTO events (id, title, created_by, start_at, type)
      VALUES ($1, $2, $3, NOW() - interval '2 days', 'meeting')
    `, [eId, `Toplantı ${i}`, adminId]);

    await pool.query(`
      INSERT INTO attendance (id, user_id, event_id, status, created_at)
      VALUES ($1, $2, $3, 'PRESENT', NOW())
    `, [randomUUID(), highScoreMemberId, eId]);

    await pool.query(`
      INSERT INTO one_to_ones (id, requester_id, partner_id, meeting_date, status)
      VALUES ($1, $2, $3, NOW() - interval '1 day', 'COMPLETED')
    `, [randomUUID(), highScoreMemberId, adminId]);
  }

  // --- TEST STEP 1: Unfinalized Period Gate ---
  // Attempting to evaluate or apply removals before finalize-period MUST fail with PERIOD_NOT_FINALIZED (400)
  const evalBeforeFinalRes = await fetch(`${base}/api/reports/low-score-evaluations?periodKey=${currentPeriod}`, {
    headers: { Authorization: `Bearer ${token(adminId, 'ADMIN')}` },
  });
  assert.equal(evalBeforeFinalRes.status, 400, 'Must return 400 when period is not finalized');
  const evalBeforeFinalData = await evalBeforeFinalRes.json();
  assert.equal(evalBeforeFinalData.code, 'PERIOD_NOT_FINALIZED');

  const applyBeforeFinalRes = await fetch(`${base}/api/reports/apply-low-score-removals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(adminId, 'ADMIN')}` },
    body: JSON.stringify({ periodKey: currentPeriod }),
  });
  assert.equal(applyBeforeFinalRes.status, 400, 'Must return 400 when period is not finalized');

  // --- TEST STEP 2: Authorization Barrier ---
  // Normal member must receive 403 Forbidden
  const memberEvalRes = await fetch(`${base}/api/reports/low-score-evaluations?periodKey=${currentPeriod}`, {
    headers: { Authorization: `Bearer ${token(lowScoreMemberId, 'MEMBER')}` },
  });
  assert.equal(memberEvalRes.status, 403, 'Normal member cannot access evaluation endpoint');

  const memberApplyRes = await fetch(`${base}/api/reports/apply-low-score-removals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(lowScoreMemberId, 'MEMBER')}` },
    body: JSON.stringify({ periodKey: currentPeriod }),
  });
  assert.equal(memberApplyRes.status, 403, 'Normal member cannot trigger removal execution');

  // --- TEST STEP 3: Finalize Period ---
  const finalizeRes = await fetch(`${base}/api/reports/finalize-period`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(adminId, 'ADMIN')}` },
    body: JSON.stringify({ period: currentPeriod }),
  });
  assert.equal(finalizeRes.status, 200, 'Period finalization must succeed');
  const finalizeData = await finalizeRes.json();
  assert.equal(finalizeData.isFinalized, true);

  // --- TEST STEP 4: Low-Score Evaluation Preview ---
  const evalRes = await fetch(`${base}/api/reports/low-score-evaluations?periodKey=${currentPeriod}&threshold=50`, {
    headers: { Authorization: `Bearer ${token(adminId, 'ADMIN')}` },
  });
  assert.equal(evalRes.status, 200, 'Admin evaluation preview must succeed');
  const evalData = await evalRes.json();
  assert.equal(evalData.periodKey, currentPeriod);
  assert.equal(evalData.threshold, 50);
  assert.ok(evalData.candidates.length >= 3, 'Should have low score candidates');

  // Check candidates statuses
  const presidentCand = evalData.candidates.find(c => c.userId === presidentId);
  assert.ok(presidentCand, 'President should be in candidate evaluation');
  assert.equal(presidentCand.status, 'EXEMPT_PRESIDENT', 'President must be exempt from auto-removal');
  assert.equal(presidentCand.eligibleForRemoval, false);

  const lowCand = evalData.candidates.find(c => c.userId === lowScoreMemberId);
  assert.ok(lowCand, 'Low score member must be evaluated');
  assert.equal(lowCand.status, 'ELIGIBLE');
  assert.equal(lowCand.eligibleForRemoval, true);
  assert.ok(lowCand.score < 50);

  const highCand = evalData.candidates.find(c => c.userId === highScoreMemberId);
  assert.equal(highCand, undefined, 'High score member must not be in low score candidate list');

  // --- TEST STEP 5: Apply Removals (with exemptUserIds) ---
  const applyRes = await fetch(`${base}/api/reports/apply-low-score-removals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(adminId, 'ADMIN')}` },
    body: JSON.stringify({
      periodKey: currentPeriod,
      threshold: 50,
      exemptUserIds: [exemptCandidateId],
      reasonNote: 'Ekim 2026 dönem sonu otomatik puan değerlendirmesi',
    }),
  });
  assert.equal(applyRes.status, 200, 'Removal application must succeed');
  const applyData = await applyRes.json();
  assert.equal(applyData.success, true);
  assert.equal(applyData.removedCount, 1, 'Only lowScoreMemberId should be removed');
  assert.ok(applyData.skippedCount >= 2, 'President and exempt candidate should be skipped');

  const lowResult = applyData.results.find(r => r.userId === lowScoreMemberId);
  assert.equal(lowResult.action, 'REMOVED');
  assert.equal(lowResult.reasonCategory, 'LOW_SCORE');

  const exemptResult = applyData.results.find(r => r.userId === exemptCandidateId);
  assert.equal(exemptResult.action, 'SKIPPED_EXEMPT');

  const presResult = applyData.results.find(r => r.userId === presidentId);
  assert.equal(presResult.action, 'SKIPPED_EXEMPT_PRESIDENT');

  // --- TEST STEP 6: Verify Database State (R10 & R12 & History) ---
  // 1. lowScoreMemberId is removed from group_members
  const lowMemCheck = await pool.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, lowScoreMemberId]);
  assert.equal(lowMemCheck.rowCount, 0, 'Removed member must no longer be in group_members');

  // 2. R12: users.account_status remains ACTIVE!
  const lowUserCheck = await pool.query('SELECT account_status FROM users WHERE id = $1', [lowScoreMemberId]);
  assert.equal(lowUserCheck.rows[0].account_status, 'ACTIVE', 'R12: Member user account status must remain ACTIVE');

  // 3. President and exempt member remain ACTIVE in group_members
  const presMemCheck = await pool.query('SELECT status FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, presidentId]);
  assert.equal(presMemCheck.rows[0].status, 'ACTIVE');

  const exemptMemCheck = await pool.query('SELECT status FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, exemptCandidateId]);
  assert.equal(exemptMemCheck.rows[0].status, 'ACTIVE');

  // 4. group_membership_history has DELETE with MEMBER_REMOVAL action
  const histCheck = await pool.query(`
    SELECT operation, operation_context FROM group_membership_history 
    WHERE user_id = $1 AND operation = 'DELETE'
  `, [lowScoreMemberId]);
  assert.ok(histCheck.rowCount >= 1, 'group_membership_history must record DELETE operation');
  assert.equal(histCheck.rows[0].operation_context.action, 'MEMBER_REMOVAL');

  // 5. notifications has REMOVAL notification with LOW_SCORE category
  const notifCheck = await pool.query(`
    SELECT type, message FROM notifications WHERE user_id = $1 AND type = 'REMOVAL'
  `, [lowScoreMemberId]);
  assert.equal(notifCheck.rowCount, 1, 'Must have exactly one REMOVAL notification');
  assert.ok(notifCheck.rows[0].message.includes('Puan Düşüklüğü'));
  assert.ok(notifCheck.rows[0].message.includes('LOW_SCORE'));

  // 6. membership-history API exposes LOW_SCORE reason
  const memHistoryRes = await fetch(`${base}/api/admin/membership-history/${lowScoreMemberId}`, {
    headers: { Authorization: `Bearer ${token(adminId, 'ADMIN')}` },
  });
  assert.equal(memHistoryRes.status, 200);
  const memHistoryData = await memHistoryRes.json();
  const deleteEvent = memHistoryData.events.find(e => e.operation === 'DELETE');
  assert.ok(deleteEvent, 'Must have DELETE event in membership history');
  assert.equal(deleteEvent.removal_reason?.category, 'LOW_SCORE');
  assert.equal(deleteEvent.removal_reason?.category_label, 'Puan Düşüklüğü');

  // --- TEST STEP 7: Idempotent Replay (Tekrar Güvenliği) ---
  // Running apply-low-score-removals again with same params must NOT create duplicate removals or duplicate notifications
  const repeatApplyRes = await fetch(`${base}/api/reports/apply-low-score-removals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(adminId, 'ADMIN')}` },
    body: JSON.stringify({ periodKey: currentPeriod, threshold: 50, exemptUserIds: [exemptCandidateId] }),
  });
  assert.equal(repeatApplyRes.status, 200);
  const repeatData = await repeatApplyRes.json();
  assert.equal(repeatData.removedCount, 0, 'Idempotent replay: zero new removals');
  assert.ok(repeatData.skippedCount >= 2, 'Previously removed member and exempt member are skipped');

  // Verify notifications still exactly 1
  const notifRepeatCheck = await pool.query(`
    SELECT count(*)::int as n FROM notifications WHERE user_id = $1 AND type = 'REMOVAL'
  `, [lowScoreMemberId]);
  assert.equal(notifRepeatCheck.rows[0].n, 1, 'No duplicate notifications generated on replay');

  // Verify group_membership_history DELETE events count unchanged
  const histRepeatCheck = await pool.query(`
    SELECT count(*)::int as n FROM group_membership_history WHERE user_id = $1 AND operation = 'DELETE'
  `, [lowScoreMemberId]);
  assert.equal(histRepeatCheck.rows[0].n, 1, 'No duplicate history records generated on replay');

  // --- TEST STEP 8: Traffic-Lights Contract Baseline Preserved ---
  const trafficRes = await fetch(`${base}/api/reports/traffic-lights`, {
    headers: { Authorization: `Bearer ${token(adminId, 'ADMIN')}` },
  });
  assert.equal(trafficRes.status, 200);
  const trafficData = await trafficRes.json();
  assert.ok(Array.isArray(trafficData));
  if (trafficData.length > 0) {
    const first = trafficData[0];
    assert.equal(Object.prototype.hasOwnProperty.call(first, 'month'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(first, 'source'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(first, 'rule_version'), false);
  }

  console.log('Low-Score Removal & Membership History contract PASS: period gate enforced, auth barriers verified, president exempt, LOW_SCORE history & notification logged, R12 user account status preserved, and replay idempotent.');
}

try {
  await main();
} finally {
  if (appServer) {
    await new Promise(resolve => appServer.close(resolve));
  }
  if (pool) {
    await pool.end();
  }
  if (containerStarted) {
    docker(['rm', '-f', container]);
  }
}
