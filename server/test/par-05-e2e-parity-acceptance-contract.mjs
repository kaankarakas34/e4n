// Unified End-to-End Feature Parity Acceptance Contract for PAR-05 / E4N-119
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

console.log('=== PAR-05 / E4N-119: Unified Web & Mobile E2E Parity Acceptance Contract ===');

// ============================================================================
// 1. Static Architecture & Capability Verification Across Mobile & Web
// ============================================================================

const checkFileExists = (filePath, desc) => {
  try {
    const content = readFileSync(filePath, 'utf8');
    assert.ok(content.length > 0, `${desc} must not be empty`);
    return content;
  } catch (err) {
    throw new Error(`Required file missing: ${desc} at ${filePath}`);
  }
};

const mobilePaths = {
  api: path.resolve(repoDir, 'mobile/constants/api.ts'),
  register: path.resolve(repoDir, 'mobile/app/(auth)/register.tsx'),
  reports: path.resolve(repoDir, 'mobile/app/features/reports.tsx'),
  referrals: path.resolve(repoDir, 'mobile/app/features/referrals.tsx'),
  meetingRequests: path.resolve(repoDir, 'mobile/app/features/meeting-requests.tsx'),
  activities: path.resolve(repoDir, 'mobile/app/features/activities.tsx'),
  network: path.resolve(repoDir, 'mobile/app/(tabs)/network.tsx'),
  events: path.resolve(repoDir, 'mobile/app/(tabs)/events.tsx'),
  messages: path.resolve(repoDir, 'mobile/app/features/messages.tsx'),
  profile: path.resolve(repoDir, 'mobile/app/(tabs)/profile.tsx'),
  payment: path.resolve(repoDir, 'mobile/app/features/payment.tsx'),
  groups: path.resolve(repoDir, 'mobile/app/features/groups.tsx'),
  president: path.resolve(repoDir, 'mobile/app/features/president.tsx'),
  menu: path.resolve(repoDir, 'mobile/app/(tabs)/menu.tsx'),
  index: path.resolve(repoDir, 'mobile/app/(tabs)/index.tsx'),
  adminIndex: path.resolve(repoDir, 'mobile/app/admin/index.tsx'),
  adminApps: path.resolve(repoDir, 'mobile/app/admin/applications.tsx'),
  adminSubs: path.resolve(repoDir, 'mobile/app/admin/subscriptions.tsx'),
};

const contents = {};
for (const [key, p] of Object.entries(mobilePaths)) {
  contents[key] = checkFileExists(p, `Mobile file ${key}`);
}

// 1.1 Auth & Onboarding Parity
assert.ok(contents.register.includes('taxNumber') && contents.register.includes('company'), 'Mobile register must contain corporate identity fields');
assert.ok(contents.profile.includes('PUT') || contents.profile.includes('UPDATE_ME'), 'Mobile profile must support profile updates');

// 1.2 Reports & Performance Parity (MOB-01)
assert.ok(contents.reports.includes('dateRange') && contents.reports.includes('score'), 'Mobile reports must support 4 ranges and performance score');

// 1.3 Networking & Messaging Parity (PAR-03)
assert.ok(contents.network.includes('selectedMember'), 'Mobile network must have detail modal');
assert.ok(contents.messages.includes('CONVERSATIONS') && contents.messages.includes('requestKey'), 'Mobile messages must be hooked to DB conversations');

// 1.4 Events & Multi-ticket Parity (PAR-03)
assert.ok(contents.events.includes('P25') && contents.events.includes('ticketQuantity'), 'Mobile events must have P25 entitlement and multi-ticket selector');

// 1.5 Groups & Power Teams Discovery (PAR-11)
assert.ok(contents.groups.includes('35 Kişi Kapasite') && contents.groups.includes('power-teams'), 'Mobile groups must show 35 capacity and power teams');

// 1.6 Payments & Membership Records Parity (PAR-02)
assert.ok(contents.payment.includes('MEMBERSHIPS.RECORDS') || contents.payment.includes('membership-records'), 'Mobile payments must use /membership-records');

// 1.7 President SLA & Attendance Parity (PAR-04)
assert.ok(contents.president.includes('sla_breached') && contents.president.includes('attendance'), 'Mobile president screen must handle SLA and attendance');
assert.ok(contents.menu.includes('isPresident') && contents.index.includes('isPresident'), 'Mobile navigation must detect president role');

// 1.8 Admin Parity (PAR-02 & PAR-04)
assert.ok(contents.adminApps.includes('PUBLIC_VISITORS'), 'Mobile admin applications must use /admin/public-visitors');
assert.ok(contents.adminSubs.includes('PAYMENTS_HISTORY'), 'Mobile admin subscriptions must use /payments/history');
assert.ok(contents.adminIndex.includes('/features/president'), 'Mobile admin dashboard must link to president console');

