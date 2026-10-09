// One fresh, local rehearsal; green technical checks never authorize a release.
import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cli=process.argv[2]==='--playwright-cli'?process.argv[3]:process.argv[2]||process.env.E4N_PLAYWRIGHT_CLI;
if(!cli||!fs.existsSync(cli))throw Error('Pass --playwright-cli <installed CLI JavaScript path> or E4N_PLAYWRIGHT_CLI.');
const npmCli=process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
if(!fs.existsSync(npmCli))throw Error('Run through npm run test:web-rehearsal so npm_execpath is available.');
const runId=randomUUID(),startedAt=new Date().toISOString();
const runDir=path.join(root,'output/web-rehearsal',startedAt.replace(/[:.]/g,'-'));
const lockPath=path.join(root,'output/web-rehearsal.lock');
fs.mkdirSync(path.dirname(lockPath),{recursive:true});
const lock=fs.openSync(lockPath,'wx');
fs.writeFileSync(lock,JSON.stringify({runId,pid:process.pid,startedAt}));fs.closeSync(lock);
fs.mkdirSync(runDir,{recursive:true});
const env={...process.env,NODE_ENV:'test',DOTENV_CONFIG_PATH:path.join(root,'server/test/.nonexistent-env')};
for(const key of ['DATABASE_URL','POSTGRES_URL','SUPABASE_DB_URL','SMTP_PASSWORD','SMTP_PASS','SUPABASE_SERVICE_ROLE_KEY'])delete env[key];
function git(args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error('Could not record source identity');return r.stdout;}
function source(){
  const paths=git(['ls-files','-z','--cached','--others','--exclude-standard','--','src','server/src','server/test','server/tools','server/supabase','server/migrations','package.json','package-lock.json','server/package.json','server/package-lock.json','tsconfig*','vite.config.*','tailwind.config.*','postcss.config.*']);
  const files=[...new Set(paths.split('\0').filter(Boolean))].sort();
  const hash=createHash('sha256');
  for(const file of files){hash.update(file+'\0');hash.update(fs.existsSync(path.join(root,file))?fs.readFileSync(path.join(root,file)):Buffer.from('[deleted]'));hash.update('\0');}
  return {commit:git(['rev-parse','HEAD']).trim(),sha256:hash.digest('hex'),fileCount:files.length,dirty:!!git(['status','--porcelain','--untracked-files=all']).trim()};
}
const report={version:1,runId,startedAt,scope:'Fresh existing non-LMS web API/data/build/browser rehearsal',productionWrites:false,realMail:false,realPayment:false,releaseReady:false,technicalPass:false,steps:[],gates:[]};
const save=()=>fs.writeFileSync(path.join(runDir,'report.json'),JSON.stringify(report,null,2)+'\n');
let fixture=null,fixtureChild=null,fixtureExit=null;
function command(args,logName,onOutput){
  const logPath=path.join(runDir,logName),log=fs.createWriteStream(logPath);
  const child=spawn(process.execPath,args,{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let stdout='';
  child.stdout.on('data',bytes=>{const text=bytes.toString();stdout+=text;log.write(bytes);onOutput?.(text,stdout);});
  child.stderr.on('data',bytes=>log.write(bytes));
  const done=new Promise((resolve,reject)=>{child.once('error',error=>{log.end();reject(error);});child.once('close',(code,signal)=>{log.end(()=>resolve({code,signal,stdout,log:path.relative(root,logPath)}));});});
  return {child,done};
}
async function step(name,args){
  const row={name,status:'RUNNING',startedAt:new Date().toISOString()};report.steps.push(row);save();console.log('START '+name);
  const result=await command(args,name+'.log',name==='api-data'?text=>process.stdout.write(text):undefined).done;
  Object.assign(row,{status:result.code===0?'PASS':'FAIL',exitCode:result.code,finishedAt:new Date().toISOString(),log:result.log});save();
  if(result.code!==0)throw Error(name+' failed; see '+result.log);
  console.log('PASS '+name);return result;
}
function outputReport(stdout){
  const matches=stdout.split(/\r?\n/).filter(line=>line.startsWith('{"report":'));
  if(!matches.length)throw Error('Child did not produce a report reference');
  const ref=JSON.parse(matches.at(-1)).report;
  const absolute=path.resolve(root,ref);
  if(!absolute.startsWith(path.join(root,'output')+path.sep))throw Error('Report path is outside local output');
  return {path:path.relative(root,absolute),data:JSON.parse(fs.readFileSync(absolute,'utf8'))};
}
try{
  report.sourceBefore=source();save();
  const api=outputReport((await step('api-data',[path.join(root,'server/test/web-acceptance.mjs')])).stdout);
  if(api.data.failed!==0||api.data.suites.length!==api.data.passed||api.data.commit!==report.sourceBefore.commit)throw Error('API report is incomplete or belongs to another commit');
  report.api={report:api.path,passed:api.data.passed,failed:api.data.failed};report.gates=api.data.gates;save();
  await step('build',[npmCli,'run','build']);
  const row={name:'fixture',status:'RUNNING',startedAt:new Date().toISOString()};report.steps.push(row);save();
  let readyResolve,readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  const f=command([path.join(root,'server/test/web-browser-fixture.mjs')],'fixture.log',(_text,stdout)=>{
    const ref=stdout.match(/WEB_BROWSER_READY ([^\r\n]+)/)?.[1];if(ref)readyResolve(path.resolve(root,ref));
  });fixtureChild=f.child;fixtureExit=f.done;
  fixtureExit.then(r=>{if(!fixture)readyReject(Error('Fixture exited before ready: '+r.code));}).catch(readyReject);
  const timer=setTimeout(()=>readyReject(Error('Local fixture readiness timed out')),60000);
  let fixturePath;try{fixturePath=await ready;}finally{clearTimeout(timer);}
  if(!fixturePath.startsWith(path.join(root,'output')+path.sep))throw Error('Fixture is outside local output');
  fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
  for(const k of ['apiBase','webBase','controlBase'])if(new URL(fixture[k]).hostname!=='127.0.0.1')throw Error('Fixture must be local');
  if(fixture.productionWrites!==false||fixture.realMail!==false||fixture.realPayment!==false)throw Error('Fixture isolation declaration missing');
  row.status='PASS';row.descriptor=path.relative(root,fixturePath);save();
  // Pin the newly started fixture; never reuse the shared current-fixture pointer.
  const browser=outputReport((await step('browser',[path.join(root,'server/test/run-web-browser-acceptance.mjs'),cli,fixturePath])).stdout);
  if(browser.data.failed!==0||browser.data.cases.length!==browser.data.passed||browser.data.baseCommit!==report.sourceBefore.commit)throw Error('Browser report is incomplete or belongs to another commit');
  report.browser={report:browser.path,passed:browser.data.passed,failed:browser.data.failed};
  // Recent roster flows own fresh fixtures; each is part of this same source gate.
  report.roster=[];
  for(const [name,script] of [['group','run-group-roster-browser.mjs'],['guild','run-guild-roster-browser.mjs'],['history-context','run-history-context-browser.mjs']]){
    const child=outputReport((await step(name+'-browser',[path.join(root,'server/test',script),cli])).stdout);
    if(child.data.failed!==0||child.data.cases.length!==child.data.passed||child.data.commit!==report.sourceBefore.commit
        ||child.data.sourceBefore!==child.data.sourceAfter||child.data.cleanup?.status!=='PASS'
        ||child.data.productionWrites!==false||child.data.realMail!==false||child.data.realPayment!==false)throw Error(name+' roster evidence is incomplete or belongs to another source');
    report.roster.push({scope:name,report:child.path,passed:child.data.passed,failed:child.data.failed,cleanup:child.data.cleanup});save();
  }
  report.browserTotal=report.browser.passed+report.roster.reduce((sum,row)=>sum+row.passed,0);
  report.gates=report.gates.map(g=>g.id==='BROWSER'?{...g,status:'PASS',scope:'Fresh owned web, group, guild and membership actor fixtures; actual web/API/database and final state reconciliation'}:g);
  report.sourceAfter=source();
  if(report.sourceAfter.sha256!==report.sourceBefore.sha256||report.sourceAfter.commit!==report.sourceBefore.commit)throw Error('Source changed during rehearsal; results cannot be combined');
  report.gates.push({id:'SOURCE',status:'PASS',scope:'Same commit and source/dependency/test/config digest before and after'});
  report.technicalPass=true;
}catch(error){report.error=error.message;console.error(error.message);process.exitCode=1;}
finally{
  try{
    if(fixture&&fixtureChild?.exitCode===null){
      await fetch(fixture.controlBase+'/stop',{method:'POST',headers:{'x-fixture-key':fixture.secret},signal:AbortSignal.timeout(5000)}).catch(()=>{});
    }else if(fixtureChild?.exitCode===null)fixtureChild.kill('SIGINT');
    if(fixtureExit){const r=await fixtureExit;report.cleanup={fixtureExitCode:r.code,status:r.code===0?'PASS':'FAIL'};if(r.code!==0){report.technicalPass=false;process.exitCode=1;}}
  }catch(error){report.cleanup={status:'FAIL',error:error.message};report.technicalPass=false;process.exitCode=1;}
  report.finishedAt=new Date().toISOString();save();
  if(JSON.parse(fs.readFileSync(lockPath,'utf8')).runId===runId)fs.unlinkSync(lockPath);
  console.log(JSON.stringify({report:path.relative(root,path.join(runDir,'report.json')),technicalPass:report.technicalPass,api:report.api,browser:report.browser,releaseReady:false}));
}
