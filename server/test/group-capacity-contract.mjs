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
const container = `e4n-group-capacity-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,24);
  assert.equal((await applyVersionedSchema()).applied.length,0);










  const user=async(role='MEMBER')=>{const id=randomUUID();await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,account_status) VALUES($1::uuid,$2,$2,$1::text,'fixture',$3,'ACTIVE')",[id,id+'@example.invalid',role]);return id;};
  const group=async()=>{const id=randomUUID();await pool.query('INSERT INTO groups(id,name) VALUES($1::uuid,$1::text)',[id]);return id;};
  const add=(id,g,status='ACTIVE')=>pool.query('INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,$3)',[id,g,status]);
  const admin=await user('ADMIN'),ordinary=await user(),president=await user('PRESIDENT'),g=await group(),source=await group();
  await add(president,g);for(let i=0;i<34;i++)await add(await user(),g);
  const candidates=[await user(),await user()];for(const id of candidates)await add(id,g,'REQUESTED');
  // Existing 0014-style data upgrades without role or status backfills.
  const beforeUpgrade=JSON.stringify((await pool.query('SELECT id,user_id,group_id,status,role,joined_at FROM group_members ORDER BY id')).rows);
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check; ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK(status IN('ACTIVE','REQUESTED')); ALTER TABLE users DROP COLUMN group_title; DELETE FROM schema_migrations WHERE version='0015_group_membership_state'");
  assert.deepEqual((await applyVersionedSchema()).applied,['0015_group_membership_state','0016_group_capacity_invariant','0017_subscription_reminder_delivery','0018_web_job_runs','0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields','0024_group_meeting_attendance']);assert.equal((await applyVersionedSchema()).applied.length,0);
  assert.equal(JSON.stringify((await pool.query('SELECT id,user_id,group_id,status,role,joined_at FROM group_members ORDER BY id')).rows),beforeUpgrade);
  // A legacy unknown status fails validation atomically, preserving the row and constraint.
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check; ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK(status IN('ACTIVE','REQUESTED','OTHER')); DELETE FROM schema_migrations WHERE version='0015_group_membership_state'");
  await pool.query("UPDATE group_members SET status='OTHER' WHERE user_id=$1 AND group_id=$2",[candidates[0],g]);
  await assert.rejects(applyVersionedSchema(),e=>e.code==='23514');
  assert.equal((await pool.query('SELECT status FROM group_members WHERE user_id=$1 AND group_id=$2',[candidates[0],g])).rows[0].status,'OTHER');
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM schema_migrations WHERE version='0015_group_membership_state'")).rows[0].n,0);
  await pool.query("UPDATE group_members SET status='REQUESTED' WHERE user_id=$1 AND group_id=$2",[candidates[0],g]);
  assert.deepEqual((await applyVersionedSchema()).applied,['0015_group_membership_state','0016_group_capacity_invariant','0017_subscription_reminder_delivery','0018_web_job_runs','0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields','0024_group_meeting_attendance']);
  // The database invariant refuses to install over ambiguous legacy capacity data.
  const invalidGroup=await group(),legacyPresidents=[await user('PRESIDENT'),await user('PRESIDENT')];
  await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER users_group_capacity_write ON users; DROP TRIGGER group_members_capacity_write ON group_members; DROP FUNCTION e4n_check_user_group_capacity_write(); DROP FUNCTION e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'");
  for(const id of legacyPresidents)await add(id,invalidGroup);
  await assert.rejects(applyVersionedSchema(),e=>e.code==='23514'&&e.constraint==='group_members_capacity_existing_data');
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM schema_migrations WHERE version='0016_group_capacity_invariant'")).rows[0].n,0);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[legacyPresidents[1]]);
  assert.deepEqual((await applyVersionedSchema()).applied,['0016_group_capacity_invariant','0017_subscription_reminder_delivery','0018_web_job_runs','0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields','0024_group_meeting_attendance']);
  const {default:nodemailer}=await import('nodemailer');nodemailer.createTransport=()=>({sendMail:async()=>{throw Error('No real mail permitted');}});
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port+'/api';
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(url,body,actor=admin,method='POST')=>fetch(base+url,{method,headers:{'Content-Type':'application/json',...(actor?{Authorization:'Bearer '+token(actor)}:{})},body:JSON.stringify(body)});
  const approve=(id,actor=admin,status='ACTIVE')=>call(`/groups/${g}/members/${id}`,{status},actor,'PUT');
  const race=await Promise.all(candidates.map(id=>approve(id)));assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
  const rejected=race.findIndex(r=>r.status===409);assert.equal((await race[rejected].json()).code,'GROUP_CAPACITY_FULL');
  const winner=candidates[1-rejected],loser=candidates[rejected];assert.equal((await approve(winner)).status,200);
  assert.equal((await call(`/groups/${g}/join`,{},winner)).status,200);
  assert.equal((await pool.query('SELECT status FROM group_members WHERE user_id=$1 AND group_id=$2',[winner,g])).rows[0].status,'ACTIVE');
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM group_members WHERE group_id=$1 AND status='ACTIVE'",[g])).rows[0].n,36);
  await assert.rejects(pool.query("UPDATE group_members SET status='ACTIVE' WHERE user_id=$1 AND group_id=$2",[loser,g]),
    e=>e.code==='23514'&&e.constraint==='group_members_capacity_check');
  assert.equal((await pool.query('SELECT status FROM group_members WHERE user_id=$1 AND group_id=$2',[loser,g])).rows[0].status,'REQUESTED');
  await assert.rejects(pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[president]),
    e=>e.code==='23514'&&e.constraint==='group_members_capacity_check');
  assert.equal((await pool.query('SELECT role FROM users WHERE id=$1',[president])).rows[0].role,'PRESIDENT');
  assert.equal((await approve(loser,null)).status,401);assert.equal((await approve(loser,ordinary)).status,403);assert.equal((await approve(loser,admin,'INVALID')).status,400);
  const outsider=await user('PRESIDENT');assert.equal((await approve(loser,outsider)).status,403);
  // A forged ADMIN claim is checked against the current database actor.
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await approve(loser)).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const moved=await user();await add(moved,source);let r=await call('/admin/move-member',{userId:moved,groupId:g});assert.equal(r.status,409);assert.equal((await r.json()).code,'GROUP_CAPACITY_FULL');
  assert.equal((await pool.query('SELECT status FROM group_members WHERE user_id=$1 AND group_id=$2',[moved,source])).rows[0].status,'ACTIVE');
  const destination=await group();assert.equal((await call('/admin/move-member',{userId:moved,groupId:destination})).status,200);
  const before=(await pool.query('SELECT joined_at FROM group_members WHERE user_id=$1 AND group_id=$2',[moved,destination])).rows[0].joined_at;
  assert.equal((await call('/admin/move-member',{userId:moved,groupId:destination})).status,200);
  assert.equal((await pool.query('SELECT joined_at FROM group_members WHERE user_id=$1 AND group_id=$2',[moved,destination])).rows[0].joined_at.getTime(),before.getTime());
  // Demoting the president would create member #36. Both role writer routes roll back.
  r=await call('/admin/assign-role',{userId:president,role:'MEMBER'});assert.equal(r.status,409);assert.equal((await pool.query('SELECT role FROM users WHERE id=$1',[president])).rows[0].role,'PRESIDENT');
  r=await call('/users/'+president,{role:'MEMBER'},admin,'PUT');assert.equal(r.status,409);assert.equal((await pool.query('SELECT role FROM users WHERE id=$1',[president])).rows[0].role,'PRESIDENT');
  r=await call('/admin/assign-role',{userId:loser,role:'MEMBER',type:'GROUP',contextId:g});assert.equal(r.status,409);assert.equal((await pool.query('SELECT status FROM group_members WHERE user_id=$1 AND group_id=$2',[loser,g])).rows[0].status,'REQUESTED');
  const snapshot=async()=>JSON.stringify((await pool.query('SELECT group_id,user_id,status,role,joined_at FROM group_members ORDER BY group_id,user_id')).rows);
  const previous=await snapshot();const tooMany=await Promise.all(Array.from({length:36},()=>user()));
  for(const url of ['/shuffle/save','/admin/shuffle/save']){
    assert.equal((await call(url,{assignments:{[destination]:tooMany}})).status,409);assert.equal(await snapshot(),previous);
    assert.equal((await call(url,{assignments:null})).status,400);assert.equal(await snapshot(),previous);
    assert.equal((await call(url,{assignments:{[destination]:[winner],[source]:[winner]}})).status,400);
    assert.equal((await call(url,{assignments:{[destination]:[winner]}},ordinary)).status,403);
  }
  // Power teams are unrestricted by this closed-group guard.
  const pt=randomUUID();await pool.query('INSERT INTO power_teams(id,name) VALUES($1::uuid,$1::text)',[pt]);
  for(const id of tooMany)await pool.query("INSERT INTO power_team_members(power_team_id,user_id,status) VALUES($1,$2,'ACTIVE')",[pt,id]);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM power_team_members WHERE power_team_id=$1',[pt])).rows[0].n,36);
  // Typed web reads report 35 regular members + one president, not 36 seats.
  const catalog=await(await fetch(base+'/admin/group-catalog',{headers:{Authorization:'Bearer '+token(admin)}})).json();const row=catalog.groups.find(row=>row.id===g);
  assert.deepEqual([row.capacity.member_records,row.capacity.president_records,row.capacity.available_seats],[35,1,0]);
  const detail=await(await fetch(base+`/admin/groups/${g}/detail`,{headers:{Authorization:'Bearer '+token(admin)}})).json();assert.equal(detail.group.capacity.member_records,35);
  writeFileSync(path.join(serverDir,'../output/group-capacity-browser.json'),JSON.stringify({owner:admin,other:ordinary,catalog,snapshot:detail,loser}));
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  let api=readFileSync(path.join(root,'src/api/adminGroupCatalog.ts'),'utf8').replace("import {referralTransport} from './api';","const referralTransport={};");
  const typed=await import('data:text/javascript;base64,'+Buffer.from(compile(api)).toString('base64'));
  assert.equal(typed.validGroupCatalog(catalog,admin),true);assert.equal(typed.validGroupCapacity({...row.capacity,member_records:34},g),false);
  // Direct SQL is serialized too: only one of two final-seat writes commits.
  const directGroup=await group(),directPresident=await user('PRESIDENT');await add(directPresident,directGroup);
  for(let i=0;i<34;i++)await add(await user(),directGroup);
  const directCandidates=[await user(),await user()];for(const id of directCandidates)await add(id,directGroup,'REQUESTED');
  const directRace=await Promise.allSettled(directCandidates.map(id=>pool.query("UPDATE group_members SET status='ACTIVE' WHERE group_id=$1 AND user_id=$2",[directGroup,id])));
  assert.equal(directRace.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(directRace.filter(result=>result.status==='rejected'&&result.reason.code==='23514'&&result.reason.constraint==='group_members_capacity_check').length,1);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=$1 AND gm.status='ACTIVE' AND u.role<>'PRESIDENT'",[directGroup])).rows[0].n,35);
  // A second president is rejected at the database boundary rather than becoming ambiguous.
  await add(outsider,destination);
  await assert.rejects(add(await user('PRESIDENT'),destination),e=>e.code==='23514'&&e.constraint==='group_members_single_president');
  console.log('Group capacity PASS: PG17 app and direct-SQL races, 35 members plus president, migration refuses ambiguous legacy rows, DB trigger blocks capacity/second-president/user-demotion violations, replay, transfer and shuffle rollback, current actor boundaries, power-team 36 unaffected, typed catalog/detail capacity. No live DB/mail/payment.');
}
let code=0;try{await main();}catch(e){code=1;console.error(e.stack);}finally{if(appServer)await new Promise(r=>appServer.close(r));if(pool)await pool.end();if(containerStarted)docker(['stop','--time','3',container]);}process.exit(code);
