import {useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {useAuthStore} from '../stores/authStore';
import {messagesApi,type Conversation,type MessagePage} from '../api/messages';
import {Button} from '../shared/Button';
import {Card,CardHeader,CardTitle} from '../shared/Card';
import {Send,MessageSquare} from 'lucide-react';

interface Intent {key:string;content:string}
const storageKey=(owner:string,target:string)=>`e4n-message-pending:${owner}:${target}`;
function readIntent(owner:string,target:string):Intent|null {
 try {const v=JSON.parse(sessionStorage.getItem(storageKey(owner,target))||'null');return v&&typeof v.content==='string'&&typeof v.key==='string'?v:null;}catch{return null;}
}
export function MessagesPage() {
 const {user,token}=useAuthStore();
 const [params,setParams]=useSearchParams();
 const target=params.get('recipient')||'';
 const owner=user?.id||'',scope=`${owner}:${token||''}`,thread=`${scope}:${target}`;
 const live=useRef(thread);live.current=thread;
 const listEpoch=useRef(0),threadEpoch=useRef(0),lock=useRef(false),intent=useRef<Intent|null>(null);
 const [list,setList]=useState<{scope:string;rows:Conversation[]}|null>(null);
 const [page,setPage]=useState<{thread:string;data:MessagePage}|null>(null);
 const [listError,setListError]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [listRetry,setListRetry]=useState(0),[retry,setRetry]=useState(0);
 const [viewThread,setViewThread]=useState(thread);
 const [draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[recovering,setRecovering]=useState(false),[older,setOlder]=useState(false);
 useEffect(()=>{
  const epoch=++listEpoch.current;
  setList(null);setListError('');
  if(!owner||!token)return;
  messagesApi.conversations(owner).then(rows=>{if(epoch===listEpoch.current)setList({scope,rows});})
   .catch(()=>{if(epoch===listEpoch.current)setListError('Konuşmalar yüklenemedi.');});
  return()=>{listEpoch.current++;};
 },[scope,listRetry]);
 useEffect(()=>{
  const epoch=++threadEpoch.current;
  setViewThread(thread);setPage(null);setError('');setNotice('');setOlder(false);lock.current=false;setBusy(false);
  intent.current=owner&&target?readIntent(owner,target):null;
  setDraft(intent.current?.content||'');setRecovering(!!intent.current);
  if(!owner||!token||!target)return;
  messagesApi.page(owner,target).then(data=>{
   if(epoch!==threadEpoch.current||live.current!==thread)return;
   if(intent.current&&data.messages.some(m=>m.sender_id===owner&&m.request_key===intent.current!.key)){
    sessionStorage.removeItem(storageKey(owner,target));intent.current=null;setDraft('');setRecovering(false);setNotice('Önceki gönderim kaydedilmiş.');
   }
   setPage({thread,data});
  }).catch(()=>{if(epoch===threadEpoch.current&&live.current===thread)setError('Mesajlar yüklenemedi veya bu kişiyle bağlantınız yok.');});
  return()=>{threadEpoch.current++;};
 },[thread,retry]);
 const data=page?.thread===thread?page.data:null;
 const conversations=list?.scope===scope?list.rows:null;
 const shownError=viewThread===thread?error:'',shownNotice=viewThread===thread?notice:'';
 const send=async(e:React.FormEvent)=>{
  e.preventDefault();if(lock.current||!data||!draft.trim()||!owner||!token)return;
  const epoch=threadEpoch.current;lock.current=true;setBusy(true);setError('');setNotice('');
  try {
   // Persist the exact operation before sending, so an uncertain response can safely be retried after reload.
   const planned=intent.current||{key:crypto.randomUUID(),content:draft};
   sessionStorage.setItem(storageKey(owner,target),JSON.stringify(planned));intent.current=planned;setRecovering(true);
   await messagesApi.send(owner,target,planned.content,planned.key);
   if(readIntent(owner,target)?.key===planned.key)sessionStorage.removeItem(storageKey(owner,target));
   if(epoch!==threadEpoch.current||live.current!==thread)return;
   intent.current=null;setDraft('');setRecovering(false);setNotice('Mesaj kaydedildi.');
   setPage(null);
   try {const updated=await messagesApi.page(owner,target);if(epoch===threadEpoch.current&&live.current===thread)setPage({thread,data:updated});}
   catch {if(epoch===threadEpoch.current&&live.current===thread)setError('Mesaj kaydedildi; güncel liste okunamadı. Yenileyin.');}
   if(epoch===threadEpoch.current&&live.current===thread)setListRetry(n=>n+1);
  } catch {if(epoch===threadEpoch.current&&live.current===thread)setError('Gönderim doğrulanamadı. Yenileyin veya aynı gönderimi tekrar deneyin.');}
  finally {if(epoch===threadEpoch.current&&live.current===thread){lock.current=false;setBusy(false);}}
 };
 const loadOlder=async()=>{
  if(!data?.before||lock.current)return;
  const epoch=threadEpoch.current;lock.current=true;setOlder(true);setError('');
  try {const previous=await messagesApi.page(owner,target,data.before);if(epoch===threadEpoch.current&&live.current===thread)setPage({thread,data:{...data,messages:[...previous.messages,...data.messages],before:previous.before}});}
  catch {if(epoch===threadEpoch.current&&live.current===thread)setError('Önceki mesajlar yüklenemedi.');}
  finally {if(epoch===threadEpoch.current&&live.current===thread){lock.current=false;setOlder(false);}}
 };
 if(!owner||!token)return <p>Mesajlarınızı görmek için giriş yapın.</p>;
 return <div className="max-w-7xl mx-auto px-4 py-8">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
   <Card><CardHeader><CardTitle className="flex gap-2"><MessageSquare/>Konuşmalar</CardTitle></CardHeader>
    <div className="p-4 space-y-3">
     {listError?<div role="alert">{listError}<Button onClick={()=>setListRetry(n=>n+1)}>Tekrar Dene</Button></div>:!conversations?<p role="status">Konuşmalar yükleniyor...</p>:conversations.length===0?<p>Henüz konuşmanız yok. Bağlantınızın profilinden mesaj başlatabilirsiniz.</p>:conversations.map(c=><button key={c.friend.id} onClick={()=>setParams({recipient:c.friend.id})} className={`block w-full text-left rounded-lg p-3 ${target===c.friend.id?'bg-indigo-50':'hover:bg-gray-50'}`}>
      <span className="block font-semibold">{c.friend.full_name}</span><span className="block truncate text-sm text-gray-500">{c.lastMessage.content}</span>
     </button>)}
     <Button variant="outline" onClick={()=>setListRetry(n=>n+1)}>Konuşmaları Yenile</Button>
    </div>
   </Card>
   <Card className="md:col-span-2 flex flex-col min-h-[500px]">
    <CardHeader><CardTitle>{data?.friend.full_name||'Mesajlar'}</CardTitle>{data?.friend.profession&&<p>{data.friend.profession}</p>}</CardHeader>
    <div className="px-4">{shownNotice&&<p role="status">{shownNotice}</p>}{shownError&&<p role="alert" className="text-red-700">{shownError}</p>}
     {target&&<Button variant="outline" disabled={busy||older} onClick={()=>setRetry(n=>n+1)}>Mesajları Yenile</Button>}
    </div>
    <div className="flex-1 p-4 space-y-3 max-h-[60vh] overflow-y-auto bg-gray-50">
     {!target?<p>Mesajlaşmak için bir konuşma seçin veya bağlantınızın profilini açın.</p>:!data&&!shownError?<p role="status">Mesajlar yükleniyor...</p>:data&&<>
      {data.before&&<Button disabled={busy||older} variant="outline" onClick={loadOlder}>{older?'Yükleniyor...':'Önceki Mesajlar'}</Button>}
      {data.messages.length===0&&<p>Henüz mesaj yok.</p>}
      {data.messages.map(m=><div key={m.id} className={`flex ${m.sender_id===owner?'justify-end':'justify-start'}`}><div className={`max-w-[85%] rounded-lg p-3 ${m.sender_id===owner?'bg-indigo-600 text-white':'bg-white border'}`}><p className="whitespace-pre-wrap break-words">{m.content}</p><time className="block text-xs mt-2 opacity-70">{new Date(m.created_at).toLocaleString('tr-TR')}</time></div></div>)}
     </>}
    </div>
    {target&&<form onSubmit={send} className="p-4 flex gap-2 border-t">
     <input aria-label="Mesaj metni" maxLength={4000} readOnly={busy||recovering} disabled={!data} value={viewThread===thread?draft:''} onChange={e=>setDraft(e.target.value)} placeholder="Mesajınızı yazın..." className="flex-1 min-w-0 border rounded-lg px-3 py-2"/>
     <Button type="submit" disabled={!data||busy||older||!draft.trim()}><Send className="h-4 w-4 mr-2"/>{busy?'Gönderiliyor...':recovering?'Gönderimi Tekrar Dene':'Gönder'}</Button>
    </form>}
   </Card>
  </div>
 </div>;
}
