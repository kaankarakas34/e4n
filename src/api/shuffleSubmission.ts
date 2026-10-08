import {referralTransport} from './api';
export interface ShuffleCommand {requestId:string;expectedRevision:string;assignments:Record<string,string[]>}
export interface ShuffleReceipt {version:1;success:true;ownerId:string;requestId:string;executionId:string;expectedRevision:string;afterRevision:string;fingerprint:string;replayed:boolean}
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function validShuffleCommand(b:any):b is ShuffleCommand{
 if(!b||Object.keys(b).sort().join(',')!=='assignments,expectedRevision,requestId'||!uuid(b.requestId)||!hash(b.expectedRevision)||!b.assignments||typeof b.assignments!=='object'||Array.isArray(b.assignments))return false;
 const entries=Object.entries(b.assignments),ids=new Set<string>();
 if(!entries.length||entries.length>5000)return false;
 for(const [g,list] of entries){if(!uuid(g)||!Array.isArray(list)||list.length>5000)return false;for(const id of list){if(!uuid(id)||ids.has(id))return false;ids.add(id);}}
 return ids.size>0;
}
async function check(d:any,owner:string,b:ShuffleCommand):Promise<ShuffleReceipt>{
 const canonical=JSON.stringify([b.expectedRevision,Object.entries(b.assignments).sort(([a],[z])=>a.localeCompare(z)).map(([g,ids])=>[g,[...ids].sort()])]);
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
 const fingerprint=Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join('');
 if(!d||d.version!==1||d.success!==true||d.ownerId!==owner||d.requestId!==b.requestId||d.executionId!==b.requestId||d.expectedRevision!==b.expectedRevision||!hash(d.afterRevision)||d.fingerprint!==fingerprint||typeof d.replayed!=='boolean')throw Error('Dağıtım işlem sonucu bu taslakla eşleşmiyor.');
 return d;
}
export const shuffleSubmissionApi={
 async save(owner:string,b:ShuffleCommand){if(!uuid(owner)||!validShuffleCommand(b))throw Error('Geçersiz dağıtım işlemi.');return check(await referralTransport.post('/shuffle/save',b),owner,b);},
 async reconcile(owner:string,b:ShuffleCommand){if(!uuid(owner)||!validShuffleCommand(b))throw Error('Geçersiz dağıtım işlemi.');return check(await referralTransport.get('/admin/shuffle-submissions/'+b.requestId),owner,b);}
};
