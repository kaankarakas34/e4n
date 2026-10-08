import { createServer } from 'node:http';
import { createHash, createDecipheriv } from 'node:crypto';
let gateway;
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import jwt from 'jsonwebtoken';


const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-support-flow-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,24);
  assert.equal((await applyVersionedSchema()).applied.length,0);
  const ids=[randomUUID(),randomUUID(),randomUUID()];
  for(const [i,id] of ids.entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,account_status) VALUES($1,$2,$3,'Fixture','fixture','MEMBER','PENDING')",[id,`payment-${i}@example.invalid`,`Payment ${i}`]);
  await pool.query("UPDATE users SET role='PRESIDENT' WHERE id=$1",[ids[1]]);
  await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[ids[2]]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}/api`;
  const roles=['MEMBER','PRESIDENT','ADMIN'];
  const call=async(url,actor=0,body,method=body?'POST':'GET')=>fetch(base+url,{method,headers:{'Content-Type':'application/json',...(actor===null?{}:{Authorization:`Bearer ${jwt.sign({id:ids[actor],role:roles[actor]},process.env.JWT_SECRET)}`})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  assert.equal((await call('/tickets',null)).status,401);
  const intent={subject:'Support fixture',message:'First fixture message',requestKey:randomUUID()};
  const responses=await Promise.all([0,1,2].map(()=>call('/tickets',0,intent)));
  assert.ok(responses.every(r=>r.status===201));const created=await Promise.all(responses.map(r=>r.json()));
  assert.equal(new Set(created.map(r=>r.id)).size,1);const id=created[0].id;
  const counts=async()=>({tickets:Number((await pool.query('SELECT COUNT(*) FROM tickets')).rows[0].count),messages:Number((await pool.query('SELECT COUNT(*) FROM ticket_messages')).rows[0].count),receipts:Number((await pool.query('SELECT COUNT(*) FROM support_mutations')).rows[0].count)});
  assert.deepEqual(await counts(),{tickets:1,messages:1,receipts:1});
  assert.equal((await call('/support',0,{...intent,message:'Changed'})).status,409);
  for(const bad of [{...intent,requestKey:'bad'},{subject:' ',message:'x'},{subject:'x',message:''},{subject:'x'.repeat(256),message:'x'}])assert.equal((await call('/tickets',0,bad)).status,400);
  assert.deepEqual(await counts(),{tickets:1,messages:1,receipts:1});
  assert.equal((await (await call('/tickets',1)).json()).length,0);
  assert.equal((await (await call('/support',2)).json()).length,1);
  for(const route of [`/tickets/${id}`,`/support/${id}`])assert.equal((await call(route,1)).status,403);
  const foreignBefore=await counts();
  assert.equal((await call(`/tickets/${id}/messages`,1,{message:'Foreign',requestKey:randomUUID()})).status,403);
  assert.equal((await call(`/tickets/${id}/status`,0,{status:'CLOSED'} ,'PUT')).status,403);
  assert.equal((await call(`/tickets/${id}/status`,1,{status:'CLOSED'} ,'PUT')).status,403);
  assert.deepEqual(await counts(),foreignBefore);
  assert.equal((await call(`/tickets/${id}/messages`,0,{message:'Changed reply',requestKey:intent.requestKey})).status,409);
  assert.equal((await call(`/tickets/${id}/messages`,0,{message:' ',requestKey:randomUUID()})).status,400);
  for(const prefix of ['tickets','support']) {
    assert.equal((await call(`/${prefix}/${randomUUID()}/status`,2,{status:'CLOSED'},'PUT')).status,404);
    assert.equal((await call(`/${prefix}/bad/status`,2,{status:'OPEN'},'PUT')).status,400);
    assert.equal((await call(`/${prefix}/${id}/status`,2,{status:'INVALID'},'PUT')).status,400);
  }
  const reply={message:'Member reply',requestKey:randomUUID()};
  const replies=await Promise.all([0,1,2].map(()=>call(`/tickets/${id}/messages`,0,reply)));
  assert.ok(replies.every(r=>r.status===201));const acks=await Promise.all(replies.map(r=>r.json()));
  assert.equal(new Set(acks.map(r=>r.message_id)).size,1);assert.ok(acks.every(r=>r.success===true&&r.ticket_id===id&&r.status==='OPEN'));
  assert.deepEqual(await counts(),{tickets:1,messages:2,receipts:2});
  const apiSource=ts.transpileModule(readFileSync(path.join(serverDir,'../src/api/api.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService = {};').replace(/const BASE_URL = .*?;/,`const BASE_URL = ${JSON.stringify(base)};`);
  let actor=0;globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:jwt.sign({id:ids[actor],role:roles[actor]},process.env.JWT_SECRET)}})};
  const {api}=await import(`data:text/javascript;base64,${Buffer.from(apiSource).toString('base64')}`);
  if(process.argv[2]) {
    // Real mobile transport and service target this same disposable loopback API.
    const mobileRoot=path.resolve(process.argv[2]);
    const compileMobile=file=>ts.transpileModule(readFileSync(path.join(mobileRoot,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    let transport=compileMobile('utils/api-client.ts').replace(/import \{ API_CONFIG \} from ['"]@\/constants\/api['"];?/,`const API_CONFIG={BASE_URL:${JSON.stringify(base)}};`)
      .replace(/import \{ SecureStorage \} from ['"]\.\/secure-storage['"];?/,'const SecureStorage={getToken:async()=>globalThis.mobileSupportToken()};');
    globalThis.mobileSupportToken=()=>jwt.sign({id:ids[actor],role:roles[actor]},process.env.JWT_SECRET);
    const {apiClient}=await import(`data:text/javascript;base64,${Buffer.from(transport).toString('base64')}`);
    globalThis.mobileSupportRealClient=apiClient;
    const service=compileMobile('utils/support-api.ts').replace(/import \{ apiClient \} from ['"]\.\/api-client['"];?/,'const apiClient=globalThis.mobileSupportRealClient;');
    const {supportApi:mobile}=await import(`data:text/javascript;base64,${Buffer.from(service).toString('base64')}`);
    assert.equal((await mobile.create(ids[0],intent.subject,intent.message,intent.requestKey)).id,id);
    assert.equal((await mobile.reply(id,reply.message,reply.requestKey)).message_id,acks[0].message_id);
    assert.equal((await mobile.detail(id,ids[0])).messages.length,2);
    actor=1;assert.equal((await mobile.list(ids[1],false)).length,0);await assert.rejects(mobile.detail(id,ids[0]));
    actor=2;assert.equal((await mobile.list(ids[2],true)).length,1);
    const mobileCloseKey=randomUUID();await mobile.status(id,'CLOSED',mobileCloseKey);await mobile.status(id,'OPEN',randomUUID());
    await mobile.status(id,'CLOSED',mobileCloseKey);assert.equal((await mobile.detail(id,ids[0])).ticket.status,'OPEN');
    actor=0;
  }
  assert.equal((await api.createTicket(intent)).id,id);assert.equal((await api.replyTicket(id,reply.message,reply.requestKey)).message_id,acks[0].message_id);
  actor=2;const adminKey=randomUUID();assert.equal((await api.replyTicket(id,'Admin answer',adminKey)).status,'ANSWERED');
  const detail=await api.getTicketDetails(id);assert.equal(detail.ticket.status,'ANSWERED');assert.equal(detail.messages.length,3);assert.equal(detail.messages.find(m=>m.sender_id===ids[2]).sender_role,'ADMIN');
  const closing=randomUUID();assert.equal((await api.updateTicketStatus(id,'CLOSED',closing)).status,'CLOSED');
  assert.equal((await call(`/tickets/${id}/messages`,0,{message:'Closed write',requestKey:randomUUID()})).status,409);
  // Replaying an earlier successful reply does not reopen a subsequently closed ticket.
  assert.equal((await (await call(`/tickets/${id}/messages`,0,reply)).json()).message_id,acks[0].message_id);
  assert.equal((await api.getTicketDetails(id)).ticket.status,'CLOSED');
  const reopening=randomUUID();await api.updateTicketStatus(id,'OPEN',reopening);
  // Replaying the old close ACK never applies close a second time.
  assert.equal((await api.updateTicketStatus(id,'CLOSED',closing)).success,true);assert.equal((await api.getTicketDetails(id)).ticket.status,'OPEN');
  await assert.rejects(api.updateTicketStatus(id,'CLOSED',reopening),e=>e.status===409);
  const rollbackKey=randomUUID(),beforeRollback=await counts();
  await pool.query("CREATE FUNCTION fixture_support_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic failure'; END; $$; CREATE TRIGGER fixture_support_failure BEFORE INSERT ON ticket_messages FOR EACH ROW EXECUTE FUNCTION fixture_support_failure()");
  try{assert.equal((await call('/tickets',0,{subject:'Rollback',message:'Rollback',requestKey:rollbackKey})).status,500);}finally{await pool.query('DROP TRIGGER fixture_support_failure ON ticket_messages; DROP FUNCTION fixture_support_failure()');}
  assert.deepEqual(await counts(),beforeRollback);
  assert.equal((await call('/tickets',0,{subject:'Rollback',message:'Rollback',requestKey:rollbackKey})).status,201);
  const concurrent=await Promise.all([call(`/tickets/${id}/messages`,2,{message:'Race admin',requestKey:randomUUID()}),call(`/tickets/${id}/status`,2,{status:'CLOSED',requestKey:randomUUID()},'PUT')]);assert.ok(concurrent.every(r=>r.status<300));
  const finalDetail=await api.getTicketDetails(id);assert.ok(['ANSWERED','CLOSED'].includes(finalDetail.ticket.status));assert.equal(finalDetail.messages.length,4);
  // Existing unkeyed callers retain their shape; keyed dedup is not falsely promised for them.
  const legacy=await call('/support',1,{subject:'Legacy caller',message:'Legacy message'});assert.equal(legacy.status,201);
  const snapshot=async()=>({tickets:(await pool.query('SELECT * FROM tickets ORDER BY id')).rows,messages:(await pool.query('SELECT * FROM ticket_messages ORDER BY id')).rows});
  const beforeUpgrade=await snapshot();
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check; ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK(status IN('ACTIVE','REQUESTED')); ALTER TABLE users DROP COLUMN group_title; DELETE FROM schema_migrations WHERE version='0015_group_membership_state'");
  await pool.query("ALTER TABLE groups DROP COLUMN meeting_time, DROP COLUMN meeting_link; DELETE FROM schema_migrations WHERE version='0014_group_meeting_settings'");
  await pool.query("DROP TABLE invoice_files; DELETE FROM schema_migrations WHERE version='0013_invoice_files'");
  await pool.query("DROP TABLE document_files,document_library; DELETE FROM schema_migrations WHERE version='0012_document_library'");
  await pool.query("DROP TABLE direct_messages; DELETE FROM schema_migrations WHERE version='0011_direct_messages'");
  await pool.query("DROP TABLE user_score_history; DELETE FROM schema_migrations WHERE version='0010_score_history'");await pool.query("DROP TABLE support_mutations; DELETE FROM schema_migrations WHERE version='0009_support_mutations'");
  assert.deepEqual((await applyVersionedSchema()).applied,['0009_support_mutations','0010_score_history','0011_direct_messages','0012_document_library','0013_invoice_files','0014_group_meeting_settings','0015_group_membership_state','0016_group_capacity_invariant','0017_subscription_reminder_delivery','0018_web_job_runs','0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields','0024_group_meeting_attendance']);assert.equal((await applyVersionedSchema()).applied.length,0);assert.deepEqual(await snapshot(),beforeUpgrade);
  console.log('Support flow: real Express/api.ts/PostgreSQL17 create/read/reply/status, aliases, role/owner/target validation, concurrent keyed repeats, replay without later-status mutation, rollback/retry and 8→9 existing-data upgrade passed. No live DB/email.');
}
let exitCode=0;
try{await main();}catch(error){exitCode=1;console.error(error.stack);}
finally{
  if(appServer)await new Promise(resolve=>appServer.close(resolve));
  if(pool)await pool.end();
  if(containerStarted)try{docker(['stop','--time','3',container]);}catch(error){exitCode=1;console.error(error.message);}
}
process.exit(exitCode);
