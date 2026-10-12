import {useEffect,useRef,useState} from 'react';
import {useAuthStore} from '../stores/authStore';
import {adminVisitorQueueApi,queueStatus} from '../api/adminVisitorQueue';
import type {QueueVisitor} from '../api/adminVisitorQueue';
import {Button} from '../shared/Button';
import {Card,CardContent} from '../shared/Card';
import {Link} from 'react-router-dom';
const labels:Record<string,string>={title:'Unvan',web_linkedin:'Web / LinkedIn',activity_area:'Faaliyet alanı',duration:'Deneyim süresi',target_customer:'Hedef müşteri',why_join:'Katılım amacı',value_add:'Sağlayacağı değer',previous_groups:'Önceki topluluklar',education_level:'Eğitim durumu',work_status:'Çalışma durumu',job_title:'Görevi',company_size:'Şirket büyüklüğü',main_services:'Hizmetler',sector:'Sektör',experience_years:'Deneyim',differentiating_factor:'Güçlü yön',value_provided:'Sağlanan değer',ideal_referral:'İdeal yönlendirme',success_story:'Başarı örneği',network_size:'İş çevresi',network_sectors:'Bağlantı sektörleri',network_opportunities:'Bağlantı fırsatları',referral_example:'Yönlendirme örneği',network_sharing_approach:'Paylaşım yaklaşımı',primary_expectation:'Beklentiler',target_connection_types:'Hedef bağlantılar',ideal_referral_definition:'İdeal yönlendirme tanımı',time_commitment:'Zaman taahhüdü',core_value:'Temel değer',discovery_source:'Nereden duydu?',referral_name:'Referans'};
const when=(v:string|null)=>v?new Date(v).toLocaleString('tr-TR'):'Tarih bilinmiyor';
export function AdminVisitorQueue({onOpenMemberships,memberRequestsOnly=false}:{onOpenMemberships:()=>void;memberRequestsOnly?:boolean}) {
  const {user,token}=useAuthStore();
  const context=`${user?.id}:${user?.role}:${token}`;const current=useRef(context);current.current=context;
  const [rows,setRows]=useState<QueueVisitor[]>([]),[loadedFor,setLoadedFor]=useState(''),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const [category,setCategory]=useState<'visitors'|'registrations'>('visitors'),[event,setEvent]=useState(''),[selected,setSelected]=useState<QueueVisitor|null>(null);
  const [group,setGroup]=useState(''),[status,setStatus]=useState('');
  const [busy,setBusy]=useState<string|null>(null),[uncertain,setUncertain]=useState<string|null>(null),[message,setMessage]=useState('');
  const lock=useRef(false);
  useEffect(()=>{
    let cancelled=false;setLoadedFor('');setError('');setRows([]);setSelected(null);setEvent('');setBusy(null);setUncertain(null);setMessage('');lock.current=false;
    if(user?.role==='ADMIN'&&token)adminVisitorQueueApi.read(user.id,memberRequestsOnly).then(result=>{if(!cancelled){setRows(result);setLoadedFor(context);}}).catch(()=>{if(!cancelled)setError('Başvurular yüklenemedi. Tekrar deneyin.');});
    return()=>{cancelled=true;};
  },[context,user?.id,user?.role,token,refresh,memberRequestsOnly]);
  const apply=(row:QueueVisitor)=>{setRows(old=>old.map(v=>v.id===row.id?row:v));setSelected(old=>old?.id===row.id?row:old);};
  const check=async(id:string)=>{
    const result=await adminVisitorQueueApi.read(user!.id,memberRequestsOnly);if(current.current!==context)return;
    setRows(result);const row=result.find(v=>v.id===id);setSelected(old=>old?.id===id?row??null:old);
    setUncertain(null);setMessage(row?.status==='CONTACTED'?'İletişim durumu kayıttan doğrulandı.':'Kayıt kontrol edildi. İşaretleme sonucu doğrulanmadı; güncel durumu inceleyin.');
  };
  const contact=async(id:string,readOnly=false)=>{
    if(lock.current)return;lock.current=true;setBusy(id);setMessage('');
    try {
      if(readOnly)await check(id);
      else {
        try {const row=await adminVisitorQueueApi.contacted(user!.id,id);if(current.current!==context)return;apply(row);setMessage('İletişime geçildi durumu kaydedildi.');}
        catch {if(current.current!==context)return;setUncertain(id);await check(id);}
      }
    }catch {if(current.current===context){setUncertain(id);setMessage('Sonuç doğrulanamadı. Durumu kontrol ederek devam edin.');}}
    finally {if(current.current===context){setBusy(null);lock.current=false;}}
  };
  if(user?.role!=='ADMIN')return <div className="p-8">Erişim Kısıtlı</div>;
  if(!token)return <div className="p-8" role="alert">Oturum bulunamadı. Yeniden giriş yapın.</div>;
  const memberRows=rows.filter(v=>v.source==='free_member_visitor');
  const visible=memberRequestsOnly?memberRows.filter(v=>(!group||v.form_data.group_id===group)&&(!status||v.status===status)):rows.filter(v=>v.source!=='free_member_visitor'&&v.category===category&&(!event||v.event_id===event));
  const groups=new Map(memberRows.filter(v=>typeof v.form_data.group_id==='string').map(v=>[v.form_data.group_id as string,typeof v.form_data.group_name==='string'?v.form_data.group_name:'Grup adı belirtilmemiş']));
  const events=new Map(rows.filter(v=>v.category===category&&v.event_id).map(v=>[v.event_id!,{title:v.event_title,date:v.event_start_at}]));
  return <main className="max-w-7xl mx-auto p-6 space-y-5">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">{memberRequestsOnly?`Üyelerin Ziyaret Talepleri (${memberRows.length})`:'Ziyaretçi Başvuruları'}</h2><div className="flex gap-2">
      {!memberRequestsOnly&&<Button variant="outline" onClick={onOpenMemberships}>Üyelik ve grup başvuruları</Button>}
      <Button onClick={()=>setRefresh(v=>v+1)} disabled={!!busy}>Başvuruları yenile</Button>
    </div></div>
    <p className="text-sm text-gray-600">{memberRequestsOnly?'Hesabını oluşturan üyelerin panelden seçtikleri gruplara gönderdiği ücretsiz ziyaret talepleri. Üye, grup ve talep notunu inceleyip iletişim durumunu takip edebilirsiniz.':'Form kayıtları ve ziyaretçi katılım kayıtları ayrı gösterilir. İletişim işaretlemesi üyelik veya grup kabulü anlamına gelmez.'}</p>
    {error?<div role="alert"><p>{error}</p><Button onClick={()=>setRefresh(v=>v+1)}>Tekrar dene</Button></div>:loadedFor!==context?<p role="status">Yükleniyor...</p>:<>
      {memberRequestsOnly?<div className="flex flex-wrap gap-4">
        <label className="text-sm">İstenen grup<select aria-label="İstenen grup" className="ml-2 border rounded p-2" value={group} onChange={e=>{setGroup(e.target.value);setSelected(null);}}><option value="">Tüm gruplar</option>{[...groups].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
        <label className="text-sm">Talep durumu<select aria-label="Talep durumu" className="ml-2 border rounded p-2" value={status} onChange={e=>{setStatus(e.target.value);setSelected(null);}}><option value="">Tüm durumlar</option>{['PENDING','CONTACTED','CONVERTED','REJECTED'].map(s=><option key={s} value={s}>{s==='CONVERTED'?'Eski akışta işlenen':queueStatus(s)}</option>)}</select></label>
      </div>:<div className="flex flex-wrap gap-3">{(['visitors','registrations'] as const).map(c=><Button key={c} variant={category===c?'primary':'outline'} onClick={()=>{setCategory(c);setEvent('');setSelected(null);}}>
        {c==='visitors'?'Ziyaretçi Formları':'Ziyaretçi Katılımları'} ({rows.filter(v=>v.category===c).length})</Button>)}
        <label>Etkinlik filtresi <select aria-label="Etkinlik filtresi" value={event} onChange={e=>{setEvent(e.target.value);setSelected(null);}} className="border rounded p-2"><option value="">Tüm etkinlikler</option>
          {[...events].map(([id,e])=><option key={id} value={id}>{e.title??'Etkinlik adı bilinmiyor'} — {when(e.date)}</option>)}</select></label>
      </div>}
      {message&&<p role="status">{message}</p>}
      {uncertain&&<Button variant="outline" disabled={!!busy} onClick={()=>contact(uncertain,true)}>İşlem durumunu kontrol et</Button>}
      <Card><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b">{['Ad / İletişim','Meslek / Şirket',...(memberRequestsOnly?['İstenen grup / Not']:[]),'Kayıt tarihi','Durum','İşlemler'].map(t=><th key={t} className="p-3">{t}</th>)}</tr></thead>
        <tbody>{visible.map(v=><tr key={v.id} className="border-b"><td className="p-3"><strong>{v.name}</strong><p>{v.email??'E-posta belirtilmemiş'}</p><p>{v.phone??'Telefon belirtilmemiş'}</p>{memberRequestsOnly&&typeof v.form_data.user_id==='string'&&<Link className="text-red-600 underline" to={`/profile/${v.form_data.user_id}`}>Üye profilini aç</Link>}</td><td className="p-3">{v.profession??'Belirtilmemiş'}<p>{v.company??'Şirket belirtilmemiş'}</p></td>{memberRequestsOnly&&<td className="p-3 min-w-48"><strong>{v.form_data.group_name||'Grup adı belirtilmemiş'}</strong><p className="whitespace-pre-wrap break-words">{v.form_data.notes||'Not eklenmemiş'}</p></td>}<td className="p-3">{when(v.created_at)}</td><td className="p-3">{memberRequestsOnly&&v.status==='CONVERTED'?'Eski akışta işlenen':queueStatus(v.status)}</td><td className="p-3"><div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={()=>setSelected(v)}>İncele</Button>
          {v.status==='PENDING'&&<Button disabled={!!busy||!!uncertain} onClick={()=>contact(v.id)}>İletişime geçildi olarak işaretle</Button>}
        </div></td></tr>)}</tbody></table>{visible.length===0&&<p className="p-8 text-center">Bu filtrede kayıt bulunamadı.</p>}</div></CardContent></Card>
      {selected&&<section aria-label="Başvuru detayı" className="border rounded p-5 space-y-3"><div className="flex justify-between"><h2 className="text-xl font-bold">{selected.name} — Başvuru detayı</h2><Button variant="outline" onClick={()=>setSelected(null)}>Detayı kapat</Button></div>
        <p>{queueStatus(selected.status)} · {when(selected.created_at)}</p>{memberRequestsOnly?<><p>İstenen grup: {selected.form_data.group_name||'Belirtilmemiş'}</p><p className="whitespace-pre-wrap">Talep notu: {selected.form_data.notes||'Not eklenmemiş'}</p></>:<><p>Davet eden: {selected.inviter_name??'Belirtilmemiş'}</p><p>Etkinlik: {selected.event_title??'Belirtilmemiş'}</p></>}
        {!memberRequestsOnly&&<dl className="grid md:grid-cols-2 gap-4">{Object.entries({...selected.form_data,...Object.fromEntries(['title','web_linkedin','activity_area','duration','target_customer','why_join','value_add','previous_groups'].filter(k=>selected[k as keyof QueueVisitor]).map(k=>[k,selected[k as keyof QueueVisitor]]))}).map(([key,value])=><div key={key}><dt className="text-gray-500">{labels[key]??key}</dt><dd className="whitespace-pre-wrap break-words">{Array.isArray(value)?value.join(', '):String(value)}</dd></div>)}</dl>}
      </section>}
    </>}
  </main>;
}
