// Contract test for MOB-01 / E4N-134: Mobile Personal Reports Screen & API contract alignment
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(serverDir, '..');

console.log('--- Testing MOB-01 / E4N-134: Mobile Personal Reports Screen Contract ---');

// 1. Static Source Code Verification of Mobile Screen and Constants
const reportsTsxPath = path.resolve(repoDir, 'mobile/app/features/reports.tsx');
const apiTsPath = path.resolve(repoDir, 'mobile/constants/api.ts');

const reportsContent = readFileSync(reportsTsxPath, 'utf8');
const apiContent = readFileSync(apiTsPath, 'utf8');

// Ensure old unmapped endpoint /users/me/stats is completely gone
assert.ok(
  !reportsContent.includes('/users/me/stats'),
  'FAIL: mobile/app/features/reports.tsx must NOT contain legacy /users/me/stats endpoint'
);

// Ensure verified API endpoint REPORTS.ME is used
assert.ok(
  apiContent.includes('REPORTS:') && apiContent.includes('/reports/me'),
  'FAIL: mobile/constants/api.ts must define REPORTS.ME endpoint pointing to /reports/me'
);
assert.ok(
  reportsContent.includes('API_CONFIG.ENDPOINTS.REPORTS.ME'),
  'FAIL: mobile/app/features/reports.tsx must use API_CONFIG.ENDPOINTS.REPORTS.ME'
);

// Ensure all 4 supported ranges are implemented
for (const range of ['7d', '30d', '90d', '1y']) {
  assert.ok(
    reportsContent.includes(`'${range}'`),
    `FAIL: mobile/app/features/reports.tsx must support range ${range}`
  );
}

// Ensure error handling with retry UI exists (no silent zero mock)
assert.ok(
  reportsContent.includes('retryBtn') && reportsContent.includes('Tekrar Dene'),
  'FAIL: mobile/app/features/reports.tsx must render retry button on failure'
);

// Ensure verified metrics from web personal report contract are present in the UI
assert.ok(reportsContent.includes('referralsGiven'), 'Must render referralsGiven');
assert.ok(reportsContent.includes('referralsReceived'), 'Must render referralsReceived');
assert.ok(reportsContent.includes('meetingsCompleted'), 'Must render meetingsCompleted');
assert.ok(reportsContent.includes('visitorsHosted'), 'Must render visitorsHosted');
assert.ok(reportsContent.includes('educationHours'), 'Must render educationHours');
assert.ok(reportsContent.includes('performance'), 'Must render performance scorecard');

console.log('✅ Static AST and source contract checks passed.');

// 2. Integration / Server-side Contract Verification in Isolated PG17 Docker Container
const container = `e4n-mob01-${randomUUID().slice(0, 8)}`;
const dbUser = 'e4n_mob01_fixture';
const dbName = 'e4n_mob01_fixture';
let started = false;
let pool;
let appServer;

