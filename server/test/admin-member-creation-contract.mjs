import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-admin-member-creation-${randomUUID().slice(0, 8)}`;
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
  const appliedMigrations = await applyVersionedSchema();
  assert.equal(appliedMigrations.applied.length, 28, 'Zero DDL: Expected exactly 28 migrations');

  // Seed Admin user and regular Member user
  const adminId = randomUUID();
  const memberId = randomUUID();
  const adminEmail = 'admin@example.invalid';
  const memberEmail = 'member@example.invalid';
  const passwordHash = await bcrypt.hash('secret123', 10);

  await pool.query(
    "INSERT INTO users(id, name, email, password_hash, role, account_status, profession) VALUES($1, 'Admin User', $2, $3, 'ADMIN', 'ACTIVE', 'Yönetim')",
    [adminId, adminEmail, passwordHash]
  );
  await pool.query(
    "INSERT INTO users(id, name, email, password_hash, role, account_status, profession) VALUES($1, 'Regular Member', $2, $3, 'MEMBER', 'ACTIVE', 'Yazılım')",
    [memberId, memberEmail, passwordHash]
  );

  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const adminToken = jwt.sign({ id: adminId, role: 'ADMIN' }, process.env.JWT_SECRET);
  const memberToken = jwt.sign({ id: memberId, role: 'MEMBER' }, process.env.JWT_SECRET);

  const postMember = (payload, token = adminToken) =>
    fetch(`${base}/api/admin/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

  // 1. Auth & Role Guards
  console.log('Test 1: Auth & Role Guards...');
  const anonRes = await postMember({ full_name: 'Test' }, null);
  assert.equal(anonRes.status, 401, 'Anonymous request must return 401');

  const memberRes = await postMember({ full_name: 'Test' }, memberToken);
  assert.equal(memberRes.status, 403, 'Non-admin member request must return 403');

  // 2. Validation Errors
  console.log('Test 2: Validation Guards...');
  const missingNameRes = await postMember({ email: 'valid@example.com' });
  assert.equal(missingNameRes.status, 400, 'Missing name must return 400');

  const invalidEmailRes = await postMember({ full_name: 'Ahmet Yılmaz', email: 'not-an-email' });
  assert.equal(invalidEmailRes.status, 400, 'Invalid email must return 400');

  const missingPhoneRes = await postMember({ full_name: 'Ahmet Yılmaz', email: 'ahmet@example.com' });
  assert.equal(missingPhoneRes.status, 400, 'Missing phone must return 400');

  const missingCompanyRes = await postMember({
    full_name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '5551234567',
    profession: 'Yazılım'
  });
  assert.equal(missingCompanyRes.status, 400, 'Missing company info must return 400');

  const invalidTaxRes = await postMember({
    full_name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '5551234567',
    profession: 'Yazılım',
    company: 'Yılmaz A.Ş.',
    tax_number: '12345', // invalid length
    tax_office: 'Kadıköy',
    billing_address: 'Kadıköy Mh. No:1'
  });
  assert.equal(invalidTaxRes.status, 400, 'Invalid tax number must return 400');

  // 3. Successful Member Creation
  console.log('Test 3: Successful Creation with VKN...');
  const validPayload = {
    full_name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@example.com',
    phone: '5551234567',
    city: 'İstanbul',
    profession: 'Yazılım Mimarı',
    company: 'Yılmaz Teknoloji A.Ş.',
    tax_number: '1234567890', // 10 digit VKN
    tax_office: 'Kadıköy',
    billing_address: 'Bağdat Caddesi No: 120 Kadıköy İstanbul',
    password: 'SecurePassword123!'
  };

  const createRes = await postMember(validPayload);
  assert.equal(createRes.status, 201, 'Valid creation must return 201');
  const createdJson = await createRes.json();
  assert.equal(createdJson.success, true);
  assert.ok(createdJson.member?.id, 'Response must return created member ID');
  assert.equal(createdJson.member.email, validPayload.email);
  assert.equal(createdJson.member.name, validPayload.full_name);
  assert.equal(createdJson.member.role, 'MEMBER');
  assert.equal(createdJson.member.account_status, 'ACTIVE');
  assert.equal(createdJson.member.company, validPayload.company);
  assert.equal(createdJson.member.tax_number, validPayload.tax_number);
  assert.equal(createdJson.member.tax_office, validPayload.tax_office);

  // Verify password hash in database
  const dbUserRow = (await pool.query('SELECT password_hash FROM users WHERE id = $1', [createdJson.member.id])).rows[0];
  assert.ok(await bcrypt.compare(validPayload.password, dbUserRow.password_hash), 'Password must be properly hashed and verify');

  // 4. Duplicate Email Conflict
  console.log('Test 4: Duplicate Email Conflict (409)...');
  const dupEmailPayload = {
    ...validPayload,
    tax_number: '9876543210' // different tax number
  };
  const dupEmailRes = await postMember(dupEmailPayload);
  assert.equal(dupEmailRes.status, 409, 'Duplicate email must return 409');
  const dupEmailJson = await dupEmailRes.json();
  assert.equal(dupEmailJson.code, 'EMAIL_IN_USE');

  // 5. Duplicate Tax Number Conflict
  console.log('Test 5: Duplicate Tax Number Conflict (409)...');
  const dupTaxPayload = {
    ...validPayload,
    email: 'mehmet@example.com' // different email
  };
  const dupTaxRes = await postMember(dupTaxPayload);
  assert.equal(dupTaxRes.status, 409, 'Duplicate tax number must return 409');
  const dupTaxJson = await dupTaxRes.json();
  assert.equal(dupTaxJson.code, 'TAX_NUMBER_IN_USE');

  // 6. Readback from GET /api/admin/members
  console.log('Test 6: Readback via GET /api/admin/members...');
  const getRes = await fetch(`${base}/api/admin/members`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(getRes.status, 200);
  const memberList = await getRes.json();
  const foundMember = memberList.find(m => m.id === createdJson.member.id);
  assert.ok(foundMember, 'Created member must appear in admin members list');
  assert.equal(foundMember.name, validPayload.full_name);
  assert.equal(foundMember.email, validPayload.email);
  assert.equal(foundMember.status, 'ACTIVE');

  console.log('Admin member creation contract PASS: All 6 test suites passed!');
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error('Admin member creation contract failed:', error);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try {
      docker(['stop', '--time', '3', container], { timeout: 15_000 });
    } catch (e) {
      console.error(e.message);
    }
  }
}
process.exit(exitCode);
