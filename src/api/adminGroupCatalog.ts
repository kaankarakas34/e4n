import {referralTransport} from './api';
export interface CatalogGroup {id:string;name:string;status:string|null;total_records:number;active_records:number;requested_records:number;other_records:number;unknown_records:number}
export interface GroupCatalog {version:1;ownerId:string;asOf:string;groups:CatalogGroup[]}
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export function validGroupCatalog(d:any,owner:string):d is GroupCatalog {
  if(!d||d.version!==1||d.ownerId!==owner||typeof d.asOf!=='string'||!Number.isFinite(Date.parse(d.asOf))||!Array.isArray(d.groups)||d.groups.length>5000)return false;
  const ids=new Set();
  for(const g of d.groups){
    if(!g||!uuid(g.id)||ids.has(g.id)||typeof g.name!=='string'||!(g.status===null||typeof g.status==='string'))return false;
    ids.add(g.id);
    if(!['total_records','active_records','requested_records','other_records','unknown_records'].every(k=>Number.isSafeInteger(g[k])&&g[k]>=0)
      ||g.active_records+g.requested_records+g.other_records+g.unknown_records!==g.total_records)return false;
  }
  return true;
}
export function filterGroupCatalog(groups:CatalogGroup[],search:string,status:string) {
  const query=search.trim().toLocaleLowerCase('tr-TR');
  return groups.filter(g=>(!query||g.name.toLocaleLowerCase('tr-TR').includes(query))&&(status==='ALL'||(status==='UNKNOWN'?g.status===null:g.status===status.slice(6))));
}
export const adminGroupCatalogApi={async read(owner:string):Promise<GroupCatalog>{
  if(!uuid(owner))throw new Error('Invalid catalog owner');
  const data=await referralTransport.get<unknown>('/admin/group-catalog');
  if(!validGroupCatalog(data,owner))throw new Error('Invalid group catalog');
  return data;
}};
