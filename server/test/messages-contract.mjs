import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import pg from 'pg';
import jwt from 'jsonwebtoken';


const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-messages-${randomUUID().slice(0, 8)}`;
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

  // Override every database setting before loading application modules. Never use a .env file here.
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
  process.env.VERCEL = '1'; // Prevent automatic migrations and network listening on module import.
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
  assert.equal((await applyVersionedSchema()).applied.length,23);
  assert.equal((await applyVersionedSchema()).applied.length,0);




  const [alice,bob,third,other,missing]=Array.from({length:5},()=>randomUUID());
  for(const [i,id] of [alice,bob,third,other].entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash) VALUES($1,$2,$3,$3,'secret')",[id,`messages-${i}@example.invalid`,`Fixture ${i}`]);
  await pool.query("INSERT INTO friend_requests(sender_id,receiver_id,status) VALUES($1,$2,'ACCEPTED'),($1,$3,'PENDING'),($2,$4,'ACCEPTED')",[alice,bob,third,other]);
  await pool.query('CREATE ROLE anon; CREATE ROLE authenticated; ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated');
  // Simulate adoption from the previously delivered 10-version database.
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check; ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK(status IN('ACTIVE','REQUESTED')); ALTER TABLE users DROP COLUMN group_title; DELETE FROM schema_migrations WHERE version='0015_group_membership_state'");
  await pool.query("ALTER TABLE groups DROP COLUMN meeting_time, DROP COLUMN meeting_link; DELETE FROM schema_migrations WHERE version='0014_group_meeting_settings'");
  await pool.query("DROP TABLE invoice_files; DELETE FROM schema_migrations WHERE version='0013_invoice_files'");
  await pool.query("DROP TABLE document_files,document_library; DELETE FROM schema_migrations WHERE version='0012_document_library'");
  await pool.query("DROP TABLE direct_messages; DELETE FROM schema_migrations WHERE version='0011_direct_messages'");
  assert.deepEqual((await applyVersionedSchema()).applied,['0011_direct_messages','0012_document_library','0013_invoice_files','0014_group_meeting_settings','0015_group_membership_state','0016_group_capacity_invariant','0017_subscription_reminder_delivery','0018_web_job_runs','0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields']);
  assert.equal((await applyVersionedSchema()).applied.length,0);
  assert.equal((await pool.query('SELECT count(*)::int n FROM users')).rows[0].n,4);
  assert.equal((await pool.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.direct_messages'::regclass")).rows[0].relrowsecurity,true);
  assert.equal((await pool.query("SELECT has_table_privilege('anon','direct_messages','SELECT') OR has_table_privilege('authenticated','direct_messages','INSERT') AS allowed")).rows[0].allowed,false);
  await pool.query('GRANT SELECT,INSERT ON direct_messages TO anon,authenticated');
  const unprivileged=await pool.connect();
  for(const role of ['anon','authenticated']){
    await unprivileged.query('BEGIN');await unprivileged.query(`SET LOCAL ROLE ${role}`);
    assert.equal((await unprivileged.query('SELECT * FROM direct_messages')).rows.length,0);
    await assert.rejects(unprivileged.query('INSERT INTO direct_messages(sender_id,receiver_id,content,request_key) VALUES($1,$2,\'x\',$3)',[alice,bob,randomUUID()]),e=>e.code==='42501');
    await unprivileged.query('ROLLBACK');
  }unprivileged.release();
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='MEMBER')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(url,id=alice,body,role='MEMBER')=>fetch(`${base}/api${url}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(id?{Authorization:`Bearer ${token(id,role)}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
  const thread=id=>'/messages/'+id;
  const snapshot=async()=>JSON.stringify((await pool.query('SELECT jsonb_agg(m ORDER BY id) rows FROM direct_messages m')).rows);
  assert.equal((await call('/messages/conversations',null)).status,401);
  assert.equal((await call('/messages/conversations',missing)).status,401);
  assert.equal((await call(thread(alice))).status,400);
  assert.equal((await call(thread(third))).status,403);
  assert.equal((await call(thread(missing))).status,404);
  assert.equal((await call(thread('bad'))).status,400);
  assert.equal((await call(thread(bob),third,undefined,'ADMIN')).status,403);
  assert.equal((await call('/messages/conversations?userId='+bob)).status,400);
  for(const payload of [{content:'',requestKey:randomUUID()},{content:'x'.repeat(4001),requestKey:randomUUID()},{content:'x'},{content:3,requestKey:randomUUID()}])assert.equal((await call(thread(bob),alice,payload)).status,400);
  const mod=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const compile=file=>ts.transpileModule(readFileSync(path.join(serverDir,'../',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const source=compile('src/api/api.ts').replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService={};').replaceAll('import.meta.env.PROD','false').replaceAll('http://localhost:4005/api',`${base}/api`);
  let webOwner=alice;globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(webOwner)}})};
  globalThis.messageTransport=(await mod(source)).referralTransport;
  const {messagesApi}=await mod(compile('src/api/messages.ts').replace(/import \{ referralTransport \} from ['"]\.\/api['"];?/,'const referralTransport=globalThis.messageTransport;'));
  const empty=await messagesApi.page(alice,bob);assert.equal(empty.messages.length,0);assert.deepEqual(await messagesApi.conversations(alice),[]);
  await assert.rejects(messagesApi.page(third,bob));
  const key=randomUUID(),content=' Merhaba <script>alert(1)</script> ';
  const race=await Promise.all(Array.from({length:12},()=>messagesApi.send(alice,bob,content,key)));
  assert.equal(new Set(race.map(r=>r.id)).size,1);assert.equal((await pool.query('SELECT count(*)::int n FROM direct_messages')).rows[0].n,1);
  assert.equal((await call(thread(bob),alice,{content:'changed',requestKey:key})).status,409);
  assert.equal((await call(thread(third),alice,{content:'x',requestKey:randomUUID()})).status,403);
  const sent=await messagesApi.page(alice,bob);assert.equal(sent.messages[0].content,content.trim());assert.equal((await messagesApi.conversations(alice))[0].friend.id,bob);
  webOwner=bob;const received=await messagesApi.page(bob,alice);assert.equal(received.messages[0].id,race[0].id);
  await messagesApi.send(bob,alice,'Cevap',key); // Keys belong to senders; reuse across owners is safe.
  await messagesApi.send(bob,other,'Özel diğer konuşma',randomUUID());
  webOwner=alice;
  const mine=await messagesApi.conversations(alice);assert.equal(mine.length,1);assert.equal(mine[0].lastMessage.content,'Cevap');assert.equal((await messagesApi.page(alice,bob)).messages.length,2);
  const foreign=(await pool.query('SELECT id FROM direct_messages WHERE receiver_id=$1',[other])).rows[0].id;
  assert.equal((await call(thread(bob)+'?before='+foreign)).status,404);
  assert.equal((await call(thread(bob)+'?before=bad')).status,400);
  await pool.query("INSERT INTO direct_messages(sender_id,receiver_id,content,request_key,created_at) SELECT $1,$2,'Old '||i,gen_random_uuid(),now()-interval '1 day' FROM generate_series(1,55) i",[alice,bob]);
  const latest=await messagesApi.page(alice,bob);assert.equal(latest.messages.length,50);assert.ok(latest.before);
  const older=await messagesApi.page(alice,bob,latest.before);assert.equal(older.messages.length,7);assert.equal(older.before,null);
  assert.equal(new Set([...older.messages,...latest.messages].map(m=>m.id)).size,57);
  const stable=await snapshot();await messagesApi.page(alice,bob);await messagesApi.conversations(alice);assert.equal(await snapshot(),stable);
  assert.equal((await call(thread(bob))).headers.get('cache-control'),'private, no-store');
  await pool.query("UPDATE friend_requests SET status='REJECTED' WHERE sender_id=$1 AND receiver_id=$2",[alice,bob]);
  assert.equal((await call(thread(bob))).status,403);assert.deepEqual(await messagesApi.conversations(alice),[]);
  await pool.query("UPDATE friend_requests SET status='ACCEPTED' WHERE sender_id=$1 AND receiver_id=$2",[alice,bob]);
  const originalConnect=pool.connect.bind(pool);
  pool.connect=async()=>{const c=await originalConnect(),query=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{const result=await query(sql,args);if(typeof sql==='string'&&sql.startsWith('INSERT INTO direct_messages'))throw new Error('Fixture failure after message insert');return result;};c.release=()=>{c.query=query;c.release=release;release();};return c;};
  const rollbackKey=randomUUID();assert.equal((await call(thread(bob),alice,{content:'retry',requestKey:rollbackKey})).status,500);pool.connect=originalConnect;
  assert.equal(await snapshot(),stable);await messagesApi.send(alice,bob,'retry',rollbackKey);
  await assert.rejects(pool.query('DELETE FROM users WHERE id=$1',[alice]),e=>e.code==='23503');
  const browserPage=await messagesApi.page(alice,bob),browserList=await messagesApi.conversations(alice);
  writeFileSync(path.join(serverDir,'../output/messages-browser.json'),JSON.stringify({owner:alice,target:bob,empty,page:browserPage,conversations:{ownerId:alice,conversations:browserList}}));
  console.log('Messages PASS: 13-version install/upgrade/replay; actual web bearer/Express/isolated PG; participant/friend boundary, unrelated ADMIN denial, RLS client denial, sender-key race/single row/replay/conflict, separate conversations, 50-row cursor pagination, GET no writes, post-insert rollback/retry, history-preserving FK.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Messages contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
