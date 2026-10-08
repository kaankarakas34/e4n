// CLI driver: start web-browser-fixture.mjs first, then pass a Playwright CLI JS path.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cli=process.argv[2];if(!cli||!fs.existsSync(cli))throw Error('Pass the installed Playwright CLI JavaScript entry path');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'output/web-browser-current.json'),'utf8'));
for(const k of ['apiBase','webBase','controlBase'])if(new URL(fixture[k]).hostname!=='127.0.0.1')throw Error('Only the loopback fixture is allowed');
const preflight=await fetch(fixture.controlBase+'/state',{headers:{'x-fixture-key':fixture.secret},signal:AbortSignal.timeout(5000)});if(!preflight.ok)throw Error('Disposable fixture is not active');
const source=fs.readFileSync(path.join(root,'server/test/web-browser-acceptance.js'),'utf8').replace('/*E4N_BROWSER_FIXTURE*/null',JSON.stringify(fixture));
const codeFile=path.join(fixture.runDir,'browser-code.js');fs.writeFileSync(codeFile,source);
const session='e4n-p37-'+Date.now();
const call=args=>spawnSync(process.execPath,[cli,'-s='+session,...args],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});
try{
  const opened=call(['open','about:blank']);if(opened.status!==0)throw Error('Could not open isolated browser');
  const r=call(['run-code','--filename',codeFile]);fs.writeFileSync(path.join(fixture.runDir,'browser-cli.log'),(r.stdout||'')+(r.stderr||''));
  const result=r.stdout?.match(/### Result\r?\n([^\r\n]+)/)?.[1];if(r.status!==0||!result)throw Error('Browser verification did not return a complete result');
  const report=JSON.parse(result);
  const stateResponse=await fetch(fixture.controlBase+'/state',{headers:{'x-fixture-key':fixture.secret},signal:AbortSignal.timeout(5000)});if(!stateResponse.ok)throw Error('Could not verify final disposable database state');
  report.databaseState=await stateResponse.json();const s=report.databaseState;
  const consistent=s.externalReferrals.length===1&&s.externalReferrals[0].giver_id===fixture.ids.member&&s.externalReferrals[0].receiver_id===fixture.ids.admin&&s.externalReferrals[0].type==='EXTERNAL'&&s.externalReferrals[0].status==='PENDING'&&s.attendanceObservations.length===3&&s.attendanceObservations.every(r=>r.event_id===fixture.ids.pastEvent&&r.user_id===fixture.ids.member)&&s.attendanceObservations.map(r=>r.after_status).join(',')==='PRESENT,ABSENT,REGISTERED'&&s.observedAttendance.length===2&&s.observedAttendance.find(r=>r.user_id===fixture.ids.member)?.status==='REGISTERED'&&s.observedAttendance.find(r=>r.user_id===fixture.ids.president)?.status==='PRESENT'&&s.lifecycleTickets.length===1&&s.lifecycleTickets[0].user_id===fixture.ids.member&&s.lifecycleTickets[0].status==='CLOSED'&&s.lifecycleReferrals.length===1&&s.lifecycleReferrals[0].giver_id===fixture.ids.member&&s.lifecycleReferrals[0].receiver_id===fixture.ids.president&&s.lifecycleReferrals[0].status==='SUCCESSFUL'&&s.lifecycleReferrals[0].amount==='120.50'&&s.lifecycleMeetings.length===1&&s.lifecycleMeetings[0].requester_id===fixture.ids.member&&s.lifecycleMeetings[0].partner_id===fixture.ids.president&&s.lifecycleMeetings[0].status==='ACCEPTED'&&s.activeMemberships.length===37&&new Set(s.activeMemberships.map(r=>r.user_id)).size===37&&s.shuffleHistory.length===1&&s.shuffleHistory[0].member_count===37&&s.shuffleHistory[0].before_snapshot.memberships.some(r=>r.user_id===fixture.ids.applicant&&r.status==='REQUESTED')&&s.shuffleHistory[0].after_snapshot.memberships.filter(r=>r.status==='ACTIVE').length===37
    &&s.membershipHistory.some(e=>e.user_id===fixture.ids.member&&e.operation==='UPDATE'&&e.before_state.status==='ACTIVE'&&e.after_state.status==='INACTIVE')&&s.membershipHistory.some(e=>e.user_id===fixture.ids.member&&e.after_state?.status==='ACTIVE')
    &&s.membershipInvoices.length===1&&s.membershipInvoices[0].id===fixture.ids.invoice&&Buffer.from(s.membershipInvoices[0].bytes,'hex').equals(Buffer.from('%PDF-1.7 browser membership fixture'))&&s.membershipPayments.length===2&&s.membershipPayments.find(p=>p.merchant_oid==='browser-unowned-payment')?.user_id===null&&s.reminderRecords.length===1&&s.reminderRecords[0].delivery_state==='UNKNOWN'
    &&s.jobs.length===1&&s.jobs[0].state==='SUCCESS'&&s.jobs[0].source==='ADMIN'&&s.jobs[0].summary.changed===0
    &&s.attendance.length===3&&s.attendance.find(a=>a.user_id===fixture.ids.admin)?.status==='REGISTERED'&&s.attendance.find(a=>a.user_id===fixture.ids.member)?.status==='REGISTERED'&&s.attendance.find(a=>a.user_id===fixture.ids.president)?.status==='PRESENT'&&s.documents.length===1&&s.documents[0].title==='Browser Shared Contract'
    &&Buffer.from(s.documents[0].bytes||'','hex').equals(Buffer.from('%PDF-1.7\nBrowser isolated contract\n%%EOF'))
    &&s.messages.length===1&&s.messages[0].sender_id===fixture.ids.member&&s.messages[0].receiver_id===fixture.ids.president&&s.messages[0].content==='Browser local message';
  report.cases.push({name:'database-final-state',status:consistent?'PASS':'FAIL'});report.passed=report.cases.filter(c=>c.status==='PASS').length;report.failed=report.cases.length-report.passed;
  report.finishedAt=new Date().toISOString();report.baseCommit=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).stdout.trim();
  fs.writeFileSync(path.join(fixture.runDir,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({report:path.relative(root,path.join(fixture.runDir,'browser-report.json')),passed:report.passed,failed:report.failed,releaseReady:false}));process.exitCode=report.failed?1:0;
}finally{call(['close']);await fetch(fixture.controlBase+'/stop',{method:'POST',headers:{'x-fixture-key':fixture.secret},signal:AbortSignal.timeout(5000)});}
