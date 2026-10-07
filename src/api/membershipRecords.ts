import {referralTransport} from './api';
export interface AccountRecord {id:string;name:string;email:string;role:string|null;account_status:string|null;subscription_plan:string|null;subscription_end_date:string|null}
export interface MembershipRecords {version:1;ownerId:string;targetId:string;asOf:string;account:AccountRecord;totals:{payments:number;invoices:number;reminders:number};payments:{id:string;plan_id:string|null;amount:string|null;status:string|null;action_type:string|null;created_at:string|null;updated_at:string|null}[];invoices:{id:string;filename:string;size_bytes:number;email_state:string;created_at:string}[];reminders:{id:string;subscription_end_date:string;trigger_days:number;delivery_state:string;claimed_at:string;completed_at:string|null}[]}
export interface AccountRecords {version:1;ownerId:string;asOf:string;accounts:AccountRecord[];unownedPayments:number}
const uuid=(v:any)=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const text=(v:any)=>v===null||typeof v==='string';
const date=(v:any)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const optionalDate=(v:any)=>v===null||date(v);
const integer=(v:any)=>Number.isSafeInteger(v)&&v>=0;
const envelope=(d:any,owner:string)=>d?.version===1&&uuid(owner)&&d.ownerId===owner&&date(d.asOf);
const account=(a:any)=>!!a&&uuid(a.id)&&typeof a.name==='string'&&typeof a.email==='string'&&['role','account_status','subscription_plan'].every(k=>text(a[k]))&&optionalDate(a.subscription_end_date);
const rows=(r:any,total:number,validate:(x:any)=>boolean)=>Array.isArray(r)&&integer(total)&&r.length===Math.min(100,total)&&r.every(validate)&&new Set(r.map((x:any)=>x.id)).size===r.length;
export function validRecords(d:any,owner:string,target:string):d is MembershipRecords {
 return envelope(d,owner)&&uuid(target)&&d.targetId===target&&account(d.account)&&d.account.id===target&&!!d.totals
 &&rows(d.payments,d.totals.payments,p=>!!p&&typeof p.id==='string'&&p.id.length>0&&text(p.plan_id)&&text(p.status)&&text(p.action_type)&&(p.amount===null||typeof p.amount==='string'&&/^-?\d+(\.\d+)?$/.test(p.amount))&&optionalDate(p.created_at)&&optionalDate(p.updated_at))
 &&rows(d.invoices,d.totals.invoices,i=>!!i&&uuid(i.id)&&typeof i.filename==='string'&&integer(i.size_bytes)&&i.size_bytes>0&&i.size_bytes<=3145728&&['ATTEMPTED','SENT','UNKNOWN','NO_ADDRESS'].includes(i.email_state)&&date(i.created_at))
 &&rows(d.reminders,d.totals.reminders,r=>!!r&&uuid(r.id)&&date(r.subscription_end_date)&&[3,1,-1,-3,-5].includes(r.trigger_days)&&['CLAIMED','SENT','UNKNOWN','NO_EMAIL'].includes(r.delivery_state)&&date(r.claimed_at)&&optionalDate(r.completed_at));
}
export function validAccounts(d:any,owner:string):d is AccountRecords {return envelope(d,owner)&&integer(d.unownedPayments)&&Array.isArray(d.accounts)&&d.accounts.length<=5000&&d.accounts.every(account)&&new Set(d.accounts.map((a:any)=>a.id)).size===d.accounts.length;}
export function expiryRecord(a:AccountRecord,asOf:string){return !a.subscription_end_date?'Bitiş kaydı yok':Date.parse(a.subscription_end_date)<Date.parse(asOf)?'Bitiş zamanı geçmiş':'Bitiş zamanı henüz geçmemiş';}
export const membershipRecordsApi={async accounts(owner:string){const d=await referralTransport.get('/admin/membership-records');if(!validAccounts(d,owner))throw Error('Invalid account records');return d;},async read(owner:string,target=owner,admin=false){if(!uuid(owner)||!uuid(target)||!admin&&target!==owner)throw Error('Invalid records owner');const d=await referralTransport.get(admin?'/admin/membership-records/'+target:'/membership-records');if(!validRecords(d,owner,target))throw Error('Invalid membership records');return d;}};
