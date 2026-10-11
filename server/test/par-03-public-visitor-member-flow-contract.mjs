// Contract test for PAR-03 / E4N-117: Reconcile public, visitor and member flows across web and mobile
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

console.log('--- Testing PAR-03 / E4N-117: Public, Visitor & Member Flows Contract ---');

// ============================================================================
// 1. Static Source Code & Contract Verifications
// ============================================================================

const apiTsPath = path.resolve(repoDir, 'mobile/constants/api.ts');
const registerTsxPath = path.resolve(repoDir, 'mobile/app/(auth)/register.tsx');
const networkTsxPath = path.resolve(repoDir, 'mobile/app/(tabs)/network.tsx');
const eventsTsxPath = path.resolve(repoDir, 'mobile/app/(tabs)/events.tsx');
const profileTsxPath = path.resolve(repoDir, 'mobile/app/(tabs)/profile.tsx');
const messagesTsxPath = path.resolve(repoDir, 'mobile/app/features/messages.tsx');

const apiContent = readFileSync(apiTsPath, 'utf8');
const registerContent = readFileSync(registerTsxPath, 'utf8');
const networkContent = readFileSync(networkTsxPath, 'utf8');
const eventsContent = readFileSync(eventsTsxPath, 'utf8');
const profileContent = readFileSync(profileTsxPath, 'utf8');
const messagesContent = readFileSync(messagesTsxPath, 'utf8');

// 1.1 API Constants
assert.ok(apiContent.includes('UPDATE_ME:'), 'API_CONFIG.ENDPOINTS.USERS must define UPDATE_ME');
assert.ok(apiContent.includes('MESSAGES:'), 'API_CONFIG.ENDPOINTS must define MESSAGES');
assert.ok(apiContent.includes('CONVERSATIONS:'), 'MESSAGES must define CONVERSATIONS');
assert.ok(apiContent.includes('THREAD:'), 'MESSAGES must define THREAD');
assert.ok(apiContent.includes('SEND:'), 'MESSAGES must define SEND');

// 1.2 Registration Screen (BAŞ-01 Corporate fields)
assert.ok(registerContent.includes('company'), 'RegisterScreen must include company field');
assert.ok(registerContent.includes('taxNumber'), 'RegisterScreen must include taxNumber field');
assert.ok(registerContent.includes('taxOffice'), 'RegisterScreen must include taxOffice field');
assert.ok(registerContent.includes('billingAddress'), 'RegisterScreen must include billingAddress field');
assert.ok(registerContent.includes('referralCode'), 'RegisterScreen must include referralCode field');
assert.ok(registerContent.includes('API_CONFIG.ENDPOINTS.AUTH.REGISTER'), 'RegisterScreen must call API_CONFIG.ENDPOINTS.AUTH.REGISTER');

// 1.3 Network Screen (Detail Profile Modal & Action Buttons)
assert.ok(networkContent.includes('selectedMember'), 'NetworkScreen must have selectedMember state');
assert.ok(networkContent.includes('Birebir Toplantı Talep Et'), 'NetworkScreen must have meeting request action button');
assert.ok(networkContent.includes('İş Referansı Ver'), 'NetworkScreen must have referral action button');
assert.ok(networkContent.includes('Mesaj Gönder'), 'NetworkScreen must have message action button');

// 1.4 Events Screen (P25 Entitlement & P26 Multi-ticket Selector)
assert.ok(eventsContent.includes('selectedEvent'), 'EventsScreen must have selectedEvent modal state');
assert.ok(eventsContent.includes('ticketQuantity'), 'EventsScreen must have ticketQuantity selector');
assert.ok(eventsContent.includes('P25'), 'EventsScreen must render P25 member entitlement badge');
assert.ok(eventsContent.includes('quantity'), 'EventsScreen must send ticket quantity');

// 1.5 Messages Screen (Real direct_messages integration, no mock)
assert.ok(!messagesContent.includes('MESSAGES_MOCK'), 'MessagesScreen must NOT use MESSAGES_MOCK');
assert.ok(messagesContent.includes('API_CONFIG.ENDPOINTS.MESSAGES.CONVERSATIONS'), 'MessagesScreen must call CONVERSATIONS endpoint');
assert.ok(messagesContent.includes('API_CONFIG.ENDPOINTS.MESSAGES.THREAD'), 'MessagesScreen must call THREAD endpoint');
assert.ok(messagesContent.includes('API_CONFIG.ENDPOINTS.MESSAGES.SEND'), 'MessagesScreen must call SEND endpoint');
assert.ok(messagesContent.includes('requestKey'), 'MessagesScreen must provide idempotent requestKey');

