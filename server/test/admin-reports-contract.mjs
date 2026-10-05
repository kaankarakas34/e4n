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
const container = `e4n-admin-report-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,13);
  assert.equal((await applyVersionedSchema()).applied.length,0);


  const ids=[randomUUID(),randomUUID(),randomUUID()];
  for(const [i,id] of ids.entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,created_at) VALUES($1,$2,$3,'Test','test',$4,now()-$5::int*interval '1 day')",[id,`admin-report-${i}@example.invalid`,`Fixture ${i}`,i===0?'ADMIN':'MEMBER',i===2?50:2]);
  const [admin,member,other]=ids;
  const group=randomUUID(),team=randomUUID();
  await pool.query("INSERT INTO groups(id,name,status) VALUES($1,'Active fixture','ACTIVE'),(gen_random_uuid(),'Draft fixture','DRAFT')",[group]);
  await pool.query("INSERT INTO power_teams(id,name,status) VALUES($1,'Active team','ACTIVE'),(gen_random_uuid(),'Draft team','DRAFT')",[team]);
  await pool.query("UPDATE users SET performance_score=NULL,performance_color=NULL WHERE id=$1",[other]);
  const referral=async(age,status,type,amount)=>pool.query("INSERT INTO referrals(giver_id,receiver_id,type,status,amount,created_at) VALUES($1,$2,$3,$4,$5,now()-$6::int*interval '1 day')",[member,other,type,status,amount,age]);
  await referral(2,'SUCCESSFUL','INTERNAL','10.10');await referral(3,'SUCCESSFUL','INTERNAL','20.20');await referral(4,'SUCCESSFUL','EXTERNAL',null);
  await referral(5,'SUCCESSFUL',null,'5.50');await referral(20,'PENDING','EXTERNAL','900.00');await referral(40,'SUCCESSFUL','EXTERNAL','4.40');
  await referral(-1,'SUCCESSFUL','INTERNAL','100');await referral(400,'SUCCESSFUL','INTERNAL','100');
  await pool.query("INSERT INTO one_to_ones(requester_id,partner_id,meeting_date,status) VALUES($1,$2,now()-interval '1 day','COMPLETED'),($1,$2,now()-interval '1 day','PENDING'),($1,$2,now()+interval '1 day','COMPLETED')",[member,other]);
  await pool.query("INSERT INTO visitors(inviter_id,name,visited_at,status) VALUES($1,'Attended',now()-interval '1 day','ATTENDED'),($1,'Joined',now()-interval '1 day','JOINED'),($1,'Invited',now()-interval '1 day','INVITED'),($1,'Future',now()+interval '1 day','JOINED')",[member]);
  const eventIds=[randomUUID(),randomUUID(),randomUUID()];
  for(const [i,id] of eventIds.entries())await pool.query("INSERT INTO events(id,title,created_by,start_at,type) VALUES($1,'Fixture',$2,now()+$3::int*interval '1 day','meeting')",[id,admin,[-2,1,-40][i]]);
  await pool.query("INSERT INTO attendance(user_id,event_id,status,created_at) VALUES($1,$2,'PRESENT',now()-interval '100 days'),($1,$3,'ABSENT',now()-interval '1 day'),($1,$4,'LATE',now()-interval '1 day')",[member,...eventIds]);
  const snapshot=async()=>JSON.stringify((await pool.query("SELECT (SELECT jsonb_agg(u ORDER BY id) FROM users u) AS users,(SELECT jsonb_agg(a ORDER BY id) FROM attendance a) AS attendance,(SELECT jsonb_agg(r ORDER BY id) FROM referrals r) AS referrals,(SELECT count(*) FROM user_score_history) AS history")).rows);
  const before=await snapshot();
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(query='',id=admin,role='ADMIN')=>fetch(`${base}/api/admin/reports${query}`,{headers:id?{Authorization:`Bearer ${token(id,role)}`}:{},signal:AbortSignal.timeout(10000)});
  assert.equal((await call('',null)).status,401);assert.equal((await call('',member,'MEMBER')).status,403);
  assert.equal((await call('',member,'ADMIN')).status,403);assert.equal((await call('',admin,'MEMBER')).status,403);assert.equal((await call('',randomUUID())).status,403);
  for(const q of ['?dateRange=bad','?dateRange=toString','?dateRange=7d&dateRange=30d','?userId='+member])assert.equal((await call(q)).status,400);
  const mod=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const compile=file=>ts.transpileModule(readFileSync(path.join(serverDir,'../',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const source=compile('src/api/api.ts').replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService={};').replaceAll('import.meta.env.PROD','false').replaceAll('http://localhost:4005/api',`${base}/api`);
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};
  globalThis.adminReportTransport=(await mod(source)).referralTransport;
  const {adminReportsApi}=await mod(compile('src/api/adminReports.ts').replace(/import \{ referralTransport \} from ['"]\.\/api['"];?/,'const referralTransport=globalThis.adminReportTransport;'));
  const r=await adminReportsApi.get(admin,'30d');
  writeFileSync(path.join(serverDir,'../output/admin-report-30d.json'),JSON.stringify(r));
  assert.deepEqual(r.stock,{accounts:3,active_groups:1,active_teams:1});
  assert.deepEqual(r.activity,{new_accounts:2,events:1,meetings:1,visitor_records:3,joined_visitors:1,attended_visitors:2});
  assert.deepEqual(r.volumes.total,{count:5,successful:4,missingAmounts:1,knownVolume:'35.80',volume:null});
  assert.equal(r.volumes.internal.volume,'30.30');assert.equal(r.volumes.external.volume,null);assert.equal(r.volumes.unclassified.volume,'5.50');
  assert.equal(r.monthly.reduce((n,m)=>n+m.referrals.count,0),5);assert.equal(r.monthly.reduce((n,m)=>n+m.newAccounts,0),2);
  const a=r.attendance.find(a=>a.id===member);assert.equal(a.present,1);assert.equal(a.absent,0);assert.equal(a.late,0);
  assert.equal(r.performance.find(p=>p.id===other).score,null);
  const week=await adminReportsApi.get(admin,'7d');
  writeFileSync(path.join(serverDir,'../output/admin-report-7d.json'),JSON.stringify(week));
  assert.equal(week.volumes.total.count,4);
  for(const range of ['90d','1y']){const report=await adminReportsApi.get(admin,range);assert.equal(report.volumes.total.count,6);assert.equal(report.attendance.find(a=>a.id===member).late,1);}
  await assert.rejects(adminReportsApi.get(member,'30d'));
  assert.equal((await call()).headers.get('cache-control'),'private, no-store');
  assert.equal(await snapshot(),before);
  const originalConnect=pool.connect.bind(pool);
  pool.connect=async()=>{
    const client=await originalConnect(),query=client.query.bind(client),release=client.release.bind(client);
    client.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('FROM attendance'))throw new Error('Isolated read failure');return query(sql,args);};
    client.release=()=>{client.query=query;client.release=release;release();};return client;
  };
  try{assert.equal((await call()).status,500);}finally{pool.connect=originalConnect;}
  assert.equal((await call()).status,200);assert.equal(await snapshot(),before);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call()).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  for(const table of ['attendance','referrals','one_to_ones','visitors','events','groups','power_teams'])await pool.query(`DELETE FROM ${table}`);
  await pool.query("UPDATE users SET created_at=now()-interval '500 days'");
  const empty=await adminReportsApi.get(admin,'30d');assert.equal(empty.volumes.total.volume,'0');assert.equal(empty.activity.new_accounts,0);assert.equal(empty.activity.visitor_records,0);assert.equal(empty.stock.active_groups,0);
  assert.ok(empty.monthly.every(m=>m.referrals.count===0&&m.newAccounts===0));assert.ok(empty.attendance.every(a=>a.present+a.absent+a.late+a.medical+a.substitute===0));
  console.log('Admin reports PASS: real web bearer/Express/isolated PG, DB ADMIN role/demotion, all ranges, exact decimals/missing/unclassified, UTC cohorts, event-date attendance, future/request exclusion, empty/no-GET-write/error+retry.');

}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Admin report contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
