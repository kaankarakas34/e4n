import React,{useEffect,useRef,useState} from 'react';
import {useAuthStore} from '../../stores/authStore';
import {eventAttendanceApi,type AttendanceCommand,type AttendanceSnapshot} from '../../api/eventAttendance';
import {Button} from '../../shared/Button';
import {Modal} from '../../shared/Modal';

const label=(status:string,verified=false)=>status==='REGISTERED'?'Kayıtlı — yoklama yapılmadı':status==='PRESENT'?(verified?'Katıldı — yönetici kaydı':'Eski PRESENT kaydı'):status==='ABSENT'?(verified?'Katılmadı — yönetici kaydı':'Eski ABSENT kaydı'):status;
export function AdminAttendancePanel({eventId,onClose,onChanged}:{eventId:string;onClose:()=>void;onChanged:()=>void}){
  const {user,token}=useAuthStore();
  const owner=user?.id??'';
  const scope=`${owner}:${user?.role}:${token}:${eventId}`;
  const current=useRef(scope);current.current=scope;
  const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const [snapshot,setSnapshot]=useState<AttendanceSnapshot|null>(null);
  const [loadedFor,setLoadedFor]=useState('');
  const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const writeBusy=useRef(false);
  const [selected,setSelected]=useState('');const [target,setTarget]=useState<AttendanceCommand['status']>('PRESENT');const [reason,setReason]=useState('');
  const [retry,setRetry]=useState(0);
  const pending=useRef<{scope:string;user:string;command:AttendanceCommand}|null>(null);
  const validScope=()=>alive.current&&current.current===scope;
  useEffect(()=>{
    let cancelled=false;setSnapshot(null);setLoadedFor('');setError('');setNotice('');setSelected('');setReason('');setLoading(true);setBusy(false);pending.current=null;
    if(user?.role!=='ADMIN'){setLoading(false);return;}
    eventAttendanceApi.read(owner,eventId).then(d=>{if(!cancelled){setSnapshot(d);setLoadedFor(scope);}}).catch(()=>{if(!cancelled)setError('Yoklama yüklenemedi.');}).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[scope,retry]);
  const recover=async()=>{
    if(writeBusy.current||!validScope())return;
    writeBusy.current=true;setBusy(true);setLoading(true);
    try{const d=await eventAttendanceApi.read(owner,eventId);if(!validScope())return;setSnapshot(d);setLoadedFor(scope);setError('');
      const command=pending.current;
      setNotice(command&&d.history.some(h=>h.id===command.command.requestId)?'Yoklama kaydı doğrulandı.':'Güncel kayıtlar yüklendi. Gerekirse bilgileri kontrol edip yeniden kaydedin.');pending.current=null;onChanged();
    }catch{if(validScope())setError('İşlem sonucu okunamadı. Yeniden kaydetmeden önce kayıtları kontrol edin.');}
    finally{writeBusy.current=false;if(validScope()){setBusy(false);setLoading(false);}}
  };
  const save=async()=>{
    if(writeBusy.current||loading||loadedFor!==scope||pending.current||!snapshot||!reason.trim())return;
    const row=snapshot.participants.find(p=>p.user_id===selected);if(!row)return;
    const command:AttendanceCommand={requestId:crypto.randomUUID(),status:target,expectedStatus:row.status,expectedVersion:row.revision,reason:reason.trim()};
    writeBusy.current=true;setBusy(true);setNotice('');setError('');pending.current={scope,user:selected,command};
    try{
      await eventAttendanceApi.save(owner,eventId,selected,command);if(!validScope())return;
      const d=await eventAttendanceApi.read(owner,eventId);if(!validScope())return;
      setSnapshot(d);setLoadedFor(scope);setNotice('Yoklama kaydedildi ve kayıtlar yeniden okundu.');setReason('');pending.current=null;onChanged();
    }catch{
      if(!validScope())return;
      try{const d=await eventAttendanceApi.read(owner,eventId);if(!validScope())return;setSnapshot(d);setLoadedFor(scope);
        if(d.history.some(h=>h.id===command.requestId)){setNotice('Yoklama kaydı doğrulandı.');setReason('');onChanged();}
        else setError('Yoklama kaydedilemedi veya kayıt değişti. Güncel bilgileri kontrol edin.');pending.current=null;
      }catch{if(validScope())setError('İşlem sonucu belirsiz. Yeniden yazmadan önce kaydı kontrol edin.');}
    }finally{writeBusy.current=false;if(validScope())setBusy(false);}
  };
  const data=loadedFor===scope?snapshot:null;
  const writable=!!data&&['PUBLISHED','COMPLETED'].includes(data.event.status)&&Date.parse(data.event.start_at)<=Date.now();
  return <Modal open={user?.role==='ADMIN'} onClose={onClose} title="Etkinlik yoklaması ve düzeltme geçmişi">
    <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-1">
      <p className="text-sm text-gray-600">Kayıt, bilet ve ödeme yoklama kanıtı değildir. Yönetici gözlemini açıklamasıyla kaydedin. Yeni puan veya hak kuralı uygulanmaz.</p>
      {notice&&<p role="status">{notice}</p>}
      {error&&<div role="alert"><p>{error}</p><Button disabled={busy} onClick={pending.current?recover:()=>setRetry(n=>n+1)}>{pending.current?'Kaydı kontrol et':'Yeniden yükle'}</Button></div>}
      {loading?<p role="status">Yoklama yükleniyor...</p>:data&&<>
        <p className="font-medium">{data.event.title} · {data.participants.length} kayıt · {data.participants.filter(p=>p.status==='PRESENT'&&p.verified_at).length} yönetici tarafından kaydedilmiş katılım</p>
        <p className="text-xs text-gray-500">Eski durumlar yeniden yorumlanmaz. Puan hesaplaması bu işlemde çalıştırılmaz.</p>
        <ul className="max-h-48 overflow-auto space-y-2">{data.participants.map(p=><li key={p.id} className="border rounded p-2 text-sm">{p.name} — {label(p.status,!!p.verified_at)}{p.verified_at&&<span className="block text-xs">{new Date(p.verified_at).toLocaleString('tr-TR')}</span>}</li>)}</ul>
        {writable?<div className="space-y-2">
          <label className="block">Katılımcı<select aria-label="Yoklama katılımcısı" value={selected} disabled={busy||!!pending.current} onChange={e=>setSelected(e.target.value)} className="block border p-2 w-full"><option value="">Seçin</option>{data.participants.map(p=><option key={p.id} value={p.user_id}>{p.name}</option>)}</select></label>
          <label className="block">Yoklama<select aria-label="Yoklama durumu" value={target} disabled={busy||!!pending.current} onChange={e=>setTarget(e.target.value as AttendanceCommand['status'])} className="block border p-2 w-full"><option value="PRESENT">Katıldı</option><option value="ABSENT">Katılmadı</option><option value="REGISTERED">Yoklamayı kaldır — kayıtlı</option></select></label>
          <label className="block">Gözlem veya düzeltme açıklaması<textarea aria-label="Yoklama açıklaması" maxLength={500} value={reason} disabled={busy||!!pending.current} onChange={e=>setReason(e.target.value)} className="block border p-2 w-full"/></label>
          <Button onClick={save} disabled={busy||!!pending.current||!selected||!reason.trim()}>{busy?'Kontrol ediliyor...':'Yoklamayı kaydet'}</Button>
        </div>:<p>Yoklama yalnız başlamış, iptal edilmemiş etkinlik için kaydedilebilir.</p>}
        <section><h3 className="font-semibold">Yoklama geçmişi</h3><p className="text-xs">Toplam {data.totalHistory} işlem; en son {data.history.length} işlem gösteriliyor.</p>
          <ul className="max-h-48 overflow-auto space-y-2">{data.history.map(h=><li key={h.id} className="border p-2 text-sm">{data.participants.find(p=>p.user_id===h.user_id)?.name??'Eski katılımcı'}: {h.before_status} → {h.after_status}<br/>{h.actor_name} · {new Date(h.recorded_at).toLocaleString('tr-TR')}<br/>{h.reason}</li>)}</ul>
          {data.totalHistory===0&&<p>Yönetici yoklama kaydı yok.</p>}
        </section>
      </>}
      <div className="flex justify-end"><Button onClick={onClose}>Kapat</Button></div>
    </div>
  </Modal>;
}