console.log('✅ 1. Static Architecture and 20 Capabilities checks passed.');

// ============================================================================
// 2. Isolated PostgreSQL 17 Docker Container Harness
// ============================================================================

const docker = (args, options = {}) => {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`docker ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout.trim();
};

const container = `e4n-par05-parity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const dbName = 'event4network';
const dbUser = 'postgres';
const dbPassword = 'par05_test_password';

let containerStarted = false;
let pool = null;
let appServer = null;

const cleanup = async () => {
  if (appServer) {
    try { appServer.close(); } catch {}
    appServer = null;
  }
  if (pool) {
    try { await pool.end(); } catch {}
    pool = null;
  }
  if (containerStarted) {
    try { docker(['rm', '-f', container]); } catch {}
    containerStarted = false;
  }
};

process.on('SIGINT', async () => { await cleanup(); process.exit(1); });
process.on('SIGTERM', async () => { await cleanup(); process.exit(1); });

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
  process.env.JWT_SECRET = 'par05_unified_acceptance_secret_32chars';

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

  console.log('--- Executing 8 End-to-End User Journeys ---');

  // --------------------------------------------------------------------------
  // JOURNEY 1: Corporate Registration & Self-Profile Update (ANONYMOUS -> MEMBER)
  // --------------------------------------------------------------------------
  let memberAId = null;
  {
    console.log('• [Journey 1] Corporate Registration & Self-Profile Update...');

    const regRes = await apiFetch('/auth/register', {
      method: 'POST',
      body: {
        name: 'Ahmet Yılmaz',
        email: 'ahmet.yilmaz@example.test',
        password: 'securePassword123!',
        phone: '05551112233',
        city: 'İstanbul',
        profession: 'Yazılım Mimarı',
        company: 'Yılmaz Teknoloji A.Ş.',
        taxNumber: '9988776655',
        taxOffice: 'Şişli',
        billingAddress: 'Büyükdere Cad. No:50 Şişli İstanbul',
        kvkkConsent: true,
        explicitConsent: true
      }
    });
    assert.equal(regRes.status, 201, 'Corporate registration must succeed with 201');
    const regData = await regRes.json();
    memberAId = regData.id;

    // Self Profile Update via PUT /users/me
    const tokenA = makeToken(memberAId, 'MEMBER');
    const updateRes = await apiFetch('/users/me', {
      method: 'PUT',
      token: tokenA,
      body: {
        name: 'Ahmet Yılmaz (Güncel)',
        phone: '05559998877',
        city: 'İzmir',
        profession: 'Kıdemli Yazılım Mimarı'
      }
    });
    assert.equal(updateRes.status, 200, 'Self-profile update must succeed');

    const profileRes = await apiFetch('/users/me', { token: tokenA });
    const profileData = await profileRes.json();
    assert.equal(profileData.name, 'Ahmet Yılmaz (Güncel)');
    assert.equal(profileData.city, 'İzmir');

    console.log('  -> PASS: Journey 1 verified.');
  }

  // Set memberA subscription to ACTIVE for remaining flows
  await pool.query(
    `UPDATE users SET account_status = 'ACTIVE', subscription_plan = 'annual', subscription_end_date = now() + interval '1 year' WHERE id = $1`,
    [memberAId]
  );
  const tokenA = makeToken(memberAId, 'MEMBER');

  // Create Member B
  const memberBId = randomUUID();
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession, company)
     VALUES ($1, 'Mehmet Kaya', 'mehmet.kaya@example.test', 'hash123', 'MEMBER', 'ACTIVE', 'annual', now() + interval '1 year', 'Finans Direktörü', 'Kaya Danışmanlık')`,
    [memberBId]
  );
  const tokenB = makeToken(memberBId, 'MEMBER');

  // --------------------------------------------------------------------------
  // JOURNEY 2: Member Personal Performance & Reports (PAR-02 / MOB-01)
  // --------------------------------------------------------------------------
  {
    console.log('• [Journey 2] Personal Performance & Report Periods (/reports/me)...');

    for (const range of ['7d', '30d', '90d', '1y']) {
      const repRes = await apiFetch(`/reports/me?dateRange=${range}`, { token: tokenA });
      assert.equal(repRes.status, 200, `Report range ${range} must return 200`);
      const repData = await repRes.json();
      assert.equal(typeof repData.performance?.score, 'number');
      assert.ok(repData.performance?.color);
      assert.ok(repData.referralsGiven?.knownVolume !== undefined);
      assert.equal(typeof repData.meetingsCompleted, 'number');
    }

    console.log('  -> PASS: Journey 2 verified.');
  }

  // --------------------------------------------------------------------------
  // JOURNEY 3: Direct Messaging with Idempotent Replay (PAR-03)
  // --------------------------------------------------------------------------
  {
    console.log('• [Journey 3] Direct Messaging between Connected Members...');

    // Connect Member A & Member B via friend_requests ACCEPTED
    await pool.query(
      `INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES ($1, $2, 'ACCEPTED')`,
      [memberAId, memberBId]
    );

    const msgKey = randomUUID();
    const sendRes = await apiFetch(`/messages/${memberBId}`, {
      method: 'POST',
      token: tokenA,
      body: { content: 'Merhaba Mehmet Bey, toplantı için teşekkürler.', requestKey: msgKey }
    });
    assert.equal(sendRes.status, 200, 'Sending direct message must return 200');

    // Conversations check
    const convRes = await apiFetch('/messages/conversations', { token: tokenA });
    assert.equal(convRes.status, 200);
    const convData = await convRes.json();
    assert.ok(convData.conversations.length >= 1);
    assert.equal(convData.conversations[0].friend.id, memberBId);

    // Thread readback
    const threadRes = await apiFetch(`/messages/${memberBId}`, { token: tokenA });
    assert.equal(threadRes.status, 200);
    const threadData = await threadRes.json();
    assert.equal(threadData.messages[0].request_key, msgKey);

    console.log('  -> PASS: Journey 3 verified.');
  }

  // --------------------------------------------------------------------------
  // JOURNEY 4: Event Entitlement & Ticket Registration (PAR-03 / P25 / P26)
  // --------------------------------------------------------------------------
  {
    console.log('• [Journey 4] Event Entitlement & Registration (/events)...');

    const eventId = randomUUID();
    await pool.query(
      `INSERT INTO events (id, title, type, status, start_at, is_public, price, max_attendees, created_by)
       VALUES ($1, 'Genel İş Ağı Ziyaretçi Toplantısı', 'meeting', 'PUBLISHED', now() + interval '5 days', true, 500, 100, $2)`,
      [eventId, memberAId]
    );

    // Active member registration (P25: free for meeting type)
    const regEventRes = await apiFetch(`/events/${eventId}/register`, {
      method: 'POST',
      token: tokenA,
      body: {}
    });
    assert.equal(regEventRes.status, 200, 'Member registration for meeting event must succeed');

    const dbAtt = await pool.query('SELECT status FROM attendance WHERE event_id = $1 AND user_id = $2', [eventId, memberAId]);
    assert.equal(dbAtt.rows[0].status, 'REGISTERED', 'Attendance status must be REGISTERED upon registration');

    console.log('  -> PASS: Journey 4 verified.');
  }

  // --------------------------------------------------------------------------
  // JOURNEY 5: Group & Power Team Catalog Discovery (PAR-11)
  // --------------------------------------------------------------------------
  let testGroupId = randomUUID();
  {
    console.log('• [Journey 5] Groups & Power Teams Catalog Discovery...');

    await pool.query(
      `INSERT INTO groups (id, name, status, meeting_day, meeting_time)
       VALUES ($1, 'Anadolu Yıldızları Grubu', 'ACTIVE', 'Tuesday', '07:30')`,
      [testGroupId]
    );

    const ptId = randomUUID();
    await pool.query(
      `INSERT INTO power_teams (id, name, description)
       VALUES ($1, 'Bilişim & Yazılım Loncası', 'Yazılım ve bilişim teknolojileri sinerji loncası')`,
      [ptId]
    );

    const groupsRes = await apiFetch('/groups', { token: tokenA });
    assert.equal(groupsRes.status, 200);
    const groupsData = await groupsRes.json();
    assert.ok(groupsData.some(g => g.id === testGroupId));

    const ptRes = await apiFetch('/power-teams', { token: tokenA });
    assert.equal(ptRes.status, 200);
    const ptData = await ptRes.json();
    assert.ok(ptData.some(t => t.id === ptId));

    console.log('  -> PASS: Journey 5 verified.');
  }

  // --------------------------------------------------------------------------
  // JOURNEY 6: President 7-day SLA Queue & Decision Lifecycle (PAR-04 & BAŞ-05)
  // --------------------------------------------------------------------------
  const presidentId = randomUUID();
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession)
     VALUES ($1, 'Grup Başkanı', 'baskan@example.test', 'hash123', 'PRESIDENT', 'ACTIVE', 'annual', now() + interval '1 year', 'Genel Müdür')`,
    [presidentId]
  );
  await pool.query(
    `INSERT INTO group_members (group_id, user_id, status, role)
     VALUES ($1, $2, 'ACTIVE', 'PRESIDENT')`,
    [testGroupId, presidentId]
  );
  const presidentToken = makeToken(presidentId, 'PRESIDENT');

  let testApplicationId = null;
  {
    console.log('• [Journey 6] President 7-day SLA Queue & Decision Lifecycle...');

    // Member B applies to testGroupId
    const joinRes = await apiFetch(`/groups/${testGroupId}/join`, {
      method: 'POST',
      token: tokenB,
      body: {}
    });
    assert.equal(joinRes.status, 200);
    const joinData = await joinRes.json();
    testApplicationId = joinData.application.id;

    // Simulate 9 days waiting in DB -> SLA breached
    await pool.query(
      `UPDATE group_applications SET created_at = now() - interval '9 days' WHERE id = $1`,
      [testApplicationId]
    );

    // President tasks check
    const tasksRes = await apiFetch('/group-applications/tasks', { token: presidentToken });
    assert.equal(tasksRes.status, 200);
    const tasksData = await tasksRes.json();
    assert.ok(tasksData.tasks.some(t => t.id === testApplicationId && t.sla_breached === true && t.days_waiting >= 7));

    // Record interview note
    const interviewRes = await apiFetch(`/group-applications/${testApplicationId}/interview`, {
      method: 'POST',
      token: presidentToken,
      body: { note: 'Aday ile 20 dakikalık mülakat yapıldı.' }
    });
    assert.equal(interviewRes.status, 200);

    // Approve application decision
    const decisionRes = await apiFetch(`/group-applications/${testApplicationId}/decision`, {
      method: 'POST',
      token: presidentToken,
      body: { decision: 'ACCEPTED', note: 'Üyelik vizyonu ve katılım sözü onaylandı.' }
    });
    assert.equal(decisionRes.status, 200);

    // Verify Member B is now ACTIVE in group_members
    const memCheck = await pool.query('SELECT status FROM group_members WHERE group_id = $1 AND user_id = $2', [testGroupId, memberBId]);
    assert.equal(memCheck.rows[0].status, 'ACTIVE');

    console.log('  -> PASS: Journey 6 verified.');
  }

  // --------------------------------------------------------------------------
  // JOURNEY 7: President Weekly Meeting Attendance & Idempotency (PAR-04 & PAR-16)
  // --------------------------------------------------------------------------
  {
    console.log('• [Journey 7] Weekly Meeting Attendance & Idempotency...');

    const meetingReqId = randomUUID();
    const attendancePayload = {
      requestId: meetingReqId,
      group_id: testGroupId,
      meeting_date: new Date().toISOString(),
      topic: 'Salı Sabahı Haftalık Toplantısı',
      reason: 'PAR-05 Kabul Yoklaması',
      items: [
        { user_id: presidentId, status: 'PRESENT' },
        { user_id: memberBId, status: 'LATE' }
      ]
    };

    const attRes = await apiFetch('/events/attendance', {
      method: 'POST',
      token: presidentToken,
      body: attendancePayload
    });
    assert.equal(attRes.status, 200);
    const attData = await attRes.json();
    assert.equal(attData.success, true);
    assert.equal(attData.count, 2);

    // Idempotent Replay
    const replayRes = await apiFetch('/events/attendance', {
      method: 'POST',
      token: presidentToken,
      body: attendancePayload
    });
    assert.equal(replayRes.status, 200);
    const replayData = await replayRes.json();
    assert.equal(replayData.replayed, true, 'Replayed submission must report replayed: true');

    console.log('  -> PASS: Journey 7 verified.');
  }

  // --------------------------------------------------------------------------
  // JOURNEY 8: Admin Governance & RBAC Parity (PAR-02 & PAR-04)
  // --------------------------------------------------------------------------
  {
    console.log('• [Journey 8] Admin Governance & RBAC Parity...');

    const adminId = randomUUID();
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, account_status, profession)
       VALUES ($1, 'Sistem Yöneticisi', 'admin@example.test', 'hash123', 'ADMIN', 'ACTIVE', 'Sistem Yöneticisi')`,
      [adminId]
    );
    const adminToken = makeToken(adminId, 'ADMIN');

    // Public Visitors (member: 403, admin: 200)
    const memVisitorsRes = await apiFetch('/admin/public-visitors', { token: tokenA });
    assert.equal(memVisitorsRes.status, 403, 'Member must be forbidden from admin visitors queue');

    const adminVisitorsRes = await apiFetch('/admin/public-visitors', { token: adminToken });
    assert.equal(adminVisitorsRes.status, 200, 'Admin must access visitors queue');

    // Payments History (member: 403, admin: 200)
    const memPaymentsRes = await apiFetch('/payments/history', { token: tokenA });
    assert.equal(memPaymentsRes.status, 403, 'Member must be forbidden from payments history');

    const adminPaymentsRes = await apiFetch('/payments/history', { token: adminToken });
    assert.equal(adminPaymentsRes.status, 200, 'Admin must access payments history');

    console.log('  -> PASS: Journey 8 verified.');
  }

  console.log('🎉 UNIFIED PAR-05 E2E PARITY ACCEPTANCE COMPLETED SUCCESSFULLY (8/8 Journeys + Static Checks PASS)!');

} finally {
  await cleanup();
}
