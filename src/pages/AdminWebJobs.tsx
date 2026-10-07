import {useEffect,useRef,useState} from 'react';
import {useAuthStore} from '../stores/authStore';
import {webJobsApi,jobLabels,type JobHistory} from '../api/webJobs';
import {Button} from '../shared/Button';
const states:Record<string,string>={RUNNING:'Tamamlanma kaydı yok',SUCCESS:'Tamamlandı',SKIPPED:'Atlandı',FAILED:'Hata',UNKNOWN:'Sonuç belirsiz'};
const sources:Record<string,string>={SCHEDULE:'Zamanlayıcı',EXTERNAL:'Dış zamanlayıcı',ADMIN:'Yönetici'};
const summaries:Record<string,string>={changed:'Güncellenen etkinlik',claimed:'Yeni hatırlatma',notifications:'Bildirim',emailsSent:'Gönderilen e-posta',emailsUnknown:'Belirsiz e-posta',noEmail:'E-posta adresi yok',inserted:'Yeni champion kaydı',existing:'Mevcut kayıt',elapsedMs:'Süre (ms)',periodType:'Dönem',startDate:'Dönem başlangıcı',endDate:'Dönem bitişi'};
export function AdminWebJobs(){
  const actor=useAuthStore(s=>s.user),token=useAuthStore(s=>s.token),key=actor?.id+'|'+actor?.role+'|'+token;
  const epoch=useRef(0),[state,setState]=useState<{key:string;data:JobHistory}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const data=state?.key===key?state.data:null;
  const current=()=>{const s=useAuthStore.getState();return s.user?.id+'|'+s.user?.role+'|'+s.token===key;};
  async function load(){const n=++epoch.current;setBusy(true);setState(null);setError('');try{if(actor?.role!=='ADMIN')return;const d=await webJobsApi.read(actor.id);if(n===epoch.current&&current())setState({key,data:d});}catch{if(n===epoch.current&&current())setError('İş geçmişi yüklenemedi. Tekrar deneyin.');}finally{if(n===epoch.current&&current())setBusy(false);}}
  useEffect(()=>{setMessage('');void load();return()=>{epoch.current++;};},[key]);
  async function run(job:string){
    if(!data?.invocationEnabled||busy||!current())return;
    if(!window.confirm(job==='subscription-reminders'?'Mevcut hatırlatma kurallarıyla bildirim ve e-posta denemesi yapılacak. Çalıştırmak istiyor musunuz?':'Geçmiş etkinliklerin durumları güncellenecek. Çalıştırmak istiyor musunuz?'))return;
    const n=++epoch.current;setBusy(true);setError('');setMessage('');
    try{const r=await webJobsApi.run(job);if(n!==epoch.current||!current())return;await load();if(current()&&epoch.current===n+1)setMessage(r.state==='SKIPPED'?'İş başka bir çağrı nedeniyle atlandı.':'İş tamamlandı. Sonucu çalışma geçmişinden inceleyebilirsiniz.');}
    catch{if(n===epoch.current&&current()){await load();if(current()&&epoch.current===n+1)setError('Sonuç doğrulanamadı. Tekrar çalıştırmadan önce geçmişi ve belirsiz kayıtları kontrol edin.');}}
    finally{if(current()&&[n,n+1].includes(epoch.current))setBusy(false);}
  }
  if(actor?.role!=='ADMIN')return <p className="p-8">Bu ekran için yönetici yetkisi gerekir.</p>;
  return <main className="max-w-7xl mx-auto p-8 space-y-5"><div className="flex justify-between gap-3"><h1 className="text-2xl font-bold">Web İşlemleri ve Çalışma Geçmişi</h1><Button disabled={busy} onClick={()=>void load()}>Geçmişi Yenile</Button></div>
    {busy&&<p role="status">İşlem sürüyor…</p>}{error&&<p role="alert" className="p-3 bg-red-50 text-red-800">{error}</p>}{message&&<p role="status" className="p-3 bg-green-50 text-green-800">{message}</p>}
    {data&&<><section className="rounded border bg-white p-5 space-y-3"><p>Manuel çağrı: {data.invocationEnabled?'Etkin':'Kapalı'} · Dış çağrı anahtarı: {data.externalConfigured?'Hazır':'Hazır değil'}</p><p className="text-sm text-gray-600">Anahtarın hazır olması dış zamanlayıcının kurulduğunu veya çalıştığını kanıtlamaz. Champion işleri mevcut zamanlayıcıdan izlenir; bu ekranda yeni dönem başlatılmaz.</p><div className="flex gap-3 flex-wrap">{data.manualJobs.map(job=><Button key={job} disabled={busy||!data.invocationEnabled} onClick={()=>void run(job)}>{jobLabels[job]} Çalıştır</Button>)}</div></section>
      <p className="text-sm">Son 100 çalışma gösterilir. Tamamlanma kaydı olmayan bir iş hâlâ çalışıyor olabilir veya kesilmiş olabilir; otomatik tekrar yapılmaz.</p>
      {!data.runs.length?<p>Henüz çalışma kaydı yok.</p>:<div className="overflow-x-auto rounded border bg-white"><table className="w-full text-sm"><thead><tr className="bg-slate-100">{['İş','Kaynak','Durum','Başlangıç','Bitiş','Özet'].map(h=><th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{data.runs.map(r=><tr key={r.id} className="border-t"><td className="p-3">{jobLabels[r.job]}</td><td className="p-3">{sources[r.source]}</td><td className="p-3">{states[r.state]}{r.error_code&&<p>{r.error_code}</p>}</td><td className="p-3">{new Date(r.started_at).toLocaleString('tr-TR')}</td><td className="p-3">{r.completed_at?new Date(r.completed_at).toLocaleString('tr-TR'):'—'}</td><td className="p-3 break-words">{Object.entries(r.summary).map(([k,v])=><p key={k}>{summaries[k]||k}: {v}</p>)}</td></tr>)}</tbody></table></div>}
    </>}
  </main>;
}
