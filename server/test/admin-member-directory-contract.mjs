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
const container = `e4n-member-directory-${randomUUID().slice(0, 8)}`;
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










  const [admin,member,other,community,deleted]=Array.from({length:5},()=>randomUUID());
  for(const [id,name,role,status,company,city]of [[admin,'Admin Fixture','ADMIN','ACTIVE',null,null],[member,'İpek Fixture','MEMBER',null,'İzmir Company','İstanbul'],[other,'Other Fixture','MEMBER','INACTIVE','Other Co','Ankara'],[community,'Community Fixture','COMMUNITY_MEMBER','PENDING',null,null]])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,account_status,company,city,linkedin_profile) VALUES($1,$2,$3,$3,'secret_fixture',$4,$5,$6,$7,'javascript:bad')",[id,`${id}@example.invalid`,name,role,status,company,city]);
  const [activeGroup,draftGroup,requestedGroup]=Array.from({length:3},()=>randomUUID());
  for(const [id,name,status]of [[activeGroup,'Active Group','ACTIVE'],[draftGroup,'Draft Group','DRAFT'],[requestedGroup,'Requested Group','ACTIVE']])await pool.query('INSERT INTO groups(id,name,status) VALUES($1,$2,$3)',[id,name,status]);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE'),($1,$3,'ACTIVE'),($1,$4,'REQUESTED')",[member,activeGroup,draftGroup,requestedGroup]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(owner=admin,role='ADMIN',query='')=>fetch(base+'/api/admin/member-directory'+query,{headers:owner?{Authorization:`Bearer ${token(owner,role)}`}:{}});
  const r=await call();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);const snapshot=await r.json();assert.equal(snapshot.members.length,4);assert.equal(new Set(snapshot.members.map(m=>m.id)).size,4);const target=snapshot.members.find(m=>m.id===member);assert.equal(target.groups.length,3);assert.equal(target.account_status,null);assert.equal(target.company,'İzmir Company');assert.equal(target.groups.find(g=>g.id===draftGroup).group_status,'DRAFT');assert.equal(target.groups.find(g=>g.id===requestedGroup).membership_status,'REQUESTED');assert.equal(target.profession_status,undefined);assert.ok(!JSON.stringify(snapshot).includes('secret_fixture'));assert.equal(snapshot.members.find(m=>m.id===admin).groups.length,0);
  assert.equal((await call(null)).status,401);assert.equal((await call(deleted)).status,401);assert.equal((await call(member)).status,403);assert.equal((await call(admin,'ADMIN','?owner='+member)).status,400);await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call()).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const original=pool.connect.bind(pool),writer=await original();let changed=false;
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{const result=await q(sql,args);if(!changed&&typeof sql==='string'&&sql.startsWith('SELECT id,name,email')){changed=true;await writer.query("UPDATE users SET account_status='ACTIVE' WHERE id=$1",[member]);await writer.query('DELETE FROM group_members WHERE user_id=$1',[member]);}return result;};c.release=()=>{c.query=q;c.release=release;release();};return c;};
  const consistent=await(await call()).json();pool.connect=original;writer.release();assert.equal(consistent.members.find(m=>m.id===member).account_status,null);assert.equal(consistent.members.find(m=>m.id===member).groups.length,3);const next=await(await call()).json();assert.equal(next.members.find(m=>m.id===member).account_status,'ACTIVE');assert.equal(next.members.find(m=>m.id===member).groups.length,0);
  await pool.query('UPDATE users SET account_status=null WHERE id=$1',[member]);await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE'),($1,$3,'ACTIVE'),($1,$4,'REQUESTED')",[member,activeGroup,draftGroup,requestedGroup]);
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('FROM group_members gm'))throw new Error('isolated directory failure');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};assert.equal((await call()).status,500);pool.connect=original;assert.equal((await call()).status,200);
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};const apiUrl='data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64');const source=readFileSync(path.join(root,'src/api/adminMemberDirectory.ts'),'utf8').replace("from './api'",`from '${apiUrl}'`);const {adminMemberDirectoryApi,validMemberDirectory,filterDirectory,directoryStatus}=await import('data:text/javascript;base64,'+Buffer.from(compile(source)).toString('base64'));
  const actual=await adminMemberDirectoryApi.read(admin);assert.equal(actual.members.length,4);const filters={tab:'members',search:'',role:'ALL',status:'ALL',group:'ALL'};assert.equal(filterDirectory(actual.members,filters).length,3);assert.equal(filterDirectory(actual.members,{...filters,tab:'community'}).length,1);assert.equal(filterDirectory(actual.members,{...filters,search:'istanbul'})[0].id,member);assert.equal(filterDirectory(actual.members,{...filters,search:'izmir company'})[0].id,member);assert.equal(filterDirectory(actual.members,{...filters,status:'UNKNOWN'})[0].id,member);assert.equal(filterDirectory(actual.members,{...filters,group:requestedGroup})[0].id,member);assert.equal(filterDirectory(actual.members,{...filters,search:'does not exist'}).length,0);assert.equal(directoryStatus(null),'Bilinmiyor');assert.equal(directoryStatus('constructor'),'Diğer durum (constructor)');
  for(const bad of [{...actual,ownerId:member},{...actual,members:[...actual.members,actual.members[0]]},{...actual,members:[{...target,groups:[...target.groups,target.groups[0]]}]},{...actual,members:[{...target,email:{}}]}])assert.equal(validMemberDirectory(bad,admin),false);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM users')).rows[0].n,4);assert.equal((await pool.query('SELECT count(*)::int AS n FROM group_members')).rows[0].n,3);
  writeFileSync(path.join(root,'output/admin-member-directory-browser.json'),JSON.stringify({owner:admin,other:member,snapshot:actual,activeGroup,draftGroup,requestedGroup}));
  const values=[];for(let i=0;i<4997;i++)values.push(`('${randomUUID()}','m${i}@example.invalid','M${i}','P${i}','x')`);await pool.query('INSERT INTO users(id,email,name,profession,password_hash) VALUES'+values.join(','));assert.equal((await call()).status,503);
  console.log('WEB14 PASS: current admin/revocation/auth/query/cache; unique accounts/multi-group/draft/requested/null; consistent concurrent snapshot; private DTO; real TS Turkish search/filter/unknown/community/duplicates; read failure recovery; no admission writes; 5001-limit503.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Member directory contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