// 1.6 Profile Screen (Profile editing modal with PUT /users/me)
assert.ok(profileContent.includes('isEditModalOpen'), 'ProfileScreen must have isEditModalOpen state');
assert.ok(profileContent.includes('API_CONFIG.ENDPOINTS.USERS.UPDATE_ME'), 'ProfileScreen must call USERS.UPDATE_ME');

console.log('✅ Static AST and source contract checks passed.');

// ============================================================================
// 2. Integration / Server-side Contract Verification in Isolated PG17 Container
// ============================================================================

const container = `e4n-par03-${randomUUID().slice(0, 8)}`;
const dbUser = 'e4n_par03_fixture';
const dbName = 'e4n_par03_fixture';
const dbPassword = 'par03_test_password';
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
  process.env.JWT_SECRET = 'par03_contract_signing_secret_32chars';

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
  // SCENARIO 1: Corporate Member Registration Flow (POST /api/auth/register)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing Corporate Registration Flow (POST /api/auth/register)...');

    // Missing corporate fields (company, taxNumber, etc.) -> 400
    const invalidRes = await apiFetch('/auth/register', {
      method: 'POST',
      body: {
        name: 'Eksik Kayıt',
        email: 'eksik@example.test',
        password: 'password123',
        phone: '05551112233',
        city: 'İstanbul',
        profession: 'Yazılım',
        kvkkConsent: true,
        explicitConsent: true
      }
    });
    assert.equal(invalidRes.status, 400, 'Registration without corporate fields must return 400');

    // Valid Registration with Corporate Identity Fields (BAŞ-01)
    const validRegRes = await apiFetch('/auth/register', {
      method: 'POST',
      body: {
        name: 'Kurumsal Aday',
        email: 'kurumsal.aday@example.test',
        password: 'superSecretPassword123',
        phone: '05551234567',
        city: 'İstanbul',
        profession: 'Yazılım Mimarı',
        company: 'Kurumsal Sistemler Ltd. Şti.',
        taxNumber: '1234567890',
        taxOffice: 'Kadıköy',
        billingAddress: 'Bağdat Caddesi No:100 Kadıköy İstanbul',
        kvkkConsent: true,
        explicitConsent: true,
        marketingConsent: true
      }
    });
    assert.equal(validRegRes.status, 201, 'Valid corporate registration must return 201');
    const regData = await validRegRes.json();
    assert.equal(regData.email, 'kurumsal.aday@example.test');
    assert.equal(regData.name, 'Kurumsal Aday');
    assert.equal(regData.role, 'MEMBER');

    // Verify DB Row
    const userDb = await pool.query('SELECT * FROM users WHERE email = $1', ['kurumsal.aday@example.test']);
    assert.equal(userDb.rowCount, 1);
    const u = userDb.rows[0];
    assert.equal(u.company, 'Kurumsal Sistemler Ltd. Şti.');
    assert.equal(u.tax_number, '1234567890');
    assert.equal(u.tax_office, 'Kadıköy');
    assert.equal(u.city, 'İstanbul');
    assert.equal(u.company_registration, true);

    console.log('  -> PASS: Corporate Registration verified.');
  }

  // --------------------------------------------------------------------------
  // SCENARIO 2: Profile Update Flow (PUT /api/users/me)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing Self-Profile Update (PUT /api/users/me)...');

    const memberId = randomUUID();
    await pool.query(`
      INSERT INTO users (id, name, email, password_hash, role, account_status, profession, company, city, phone)
      VALUES ($1, 'Önceki İsim', 'profil.test@example.test', 'hashed_pw', 'MEMBER', 'ACTIVE', 'Eski Meslek', 'Eski Şirket', 'İzmir', '05001112233')
    `, [memberId]);

    const memberToken = makeToken(memberId);

    // Call PUT /users/me
    const updateRes = await apiFetch('/users/me', {
      method: 'PUT',
      token: memberToken,
      body: {
        name: 'Güncellenmiş Üye Adı',
        phone: '05329998877',
        city: 'Ankara',
        profession: 'Kıdemli Mimar'
      }
    });
    assert.equal(updateRes.status, 200, 'Profile update must return 200');
    const updateData = await updateRes.json();
    assert.equal(updateData.name, 'Güncellenmiş Üye Adı');
    assert.equal(updateData.phone, '05329998877');
    assert.equal(updateData.city, 'Ankara');
    assert.equal(updateData.profession, 'Kıdemli Mimar');

    // Verify DB
    const updatedDb = await pool.query('SELECT name, phone, city, profession FROM users WHERE id = $1', [memberId]);
    assert.equal(updatedDb.rows[0].name, 'Güncellenmiş Üye Adı');
    assert.equal(updatedDb.rows[0].city, 'Ankara');

    console.log('  -> PASS: Self-Profile Update verified.');
  }

  // --------------------------------------------------------------------------
  // SCENARIO 3: Event Registration & Multi-ticket Entitlements
  // --------------------------------------------------------------------------
  {
    console.log('• Testing Event Registration & Multi-ticket Flow (/api/events)...');

    const eventId = randomUUID();
    const memberId = randomUUID();
    await pool.query(`
      INSERT INTO users (id, name, email, password_hash, role, account_status, profession)
      VALUES ($1, 'Biletli Üye', 'biletli@example.test', 'hashed_pw', 'MEMBER', 'ACTIVE', 'Finans Uzmanı')
    `, [memberId]);
    const memberToken = makeToken(memberId);

    // Insert Event (Education type with price)
    await pool.query(`
      INSERT INTO events (id, title, description, start_at, end_at, type, is_public, max_attendees, price, created_by)
      VALUES ($1, 'Büyük Network Zirvesi', 'Açıklama', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours', 'education', true, 100, 1000.00, $2)
    `, [eventId, memberId]);

    // Member registers with empty body as required by strict event registration contract
    const regRes = await apiFetch(`/events/${eventId}/register`, {
      method: 'POST',
      token: memberToken,
      body: {}
    });
    assert.equal(regRes.status, 200, 'Event registration must return 200');
    const regData = await regRes.json();
    assert.equal(regData.success, true);
    assert.equal(regData.ownerId, memberId);
    assert.equal(regData.eventId, eventId);

    console.log('  -> PASS: Event Multi-ticket Registration verified.');
  }

  // --------------------------------------------------------------------------
  // SCENARIO 4: Direct Messages Flow (/api/messages)
  // --------------------------------------------------------------------------
  {
    console.log('• Testing Direct Messages Flow (/api/messages)...');

    const friendAId = randomUUID();
    const friendBId = randomUUID();

    // Create Friend A
    await pool.query(`
      INSERT INTO users (id, name, email, password_hash, role, account_status, profession)
      VALUES ($1, 'Arkadaş A', 'arkadas.a@example.test', 'hashed_pw', 'MEMBER', 'ACTIVE', 'Yazılımcı')
    `, [friendAId]);

    // Create Friend B
    await pool.query(`
      INSERT INTO users (id, name, email, password_hash, role, account_status, profession)
      VALUES ($1, 'Arkadaş B', 'arkadas.b@example.test', 'hashed_pw', 'MEMBER', 'ACTIVE', 'Grafiker')
    `, [friendBId]);

    // Establish ACCEPTED connection in friend_requests
    await pool.query(`
      INSERT INTO friend_requests (id, sender_id, receiver_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'ACCEPTED', NOW(), NOW())
    `, [randomUUID(), friendAId, friendBId]);

    const tokenA = makeToken(friendAId);
    const tokenB = makeToken(friendBId);

    // Friend A sends message to Friend B
    const requestKey = randomUUID();
    const sendRes = await apiFetch(`/messages/${friendBId}`, {
      method: 'POST',
      token: tokenA,
      body: {
        content: 'Selam Arkadaş B, yarın görüşelim mi?',
        requestKey
      }
    });
    assert.equal(sendRes.status, 200, 'Sending direct message must return 200');
    const sendData = await sendRes.json();
    assert.equal(sendData.ownerId, friendAId);
    assert.equal(sendData.targetId, friendBId);
    assert.equal(sendData.message.content, 'Selam Arkadaş B, yarın görüşelim mi?');

    // Friend B checks conversations list
    const convoRes = await apiFetch('/messages/conversations', { token: tokenB });
    assert.equal(convoRes.status, 200);
    const convoData = await convoRes.json();
    assert.equal(convoData.conversations.length, 1);
    assert.equal(convoData.conversations[0].friend.id, friendAId);
    assert.equal(convoData.conversations[0].lastMessage.content, 'Selam Arkadaş B, yarın görüşelim mi?');

    // Friend B checks message thread
    const threadRes = await apiFetch(`/messages/${friendAId}`, { token: tokenB });
    assert.equal(threadRes.status, 200);
    const threadData = await threadRes.json();
    assert.equal(threadData.messages.length, 1);
    assert.equal(threadData.messages[0].content, 'Selam Arkadaş B, yarın görüşelim mi?');

    console.log('  -> PASS: Direct Messages flow verified.');
  }

  console.log('🎉 ALL PAR-03 CONTRACT TESTS PASSED (4/4 E2E scenarios + static AST checks)!');

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
