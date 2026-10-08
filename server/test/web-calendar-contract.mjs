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
const container = `e4n-web-calendar-${randomUUID().slice(0, 8)}`;
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




  process.env.TZ='Europe/Istanbul';
  const [alice,bob,third,deleted]=Array.from({length:4},()=>randomUUID());
  for(const [i,id] of [alice,bob,third].entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$3,'Fixture','x','MEMBER')",[id,`calendar-${i}@example.invalid`,`Member ${i}`]);
  const [active,requested,inactive]=Array.from({length:3},()=>randomUUID());
  for(const [id,status] of [[active,'ACTIVE'],[requested,'ACTIVE'],[inactive,'DRAFT']])await pool.query('INSERT INTO groups(id,name,status) VALUES($1,$2,$3)',[id,id,status]);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE'),($1,$3,'REQUESTED'),($1,$4,'ACTIVE')",[alice,active,requested,inactive]);
  const events=[];
  for(const [i,group,isPublic,status,date] of [[0,null,true,'PUBLISHED','2026-10-07T17:00:00Z'],[1,active,false,'PUBLISHED','2026-10-07T21:30:00Z'],[2,requested,false,'PUBLISHED','2026-10-08T08:00:00Z'],[3,inactive,false,'PUBLISHED','2026-10-08T08:00:00Z'],[4,null,false,'PUBLISHED','2026-10-08T08:00:00Z'],[5,null,true,'DRAFT','2026-10-08T08:00:00Z'],[6,null,true,'PUBLISHED','2026-11-03T00:00:00Z']]){
    const id=randomUUID();events.push(id);await pool.query('INSERT INTO events(id,title,start_at,status,is_public,type,price,max_attendees,created_by,group_id,location) VALUES($1,$2,$3,$4,$5,\'meeting\',0,50,$6,$7,\'Fixture\')',[id,`Event ${i}`,date,status,isPublic,alice,group]);
  }
  const ownMeeting=randomUUID(),pendingMeeting=randomUUID(),otherMeeting=randomUUID();
  for(const [id,requester,partner,status] of [[ownMeeting,bob,alice,'ACCEPTED'],[pendingMeeting,alice,bob,'PENDING'],[otherMeeting,bob,third,'COMPLETED']])await pool.query('INSERT INTO one_to_ones(id,requester_id,partner_id,meeting_date,status) VALUES($1,$2,$3,\'2026-10-08T09:00:00Z\',$4)',[id,requester,partner,status]);
  const visitor=randomUUID(),otherVisitor=randomUUID();for(const [id,owner] of [[visitor,alice],[otherVisitor,bob]])await pool.query('INSERT INTO visitors(id,inviter_id,name,visited_at,status) VALUES($1,$2,\'Private Visitor\',\'2026-10-08T10:00:00Z\',\'ATTENDED\')',[id,owner]);
  await pool.query("INSERT INTO education(user_id,title,hours,completed_date,type) VALUES($1,'Deferred Education',1,'2026-10-08','BOOK')",[alice]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='MEMBER')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const from='2026-09-27T21:00:00.000Z',to='2026-11-01T21:00:00.000Z';const url=`/api/calendar/web?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const call=(owner=alice,path=url,role='MEMBER')=>fetch(base+path,{headers:owner?{Authorization:`Bearer ${token(owner,role)}`}:{},signal:AbortSignal.timeout(10000)});
  const baseline=JSON.stringify((await pool.query('SELECT (SELECT COUNT(*) FROM events) AS events,(SELECT COUNT(*) FROM visitors) AS visitors,(SELECT COUNT(*) FROM one_to_ones) AS meetings')).rows);
  const r=await call();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);const a=await r.json();assert.equal(a.ownerId,alice);assert.equal(a.from,from);assert.equal(a.to,to);assert.deepEqual(new Set(a.items.map(x=>x.id)),new Set([events[0],events[1],ownMeeting,visitor]));assert(a.items.every(x=>!('email' in x)&&!('user_id' in x)&&x.type!=='education'));assert(a.items.filter(x=>x.type==='one_to_one').every(x=>x.title.includes('Member 1')));
  const b=await(await call(bob)).json();assert.deepEqual(new Set(b.items.map(x=>x.id)),new Set([events[0],ownMeeting,otherMeeting,otherVisitor]));
  assert.equal((await call(null)).status,401);assert.equal((await call(deleted)).status,401);assert.equal((await call('invalid')).status,401);assert.equal((await call(alice,url+'&userId='+bob)).status,400);assert.equal((await call(alice,'/api/calendar/web?from=bad&to='+to)).status,400);assert.equal((await call(alice,'/api/calendar/web?from='+to+'&to='+from)).status,400);assert.equal((await call(alice,'/api/calendar/web?from=2020-01-01T00:00:00.000Z&to='+to)).status,400);assert.equal((await call(alice,url,'ADMIN')).status,200);assert.deepEqual((await(await call(alice,url,'ADMIN')).json()).items,a.items);
  const root=path.join(serverDir,'..');const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const dates=await import('data:text/javascript;base64,'+Buffer.from(compile(readFileSync(path.join(root,'src/utils/calendarDates.ts'),'utf8'))).toString('base64'));
  assert.equal(dates.calendarDay(new Date('2026-10-07T21:30:00Z')),'2026-10-08');const grid=dates.calendarGrid(new Date(2026,9,1));assert.equal(grid[0].dateStr,'2026-09-28');assert.equal(grid.at(-1).dateStr,'2026-11-01');assert.equal(grid.length,35);assert.equal(new Set(grid.map(x=>x.dateStr)).size,35);assert.equal(dates.calendarGrid(new Date(2024,1,1)).filter(x=>x.inMonth).length,29);assert.equal(dates.calendarGrid(new Date(2026,1,1)).filter(x=>x.inMonth).length,28);assert.deepEqual(dates.calendarRange(new Date(2026,9,1)),{from,to});
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(alice)}})};globalThis.__webCalendarTransport=(await import('data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64'))).webCalendarTransport;
  const serviceSource=readFileSync(path.join(root,'src/api/webCalendar.ts'),'utf8').replace("import { webCalendarTransport } from './api';",'const webCalendarTransport=globalThis.__webCalendarTransport;');const {webCalendarApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)).toString('base64'));assert.deepEqual(await webCalendarApi.read(alice,from,to),a.items);await assert.rejects(webCalendarApi.read(bob,from,to));
  const transport=globalThis.__webCalendarTransport;for(const invalid of [{...a,items:[...a.items,a.items[0]]},{...a,items:[{...a.items[0],type:'education'}]},{...a,items:[{...a.items[0],start_at:to}]}]){globalThis.__webCalendarTransport={read:async()=>invalid};const v=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)+`\n//${randomUUID()}`).toString('base64'));await assert.rejects(v.webCalendarApi.read(alice,from,to));}globalThis.__webCalendarTransport=transport;
  const original=pool.connect.bind(pool);pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('WITH items AS'))throw new Error('isolated snapshot failure');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};assert.equal((await call()).status,500);pool.connect=original;assert.equal((await call()).status,200);assert.equal(JSON.stringify((await pool.query('SELECT (SELECT COUNT(*) FROM events) AS events,(SELECT COUNT(*) FROM visitors) AS visitors,(SELECT COUNT(*) FROM one_to_ones) AS meetings')).rows),baseline);
  const novemberRange=dates.calendarRange(new Date(2026,10,1));
  const november=await(await call(alice,`/api/calendar/web?from=${encodeURIComponent(novemberRange.from)}&to=${encodeURIComponent(novemberRange.to)}`)).json();
  assert.deepEqual(november.items.map(item=>item.id),[events[6]]);
  writeFileSync(path.join(root,'output/web-calendar-browser.json'),JSON.stringify({owner:alice,other:bob,snapshot:a,otherSnapshot:b,november}));
  console.log('Web calendar PASS: owner/group/status/range/privacy bounds; real TS transport and DTO guards; Istanbul day shift, contiguous month/leap grid; injected read failure/recovery, read no writes; education excluded.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Web calendar contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
