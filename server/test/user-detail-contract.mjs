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
const container = `e4n-user-detail-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,26);
  assert.equal((await applyVersionedSchema()).applied.length,0);








  const [admin,member,other,deleted]=Array.from({length:4},()=>randomUUID());
  for(const [id,name,role]of [[admin,'Profile Admin','ADMIN'],[member,'Profile Member','MEMBER'],[other,'Profile Partner','MEMBER']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,performance_score,performance_color) VALUES($1,$2,$3,$3,'private_fixture_hash',$4,73,'YELLOW')",[id,id+'@example.invalid',name,role]);
  const groups=Array.from({length:3},()=>randomUUID());for(const [i,id]of groups.entries())await pool.query('INSERT INTO groups(id,name) VALUES($1,$2)',[id,'Profile Group '+i]);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE'),($1,$3,'ACTIVE'),($1,$4,'REQUESTED')",[member,...groups]);
  for(const [status,amount]of [['SUCCESSFUL','100.10'],['SUCCESSFUL','0.20'],['PENDING','900'],['UNSUCCESSFUL','500']])await pool.query('INSERT INTO referrals(giver_id,receiver_id,status,amount) VALUES($1,$2,$3,$4)',[member,other,status,amount]);
  for(let i=0;i<2;i++)await pool.query('INSERT INTO visitors(inviter_id,name,visited_at) VALUES($1,$2,now())',[member,'Profile visitor '+i]);
  const meetingIds=Array.from({length:4},()=>randomUUID());for(const [i,id]of meetingIds.entries())await pool.query("INSERT INTO one_to_ones(id,requester_id,partner_id,meeting_date) VALUES($1,$2,$3,'2026-10-01')",[id,i%2?other:member,i%2?member:other]);
  await pool.query("INSERT INTO one_to_one_requests(id,requester_id,partner_id,meeting_date,status,notes) VALUES($1,$2,$3,'2026-10-01','PENDING','Scheduling intent only')",[randomUUID(),member,other]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(target=member,owner=member,query='')=>fetch(`${base}/api/users/${target}${query}`,{headers:owner?{Authorization:'Bearer '+token(owner)}:{}});
  const r=await call();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);const snap=await r.json();
  assert.equal(snap.ownerId,member);assert.equal(snap.profileVersion,1);assert.equal(snap.metricScope,'ALL_HISTORY');assert.equal(snap.metric_referrals,4);assert.equal(snap.metric_revenue,100.30);assert.equal(snap.metric_visitors,2);assert.equal(snap.metric_one_to_ones,4);assert.equal(snap.performance_score,73);assert.equal(snap.last_meetings.length,3);assert(snap.last_meetings.every(m=>m.partner_name==='Profile Partner'));assert.deepEqual(snap.last_meetings.map(m=>m.id),[...meetingIds].sort().reverse().slice(0,3));assert.equal(snap.groups.length,2);assert.equal(snap.group_name,null);assert(!JSON.stringify(snap).includes('private_fixture_hash'));
  const partner=await (await call(other,other)).json();assert.equal(partner.metric_one_to_ones,4);assert(partner.last_meetings.every(m=>m.partner_name==='Profile Member'));
  assert.equal((await call(member,null)).status,401);assert.equal((await call(member,deleted)).status,401);assert.equal((await call(other,member)).status,404);assert.equal((await call('bad')).status,400);assert.equal((await call(member,member,'?userId='+other)).status,400);assert.equal((await call(deleted,admin)).status,404);assert.equal((await call(member,admin)).status,200);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call(member,admin)).status,404);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  await pool.query('DELETE FROM group_members WHERE group_id=$1',[groups[1]]);assert.equal((await (await call()).json()).group_name,'Profile Group 0');
  const raw=pool.connect.bind(pool);pool.connect=async()=>{const c=await raw(),q=c.query.bind(c);c.query=(sql,...args)=>{if(typeof sql==='string'&&sql.includes('SELECT u.id')){const e=new Error('private fixture SQL details');e.code='XXTEST';throw e;}return q(sql,...args);};const release=c.release.bind(c);c.release=()=>{c.query=q;c.release=release;release();};return c;};
  try{const failed=await call();assert.equal(failed.status,500);assert(!JSON.stringify(await failed.json()).includes('private fixture'));}finally{pool.connect=raw;}
  assert.equal((await call()).status,200);
  const root=path.join(serverDir,'..'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  let owner=member;globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(owner),user:{id:owner}}})};
  const apiSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';",`const BASE_URL = '${base}/api';`).replace("import { emailService } from '../services/emailService';",'const emailService={};');
  const {api,validUserDetail}=await import('data:text/javascript;base64,'+Buffer.from(compile(apiSource)).toString('base64'));
  assert.equal((await api.getUserById(member)).metric_one_to_ones,4);assert.equal(validUserDetail({...snap,ownerId:other},member,member),false);assert.equal(validUserDetail({...snap,metric_one_to_ones:undefined},member,member),false);assert.equal(validUserDetail({...snap,last_meetings:[...snap.last_meetings,snap.last_meetings[0]]},member,member),false);assert.equal(validUserDetail({...snap,password_hash:'private'},member,member),false);assert.equal(validUserDetail({...snap,metric_revenue:NaN},member,member),false);
  owner=admin;assert.equal((await api.getUserById(member)).ownerId,admin);owner=other;await assert.rejects(api.getUserById(member));
  console.log('User detail PASS: canonical bidirectional meeting metrics, keyed latest3, groups without primary guessing, read-only private snapshot, actual DB role/owner/demotion, SQL failure without fallback, typed real web transport.');
}
let exitCode=0;
try{await main();}catch(e){exitCode=1;console.error('User detail failed:',e.message);}finally{if(appServer)await new Promise(r=>appServer.close(r));if(pool)await pool.end();if(containerStarted)docker(['rm','-f',container]);}
process.exitCode=exitCode;
