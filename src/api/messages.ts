import {referralTransport} from './api';
export interface Message {id:string;sender_id:string;receiver_id:string;content:string;request_key:string;created_at:string}
export interface MessageFriend {id:string;full_name:string;profession:string|null}
export interface Conversation {friend:MessageFriend;lastMessage:Message}
export interface MessagePage {ownerId:string;targetId:string;friend:MessageFriend;messages:Message[];before:string|null}
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const bad=()=>new Error('Mesaj yanıtı doğrulanamadı. Durumu yenileyin.');
const friend=(f:any)=>f&&uuid(f.id)&&typeof f.full_name==='string'&&(f.profession===null||typeof f.profession==='string');
const row=(m:any,owner:string,target:string)=>m&&uuid(m.id)&&uuid(m.request_key)&&typeof m.content==='string'&&!!m.content.trim()&&m.content.length<=4000
  && typeof m.created_at==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(m.created_at)&&Number.isFinite(Date.parse(m.created_at))
  && (m.sender_id===owner&&m.receiver_id===target||m.sender_id===target&&m.receiver_id===owner);
export const messagesApi={
 async conversations(owner:string):Promise<Conversation[]>{
  if(!uuid(owner))throw bad();
  const r=await referralTransport.get<{ownerId:string;conversations:Conversation[]}>('/messages/conversations');
  if(!r||r.ownerId!==owner||!Array.isArray(r.conversations)||r.conversations.some(c=>!friend(c.friend)||c.friend.id===owner||!row(c.lastMessage,owner,c.friend.id))
    ||new Set(r.conversations.map(c=>c.friend.id)).size!==r.conversations.length)throw bad();
  return r.conversations;
 },
 async page(owner:string,target:string,before?:string):Promise<MessagePage>{
  if(!uuid(owner)||!uuid(target)||owner===target||before!==undefined&&!uuid(before))throw bad();
  const r=await referralTransport.get<MessagePage>(`/messages/${target}${before?`?before=${before}`:''}`);
  if(!r||r.ownerId!==owner||r.targetId!==target||!friend(r.friend)||r.friend.id!==target||!Array.isArray(r.messages)||r.messages.length>50
   ||r.messages.some(m=>!row(m,owner,target))||new Set(r.messages.map(m=>m.id)).size!==r.messages.length
   ||r.messages.some((m,i)=>i>0&&(m.created_at<r.messages[i-1].created_at||m.created_at===r.messages[i-1].created_at&&m.id<r.messages[i-1].id))
   ||r.before!==null&&(!uuid(r.before)||r.before!==r.messages[0]?.id))throw bad();
  return r;
 },
 async send(owner:string,target:string,content:string,requestKey:string):Promise<Message>{
  if(!uuid(owner)||!uuid(target)||owner===target||!uuid(requestKey)||!content.trim()||content.length>4000)throw bad();
  const r=await referralTransport.post<{ownerId:string;targetId:string;message:Message;replay:boolean}>(`/messages/${target}`,{content,requestKey});
  if(!r||r.ownerId!==owner||r.targetId!==target||!row(r.message,owner,target)||r.message.sender_id!==owner||r.message.request_key!==requestKey
   ||r.message.content!==content.trim()||typeof r.replay!=='boolean')throw bad();
  return r.message;
 }
};
