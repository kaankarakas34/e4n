import { referralTransport } from './api';
import type { ReferralMetric } from './personalReports';
export interface GroupDetailMember { id:string; full_name:string; profession:string|null; email:string|null; role:string|null; status:string|null; created_at:string|null; absence_count:number; performance_score:number|null; performance_color:string|null }
export interface GroupDetailEvent { id:string; topic:string; date:string; attendees_count:number; present_count:number }
export interface GroupDetailVisitor { id:string; name:string; profession:string|null; company:string|null; email:string|null; visited_at:string; status:string|null; inviter_name:string|null }
export interface GroupDetailReferral { id:string; status:string|null; amount:string|null; created_at:string; from_member_name:string; to_member_name:string }
export interface AdminGroupDetailSnapshot {
  version:1; ownerId:string; group: { id:string; name:string; meeting_dates:string[]; [key:string]:unknown };
  members:GroupDetailMember[]; events:GroupDetailEvent[]; visitors:GroupDetailVisitor[]; referrals:GroupDetailReferral[];
  summary:ReferralMetric & {activeMembers:number;upcomingEvents:number};
}
const uuid=(v:unknown)=>typeof v==='string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const count=(v:unknown)=>typeof v==='number' && Number.isSafeInteger(v) && v>=0;
const date=(v:unknown)=>typeof v==='string' && Number.isFinite(Date.parse(v));
const text=(v:unknown)=>v===null||typeof v==='string';
const decimal=(v:unknown)=>typeof v==='string' && /^\d+(?:\.\d{1,2})?$/.test(v);
const cents=(v:string)=>{const [whole,fraction='']=v.split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));};
export function groupMoney(value:unknown):string {
  if(typeof value==='number' && Number.isFinite(value) && value>=0 && value<=Number.MAX_SAFE_INTEGER/100) value=String(value);
  if(!decimal(value))return 'Bilinmiyor';
  const [whole,fraction='']=String(value).split('.');
  return `₺${BigInt(whole).toLocaleString('tr-TR')},${fraction.padEnd(2,'0')}`;
}
export const groupRecordStatus=(value:unknown,kind:'visitor'|'referral')=>{
  const labels:Record<string,string>=kind==='visitor'
    ? {INVITED:'Davet edildi',ATTENDED:'Ziyaret etti',JOINED:'Üye oldu',NO_SHOW:'Gelmedi',CONVERTED:'Üye oldu'}
    : {PENDING:'Beklemede',SUCCESSFUL:'Başarılı',UNSUCCESSFUL:'Başarısız',COMPLETED:'Tamamlandı'};
  return typeof value==='string' ? (Object.prototype.hasOwnProperty.call(labels,value)?labels[value]:`Diğer durum (${value})`) : 'Durum bilinmiyor';
};
export function validAdminGroupDetail(data:any,owner:string,id:string):data is AdminGroupDetailSnapshot {
  const rows=(v:any)=>Array.isArray(v)&&v.length<=5000&&v.every(r=>r&&uuid(r.id))&&new Set(v.map(r=>r.id)).size===v.length;
  if(!data||data.version!==1||data.ownerId!==owner||data.group?.id!==id||typeof data.group.name!=='string'
    ||!Array.isArray(data.group.meeting_dates)||data.group.meeting_dates.some((d:unknown)=>!date(d))
    ||!['members','events','visitors','referrals'].every(k=>rows(data[k])))return false;
  if(['meeting_day','meeting_time','meeting_link','visitor_email_subject','visitor_email_template','status'].some(k=>!text(data.group[k])))return false;
  if(data.members.some((r:any)=>typeof r.full_name!=='string'||!count(r.absence_count)
      ||['profession','email','role','status','performance_color'].some(k=>!text(r[k]))
      ||r.created_at!==null&&!date(r.created_at)||r.performance_score!==null&&(typeof r.performance_score!=='number'||!Number.isFinite(r.performance_score)))
    ||data.events.some((r:any)=>typeof r.topic!=='string'||!date(r.date)||!count(r.attendees_count)||!count(r.present_count)||r.present_count>r.attendees_count)
    ||data.visitors.some((r:any)=>typeof r.name!=='string'||!date(r.visited_at)||['profession','company','email','status','inviter_name'].some(k=>!text(r[k])))
    ||data.referrals.some((r:any)=>!date(r.created_at)||typeof r.from_member_name!=='string'||typeof r.to_member_name!=='string'
      ||!text(r.status)||r.amount!==null&&(typeof r.amount!=='string'||! /^-?\d+(?:\.\d{1,2})?$/.test(r.amount))))return false;
  const s=data.summary;
  if(!s||!['activeMembers','upcomingEvents','count','successful','missingAmounts'].every(k=>count(s[k]))||!decimal(s.knownVolume)
    ||s.count!==data.referrals.length||s.activeMembers!==data.members.filter((r:any)=>r.status==='ACTIVE').length)return false;
  const successful=data.referrals.filter((r:any)=>r.status==='SUCCESSFUL');
  const known=successful.filter((r:any)=>decimal(r.amount));
  return s.successful===successful.length&&s.missingAmounts===successful.length-known.length
    &&known.reduce((n:bigint,r:any)=>n+cents(r.amount),0n)===cents(s.knownVolume)
    &&(s.missingAmounts?s.volume===null:s.volume===s.knownVolume);
}
export const adminGroupDetailApi={async read(owner:string,id:string):Promise<AdminGroupDetailSnapshot>{
  if(!uuid(owner)||!uuid(id))throw new Error('Invalid group context');
  const data=await referralTransport.get<unknown>(`/admin/groups/${id}/detail`);
  if(!validAdminGroupDetail(data,owner,id))throw new Error('Invalid group detail snapshot');
  return data;
}};
