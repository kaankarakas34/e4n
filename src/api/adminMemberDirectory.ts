import {referralTransport} from './api';
export interface DirectoryMembership {id:string;name:string;group_status:string|null;membership_status:string|null;joined_at:string|null}
export interface DirectoryMember {id:string;name:string;email:string;phone:string|null;city:string|null;profession:string;company:string|null;role:string|null;account_status:string|null;created_at:string|null;position:string|null;linkedin_profile:string|null;groups:DirectoryMembership[]}
export interface MemberDirectory {version:1;ownerId:string;asOf:string;members:DirectoryMember[]}
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const text=(v:unknown)=>v===null||typeof v==='string';
const date=(v:unknown)=>v===null||typeof v==='string'&&Number.isFinite(Date.parse(v));
export function validMemberDirectory(d:any,owner:string):d is MemberDirectory {
  if(!d||d.version!==1||d.ownerId!==owner||typeof d.asOf!=='string'||!date(d.asOf)||!Array.isArray(d.members)||d.members.length>5000)return false;
  const members=new Set();let memberships=0;
  for(const m of d.members){
    if(!m||!uuid(m.id)||members.has(m.id)||!['name','email','profession'].every(k=>typeof m[k]==='string')
      ||!['phone','city','company','role','account_status','position','linkedin_profile'].every(k=>text(m[k]))||!date(m.created_at)||!Array.isArray(m.groups))return false;
    members.add(m.id);memberships+=m.groups.length;const groups=new Set();
    for(const g of m.groups){if(!g||!uuid(g.id)||groups.has(g.id)||typeof g.name!=='string'||!text(g.group_status)||!text(g.membership_status)||!date(g.joined_at))return false;groups.add(g.id);}
  }
  return memberships<=50000;
}
export const directoryStatus=(value:string|null)=>{
  const labels:Record<string,string>={ACTIVE:'Aktif',INACTIVE:'Pasif',PENDING:'Bekliyor',REQUESTED:'Talep edildi',DRAFT:'Taslak'};
  return value&&Object.prototype.hasOwnProperty.call(labels,value)?labels[value]:value?`Diğer durum (${value})`:'Bilinmiyor';
};
export function filterDirectory(members:DirectoryMember[],filters:{tab:'members'|'community';search:string;role:string;status:string;group:string}):DirectoryMember[] {
  const search=filters.search.trim().toLocaleLowerCase('tr-TR');
  const role=filters.role.startsWith('VALUE:')?filters.role.slice(6):filters.role;
  const status=filters.status.startsWith('VALUE:')?filters.status.slice(6):filters.status;
  return members.filter(m=>(filters.tab==='community'?m.role==='COMMUNITY_MEMBER':m.role!=='COMMUNITY_MEMBER')
    &&(!search||[m.name,m.email,m.company,m.profession,m.city].some(v=>v?.toLocaleLowerCase('tr-TR').includes(search)))
    &&(filters.role==='ALL'||(filters.role==='UNKNOWN'?m.role===null:m.role===role))
    &&(filters.status==='ALL'||(filters.status==='UNKNOWN'?m.account_status===null:m.account_status===status))
    &&(filters.group==='ALL'||(filters.group==='NONE'?m.groups.length===0:m.groups.some(g=>g.id===filters.group))));
}
export const adminMemberDirectoryApi={async read(owner:string):Promise<MemberDirectory>{
  if(!uuid(owner))throw new Error('Invalid directory owner');
  const data=await referralTransport.get<unknown>('/admin/member-directory');
  if(!validMemberDirectory(data,owner))throw new Error('Invalid member directory');
  return data;
}};
