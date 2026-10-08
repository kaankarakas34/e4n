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
const container = `e4n-web-groups-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,24);
  assert.equal((await applyVersionedSchema()).applied.length,0);





  // Exercise the historical missing optional-column shape, then restore it below.
  await pool.query('ALTER TABLE groups DROP COLUMN meeting_time, DROP COLUMN meeting_link');
  const [alice,bob,third,deleted]=Array.from({length:4},()=>randomUUID());
  for(const [i,id] of [alice,bob,third].entries())await pool.query('INSERT INTO users(id,name,email,password_hash,role,profession) VALUES($1,$2,$3,\'fixture\',\'MEMBER\',$4)',[id,`Member ${i}`,`fixture${i}@example.invalid`,`Fixture ${i}`]);
  const [first,second,requested,draft,privateGroup]=Array.from({length:5},()=>randomUUID());
  for(const [i,id] of [first,second,requested,draft,privateGroup].entries())await pool.query('INSERT INTO groups(id,name,status,meeting_dates) VALUES($1,$2,$3,$4::jsonb)',[id,`Group ${i}`,id===draft?'DRAFT':'ACTIVE',JSON.stringify(['2026-10-20','2026-10-08','2020-01-01','2026-10-08'])]);
  for(const [u,g,status] of [[alice,first,'ACTIVE'],[alice,second,'ACTIVE'],[alice,requested,'REQUESTED'],[alice,draft,'ACTIVE'],[bob,first,'ACTIVE'],[third,first,'REQUESTED'],[third,privateGroup,'ACTIVE']])await pool.query('INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,$3)',[u,g,status]);
  const before=JSON.stringify((await pool.query('SELECT user_id,group_id,status FROM group_members ORDER BY user_id,group_id')).rows);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='MEMBER')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(id=alice,query='',role='MEMBER')=>fetch(base+'/api/me/web-groups'+query,{headers:id?{Authorization:`Bearer ${token(id,role)}`}:{}});
  const response=await call();assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private.*no-store/);const a=await response.json();assert.equal(a.ownerId,alice);assert.deepEqual(a.groups.map(g=>g.id),[first,second]);assert.deepEqual(a.groups[0].members.map(m=>m.id),[alice,bob]);assert.equal(a.groups[0].is_online,false);assert.equal(a.groups[0].meeting_time,null);assert.equal(a.groups[1].is_online,false);assert(!JSON.stringify(a).includes('private-link'));assert(a.groups.every(g=>g.members.every(m=>!('email'in m)&&!('role'in m)&&!('performance_score'in m))));
  // Isolated optional-column variant: legacy live schemas may contain these fields.
  await pool.query('ALTER TABLE groups ADD COLUMN meeting_time TIME, ADD COLUMN meeting_link TEXT');
  await pool.query('UPDATE groups SET meeting_time=\'20:00\',meeting_link=\'https://example.invalid/private-link\' WHERE id=$1',[first]);
  const withMetadata=await(await call()).json();assert.equal(withMetadata.groups[0].is_online,true);assert.equal(withMetadata.groups[0].meeting_time,'20:00:00');assert(!JSON.stringify(withMetadata).includes('private-link'));
  const b=await(await call(bob)).json();assert.equal(b.groups.length,1);assert.equal(b.groups[0].id,first);
  assert.equal((await call(null)).status,401);assert.equal((await call(deleted)).status,401);assert.equal((await call('bad')).status,401);assert.equal((await call(alice,'?userId='+third)).status,400);assert.deepEqual((await(await call(alice,'','ADMIN')).json()).groups,withMetadata.groups);
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(alice)}})};globalThis.__groups=(await import('data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64'))).webGroupsTransport;
  const serviceSource=readFileSync(path.join(root,'src/api/webGroups.ts'),'utf8').replace("import { webGroupsTransport } from './api';",'const webGroupsTransport=globalThis.__groups;');const {webGroupsApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)).toString('base64'));assert.deepEqual(await webGroupsApi.read(alice),withMetadata.groups);await assert.rejects(webGroupsApi.read(bob));
  for(const bad of [{...a,groups:[...a.groups,a.groups[0]]},{...a,groups:[{...a.groups[0],meeting_dates:['bad']}]},{...a,groups:[{...a.groups[0],members:[a.groups[0].members[0],a.groups[0].members[0]]}]}]){globalThis.__groups={read:async()=>bad};const api=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)+`\n//${randomUUID()}`).toString('base64'));await assert.rejects(api.webGroupsApi.read(alice));}
  await pool.query("UPDATE group_members SET status='REQUESTED' WHERE user_id=$1 AND group_id=$2",[bob,first]);assert.deepEqual((await(await call(bob)).json()).groups,[]);const noGroups=await(await call(bob)).json();
  await pool.query("UPDATE group_members SET status='ACTIVE' WHERE user_id=$1 AND group_id=$2",[bob,first]);assert.equal(JSON.stringify((await pool.query('SELECT user_id,group_id,status FROM group_members ORDER BY user_id,group_id')).rows),before);
  await pool.query("UPDATE groups SET meeting_dates='[\"bad\"]'::jsonb WHERE id=$1",[first]);assert.equal((await call()).status,500);await pool.query('UPDATE groups SET meeting_dates=$1::jsonb WHERE id=$2',[JSON.stringify(a.groups[0].meeting_dates),first]);assert.equal((await call()).status,200);
  const original=pool.connect.bind(pool);pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('SELECT g.id,g.name'))throw new Error('isolated group read failure');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};assert.equal((await call()).status,500);pool.connect=original;assert.equal((await call()).status,200);
  writeFileSync(path.join(root,'output/web-groups-browser.json'),JSON.stringify({owner:alice,other:bob,snapshot:withMetadata,otherSnapshot:b,noGroups}));
  console.log('WEB09 groups PASS: existing active owner/group/member scope, minimal DTO, auth/cache/override/admin privacy, real TS transport/DTO, revoked group refresh, malformed stored dates and query failure recovery, read-only records.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Web groups contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
