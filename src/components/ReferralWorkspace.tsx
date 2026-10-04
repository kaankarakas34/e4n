import React, { useEffect, useRef, useState } from 'react';
const uuid={v4:()=>crypto.randomUUID()};
import { useAuthStore as useAuth } from '../stores/authStore';
import { referralsApi, referralRevenue, type ReferralRow, type ReferralInput, type ReferralScope } from '../api/referrals';

const labels={PENDING:'Bekliyor',SUCCESSFUL:'Başarılı',UNSUCCESSFUL:'Olumsuz'};
export function ReferralWorkspace({incomingOnly=false}:{incomingOnly?:boolean}){
    const {user}=useAuth(),context=`${user?.id}:${user?.role}`;
    const current=useRef(context),generation=useRef(0),active=useRef(true);
    if(current.current!==context){current.current=context;generation.current++;}
    const version=generation.current,valid=()=>active.current && current.current===context && generation.current===version && !!user?.id;
    const scopeSeq=useRef(0),listSeq=useRef(0),peopleSeq=useRef(0),lock=useRef<object|null>(null),intent=useRef<{signature:string;id:string}|null>(null);
    const [list,setList]=useState<{context:string;rows:ReferralRow[]}|null>(null);
    const [people,setPeople]=useState<{context:string;rows:{id:string;name:string}[]}|null>(null);
    const [scopes,setScopes]=useState<{context:string;rows:ReferralScope[]}|null>(null),[scopeKey,setScopeKey]=useState('');
    const [scopeError,setScopeError]=useState<string|null>(null),[scopeLoading,setScopeLoading]=useState(false);
    const [loading,setLoading]=useState(false),[peopleLoading,setPeopleLoading]=useState(false);
    const [error,setError]=useState<string|null>(null),[peopleError,setPeopleError]=useState<string|null>(null);
    const [notice,setNotice]=useState<{context:string;text:string}|null>(null),[pendingFor,setPendingFor]=useState<string|null>(null);
    const [receiver,setReceiver]=useState(''),[type,setType]=useState<ReferralInput['type']>('INTERNAL');
    const [temperature,setTemperature]=useState<ReferralInput['temperature']>('HOT'),[description,setDescription]=useState('');
    const [estimate,setEstimate]=useState('');
    const [amounts,setAmounts]=useState<Record<string,string>>({});
    const pending=pendingFor===context;
    const load=async()=>{
        if(!valid())return;const seq=++listSeq.current;setLoading(true);setError(null);
        try{const rows=await referralsApi.list(user.id);if(valid()&&seq===listSeq.current)setList({context,rows});}
        catch{if(valid()&&seq===listSeq.current){setList(null);setError('Referanslar yüklenemedi.');}}
        finally{if(valid()&&seq===listSeq.current)setLoading(false);}
    };
    const peopleContext=`${context}:${type}:${scopeKey}`,peopleCurrent=useRef(peopleContext);
    const peopleGeneration=useRef(0);
    if(peopleCurrent.current!==peopleContext){peopleCurrent.current=peopleContext;peopleGeneration.current++;}
    const peopleVersion=peopleGeneration.current;
    const loadScopes=async()=>{
        if(!valid())return;const seq=++scopeSeq.current;setScopeLoading(true);setScopeError(null);
        try{const rows=await referralsApi.scopes(user.id);if(valid()&&seq===scopeSeq.current){setScopes({context,rows});if(!rows.some(s=>`${s.kind}:${s.id}`===scopeKey))setScopeKey('');}}
        catch{if(valid()&&seq===scopeSeq.current){setScopes(null);setScopeError('Grup ve loncalar yüklenemedi.');}}
        finally{if(valid()&&seq===scopeSeq.current)setScopeLoading(false);}
    };
    const loadPeople=async()=>{
        if(!valid())return;const seq=++peopleSeq.current;setPeopleLoading(true);setPeopleError(null);
        const scope=type==='INTERNAL'?scopes?.rows.find(s=>`${s.kind}:${s.id}`===scopeKey):undefined;
        if(type==='INTERNAL'&&!scope){setPeople(null);setPeopleLoading(false);return;}
        try{const rows=await referralsApi.people(user.id,scope);if(valid()&&peopleCurrent.current===peopleContext&&peopleGeneration.current===peopleVersion&&seq===peopleSeq.current){setPeople({context:peopleContext,rows});if(!rows.some(r=>r.id===receiver))setReceiver('');}}
        catch{if(valid()&&peopleCurrent.current===peopleContext&&peopleGeneration.current===peopleVersion&&seq===peopleSeq.current){setPeople(null);setPeopleError('Üyeler yüklenemedi.');}}
        finally{if(valid()&&peopleCurrent.current===peopleContext&&peopleGeneration.current===peopleVersion&&seq===peopleSeq.current)setPeopleLoading(false);}
    };
    useEffect(()=>{
        active.current=true;setList(null);setPeople(null);setScopes(null);setScopeKey('');setReceiver('');setDescription('');setEstimate('');setAmounts({});setNotice(null);setPendingFor(null);intent.current=null;
        void load();void loadScopes();return()=>{active.current=false;scopeSeq.current++;listSeq.current++;peopleSeq.current++;};
    },[context]);
    useEffect(()=>{setReceiver('');setPeople(null);void loadPeople();return()=>{peopleSeq.current++;};},[peopleContext,scopes]);
    const ready=list?.context===context&&!loading&&!error,peopleReady=people?.context===peopleContext&&!peopleLoading&&!peopleError&&(type==='EXTERNAL'||scopes?.context===context&&!scopeLoading&&!scopeError&&scopes.rows.some(s=>`${s.kind}:${s.id}`===scopeKey));
    const mutate=async(row?:ReferralRow,status?:'SUCCESSFUL'|'UNSUCCESSFUL')=>{
        if(!valid()||lock.current)return;
        let amount:number|undefined;
        if(status){
            if(!ready || !row || row.receiver_id!==user.id || row.status!=='PENDING' || !list.rows.some(r=>r.id===row.id))return;
            if(status==='SUCCESSFUL')try{amount=referralRevenue(amounts[row.id]||'');}catch(e){setNotice({context,text:(e as Error).message});return;}
        }else if(peopleCurrent.current!==peopleContext || peopleGeneration.current!==peopleVersion || !peopleReady || !people.rows.some(r=>r.id===receiver) || !description.trim() || description.length>10000){setNotice({context,text:'Alıcı ve açıklamayı kontrol edin.'});return;}
        let initialAmount:number|null=null;
        if(!status&&estimate.trim())try{initialAmount=referralRevenue(estimate.trim(),false);}catch(e){setNotice({context,text:(e as Error).message});return;}
        const token={};lock.current=token;setPendingFor(context);setNotice(null);
        try{
            if(status)await referralsApi.decide(user.id,row!.id,status,amount);
            else{
                const input={receiverId:receiver,type,temperature,description:description.trim(),amount:initialAmount},signature=JSON.stringify([context,input]);
                if(intent.current?.signature!==signature)intent.current={signature,id:uuid.v4()};
                await referralsApi.create(user.id,input,intent.current.id);
            }
            if(!valid())return;
            if(!status){intent.current=null;setReceiver('');setDescription('');setEstimate('');}
            setNotice({context,text:status?'Referans sonucu kaydedildi.':'Referans kaydedildi.'});await load();
        }catch{if(valid())setNotice({context,text:'İşlem sonucu doğrulanamadı. Listeyi yenileyip kontrol edin; aynı bilgilerle yeniden deneyebilirsiniz.'});}
        finally{if(lock.current===token){lock.current=null;if(valid())setPendingFor(null);}}
    };
    const [tab,setTab]=useState<'sent'|'received'|'new'>(incomingOnly?'received':'sent'),[search,setSearch]=useState('');
    const rows=ready?list.rows:[];
    const shown=rows.filter(row=>(incomingOnly||tab==='received'?row.receiver_id===user?.id:row.giver_id===user?.id))
        .filter(row=>[row.description,row.giver_name,row.receiver_name].some(value=>value?.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))));
    const successful=rows.filter(row=>row.status==='SUCCESSFUL');
    const volume=successful.some(row=>row.amount==null)?null:successful.reduce((sum,row)=>sum+Number(row.amount),0);
    const button=(label:string,action:()=>void,disabled=false)=><button type="button" aria-label={label} disabled={pending||disabled} onClick={action} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">{label.startsWith('Başarılı:')?'Başarılı':label.startsWith('Olumsuz:')?'Olumsuz':label}</button>;
    if(!user?.id)return <p>Referanslar için giriş yapın.</p>;
    return <main className="mx-auto max-w-5xl space-y-6 p-6">
        <header><h1 className="text-3xl font-bold">{incomingOnly?'Ciro (Teşekkür) Girişi':'İş Yönlendirmeleri'}</h1><p className="mt-2 text-gray-600">Gelen ve giden referanslarınızı takip edin; alınan işleri ciro ile sonuçlandırın.</p></header>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[['Başarılı',successful.length],['Beklemede',rows.filter(r=>r.status==='PENDING').length],['Olumsuz',rows.filter(r=>r.status==='UNSUCCESSFUL').length],['Toplam Hacim',volume==null?'Bilinmiyor':volume.toLocaleString('tr-TR')+' ₺']].map(([label,value])=><div className="rounded-xl border bg-white p-4" key={label}><p className="text-sm text-gray-600">{label}</p><p className="text-2xl font-bold">{ready?value:'Bilinmiyor'}</p></div>)}</div>
        {!incomingOnly&&<nav className="flex flex-wrap gap-2" aria-label="Referans görünümü">{button('Gönderdiklerim',()=>setTab('sent'))}{button('Aldıklarım',()=>setTab('received'))}{button('Yeni referans',()=>setTab('new'))}</nav>}
        {notice?.context===context&&<p role="status" className="rounded-lg border p-3">{notice.text}</p>}
        {tab==='new'&&!incomingOnly&&<section className="space-y-4 rounded-xl border bg-white p-6" aria-label="Yeni referans formu">
            <h2 className="text-xl font-semibold">Yeni referans</h2>
            <fieldset disabled={pending} className="space-y-4">
                <label className="block">Yönlendirme türü<select aria-label="Yönlendirme türü" value={type} onChange={e=>setType(e.target.value as ReferralInput['type'])} className="ml-3 rounded border p-2"><option value="INTERNAL">Grup içi</option><option value="EXTERNAL">Grup dışı (Bağlantılar)</option></select></label>
                {type==='INTERNAL'&&<div>
                    {scopeLoading&&<p>Grup ve loncalar yükleniyor…</p>}
                    {scopeError&&<p role="alert">{scopeError}</p>}
                    {button('Grup ve loncaları yenile',()=>loadScopes())}
                    <label className="mt-3 block">Grup veya lonca<select aria-label="Grup veya lonca" value={scopeKey} onChange={e=>setScopeKey(e.target.value)} disabled={scopeLoading||!!scopeError||scopes?.context!==context} className="ml-3 rounded border p-2"><option value="">Seçiniz</option>{scopes?.context===context&&scopes.rows.map(scope=><option key={`${scope.kind}:${scope.id}`} value={`${scope.kind}:${scope.id}`}>{scope.name} ({scope.kind==='group'?'Grup':'Lonca'})</option>)}</select></label>
                    {scopes?.context===context&&scopes.rows.length===0&&<p>Üyesi olduğunuz grup/lonca yok.</p>}
                </div>}
                {peopleLoading&&<p>Üyeler yükleniyor…</p>}
                {peopleError&&<p role="alert">{peopleError}</p>}
                {button('Üyeleri yeniden yükle',()=>loadPeople())}
                <label className="block">Alıcı<select aria-label="Alıcı" value={receiver} onChange={e=>setReceiver(e.target.value)} disabled={!peopleReady} className="ml-3 rounded border p-2"><option value="">Seçiniz</option>{peopleReady&&people.rows.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
                {peopleReady&&people.rows.length===0&&<p>Seçilebilir üye yok.</p>}
                <label className="block">Sıcaklık<select aria-label="Sıcaklık" value={temperature} onChange={e=>setTemperature(e.target.value as ReferralInput['temperature'])} className="ml-3 rounded border p-2"><option value="HOT">Sıcak</option><option value="WARM">Ilık</option><option value="COLD">Soğuk</option></select></label>
                <label className="block">İş açıklaması<textarea aria-label="Referans açıklaması" maxLength={10000} value={description} onChange={e=>setDescription(e.target.value)} className="mt-2 block w-full rounded border p-3" rows={4}/></label>
                <label className="block">Tahmini iş hacmi (isteğe bağlı, ₺)<input aria-label="Tahmini iş hacmi" inputMode="decimal" value={estimate} onChange={e=>setEstimate(e.target.value)} className="ml-3 rounded border p-2" placeholder="1500.50"/></label>
                {button('Referansı gönder',()=>mutate(),!peopleReady)}
            </fieldset>
        </section>}
        {(incomingOnly||tab!=='new')&&<section className="space-y-4" aria-label="Referans listesi">
            <div className="flex flex-wrap gap-3"><input aria-label="Referans ara" value={search} onChange={e=>setSearch(e.target.value)} className="rounded border p-2" placeholder="Referans ara"/>{button('Referansları yenile',()=>load())}</div>
            {loading&&<p>Referanslar yükleniyor…</p>}
            {error&&<div><p role="alert">{error}</p>{button('Referansları yeniden yükle',()=>load())}</div>}
            {ready&&shown.length===0&&<p>Bu görünümde referans bulunmuyor.</p>}
            {ready&&shown.map(row=><article className="space-y-3 rounded-xl border bg-white p-5" key={row.id}>
                <div className="flex justify-between"><h2 className="font-semibold">{row.giver_id===user.id?'Giden':'Gelen'} · {row.giver_name||'Gönderen adı bulunamadı'} → {row.receiver_name||'Alıcı adı bulunamadı'}</h2><span>{labels[row.status]}</span></div>
                <p className="whitespace-pre-wrap">{row.description}</p><p className="text-sm text-gray-600">{row.type==='INTERNAL'?'Grup içi':'Grup dışı'} · {{HOT:'Sıcak',WARM:'Ilık',COLD:'Soğuk'}[row.temperature]} · {new Date(row.created_at).toLocaleString('tr-TR')}</p>
                <p>Ciro: {row.amount==null?'Girilmedi':Number(row.amount).toLocaleString('tr-TR')+' ₺'}</p>
                {row.receiver_id===user.id&&row.status==='PENDING'&&<fieldset disabled={pending} className="flex flex-wrap items-center gap-3">
                    <label>Ciro (₺)<input aria-label={`Ciro: ${row.id}`} inputMode="decimal" value={amounts[row.id]||''} onChange={e=>setAmounts(previous=>({...previous,[row.id]:e.target.value}))} className="ml-2 rounded border p-2" placeholder="1500.50"/></label>
                    {button(`Başarılı: ${row.id}`,()=>mutate(row,'SUCCESSFUL'))}{button(`Olumsuz: ${row.id}`,()=>mutate(row,'UNSUCCESSFUL'))}
                </fieldset>}
            </article>)}
        </section>}
    </main>;
}
