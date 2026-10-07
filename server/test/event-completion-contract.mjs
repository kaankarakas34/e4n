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
const container = `e4n-event-job-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,17);
  assert.equal((await applyVersionedSchema()).applied.length,0);





  const {runEventCompletion,scheduleEventCompletion,eventCompletionLock}=await import('../src/cron/event-completion.js');
  const owner=randomUUID();await pool.query("INSERT INTO users(id,email,name,profession,role) VALUES($1,'job@example.invalid','Fixture','Fixture','MEMBER')",[owner]);
  const events=[];
  for(const [status,start,end] of [['PUBLISHED','2000-01-01',null],['PUBLISHED','2000-01-01','2000-01-02'],['PUBLISHED','2099-01-01',null],['PUBLISHED','2000-01-01','2099-01-01'],['DRAFT','2000-01-01',null],['CANCELLED','2000-01-01',null],['COMPLETED','2000-01-01',null]]){
    const id=randomUUID();events.push(id);await pool.query("INSERT INTO events(id,title,status,start_at,end_at,created_by,type) VALUES($1,'Job fixture',$2,$3,$4,$5,'social')",[id,status,start,end,owner]);
  }
  await pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'ABSENT')",[events[0],owner]);
  await pool.query("INSERT INTO event_tickets(event_id,user_id,ticket_number,payment_status) VALUES($1,$2,'JOB-PENDING','PENDING')",[events[0],owner]);
  const logs=[],options={log:r=>logs.push(r)};
  const before=(await pool.query('SELECT id,status FROM events ORDER BY id')).rows;
  const dry=await runEventCompletion(pool,{...options,dryRun:true});assert.equal(dry.eligible,2);assert.equal(dry.changed,0);assert.deepEqual((await pool.query('SELECT id,status FROM events ORDER BY id')).rows,before);
  const inspect=spawnSync(process.execPath,['src/cron/run-event-completion.js'],{cwd:serverDir,env:process.env,encoding:'utf8',windowsHide:true});assert.equal(inspect.status,0);assert.ok(inspect.stdout.includes('"eligible":2'));
  const unsafe=spawnSync(process.execPath,['src/cron/run-event-completion.js','--apply-isolated'],{cwd:serverDir,env:{...process.env,NODE_ENV:'production'},encoding:'utf8',windowsHide:true});assert.notEqual(unsafe.status,0);assert.ok(unsafe.stderr.includes('requires a test environment'));
  const lock=await pool.connect();await lock.query('BEGIN');await lock.query('SELECT pg_advisory_xact_lock($1,$2)',eventCompletionLock);
  try{const skipped=await runEventCompletion(pool,options);assert.equal(skipped.status,'SKIPPED');assert.equal(skipped.reason,'ALREADY_RUNNING');}finally{await lock.query('ROLLBACK');lock.release();}
  await pool.query("CREATE FUNCTION fixture_event_job_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic private detail'; END; $$; CREATE TRIGGER fixture_event_job_failure BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION fixture_event_job_failure()");
  try{await assert.rejects(runEventCompletion(pool,options),e=>e.code==='P0001');assert.equal(logs.at(-1).status,'FAILED');assert.equal(logs.at(-1).errorCode,'P0001');assert.ok(!JSON.stringify(logs).includes('private detail'));assert.deepEqual((await pool.query('SELECT id,status FROM events ORDER BY id')).rows,before);}finally{await pool.query('DROP TRIGGER fixture_event_job_failure ON events; DROP FUNCTION fixture_event_job_failure()');}
  const runs=await Promise.all(Array.from({length:10},()=>runEventCompletion(pool,options)));assert.equal(runs.reduce((n,r)=>n+r.changed,0),2);assert.equal((await runEventCompletion(pool,options)).changed,0);
  const statuses=(await pool.query('SELECT id,status FROM events')).rows;for(let i=0;i<events.length;i++)assert.equal(statuses.find(r=>r.id===events[i]).status,i<2?'COMPLETED':before.find(r=>r.id===events[i]).status);
  assert.equal((await pool.query('SELECT status FROM attendance WHERE event_id=$1',[events[0]])).rows[0].status,'ABSENT');assert.equal((await pool.query('SELECT payment_status FROM event_tickets WHERE event_id=$1',[events[0]])).rows[0].payment_status,'PENDING');
  const missed=randomUUID();await pool.query("INSERT INTO events(id,title,status,start_at,created_by,type) VALUES($1,'Missed tick fixture','PUBLISHED','1990-01-01',$2,'social')",[missed,owner]);
  let callback;const task={fixture:true};assert.equal(scheduleEventCompletion((expression,fn)=>{assert.equal(expression,'*/10 * * * *');callback=fn;return task;},pool,options),task);assert.equal((await callback()).changed,1);assert.equal((await callback()).changed,0);
  const applied=spawnSync(process.execPath,['src/cron/run-event-completion.js','--apply-isolated'],{cwd:serverDir,env:process.env,encoding:'utf8',windowsHide:true});assert.equal(applied.status,0);assert.ok(applied.stdout.includes('"changed":0'));
  const {default:nodemailer}=await import('nodemailer');nodemailer.createTransport=()=>({sendMail:async()=>{throw new Error('No test mail allowed');}});
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}/api`;
  const headers={Authorization:`Bearer ${jwt.sign({id:owner,role:'MEMBER'},process.env.JWT_SECRET)}`};
  const detail=await fetch(`${base}/events/${events[0]}`,{headers});assert.equal(detail.status,200);const dto=await detail.json();assert.equal(dto.status,'COMPLETED');assert.equal(dto.is_registered,true);assert.equal(dto.ticket_payment_status,'PENDING');assert.equal(dto.attendees_count,1);
  const list=await(await fetch(`${base}/events`,{headers})).json();assert.ok(!list.some(r=>r.id===events[0]));
  await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[owner]);
  const adminHeaders={Authorization:`Bearer ${jwt.sign({id:owner,role:'ADMIN'},process.env.JWT_SECRET)}`};
  const adminList=await(await fetch(`${base}/events?mode=admin`,{headers:adminHeaders})).json();assert.equal(adminList.find(r=>r.id===events[0]).status,'COMPLETED');
  console.log('Event job PASS: PG17 dry-run/isolated CLI, production apply denial, held lock skip, rollback/redacted failure, 10-run exactly two transitions/replay0, missed-tick catchup, actual schedule callback and web list/detail DTO; attendance/payment unchanged. No live writes/mail.');
}
let code=0;try{await main();}catch(e){code=1;console.error(e.stack);}finally{if(appServer)await new Promise(r=>appServer.close(r));if(pool)await pool.end();if(containerStarted)docker(['stop','--time','3',container]);}process.exit(code);
