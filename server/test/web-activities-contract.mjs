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
const container = `e4n-web-activities-${randomUUID().slice(0, 8)}`;
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






  const [alice,bob,third,deleted]=Array.from({length:4},()=>randomUUID());
  for(const [i,id] of [alice,bob,third].entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$3,'Fixture','x','MEMBER')",[id,`activity-${i}@example.invalid`,`Member ${i}`]);
  const event=randomUUID();await pool.query("INSERT INTO events(id,title,start_at,status,is_public,type,created_by) VALUES($1,'Future event','2099-01-01','PUBLISHED',true,'meeting',$2)",[event,alice]);
  const ids=[];
  for(const [i,status] of ['ACCEPTED','COMPLETED','PENDING'].entries()){const id=randomUUID();ids.push(id);await pool.query('INSERT INTO one_to_ones(id,requester_id,partner_id,meeting_date,status,created_at) VALUES($1,$2,$3,\'2099-01-01\',$4,$5)',[id,bob,alice,status,`2026-10-0${i+1}T12:00:00Z`]);}
  const given=randomUUID(),received=randomUUID();
  for(const [id,giver,receiver,status,day] of [[given,alice,bob,'PENDING',4],[received,bob,alice,'SUCCESSFUL',5]])await pool.query('INSERT INTO referrals(id,giver_id,receiver_id,status,created_at) VALUES($1,$2,$3,$4,$5)',[id,giver,receiver,status,`2026-10-0${day}T12:00:00Z`]);
  const visitor=randomUUID(),attendance=randomUUID();await pool.query("INSERT INTO visitors(id,inviter_id,name,status,visited_at,created_at) VALUES($1,$2,'Own visitor','INVITED','2099-01-01','2026-10-06T12:00:00Z')",[visitor,alice]);await pool.query("INSERT INTO attendance(id,user_id,event_id,status,created_at) VALUES($1,$2,$3,'PRESENT','2026-10-07T12:00:00Z')",[attendance,alice,event]);
  await pool.query("INSERT INTO visitors(inviter_id,name,status,created_at,visited_at) VALUES($1,'Private other visitor','INVITED','2026-10-08T12:00:00Z','2099-01-01')",[third]);await pool.query("INSERT INTO education(user_id,title,hours,completed_date,type) VALUES($1,'Deferred Education',1,'2026-10-08','BOOK')",[alice]);
  const before=JSON.stringify((await pool.query('SELECT (SELECT COUNT(*) FROM one_to_ones) AS meetings,(SELECT COUNT(*) FROM referrals) AS referrals,(SELECT COUNT(*) FROM visitors) AS visitors,(SELECT COUNT(*) FROM attendance) AS attendance')).rows);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='MEMBER')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(id=alice,query='',role='MEMBER')=>fetch(base+'/api/me/web-activities'+query,{headers:id?{Authorization:`Bearer ${token(id,role)}`}:{}});
  const response=await call();assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private.*no-store/);const a=await response.json();assert.equal(a.ownerId,alice);assert.deepEqual(a.items.map(x=>x.id),[attendance,visitor,received,given,...ids.toReversed()]);assert(a.items.every(x=>!('email'in x)&&!('notes'in x)&&!('amount'in x)&&x.type!=='education'));assert.equal(a.items.find(x=>x.id===given).direction,'given');assert.equal(a.items.find(x=>x.id===received).direction,'received');assert.equal(a.items.find(x=>x.id===ids[0]).status,'ACCEPTED');assert.equal(a.items.find(x=>x.id===attendance).scheduled_at.includes('2099'),true);
assert.equal((await call(deleted)).status,401);assert.equal((await call(null)).status,401);assert.equal((await call('bad')).status,401);assert.equal((await call(alice,'?userId='+third)).status,400);assert.deepEqual((await(await call(alice,'','ADMIN')).json()).items,a.items);
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(alice)}})};globalThis.__activities=(await import('data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64'))).webActivitiesTransport;
  const serviceSource=readFileSync(path.join(root,'src/api/webActivities.ts'),'utf8').replace("import { webActivitiesTransport } from './api';",'const webActivitiesTransport=globalThis.__activities;');const {webActivitiesApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)).toString('base64'));assert.deepEqual(await webActivitiesApi.read(alice),a.items);await assert.rejects(webActivitiesApi.read(bob));
  for(const bad of [{...a,items:[...a.items,a.items[0]]},{...a,items:[{...a.items[0],created_at:'bad'}]},{...a,items:[{...a.items[0],event_id:null}]},{...a,items:a.items.toReversed()}]){globalThis.__activities={read:async()=>bad};const api=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)+`\n//${randomUUID()}`).toString('base64'));await assert.rejects(api.webActivitiesApi.read(alice));}
  assert.equal(JSON.stringify((await pool.query('SELECT (SELECT COUNT(*) FROM one_to_ones) AS meetings,(SELECT COUNT(*) FROM referrals) AS referrals,(SELECT COUNT(*) FROM visitors) AS visitors,(SELECT COUNT(*) FROM attendance) AS attendance')).rows),before);
  const original=pool.connect.bind(pool);pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('WITH records AS'))throw new Error('isolated activity read failure');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};assert.equal((await call()).status,500);pool.connect=original;assert.equal((await call()).status,200);
  for(let i=0;i<12;i++)await pool.query("INSERT INTO visitors(inviter_id,name,status,created_at,visited_at) VALUES($1,$2,'INVITED','2026-10-09T12:00:00Z','2099-01-01')",[alice,`Bounded ${i}`]);const bounded=await(await call()).json();assert.equal(bounded.items.length,10);assert(bounded.items.every(x=>x.title.startsWith('Bounded')));assert.deepEqual((await(await call()).json()).items,bounded.items);
  const other=await(await call(bob)).json();const emptyOwner=randomUUID();await pool.query("INSERT INTO users(id,email,name,password_hash,role,profession) VALUES($1,'empty-activity@example.invalid','Empty member','x','MEMBER','Fixture')",[emptyOwner]);const noItems=await(await call(emptyOwner)).json();assert.deepEqual(noItems.items,[]);
  writeFileSync(path.join(root,'output/web-activities-browser.json'),JSON.stringify({owner:alice,other:bob,snapshot:a,otherSnapshot:other,emptyOwner,noItems}));
  console.log('WEB10 activity PASS: owner/auth/admin/query/cache, four source statuses/direction/dates, no education or other visitor leak, real TS DTO, deterministic last10, read-only counts, failure/recovery.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Web activities contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
