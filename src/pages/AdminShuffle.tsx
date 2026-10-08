import {useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {shuffleSubmissionApi,validShuffleCommand,type ShuffleCommand} from '../api/shuffleSubmission';
import {currentDistribution,shuffleWorkspaceApi,type ShuffleWorkspace} from '../api/shuffleWorkspace';
import {useAuthStore} from '../stores/authStore';
import {distributeMembers} from '../utils/shuffleAlgorithm';
import {Card,CardContent,CardHeader,CardTitle} from '../shared/Card';
import {Button} from '../shared/Button';
import {ArrowLeft,Lock,Unlock,RefreshCw,Shuffle,Save} from 'lucide-react';

export function AdminShuffle(){
  const navigate=useNavigate();
  const actor=useAuthStore(s=>s.user),token=useAuthStore(s=>s.token);
  const identity=actor?.id+'|'+actor?.role+'|'+token;
  const generation=useRef(0);
  const busy=useRef(false);
  const [pending,setPending]=useState<{owner:string;command:ShuffleCommand}|null>(null);
  const [corruptOwner,setCorruptOwner]=useState<string|null>(null);
  const corruptPending=corruptOwner===actor?.id;
  const pendingCommand=pending?.owner===actor?.id?pending.command:null;
  const storageKey=actor?'e4n-shuffle-submission:'+actor.id:null;
  const [state,setState]=useState<{identity:string;data:ShuffleWorkspace}|null>(null);
  const [items,setItems]=useState<Record<string,string[]>>({});
  const [locks,setLocks]=useState<string[]>([]);
  const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
  const [draft,setDraft]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const data=state?.identity===identity?state.data:null;
  const current=data?currentDistribution(data):null;
  const members=current?.members||[];
  const sameActor=()=>{
    const s=useAuthStore.getState();return s.user?.id+'|'+s.user?.role+'|'+s.token===identity;
  };
  const load=async()=>{
    const request=++generation.current;
    setState(null);setItems({});setLocks([]);setDraft(false);setError('');setLoading(true);
    if(!actor||actor.role!=='ADMIN'){setLoading(false);return;}
    try{
      const next=await shuffleWorkspaceApi.read(actor.id);
      if(request!==generation.current||!sameActor())return;
      setState({identity,data:next});setItems(currentDistribution(next).items);
    }catch{if(request===generation.current&&sameActor())setError('Mevcut grup dağılımı yüklenemedi. Tekrar deneyin.');}
    finally{if(request===generation.current&&sameActor())setLoading(false);}
  };
  useEffect(()=>{
    setMessage('');setSaving(false);setPending(null);setCorruptOwner(null);
    try{const stored=storageKey?sessionStorage.getItem(storageKey):null;if(stored){const b=JSON.parse(stored);if(validShuffleCommand(b))setPending({owner:actor!.id,command:b});else setCorruptOwner(actor!.id);}}
    catch{if(actor)setCorruptOwner(actor.id);}
    void load();return()=>{generation.current++;};
  },[identity]);
  const unassigned=items.unassigned||[];
  const overflow=Object.entries(items).some(([id,list])=>id!=='unassigned'&&list.length>35);
  const missingProfession=members.some(m=>!m.profession?.trim());
  const previewBlocked=loading||saving||!!pendingCommand||corruptPending||!data||!members.length||!data.groups.length||!!current?.ambiguous||missingProfession;
  const preview=()=>{
    if(previewBlocked||!data)return;
    const result=distributeMembers(members.map(m=>({...m,name:m.full_name,profession:m.profession!})),data.groups,items,locks,{respectLocks:true,minimizeOverlap:false,maxAttempts:1});
    setItems(result);setDraft(true);setMessage('Taslak hazırlandı. Veritabanındaki dağılım henüz değişmedi.');setError('');
  };
  const submit=async(command:ShuffleCommand,readOnly=false)=>{
    if(busy.current||!actor||actor.role!=='ADMIN'||!sameActor())return;
    busy.current=true;
    const saveGeneration=++generation.current;
    const currentSave=()=>sameActor()&&generation.current===saveGeneration;
    setSaving(true);setError('');setMessage('');
    const accepted=async()=>{
      if(!currentSave())return;
      if(storageKey)sessionStorage.removeItem(storageKey);
      setPending(null);
      await load();
      if(sameActor()&&generation.current===saveGeneration+1)setMessage('Dağıtım kaydedildi. Bu işlem e-posta veya bildirim göndermedi.');
    };
    try{
      if(readOnly)await shuffleSubmissionApi.reconcile(actor.id,command);
      else await shuffleSubmissionApi.save(actor.id,command);
      await accepted();
    }catch(e){
      if(!currentSave())return;
      // A lost acknowledgement never triggers another write. Read immutable receipt first.
      try{await shuffleSubmissionApi.reconcile(actor.id,command);await accepted();}
      catch(readError){
        if(!currentSave())return;
        const status=(e as {status?:number}).status;
        if(!readOnly&&[400,409,422].includes(status!)&&(readError as {status?:number}).status===404){
          if(storageKey)sessionStorage.removeItem(storageKey);setPending(null);setState(null);setItems({});setLocks([]);setDraft(false);
          setError(status===409?'Kayıtlar değişmiş veya işlem kimliği farklı bir taslağa ait olabilir. Güncel verileri yükleyip tekrar hazırlayın.':'Dağıtım isteği reddedildi. Kayıtları kontrol edip güncel taslak hazırlayın.');
        }else setError('Dağıtım sonucu henüz doğrulanamadı. Bekleyen işlem korunuyor; önce sonucu kontrol edin, gerekirse aynı işlemi tekrar gönderin.');
      }
    }finally{busy.current=false;if(sameActor()&&[saveGeneration,saveGeneration+1].includes(generation.current))setSaving(false);}
  };
  const save=async()=>{
    if(busy.current||!data||previewBlocked||!draft||unassigned.length||overflow||!sameActor())return;
    if(!window.confirm('Bu dağıtım mevcut aktif grup üyeliklerini değiştirecek ve liderlik rollerini sıfırlayacak. Kaydetmek istiyor musunuz?'))return;
    const command:ShuffleCommand={requestId:crypto.randomUUID(),expectedRevision:data.revision,assignments:Object.fromEntries(Object.entries(items).filter(([id])=>id!=='unassigned').map(([id,list])=>[id,[...list]]))};
    try{sessionStorage.setItem(storageKey!,JSON.stringify(command));}catch{setError('Bekleyen işlem bu sekmeye kaydedilemedi. Dağıtım gönderilmedi.');return;}
    setPending({owner:actor!.id,command});await submit(command);
  };
  if(actor?.role!=='ADMIN')return <p className="p-8">Bu ekran için yönetici yetkisi gerekir.</p>;
  return <div className="min-h-screen bg-gray-50 p-8"><div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Button variant="ghost" onClick={()=>navigate('/admin/groups')}><ArrowLeft className="h-4 w-4 mr-2"/>Gruplara Dön</Button><h1 className="text-2xl font-bold">Grup Shuffle Yönetimi</h1></div>
      <div className="flex gap-2"><Button onClick={()=>navigate('/admin/shuffle-history')}>Kayıt Geçmişi</Button><Button variant="outline" disabled={loading||saving||!!pendingCommand} onClick={()=>{setMessage('');void load();}}><RefreshCw className="h-4 w-4 mr-2"/>Güncel Dağılımı Yükle</Button><Button disabled={previewBlocked||!draft||!!unassigned.length||overflow} onClick={()=>void save()}><Save className="h-4 w-4 mr-2"/>{saving?'Kaydediliyor…':'Dağıtımı Kaydet'}</Button></div>
    </div>
    {loading&&<p role="status">Mevcut dağılım yükleniyor…</p>}
    {error&&<p role="alert" className="p-4 bg-red-50 text-red-800 rounded">{error}</p>}
    {message&&<p role="status" className="p-4 bg-blue-50 text-blue-800 rounded">{message}</p>}
    {corruptPending&&<p role="alert" className="p-4 bg-red-50 text-red-800 rounded">Bekleyen dağıtım kaydı okunamadı. Yeni dağıtım gönderilmedi; devam etmeden önce kayıt geçmişini kontrol edin.</p>}
    {pendingCommand&&<Card><CardHeader><CardTitle>Bekleyen dağıtım işlemi</CardTitle></CardHeader><CardContent className="space-y-3"><p>Bu sekmede gönderilmiş bir dağıtım var. Yeni taslak hazırlamadan önce kaydedilip kaydedilmediğini kontrol edin. Tekrar gönderme aynı işlem kimliğini ve aynı dağıtımı kullanır.</p><p className="text-xs break-all">İşlem: {pendingCommand.requestId}</p><div className="flex flex-wrap gap-2"><Button disabled={saving||loading} onClick={()=>void submit(pendingCommand,true)}>Dağıtım Sonucunu Kontrol Et</Button><Button variant="outline" disabled={saving||loading} onClick={()=>{if(window.confirm('Bekleyen aynı dağıtım işlemini tekrar göndermek istiyor musunuz?'))void submit(pendingCommand);}}>Aynı Dağıtımı Tekrar Gönder</Button></div></CardContent></Card>}
    {data&&<>
      <Card><CardHeader><CardTitle>{draft?'Dağıtım Taslağı':'Mevcut Aktif Grup Üyelikleri'}</CardTitle></CardHeader><CardContent className="space-y-3">
        <p className="text-sm text-gray-600">Veri zamanı: {new Date(data.asOf).toLocaleString('tr-TR')}. Önceki dönem atama geçmişi mevcut değil; eski grup arkadaşlığı hesaplanmıyor.</p>
        <p className="text-sm">Önizleme mevcut hesap filtresini kullanır: ACTIVE hesaplar, ADMIN hariç. Hariç kalan hesap: {current?.excluded}. Ödeme kesim tarihi ve hedef shuffle uygunluğu henüz uygulanmıyor.</p>
        {!!current?.ambiguous&&<p role="alert" className="text-red-700">{current.ambiguous} hesabın birden fazla aktif grubu var. Tek bir grup varsayılmadı; dağıtım hazırlamak için bu kayıtlar netleştirilmeli.</p>}
        {missingProfession&&<p role="alert" className="text-red-700">Meslek bilgisi eksik hesaplar var. Dağıtım için kayıtları kontrol edin.</p>}
        {draft&&overflow&&<p role="alert" className="text-red-700">Taslakta 35 kişiyi aşan grup var. Mevcut kaydetme işlemi liderlik rollerini sıfırladığı için taslaktaki herkes üye koltuğu kullanır.</p>}
        <Button disabled={previewBlocked} onClick={preview}><Shuffle className="h-4 w-4 mr-2"/>Dağıtım Taslağı Hazırla</Button>
        <p className="text-xs text-gray-500">Taslak meslek metinlerini eşleştirir ve kilitli üyeleri yerinde tutar. Dönem takvimi, hizmet sınıflandırması ve ödeme uygunluğu onayı değildir.</p>
      </CardContent></Card>
      {unassigned.length>0&&<Card><CardHeader><CardTitle>{draft?'Taslakta Atanamayan':'Aktif Grubu Olmayan'} Üyeler ({unassigned.length})</CardTitle></CardHeader><CardContent><p className="text-sm mb-3">{draft?'Kapasite veya meslek eşleşmesi nedeniyle yerleşemeyen üyeler var. Taslak kaydedilemez.':'Bu üyeler veritabanında hiçbir aktif gruba bağlı değil.'}</p><div className="grid grid-cols-1 md:grid-cols-3 gap-2">{unassigned.map(id=><p className="border p-3 rounded" key={id}>{members.find(m=>m.id===id)?.full_name}</p>)}</div></CardContent></Card>}
      {!data.groups.length&&<p>Henüz grup kaydı yok.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{data.groups.map(group=><Card key={group.id}><CardHeader><CardTitle>{group.name}</CardTitle><p className="text-xs text-gray-500">Grup durumu: {group.status||'Bilinmiyor'} · {(items[group.id]||[]).length} Üye</p></CardHeader><CardContent className="space-y-2">{(items[group.id]||[]).map(id=>{
        const m=members.find(m=>m.id===id);if(!m)return null;const locked=locks.includes(id);
        return <div key={id} className="flex items-center justify-between border p-3 rounded"><div><p className="font-medium">{m.full_name}</p><p className="text-xs text-gray-500">{m.profession||'Meslek belirtilmemiş'}</p></div><Button variant="ghost" size="icon" disabled={previewBlocked} aria-label={(locked?'Kilidi aç: ':'Yerinde kilitle: ')+m.full_name} onClick={()=>setLocks(list=>list.includes(id)?list.filter(x=>x!==id):[...list,id])}>{locked?<Lock className="h-4 w-4"/>:<Unlock className="h-4 w-4"/>}</Button></div>;
      })}{!(items[group.id]||[]).length&&<p className="text-sm text-gray-500">Üye yok</p>}</CardContent></Card>)}</div>
    </>}
  </div></div>;
}
