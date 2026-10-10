import {randomUUID,timingSafeEqual} from 'node:crypto';
import {runEventCompletion} from './cron/event-completion.js';
import {runSubscriptionReminders} from './cron/subscription-reminders.js';
import {runChampionCalculation} from './cron/champion-calculation.js';

export const jobNames=['event-completion','subscription-reminders','champion-calculation'];
export const manualJobs=jobNames.slice(0,2);

const summaryOf=result=>{
  const summary=Object.fromEntries(
    ['changed','claimed','notifications','emailsSent','emailsUnknown','noEmail','elapsedMs','inserted','existing','total','processed']
      .filter(k=>Number.isSafeInteger(result?.[k])&&result[k]>=0)
      .map(k=>[k,result[k]])
  );
  if(['WEEK','MONTH','TERM','YEAR'].includes(result?.periodType))summary.periodType=result.periodType;
  for(const k of ['startDate','endDate']){
    if(typeof result?.[k]==='string'&&Number.isFinite(Date.parse(result[k])))summary[k]=new Date(result[k]).toISOString();
  }
  return summary;
};

const safeCode=e=>typeof e?.code==='string'&&/^[A-Z0-9_]{1,48}$/.test(e.code)?e.code:'JOB_ERROR';

export async function runAuditedWebJob(pool,{job,source='SCHEDULE',sendMail,championOptions,execute}={}){
  if(!jobNames.includes(job)||!['SCHEDULE','EXTERNAL','ADMIN'].includes(source))throw Error('Invalid job invocation');
  const id=randomUUID();let client,locked=false;
  try{
    client=await pool.connect();
    locked=(await client.query('SELECT pg_try_advisory_lock(4020,$1) AS acquired',[100+jobNames.indexOf(job)])).rows[0].acquired;
    await client.query("INSERT INTO web_job_runs(id,job,source,state,completed_at) VALUES($1,$2,$3,$4,CASE WHEN $4='SKIPPED' THEN now() ELSE NULL END)",[id,job,source,locked?'RUNNING':'SKIPPED']);
    if(!locked)return {id,job,state:'SKIPPED',summary:{}};
    let result;
    try{
      if(execute){
        result=await execute();
      }else if(job==='event-completion'){
        result=await runEventCompletion(pool);
      }else if(job==='subscription-reminders'){
        result=await runSubscriptionReminders(pool,{sendMail});
      }else if(job==='champion-calculation'){
        const opts=championOptions||(()=>{
          const end=new Date();
          const start=new Date(end);
          start.setUTCDate(start.getUTCDate()-7);
          return {
            periodType:'WEEK',
            startDate:start.toISOString(),
            endDate:end.toISOString(),
            runDate:end.toISOString().slice(0,10),
          };
        })();
        result=await runChampionCalculation(pool,opts);
      }
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

async function computeJobsHealth(pool){
  const staleRuns=(await pool.query("SELECT id,job,started_at FROM web_job_runs WHERE state='RUNNING' AND started_at < NOW() - INTERVAL '15 minutes'")).rows;
  const recentErrors=(await pool.query("SELECT count(*)::int AS count FROM web_job_runs WHERE state IN ('FAILED','UNKNOWN') AND started_at > NOW() - INTERVAL '24 hours'")).rows[0].count;
  const alerts=[];
  for(const stale of staleRuns){
    alerts.push({
      level:'CRITICAL',
      code:'STALE_RUNNING_JOB',
      job:stale.job,
      runId:stale.id,
      startedAt:stale.started_at,
      message:`${stale.job} işi 15 dakikadan uzun süredir RUNNING durumunda takılmış görünüyor.`
    });
  }
  if(recentErrors>0){
    alerts.push({
      level:'DEGRADED',
      code:'RECENT_FAILURES',
      message:`Son 24 saatte ${recentErrors} adet başarısız veya belirsiz iş yürütümü kaydedildi.`
    });
  }
  return {
    status:alerts.some(a=>a.level==='CRITICAL')?'CRITICAL':(alerts.length>0?'DEGRADED':'HEALTHY'),
    staleRunningCount:staleRuns.length,
    recentErrorsCount:recentErrors,
    alerts
  };
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
      const health=await computeJobsHealth(pool);
      res.json({version:1,ownerId:req.user.id,asOf:new Date().toISOString(),invocationEnabled:configured(),externalConfigured:configured()&&typeof process.env.CRON_SECRET==='string'&&process.env.CRON_SECRET.length>=32,manualJobs,runs,health});
    }catch{res.status(500).json({error:'İş geçmişi yüklenemedi.'});}
  });
  app.get('/api/admin/web-jobs/health',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(Object.keys(req.query).length)return res.sendStatus(400);
    try{
      if(!await currentAdmin(req,res))return;
      const health=await computeJobsHealth(pool);
      res.json({asOf:new Date().toISOString(),...health});
    }catch{res.status(500).json({error:'Sağlık durumu yüklenemedi.'});}
  });
  app.post('/api/admin/web-jobs/stale-runs/recover',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(Object.keys(req.query).length||Object.keys(req.body||{}).length)return res.sendStatus(400);
    try{
      if(!await currentAdmin(req,res))return;
      const recovered=(await pool.query(
        "UPDATE web_job_runs SET state='UNKNOWN', error_code='STALE_TIMEOUT', completed_at=now() WHERE state='RUNNING' AND started_at < NOW() - INTERVAL '15 minutes' RETURNING id"
      )).rowCount;
      res.json({recoveredCount:recovered});
    }catch{res.status(500).json({error:'Takılı işler temizlenemedi.'});}
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
