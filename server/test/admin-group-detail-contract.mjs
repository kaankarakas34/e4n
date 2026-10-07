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
const container = `e4n-group-detail-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,16);
  assert.equal((await applyVersionedSchema()).applied.length,0);








  const [admin,member,other,deleted]=Array.from({length:4},()=>randomUUID());
  for(const [i,id,role] of [[0,admin,'ADMIN'],[1,member,'MEMBER'],[2,other,'MEMBER']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$3,$3,'x',$4)",[id,`detail-${i}@example.invalid`,`Member ${i}`,role]);
  const [group,emptyGroup,otherGroup]=Array.from({length:3},()=>randomUUID());
  for(const [id,name]of [[group,'Detailed group'],[emptyGroup,'Empty group'],[otherGroup,'Other group']])await pool.query("INSERT INTO groups(id,name,status) VALUES($1,$2,'DRAFT')",[id,name]);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE'),($3,$2,'REQUESTED')",[member,group,other]);
  const refs=[];
  for(const [status,amount,giver]of [['SUCCESSFUL','100.10',member],['SUCCESSFUL','0.20',member],['SUCCESSFUL','0',member],['SUCCESSFUL',null,member],['SUCCESSFUL','-1',member],['PENDING','9999',member],['UNSUCCESSFUL','5000',member],['SUCCESSFUL','900',other]]){
    const id=randomUUID();refs.push(id);await pool.query('INSERT INTO referrals(id,giver_id,receiver_id,status,amount) VALUES($1,$2,$3,$4,$5)',[id,giver,admin,status,amount]);
  }
  const [event,education,outside]=Array.from({length:3},()=>randomUUID());
  for(const [id,type,g]of [[event,'meeting',group],[education,'education',group],[outside,'social',otherGroup]])await pool.query("INSERT INTO events(id,title,start_at,type,created_by,group_id) VALUES($1,$2,now()+interval '1 day',$3,$4,$5)",[id,type+' fixture',type,admin,g]);
  await pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'PRESENT'),($1,$3,'ABSENT')",[event,member,other]);
  for(const status of ['INVITED','ATTENDED','JOINED','NO_SHOW'])await pool.query("INSERT INTO visitors(inviter_id,name,visited_at,status,group_id) VALUES($1,$2,now(),$2,$3)",[member,status,group]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(id=group,owner=admin,role='ADMIN',query='')=>fetch(`${base}/api/admin/groups/${id}/detail${query}`,{headers:owner?{Authorization:`Bearer ${token(owner,role)}`}:{}});
  const r=await call();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);const snapshot=await r.json();
  assert.equal(snapshot.ownerId,admin);assert.equal(snapshot.group.id,group);assert.deepEqual(snapshot.group.meeting_dates,[]);assert.equal(snapshot.members.length,2);assert.equal(snapshot.visitors.length,4);assert.equal(snapshot.referrals.length,7);assert.equal(snapshot.events.length,1);assert.equal(snapshot.events[0].attendees_count,2);assert.equal(snapshot.events[0].present_count,1);assert.equal(snapshot.members.find(m=>m.id===other).absence_count,1);
  assert.deepEqual(snapshot.summary,{activeMembers:1,upcomingEvents:1,count:7,successful:5,missingAmounts:2,knownVolume:'100.30',volume:null});
  assert.ok(!JSON.stringify(snapshot).includes('password_hash'));assert.ok(!snapshot.referrals[0].description);assert.equal((await call(group,null)).status,401);assert.equal((await call(group,deleted)).status,401);assert.equal((await call(group,member)).status,403);assert.equal((await call(group,other,'PRESIDENT')).status,403);assert.equal((await call('bad')).status,400);assert.equal((await call(randomUUID())).status,404);assert.equal((await call(group,admin,'ADMIN','?userId='+member)).status,400);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call()).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const original=pool.connect.bind(pool);
  // A writer commits after roster read. Every subsequent read must retain the same snapshot.
  const writer=await original();
  let changed=false;pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{const result=await q(sql,args);if(!changed&&typeof sql==='string'&&sql.includes('gm.joined_at AS created_at')){changed=true;await writer.query("UPDATE group_members SET status='REQUESTED' WHERE group_id=$1 AND user_id=$2",[group,member]);}return result;};c.release=()=>{c.query=q;c.release=release;release();};return c;};
  const consistent=await(await call()).json();pool.connect=original;writer.release();assert.equal(consistent.summary.activeMembers,1);assert.equal(consistent.referrals.length,7);assert.equal((await(await call()).json()).summary.count,0);await pool.query("UPDATE group_members SET status='ACTIVE' WHERE group_id=$1 AND user_id=$2",[group,member]);
  // Failure is explicit, transaction rolls back; a retry succeeds.
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('FROM visitors v'))throw new Error('isolated detail failure');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};assert.equal((await call()).status,500);pool.connect=original;assert.equal((await call()).status,200);
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`);globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};const apiUrl='data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64');
  const capacitySource=readFileSync(path.join(root,'src/api/adminGroupCatalog.ts'),'utf8').replace("from './api'",`from '${apiUrl}'`);const capacityUrl='data:text/javascript;base64,'+Buffer.from(compile(capacitySource)).toString('base64');
  const serviceSource=readFileSync(path.join(root,'src/api/adminGroupDetail.ts'),'utf8').replace("from './api'",`from '${apiUrl}'`).replace("from './adminGroupCatalog'",`from '${capacityUrl}'`);const {adminGroupDetailApi,validAdminGroupDetail,groupMoney,groupRecordStatus}=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)).toString('base64'));
  assert.equal((await adminGroupDetailApi.read(admin,group)).summary.knownVolume,'100.30');const empty=await adminGroupDetailApi.read(admin,emptyGroup);assert.equal(empty.summary.volume,'0');assert.equal(empty.summary.count,0);
  assert.equal(groupMoney('0'),'₺0,00');assert.equal(groupMoney('9007199254740993.20'),'₺9.007.199.254.740.993,20');assert.equal(groupMoney(null),'Bilinmiyor');assert.equal(groupRecordStatus('NO_SHOW','visitor'),'Gelmedi');assert.equal(groupRecordStatus('UNSUCCESSFUL','referral'),'Başarısız');
  for(const bad of [{...snapshot,ownerId:member},{...snapshot,group:{...snapshot.group,id:otherGroup}},{...snapshot,referrals:[...snapshot.referrals,snapshot.referrals[0]]},{...snapshot,summary:{...snapshot.summary,knownVolume:'999'}},{...snapshot,events:[{...snapshot.events[0],present_count:9}]}])assert.equal(validAdminGroupDetail(bad,admin,group),false);
  await pool.query("UPDATE referrals SET amount=1 WHERE giver_id=$1 AND amount IS NULL",[member]);await pool.query("UPDATE referrals SET amount=2 WHERE giver_id=$1 AND amount<0",[member]);const complete=await adminGroupDetailApi.read(admin,group);assert.equal(complete.summary.volume,'103.30');
  const oversized=[];for(let i=0;i<5001;i++)oversized.push(`('${randomUUID()}','${member}','V${i}',now(),'${emptyGroup}')`);await pool.query('INSERT INTO visitors(id,inviter_id,name,visited_at,group_id) VALUES'+oversized.join(','));assert.equal((await call(emptyGroup)).status,503);
  writeFileSync(path.join(root,'output/admin-group-detail-browser.json'),JSON.stringify({owner:admin,other:member,snapshot,empty}));
  console.log('WEB12 PASS: current DB admin/revocation, owner/query/404/cache, consistent readonly snapshot during concurrent write, exact successful amounts/missing/zero, actual statuses, group/event/LMS boundary, all attendance statuses, empty/503/failure recovery, actual TS transport and malformed DTO checks.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Group detail contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
