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
const container = `e4n-membership-records-${randomUUID().slice(0, 8)}`;
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











  const [admin,member,other,deleted]=Array.from({length:4},()=>randomUUID());
  for(const [id,role,status] of [[admin,'ADMIN','ACTIVE'],[member,'MEMBER','ACTIVE'],[other,'MEMBER','PENDING']])await pool.query("INSERT INTO users(id,name,email,password_hash,role,account_status,profession) VALUES($1,$2,$3,'secret_password',$4,$5,'Fixture profession')",[id,id===member?'Ledger member':id===admin?'Ledger admin':'Ledger other',id+'@example.invalid',role,status]);
  await pool.query("UPDATE users SET subscription_plan='LEGACY_PLAN',subscription_end_date=now()-interval '10 days' WHERE id=$1",[member]);
  const originalEnd=(await pool.query('SELECT subscription_end_date FROM users WHERE id=$1',[member])).rows[0].subscription_end_date;
  const unowned='unowned-secret',owned='owned-record',foreign='foreign-record';
  for(const [id,user,amount,status,action] of [[owned,member,'120.50','SUCCESS','membership'],[foreign,other,'25.00','PENDING','event_registration'],[unowned,null,'50.00','LEGACY_STATUS',null]])await pool.query('INSERT INTO payment_transactions(merchant_oid,user_id,amount,status,action_type,action_data) VALUES($1,$2,$3,$4,$5,$6)',[id,user,amount,status,action,JSON.stringify({user_id:member,receipt_token:'never_expose',provider_secret:'never_expose'})]);
  const invoice=randomUUID(),otherInvoice=randomUUID(),bytes=Buffer.from('%PDF-1.7 membership fixture');
  for(const [id,user] of [[invoice,member],[otherInvoice,other]])await pool.query("INSERT INTO invoice_files(id,member_id,uploaded_by,request_key,fingerprint,filename,size_bytes,content,email_state) VALUES($1,$2,$3,$4,$5,'membership-fixture.pdf',$6,$7,'UNKNOWN')",[id,user,admin,randomUUID(),'a'.repeat(64),bytes.length,bytes]);
  await pool.query("INSERT INTO subscription_reminder_deliveries(user_id,subscription_end_date,trigger_days,delivery_state,completed_at) VALUES($1,$2,-5,'UNKNOWN',now())",[member,originalEnd]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const token=id=>jwt.sign({id,role:'ADMIN'},process.env.JWT_SECRET),call=(url,id=member)=>fetch(base+'/api'+url,{headers:id?{Authorization:'Bearer '+token(id)}:{}});
  const response=await call('/membership-records');assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private.*no-store/);const data=await response.json();
  assert.equal(data.targetId,member);assert.equal(data.account.account_status,'ACTIVE');assert.equal(data.account.subscription_plan,'LEGACY_PLAN');assert.deepEqual(data.totals,{payments:1,invoices:1,reminders:1});assert.equal(data.payments[0].id,owned);assert.equal(data.payments[0].amount,'120.50');assert.equal(data.invoices[0].id,invoice);assert.equal(data.reminders[0].delivery_state,'UNKNOWN');
  for(const secret of ['never_expose','secret_password',unowned,foreign,otherInvoice])assert.ok(!JSON.stringify(data).includes(secret));
  for(const [id,status] of [[null,401],[deleted,401]])assert.equal((await call('/membership-records',id)).status,status);
  assert.equal((await call('/membership-records?userId='+other)).status,400);assert.equal((await call('/admin/membership-records')).status,403);assert.equal((await call('/admin/membership-records/'+other)).status,403);
  const directory=await call('/admin/membership-records',admin).then(r=>r.json());assert.equal(directory.accounts.length,3);assert.equal(directory.unownedPayments,1);
  assert.equal((await call('/admin/membership-records?target='+member,admin)).status,400);assert.equal((await call('/admin/membership-records/bad',admin)).status,400);assert.equal((await call('/admin/membership-records/'+deleted,admin)).status,404);
  assert.equal((await call('/admin/membership-records/'+member,admin).then(r=>r.json())).targetId,member);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call('/admin/membership-records',admin)).status,403);assert.equal((await call('/admin/membership-records/'+member,admin)).status,403);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const file=await call('/invoices/'+invoice);assert.equal(file.status,200);assert.deepEqual(Buffer.from(await file.arrayBuffer()),bytes);assert.equal((await call('/invoices/'+otherInvoice)).status,404);
  const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const transport='data:text/javascript;base64,'+Buffer.from('export const referralTransport={get:async()=>('+JSON.stringify(data)+')};').toString('base64');
  const code=readFileSync(path.join(serverDir,'../src/api/membershipRecords.ts'),'utf8').replace("from './api'","from '"+transport+"'");const {validRecords,validAccounts,expiryRecord,membershipRecordsApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(code)).toString('base64'));
  assert.equal(validRecords(data,member,member),true);assert.equal((await membershipRecordsApi.read(member)).targetId,member);assert.equal(validAccounts(directory,admin),true);assert.equal(expiryRecord(data.account,data.asOf),'Bitiş zamanı geçmiş');assert.equal(expiryRecord(directory.accounts.find(a=>a.id===other),directory.asOf),'Bitiş kaydı yok');
  for(const bad of [{...data,targetId:other},{...data,ownerId:other},{...data,totals:{...data.totals,payments:2}},{...data,payments:[null]},{...data,invoices:[{...data.invoices[0],id:'bad'}]},{...data,reminders:[{...data.reminders[0],delivery_state:'INVENTED'}]}])assert.equal(validRecords(bad,member,member),false);
  assert.equal(validAccounts({...directory,accounts:[null]},admin),false);assert.equal(validAccounts({...directory,accounts:[directory.accounts[0],directory.accounts[0]]},admin),false);
  const original=pool.connect.bind(pool),writer=await original();let changed=false;
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{const r=await q(sql,args);if(!changed&&typeof sql==='string'&&sql.startsWith('SELECT id,role,now()')){changed=true;await writer.query("UPDATE users SET subscription_end_date=now()+interval '2 months' WHERE id=$1",[member]);}return r;};c.release=()=>{c.query=q;c.release=release;release();};return c;};
  const stable=await call('/membership-records').then(r=>r.json());pool.connect=original;writer.release();assert.equal(stable.account.subscription_end_date,data.account.subscription_end_date);assert.notEqual((await call('/membership-records').then(r=>r.json())).account.subscription_end_date,data.account.subscription_end_date);
  pool.connect=async()=>{const c=await original(),q=c.query.bind(c),release=c.release.bind(c);c.query=async(sql,args)=>{if(typeof sql==='string'&&sql.includes('FROM invoice_files'))throw Error('credential never_expose');return q(sql,args);};c.release=()=>{c.query=q;c.release=release;release();};return c;};const failed=await call('/membership-records');assert.equal(failed.status,500);assert.ok(!JSON.stringify(await failed.json()).includes('never_expose'));pool.connect=original;assert.equal((await call('/membership-records')).status,200);
  for(let i=0;i<101;i++)await pool.query("INSERT INTO payment_transactions(merchant_oid,user_id,amount,status,action_type) VALUES($1,$2,1,'PENDING','membership')",['bounded-'+String(i).padStart(3,'0'),member]);
  const bounded=await call('/membership-records').then(r=>r.json());assert.equal(bounded.totals.payments,102);assert.equal(bounded.payments.length,100);assert.equal(validRecords(bounded,member,member),true);
  assert.equal((await pool.query('SELECT count(*)::int n FROM invoice_files')).rows[0].n,2);assert.equal((await pool.query('SELECT count(*)::int n FROM subscription_reminder_deliveries')).rows[0].n,1);
  console.log('Membership records PASS: fresh26/repeat0; own/admin/current-role snapshot, foreign/unowned proof not inferred, null/legacy/end-state independence, exact invoice bytes+foreign denial, reminder UNKNOWN, DTOowner/duplicates/count bounds, concurrent snapshot, redacted500/recovery, no writes or providers from read endpoints.');
}

let exitCode=0;
try{await main();}catch(error){exitCode=1;console.error('Membership records contract failed:',error);}
finally{if(appServer)await new Promise(resolve=>appServer.close(resolve));if(pool)await pool.end();if(containerStarted){try{docker(['stop','--time','3',container],{timeout:15000});}catch(error){exitCode=1;console.error(error.message);}}}process.exit(exitCode);
