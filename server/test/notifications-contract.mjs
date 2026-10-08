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
const container = `e4n-notifications-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,23);
  assert.equal((await applyVersionedSchema()).applied.length,0);










 const owner=randomUUID(),other=randomUUID();for(const id of [owner,other])await pool.query("INSERT INTO users(id,email,name,profession)VALUES($1,$2,'Notifications fixture','Engineer')",[id,id+'@example.invalid']);
 const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
 const token=id=>jwt.sign({id,role:'ADMIN'},process.env.JWT_SECRET);
 const call=(method,p,actor=owner,body)=>fetch(base+'/api'+p,{method,headers:{'Content-Type':'application/json',...(actor?{Authorization:'Bearer '+token(actor)}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const read=async(actor=owner)=>{const r=await call('GET','/notifications/web',actor);assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);return r.json();};
 await pool.query("INSERT INTO notifications(user_id,title,message,type,read) SELECT $1,'Notification '||i,'Private owned message','MESSAGE',false FROM generate_series(1,65)i",[owner]);
 await pool.query("INSERT INTO notifications(user_id,title,message,type,read)VALUES($1,'Other private','Hidden','MESSAGE',false)",[other]);
 let v=await read();assert.equal(v.total,65);assert.equal(v.unreadCount,65);assert.equal(v.notifications.length,50);assert.equal(v.ownerId,owner);assert.ok(!JSON.stringify(v).includes('Other private'));assert.ok(!('user_id'in v.notifications[0]));
 const id=v.notifications[0].id;const foreign=(await read(other)).notifications[0].id;
 assert.equal((await call('PUT','/notifications/'+foreign+'/read')).status,404);assert.equal((await read(other)).unreadCount,1);
 const races=await Promise.all(Array.from({length:8},()=>call('PUT','/notifications/'+id+'/read')));assert.ok(races.every(r=>r.status===200));v=await read();assert.equal(v.unreadCount,64);
 assert.equal((await call('PUT','/notifications/bad/read')).status,400);assert.equal((await call('PUT','/notifications/'+id+'/read',owner,{user_id:other})).status,400);assert.equal((await call('GET','/notifications/web?ownerId='+other)).status,400);assert.equal((await call('GET','/notifications/web',null)).status,401);assert.equal((await call('GET','/notifications/web',randomUUID())).status,401);
 await pool.query("CREATE FUNCTION deny_notice() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private fixture SQL failure'; END $$; CREATE TRIGGER deny_notice BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION deny_notice()");
 const failed=await call('PUT','/notifications/read-all');assert.equal(failed.status,500);assert.ok(!(await failed.text()).includes('private fixture SQL'));assert.equal((await read()).unreadCount,64);
 await pool.query('DROP TRIGGER deny_notice ON notifications;DROP FUNCTION deny_notice()');
 const all=await call('PUT','/notifications/read-all');assert.equal(all.status,200);assert.equal((await all.json()).unreadCount,0);assert.equal((await read(other)).unreadCount,1);assert.equal((await call('PUT','/notifications/read-all')).status,200);
 await pool.query("INSERT INTO notifications(user_id,title,message,type,read)VALUES($1,'New after read-all','Still unread','MESSAGE',false)",[owner]);assert.equal((await read()).unreadCount,1);assert.equal((await (await call('GET','/notifications')).json()).length,50);

 const source=readFileSync(path.join(serverDir,'../src/api/notifications.ts'),'utf8').replace("import { notificationTransport as webApi } from './api';","const webApi=globalThis.fixtureNoticeTransport;");
 let ack=await read();globalThis.fixtureNoticeTransport={get:async()=>ack,put:async()=>ack};const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;const {notificationsApi}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));assert.equal((await notificationsApi.read(owner)).unreadCount,1);const good=ack;
 for(const patch of [{ownerId:other},{notificationVersion:2},{total:-1},{unreadCount:999},{notifications:[...good.notifications,good.notifications[0]]}]){ack={...good,...patch};await assert.rejects(()=>notificationsApi.read(owner));}
 ack={...good,notification:{...good.notifications[0],read:false}};await assert.rejects(()=>notificationsApi.mark(owner,good.notifications[0].id));delete globalThis.fixtureNoticeTransport;
 console.log('Notifications PASS: actual PG17/Express, 65 unread outside50window, owner privacy/current-account, deterministic window, 8way replay, read-all rollback/redaction, foreign404, new-after-readall remains unread, legacy array. No schema or live changes.');
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Notifications contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
