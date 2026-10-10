import {randomUUID,createHash} from 'node:crypto';
import {getCanonicalPeriod} from './canonical-period.js';
import {beginGroupMutation,requireCurrentAdmin,groupError,sendGroupMutationError,validShuffleAssignments} from './group-capacity.js';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const snapshot=w=>({groups:w.groups,members:w.members.map(({id,full_name,role})=>({id,full_name,role})),memberships:w.memberships});
export async function readShuffleHistorySnapshot(client,workspace,{lock=false}={}){
 const memberships=(await client.query('SELECT group_id,user_id,role,status,joined_at FROM group_members ORDER BY group_id,user_id LIMIT 50001'+(lock?' FOR UPDATE':''))).rows;
 if(memberships.length>50000)throw Object.assign(Error('History snapshot too large'),{status:503,code:'HISTORY_SIZE'});
 return {...workspace,memberships};
}
export const shuffleFingerprint=b=>createHash('sha256').update(JSON.stringify([b.expectedRevision,Object.entries(b.assignments).sort(([a],[z])=>a.localeCompare(z)).map(([g,ids])=>[g,[...ids].sort()])])).digest('hex');
export function validShuffleSubmission(b){return b&&Object.keys(b).sort().join(',')==='assignments,expectedRevision,requestId'&&uuid(b.requestId)&&b.requestId===b.requestId.toLowerCase()&&typeof b.expectedRevision==='string'&&/^[a-f0-9]{64}$/.test(b.expectedRevision)&&validShuffleAssignments(b.assignments)&&Object.entries(b.assignments).every(([g,ids])=>g===g.toLowerCase()&&ids.every(id=>id===id.toLowerCase()));}
export async function readShuffleReceipt(client,id,owner){
 const r=(await client.query('SELECT id,actor_id,expected_revision,after_revision,after_snapshot FROM shuffle_execution_history WHERE id=$1',[id])).rows[0];
 if(!r||r.actor_id!==owner||r.after_snapshot.submission?.version!==1)return null;
 return {version:1,success:true,ownerId:owner,requestId:r.id,executionId:r.id,expectedRevision:r.expected_revision,afterRevision:r.after_revision,fingerprint:r.after_snapshot.submission.fingerprint};
}
export async function recordShuffleExecution(client,{actorId,expectedRevision,before,after,submission}){
 const id=submission?.requestId??randomUUID(),actor=before.members.find(m=>m.id===actorId);
 const afterSnapshot=snapshot(after);
 afterSnapshot.period=getCanonicalPeriod();
 if(submission)afterSnapshot.submission={version:1,fingerprint:shuffleFingerprint(submission)};
 await client.query('INSERT INTO shuffle_execution_history(id,actor_id,actor_name,expected_revision,before_revision,after_revision,before_snapshot,after_snapshot,member_count,group_count) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,actorId,actor?.full_name||'Bilinmiyor',expectedRevision??null,before.revision,after.revision,JSON.stringify(snapshot(before)),JSON.stringify(afterSnapshot),after.memberships.filter(m=>m.status==='ACTIVE').length,new Set(after.memberships.filter(m=>m.status==='ACTIVE').map(m=>m.group_id)).size]);
 return id;
}
export function installShuffleHistory(app,{pool,authenticateToken}){
 app.get('/api/admin/shuffle-submissions/:id',authenticateToken,async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  if(!uuid(req.params.id)||Object.keys(req.query).length)return res.sendStatus(400);
  let c;try{
   c=await pool.connect();await beginGroupMutation(c);await requireCurrentAdmin(c,req.user.id);
   const receipt=await readShuffleReceipt(c,req.params.id,req.user.id);
   if(!receipt)throw groupError('NOT_FOUND','Bu hesaba ait dağıtım işlemi bulunamadı.',404);
   await c.query('COMMIT');res.json({...receipt,replayed:true});
  }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});sendGroupMutationError(res,e);}finally{c?.release();}
 });
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
