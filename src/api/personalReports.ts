import {referralTransport} from './api';
export type ReportRange='7d'|'30d'|'90d'|'1y';
export interface ReferralMetric {count:number;successful:number;missingAmounts:number;knownVolume:string;volume:string|null}
export interface PersonalReport {
  version:1;ownerId:string;dateRange:ReportRange;period:{start:string;end:string};
  referralsGiven:ReferralMetric;referralsReceived:ReferralMetric;meetingsCompleted:number;visitorsHosted:number;educationHours:string;
  performance:{score:number|null;color:string|null};
}
const count=(v:unknown)=>typeof v==='number' && Number.isSafeInteger(v) && v>=0;
const decimal=(v:unknown)=>typeof v==='string' && /^\d+(?:\.\d+)?$/.test(v) && Number.isFinite(Number(v));
const metric=(v:any)=>v && count(v.count) && count(v.successful) && count(v.missingAmounts) && v.successful<=v.count && v.missingAmounts<=v.successful
  && decimal(v.knownVolume) && (v.missingAmounts>0?v.volume===null:decimal(v.volume) && v.volume===v.knownVolume);
export function validPersonalReport(r:any,owner:string,range:ReportRange):r is PersonalReport {
  return !!r && r.version===1 && r.ownerId===owner && r.dateRange===range && r.period
    && typeof r.period.start==='string' && typeof r.period.end==='string'
    && Date.parse(r.period.end)-Date.parse(r.period.start)===({'7d':7,'30d':30,'90d':90,'1y':365}[range]*86400000)
    && metric(r.referralsGiven) && metric(r.referralsReceived) && count(r.meetingsCompleted) && count(r.visitorsHosted) && decimal(r.educationHours)
    && r.performance && (r.performance.score===null || count(r.performance.score) && r.performance.score<=100)
    && (r.performance.color===null || ['GREY','GREEN','YELLOW','RED'].includes(r.performance.color));
}
export const personalReportsApi={async get(owner:string,dateRange:ReportRange):Promise<PersonalReport>{
  if(!owner || !['7d','30d','90d','1y'].includes(dateRange))throw new Error('Rapor isteği doğrulanamadı.');
  const result=await referralTransport.get<unknown>(`/reports/me?dateRange=${dateRange}`);
  if(!validPersonalReport(result,owner,dateRange))throw new Error('Rapor yanıtı doğrulanamadı.');
  return result;
}};
