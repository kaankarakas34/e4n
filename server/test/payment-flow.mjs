import { createServer } from 'node:http';
import { createHash, createDecipheriv } from 'node:crypto';
let gateway;
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
const container = `e4n-payment-flow-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,7);
  assert.equal((await applyVersionedSchema()).applied.length,0);
  const ids=[randomUUID(),randomUUID()];
  for(const [i,id] of ids.entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,account_status) VALUES($1,$2,$3,'Fixture','fixture','MEMBER','PENDING')",[id,`payment-${i}@example.invalid`,`Payment ${i}`]);
  const results=new Map(); let providerCalls=0;
  gateway=createServer(async(req,res)=>{
    let raw=''; for await(const part of req)raw+=part;
    const body=JSON.parse(raw);providerCalls++;
    if(req.url==='/api/paySmart3D') {
      results.set(body.invoice_id,{status_code:69,transaction_status:'Pending',transaction_type:'Auth',invoice_id:body.invoice_id,transaction_amount:body.total});
      res.setHeader('Content-Type','text/html');res.end('<form>Local synthetic 3DS</form>');return;
    }
    res.setHeader('Content-Type','application/json');
    if(req.url==='/api/token'){res.end(JSON.stringify({status_code:100,data:{token:'synthetic-provider-token'}}));return;}
    assert.equal(req.url,'/api/checkstatus');assert.equal(req.headers.authorization,'Bearer synthetic-provider-token');
    // Independently decrypt the status request hash and check documented field order.
    const [iv,salt,ciphertext]=body.hash_key.replaceAll('__','/').split(':');
    const password=createHash('sha1').update('fixture-secret').digest('hex');
    const key=createHash('sha256').update(password+salt).digest('hex').slice(0,32);
    const cipher=createDecipheriv('aes-256-cbc',key,iv);
    assert.equal(cipher.update(ciphertext,'base64','utf8')+cipher.final('utf8'),`${body.invoice_id}|fixture-merchant`);
    res.end(JSON.stringify(results.get(body.invoice_id) || {invoice_id:body.invoice_id,transaction_status:'Unknown'}));
  });
  gateway.listen(0,'127.0.0.1');await once(gateway,'listening');
  process.env.SIPAY_API_URL=`http://127.0.0.1:${gateway.address().port}`;
  process.env.SIPAY_APP_ID='fixture-app';process.env.SIPAY_APP_SECRET='fixture-secret';process.env.SIPAY_MERCHANT_KEY='fixture-merchant';
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}/api`;
  const call=async(path,user,body,method='POST')=>fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:`Bearer ${jwt.sign({id:user,role:'MEMBER'},process.env.JWT_SECRET)}`}:{})},...(method==='GET'?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
  const payload=(type='membership',data={user_id:ids[0],plan:'1_MONTH',amount:1})=>({cardNumber:'1111111111111111',cardHolderName:'Synthetic Fixture',expiryMonth:'12',expiryYear:'2030',cvv:'111',total:100,action:{type,data}});
  const create=async(type,data)=>{const r=await call('/payment/pay',type==='visitor_registration'?null:ids[0],payload(type,data));assert.equal(r.status,200);const json=await r.json();assert.ok(json.receiptToken);assert.ok(json.invoiceId);return json;};
  const beforeCalls=providerCalls;
  assert.equal((await call('/payment/pay',null,payload())).status,401);
  assert.equal((await call('/payment/pay',ids[0],payload('membership',{user_id:ids[1],plan:'1_MONTH'}))).status,403);
  assert.equal((await call('/payment/pay',ids[0],{...payload(),total:-1})).status,400);
  assert.equal(providerCalls,beforeCalls);
  const payment=await create();const invoice=payment.invoiceId;
  const row=() =>pool.query('SELECT * FROM payment_transactions WHERE merchant_oid=$1',[invoice]).then(r=>r.rows[0]);
  assert.equal((await row()).user_id,ids[0]);assert.equal((await row()).action_data.amount,100);
  assert.equal((await call('/payment/status',ids[1],{invoiceId:invoice})).status,404);
  assert.equal((await call('/payment/status',null,{invoiceId:invoice,receiptToken:'wrong'})).status,404);
  const cb=(outcome='success',method='POST')=>call(`/payment/sipay-callback/${outcome}${method==='GET'?`?invoice_id=${invoice}`:''}`,null,{invoice_id:invoice},method);
  assert.ok((await (await cb('success','GET')).text()).includes('"status":"pending"'));assert.equal((await row()).status,'PENDING');
  let own=(await pool.query('SELECT subscription_end_date FROM users WHERE id=$1',[ids[0]])).rows[0];assert.equal(own.subscription_end_date,null);
  results.set(invoice,{...results.get(invoice),status_code:100,transaction_status:'Completed',transaction_amount:99});
  assert.equal((await cb()).status,409);assert.equal((await row()).status,'PENDING');
  results.set(invoice,{...results.get(invoice),transaction_amount:100,invoice_id:'another-invoice'});
  assert.equal((await cb()).status,502);assert.equal((await row()).status,'PENDING');
  results.set(invoice,{...results.get(invoice),invoice_id:invoice,transaction_type:'PreAuth'});
  assert.ok((await (await cb()).text()).includes('"status":"pending"'));
  results.set(invoice,{...results.get(invoice),transaction_type:'Auth'});
  const race=await Promise.all([cb(),cb('fail'),cb('success','GET')]);assert.ok(race.every(r=>r.status===200));
  assert.equal((await row()).status,'SUCCESS');
  own=(await pool.query('SELECT subscription_end_date,last_membership_payment_amount FROM users WHERE id=$1',[ids[0]])).rows[0];assert.ok(own.subscription_end_date);assert.equal(Number(own.last_membership_payment_amount),100);
  const end=own.subscription_end_date.getTime();
  results.set(invoice,{...results.get(invoice),status_code:68,transaction_status:'Failed'});
  await cb('fail');assert.equal((await row()).status,'SUCCESS');
  assert.equal((await pool.query('SELECT subscription_end_date FROM users WHERE id=$1',[ids[0]])).rows[0].subscription_end_date.getTime(),end);
  const confirmed=await call('/payment/status',null,{invoiceId:invoice,receiptToken:payment.receiptToken});assert.equal(confirmed.status,200);assert.equal((await confirmed.json()).status,'SUCCESS');
  let clientCode=ts.transpileModule(readFileSync(path.join(serverDir,'../src/api/api.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  clientCode=clientCode.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService = {};')
    .replace(/const BASE_URL = .*?;/,`const BASE_URL = ${JSON.stringify(base)};`);
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:jwt.sign({id:ids[0],role:'MEMBER'},process.env.JWT_SECRET)}})};
  const {api}=await import(`data:text/javascript;base64,${Buffer.from(clientCode).toString('base64')}`);
  assert.equal((await api.getPaymentStatus(invoice,payment.receiptToken)).status,'SUCCESS');
  const clientCreated=await api.payWithSipay(payload());assert.ok(clientCreated.invoiceId);assert.ok(clientCreated.receiptToken);
  assert.equal((await api.getPaymentStatus(clientCreated.invoiceId,clientCreated.receiptToken)).status,'PENDING');
  assert.equal((await call('/payment/status',null,{invoiceId:'another-invoice',receiptToken:payment.receiptToken})).status,404);
  // A member cannot bypass the payment flow through administrative membership writes.
  const memberBefore=(await pool.query('SELECT subscription_plan,subscription_end_date FROM users WHERE id=$1',[ids[1]])).rows[0];
  for(const role of ['MEMBER','PRESIDENT']) {
    const headers={'Content-Type':'application/json',Authorization:`Bearer ${jwt.sign({id:ids[0],role},process.env.JWT_SECRET)}`};
    assert.equal((await fetch(`${base}/memberships`,{method:'POST',headers,body:JSON.stringify({user_id:ids[1],plan:'1_MONTH'})})).status,403);
    assert.equal((await fetch(`${base}/memberships/${ids[1]}`,{method:'PUT',headers,body:JSON.stringify({status:'ACTIVE'})})).status,403);
  }
  assert.equal((await fetch(`${base}/memberships`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${payment.receiptToken}`},body:JSON.stringify({user_id:ids[1],plan:'1_MONTH'})})).status,403);
  assert.deepEqual((await pool.query('SELECT subscription_plan,subscription_end_date FROM users WHERE id=$1',[ids[1]])).rows[0],memberBefore);
  const adminHeaders={'Content-Type':'application/json',Authorization:`Bearer ${jwt.sign({id:ids[0],role:'ADMIN'},process.env.JWT_SECRET)}`};
  assert.equal((await fetch(`${base}/memberships`,{method:'POST',headers:adminHeaders,body:JSON.stringify({user_id:randomUUID(),plan:'1_MONTH'})})).status,404);
  // A failed local side effect rolls back payment status and can be retried without a second charge.
  const rollback=await create();results.set(rollback.invoiceId,{...results.get(rollback.invoiceId),status_code:100,transaction_status:'Completed'});
  await pool.query("CREATE FUNCTION fixture_payment_write_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic write failure'; END; $$; CREATE TRIGGER fixture_payment_write_failure BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fixture_payment_write_failure()");
  try {assert.equal((await call('/payment/status',null,{invoiceId:rollback.invoiceId,receiptToken:rollback.receiptToken})).status,502);}
  finally{await pool.query('DROP TRIGGER fixture_payment_write_failure ON users; DROP FUNCTION fixture_payment_write_failure()');}
  assert.equal((await pool.query('SELECT status FROM payment_transactions WHERE merchant_oid=$1',[rollback.invoiceId])).rows[0].status,'PENDING');
  assert.equal((await call('/payment/status',null,{invoiceId:rollback.invoiceId,receiptToken:rollback.receiptToken})).status,200);
  const failed=await create();results.set(failed.invoiceId,{...results.get(failed.invoiceId),status_code:68,transaction_status:'Failed'});
  assert.equal((await (await call('/payment/status',null,{invoiceId:failed.invoiceId,receiptToken:failed.receiptToken})).json()).status,'FAILED');
  // Legacy unowned payments are not assigned from untrusted action_data.
  const orphan=`INV-${randomUUID()}`;await pool.query("INSERT INTO payment_transactions(merchant_oid,user_id,amount,status,action_type,plan_id,action_data) VALUES($1,NULL,100,'PENDING','membership','1_MONTH',$2)",[orphan,JSON.stringify({user_id:ids[1],plan:'1_MONTH'})]);
  results.set(orphan,{invoice_id:orphan,status_code:100,transaction_status:'Completed',transaction_type:'Auth',transaction_amount:100});
  assert.equal((await call('/payment/sipay-callback/success',null,{invoice_id:orphan})).status,409);
  assert.equal((await pool.query('SELECT user_id,status FROM payment_transactions WHERE merchant_oid=$1',[orphan])).rows[0].status,'PENDING');
  // Event and visitor side effects are also repeat-safe and committed with the payment.
  const event=randomUUID();await pool.query("INSERT INTO events(id,title,start_at,type,generate_tickets,created_by) VALUES($1,'Fixture',NOW(),'social',true,$2)",[event,ids[0]]);
  const eventPayment=await create('event_registration',{event_id:event,user_id:ids[0]});results.set(eventPayment.invoiceId,{...results.get(eventPayment.invoiceId),status_code:100,transaction_status:'Completed'});
  await Promise.all([0,1,2].map(()=>call('/payment/status',null,{invoiceId:eventPayment.invoiceId,receiptToken:eventPayment.receiptToken})));
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM attendance WHERE event_id=$1 AND user_id=$2',[event,ids[0]])).rows[0].count,1);
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM event_tickets WHERE event_id=$1 AND user_id=$2',[event,ids[0]])).rows[0].count,1);
  const visitor=await create('visitor_registration',{name:'Visitor Fixture',email:'visitor@example.invalid'});results.set(visitor.invoiceId,{...results.get(visitor.invoiceId),status_code:100,transaction_status:'Completed'});
  await Promise.all([0,1,2].map(()=>call('/payment/status',null,{invoiceId:visitor.invoiceId,receiptToken:visitor.receiptToken})));
  assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM public_visitors WHERE email='visitor@example.invalid' AND event_id IS NULL")).rows[0].count,1);
  const otherUser=(await pool.query('SELECT subscription_end_date FROM users WHERE id=$1',[ids[1]])).rows[0];assert.equal(otherUser.subscription_end_date,null);
  console.log('Local gateway + Express + PostgreSQL: ownership, receipt boundary, provider proof/hash/amount/preauth, callback race/repeat/late-fail, rollback/retry, membership/event/guest effects passed. No real provider, payment or email.');
}
let exitCode=0;
try {await main();}catch(error){exitCode=1;console.error(error.stack);}
finally{
  if(appServer)await new Promise(resolve=>appServer.close(resolve));
  if(gateway)await new Promise(resolve=>gateway.close(resolve));
  if(pool)await pool.end();
  if(containerStarted)try{docker(['stop','--time','3',container]);}catch(error){exitCode=1;console.error(error.message);}
}
process.exit(exitCode);
