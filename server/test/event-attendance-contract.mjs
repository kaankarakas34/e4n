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
const container = `e4n-event-attendance-${randomUUID().slice(0, 8)}`;
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




  const [admin,member,president,deleted,event,future,education,cancelled]=Array.from({length:8},()=>randomUUID());
  for(const [id,role]of [[admin,'ADMIN'],[member,'MEMBER'],[president,'PRESIDENT']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,performance_score) VALUES($1,$2,$3,'Fixture','x',$3,73)",[id,id+'@example.invalid',role]);
  for(const [id,start,type,status]of [[event,'2020-01-01','meeting','COMPLETED'],[future,'2099-01-01','meeting','PUBLISHED'],[education,'2020-01-01','education','COMPLETED'],[cancelled,'2020-01-01','meeting','CANCELLED']])await pool.query("INSERT INTO events(id,title,start_at,type,status,is_public,created_by) VALUES($1,'Attendance Fixture',$2,$3,$4,true,$5)",[id,start,type,status,admin]);
  for(const id of [event,future,education,cancelled])await pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'REGISTERED'),($1,$3,'PRESENT')",[id,member,president]);
  const oldRows=JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows);
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'");
  await pool.query("CREATE ROLE anon; CREATE ROLE authenticated; ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated; ALTER DEFAULT PRIVILEGES GRANT ALL ON FUNCTIONS TO anon,authenticated");
  assert.deepEqual((await applyVersionedSchema()).applied,['0022_event_attendance_verification','0023_self_profile_fields']);assert.equal((await applyVersionedSchema()).applied.length,0);assert.equal(JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows),oldRows);
  assert.equal((await pool.query('SELECT count(*)::int n FROM event_attendance_verifications')).rows[0].n,0);
  const {default:nodemailer}=await import('nodemailer');nodemailer.createTransport=()=>({sendMail:async()=>{throw Error('No mail allowed');}});
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const token=id=>jwt.sign({id,role:'ADMIN'},process.env.JWT_SECRET,{expiresIn:'1h'});
  const call=(path,actor=admin,method='GET',body)=>fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',...(actor?{Authorization:'Bearer '+token(actor)}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const read=()=>call('/admin/events/'+event+'/attendance-snapshot');
  const command=(overrides={})=>({requestId:randomUUID(),status:'PRESENT',expectedStatus:'REGISTERED',expectedVersion:0,reason:'Observed participant at event',...overrides});
  const write=(b,actor=admin,target=event,user=member)=>call('/admin/events/'+target+'/attendance/'+user,actor,'PUT',b);
  for(const actor of [null,deleted,member,president])assert.equal((await call('/admin/events/'+event+'/attendance-snapshot',actor)).status,actor===null||actor===deleted?401:403);
  for(const actor of [null,deleted,member,president])assert.equal((await write(command(),actor)).status,actor===null||actor===deleted?401:403);
  assert.equal((await call('/admin/events/'+event+'/attendance-snapshot?userId='+member)).status,400);
  const before=await (await read()).json();assert.equal(before.history.length,0);assert(before.participants.every(p=>p.revision===0&&p.verified_at===null));
  for(const b of [command({reason:''}),command({status:'PAID'}),command({expectedVersion:-1}),{...command(),actor_id:admin}])assert.equal((await write(b)).status,400);
  for(const id of [future,education,cancelled])assert.equal((await write(command(),admin,id)).status,409);
  assert.equal((await write(command(),admin,event,randomUUID())).status,404);
  const c=command();const concurrent=await Promise.all(Array.from({length:8},()=>write(c)));assert(concurrent.every(r=>r.status===200));const acks=await Promise.all(concurrent.map(r=>r.json()));assert.equal(acks.filter(r=>!r.replayed).length,1);
  let snap=await (await read()).json();assert.equal(snap.history.length,1);assert.equal(snap.participants.find(p=>p.user_id===member).revision,1);assert(snap.participants.find(p=>p.user_id===member).verified_at);assert.equal(snap.participants.find(p=>p.user_id===president).verified_at,null);
  assert.equal((await write(c)).status,200);assert.equal((await write({...c,status:'ABSENT'})).status,409);assert.equal((await write(command())).status,409);
  const correction=command({status:'ABSENT',expectedStatus:'PRESENT',expectedVersion:1,reason:'Correction after reviewing attendance'});assert.equal((await write(correction)).status,200);
  assert.equal((await write(command({status:'REGISTERED',expectedStatus:'ABSENT',expectedVersion:2,reason:'Retract unsupported observation'}))).status,200);
  snap=await (await read()).json();assert.equal(snap.history.length,3);assert.equal(snap.participants.find(p=>p.user_id===member).status,'REGISTERED');assert.equal((await pool.query('SELECT performance_score FROM users WHERE id=$1',[member])).rows[0].performance_score,73);
  for(const sql of ["UPDATE event_attendance_verifications SET reason='tamper'","DELETE FROM event_attendance_verifications","TRUNCATE event_attendance_verifications"])await assert.rejects(pool.query(sql),e=>e.code==='23514');
  const acl=(await pool.query("SELECT relrowsecurity FROM pg_class WHERE oid='event_attendance_verifications'::regclass")).rows[0];assert.equal(acl.relrowsecurity,true);
  for(const role of ['anon','authenticated']){assert.equal((await pool.query("SELECT has_table_privilege($1,'event_attendance_verifications','SELECT') allowed",[role])).rows[0].allowed,false);assert.equal((await pool.query("SELECT has_function_privilege($1,'e4n_preserve_attendance_verifications()','EXECUTE') allowed",[role])).rows[0].allowed,false);}
  const stable=JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows);
  await pool.query("CREATE FUNCTION fixture_verification_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fixture failure'; END; $$; CREATE TRIGGER fixture_verification_fail BEFORE INSERT ON event_attendance_verifications FOR EACH ROW EXECUTE FUNCTION fixture_verification_fail()");
  try{assert.equal((await write(command({expectedStatus:'REGISTERED',expectedVersion:3}))).status,500);}finally{await pool.query('DROP TRIGGER fixture_verification_fail ON event_attendance_verifications; DROP FUNCTION fixture_verification_fail()');}
  assert.equal(JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows),stable);
  await pool.query('ALTER TABLE event_attendance_verifications RENAME TO fixture_hidden_verifications');
  try{assert.equal((await write(command({expectedStatus:'REGISTERED',expectedVersion:3}))).status,500);assert.equal((await read()).status,500);}finally{await pool.query('ALTER TABLE fixture_hidden_verifications RENAME TO event_attendance_verifications');}
  assert.equal(JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows),stable);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await read()).status,403);assert.equal((await write(command())).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const root=path.join(serverDir,'..');const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",'const BASE_URL = '+JSON.stringify(base+'/api')+';');
  const apiUrl='data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64');
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};
  const source=readFileSync(path.join(root,'src/api/eventAttendance.ts'),'utf8').replace("from './api'",'from '+JSON.stringify(apiUrl));
  const {eventAttendanceApi,validAttendanceSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(compile(source)).toString('base64'));
  snap=await eventAttendanceApi.read(admin,event);assert(validAttendanceSnapshot(snap,admin,event));assert(!validAttendanceSnapshot({...snap,ownerId:member},admin,event));assert(!validAttendanceSnapshot({...snap,participants:[{...snap.participants[0],revision:-1}]},admin,event));
  const final=command({expectedStatus:'REGISTERED',expectedVersion:3,reason:'Observed after correction review'});assert.equal((await eventAttendanceApi.save(admin,event,member,final)).revision,4);assert.equal((await eventAttendanceApi.read(admin,event)).history.length,4);
  console.log('Event attendance PASS: fresh23/repeat0/21upgrade without legacy rewrite; private current-role read/write; stale/concurrent8/replay/collision; explicit observe/correct/retract; atomic outage rollback; immutable/RLS; real typed owner DTO; registration counts and cached scores unchanged; no mail/payment.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Event attendance contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
