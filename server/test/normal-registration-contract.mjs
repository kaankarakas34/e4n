// Full Express + PG17 fixture; no production configuration, payment or mail.
import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import {companyRegistrationPreflight} from '../src/company-registration-preflight.js';
const root=path.resolve(import.meta.dirname,'../..');
const child=spawn(process.execPath,['server/test/web-browser-fixture.mjs'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
const log=fs.createWriteStream(path.join(root,'output/normal-registration-fixture.log'));
let fixture,pool,stdout='';const exited=new Promise(r=>child.once('close',r));
try{
 const ref=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Fixture timeout')),60000);child.stdout.on('data',b=>{log.write(b);stdout+=b;const p=stdout.match(/WEB_BROWSER_READY ([^\r\n]+)/)?.[1];if(p){clearTimeout(timer);resolve(p);}});child.stderr.on('data',b=>log.write(b));child.once('error',reject);exited.then(()=>{clearTimeout(timer);if(!stdout.includes('WEB_BROWSER_READY'))reject(Error('Fixture exited'));});});
 fixture=JSON.parse(fs.readFileSync(path.resolve(root,ref),'utf8'));
 for(const k of ['apiBase','controlBase'])assert.equal(new URL(fixture[k]).hostname,'127.0.0.1');
 assert.equal(fixture.schemaVersions,28);assert.equal(fixture.productionWrites,false);
 const ports=spawnSync('docker',['port',fixture.container,'5432/tcp'],{encoding:'utf8',windowsHide:true});
 const port=Number(ports.stdout.match(/127\.0\.0\.1:(\d+)/)?.[1]);assert.ok(port);
 pool=new pg.Pool({host:'127.0.0.1',port,user:'e4n_isolated_test',database:'e4n_isolated_test',password:'local_fixture_only'});
 const base={name:'Synthetic signup',password:'Synthetic_Signup_2026!',phone:'05000000000',profession:'Synthetic Engineer',company:'Synthetic company',taxOffice:'  Fixture tax office  ',billingAddress:'  Fixture company address  ',city:' istanbul ',taxNumber:'0000000001',kvkkConsent:true,explicitConsent:true,marketingConsent:false};
 const call=async(method,url,body,actor)=>{const token=actor?jwt.sign({id:actor,role:actor===fixture.ids.admin?'ADMIN':'MEMBER'},'web_browser_fixture_only'):null;return fetch(fixture.apiBase+'/api'+url,{method,headers:{'Content-Type':'application/json','Connection':'close',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});};
 const post=b=>call('POST','/auth/register',b);const email=()=>randomUUID()+'@example.invalid';
 const race=await Promise.all(Array.from({length:8},()=>post({...base,email:email()})));assert.equal(race.filter(r=>r.status===201).length,1);assert.equal(race.filter(r=>r.status===409).length,7);
 const bodies=await Promise.all(race.map(r=>r.json()));const result=bodies[race.findIndex(r=>r.status===201)];assert.equal(result.role,'MEMBER');assert.equal(result.account_status,'UNSUBSCRIBED');assert.equal(result.tax_number,undefined);assert.equal(result.password_hash,undefined);
 const row=(await pool.query('SELECT * FROM users WHERE id=$1',[result.id])).rows[0];assert.equal(row.city,'İstanbul');assert.equal(row.company_registration,true);assert.equal(row.tax_office,base.taxOffice.trim());assert.equal(row.billing_address,base.billingAddress.trim());assert.equal(row.tax_number,base.taxNumber);assert.equal(row.subscription_plan,null);assert.equal(row.subscription_end_date,null);assert.equal(row.password_hash.startsWith('$2'),true);assert.equal((await pool.query('SELECT count(*)::int n FROM group_members WHERE user_id=$1',[result.id])).rows[0].n,0);
 assert.equal((await call('POST','/auth/login',{email:row.email.toUpperCase(),password:base.password})).status,200);
 assert.equal((await call('POST','/groups/'+fixture.ids.emptyGroup+'/join',{},result.id)).status,403);
 assert.equal((await pool.query('SELECT count(*)::int n FROM group_members WHERE user_id=$1',[result.id])).rows[0].n,0);
 for(const patch of [{city:undefined},{city:''},{city:'Fixture'},{city:123},{taxOffice:undefined},{taxOffice:''},{taxOffice:'   '},{taxOffice:null},{taxOffice:123},{taxOffice:'x'.repeat(101)},{billingAddress:undefined},{billingAddress:''},{billingAddress:'   '},{billingAddress:null},{billingAddress:123},{billingAddress:'x'.repeat(5001)},{tax_office:'conflicting'},{billing_address:'conflicting'},{company:''},{taxNumber:''},{taxNumber:'123'},{taxNumber:'12345678901x'},{taxNumber:'01234567890'},{taxNumber:1234567890},{role:'ADMIN'},{role:'COMMUNITY_MEMBER'},{kvkkConsent:false},{explicitConsent:false},{subscription_plan:'ANNUAL'},{company_registration:false},{password:'short'}])assert.equal((await post({...base,email:email(),...patch})).status,400);
 const tc=await post({...base,email:email(),taxNumber:'12345678901'});assert.equal(tc.status,201);const second=await tc.json();
 assert.equal((await post({...base,email:row.email.toUpperCase(),taxNumber:'0000000002'})).status,409);
 assert.equal((await post({...base,email:email(),taxNumber:'000 000-0001'})).status,409);
 assert.equal((await post({...base,email:email(),tax_number:'0000000002'})).status,400);
 assert.equal((await call('PUT','/users/me',{tax_number:base.taxNumber},second.id)).status,409);
 assert.equal((await call('PUT','/users/me',{company:''},second.id)).status,400);
 assert.equal((await call('PUT','/users/me',{tax_number:''},second.id)).status,400);
 assert.equal((await call('PUT','/users/'+second.id,{tax_number:base.taxNumber,tax_office:'Visitor tax office',billing_address:'Visitor address'},fixture.ids.admin)).status,409);
 for(const field of ['tax_office','billing_address']){for(const value of ['',null,'   ']){assert.equal((await call('PUT','/users/me',{[field]:value},second.id)).status,400);assert.equal((await call('PUT','/users/'+second.id,{[field]:value},fixture.ids.admin)).status,400);await assert.rejects(()=>pool.query('UPDATE users SET '+field+'=$1 WHERE id=$2',[value,second.id]),e=>e.constraint==='users_company_billing_check');}}
 await pool.query('DELETE FROM users WHERE id=$1',[result.id]);assert.equal((await post({...base,email:email()})).status,409);
 assert.equal((await pool.query('SELECT owner_id FROM company_tax_registry WHERE tax_number=$1',[base.taxNumber])).rows[0].owner_id,result.id);
 await assert.rejects(()=>pool.query('DELETE FROM company_tax_registry'),/IMMUTABLE/);await assert.rejects(()=>pool.query('UPDATE company_tax_registry SET owner_id=$1',[second.id]),/IMMUTABLE/);await assert.rejects(()=>pool.query('TRUNCATE company_tax_registry'),/IMMUTABLE/);
 await assert.rejects(()=>pool.query('UPDATE users SET id=$1 WHERE id=$2',[randomUUID(),second.id]),/RESERVED/);
 const tx=await pool.connect();try{await tx.query('BEGIN');await tx.query("INSERT INTO users(email,name,profession,tax_number) VALUES($1,'Rollback','Engineer','0000000003')",[email()]);await tx.query('ROLLBACK');}finally{tx.release();}
 assert.equal((await pool.query("SELECT count(*)::int n FROM company_tax_registry WHERE tax_number='0000000003'")).rows[0].n,0);
 const visitor=randomUUID();await pool.query("INSERT INTO visitors(id,name,email,company,profession,status,visited_at,inviter_id) VALUES($1,'Visitor',$2,'Visitor company','Engineer','ATTENDED',now(),$3)",[visitor,email(),fixture.ids.admin]);
 assert.equal((await call('POST','/visitors/'+visitor+'/convert',{},fixture.ids.admin)).status,400);
 for(const fields of [{tax_number:'0000000003',tax_office:'Office'},{tax_number:'0000000003',billing_address:'Address'}])assert.equal((await call('POST','/visitors/'+visitor+'/convert',fields,fixture.ids.admin)).status,400);
 assert.equal((await call('POST','/visitors/'+visitor+'/convert',{tax_number:'0000000003'},second.id)).status,403);
 assert.equal((await call('POST','/visitors/'+visitor+'/convert',{tax_number:base.taxNumber,tax_office:'Visitor tax office',billing_address:'Visitor address'},fixture.ids.admin)).status,409);
 assert.equal((await pool.query('SELECT status FROM visitors WHERE id=$1',[visitor])).rows[0].status,'ATTENDED');
 assert.equal((await call('POST','/visitors/'+visitor+'/convert',{tax_number:'0000000003',tax_office:'Visitor tax office',billing_address:'Visitor address'},fixture.ids.admin)).status,200);
 const converted=(await pool.query('SELECT tax_office,billing_address FROM users WHERE tax_number=$1',['0000000003'])).rows[0];assert.deepEqual(converted,{tax_office:'Visitor tax office',billing_address:'Visitor address'});
 // Rehearse a pre-26 legacy snapshot transactionally, then roll back to the fixture.
 const sql=fs.readFileSync(path.join(root,'server/supabase/migrations/20261009083750_open_normal_registration.sql'),'utf8');
 const c=await pool.connect();try{await c.query('BEGIN');await c.query('DROP FUNCTION e4n_claim_company_tax() CASCADE; DROP FUNCTION e4n_protect_company_tax_registry() CASCADE; DROP TABLE company_tax_registry,normal_membership_role_transition; ALTER TABLE users DROP COLUMN company_registration; DROP INDEX users_tax_number_unique; DROP INDEX users_email_lower_unique; ALTER TABLE users DROP CONSTRAINT users_role_check; ALTER TABLE users ADD CONSTRAINT users_role_check CHECK(role IN (\'ADMIN\',\'MEMBER\',\'PRESIDENT\',\'VICE_PRESIDENT\',\'SECRETARY_TREASURER\',\'COMMUNITY_MEMBER\'))');
  const legacy=randomUUID();await c.query("INSERT INTO users(id,name,email,profession,role,account_status,tax_number) VALUES($1,'Legacy',$2,'Engineer','COMMUNITY_MEMBER','ACTIVE','000 000-0004')",[legacy,email()]);
  const duplicate=randomUUID();await c.query("INSERT INTO users(id,name,email,profession,tax_number) VALUES($1,'Duplicate',$2,'Engineer','0000000004')",[duplicate,email()]);
  const report=await companyRegistrationPreflight(c);assert.equal(report.migrationBlocked,true);assert.deepEqual(report.duplicateTaxAccountIds.sort(),[legacy,duplicate].sort());assert.ok(report.missingTaxOfficeAccountIds.includes(legacy));assert.ok(report.missingBillingAddressAccountIds.includes(legacy));assert.ok(!JSON.stringify(report).includes('0000000004'));await c.query('SAVEPOINT invalid_migration');await assert.rejects(()=>c.query(sql),/COMPANY_PREFLIGHT_DUPLICATE_TAX_NUMBER/);await c.query('ROLLBACK TO SAVEPOINT invalid_migration');await c.query('DELETE FROM users WHERE id=$1',[duplicate]);
  for(const role of ['anon','authenticated'])await c.query('CREATE ROLE '+role);
  await c.query(sql);assert.equal((await c.query('SELECT role,account_status FROM users WHERE id=$1',[legacy])).rows[0].role,'MEMBER');assert.equal((await c.query('SELECT previous_role FROM normal_membership_role_transition WHERE user_id=$1',[legacy])).rows[0].previous_role,'COMMUNITY_MEMBER');assert.equal((await c.query('SELECT owner_id FROM company_tax_registry WHERE tax_number=$1',['0000000004'])).rows[0].owner_id,legacy);await c.query(sql);
  const incomplete=randomUUID();await c.query("INSERT INTO users(id,name,email,profession,company,tax_number,company_registration) VALUES($1,'Previous registration',$2,'Engineer','Company','0000000098',true)",[incomplete,email()]);
  const billingSql=fs.readFileSync(path.join(root,'server/supabase/migrations/20261009115143_required_company_billing.sql'),'utf8');await c.query(billingSql);await c.query(billingSql);assert.equal((await c.query('SELECT tax_office,billing_address FROM users WHERE id=$1',[legacy])).rows[0].tax_office,null);await c.query('SAVEPOINT billing_guard');await assert.rejects(()=>c.query("INSERT INTO users(name,email,profession,company,tax_number,company_registration) VALUES('Missing',$1,'Engineer','Company','0000000099',true)",[email()]),e=>e.constraint==='users_company_billing_check');await c.query('ROLLBACK TO SAVEPOINT billing_guard');
  assert.equal((await c.query('SELECT tax_office FROM users WHERE id=$1',[incomplete])).rows[0].tax_office,null);await c.query('SAVEPOINT completion_guard');await assert.rejects(()=>c.query("UPDATE users SET name='Incomplete edit' WHERE id=$1",[incomplete]),e=>e.constraint==='users_company_billing_check');await c.query('ROLLBACK TO SAVEPOINT completion_guard');await c.query("UPDATE users SET tax_office='Office',billing_address='Address' WHERE id=$1",[incomplete]);
  assert.equal((await c.query("SELECT count(*)::int n FROM pg_class WHERE relname IN ('company_tax_registry','normal_membership_role_transition') AND relrowsecurity")).rows[0].n,2);for(const role of ['anon','authenticated'])for(const table of ['company_tax_registry','normal_membership_role_transition'])assert.equal((await c.query("SELECT has_table_privilege($1,$2,'SELECT') allowed",[role,table])).rows[0].allowed,false);await c.query('ROLLBACK');
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 const state=await(await fetch(fixture.controlBase+'/state',{headers:{'x-fixture-key':fixture.secret}})).json();assert.equal(state.mails,0);
 if(process.argv[2]){
  const cli=process.argv[2],session='e4n-registration-'+Date.now(),runDir=path.join(root,'output','normal-registration-browser-'+Date.now());fs.mkdirSync(runDir,{recursive:true});
  const signupEmail='browser-'+email(),file=path.join(runDir,'browser-code.js');fs.writeFileSync(file,fs.readFileSync(path.join(root,'server/test/normal-registration-browser.js'),'utf8').replace('/*E4N_BROWSER_FIXTURE*/null',JSON.stringify({...fixture,signupEmail,runDir:runDir.replaceAll('\\','/')})));
  const browser=args=>spawnSync(process.execPath,[cli,'-s='+session,...args],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024,timeout:180000});
  try{assert.equal(browser(['open','about:blank']).status,0);const r=browser(['run-code','--filename',file]);fs.writeFileSync(path.join(runDir,'browser-cli.log'),(r.stdout||'')+(r.stderr||''));assert.equal(r.status,0);const payload=r.stdout.match(/### Result\r?\n([^\r\n]+)/)?.[1];assert.ok(payload,'Missing browser report');const report=JSON.parse(payload);fs.writeFileSync(path.join(runDir,'report.json'),JSON.stringify(report,null,2));assert.equal(report.failed,0,JSON.stringify(report));
   const account=(await pool.query('SELECT role,account_status,tax_number,tax_office,billing_address,subscription_end_date FROM users WHERE email=$1',[signupEmail])).rows[0];assert.deepEqual(account,{role:'MEMBER',account_status:'UNSUBSCRIBED',tax_number:'0000000100',tax_office:'Browser Tax Office',billing_address:'Browser Company Address',subscription_end_date:null});console.log('Registration browser PASS: '+report.passed+'/3; actual UI/API/final DB; '+path.relative(root,runDir));
  }finally{browser(['close']);}
 }
 console.log('Normal registration PASS: PG17/schema28, mandatory company/tax/office/address, 8-way race, VKN/TCKN + no invitation/approval, no subscription/group grant, login, role/protected/consent validation, profile/admin/visitor writers, atomic rollback, deleted-account reservation, immutable private registry, legacy normalized role/identity migration and replay. No live writes/mail/payment.');
}catch(e){console.error(e.stack);if(e.cause)console.error('Fixture transport cause:',e.cause.code??e.cause.message);process.exitCode=1;}finally{
 await pool?.end();if(fixture)await fetch(fixture.controlBase+'/stop',{method:'POST',headers:{'x-fixture-key':fixture.secret}}).catch(()=>{});else child.kill();await exited;log.end();
}
