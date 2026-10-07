const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export function installMembershipHistory(app,{pool,authenticateToken}){
 const read=admin=>async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  if(!uuid(req.user.id))return res.sendStatus(401);
  const target=admin?req.params.id:req.user.id;
  const {beforeAt,beforeId}=req.query;
  if(!uuid(target)||Object.keys(req.query).some(k=>!['beforeAt','beforeId'].includes(k))||!!beforeAt!==!!beforeId||beforeAt&&(!uuid(beforeId)||typeof beforeAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(beforeAt)||!Number.isFinite(Date.parse(beforeAt))))return res.sendStatus(400);
  let c;try{
   c=await pool.connect();await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');await c.query("SET LOCAL statement_timeout='15s'");
   const actor=(await c.query('SELECT role,now() as as_of FROM users WHERE id=$1',[req.user.id])).rows[0];
   if(!actor){await c.query('ROLLBACK');return res.sendStatus(401);}if(admin&&actor.role!=='ADMIN'){await c.query('ROLLBACK');return res.sendStatus(403);}
   const total=(await c.query('SELECT count(*)::int n FROM group_membership_history WHERE user_id=$1',[target])).rows[0].n;
   // Keep microseconds in cursor; the JS Date conversion would lose them.
   const events=(await c.query("SELECT id,user_id,user_name,operation,to_char(recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') as recorded_at,before_state,after_state FROM group_membership_history WHERE user_id=$1"+(beforeAt?' AND (recorded_at,id)<($2::timestamptz,$3::uuid)':'')+' ORDER BY group_membership_history.recorded_at DESC,id DESC LIMIT 51',beforeAt?[target,beforeAt,beforeId]:[target])).rows;
   const more=events.length>50;events.splice(50);const last=events.at(-1);
   await c.query('COMMIT');res.json({version:1,ownerId:req.user.id,targetId:target,asOf:actor.as_of,total,events,next:more?{beforeAt:last.recorded_at,beforeId:last.id}:null});
  }catch{if(c)await c.query('ROLLBACK').catch(()=>{});res.status(500).json({error:'Grup üyelik geçmişi yüklenemedi.'});}finally{c?.release();}
 };
 app.get('/api/membership-history',authenticateToken,read(false));
 app.get('/api/admin/membership-history/:id',authenticateToken,read(true));
}
