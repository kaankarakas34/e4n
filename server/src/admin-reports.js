const metric = row => ({
  count:row?.count??0,successful:row?.successful??0,missingAmounts:row?.missing??0,
  knownVolume:row?.known_volume??'0',volume:row?.missing?null:row?.known_volume??'0'
});
const aggregation = `count(*)::int AS count,
  count(*) FILTER (WHERE status='SUCCESSFUL')::int AS successful,
  count(*) FILTER (WHERE status='SUCCESSFUL' AND (amount IS NULL OR amount<0))::int AS missing,
  COALESCE(sum(amount) FILTER (WHERE status='SUCCESSFUL' AND amount>=0),0)::text AS known_volume`;

export function installAdminReports(app,{pool,authenticateToken}) {
  app.get('/api/admin/reports',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(req.user.role!=='ADMIN')return res.sendStatus(403);
    if(typeof req.user.id!=='string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(req.user.id))return res.sendStatus(401);
    const range=req.query.dateRange??'30d';
    if(typeof range!=='string' || !['7d','30d','90d','1y'].includes(range) || Object.keys(req.query).some(k=>k!=='dateRange'))return res.status(400).json({error:'Geçersiz rapor dönemi.'});
    let client;
    try {
      client=await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const {rows:[admin]}=await client.query("SELECT id FROM users WHERE id=$1 AND role='ADMIN'",[req.user.id]);
      if(!admin){await client.query('ROLLBACK');return res.sendStatus(403);}
      const {rows:[period]}=await client.query("SELECT now() AS end_at, now()-$1::int*interval '1 day' AS start_at",[{'7d':7,'30d':30,'90d':90,'1y':365}[range]]);
      const args=[period.start_at,period.end_at];
      const {rows:[stock]}=await client.query(`SELECT
        (SELECT count(*)::int FROM users) AS accounts,
        (SELECT count(*)::int FROM groups WHERE status='ACTIVE') AS active_groups,
        (SELECT count(*)::int FROM power_teams WHERE status='ACTIVE') AS active_teams`);
      const {rows:[activity]}=await client.query(`SELECT
        (SELECT count(*)::int FROM users WHERE created_at >= $1 AND created_at < $2) AS new_accounts,
        (SELECT count(*)::int FROM events WHERE start_at >= $1 AND start_at < $2) AS events,
        (SELECT count(*)::int FROM one_to_ones WHERE status='COMPLETED' AND meeting_date >= $1 AND meeting_date < $2) AS meetings,
        (SELECT count(*)::int FROM visitors WHERE visited_at >= $1 AND visited_at < $2) AS visitor_records,
        (SELECT count(*)::int FROM visitors WHERE status='JOINED' AND visited_at >= $1 AND visited_at < $2) AS joined_visitors,
        (SELECT count(*)::int FROM visitors WHERE status IN ('ATTENDED','JOINED') AND visited_at >= $1 AND visited_at < $2) AS attended_visitors`,args);
      const {rows:volumes}=await client.query(`SELECT type, grouping(type) AS is_total, ${aggregation}
        FROM (SELECT status,amount,CASE WHEN type IN ('INTERNAL','EXTERNAL') THEN type ELSE NULL END AS type
          FROM referrals WHERE created_at >= $1 AND created_at < $2) r GROUP BY GROUPING SETS ((type),())`,args);
      const {rows:monthly}=await client.query(`WITH months AS (
          SELECT generate_series(date_trunc('month',$1::timestamptz AT TIME ZONE 'UTC'),date_trunc('month',$2::timestamptz AT TIME ZONE 'UTC'),interval '1 month') AS month
        ), refs AS (
          SELECT date_trunc('month',created_at AT TIME ZONE 'UTC') AS month,${aggregation}
          FROM referrals WHERE created_at >= $1 AND created_at < $2 GROUP BY 1
        ), accounts AS (
          SELECT date_trunc('month',created_at AT TIME ZONE 'UTC') AS month,count(*)::int AS new_accounts
          FROM users WHERE created_at >= $1 AND created_at < $2 GROUP BY 1
        )
        SELECT to_char(m.month,'YYYY-MM') AS month,COALESCE(a.new_accounts,0)::int AS new_accounts,
          r.count,r.successful,r.missing,r.known_volume
        FROM months m LEFT JOIN refs r USING(month) LEFT JOIN accounts a USING(month)
        WHERE m.month < ($2::timestamptz AT TIME ZONE 'UTC') ORDER BY m.month`,args);
      const {rows:performance}=await client.query('SELECT id,name,profession,performance_score AS score,performance_color AS color FROM users ORDER BY performance_score DESC NULLS LAST,name,id');
      const {rows:attendance}=await client.query(`SELECT u.id,u.name,
        count(a.id) FILTER (WHERE a.status='PRESENT')::int AS present,
        count(a.id) FILTER (WHERE a.status='ABSENT')::int AS absent,
        count(a.id) FILTER (WHERE a.status='LATE')::int AS late,
        count(a.id) FILTER (WHERE a.status='MEDICAL')::int AS medical,
        count(a.id) FILTER (WHERE a.status='SUBSTITUTE')::int AS substitute
        FROM users u LEFT JOIN (
          SELECT a.* FROM attendance a JOIN events e ON e.id=a.event_id WHERE e.start_at >= $1 AND e.start_at < $2
        ) a ON a.user_id=u.id GROUP BY u.id,u.name ORDER BY u.name,u.id`,args);
      await client.query('COMMIT');
      res.json({version:1,ownerId:req.user.id,dateRange:range,period:{start:period.start_at.toISOString(),end:period.end_at.toISOString()},
        stock,activity,volumes:{total:metric(volumes.find(r=>r.is_total===1)),internal:metric(volumes.find(r=>r.is_total===0 && r.type==='INTERNAL')),
          external:metric(volumes.find(r=>r.is_total===0 && r.type==='EXTERNAL')),
          unclassified:metric(volumes.find(r=>r.is_total===0 && r.type==null))},
        monthly:monthly.map(r=>({month:r.month,newAccounts:r.new_accounts,referrals:metric(r)})),performance,attendance});
    }catch(error){
      if(client)await client.query('ROLLBACK').catch(()=>{});
      console.error('Admin report failed:',error.message);
      res.status(500).json({error:'Yönetici raporu yüklenemedi.'});
    }finally{client?.release();}
  });
}
