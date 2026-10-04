import { useEffect, useRef, useState } from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';

interface Partner {id:string;name:string;profession?:string}
export function ActivityRecordForm({open,onClose,onSaved}:{open:boolean;onClose:()=>void;onSaved:()=>void}) {
    const {user}=useAuthStore(), owner=`${user?.id}:${user?.role}`, context=`${owner}:${open}`;
    const current=useRef(context),generation=useRef(0),active=useRef(true),lock=useRef(false),sequence=useRef(0);
    if(current.current!==context){current.current=context;generation.current++;}
    const version=generation.current,valid=()=>active.current&&current.current===context&&generation.current===version&&open&&!!user?.id;
    const intent=useRef<{signature:string;id:string}|null>(null);
    const [partners,setPartners]=useState<Partner[]>([]),[loadedFor,setLoadedFor]=useState<string|null>(null);
    const [loading,setLoading]=useState(false),[loadError,setLoadError]=useState<string|null>(null),[error,setError]=useState<string|null>(null),[sending,setSending]=useState(false);
    const [partner,setPartner]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState(''),[notes,setNotes]=useState('');
    const load=async()=>{
        if(!valid())return;
        const seq=++sequence.current;setLoading(true);setLoadError(null);setPartner('');
        try {
            // Preserve the existing group's/lonca's partner scope; failed scope reads cannot silently broaden it.
            const scopes=await Promise.all([api.getUserGroups(user.id),api.getUserPowerTeams(user.id)]);
            if(scopes.some(rows=>!Array.isArray(rows)||rows.some((row:any)=>!row||typeof row.id!=='string'||!row.id.trim())))throw new Error('Invalid scopes');
            const rows=await Promise.all([...scopes[0].map((g:any)=>api.getGroupMembers(g.id)),...scopes[1].map((g:any)=>api.getPowerTeamMembers(g.id))]);
            const map=new Map<string,Partner>();
            for(const members of rows){
                if(!Array.isArray(members))throw new Error('Invalid partners');
                for(const row of members){if(!row||typeof row.id!=='string'||!row.id.trim()||typeof (row.full_name||row.name)!=='string')throw new Error('Invalid partner');
                    if(row.id!==user.id)map.set(row.id,{id:row.id,name:row.full_name||row.name,profession:typeof row.profession==='string'?row.profession:undefined});}
            }
            if(valid()&&seq===sequence.current)setPartners([...map.values()]);
        }catch{if(valid()&&seq===sequence.current){setPartners([]);setLoadError('Katılımcılar yüklenemedi.');}}
        finally{if(valid()&&seq===sequence.current){setLoading(false);setLoadedFor(context);}}
    };
    useEffect(()=>{
        active.current=true;setPartner('');setDate('');setTime('');setNotes('');setError(null);setSending(false);setLoadedFor(null);
        if(open)void load();
        return()=>{active.current=false;sequence.current++;};
    },[context]);
    const ready=loadedFor===context&&!loading&&!loadError;
    const submit=async(e:React.FormEvent)=>{
        e.preventDefault();if(!valid()||lock.current||!ready||!partners.some(row=>row.id===partner))return;
        const scheduled=new Date(`${date}T${time}`),[year,month,day]=date.split('-').map(Number);
        if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!Number.isFinite(scheduled.getTime())
            ||scheduled.getFullYear()!==year||scheduled.getMonth()+1!==month||scheduled.getDate()!==day||scheduled.getHours()!==Number(time.slice(0,2))) {
            setError('Tarih ve saati kontrol edin.');return;
        }
        lock.current=true;setSending(true);setError(null);
        let confirmed=false;
        try {
            const signature=JSON.stringify([owner,partner,scheduled.toISOString(),notes.trim()]);
            if(intent.current?.signature!==signature)intent.current={signature,id:crypto.randomUUID()};
            const payload={requestId:intent.current.id,senderId:user.id,partnerId:partner,meetingDate:scheduled.toISOString(),notes:notes.trim()};
            const row=await api.logCompletedMeeting(payload);
            if(!valid())return;
            if(row?.id!==payload.requestId||row.requester_id!==user.id||row.partner_id!==partner||row.status!=='COMPLETED')throw new Error('Unconfirmed activity');
            confirmed=true;
            intent.current=null;setPartner('');setDate('');setTime('');setNotes('');onSaved();onClose();
        }catch{if(valid())setError(confirmed?'Görüşme kaydedildi; görünüm yenilenemedi. Listeyi tekrar yükleyin.':'Kayıt sonucu doğrulanamadı. Aynı bilgilerle tekrar deneyebilirsiniz.');}
        finally{lock.current=false;if(valid())setSending(false);}
    };
    return <Modal open={open&&!!user?.id} title="Tamamlanmış Birebir Görüşme" onClose={()=>{if(!lock.current)onClose();}}>
        <form onSubmit={submit} className="space-y-4">
            {error&&<p role="alert">{error}</p>}
            {loading||loadedFor!==context?<p role="status">Katılımcılar yükleniyor...</p>:loadError?<p role="alert">{loadError}</p>:!partners.length&&<p>Grup veya loncanızda katılımcı bulunmuyor.</p>}
            <Button type="button" onClick={load} disabled={sending||loading}>Katılımcıları tekrar yükle</Button>
            <label htmlFor="activity-partner">Katılımcı Üye</label>
            <select id="activity-partner" value={partner} onChange={e=>setPartner(e.target.value)} disabled={sending||!ready} required className="w-full border rounded p-2">
                <option value="">Katılımcı seçin</option>{ready&&partners.map(row=><option key={row.id} value={row.id}>{row.name}{row.profession?` — ${row.profession}`:''}</option>)}
            </select>
            <label htmlFor="activity-date">Görüşme tarihi</label><Input id="activity-date" type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={sending} required/>
            <label htmlFor="activity-time">Yerel saat</label><Input id="activity-time" type="time" value={time} onChange={e=>setTime(e.target.value)} disabled={sending} required/>
            <label htmlFor="activity-notes">Notlar (isteğe bağlı)</label><textarea id="activity-notes" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} disabled={sending} maxLength={10000} className="w-full border rounded p-2"/>
            <Button type="submit" disabled={sending||!ready||!partner||!date||!time}>{sending?'Kaydediliyor...':'Görüşmeyi kaydet'}</Button>
        </form>
    </Modal>;
}
