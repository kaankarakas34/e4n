import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-ban-${randomUUID().slice(0, 8)}`;
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

  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const token = (id, role = 'MEMBER') => jwt.sign({ id, role }, process.env.JWT_SECRET);

  const adminId = randomUUID();
  const presidentId1 = randomUUID();
  const presidentId2 = randomUUID();
  const memberId = randomUUID();
  const group1Id = randomUUID();
  const group2Id = randomUUID();
  const powerTeamId = randomUUID();

  // 1. Create Users (with ACTIVE subscription)
  await pool.query(`
    INSERT INTO users (id, name, email, phone, role, company, profession, account_status, subscription_plan, subscription_end_date, created_at)
    VALUES 
      ($1, 'Admin', 'admin@example.com', '5550000001', 'ADMIN', 'E4N HQ', 'Yönetim', 'ACTIVE', 'ANNUAL', NOW() + interval '1 year', NOW()),
      ($2, 'Başkan 1', 'pres1@example.com', '5550000002', 'PRESIDENT', 'Grup 1 Liderlik', 'Danışman', 'ACTIVE', 'ANNUAL', NOW() + interval '1 year', NOW()),
      ($3, 'Başkan 2', 'pres2@example.com', '5550000003', 'PRESIDENT', 'Grup 2 Liderlik', 'Hukuk', 'ACTIVE', 'ANNUAL', NOW() + interval '1 year', NOW()),
      ($4, 'Test Üyesi', 'member@example.com', '5550000004', 'MEMBER', 'Test Ltd.', 'Tasarım', 'ACTIVE', 'ANNUAL', NOW() + interval '1 year', NOW())
  `, [adminId, presidentId1, presidentId2, memberId]);

  // 2. Create Groups & Power Team
  await pool.query(`
    INSERT INTO groups (id, name, status, created_at)
    VALUES 
      ($1, 'Boğaziçi', 'ACTIVE', NOW()),
      ($2, 'Marmara', 'ACTIVE', NOW())
  `, [group1Id, group2Id]);

  await pool.query(`
    INSERT INTO group_members (group_id, user_id, role, status, joined_at)
    VALUES 
      ($1, $2, 'PRESIDENT', 'ACTIVE', NOW()),
      ($3, $4, 'PRESIDENT', 'ACTIVE', NOW())
  `, [group1Id, presidentId1, group2Id, presidentId2]);

  await pool.query(`
    INSERT INTO power_teams (id, name, description, status, created_at)
    VALUES ($1, 'Yazılım & Teknoloji Loncası', 'Açık Lonca', 'ACTIVE', NOW())
  `, [powerTeamId]);

  // 3. User joins group 1 -> then removed 1st time
  await pool.query(`
    INSERT INTO group_members (group_id, user_id, role, status, joined_at)
    VALUES ($1, $2, 'MEMBER', 'ACTIVE', NOW() - interval '10 days')
  `, [group1Id, memberId]);

  // Execute first removal (via DELETE /api/groups/:id/members/:userId)
  const del1Res = await fetch(`${base}/api/groups/${group1Id}/members/${memberId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(presidentId1, 'PRESIDENT')}` },
    body: JSON.stringify({ reason_category: 'LOW_SCORE', reason_note: 'İlk dönem puan düşüklüğü' }),
  });
  assert.equal(del1Res.status, 200, 'First removal must succeed');

  // --- STEP 1: Verify D02 - After 1st removal, NO ban exists (reapplication is immediate) ---
  const disc1Res = await fetch(`${base}/api/group-discovery`, {
    headers: { Authorization: `Bearer ${token(memberId, 'MEMBER')}` },
  });
  assert.equal(disc1Res.status, 200);
  const disc1Data = await disc1Res.json();
  assert.equal(disc1Data.removal_ban.active, false, 'D02: First removal must NOT produce an active ban');
  assert.equal(disc1Data.removal_ban.removalCount, 1);

  // User applies to group 2 immediately -> must succeed
  const join1Res = await fetch(`${base}/api/groups/${group2Id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(memberId, 'MEMBER')}` },
    body: JSON.stringify({}),
  });
  assert.equal(join1Res.status, 200, 'D02: Reapplication after 1st removal must be allowed immediately');

  // President 2 accepts user
  const app2 = (await pool.query('SELECT id FROM group_applications WHERE group_id = $1 AND user_id = $2', [group2Id, memberId])).rows[0].id;
  await fetch(`${base}/api/group-applications/${app2}/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(presidentId2, 'PRESIDENT')}` },
    body: JSON.stringify({ note: 'Görüşme tamamlandı' }),
  });
  await fetch(`${base}/api/group-applications/${app2}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(presidentId2, 'PRESIDENT')}` },
    body: JSON.stringify({ note: 'Kabul edildi', decision: 'ACCEPTED' }),
  });

  // --- STEP 2: Execute 2nd removal ---
  const del2Res = await fetch(`${base}/api/groups/${group2Id}/members/${memberId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(presidentId2, 'PRESIDENT')}` },
    body: JSON.stringify({ reason_category: 'ATTENDANCE', reason_note: 'İkinci kez çıkarılma devamsızlık' }),
  });
  assert.equal(del2Res.status, 200, 'Second removal must succeed');

  // --- STEP 3: Verify R11, D03, D04 - 8 Month (240 Day / 2 Term) Ban Active ---
  const disc2Res = await fetch(`${base}/api/group-discovery`, {
    headers: { Authorization: `Bearer ${token(memberId, 'MEMBER')}` },
  });
  assert.equal(disc2Res.status, 200);
  const disc2Data = await disc2Res.json();
  assert.equal(disc2Data.removal_ban.active, true, 'R11: Ban must be ACTIVE after 2nd removal');
  assert.equal(disc2Data.removal_ban.removalCount, 2);
  assert.ok(disc2Data.removal_ban.daysLeft >= 239 && disc2Data.removal_ban.daysLeft <= 240, 'Ban must be 240 days (8 months / 2 terms)');
  assert.ok(disc2Data.removal_ban.bannedUntil, 'Must include bannedUntil timestamp');

  // Attempting to join ANY closed group must fail with 403 REMOVAL_BAN_ACTIVE
  const joinBanRes = await fetch(`${base}/api/groups/${group1Id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(memberId, 'MEMBER')}` },
    body: JSON.stringify({}),
  });
  assert.equal(joinBanRes.status, 403, 'Must return 403 Forbidden when removal ban is active');
  const joinBanData = await joinBanRes.json();
  assert.equal(joinBanData.code, 'REMOVAL_BAN_ACTIVE');
  assert.ok(joinBanData.error.includes('8 aylık') || joinBanData.error.includes('2 dönem'));
  assert.ok(joinBanData.error.includes('240 gün'));
  assert.ok(joinBanData.daysLeft > 0);

  // --- STEP 4: Scope Invariant - Lonca (Power Team) & Account remain OPEN ---
  // R12 & Scope: Closed group ban does NOT restrict power teams / guilds
  const ptJoinRes = await fetch(`${base}/api/power-teams/${powerTeamId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(memberId, 'MEMBER')}` },
    body: JSON.stringify({}),
  });
  assert.equal(ptJoinRes.status, 200, 'Power team / guild membership must NOT be blocked by group ban');

  // User account_status remains ACTIVE
  const userAcc = (await pool.query('SELECT account_status FROM users WHERE id = $1', [memberId])).rows[0].account_status;
  assert.equal(userAcc, 'ACTIVE');

  // --- STEP 5: Ban Expiry Invariant (After 240 days / 8 months) ---
  const expiredMemberId = randomUUID();
  await pool.query(`
    INSERT INTO users (id, name, email, phone, role, company, profession, account_status, subscription_plan, subscription_end_date, created_at)
    VALUES ($1, 'Süresi Dolan Üye', 'expired@example.com', '5550000009', 'MEMBER', 'Eski Ltd.', 'Avukat', 'ACTIVE', 'ANNUAL', NOW() + interval '1 year', NOW())
  `, [expiredMemberId]);

  // Two removals occurring 245 days ago (older than 240 days)
  const opCtx1 = JSON.stringify({ actorId: adminId, actorName: 'Admin', action: 'MEMBER_REMOVAL', operationId: randomUUID() });
  const opCtx2 = JSON.stringify({ actorId: adminId, actorName: 'Admin', action: 'MEMBER_REMOVAL', operationId: randomUUID() });
  await pool.query(`
    INSERT INTO group_membership_history (id, user_id, user_name, operation, recorded_at, before_state, after_state, operation_context)
    VALUES 
      ($1, $2, 'Süresi Dolan Üye', 'DELETE', NOW() - interval '250 days', '{"group_id":"${group1Id}"}'::jsonb, null, $3::jsonb),
      ($4, $2, 'Süresi Dolan Üye', 'DELETE', NOW() - interval '245 days', '{"group_id":"${group2Id}"}'::jsonb, null, $5::jsonb)
  `, [randomUUID(), expiredMemberId, opCtx1, randomUUID(), opCtx2]);

  const discExpiredRes = await fetch(`${base}/api/group-discovery`, {
    headers: { Authorization: `Bearer ${token(expiredMemberId, 'MEMBER')}` },
  });
  const discExpiredData = await discExpiredRes.json();
  assert.equal(discExpiredData.removal_ban.active, false, 'Ban must EXPIRE after 240 days (8 months)');
  assert.equal(discExpiredData.removal_ban.removalCount, 2);

  // Now join should be allowed again
  const joinAfterExpiryRes = await fetch(`${base}/api/groups/${group1Id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(expiredMemberId, 'MEMBER')}` },
    body: JSON.stringify({}),
  });
  assert.equal(joinAfterExpiryRes.status, 200, 'Application must be allowed after ban expires');

  console.log('Second Removal 8-Month Ban contract PASS: D02 immediate 1st reapplication, R11/D03/D04 2nd removal 8-month (240 days) ban active, discovery exposure, power-team/account preservation, and 240-day expiry verified.');
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
