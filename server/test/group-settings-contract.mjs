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
const container = `e4n-group-settings-${randomUUID().slice(0, 8)}`;
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







  const [admin,member,deleted]=Array.from({length:3},()=>randomUUID());
  for(const [i,id,role] of [[0,admin,'ADMIN'],[1,member,'MEMBER']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$3,'Fixture','x',$4)",[id,`settings-${i}@example.invalid`,`Member ${i}`,role]);
  const existing=randomUUID();await pool.query("INSERT INTO groups(id,name,status,meeting_time,meeting_link,meeting_dates) VALUES($1,'Existing draft','DRAFT','19:00','https://example.invalid/meeting','[\"2026-10-09\"]')",[existing]);
  // Existing-column upgrade variant: additive migration must preserve configured values.
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check; ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK(status IN('ACTIVE','REQUESTED')); ALTER TABLE users DROP COLUMN group_title; DELETE FROM schema_migrations WHERE version='0015_group_membership_state'");
  await pool.query("DELETE FROM schema_migrations WHERE version='0014_group_meeting_settings'");
  assert.deepEqual((await applyVersionedSchema()).applied,['0014_group_meeting_settings','0015_group_membership_state','0016_group_capacity_invariant','0017_subscription_reminder_delivery','0018_web_job_runs','0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields']);
  const preserved=(await pool.query('SELECT name,status,meeting_time,meeting_link FROM groups WHERE id=$1',[existing])).rows[0];assert.equal(preserved.name,'Existing draft');assert.equal(preserved.status,'DRAFT');assert.equal(preserved.meeting_time,'19:00:00');assert.equal(preserved.meeting_link,'https://example.invalid/meeting');
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(method,path,body,owner=admin,role='ADMIN')=>fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',...(owner?{Authorization:`Bearer ${token(owner,role)}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const id=randomUUID(),payload={id,name:'Created group',meeting_time:'20:30',meeting_link:'https://example.invalid/created',meeting_dates:['2026-10-20','2026-10-08','2026-10-08'],visitor_email_subject:'Fixture',visitor_email_template:'<p>Fixture</p>'};
  const concurrent=await Promise.all([call('POST','/groups',payload),call('POST','/groups',payload)]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,201]);const created=await concurrent[0].json();assert.equal(created.id,id);assert.equal(created.meeting_time,'20:30:00');assert.deepEqual(created.meeting_dates,['2026-10-08','2026-10-20']);assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM groups WHERE id=$1',[id])).rows[0].n,1);assert.equal((await call('POST','/groups',{...payload,name:'Changed content'})).status,409);
  const savedResponse=await call('PUT','/groups/'+existing,{name:'Edited draft',meeting_time:'21:15',description:''});assert.equal(savedResponse.status,200);assert.match(savedResponse.headers.get('cache-control'),/private.*no-store/);const saved=await savedResponse.json();assert.equal(saved.status,'DRAFT');assert.equal(saved.meeting_link,'https://example.invalid/meeting');assert.deepEqual(saved.meeting_dates,['2026-10-09']);assert.equal(saved.meeting_time,'21:15:00');assert.equal((await call('PUT','/groups/'+existing,{name:'Edited draft',meeting_time:'21:15'})).status,200);
  for(const bad of [{name:''},{meeting_time:'25:00'},{meeting_link:'javascript:alert(1)'},{meeting_link:'https://u:p@example.invalid'},{meeting_dates:['2026-02-30']},{meeting_dates:'bad'},{status:'CLOSED'},{unknown:'x'}])assert.equal((await call('PUT','/groups/'+existing,bad)).status,400);
  assert.equal((await call('PUT','/groups/'+randomUUID(),{name:'Missing'})).status,404);assert.equal((await call('PUT','/groups/bad',{name:'Bad'})).status,400);assert.equal((await call('POST','/groups',{name:'Denied'},member)).status,403);assert.equal((await call('PUT','/groups/'+existing,{name:'Denied'},member)).status,403);assert.equal((await call('POST','/groups',{name:'Denied'},null)).status,401);assert.equal((await call('POST','/groups',{name:'Deleted'},deleted)).status,401);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call('PUT','/groups/'+existing,{name:'Stale admin'})).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const original=pool.connect.bind(pool);pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.startsWith('UPDATE groups SET'))throw new Error('isolated group write failure');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};assert.equal((await call('PUT','/groups/'+existing,{name:'Must rollback'})).status,500);pool.connect=original;assert.equal((await pool.query('SELECT name FROM groups WHERE id=$1',[existing])).rows[0].name,'Edited draft');
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};const {api}=await import('data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64'));assert.equal((await api.createGroup(payload)).id,id);assert.equal((await api.updateGroup(existing,{meeting_time:'22:00'})).status,'DRAFT');const readback=await api.getGroup(existing);assert.equal(readback.meeting_time,'22:00:00');assert.equal(readback.status,'DRAFT');
  writeFileSync(path.join(root,'output/group-settings-browser.json'),JSON.stringify({owner:admin,other:member,group:readback,created,groups:[readback,created]}));
  console.log('WEB11 group settings PASS:15 migrations/repeat0; schema repair, current DB admin/stale role, create concurrent UUID replay/conflict, input validation, partial/status/date preservation, 404, injected rollback, real TS create/update/readback.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Group settings contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
