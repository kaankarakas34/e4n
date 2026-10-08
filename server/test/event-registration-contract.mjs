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
const container = `e4n-event-registration-${randomUUID().slice(0, 8)}`;
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




  const [alice,bob,deleted] = Array.from({length:3},()=>randomUUID());
  for(const [i,id] of [alice,bob].entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$3,'Fixture','x','MEMBER')",[id,`event-${i}@example.invalid`,`Member ${i}`]);
  const [one,two]=[randomUUID(),randomUUID()];
  for(const [i,id] of [one,two].entries())await pool.query("INSERT INTO events(id,title,start_at,status,is_public,type,price,max_attendees,created_by) VALUES($1,$2,'2099-01-01','PUBLISHED',true,'meeting',0,50,$3)",[id,`Event ${i}`,alice]);
  await pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'ABSENT')",[one,alice]);
  // Rehearse the pre-0021 constraint upgrade with an existing actual legacy row.
  const legacyBefore=JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows);
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; ALTER TABLE attendance DROP CONSTRAINT attendance_status_check; ALTER TABLE attendance ADD CONSTRAINT attendance_status_check CHECK(status IN ('PRESENT','ABSENT','LATE','SUBSTITUTE','MEDICAL'))");
  assert.deepEqual((await applyVersionedSchema()).applied,['0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields']);
  assert.equal((await applyVersionedSchema()).applied.length,0);
  assert.equal(JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows),legacyBefore,'Constraint upgrade never rewrites legacy attendance');
  await assert.rejects(pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'INVALID')",[two,alice]),e=>e.code==='23514');
  let mails=0;const {default:nodemailer}=await import('nodemailer');nodemailer.createTransport=()=>({sendMail:async()=>{mails++;return{messageId:'isolated-fake'};}});
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,secret=process.env.JWT_SECRET)=>jwt.sign({id,role:'MEMBER'},secret);
  const call=(url,id=alice,method='GET')=>fetch(`${base}/api${url}`,{method,headers:{'Content-Type':'application/json',...(id?{Authorization:`Bearer ${token(id)}`}:{})},...(method==='POST'?{body:'{}'}:{}),signal:AbortSignal.timeout(10000)});
  const list=async(id=alice,suffix='')=>{const r=await call('/events'+suffix,id);assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);return r.json();};
  const before=JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows);
  const a=await list(), b=await list(bob), anon=await list(null), stale=await list(deleted);
  assert.equal(a.find(e=>e.id===one).is_registered,true);assert.equal(a.find(e=>e.id===two).is_registered,false);
  assert.equal(b.find(e=>e.id===one).is_registered,false);assert.equal(a.find(e=>e.id===one).attendees_count,1);
  for(const rows of [anon,stale])assert(rows.every(e=>e.is_registered===null));
  assert(a.every(e=>!Object.hasOwn(e,'attendees')));
  const invalid=await fetch(`${base}/api/events`,{headers:{Authorization:`Bearer ${token(alice,'wrong-secret')}`}});assert((await invalid.json()).every(e=>e.is_registered===null));
  const malformed=await list('not-a-uuid');assert(malformed.every(e=>e.is_registered===null));
  const spoof=await list(bob,`?userId=${alice}&limit=1&type=meeting`);assert.equal(spoof.length,1);assert.equal(spoof[0].is_registered,false);
  const group=randomUUID();await pool.query("INSERT INTO groups(id,name) VALUES($1,'Fixture Group')",[group]);await pool.query('UPDATE events SET group_id=$1 WHERE id=$2',[group,one]);assert.equal((await list(alice,`?group_id=${group}`)).length,1);
  const detail=async(id,event=one)=>{const r=await call(`/events/${event}`,id);assert.equal(r.status,200);return r.json();};
  assert.equal((await detail(alice)).is_registered,true);assert.equal((await detail(bob)).is_registered,false);assert.equal((await detail(null)).is_registered,null);assert.equal((await detail(deleted)).is_registered,null);
  assert.equal(JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows),before);
  // Real bearer/multipart-free TS API transport through Express, not a mock-only unit assertion.
  const root=path.join(serverDir,'..');const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(bob)}})};
  const {api}=await import('data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64'));
  assert.equal((await api.getPublicEvents()).find(e=>e.id===two).is_registered,false);
  await pool.query('UPDATE users SET performance_score=73 WHERE id=$1',[bob]);
  assert.equal((await api.registerForEvent(two)).success,true);
  assert.equal((await pool.query('SELECT status FROM attendance WHERE event_id=$1 AND user_id=$2',[two,bob])).rows[0].status,'REGISTERED');
  assert.equal((await pool.query('SELECT performance_score FROM users WHERE id=$1',[bob])).rows[0].performance_score,73,'Booking does not recalculate cached legacy performance');
  assert.equal((await api.getEvent(two)).is_registered,true);
  assert.equal((await api.getPublicEvents()).find(e=>e.id===two).is_registered,true);
  const mailAfterFirst=mails;assert.equal((await api.registerForEvent(two)).success,true);assert.equal(mails,mailAfterFirst);
  assert.equal((await pool.query('SELECT COUNT(*)::int count FROM attendance WHERE event_id=$1 AND user_id=$2',[two,bob])).rows[0].count,1);
  assert.equal((await detail(alice,two)).is_registered,false);

  // Atomic owner registration + tickets, strict server payment state, and existing FE serialisation.
  const [paidEvent,feEvent,rollbackEvent]=[randomUUID(),randomUUID(),randomUUID()];
  for(const [id,price,fe]of [[paidEvent,100,false],[feEvent,0,true],[rollbackEvent,100,false]])await pool.query("INSERT INTO events(id,title,start_at,status,is_public,type,price,generate_tickets,has_equal_opportunity_badge,created_by) VALUES($1,'Integrity Fixture','2099-01-01','PUBLISHED',true,'social',$2,true,$3,$4)",[id,price,fe,alice]);
  const post=(event,owner=bob,body={},query='')=>fetch(base+'/api/events/'+event+'/register'+query,{method:'POST',headers:{'Content-Type':'application/json',...(owner?{Authorization:'Bearer '+token(owner)}:{})},body:JSON.stringify(body)});
  assert.equal((await post(paidEvent,bob,{payment_status:'PAID'})).status,400);
  assert.equal((await post(paidEvent,bob,{user_id:alice})).status,400);
  assert.equal((await post(paidEvent,bob,{},'?owner='+alice)).status,400);
  assert.equal((await post(paidEvent,null)).status,401);assert.equal((await post(paidEvent,deleted)).status,401);
  assert.equal((await post('bad-id')).status,400);assert.equal((await post(randomUUID())).status,404);
  const concurrent=await Promise.all(Array.from({length:10},()=>post(paidEvent)));
  assert(concurrent.every(r=>r.status===200));const replies=await Promise.all(concurrent.map(r=>r.json()));
  assert.equal(replies.filter(r=>r.replayed===false).length,1);assert(replies.every(r=>r.ownerId===bob&&r.eventId===paidEvent&&r.ticket_payment_status==='PENDING'));
  assert.equal((await pool.query('SELECT count(*)::int n FROM attendance WHERE event_id=$1',[paidEvent])).rows[0].n,1);
  assert.deepEqual((await pool.query('SELECT payment_status FROM event_tickets WHERE event_id=$1',[paidEvent])).rows,[{payment_status:'PENDING'}]);
  assert.deepEqual((await pool.query('SELECT status FROM attendance WHERE event_id=$1',[paidEvent])).rows,[{status:'REGISTERED'}]);
  assert.equal((await detail(bob,paidEvent)).attendees_count,1,'Registration counter is preserved');
  const attendanceRows=await api.getMeetingAttendance(paidEvent);assert.equal(attendanceRows[0].status,'REGISTERED');
  const stats=await (await call('/reports/attendance-stats',bob)).json();const bobStats=stats.find(r=>r.id===bob);
  assert.equal(Number(bobStats.present),0);assert.equal(Number(bobStats.absent),0,'Unmarked booking is not an absence');
  const {runEventCompletion}=await import('../src/cron/event-completion.js');
  await pool.query("UPDATE events SET start_at='2000-01-01',end_at='2000-01-01' WHERE id=$1",[paidEvent]);
  await runEventCompletion(pool,{log:()=>{}});
  assert.equal((await pool.query('SELECT status FROM attendance WHERE event_id=$1',[paidEvent])).rows[0].status,'REGISTERED','Closing event does not infer attendance/no-show');
  assert.equal((await post(paidEvent)).status,200,'Closed event replay does not create another booking');
  for(const [filename,className]of [['performanceService.ts','PerformanceService'],['trafficLightService.ts','TrafficLightService']]){
    const source=readFileSync(path.join(root,'src/utils/services',filename),'utf8');
    const service=(await import('data:text/javascript;base64,'+Buffer.from(compile(source)).toString('base64')))[className];
    const baseline=[{status:'PRESENT'},{status:'ABSENT'},{status:'LATE'},{status:'SUBSTITUTE'}];
    const score=service.calculateAttendanceScore(baseline);
    assert.equal(service.calculateAttendanceScore([...baseline,...Array.from({length:12},()=>({status:'REGISTERED'}))]),score,'Bookings must not displace actual last four attendance records');
    assert.equal(service.calculateAttendanceScore([{status:'REGISTERED'}]),0);
  }
  assert.equal((await pool.query('SELECT status FROM attendance WHERE event_id=$1',[one])).rows[0].status,'ABSENT','Legacy rows remain untouched');
  assert.equal((await detail(bob,paidEvent)).ticket_payment_status,'PENDING');assert.equal((await detail(alice,paidEvent)).ticket_payment_status,null);assert.equal((await detail(null,paidEvent)).ticket_payment_status,null);
  const fe=await Promise.all([post(feEvent,alice),post(feEvent,bob)]);assert.deepEqual(fe.map(r=>r.status).sort(),[200,403]);assert.equal((await pool.query('SELECT count(*)::int n FROM attendance WHERE event_id=$1',[feEvent])).rows[0].n,1);
  await pool.query("CREATE FUNCTION fixture_ticket_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'isolated ticket failure'; END; $$; CREATE TRIGGER fixture_ticket_fail BEFORE INSERT ON event_tickets FOR EACH ROW EXECUTE FUNCTION fixture_ticket_fail()");
  try{assert.equal((await post(rollbackEvent)).status,500);}finally{await pool.query('DROP TRIGGER fixture_ticket_fail ON event_tickets; DROP FUNCTION fixture_ticket_fail()');}
  assert.equal((await pool.query('SELECT count(*)::int n FROM attendance WHERE event_id=$1',[rollbackEvent])).rows[0].n,0);
  assert.equal((await post(rollbackEvent)).status,200);
  const ack=await api.registerForEvent(paidEvent);assert.equal(ack.replayed,true);assert.equal(ack.ticket_payment_status,'PENDING');
  const originalFetch=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({...ack,eventId:one}),{status:200,headers:{'content-type':'application/json'}});
  try{await assert.rejects(api.registerForEvent(paidEvent),/yanıtı geçersiz/);}finally{globalThis.fetch=originalFetch;}
  writeFileSync(path.join(root,'output/event-integrity-browser.json'),JSON.stringify({owner:bob,other:alice,free:await detail(bob,rollbackEvent),paid:await detail(bob,paidEvent),ack,feStatus:fe.map(r=>r.status)}));
  console.log('Event ticket integrity PASS: concurrent10 one registration/ticket; body/payment spoof rejection; current owner/auth; FE race one winner; rollback/retry; owner ticket read; real TS saved/replay/invalid ACK.');

  const stable=JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows);
  const original=pool.query.bind(pool);pool.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('AS is_registered'))throw new Error('isolated list unavailable');return original(sql,args);};
  assert.equal((await call('/events',bob)).status,500);pool.query=original;assert.equal((await list(bob)).find(e=>e.id===two).is_registered,true);
  assert.equal(JSON.stringify((await pool.query('SELECT * FROM attendance ORDER BY id')).rows),stable);
  writeFileSync(path.join(root,'output/event-registration-browser.json'),JSON.stringify({owner:bob,other:alice,event:await detail(bob,two),list:await list(bob)}));
  console.log('Event registration PASS: fresh23/repeat0; own flag true/false/null, other/query spoof/deleted/invalid tokens, filters/cache, read no writes, actual TS transport register/read/replay one row/no repeated mail, failed list/recovery.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Event registration contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
