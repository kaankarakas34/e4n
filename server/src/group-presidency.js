import {beginGroupMutation,requireCurrentAdmin,groupError,isUuid,enforceGroupCapacity,sendGroupMutationError} from './group-capacity.js';
import {setMembershipOperationContext} from './membership-operation-context.js';
import {president} from './group-applications.js';

export async function handoffGroupApplications(client,groupId,formerPresidentId){
  const pending=await client.query("SELECT id FROM group_applications WHERE group_id=$1 AND president_id=$2 AND state IN ('AWAITING_CALL','INTERVIEWED') LIMIT 1",[groupId,formerPresidentId]);
  if(!pending.rowCount)return;
  const manager=await president(client,groupId);
  await client.query("UPDATE group_applications SET president_id=$3 WHERE group_id=$1 AND president_id=$2 AND state IN ('AWAITING_CALL','INTERVIEWED')",[groupId,formerPresidentId,manager.id]);
}

export async function clearGroupPresident(client,groupId,userId,preserveOther=false){
  const other=(await client.query("SELECT gm.id FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.user_id=$1 AND gm.group_id<>$2 AND gm.status='ACTIVE' AND (gm.role='PRESIDENT' OR u.role='PRESIDENT' OR to_jsonb(u)->>'group_title'='PRESIDENT')",[userId,groupId])).rows;
  if(other.length){if(preserveOther)return;throw groupError('OTHER_PRESIDENCY','Üyenin başka grupta başkan ataması var; grup rol kayıtları birlikte incelenmelidir.');}
  await client.query("UPDATE group_members SET role='MEMBER' WHERE group_id=$1 AND user_id=$2 AND role='PRESIDENT'",[groupId,userId]);
  await client.query("UPDATE users SET role=CASE WHEN role='PRESIDENT' THEN 'MEMBER' ELSE role END,group_title=CASE WHEN group_title='PRESIDENT' THEN NULL ELSE group_title END WHERE id=$1",[userId]);
}

export function installGroupPresidency(app,{pool,authenticateToken}){
  app.delete('/api/admin/groups/:id/president',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(!isUuid(req.params.id)||!isUuid(req.body?.userId)||Object.keys(req.body).some(k=>k!=='userId')||Object.keys(req.query).length)return res.status(400).json({error:'Geçersiz başkan ataması isteği.'});
    let c;
    try{
      c=await pool.connect();await beginGroupMutation(c);await requireCurrentAdmin(c,req.user.id);
      const member=(await c.query('SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2 FOR UPDATE',[req.params.id,req.body.userId])).rows[0];
      if(!member)throw groupError('MEMBERSHIP_NOT_FOUND','Grup üyelik kaydı bulunamadı.',404);
      await setMembershipOperationContext(c,req.user.id,'ROLE_ASSIGNMENT');
      await clearGroupPresident(c,req.params.id,req.body.userId);await enforceGroupCapacity(c,[req.params.id]);
      await handoffGroupApplications(c,req.params.id,req.body.userId);
      await c.query('COMMIT');res.json({success:true,groupId:req.params.id,userId:req.body.userId,cleared:true});
    }catch(error){if(c)await c.query('ROLLBACK').catch(()=>{});sendGroupMutationError(res,error);}finally{c?.release();}
  });
}
