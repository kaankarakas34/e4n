import {referralTransport} from './api';
export type AttendanceStatus='REGISTERED'|'PRESENT'|'ABSENT'|'LATE'|'SUBSTITUTE'|'MEDICAL';
export interface AttendanceParticipant {id:string;user_id:string;name:string;status:AttendanceStatus;revision:number;verified_at:string|null}
export interface AttendanceObservation {id:string;attendance_id:string;user_id:string;actor_id:string;actor_name:string;before_status:AttendanceStatus;after_status:'REGISTERED'|'PRESENT'|'ABSENT'|'LATE'|'SUBSTITUTE';revision:number;reason:string;recorded_at:string}
export interface AttendanceSnapshot {version:1;ownerId:string;event:{id:string;title:string;type:string;status:string;start_at:string};participants:AttendanceParticipant[];history:AttendanceObservation[];totalHistory:number}
export interface AttendanceCommand {requestId:string;status:'REGISTERED'|'PRESENT'|'ABSENT';expectedStatus:AttendanceStatus;expectedVersion:number;reason:string}
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const status=(v:unknown)=>typeof v==='string'&&['REGISTERED','PRESENT','ABSENT','LATE','SUBSTITUTE','MEDICAL'].includes(v);
export function validAttendanceSnapshot(d:any,owner:string,event:string):d is AttendanceSnapshot {
  return !!d&&d.version===1&&d.ownerId===owner&&uuid(owner)&&uuid(event)&&d.event?.id===event
    &&['title','type','status'].every(k=>typeof d.event[k]==='string')&&date(d.event.start_at)
    &&Array.isArray(d.participants)&&d.participants.length<=1000
    &&d.participants.every((p:any)=>uuid(p?.id)&&uuid(p.user_id)&&typeof p.name==='string'&&status(p.status)&&Number.isSafeInteger(p.revision)&&p.revision>=0&&(p.verified_at===null||date(p.verified_at)))
    &&new Set(d.participants.map((p:any)=>p.user_id)).size===d.participants.length
    &&Number.isSafeInteger(d.totalHistory)&&d.totalHistory>=0&&Array.isArray(d.history)&&d.history.length<=50&&d.history.length===Math.min(50,d.totalHistory)
    &&d.history.every((h:any)=>uuid(h?.id)&&uuid(h.attendance_id)&&uuid(h.user_id)&&uuid(h.actor_id)&&typeof h.actor_name==='string'&&status(h.before_status)&&['REGISTERED','PRESENT','ABSENT','LATE','SUBSTITUTE'].includes(h.after_status)&&Number.isSafeInteger(h.revision)&&h.revision>0&&typeof h.reason==='string'&&h.reason.trim().length>0&&h.reason.length<=500&&date(h.recorded_at))
    &&new Set(d.history.map((h:any)=>h.id)).size===d.history.length;
}
export const eventAttendanceApi={
  async read(owner:string,event:string){if(!uuid(owner)||!uuid(event))throw Error('Geçersiz yoklama kapsamı.');const d=await referralTransport.get(`/admin/events/${event}/attendance-snapshot`);if(!validAttendanceSnapshot(d,owner,event))throw Error('Yoklama yanıtı geçersiz.');return d;},
  async save(owner:string,event:string,user:string,command:AttendanceCommand){
    if(!uuid(owner)||!uuid(event)||!uuid(user))throw Error('Geçersiz yoklama kapsamı.');
    const d:any=await referralTransport.put(`/admin/events/${event}/attendance/${user}`,command);
    if(!d||d.version!==1||d.ownerId!==owner||d.eventId!==event||d.userId!==user||d.requestId!==command.requestId||d.status!==command.status||d.revision!==command.expectedVersion+1||typeof d.replayed!=='boolean')throw Error('Yoklama kayıt yanıtı geçersiz.');
    return d;
  }
};
