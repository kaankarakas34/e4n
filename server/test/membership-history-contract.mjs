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
const container = `e4n-membership-history-${randomUUID().slice(0, 8)}`;
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











  const [admin,member,other,deleted,g1,g2]=Array.from({length:6},()=>randomUUID());
  for(const [id,role] of [[admin,'ADMIN'],[member,'MEMBER'],[other,'MEMBER']])await pool.query("INSERT INTO users(id,name,email,profession,role) VALUES($1,$2,$3,$4,$5)",[id,id===member?'History member':'History actor',id+'@example.invalid',id,role]);
  for(const [id,name] of [[g1,'Original group'],[g2,'Other group']])await pool.query("INSERT INTO groups(id,name,status) VALUES($1,$2,'ACTIVE')",[id,name]);
  await pool.query("INSERT INTO group_members(group_id,user_id,status) VALUES($1,$2,'REQUESTED')",[g1,member]);
  const count=async()=>Number((await pool.query('SELECT count(*)::int n FROM group_membership_history')).rows[0].n);
  assert.equal(await count(),1);await pool.query("UPDATE group_members SET status='REQUESTED' WHERE user_id=$1",[member]);assert.equal(await count(),1);
  await pool.query("UPDATE group_members SET status='ACTIVE',role='PRESIDENT' WHERE user_id=$1",[member]);assert.equal(await count(),2);
  await pool.query('UPDATE groups SET name=$1 WHERE id=$2',['Renamed group',g1]);
  await pool.query('DELETE FROM group_members WHERE user_id=$1',[member]);assert.equal(await count(),3);
  const deletedEvent=(await pool.query("SELECT * FROM group_membership_history WHERE operation='DELETE'")).rows[0];assert.equal(deletedEvent.before_state.status,'ACTIVE');assert.equal(deletedEvent.after_state,null);
  assert.equal((await pool.query("SELECT after_state->>'group_name' n FROM group_membership_history WHERE operation='INSERT'")).rows[0].n,'Original group');
  const prior=await count(),c=await pool.connect();await c.query('BEGIN');await c.query("INSERT INTO group_members(group_id,user_id,status) VALUES($1,$2,'REQUESTED')",[g1,member]);await c.query('ROLLBACK');c.release();assert.equal(await count(),prior);
  await pool.query("CREATE FUNCTION fail_membership_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'history unavailable'; END $$; CREATE TRIGGER fail_history BEFORE INSERT ON group_membership_history FOR EACH ROW EXECUTE FUNCTION fail_membership_history()");
  await assert.rejects(pool.query("INSERT INTO group_members(group_id,user_id,status) VALUES($1,$2,'REQUESTED')",[g1,member]));assert.equal((await pool.query('SELECT count(*)::int n FROM group_members WHERE user_id=$1',[member])).rows[0].n,0);assert.equal(await count(),prior);
  await pool.query('DROP TRIGGER fail_history ON group_membership_history; DROP FUNCTION fail_membership_history()');
  await pool.query("INSERT INTO group_members(group_id,user_id,status) VALUES($1,$2,'REQUESTED')",[g2,other]);
  await pool.query('UPDATE group_members SET user_id=$1 WHERE user_id=$2',[member,other]);
  const rekey=(await pool.query("SELECT * FROM group_membership_history WHERE operation='UPDATE' AND before_state IS NULL OR operation='UPDATE' AND after_state IS NULL")).rows;assert.equal(rekey.length,2);assert.ok(rekey.find(r=>r.user_id===other&&r.after_state===null));assert.ok(rekey.find(r=>r.user_id===member&&r.before_state===null));
  await pool.query('UPDATE group_members SET group_id=$1 WHERE user_id=$2',[g1,member]);const moved=(await pool.query("SELECT before_state,after_state FROM group_membership_history WHERE user_id=$1 ORDER BY recorded_at DESC,id DESC LIMIT 1",[member])).rows[0];assert.equal(moved.before_state.group_id,g2);assert.equal(moved.after_state.group_id,g1);await pool.query('UPDATE group_members SET group_id=$1 WHERE user_id=$2',[g2,member]);
  for(const query of ["UPDATE group_membership_history SET user_name='tamper'",'DELETE FROM group_membership_history','TRUNCATE group_membership_history','TRUNCATE group_members CASCADE'])await assert.rejects(pool.query(query),e=>e.code==='23514');
  assert.equal((await pool.query("SELECT relrowsecurity FROM pg_class WHERE oid='group_membership_history'::regclass")).rows[0].relrowsecurity,true);
  for(const role of ['anon','authenticated']){await pool.query('CREATE ROLE '+role);assert.equal((await pool.query("SELECT has_table_privilege($1,'group_membership_history','SELECT') ok",[role])).rows[0].ok,false);}
  // Actual 19-version upgrade seeds one observation, never invents old joins/removals.
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DROP TABLE group_application_mail,group_applications; ALTER TABLE notifications DROP COLUMN action_url; DELETE FROM schema_migrations WHERE version='0028_group_application_workflow'; DELETE FROM schema_migrations WHERE version='0027_required_company_billing'; DELETE FROM schema_migrations WHERE version='0026_open_normal_registration'; DELETE FROM schema_migrations WHERE version='0025_membership_operation_context'; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'");
  assert.deepEqual((await applyVersionedSchema()).applied,['0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields','0024_group_meeting_attendance','0025_membership_operation_context','0026_open_normal_registration','0027_required_company_billing','0028_group_application_workflow']);assert.equal((await applyVersionedSchema()).applied.length,0);assert.equal(await count(),1);for(const role of ['anon','authenticated'])assert.equal((await pool.query("SELECT has_function_privilege($1,'e4n_capture_membership_history()','EXECUTE') ok",[role])).rows[0].ok,false);assert.equal((await pool.query('SELECT operation FROM group_membership_history')).rows[0].operation,'BASELINE');
  for(let i=0;i<105;i++)await pool.query('UPDATE group_members SET joined_at=$1 WHERE user_id=$2',[new Date(1700000000000+i),member]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const call=(url,id=member)=>fetch(base+'/api'+url,{headers:id?{Authorization:'Bearer '+jwt.sign({id,role:'ADMIN'},process.env.JWT_SECRET)}:{}});
  const response=await call('/membership-history');assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private.*no-store/);const data=await response.json();assert.equal(data.total,106);assert.equal(data.events.length,50);assert.ok(data.next);assert.ok(data.events.every(e=>e.user_id===member));assert.ok(!JSON.stringify(data).includes('password_hash'));
  const pages=[...data.events];let next=data.next;while(next){const d=await call('/membership-history?'+new URLSearchParams(next)).then(r=>r.json());pages.push(...d.events);next=d.next;}assert.equal(pages.length,106);assert.equal(new Set(pages.map(e=>e.id)).size,106);
  assert.equal((await call('/membership-history',null)).status,401);assert.equal((await call('/membership-history',deleted)).status,401);assert.equal((await call('/membership-history?userId='+other)).status,400);assert.equal((await call('/membership-history?beforeAt=bad&beforeId='+member)).status,400);assert.equal((await call('/membership-history?beforeAt='+data.next.beforeAt)).status,400);
  assert.equal((await call('/admin/membership-history/'+other)).status,403);assert.equal((await call('/admin/membership-history/bad',admin)).status,400);assert.equal((await call('/admin/membership-history/'+member,admin).then(r=>r.json())).total,106);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call('/admin/membership-history/'+member,admin)).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const transport='data:text/javascript;base64,'+Buffer.from('export const referralTransport={get:async()=>('+JSON.stringify(data)+')};').toString('base64');const code=readFileSync(path.join(serverDir,'../src/api/membershipHistory.ts'),'utf8').replace("from './api'","from '"+transport+"'");const {validHistory,membershipHistoryApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(code)).toString('base64'));assert.equal(validHistory(data,member,member),true);assert.equal((await membershipHistoryApi.read(member)).total,106);
  for(const bad of [{...data,ownerId:other},{...data,targetId:other},{...data,events:[null]},{...data,events:[data.events[0],data.events[0]]},{...data,next:{beforeAt:data.next.beforeAt,beforeId:other}},{...data,events:[{...data.events[0],user_id:other}]},{...data,events:[{...data.events[0],before_state:null,after_state:null}]}])assert.equal(validHistory(bad,member,member),false);
  const original=pool.connect.bind(pool),writer=await original();let wrote=false;
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{const r=await q(sql,args);if(!wrote&&typeof sql==='string'&&sql.startsWith('SELECT role,now()')){wrote=true;await writer.query('UPDATE group_members SET joined_at=now() WHERE user_id=$1',[member]);}return r;};c.release=()=>{c.query=q;c.release=release;release();};return c;};
  assert.equal((await call('/membership-history').then(r=>r.json())).total,106);pool.connect=original;writer.release();assert.equal((await call('/membership-history').then(r=>r.json())).total,107);
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('FROM group_membership_history'))throw Error('secret never_expose');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};const fail=await call('/membership-history');assert.equal(fail.status,500);assert.ok(!JSON.stringify(await fail.json()).includes('never_expose'));pool.connect=original;assert.equal((await call('/membership-history')).status,200);
  await pool.query('DELETE FROM groups WHERE id=$1',[g2]);assert.equal((await pool.query('SELECT count(*)::int n FROM group_members WHERE group_id=$1',[g2])).rows[0].n,0);assert.equal(await count(),108);assert.equal((await call('/membership-history').then(r=>r.json())).events[0].operation,'DELETE');
  await pool.query('DELETE FROM users WHERE id=$1',[member]);assert.equal((await call('/membership-history')).status,401);assert.equal((await call('/admin/membership-history/'+member,admin).then(r=>r.json())).total,108);

  // Upgrade an existing24 ledger without attributing any earlier change.
  const priorLedger=JSON.stringify((await pool.query('SELECT id,user_id,operation,recorded_at,before_state,after_state FROM group_membership_history ORDER BY id')).rows);
  await pool.query("ALTER TABLE group_membership_history DROP COLUMN operation_context; DROP TABLE group_application_mail,group_applications; ALTER TABLE notifications DROP COLUMN action_url; DELETE FROM schema_migrations WHERE version='0028_group_application_workflow'; DELETE FROM schema_migrations WHERE version='0027_required_company_billing'; DELETE FROM schema_migrations WHERE version='0026_open_normal_registration'; DELETE FROM schema_migrations WHERE version='0025_membership_operation_context'");
  assert.deepEqual((await applyVersionedSchema()).applied,['0025_membership_operation_context','0026_open_normal_registration','0027_required_company_billing','0028_group_application_workflow']);assert.equal((await applyVersionedSchema()).applied.length,0);
  assert.equal(JSON.stringify((await pool.query('SELECT id,user_id,operation,recorded_at,before_state,after_state FROM group_membership_history ORDER BY id')).rows),priorLedger);
  assert.equal((await pool.query('SELECT count(*)::int n FROM group_membership_history WHERE operation_context IS NOT NULL')).rows[0].n,0);
  const triggerConfig=(await pool.query("SELECT prosecdef,proconfig FROM pg_proc WHERE oid='e4n_capture_membership_history()'::regprocedure")).rows[0];assert.equal(triggerConfig.prosecdef,false);assert.ok(triggerConfig.proconfig.some(x=>x.includes('search_path=pg_catalog, public')));
  for(const role of ['anon','authenticated'])assert.equal((await pool.query("SELECT has_function_privilege($1,'e4n_capture_membership_history()','EXECUTE') ok",[role])).rows[0].ok,false);

  // Technical provenance on every mounted membership writer, using real JWT/API/PG.
  const traceMember=randomUUID(),tracePresident=randomUUID(),traceVictim=randomUUID();
  for(const [id,name,role] of [[traceMember,'Trace Member','MEMBER'],[tracePresident,'Trace President','PRESIDENT'],[traceVictim,'Trace Victim','MEMBER']])await pool.query("INSERT INTO users(id,name,email,profession,role,account_status) VALUES($1::uuid,$2,$3,$1::text,$4,'ACTIVE')",[id,name,id+'@example.invalid',role]);
  const traceGroups=Array.from({length:6},()=>randomUUID());for(const id of traceGroups)await pool.query("INSERT INTO groups(id,name,status) VALUES($1::uuid,$1::text,'ACTIVE')",[id]);
  const [traceGroup,transferGroup,roleGroup,shuffleGroup,deleteGroup,unknownGroup]=traceGroups;
  const write=(url,actor,body={},method='POST')=>fetch(base+'/api'+url,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({id:actor,role:'ADMIN'},process.env.JWT_SECRET)},body:JSON.stringify(body)});
  const history=async id=>(await pool.query('SELECT * FROM group_membership_history WHERE user_id=$1 ORDER BY recorded_at,id',[id])).rows;
  const last=async id=>(await history(id)).at(-1);
  const mutation=(actorId,action,row)=>{assert.equal(row.operation_context.actorId,actorId);assert.equal(row.operation_context.action,action);assert.match(row.operation_context.operationId,/^[0-9a-f-]{36}$/);return row.operation_context;};
  await pool.query("INSERT INTO group_members(group_id,user_id,status,role) VALUES($1,$2,'ACTIVE','PRESIDENT')",[traceGroup,tracePresident]);assert.equal((await last(tracePresident)).operation_context,null);
  await pool.query("UPDATE users SET subscription_plan='1_MONTH',subscription_end_date=now()+interval '1 month' WHERE id=$1",[traceMember]);
  assert.equal((await write('/groups/'+traceGroup+'/join',traceMember)).status,200);mutation(traceMember,'APPLICATION',await last(traceMember));
  assert.equal((await write('/groups/'+traceGroup+'/join',traceMember,{actorId:admin})).status,400);
  const countBeforeReplay=(await history(traceMember)).length;assert.equal((await write('/groups/'+traceGroup+'/join',traceMember)).status,200);assert.equal((await history(traceMember)).length,countBeforeReplay);

  const memberUrl='/groups/'+traceGroup+'/members/'+traceMember;
  assert.equal((await write(memberUrl,traceVictim,{status:'ACTIVE'},'PUT')).status,403);
  assert.equal((await write(memberUrl,tracePresident,{status:'ACTIVE',actorId:admin},'PUT')).status,400);
  assert.equal((await write(memberUrl,tracePresident,{status:'ACTIVE'},'PUT')).status,409);
  const application=(await pool.query('SELECT id FROM group_applications WHERE group_id=$1 AND user_id=$2',[traceGroup,traceMember])).rows[0];
  assert.equal((await write('/group-applications/'+application.id+'/interview',tracePresident,{note:'Synthetic interview'})).status,200);
  assert.equal((await write('/group-applications/'+application.id+'/decision',tracePresident,{note:'Synthetic acceptance',decision:'ACCEPTED'})).status,200);mutation(tracePresident,'MEMBER_STATUS',await last(traceMember));
  assert.equal((await write(memberUrl,tracePresident,{},'DELETE')).status,200);const removed=mutation(tracePresident,'MEMBER_REMOVAL',await last(traceMember));assert.equal(removed.actorName,'Trace President');
  await pool.query("UPDATE users SET name='Renamed Trace President' WHERE id=$1",[tracePresident]);assert.equal((await last(traceMember)).operation_context.actorName,'Trace President');
  assert.equal((await write(memberUrl,tracePresident,{},'DELETE')).status,404);
  assert.equal((await write('/groups/'+traceGroup+'/join',traceMember)).status,200);
  assert.equal((await write(memberUrl,admin,{status:'ACTIVE'},'PUT')).status,404);
  assert.equal((await write('/admin/assign-role',admin,{userId:traceMember,role:'MEMBER',type:'GROUP',contextId:traceGroup})).status,200);
  assert.equal((await write('/admin/move-member',admin,{userId:traceMember,groupId:transferGroup})).status,200);
  const transfer=(await history(traceMember)).filter(row=>row.operation_context?.action==='MEMBER_TRANSFER');assert.equal(transfer.length,2);assert.equal(transfer[0].operation_context.operationId,transfer[1].operation_context.operationId);for(const row of transfer)mutation(admin,'MEMBER_TRANSFER',row);
  assert.equal((await write('/admin/assign-role',admin,{userId:traceMember,role:'MEMBER',type:'GROUP',contextId:roleGroup})).status,200);mutation(admin,'ROLE_ASSIGNMENT',await last(traceMember));
  for(const url of ['/shuffle/save','/admin/shuffle/save']){assert.equal((await write(url,admin,{assignments:{[shuffleGroup]:[traceMember]}})).status,200);mutation(admin,'SHUFFLE',await last(traceMember));}
  await pool.query("INSERT INTO group_members(group_id,user_id,status) VALUES($1,$2,'REQUESTED')",[deleteGroup,traceVictim]);
  assert.equal((await write('/groups/'+deleteGroup,traceMember,{},'DELETE')).status,403);
  assert.equal((await write('/groups/'+deleteGroup,admin,{},'DELETE')).status,200);mutation(admin,'GROUP_DELETION',await last(traceVictim));
  assert.equal((await write('/groups/'+deleteGroup,admin,{},'DELETE')).status,404);
  const beforeDeniedDelete=(await history(traceMember)).length;await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);
  assert.equal((await write('/admin/members/'+traceMember,admin,{},'DELETE')).status,403);assert.equal((await history(traceMember)).length,beforeDeniedDelete);assert.equal((await pool.query('SELECT id FROM users WHERE id=$1',[traceMember])).rowCount,1);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  assert.equal((await write('/admin/members/'+traceMember,admin,{},'DELETE')).status,200);mutation(admin,'USER_DELETION',await last(traceMember));
  await pool.query("INSERT INTO group_members(group_id,user_id,status) VALUES($1,$2,'REQUESTED')",[unknownGroup,traceVictim]);
  assert.equal((await write('/users/'+traceVictim,admin,{},'DELETE')).status,404); // Unmounted legacy users router.
  assert.equal((await last(traceVictim)).operation_context,null);
  assert.equal((await write('/admin/members/'+traceVictim,admin,{},'DELETE')).status,200);mutation(admin,'USER_DELETION',await last(traceVictim));
  const retained=await call('/admin/membership-history/'+traceMember,admin).then(r=>r.json());assert.ok(retained.events.some(row=>row.operation_context?.action==='USER_DELETION'));assert.ok(validHistory(retained,admin,traceMember));
  const ownerTrace=await call('/membership-history',tracePresident).then(r=>r.json());assert.ok(validHistory(ownerTrace,tracePresident,tracePresident));assert.ok(ownerTrace.events.every(row=>row.user_id===tracePresident));
  assert.equal(validHistory({...retained,events:[{...retained.events[0],operation_context:{actorId:'bad',actorName:'fake',action:'SHUFFLE',operationId:randomUUID()}}]},admin,traceMember),false);
  // A single reused pool connection must lose provenance at both commit and rollback.
  const {setMembershipOperationContext}=await import('../src/membership-operation-context.js');const traceConnection=await pool.connect();
  try{
    await traceConnection.query('BEGIN');await setMembershipOperationContext(traceConnection,admin,'MEMBER_STATUS');await traceConnection.query("UPDATE group_members SET joined_at=now() WHERE user_id=$1",[tracePresident]);await traceConnection.query('COMMIT');
    assert.equal((await traceConnection.query("SELECT NULLIF(current_setting('e4n.membership_context',true),'') value")).rows[0].value,null);
    await traceConnection.query("UPDATE group_members SET joined_at=now() WHERE user_id=$1",[tracePresident]);assert.equal((await last(tracePresident)).operation_context,null);
    const beforeFailure=(await history(tracePresident)).length;await traceConnection.query('BEGIN');
    await traceConnection.query("SELECT set_config('e4n.membership_context',$1,true)",[JSON.stringify({actorId:'invalid',actorName:'fake',action:'MEMBER_STATUS',operationId:randomUUID()})]);
    await assert.rejects(traceConnection.query("UPDATE group_members SET joined_at=now() WHERE user_id=$1",[tracePresident]),e=>e.code==='23514');await traceConnection.query('ROLLBACK');assert.equal((await history(tracePresident)).length,beforeFailure);
    assert.equal((await traceConnection.query("SELECT NULLIF(current_setting('e4n.membership_context',true),'') value")).rows[0].value,null);
    await traceConnection.query('BEGIN');await setMembershipOperationContext(traceConnection,admin,'MEMBER_STATUS');await traceConnection.query("UPDATE group_members SET joined_at=now() WHERE user_id=$1",[tracePresident]);await traceConnection.query('ROLLBACK');assert.equal((await history(tracePresident)).length,beforeFailure);
    await assert.rejects(setMembershipOperationContext(traceConnection,randomUUID(),'MEMBER_STATUS'),e=>e.status===401);
  }finally{await traceConnection.query('ROLLBACK').catch(()=>{});traceConnection.release();}
  console.log('Membership operation context PASS: all mounted application/status/removal/transfer/role/shuffle/group+user deletion writers; snapshot preservation, owner/admin DTO, no-op, forged-body/current-role denial, same-operation transfer, local commit/rollback isolation and malformed context atomic rollback.');

  console.log('Membership history PASS: fresh26/repeat0/19upgrade, truthful baseline, atomic insert/update/delete+rollback+outage, no-op replay, rename and cascading delete survival, identity reassignment owner separation, immutable/ACL/RLS/truncate, real JWT/admin/current-role/owner, 106 rows microsecond keyset paging, DTO/error recovery, no live writes/providers.');
}

let exitCode=0;
try{await main();}catch(error){exitCode=1;console.error('Membership history contract failed:',error);}
finally{if(appServer)await new Promise(resolve=>appServer.close(resolve));if(pool)await pool.end();if(containerStarted){try{docker(['stop','--time','3',container],{timeout:15000});}catch(error){exitCode=1;console.error(error.message);}}}process.exit(exitCode);
