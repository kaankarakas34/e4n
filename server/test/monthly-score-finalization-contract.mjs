import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-finalize-${randomUUID().slice(0, 8)}`;
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
  const { calculateMemberScore, formatPeriodKey } = await import('../src/utils/scoring.js');

  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const token = (id, role = 'MEMBER') => jwt.sign({ id, role }, process.env.JWT_SECRET);

  const adminId = randomUUID();
  const member1Id = randomUUID();
  const member2Id = randomUUID();
  const emptyMemberId = randomUUID();
  const currentPeriod = formatPeriodKey(new Date());

  await pool.query(`
    INSERT INTO users (id, email, name, profession, password_hash, role, account_status)
    VALUES 
      ($1, 'admin-p22@test.invalid', 'Admin Leader', 'General Manager', 'pass', 'ADMIN', 'ACTIVE'),
      ($2, 'member1-p22@test.invalid', 'Alice Developer', 'Software Engineer', 'pass', 'MEMBER', 'ACTIVE'),
      ($3, 'member2-p22@test.invalid', 'Bob Designer', 'UI Designer', 'pass', 'MEMBER', 'ACTIVE'),
      ($4, 'empty-p22@test.invalid', 'Charlie Silent', 'Architect', 'pass', 'MEMBER', 'ACTIVE')
  `, [adminId, member1Id, member2Id, emptyMemberId]);

  const adminHeaders = { Authorization: `Bearer ${token(adminId, 'ADMIN')}`, 'Content-Type': 'application/json' };
  const member1Headers = { Authorization: `Bearer ${token(member1Id)}`, 'Content-Type': 'application/json' };
  const member2Headers = { Authorization: `Bearer ${token(member2Id)}`, 'Content-Type': 'application/json' };

  // Setup Activities for member1:
  // - 1 Meeting attendance (PRESENT: 10)
  // - 1 Internal referral (INTERNAL: 10) + SUCCESSFUL (5) = 15
  // - 1 Visitor (ATTENDED: 10)
  // Total member1 = 35
  const evtId = randomUUID();
  await pool.query("INSERT INTO events (id, title, created_by, start_at, type) VALUES ($1, 'Weekly Meeting', $2, NOW() - interval '2 days', 'meeting')", [evtId, adminId]);
  await pool.query("INSERT INTO attendance (user_id, event_id, status, created_at) VALUES ($1, $2, 'PRESENT', NOW() - interval '2 days')", [member1Id, evtId]);
  await pool.query("INSERT INTO referrals (giver_id, receiver_id, type, status, amount, created_at) VALUES ($1, $2, 'INTERNAL', 'SUCCESSFUL', 1000, NOW() - interval '3 days')", [member1Id, member2Id]);
  await pool.query("INSERT INTO visitors (inviter_id, name, status, visited_at) VALUES ($1, 'Guest 1', 'ATTENDED', NOW() - interval '1 day')", [member1Id]);
  await calculateMemberScore(member1Id);

  // Setup Activities for member2:
  // - 1 One-to-One (COMPLETED: 10)
  // Total member2 = 10
  await pool.query("INSERT INTO one_to_ones (requester_id, partner_id, meeting_date, status) VALUES ($1, $2, NOW() - interval '1 day', 'COMPLETED')", [member2Id, member1Id]);
  await calculateMemberScore(member2Id);

  // 1. GET /api/reports/monthly-scores before finalization
  const monthlyBeforeRes = await fetch(`${base}/api/reports/monthly-scores?period=${currentPeriod}`, {
    headers: member1Headers,
  });
  assert.equal(monthlyBeforeRes.status, 200);
  const monthlyBefore = await monthlyBeforeRes.json();
  assert.equal(monthlyBefore.period, currentPeriod);
  assert.equal(monthlyBefore.isFinalized, false);
  assert.equal(monthlyBefore.finalizedAt, null);
  assert.equal(monthlyBefore.ruleVersion, '2026.1');
  assert.ok(monthlyBefore.members.length >= 4);

  // Find Alice (member1) and Bob (member2)
  const aliceBefore = monthlyBefore.members.find(m => m.userId === member1Id);
  const bobBefore = monthlyBefore.members.find(m => m.userId === member2Id);
  const charlieBefore = monthlyBefore.members.find(m => m.userId === emptyMemberId);

  assert.equal(aliceBefore.score, 35);
  assert.equal(aliceBefore.color, 'RED');
  assert.equal(aliceBefore.sources.ATTENDANCE, 10);
  assert.equal(aliceBefore.sources.REFERRAL, 15);
  assert.equal(aliceBefore.sources.VISITOR, 10);

  assert.equal(bobBefore.score, 10);
  assert.equal(bobBefore.sources.ONE_TO_ONE, 10);

  assert.equal(charlieBefore.score, 0);
  assert.equal(charlieBefore.color, 'GREY');

  // Verify sort order: Alice (35) comes before Bob (10)
  const aliceIndex = monthlyBefore.members.findIndex(m => m.userId === member1Id);
  const bobIndex = monthlyBefore.members.findIndex(m => m.userId === member2Id);
  assert.ok(aliceIndex < bobIndex, 'Higher score member must appear before lower score member');

  // 2. Reasoned Score Adjustment (POST /api/reports/score-adjustment)
  // Member trying to adjust -> 403
  const forbiddenAdj = await fetch(`${base}/api/reports/score-adjustment`, {
    method: 'POST',
    headers: member1Headers,
    body: JSON.stringify({ userId: member2Id, period: currentPeriod, points: 20, reason: 'İzinsiz deneme' }),
  });
  assert.equal(forbiddenAdj.status, 403);

  // Admin trying invalid reason (empty or short) -> 400
  const invalidAdj = await fetch(`${base}/api/reports/score-adjustment`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ userId: member2Id, period: currentPeriod, points: 20, reason: 'x' }),
  });
  assert.equal(invalidAdj.status, 400);

  // Admin applying valid adjustment (+15 for organizing committee) -> 200
  const validAdjRes = await fetch(`${base}/api/reports/score-adjustment`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      userId: member2Id,
      period: currentPeriod,
      points: 15,
      reason: 'Yıllık zirve organizasyon komitesi liderliği katkısı',
    }),
  });
  assert.equal(validAdjRes.status, 200);
  const validAdjData = await validAdjRes.json();
  assert.equal(validAdjData.adjustment.points, 15);
  assert.equal(validAdjData.updatedScore.score, 25); // 10 + 15 = 25

  // 3. Finalize Period (POST /api/reports/finalize-period)
  // Member trying to finalize -> 403
  const forbiddenFinalize = await fetch(`${base}/api/reports/finalize-period`, {
    method: 'POST',
    headers: member1Headers,
    body: JSON.stringify({ period: currentPeriod }),
  });
  assert.equal(forbiddenFinalize.status, 403);

  // Admin finalizes -> 200
  const firstFinalizeRes = await fetch(`${base}/api/reports/finalize-period`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ period: currentPeriod }),
  });
  assert.equal(firstFinalizeRes.status, 200);
  const firstFinalizeData = await firstFinalizeRes.json();
  assert.equal(firstFinalizeData.isFinalized, true);
  assert.equal(firstFinalizeData.isAlreadyFinalized, false);
  assert.ok(firstFinalizeData.finalizedAt);
  assert.equal(firstFinalizeData.periodKey, currentPeriod);

  // Verify Alice and Bob scores in finalization snapshot
  const aliceFinal = firstFinalizeData.members.find(m => m.userId === member1Id);
  const bobFinal = firstFinalizeData.members.find(m => m.userId === member2Id);
  assert.equal(aliceFinal.score, 35);
  assert.equal(bobFinal.score, 25); // 10 (oto) + 15 (adjustment) = 25
  assert.equal(bobFinal.sources.ADJUSTMENT, 15);

  // Idempotency: Repeating finalization call MUST NOT change result!
  const repeatFinalizeRes = await fetch(`${base}/api/reports/finalize-period`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ period: currentPeriod }),
  });
  assert.equal(repeatFinalizeRes.status, 200);
  const repeatFinalizeData = await repeatFinalizeRes.json();
  assert.equal(repeatFinalizeData.isAlreadyFinalized, true);
  assert.equal(repeatFinalizeData.finalizedAt, firstFinalizeData.finalizedAt, 'Finalized timestamp must remain unchanged');
  assert.deepEqual(repeatFinalizeData.summary, firstFinalizeData.summary, 'Summary must remain identical on replay');

  // 4. GET /api/reports/monthly-scores after finalization -> must return finalized state
  const monthlyAfterRes = await fetch(`${base}/api/reports/monthly-scores?period=${currentPeriod}`, {
    headers: member1Headers,
  });
  assert.equal(monthlyAfterRes.status, 200);
  const monthlyAfter = await monthlyAfterRes.json();
  assert.equal(monthlyAfter.isFinalized, true);
  assert.equal(monthlyAfter.finalizedAt, firstFinalizeData.finalizedAt);

  // 5. Member Scorecard (GET /api/reports/scorecard/:userId)
  // Member1 querying own scorecard via /me -> 200
  const myScorecardRes = await fetch(`${base}/api/reports/scorecard/me`, {
    headers: member1Headers,
  });
  assert.equal(myScorecardRes.status, 200);
  const myScorecard = await myScorecardRes.json();
  assert.equal(myScorecard.userId, member1Id);
  assert.equal(myScorecard.currentScore, 35);
  assert.equal(myScorecard.currentColor, 'RED');
  assert.ok(Array.isArray(myScorecard.periodsTrend));
  assert.ok(myScorecard.periodsTrend.length >= 1);
  const currentTrend = myScorecard.periodsTrend.find(p => p.period === currentPeriod);
  assert.equal(currentTrend.score, 35);
  assert.equal(currentTrend.isFinalized, true);

  // Member1 querying Bob's scorecard -> 403
  const forbiddenScorecard = await fetch(`${base}/api/reports/scorecard/${member2Id}`, {
    headers: member1Headers,
  });
  assert.equal(forbiddenScorecard.status, 403);

  // Admin querying Bob's scorecard -> 200
  const adminScorecardRes = await fetch(`${base}/api/reports/scorecard/${member2Id}`, {
    headers: adminHeaders,
  });
  assert.equal(adminScorecardRes.status, 200);
  const bobScorecard = await adminScorecardRes.json();
  assert.equal(bobScorecard.userId, member2Id);
  assert.equal(bobScorecard.currentScore, 25);
  assert.equal(bobScorecard.sourcesSummary.ADJUSTMENT, 15);

  // 6. Confirm traffic-lights contract unchanged
  const trafficLights = await fetch(`${base}/api/reports/traffic-lights`, {
    headers: member1Headers,
  });
  assert.equal(trafficLights.status, 200);
  const trafficLightRows = await trafficLights.json();
  const aliceRow = trafficLightRows.find(r => r.id === member1Id);
  assert.ok(aliceRow);
  assert.equal(Object.hasOwn(aliceRow, 'month'), false);
  assert.equal(Object.hasOwn(aliceRow, 'source'), false);
  assert.equal(Object.hasOwn(aliceRow, 'rule_version'), false);

  console.log('Monthly Score Finalization & Leaderboard contract PASS: period finalization idempotent replay, reasoned score adjustment, leaderboards, member scorecard, authorization barriers, and traffic-lights baseline preserved.');
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Monthly score finalization contract failed: ${error.stack || error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
