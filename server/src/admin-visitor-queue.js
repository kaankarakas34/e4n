const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const scope=`pv.source IS DISTINCT FROM 'education_application' AND e.type IS DISTINCT FROM 'education'
  AND (pv.source IN ('visitor_invite','visitor_payment') OR COALESCE(trim(pv.why_join),'')<>''
    OR pv.source IS NULL OR pv.source NOT IN ('on_degerlendirme','meta_import','legacy_data'))`;
const select=`SELECT pv.id,pv.name,pv.email,pv.phone,pv.company,pv.profession,pv.source,pv.status,
  pv.created_at AT TIME ZONE 'UTC' AS created_at,pv.title,pv.web_linkedin,pv.activity_area,pv.duration,
  pv.target_customer,pv.why_join,pv.value_add,pv.previous_groups,pv.form_data,pv.event_id,
  u.name AS inviter_name,e.title AS event_title,e.start_at AS event_start_at
  FROM public_visitors pv LEFT JOIN users u ON u.id=pv.inviter_id LEFT JOIN events e ON e.id=pv.event_id`;
// Only displayable form answers cross the API boundary. Payment, invoice and invitation tokens do not.
const fields=['title','web_linkedin','activity_area','duration','target_customer','why_join','value_add','previous_groups'];
const formFields=['education_level','work_status','job_title','company_size','main_services','sector','experience_years','differentiating_factor','value_provided','ideal_referral','success_story','network_size','network_sectors','network_opportunities','referral_example','network_sharing_approach','primary_expectation','target_connection_types','ideal_referral_definition','time_commitment','core_value','discovery_source','referral_name',...fields];
const dto=row=>{
  const answers={};
  for(const key of formFields){const value=row.form_data?.[key];if(typeof value==='string')answers[key]=value;
    else if(Array.isArray(value)&&value.every(v=>typeof v==='string'))answers[key]=value;}
  const {form_data,...data}=row;
  return {...data,form_data:answers,category:['visitor_invite','visitor_payment'].includes(row.source)?'registrations':'visitors'};
};
export function installAdminVisitorQueue(app,{pool,authenticateToken}) {
  const run=mutate=>async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(Object.keys(req.query).length||mutate&&(!uuid(req.params.id)||!req.body||Object.keys(req.body).length))return res.status(400).json({error:'Invalid visitor request'});
    if(!uuid(req.user.id))return res.sendStatus(401);
    let client;
    try {
      client=await pool.connect();await client.query(mutate?'BEGIN':'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const owner=(await client.query('SELECT role FROM users WHERE id=$1'+(mutate?' FOR SHARE':''),[req.user.id])).rows[0];
      if(!owner){await client.query('ROLLBACK');return res.sendStatus(401);}
      if(owner.role!=='ADMIN'){await client.query('ROLLBACK');return res.sendStatus(403);}
      if(mutate){
        const row=(await client.query(select+` WHERE pv.id=$1 AND ${scope} FOR UPDATE OF pv`,[req.params.id])).rows[0];
        if(!row){await client.query('ROLLBACK');return res.sendStatus(404);}
        if(!['PENDING','CONTACTED'].includes(row.status)){await client.query('ROLLBACK');return res.status(409).json({error:'Visitor status no longer pending'});}
        if(row.status==='PENDING')await client.query("UPDATE public_visitors SET status='CONTACTED' WHERE id=$1",[row.id]);
        row.status='CONTACTED';await client.query('COMMIT');return res.json({version:1,ownerId:req.user.id,visitor:dto(row)});
      }
      const rows=(await client.query(select+` WHERE ${scope} ORDER BY pv.created_at DESC NULLS LAST,pv.id LIMIT 5001`)).rows;
      if(rows.length>5000){await client.query('ROLLBACK');return res.status(503).json({error:'Visitor queue exceeds supported size'});}
      await client.query('COMMIT');res.json({version:1,ownerId:req.user.id,visitors:rows.map(dto)});
    }catch(error){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('Visitor queue failed:',error.message);res.status(500).json({error:'Visitor queue unavailable'});}
    finally{client?.release();}
  };
  app.get('/api/admin/visitor-queue',authenticateToken,run(false));
  app.put('/api/admin/visitor-queue/:id/contacted',authenticateToken,run(true));
}
