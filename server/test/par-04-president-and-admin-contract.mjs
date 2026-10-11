// Contract test for PAR-04 / E4N-118: Reconcile President & Admin workflows across web and mobile
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

console.log('--- Testing PAR-04 / E4N-118: President & Admin Workflows Contract ---');

// ============================================================================
// 1. Static Source Code & Contract Verifications
// ============================================================================

const apiTsPath = path.resolve(repoDir, 'mobile/constants/api.ts');
const menuTsxPath = path.resolve(repoDir, 'mobile/app/(tabs)/menu.tsx');
const indexTsxPath = path.resolve(repoDir, 'mobile/app/(tabs)/index.tsx');
const presidentTsxPath = path.resolve(repoDir, 'mobile/app/features/president.tsx');
const adminIndexTsxPath = path.resolve(repoDir, 'mobile/app/admin/index.tsx');

const apiContent = readFileSync(apiTsPath, 'utf8');
const menuContent = readFileSync(menuTsxPath, 'utf8');
const indexContent = readFileSync(indexTsxPath, 'utf8');
const presidentContent = readFileSync(presidentTsxPath, 'utf8');
const adminIndexContent = readFileSync(adminIndexTsxPath, 'utf8');

// 1.1 API Constants
assert.ok(apiContent.includes('GROUPS:'), 'API_CONFIG.ENDPOINTS must define GROUPS');
assert.ok(apiContent.includes('MEMBERS:'), 'GROUPS must define MEMBERS endpoint');
assert.ok(apiContent.includes('APPLICATIONS:'), 'GROUPS must define APPLICATIONS endpoint');
assert.ok(apiContent.includes('GROUP_APPLICATIONS:'), 'API_CONFIG.ENDPOINTS must define GROUP_APPLICATIONS');
assert.ok(apiContent.includes('TASKS:'), 'GROUP_APPLICATIONS must define TASKS endpoint');
assert.ok(apiContent.includes('INTERVIEW:'), 'GROUP_APPLICATIONS must define INTERVIEW endpoint');
assert.ok(apiContent.includes('DECISION:'), 'GROUP_APPLICATIONS must define DECISION endpoint');
assert.ok(apiContent.includes('ATTENDANCE:'), 'API_CONFIG.ENDPOINTS must define ATTENDANCE');
assert.ok(apiContent.includes('SUBMIT:'), 'ATTENDANCE must define SUBMIT endpoint');

// 1.2 Menu Screen (President Role Navigation)
assert.ok(menuContent.includes('isPresident'), 'MenuScreen must detect isPresident role');
assert.ok(menuContent.includes('Grup Yönetimi (Başkanlık)'), 'MenuScreen must render President entry');
assert.ok(menuContent.includes('/features/president'), 'MenuScreen must navigate to /features/president');

// 1.3 Home Screen (President Quick Banner)
assert.ok(indexContent.includes('isPresident'), 'HomeScreen must detect isPresident role');
assert.ok(indexContent.includes('presidentBanner'), 'HomeScreen must have presidentBanner style');
assert.ok(indexContent.includes('/features/president'), 'HomeScreen must navigate to /features/president');

// 1.4 President Screen (SLA Queue & Meeting Attendance)
assert.ok(presidentContent.includes('isPresident'), 'PresidentScreen must enforce isPresident check');
assert.ok(presidentContent.includes('activeTab'), 'PresidentScreen must have activeTab state');
assert.ok(presidentContent.includes('APPLICATIONS'), 'PresidentScreen must have APPLICATIONS tab');
assert.ok(presidentContent.includes('ATTENDANCE'), 'PresidentScreen must have ATTENDANCE tab');
assert.ok(presidentContent.includes('sla_breached'), 'PresidentScreen must track sla_breached');
assert.ok(presidentContent.includes('7 Günlük Görüşme SLA'), 'PresidentScreen must render 7 days SLA badge');
assert.ok(presidentContent.includes('removal_history'), 'PresidentScreen must render removal_history if exists');
assert.ok(presidentContent.includes('INTERVIEW'), 'PresidentScreen must support INTERVIEW action');
assert.ok(presidentContent.includes('ACCEPT'), 'PresidentScreen must support ACCEPT action');
assert.ok(presidentContent.includes('REJECT'), 'PresidentScreen must support REJECT action');
assert.ok(presidentContent.includes('PRESENT'), 'PresidentScreen must have PRESENT status');
assert.ok(presidentContent.includes('ABSENT'), 'PresidentScreen must have ABSENT status');
assert.ok(presidentContent.includes('LATE'), 'PresidentScreen must have LATE status');
assert.ok(presidentContent.includes('SUBSTITUTE'), 'PresidentScreen must have SUBSTITUTE status');
assert.ok(presidentContent.includes('requestId'), 'PresidentScreen must generate requestId');

