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
const container = `e4n-invoices-${randomUUID().slice(0, 8)}`;
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




  const [admin,member,other,visitor]=Array.from({length:4},()=>randomUUID());
  for(const [i,id] of [admin,member,other].entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,subscription_plan,subscription_end_date) VALUES($1,$2,'Fixture','Fixture','secret',$3,'1_MONTH',now()+interval '1 month')",[id,`invoice-${i}@example.invalid`,i===0?'ADMIN':'MEMBER']);
  await pool.query("INSERT INTO public_visitors(id,name,email,kvkk_accepted,source,form_data) VALUES($1,'Visitor','visitor@example.invalid',true,'visitor_payment',$2)",[visitor,JSON.stringify({payment_status:'PAID',payment_amount:10})]);
  let mails=0,mailFailure=false;const {default:nodemailer}=await import('nodemailer');nodemailer.createTransport=()=>({sendMail:async message=>{mails++;assert(Buffer.isBuffer(message.attachments[0].content));if(mailFailure)throw new Error('isolated uncertain SMTP');return{messageId:'fixture'};}});
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}/api`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(url,id=admin,method='GET',body)=>fetch(base+url,{method,headers:id?{Authorization:`Bearer ${token(id)}`}:{},body,signal:AbortSignal.timeout(10000)});
  const bytes=Buffer.from('%PDF-1.4\nInvoice fixture\n%%EOF');
  const form=(key=randomUUID(),data=bytes,name='invoice.pdf')=>{const f=new FormData();f.set('invoice',new Blob([data]),name);f.set('requestKey',key);return f;};const target=(id=member,type='MEMBER')=>`/admin/accounting/${type}/${id}/upload-invoice`;
  assert.equal((await call(target(),null,'POST',form())).status,401);assert.equal((await call(target(),member,'POST',form())).status,403);
  assert.equal((await call(target(),'00000000-0000-4000-8000-000000000001','POST',form())).status,401);
  assert.equal((await call(target(),admin,'POST',form(randomUUID(),Buffer.from('fake')))).status,400);assert.equal((await call(target(),admin,'POST',form(randomUUID(),Buffer.alloc(3145729)))).status,400);
  const key=randomUUID();const race=await Promise.all(Array.from({length:8},()=>call(target(),admin,'POST',form(key))));assert(race.every(r=>r.status===200));const receipts=await Promise.all(race.map(r=>r.json()));assert.equal(new Set(receipts.map(r=>r.invoiceId)).size,1);assert.equal(receipts.filter(r=>!r.replay).length,1);assert.equal(mails,1);
  const d=receipts[0];assert.equal((await call(target(other),admin,'POST',form(key))).status,409);assert.equal((await call(target(),admin,'POST',form(key,Buffer.from('%PDF-1.4 different')))).status,409);
  for(const id of [admin,member]){const response=await call('/invoices/'+d.invoiceId,id);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);}
  assert.equal((await call('/invoices/'+d.invoiceId,other)).status,404);assert.equal((await call('/invoices/'+d.invoiceId,null)).status,401);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await call(target(),admin,'POST',form())).status,403);assert.equal((await call('/admin/accounting/payments',admin)).status,403);assert.equal((await call('/admin/accounting/payments/MEMBER/'+other,admin,'DELETE')).status,403);assert.equal((await call('/invoices/'+d.invoiceId,admin)).status,404);await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const v=await (await call(target(visitor,'VISITOR'),admin,'POST',form())).json();assert.equal(v.targetType,'VISITOR');assert.equal((await call('/invoices/'+v.invoiceId,member)).status,404);assert.deepEqual(Buffer.from(await (await call('/invoices/'+v.invoiceId)).arrayBuffer()),bytes);
  // A target update error must roll back both file and current invoice URL.
  await pool.query("CREATE FUNCTION fail_invoice_target() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'isolated target failure'; END $$; CREATE TRIGGER fail_invoice_target BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fail_invoice_target()");
  const rollbackKey=randomUUID(),beforeMails=mails;assert.equal((await call(target(),admin,'POST',form(rollbackKey))).status,500);assert.equal((await pool.query('SELECT count(*)::int n FROM invoice_files')).rows[0].n,2);assert.equal(mails,beforeMails);await pool.query('DROP TRIGGER fail_invoice_target ON users; DROP FUNCTION fail_invoice_target()');assert.equal((await call(target(),admin,'POST',form(rollbackKey))).status,200);
  mailFailure=true;const uncertainKey=randomUUID();const uncertain=await (await call(target(),admin,'POST',form(uncertainKey))).json();assert.equal(uncertain.emailState,'UNKNOWN');const mailCount=mails;assert.equal((await (await call(target(),admin,'POST',form(uncertainKey))).json()).emailState,'UNKNOWN');assert.equal(mails,mailCount);mailFailure=false;
  assert.equal((await pool.query('SELECT subscription_invoice_url FROM users WHERE id=$1',[member])).rows[0].subscription_invoice_url,uncertain.invoice_url);assert.equal((await pool.query('SELECT count(*)::int n FROM invoice_files WHERE member_id=$1',[member])).rows[0].n,3);
  await assert.rejects(pool.query('DELETE FROM users WHERE id=$1',[member]),e=>e.code==='23503');await assert.rejects(pool.query('DELETE FROM public_visitors WHERE id=$1',[visitor]),e=>e.code==='23503');
  const root=path.join(serverDir,'..');const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const transportSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("import { emailService } from '../services/emailService';","const emailService={};").replace('import.meta.env.PROD','false').replace('http://localhost:4005/api',base);
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};globalThis.__invoiceTransport=(await import('data:text/javascript;base64,'+Buffer.from(compile(transportSource)).toString('base64'))).invoiceTransport;
  const serviceSource=readFileSync(path.join(root,'src/api/invoices.ts'),'utf8').replace("import {invoiceTransport} from './api';",'const invoiceTransport=globalThis.__invoiceTransport;');const {invoicesApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)).toString('base64'));
  const file=new File([bytes],'typed.pdf',{type:'application/pdf'}),ack=await invoicesApi.upload(admin,{id:member,type:'MEMBER'},file,randomUUID());assert.deepEqual(Buffer.from(await (await invoicesApi.download(ack.invoice_url)).arrayBuffer()),bytes);await assert.rejects(invoicesApi.download('/uploads/old.pdf'));
  const list=await (await call('/admin/accounting/payments')).json();assert(Array.isArray(list));writeFileSync(path.join(root,'output/invoices-browser.json'),JSON.stringify({owner:admin,target:member,records:list,receipt:await (await call(target(),admin,'POST',form())).json(),bytes:bytes.toString('base64')}));
  await pool.query('CREATE ROLE anon; CREATE ROLE authenticated; ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated');const before=(await pool.query('SELECT subscription_invoice_url FROM users WHERE id=$1',[member])).rows[0];await pool.query("ALTER TABLE users DROP COLUMN website, DROP COLUMN bio; DROP TABLE group_application_mail,group_applications; ALTER TABLE notifications DROP COLUMN action_url; DELETE FROM schema_migrations WHERE version='0028_group_application_workflow'; DELETE FROM schema_migrations WHERE version='0027_required_company_billing'; DELETE FROM schema_migrations WHERE version='0026_open_normal_registration'; DELETE FROM schema_migrations WHERE version='0025_membership_operation_context'; DELETE FROM schema_migrations WHERE version='0024_group_meeting_attendance'; DELETE FROM schema_migrations WHERE version='0023_self_profile_fields'; DROP TABLE event_attendance_verifications; DROP FUNCTION e4n_preserve_attendance_verifications(); DELETE FROM schema_migrations WHERE version='0022_event_attendance_verification'; DELETE FROM schema_migrations WHERE version='0021_event_registration_status'; DROP TRIGGER group_members_capture_history ON group_members; DROP TRIGGER group_members_preserve_truncate ON group_members; DROP TABLE group_membership_history; DROP FUNCTION e4n_capture_membership_history(); DROP FUNCTION e4n_preserve_membership_history(); DROP FUNCTION e4n_membership_state(group_members); DELETE FROM schema_migrations WHERE version='0020_group_membership_history'; DROP TABLE shuffle_execution_history; DROP FUNCTION e4n_preserve_shuffle_execution(); DELETE FROM schema_migrations WHERE version='0019_shuffle_execution_history'; DROP TABLE web_job_runs; DELETE FROM schema_migrations WHERE version='0018_web_job_runs'; DROP TABLE subscription_reminder_deliveries; DELETE FROM schema_migrations WHERE version='0017_subscription_reminder_delivery'; DROP TRIGGER IF EXISTS users_group_capacity_write ON users; DROP TRIGGER IF EXISTS group_members_capacity_write ON group_members; DROP FUNCTION IF EXISTS e4n_check_user_group_capacity_write(); DROP FUNCTION IF EXISTS e4n_check_group_capacity_write(); DELETE FROM schema_migrations WHERE version='0016_group_capacity_invariant'; ALTER TABLE group_members DROP CONSTRAINT group_members_status_check; ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK(status IN('ACTIVE','REQUESTED')); ALTER TABLE users DROP COLUMN group_title; DELETE FROM schema_migrations WHERE version='0015_group_membership_state'; ALTER TABLE groups DROP COLUMN meeting_time, DROP COLUMN meeting_link; DELETE FROM schema_migrations WHERE version='0014_group_meeting_settings'");
  await pool.query("DROP TABLE invoice_files; DELETE FROM schema_migrations WHERE version='0013_invoice_files'");assert.deepEqual((await applyVersionedSchema()).applied,['0013_invoice_files','0014_group_meeting_settings','0015_group_membership_state','0016_group_capacity_invariant','0017_subscription_reminder_delivery','0018_web_job_runs','0019_shuffle_execution_history','0020_group_membership_history','0021_event_registration_status','0022_event_attendance_verification','0023_self_profile_fields','0024_group_meeting_attendance','0025_membership_operation_context','0026_open_normal_registration','0027_required_company_billing','0028_group_application_workflow']);assert.equal((await applyVersionedSchema()).applied.length,0);assert.deepEqual((await pool.query('SELECT subscription_invoice_url FROM users WHERE id=$1',[member])).rows[0],before);
  assert.equal((await pool.query("SELECT has_table_privilege('anon','invoice_files','SELECT') allowed")).rows[0].allowed,false);assert.equal((await pool.query("SELECT relrowsecurity FROM pg_class WHERE oid='invoice_files'::regclass")).rows[0].relrowsecurity,true);
  await pool.query('GRANT SELECT,INSERT ON invoice_files TO anon,authenticated');const c=await pool.connect();for(const role of ['anon','authenticated']){await c.query('BEGIN');await c.query(`SET LOCAL ROLE ${role}`);assert.equal((await c.query('SELECT * FROM invoice_files')).rows.length,0);await assert.rejects(c.query("INSERT INTO invoice_files(member_id,uploaded_by,request_key,fingerprint,filename,size_bytes,content,email_state) VALUES($1,$2,$3,$4,'x.pdf',$5,$6,'NO_ADDRESS')",[member,admin,randomUUID(),'a'.repeat(64),bytes.length,bytes]),e=>e.code==='42501');await c.query('ROLLBACK');}c.release();
  console.log('Invoices PASS: fresh13/repeat/12→13, current roles, private owner bytes, 8-way keyed single file/mail, conflict, target rollback/retry, uncertain mail no resend, history/FK, RLS/default grants, actual typed transport and admin accounting list. No live SMTP.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Invoices contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
