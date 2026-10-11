// Contract test for PAR-02 / E4N-116: Reconcile common API endpoints, data models and role behavior
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(serverDir, '..');

console.log('--- Testing PAR-02 / E4N-116: Common API, Data & Role Reconcilation Contract ---');

// ============================================================================
// 1. Static Source Code & Contract Verifications
// ============================================================================

const apiTsPath = path.resolve(repoDir, 'mobile/constants/api.ts');
const paymentTsxPath = path.resolve(repoDir, 'mobile/app/features/payment.tsx');
const applicationsTsxPath = path.resolve(repoDir, 'mobile/app/admin/applications.tsx');
const subscriptionsTsxPath = path.resolve(repoDir, 'mobile/app/admin/subscriptions.tsx');
const meetingsApiPath = path.resolve(repoDir, 'mobile/utils/meetings-api.ts');

const apiContent = readFileSync(apiTsPath, 'utf8');
const paymentContent = readFileSync(paymentTsxPath, 'utf8');
const applicationsContent = readFileSync(applicationsTsxPath, 'utf8');
const subscriptionsContent = readFileSync(subscriptionsTsxPath, 'utf8');
const meetingsApiContent = readFileSync(meetingsApiPath, 'utf8');

// Ensure ONE_TO_ONES, MEMBERSHIPS, TICKETS and ADMIN endpoints are defined in constants/api.ts
assert.ok(apiContent.includes('ONE_TO_ONES:'), 'API_CONFIG must define ONE_TO_ONES');
assert.ok(apiContent.includes("LIST: '/one-to-ones'"), 'ONE_TO_ONES must define LIST');
assert.ok(apiContent.includes("REQUEST: '/one-to-ones/request'"), 'ONE_TO_ONES must define REQUEST');
assert.ok(apiContent.includes('/one-to-ones/'), 'ONE_TO_ONES must define STATUS endpoint');

assert.ok(apiContent.includes('MEMBERSHIPS:'), 'API_CONFIG must define MEMBERSHIPS');
assert.ok(apiContent.includes("PLANS: '/memberships'"), 'MEMBERSHIPS must define PLANS');
assert.ok(apiContent.includes("RECORDS: '/membership-records'"), 'MEMBERSHIPS must define RECORDS');

assert.ok(apiContent.includes('ADMIN:'), 'API_CONFIG must define ADMIN');
assert.ok(apiContent.includes("PUBLIC_VISITORS: '/admin/public-visitors'"), 'ADMIN must define PUBLIC_VISITORS');
assert.ok(apiContent.includes('/admin/public-visitors/'), 'ADMIN must define PUBLIC_VISITOR_STATUS');
assert.ok(apiContent.includes("PAYMENTS_HISTORY: '/payments/history'"), 'ADMIN must define PAYMENTS_HISTORY');
assert.ok(apiContent.includes("MEMBERSHIP_RECORDS: '/admin/membership-records'"), 'ADMIN must define MEMBERSHIP_RECORDS');

// Ensure PaymentScreen does NOT use non-existent /payments/me endpoint
assert.ok(
  !paymentContent.includes("'/payments/me'"),
  'PaymentScreen must NOT call non-existent /payments/me'
);
assert.ok(
  paymentContent.includes('API_CONFIG.ENDPOINTS.MEMBERSHIPS.RECORDS'),
  'PaymentScreen must use API_CONFIG.ENDPOINTS.MEMBERSHIPS.RECORDS'
);
assert.ok(paymentContent.includes('account_status'), 'PaymentScreen must inspect account_status');
assert.ok(paymentContent.includes('subscription_plan'), 'PaymentScreen must inspect subscription_plan');
assert.ok(paymentContent.includes('subscription_end_date'), 'PaymentScreen must inspect subscription_end_date');
assert.ok(paymentContent.includes('RESTRICTED'), 'PaymentScreen must handle RESTRICTED accounts (D07)');
assert.ok(paymentContent.includes('retryBtn') || paymentContent.includes('Tekrar Dene'), 'PaymentScreen must render retry button');

