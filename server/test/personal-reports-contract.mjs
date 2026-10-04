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
const container = `e4n-report-contract-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,10);
  assert.equal((await applyVersionedSchema()).applied.length,0);

  const ids=[randomUUID(),randomUUID(),randomUUID(),randomUUID()];
  for(const [i,id] of ids.entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash) VALUES($1,$2,'Fixture','Test','test')",[id,`reports-${i}@example.invalid`]);
  const owner=ids[0],partner=ids[1];
  const referral=async(giver,receiver,age,status,amount)=>pool.query("INSERT INTO referrals(giver_id,receiver_id,type,status,amount,created_at) VALUES($1,$2,'INTERNAL',$3,$4,now()-$5::int*interval '1 day')",[giver,receiver,status,amount,age]);
  await referral(owner,partner,2,'SUCCESSFUL','10.10');await referral(owner,partner,3,'SUCCESSFUL','20.20');
  await referral(owner,partner,4,'SUCCESSFUL',null);await referral(partner,owner,20,'SUCCESSFUL','4.50');
  await referral(owner,partner,40,'PENDING',null);await referral(partner,ids[2],1,'SUCCESSFUL','999.99');
  await referral(owner,partner,-1,'SUCCESSFUL','100');await referral(owner,partner,400,'SUCCESSFUL','100');
  await pool.query("INSERT INTO one_to_ones(requester_id,partner_id,meeting_date,status) VALUES($1,$2,now()-interval '1 day','COMPLETED'),($2,$1,now()-interval '2 days','COMPLETED'),($1,$2,now()+interval '1 day','COMPLETED'),($1,$2,now()-interval '1 day','PENDING')",[owner,partner]);
  await pool.query("INSERT INTO visitors(inviter_id,name,visited_at,status) VALUES($1,'Attended',now()-interval '1 day','ATTENDED'),($1,'Invited',now()-interval '1 day','INVITED'),($2,'Foreign',now()-interval '1 day','JOINED')",[owner,partner]);
  await pool.query("INSERT INTO education(user_id,title,hours,completed_date) VALUES($1,'Education',1.5,now()-interval '1 day'),($2,'Other',9.0,now()-interval '1 day')",[owner,partner]);
  await pool.query("UPDATE users SET performance_score=NULL,performance_color=NULL WHERE id=$1",[owner]);
  const snapshot=async()=>JSON.stringify((await pool.query("SELECT (SELECT jsonb_agg(u) FROM users u) AS users,(SELECT jsonb_agg(h) FROM user_score_history h) AS history,(SELECT jsonb_agg(r) FROM referrals r) AS referrals")).rows);
  const before=await snapshot();
  const {default:app}=await import('../src/index.js');
  appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=id=>jwt.sign({id,role:'MEMBER'},process.env.JWT_SECRET);
  let currentOwner=owner;
  const mod=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const compile=file=>ts.transpileModule(readFileSync(path.join(serverDir,'../',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  let transport=compile('src/api/api.ts').replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService={};').replaceAll('import.meta.env.PROD','false').replaceAll('http://localhost:4005/api',`${base}/api`);
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(currentOwner)}})};
  globalThis.reportTransport=(await mod(transport)).referralTransport;
  const {personalReportsApi,validPersonalReport}=await mod(compile('src/api/personalReports.ts').replace(/import \{ referralTransport \} from ['"]\.\/api['"];?/,'const referralTransport=globalThis.reportTransport;'));
  const report=await personalReportsApi.get(owner,'30d');
  assert.deepEqual(report.referralsGiven,{count:3,successful:3,missingAmounts:1,knownVolume:'30.30',volume:null});
  assert.equal(report.referralsReceived.volume,'4.50');assert.equal(report.meetingsCompleted,2);assert.equal(report.visitorsHosted,1);assert.equal(report.educationHours,'1.5');assert.equal(report.performance.score,null);
  assert.equal((await personalReportsApi.get(owner,'7d')).referralsReceived.count,0);
  for(const range of ['90d','1y'])assert.equal((await personalReportsApi.get(owner,range)).referralsGiven.count,4);
  currentOwner=ids[2];const other=await personalReportsApi.get(ids[2],'30d');assert.equal(other.referralsGiven.count,0);assert.equal(other.referralsReceived.volume,'999.99');assert.equal(other.meetingsCompleted,0);
  await assert.rejects(personalReportsApi.get(owner,'30d'),/doğrulanamadı/);
  const call=async(query='',id=owner)=>fetch(`${base}/api/reports/me${query}`,{headers:id?{Authorization:`Bearer ${token(id)}`}:{},signal:AbortSignal.timeout(10000)});
  assert.equal((await call('',null)).status,401);assert.equal((await call('',randomUUID())).status,404);
  for(const query of ['?dateRange=bad','?userId='+partner,'?dateRange=7d&dateRange=30d','?dateRange=toString'])assert.equal((await call(query)).status,400);
  assert.equal((await call()).headers.get('cache-control'),'private, no-store');
  assert.equal(validPersonalReport({...report,referralsGiven:{...report.referralsGiven,knownVolume:'NaN'}},owner,'30d'),false);
  assert.equal(validPersonalReport({...report,meetingsCompleted:-1},owner,'30d'),false);
  currentOwner=ids[3];const empty=await personalReportsApi.get(ids[3],'30d');
  assert.equal(empty.referralsGiven.count,0);assert.equal(empty.referralsReceived.volume,'0');assert.equal(empty.educationHours,'0');
  assert.equal(await snapshot(),before);
  const originalConnect=pool.connect.bind(pool);
  pool.connect=async()=>{
    const client=await originalConnect(),query=client.query.bind(client);
    client.query=async(sql,args)=>{if(typeof sql==='string' && sql.includes('FROM education'))throw new Error('Isolated injected read failure');return query(sql,args);};
    const release=client.release.bind(client);client.release=()=>{client.query=query;client.release=release;release();};
    return client;
  };
  try {assert.equal((await call()).status,500);}finally{pool.connect=originalConnect;}
  assert.equal((await call()).status,200);
  assert.equal(await snapshot(),before);
  console.log('Personal reports PASS: actual web bearer/Express/PG, decimal sum, unknown amount/score, all ranges, future/foreign/request exclusions, owner/anonymous/invalid input, GET unchanged.');

}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Personal report contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
