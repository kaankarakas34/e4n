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
  const consistent=s.group.filter(r=>r.status==='ACTIVE').length===36&&s.group.find(r=>r.user_id===fixture.ids.applicant)?.status==='REQUESTED'
    &&s.jobs.length===1&&s.jobs[0].state==='SUCCESS'&&s.jobs[0].source==='ADMIN'&&s.jobs[0].summary.changed===0
    &&s.attendance.length===2&&s.documents.length===1&&s.documents[0].title==='Browser Shared Contract'
    &&Buffer.from(s.documents[0].bytes||'','hex').equals(Buffer.from('%PDF-1.7\nBrowser isolated contract\n%%EOF'))
    &&s.messages.length===1&&s.messages[0].sender_id===fixture.ids.member&&s.messages[0].receiver_id===fixture.ids.president&&s.messages[0].content==='Browser local message';
  report.cases.push({name:'database-final-state',status:consistent?'PASS':'FAIL'});report.passed=report.cases.filter(c=>c.status==='PASS').length;report.failed=report.cases.length-report.passed;
  report.finishedAt=new Date().toISOString();report.baseCommit=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).stdout.trim();
  fs.writeFileSync(path.join(fixture.runDir,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({report:path.relative(root,path.join(fixture.runDir,'browser-report.json')),passed:report.passed,failed:report.failed,releaseReady:false}));process.exitCode=report.failed?1:0;
}finally{call(['close']);await fetch(fixture.controlBase+'/stop',{method:'POST',headers:{'x-fixture-key':fixture.secret},signal:AbortSignal.timeout(5000)});}
