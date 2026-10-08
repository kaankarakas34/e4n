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
const container = `e4n-shuffle-workspace-${randomUUID().slice(0, 8)}`;
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










  await pool.query("DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'");
  assert.deepEqual((await applyVersionedSchema()).applied,['0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification']);assert.equal((await applyVersionedSchema()).applied.length,0);
  const [admin,member,other,pending,deleted]=Array.from({length:5},()=>randomUUID());
  for(const [id,role,status] of [[admin,'ADMIN','ACTIVE'],[member,'MEMBER','ACTIVE'],[other,'MEMBER','ACTIVE'],[pending,'MEMBER','PENDING']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,account_status) VALUES($1,$2,$2,$2,'private_secret',$3,$4)",[id,id+'@example.invalid',role,status]);
  const [a,b]=[randomUUID(),randomUUID()];
  await pool.query("UPDATE users SET name='Fixture '||id::text,profession=id::text");
  await pool.query("INSERT INTO groups(id,name,status) VALUES($1,'A','ACTIVE'),($2,'B','DRAFT')",[a,b]);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$3,'ACTIVE'),($2,$3,'REQUESTED')",[member,other,a]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const token=id=>jwt.sign({id,role:'ADMIN'},process.env.JWT_SECRET);
  const call=(id=admin,query='')=>fetch(base+'/api/admin/shuffle-workspace'+query,{headers:id?{Authorization:'Bearer '+token(id)}:{}});
  const save=(assignments,expectedRevision,id=admin)=>fetch(base+'/api/shuffle/save',{method:'POST',headers:{Authorization:'Bearer '+token(id),'Content-Type':'application/json'},body:JSON.stringify({assignments,expectedRevision})});
  const historyCall=(id=admin,suffix='')=>fetch(base+'/api/admin/shuffle-history'+suffix,{headers:id?{Authorization:'Bearer '+token(id)}:{}});
  assert.deepEqual((await(await historyCall()).json()).executions,[]);
  const first=await call();assert.equal(first.status,200);assert.match(first.headers.get('cache-control'),/private.*no-store/);const snapshot=await first.json();assert.equal(snapshot.groups.length,2);assert.equal(snapshot.memberships.length,1);assert.equal(snapshot.historyAvailable,false);assert.match(snapshot.revision,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(snapshot).includes('private_secret'));assert.ok(!JSON.stringify(snapshot).includes('@example.invalid'));
  for(const [id,expected] of [[null,401],[deleted,401],[member,403]])assert.equal((await call(id)).status,expected);
  assert.equal((await call(admin,'?owner='+member)).status,400);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call()).status,403);assert.equal((await save({[b]:[member]},snapshot.revision)).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const transport='data:text/javascript;base64,'+Buffer.from('export const referralTransport={get:async()=>('+JSON.stringify(snapshot)+')};').toString('base64');
  const code=readFileSync(path.join(serverDir,'../src/api/shuffleWorkspace.ts'),'utf8').replace("from './api'","from '"+transport+"'");
  const {validShuffleWorkspace,currentDistribution,shuffleWorkspaceApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(code)).toString('base64'));
  assert.equal((await shuffleWorkspaceApi.read(admin)).ownerId,admin);
  const distribution=currentDistribution(snapshot);assert.deepEqual(distribution.items[a],[member]);assert.deepEqual(distribution.items[b],[]);assert.deepEqual(distribution.items.unassigned,[other]);assert.equal(distribution.excluded,2);assert.equal(distribution.ambiguous,0);
  for(const bad of [{...snapshot,ownerId:member},{...snapshot,revision:'bad'},{...snapshot,historyAvailable:true},{...snapshot,members:[...snapshot.members,snapshot.members[0]]},{...snapshot,memberships:[{group_id:randomUUID(),user_id:member,role:null}]}])assert.equal(validShuffleWorkspace(bad,admin),false);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE')",[member,b]);const multi=await(await call()).json();assert.equal(currentDistribution(multi).ambiguous,1);assert.deepEqual(currentDistribution(multi).items[b],[member]);
  const before=await pool.query('SELECT group_id,user_id,status,role,joined_at FROM group_members ORDER BY group_id,user_id');
  const stale=await save({[b]:[member,other]},snapshot.revision);assert.equal(stale.status,409);assert.equal((await stale.json()).code,'SHUFFLE_STALE');assert.deepEqual((await pool.query('SELECT group_id,user_id,status,role,joined_at FROM group_members ORDER BY group_id,user_id')).rows,before.rows);
  assert.equal((await save({[b]:[member]},'bad')).status,400);
  const revision=multi.revision;const saved=await save({[a]:[],[b]:[member,other]},revision);assert.equal(saved.status,200);assert.equal((await saved.json()).success,true);assert.equal((await pool.query("SELECT count(*)::int AS n FROM group_members WHERE status='ACTIVE' AND group_id=$1",[b])).rows[0].n,2);
  // Replaying the old web revision never commits a second write.
  assert.equal((await save({[a]:[],[b]:[member,other]},revision)).status,409);
  const fresh=await(await call()).json();const userChange=fresh.revision;
  await pool.query("UPDATE users SET account_status='PENDING' WHERE id=$1",[other]);assert.equal((await save({[b]:[member,other]},userChange)).status,409);
  const raceRevision=(await(await call()).json()).revision;
  const race=await Promise.all([save({[a]:[member],[b]:[]},raceRevision),save({[a]:[member],[b]:[]},raceRevision)]);
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
  const sameRevision=(await(await call()).json()).revision;
  assert.equal((await save({[a]:[member],[b]:[]},sameRevision)).status,200);
  assert.equal((await save({[a]:[member],[b]:[]},sameRevision)).status,409,'Same placement replay must also reject its old revision');
  const list=await historyCall();assert.match(list.headers.get('cache-control'),/private.*no-store/);const history=await list.json();assert.equal(history.executions.length,3);
  const firstExecution=(await pool.query('SELECT * FROM shuffle_execution_history ORDER BY applied_at,id LIMIT 1')).rows[0];
  const detailResponse=await historyCall(admin,'/'+firstExecution.id),detail=await detailResponse.json();assert.equal(detail.execution.id,firstExecution.id);assert.equal(detail.execution.before_snapshot.memberships.length,3);assert.equal(detail.execution.after_snapshot.memberships.filter(m=>m.status==='ACTIVE').length,2);assert.equal(detail.execution.expected_revision,revision);assert.equal(detail.execution.member_count,2);assert.ok(!JSON.stringify(detail).includes('private_secret'));assert.ok(!JSON.stringify(detail).includes('@example.invalid'));
  for(const [id,status] of [[null,401],[deleted,401],[member,403]]){assert.equal((await historyCall(id)).status,status);assert.equal((await historyCall(id,'/'+firstExecution.id)).status,status);}
  assert.equal((await historyCall(admin,'?owner='+member)).status,400);assert.equal((await historyCall(admin,'/bad')).status,400);assert.equal((await historyCall(admin,'/'+randomUUID())).status,404);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await historyCall()).status,403);assert.equal((await historyCall(admin,'/'+firstExecution.id)).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  await assert.rejects(pool.query('UPDATE shuffle_execution_history SET actor_name=$1 WHERE id=$2',['tamper',firstExecution.id]),e=>e.code==='23514');await assert.rejects(pool.query('DELETE FROM shuffle_execution_history WHERE id=$1',[firstExecution.id]),e=>e.code==='23514');await assert.rejects(pool.query('TRUNCATE shuffle_execution_history'),e=>e.code==='23514');
  for(const role of ['anon','authenticated']){await pool.query('CREATE ROLE '+role);assert.equal((await pool.query("SELECT has_table_privilege($1,'shuffle_execution_history','SELECT') allowed",[role])).rows[0].allowed,false);}
  assert.equal((await pool.query("SELECT relrowsecurity FROM pg_class WHERE oid='shuffle_execution_history'::regclass")).rows[0].relrowsecurity,true);
  const beforeFailure=(await pool.query('SELECT group_id,user_id,status,role,joined_at FROM group_members ORDER BY group_id,user_id')).rows,usersBefore=(await pool.query('SELECT id,role FROM users ORDER BY id')).rows;
  await pool.query("CREATE FUNCTION fail_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'history outage'; END $$; CREATE TRIGGER fail_history BEFORE INSERT ON shuffle_execution_history FOR EACH ROW EXECUTE FUNCTION fail_history()");
  const currentRevision=(await(await call()).json()).revision;assert.equal((await save({[b]:[member,other]},currentRevision)).status,500);assert.deepEqual((await pool.query('SELECT group_id,user_id,status,role,joined_at FROM group_members ORDER BY group_id,user_id')).rows,beforeFailure);assert.deepEqual((await pool.query('SELECT id,role FROM users ORDER BY id')).rows,usersBefore);assert.equal((await pool.query('SELECT count(*)::int n FROM shuffle_execution_history')).rows[0].n,3);
  await pool.query('DROP TRIGGER fail_history ON shuffle_execution_history; DROP FUNCTION fail_history()');assert.equal((await save({[b]:[member,other]},currentRevision)).status,200);assert.equal((await pool.query('SELECT count(*)::int n FROM shuffle_execution_history')).rows[0].n,4);
  assert.deepEqual((await historyCall(admin,'/'+firstExecution.id).then(r=>r.json())).execution.before_snapshot,firstExecution.before_snapshot);
  const historyCode=readFileSync(path.join(serverDir,'../src/api/shuffleHistory.ts'),'utf8').replace("from './api'","from '"+transport+"'");const {validHistory,validExecution,executionChanges}=await import('data:text/javascript;base64,'+Buffer.from(compile(historyCode)).toString('base64'));
  assert.equal(validHistory(history,admin),true);assert.equal(validHistory({...history,ownerId:member},admin),false);assert.equal(validHistory({...history,executions:[null]},admin),false);assert.equal(validExecution(detail.execution,true),true);assert.equal(validExecution({...detail.execution,member_count:99},true),false);assert.ok(executionChanges(detail.execution).some(m=>m.id===member));
  const {distributeMembers}=await import('data:text/javascript;base64,'+Buffer.from(compile(readFileSync(path.join(serverDir,'../src/utils/shuffleAlgorithm.ts'),'utf8'))).toString('base64'));
  const many=Array.from({length:71},(_,i)=>({id:String(i),name:String(i),full_name:String(i),profession:String(i)}));const draft=distributeMembers(many,[{id:a,name:'A'},{id:b,name:'B'}],{},[],{respectLocks:true,minimizeOverlap:false,maxAttempts:1});assert.equal(draft[a].length,35);assert.equal(draft[b].length,35);assert.equal(draft.unassigned.length,1);assert.equal(new Set(Object.values(draft).flat()).size,71);
  const lockDraft=distributeMembers(many.slice(0,3),[{id:a,name:'A'},{id:b,name:'B'}],{[a]:['0'],[b]:[]},['0'],{respectLocks:true,minimizeOverlap:false,maxAttempts:1});assert.ok(lockDraft[a].includes('0'));
  // Snapshot reads stay consistent if a separate writer changes a member during the read.
  const original=pool.connect.bind(pool),writer=await original();let changed=false;
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{const result=await q(sql,args);if(!changed&&typeof sql==='string'&&sql.startsWith('SELECT role,now()')){changed=true;await writer.query("UPDATE users SET name='Changed' WHERE id=$1",[member]);}return result;};c.release=()=>{c.query=q;c.release=release;release();};return c;};
  const consistent=await(await call()).json();pool.connect=original;writer.release();assert.notEqual(consistent.members.find(m=>m.id===member).full_name,'Changed');assert.equal((await(await call()).json()).members.find(m=>m.id===member).full_name,'Changed');assert.deepEqual((await historyCall(admin,'/'+firstExecution.id).then(r=>r.json())).execution.before_snapshot,firstExecution.before_snapshot);
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.startsWith('SELECT id,name,status FROM groups'))throw Object.assign(Error('isolated failure'),{code:'TEST'});return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};assert.equal((await call()).status,500);pool.connect=original;assert.equal((await call()).status,200);
  // A valid full 35+president group must shuffle without a transient capacity violation.
  const fullGroup=randomUUID(),pres=randomUUID(),fullMembers=Array.from({length:35},()=>randomUUID());
  await pool.query("INSERT INTO groups(id,name,status) VALUES($1,'Full group','ACTIVE')",[fullGroup]);
  for(const id of [pres,...fullMembers]){await pool.query("INSERT INTO users(id,name,email,profession,role,account_status) VALUES($1::uuid,'Full fixture',$2,$1::uuid::text,$3,'ACTIVE')",[id,id+'@example.invalid',id===pres?'PRESIDENT':'MEMBER']);await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE')",[id,fullGroup]);}
  const fullSave=await save({[fullGroup]:fullMembers,[a]:[pres],[b]:[member,other]});assert.equal(fullSave.status,200);const fullAck=await fullSave.json();assert.ok(fullAck.executionId);
  const fullHistory=(await historyCall(admin,'/'+fullAck.executionId).then(r=>r.json())).execution;assert.equal(fullHistory.member_count,38);assert.equal(fullHistory.before_snapshot.members.find(m=>m.id===pres).role,'PRESIDENT');assert.equal(fullHistory.after_snapshot.members.find(m=>m.id===pres).role,'MEMBER');assert.equal(fullHistory.expected_revision,null);assert.equal(fullHistory.after_snapshot.memberships.filter(m=>m.group_id===fullGroup&&m.status==='ACTIVE').length,35);
  console.log('Shuffle workspace/history PASS: isolated20/repeat0/18upgrade; immutable update/delete/truncate; atomic history outage rollback+retry; concurrent single ledger; authorized list/detail and snapshot preservation; actual ACTIVE membership/no invented history; owner/current-role/cache; DTO/duplicates/multigroup/unassigned; stale group/user/replay409 no mutation; save200; 35 capacity/71 unique/locks; consistent read; injected500 recovery.');
}
let exitCode=0;
try{await main();}catch(error){exitCode=1;console.error('Shuffle workspace contract failed:',error);}
finally{if(appServer)await new Promise(resolve=>appServer.close(resolve));if(pool)await pool.end();if(containerStarted){try{docker(['stop','--time','3',container],{timeout:15000});}catch(error){exitCode=1;console.error(error.message);}}}process.exit(exitCode);
