// P32 / E4N-104: Mobile API and Screen Contract Reconciliation
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
const mobileDir = path.resolve(repoDir, 'mobile');

console.log('=== P32 / E4N-104: Mobile API & Screen Contract Reconciliation ===');

// ============================================================================
// 1. Static Screen Inventory & Routing Architecture Check
// ============================================================================

assert.ok(existsSync(mobileDir), 'Mobile directory must exist in repo');

const requiredScreens = [
  // Auth Screens
  'app/(auth)/login.tsx',
  'app/(auth)/register.tsx',
  // Tab Screens & Layout
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/network.tsx',
  'app/(tabs)/events.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/menu.tsx',
  // Feature Screens & Layout
  'app/features/_layout.tsx',
  'app/features/groups.tsx',
  'app/features/president.tsx',
  'app/features/reports.tsx',
  'app/features/payment.tsx',
  'app/features/messages.tsx',
  'app/features/support.tsx',
  'app/features/meeting-requests.tsx',
  'app/features/activities.tsx',
  'app/features/referrals.tsx',
  'app/features/settings.tsx',
  'app/features/store.tsx',
  'app/features/lms.tsx',
  // Admin Screens & Layout
  'app/admin/_layout.tsx',
  'app/admin/index.tsx',
  'app/admin/applications.tsx',
  'app/admin/subscriptions.tsx',
  'app/admin/events.tsx',
  'app/admin/groups.tsx',
  'app/admin/users.tsx',
  'app/admin/reports.tsx',
  'app/admin/shuffle.tsx',
  'app/admin/tickets.tsx',
  'app/admin/professions.tsx',
  'app/admin/timer.tsx',
  // Core API & Auth
  'constants/api.ts',
  'hooks/use-auth.tsx',
  'utils/api-client.ts',
  'utils/secure-storage.ts',
  'utils/meetings-api.ts',
  'utils/referrals-api.ts',
  'utils/support-api.ts'
];

for (const screenPath of requiredScreens) {
  const fullPath = path.resolve(mobileDir, screenPath);
  assert.ok(existsSync(fullPath), `Required screen or module must exist: ${screenPath}`);
  const content = readFileSync(fullPath, 'utf8');
  assert.ok(content.length > 50, `File content must be non-empty and substantial: ${screenPath}`);
}

// Check API_CONFIG constants mapping
const apiConstants = readFileSync(path.resolve(mobileDir, 'constants/api.ts'), 'utf8');
const requiredConstantKeys = [
  'AUTH', 'USERS', 'USER', 'GROUPS', 'GROUP_APPLICATIONS',
  'ATTENDANCE', 'EVENTS', 'REFERRALS', 'REPORTS', 'NOTIFICATIONS',
  'MESSAGES', 'ONE_TO_ONES', 'MEMBERSHIPS', 'TICKETS', 'ADMIN'
];
for (const key of requiredConstantKeys) {
  assert.ok(apiConstants.includes(`${key}:`), `API_CONFIG must define key: ${key}`);
}

console.log('✅ 1. Static Screen Inventory & Endpoint Constants verified (39/39 files present).');

// ============================================================================
// 2. Isolated Docker PostgreSQL 17 & Express HTTP Contract Execution
// ============================================================================

const container = `p32-test-db-${Date.now()}`;
const dbUser = 'postgres';
const dbPassword = 'testpassword';
const dbName = 'event4network_p32_test';

let pool;
let appServer;
let containerStarted = false;

const docker = (args, options = {}) => {
  const res = spawnSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
  if (res.status !== 0) {
    throw new Error(`docker ${args.join(' ')} failed: ${res.stderr || res.stdout}`);
  }
  return res.stdout.trim();
};

const cleanup = async () => {
  if (appServer) {
    await new Promise(r => appServer.close(r)).catch(() => {});
  }
  if (pool) {
    await pool.end().catch(() => {});
  }
  if (containerStarted) {
    try {
      spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore' });
    } catch {}
  }
};

