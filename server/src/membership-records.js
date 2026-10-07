const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const fields='id,name,email,role,account_status,subscription_plan,subscription_end_date';
export function installMembershipRecords(app,{pool,authenticateToken}){
 const route=(admin,list)=>async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  if(!uuid(req.user.id))return res.sendStatus(401);
  if(Object.keys(req.query).length||admin&&!list&&!uuid(req.params.id))return res.sendStatus(400);
  let c;try{
   c=await pool.connect();await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');await c.query("SET LOCAL statement_timeout='15s'");
   const actor=(await c.query('SELECT id,role,now() AS as_of FROM users WHERE id=$1',[req.user.id])).rows[0];
   if(!actor){await c.query('ROLLBACK');return res.sendStatus(401);}if(admin&&actor.role!=='ADMIN'){await c.query('ROLLBACK');return res.sendStatus(403);}
   const envelope={version:1,ownerId:req.user.id,asOf:actor.as_of};
   if(list){
    const accounts=(await c.query('SELECT '+fields+' FROM users ORDER BY lower(name),id LIMIT 5001')).rows;
    if(accounts.length>5000){await c.query('ROLLBACK');return res.status(503).json({error:'Kayıt listesi desteklenen boyutu aşıyor.'});}
    const unownedPayments=(await c.query('SELECT count(*)::int n FROM payment_transactions WHERE user_id IS NULL')).rows[0].n;
    await c.query('COMMIT');return res.json({...envelope,accounts,unownedPayments});
   }
   const target=admin?req.params.id:req.user.id;
   const account=(await c.query('SELECT '+fields+' FROM users WHERE id=$1',[target])).rows[0];
   if(!account){await c.query('ROLLBACK');return res.sendStatus(404);}
   const definitions=[['payments','payment_transactions','user_id','merchant_oid AS id,plan_id,amount::text AS amount,status,action_type,created_at,updated_at','created_at DESC NULLS LAST,merchant_oid'],['invoices','invoice_files','member_id','id,filename,size_bytes,email_state,created_at','created_at DESC,id'],['reminders','subscription_reminder_deliveries','user_id','id,subscription_end_date,trigger_days,delivery_state,claimed_at,completed_at','claimed_at DESC,id']];
   const records={},totals={};
   for(const [name,table,owner,columns,order] of definitions){totals[name]=(await c.query('SELECT count(*)::int n FROM '+table+' WHERE '+owner+'=$1',[target])).rows[0].n;records[name]=(await c.query('SELECT '+columns+' FROM '+table+' WHERE '+owner+'=$1 ORDER BY '+order+' LIMIT 100',[target])).rows;}
   await c.query('COMMIT');res.json({...envelope,targetId:target,account,totals,...records});
  }catch{if(c)await c.query('ROLLBACK').catch(()=>{});res.status(500).json({error:'Üyelik ve ödeme kayıtları yüklenemedi.'});}finally{c?.release();}
 };
 app.get('/api/membership-records',authenticateToken,route(false,false));
 app.get('/api/admin/membership-records',authenticateToken,route(true,true));
 app.get('/api/admin/membership-records/:id',authenticateToken,route(true,false));
}
