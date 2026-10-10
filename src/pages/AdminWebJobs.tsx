import {useEffect,useRef,useState} from 'react';
import {useAuthStore} from '../stores/authStore';
import {webJobsApi,jobLabels,type JobHistory} from '../api/webJobs';
import {Button} from '../shared/Button';

const states:Record<string,string>={
  RUNNING:'Tamamlanma kaydı yok (Çalışıyor)',
  SUCCESS:'Tamamlandı',
  SKIPPED:'Atlandı',
  FAILED:'Hata',
  UNKNOWN:'Sonuç belirsiz'
};

const sources:Record<string,string>={
  SCHEDULE:'Zamanlayıcı',
  EXTERNAL:'Dış zamanlayıcı',
  ADMIN:'Yönetici'
};

const summaries:Record<string,string>={
  changed:'Güncellenen kayıt',
  claimed:'Yeni hatırlatma',
  notifications:'Bildirim',
  emailsSent:'Gönderilen e-posta',
  emailsUnknown:'Belirsiz e-posta',
  noEmail:'E-posta adresi yok',
  inserted:'Yeni champion kaydı',
  existing:'Mevcut kayıt',
  elapsedMs:'Süre (ms)',
  periodType:'Dönem',
  periodKey:'Dönem kodu',
  memberCount:'Üye sayısı',
  total:'Toplam işlenen',
  processed:'İşlenen e-posta',
  removedCount:'Çıkarılan üye',
  skipped:'Atlanan üye',
  startDate:'Dönem başlangıcı',
  endDate:'Dönem bitişi'
};

const jobConfirmations:Record<string,string>={
  'event-completion':'Geçmiş etkinliklerin durumları COMPLETED olarak güncellenecek. Çalıştırmak istiyor musunuz?',
  'subscription-reminders':'Mevcut hatırlatma kurallarıyla (D07) bildirim, e-posta ve 5. gün kısıtlaması yürütülecek. Çalıştırmak istiyor musunuz?',
  'application-mails':'Kuyrukta bekleyen başvuru e-postaları (en fazla 20 adet) taranıp gönderilecek. Çalıştırmak istiyor musunuz?',
  'monthly-score-finalization':'Önceki ayın puanları kesinleştirilecek ve dondurulacak. Tekrar çalıştırmada mükerrer kayıt üretilmez. Çalıştırmak istiyor musunuz?',
  'low-score-removals':'Kesinleşmiş dönemin düşük puanlı üyeleri değerlendirilip gruptan çıkarılacak. Çalıştırmak istiyor musunuz?',
};

