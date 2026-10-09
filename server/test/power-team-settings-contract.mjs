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
const container = `e4n-power-team-settings-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,27);
  assert.equal((await applyVersionedSchema()).applied.length,0);








  const [admin,member,deleted]=Array.from({length:3},()=>randomUUID());
  for(const [i,id,role] of [[0,admin,'ADMIN'],[1,member,'MEMBER']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$3,'Fixture','x',$4)",[id,`team-settings-${i}@example.invalid`,`Member ${i}`,role]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(method,p,body,owner=admin,role='ADMIN')=>fetch(base+'/api'+p,{method,headers:{'Content-Type':'application/json',...(owner?{Authorization:`Bearer ${token(owner,role)}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const id=randomUUID(),payload={id,name:'Created guild',description:'Fixture description',visitor_email_subject:'Fixture subject',visitor_email_template:'<p>Fixture template</p>'};
  const batch=await Promise.all(Array.from({length:8},()=>call('POST','/power-teams',payload)));
  assert.equal(batch.filter(r=>r.status===201).length,1);assert.equal(batch.filter(r=>r.status===200).length,7);const created=await batch[0].json();assert.equal(created.id,id);assert.equal(created.ownerId,admin);assert.equal(created.status,'ACTIVE');
  assert.equal((await pool.query('SELECT count(*)::int n FROM power_teams WHERE id=$1',[id])).rows[0].n,1);
  assert.equal((await call('POST','/power-teams',{...payload,name:'Changed content'})).status,409);
  assert.equal((await call('POST','/power-teams',{id:randomUUID(),name:payload.name})).status,409);
  await pool.query("UPDATE power_teams SET status='DRAFT',description=$2,visitor_email_template=$3 WHERE id=$1",[id,'  '+payload.description+'  ','\n'+payload.visitor_email_template+'\n']);
  const edit=await call('PUT','/power-teams/'+id,{name:'Edited guild'});assert.equal(edit.status,200);assert.match(edit.headers.get('cache-control'),/private.*no-store/);const saved=await edit.json();assert.equal(saved.status,'DRAFT');assert.equal(saved.description,'  '+payload.description+'  ');assert.equal(saved.visitor_email_template,'\n'+payload.visitor_email_template+'\n');
  for(const bad of [{name:''},{name:123},{status:'CLOSED'},{unknown:'x'},{id:123},{description:'x'.repeat(10001)},[]])assert.equal((await call('PUT','/power-teams/'+id,bad)).status,400);
  assert.equal((await call('PUT','/power-teams/'+randomUUID(),{name:'Missing'})).status,404);
  assert.equal((await call('POST','/power-teams',{name:'Denied'},member)).status,403);
  assert.equal((await call('PUT','/power-teams/'+id,{name:'Denied'},member)).status,403);
  assert.equal((await call('POST','/power-teams',{name:'Denied'},null)).status,401);
  assert.equal((await call('POST','/power-teams',{name:'Deleted'},deleted)).status,401);
  const list=await call('GET','/admin/power-team-settings');assert.equal(list.status,200);const catalog=await list.json();assert.equal(catalog.ownerId,admin);assert.equal(catalog.teams[0].name,'Edited guild');assert.match(list.headers.get('cache-control'),/private.*no-store/);
  assert.equal((await call('GET','/admin/power-team-settings?userId='+member)).status,400);
  assert.equal((await call('GET','/admin/power-team-settings',undefined,member)).status,403);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call('PUT','/power-teams/'+id,{name:'Stale admin'})).status,403);assert.equal((await call('GET','/admin/power-team-settings')).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  await pool.query("CREATE FUNCTION fixture_deny_team_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture private failure'; END $$; CREATE TRIGGER fixture_team_update BEFORE UPDATE ON power_teams FOR EACH ROW EXECUTE FUNCTION fixture_deny_team_update()");
  const failed=await call('PUT','/power-teams/'+id,{name:'Must rollback'});assert.equal(failed.status,500);assert.ok(!(await failed.text()).includes('fixture private failure'));assert.equal((await pool.query('SELECT name FROM power_teams WHERE id=$1',[id])).rows[0].name,'Edited guild');await pool.query('DROP TRIGGER fixture_team_update ON power_teams; DROP FUNCTION fixture_deny_team_update()');
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};const {api}=await import('data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64'));
  assert.equal((await api.getAdminPowerTeamSettings(admin))[0].id,id);await assert.rejects(()=>api.getAdminPowerTeamSettings(member));
  const next=randomUUID();assert.equal((await api.createPowerTeam({id:next,name:'Typed guild'},admin)).id,next);assert.equal((await api.updatePowerTeam(id,{name:'  Typed edit  ',description:''},admin)).name,'Typed edit');assert.equal((await api.getAdminPowerTeamSettings(admin)).find(t=>t.id===id).description,null);
  const originalFetch=globalThis.fetch;
  const current=(await pool.query('SELECT id,name,description,status,visitor_email_subject,visitor_email_template,created_at FROM power_teams WHERE id=$1',[id])).rows[0];
  for(const patch of [{ownerId:member},{id:randomUUID()},{name:'False acknowledgement'},{description:123}]) {
    globalThis.fetch=async()=>new Response(JSON.stringify({...current,settingsVersion:1,ownerId:admin,...patch}),{headers:{'Content-Type':'application/json'}});
    await assert.rejects(()=>api.updatePowerTeam(id,{name:'Typed edit'},admin));
  }
  globalThis.fetch=originalFetch;
  await pool.query("INSERT INTO power_teams(name) SELECT 'Bound guild '||n FROM generate_series(1,999)n");assert.equal((await call('GET','/admin/power-team-settings')).status,503);
  console.log('Power team settings PASS: current DB ADMIN, 8 concurrent creates one row, replay/conflict/name collision, partial DRAFT/template preservation, validation, 404, rollback/redaction, owner-bound catalog/limit, actual typed TS transport; no memberships/mail/score side effects.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Power team settings contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
