import {useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '../stores/authStore';
import {shuffleHistoryApi,executionChanges,type ShuffleHistory,type Execution} from '../api/shuffleHistory';
import {Button} from '../shared/Button';
export function AdminShuffleHistory(){
 const actor=useAuthStore(s=>s.user),token=useAuthStore(s=>s.token),key=actor?.id+'|'+actor?.role+'|'+token,navigate=useNavigate(),epoch=useRef(0);
 const [state,setState]=useState<{key:string;data:ShuffleHistory;detail:Execution|null}|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[visible,setVisible]=useState(100);
 const data=state?.key===key?state:null;
 const current=()=>{const s=useAuthStore.getState();return s.user?.id+'|'+s.user?.role+'|'+s.token===key;};
 async function load(){const n=++epoch.current;setState(null);setError('');setBusy(true);try{if(actor?.role!=='ADMIN')return;const d=await shuffleHistoryApi.read(actor.id);if(current()&&n===epoch.current)setState({key,data:d,detail:null});}catch{if(current()&&n===epoch.current)setError('Dağıtım geçmişi yüklenemedi. Tekrar deneyin.');}finally{if(current()&&n===epoch.current)setBusy(false);}}
 useEffect(()=>{void load();return()=>{epoch.current++;};},[key]);
 async function detail(id:string){if(busy||!data||!current())return;const n=++epoch.current;setBusy(true);setError('');setState({...data,detail:null});setVisible(100);try{const d=await shuffleHistoryApi.detail(actor!.id,id);if(current()&&n===epoch.current)setState({...data,detail:d});}catch{if(current()&&n===epoch.current)setError('Dağıtım ayrıntısı yüklenemedi. Kaydı tekrar seçin.');}finally{if(current()&&n===epoch.current)setBusy(false);}}
 if(actor?.role!=='ADMIN')return <p className="p-8">Bu ekran için yönetici yetkisi gerekir.</p>;
 return <main className="max-w-7xl mx-auto p-8 space-y-5"><div className="flex flex-wrap justify-between gap-3"><h1 className="text-2xl font-bold">Shuffle Kayıt Geçmişi</h1><div className="flex gap-3"><Button onClick={()=>navigate('/admin/shuffle')}>Dağıtıma Dön</Button><Button disabled={busy} onClick={()=>void load()}>Geçmişi Yenile</Button></div></div>
 <p>Bu ekran kayıt altına alınmış dağıtım işlemlerini gösterir. Eski dönemlerin geçmişi oluşturulmaz. Son 100 kayıt listelenir; dönem ve ödeme uygunluğu onayı değildir.</p>
 {busy&&<p role="status">Geçmiş yükleniyor…</p>}{error&&<p role="alert" className="bg-red-50 text-red-800 p-3">{error}</p>}
 {data&&!data.data.executions.length&&<p>Henüz kayıtlı dağıtım işlemi yok.</p>}
 {!!data?.data.executions.length&&<div className="overflow-x-auto"><table className="w-full bg-white text-sm"><thead><tr>{['Kayıt zamanı','Kaydeden','Aktif yerleşim','Grup','İşlem'].map(h=><th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{data.data.executions.map(r=><tr key={r.id} className="border-t"><td className="p-3">{new Date(r.applied_at).toLocaleString('tr-TR')}</td><td className="p-3">{r.actor_name}</td><td className="p-3">{r.member_count}</td><td className="p-3">{r.group_count}</td><td className="p-3"><Button disabled={busy} onClick={()=>void detail(r.id)} aria-label={'Dağıtım ayrıntısı '+r.id}>Ayrıntıyı Göster</Button></td></tr>)}</tbody></table></div>}
 {data?.detail&&<section className="space-y-3"><h2 className="text-xl font-bold">Kaydedilen Önceki ve Sonraki Yerleşim</h2><p>Kayıt: {data.detail.id}. İsimler ve roller işlem anındaki kayıtlardır. Önceki yerleşimler daha sonra değişse de bu kayıt korunur.</p><div className="overflow-x-auto"><table className="w-full bg-white text-sm"><thead><tr>{['Üye','Önceki grup','Sonraki grup','Önceki rol','Sonraki rol'].map(h=><th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{executionChanges(data.detail).slice(0,visible).map(m=><tr key={m.id} className="border-t"><td className="p-3">{m.name}</td><td className="p-3">{m.before}</td><td className="p-3">{m.after}</td><td className="p-3">{m.beforeRole}</td><td className="p-3">{m.afterRole}</td></tr>)}</tbody></table></div>{executionChanges(data.detail).length>visible&&<Button onClick={()=>setVisible(n=>n+100)}>Sonraki 100 Kaydı Göster</Button>}</section>}
 </main>;
}
