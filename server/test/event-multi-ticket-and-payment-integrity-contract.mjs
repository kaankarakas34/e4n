import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-multi-ticket-${randomUUID().slice(0, 8)}`;
const dbName = 'e4n_isolated_test';
const dbUser = 'e4n_isolated_test';
const dbPassword = 'local_fixture_only';
let appServer;
let pool;
let gateway;
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

  // Setup Mock Sipay Gateway
  const results = new Map();
  let dispatches = 0;
  gateway = createServer(async (req, res) => {
    let raw = '';
    for await (const part of req) raw += part;
    const body = raw ? JSON.parse(raw) : {};

    if (req.url === '/api/token') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status_code: 100, data: { token: 'synthetic-provider-token' } }));
      return;
    }

    if (req.url === '/api/paySmart3D') {
      dispatches++;
      results.set(body.invoice_id, {
        status_code: 69,
        transaction_status: 'Pending',
        transaction_type: 'Auth',
        invoice_id: body.invoice_id,
        transaction_amount: body.total,
      });
      res.setHeader('Content-Type', 'text/html');
      res.end('<form>Synthetic 3DS</form>');
      return;
    }

    if (req.url === '/api/checkstatus') {
      res.setHeader('Content-Type', 'application/json');
      const invoice = body.invoice_id;
      const r = results.get(invoice) || { status_code: 69, transaction_status: 'Pending', invoice_id: invoice };
      res.end(JSON.stringify(r));
      return;
    }

    res.writeHead(404);
    res.end();
  });
  gateway.listen(0, '127.0.0.1');
  await once(gateway, 'listening');
  const gatewayPort = gateway.address().port;

  process.env.SIPAY_API_URL = `http://127.0.0.1:${gatewayPort}`;
  process.env.SIPAY_APP_ID = 'fixture-app';
  process.env.SIPAY_APP_SECRET = 'fixture-secret';
  process.env.SIPAY_MERCHANT_KEY = 'fixture-merchant';

  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const base = `http://127.0.0.1:${appServer.address().port}`;

  const token = (id, role = 'MEMBER') => jwt.sign({ id, role }, process.env.JWT_SECRET);

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

  // Setup Test Data
  const memberId = randomUUID();
  const adminId = randomUUID();
  const groupId = randomUUID();

  await pool.query(
    "INSERT INTO users(id, email, name, role, account_status, profession) VALUES($1, 'member@test.local', 'Ali Uye', 'MEMBER', 'ACTIVE', 'Yazilimci')",
    [memberId]
  );
  await pool.query(
    "INSERT INTO users(id, email, name, role, account_status, profession) VALUES($1, 'admin@test.local', 'Admin User', 'ADMIN', 'ACTIVE', 'Yonetici')",
    [adminId]
  );
  await pool.query(
    "INSERT INTO groups(id, name) VALUES($1, 'Test Grubu')",
    [groupId]
  );

  // Setup Events:
  // 1. publicTicketEvent: public social event, price 100 TL, max_attendees 50
  const publicTicketEvent = randomUUID();
  await pool.query(
    `INSERT INTO events(id, title, start_at, is_public, type, price, currency, generate_tickets, max_attendees, created_by, status)
     VALUES($1, 'Sosyal Ag Zirvesi', NOW() + interval '3 days', true, 'social', 100, 'TRY', true, 50, $2, 'PUBLISHED')`,
    [publicTicketEvent, adminId]
  );

  // 2. capacityLimitedEvent: max_attendees 3
  const capacityLimitedEvent = randomUUID();
  await pool.query(
    `INSERT INTO events(id, title, start_at, is_public, type, price, currency, generate_tickets, max_attendees, created_by, status)
     VALUES($1, 'Kontenjanli Atolye', NOW() + interval '5 days', true, 'education', 200, 'TRY', true, 3, $2, 'PUBLISHED')`,
    [capacityLimitedEvent, adminId]
  );

  // 3. closedGroupEvent: is_public false, group_id set
  const closedGroupEvent = randomUUID();
  await pool.query(
    `INSERT INTO events(id, title, start_at, is_public, type, price, currency, generate_tickets, max_attendees, group_id, created_by, status)
     VALUES($1, 'Kapali Grup Toplantisi', NOW() + interval '2 days', false, 'meeting', 0, 'TRY', true, 30, $2, $3, 'PUBLISHED')`,
    [closedGroupEvent, groupId, adminId]
  );

  console.log('--- TEST 1: Member Multi-Ticket Purchase (Quantity = 3) ---');
  const memberPayReq = {
    requestKey: randomUUID(),
    total: 300,
    cardNumber: '5555444433332222',
    cardHolderName: 'Ali Uye',
    expiryMonth: '12',
    expiryYear: '2028',
    cvv: '123',
    action: {
      type: 'event_registration',
      data: {
        event_id: publicTicketEvent,
        user_id: memberId,
        quantity: 3
      }
    }
  };

  const memberPayRes = await call('/payment/pay', memberId, 'POST', memberPayReq);
  assert.equal(memberPayRes.status, 200, 'Payment initialization should succeed');
  const memberPayData = await memberPayRes.json();
  assert.ok(memberPayData.invoiceId);
  assert.ok(memberPayData.receiptToken);

  // Settle transaction via Sipay status check
  results.set(memberPayData.invoiceId, {
    status_code: 100,
    transaction_status: 'Completed',
    transaction_type: 'Auth',
    transaction_amount: 300,
    invoice_id: memberPayData.invoiceId,
  });

  const memberStatusRes = await call('/payment/status', null, 'POST', {
    invoiceId: memberPayData.invoiceId,
    receiptToken: memberPayData.receiptToken,
  });
  assert.equal(memberStatusRes.status, 200);
  const memberStatus = await memberStatusRes.json();
  assert.equal(memberStatus.status, 'SUCCESS');

  // Verify DB state for Member
  const memberTicketsRes = await pool.query(
    'SELECT id, ticket_number, payment_status FROM event_tickets WHERE event_id=$1 AND user_id=$2 ORDER BY created_at ASC',
    [publicTicketEvent, memberId]
  );
  assert.equal(memberTicketsRes.rowCount, 3, 'Must create exactly 3 tickets');
  for (const t of memberTicketsRes.rows) {
    assert.equal(t.payment_status, 'PAID', 'Ticket must be marked PAID');
    assert.ok(t.ticket_number.startsWith('E4N-'), 'Ticket number must have E4N- prefix');
  }

  // Verify attendance
  const memberAttRes = await pool.query(
    'SELECT status FROM attendance WHERE event_id=$1 AND user_id=$2',
    [publicTicketEvent, memberId]
  );
  assert.equal(memberAttRes.rowCount, 1);
  assert.equal(memberAttRes.rows[0].status, 'PRESENT');

  // Verify GET /api/events/:id returns tickets and counts
  const memberDetailRes = await call(`/events/${publicTicketEvent}`, memberId);
  assert.equal(memberDetailRes.status, 200);
  const memberDetail = await memberDetailRes.json();
  assert.equal(memberDetail.is_registered, true);
  assert.equal(memberDetail.ticket_payment_status, 'PAID');
  assert.equal(memberDetail.my_tickets_count, 3);
  assert.equal(memberDetail.my_tickets.length, 3);

  console.log('--- TEST 2: Existing PENDING Ticket Promotion + Multi-Ticket Top-up ---');
  // Create another event and register user with PENDING ticket
  const topUpEvent = randomUUID();
  await pool.query(
    `INSERT INTO events(id, title, start_at, is_public, type, price, currency, generate_tickets, max_attendees, created_by, status)
     VALUES($1, 'TopUp Event', NOW() + interval '4 days', true, 'social', 100, 'TRY', true, 50, $2, 'PUBLISHED')`,
    [topUpEvent, adminId]
  );
  const pendingTicketId = randomUUID();
  await pool.query(
    "INSERT INTO attendance(event_id, user_id, status) VALUES($1, $2, 'PRESENT')",
    [topUpEvent, memberId]
  );
  await pool.query(
    "INSERT INTO event_tickets(id, event_id, user_id, ticket_number, payment_status) VALUES($1, $2, $3, $4, 'PENDING')",
    [pendingTicketId, topUpEvent, memberId, `E4N-PENDING-${randomUUID().slice(0, 8)}`]
  );

  // User buys quantity = 3 (1 pending should be promoted, 2 new tickets created)
  const topUpPayReq = {
    requestKey: randomUUID(),
    total: 300,
    cardNumber: '5555444433332222',
    cardHolderName: 'Ali Uye',
    expiryMonth: '12',
    expiryYear: '2028',
    cvv: '123',
    action: {
      type: 'event_registration',
      data: {
        event_id: topUpEvent,
        user_id: memberId,
        quantity: 3
      }
    }
  };
  const topUpPayRes = await call('/payment/pay', memberId, 'POST', topUpPayReq);
  assert.equal(topUpPayRes.status, 200);
  const topUpData = await topUpPayRes.json();

  results.set(topUpData.invoiceId, {
    status_code: 100,
    transaction_status: 'Completed',
    transaction_type: 'Auth',
    transaction_amount: 300,
    invoice_id: topUpData.invoiceId,
  });

  const topUpStatusRes = await call('/payment/status', null, 'POST', {
    invoiceId: topUpData.invoiceId,
    receiptToken: topUpData.receiptToken,
  });
  assert.equal(topUpStatusRes.status, 200);

  const topUpTickets = (await pool.query(
    'SELECT id, payment_status FROM event_tickets WHERE event_id=$1 AND user_id=$2 ORDER BY created_at ASC',
    [topUpEvent, memberId]
  )).rows;
  assert.equal(topUpTickets.length, 3, 'Must have exactly 3 tickets total');
  const promotedTicket = topUpTickets.find(t => t.id === pendingTicketId);
  assert.ok(promotedTicket, 'Original pending ticket must be retained');
  assert.equal(promotedTicket.payment_status, 'PAID', 'Original pending ticket must be promoted to PAID');
  assert.equal(topUpTickets.filter(t => t.payment_status === 'PAID').length, 3, 'All 3 tickets must be PAID');

  console.log('--- TEST 3: External Guest Ticket Purchase (visitor_registration with quantity = 2) ---');
  const guestPayReq = {
    requestKey: randomUUID(),
    total: 200,
    cardNumber: '5555444433332222',
    cardHolderName: 'Ayse Misafir',
    expiryMonth: '10',
    expiryYear: '2027',
    cvv: '456',
    action: {
      type: 'visitor_registration',
      data: {
        event_id: publicTicketEvent,
        name: 'Ayse Misafir',
        email: 'ayse.misafir@example.com',
        phone: '05321112233',
        company: 'Misafir Ltd',
        quantity: 2,
        source: 'event_guest_ticket'
      }
    }
  };

  const guestPayRes = await call('/payment/pay', null, 'POST', guestPayReq);
  assert.equal(guestPayRes.status, 200, 'Guest checkout initialization should succeed');
  const guestPayData = await guestPayRes.json();
  assert.ok(guestPayData.invoiceId);
  assert.ok(guestPayData.receiptToken);

  results.set(guestPayData.invoiceId, {
    status_code: 100,
    transaction_status: 'Completed',
    transaction_type: 'Auth',
    transaction_amount: 200,
    invoice_id: guestPayData.invoiceId,
  });

  const guestStatusRes = await call('/payment/status', null, 'POST', {
    invoiceId: guestPayData.invoiceId,
    receiptToken: guestPayData.receiptToken,
  });
  assert.equal(guestStatusRes.status, 200);

  // Check guest tickets in event_tickets: user_id = NULL, payment_status = PAID, prefix E4N-GUEST-
  const guestTicketsRes = await pool.query(
    "SELECT id, ticket_number, payment_status FROM event_tickets WHERE event_id=$1 AND user_id IS NULL AND ticket_number LIKE 'E4N-GUEST-%'",
    [publicTicketEvent]
  );
  assert.equal(guestTicketsRes.rowCount, 2, 'Must create exactly 2 guest tickets');
  for (const gt of guestTicketsRes.rows) {
    assert.equal(gt.payment_status, 'PAID');
    assert.ok(gt.ticket_number.startsWith('E4N-GUEST-'));
  }

  // Check public_visitors table record
  const visitorRecordRes = await pool.query(
    'SELECT name, email, form_data FROM public_visitors WHERE event_id=$1 AND email=$2',
    [publicTicketEvent, 'ayse.misafir@example.com']
  );
  assert.equal(visitorRecordRes.rowCount, 1);
  const visitorRecord = visitorRecordRes.rows[0];
  assert.equal(visitorRecord.name, 'Ayse Misafir');
  assert.equal(visitorRecord.form_data.payment_status, 'PAID');
  assert.equal(visitorRecord.form_data.quantity, 2);
  assert.equal(Array.isArray(visitorRecord.form_data.ticket_numbers), true);
  assert.equal(visitorRecord.form_data.ticket_numbers.length, 2);

  console.log('--- TEST 4: Capacity Overflow Protection (CAPACITY_EXCEEDED 409) ---');
  // capacityLimitedEvent has max_attendees = 3.
  // Add 2 attendees first:
  await pool.query(
    "INSERT INTO attendance(event_id, user_id, status) VALUES($1, $2, 'PRESENT')",
    [capacityLimitedEvent, adminId]
  );
  await pool.query(
    "INSERT INTO attendance(event_id, user_id, status) VALUES($1, $2, 'PRESENT')",
    [capacityLimitedEvent, memberId]
  );

  // Now attempt to purchase quantity = 2 (2 + 2 = 4 > 3 max attendees)
  const overflowReq = {
    requestKey: randomUUID(),
    total: 400,
    cardNumber: '5555444433332222',
    cardHolderName: 'Mehmet Kapasite',
    expiryMonth: '10',
    expiryYear: '2027',
    cvv: '456',
    action: {
      type: 'visitor_registration',
      data: {
        event_id: capacityLimitedEvent,
        name: 'Mehmet Kapasite',
        email: 'mehmet@overflow.test',
        phone: '05329998877',
        quantity: 2
      }
    }
  };

  const overflowRes = await call('/payment/pay', null, 'POST', overflowReq);
  assert.equal(overflowRes.status, 409, 'Must reject with 409 when capacity is exceeded');
  const overflowBody = await overflowRes.json();
  assert.equal(overflowBody.code, 'CAPACITY_EXCEEDED');

  console.log('--- TEST 5: Closed Group Event Protection (CLOSED_GROUP_EVENT 403) ---');
  // Attempt to buy guest tickets for a closed group event
  const closedEventReq = {
    requestKey: randomUUID(),
    total: 100,
    cardNumber: '5555444433332222',
    cardHolderName: 'Harici Katilimci',
    expiryMonth: '10',
    expiryYear: '2027',
    cvv: '456',
    action: {
      type: 'visitor_registration',
      data: {
        event_id: closedGroupEvent,
        name: 'Harici Katilimci',
        email: 'harici@closed.test',
        phone: '05329998877',
        quantity: 1
      }
    }
  };

  const closedEventRes = await call('/payment/pay', null, 'POST', closedEventReq);
  assert.equal(closedEventRes.status, 403, 'Must reject with 403 for closed group event');
  const closedEventBody = await closedEventRes.json();
  assert.equal(closedEventBody.code, 'CLOSED_GROUP_EVENT');

  console.log('--- TEST 6: Transaction Atomicity & Rollback Integrity ---');
  // Create an event for rollback test
  const rollbackEvent = randomUUID();
  await pool.query(
    `INSERT INTO events(id, title, start_at, is_public, type, price, currency, generate_tickets, max_attendees, created_by, status)
     VALUES($1, 'Rollback Event', NOW() + interval '5 days', true, 'social', 150, 'TRY', true, 50, $2, 'PUBLISHED')`,
    [rollbackEvent, adminId]
  );

  const rollbackPayReq = {
    requestKey: randomUUID(),
    total: 300,
    cardNumber: '5555444433332222',
    cardHolderName: 'Ali Uye',
    expiryMonth: '12',
    expiryYear: '2028',
    cvv: '123',
    action: {
      type: 'event_registration',
      data: {
        event_id: rollbackEvent,
        user_id: memberId,
        quantity: 2
      }
    }
  };
  const rollbackPayRes = await call('/payment/pay', memberId, 'POST', rollbackPayReq);
  assert.equal(rollbackPayRes.status, 200);
  const rollbackData = await rollbackPayRes.json();

  results.set(rollbackData.invoiceId, {
    status_code: 100,
    transaction_status: 'Completed',
    transaction_type: 'Auth',
    transaction_amount: 300,
    invoice_id: rollbackData.invoiceId,
  });

  // Inject a failure trigger on event_tickets to simulate database error during action execution
  await pool.query(`
    CREATE OR REPLACE FUNCTION fixture_event_ticket_atomic_failure() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'Synthetic ticket creation failure';
    END;
    $$;
    CREATE TRIGGER fixture_event_ticket_atomic_failure BEFORE INSERT ON event_tickets
    FOR EACH ROW EXECUTE FUNCTION fixture_event_ticket_atomic_failure();
  `);

  try {
    const failedStatusRes = await call('/payment/status', null, 'POST', {
      invoiceId: rollbackData.invoiceId,
      receiptToken: rollbackData.receiptToken,
    });
    assert.equal(failedStatusRes.status, 502, 'Status call must return 502 when local action transaction fails');
  } finally {
    await pool.query(`
      DROP TRIGGER IF EXISTS fixture_event_ticket_atomic_failure ON event_tickets;
      DROP FUNCTION IF EXISTS fixture_event_ticket_atomic_failure();
    `);
  }

  // Verify rollback: zero tickets inserted, payment transaction remains PENDING
  const rollbackTickets = (await pool.query(
    'SELECT count(*)::int AS count FROM event_tickets WHERE event_id=$1',
    [rollbackEvent]
  )).rows[0].count;
  assert.equal(rollbackTickets, 0, 'No orphaned tickets should exist after rollback');

  const rollbackTxStatus = (await pool.query(
    'SELECT status FROM payment_transactions WHERE merchant_oid=$1',
    [rollbackData.invoiceId]
  )).rows[0].status;
  assert.equal(rollbackTxStatus, 'PENDING', 'Payment transaction must not be marked SUCCESS');

  // Now retry without error: should cleanly settle!
  const retryStatusRes = await call('/payment/status', null, 'POST', {
    invoiceId: rollbackData.invoiceId,
    receiptToken: rollbackData.receiptToken,
  });
  assert.equal(retryStatusRes.status, 200);
  const settledTickets = (await pool.query(
    'SELECT count(*)::int AS count FROM event_tickets WHERE event_id=$1 AND user_id=$2 AND payment_status=$3',
    [rollbackEvent, memberId, 'PAID']
  )).rows[0].count;
  assert.equal(settledTickets, 2, 'Retry after rollback must insert exact quantity of tickets');

  console.log('--- TEST 7: Idempotent Replay (Zero duplicate tickets on replay) ---');
  // Replaying settlement on the same invoice
  const replayStatusRes = await call('/payment/status', null, 'POST', {
    invoiceId: rollbackData.invoiceId,
    receiptToken: rollbackData.receiptToken,
  });
  assert.equal(replayStatusRes.status, 200);
  const finalTickets = (await pool.query(
    'SELECT count(*)::int AS count FROM event_tickets WHERE event_id=$1 AND user_id=$2',
    [rollbackEvent, memberId]
  )).rows[0].count;
  assert.equal(finalTickets, 2, 'Replay must not create duplicate tickets');

  console.log('All event multi-ticket and payment integrity contract tests PASS!');
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Multi-ticket and payment integrity contract failed: ${error.message}`);
  console.error(error.stack);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (gateway) await new Promise(resolve => gateway.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
