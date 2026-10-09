import nodemailer from 'nodemailer';
import {beginGroupMutation,groupError,isUuid,enforceGroupCapacity,sendGroupMutationError} from './group-capacity.js';
import {setMembershipOperationContext} from './membership-operation-context.js';
const link=id=>`/group-management?tab=applications&group=${id}`;
const subscribed=u=>u?.account_status==='ACTIVE'&&typeof u.subscription_plan==='string'&&!!u.subscription_plan&&u.subscription_end_date&&new Date(u.subscription_end_date)>new Date();
const presidentSql=`SELECT u.id,u.name FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=$1 AND gm.status='ACTIVE' AND (gm.role='PRESIDENT' OR u.role='PRESIDENT' OR to_jsonb(u)->>'group_title'='PRESIDENT') ORDER BY u.id`;
async function president(c,g){const rows=(await c.query(presidentSql,[g])).rows;if(rows.length!==1)throw groupError('PRESIDENT_UNAVAILABLE','Grubun başkan kaydı doğrulanamıyor. Lütfen başka bir grubu inceleyin veya destekle iletişime geçin.');return rows[0];}
async function currentPresident(c,actor,g){const p=await president(c,g);if(p.id!==actor)throw groupError('FORBIDDEN','Yalnız bu grubun başkanı karar verebilir.',403);return p;}
const safeText=(v,max)=>typeof v==='string'&&v.trim()&&v.trim().length<=max&&!v.includes('\0');
export async function deliverApplicationMail(pool,id){
 const claimed=(await pool.query("UPDATE group_application_mail SET state='SENDING',attempts=attempts+1,updated_at=now() WHERE application_id=$1 AND state IN ('QUEUED','FAILED') RETURNING application_id",[id])).rowCount;
 if(!claimed)return;
 let state='UNKNOWN';
 try{
  const row=(await pool.query(`SELECT p.email,g.name,a.group_id FROM group_applications a JOIN users p ON p.id=a.president_id JOIN groups g ON g.id=a.group_id WHERE a.id=$1`,[id])).rows[0];
  if(!row?.email){state='FAILED';return;}
  const cfg=(await pool.query('SELECT smtp_host,smtp_port,smtp_user,smtp_pass,sender_email FROM email_configurations WHERE is_active=true LIMIT 1')).rows[0];
  const host=cfg?.smtp_host??process.env.SMTP_HOST,user=cfg?.smtp_user??process.env.SMTP_USER,pass=cfg?.smtp_pass??process.env.SMTP_PASS;
  if(!host||!user||!pass){state='FAILED';return;}
  const port=Number(cfg?.smtp_port??process.env.SMTP_PORT??587);
  const transport=nodemailer.createTransport({host,port,secure:port===465,auth:{user,pass},connectionTimeout:5000,greetingTimeout:5000,socketTimeout:10000});
  const html=`<p>Grubunuza yeni bir başvuru geldi. Başvuran kişiyi arayıp görüşme sonucunu kaydedin.</p><p><a href="https://www.event4network.com${link(row.group_id)}">Gelen grup başvurularını aç</a></p>`;
  const result=await transport.sendMail({from:cfg?.sender_email??user,to:row.email,subject:'Yeni grup başvurusu — görüşme görevi',html,messageId:`<group-application-${id}@event4network.com>`});
  state=result.accepted?.length?'SENT':'FAILED';
 }catch(e){state=['EAUTH','ECONNECTION','EDNS'].includes(e.code)?'FAILED':'UNKNOWN';}
 finally{await pool.query('UPDATE group_application_mail SET state=$2,updated_at=now() WHERE application_id=$1 AND state=\'SENDING\'',[id,state]);}
}
export function installGroupApplications(app,{pool,authenticateToken}){
 const route=(fn,mutation=false)=>async(req,res)=>{res.set('Cache-Control','private, no-store');let c;try{
  if(!isUuid(req.user.id)||Object.keys(req.query).length)throw groupError('INVALID_REQUEST','Geçersiz istek.',400);
  c=await pool.connect();if(mutation)await beginGroupMutation(c);else await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  if(!(await c.query('SELECT id FROM users WHERE id=$1',[req.user.id])).rowCount)throw groupError('UNAUTHENTICATED','Oturum bulunamadı.',401);
  const result=await fn(c,req);await c.query('COMMIT');c.release();c=null;
  if(result.mailId)await deliverApplicationMail(pool,result.mailId).catch(()=>{});
  delete result.mailId;res.json(result);
 }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});sendGroupMutationError(res,e);}finally{c?.release();}};
 app.get('/api/group-discovery',authenticateToken,route(async(c,req)=>{
  if(Object.keys(req.query).length)throw groupError('INVALID_REQUEST','Geçersiz filtre.',400);
  const u=(await c.query('SELECT account_status,subscription_plan,subscription_end_date FROM users WHERE id=$1',[req.user.id])).rows[0];
  const groups=(await c.query(`SELECT g.id,g.name,to_jsonb(g)->>'city' city,to_jsonb(g)->>'meeting_time' meeting_time,g.meeting_dates,
   COALESCE((SELECT json_agg(json_build_object('id',u.id,'name',u.name,'profession',u.profession,'company',u.company,'president',gm.role='PRESIDENT' OR u.role='PRESIDENT' OR to_jsonb(u)->>'group_title'='PRESIDENT') ORDER BY u.name,u.id) FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=g.id AND gm.status='ACTIVE'),'[]'::json) members,
   (SELECT status FROM group_members WHERE group_id=g.id AND user_id=$1) own_status,
   (SELECT state FROM group_applications WHERE group_id=g.id AND user_id=$1) application_state
   FROM groups g WHERE g.status='ACTIVE' ORDER BY g.name,g.id LIMIT 501`,[req.user.id])).rows;
  if(groups.length>500)throw groupError('CATALOG_LIMIT','Grup listesi sınırı aşıldı.',503);
  return {ownerId:req.user.id,hasSubscription:!!subscribed(u),geographyEnabled:false,groups:groups.map(g=>{const presidents=g.members.filter(m=>m.president);const count=g.members.length-presidents.length;return {...g,member_count:count,capacity:35,available_seats:Math.max(0,35-count),president:presidents.length===1?presidents[0].name:null,president_ready:presidents.length===1};})};
 }));
 app.post('/api/groups/:id/join',authenticateToken,route(async(c,req)=>{
  if(!isUuid(req.params.id)||Object.keys(req.body??{}).length||Object.keys(req.query).length)throw groupError('INVALID_REQUEST','Geçersiz başvuru.',400);
  const u=(await c.query('SELECT account_status,subscription_plan,subscription_end_date FROM users WHERE id=$1 FOR UPDATE',[req.user.id])).rows[0];
  if(!subscribed(u))throw groupError('SUBSCRIPTION_REQUIRED','Gruba başvurmak için aktif abonelik gerekir.',403);
  if(!(await c.query("SELECT id FROM groups WHERE id=$1 AND status='ACTIVE' FOR UPDATE",[req.params.id])).rowCount)throw groupError('GROUP_NOT_FOUND','Aktif grup bulunamadı.',404);
  const existing=(await c.query('SELECT id,state FROM group_applications WHERE group_id=$1 AND user_id=$2',[req.params.id,req.user.id])).rows[0];
  if(existing)return {ownerId:req.user.id,application:existing};
  const membership=(await c.query('SELECT status FROM group_members WHERE group_id=$1 AND user_id=$2',[req.params.id,req.user.id])).rows[0];
  if(membership?.status==='ACTIVE')return {ownerId:req.user.id,alreadyMember:true};
  if(membership&&!['REQUESTED','PENDING'].includes(membership.status))throw groupError('REAPPLICATION_POLICY','Eski başvurunun yeniden açılması için destekle iletişime geçin.');
  const p=await president(c,req.params.id);const capacity=await enforceGroupCapacity(c,[req.params.id]);if(capacity[0].available_seats===0)throw groupError('GROUP_CAPACITY_FULL','Grup dolu; başka bir grubu inceleyin.');
  await setMembershipOperationContext(c,req.user.id,'APPLICATION');
  await c.query("INSERT INTO group_members(group_id,user_id,status) VALUES($1,$2,'REQUESTED') ON CONFLICT(group_id,user_id) DO NOTHING",[req.params.id,req.user.id]);
  const a=(await c.query('INSERT INTO group_applications(group_id,user_id,president_id) VALUES($1,$2,$3) RETURNING id,state',[req.params.id,req.user.id,p.id])).rows[0];
  await c.query("INSERT INTO notifications(user_id,title,message,type,action_url) VALUES($1,'Yeni grup başvurusu','Yeni başvuran kişiyi arayın ve görüşme sonucunu kaydedin.','SYSTEM',$2)",[p.id,link(req.params.id)]);
  await c.query('INSERT INTO group_application_mail(application_id) VALUES($1)',[a.id]);return {ownerId:req.user.id,application:a,mailId:a.id};
 },true));
 app.get('/api/group-applications/mine',authenticateToken,route(async(c,req)=>({ownerId:req.user.id,applications:(await c.query("SELECT a.id,a.group_id,COALESCE(g.name,'Silinmiş grup') group_name,a.state,a.created_at,a.interview_at,a.decided_at,a.decision_note FROM group_applications a LEFT JOIN groups g ON g.id=a.group_id WHERE a.user_id=$1 ORDER BY a.created_at DESC LIMIT 200",[req.user.id])).rows})));
 app.get('/api/group-applications/tasks',authenticateToken,route(async(c,req)=>({ownerId:req.user.id,tasks:(await c.query(`SELECT a.id,a.group_id,g.name group_name,u.name applicant_name,a.state FROM group_applications a JOIN groups g ON g.id=a.group_id JOIN users u ON u.id=a.user_id
  WHERE a.state IN ('AWAITING_CALL','INTERVIEWED') AND EXISTS(SELECT 1 FROM group_members pm JOIN users p ON p.id=pm.user_id WHERE pm.group_id=a.group_id AND pm.user_id=$1 AND pm.status='ACTIVE' AND (pm.role='PRESIDENT' OR p.role='PRESIDENT' OR to_jsonb(p)->>'group_title'='PRESIDENT'))
  AND (SELECT count(*) FROM group_members pm JOIN users p ON p.id=pm.user_id WHERE pm.group_id=a.group_id AND pm.status='ACTIVE' AND (pm.role='PRESIDENT' OR p.role='PRESIDENT' OR to_jsonb(p)->>'group_title'='PRESIDENT'))=1
  ORDER BY a.created_at,a.id LIMIT 200`,[req.user.id])).rows})));
 app.get('/api/groups/:id/applications',authenticateToken,route(async(c,req)=>{
  if(!isUuid(req.params.id))throw groupError('INVALID_REQUEST','Geçersiz grup.',400);await currentPresident(c,req.user.id,req.params.id);
  return {ownerId:req.user.id,groupId:req.params.id,applications:(await c.query(`SELECT a.id,a.user_id,u.name,u.phone,u.company,u.profession,a.state,a.created_at,a.interview_at,a.interview_note,a.decision_note,COALESCE(CASE WHEN m.state='SENDING' AND m.updated_at<now()-interval '2 minutes' THEN 'UNKNOWN' ELSE m.state END,'QUEUED') mail_state FROM group_applications a JOIN users u ON u.id=a.user_id LEFT JOIN group_application_mail m ON m.application_id=a.id WHERE a.group_id=$1 ORDER BY a.created_at DESC LIMIT 200`,[req.params.id])).rows};
 }));
 app.post('/api/group-applications/:id/:action',authenticateToken,route(async(c,req)=>{
  if(!isUuid(req.params.id)||!['interview','decision','retry-mail'].includes(req.params.action))throw groupError('INVALID_REQUEST','Geçersiz başvuru işlemi.',400);
  const a=(await c.query('SELECT * FROM group_applications WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];if(!a)throw groupError('NOT_FOUND','Başvuru bulunamadı.',404);await currentPresident(c,req.user.id,a.group_id);
  const b=req.body??{};if(Object.keys(b).some(k=>!(req.params.action==='decision'?['note','decision']:['note']).includes(k)))throw groupError('INVALID_REQUEST','Geçersiz alan.',400);
  if(req.params.action==='retry-mail'){if(Object.keys(b).length)throw groupError('INVALID_REQUEST','Geçersiz alan.',400);await c.query('UPDATE group_applications SET president_id=$2 WHERE id=$1',[a.id,req.user.id]);return {ownerId:req.user.id,application:a,mailId:a.id};}
  if(!safeText(b.note,2000))throw groupError('NOTE_REQUIRED','Görüşme veya karar açıklaması girin.',400);
  if(req.params.action==='interview'){
   if(!['AWAITING_CALL','INTERVIEWED'].includes(a.state))throw groupError('DECIDED','Başvuru sonuçlanmış.');
   const row=(await c.query("UPDATE group_applications SET state='INTERVIEWED',interview_at=now(),interviewed_by=$2,interview_note=$3 WHERE id=$1 RETURNING id,state",[a.id,req.user.id,b.note.trim()])).rows[0];return {ownerId:req.user.id,application:row};
  }
  if(!['ACCEPTED','REJECTED'].includes(b.decision))throw groupError('INVALID_DECISION','Geçersiz karar.',400);
  if(a.state===b.decision)return {ownerId:req.user.id,application:{id:a.id,state:a.state}};
  if(a.state!=='INTERVIEWED')throw groupError('INTERVIEW_REQUIRED','Önce telefon görüşmesi sonucunu kaydedin.');
  if(b.decision==='ACCEPTED'){
   const u=(await c.query('SELECT account_status,subscription_plan,subscription_end_date FROM users WHERE id=$1 FOR UPDATE',[a.user_id])).rows[0];if(!subscribed(u))throw groupError('SUBSCRIPTION_REQUIRED','Başvuranın aktif aboneliği bulunmuyor.');
   if(!(await c.query("SELECT id FROM groups WHERE id=$1 AND status='ACTIVE'",[a.group_id])).rowCount)throw groupError('GROUP_INACTIVE','Grup aktif değil.');
  }
  await setMembershipOperationContext(c,req.user.id,'MEMBER_STATUS');
  const changed=await c.query("UPDATE group_members SET status=$3 WHERE group_id=$1 AND user_id=$2 AND status IN ('REQUESTED','PENDING') RETURNING id",[a.group_id,a.user_id,b.decision==='ACCEPTED'?'ACTIVE':'INACTIVE']);if(!changed.rowCount)throw groupError('MEMBERSHIP_CHANGED','Üyelik durumu değişmiş; listeyi yenileyin.');
  if(b.decision==='ACCEPTED')await enforceGroupCapacity(c,[a.group_id]);
  const row=(await c.query('UPDATE group_applications SET state=$2,decided_at=now(),decided_by=$3,decision_note=$4 WHERE id=$1 RETURNING id,state',[a.id,b.decision,req.user.id,b.note.trim()])).rows[0];
  await c.query("INSERT INTO notifications(user_id,title,message,type,action_url) VALUES($1,'Grup başvurunuz sonuçlandı',$2,'SYSTEM','/chapter-management')",[a.user_id,b.decision==='ACCEPTED'?'Grup başvurunuz kabul edildi.':'Grup başvurunuz reddedildi. Başvurularım alanından açıklamayı görebilirsiniz.']);return {ownerId:req.user.id,application:row};
 },true));
}
