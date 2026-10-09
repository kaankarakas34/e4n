import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-score-ledger-${randomUUID().slice(0, 8)}`;
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
  const { calculateMemberScore, getScoreLedger, reconcileUserScore, SCORE_RULES } = await import('../src/utils/scoring.js');

  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const token = (id, role = 'MEMBER') => jwt.sign({ id, role }, process.env.JWT_SECRET);

  const memberId = randomUUID();
  const partnerId = randomUUID();
  const adminId = randomUUID();
  const legacyUserId = randomUUID();

  await pool.query(`
    INSERT INTO users (id, email, name, profession, password_hash, role)
    VALUES 
      ($1, 'member@test.invalid', 'Score Member', 'Consultant', 'pass', 'MEMBER'),
      ($2, 'partner@test.invalid', 'Partner Member', 'Lawyer', 'pass', 'MEMBER'),
      ($3, 'admin@test.invalid', 'Admin Member', 'Director', 'pass', 'ADMIN'),
      ($4, 'legacy@test.invalid', 'Legacy Member', 'Architect', 'pass', 'MEMBER')
  `, [memberId, partnerId, adminId, legacyUserId]);

  // Set initial performance scores
  await pool.query('UPDATE users SET performance_score = NULL, performance_color = NULL WHERE id = $1', [memberId]);
  await pool.query('UPDATE users SET performance_score = 40, performance_color = \'RED\' WHERE id = $1', [legacyUserId]);

  const memberHeaders = { Authorization: `Bearer ${token(memberId)}`, 'Content-Type': 'application/json' };
  const adminHeaders = { Authorization: `Bearer ${token(adminId, 'ADMIN')}`, 'Content-Type': 'application/json' };
  const partnerHeaders = { Authorization: `Bearer ${token(partnerId)}`, 'Content-Type': 'application/json' };

  // 1. Initial State: Empty Ledger & Reconciliation
  const initialReconcile = await reconcileUserScore(memberId);
  assert.equal(initialReconcile.liveScore, null);
  assert.equal(initialReconcile.ledgerScore, 0);
  assert.equal(initialReconcile.reconciled, true);
  assert.equal(initialReconcile.drift, 0);
  assert.equal(initialReconcile.activeEventsCount, 0);

  // Legacy user reconciliation (has legacy score 40, but 0 activities -> NOT reconciled, drift = 40, unreconciledLegacyScore = 40, NO fake events!)
  const legacyReconcile = await reconcileUserScore(legacyUserId);
  assert.equal(legacyReconcile.liveScore, 40);
  assert.equal(legacyReconcile.ledgerScore, 0);
  assert.equal(legacyReconcile.reconciled, false);
  assert.equal(legacyReconcile.drift, 40);
  assert.equal(legacyReconcile.unreconciledLegacyScore, 40);
  assert.equal(legacyReconcile.activeEventsCount, 0);

  // 2. Add Attendance (PRESENT: +10, REGISTERED: 0)
  const eventId1 = randomUUID();
  const eventId2 = randomUUID();
  await pool.query(`
    INSERT INTO events (id, title, created_by, start_at, type)
    VALUES 
      ($1, 'Meeting 1', $2, NOW() - interval '2 days', 'meeting'),
      ($3, 'Meeting 2', $2, NOW() - interval '1 day', 'meeting')
  `, [eventId1, adminId, eventId2]);

  const attIdPresent = randomUUID();
  const attIdRegistered = randomUUID();
  await pool.query(`
    INSERT INTO attendance (id, user_id, event_id, status, created_at)
    VALUES 
      ($1, $2, $3, 'PRESENT', NOW() - interval '2 days'),
      ($4, $2, $5, 'REGISTERED', NOW() - interval '1 day')
  `, [attIdPresent, memberId, eventId1, attIdRegistered, eventId2]);

  // Calculate score after attendance
  const scoreAfterAtt = await calculateMemberScore(memberId);
  assert.equal(scoreAfterAtt.score, 10);
  assert.equal(scoreAfterAtt.color, 'GREY');
  assert.equal(scoreAfterAtt.eventsCount, 1, 'REGISTERED status must not produce a score event');

  // 3. Add Internal Referral (INTERNAL: +10)
  const refId = randomUUID();
  await pool.query(`
    INSERT INTO referrals (id, giver_id, receiver_id, type, status, created_at)
    VALUES ($1, $2, $3, 'INTERNAL', 'PENDING', NOW() - interval '3 days')
  `, [refId, memberId, partnerId]);

  const scoreAfterRef = await calculateMemberScore(memberId);
  assert.equal(scoreAfterRef.score, 20); // 10 (att) + 10 (ref) = 20

  // 4. Mark Referral SUCCESSFUL (+5 extra bonus)
  await pool.query(`
    UPDATE referrals SET status = 'SUCCESSFUL', amount = 500 WHERE id = $1
  `, [refId]);

  const scoreAfterSuccess = await calculateMemberScore(memberId);
  assert.equal(scoreAfterSuccess.score, 25); // 20 + 5 = 25

  // 5. Add Visitors via POST /api/visitors with Idempotency Key (id)
  const visitorId = randomUUID();
  const visitorBody = {
    id: visitorId,
    name: 'Idempotent Visitor',
    email: 'visitor1@test.invalid',
    visitedAt: new Date().toISOString(),
    status: 'ATTENDED',
  };

  const firstVisitorRes = await fetch(`${base}/api/visitors`, {
    method: 'POST',
    headers: memberHeaders,
    body: JSON.stringify(visitorBody),
  });
  assert.equal(firstVisitorRes.status, 201);

  const memberScoreAfterFirstVisitor = (await pool.query('SELECT performance_score FROM users WHERE id = $1', [memberId])).rows[0].performance_score;
  assert.equal(memberScoreAfterFirstVisitor, 35); // 25 + 10 = 35 ('RED')

  // Repeat the exact same POST /api/visitors with the same id -> must return 200, must NOT increase score!
  const repeatedVisitorRes = await fetch(`${base}/api/visitors`, {
    method: 'POST',
    headers: memberHeaders,
    body: JSON.stringify(visitorBody),
  });
  assert.equal(repeatedVisitorRes.status, 200);

  const memberScoreAfterRepeatedVisitor = (await pool.query('SELECT performance_score FROM users WHERE id = $1', [memberId])).rows[0].performance_score;
  assert.equal(memberScoreAfterRepeatedVisitor, 35, 'Repeated visitor with same id must not produce duplicate score');

  // 6. Add One-to-One (+10)
  const otoId = randomUUID();
  await pool.query(`
    INSERT INTO one_to_ones (id, requester_id, partner_id, meeting_date, status)
    VALUES ($1, $2, $3, NOW() - interval '1 day', 'COMPLETED')
  `, [otoId, memberId, partnerId]);

  const finalCalc = await calculateMemberScore(memberId);
  assert.equal(finalCalc.score, 45); // 35 + 10 = 45 ('RED')
  assert.equal(finalCalc.color, 'RED');

  // 7. Verify Score Ledger via API: GET /api/reports/score-ledger
  const ledgerRes = await fetch(`${base}/api/reports/score-ledger`, {
    headers: memberHeaders,
  });
  assert.equal(ledgerRes.status, 200);
  const ledger = await ledgerRes.json();
  assert.equal(ledger.userId, memberId);
  assert.equal(ledger.totalScore, 45);
  assert.equal(ledger.color, 'RED');
  assert.equal(ledger.ruleVersion, '2026.1');
  assert.equal(ledger.eventsCount, 5); // 1 att, 1 ref base, 1 ref success, 1 vis, 1 oto

  // Check event sources
  assert.equal(ledger.bySource.ATTENDANCE, 10);
  assert.equal(ledger.bySource.REFERRAL, 15); // 10 base + 5 success
  assert.equal(ledger.bySource.VISITOR, 10);
  assert.equal(ledger.bySource.ONE_TO_ONE, 10);

  // Deduplication check: each event in events array has unique idempotencyKey
  const keys = ledger.events.map(e => e.idempotencyKey);
  assert.equal(new Set(keys).size, keys.length, 'Every event must have unique idempotencyKey');

  // 8. Verify Score Reconciliation via API: GET /api/reports/score-reconciliation
  const reconRes = await fetch(`${base}/api/reports/score-reconciliation`, {
    headers: memberHeaders,
  });
  assert.equal(reconRes.status, 200);
  const recon = await reconRes.json();
  assert.equal(recon.userId, memberId);
  assert.equal(recon.liveScore, 45);
  assert.equal(recon.ledgerScore, 45);
  assert.equal(recon.reconciled, true);
  assert.equal(recon.drift, 0);
  assert.equal(recon.unreconciledLegacyScore, 0);
  assert.equal(recon.activeEventsCount, 5);

  // 9. Authorization checks
  // Normal member trying to inspect other member's ledger -> 403
  const forbiddenLedger = await fetch(`${base}/api/reports/score-ledger?userId=${legacyUserId}`, {
    headers: memberHeaders,
  });
  assert.equal(forbiddenLedger.status, 403);

  // Admin inspecting member's ledger -> 200
  const adminInspectLedger = await fetch(`${base}/api/reports/score-ledger?userId=${memberId}`, {
    headers: adminHeaders,
  });
  assert.equal(adminInspectLedger.status, 200);
  const adminLedger = await adminInspectLedger.json();
  assert.equal(adminLedger.totalScore, 45);

  // Admin inspecting legacy member's reconciliation -> 200 with drift
  const adminLegacyRecon = await fetch(`${base}/api/reports/score-reconciliation?userId=${legacyUserId}`, {
    headers: adminHeaders,
  });
  assert.equal(adminLegacyRecon.status, 200);
  const legacyReconData = await adminLegacyRecon.json();
  assert.equal(legacyReconData.reconciled, false);
  assert.equal(legacyReconData.unreconciledLegacyScore, 40);

  // 10. Verify GET /api/reports/traffic-lights contract is intact
  const trafficLightsRes = await fetch(`${base}/api/reports/traffic-lights`, {
    headers: memberHeaders,
  });
  assert.equal(trafficLightsRes.status, 200);
  const trafficLightRows = await trafficLightsRes.json();
  const memberRow = trafficLightRows.find(r => r.id === memberId);
  assert.ok(memberRow, 'Member must be present in traffic lights');
  assert.equal(memberRow.score, 45);
  assert.equal(Object.hasOwn(memberRow, 'month'), false, 'traffic-lights must not have month');
  assert.equal(Object.hasOwn(memberRow, 'source'), false, 'traffic-lights must not have source');
  assert.equal(Object.hasOwn(memberRow, 'rule_version'), false, 'traffic-lights must not have rule_version');

  console.log('Score Ledger & Reconciliation contract PASS: 28 migrations, 50 tables, idempotent visitor, no duplicate score, REGISTERED excluded, live/ledger reconciliation, legacy score preserved without fake events, and traffic-lights contract intact.');
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Score ledger contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
