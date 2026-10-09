import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuthStore} from '../stores/authStore';
import {groupApplicationsApi,applicationError,applicationLabel,type Application,type DiscoveredGroup} from '../api/groupApplications';
import {Button} from '../shared/Button';
export function GroupDiscovery(){
 const {user,token}=useAuthStore();const context=`${user?.id}:${token}`;const current=useRef(context);current.current=context;
 const [data,setData]=useState<{context:string;hasSubscription:boolean;groups:DiscoveredGroup[];applications:Application[]}|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0),[detail,setDetail]=useState<string|null>(null);const lock=useRef(false);
 useEffect(()=>{let cancelled=false;setData(null);setError('');setDetail(null);if(user?.id)Promise.all([groupApplicationsApi.discover(user.id),groupApplicationsApi.mine(user.id)]).then(([d,applications])=>{if(!cancelled)setData({...d,context,applications});}).catch(e=>{if(!cancelled)setError(applicationError(e));});return()=>{cancelled=true;};},[context,retry]);
 const join=async(group:string)=>{if(!user?.id||lock.current)return;lock.current=true;setBusy(true);setError('');try{await groupApplicationsApi.join(user.id,group);if(current.current===context)setRetry(n=>n+1);}catch(e){if(current.current===context)setError(applicationError(e));}finally{lock.current=false;setBusy(false);}};
 const snapshot=data?.context===context?data:null;
 return <section aria-label="Grup seçimi" className="space-y-4 rounded-lg bg-white p-5 border">
  <div className="flex justify-between"><h2 className="text-lg font-semibold">Grup seç ve incele</h2><Button variant="outline" disabled={busy} onClick={()=>setRetry(n=>n+1)}>Yenile</Button></div>
  {error&&<p role="alert" className="text-red-700">{error}</p>}
  {!snapshot&&!error&&<p role="status">Gruplar yükleniyor…</p>}
  {snapshot&&<>
   {!snapshot.hasSubscription&&<p>Grupları inceleyebilirsiniz. Başvuru göndermek için <Link className="underline text-red-700" to="/membership">aboneliğinizi başlatın</Link>.</p>}
   {!snapshot.groups.length&&<p>Henüz aktif grup yok.</p>}
   {snapshot.groups.map(g=><article className="border rounded p-4 space-y-2" key={g.id}>
    <h3 className="font-semibold">{g.name}</h3><p>Başkan: {g.president??'Başkan bilgisi doğrulanamadı'}{g.city?` • ${g.city}`:''}{g.meeting_time?` • Toplantı: ${g.meeting_time}`:''}</p>
    <p>{g.member_count} / 35 üye (başkan hariç) • {g.available_seats} boş koltuk</p>
    <div className="flex gap-2 items-center"><Button size="sm" variant="outline" onClick={()=>setDetail(detail===g.id?null:g.id)}>İncele</Button>
     {g.own_status==='ACTIVE'?<span>Üyesiniz</span>:g.application_state?<span>{applicationLabel(g.application_state)}</span>:g.own_status==='REQUESTED'||g.own_status==='PENDING'?<span>Başvuru bekliyor</span>:<Button size="sm" disabled={busy||!snapshot.hasSubscription||!g.president_ready||g.available_seats===0} onClick={()=>join(g.id)}>Katıl</Button>}
    </div>
    {detail===g.id&&<div aria-label={`${g.name} grup analizi`} className="bg-gray-50 p-3 space-y-2"><h4 className="font-medium">Üyeler ve meslek dağılımı</h4>
     {!g.members.length?<p>Aktif üye yok.</p>:<><p>{Object.entries(g.members.reduce<Record<string,number>>((a,m)=>{a[m.profession]=(a[m.profession]??0)+1;return a;},{})).map(([profession,count])=>`${profession}: ${count}`).join(' • ')}</p><ul>{g.members.map(m=><li key={m.id}>{m.name} — {m.profession}{m.company?` — ${m.company}`:''}{m.president?' (Başkan)':''}</li>)}</ul></>}
    </div>}
   </article>)}
   <h2 className="text-lg font-semibold">Başvurularım</h2>{!snapshot.applications.length?<p>Başvurunuz bulunmuyor.</p>:snapshot.applications.map(a=><article key={a.id} className="border rounded p-3"><h3>{a.group_name}</h3><p>{applicationLabel(a.state)}</p>{a.decision_note&&<p>Karar açıklaması: {a.decision_note}</p>}</article>)}
  </>}
 </section>;
}