function docker(args) {
  const r = spawnSync('docker', args, { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (r.error || r.status !== 0) throw new Error(`Docker ${args[0]} failed: ${r.stderr || r.error?.message}`);
  return r.stdout.trim();
}

try {
  docker(['run', '--rm', '-d', '--pull=never', '--name', container,
    '-e', `POSTGRES_USER=${dbUser}`,
    '-e', 'POSTGRES_PASSWORD=mob01_test_pw',
    '-e', `POSTGRES_DB=${dbName}`,
    '-p', '127.0.0.1::5432', 'postgres:17']);
  started = true;

  for (let i = 0; i < 60; i++) {
    try {
      docker(['exec', container, 'pg_isready', '-U', dbUser, '-d', dbName]);
      break;
    } catch {
      if (i === 59) throw new Error('Docker PostgreSQL did not become ready');
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const port = Number(docker(['port', container, '5432/tcp']).match(/127\.0\.0\.1:(\d+)/)?.[1]);
  assert.ok(port > 0, 'Valid port expected');

  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(port);
  process.env.DB_USER = dbUser;
  process.env.DB_PASSWORD = 'mob01_test_pw';
  process.env.DB_NAME = dbName;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'mobile_personal_reports_contract_test_secret_32char';

  pool = new pg.Pool({
    host: '127.0.0.1',
    port,
    user: dbUser,
    password: 'mob01_test_pw',
    database: dbName
  });

  for (let i = 0; i < 20; i++) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (e) {
      if (i === 19) throw e;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  await applyVersionedSchema({ dbPool: pool });

  // Create synthetic test user
  const userId = randomUUID();
  await pool.query(
    `INSERT INTO users (id, email, name, profession, role, performance_score, performance_color)
     VALUES ($1, 'mobile-member@example.com', 'Mobil Üye', 'Yazılım', 'MEMBER', 85, 'GREEN')`,
    [userId]
  );

  // Add sample activity
  const partnerId = randomUUID();
  await pool.query(
    `INSERT INTO users (id, email, name, profession, role)
     VALUES ($1, 'partner@example.com', 'İş Ortağı', 'Tasarım', 'MEMBER')`,
    [partnerId]
  );

  // Referral given
  await pool.query(
    `INSERT INTO referrals (giver_id, receiver_id, status, amount, created_at)
     VALUES ($1, $2, 'SUCCESSFUL', 2500.00, NOW() - INTERVAL '5 days')`,
    [userId, partnerId]
  );

  // Referral received
  await pool.query(
    `INSERT INTO referrals (giver_id, receiver_id, status, amount, created_at)
     VALUES ($1, $2, 'SUCCESSFUL', 5000.00, NOW() - INTERVAL '10 days')`,
    [partnerId, userId]
  );

  // Completed one to one
  await pool.query(
    `INSERT INTO one_to_ones (requester_id, partner_id, status, meeting_date)
     VALUES ($1, $2, 'COMPLETED', NOW() - INTERVAL '3 days')`,
    [userId, partnerId]
  );

  // Visited visitor
  await pool.query(
    `INSERT INTO visitors (inviter_id, name, email, status, visited_at)
     VALUES ($1, 'Konuk Ziyaretçi', 'visitor@example.com', 'ATTENDED', NOW() - INTERVAL '4 days')`,
    [userId]
  );

  // Education hours
  await pool.query(
    `INSERT INTO education (user_id, title, hours, completed_date)
     VALUES ($1, 'Mobil Başarı Semineri', 4.5, NOW() - INTERVAL '2 days')`,
    [userId]
  );

  // Spin up express server with reports route
  const { default: express } = await import('express');
  const { installPersonalReports } = await import('../src/personal-reports.js');

  const app = express();
  app.use(express.json());

  const authenticateToken = (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.replace(/^Bearer /, '');
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      res.sendStatus(401);
    }
  };

  installPersonalReports(app, { pool, authenticateToken });

  appServer = app.listen(0, '127.0.0.1');
  await new Promise(resolve => appServer.once('listening', resolve));
  const serverPort = appServer.address().port;

  const validToken = jwt.sign({ id: userId, role: 'MEMBER' }, process.env.JWT_SECRET);

  // 2.1 Test all 4 date ranges as mobile client requests
  for (const range of ['7d', '30d', '90d', '1y']) {
    const res = await fetch(`http://127.0.0.1:${serverPort}/api/reports/me?dateRange=${range}`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    assert.equal(res.status, 200, `Expected 200 for dateRange=${range}`);
    const data = await res.json();

    assert.equal(data.version, 1);
    assert.equal(data.ownerId, userId);
    assert.equal(data.dateRange, range);
    assert.ok(data.period.start && data.period.end);

    // Verify metrics structure
    assert.equal(typeof data.referralsGiven.count, 'number');
    assert.equal(typeof data.referralsGiven.successful, 'number');
    assert.equal(typeof data.referralsGiven.knownVolume, 'string');

    assert.equal(typeof data.referralsReceived.count, 'number');
    assert.equal(typeof data.referralsReceived.successful, 'number');
    assert.equal(typeof data.referralsReceived.knownVolume, 'string');

    assert.equal(typeof data.meetingsCompleted, 'number');
    assert.equal(typeof data.visitorsHosted, 'number');
    assert.equal(typeof data.educationHours, 'string');

    assert.equal(data.performance.score, 85);
    assert.equal(data.performance.color, 'GREEN');
  }
  console.log('✅ All 4 date ranges (7d, 30d, 90d, 1y) verified with exact PersonalReport schema.');

  // 2.2 Test 30d specific values matching synthetic data
  const res30d = await fetch(`http://127.0.0.1:${serverPort}/api/reports/me?dateRange=30d`, {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  const data30d = await res30d.json();
  assert.equal(data30d.referralsGiven.count, 1);
  assert.equal(data30d.referralsGiven.successful, 1);
  assert.equal(data30d.referralsGiven.knownVolume, '2500.00');

  assert.equal(data30d.referralsReceived.count, 1);
  assert.equal(data30d.referralsReceived.successful, 1);
  assert.equal(data30d.referralsReceived.knownVolume, '5000.00');

  assert.equal(data30d.meetingsCompleted, 1);
  assert.equal(data30d.visitorsHosted, 1);
  assert.equal(data30d.educationHours, '4.5');
  console.log('✅ 30d synthetic cohort metrics correctly calculated and returned.');

  // 2.3 Test Anonymous 401
  const anonRes = await fetch(`http://127.0.0.1:${serverPort}/api/reports/me?dateRange=30d`);
  assert.equal(anonRes.status, 401, 'Anonymous request must return 401');
  console.log('✅ Anonymous rejection (401) verified.');

  // 2.4 Test Invalid dateRange 400
  const invalidRes = await fetch(`http://127.0.0.1:${serverPort}/api/reports/me?dateRange=invalid`, {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  assert.equal(invalidRes.status, 400, 'Invalid range must return 400 without crashing');
  console.log('✅ Invalid range rejection (400) verified.');

  console.log('🎉 MOB-01 / E4N-134 PASS: Mobile personal reports screen aligned with web API contract.');
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (started) {
    try { docker(['stop', '--time', '3', container]); } catch {}
  }
}
