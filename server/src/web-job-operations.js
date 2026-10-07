import {randomUUID,timingSafeEqual} from 'node:crypto';
import {runEventCompletion} from './cron/event-completion.js';
import {runSubscriptionReminders} from './cron/subscription-reminders.js';
import {runChampionCalculation} from './cron/champion-calculation.js';

export const jobNames=['event-completion','subscription-reminders','champion-calculation'];
const manualJobs=jobNames.slice(0,2);
const summaryOf=result=>{
  const summary=Object.fromEntries(['changed','claimed','notifications','emailsSent','emailsUnknown','noEmail','elapsedMs','inserted','existing'].filter(k=>Number.isSafeInteger(result?.[k])&&result[k]>=0).map(k=>[k,result[k]]));
  if(['WEEK','MONTH','TERM','YEAR'].includes(result?.periodType))summary.periodType=result.periodType;
  for(const k of ['startDate','endDate'])if(typeof result?.[k]==='string'&&Number.isFinite(Date.parse(result[k])))summary[k]=new Date(result[k]).toISOString();
  return summary;
};
const safeCode=e=>typeof e?.code==='string'&&/^[A-Z0-9_]{1,48}$/.test(e.code)?e.code:'JOB_ERROR';
export async function runAuditedWebJob(pool,{job,source='SCHEDULE',sendMail,championOptions,execute}={}){
  if(!jobNames.includes(job)||!['SCHEDULE','EXTERNAL','ADMIN'].includes(source))throw Error('Invalid job invocation');
  const id=randomUUID();let client,locked=false;
  try{
    client=await pool.connect();
    locked=(await client.query('SELECT pg_try_advisory_lock(4020,$1) AS acquired',[100+jobNames.indexOf(job)])).rows[0].acquired;
    await client.query('INSERT INTO web_job_runs(id,job,source,state,completed_at) VALUES($1,$2,$3,$4,CASE WHEN $4=\'SKIPPED\' THEN now() ELSE NULL END)',[id,job,source,locked?'RUNNING':'SKIPPED']);
    if(!locked)return {id,job,state:'SKIPPED',summary:{}};
    let result;
    try{
      result=execute?await execute():job==='event-completion'?await runEventCompletion(pool):job==='subscription-reminders'?await runSubscriptionReminders(pool,{sendMail}):await runChampionCalculation(pool,championOptions);
    }catch(error){
      const errorCode=safeCode(error);
      // A runner can throw after a domain commit (e.g. a mail outcome write).
      // Never imply that all effects rolled back from a generic exception.
      await client.query("UPDATE web_job_runs SET state='UNKNOWN',completed_at=now(),error_code=$2 WHERE id=$1",[id,errorCode]);
      return {id,job,state:'UNKNOWN',summary:{},errorCode};
    }
    const state=result?.status==='SKIPPED'||result?.status==='EXISTING'?'SKIPPED':result?.status==='SUCCESS'?'SUCCESS':'UNKNOWN';
    const summary=summaryOf(result);
    try{await client.query('UPDATE web_job_runs SET state=$2,completed_at=now(),summary=$3 WHERE id=$1',[id,state,JSON.stringify(summary)]);}
    catch{console.error(JSON.stringify({job,id,state:'UNKNOWN',errorCode:'HISTORY_FINALIZATION_FAILED'}));return {id,job,state:'UNKNOWN',summary:{},errorCode:'HISTORY_FINALIZATION_FAILED'};}
    return {id,job,state,summary};
  }catch(error){
    console.error(JSON.stringify({job,id,state:'UNKNOWN',errorCode:'JOB_AUDIT_UNAVAILABLE'}));
    throw error;
  }finally{
    if(client){let discard=false;if(locked)try{await client.query('SELECT pg_advisory_unlock(4020,$1)',[100+jobNames.indexOf(job)]);}catch{discard=true;}client.release(discard);}
  }
}

export function installWebJobOperations(app,{pool,authenticateToken,sendMail}){
  const configured=()=>process.env.WEB_JOB_INVOCATION_ENABLED==='true';
  const currentAdmin=async(req,res)=>{
    if(typeof req.user.id!=='string'||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(req.user.id)){res.sendStatus(401);return false;}
    const actor=(await pool.query('SELECT role FROM users WHERE id=$1',[req.user.id])).rows[0];
    if(!actor){res.sendStatus(401);return false;}if(actor.role!=='ADMIN'){res.sendStatus(403);return false;}return true;
  };
  app.get('/api/admin/web-jobs',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(Object.keys(req.query).length)return res.sendStatus(400);
    try{
      if(!await currentAdmin(req,res))return;
      const runs=(await pool.query('SELECT id,job,source,state,started_at,completed_at,summary,error_code FROM web_job_runs ORDER BY started_at DESC,id DESC LIMIT 100')).rows;
      res.json({version:1,ownerId:req.user.id,asOf:new Date().toISOString(),invocationEnabled:configured(),externalConfigured:configured()&&typeof process.env.CRON_SECRET==='string'&&process.env.CRON_SECRET.length>=32,manualJobs,runs});
    }catch{res.status(500).json({error:'İş geçmişi yüklenemedi.'});}
  });
  app.post('/api/admin/web-jobs/:job/run',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(!manualJobs.includes(req.params.job)||Object.keys(req.query).length||Object.keys(req.body||{}).length)return res.sendStatus(400);
    try{
      if(!await currentAdmin(req,res))return;
      if(!configured())return res.status(503).json({error:'Manuel iş çağrıları bu ortamda etkin değil.'});
      const result=await runAuditedWebJob(pool,{job:req.params.job,source:'ADMIN',sendMail});
      res.status(['FAILED','UNKNOWN'].includes(result.state)?503:200).json(result);
    }catch{res.status(503).json({error:'İş sonucu doğrulanamadı. Yeniden çalıştırmadan önce geçmişi kontrol edin.'});}
  });
  app.get('/api/cron/web-jobs/:job',async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    const secret=process.env.CRON_SECRET,header=req.headers.authorization;
    if(!configured()||typeof secret!=='string'||secret.length<32)return res.sendStatus(503);
    const expected=Buffer.from('Bearer '+secret),actual=Buffer.from(typeof header==='string'?header:'');
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return res.sendStatus(401);
    if(!manualJobs.includes(req.params.job)||Object.keys(req.query).length||req.method!=='GET')return res.sendStatus(400);
    try{const result=await runAuditedWebJob(pool,{job:req.params.job,source:'EXTERNAL',sendMail});res.status(['FAILED','UNKNOWN'].includes(result.state)?503:200).json(result);}
    catch{res.status(503).json({error:'Job invocation unavailable'});}
  });
}
