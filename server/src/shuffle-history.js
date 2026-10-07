import {randomUUID} from 'node:crypto';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const snapshot=w=>({groups:w.groups,members:w.members.map(({id,full_name,role})=>({id,full_name,role})),memberships:w.memberships});
export async function readShuffleHistorySnapshot(client,workspace,{lock=false}={}){
 const memberships=(await client.query('SELECT group_id,user_id,role,status,joined_at FROM group_members ORDER BY group_id,user_id LIMIT 50001'+(lock?' FOR UPDATE':''))).rows;
 if(memberships.length>50000)throw Object.assign(Error('History snapshot too large'),{status:503,code:'HISTORY_SIZE'});
 return {...workspace,memberships};
}
export async function recordShuffleExecution(client,{actorId,expectedRevision,before,after}){
 const id=randomUUID(),actor=before.members.find(m=>m.id===actorId);
 await client.query('INSERT INTO shuffle_execution_history(id,actor_id,actor_name,expected_revision,before_revision,after_revision,before_snapshot,after_snapshot,member_count,group_count) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,actorId,actor?.full_name||'Bilinmiyor',expectedRevision??null,before.revision,after.revision,JSON.stringify(snapshot(before)),JSON.stringify(snapshot(after)),after.memberships.filter(m=>m.status==='ACTIVE').length,new Set(after.memberships.filter(m=>m.status==='ACTIVE').map(m=>m.group_id)).size]);
 return id;
}
export function installShuffleHistory(app,{pool,authenticateToken}){
 const read=detail=>async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  if(!uuid(req.user.id))return res.sendStatus(401);
  if(Object.keys(req.query).length||detail&&!uuid(req.params.id))return res.sendStatus(400);
  let c;try{
   c=await pool.connect();await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
   const actor=(await c.query('SELECT role,now() AS as_of FROM users WHERE id=$1',[req.user.id])).rows[0];
   if(!actor){await c.query('ROLLBACK');return res.sendStatus(401);}if(actor.role!=='ADMIN'){await c.query('ROLLBACK');return res.sendStatus(403);}
   const columns='id,actor_id,actor_name,applied_at,expected_revision,before_revision,after_revision,member_count,group_count';
   const rows=(await c.query(detail?'SELECT '+columns+',before_snapshot,after_snapshot FROM shuffle_execution_history WHERE id=$1':'SELECT '+columns+' FROM shuffle_execution_history ORDER BY applied_at DESC,id DESC LIMIT 100',detail?[req.params.id]:[])).rows;
   await c.query('COMMIT');if(detail&&!rows.length)return res.sendStatus(404);
   res.json({version:1,ownerId:req.user.id,asOf:actor.as_of,...(detail?{execution:rows[0]}:{executions:rows})});
  }catch{if(c)await c.query('ROLLBACK').catch(()=>{});res.status(500).json({error:'Dağıtım geçmişi yüklenemedi.'});}finally{c?.release();}
 };
 app.get('/api/admin/shuffle-history',authenticateToken,read(false));
 app.get('/api/admin/shuffle-history/:id',authenticateToken,read(true));
}
