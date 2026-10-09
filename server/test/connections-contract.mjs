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
const container = `e4n-connections-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,25);
  assert.equal((await applyVersionedSchema()).applied.length,0);



  const [alice,bob,third,admin,deleted]=Array.from({length:5},()=>randomUUID());
  for(const [i,id] of [alice,bob,third,admin].entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,phone,tax_number) VALUES($1,$2,$3,$3,'secret',$4,'private-phone','private-tax')",[id,`connections-${i}@example.invalid`,`Fixture ${i}`,id===admin?'ADMIN':'MEMBER']);
  const group=randomUUID(),secret=randomUUID(),inactive=randomUUID();
  for(const [id,name] of [[group,'Common'],[secret,'Private'],[inactive,'Inactive']])await pool.query("INSERT INTO groups(id,name,status) VALUES($1,$2,'ACTIVE')",[id,name]);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$3,'ACTIVE'),($2,$3,'ACTIVE'),($2,$4,'ACTIVE'),($1,$5,'REQUESTED'),($2,$5,'ACTIVE')",[alice,bob,group,secret,inactive]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}`;
  const token=(id,role='MEMBER')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(url,id=alice,body,role='MEMBER')=>fetch(`${base}/api${url}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(id?{Authorization:`Bearer ${token(id,role)}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
  const profile=id=>`/user/profiles/${id}`;
  const request='/user/friends/request';
  const decision=(sender,action)=>`${request}/${sender}/${action}`;
  const snapshot=async()=>JSON.stringify((await pool.query('SELECT jsonb_agg(fr ORDER BY id) AS requests FROM friend_requests fr')).rows);
  assert.equal((await call(profile(bob),null)).status,401);
  assert.equal((await call(profile(bob),deleted)).status,401);
  assert.equal((await call(profile('invalid'))).status,400);
  assert.equal((await call(profile(deleted))).status,404);
  const listPath='/user/connections';
  assert.equal((await call(listPath,null)).status,401);assert.equal((await call(listPath,deleted)).status,401);
  assert.equal((await call(listPath+'?ownerId='+bob)).status,400);
  assert.deepEqual((await (await call(listPath)).json()).connections,[]);
  const before=await snapshot();
  const p=await (await call(profile(bob))).json();
  assert.equal(p.status,'NONE');assert.equal(p.contactVisible,false);assert.equal(p.billingVisible,false);
  assert.deepEqual(p.commonGroups,[{id:group,name:'Common'}]);
  for(const k of ['email','phone','tax_number','password_hash','role'])assert.ok(!(k in p.profile));
  assert.equal((await (await call(profile(bob),alice,undefined,'ADMIN')).json()).contactVisible,false);
  assert.equal((await (await call(profile(bob),admin)).json()).billingVisible,true);
  assert.equal((await (await call(profile(alice))).json()).status,'SELF');
  assert.equal((await (await call('/user/friends/check/'+bob)).json()).status,'NONE');
  assert.equal(await snapshot(),before);
  assert.equal((await call(request,alice,{targetId:alice})).status,400);
  assert.equal((await call(request,alice,{targetId:'bad'})).status,400);
  assert.equal((await call(request,alice,{targetId:deleted})).status,404);
  const mod=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const compile=file=>ts.transpileModule(readFileSync(path.join(serverDir,'../',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const source=compile('src/api/api.ts').replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService={};').replaceAll('import.meta.env.PROD','false').replaceAll('http://localhost:4005/api',`${base}/api`);
  let webOwner=alice;
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(webOwner)}})};
  globalThis.connectionTransport=(await mod(source)).referralTransport;
  const {connectionsApi}=await mod(compile('src/api/connections.ts').replace(/import \{ referralTransport \} from ['"]\.\/api['"];?/,'const referralTransport=globalThis.connectionTransport;'));
  assert.equal((await connectionsApi.profile(alice,bob)).status,'NONE');
  await assert.rejects(connectionsApi.profile(third,bob));
  const race=await Promise.all(Array.from({length:12},(_,i)=>call(request,i%2?bob:alice,{targetId:i%2?alice:bob})));
  assert.ok(race.every(r=>[200,409].includes(r.status)));assert.ok(race.some(r=>r.status===409));
  const rows=(await pool.query('SELECT * FROM friend_requests')).rows;assert.equal(rows.length,1);
  const r=rows[0],sender=r.sender_id,receiver=r.receiver_id;
  assert.equal((await call(decision(sender,'accept'),third,{})).status,404);
  assert.equal((await call(decision(sender,'accept'),sender,{})).status,400);
  webOwner=receiver;
  const pendingProfile=await connectionsApi.profile(receiver,sender);
  const incoming=await connectionsApi.incoming(receiver);assert.equal(incoming.length,1);assert.ok(incoming[0].sender_name.startsWith('Fixture'));
  await connectionsApi.mutate(receiver,sender,'accept');
  assert.equal((await connectionsApi.profile(receiver,sender)).status,'FRIEND');
  const acceptedList=await call(listPath,receiver);assert.equal(acceptedList.headers.get('cache-control'),'private, no-store');
  const acceptedData=await acceptedList.json();assert.equal(acceptedData.ownerId,receiver);assert.equal(acceptedData.connections.length,1);assert.equal(acceptedData.connections[0].id,sender);
  assert.deepEqual(Object.keys(acceptedData.connections[0]).sort(),['city','company','id','name','profession']);
  assert.equal((await connectionsApi.list(receiver))[0].id,sender);await assert.rejects(connectionsApi.list(third));
  const originalGet=globalThis.connectionTransport.get;
  for(const mutate of [r=>({...r,ownerId:third}),r=>({...r,connections:[...r.connections,...r.connections]}),r=>({...r,connections:r.connections.map(p=>({...p,email:'private'}))}),r=>({...r,connections:[{...r.connections[0],id:receiver}]})]){
    globalThis.connectionTransport.get=async()=>mutate(acceptedData);await assert.rejects(connectionsApi.list(receiver));
  }globalThis.connectionTransport.get=originalGet;
  await pool.query('DELETE FROM group_members WHERE user_id=$1 AND group_id=$2',[sender,group]);
  assert.equal((await connectionsApi.list(receiver))[0].id,sender);
  const accepted=await snapshot();
  const repeated=await Promise.all(Array.from({length:8},()=>call(decision(sender,'accept'),receiver,{})));
  for(const response of repeated)assert.equal((await response.json()).replay,true);
  assert.equal((await call(decision(sender,'reject'),receiver,{})).status,409);
  assert.equal(await snapshot(),accepted);
  const friendProfile=await connectionsApi.profile(receiver,sender);
  const ack=await (await call(decision(sender,'accept'),receiver,{})).json();
  writeFileSync(path.join(serverDir,'../output/connections-browser.json'),JSON.stringify({owner:receiver,target:sender,pendingProfile,incoming,friendProfile,ack}));assert.equal(friendProfile.contactVisible,true);assert.ok(friendProfile.profile.email);assert.ok(!('tax_number' in friendProfile.profile));
  assert.equal((await connectionsApi.incoming(receiver)).length,0);
  const pair2=await call(request,alice,{targetId:third});assert.equal(pair2.status,200);
  const decisions=await Promise.all(['accept','reject'].map(action=>call(decision(alice,action),third,{})));
  assert.deepEqual(decisions.map(r=>r.status).sort(),[200,409]);
  const fourth=randomUUID();await pool.query("INSERT INTO users(id,email,name,profession,password_hash) VALUES($1,'fourth@example.invalid','Fourth','Fourth','x')",[fourth]);
  assert.equal((await call(request,alice,{targetId:fourth.toUpperCase()})).status,200);
  assert.equal((await call(decision(alice,'reject'),fourth,{})).status,200);
  assert.equal((await (await call(decision(alice,'reject'),fourth,{})).json()).replay,true);
  assert.equal((await call(request,alice,{targetId:fourth})).status,409);
  assert.equal((await (await call('/user/friends/check/'+fourth.toUpperCase())).json()).status,'REJECTED');
  await pool.query('UPDATE users SET role=\'MEMBER\' WHERE id=$1',[admin]);
  assert.equal((await (await call(profile(bob),admin,undefined,'ADMIN')).json()).billingVisible,false);
  await pool.query("INSERT INTO friend_requests(sender_id,receiver_id) VALUES($1,$2)",[bob,alice]);
  assert.equal((await call(profile(bob))).status,409);
  assert.equal((await call(listPath)).status,409);
  assert.equal((await call(decision(bob,'reject'),alice,{})).status,409);
  await pool.query('DELETE FROM friend_requests WHERE sender_id=$1 AND receiver_id=$2',[bob,alice]);
  assert.equal((await call('/user/friends/requests?type=bad')).status,400);
  assert.equal((await call('/user/friends/requests?type=incoming&userId='+bob)).status,400);
  const stable=await snapshot();await connectionsApi.profile(receiver,sender);await connectionsApi.incoming(receiver);assert.equal(await snapshot(),stable);
  // Force a failure after INSERT and verify transaction rollback leaves no phantom success.
  const rollbackUser=randomUUID();await pool.query("INSERT INTO users(id,email,name,profession,password_hash) VALUES($1,'rollback@example.invalid','Rollback','Rollback','x')",[rollbackUser]);
  const originalConnect=pool.connect.bind(pool);
  pool.connect=async()=>{const c=await originalConnect(),query=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{const result=await query(sql,args);if(typeof sql==='string'&&sql.startsWith('INSERT INTO friend_requests'))throw new Error('Fixture failure after insert');return result;};c.release=()=>{c.query=query;c.release=release;release();};return c;};
  assert.equal((await call(request,alice,{targetId:rollbackUser})).status,500);pool.connect=originalConnect;
  assert.equal(await snapshot(),stable);assert.equal((await call(request,alice,{targetId:rollbackUser})).status,200);
  const stableList=await connectionsApi.list(receiver);
  await pool.query('ALTER TABLE friend_requests RENAME TO hidden_friend_requests');
  const readFailure=await call(listPath,receiver);assert.equal(readFailure.status,500);assert.ok(!(await readFailure.text()).includes('hidden_friend_requests'));
  await pool.query('ALTER TABLE hidden_friend_requests RENAME TO friend_requests');assert.deepEqual(await connectionsApi.list(receiver),stableList);
  // The bounded endpoint must fail explicitly, never silently truncate a network.
  await pool.query(`WITH people AS (INSERT INTO users(id,email,name,profession,password_hash)
    SELECT gen_random_uuid(),'bound-'||g||'@example.invalid','Bound '||g,'Fixture','x' FROM generate_series(1,1001) g RETURNING id)
    INSERT INTO friend_requests(sender_id,receiver_id,status) SELECT $1,id,'ACCEPTED' FROM people`,[admin]);
  assert.equal((await call(listPath,admin)).status,503);
  console.log('Connections PASS: actual web bearer/Express/isolated PG; profile contact/billing/common group boundaries; missing/self/invalid owners; bidirectional create race; recipient-only decisions; opposite decision race; replay; accepted rejection protection; rejected resend conflict; legacy ambiguity; rollback/retry; GET no writes.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Connections contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