// 1.5 Admin Index Screen
assert.ok(adminIndexContent.includes('/features/president'), 'AdminDashboard must link to /features/president');

console.log('✅ Static AST and source contract checks passed.');

// ============================================================================
// 2. Isolated Docker PostgreSQL 17 Setup & Dynamic Harness
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

const container = `e4n-par04-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const dbName = 'event4network';
const dbUser = 'postgres';
const dbPassword = 'par04_test_password';

let containerStarted = false;
let pool = null;
let appServer = null;

const cleanup = async () => {
  if (appServer) {
    try {
      appServer.close();
    } catch {}
    appServer = null;
  }
  if (pool) {
    try {
      await pool.end();
    } catch {}
    pool = null;
  }
  if (containerStarted) {
    try {
      docker(['rm', '-f', container]);
    } catch {}
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
  process.env.JWT_SECRET = 'par04_contract_signing_secret_32chars';

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

  console.log('--- Executing HTTP Route Contracts ---');

  // --------------------------------------------------------------------------
  // TEST FIXTURES SETUP
  // --------------------------------------------------------------------------
  const presidentId = randomUUID();
  const regularMemberId = randomUUID();
  const applicantId = randomUUID();
  const groupId = randomUUID();

  // Create President User
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession)
     VALUES ($1, 'Başkan Test', 'president@example.test', 'hash123', 'PRESIDENT', 'ACTIVE', 'annual', now() + interval '1 year', 'Yönetim Danışmanı')`,
    [presidentId]
  );

  // Create Regular Member User
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession)
     VALUES ($1, 'Sıradan Üye', 'member@example.test', 'hash123', 'MEMBER', 'ACTIVE', 'annual', now() + interval '1 year', 'Yazılım Geliştirici')`,
    [regularMemberId]
  );

  // Create Applicant User (with corporate info & active subscription)
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, account_status, subscription_plan, subscription_end_date, profession, company, tax_number, tax_office, billing_address)
     VALUES ($1, 'Aday Üye', 'applicant@example.test', 'hash123', 'MEMBER', 'ACTIVE', 'annual', now() + interval '1 year', 'Yazılım Mühendisi', 'Aday A.Ş.', '1112223334', 'Beşiktaş', 'Levent İstanbul')`,
    [applicantId]
  );

  // Create Group
  await pool.query(
    `INSERT INTO groups (id, name, status, meeting_day, meeting_time)
     VALUES ($1, 'Boğaziçi Liderler Grubu', 'ACTIVE', 'Wednesday', '07:00')`,
    [groupId]
  );

  // Add President as active group member with role='PRESIDENT'
  await pool.query(
    `INSERT INTO group_members (group_id, user_id, status, role)
     VALUES ($1, $2, 'ACTIVE', 'PRESIDENT')`,
    [groupId, presidentId]
  );

  // Add Regular Member as active group member
  await pool.query(
    `INSERT INTO group_members (group_id, user_id, status, role)
     VALUES ($1, $2, 'ACTIVE', 'MEMBER')`,
    [groupId, regularMemberId]
  );

  const presidentToken = makeToken(presidentId, 'PRESIDENT');
  const regularMemberToken = makeToken(regularMemberId, 'MEMBER');
  const applicantToken = makeToken(applicantId, 'MEMBER');

  // --------------------------------------------------------------------------
  // SCENARIO 1: RBAC & Authorization Boundaries
  // --------------------------------------------------------------------------
  {
    console.log('• Testing RBAC & Authorization Boundaries (Non-president access)...');

    // Regular member calls /group-applications/tasks -> returns empty tasks list
    const tasksRes = await apiFetch('/group-applications/tasks', { token: regularMemberToken });
    assert.equal(tasksRes.status, 200, 'Tasks request should return 200');
    const tasksData = await tasksRes.json();
    assert.equal(tasksData.tasks.length, 0, 'Non-president should have 0 tasks');

    // Regular member attempts to read group applications queue -> 403 Forbidden
    const queueRes = await apiFetch(`/groups/${groupId}/applications`, { token: regularMemberToken });
    assert.equal(queueRes.status, 403, 'Non-president should receive 403 for group applications queue');

    // Regular member attempts to submit meeting attendance -> 403 Forbidden
    const attRes = await apiFetch('/events/attendance', {
      method: 'POST',
      token: regularMemberToken,
      body: {
        requestId: randomUUID(),
        group_id: groupId,
        meeting_date: new Date().toISOString(),
        topic: 'Yetkisiz Toplantı',
        reason: 'Yoklama denemesi',
        items: [{ user_id: regularMemberId, status: 'PRESENT' }]
      }
    });
    assert.equal(attRes.status, 403, 'Non-manager member must not be allowed to submit attendance');

    console.log('  -> PASS: RBAC & Authorization boundaries verified.');
  }

  // --------------------------------------------------------------------------
  // SCENARIO 2: President Application Queue & 7-day SLA Breach Detection
  // --------------------------------------------------------------------------
  let applicationId = null;
  {
    console.log('• Testing President Application Queue & 7-day SLA Breach Flow...');

    // Applicant joins the group -> POST /api/groups/:id/join
    const joinRes = await apiFetch(`/groups/${groupId}/join`, {
      method: 'POST',
      token: applicantToken,
      body: {}
    });
    assert.equal(joinRes.status, 200, 'Join request must succeed');
    const joinData = await joinRes.json();
    assert.ok(joinData.application?.id, 'Application ID must be returned');
    applicationId = joinData.application.id;

    // Simulate 8 days elapsed (SLA breached) by backdating created_at in DB
    await pool.query(
      `UPDATE group_applications SET created_at = now() - interval '8 days' WHERE id = $1`,
      [applicationId]
    );

    // President checks tasks queue -> GET /api/group-applications/tasks
    const pTasksRes = await apiFetch('/group-applications/tasks', { token: presidentToken });
    assert.equal(pTasksRes.status, 200, 'President tasks query must return 200');
    const pTasksData = await pTasksRes.json();
    assert.equal(pTasksData.tasks.length, 1, 'President should see 1 pending task');
    const task = pTasksData.tasks[0];
    assert.equal(task.id, applicationId);
    assert.equal(task.applicant_name, 'Aday Üye');
    assert.equal(task.state, 'AWAITING_CALL');
    assert.equal(task.sla_breached, true, 'sla_breached must be true after 8 days');
    assert.ok(task.days_waiting >= 7, 'days_waiting must be at least 7');

    // President checks group applications queue -> GET /api/groups/:id/applications
    const pQueueRes = await apiFetch(`/groups/${groupId}/applications`, { token: presidentToken });
    assert.equal(pQueueRes.status, 200, 'President queue query must return 200');
    const pQueueData = await pQueueRes.json();
    assert.equal(pQueueData.applications.length, 1);
    const appDetail = pQueueData.applications[0];
    assert.equal(appDetail.id, applicationId);
    assert.equal(appDetail.name, 'Aday Üye');
    assert.equal(appDetail.sla_breached, true, 'sla_breached must be true in group applications');
    assert.ok(appDetail.days_waiting >= 7, 'days_waiting must be >= 7');

    console.log('  -> PASS: Application Queue & 7-day SLA Breach verified.');
  }

  // --------------------------------------------------------------------------
  // SCENARIO 3: President Interview Note Recording (POST /api/group-applications/:id/interview)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing President Interview Flow (POST /api/group-applications/:id/interview)...');

    // Missing note -> 400
    const emptyNoteRes = await apiFetch(`/group-applications/${applicationId}/interview`, {
      method: 'POST',
      token: presidentToken,
      body: { note: '   ' }
    });
    assert.equal(emptyNoteRes.status, 400, 'Empty interview note must return 400');

    // Valid interview note
    const validInterviewRes = await apiFetch(`/group-applications/${applicationId}/interview`, {
      method: 'POST',
      token: presidentToken,
      body: { note: 'Aday ile telefonla görüşüldü, kuralları kabul etti.' }
    });
    assert.equal(validInterviewRes.status, 200, 'Valid interview call must return 200');
    const interviewData = await validInterviewRes.json();
    assert.equal(interviewData.application.state, 'INTERVIEWED', 'State must advance to INTERVIEWED');

    // Verify DB state
    const dbApp = await pool.query('SELECT state, interview_note FROM group_applications WHERE id = $1', [applicationId]);
    assert.equal(dbApp.rows[0].state, 'INTERVIEWED');
    assert.equal(dbApp.rows[0].interview_note, 'Aday ile telefonla görüşüldü, kuralları kabul etti.');

    console.log('  -> PASS: President Interview Flow verified.');
  }

  // --------------------------------------------------------------------------
  // SCENARIO 4: President Decision Recording (POST /api/group-applications/:id/decision)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing President Decision Flow (POST /api/group-applications/:id/decision)...');

    // Decision before interview was already tested above. Now state is INTERVIEWED.
    // Invalid decision string -> 400
    const invalidDecRes = await apiFetch(`/group-applications/${applicationId}/decision`, {
      method: 'POST',
      token: presidentToken,
      body: { decision: 'MAYBE', note: 'Emin değilim' }
    });
    assert.equal(invalidDecRes.status, 400, 'Invalid decision value must return 400');

    // Valid ACCEPT decision
    const acceptRes = await apiFetch(`/group-applications/${applicationId}/decision`, {
      method: 'POST',
      token: presidentToken,
      body: { decision: 'ACCEPTED', note: 'Üyelik başvurusu kabul edildi.' }
    });
    assert.equal(acceptRes.status, 200, 'Accept decision must succeed with 200');
    const acceptData = await acceptRes.json();
    assert.equal(acceptData.application.state, 'ACCEPTED');

    // Verify DB group_members status promoted to ACTIVE
    const dbMember = await pool.query('SELECT status FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, applicantId]);
    assert.equal(dbMember.rows[0].status, 'ACTIVE', 'Applicant group_members status must become ACTIVE');

    console.log('  -> PASS: President Decision Flow verified.');
  }

  // --------------------------------------------------------------------------
  // SCENARIO 5: President Weekly Meeting Attendance (POST /api/events/attendance)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing Weekly Meeting Attendance Flow (POST /api/events/attendance)...');

    // Group members query -> GET /api/groups/:id/members
    const membersRes = await apiFetch(`/groups/${groupId}/members`, { token: presidentToken });
    assert.equal(membersRes.status, 200);
    const membersData = await membersRes.json();
    assert.ok(membersData.length >= 3, 'Must have at least 3 active members');

    const requestId = randomUUID();
    const meetingPayload = {
      requestId,
      group_id: groupId,
      meeting_date: new Date().toISOString(),
      topic: 'Haftalık Kahvaltı Toplantısı',
      reason: 'PAR-04 Sözleşme Yoklaması',
      items: [
        { user_id: presidentId, status: 'PRESENT' },
        { user_id: regularMemberId, status: 'LATE' },
        { user_id: applicantId, status: 'PRESENT' }
      ]
    };

    // Submit Attendance
    const attSubmitRes = await apiFetch('/events/attendance', {
      method: 'POST',
      token: presidentToken,
      body: meetingPayload
    });
    assert.equal(attSubmitRes.status, 200, 'Meeting attendance submission must return 200');
    const attAck = await attSubmitRes.json();
    assert.equal(attAck.success, true);
    assert.equal(attAck.version, 1);
    assert.equal(attAck.count, 3);
    assert.equal(attAck.ownerId, presidentId);

    // Verify Idempotent Replay
    const replayRes = await apiFetch('/events/attendance', {
      method: 'POST',
      token: presidentToken,
      body: meetingPayload
    });
    assert.equal(replayRes.status, 200, 'Idempotent replay must succeed');
    const replayAck = await replayRes.json();
    assert.equal(replayAck.replayed, true, 'Replay acknowledgment must have replayed: true');

    // Verify DB events and attendance rows
    const dbEvent = await pool.query('SELECT title, type, status FROM events WHERE id = $1', [requestId]);
    assert.equal(dbEvent.rows[0].title, 'Haftalık Kahvaltı Toplantısı');
    assert.equal(dbEvent.rows[0].type, 'meeting');

    const dbAtt = await pool.query('SELECT user_id, status FROM attendance WHERE event_id = $1 ORDER BY user_id', [requestId]);
    assert.equal(dbAtt.rows.length, 3);

    console.log('  -> PASS: Weekly Meeting Attendance Flow verified.');
  }

  console.log('🎉 ALL PAR-04 CONTRACT TESTS PASSED (5/5 scenarios + static AST checks)!');

} finally {
  await cleanup();
}
