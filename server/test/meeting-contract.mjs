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
  await applyVersionedSchema();
  const ids = [randomUUID(),randomUUID(),randomUUID()];
  for (const [i,id] of ids.entries()) await pool.query("INSERT INTO users (id,email,name,profession,password_hash,role) VALUES ($1,$2,$3,'Fixture','fixture-only','MEMBER')",[id,`meeting-${i}@example.invalid`,`Fixture ${i}`]);
  const meetingId=randomUUID();
  await pool.query("INSERT INTO one_to_ones (id,requester_id,partner_id,meeting_date,notes) VALUES ($1,$2,$3,'2026-10-05T10:00:00Z','Contract fixture')",[meetingId,ids[0],ids[1]]);
  const snapshot=async()=>(await pool.query('SELECT * FROM one_to_ones ORDER BY id')).rows;
  const before=await snapshot();
  const { default:app }=await import('../src/index.js');
  appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=id=>jwt.sign({id,role:'MEMBER'},process.env.JWT_SECRET);
  const get=async id=>{const r=await fetch(`${base}/api/one-to-ones`,{headers:id?{Authorization:`Bearer ${token(id)}`}:{},signal:AbortSignal.timeout(10000)});const body=await r.text();let data;try{data=JSON.parse(body);}catch{data=body;}return {status:r.status,data};};
  assert.equal((await get()).status,401);
  const outgoing=await get(ids[0]),incoming=await get(ids[1]),other=await get(ids[2]);
  assert.equal(outgoing.status,200);assert.equal(incoming.status,200);assert.equal(other.status,200);
  assert.equal(outgoing.data.length,1);assert.equal(incoming.data.length,1);assert.deepEqual(other.data,[]);
  assert.equal(outgoing.data[0].direction,'OUTGOING');assert.equal(incoming.data[0].direction,'INCOMING');
  assert.equal(incoming.data[0].partner_id,ids[1]);assert.equal(incoming.data[0].requester_name,'Fixture 0');
  assert.equal(outgoing.data[0].status,'COMPLETED');assert.deepEqual(await snapshot(),before);
  const columns=(await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='one_to_ones'")).rows.map(r=>r.column_name);
  assert.equal(columns.includes('updated_at'),false);
  const update=await fetch(`${base}/api/one-to-ones/${meetingId}/status`,{method:'PUT',headers:{Authorization:`Bearer ${token(ids[1])}`,'Content-Type':'application/json'},body:JSON.stringify({status:'ACCEPTED'}),signal:AbortSignal.timeout(10000)});
  assert.equal(update.status,500);assert.match((await update.json()).error,/updated_at/);assert.deepEqual(await snapshot(),before);
  let compiled=ts.transpileModule(readFileSync(path.join(serverDir,'../src/api/api.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  compiled=compiled.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService = {};').replaceAll('import.meta.env.PROD','false').replaceAll('http://localhost:4005/api',`${base}/api`);
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(ids[1])}})};
  const {api}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  const mapped=await api.getMyMeetingRequests(ids[1]);assert.equal(mapped[0].receiverId,ids[1]);assert.equal(mapped[0].senderId,ids[0]);assert.equal(mapped[0].status,'COMPLETED');
  const originalError = console.error;
  console.error = (label, error) => originalError(label, error?.message ?? error);
  await assert.rejects(api.updateMeetingStatus(meetingId,'ACCEPTED'),/updated_at/);
  const originalQuery=pool.query.bind(pool);
  try {
    pool.query=(sql,...args)=>typeof sql==='string'&&sql.includes('FROM one_to_ones o')?Promise.reject(new Error('isolated meeting read failure')):originalQuery(sql,...args);
    assert.equal((await get(ids[1])).status,500);
    assert.deepEqual(await api.getMyMeetingRequests(ids[1]),[],'baseline hides HTTP failure as empty');
  }finally{pool.query=originalQuery;console.error=originalError;}
  assert.deepEqual(await snapshot(),before);
  console.log(JSON.stringify({isolated:true,read:{anonymous:401,outgoing:200,incoming:200,unrelatedRows:0,rowsUnchanged:true},findings:{statusWrite:500,missingUpdatedAt:true,defaultStatus:'COMPLETED',clientHidesReadFailure:true},migrations:(await pool.query('SELECT count(*)::int AS count FROM schema_migrations')).rows[0].count},null,2));
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
