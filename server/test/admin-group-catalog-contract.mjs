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
const container = `e4n-group-catalog-${randomUUID().slice(0, 8)}`;
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










  const [admin,member,other,deleted]=Array.from({length:4},()=>randomUUID());
  for(const [id,role]of [[admin,'ADMIN'],[member,'MEMBER'],[other,'MEMBER']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$2,$2,'private_secret',$3)",[id,id+'@example.invalid',role]);
  const [active,draft,unknown]=Array.from({length:3},()=>randomUUID());
  for(const [id,name,status]of [[active,'İstanbul Grubu','ACTIVE'],[draft,'Taslak Grubu','DRAFT'],[unknown,'Durumu Bilinmeyen',null]])await pool.query('INSERT INTO groups(id,name,status) VALUES($1,$2,$3)',[id,name,status]);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$4,'ACTIVE'),($2,$4,'REQUESTED'),($3,$4,NULL),($1,$5,'ACTIVE')",[admin,member,other,active,draft]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(owner=admin,query='')=>fetch(base+'/api/admin/group-catalog'+query,{headers:owner?{Authorization:'Bearer '+token(owner)}:{}});
  const r=await call();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);const snapshot=await r.json();assert.equal(snapshot.groups.length,3);
  const a=snapshot.groups.find(g=>g.id===active),d=snapshot.groups.find(g=>g.id===draft),u=snapshot.groups.find(g=>g.id===unknown);
  assert.deepEqual([a.total_records,a.active_records,a.requested_records,a.other_records,a.unknown_records],[3,1,1,0,1]);
  assert.deepEqual([d.total_records,d.active_records,d.other_records],[1,1,0]);assert.equal(d.status,'DRAFT');assert.equal(u.status,null);assert.equal(u.total_records,0);
  assert.ok(!JSON.stringify(snapshot).includes('private_secret'));assert.ok(!JSON.stringify(snapshot).includes('@example.invalid'));
  assert.equal((await call(null)).status,401);assert.equal((await call(deleted)).status,401);assert.equal((await call(member)).status,403);assert.equal((await call(admin,'?owner='+member)).status,400);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call()).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const original=pool.connect.bind(pool),writer=await original();let changed=false;
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{const result=await q(sql,args);if(!changed&&typeof sql==='string'&&sql.startsWith('SELECT role,now()')){changed=true;await writer.query("UPDATE group_members SET status='ACTIVE' WHERE user_id=$1 AND group_id=$2",[member,active]);await writer.query("UPDATE groups SET status='ACTIVE' WHERE id=$1",[draft]);}return result;};c.release=()=>{c.query=q;c.release=release;release();};return c;};
  const consistent=await(await call()).json();pool.connect=original;writer.release();assert.equal(consistent.groups.find(g=>g.id===active).requested_records,1);assert.equal(consistent.groups.find(g=>g.id===draft).status,'DRAFT');
  const next=await(await call()).json();assert.equal(next.groups.find(g=>g.id===active).active_records,2);assert.equal(next.groups.find(g=>g.id===draft).status,'ACTIVE');
  await pool.query("UPDATE group_members SET status='REQUESTED' WHERE user_id=$1 AND group_id=$2",[member,active]);await pool.query("UPDATE groups SET status='DRAFT' WHERE id=$1",[draft]);
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('FROM groups g LEFT JOIN'))throw new Error('isolated catalog failure');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};
  assert.equal((await call()).status,500);pool.connect=original;assert.equal((await call()).status,200);
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';","const BASE_URL = '"+base+"/api';");
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};
  const apiUrl='data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64');
  const source=readFileSync(path.join(root,'src/api/adminGroupCatalog.ts'),'utf8').replace("from './api'","from '"+apiUrl+"'");
  const {adminGroupCatalogApi,validGroupCatalog,filterGroupCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compile(source)).toString('base64'));
  // Isolated legacy schema variant: runtime CREATE definition does not enforce this baseline check.
  await pool.query("DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check");
  await pool.query("UPDATE group_members SET status='INACTIVE' WHERE group_id=$1",[draft]);
  const actual=await adminGroupCatalogApi.read(admin);assert.equal(actual.groups.length,3);assert.equal(actual.groups.find(g=>g.id===draft).other_records,1);assert.equal(filterGroupCatalog(actual.groups,'istanbul','ALL')[0].id,active);
  assert.equal(filterGroupCatalog(actual.groups,'','VALUE:DRAFT')[0].id,draft);assert.equal(filterGroupCatalog(actual.groups,'','UNKNOWN')[0].id,unknown);assert.equal(filterGroupCatalog(actual.groups,'no match','ALL').length,0);
  assert.equal(filterGroupCatalog([{...a,status:'ALL'}],'','VALUE:ALL').length,1);
  for(const bad of [{...actual,ownerId:member},{...actual,groups:[a,a]},{...actual,groups:[{...a,total_records:4}]},{...actual,groups:[{...a,active_records:-1}]},{...actual,groups:[{...a,unknown_records:null}]}])assert.equal(validGroupCatalog(bad,admin),false);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM group_members')).rows[0].n,4);
  writeFileSync(path.join(root,'output/admin-group-catalog-browser.json'),JSON.stringify({owner:admin,other:member,snapshot:actual,active,draft,unknown}));
  const values=[];for(let i=0;i<4998;i++)values.push("('"+randomUUID()+"','G"+i+"')");await pool.query('INSERT INTO groups(id,name) VALUES'+values.join(','));assert.equal((await call()).status,503);
  await pool.query('DELETE FROM group_members');await pool.query('DELETE FROM groups');assert.equal((await(await call()).json()).groups.length,0);
  console.log('WEB15 PASS: isolated19/repeat0/current-role/auth/query/cache; counts ACTIVE/REQUESTED/other/null/draft/zero; consistent concurrent snapshot; real TS transport/filter/DTO; injected500/recovery; no admission writes; 5001-limit503 and genuine empty.');
}
let exitCode=0;
try{await main();}catch(error){exitCode=1;console.error('Catalog contract failed:',error);}
finally{if(appServer)await new Promise(resolve=>appServer.close(resolve));if(pool)await pool.end();if(containerStarted){try{docker(['stop','--time','3',container],{timeout:15000});}catch(error){exitCode=1;console.error(error.message);}}}process.exit(exitCode);
