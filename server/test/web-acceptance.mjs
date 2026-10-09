import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const suites=[
  ['normal-registration-contract','Open signup mandatory company fields, tax identity race/deletion guard and legacy migration'],
  ['group-meeting-attendance-contract','Group-scoped explicit bulk meeting attendance, immutable history and canonical retry'],
  ['auth-refresh-contract','Session refresh stale response and transient failure guards'],
  ['notifications-contract','Owner-scoped notification counts, read/replay and rollback'],
  ['self-profile-contract','Owned profile/billing persistence, optimistic conflict, validation and safe acknowledgement'],
  ['user-detail-contract','Private profile/current role/canonical history'],['performance-context-contract','Dashboard owner/session response isolation'],
  ['route-ownership-static','API ownership'],['route-ownership-contract','Actual Express route ownership'],
  ['isolated-smoke','Existing schema, authentication and known defect baselines'],
  ['personal-reports-contract','WEB01 personal reports'],['admin-reports-contract','WEB02 admin reports'],
  ['connections-contract','WEB03 connections'],['messages-contract','WEB04 messages'],
  ['documents-contract','WEB05 document bytes and ownership'],['invoices-contract','WEB06 invoice bytes and ownership'],
  ['event-registration-contract','WEB07 registration/ticket ownership'],['event-attendance-contract','Explicit administrator attendance observation/correction/history'],['web-calendar-contract','WEB08 calendar'],
  ['web-groups-contract','WEB09 personal groups'],['web-activities-contract','WEB10 activities'],
  ['membership-history-contract','Durable membership row history, rollback, owner and admin web transport'],
  ['membership-records-contract','Owned membership/payment/invoice/reminder records and current admin snapshot'],
  ['web-job-operations-contract','Durable web job history, authorized invocation and concurrency'],
  ['shuffle-workspace-contract','Current shuffle workspace, stale draft rejection and preview capacity'],
  ['power-team-settings-contract','Administrator guild create/settings integrity'],['group-settings-contract','WEB11 group settings'],['admin-group-detail-contract','WEB12 group detail'],
  ['admin-visitor-queue-contract','WEB13 visitor queue'],['admin-member-directory-contract','WEB14 member directory'],
  ['admin-group-catalog-contract','WEB15 group catalog'],['group-capacity-contract','P17 admission/transfer/role/shuffle capacity'],
  ['payment-flow','Isolated gateway payment lifecycle'],['meeting-contract','Meeting lifecycle'],
  ['referral-contract','Referral lifecycle'],['support-flow','Support lifecycle'],
  ['event-completion-contract','Event completion transaction'],['champion-calculation-contract','Champion transaction'],
  ['subscription-reminder-contract','Membership reminder claim, notification and mail outcome'],
  ['backup-restore-rehearsal','Synthetic schema/data/file restore'],
];
const runDir=path.join(root,'output/web-acceptance',new Date().toISOString().replace(/[:.]/g,'-'));
mkdirSync(runDir,{recursive:true});
const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true});
if(head.status!==0)throw Error('Could not record tested commit');
const report={version:1,startedAt:new Date().toISOString(),commit:head.stdout.trim(),
  scope:'Existing non-LMS web API/data contracts, not full product/release acceptance',
  productionWrites:false,realPayment:false,realMail:false,browserRerun:false,releaseReady:false,
  gates:[
    {id:'D01-D04',status:'BLOCKED',scope:'Monthly scoring, removal and application ban policy'},
    {id:'D05-D08-D10',status:'BLOCKED',scope:'Service classification, final admission, company proof and remaining membership policy'},
    {id:'SHUFFLE-CUTOFF',status:'BLOCKED',scope:'Exact payment cutoff, grace start, restricted rights and reopening policy'},
    {id:'P09-P10',status:'OPEN',scope:'Live schema adoption and group-scoped roles; database capacity invariant covered by migration 0016'},
    {id:'P26-P29',status:'OPEN',scope:'Historical attendance/ticket interpretation and full shuffle/history/notification acceptance'},
    {id:'BROWSER',status:'NOT_RUN',scope:'Fresh whole-flow browser acceptance; previous package browser evidence remains separate'},
    {id:'SEC-P38',status:'DEFERRED',scope:'Sprint 6 broad security and production release gate'},
    {id:'MOBILE-LMS',status:'EXCLUDED',scope:'Sprint 7 mobile and Sprint 8 course/exam work'},
  ],suites:[]};
const env={...process.env,NODE_ENV:'test',DOTENV_CONFIG_PATH:path.join(root,'server/test/.nonexistent-env')};
for(const key of ['DATABASE_URL','POSTGRES_URL','SUPABASE_DB_URL','SMTP_PASSWORD','SMTP_PASS','SUPABASE_SERVICE_ROLE_KEY'])delete env[key];
for(const [name,scope] of suites){
  const started=Date.now();
  const result=spawnSync(process.execPath,[path.join(root,'server/test',name+'.mjs'),...(name==='referral-contract'?['--web-only']:[])],{
    cwd:root,env,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024,
  });
  const log=path.join(runDir,name+'.log');
  writeFileSync(log,(result.stdout||'')+(result.stderr||'')+(result.error?'\n'+result.error.message:''));
  report.suites.push({name,scope,status:result.status===0&&!result.error?'PASS':'FAIL',exitCode:result.status,durationMs:Date.now()-started,log:path.relative(root,log)});
  report.updatedAt=new Date().toISOString();
  writeFileSync(path.join(runDir,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`${report.suites.at(-1).status} ${name}`);
}
report.finishedAt=new Date().toISOString();
report.passed=report.suites.filter(s=>s.status==='PASS').length;report.failed=report.suites.length-report.passed;
writeFileSync(path.join(runDir,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({report:path.relative(root,path.join(runDir,'report.json')),passed:report.passed,failed:report.failed,releaseReady:false}));
process.exitCode=report.failed?1:0;
