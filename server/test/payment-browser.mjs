// Uses the payment contract's disposable database, Express server and fake bank.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import bcrypt from 'bcryptjs';

export async function verifyPaymentBrowser({cli,pool,userId,apiBase}) {
  const root=path.resolve(import.meta.dirname,'../..');
  assert.ok(fs.existsSync(cli),'Installed Playwright CLI required');
  assert.equal(new URL(apiBase).hostname,'127.0.0.1');
  const runDir=path.join(root,'output/payment-browser',new Date().toISOString().replace(/[:.]/g,'-'));
  fs.mkdirSync(runDir,{recursive:true});
  const password='Audit_fixture_2026!';
  await pool.query("UPDATE users SET role='MEMBER',account_status='UNSUBSCRIBED',subscription_plan=NULL,subscription_end_date=NULL,password_hash=$2,company='Audit Fixture',tax_number='0000000001',tax_office='Fixture office',billing_address='Fixture billing address',company_registration=true,city='İstanbul' WHERE id=$1",[userId,await bcrypt.hash(password,10)]);
  const vite=await createServer({root,configFile:path.join(root,'vite.config.ts'),envDir:path.join(root,'server/test/.nonexistent-env-dir'),define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('https://fixture.example.invalid'),'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify('fixture-public-key')},server:{host:'127.0.0.1',port:0,open:false}});
  const session='e4n-payment-'+Date.now();
  // Async child calls keep the fake bank and real Express server responsive.
  const browser=async args=>{const c=spawn(process.execPath,[cli,...args,'--session='+session],{cwd:root,windowsHide:true});let output='';c.stdout.on('data',x=>output+=x);c.stderr.on('data',x=>output+=x);const [code]=await once(c,'close');return{code,output};};
  try {
    await vite.listen();
    const fixture={apiBase,webBase:'http://127.0.0.1:'+vite.httpServer.address().port,password,runDir:runDir.replaceAll('\\','/')};
    let code=fs.readFileSync(path.join(root,'server/test/subscription-payment-browser.js'),'utf8');
    const publicCode=fs.readFileSync(path.join(root,'server/test/public-membership-browser.js'),'utf8').replace('/*FIXTURE*/null','f');
    code=code.replace('/*PUBLIC_ACCEPTANCE*/',`const publicAcceptance=await (${publicCode})(page);report.cases.push(...publicAcceptance.cases);`);
    const codeFile=path.join(runDir,'browser-code.js');fs.writeFileSync(codeFile,code.replace('/*FIXTURE*/null',JSON.stringify(fixture)));
    assert.equal((await browser(['open','about:blank'])).code,0);
    const r=await browser(['run-code','--filename='+codeFile]);fs.writeFileSync(path.join(runDir,'cli.log'),r.output);
    assert.equal(r.code,0,r.output);
    const payload=r.output.match(/### Result\r?\n([^\r\n]+)/)?.[1];assert.ok(payload,r.output);
    const result=JSON.parse(payload);assert.deepEqual(result.issues,[]);
    const state=(await pool.query('SELECT subscription_plan,account_status,last_membership_payment_amount FROM users WHERE id=$1',[userId])).rows[0];
    assert.equal(state.subscription_plan,'1_MONTH');assert.equal(state.account_status,'ACTIVE');assert.equal(Number(state.last_membership_payment_amount),7200);
    const report={cases:result.cases.map(name=>({name,status:'PASS'})),passed:result.cases.length,failed:0,finalDatabase:state,productionWrites:false,realMail:false,realPayment:false};
    const reportPath=path.join(runDir,'report.json');fs.writeFileSync(reportPath,JSON.stringify(report,null,2));console.log(JSON.stringify({report:path.relative(root,reportPath),passed:report.passed,failed:0}));
  }finally {await browser(['close']);await vite.close();}
}
