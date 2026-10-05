import {randomUUID} from 'node:crypto';

export const eventCompletionLock = [4020, 34];
// Preserve the existing completion rule; registration, attendance and tickets are untouched.
export async function runEventCompletion(pool, {dryRun=false, log=entry=>console.log(JSON.stringify(entry))}={}) {
 const started=Date.now(),runId=randomUUID();let client;
 const emit=entry=>{try{log(entry);}catch{/* Logging transport must not misreport a committed transaction as failed. */}};
 const report=(status,fields={})=>({job:'event-completion',runId,status,elapsedMs:Date.now()-started,...fields});
 try {
  client=await pool.connect();await client.query(dryRun?'BEGIN READ ONLY':'BEGIN');
  await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
  const locked=(await client.query('SELECT pg_try_advisory_xact_lock($1,$2) AS acquired',eventCompletionLock)).rows[0].acquired;
  if(!locked){await client.query('ROLLBACK');const result=report('SKIPPED',{reason:'ALREADY_RUNNING',changed:0});emit(result);return result;}
  const cutoff=(await client.query('SELECT CURRENT_TIMESTAMP AS cutoff')).rows[0].cutoff;
  let changed=0,eligible;
  if(dryRun)eligible=(await client.query("SELECT count(*)::int AS count FROM events WHERE status='PUBLISHED' AND COALESCE(end_at,start_at)<$1",[cutoff])).rows[0].count;
  else changed=(await client.query("UPDATE events SET status='COMPLETED' WHERE status='PUBLISHED' AND COALESCE(end_at,start_at)<$1",[cutoff])).rowCount;
  await client.query('COMMIT');
  const result=report(dryRun?'DRY_RUN':'SUCCESS',{cutoff:cutoff.toISOString(),changed,...(dryRun?{eligible}:{})});emit(result);return result;
 }catch(error){
  if(client)try{await client.query('ROLLBACK');}catch{/* Preserve the original failure. */}
  // Log identifiers and SQLSTATE only; DB errors may contain credentials or row contents.
  emit(report('FAILED',{errorCode:typeof error.code==='string'?error.code:'JOB_ERROR'}));throw error;
 }finally{client?.release();}
}

export function scheduleEventCompletion(schedule,pool,options={}) {
 return schedule('*/10 * * * *',async()=>{
  try{return await runEventCompletion(pool,options);}catch{return undefined;}
 });
}
