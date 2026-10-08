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
const container = `e4n-group-attendance-${randomUUID().slice(0, 8)}`;
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




  const [admin,member,president,foreign,deleted,group,other]=Array.from({length:7},()=>randomUUID());
  for(const [id,role]of [[admin,'ADMIN'],[member,'MEMBER'],[president,'PRESIDENT'],[foreign,'PRESIDENT']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,performance_score) VALUES($1::uuid,$2,$3,$1::text,'x',$3,73)",[id,id+'@example.invalid',role]);
  for(const id of [group,other])await pool.query("INSERT INTO groups(id,name,status) VALUES($1::uuid,$1::text,'ACTIVE')",[id]);
  await pool.query("INSERT INTO group_members(group_id,user_id,status,role) VALUES($1,$2,'ACTIVE','PRESIDENT'),($1,$3,'ACTIVE','MEMBER'),($4,$5,'ACTIVE','PRESIDENT')",[group,president,member,other,foreign]);
  const stable=JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows);
  await pool.query("ALTER TABLE event_attendance_verifications DROP CONSTRAINT event_attendance_verifications_after_status_check; ALTER TABLE event_attendance_verifications ADD CONSTRAINT event_attendance_verifications_after_status_check CHECK(after_status IN ('REGISTERED','PRESENT','ABSENT')); DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'");
  assert.deepEqual((await applyVersionedSchema()).applied,['0024_group_meeting_attendance']);assert.equal((await applyVersionedSchema()).applied.length,0);assert.equal(JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows),stable);
  const {default:nodemailer}=await import('nodemailer');nodemailer.createTransport=()=>({sendMail:async()=>{throw Error('No real mail allowed');}});
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const token=id=>jwt.sign({id,role:'ADMIN'},process.env.JWT_SECRET,{expiresIn:'1h'});
  const call=(url,actor=president,method='GET',body)=>fetch(base+'/api'+url,{method,headers:{'Content-Type':'application/json',...(actor?{Authorization:'Bearer '+token(actor)}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const command=()=>({requestId:randomUUID(),group_id:group,meeting_date:'2020-01-01T12:00:00.000Z',topic:'Observed weekly meeting',reason:'Verified each active participant',items:[{user_id:member,status:'LATE'},{user_id:president,status:'SUBSTITUTE'}]});
  const submit=(c,actor=president)=>call('/events/attendance',actor,'POST',c);
  for(const [actor,expected]of [[null,401],[deleted,401],[member,403],[foreign,403]])assert.equal((await submit(command(),actor)).status,expected);
  const initialCount=(await pool.query('SELECT count(*)::int n FROM events')).rows[0].n;
  for(const c of [{userId:member,meetingId:group,status:'PRESENT'}, {...command(),items:[]},{...command(),reason:''},{...command(),items:[{user_id:member,status:'PRESENT'},{user_id:member.toUpperCase(),status:'ABSENT'}]}])assert.equal((await submit(c)).status,400);
  assert.equal((await submit({...command(),meeting_date:'2099-01-01T00:00:00Z'})).status,409);
  assert.equal((await submit({...command(),items:[{user_id:member,status:'PRESENT'}]})).status,409);
  assert.equal((await submit({...command(),items:[{user_id:member,status:'PRESENT'},{user_id:foreign,status:'ABSENT'}]})).status,409);
  assert.equal((await pool.query('SELECT count(*)::int n FROM events')).rows[0].n,initialCount);
  const c=command(),responses=await Promise.all(Array.from({length:8},()=>submit(c)));assert(responses.every(r=>r.status===200));const acks=await Promise.all(responses.map(r=>r.json()));assert.equal(acks.filter(a=>!a.replayed).length,1);assert(acks.every(a=>a.count===2&&a.ownerId===president&&a.eventId===c.requestId&&a.fingerprint===acks[0].fingerprint));
  assert.equal((await pool.query('SELECT count(*)::int n FROM events')).rows[0].n,initialCount+1);assert.equal((await pool.query('SELECT count(*)::int n FROM event_attendance_verifications')).rows[0].n,2);
  assert.equal((await submit({...c,topic:'Changed intent'})).status,409);
  const read=()=>call('/events/attendance/submissions/'+c.requestId);
  assert.equal((await read()).headers.get('cache-control'),'private, no-store');assert.equal((await call('/events/attendance/submissions/'+c.requestId,foreign)).status,404);assert.equal((await call('/events/attendance/submissions/'+c.requestId,admin)).status,404);
  const correction={requestId:randomUUID(),status:'ABSENT',expectedStatus:'LATE',expectedVersion:1,reason:'Correction after review'};
  assert.equal((await call('/admin/events/'+c.requestId+'/attendance/'+member,admin,'PUT',correction)).status,200);
  assert.equal((await submit(c)).status,200);assert.equal((await (await read()).json()).fingerprint,acks[0].fingerprint);
  const snap=await (await call('/admin/events/'+c.requestId+'/attendance-snapshot',admin)).json();assert.equal(snap.history.length,3);assert.equal(snap.participants.find(p=>p.user_id===member).revision,2);
  assert.equal((await pool.query('SELECT performance_score FROM users WHERE id=$1',[member])).rows[0].performance_score,73);
  const counts=async()=>JSON.stringify((await pool.query('SELECT (SELECT count(*) FROM events) e,(SELECT count(*) FROM attendance) a,(SELECT count(*) FROM event_attendance_verifications) h')).rows);
  const before=await counts();await pool.query("CREATE FUNCTION fixture_batch_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Private fixture SQL secret'; END; $$; CREATE TRIGGER fixture_batch_failure BEFORE INSERT ON event_attendance_verifications FOR EACH ROW EXECUTE FUNCTION fixture_batch_failure()");
  const failure=await submit(command());assert.equal(failure.status,500);assert(!(await failure.text()).includes('Private fixture'));assert.equal(await counts(),before);await pool.query('DROP TRIGGER fixture_batch_failure ON event_attendance_verifications; DROP FUNCTION fixture_batch_failure()');
  await pool.query("UPDATE group_members SET status='INACTIVE' WHERE group_id=$1 AND user_id=$2",[group,president]);assert.equal((await submit(c)).status,403);assert.equal((await read()).status,403);await pool.query("UPDATE group_members SET status='ACTIVE' WHERE group_id=$1 AND user_id=$2",[group,president]);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[president]);await pool.query("UPDATE group_members SET role='MEMBER' WHERE user_id=$1",[president]);assert.equal((await submit(c)).status,403);await pool.query("UPDATE group_members SET role='PRESIDENT' WHERE user_id=$1",[president]);
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",'const BASE_URL = '+JSON.stringify(base+'/api')+';');const apiUrl='data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64');globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(president)}})};
  const source=readFileSync(path.join(root,'src/api/groupMeetingAttendance.ts'),'utf8').replace("from './api'",'from '+JSON.stringify(apiUrl));const {groupMeetingAttendanceApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(source)).toString('base64'));
  assert.equal((await groupMeetingAttendanceApi.reconcile(president,c)).eventId,c.requestId);await assert.rejects(groupMeetingAttendanceApi.reconcile(president,{...c,reason:'Different input'}));assert.equal((await groupMeetingAttendanceApi.save(president,c)).replayed,true);
  console.log('Group meeting attendance PASS: fresh24/repeat0/23upgrade; current group manager and foreign/revoked denial; strict full roster and explicit statuses; concurrent8 exactly one event; immutable initial history/correction/replay; lost ACK owner/fingerprint reconciliation; atomic failure redaction; scores unchanged; actual typed transport.');

}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(error.stack);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);


