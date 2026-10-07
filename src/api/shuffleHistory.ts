import {referralTransport} from './api';
export interface HistorySnapshot {groups:{id:string;name:string;status:string|null}[];members:{id:string;full_name:string;role:string|null}[];memberships:{group_id:string;user_id:string;role:string|null;status:string|null;joined_at:string|null}[]}
export interface Execution {id:string;actor_id:string;actor_name:string;applied_at:string;expected_revision:string|null;before_revision:string;after_revision:string;member_count:number;group_count:number;before_snapshot?:HistorySnapshot;after_snapshot?:HistorySnapshot}
export interface ShuffleHistory {version:1;ownerId:string;asOf:string;executions:Execution[]}
const uuid=(v:any)=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const date=(v:any)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const revision=(v:any)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const optional=(v:any)=>v===null||typeof v==='string';
function validSnapshot(s:any):s is HistorySnapshot {
 if(!s||!Array.isArray(s.groups)||s.groups.length>5000||!Array.isArray(s.members)||s.members.length>10000||!Array.isArray(s.memberships)||s.memberships.length>50000)return false;
 const groups=new Set<string>(),users=new Set<string>(),pairs=new Set<string>();
 for(const g of s.groups){if(!g||!uuid(g.id)||groups.has(g.id)||typeof g.name!=='string'||!optional(g.status))return false;groups.add(g.id);}
 for(const m of s.members){if(!m||!uuid(m.id)||users.has(m.id)||typeof m.full_name!=='string'||!optional(m.role))return false;users.add(m.id);}
 for(const m of s.memberships){const key=m?.group_id+'|'+m?.user_id;if(!m||!groups.has(m.group_id)||!users.has(m.user_id)||pairs.has(key)||!optional(m.role)||!optional(m.status)||!(m.joined_at===null||date(m.joined_at)))return false;pairs.add(key);}
 return true;
}
export function validExecution(r:any,detail=false):r is Execution {
 return !!r&&uuid(r.id)&&uuid(r.actor_id)&&typeof r.actor_name==='string'&&date(r.applied_at)&&(r.expected_revision===null||revision(r.expected_revision))&&revision(r.before_revision)&&revision(r.after_revision)&&Number.isSafeInteger(r.member_count)&&r.member_count>=0&&Number.isSafeInteger(r.group_count)&&r.group_count>=0&&(!detail||validSnapshot(r.before_snapshot)&&validSnapshot(r.after_snapshot)&&r.after_snapshot.memberships.filter((m:any)=>m.status==='ACTIVE').length===r.member_count&&new Set(r.after_snapshot.memberships.filter((m:any)=>m.status==='ACTIVE').map((m:any)=>m.group_id)).size===r.group_count);
}
export function validHistory(d:any,owner:string):d is ShuffleHistory {return !!d&&d.version===1&&uuid(owner)&&d.ownerId===owner&&date(d.asOf)&&Array.isArray(d.executions)&&d.executions.length<=100&&d.executions.every((r:any)=>validExecution(r))&&new Set(d.executions.map((r:any)=>r.id)).size===d.executions.length;}
export function executionChanges(r:Execution){
 const before=r.before_snapshot!,after=r.after_snapshot!,beforeUsers=new Map(before.members.map(m=>[m.id,m])),afterUsers=new Map(after.members.map(m=>[m.id,m]));
 const labels=(s:HistorySnapshot)=>{const groups=new Map(s.groups.map(g=>[g.id,g.name])),byUser=new Map<string,string[]>();for(const m of s.memberships){if(!byUser.has(m.user_id))byUser.set(m.user_id,[]);byUser.get(m.user_id)!.push((groups.get(m.group_id)||m.group_id)+' ('+(m.status||'Bilinmiyor')+')');}return byUser;};
 const bGroups=labels(before),aGroups=labels(after);
 const ids=[...new Set([...bGroups.keys(),...aGroups.keys(),...before.members.filter(m=>m.role!==afterUsers.get(m.id)?.role).map(m=>m.id)])];
 return ids.map(id=>{const b=beforeUsers.get(id),a=afterUsers.get(id);return{id,name:a?.full_name||b?.full_name||id,before:bGroups.get(id)?.join(', ')||'Grup kaydı yok',after:aGroups.get(id)?.join(', ')||'Grup kaydı yok',beforeRole:b?.role||'Bilinmiyor',afterRole:a?.role||'Bilinmiyor'};});
}
export const shuffleHistoryApi={async read(owner:string){const d=await referralTransport.get<unknown>('/admin/shuffle-history');if(!validHistory(d,owner))throw Error('Invalid history');return d;},async detail(owner:string,id:string):Promise<Execution>{if(!uuid(id))throw Error('Invalid execution');const d:any=await referralTransport.get('/admin/shuffle-history/'+id);if(d?.version!==1||d.ownerId!==owner||!date(d.asOf)||!validExecution(d.execution,true)||d.execution.id!==id)throw Error('Invalid execution response');return d.execution;}};
