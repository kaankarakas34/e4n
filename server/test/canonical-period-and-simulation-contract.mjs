import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

import {
  getCanonicalPeriod,
  parseCanonicalPeriod,
  getPreviousCanonicalPeriod,
  getNextCanonicalPeriod,
  evaluateShuffleEligibility,
} from '../src/canonical-period.js';
import { simulateDistribution } from '../src/shuffle-simulation.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-shuffle-period-${randomUUID().slice(0, 8)}`;
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

async function runUnitTests() {
  console.log('Testing canonical 4-month period calculations (R05 / D06)...');

  // 1. T1: January - April
  const t1 = getCanonicalPeriod(new Date('2026-02-15T12:00:00Z'));
  assert.equal(t1.periodKey, '2026-T1');
  assert.equal(t1.year, 2026);
  assert.equal(t1.trimester, 1);
  assert.equal(t1.startDate, '2026-01-01T00:00:00.000Z');
  assert.equal(t1.endDate, '2026-04-30T23:59:59.999Z');
  assert.equal(t1.cutoffDate, '2026-04-29T23:59:59.999Z');
  assert.equal(t1.isCutoffPassed, false);

  // 2. T2: May - August
  const t2 = getCanonicalPeriod(new Date('2026-07-20T10:00:00Z'));
  assert.equal(t2.periodKey, '2026-T2');
  assert.equal(t2.startDate, '2026-05-01T00:00:00.000Z');
  assert.equal(t2.endDate, '2026-08-31T23:59:59.999Z');
  assert.equal(t2.cutoffDate, '2026-08-30T23:59:59.999Z');

  // 3. T3: September - December
  const t3 = getCanonicalPeriod(new Date('2026-10-10T09:00:00Z'));
  assert.equal(t3.periodKey, '2026-T3');
  assert.equal(t3.startDate, '2026-09-01T00:00:00.000Z');
  assert.equal(t3.endDate, '2026-12-31T23:59:59.999Z');
  assert.equal(t3.cutoffDate, '2026-12-30T23:59:59.999Z');
  assert.equal(t3.isCutoffPassed, false);

  // 4. Period parsing and transitions
  const parsed = parseCanonicalPeriod('2027-T2');
  assert.equal(parsed.year, 2027);
  assert.equal(parsed.trimester, 2);
  assert.equal(parsed.periodKey, '2027-T2');
  assert.equal(getPreviousCanonicalPeriod('2026-T1'), '2025-T3');
  assert.equal(getNextCanonicalPeriod('2026-T3'), '2027-T1');
  assert.equal(parseCanonicalPeriod('invalid'), null);

  console.log('Testing candidate eligibility rules (P27)...');

  const baseMember = {
    id: randomUUID(),
    full_name: 'Ahmet Yılmaz',
    profession: 'Yazılım Mühendisi',
    role: 'MEMBER',
    account_status: 'ACTIVE',
    subscription_end_date: '2026-12-31T23:59:59.999Z',
    removal_count: 0,
    last_removed_at: null,
  };

  // 1. Eligible member
  const eligibleRes = evaluateShuffleEligibility(baseMember, { cutoffDate: t3.cutoffDate, now: new Date('2026-10-10') });
  assert.equal(eligibleRes.isEligible, true);
  assert.equal(eligibleRes.category, 'ELIGIBLE');
  assert.equal(eligibleRes.reasons.length, 0);

  // 2. Admin account exclusion
  const adminRes = evaluateShuffleEligibility({ ...baseMember, role: 'ADMIN' }, { cutoffDate: t3.cutoffDate });
  assert.equal(adminRes.isEligible, false);
  assert.equal(adminRes.category, 'EXCLUDED');
  assert.ok(adminRes.reasons.includes('EXCLUDED_ADMIN'));

  // 3. D07 Restricted Account
  const restrictedRes = evaluateShuffleEligibility({ ...baseMember, account_status: 'RESTRICTED' }, { cutoffDate: t3.cutoffDate });
  assert.equal(restrictedRes.isEligible, false);
  assert.equal(restrictedRes.category, 'INELIGIBLE');
  assert.ok(restrictedRes.reasons.includes('INELIGIBLE_ACCOUNT_RESTRICTED'));

  // 4. Missing profession
  const noProfRes = evaluateShuffleEligibility({ ...baseMember, profession: '   ' }, { cutoffDate: t3.cutoffDate });
  assert.equal(noProfRes.isEligible, false);
  assert.ok(noProfRes.reasons.includes('MISSING_PROFESSION'));

  // 5. P24 Removal Ban Active (2 removals, 30 days ago -> 210 days remaining of 240 days)
  const bannedRes = evaluateShuffleEligibility({
    ...baseMember,
    removal_count: 2,
    last_removed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, { cutoffDate: t3.cutoffDate });
  assert.equal(bannedRes.isEligible, false);
  assert.ok(bannedRes.reasons.includes('INELIGIBLE_REMOVAL_BAN'));
  assert.equal(bannedRes.removalBan.active, true);
  assert.ok(bannedRes.removalBan.daysLeft > 200);

  // 6. Expired 2nd removal (250 days ago -> ban expired)
  const expiredBanRes = evaluateShuffleEligibility({
    ...baseMember,
    removal_count: 2,
    last_removed_at: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString(),
  }, { cutoffDate: t3.cutoffDate });
  assert.equal(expiredBanRes.isEligible, true);
  assert.equal(expiredBanRes.removalBan.active, false);

  // 7. D06 Subscription cutoff check
  const unpaidRes = evaluateShuffleEligibility({
    ...baseMember,
    subscription_end_date: '2026-11-01T00:00:00.000Z', // ends before 2026-12-30 cutoff
  }, { cutoffDate: t3.cutoffDate });
  assert.equal(unpaidRes.isEligible, false);
  assert.ok(unpaidRes.reasons.includes('INELIGIBLE_SUBSCRIPTION_UNPAID'));

  console.log('Testing shuffle simulation & hard constraints (P28)...');

  const groups = [
    { id: 'group-1', name: 'Boğaziçi' },
    { id: 'group-2', name: 'Marmara' },
  ];

  // Hard Constraint 1: D09 35 Capacity limit
  const candidates72 = Array.from({ length: 72 }, (_, i) => ({
    id: `user-${i}`,
    full_name: `Member ${i}`,
    profession: `Profession ${i}`,
    previous_group_id: null,
  }));

  const sim72 = simulateDistribution(candidates72, groups, { maxCapacity: 35 });
  assert.equal(sim72.assignments['group-1'].length, 35);
  assert.equal(sim72.assignments['group-2'].length, 35);
  assert.equal(sim72.unassigned.length, 2);
  assert.equal(sim72.stats.capacityViolations, 0);
  assert.equal(sim72.unassignedReport[0].reason, 'CAPACITY_FULL');

  // Hard Constraint 2: Strict profession conflict
  const conflictCandidates = [
    { id: 'u1', full_name: 'Av. Ali', profession: 'Avukat', previous_group_id: null },
    { id: 'u2', full_name: 'Av. Veli', profession: 'avukat', previous_group_id: null }, // same normalized
    { id: 'u3', full_name: 'Av. Ayşe', profession: 'AVUKAT ', previous_group_id: null }, // 3 lawyers for 2 groups
  ];
  const simConflict = simulateDistribution(conflictCandidates, groups, { maxCapacity: 35 });
  assert.equal(simConflict.assignments['group-1'].length, 1);
  assert.equal(simConflict.assignments['group-2'].length, 1);
  assert.equal(simConflict.unassigned.length, 1);
  assert.equal(simConflict.unassignedReport[0].reason, 'PROFESSION_CONFLICT');

  // Soft Constraint: Rotation & overlap minimization
  const rotationCandidates = [
    { id: 'r1', full_name: 'Member R1', profession: 'P1', previous_group_id: 'group-1' },
    { id: 'r2', full_name: 'Member R2', profession: 'P2', previous_group_id: 'group-1' },
    { id: 'r3', full_name: 'Member R3', profession: 'P3', previous_group_id: 'group-2' },
  ];
  const simRotation = simulateDistribution(rotationCandidates, groups, { minimizeOverlap: true });
  // r1 and r2 from group-1 should prefer rotating to group-2
  assert.ok(simRotation.assignments['group-2'].includes('r1') || simRotation.assignments['group-2'].includes('r2'));

  console.log('Unit checks PASS.');
}

async function runIntegrationTests() {
  console.log('Starting PostgreSQL container for integration testing...');
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
  if (!Number.isInteger(port) || port <= 0) throw new Error('Could not determine loopback port');

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
  process.env.JWT_SECRET = 'shuffle_preview_fixture_secret';

  ({ default: pool } = await import('../src/config/db.js'));
  let ready = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      ready = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  if (!ready) throw new Error('DB not ready');

  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  assert.equal((await applyVersionedSchema()).applied.length, 28);

  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const adminId = randomUUID();
  const member1 = randomUUID();
  const member2 = randomUUID();
  const restrictedMember = randomUUID();

  await pool.query(`
    INSERT INTO users(id, email, name, profession, password_hash, role, account_status)
    VALUES
      ($1, 'admin@example.invalid', 'Admin User', 'Yönetici', 'hash', 'ADMIN', 'ACTIVE'),
      ($2, 'm1@example.invalid', 'Ali Veli', 'Mimar', 'hash', 'MEMBER', 'ACTIVE'),
      ($3, 'm2@example.invalid', 'Ayşe Fatma', 'Avukat', 'hash', 'MEMBER', 'ACTIVE'),
      ($4, 'm3@example.invalid', 'Kısıtlı Üye', 'Doktor', 'hash', 'MEMBER', 'RESTRICTED')
  `, [adminId, member1, member2, restrictedMember]);

  const g1 = randomUUID();
  const g2 = randomUUID();
  await pool.query(`
    INSERT INTO groups(id, name, status)
    VALUES ($1, 'Alpha Grubu', 'ACTIVE'), ($2, 'Beta Grubu', 'ACTIVE')
  `, [g1, g2]);

  await pool.query(`
    INSERT INTO group_members(group_id, user_id, status)
    VALUES ($1, $2, 'ACTIVE')
  `, [g1, member1]);

  const token = jwt.sign({ id: adminId, role: 'ADMIN' }, process.env.JWT_SECRET);
  const memberToken = jwt.sign({ id: member1, role: 'MEMBER' }, process.env.JWT_SECRET);

  console.log('Testing GET /api/admin/shuffle-workspace canonical period & eligibility response...');
  const wsRes = await fetch(`${base}/api/admin/shuffle-workspace`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(wsRes.status, 200);
  const ws = await wsRes.json();
  assert.ok(ws.period);
  assert.match(ws.period.periodKey, /^\d{4}-T[1-3]$/);
  assert.ok(ws.period.cutoffDate);

  const m1Data = ws.members.find(m => m.id === member1);
  assert.equal(m1Data.is_eligible, true);
  assert.equal(m1Data.account_status, 'ACTIVE');

  const mRestrictedData = ws.members.find(m => m.id === restrictedMember);
  assert.equal(mRestrictedData.is_eligible, false);
  assert.ok(mRestrictedData.ineligibility_reasons.includes('INELIGIBLE_ACCOUNT_RESTRICTED'));

  console.log('Testing POST /api/admin/shuffle-preview simulation endpoint...');
  // 1. Unauthorized / Forbidden
  assert.equal((await fetch(`${base}/api/admin/shuffle-preview`, { method: 'POST' })).status, 401);
  assert.equal((await fetch(`${base}/api/admin/shuffle-preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })).status, 403);

  // 2. Successful simulation preview
  const prevRes = await fetch(`${base}/api/admin/shuffle-preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expectedRevision: ws.revision, respectLocks: true }),
  });
  assert.equal(prevRes.status, 200);
  const prevData = await prevRes.json();
  assert.equal(prevData.version, 1);
  assert.equal(prevData.ownerId, adminId);
  assert.ok(prevData.period);
  assert.ok(prevData.previewRevision);
  assert.ok(prevData.assignments);
  assert.ok(prevData.assignments[g1]);
  assert.ok(prevData.assignments[g2]);
  assert.equal(prevData.candidatesSummary.excluded, 1); // admin
  assert.equal(prevData.candidatesSummary.ineligible, 1); // restricted member

  // 3. Stale revision detection (409)
  const staleRes = await fetch(`${base}/api/admin/shuffle-preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expectedRevision: '0'.repeat(64) }),
  });
  assert.equal(staleRes.status, 409);
  const staleErr = await staleRes.json();
  assert.equal(staleErr.code, 'SHUFFLE_STALE');

  console.log('Testing atomic shuffle save and notification delivery (E4N-101 / P29)...');
  const requestId = randomUUID();
  const saveRes = await fetch(`${base}/api/shuffle/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      expectedRevision: ws.revision,
      assignments: prevData.assignments,
    }),
  });
  assert.equal(saveRes.status, 200);
  const saveAck = await saveRes.json();
  assert.equal(saveAck.version, 1);
  assert.equal(saveAck.success, true);
  assert.equal(saveAck.executionId, requestId);
  assert.equal(saveAck.replayed, false);
  assert.ok(typeof saveAck.notificationsDelivered === 'number' && saveAck.notificationsDelivered > 0);

  // Check notifications table
  const notifs = (await pool.query("SELECT * FROM notifications WHERE type = 'SHUFFLE_COMPLETED' ORDER BY created_at")).rows;
  assert.equal(notifs.length, saveAck.notificationsDelivered);
  for (const n of notifs) {
    assert.equal(n.type, 'SHUFFLE_COMPLETED');
    assert.ok(n.title.includes('Dönem') || n.title.includes('Grup'));
    assert.ok(n.message.includes('rotasyonu'));
    assert.equal(n.read, false);
  }

  // Check idempotent replay
  const replayRes = await fetch(`${base}/api/shuffle/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      expectedRevision: ws.revision,
      assignments: prevData.assignments,
    }),
  });
  assert.equal(replayRes.status, 200);
  const replayAck = await replayRes.json();
  assert.equal(replayAck.replayed, true);
  assert.equal(replayAck.executionId, requestId);

  // Verify no duplicate notifications inserted
  const notifsAfterReplay = (await pool.query("SELECT count(*)::int AS count FROM notifications WHERE type = 'SHUFFLE_COMPLETED'")).rows[0].count;
  assert.equal(notifsAfterReplay, notifs.length);

  // Check history detail
  const historyDetailRes = await fetch(`${base}/api/admin/shuffle-history/${requestId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(historyDetailRes.status, 200);
  const historyDetail = (await historyDetailRes.json()).execution;
  assert.equal(historyDetail.after_snapshot.notificationsDelivered, saveAck.notificationsDelivered);
  assert.ok(historyDetail.after_snapshot.period);

  console.log('Integration checks PASS.');
}

async function main() {
  await runUnitTests();
  await runIntegrationTests();
  console.log('ALL CANONICAL PERIOD, SHUFFLE SIMULATION & NOTIFICATION CONTRACT CHECKS PASSED (E4N-99, E4N-100, E4N-101).');
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error('Contract test failed:', error);
} finally {
  if (appServer) await new Promise(r => appServer.close(r));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); } catch {}
  }
  process.exit(exitCode);
}
