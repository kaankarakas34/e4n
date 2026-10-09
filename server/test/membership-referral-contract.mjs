import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-ref-${randomUUID().slice(0, 8)}`;
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
  try {
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
  const { getMembershipReferral, getReferredMembers } = await import('../src/membership-referrals.js');

  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const token = (id, role = 'MEMBER') => jwt.sign({ id, role }, process.env.JWT_SECRET);

  const request = async (method, route, body, actorToken) => {
    const headers = { 'Content-Type': 'application/json' };
    if (actorToken) headers['Authorization'] = `Bearer ${actorToken}`;
    const res = await fetch(`${base}${route}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  };

  console.log('Starting BAŞ-02 / E4N-162 Membership Referral Contract Tests on PG17...');

  // 1. Fixture: Setup users
  const adminId = randomUUID();
  const sponsorId = randomUUID();
  const otherMemberId = randomUUID();

  await pool.query(`
    INSERT INTO users (id, name, email, password_hash, role, account_status, profession, city, company, tax_number, tax_office, billing_address, company_registration)
    VALUES 
      ($1, 'Admin User', 'admin-ref@example.invalid', 'hash', 'ADMIN', 'ACTIVE', 'Admin', 'İstanbul', 'Admin Corp', '1111111111', 'Kadıköy', 'Address 1', true),
      ($2, 'Sponsor Member', 'sponsor-ref@example.invalid', 'hash', 'MEMBER', 'ACTIVE', 'Designer', 'Ankara', 'Sponsor Studio', '2222222222', 'Çankaya', 'Address 2', true),
      ($3, 'Other Member', 'other-ref@example.invalid', 'hash', 'MEMBER', 'ACTIVE', 'Developer', 'İzmir', 'Other Inc', '3333333333', 'Konak', 'Address 3', true)
    ON CONFLICT (id) DO NOTHING
  `, [adminId, sponsorId, otherMemberId]);

  const adminToken = token(adminId, 'ADMIN');
  const sponsorToken = token(sponsorId, 'MEMBER');

  // 2. Referral Preview Tests (Public Endpoint)
  console.log('Testing referral preview...');
  const previewValid = await request('GET', `/api/auth/referral-preview?ref=${sponsorId}`);
  assert.equal(previewValid.status, 200);
  assert.equal(previewValid.data.valid, true);
  assert.equal(previewValid.data.referrer.id, sponsorId);
  assert.equal(previewValid.data.referrer.name, 'Sponsor Member');

  const previewInvalid = await request('GET', `/api/auth/referral-preview?ref=${randomUUID()}`);
  assert.equal(previewInvalid.status, 400);
  assert.equal(previewInvalid.data.valid, false);

  const previewEmpty = await request('GET', '/api/auth/referral-preview');
  assert.equal(previewEmpty.status, 200);
  assert.equal(previewEmpty.data.valid, false);

  // 3. Normal Registration WITHOUT referral (Davetiye kalktı, referanssız kayıt serbest)
  console.log('Testing registration without referral...');
  const user1Email = `user1-${randomUUID().slice(0, 8)}@example.invalid`;
  const reg1 = await request('POST', '/api/auth/register', {
    name: 'Unreferred Member',
    email: user1Email,
    password: 'Password123!',
    phone: '05551112233',
    city: 'İstanbul',
    profession: 'Architect',
    company: 'Unreferred Arch',
    taxNumber: '4444444444',
    taxOffice: 'Beşiktaş',
    billingAddress: 'Arch street 1',
    kvkkConsent: true,
    explicitConsent: true
  });
  assert.equal(reg1.status, 201);
  const user1Id = reg1.data.id;

  const user1Ref = await getMembershipReferral(pool, user1Id);
  assert.equal(user1Ref, null, 'Referral record should not exist for unreferred registration');

  // 4. Registration WITH valid referral
  console.log('Testing registration with valid referral...');
  const user2Email = `user2-${randomUUID().slice(0, 8)}@example.invalid`;
  const reg2 = await request('POST', '/api/auth/register', {
    name: 'Referred Member 1',
    email: user2Email,
    password: 'Password123!',
    phone: '05552223344',
    city: 'Ankara',
    profession: 'Consultant',
    company: 'Referred Consult',
    taxNumber: '5555555555',
    taxOffice: 'Çankaya',
    billingAddress: 'Consult street 2',
    kvkkConsent: true,
    explicitConsent: true,
    ref: sponsorId
  });
  assert.equal(reg2.status, 201);
  const user2Id = reg2.data.id;

  const user2Ref = await getMembershipReferral(pool, user2Id);
  assert.ok(user2Ref, 'Referral record should exist');
  assert.equal(user2Ref.referrerId, sponsorId);
  assert.equal(user2Ref.referrerName, 'Sponsor Member');
  assert.equal(user2Ref.source, 'REGISTRATION');

  // Check sponsor's referred members
  const sponsorReferred = await getReferredMembers(pool, sponsorId);
  assert.ok(sponsorReferred.some(m => m.id === user2Id));

  // 5. Self-referral rejection
  console.log('Testing self-referral rejection...');
  const selfReg = await request('POST', '/api/auth/register', {
    name: 'Self Referrer',
    email: 'sponsor-ref@example.invalid', // matches sponsor's email
    password: 'Password123!',
    phone: '05559998877',
    city: 'İstanbul',
    profession: 'Self',
    company: 'Self Corp',
    taxNumber: '6666666666',
    taxOffice: 'Kadıköy',
    billingAddress: 'Self street',
    kvkkConsent: true,
    explicitConsent: true,
    ref: sponsorId
  });
  assert.equal(selfReg.status, 400);

  // 6. Forged / non-existent referral ID rejection
  console.log('Testing invalid referral ID rejection...');
  const invalidRefReg = await request('POST', '/api/auth/register', {
    name: 'Invalid Ref Member',
    email: `invalid-ref-${randomUUID().slice(0, 8)}@example.invalid`,
    password: 'Password123!',
    phone: '05553334455',
    city: 'İzmir',
    profession: 'Lawyer',
    company: 'Law Office',
    taxNumber: '7777777777',
    taxOffice: 'Konak',
    billingAddress: 'Law street 3',
    kvkkConsent: true,
    explicitConsent: true,
    ref: randomUUID() // non-existent UUID
  });
  assert.equal(invalidRefReg.status, 400);

  // 7. Member's own referral view (/api/user/membership-referral)
  console.log('Testing member own referral view...');
  const user2Token = token(user2Id, 'MEMBER');
  const myRefView = await request('GET', '/api/user/membership-referral', null, user2Token);
  assert.equal(myRefView.status, 200);
  assert.equal(myRefView.data.referredBy.id, sponsorId);
  assert.equal(myRefView.data.referredBy.name, 'Sponsor Member');

  // 8. Admin Referral View & Audit History (/api/admin/members/:id/referrals)
  console.log('Testing admin referral view & audit history...');
  const adminView = await request('GET', `/api/admin/members/${user2Id}/referrals`, null, adminToken);
  assert.equal(adminView.status, 200);
  assert.equal(adminView.data.referredBy.referrerId, sponsorId);
  assert.deepEqual(adminView.data.history, []);

  // Unauthorized access check
  const nonAdminView = await request('GET', `/api/admin/members/${user2Id}/referrals`, null, sponsorToken);
  assert.equal(nonAdminView.status, 403, 'Non-admin must not access admin referral view');

  // 9. Admin Adjustment of Referral with reason & audit snapshot
  console.log('Testing admin referral adjustment with reason...');
  // Admin setting user as their own referrer should fail (self-referral)
  const selfAdj = await request('POST', `/api/admin/members/${user2Id}/set-referrer`, { referrerId: user2Id, reason: 'Kendine referans atanmaya çalışıldı' }, adminToken);
  assert.equal(selfAdj.status, 400);

  // Missing reason should fail
  const noReasonAdj = await request('POST', `/api/admin/members/${user2Id}/set-referrer`, {
    referrerId: otherMemberId,
    reason: ''
  }, adminToken);
  assert.equal(noReasonAdj.status, 400);

  // Valid adjustment
  const validAdj = await request('POST', `/api/admin/members/${user2Id}/set-referrer`, {
    referrerId: otherMemberId,
    reason: 'Üyenin yazılı talebi doğrultusunda sponsor düzeltildi.'
  }, adminToken);
  assert.equal(validAdj.status, 200);
  assert.equal(validAdj.data.success, true);
  assert.equal(validAdj.data.referral.referrerId, otherMemberId);
  assert.equal(validAdj.data.referral.source, 'ADMIN_ADJUSTMENT');
  assert.equal(validAdj.data.referral.history.length, 1);
  assert.equal(validAdj.data.referral.history[0].oldReferrerId, sponsorId);
  assert.equal(validAdj.data.referral.history[0].newReferrerId, otherMemberId);
  assert.equal(validAdj.data.referral.history[0].changedBy, adminId);
  assert.equal(validAdj.data.referral.history[0].reason, 'Üyenin yazılı talebi doğrultusunda sponsor düzeltildi.');

  // Verify that new sponsor now has user2 in referred members
  const otherReferred = await getReferredMembers(pool, otherMemberId);
  assert.ok(otherReferred.some(m => m.id === user2Id));

  // Verify that old sponsor no longer has user2
  const oldSponsorReferred = await getReferredMembers(pool, sponsorId);
  assert.ok(!oldSponsorReferred.some(m => m.id === user2Id));

  // 10. Verifiable Legacy Visitor Fallback
  console.log('Testing verifiable legacy visitor fallback...');
  const legacyVisitorUserEmail = `legacy-visitor-${randomUUID().slice(0, 8)}@example.invalid`;
  const legacyUserId = randomUUID();

  // Create user
  await pool.query(`
    INSERT INTO users (id, name, email, password_hash, role, account_status, profession, city, company, tax_number, tax_office, billing_address, company_registration)
    VALUES ($1, 'Legacy Visitor User', $2, 'hash', 'MEMBER', 'ACTIVE', 'Trader', 'Bursa', 'Legacy Corp', '8888888888', 'Nilüfer', 'Legacy street', true)
  `, [legacyUserId, legacyVisitorUserEmail]);

  // Insert visitor record with status 'JOINED' and inviter = sponsorId
  const visitorId = randomUUID();
  await pool.query(`
    INSERT INTO visitors (id, inviter_id, name, email, visited_at, status)
    VALUES ($1, $2, 'Legacy Visitor User', $3, now() - interval '30 days', 'JOINED')
  `, [visitorId, sponsorId, legacyVisitorUserEmail]);

  const legacyRef = await getMembershipReferral(pool, legacyUserId);
  assert.ok(legacyRef, 'Legacy visitor conversion referral should be resolved');
  assert.equal(legacyRef.referrerId, sponsorId);
  assert.equal(legacyRef.source, 'VISITOR_CONVERSION');

  const legacySponsorMembers = await getReferredMembers(pool, sponsorId);
  assert.ok(legacySponsorMembers.some(m => m.id === legacyUserId));

  // 11. Admin members list returns referred_by & referrals_count
  console.log('Testing admin members list with referral fields...');
  const adminMembersList = await request('GET', '/api/admin/members', null, adminToken);
  assert.equal(adminMembersList.status, 200);
  assert.ok(Array.isArray(adminMembersList.data));
  const user2InList = adminMembersList.data.find(m => m.id === user2Id);
  assert.ok(user2InList);
  assert.equal(user2InList.referred_by?.id, otherMemberId);

  const otherMemberInList = adminMembersList.data.find(m => m.id === otherMemberId);
  assert.ok(otherMemberInList);
  assert.ok(otherMemberInList.referrals_count >= 1);

  console.log('All BAŞ-02 / E4N-162 Membership Referral Contract Tests PASSED successfully! ✅');
} finally {
  if (appServer) {
    appServer.closeAllConnections();
    await new Promise(resolve => appServer.close(resolve));
  }
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['rm', '-f', container]); } catch {}
  }
 }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
