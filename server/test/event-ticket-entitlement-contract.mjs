import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-ticket-entitlement-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length, 28);
  assert.equal((await applyVersionedSchema()).applied.length, 0);

  // Setup Express server
  let mails = 0;
  const { default: nodemailer } = await import('nodemailer');
  nodemailer.createTransport = () => ({
    sendMail: async () => {
      mails++;
      return { messageId: 'isolated-fake' };
    }
  });

  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const token = (id, role = 'MEMBER', secret = process.env.JWT_SECRET) =>
    jwt.sign({ id, role }, secret);

  const call = (url, userId, method = 'GET', body = null) =>
    fetch(`${base}/api${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { Authorization: `Bearer ${token(userId)}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : (method === 'POST' ? { body: '{}' } : {})),
      signal: AbortSignal.timeout(10000)
    });

  // Setup Users:
  // 1. adminUser: role ADMIN
  // 2. removedUser (R12 / R02): account_status = 'ACTIVE', but removed from group (status = 'INACTIVE')
  // 3. unassignedUser (R02): account_status = 'ACTIVE', has no group at all
  // 4. activeGroupMember: account_status = 'ACTIVE', status = 'ACTIVE' in group
  // 5. restrictedUser (D07): account_status = 'RESTRICTED'
  const [adminUser, removedUser, unassignedUser, activeGroupMember, restrictedUser] = Array.from({ length: 5 }, () => randomUUID());

  await pool.query("INSERT INTO users(id, email, name, profession, password_hash, role, account_status) VALUES($1, 'admin@fixture.invalid', 'Admin User', 'Yönetici', 'x', 'ADMIN', 'ACTIVE')", [adminUser]);
  await pool.query("INSERT INTO users(id, email, name, profession, password_hash, role, account_status) VALUES($1, 'removed@fixture.invalid', 'Removed User', 'Avukat', 'x', 'MEMBER', 'ACTIVE')", [removedUser]);
  await pool.query("INSERT INTO users(id, email, name, profession, password_hash, role, account_status) VALUES($1, 'unassigned@fixture.invalid', 'Unassigned User', 'Mimar', 'x', 'MEMBER', 'ACTIVE')", [unassignedUser]);
  await pool.query("INSERT INTO users(id, email, name, profession, password_hash, role, account_status) VALUES($1, 'activegm@fixture.invalid', 'Group Member', 'Mühendis', 'x', 'MEMBER', 'ACTIVE')", [activeGroupMember]);
  await pool.query("INSERT INTO users(id, email, name, profession, password_hash, role, account_status) VALUES($1, 'restricted@fixture.invalid', 'Restricted User', 'Doktor', 'x', 'MEMBER', 'RESTRICTED')", [restrictedUser]);

  // Setup Groups
  const closedGroup = randomUUID();
  await pool.query("INSERT INTO groups(id, name) VALUES($1, 'Kapalı Prestij Grubu')", [closedGroup]);

  // removedUser was removed from closedGroup
  await pool.query("INSERT INTO group_members(group_id, user_id, status, role) VALUES($1, $2, 'INACTIVE', 'MEMBER')", [closedGroup, removedUser]);
  // activeGroupMember is active in closedGroup
  await pool.query("INSERT INTO group_members(group_id, user_id, status, role) VALUES($1, $2, 'ACTIVE', 'MEMBER')", [closedGroup, activeGroupMember]);

  // Setup Events:
  // E1. Public Meeting Event: is_public = true, price = 100, generate_tickets = true, type = 'meeting'
  //     (Free for active members, 100 for non-members/restricted)
  // E2. Public Social/Education Event: is_public = true, price = 200, generate_tickets = true, type = 'education'
  //     (50% discount for active members -> 100 TL PENDING, 200 for restricted)
  // E3. Closed Group Event: is_public = false, group_id = closedGroup, price = 50, generate_tickets = true, type = 'meeting'
  //     (Only accessible/registerable by active members of closedGroup)
  const [meetingEvent, educationEvent, closedEvent] = Array.from({ length: 3 }, () => randomUUID());

  await pool.query(
    "INSERT INTO events(id, title, start_at, status, is_public, type, price, currency, generate_tickets, created_by) VALUES($1, 'Büyük Network Toplantısı', '2099-05-01', 'PUBLISHED', true, 'meeting', 100, 'TRY', true, $2)",
    [meetingEvent, adminUser]
  );
  await pool.query(
    "INSERT INTO events(id, title, start_at, status, is_public, type, price, currency, generate_tickets, created_by) VALUES($1, 'Liderlik Zirvesi', '2099-06-01', 'PUBLISHED', true, 'education', 200, 'TRY', true, $2)",
    [educationEvent, adminUser]
  );
  await pool.query(
    "INSERT INTO events(id, title, start_at, status, is_public, type, price, currency, generate_tickets, group_id, created_by) VALUES($1, 'Kapalı Grup Buluşması', '2099-07-01', 'PUBLISHED', false, 'meeting', 50, 'TRY', true, $2, $3)",
    [closedEvent, closedGroup, adminUser]
  );

  console.log('--- TEST 1: R12 & R02 Gruptan Çıkarılan Aktif Üye Dış Etkinlik Erişimi ve Bilet Hakları ---');
  // removedUser was removed from closedGroup (INACTIVE), but account_status is ACTIVE.
  // Must be able to read public meeting event with member privileges.
  const removedDetailRes = await call(`/events/${meetingEvent}`, removedUser);
  assert.equal(removedDetailRes.status, 200);
  const removedDetail = await removedDetailRes.json();
  assert.equal(removedDetail.has_member_ticket_privilege, true, 'Removed active member retains ticket privilege');
  assert.equal(removedDetail.is_free_for_member, true, 'Meeting event is free for active members');
  assert.equal(removedDetail.member_price, 0, 'Member price is 0 for meeting');
  assert.equal(removedDetail.effective_price, 0, 'Effective price is 0');

  // removedUser registers for the meeting event (R12 / R02)
  const removedRegRes = await call(`/events/${meetingEvent}/register`, removedUser, 'POST');
  assert.equal(removedRegRes.status, 200);
  const removedReg = await removedRegRes.json();
  assert.equal(removedReg.success, true);
  assert.equal(removedReg.has_member_privilege, true);
  assert.equal(removedReg.effective_price, 0);
  assert.equal(removedReg.ticket_payment_status, 'FREE', 'Ticket is FREE because meeting is free for members');

  // Verify DB attendance and event_ticket
  const removedAtt = (await pool.query('SELECT status FROM attendance WHERE event_id=$1 AND user_id=$2', [meetingEvent, removedUser])).rows;
  assert.equal(removedAtt.length, 1);
  assert.equal(removedAtt[0].status, 'REGISTERED');

  const removedTicket = (await pool.query('SELECT payment_status FROM event_tickets WHERE event_id=$1 AND user_id=$2', [meetingEvent, removedUser])).rows;
  assert.equal(removedTicket.length, 1);
  assert.equal(removedTicket[0].payment_status, 'FREE', 'DB ticket payment_status is FREE');

  console.log('--- TEST 2: R02 Atanmamış (Grupta Olmayan) Aktif Üye İndirimli Bilet Hakkı ---');
  // unassignedUser has no group membership, account_status = 'ACTIVE'.
  // Education event has price = 200. Active members get 50% discount -> member_price = 100.
  const unassignedDetailRes = await call(`/events/${educationEvent}`, unassignedUser);
  assert.equal(unassignedDetailRes.status, 200);
  const unassignedDetail = await unassignedDetailRes.json();
  assert.equal(unassignedDetail.has_member_ticket_privilege, true, 'Unassigned active member has member privilege');
  assert.equal(unassignedDetail.member_price, 100, '50% discount gives member_price = 100');
  assert.equal(unassignedDetail.effective_price, 100);
  assert.equal(unassignedDetail.discount_amount, 100);

  // unassignedUser registers for educationEvent
  const unassignedRegRes = await call(`/events/${educationEvent}/register`, unassignedUser, 'POST');
  assert.equal(unassignedRegRes.status, 200);
  const unassignedReg = await unassignedRegRes.json();
  assert.equal(unassignedReg.success, true);
  assert.equal(unassignedReg.has_member_privilege, true);
  assert.equal(unassignedReg.effective_price, 100);
  assert.equal(unassignedReg.member_price, 100);
  assert.equal(unassignedReg.discount_applied, true);
  assert.equal(unassignedReg.ticket_payment_status, 'PENDING', 'Discounted ticket still requires payment');

  const unassignedTicket = (await pool.query('SELECT payment_status FROM event_tickets WHERE event_id=$1 AND user_id=$2', [educationEvent, unassignedUser])).rows;
  assert.equal(unassignedTicket.length, 1);
  assert.equal(unassignedTicket[0].payment_status, 'PENDING');

  console.log('--- TEST 3: D07 Kısıtlı Hesap (RESTRICTED) Üye İndiriminden Yararlanamaz ---');
  // restrictedUser has account_status = 'RESTRICTED'.
  // Does not receive member privilege; standard price applies.
  const restrictedDetailRes = await call(`/events/${educationEvent}`, restrictedUser);
  assert.equal(restrictedDetailRes.status, 200);
  const restrictedDetail = await restrictedDetailRes.json();
  assert.equal(restrictedDetail.has_member_ticket_privilege, false, 'Restricted account has no member ticket privilege');
  assert.equal(restrictedDetail.member_price, null);
  assert.equal(restrictedDetail.effective_price, 200, 'Standard price 200 applies');
  assert.equal(restrictedDetail.entitlement_reason, 'RESTRICTED_ACCOUNT');

  // restrictedUser registers
  const restrictedRegRes = await call(`/events/${educationEvent}/register`, restrictedUser, 'POST');
  assert.equal(restrictedRegRes.status, 200);
  const restrictedReg = await restrictedRegRes.json();
  assert.equal(restrictedReg.has_member_privilege, false);
  assert.equal(restrictedReg.effective_price, 200);
  assert.equal(restrictedReg.discount_applied, false);
  assert.equal(restrictedReg.ticket_payment_status, 'PENDING');

  console.log('--- TEST 4: R02 Kapalı Grup Etkinliği Koruması (Closed Group Restricted) ---');
  // closedEvent is is_public = false, group_id = closedGroup.
  // removedUser was removed (INACTIVE) from closedGroup -> must be DENIED registration (403)!
  const removedClosedRegRes = await call(`/events/${closedEvent}/register`, removedUser, 'POST');
  assert.equal(removedClosedRegRes.status, 403, 'Removed member cannot register for closed group event');
  const removedClosedJson = await removedClosedRegRes.json();
  assert.equal(removedClosedJson.code, 'CLOSED_GROUP_RESTRICTED');

  // unassignedUser has no membership in closedGroup -> also 403!
  const unassignedClosedRegRes = await call(`/events/${closedEvent}/register`, unassignedUser, 'POST');
  assert.equal(unassignedClosedRegRes.status, 403);

  // activeGroupMember is ACTIVE in closedGroup -> can register!
  const activeClosedRegRes = await call(`/events/${closedEvent}/register`, activeGroupMember, 'POST');
  assert.equal(activeClosedRegRes.status, 200);
  const activeClosedReg = await activeClosedRegRes.json();
  assert.equal(activeClosedReg.success, true);
  assert.equal(activeClosedReg.has_member_privilege, true);

  console.log('--- TEST 5: Replay ve Tekrar Güvenliği (Idempotency) ---');
  // Repeating registration for removedUser on meetingEvent
  const replayMeetingRes = await call(`/events/${meetingEvent}/register`, removedUser, 'POST');
  assert.equal(replayMeetingRes.status, 200);
  const replayMeeting = await replayMeetingRes.json();
  assert.equal(replayMeeting.replayed, true, 'Must indicate replayed: true');
  assert.equal(replayMeeting.ticket_payment_status, 'FREE', 'Payment status preserved on replay');
  assert.equal(replayMeeting.has_member_privilege, true);

  // Verify no duplicate tickets in DB
  const ticketCount = (await pool.query('SELECT count(*)::int AS count FROM event_tickets WHERE event_id=$1 AND user_id=$2', [meetingEvent, removedUser])).rows[0].count;
  assert.equal(ticketCount, 1, 'Zero duplicate tickets created');

  console.log('--- TEST 6: GET /api/events List Enrichment ---');
  const listRes = await call('/events', removedUser);
  assert.equal(listRes.status, 200);
  const list = await listRes.json();
  const meetingItem = list.find(e => e.id === meetingEvent);
  assert.ok(meetingItem);
  assert.equal(meetingItem.has_member_ticket_privilege, true);
  assert.equal(meetingItem.is_free_for_member, true);
  assert.equal(meetingItem.effective_price, 0);

  const eduItem = list.find(e => e.id === educationEvent);
  assert.ok(eduItem);
  assert.equal(eduItem.has_member_ticket_privilege, true);
  assert.equal(eduItem.member_price, 100);
  assert.equal(eduItem.effective_price, 100);

  console.log('All event ticket entitlement contract tests PASS (R02, R12, D07 verified).');
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Event ticket entitlement contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
