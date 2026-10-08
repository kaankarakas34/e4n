import {referralTransport} from './api';
export type MeetingObservation='PRESENT'|'ABSENT'|'LATE'|'SUBSTITUTE';
export interface MeetingAttendanceCommand {requestId:string;group_id:string;meeting_date:string;topic:string;reason:string;items:{user_id:string;status:MeetingObservation}[]}
export interface MeetingAttendanceAck {version:1;success:true;ownerId:string;requestId:string;eventId:string;groupId:string;count:number;fingerprint:string;replayed:boolean}
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
async function check(d:any,owner:string,b:MeetingAttendanceCommand):Promise<MeetingAttendanceAck> {
  const canonical=JSON.stringify([b.group_id,new Date(b.meeting_date).toISOString(),b.topic.trim(),b.reason.trim(),[...b.items].sort((a,b)=>a.user_id.localeCompare(b.user_id)).map(i=>[i.user_id,i.status])]);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
  const hash=Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,'0')).join('');
  if(!d||d.version!==1||d.success!==true||d.ownerId!==owner||d.eventId!==b.requestId||d.requestId!==b.requestId||d.groupId!==b.group_id||d.count!==b.items.length||d.fingerprint!==hash||typeof d.replayed!=='boolean')throw Error('Toplantı kaydı bu yoklamayla eşleşmiyor.');
  return d;
}
export const groupMeetingAttendanceApi={
  async save(owner:string,b:MeetingAttendanceCommand){if(!uuid(owner)||!uuid(b.requestId)||!uuid(b.group_id))throw Error('Geçersiz yoklama kapsamı.');return check(await referralTransport.post('/events/attendance',b),owner,b);},
  async reconcile(owner:string,b:MeetingAttendanceCommand){if(!uuid(owner)||!uuid(b.requestId))throw Error('Geçersiz yoklama kapsamı.');return check(await referralTransport.get('/events/attendance/submissions/'+b.requestId),owner,b);}
};