export function AdminWebJobs(){
  const actor=useAuthStore(s=>s.user),token=useAuthStore(s=>s.token),key=actor?.id+'|'+actor?.role+'|'+token;
  const epoch=useRef(0),[state,setState]=useState<{key:string;data:JobHistory}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const data=state?.key===key?state.data:null;
  const current=()=>{const s=useAuthStore.getState();return s.user?.id+'|'+s.user?.role+'|'+s.token===key;};

  async function load(){
    const n=++epoch.current;setBusy(true);setState(null);setError('');
    try{
      if(actor?.role!=='ADMIN')return;
      const d=await webJobsApi.read(actor.id);
      if(n===epoch.current&&current())setState({key,data:d});
    }catch{
      if(n===epoch.current&&current())setError('İş geçmişi yüklenemedi. Tekrar deneyin.');
    }finally{
      if(n===epoch.current&&current())setBusy(false);
    }
  }

  useEffect(()=>{setMessage('');void load();return()=>{epoch.current++;};},[key]);

  async function run(job:string){
    if(!data?.invocationEnabled||busy||!current())return;
    const prompt=jobConfirmations[job]||`${jobLabels[job]||job} işi çalıştırılacak. Onaylıyor musunuz?`;
    if(!window.confirm(prompt))return;
    const n=++epoch.current;setBusy(true);setError('');setMessage('');
    try{
      const r=await webJobsApi.run(job);
      if(n!==epoch.current||!current())return;
      await load();
      if(current()&&epoch.current===n+1)setMessage(r.state==='SKIPPED'?'İş başka bir çağrı veya kilit nedeniyle atlandı.':'İş başarıyla tamamlandı. Sonucu çalışma geçmişinden inceleyebilirsiniz.');
    }catch{
      if(n===epoch.current&&current()){
        await load();
        if(current()&&epoch.current===n+1)setError('Sonuç doğrulanamadı. Tekrar çalıştırmadan önce geçmişi ve belirsiz kayıtları kontrol edin.');
      }
    }finally{
      if(current()&&[n,n+1].includes(epoch.current))setBusy(false);
    }
  }

  async function handleRecoverStale(){
    if(busy||!current())return;
    if(!window.confirm('15 dakikadan uzun süredir RUNNING durumunda kalmış takılı işler UNKNOWN ve STALE_TIMEOUT olarak işaretlenecektir. Onaylıyor musunuz?'))return;
    const n=++epoch.current;setBusy(true);setError('');setMessage('');
    try{
      const res=await webJobsApi.recoverStale();
      if(n!==epoch.current||!current())return;
      await load();
      if(current()&&epoch.current===n+1)setMessage(`${res.recoveredCount} adet takılı iş başarıyla temizlendi.`);
    }catch{
      if(n===epoch.current&&current())setError('Takılı işler temizlenemedi.');
    }finally{
      if(current()&&[n,n+1].includes(epoch.current))setBusy(false);
    }
  }

  if(actor?.role!=='ADMIN')return <p className="p-8">Bu ekran için yönetici yetkisi gerekir.</p>;

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-5">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Web İşlemleri ve Çalışma Geçmişi</h1>
          <p className="text-sm text-gray-500">Zamanlanmış görevler, dış çağrılar ve operasyonel sağlık izleme</p>
        </div>
        <div className="flex items-center gap-3">
          {data?.health&&(
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              data.health.status==='HEALTHY'?'bg-emerald-100 text-emerald-800':
              data.health.status==='DEGRADED'?'bg-amber-100 text-amber-800':'bg-rose-100 text-rose-800'
            }`}>
              Durum: {data.health.status==='HEALTHY'?'Sağlıklı':data.health.status==='DEGRADED'?'Uyarı':'Kritik'}
            </span>
          )}
          <Button disabled={busy} onClick={()=>void load()}>Geçmişi Yenile</Button>
        </div>
      </div>

      {busy&&<p role="status" className="text-sm text-blue-600">İşlem sürüyor…</p>}
      {error&&<p role="alert" className="p-3 rounded bg-red-50 text-red-800 border border-red-200">{error}</p>}
      {message&&<p role="status" className="p-3 rounded bg-green-50 text-green-800 border border-green-200">{message}</p>}

      {data?.health&&data.health.alerts.length>0&&(
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-amber-900">Operasyonel Uyarılar ve Alarmlar</h2>
            {data.health.staleRunningCount>0&&(
              <Button disabled={busy} onClick={()=>void handleRecoverStale()} className="text-xs bg-rose-600 hover:bg-rose-700 text-white">
                Takılı İşleri Temizle ({data.health.staleRunningCount})
              </Button>
            )}
          </div>
          <ul className="text-xs text-amber-800 space-y-1">
            {data.health.alerts.map((a,i)=>(
              <li key={i} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${a.level==='CRITICAL'?'bg-rose-500':'bg-amber-500'}`} />
                <span>{a.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data&&(
        <>
          <section className="rounded-lg border bg-white p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center flex-wrap gap-2 text-sm border-b pb-3">
              <p>
                <span className="font-medium">Manuel Çağrı:</span> {data.invocationEnabled?'Etkin':'Kapalı'} ·{' '}
                <span className="font-medium">Dış Zamanlayıcı (CRON_SECRET):</span> {data.externalConfigured?'Hazır (Vercel Cron Uyumlu)':'Yapılandırılmamış'}
              </p>
              <p className="text-xs text-gray-500">
                Advisory lock ve atomik transaction güvencelidir.
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Manuel Çalıştırılabilir İşler:</p>
              <div className="flex gap-2 flex-wrap">
                {data.manualJobs.map(job=>(
                  <Button
                    key={job}
                    disabled={busy||!data.invocationEnabled}
                    onClick={()=>void run(job)}
                    className="text-xs"
                  >
                    {jobLabels[job]||job} Çalıştır
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <p className="text-xs text-gray-500">
            Son 100 çalışma gösterilir. Advisory lock ile aynı anda iki süreç çakışmaz; atlanan çağrılar SKIPPED kaydedilir.
          </p>

          {!data.runs.length?(
            <p className="p-8 text-center text-gray-500 border rounded bg-white">Henüz çalışma kaydı yok.</p>
          ):(
            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b text-xs text-slate-700">
                    {['İş','Kaynak','Durum','Başlangıç','Bitiş','Özet'].map(h=>(
                      <th key={h} className="p-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.runs.map(r=>(
                    <tr key={r.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{jobLabels[r.job]||r.job}</td>
                      <td className="p-3 text-slate-600">{sources[r.source]||r.source}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          r.state==='SUCCESS'?'bg-emerald-100 text-emerald-800':
                          r.state==='SKIPPED'?'bg-slate-100 text-slate-700':
                          r.state==='RUNNING'?'bg-blue-100 text-blue-800':
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {states[r.state]||r.state}
                        </span>
                        {r.error_code&&<p className="text-xs text-rose-600 font-mono mt-0.5">{r.error_code}</p>}
                      </td>
                      <td className="p-3 text-slate-600 text-xs">{new Date(r.started_at).toLocaleString('tr-TR')}</td>
                      <td className="p-3 text-slate-600 text-xs">{r.completed_at?new Date(r.completed_at).toLocaleString('tr-TR'):'—'}</td>
                      <td className="p-3 text-xs text-slate-700 max-w-xs break-words">
                        {Object.entries(r.summary).map(([k,v])=>(
                          <p key={k}><span className="text-slate-500">{summaries[k]||k}:</span> <span className="font-mono">{v}</span></p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
