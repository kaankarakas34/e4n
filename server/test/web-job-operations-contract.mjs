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
const container = `e4n-web-jobs-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,25);
  assert.equal((await applyVersionedSchema()).applied.length,0);










  const {runAuditedWebJob}=await import('../src/web-job-operations.js');
  await pool.query("CREATE ROLE anon; CREATE ROLE authenticated; ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated");
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0025_membership_operation_context'; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'");assert.deepEqual((await applyVersionedSchema()).applied,['0018_web_job_runs','0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields','0024_group_meeting_attendance','0025_membership_operation_context']);assert.equal((await applyVersionedSchema()).applied.length,0);
  for(const role of ['anon','authenticated'])assert.equal((await pool.query("SELECT has_table_privilege($1,'web_job_runs','SELECT') OR has_table_privilege($1,'web_job_runs','INSERT') AS allowed",[role])).rows[0].allowed,false);
  assert.equal((await pool.query("SELECT relrowsecurity FROM pg_class WHERE oid='web_job_runs'::regclass")).rows[0].relrowsecurity,true);
  const [admin,member,deleted,event]=Array.from({length:4},()=>randomUUID());
  for(const [id,role]of [[admin,'ADMIN'],[member,'MEMBER']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,account_status) VALUES($1,$2,'Fixture','Fixture','x',$3,'ACTIVE')",[id,id+'@example.invalid',role]);
  await pool.query("INSERT INTO events(id,title,start_at,status,is_public,type,created_by) VALUES($1,'Past fixture',now()-interval '2 days','PUBLISHED',true,'social',$2)",[event,admin]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const token=id=>jwt.sign({id,role:'ADMIN'},process.env.JWT_SECRET);
  const get=(id=admin,q='')=>fetch(base+'/api/admin/web-jobs'+q,{headers:id?{Authorization:'Bearer '+token(id)}:{}});
  const post=(id=admin,job='event-completion',body={})=>fetch(base+'/api/admin/web-jobs/'+job+'/run',{method:'POST',headers:{Authorization:'Bearer '+token(id),'Content-Type':'application/json'},body:JSON.stringify(body)});
  const cron=(header='',job='event-completion',q='',method='GET')=>fetch(base+'/api/cron/web-jobs/'+job+q,{method,headers:{Authorization:header}});
  delete process.env.WEB_JOB_INVOCATION_ENABLED;delete process.env.CRON_SECRET;
  assert.equal((await cron()).status,503);assert.equal((await post()).status,503);
  const initial=await get();assert.equal(initial.status,200);assert.match(initial.headers.get('cache-control'),/private.*no-store/);let snapshot=await initial.json();assert.equal(snapshot.runs.length,0);assert.equal(snapshot.invocationEnabled,false);
  assert.equal((await get(null)).status,401);assert.equal((await get(deleted)).status,401);assert.equal((await get(member)).status,403);assert.equal((await post(member)).status,403);assert.equal((await get(admin,'?owner='+member)).status,400);
  process.env.WEB_JOB_INVOCATION_ENABLED='true';process.env.CRON_SECRET='fixture_external_secret_only_32chars_min';
  assert.equal((await cron()).status,401);assert.equal((await cron('Bearer wrong')).status,401);assert.equal((await cron('Bearer '+process.env.CRON_SECRET,'champion-calculation')).status,400);assert.equal((await cron('Bearer '+process.env.CRON_SECRET,'event-completion','?now=2020')).status,400);assert.equal((await cron('Bearer '+process.env.CRON_SECRET,'event-completion','','HEAD')).status,400);
  assert.equal((await post(admin,'event-completion',{now:'2020'})).status,400);
  const external=await cron('Bearer '+process.env.CRON_SECRET);assert.equal(external.status,200);const result=await external.json();assert.equal(result.state,'SUCCESS');assert.equal(result.summary.changed,1);assert.equal((await pool.query('SELECT status FROM events WHERE id=$1',[event])).rows[0].status,'COMPLETED');
  const manual=await post();assert.equal(manual.status,200);assert.equal((await manual.json()).summary.changed,0);
  snapshot=await(await get()).json();assert.equal(snapshot.runs.length,2);assert.deepEqual(new Set(snapshot.runs.map(r=>r.source)),new Set(['ADMIN','EXTERNAL']));assert.equal(snapshot.externalConfigured,true);assert.ok(!JSON.stringify(snapshot).includes(process.env.CRON_SECRET));assert.ok(!JSON.stringify(snapshot).includes('@example.invalid'));
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await get()).status,403);assert.equal((await post()).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  let finish,start;const running=new Promise(r=>start=r),hold=new Promise(r=>finish=r);
  const first=runAuditedWebJob(pool,{job:'event-completion',execute:async()=>{start();await hold;return{status:'SUCCESS',changed:0,secret:'DO_NOT_KEEP'};}});await running;
  const skipped=await runAuditedWebJob(pool,{job:'event-completion',execute:async()=>{throw Error('must not run');}});assert.equal(skipped.state,'SKIPPED');finish();assert.equal((await first).state,'SUCCESS');
  const failed=await runAuditedWebJob(pool,{job:'event-completion',execute:async()=>{throw Object.assign(Error('private credential value'),{code:'TEST_FAILURE'});}});assert.equal(failed.state,'UNKNOWN');assert.equal(failed.errorCode,'TEST_FAILURE');
  const original=pool.connect.bind(pool);let calls=0;
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.startsWith('INSERT INTO web_job_runs'))throw Error('history insert outage');return q(sql,args);};c.release=(discard)=>{c.query=q;c.release=release;release(discard);};return c;};
  await assert.rejects(runAuditedWebJob(pool,{job:'event-completion',execute:async()=>{calls++;return{status:'SUCCESS'};}}));assert.equal(calls,0);pool.connect=original;
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.startsWith('UPDATE web_job_runs'))throw Error('history finalize outage');return q(sql,args);};c.release=(discard)=>{c.query=q;c.release=release;release(discard);};return c;};
  const unknown=await runAuditedWebJob(pool,{job:'event-completion',execute:async()=>({status:'SUCCESS',changed:1})});assert.equal(unknown.state,'UNKNOWN');pool.connect=original;assert.equal((await pool.query('SELECT state FROM web_job_runs WHERE id=$1',[unknown.id])).rows[0].state,'RUNNING');
  const recovered=await runAuditedWebJob(pool,{job:'event-completion',execute:async()=>({status:'SUCCESS',changed:0})});assert.equal(recovered.state,'SUCCESS');
  let mailCount=0;await pool.query("UPDATE users SET subscription_end_date=now()+interval '3 days' WHERE id=$1",[member]);
  const reminder=await runAuditedWebJob(pool,{job:'subscription-reminders',sendMail:async()=>{mailCount++;return{success:true};}});assert.equal(reminder.summary.claimed,1);assert.equal(mailCount,1);assert.equal((await runAuditedWebJob(pool,{job:'subscription-reminders',sendMail:async()=>{mailCount++;return{success:true};}})).summary.claimed,0);assert.equal(mailCount,1);
  const champion=await runAuditedWebJob(pool,{job:'champion-calculation',championOptions:{periodType:'MONTH',startDate:'2026-10-01T00:00:00Z',endDate:'2026-10-07T00:00:00Z'}});assert.equal(champion.state,'SUCCESS');
  const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const transport='data:text/javascript;base64,'+Buffer.from('export const referralTransport={get:async()=>('+JSON.stringify(await(await get()).json())+')};').toString('base64');
  const code=readFileSync(path.join(serverDir,'../src/api/webJobs.ts'),'utf8').replace("from './api'","from '"+transport+"'");const {webJobsApi,validJobHistory}=await import('data:text/javascript;base64,'+Buffer.from(compile(code)).toString('base64'));const history=await webJobsApi.read(admin);assert.ok(history.runs.some(r=>r.state==='RUNNING'));assert.equal(validJobHistory({...history,ownerId:member},admin),false);assert.equal(validJobHistory({...history,runs:[history.runs[0],history.runs[0]]},admin),false);assert.equal(validJobHistory({...history,runs:[null]},admin),false);assert.ok(!JSON.stringify(history).includes('DO_NOT_KEEP'));assert.ok(!JSON.stringify(history).includes('private credential'));
  console.log('Web jobs PASS: fresh25/repeat0/17upgrade; private ledger ACL/RLS; actual Express external secret/disabled/HEAD/query/body/current-role; event change+replay; persistent history/unknown crash states; concurrent skip; history insert fail prevents execution; finalization outage retains RUNNING; recovery unlock; reminder fake-mail once; existing champion; typed owner DTO.');
}
let exitCode=0;
try{await main();}catch(error){exitCode=1;console.error('Web job operations contract failed:',error);}
finally{if(appServer)await new Promise(resolve=>appServer.close(resolve));if(pool)await pool.end();if(containerStarted){try{docker(['stop','--time','3',container],{timeout:15000});}catch(error){exitCode=1;console.error(error.message);}}}process.exit(exitCode);
