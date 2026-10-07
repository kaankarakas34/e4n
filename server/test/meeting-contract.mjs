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
const container = `e4n-meeting-contract-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,19);
  assert.equal((await applyVersionedSchema()).applied.length,0);
  const ids = [randomUUID(),randomUUID(),randomUUID()];
  for (const [i,id] of ids.entries()) await pool.query("INSERT INTO users (id,email,name,profession,password_hash,role) VALUES ($1,$2,$3,'Fixture','fixture-only','MEMBER')",[id,`meeting-${i}@example.invalid`,`Fixture ${i}`]);
  const meetingId=randomUUID();
  await pool.query("INSERT INTO one_to_ones (id,requester_id,partner_id,meeting_date,notes) VALUES ($1,$2,$3,'2026-10-05T10:00:00Z','Contract fixture')",[meetingId,ids[0],ids[1]]);
  const snapshot=async()=>(await pool.query('SELECT * FROM one_to_ones ORDER BY id')).rows;
  const before=await snapshot();
  const scoresBefore=(await pool.query('SELECT id,performance_score FROM users ORDER BY id')).rows;
  // Rehearse the already-versioned six-migration state with a preserved activity.
  await pool.query("DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check; ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK(status IN('ACTIVE','REQUESTED')); ALTER TABLE users DROP COLUMN group_title; DELETE FROM schema_migrations WHERE version='0015_group_membership_state'");
  await pool.query("ALTER TABLE groups DROP COLUMN meeting_time, DROP COLUMN meeting_link; DELETE FROM schema_migrations WHERE version='0014_group_meeting_settings'");
  await pool.query("DROP TABLE invoice_files; DELETE FROM schema_migrations WHERE version='0013_invoice_files'");
  await pool.query("DROP TABLE document_files,document_library; DELETE FROM schema_migrations WHERE version='0012_document_library'");
  await pool.query("DROP TABLE direct_messages; DELETE FROM schema_migrations WHERE version='0011_direct_messages'");
  await pool.query("DROP TABLE user_score_history; DELETE FROM schema_migrations WHERE version='0010_score_history'");
  await pool.query("DROP TABLE support_mutations; DELETE FROM schema_migrations WHERE version='0009_support_mutations'");
  await pool.query("DELETE FROM schema_migrations WHERE version='0008_payment_initiation'");
  await pool.query('ALTER TABLE payment_transactions DROP CONSTRAINT payment_request_key_unique, DROP CONSTRAINT payment_initiation_metadata_check, DROP COLUMN request_key, DROP COLUMN request_fingerprint, DROP COLUMN initiation_state');
  await pool.query("DELETE FROM schema_migrations WHERE version='0007_meeting_requests'");
  await pool.query('DROP TABLE one_to_one_requests'); await pool.query('ALTER TABLE one_to_ones DROP COLUMN updated_at');
  assert.deepEqual((await applyVersionedSchema()).applied,['0007_meeting_requests','0008_payment_initiation','0009_support_mutations','0010_score_history','0011_direct_messages','0012_document_library','0013_invoice_files','0014_group_meeting_settings','0015_group_membership_state','0016_group_capacity_invariant','0017_subscription_reminder_delivery','0018_web_job_runs','0019_shuffle_execution_history']);
  assert.equal((await applyVersionedSchema()).applied.length,0); assert.deepEqual(await snapshot(),before);
  const {default:app}=await import('../src/index.js');
  appServer=app.listen(0,'127.0.0.1'); await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=id=>jwt.sign({id,role:'MEMBER'},process.env.JWT_SECRET);
  const call=async(path,id,body,method=body?'POST':'GET')=>{
    const r=await fetch(`${base}/api${path}`,{method,headers:{...(id?{Authorization:`Bearer ${token(id)}`}:{ }),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
    const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data};
  };
  assert.equal((await call('/one-to-ones')).status,401);
  const outgoing=await call('/one-to-ones',ids[0]),incoming=await call('/one-to-ones',ids[1]);
  assert.equal(outgoing.status,200);assert.equal(incoming.status,200);assert.equal(outgoing.data[0].direction,'OUTGOING');assert.equal(incoming.data[0].direction,'INCOMING');
  assert.deepEqual((await call('/one-to-ones',ids[2])).data,[]);assert.equal(outgoing.data[0].status,'COMPLETED');
  assert.equal((await call(`/one-to-ones/${meetingId}/status`,ids[1],{status:'ACCEPTED'},'PUT')).status,409,'completed history cannot become an accepted request');
  let compiled=ts.transpileModule(readFileSync(path.join(serverDir,'../src/api/api.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  compiled=compiled.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService = {};').replaceAll('import.meta.env.PROD','false').replaceAll('http://localhost:4005/api',`${base}/api`);
  let loggedIn=ids[0];globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(loggedIn)}})};
  const {api}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  const requestId=randomUUID(),payload={requestId,senderId:ids[0],receiverId:ids[1],topic:'Request fixture',proposedTime:'2026-10-06T10:00:00Z'};
  assert.equal((await api.requestMeeting(payload)).status,'PENDING');
  await api.requestMeeting(payload);assert.equal((await pool.query('SELECT count(*)::int AS count FROM one_to_one_requests')).rows[0].count,1);
  assert.equal((await call('/one-to-ones/request',ids[0],{...payload,topic:'Different content'})).status,409);
  assert.equal((await call('/one-to-ones/request',ids[0],{...payload,requestId:randomUUID(),receiverId:ids[0]})).status,400);
  assert.equal((await call('/one-to-ones/request',ids[0],{...payload,requestId:randomUUID(),receiverId:randomUUID()})).status,404);
  assert.equal((await call('/one-to-ones/request',null,payload)).status,401);
  loggedIn=ids[1]; const mapped=await api.getMyMeetingRequests(ids[1]);assert.equal(mapped.find(r=>r.id===requestId).receiverId,ids[1]);assert.equal(mapped.find(r=>r.id===requestId).senderName,'Fixture 0');
  assert.equal((await call(`/one-to-ones/${requestId}/status`,ids[0],{status:'ACCEPTED'},'PUT')).status,404);
  assert.equal((await call(`/one-to-ones/${requestId}/status`,ids[2],{status:'ACCEPTED'},'PUT')).status,404);
  assert.equal((await call(`/one-to-ones/${requestId}/status`,ids[1],{status:'COMPLETED'},'PUT')).status,400);
  assert.equal((await api.updateMeetingStatus(requestId,'ACCEPTED')).data.status,'ACCEPTED');
  await api.updateMeetingStatus(requestId,'ACCEPTED');
  assert.equal((await call(`/one-to-ones/${requestId}/status`,ids[1],{status:'REJECTED'},'PUT')).status,409);
  const racingId=randomUUID();loggedIn=ids[0];await api.requestMeeting({...payload,requestId:racingId});
  const race=await Promise.all(['ACCEPTED','REJECTED'].map(status=>call(`/one-to-ones/${racingId}/status`,ids[1],{status},'PUT')));
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
  const decided=(await pool.query('SELECT status,updated_at FROM one_to_one_requests WHERE id=$1',[racingId])).rows[0];assert.ok(decided.updated_at);assert.ok(['ACCEPTED','REJECTED'].includes(decided.status));
  const legacyPending=randomUUID();await pool.query("INSERT INTO one_to_ones(id,requester_id,partner_id,meeting_date,status) VALUES($1,$2,$3,NOW(),'PENDING')",[legacyPending,ids[0],ids[1]]);
  assert.equal((await call(`/one-to-ones/${legacyPending}/status`,ids[1],{status:'REJECTED'},'PUT')).status,200);
  await pool.query('DELETE FROM one_to_ones WHERE id=$1',[legacyPending]);
  const originalQuery=pool.query.bind(pool);
  try {
    pool.query=(sql,...args)=>typeof sql==='string'&&sql.includes('UNION ALL')&&sql.includes('one_to_one_requests')?Promise.reject(new Error('isolated meeting read failure')):originalQuery(sql,...args);
    loggedIn=ids[1];assert.equal((await call('/one-to-ones',ids[1])).status,500);
    await assert.rejects(api.getMyMeetingRequests(ids[1]),/isolated meeting read failure/);
  }finally{pool.query=originalQuery;}
  assert.deepEqual(await snapshot(),before);assert.deepEqual((await pool.query('SELECT id,performance_score FROM users ORDER BY id')).rows,scoresBefore);
  const activityId=randomUUID(),activity={requestId:activityId,partnerId:ids[1],meetingDate:new Date().toISOString(),notes:'Completed fixture'};
  const histories=async()=>(await pool.query('SELECT count(*)::int AS count FROM user_score_history')).rows[0].count;
  const historyBefore=await histories();
  const duplicate=await Promise.all([call('/one-to-ones',ids[0],activity),call('/one-to-ones',ids[0],activity)]);
  assert.deepEqual(duplicate.map(r=>r.status).sort(),[200,201]);assert.equal(await histories(),historyBefore+1);
  loggedIn=ids[0];assert.equal((await api.logCompletedMeeting({...activity,senderId:ids[0]})).id,activityId);assert.equal(await histories(),historyBefore+1);
  assert.equal((await call(`/calendar?userId=${ids[1]}`,ids[0])).status,403);
  assert.equal((await call('/calendar')).status,401);
  assert.ok((await api.getCalendar(ids[0])).some(row=>row.id===activityId));
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM one_to_ones WHERE id=$1',[activityId])).rows[0].count,1);
  assert.equal((await call('/one-to-ones',ids[0],{...activity,notes:'Different'})).status,409);
  assert.equal((await call('/one-to-ones',ids[2],activity)).status,409);
  for(const fields of [{partnerId:ids[0]},{meetingDate:'bad'},{meetingDate:'2026-02-30T10:00:00Z'},{requestId:'bad'},{notes:null}])assert.equal((await call('/one-to-ones',ids[0],{...activity,...fields})).status,400);
  assert.equal((await call('/one-to-ones',ids[0],{...activity,partnerId:randomUUID()})).status,404);
  assert.equal((await call('/one-to-ones',null,activity)).status,401);
  assert.equal((await call('/one-to-ones',ids[0],{...activity,requestId})).status,409,'a request key cannot become an activity');
  const failId=randomUUID(),atomicBefore=await snapshot(),usersBefore=(await pool.query('SELECT id,performance_score,performance_color FROM users ORDER BY id')).rows;
  await pool.query("CREATE FUNCTION fixture_score_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'isolated history failure'; END $$; CREATE TRIGGER fixture_score_failure BEFORE INSERT ON user_score_history FOR EACH ROW EXECUTE FUNCTION fixture_score_failure()");
  try {assert.equal((await call('/one-to-ones',ids[0],{...activity,requestId:failId})).status,500);}
  finally {await pool.query('DROP TRIGGER fixture_score_failure ON user_score_history; DROP FUNCTION fixture_score_failure()');}
  assert.deepEqual(await snapshot(),atomicBefore);assert.deepEqual((await pool.query('SELECT id,performance_score,performance_color FROM users ORDER BY id')).rows,usersBefore);assert.equal(await histories(),historyBefore+1);
  assert.equal((await call('/one-to-ones',ids[0],{...activity,requestId:failId})).status,201);
  const parallel=await Promise.all(Array.from({length:3},()=>call('/one-to-ones',ids[0],{...activity,requestId:randomUUID()})));
  assert.ok(parallel.every(r=>r.status===201));assert.equal(await histories(),historyBefore+5);
  const completed=(await snapshot()).filter(row=>row.requester_id===ids[0]);
  assert.equal((await pool.query('SELECT performance_score FROM users WHERE id=$1',[ids[0]])).rows[0].performance_score,Math.min(completed.length*10,100));
  assert.equal((await pool.query('SELECT performance_score FROM users WHERE id=$1',[ids[1]])).rows[0].performance_score,scoresBefore.find(row=>row.id===ids[1]).performance_score);
  loggedIn=ids[0];assert.ok((await api.getOneToOnes(ids[0])).every(row=>row.record_kind==='ACTIVITY'&&row.status==='COMPLETED'));
  assert.equal((await api.getOneToOnes(ids[0])).length,completed.length);
  if(process.argv[2]) {
    // Actual mobile client/service use only this disposable loopback server and fixture tokens.
    const mobileRoot=path.resolve(process.argv[2]);
    const compile=file=>ts.transpileModule(readFileSync(path.join(mobileRoot,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    const transport=compile('utils/api-client.ts').replace(/import \{ API_CONFIG \} from ['"]@\/constants\/api['"];?/,`const API_CONFIG={BASE_URL:${JSON.stringify(`${base}/api`)}};`)
      .replace(/import \{ SecureStorage \} from ['"]\.\/secure-storage['"];?/,'const SecureStorage={getToken:async()=>globalThis.meetingsToken()};');
    globalThis.meetingsToken=()=>token(loggedIn);
    const {apiClient}=await import(`data:text/javascript;base64,${Buffer.from(transport).toString('base64')}`);globalThis.meetingsClient=apiClient;
    const service=compile('utils/meetings-api.ts').replace(/import \{ apiClient \} from ['"]\.\/api-client['"];?/,'const apiClient=globalThis.meetingsClient;');
    const {meetingsApi:mobile}=await import(`data:text/javascript;base64,${Buffer.from(service).toString('base64')}`);
    loggedIn=ids[0];const mobileId=randomUUID(),schedule='2026-10-07T11:30:00Z';
    assert.equal((await mobile.people(ids[0])).some(person=>person.id===ids[0]),false);
    assert.equal((await mobile.request(ids[0],ids[1],'Mobile meeting',schedule,mobileId)).status,'PENDING');
    await mobile.request(ids[0],ids[1],'Mobile meeting',schedule,mobileId);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM one_to_one_requests WHERE id=$1',[mobileId])).rows[0].count,1);
    await assert.rejects(mobile.request(ids[0],ids[1],'Changed content',schedule,mobileId));
    assert.equal((await mobile.list(ids[0])).find(row=>row.id===mobileId).record_kind,'REQUEST');
    assert.equal((await mobile.list(ids[0])).find(row=>row.id===meetingId).record_kind,'ACTIVITY');
    await assert.rejects(mobile.decide(ids[0],mobileId,'ACCEPTED'));
    loggedIn=ids[2];assert.deepEqual(await mobile.list(ids[2]),[]);await assert.rejects(mobile.decide(ids[2],mobileId,'ACCEPTED'));
    loggedIn=ids[1];assert.equal((await mobile.decide(ids[1],mobileId,'ACCEPTED')).status,'ACCEPTED');
    await mobile.decide(ids[1],mobileId,'ACCEPTED');await assert.rejects(mobile.decide(ids[1],mobileId,'REJECTED'));
    assert.equal((await mobile.list(ids[1])).find(row=>row.id===mobileId).status,'ACCEPTED');
    loggedIn=ids[0];const logId=randomUUID(),historyCount=await histories();
    assert.equal((await mobile.log(ids[0],ids[1],'Mobile activity',schedule,logId)).status,'COMPLETED');
    await mobile.log(ids[0],ids[1],'Mobile activity',schedule,logId);assert.equal(await histories(),historyCount+1);
    assert.equal((await mobile.list(ids[0])).find(row=>row.id===logId).record_kind,'ACTIVITY');
    await assert.rejects(mobile.log(ids[0],ids[1],'Changed',schedule,logId));
    console.log('Actual mobile transport/service → isolated HTTP/PG: users/self exclusion, request replay, recipient decision, foreign rejection and activity/request separation passed.');
  }
  assert.deepEqual((await snapshot()).find(row=>row.id===meetingId),before[0]);
  console.log('Completed activity: concurrent keyed replay/one history, strict owner/field/conflict boundaries, activity+score+history rollback, requester concurrency and existing formula preserved.');
  console.log(JSON.stringify({isolated:true,migrations:13,existingUpgrade:true,legacyRowsAndScoresPreserved:true,createAndSameKeyRetry:true,recipientOnly:true,atomicOppositeRace:race.map(r=>r.status),readErrorsReject:true},null,2));

}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Meeting contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
