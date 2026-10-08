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
const container = `e4n-referral-contract-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,21);
  assert.equal((await applyVersionedSchema()).applied.length,0);
  const ids = [randomUUID(),randomUUID(),randomUUID()];
  for (const [i,id] of ids.entries()) await pool.query("INSERT INTO users (id,email,name,profession,password_hash,role) VALUES ($1,$2,$3,'Fixture','fixture-only','MEMBER')",[id,`meeting-${i}@example.invalid`,`Fixture ${i}`]);
  const {default:app}=await import('../src/index.js');
  appServer=app.listen(0,'127.0.0.1'); await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=id=>jwt.sign({id,role:'MEMBER'},process.env.JWT_SECRET);
  const call=async(path,id,body,method=body?'POST':'GET')=>{
    const r=await fetch(`${base}/api${path}`,{method,headers:{...(id?{Authorization:`Bearer ${token(id)}`}:{ }),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
    const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data};
  };
  assert.equal((await call('/referrals')).status,401);
  const payload={requestId:randomUUID(),receiverId:ids[1],type:'INTERNAL',temperature:'HOT',description:'Contract referral'};
  const history=async()=>(await pool.query('SELECT count(*)::int AS n FROM user_score_history')).rows[0].n;
  const before=await history();
  const duplicate=await Promise.all([call('/referrals',ids[0],payload),call('/referrals',ids[0],payload)]);
  assert.deepEqual(duplicate.map(r=>r.status).sort(),[200,201]);assert.equal(await history(),before+1);
  const id=payload.requestId;
  assert.equal((await call('/referrals',ids[2],payload)).status,409);
  assert.equal((await call('/referrals',ids[0],{...payload,description:'Changed'})).status,409);
  for(const fields of [{receiverId:ids[0]},{receiverId:'bad'},{type:'WRONG'},{temperature:'WRONG'},{description:''},{amount:'NaN'},{amount:-1},{amount:1.001},{receiver_id:ids[2]}])
    assert.equal((await call('/referrals',ids[0],{...payload,...fields})).status,400);
  assert.equal((await call('/referrals',ids[0],{...payload,requestId:randomUUID(),receiverId:randomUUID()})).status,404);
  assert.deepEqual((await call('/referrals',ids[2])).data,[]);
  for(const owner of ids.slice(0,2)){const list=await call('/referrals',owner);assert.equal(list.data[0].id,id);assert.equal(list.data[0].giver_name,'Fixture 0');assert.equal(list.data[0].receiver_name,'Fixture 1');}
  assert.equal((await call(`/referrals/${id}`,ids[0],{status:'SUCCESSFUL',amount:100},'PUT')).status,404);
  assert.equal((await call(`/referrals/${id}`,ids[2],{status:'UNSUCCESSFUL'},'PUT')).status,404);
  for(const body of [{status:'PENDING'},{status:'SUCCESSFUL',amount:0},{status:'SUCCESSFUL',amount:'Infinity'},{status:'SUCCESSFUL',amount:1.001}])
    assert.equal((await call(`/referrals/${id}`,ids[1],body,'PUT')).status,400);
  const race=await Promise.all([call(`/referrals/${id}`,ids[1],{status:'SUCCESSFUL',amount:100.50},'PUT'),call(`/referrals/${id}`,ids[1],{status:'UNSUCCESSFUL'},'PUT')]);
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);assert.equal(await history(),before+2);
  const winner=race.find(r=>r.status===200).data;
  assert.equal((await call(`/referrals/${id}`,ids[1],{status:winner.status,...(winner.amount==null?{}:{amount:Number(winner.amount)})},'PUT')).status,200);
  assert.equal(await history(),before+2);
  const scoresBefore=(await pool.query('SELECT id,performance_score FROM users ORDER BY id')).rows;
  const raw=pool.connect.bind(pool);
  pool.connect=async()=>{const client=await raw(),query=client.query.bind(client);client.query=(sql,...args)=>typeof sql==='string'&&sql.includes('INSERT INTO user_score_history')?Promise.reject(new Error('isolated score failure')):query(sql,...args);const release=client.release.bind(client);client.release=(...args)=>{client.query=query;client.release=release;return release(...args);};return client;};
  const failureKey=randomUUID();
  // A pre-existing pending row must also survive a score failure during decision.
  await raw().then(async client=>{try{await client.query("INSERT INTO referrals(id,giver_id,receiver_id,type,temperature,status,description) VALUES($1,$2,$3,'INTERNAL','HOT','PENDING','Rollback fixture')",[failureKey,ids[0],ids[1]]);}finally{client.release();}});
  const failedCreate=randomUUID();
  try{
    assert.equal((await call('/referrals',ids[0],{...payload,requestId:failedCreate})).status,500);
    assert.equal((await call(`/referrals/${failureKey}`,ids[1],{status:'SUCCESSFUL',amount:10},'PUT')).status,500);
  }
  finally{pool.connect=raw;}
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM referrals WHERE id=$1',[failedCreate])).rows[0].n,0);
  assert.equal((await pool.query('SELECT status FROM referrals WHERE id=$1',[failureKey])).rows[0].status,'PENDING');
  assert.deepEqual((await pool.query('SELECT id,performance_score FROM users ORDER BY id')).rows,scoresBefore);
  await pool.query('DELETE FROM referrals WHERE id=$1',[failureKey]);assert.equal(await history(),before+2);
  // Exercise the actual mobile bearer transport and typed service against HTTP/PG.
  const webOnly=process.argv[2]==='--web-only';
  const mobile=webOnly?null:process.argv[2];if(!webOnly&&!mobile)throw new Error('Pass mobile root or --web-only');
  const compile=file=>ts.transpileModule(readFileSync(path.join(mobile,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  let owner=ids[0];globalThis.referralToken=()=>token(owner);
  if(!webOnly){
    const transport=await mod(compile('utils/api-client.ts').replace(/import \{ API_CONFIG \} from ['"]@\/constants\/api['"];?/,'const API_CONFIG={BASE_URL:'+JSON.stringify(base+'/api')+'};').replace(/import \{ SecureStorage \} from ['"]\.\/secure-storage['"];?/,'const SecureStorage={getToken:async()=>globalThis.referralToken()};'));
    globalThis.referralTransport=transport.apiClient;
  }
  // Both clients use the same domain source except the transport import.
  let webTransportSource=ts.transpileModule(readFileSync(path.join(serverDir,'../src/api/api.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  webTransportSource=webTransportSource.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService={};').replaceAll('import.meta.env.PROD','false').replaceAll('http://localhost:4005/api',`${base}/api`);
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(owner)}})};
  const webTransport=await mod(webTransportSource);
  globalThis.webReferralTransport=webTransport.referralTransport;
  const webService=await mod(ts.transpileModule(readFileSync(path.join(serverDir,'../src/api/referrals.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import \{ referralTransport as apiClient \} from ['"]\.\/api['"];?/,'const apiClient=globalThis.webReferralTransport;'));
  const {referralsApi}=webOnly?webService:await mod(compile('utils/referrals-api.ts').replace(/import \{ apiClient \} from ['"]\.\/api-client['"];?/,'const apiClient=globalThis.referralTransport;'));
  const group=randomUUID(),team=randomUUID();
  await pool.query("INSERT INTO groups(id,name,status) VALUES($1,'Referral fixture group','ACTIVE')",[group]);
  await pool.query("INSERT INTO power_teams(id,name,status) VALUES($1,'Referral fixture team','ACTIVE')",[team]);
  await pool.query("UPDATE users SET profession=id::text WHERE id=ANY($1::uuid[])",[ids]);
  for(const member of ids.slice(0,2)){
    await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE')",[member,group]);
    await pool.query("INSERT INTO power_team_members(user_id,power_team_id,status) VALUES($1,$2,'ACTIVE')",[member,team]);
  }
  for(const service of new Set([referralsApi,webService.referralsApi])){
    const scopes=await service.scopes(owner);assert.equal(scopes.length,2);
    for(const scope of scopes){const members=await service.people(owner,scope);assert.equal(members.length,1);assert.equal(members[0].id,ids[1]);}
    assert.deepEqual((await service.people(owner)).map(r=>r.id),[ids[1]]);
  }
  const key=randomUUID(),input={receiverId:ids[1],type:'EXTERNAL',temperature:'COLD',description:'Mobile contract'};
  assert.equal((await referralsApi.create(owner,input,key)).id,key);assert.equal((await referralsApi.create(owner,input,key)).id,key);
  assert.equal((await referralsApi.list(owner)).length,2);
  assert.equal((await webService.referralsApi.create(owner,input,key)).id,key);
  owner=ids[1];assert.equal((await webService.referralsApi.list(owner)).length,2);
  assert.equal((await referralsApi.decide(owner,key,'SUCCESSFUL',12.34)).amount,'12.34');await webService.referralsApi.decide(owner,key,'SUCCESSFUL',12.34);
  owner=ids[2];await assert.rejects(referralsApi.decide(owner,key,'UNSUCCESSFUL'));assert.deepEqual(await referralsApi.list(owner),[]);
  console.log(`Referral contract PASS: actual ${webOnly?'web':'web/mobile'} HTTP/PG, owner/receiver, keyed race, terminal replay, validation, atomic score rollback.`);

}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Referral contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