const waitForPostgres = async (timeoutMs = 30_000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = spawnSync('docker', ['exec', container, 'pg_isready', '-U', dbUser], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    if (res.status === 0) return;
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('PostgreSQL container readiness check timed out');
};

try {
  docker([
    'run', '-d',
    '--name', container,
    '-e', `POSTGRES_DB=${dbName}`,
    '-e', `POSTGRES_USER=${dbUser}`,
    '-e', `POSTGRES_PASSWORD=${dbPassword}`,
    '-p', '127.0.0.1::5432', 'postgres:17',
  ], { timeout: 60_000 });
  containerStarted = true;
  await waitForPostgres();

  const portOutput = docker(['port', container, '5432/tcp']);
  const port = Number(portOutput.match(/127\.0\.0\.1:(\d+)/)?.[1]);
  assert.ok(port > 0, 'Valid port expected for PostgreSQL');

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
  process.env.JWT_SECRET = 'p32_mobile_contract_secret_at_least_32_chars';

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

  console.log('--- Executing Mobile Client Route Contracts ---');

  const sharedMemberId = randomUUID();
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession)
     VALUES ($1, 'P32 Üye', 'p32_member@example.test', 'hash123', 'MEMBER', 'ACTIVE', 'annual', now() + interval '1 year', 'Teknoloji Danışmanı')`,
    [sharedMemberId]
  );
  const sharedMemberToken = makeToken(sharedMemberId, 'MEMBER');

  // Contract 1: Session Hydration & Profile Contract (/users/me)
  {
    console.log('• [Contract 1] Mobile Session Hydration (/users/me)...');
    const meRes = await apiFetch('/users/me', { token: sharedMemberToken });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.id, sharedMemberId);
    assert.equal(meData.role, 'MEMBER');
    assert.equal(meData.account_status, 'ACTIVE');
    assert.equal(meData.profession, 'Teknoloji Danışmanı');

    console.log('  -> PASS: Session Hydration verified.');
  }

  // Contract 2: Home Screen Stats & System Notifications
  {
    console.log('• [Contract 2] Home Screen Feeds (/reports/stats & /notifications)...');
    const statsRes = await apiFetch('/reports/stats', { token: sharedMemberToken });
    assert.equal(statsRes.status, 200);
    const statsData = await statsRes.json();
    assert.ok(typeof statsData === 'object');

    const notifRes = await apiFetch('/notifications', { token: sharedMemberToken });
    assert.equal(notifRes.status, 200);
    const notifs = await notifRes.json();
    assert.ok(Array.isArray(notifs));

    console.log('  -> PASS: Home Feeds verified.');
  }

  // Contract 3: Network Search & Discovery
  {
    console.log('• [Contract 3] Network Search & Profiles (/users)...');
    const searchRes = await apiFetch('/users', { token: sharedMemberToken });
    assert.equal(searchRes.status, 200);
    const users = await searchRes.json();
    assert.ok(Array.isArray(users));

    console.log('  -> PASS: Network Search verified.');
  }

  // Contract 4: Events Feed & Details
  {
    console.log('• [Contract 4] Events Discovery (/events)...');
    const eventsRes = await apiFetch('/events', { token: sharedMemberToken });
    assert.equal(eventsRes.status, 200);
    const events = await eventsRes.json();
    assert.ok(Array.isArray(events));

    console.log('  -> PASS: Events Discovery verified.');
  }

  // Contract 5: Personal Reports 4 Periods (/reports/me)
  {
    console.log('• [Contract 5] Personal Reports Contract (/reports/me)...');
    const memberId = randomUUID();
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession)
       VALUES ($1, 'Rapor Testi', 'p32_report@example.test', 'hash123', 'MEMBER', 'ACTIVE', 'annual', now() + interval '1 year', 'Grafik Tasarımcı')`,
      [memberId]
    );
    const token = makeToken(memberId, 'MEMBER');

    for (const range of ['7d', '30d', '90d', '1y']) {
      const repRes = await apiFetch(`/reports/me?dateRange=${range}`, { token });
      assert.equal(repRes.status, 200, `Range ${range} must succeed`);
      const repData = await repRes.json();
      assert.ok(repData.performance);
      assert.ok(typeof repData.performance.score === 'number');
      assert.ok(repData.referralsGiven);
      assert.ok(repData.referralsReceived);
    }

    console.log('  -> PASS: Personal Reports 4 periods verified.');
  }

  // Contract 6: Membership Records & Payments (/membership-records)
  {
    console.log('• [Contract 6] Membership Records (/membership-records)...');
    const memberId = randomUUID();
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession)
       VALUES ($1, 'Ödeme Testi', 'p32_pay@example.test', 'hash123', 'MEMBER', 'ACTIVE', 'annual', now() + interval '1 year', 'Avukat')`,
      [memberId]
    );
    const token = makeToken(memberId, 'MEMBER');

    const memRes = await apiFetch('/membership-records', { token });
    assert.equal(memRes.status, 200);
    const memData = await memRes.json();
    assert.equal(memData.account.id, memberId);
    assert.ok(Array.isArray(memData.payments));
    assert.ok(Array.isArray(memData.invoices));

    console.log('  -> PASS: Membership Records verified.');
  }

  // Contract 7: Support Tickets Lifecycle (/tickets)
  {
    console.log('• [Contract 7] Support Tickets Lifecycle (/tickets)...');
    const memberId = randomUUID();
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, account_status, profession)
       VALUES ($1, 'Destek Testi', 'p32_tick@example.test', 'hash123', 'MEMBER', 'ACTIVE', 'Mühendis')`,
      [memberId]
    );
    const token = makeToken(memberId, 'MEMBER');

    const createRes = await apiFetch('/tickets', {
      method: 'POST',
      token,
      body: {
        subject: 'Mobil Bildirim Sorunu',
        message: 'Bildirimler zamanında gelmiyor.',
        requestKey: randomUUID()
      }
    });
    assert.equal(createRes.status, 201);
    const ticketData = await createRes.json();
    assert.equal(ticketData.subject, 'Mobil Bildirim Sorunu');
    assert.equal(ticketData.status, 'OPEN');

    const listRes = await apiFetch('/tickets', { token });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(listData.some(t => t.id === ticketData.id));

    console.log('  -> PASS: Support Tickets Lifecycle verified.');
  }

  // Contract 8: Catalog Discovery (/groups & /power-teams)
  {
    console.log('• [Contract 8] Catalog Discovery (/groups & /power-teams)...');
    const grpRes = await apiFetch('/groups', { token: sharedMemberToken });
    assert.equal(grpRes.status, 200);
    const grpData = await grpRes.json();
    assert.ok(Array.isArray(grpData));

    const ptRes = await apiFetch('/power-teams', { token: sharedMemberToken });
    assert.equal(ptRes.status, 200);
    const ptData = await ptRes.json();
    assert.ok(Array.isArray(ptData));

    console.log('  -> PASS: Catalog Discovery verified.');
  }

  // Contract 9: President & Admin RBAC Security Boundaries
  {
    console.log('• [Contract 9] RBAC Security Boundaries Across Roles...');
    const adminId = randomUUID();
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, account_status, profession)
       VALUES ($1, 'P32 Admin', 'p32_sysadmin@example.test', 'hash123', 'ADMIN', 'ACTIVE', 'Sistem Yöneticisi')`,
      [adminId]
    );
    const adminToken = makeToken(adminId, 'ADMIN');

    // Admin-only endpoints
    const memVis = await apiFetch('/admin/public-visitors', { token: sharedMemberToken });
    assert.equal(memVis.status, 403, 'Member must be forbidden from admin public visitors');

    const adminVis = await apiFetch('/admin/public-visitors', { token: adminToken });
    assert.equal(adminVis.status, 200, 'Admin must access admin public visitors');

    const memPay = await apiFetch('/payments/history', { token: sharedMemberToken });
    assert.equal(memPay.status, 403, 'Member must be forbidden from payments history');

    const adminPay = await apiFetch('/payments/history', { token: adminToken });
    assert.equal(adminPay.status, 200, 'Admin must access payments history');

    console.log('  -> PASS: RBAC Security Boundaries verified.');
  }

  console.log('🎉 P32 / E4N-104: ALL 9 CONTRACTS + 39 STATIC CHECKS PASSED WITH 100% SUCCESS!');

} finally {
  await cleanup();
}