// Ensure AdminApplicationsScreen uses canonical admin public visitors endpoint and status handler
assert.ok(
  applicationsContent.includes('API_CONFIG.ENDPOINTS.ADMIN.PUBLIC_VISITORS'),
  'AdminApplicationsScreen must use API_CONFIG.ENDPOINTS.ADMIN.PUBLIC_VISITORS'
);
assert.ok(
  applicationsContent.includes('API_CONFIG.ENDPOINTS.ADMIN.PUBLIC_VISITOR_STATUS'),
  'AdminApplicationsScreen must use API_CONFIG.ENDPOINTS.ADMIN.PUBLIC_VISITOR_STATUS'
);
assert.ok(
  applicationsContent.includes('handleUpdateVisitorStatus'),
  'AdminApplicationsScreen must implement handleUpdateVisitorStatus'
);

// Ensure AdminSubscriptionsScreen uses canonical admin payments history endpoint
assert.ok(
  subscriptionsContent.includes('API_CONFIG.ENDPOINTS.ADMIN.PAYMENTS_HISTORY'),
  'AdminSubscriptionsScreen must use API_CONFIG.ENDPOINTS.ADMIN.PAYMENTS_HISTORY'
);

// Ensure meetings-api maps to /one-to-ones
assert.ok(meetingsApiContent.includes("'/one-to-ones'"), 'meetingsApi must use /one-to-ones');
assert.ok(meetingsApiContent.includes("'/one-to-ones/request'"), 'meetingsApi must use /one-to-ones/request');

console.log('✅ Static AST and source contract checks passed.');

// ============================================================================
// 2. Integration / Server-side Contract Verification in Isolated PG17 Container
// ============================================================================

