import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),cli=process.argv[2];
if(!cli||!fs.existsSync(cli))throw Error('Pass the installed Playwright CLI entry path');
const runDir=path.join(root,'output','guild-roster',new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(runDir,{recursive:true});
const packageFiles=['server/test/web-browser-fixture.mjs','server/src/index.js','server/test/group-capacity-contract.mjs','server/test/guild-roster-browser.js','server/test/run-guild-roster-browser.mjs','src/api/api.ts','src/hooks/useGroupMemberActions.ts','src/pages/AdminGroupDetail.tsx','src/pages/GroupDetail.tsx','src/pages/GroupManagerDashboard.tsx'];
const source=()=>{const hash=createHash('sha256');for(const file of packageFiles)hash.update(file+'\0').update(fs.readFileSync(path.join(root,file)));return hash.digest('hex');};
const sourceBefore=source();
const child=spawn(process.execPath,[path.join(root,'server/test/web-browser-fixture.mjs')],{cwd:root,windowsHide:true,env:{...process.env,E4N_GUILD_ROSTER_FIXTURE:'1'},stdio:['ignore','pipe','pipe']});
const log=fs.createWriteStream(path.join(runDir,'fixture.log'));let stdout='',fixture,report,reportPath;
const exit=new Promise(resolve=>child.once('exit',code=>resolve(code)));
const session='e4n-roster-'+Date.now();const call=args=>spawnSync(process.execPath,[cli,'-s='+session,...args],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024,timeout:180000});
try{
  const fixturePath=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Fixture readiness timed out')),60000);
    child.stdout.on('data',data=>{log.write(data);stdout+=data;const ref=stdout.match(/WEB_BROWSER_READY ([^\r\n]+)/)?.[1];if(ref){clearTimeout(timer);resolve(path.resolve(root,ref));}});child.stderr.on('data',data=>log.write(data));
    child.once('error',error=>{clearTimeout(timer);reject(error);});exit.then(()=>{if(!stdout.includes('WEB_BROWSER_READY')){clearTimeout(timer);reject(Error('Fixture exited before ready'));}});
  });
  if(!fixturePath.startsWith(path.join(root,'output')+path.sep))throw Error('Fixture path outside output');
  fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
  for(const key of ['apiBase','webBase','controlBase'])if(new URL(fixture[key]).hostname!=='127.0.0.1')throw Error('Only loopback fixture allowed');
  if(fixture.productionWrites!==false||fixture.realMail!==false||fixture.realPayment!==false)throw Error('Fixture isolation missing');
  const preflight=await fetch(fixture.controlBase+'/state',{headers:{'x-fixture-key':fixture.secret},signal:AbortSignal.timeout(30000)});if(!preflight.ok)throw Error('Fixture state unavailable');
  const codeFile=path.join(runDir,'browser-code.js');fs.writeFileSync(codeFile,fs.readFileSync(path.join(root,'server/test/guild-roster-browser.js'),'utf8').replace('/*E4N_BROWSER_FIXTURE*/null',JSON.stringify({...fixture,runDir:runDir.replaceAll('\\','/')})));
  if(call(['open','about:blank']).status!==0)throw Error('Isolated browser open failed');
  const result=call(['run-code','--filename',codeFile]);fs.writeFileSync(path.join(runDir,'browser-cli.log'),(result.stdout||'')+(result.stderr||''));
  const payload=result.stdout?.match(/### Result\r?\n([^\r\n]+)/)?.[1];if(result.status!==0||!payload)throw Error('Browser returned no complete report');
  report=JSON.parse(payload);const stateResponse=await fetch(fixture.controlBase+'/state',{headers:{'x-fixture-key':fixture.secret},signal:AbortSignal.timeout(30000)});if(!stateResponse.ok)throw Error('Final DB read failed');
  const state=await stateResponse.json();
  const valid=state.rosterGuild.length===2&&state.rosterGuild.some(m=>m.user_id===fixture.ids.president&&m.status==='ACTIVE')&&state.rosterGuild.some(m=>m.user_id===fixture.ids.member&&m.status==='ACTIVE');
  report.cases.push({name:'final-guild-roster',status:valid?'PASS':'FAIL'});report.passed=report.cases.filter(c=>c.status==='PASS').length;report.failed=report.cases.length-report.passed;report.finalState={rosterGuild:state.rosterGuild};
  report.commit=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).stdout.trim();report.sourceBefore=sourceBefore;report.sourceAfter=source();report.dirty=!!spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8',windowsHide:true}).stdout.trim();
  if(report.sourceAfter!==sourceBefore){report.cases.push({name:'unchanged-package-source',status:'FAIL'});report.failed++;}
  Object.assign(report,{productionWrites:fixture.productionWrites,realMail:fixture.realMail,realPayment:fixture.realPayment});
  reportPath=path.join(runDir,'report.json');process.exitCode=report.failed?1:0;
}finally{
  call(['close']);if(fixture)await fetch(fixture.controlBase+'/stop',{method:'POST',headers:{'x-fixture-key':fixture.secret},signal:AbortSignal.timeout(5000)}).catch(()=>{});else child.kill();
  const closed=await Promise.race([exit,new Promise(resolve=>setTimeout(()=>resolve('TIMEOUT'),15000))]);
  if(child.exitCode===null)child.kill();log.end();
  if(report){report.cleanup={status:closed===0?'PASS':'FAIL',fixtureExitCode:closed};
    if(closed!==0){report.cases.push({name:'owned-fixture-cleanup',status:'FAIL'});report.failed++;process.exitCode=1;}
    fs.writeFileSync(reportPath,JSON.stringify(report,null,2));console.log(JSON.stringify({report:path.relative(root,reportPath),passed:report.passed,failed:report.failed,cleanup:report.cleanup.status,releaseReady:false}));
  }

}
