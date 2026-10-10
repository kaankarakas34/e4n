import {useEffect,useRef,useState} from 'react';
import {useAuthStore} from '../stores/authStore';
import {groupApplicationsApi,applicationError,applicationLabel,type Application} from '../api/groupApplications';
import {Button} from '../shared/Button';
export function GroupApplicationQueue({groupId,onChanged}:{groupId:string;onChanged:()=>void}){
 const {user,token}=useAuthStore();const context=`${user?.id}:${token}:${groupId}`;const current=useRef(context);current.current=context;
 const [data,setData]=useState<{context:string;rows:Application[]}|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[busy,setBusy]=useState(false),[notes,setNotes]=useState<Record<string,string>>({});const lock=useRef(false);
 useEffect(()=>{let cancelled=false;setData(null);setError('');setNotes({});if(user?.id)groupApplicationsApi.queue(user.id,groupId).then(rows=>{if(!cancelled)setData({context,rows});}).catch(e=>{if(!cancelled)setError(applicationError(e));});return()=>{cancelled=true;};},[context,retry]);
 async function act(a:Application,action:string,decision?:string){if(!user?.id||lock.current)return;lock.current=true;setBusy(true);setError('');try{await groupApplicationsApi.act(user.id,a.id,action,action==='retry-mail'?{}:{note:notes[a.id]??'',...(decision?{decision}:{})});if(current.current===context){setRetry(n=>n+1);onChanged();}}catch(e){if(current.current===context)setError(applicationError(e));}finally{lock.current=false;setBusy(false);}}
 const rows=data?.context===context?data.rows:null;
 return <section aria-label="Gelen grup başvuruları" className="border bg-white rounded p-5 space-y-3"><div className="flex justify-between"><h2 className="text-lg font-semibold">Gelen grup başvuruları ve görüşme görevleri</h2><Button variant="outline" disabled={busy} onClick={()=>setRetry(n=>n+1)}>Başvuruları yenile</Button></div>
  {error&&<p role="alert" className="text-red-700">{error}</p>}{!rows&&!error&&<p role="status">Başvurular yükleniyor…</p>}{rows?.length===0&&<p>Bekleyen veya sonuçlanmış grup başvurusu yok.</p>}
  {rows?.map(a=><article key={a.id} className="border rounded p-4 space-y-2"><h3 className="font-semibold">{a.name}</h3><p>{a.company??'Şirket bilgisi yok'} • {a.profession}</p><p>Görev: Başvuran kişiyi telefonla ara. {a.phone?<a className="underline" href={`tel:${a.phone}`}>{a.phone}</a>:'Telefon bilgisi bulunmuyor.'}</p>
   {a.sla_breached&&<div className="bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5"><span>⚠️</span> 7 Günlük Görüşme SLA Süresi Aşıldı ({a.days_waiting} gündür bekliyor)</div>}
   {a.removal_history&&a.removal_history.length>0&&<div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-900 space-y-1"><p className="font-semibold">Önceki Gruptan Çıkarılma Kayıtları ({a.removal_history.length}):</p>{a.removal_history.map((rh,idx)=><p key={idx}>• {rh.group_name||'Önceki grup'} ({new Date(rh.created_at).toLocaleDateString('tr-TR')}): <span className="font-medium">{rh.category_label}</span>{rh.note?` — Açıklama: ${rh.note}`:''}</p>)}</div>}
   <p>{applicationLabel(a.state)}</p><p>E-posta: {({SENT:'SMTP sunucusuna teslim edildi',FAILED:'Gönderilemedi, yeniden deneyebilirsiniz',QUEUED:'Gönderim bekliyor',SENDING:'Gönderiliyor',UNKNOWN:'Teslim belirsiz; tekrar gönderilmedi'} as Record<string,string>)[a.mail_state??'QUEUED']}</p>
   {['QUEUED','FAILED'].includes(a.mail_state??'')&&<Button disabled={busy} variant="outline" onClick={()=>act(a,'retry-mail')}>E-postayı yeniden dene</Button>}
   {a.interview_at&&<p>Görüşme: {new Date(a.interview_at).toLocaleString('tr-TR')} — {a.interview_note}</p>}
   {['AWAITING_CALL','INTERVIEWED'].includes(a.state)&&<><label className="block">Görüşme / karar açıklaması<textarea aria-label={`${a.name} görüşme veya karar açıklaması`} maxLength={2000} className="block w-full border rounded p-2" value={notes[a.id]??''} onChange={e=>setNotes(n=>({...n,[a.id]:e.target.value}))}/></label><div className="flex gap-2"><Button disabled={busy||!notes[a.id]?.trim()} onClick={()=>act(a,'interview')}>Görüşmeyi kaydet</Button><Button disabled={busy||a.state!=='INTERVIEWED'||!notes[a.id]?.trim()} onClick={()=>act(a,'decision','ACCEPTED')}>Kabul et</Button><Button variant="outline" disabled={busy||a.state!=='INTERVIEWED'||!notes[a.id]?.trim()} onClick={()=>act(a,'decision','REJECTED')}>Reddet</Button></div></>}
   {a.decision_note&&<p>Karar: {a.decision_note}</p>}
  </article>)}
 </section>;
}
