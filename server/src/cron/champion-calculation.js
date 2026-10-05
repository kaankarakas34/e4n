import {randomUUID} from 'node:crypto';

// This is atomic production of the existing metrics, not a new period/score policy.
export async function runChampionCalculation(pool,{periodType,startDate,endDate,runDate=new Date().toISOString().slice(0,10),log=r=>console.log(JSON.stringify(r))}) {
 const runId=randomUUID(),started=Date.now();let client;
 const report=(status,fields={})=>({job:'champion-calculation',runId,periodType,runDate,status,elapsedMs:Date.now()-started,...fields});
 const emit=r=>{try{log(r);}catch{/* Preserve the database outcome. */}};
 try {
  if(!['WEEK','MONTH','TERM','YEAR'].includes(periodType)||!/^\d{4}-\d{2}-\d{2}$/.test(runDate)
    ||!Number.isFinite(Date.parse(startDate))||!Number.isFinite(Date.parse(endDate))||Date.parse(startDate)>Date.parse(endDate))throw Object.assign(new Error('Invalid champion window'),{code:'INVALID_WINDOW'});
  client=await pool.connect();await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
  const lock=(await client.query('SELECT pg_try_advisory_xact_lock(hashtextextended($1,0)) AS acquired',[`champion:${periodType}:${runDate}`])).rows[0].acquired;
  if(!lock){await client.query('ROLLBACK');const r=report('SKIPPED',{reason:'ALREADY_RUNNING',inserted:0});emit(r);return r;}
  const existing=(await client.query('SELECT count(*)::int AS count FROM champions WHERE period_type=$1 AND period_date=$2',[periodType,runDate])).rows[0].count;
  if(existing){await client.query('COMMIT');const r=report('EXISTING',{inserted:0,existing,reason:'PRESERVED_PERIOD_RESULTS'});emit(r);return r;}
  // One SQL statement gives all three original aggregations the same read snapshot.
  // Keep original value DESC tie behavior and date typing; no tie-break policy is invented.
  const winners=(await client.query(`
    (SELECT 'REFERRAL_COUNT' AS metric_type,giver_id AS user_id,COUNT(*)::numeric AS value
     FROM referrals WHERE created_at BETWEEN $1::timestamptz AND $2::timestamptz AND status='SUCCESSFUL'
     GROUP BY giver_id ORDER BY value DESC LIMIT 1)
    UNION ALL
    (SELECT 'VISITOR_COUNT',inviter_id,COUNT(*)::numeric AS value
     FROM visitors WHERE visited_at BETWEEN $1::date AND $2::date
     GROUP BY inviter_id ORDER BY value DESC LIMIT 1)
    UNION ALL
    (SELECT 'REVENUE',giver_id,SUM(amount) AS value
     FROM referrals WHERE created_at BETWEEN $1::timestamptz AND $2::timestamptz AND status='SUCCESSFUL'
     GROUP BY giver_id ORDER BY value DESC LIMIT 1)`,[startDate,endDate])).rows;
  for(const winner of winners)await client.query('INSERT INTO champions(period_type,period_date,metric_type,user_id,value) VALUES($1,$2,$3,$4,$5)',[periodType,runDate,winner.metric_type,winner.user_id,winner.value]);
  await client.query('COMMIT');const r=report('SUCCESS',{inserted:winners.length,startDate,endDate});emit(r);return r;
 }catch(error){if(client)try{await client.query('ROLLBACK');}catch{/* Preserve original error. */}emit(report('FAILED',{errorCode:typeof error.code==='string'?error.code:'JOB_ERROR'}));throw error;}
 finally{client?.release();}
}
