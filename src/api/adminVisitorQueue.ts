import {referralTransport} from './api';
export interface QueueVisitor {
  id:string;name:string;email:string|null;phone:string|null;company:string|null;profession:string|null;source:string|null;
  status:string|null;created_at:string|null;category:'visitors'|'registrations';event_id:string|null;event_title:string|null;
  event_start_at:string|null;inviter_name:string|null;form_data:Record<string,string|string[]>;
  title:string|null;web_linkedin:string|null;activity_area:string|null;duration:string|null;target_customer:string|null;
  why_join:string|null;value_add:string|null;previous_groups:string|null;
}
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const text=(v:unknown)=>v===null||typeof v==='string';
const date=(v:unknown)=>v===null||typeof v==='string'&&Number.isFinite(Date.parse(v));
const formKeys=new Set('education_level work_status job_title company_size main_services sector experience_years differentiating_factor value_provided ideal_referral success_story network_size network_sectors network_opportunities referral_example network_sharing_approach primary_expectation target_connection_types ideal_referral_definition time_commitment core_value discovery_source referral_name title web_linkedin activity_area duration target_customer why_join value_add previous_groups'.split(' '));
export function validQueueVisitor(v:any):v is QueueVisitor {
  return !!v&&uuid(v.id)&&typeof v.name==='string'&&['visitors','registrations'].includes(v.category)
    &&v.category===(['visitor_invite','visitor_payment'].includes(v.source)?'registrations':'visitors')
    &&['email','phone','company','profession','source','status','event_title','inviter_name','title','web_linkedin','activity_area','duration','target_customer','why_join','value_add','previous_groups'].every(k=>text(v[k]))
    &&date(v.created_at)&&date(v.event_start_at)&&(v.event_id===null||uuid(v.event_id))
    &&v.form_data&&typeof v.form_data==='object'&&!Array.isArray(v.form_data)
    &&Object.keys(v.form_data).every(key=>formKeys.has(key))
    &&Object.values(v.form_data).every(a=>typeof a==='string'||Array.isArray(a)&&a.every(x=>typeof x==='string'));
}
export const queueStatus=(v:string|null)=>{
  const labels:Record<string,string>={PENDING:'Bekliyor',CONTACTED:'İletişime geçildi',CONVERTED:'Üye oldu',REJECTED:'Reddedildi'};
  return v&&Object.prototype.hasOwnProperty.call(labels,v)?labels[v]:(v?`Diğer durum (${v})`:'Durum bilinmiyor');
};
export const adminVisitorQueueApi={
  async read(owner:string):Promise<QueueVisitor[]> {
    const data=await referralTransport.get<any>('/admin/visitor-queue');
    if(!data||data.version!==1||data.ownerId!==owner||!Array.isArray(data.visitors)||data.visitors.length>5000
      ||!data.visitors.every(validQueueVisitor)||new Set(data.visitors.map((v:QueueVisitor)=>v.id)).size!==data.visitors.length)throw new Error('Invalid visitor queue');
    return data.visitors;
  },
  async contacted(owner:string,id:string):Promise<QueueVisitor> {
    if(!uuid(owner)||!uuid(id))throw new Error('Invalid contact context');
    const data=await referralTransport.put<any>(`/admin/visitor-queue/${id}/contacted`,{});
    if(!data||data.version!==1||data.ownerId!==owner||data.visitor?.id!==id||!validQueueVisitor(data.visitor)||data.visitor.status!=='CONTACTED')throw new Error('Invalid contact result');
    return data.visitor;
  },
};
