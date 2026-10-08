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
const container = `e4n-visitor-queue-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,22);
  assert.equal((await applyVersionedSchema()).applied.length,0);









  const [admin,member,deleted]=Array.from({length:3},()=>randomUUID());
  for(const [i,id,role] of [[0,admin,'ADMIN'],[1,member,'MEMBER']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$3,'Fixture','x',$4)",[id,`queue-${i}@example.invalid`,`Member ${i}`,role]);
  const [event,education]=Array.from({length:2},()=>randomUUID());
  for(const [id,type]of [[event,'meeting'],[education,'education']])await pool.query("INSERT INTO events(id,title,start_at,type,created_by,is_public) VALUES($1,$2,now()-interval '1 day',$3,$4,false)",[id,type+' private past',type,admin]);
  const ids={};
  for(const [name,source,status,e,why]of [['Application','web','PENDING',event,'Networking'],['Invited','visitor_invite','PENDING',event,''],['Paid','visitor_payment','CONTACTED',null,''],['Education source','education_application','PENDING',null,'Overrides must not include'],['Education event','web','PENDING',education,'Overrides must not include'],['Converted','web','CONVERTED',null,''],['Rejected','web','REJECTED',null,''],['Legacy hidden','legacy_data','PENDING',null,''],['Legacy application','legacy_data','PENDING',null,'Has form']]) {
    const id=randomUUID();ids[name]=id;await pool.query(`INSERT INTO public_visitors(id,name,email,phone,source,status,event_id,why_join,form_data,inviter_id,created_at) VALUES($1,$2,'fixture@example.invalid','555',$3,$4,$5,$6,$7,$8,'2026-10-05 00:30:00')`,[id,name,source,status,e,why,JSON.stringify({why_join:why,primary_expectation:['Connections'],payment_status:'PAID',token:'secret_fixture',evil:{html:'ignore'}}),member]);
  }
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(path='',method='GET',body,owner=admin,role='ADMIN')=>fetch(base+'/api/admin/visitor-queue'+path,{method,headers:{'Content-Type':'application/json',...(owner?{Authorization:`Bearer ${token(owner,role)}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const r=await call();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);const snapshot=await r.json();assert.equal(snapshot.ownerId,admin);assert.equal(snapshot.visitors.length,6);assert.ok(!JSON.stringify(snapshot).includes('secret_fixture'));assert.ok(!JSON.stringify(snapshot).includes('payment_status'));assert.ok(!JSON.stringify(snapshot).includes('Education'));assert.equal(snapshot.visitors.find(v=>v.name==='Application').event_title,'meeting private past');assert.equal(snapshot.visitors.find(v=>v.name==='Invited').category,'registrations');assert.equal(snapshot.visitors.find(v=>v.name==='Paid').category,'registrations');assert.equal(snapshot.visitors.find(v=>v.name==='Application').created_at,'2026-10-05T00:30:00.000Z');
  assert.equal((await call('', 'GET',undefined,null)).status,401);assert.equal((await call('', 'GET',undefined,deleted)).status,401);assert.equal((await call('', 'GET',undefined,member)).status,403);assert.equal((await call('?owner='+member)).status,400);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call()).status,403);assert.equal((await call('/'+ids.Application+'/contacted','PUT',{})).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const contacts=await Promise.all([call('/'+ids.Application+'/contacted','PUT',{}),call('/'+ids.Application+'/contacted','PUT',{})]);assert.deepEqual(contacts.map(v=>v.status),[200,200]);const saved=await contacts[0].json();assert.equal(saved.visitor.status,'CONTACTED');assert.equal(saved.visitor.id,ids.Application);assert.equal((await call('/'+ids.Application+'/contacted','PUT',{})).status,200);
  assert.equal((await call('/'+ids.Converted+'/contacted','PUT',{})).status,409);assert.equal((await call('/'+ids.Rejected+'/contacted','PUT',{})).status,409);assert.equal((await call('/'+ids['Education source']+'/contacted','PUT',{})).status,404);assert.equal((await call('/'+ids['Education event']+'/contacted','PUT',{})).status,404);assert.equal((await call('/'+randomUUID()+'/contacted','PUT',{})).status,404);assert.equal((await call('/bad/contacted','PUT',{})).status,400);assert.equal((await call('/'+ids.Invited+'/contacted','PUT',{status:'CONVERTED'})).status,400);assert.equal((await call('/'+ids.Invited+'/contacted','PUT',{},member)).status,403);
  const original=pool.connect.bind(pool);pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.startsWith('UPDATE public_visitors'))throw new Error('isolated queue write failure');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};assert.equal((await call('/'+ids.Invited+'/contacted','PUT',{})).status,500);pool.connect=original;assert.equal((await pool.query('SELECT status FROM public_visitors WHERE id=$1',[ids.Invited])).rows[0].status,'PENDING');
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};const apiUrl='data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64');const serviceSource=readFileSync(path.join(root,'src/api/adminVisitorQueue.ts'),'utf8').replace("from './api'",`from '${apiUrl}'`);const {adminVisitorQueueApi,validQueueVisitor,queueStatus}=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)).toString('base64'));
  assert.equal((await adminVisitorQueueApi.read(admin)).length,6);assert.equal((await adminVisitorQueueApi.contacted(admin,ids.Invited)).status,'CONTACTED');assert.equal(validQueueVisitor({...snapshot.visitors[0],form_data:{bad:{}}}),false);assert.equal(validQueueVisitor({...snapshot.visitors[0],created_at:'bad'}),false);assert.equal(validQueueVisitor({...snapshot.visitors[0],form_data:{constructor:'bad'}}),false);assert.equal(queueStatus('__proto__'),'Diğer durum (__proto__)');assert.equal(queueStatus('constructor'),'Diğer durum (constructor)');
  const capacitySource=readFileSync(path.join(root,'src/api/adminGroupCatalog.ts'),'utf8').replace("from './api'",`from '${apiUrl}'`);const capacityUrl='data:text/javascript;base64,'+Buffer.from(compile(capacitySource)).toString('base64');
  const groupSource=readFileSync(path.join(root,'src/api/adminGroupDetail.ts'),'utf8').replace("from './api'",`from '${apiUrl}'`).replace("from './adminGroupCatalog'",`from '${capacityUrl}'`);const {groupRecordStatus}=await import('data:text/javascript;base64,'+Buffer.from(compile(groupSource)).toString('base64'));assert.equal(groupRecordStatus('constructor','visitor'),'Diğer durum (constructor)');assert.equal(groupRecordStatus('JOINED','visitor'),'Üye oldu');
  await assert.rejects(adminVisitorQueueApi.read(member));assert.equal((await pool.query('SELECT count(*)::int AS n FROM users')).rows[0].n,2);assert.equal((await pool.query('SELECT count(*)::int AS n FROM visitors')).rows[0].n,0);assert.equal((await pool.query('SELECT count(*)::int AS n FROM group_members')).rows[0].n,0);
  writeFileSync(path.join(root,'output/admin-visitor-queue-browser.json'),JSON.stringify({owner:admin,other:member,snapshot,saved}));
  await pool.query('DELETE FROM public_visitors');assert.equal((await adminVisitorQueueApi.read(admin)).length,0);
  const values=[];for(let i=0;i<5001;i++)values.push(`('${randomUUID()}','V${i}','web')`);await pool.query('INSERT INTO public_visitors(id,name,source) VALUES'+values.join(','));assert.equal((await call()).status,503);
  console.log('WEB13 PASS: current admin/revocation/auth/query/cache; education-free categorization/private past event; safe form DTO; atomic concurrent contact replay/conflict/404/rollback; real TS transport, malformed DTO, no admission writes, empty/503.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Visitor queue contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
