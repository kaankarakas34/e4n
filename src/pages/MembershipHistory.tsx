import {useEffect,useRef,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {useAuthStore} from '../stores/authStore';
import {membershipHistoryApi,type HistoryPage,type MembershipState} from '../api/membershipHistory';
import {Button} from '../shared/Button';
const date=(v:string|null)=>v?new Date(v).toLocaleString('tr-TR'):'Kayıt yok';
const operations={BASELINE:'Başlangıçta gözlenen kayıt',INSERT:'Bağlantı eklendi',UPDATE:'Bağlantı değişti',DELETE:'Bağlantı silindi'};
function State({label,state}:{label:string;state:MembershipState|null}){return <div className="border rounded p-3 space-y-1"><h3 className="font-semibold">{label}</h3>{state?<><p>{state.group_name??state.group_id}</p><p>Durum: {state.status??'Kayıt yok'} · Bağlantıdaki rol: {state.role??'Kayıt yok'}</p><p>Bağlantı tarihi: {date(state.joined_at)}</p></>:<p>Bağlantı kaydı yok.</p>}</div>;}
export function MembershipHistory({admin=false}:{admin?:boolean}){
 const actor=useAuthStore(s=>s.user),token=useAuthStore(s=>s.token),{id}=useParams(),target=admin?id:actor?.id,navigate=useNavigate(),epoch=useRef(0),key=actor?.id+'|'+actor?.role+'|'+token+'|'+target+'|'+admin;
 const [state,setState]=useState<{key:string;page:HistoryPage}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const data=state?.key===key?state.page:null;
 const current=()=>{const s=useAuthStore.getState();return s.user?.id+'|'+s.user?.role+'|'+s.token+'|'+target+'|'+admin===key;};
 async function load(more=false){const n=++epoch.current;setBusy(true);setError('');if(!more)setState(null);try{if(!actor||!target||admin&&actor.role!=='ADMIN')return;const page=await membershipHistoryApi.read(actor.id,target,admin,more?data?.next:null);if(n!==epoch.current||!current())return;if(more&&data){const ids=new Set(data.events.map(e=>e.id));if(page.events.some(e=>ids.has(e.id)))throw Error('Overlapping history page');page.events=[...data.events,...page.events];}setState({key,page});}catch{if(n===epoch.current&&current())setError('Grup üyelik geçmişi yüklenemedi. Tekrar deneyin.');}finally{if(n===epoch.current&&current())setBusy(false);}}
 useEffect(()=>{void load();return()=>{epoch.current++;};},[key]);
 if(admin&&actor?.role!=='ADMIN')return <p className="p-8">Bu ekran için yönetici yetkisi gerekir.</p>;
 return <main className="max-w-5xl mx-auto p-8 space-y-5"><div className="flex flex-wrap justify-between gap-3"><h1 className="text-2xl font-bold">{admin?'Grup Üyelik Geçmişi':'Grup Üyelik Geçmişim'}</h1><div className="flex gap-3"><Button onClick={()=>navigate(admin?'/admin/membership-records':'/group-management')}>Geri Dön</Button><Button disabled={busy} onClick={()=>void load()}>Geçmişi Yenile</Button></div></div>
 <p>Başlangıç kaydı o anda var olan bağlantıyı gösterir. Önceden silinmiş bağlantıları veya çıkarılma nedenlerini yeniden oluşturmaz. Sonraki değişikliklerde önceki ve sonraki kayıt korunur; işlemi yapan kişi bu geçmişte kaydedilmez.</p>
 {busy&&<p role="status">Geçmiş yükleniyor…</p>}{error&&<p role="alert" className="bg-red-50 text-red-800 p-3">{error}</p>}
 {data&&<><p>Gösterilen: {data.events.length} / Toplam: {data.total} · Veri zamanı: {date(data.asOf)}</p>{!data.events.length&&<p>Bu hesap için grup üyelik geçmişi yok.</p>}<div className="space-y-4">{data.events.map(e=><article key={e.id} className="bg-white border rounded p-4 space-y-3"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{operations[e.operation]}</h2><span>{date(e.recorded_at)}</span></div>{admin&&<p>{e.user_name??e.user_id}</p>}<div className="grid sm:grid-cols-2 gap-3"><State label="Önceki kayıt" state={e.before_state}/><State label="Sonraki kayıt" state={e.after_state}/></div></article>)}</div>{data.next&&<Button disabled={busy} onClick={()=>void load(true)}>Daha Eski Kayıtları Yükle</Button>}</>}
 </main>;
}
