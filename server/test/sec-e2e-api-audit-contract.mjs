import { spawnSync } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-sec-api-audit-${randomUUID().slice(0, 8)}`;
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
  console.log('--- SEC-03 (E4N-120): Comprehensive Web, Mobile API & Supabase Security Audit ---');
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
  process.env.JWT_SECRET = 'isolated_fixture_signing_key_32chars_min!';
  process.env.CRON_SECRET = 'isolated_cron_secret_min_32_characters_for_testing!';
  process.env.WEB_JOB_INVOCATION_ENABLED = 'true';

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
  const appliedMigrations = await applyVersionedSchema();
  assert.equal(appliedMigrations.applied.length, 28, 'Zero DDL: Expected exactly 28 migrations');

  // Seed Users: Admin, Member A, Member B, President
  const adminId = randomUUID();
  const memberAId = randomUUID();
  const memberBId = randomUUID();
  const presidentId = randomUUID();
  const groupId = randomUUID();

  const passwordHash = await bcrypt.hash('secretPassword123!', 10);

  // Group
  await pool.query(
    "INSERT INTO groups(id, name, status, meeting_day, meeting_time) VALUES($1, 'Boğaziçi Grubu', 'ACTIVE', 'Perşembe', '07:00')",
    [groupId]
  );

  // Admin
  await pool.query(
    "INSERT INTO users(id, name, email, password_hash, role, account_status, profession, city) VALUES($1, 'Admin User', 'admin@example.invalid', $2, 'ADMIN', 'ACTIVE', 'Yönetim', 'İstanbul')",
    [adminId, passwordHash]
  );

  // Member A (active member of Group)
  await pool.query(
    "INSERT INTO users(id, name, email, password_hash, role, account_status, profession, city, company, tax_number, tax_office, billing_address) VALUES($1, 'Member A', 'member.a@example.invalid', $2, 'MEMBER', 'ACTIVE', 'Mimar', 'İstanbul', 'A Mimarlık Ltd', '1234567890', 'Kadıköy', 'Kadıköy İst')",
    [memberAId, passwordHash]
  );
  await pool.query(
    "INSERT INTO group_members(group_id, user_id, status, role, joined_at) VALUES($1, $2, 'ACTIVE', 'MEMBER', NOW())",
    [groupId, memberAId]
  );

  // Member B (not member of Group)
  await pool.query(
    "INSERT INTO users(id, name, email, password_hash, role, account_status, profession, city, company, tax_number, tax_office, billing_address) VALUES($1, 'Member B', 'member.b@example.invalid', $2, 'MEMBER', 'ACTIVE', 'Avukat', 'Ankara', 'B Hukuk', '9876543210', 'Çankaya', 'Çankaya Cad')",
    [memberBId, passwordHash]
  );

  // President (President of Group)
  await pool.query(
    "INSERT INTO users(id, name, email, password_hash, role, account_status, profession, city) VALUES($1, 'President User', 'president@example.invalid', $2, 'PRESIDENT', 'ACTIVE', 'Finans', 'İstanbul')",
    [presidentId, passwordHash]
  );
  await pool.query(
    "INSERT INTO group_members(group_id, user_id, status, role, joined_at) VALUES($1, $2, 'ACTIVE', 'PRESIDENT', NOW())",
    [groupId, presidentId]
  );

  const { signJwt } = await import('../src/config/security.js');
  const adminToken = signJwt({ id: adminId, email: 'admin@example.invalid', role: 'ADMIN', status: 'ACTIVE' });
  const memberAToken = signJwt({ id: memberAId, email: 'member.a@example.invalid', role: 'MEMBER', status: 'ACTIVE' });
  const memberBToken = signJwt({ id: memberBId, email: 'member.b@example.invalid', role: 'MEMBER', status: 'ACTIVE' });
  const presidentToken = signJwt({ id: presidentId, email: 'president@example.invalid', role: 'PRESIDENT', status: 'ACTIVE' });

  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  console.log(`Live isolated test server started on ${base}`);

  // ==========================================
  // GATE 1: ANONYMOUS ACCESS REJECTION (401)
  // ==========================================
  console.log('\n[Gate 1] Testing Unauthenticated / Anonymous Access Rejection (401)...');
  const anonRoutes = [
    { method: 'GET', url: '/api/users/me' },
    { method: 'PUT', url: '/api/users/me', body: { name: 'Hack' } },
    { method: 'GET', url: '/api/groups' },
    { method: 'GET', url: `/api/groups/${groupId}` },
    { method: 'GET', url: `/api/groups/${groupId}/members` },
    { method: 'GET', url: '/api/memberships' },
    { method: 'GET', url: '/api/admin/members' },
    { method: 'GET', url: '/api/admin/group-catalog' },
    { method: 'GET', url: '/api/admin/reports' },
    { method: 'GET', url: '/api/admin/visitor-queue' },
    { method: 'GET', url: `/api/invoices/${randomUUID()}` },
    { method: 'GET', url: '/api/documents' },
    { method: 'GET', url: '/api/messages/conversations' },
    { method: 'GET', url: '/api/user/connections' },
    { method: 'GET', url: '/api/cron/web-jobs/event-completion' },
  ];

  for (const r of anonRoutes) {
    const res = await fetch(`${base}${r.url}`, {
      method: r.method,
      headers: r.body ? { 'Content-Type': 'application/json' } : {},
      body: r.body ? JSON.stringify(r.body) : undefined,
    });
    assert.equal(res.status, 401, `Expected 401 for anonymous ${r.method} ${r.url}, got ${res.status}`);
  }
  console.log('  -> PASS: 15/15 anonymous protected routes rejected with HTTP 401.');

  // ==========================================
  // GATE 2: ROLE-BASED ACCESS & PRIVILEGE ESCALATION (403)
  // ==========================================
  console.log('\n[Gate 2] Testing Role-Based Authorization & Privilege Escalation (403)...');
  const forbiddenForMember = [
    { method: 'GET', url: '/api/admin/members' },
    { method: 'POST', url: '/api/admin/members', body: { name: 'New', email: 'n@e.co' } },
    { method: 'GET', url: '/api/admin/group-catalog' },
    { method: 'GET', url: '/api/admin/reports' },
    { method: 'GET', url: '/api/admin/visitor-queue' },
    { method: 'GET', url: '/api/admin/email-config' },
    { method: 'GET', url: '/api/memberships' },
    { method: 'POST', url: '/api/memberships', body: { user_id: memberBId, plan: '12_MONTHS' } },
    { method: 'PUT', url: `/api/memberships/${memberBId}`, body: { plan: '12_MONTHS' } },
    { method: 'POST', url: '/api/memberships/extend', body: { userId: memberBId, months: 6 } },
    { method: 'PUT', url: `/api/users/${memberBId}`, body: { role: 'ADMIN' } },
    { method: 'DELETE', url: `/api/groups/${groupId}` },
    { method: 'DELETE', url: `/api/power-teams/${randomUUID()}` },
    { method: 'DELETE', url: `/api/admin/members/${memberBId}` },
    { method: 'DELETE', url: `/api/admin/accounting/payments/MEMBER/${memberBId}` },
    { method: 'POST', url: `/api/admin/accounting/MEMBER/${memberBId}/upload-invoice` },
  ];

  for (const r of forbiddenForMember) {
    const res = await fetch(`${base}${r.url}`, {
      method: r.method,
      headers: {
        Authorization: `Bearer ${memberAToken}`,
        ...(r.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: r.body ? JSON.stringify(r.body) : undefined,
    });
    assert.equal(res.status, 403, `Expected 403 for member attempting ${r.method} ${r.url}, got ${res.status}`);
  }
  console.log('  -> PASS: 16/16 administrative mutation/query routes blocked for regular MEMBER with HTTP 403.');

  // ==========================================
  // GATE 3: HORIZONTAL ACCESS CONTROL & IDOR DEFENSE
  // ==========================================
  console.log('\n[Gate 3] Testing Horizontal Authorization & IDOR Defenses...');

  // 3.1. Group Members Isolation: Member B is NOT a member of Group -> Cannot view /api/groups/:id/members
  const groupMembersB = await fetch(`${base}/api/groups/${groupId}/members`, {
    headers: { Authorization: `Bearer ${memberBToken}` },
  });
  assert.equal(groupMembersB.status, 403, 'Member B must be forbidden from accessing members of a group they do not belong to');

  // Member A IS an active member of Group -> Can view
  const groupMembersA = await fetch(`${base}/api/groups/${groupId}/members`, {
    headers: { Authorization: `Bearer ${memberAToken}` },
  });
  assert.equal(groupMembersA.status, 200, 'Member A must be allowed to view members of their own group');
  const membersData = await groupMembersA.json();
  assert.ok(Array.isArray(membersData) && membersData.some(m => m.id === memberAId));

  // 3.2. Private Billing Information Isolation in Profiles:
  // Member A requests Member B's profile -> Contact & billing details are redacted
  const profileRes = await fetch(`${base}/api/user/profiles/${memberBId}`, {
    headers: { Authorization: `Bearer ${memberAToken}` },
  });
  assert.equal(profileRes.status, 200);
  const profileData = await profileRes.json();
  assert.equal(profileData.billingVisible, false, 'Billing details of other member must not be visible without admin or self');
  assert.equal(profileData.profile.tax_number, undefined, 'Tax number must be omitted for non-owner');
  assert.equal(profileData.profile.billing_address, undefined, 'Billing address must be omitted for non-owner');

  // Admin requests Member B's profile -> billing details visible
  const adminProfileRes = await fetch(`${base}/api/user/profiles/${memberBId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminProfileRes.status, 200);
  const adminProfileData = await adminProfileRes.json();
  assert.equal(adminProfileData.billingVisible, true, 'Admin must have visibility into billing');
  assert.equal(adminProfileData.profile.tax_number, '9876543210');

  // 3.3. Invoices IDOR: Seed an invoice for Member A
  const invoiceId = randomUUID();
  const pdfBuffer = Buffer.from('%PDF-1.4 sample invoice content');
  await pool.query(
    `INSERT INTO invoice_files(id, member_id, uploaded_by, request_key, fingerprint, filename, size_bytes, content, email_state)
     VALUES($1, $2, $3, $4, $5, 'invoice.pdf', $6, $7, 'SENT')`,
    [invoiceId, memberAId, adminId, randomUUID(), createHash('sha256').update('invoice').digest('hex'), pdfBuffer.length, pdfBuffer]
  );

  // Member B tries to download Member A's invoice -> 404 (IDOR blocked)
  const invoiceBRes = await fetch(`${base}/api/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${memberBToken}` },
  });
  assert.equal(invoiceBRes.status, 404, 'Member B must not be able to download Member A invoice (404 expected)');

  // Member A downloads their own invoice -> 200
  const invoiceARes = await fetch(`${base}/api/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${memberAToken}` },
  });
  assert.equal(invoiceARes.status, 200, 'Member A must be able to download own invoice');

  // Admin downloads Member A's invoice -> 200
  const invoiceAdminRes = await fetch(`${base}/api/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(invoiceAdminRes.status, 200, 'Admin must be able to download invoice');

  // 3.4. Support Tickets IDOR: Seed a ticket for Member A
  const ticketId = randomUUID();
  await pool.query(
    "INSERT INTO tickets(id, user_id, subject, status) VALUES($1, $2, 'A support request', 'OPEN')",
    [ticketId, memberAId]
  );

  // Member B tries to update Member A's ticket status -> 403
  const ticketStatusB = await fetch(`${base}/api/support/${ticketId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${memberBToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'CLOSED' }),
  });
  assert.equal(ticketStatusB.status, 403, 'Member B must not be able to modify ticket status');

  // Admin updates ticket status -> 200
  const ticketStatusAdmin = await fetch(`${base}/api/support/${ticketId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'CLOSED' }),
  });
  assert.equal(ticketStatusAdmin.status, 200, 'Admin can update ticket status');
  console.log('  -> PASS: IDOR defenses verified across Group Members, Profiles, Invoices, and Tickets.');

  // ==========================================
  // GATE 4: INJECTION ATTACKS & INPUT VALIDATION
  // ==========================================
  console.log('\n[Gate 4] Testing Injection Attacks & Input Validation...');

  // 4.1. SQL Injection strings in search parameters
  const sqliPayloads = [
    "' OR 1=1 --",
    "'; DROP TABLE users; --",
    "admin'--",
    "1 UNION SELECT null, null, null--",
  ];

  for (const payload of sqliPayloads) {
    const searchRes = await fetch(`${base}/api/public/members/search?q=${encodeURIComponent(payload)}`);
    assert.equal(searchRes.status, 200, 'Search should handle SQL injection safely without error');
    const searchData = await searchRes.json();
    assert.ok(Array.isArray(searchData), 'Search must return array without executing raw SQL');

    // Events query SQLi test
    const eventsRes = await fetch(`${base}/api/events?type=${encodeURIComponent(payload)}`);
    assert.equal(eventsRes.status, 200);
  }

  // 4.2. Invalid UUID format rejection (never 500)
  const invalidUuidRoutes = [
    { method: 'GET', url: '/api/groups/not-a-valid-uuid/members', token: adminToken },
    { method: 'GET', url: '/api/invoices/not-a-valid-uuid', token: adminToken },
    { method: 'GET', url: '/api/documents/not-a-valid-uuid/download', token: adminToken },
  ];

  for (const r of invalidUuidRoutes) {
    const res = await fetch(`${base}${r.url}`, {
      method: r.method,
      headers: { Authorization: `Bearer ${r.token}` },
    });
    assert.ok(
      [400, 404].includes(res.status),
      `Invalid UUID on ${r.url} must return 400 or 404, got ${res.status}`
    );
  }

  // 4.3. Null-byte rejection in text fields
  const nullByteRes = await fetch(`${base}/api/users/me`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${memberAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Hacked\u0000Name' }),
  });
  assert.equal(nullByteRes.status, 400, 'Null-byte in text field must be rejected with 400 Bad Request');
  console.log('  -> PASS: Injection payloads safely escaped/parameterized; malformed inputs safely rejected.');

  // ==========================================
  // GATE 5: INFORMATION DISCLOSURE & CREDENTIAL HYGIENE
  // ==========================================
  console.log('\n[Gate 5] Testing Information Disclosure & Password Protection...');

  // 5.1. password_hash is never exposed in responses
  const selfRes = await fetch(`${base}/api/users/me`, {
    headers: { Authorization: `Bearer ${memberAToken}` },
  });
  assert.equal(selfRes.status, 200);
  const selfData = await selfRes.json();
  assert.equal(selfData.password_hash, undefined, 'password_hash must never be returned in /api/users/me');

  const adminMembersRes = await fetch(`${base}/api/admin/members`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminMembersRes.status, 200);
  const adminMembersData = await adminMembersRes.json();
  for (const m of adminMembersData) {
    assert.equal(m.password_hash, undefined, 'password_hash must never be returned in /api/admin/members');
  }

  // 5.2. Masking smtp_pass in email-config
  await pool.query(
    "INSERT INTO email_configurations(smtp_host, smtp_port, smtp_user, smtp_pass, sender_email, sender_name, is_active) VALUES('smtp.example.com', 587, 'info@ex.invalid', 'real_secret_smtp_password', 'info@ex.invalid', 'Event4Network', true)"
  );
  const emailConfigRes = await fetch(`${base}/api/admin/email-config`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(emailConfigRes.status, 200);
  const emailConfigs = await emailConfigRes.json();
  assert.ok(emailConfigs.length > 0);
  assert.equal(emailConfigs[0].smtp_pass, '********', 'smtp_pass must be masked as ******** in API responses');

  // 5.3. Global Security Headers
  const healthRes = await fetch(`${base}/api/health-check`);
  assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(healthRes.headers.get('x-frame-options'), 'DENY');
  assert.equal(healthRes.headers.get('x-xss-protection'), '0');
  assert.equal(healthRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  console.log('  -> PASS: 0 credential leaks; password_hash hidden; smtp_pass masked; security headers verified.');

  // ==========================================
  // GATE 6: RATE LIMITING & BRUTE FORCE PROTECTION
  // ==========================================
  console.log('\n[Gate 6] Testing Rate Limiting & Abuse Defense...');
  const { createRateLimiter } = await import('../src/middleware/rate-limiter.js');
  const testLimiter = createRateLimiter({
    windowMs: 10_000,
    max: 3,
    skip: () => false, // Force enforcement during this scenario
  });

  const dummyReq = { headers: { 'x-forwarded-for': '203.0.113.195' } };
  const mockResponses = [];
  for (let i = 0; i < 5; i += 1) {
    let status = 200;
    let headers = {};
    let body = null;
    const res = {
      setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
      status: (s) => {
        status = s;
        return {
          json: (b) => { body = b; },
        };
      },
    };
    let nextCalled = false;
    testLimiter(dummyReq, res, () => { nextCalled = true; });
    mockResponses.push({ status, headers, body, nextCalled });
  }

  assert.equal(mockResponses[0].nextCalled, true);
  assert.equal(mockResponses[0].headers['x-ratelimit-remaining'], 2);
  assert.equal(mockResponses[1].nextCalled, true);
  assert.equal(mockResponses[1].headers['x-ratelimit-remaining'], 1);
  assert.equal(mockResponses[2].nextCalled, true);
  assert.equal(mockResponses[2].headers['x-ratelimit-remaining'], 0);
  assert.equal(mockResponses[3].nextCalled, false);
  assert.equal(mockResponses[3].status, 429, 'Request 4 must be rate-limited (429)');
  assert.equal(mockResponses[3].body.code, 'RATE_LIMIT_EXCEEDED');
  assert.ok(mockResponses[3].headers['retry-after'] > 0);
  assert.equal(mockResponses[4].status, 429, 'Request 5 must also be rate-limited (429)');
  console.log('  -> PASS: Rate limiter correctly tracks tokens, applies headers, and enforces HTTP 429 upon quota breach.');

  // ==========================================
  // GATE 7: SUPABASE POSTGREST & RLS INTEGRATION
  // ==========================================
  console.log('\n[Gate 7] Verifying Supabase RLS & PostgREST Barrier Posture...');
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
    END $$;
  `);

  const planSql = readFileSync(path.join(serverDir, 'supabase_security_plan.sql'), 'utf8');
  await pool.query(planSql);

  const rlsCheck = await pool.query(
    "SELECT count(*)::int as count FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true"
  );
  assert.equal(rlsCheck.rows[0].count, 50, 'All 50 public tables must have RLS active');

  const tablesCount = await pool.query(
    "SELECT count(*)::int as count FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations'"
  );
  assert.equal(tablesCount.rows[0].count, 50, 'Zero-DDL invariant: exactly 50 public application tables');

  let anonBlocked = false;
  const anonClient = await pool.connect();
  try {
    await anonClient.query('BEGIN');
    await anonClient.query('SET LOCAL ROLE anon');
    try {
      await anonClient.query('SELECT count(*) FROM users');
    } catch (err) {
      anonBlocked = err.code === '42501';
    }
    await anonClient.query('ROLLBACK');
  } finally {
    anonClient.release();
  }
  assert.ok(anonBlocked, 'anon role must receive 42501 on users table');
  console.log('  -> PASS: 50/50 public tables verified with active RLS; 42501 PostgREST denial verified.');

  console.log('\n=======================================================');
  console.log('SEC-03 (E4N-120) PASS: Comprehensive Security Audit Succeeded.');
  console.log('All 7 Security Gates Verified with 100% Success.');
  console.log('=======================================================\n');
}

main()
  .catch((err) => {
    console.error('SEC-03 Audit FAILED:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (appServer) {
      await new Promise(resolve => appServer.close(resolve));
    }
    if (pool) {
      await pool.end().catch(() => {});
    }
    if (containerStarted) {
      docker(['stop', container], { timeout: 15_000 });
    }
  });
