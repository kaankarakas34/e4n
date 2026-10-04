import {referralTransport} from './api';
import type {ReportRange,ReferralMetric} from './personalReports';
export interface AdminReport {
  version:1;ownerId:string;dateRange:ReportRange;period:{start:string;end:string};
  stock:{accounts:number;active_groups:number;active_teams:number};
  activity:{new_accounts:number;events:number;meetings:number;visitor_records:number;joined_visitors:number;attended_visitors:number};
  volumes:{total:ReferralMetric;internal:ReferralMetric;external:ReferralMetric;unclassified:ReferralMetric};
  monthly:{month:string;newAccounts:number;referrals:ReferralMetric}[];
  performance:{id:string;name:string;profession:string;score:number|null;color:string|null}[];
  attendance:{id:string;name:string;present:number;absent:number;late:number;medical:number;substitute:number}[];
}
const count=(v:unknown)=>typeof v==='number' && Number.isSafeInteger(v) && v>=0;
const decimal=(v:unknown)=>typeof v==='string' && /^\d+(?:\.\d{1,2})?$/.test(v) && Number.isFinite(Number(v));
const metric=(v:any)=>v && count(v.count) && count(v.successful) && v.successful<=v.count && count(v.missingAmounts) && v.missingAmounts<=v.successful
  && decimal(v.knownVolume) && (v.missingAmounts?v.volume===null:v.volume===v.knownVolume);
export function validAdminReport(r:any,owner:string,range:ReportRange):r is AdminReport {
  const names=(rows:any)=>Array.isArray(rows)&&rows.every(v=>v&&typeof v.id==='string'&&!!v.id&&typeof v.name==='string')&&new Set(rows.map(v=>v.id)).size===rows.length;
  const shape=!!r && r.version===1 && r.ownerId===owner && r.dateRange===range && r.period
    && typeof r.period.start==='string' && typeof r.period.end==='string'
    && Date.parse(r.period.end)-Date.parse(r.period.start)===({'7d':7,'30d':30,'90d':90,'1y':365}[range]*86400000)
    && r.stock && ['accounts','active_groups','active_teams'].every(k=>count(r.stock[k]))
    && r.activity && ['new_accounts','events','meetings','visitor_records','joined_visitors','attended_visitors'].every(k=>count(r.activity[k]))
    && r.activity.joined_visitors<=r.activity.attended_visitors && r.activity.attended_visitors<=r.activity.visitor_records
    && r.volumes && ['total','internal','external','unclassified'].every(k=>metric(r.volumes[k]))
    && Array.isArray(r.monthly) && r.monthly.length>0 && r.monthly.length<=13
    && r.monthly.every((v:any,i:number)=>v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v.month) && (!i||r.monthly[i-1].month<v.month) && count(v.newAccounts) && metric(v.referrals))
    && names(r.performance) && r.performance.every((v:any)=>typeof v.profession==='string'&&(v.score===null||count(v.score)&&v.score<=100)&&(v.color===null||['GREY','RED','YELLOW','GREEN'].includes(v.color)))
    && names(r.attendance) && r.attendance.every((v:any)=>['present','absent','late','medical','substitute'].every(k=>count(v[k])));
  if(!shape)return false;
  const cents=(v:string)=>{const [a,b='']=v.split('.');return BigInt(a)*100n+BigInt(b.padEnd(2,'0'));};
  const total=r.volumes.total,parts=[r.volumes.internal,r.volumes.external,r.volumes.unclassified];
  const expected:string[]=[];
  const start=new Date(r.period.start),end=new Date(Date.parse(r.period.end)-1);
  const month=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),1));
  while(month<=end){expected.push(month.toISOString().slice(0,7));month.setUTCMonth(month.getUTCMonth()+1);}
  const attendanceIds=new Set(r.attendance.map((a:any)=>a.id));
  return r.monthly.length===expected.length && r.monthly.every((m:any,i:number)=>m.month===expected[i])
    && r.activity.new_accounts<=r.stock.accounts && r.monthly.reduce((n:number,m:any)=>n+m.newAccounts,0)===r.activity.new_accounts
    && ['count','successful','missingAmounts'].every(k=>parts.reduce((n:number,p:any)=>n+p[k],0)===total[k]
      && r.monthly.reduce((n:number,m:any)=>n+m.referrals[k],0)===total[k])
    && parts.reduce((n,p)=>n+cents(p.knownVolume),0n)===cents(total.knownVolume)
    && r.monthly.reduce((n:bigint,m:any)=>n+cents(m.referrals.knownVolume),0n)===cents(total.knownVolume)
    && r.performance.length===r.stock.accounts && r.attendance.length===r.stock.accounts
    && r.performance.every((p:any)=>attendanceIds.has(p.id));
}
export const adminReportsApi={async get(owner:string,dateRange:ReportRange):Promise<AdminReport>{
  if(!owner||!['7d','30d','90d','1y'].includes(dateRange))throw new Error('Rapor isteği doğrulanamadı.');
  const data=await referralTransport.get<unknown>(`/admin/reports?dateRange=${dateRange}`);
  if(!validAdminReport(data,owner,dateRange))throw new Error('Yönetici raporu yanıtı doğrulanamadı.');
  return data;
}};