const container = `e4n-par02-${randomUUID().slice(0, 8)}`;
const dbUser = 'e4n_par02_fixture';
const dbName = 'e4n_par02_fixture';
const dbPassword = 'par02_test_password';
let containerStarted = false;
let pool;
let appServer;

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
  assert.ok(port > 0, 'Valid port expected for PostgreSQL');

  // Override environment variables
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
  process.env.JWT_SECRET = 'par02_contract_signing_secret_32chars';

  ({ default: pool } = await import('../src/config/db.js'));
  let dbReady = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      dbReady = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  assert.ok(dbReady, 'Isolated PostgreSQL connection established');

  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  const migrationResult = await applyVersionedSchema();
  assert.equal(migrationResult.applied.length, 28, 'Must apply all 28 versioned migrations');

  // Seed Test Users
  const adminId = randomUUID();
  const member1Id = randomUUID();
  const member2Id = randomUUID();
  const restrictedId = randomUUID();

  // Admin user
  await pool.query(`
    INSERT INTO users (id, name, email, password_hash, role, account_status, profession, company)
    VALUES ($1, 'Admin User', 'admin@example.test', 'hashed_pw', 'ADMIN', 'ACTIVE', 'Yönetici', 'E4N HQ')
  `, [adminId]);

  // Member 1: Active with 12_MONTHS plan
  await pool.query(`
    INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession, company)
    VALUES ($1, 'Member One', 'member1@example.test', 'hashed_pw', 'MEMBER', 'ACTIVE', '12_MONTHS', NOW() + INTERVAL '60 days', 'Mimar', 'Mimar Ltd')
  `, [member1Id]);

  // Member 2: Active with 1_MONTH plan
  await pool.query(`
    INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession, company)
    VALUES ($1, 'Member Two', 'member2@example.test', 'hashed_pw', 'MEMBER', 'ACTIVE', '1_MONTH', NOW() + INTERVAL '10 days', 'Avukat', 'Hukuk Bürosu')
  `, [member2Id]);

  // Restricted Member: RESTRICTED status (D07)
  await pool.query(`
    INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession, company)
    VALUES ($1, 'Restricted Member', 'restricted@example.test', 'hashed_pw', 'MEMBER', 'RESTRICTED', '6_MONTHS', NOW() - INTERVAL '5 days', 'Mühendis', 'Proje A.Ş.')
  `, [restrictedId]);

  // Seed Payment Transaction for Member 1
  const paymentOid = `PAY-PAR02-${randomUUID().slice(0, 8)}`;
  await pool.query(`
    INSERT INTO payment_transactions (merchant_oid, user_id, amount, status, action_type, plan_id, created_at, updated_at)
    VALUES ($1, $2, 69000.00, 'SUCCESS', 'SUBSCRIPTION', '12_MONTHS', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
  `, [paymentOid, member1Id]);

  // Seed Invoice for Member 1
  const invoiceId = randomUUID();
  const invoiceContent = Buffer.from('%PDF-1.7 E4N Invoice Test');
  await pool.query(`
    INSERT INTO invoice_files (id, member_id, uploaded_by, request_key, fingerprint, filename, size_bytes, content, email_state, created_at)
    VALUES ($1, $2, $3, $4, $5, 'E4N-2026-INV01.pdf', $6, $7, 'SENT', NOW() - INTERVAL '2 days')
  `, [invoiceId, member1Id, adminId, randomUUID(), 'b'.repeat(64), invoiceContent.length, invoiceContent]);

  // Seed Public Visitor
  const visitorId = randomUUID();
  await pool.query(`
    INSERT INTO public_visitors (id, name, email, phone, company, profession, status, inviter_id, created_at)
    VALUES ($1, 'Ahmet Konuk', 'ahmet.konuk@example.test', '05551234567', 'Konuk Ltd', 'Yazılımcı', 'PENDING', $2, NOW() - INTERVAL '1 day')
  `, [visitorId, member1Id]);

  // Start Express Server
  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const serverPort = appServer.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}/api`;

  const makeToken = (id, role = 'MEMBER') => jwt.sign({ id, role }, process.env.JWT_SECRET);
  const apiFetch = (url, { method = 'GET', body, token } = {}) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    return fetch(`${baseUrl}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  const adminToken = makeToken(adminId, 'ADMIN');
  const member1Token = makeToken(member1Id, 'MEMBER');
  const member2Token = makeToken(member2Id, 'MEMBER');
  const restrictedToken = makeToken(restrictedId, 'MEMBER');

  console.log('--- Executing HTTP Route Contracts ---');

  // --------------------------------------------------------------------------
  // TEST 1: GET /api/membership-records (Reconciled from invalid /payments/me)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing GET /api/membership-records (Member Payment & Subscription Records)...');
    
    // Anonymous must receive 401
    const anonRes = await apiFetch('/membership-records');
    assert.equal(anonRes.status, 401, 'Anonymous request must return 401');

    // Authenticated member1 receives full envelope, account and payments
    const m1Res = await apiFetch('/membership-records', { token: member1Token });
    assert.equal(m1Res.status, 200, 'member1 request must return 200');
    assert.match(m1Res.headers.get('cache-control'), /private.*no-store/);

    const data = await m1Res.json();
    assert.equal(data.version, 1);
    assert.equal(data.ownerId, member1Id);
    assert.equal(data.targetId, member1Id);
    assert.equal(data.account.id, member1Id);
    assert.equal(data.account.name, 'Member One');
    assert.equal(data.account.account_status, 'ACTIVE');
    assert.equal(data.account.subscription_plan, '12_MONTHS');
    assert.ok(data.account.subscription_end_date, 'subscription_end_date must be populated');

    assert.ok(Array.isArray(data.payments), 'payments must be an array');
    assert.equal(data.payments.length, 1);
    assert.equal(data.payments[0].id, paymentOid);
    assert.equal(data.payments[0].status, 'SUCCESS');
    assert.equal(Number(data.payments[0].amount), 69000);

    assert.ok(Array.isArray(data.invoices), 'invoices must be an array');
    assert.equal(data.invoices.length, 1);
    assert.equal(data.invoices[0].id, invoiceId);
    assert.equal(data.invoices[0].filename, 'E4N-2026-INV01.pdf');

    assert.equal(data.totals.payments, 1);
    assert.equal(data.totals.invoices, 1);

    // Restricted member receives account with RESTRICTED status (D07)
    const restRes = await apiFetch('/membership-records', { token: restrictedToken });
    assert.equal(restRes.status, 200);
    const restData = await restRes.json();
    assert.equal(restData.account.account_status, 'RESTRICTED');
    assert.equal(restData.account.subscription_plan, '6_MONTHS');

    // Non-admin attempting to access admin membership-records gets 403
    const forbiddenRes = await apiFetch('/admin/membership-records', { token: member1Token });
    assert.equal(forbiddenRes.status, 403, 'Regular member must receive 403 for admin records');

    // Admin accessing admin membership-records gets 200 with directory accounts
    const adminRecRes = await apiFetch('/admin/membership-records', { token: adminToken });
    assert.equal(adminRecRes.status, 200);
    const adminRecData = await adminRecRes.json();
    assert.ok(Array.isArray(adminRecData.accounts), 'Admin directory must return accounts array');
    assert.ok(adminRecData.accounts.some(a => a.id === member1Id));

    console.log('  -> PASS: GET /api/membership-records verified.');
  }

  // --------------------------------------------------------------------------
  // TEST 2: GET /api/memberships (Admin User Memberships Directory)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing GET /api/memberships (Admin User Memberships Directory)...');
    
    // Anonymous receives 401
    const anonRes = await apiFetch('/memberships');
    assert.equal(anonRes.status, 401, 'Anonymous request must return 401');

    // Regular member receives 403 (Admin-only RBAC)
    const memRes = await apiFetch('/memberships', { token: member1Token });
    assert.equal(memRes.status, 403, 'Regular member must receive 403 for /api/memberships');

    // Admin receives 200 with list of user memberships
    const adminRes = await apiFetch('/memberships', { token: adminToken });
    assert.equal(adminRes.status, 200, 'Admin must receive 200');
    const userMemberships = await adminRes.json();
    assert.ok(Array.isArray(userMemberships), 'Memberships must be an array');
    assert.ok(userMemberships.some(m => m.user_id === member1Id || m.id === member1Id));
    assert.ok(userMemberships.some(m => m.plan === '12_MONTHS'));

    console.log('  -> PASS: GET /api/memberships verified.');
  }

  // --------------------------------------------------------------------------
  // TEST 3: One-to-Ones Workflow (/api/one-to-ones)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing One-to-Ones Workflow (/api/one-to-ones)...');

    // GET /api/one-to-ones: member1 initially has empty or clean list
    const listRes1 = await apiFetch('/one-to-ones', { token: member1Token });
    assert.equal(listRes1.status, 200);
    const initialList = await listRes1.json();
    assert.ok(Array.isArray(initialList));

    // POST /api/one-to-ones/request: member1 requests meeting with member2
    const requestId = randomUUID();
    const proposedTime = new Date(Date.now() + 86400000 * 2).toISOString();
    const reqRes = await apiFetch('/one-to-ones/request', {
      method: 'POST',
      token: member1Token,
      body: {
        requestId,
        receiverId: member2Id,
        topic: 'İş Birliği Tanışması',
        proposedTime,
      },
    });
    assert.ok([200, 201].includes(reqRes.status), `Request should succeed, got ${reqRes.status}`);
    const reqData = await reqRes.json();
    assert.equal(reqData.id, requestId);
    assert.equal(reqData.requester_id, member1Id);
    assert.equal(reqData.partner_id, member2Id);
    assert.equal(reqData.status, 'PENDING');

    // Replay with same requestId is idempotent (status 200)
    const replayRes = await apiFetch('/one-to-ones/request', {
      method: 'POST',
      token: member1Token,
      body: {
        requestId,
        receiverId: member2Id,
        topic: 'İş Birliği Tanışması',
        proposedTime,
      },
    });
    assert.equal(replayRes.status, 200, 'Replayed request must return 200');

    // Member 2 sees incoming request in GET /api/one-to-ones
    const m2ListRes = await apiFetch('/one-to-ones', { token: member2Token });
    assert.equal(m2ListRes.status, 200);
    const m2List = await m2ListRes.json();
    const incomingReq = m2List.find(r => r.id === requestId);
    assert.ok(incomingReq, 'Member 2 must see incoming meeting request');
    assert.equal(incomingReq.status, 'PENDING');
    assert.equal(incomingReq.record_kind, 'REQUEST');

    // PUT /api/one-to-ones/:id/status: member2 accepts the request
    const acceptRes = await apiFetch(`/one-to-ones/${requestId}/status`, {
      method: 'PUT',
      token: member2Token,
      body: { status: 'ACCEPTED' },
    });
    assert.equal(acceptRes.status, 200, 'Member 2 accept should return 200');
    const acceptData = await acceptRes.json();
    assert.equal(acceptData.status, 'ACCEPTED');

    // POST /api/one-to-ones: member1 logs completed meeting activity
    const activityId = randomUUID();
    const meetingDate = new Date().toISOString();
    const logRes = await apiFetch('/one-to-ones', {
      method: 'POST',
      token: member1Token,
      body: {
        requestId: activityId,
        partnerId: member2Id,
        meetingDate,
        notes: 'Verimli Birebir Görüşme',
      },
    });
    assert.ok([200, 201].includes(logRes.status), `Log meeting should succeed, got ${logRes.status}`);
    const logData = await logRes.json();
    assert.equal(logData.id, activityId);
    assert.equal(logData.status, 'COMPLETED');
    assert.equal(logData.requester_id, member1Id);
    assert.equal(logData.partner_id, member2Id);

    // Verify GET /api/one-to-ones lists both activity and request
    const finalListRes = await apiFetch('/one-to-ones', { token: member1Token });
    const finalList = await finalListRes.json();
    assert.ok(finalList.some(r => r.id === activityId && r.record_kind === 'ACTIVITY'));
    assert.ok(finalList.some(r => r.id === requestId && r.record_kind === 'REQUEST'));

    console.log('  -> PASS: One-to-Ones workflow verified.');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Public Visitors Admin Workflow (/api/admin/public-visitors)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing Public Visitors Workflow (/api/admin/public-visitors)...');

    // Anonymous receives 401
    const anonRes = await apiFetch('/admin/public-visitors');
    assert.equal(anonRes.status, 401);

    // Regular member receives 403
    const memRes = await apiFetch('/admin/public-visitors', { token: member1Token });
    assert.equal(memRes.status, 403, 'Regular member must be denied');

    // Admin receives 200 with public visitors list
    const adminRes = await apiFetch('/admin/public-visitors', { token: adminToken });
    assert.equal(adminRes.status, 200);
    const visitors = await adminRes.json();
    assert.ok(Array.isArray(visitors));
    const targetVisitor = visitors.find(v => v.id === visitorId);
    assert.ok(targetVisitor, 'Seeded visitor must be present in admin list');
    assert.equal(targetVisitor.name, 'Ahmet Konuk');
    assert.equal(targetVisitor.status, 'PENDING');
    assert.equal(targetVisitor.inviter_name, 'Member One');

    // Regular member cannot update status (403)
    const memUpdateRes = await apiFetch(`/admin/public-visitors/${visitorId}/status`, {
      method: 'PUT',
      token: member1Token,
      body: { status: 'CONTACTED' },
    });
    assert.equal(memUpdateRes.status, 403);

    // Admin updates status to CONTACTED (200)
    const adminUpdateRes = await apiFetch(`/admin/public-visitors/${visitorId}/status`, {
      method: 'PUT',
      token: adminToken,
      body: { status: 'CONTACTED' },
    });
    assert.equal(adminUpdateRes.status, 200);

    // Verify status updated in DB
    const checkDb = await pool.query('SELECT status FROM public_visitors WHERE id = $1', [visitorId]);
    assert.equal(checkDb.rows[0].status, 'CONTACTED');

    console.log('  -> PASS: Public Visitors workflow verified.');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Payments History Admin Workflow (/api/payments/history)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing Payments History Admin Workflow (/api/payments/history)...');

    // Anonymous receives 401
    const anonRes = await apiFetch('/payments/history');
    assert.equal(anonRes.status, 401);

    // Regular member receives 403
    const memRes = await apiFetch('/payments/history', { token: member1Token });
    assert.equal(memRes.status, 403, 'Regular member must receive 403 for /payments/history');

    // Admin receives 200 with payment transactions and member details
    const adminRes = await apiFetch('/payments/history', { token: adminToken });
    assert.equal(adminRes.status, 200);
    const history = await adminRes.json();
    assert.ok(Array.isArray(history));
    const targetPayment = history.find(p => p.id === paymentOid || p.merchant_oid === paymentOid);
    assert.ok(targetPayment, 'Payment transaction must be found in admin payments history');
    assert.equal(targetPayment.status, 'SUCCESS');
    assert.equal(targetPayment.amount, 69000);
    assert.ok(targetPayment.member, 'Member object must be joined');
    assert.equal(targetPayment.member.id, member1Id);
    assert.equal(targetPayment.member.full_name, 'Member One');

    console.log('  -> PASS: Payments History verified.');
  }

  console.log('🎉 ALL PAR-02 CONTRACT TESTS PASSED (5/5 HTTP scenarios + static AST checks)!');

} finally {
  if (appServer) {
    await new Promise(r => appServer.close(r));
  }
  if (pool) {
    await pool.end().catch(() => {});
  }
  if (containerStarted) {
    docker(['rm', '-f', container]);
  }
}
