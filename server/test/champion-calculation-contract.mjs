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
const container = `e4n-champion-job-${randomUUID().slice(0, 8)}`;
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





  const {runChampionCalculation}=await import('../src/cron/champion-calculation.js');
  const [alice,bob]=[randomUUID(),randomUUID()];
  for(const [i,id] of [alice,bob].entries())await pool.query("INSERT INTO users(id,email,name,profession,role) VALUES($1,$2,'Fixture','Fixture','MEMBER')",[id,`champion-${i}@example.invalid`]);
  for(const [id,amount,status,date] of [[alice,4,'SUCCESSFUL','2026-01-10'],[alice,6,'SUCCESSFUL','2026-01-11'],[bob,100,'SUCCESSFUL','2026-01-12'],[bob,1000,'PENDING','2026-01-13'],[alice,10000,'SUCCESSFUL','2025-12-01']])await pool.query('INSERT INTO referrals(giver_id,receiver_id,status,amount,created_at) VALUES($1,$2,$3,$4,$5)',[id,id===alice?bob:alice,status,amount,date]);
  for(const id of [alice,bob,bob,bob])await pool.query("INSERT INTO visitors(inviter_id,name,visited_at,status) VALUES($1,'Fixture','2026-01-15','INVITED')",[id]);
  const logs=[],args={periodType:'MONTH',startDate:'2026-01-01T00:00:00Z',endDate:'2026-01-31T23:59:59Z',runDate:'2026-01-31',log:r=>logs.push(r)};
  const runs=await Promise.all(Array.from({length:12},()=>runChampionCalculation(pool,args)));assert.equal(runs.reduce((n,r)=>n+r.inserted,0),3);assert.ok(runs.every(r=>['SUCCESS','SKIPPED','EXISTING'].includes(r.status)));
  const rows=(await pool.query("SELECT metric_type,user_id,value::text FROM champions WHERE period_type='MONTH' ORDER BY metric_type")).rows;
  assert.deepEqual(rows,[{metric_type:'REFERRAL_COUNT',user_id:alice,value:'2'},{metric_type:'REVENUE',user_id:bob,value:'100.00'},{metric_type:'VISITOR_COUNT',user_id:bob,value:'3'}]);
  assert.equal((await runChampionCalculation(pool,args)).status,'EXISTING');
  // Legacy partial results cannot prove their original input window. Preserve them explicitly.
  await pool.query("INSERT INTO champions(period_type,period_date,metric_type,user_id,value) VALUES('WEEK','2026-01-31','REFERRAL_COUNT',$1,9)",[bob]);
  const partial=await runChampionCalculation(pool,{...args,periodType:'WEEK'});assert.equal(partial.status,'EXISTING');assert.equal(partial.existing,1);assert.equal((await pool.query("SELECT count(*)::int AS count FROM champions WHERE period_type='WEEK'")).rows[0].count,1);
  const held=await pool.connect();await held.query('BEGIN');await held.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['champion:TERM:2026-01-31']);
  try{assert.equal((await runChampionCalculation(pool,{...args,periodType:'TERM'})).status,'SKIPPED');}finally{await held.query('ROLLBACK');held.release();}
  await pool.query("CREATE FUNCTION fixture_champion_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.metric_type='REVENUE' THEN RAISE EXCEPTION 'Synthetic private champion detail'; END IF; RETURN NEW; END; $$; CREATE TRIGGER fixture_champion_failure BEFORE INSERT ON champions FOR EACH ROW EXECUTE FUNCTION fixture_champion_failure()");
  try{await assert.rejects(runChampionCalculation(pool,{...args,periodType:'YEAR'}),e=>e.code==='P0001');assert.equal((await pool.query("SELECT count(*)::int AS count FROM champions WHERE period_type='YEAR'")).rows[0].count,0);assert.equal(logs.at(-1).status,'FAILED');assert.equal(logs.at(-1).errorCode,'P0001');assert.ok(!JSON.stringify(logs).includes('private champion detail'));}finally{await pool.query('DROP TRIGGER fixture_champion_failure ON champions; DROP FUNCTION fixture_champion_failure()');}
  assert.equal((await runChampionCalculation(pool,{...args,periodType:'YEAR'})).inserted,3);
  const empty=await runChampionCalculation(pool,{...args,startDate:'2024-01-01',endDate:'2024-01-31',runDate:'2024-01-31'});assert.equal(empty.inserted,0);
  await assert.rejects(runChampionCalculation(pool,{...args,periodType:'BAD'}),e=>e.code==='INVALID_WINDOW');
  await assert.rejects(runChampionCalculation(pool,{...args,startDate:'2027-01-01'}),e=>e.code==='INVALID_WINDOW');
  // A post-commit log transport failure must not roll back or manufacture a failed job.
  const logged=await runChampionCalculation(pool,{...args,periodType:'TERM',log:()=>{throw new Error('Synthetic log outage');}});assert.equal(logged.status,'SUCCESS');assert.equal(logged.inserted,3);
  const {default:nodemailer}=await import('nodemailer');nodemailer.createTransport=()=>({sendMail:async()=>{throw new Error('No test mail allowed');}});
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}/api`;
  assert.equal((await fetch(`${base}/champions`)).status,401);
  const response=await fetch(`${base}/champions`,{headers:{Authorization:`Bearer ${jwt.sign({id:alice,role:'MEMBER'},process.env.JWT_SECRET)}`}});assert.equal(response.status,200);const list=await response.json();assert.equal(list.filter(r=>r.period_type==='MONTH').length,3);assert.equal(list.find(r=>r.period_type==='MONTH'&&r.metric_type==='REVENUE').user_id,bob);
  console.log('Champion job PASS: PG17 original 3 metrics/single statement snapshot, 12 concurrent single batch, replay/legacy partial preservation, held lock skip, third metric failure full rollback/retry, empty/invalid inputs, log outage, actual champion web HTTP/anon boundary. No live writes/mail; original period rules unchanged.');
}
let code=0;try{await main();}catch(e){code=1;console.error(e.stack);}finally{if(appServer)await new Promise(r=>appServer.close(r));if(pool)await pool.end();if(containerStarted)docker(['stop','--time','3',container]);}process.exit(code);
