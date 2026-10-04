// Read-only owner snapshot: no score recalculation or runtime DDL.
export function installPersonalReports(app, {pool, authenticateToken}) {
  app.get('/api/reports/me', authenticateToken, async (req,res)=>{
    res.set('Cache-Control','private, no-store');
    const range=req.query.dateRange??'30d';
    const days={'7d':7,'30d':30,'90d':90,'1y':365}[range];
    if(typeof range!=='string' || !['7d','30d','90d','1y'].includes(range) || Object.keys(req.query).some(k=>k!=='dateRange'))return res.status(400).json({error:'Geçersiz rapor dönemi.'});
    if(typeof req.user.id!=='string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(req.user.id))return res.sendStatus(401);
    let client;
    try {
      client=await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const {rows:[period]}=await client.query("SELECT now() AS end_at, now() - $1::int * interval '1 day' AS start_at",[days]);
      const args=[req.user.id,period.start_at,period.end_at];
      const {rows:[user]}=await client.query('SELECT performance_score, performance_color FROM users WHERE id=$1',[req.user.id]);
      if(!user){await client.query('ROLLBACK');return res.sendStatus(404);}
      const {rows:refs}=await client.query(`SELECT direction,
        count(*)::int AS count, count(*) FILTER (WHERE status='SUCCESSFUL')::int AS successful,
        count(*) FILTER (WHERE status='SUCCESSFUL' AND (amount IS NULL OR amount<0))::int AS missing,
        COALESCE(sum(amount) FILTER (WHERE status='SUCCESSFUL' AND amount>=0),0)::text AS known_volume
        FROM referrals r CROSS JOIN LATERAL (VALUES ('given',r.giver_id),('received',r.receiver_id)) d(direction,owner_id)
        WHERE (giver_id=$1 OR receiver_id=$1) AND owner_id=$1 AND created_at >= $2 AND created_at < $3 GROUP BY direction`,args);
      const metric=direction=>{
        const r=refs.find(r=>r.direction===direction)||{count:0,successful:0,missing:0,known_volume:'0'};
        return {count:r.count,successful:r.successful,missingAmounts:r.missing,knownVolume:r.known_volume,volume:r.missing?null:r.known_volume};
      };
      const {rows:[activity]}=await client.query(`SELECT
        (SELECT count(*)::int FROM one_to_ones WHERE (requester_id=$1 OR partner_id=$1) AND status='COMPLETED' AND meeting_date >= $2 AND meeting_date < $3) AS meetings,
        (SELECT count(*)::int FROM visitors WHERE inviter_id=$1 AND status IN ('ATTENDED','JOINED') AND visited_at >= $2 AND visited_at < $3) AS visitors,
        (SELECT COALESCE(sum(hours),0)::text FROM education WHERE user_id=$1 AND completed_date >= $2 AND completed_date < $3) AS education_hours`,args);
      await client.query('COMMIT');
      return res.json({version:1,ownerId:req.user.id,dateRange:range,period:{start:period.start_at.toISOString(),end:period.end_at.toISOString()},
        referralsGiven:metric('given'),referralsReceived:metric('received'),meetingsCompleted:activity.meetings,visitorsHosted:activity.visitors,
        educationHours:activity.education_hours,performance:{score:user.performance_score,color:user.performance_color}});
    }catch(error){
      if(client)await client.query('ROLLBACK').catch(()=>{});
      console.error('Personal report failed:',error.message);
      return res.status(500).json({error:'Kişisel rapor yüklenemedi.'});
    }finally{client?.release();}
  });
}
