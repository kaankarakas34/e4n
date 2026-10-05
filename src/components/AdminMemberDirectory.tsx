import {useEffect,useState} from 'react';
import {useAuthStore} from '../stores/authStore';
import {adminMemberDirectoryApi,directoryStatus,filterDirectory} from '../api/adminMemberDirectory';
import type {MemberDirectory,DirectoryMember} from '../api/adminMemberDirectory';
import {Button} from '../shared/Button';
import {Card,CardContent} from '../shared/Card';
const when=(v:string|null)=>v?new Date(v).toLocaleString('tr-TR'):'Tarih bilinmiyor';
export function AdminMemberDirectory({onOpenManagement}:{onOpenManagement:()=>void}) {
  const {user,token}=useAuthStore();const context=`${user?.id}:${user?.role}:${token}`;
  const [data,setData]=useState<MemberDirectory|null>(null),[loadedFor,setLoadedFor]=useState(''),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const [tab,setTab]=useState<'members'|'community'>('members'),[search,setSearch]=useState(''),[role,setRole]=useState('ALL'),[status,setStatus]=useState('ALL'),[group,setGroup]=useState('ALL');
  const [selected,setSelected]=useState<DirectoryMember|null>(null);
  useEffect(()=>{let cancelled=false;setData(null);setLoadedFor('');setError('');setSelected(null);setSearch('');setRole('ALL');setStatus('ALL');setGroup('ALL');
    if(user?.role==='ADMIN'&&token)adminMemberDirectoryApi.read(user.id).then(result=>{if(!cancelled){setData(result);setLoadedFor(context);}}).catch(()=>{if(!cancelled)setError('Hesap dizini yüklenemedi. Tekrar deneyin.');});
    return()=>{cancelled=true;};
  },[context,user?.id,user?.role,token,refresh]);
  if(user?.role!=='ADMIN')return <div className="p-8">Erişim Kısıtlı</div>;
  if(!token)return <div role="alert" className="p-8">Oturum bulunamadı. Yeniden giriş yapın.</div>;
  const members=data?.members??[];
  const rows=filterDirectory(members,{tab,search,role,status,group});
  const roles=[...new Set(members.map(m=>m.role).filter((r):r is string=>r!==null))].sort();
  const statuses=[...new Set(members.map(m=>m.account_status).filter((r):r is string=>r!==null))].sort();
  const groups=new Map(members.flatMap(m=>m.groups.map(g=>[g.id,g.name] as const)));
  return <main className="max-w-7xl mx-auto p-6 space-y-5"><div className="flex flex-wrap justify-between gap-3"><h1 className="text-3xl font-bold">Üye Hesap Dizini</h1><div className="flex gap-2"><Button variant="outline" onClick={onOpenManagement}>Üye işlemleri</Button><Button onClick={()=>setRefresh(n=>n+1)}>Hesap dizinini yenile</Button></div></div>
    <p className="text-sm text-gray-600">Her hesap bir kez listelenir. Hesap durumu ile grup ve üyelik kaydı durumları ayrı gösterilir; bu ekran hak veya abonelik onayı hesaplamaz.</p>
    {error?<div role="alert"><p>{error}</p><Button onClick={()=>setRefresh(n=>n+1)}>Tekrar dene</Button></div>:loadedFor!==context?<p role="status">Yükleniyor...</p>:<>
      <p className="text-sm text-gray-500">Okuma zamanı: {when(data!.asOf)} · Toplam {members.length} hesap</p>
      <div className="flex gap-3">{(['members','community'] as const).map(t=><Button key={t} variant={tab===t?'primary':'outline'} onClick={()=>{setTab(t);setSelected(null);}}>{t==='members'?'Üye hesapları':'Topluluk hesapları'} ({members.filter(m=>t==='community'?m.role==='COMMUNITY_MEMBER':m.role!=='COMMUNITY_MEMBER').length})</Button>)}</div>
      <div className="grid md:grid-cols-4 gap-3"><label>Hesap ara<input aria-label="Hesap ara" className="border rounded p-2 w-full" value={search} onChange={e=>setSearch(e.target.value)} /></label>
        <label>Rol<select aria-label="Rol filtresi" className="border rounded p-2 w-full" value={role} onChange={e=>setRole(e.target.value)}><option value="ALL">Tüm roller</option><option value="UNKNOWN">Rol bilinmiyor</option>{roles.map(r=><option key={r} value={`VALUE:${r}`}>{r}</option>)}</select></label>
        <label>Hesap durumu<select aria-label="Hesap durumu filtresi" className="border rounded p-2 w-full" value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">Tüm durumlar</option><option value="UNKNOWN">Durum bilinmiyor</option>{statuses.map(s=><option key={s} value={`VALUE:${s}`}>{directoryStatus(s)}</option>)}</select></label>
        <label>Grup kaydı<select aria-label="Grup filtresi" className="border rounded p-2 w-full" value={group} onChange={e=>setGroup(e.target.value)}><option value="ALL">Tüm grup kayıtları</option><option value="NONE">Grup kaydı yok</option>{[...groups].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      </div>
      <Card><CardContent><p className="py-3">Filtrede {rows.length} hesap</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{['Hesap / İletişim','Rol / Hesap durumu','Meslek / Şirket','Grup kayıtları','İşlem'].map(t=><th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>
        {rows.map(m=><tr key={m.id} className="border-b"><td className="p-3"><strong>{m.name}</strong><p>{m.email}</p><p>{m.phone??'Telefon belirtilmemiş'}</p><p>{m.city??'Şehir belirtilmemiş'}</p></td><td className="p-3">{m.role??'Rol bilinmiyor'}<p>{directoryStatus(m.account_status)}</p></td><td className="p-3">{m.profession}<p>{m.company??'Şirket belirtilmemiş'}</p></td><td className="p-3">{m.groups.length?m.groups.map(g=><p key={g.id}>{g.name} · Grup: {directoryStatus(g.group_status)} · Üyelik kaydı: {directoryStatus(g.membership_status)}</p>):'Grup kaydı yok'}</td><td className="p-3"><Button variant="outline" onClick={()=>setSelected(m)}>Hesabı incele</Button></td></tr>)}
      </tbody></table>{rows.length===0&&<p className="p-8 text-center">Bu filtrede hesap bulunamadı.</p>}</div></CardContent></Card>
      {selected&&<section aria-label="Hesap detayı" className="border rounded p-5 space-y-3"><div className="flex justify-between"><h2 className="text-xl font-bold">{selected.name} — Hesap detayı</h2><Button variant="outline" onClick={()=>setSelected(null)}>Detayı kapat</Button></div><p>Kayıt: {when(selected.created_at)}</p><p>Görev: {selected.position??'Belirtilmemiş'}</p><p className="break-words">LinkedIn: {selected.linkedin_profile??'Belirtilmemiş'}</p><p>Meslek: {selected.profession}. Bu dizin meslek onayını hesaplamaz.</p></section>}
    </>}
  </main>;
}
