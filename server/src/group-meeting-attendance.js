import {randomUUID,createHash} from 'node:crypto';
import {beginGroupMutation,requireGroupManager,isUuid,groupError,sendGroupMutationError} from './group-capacity.js';

const observed=['PRESENT','ABSENT','LATE','SUBSTITUTE'];
function normalize(b) {
  if(!b||Array.isArray(b)||Object.keys(b).sort().join(',')!=='group_id,items,meeting_date,reason,requestId,topic'
    ||!isUuid(b.requestId)||!isUuid(b.group_id)||typeof b.meeting_date!=='string'
    ||!/^\d{4}-\d{2}-\d{2}T/.test(b.meeting_date)||!Number.isFinite(Date.parse(b.meeting_date))
    ||typeof b.topic!=='string'||!b.topic.trim()||b.topic.trim().length>200
    ||typeof b.reason!=='string'||!b.reason.trim()||b.reason.trim().length>500
    ||!Array.isArray(b.items)||!b.items.length||b.items.length>1000
    ||b.items.some(i=>!i||Object.keys(i).sort().join(',')!=='status,user_id'||!isUuid(i.user_id)||!observed.includes(i.status))
    ||new Set(b.items.map(i=>i.user_id.toLowerCase())).size!==b.items.length)throw groupError('INVALID_ATTENDANCE','Toplantı ve tüm katılım seçimlerini kontrol edin.',400);
  return {...b,requestId:b.requestId.toLowerCase(),group_id:b.group_id.toLowerCase(),topic:b.topic.trim(),reason:b.reason.trim(),meeting_date:new Date(b.meeting_date).toISOString(),items:b.items.map(i=>({...i,user_id:i.user_id.toLowerCase()})).sort((a,b)=>a.user_id.localeCompare(b.user_id))};
}
const fingerprint=b=>createHash('sha256').update(JSON.stringify([b.group_id,b.meeting_date,b.topic,b.reason,b.items.map(i=>[i.user_id,i.status])])).digest('hex');
async function saved(c,id,owner) {
  const event=(await c.query('SELECT id,group_id,title,start_at,type,created_by FROM events WHERE id=$1',[id])).rows[0];
  if(!event||event.created_by!==owner)return null;
  const rows=(await c.query('SELECT user_id,after_status,reason,actor_id FROM event_attendance_verifications WHERE event_id=$1 AND revision=1 ORDER BY user_id',[id])).rows;
  if(event.type!=='meeting'||!rows.length||rows.some(r=>r.actor_id!==owner||r.reason!==rows[0].reason))throw groupError('ATTENDANCE_CONFLICT','Toplantı kaydı bu işlemle uzlaştırılamadı. Kayıtları kontrol edin.');
  const b={group_id:event.group_id,meeting_date:new Date(event.start_at).toISOString(),topic:event.title,reason:rows[0].reason,items:rows.map(r=>({user_id:r.user_id,status:r.after_status}))};
  return {version:1,success:true,ownerId:owner,requestId:id,eventId:id,groupId:event.group_id,count:rows.length,fingerprint:fingerprint(b)};
}
export function installGroupMeetingAttendance(app,{pool,authenticateToken}) {
  app.get('/api/events/attendance/submissions/:id',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(!isUuid(req.params.id)||Object.keys(req.query).length)return res.sendStatus(400);
    let c;
    try{
      c=await pool.connect();await beginGroupMutation(c);
      const account=(await c.query('SELECT id FROM users WHERE id=$1',[req.user.id])).rows[0];
      if(!account)throw groupError('UNAUTHENTICATED','Oturum bulunamadı.',401);
      const ack=await saved(c,req.params.id,req.user.id);
      if(!ack)throw groupError('NOT_FOUND','Bu hesaba ait kayıt bulunamadı.',404);
      await requireGroupManager(c,req.user.id,ack.groupId);
      await c.query('COMMIT');res.json({...ack,replayed:true});
    }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});sendGroupMutationError(res,e);}finally{c?.release();}
  });
  app.post('/api/events/attendance',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');let c;
    try{
      if(Object.keys(req.query).length)throw groupError('INVALID_QUERY','Bu işlem sorgu alanı kabul etmez.',400);
      const b=normalize(req.body);
      c=await pool.connect();await beginGroupMutation(c);
      await requireGroupManager(c,req.user.id,b.group_id);
      const group=(await c.query('SELECT id FROM groups WHERE id=$1 FOR SHARE',[b.group_id])).rows[0];
      if(!group)throw groupError('GROUP_NOT_FOUND','Grup bulunamadı.',404);
      const old=await saved(c,b.requestId,req.user.id);
      if(old){if(old.fingerprint!==fingerprint(b))throw groupError('ATTENDANCE_CONFLICT','İşlem anahtarı farklı bir yoklama için kullanıldı.');await c.query('COMMIT');return res.json({...old,replayed:true});}
      if((await c.query('SELECT id FROM events WHERE id=$1',[b.requestId])).rowCount)throw groupError('ATTENDANCE_CONFLICT','İşlem anahtarı zaten kullanılmış.');
      if((await c.query('SELECT id FROM event_attendance_verifications WHERE event_id=$1 LIMIT 1',[b.requestId])).rowCount)throw groupError('ATTENDANCE_CONFLICT','Bu toplantı kaldırılmış; geçmiş işlem anahtarı yeniden kullanılamaz.');
      if(Date.parse(b.meeting_date)>Date.now())throw groupError('FUTURE_ATTENDANCE','Gelecek toplantıya gerçekleşmiş yoklama yazılamaz.',409);
      const roster=(await c.query("SELECT gm.user_id FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=$1 AND gm.status='ACTIVE' ORDER BY gm.user_id FOR SHARE OF gm,u",[b.group_id])).rows;
      if(roster.length!==b.items.length||roster.some((r,i)=>r.user_id!==b.items[i].user_id))throw groupError('ROSTER_CHANGED','Aktif üye listesi değişti. Güncel listeyi yükleyip yoklamayı yeniden değerlendirin.');
      const actor=(await c.query('SELECT name FROM users WHERE id=$1',[req.user.id])).rows[0];
      await c.query("INSERT INTO events(id,group_id,title,start_at,type,status,description,created_by) VALUES($1,$2,$3,$4,'meeting','PUBLISHED','Haftalık Toplantı',$5)",[b.requestId,b.group_id,b.topic,b.meeting_date,req.user.id]);
      for(const item of b.items){
        const row=(await c.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'REGISTERED') RETURNING id",[b.requestId,item.user_id])).rows[0];
        await c.query('UPDATE attendance SET status=$1 WHERE id=$2',[item.status,row.id]);
        await c.query("INSERT INTO event_attendance_verifications(id,event_id,attendance_id,user_id,actor_id,actor_name,before_status,after_status,revision,reason) VALUES($1,$2,$3,$4,$5,$6,'REGISTERED',$7,1,$8)",[randomUUID(),b.requestId,row.id,item.user_id,req.user.id,actor.name,item.status,b.reason]);
      }
      // Observation does not select or run the unfinished score/rights policy.
      const ack=await saved(c,b.requestId,req.user.id);await c.query('COMMIT');res.json({...ack,replayed:false});
    }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});sendGroupMutationError(res,e);}finally{c?.release();}
  });
}
