import {referralTransport} from './api';
export const jobLabels:Record<string,string>={'event-completion':'Etkinlik Tamamlama','subscription-reminders':'Üyelik Hatırlatması','champion-calculation':'Champion Hesaplama'};
export interface JobRun {id:string;job:string;source:string;state:string;started_at:string;completed_at:string|null;summary:Record<string,number|string>;error_code:string|null}
export interface JobHistory {version:1;ownerId:string;asOf:string;invocationEnabled:boolean;externalConfigured:boolean;manualJobs:string[];runs:JobRun[]}
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function validJobHistory(d:any,owner:string):d is JobHistory{
  return !!d&&d.version===1&&d.ownerId===owner&&uuid(owner)&&date(d.asOf)&&typeof d.invocationEnabled==='boolean'&&typeof d.externalConfigured==='boolean'
    &&Array.isArray(d.manualJobs)&&d.manualJobs.length===2&&d.manualJobs[0]==='event-completion'&&d.manualJobs[1]==='subscription-reminders'
    &&Array.isArray(d.runs)&&d.runs.length<=100&&new Set(d.runs.map((r:any)=>r?.id)).size===d.runs.length&&d.runs.every((r:any)=>
      r&&uuid(r.id)&&Object.prototype.hasOwnProperty.call(jobLabels,r.job)&&['SCHEDULE','EXTERNAL','ADMIN'].includes(r.source)&&['RUNNING','SUCCESS','SKIPPED','FAILED','UNKNOWN'].includes(r.state)
      &&date(r.started_at)&&(r.state==='RUNNING'?r.completed_at===null:date(r.completed_at))&&(r.error_code===null||typeof r.error_code==='string')
      &&r.summary&&typeof r.summary==='object'&&!Array.isArray(r.summary)&&Object.values(r.summary).every(v=>typeof v==='string'||typeof v==='number'&&Number.isFinite(v)));
}
export const webJobsApi={
  async read(owner:string):Promise<JobHistory>{const d=await referralTransport.get<unknown>('/admin/web-jobs');if(!validJobHistory(d,owner))throw Error('İş geçmişi yanıtı geçersiz.');return d;},
  async run(job:string){if(!['event-completion','subscription-reminders'].includes(job))throw Error('Geçersiz iş.');const r=await referralTransport.post<any>('/admin/web-jobs/'+job+'/run',{});if(!r||!uuid(r.id)||r.job!==job||!['SUCCESS','SKIPPED'].includes(r.state))throw Error('İş sonucu doğrulanamadı.');return r;}
};
