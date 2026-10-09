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
const container = `e4n-self-profile-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,28);
  assert.equal((await applyVersionedSchema()).applied.length,0);









  const [owner,other,deleted]=Array.from({length:3},()=>randomUUID());
  for(const [id,name]of [[owner,'Owner'],[other,'Other']])await pool.query("INSERT INTO users(id,email,name,profession,phone,company,password_hash,reset_password_token) VALUES($1,$2,$3,'Engineer','123','Legacy company','private-password','private-reset')",[id,id+'@example.invalid',name]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const token=id=>jwt.sign({id,role:'ADMIN'},process.env.JWT_SECRET);
  const call=(method,p,body,actor=owner)=>fetch(base+'/api'+p,{method,headers:{'Content-Type':'application/json',...(actor?{Authorization:'Bearer '+token(actor)}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const get=async(actor=owner)=>{const r=await call('GET','/user/profile-settings',undefined,actor);assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);return r.json();};
  const initial=await get();assert.equal(initial.ownerId,owner);assert.equal(initial.website,null);assert.equal(initial.bio,null);assert.ok(!JSON.stringify(initial).includes('private-'));
  const payload={name:'  Owner saved  ',profession:'',phone:'',city:' İzmir ',website:' https://example.invalid/contact ',bio:' Profile biography ',linkedin_profile:'https://www.linkedin.com/in/example',company:'New company',tax_number:'0000001234',tax_office:'Office',billing_address:'Invoice address',expectedRevision:initial.revision};
  const r=await call('PUT','/users/me',payload);assert.equal(r.status,200);const saved=await r.json();assert.equal(saved.name,'Owner saved');assert.equal(saved.profession,'');assert.equal(saved.phone,null);assert.equal(saved.city,'İzmir');assert.equal(saved.bio,'Profile biography');assert.notEqual(saved.revision,initial.revision);
  assert.deepEqual(await get(),saved);assert.equal((await get(other)).name,'Other');
  assert.equal((await call('PUT','/users/me',payload)).status,200); // Same content with stale revision is a safe replay.
  const races=await Promise.all(Array.from({length:8},(_,i)=>call('PUT','/users/me',{bio:'Race '+i,expectedRevision:saved.revision})));
  assert.equal(races.filter(r=>r.status===200).length,1);assert.equal(races.filter(r=>r.status===409).length,7);
  const winner=await get();assert.equal(winner.website,saved.website);assert.equal(winner.tax_number,'0000001234');
  for(const bad of [{role:'ADMIN'},{email:'changed@invalid'},{id:other},{name:''},{phone:'x'.repeat(21)},{bio:'x'.repeat(5001)},{website:'javascript:alert(1)'},{website:'https://user:password@example.invalid'},{website:'example.invalid'},{phone:3},{bio:'a\u0000b'},{expectedRevision:3,name:'x'},{expectedRevision:['a'.repeat(64)],name:'x'},{expectedRevision:null,name:'x'},{},[]])assert.equal((await call('PUT','/users/me',bad)).status,400);
  assert.equal((await call('GET','/user/profile-settings?ownerId='+other)).status,400);
  assert.equal((await call('PUT','/users/me',{name:'No login'},null)).status,401);
  assert.equal((await call('PUT','/users/me',{name:'Deleted'},deleted)).status,401);
  assert.equal((await call('GET','/user/profile-settings',undefined,deleted)).status,401);
  const raw=(await pool.query('SELECT password_hash,reset_password_token,email,role FROM users WHERE id=$1',[owner])).rows[0];assert.equal(raw.role,'MEMBER');assert.equal(raw.password_hash,'private-password');assert.equal(raw.reset_password_token,'private-reset');assert.equal(raw.email,owner+'@example.invalid');
  const visible=await (await call('GET','/user/profiles/'+owner,undefined,other)).json();assert.equal(visible.profile.bio,winner.bio);assert.equal(visible.contactVisible,false);assert.ok(!('website'in visible.profile));
  await pool.query("CREATE FUNCTION fixture_deny_profile() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private fixture failure'; END $$; CREATE TRIGGER fixture_profile BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fixture_deny_profile()");
  const failed=await call('PUT','/users/me',{bio:'must rollback'});assert.equal(failed.status,500);assert.ok(!(await failed.text()).includes('private fixture failure'));assert.deepEqual(await get(),winner);
  assert.equal((await call('PUT','/users/me',{bio:winner.bio,expectedRevision:saved.revision})).status,200); // Replay never fires UPDATE.
  await pool.query('DROP TRIGGER fixture_profile ON users; DROP FUNCTION fixture_deny_profile()');
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';","const BASE_URL = '"+base+"/api';");globalThis.localStorage={getItem:()=>JSON.stringify({state:{user:{id:owner},token:token(owner)}})};const {api}=await import('data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64'));
  assert.equal((await api.getProfileSettings(owner)).id,owner);await assert.rejects(()=>api.getProfileSettings(other));
  let staleCalls=0;const originalOwnerFetch=globalThis.fetch;globalThis.fetch=async()=>{staleCalls++;throw Error('Stale owner must never send a write');};await assert.rejects(()=>api.updateMe({name:'Stale owner'},other));assert.equal(staleCalls,0);globalThis.fetch=originalOwnerFetch;assert.equal((await get()).name,'Owner saved');
  assert.equal((await api.updateMe({phone:'',city:'',website:'',bio:''},owner,winner.revision)).bio,null);
  const billing=await api.updateMe({company:' Typed company ',tax_number:'0000004321',tax_office:'Typed office',billing_address:'Typed address'});assert.equal(billing.company,'Typed company');assert.equal(billing.name,'Owner saved');
  const originalFetch=globalThis.fetch;
  for(const patch of [{ownerId:other},{id:other},{profileSettingsVersion:2},{password_hash:'secret'},{revision:'bad'},{company:'False acknowledgement'},{phone:42}]){
    globalThis.fetch=async()=>new Response(JSON.stringify({...billing,...patch}),{headers:{'Content-Type':'application/json'}});await assert.rejects(()=>api.updateMe({company:'Typed company'},owner));
  }
  globalThis.fetch=originalFetch;
  const before=(await pool.query('SELECT name,company,password_hash FROM users WHERE id=$1',[owner])).rows[0];await pool.query("ALTER TABLE users DROP COLUMN website,DROP COLUMN bio; ALTER TABLE group_membership_history DROP COLUMN operation_context; DROP TABLE group_application_mail,group_applications; ALTER TABLE notifications DROP COLUMN action_url; DELETE FROM schema_migrations WHERE version='0028_group_application_workflow'; DELETE FROM schema_migrations WHERE version='0027_required_company_billing'; DELETE FROM schema_migrations WHERE version='0026_open_normal_registration'; DELETE FROM schema_migrations WHERE version='0025_membership_operation_context'; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'");assert.deepEqual((await applyVersionedSchema()).applied,['0023_self_profile_fields','0024_group_meeting_attendance','0025_membership_operation_context','0026_open_normal_registration','0027_required_company_billing','0028_group_application_workflow']);assert.equal((await applyVersionedSchema()).applied.length,0);assert.deepEqual((await pool.query('SELECT name,company,password_hash FROM users WHERE id=$1',[owner])).rows[0],before);
  console.log('Self profile PASS: fresh26/repeat0/22upgrade, actual Express/PG17/TS, owner-only minimal DTO, partial save and clear, billing compatibility, URL/length/type/protected-field validation, 8-way stale CAS, safe replay, transaction rollback/redaction, private visibility and false ACK guards. No live writes/mail/payment.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Self profile contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
