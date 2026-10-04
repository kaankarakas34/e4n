import { referralTransport as apiClient } from './api';

export interface ReferralRow {
  id:string; giver_id:string; receiver_id:string; type:'INTERNAL'|'EXTERNAL'; temperature:'HOT'|'WARM'|'COLD';
  status:'PENDING'|'SUCCESSFUL'|'UNSUCCESSFUL'; description:string; amount:string|number|null; created_at:string;
  giver_name?:string; receiver_name?:string;
}
export interface ReferralInput {receiverId:string;type:ReferralRow['type'];temperature:ReferralRow['temperature'];description:string;amount?:number|null}
export interface ReferralScope {id:string;name:string;kind:'group'|'team'}
const text=(v:unknown)=>typeof v==='string' && !!v.trim();
export const validReferral=(r:any):r is ReferralRow=>r && !Array.isArray(r) && ['id','giver_id','receiver_id'].every(k=>text(r[k]))
  && ['INTERNAL','EXTERNAL'].includes(r.type) && ['HOT','WARM','COLD'].includes(r.temperature)
  && ['PENDING','SUCCESSFUL','UNSUCCESSFUL'].includes(r.status) && typeof r.description==='string'
  && typeof r.created_at==='string' && Number.isFinite(Date.parse(r.created_at))
  && (r.amount==null || (typeof r.amount==='string' && /^\d+(?:\.\d{1,2})?$/.test(r.amount) || typeof r.amount==='number') && Number.isFinite(Number(r.amount)) && Number(r.amount)>=0)
  && ['giver_name','receiver_name'].every(k=>r[k]==null || typeof r[k]==='string');
export function referralRevenue(value:string,positive=true) {
  if(!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value)<0 || positive && Number(value)===0 || Number(value)>99999999.99) throw new Error('Ciroyu en fazla iki ondalık basamakla girin; başarılı sonuç için pozitif tutar gerekir.');
  return Number(value);
}
const peopleRows=(rows:unknown,owner:string)=>{
  if(!Array.isArray(rows) || !rows.every(r=>r && text(r.id) && text(r.name || r.full_name))) throw new Error('Üye listesi doğrulanamadı.');
  return [...new Map(rows.filter(r=>r.id!==owner).map(r=>[r.id,{id:r.id as string,name:(r.name||r.full_name) as string}])).values()];
};
export const referralsApi={
  async list(owner:string){
    const rows=await apiClient.get<unknown>('/referrals');
    if(!Array.isArray(rows) || !rows.every(r=>validReferral(r) && (r.giver_id===owner || r.receiver_id===owner))) throw new Error('Referans listesi doğrulanamadı.');
    return rows as ReferralRow[];
  },
  async scopes(owner:string){
    const [groups,teams]=await Promise.all([apiClient.get<unknown>(`/user/groups?userId=${encodeURIComponent(owner)}`),apiClient.get<unknown>(`/user/power-teams?userId=${encodeURIComponent(owner)}`)]);
    const result:ReferralScope[]=[];
    for(const [kind,rows] of [['group',groups],['team',teams]] as const){
      if(!Array.isArray(rows) || !rows.every(r=>r && text(r.id) && text(r.name))) throw new Error('Grup/lonca listesi doğrulanamadı.');
      for(const row of rows)result.push({id:row.id,name:row.name,kind});
    }
    return result;
  },
  async people(owner:string,scope?:ReferralScope){
    const endpoint=scope?`/${scope.kind==='group'?'groups':'power-teams'}/${encodeURIComponent(scope.id)}/members`:'/user/friends';
    return peopleRows(await apiClient.get<unknown>(endpoint),owner);
  },
  async create(owner:string,input:ReferralInput,requestId:string){
    if(!text(owner) || !text(requestId) || !text(input.receiverId) || input.receiverId===owner || !input.description.trim() || input.description.length>10000) throw new Error('Referans bilgilerini kontrol edin.');
    const row=await apiClient.post<unknown>('/referrals',{...input,description:input.description.trim(),requestId});
    if(!validReferral(row) || row.id!==requestId || row.giver_id!==owner || row.receiver_id!==input.receiverId || row.type!==input.type
      || row.temperature!==input.temperature || row.description!==input.description.trim()
      || (row.amount==null?null:Number(row.amount))!==(input.amount??null)) throw new Error('Referans kaydı doğrulanamadı.');
    return row;
  },
  async decide(owner:string,id:string,status:'SUCCESSFUL'|'UNSUCCESSFUL',amount?:number){
    if(!['SUCCESSFUL','UNSUCCESSFUL'].includes(status) || status==='SUCCESSFUL' && !(amount!==undefined && amount>0)) throw new Error('Referans sonucunu kontrol edin.');
    const row=await apiClient.put<unknown>(`/referrals/${encodeURIComponent(id)}`,{status,...(amount===undefined?{}:{amount})});
    if(!validReferral(row) || row.id!==id || row.receiver_id!==owner || row.status!==status || amount!==undefined && Number(row.amount)!==amount) throw new Error('Referans sonucu doğrulanamadı.');
    return row;
  }
};
