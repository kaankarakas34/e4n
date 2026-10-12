import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Users,UserPlus,Search,RefreshCw,ArrowUpRight,Clock,X} from 'lucide-react';
import {useAuthStore} from '../stores/authStore';
import {adminMemberDirectoryApi,directoryStatus,directoryRole,filterDirectory,recentlyJoined,sortMembersNewestFirst} from '../api/adminMemberDirectory';
import type {MemberDirectory,DirectoryMember} from '../api/adminMemberDirectory';
import {Button,buttonVariants} from '../shared/Button';
const when=(v:string|null)=>v?new Date(v).toLocaleString('tr-TR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Tarih belirtilmemiş';
const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(v=>v[0]).join('').toLocaleUpperCase('tr-TR');
const selectClass='mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-sm text-slate-900';
export function AdminMemberDirectory({onOpenManagement}:{onOpenManagement:()=>void}) {
  const {user,token}=useAuthStore();const context=[user?.id,user?.role,token].join(':');
  const [data,setData]=useState<MemberDirectory|null>(null),[loadedFor,setLoadedFor]=useState(''),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const [search,setSearch]=useState(''),[role,setRole]=useState('ALL'),[status,setStatus]=useState('ALL'),[group,setGroup]=useState('ALL'),[newOnly,setNewOnly]=useState(false);
  const [selected,setSelected]=useState<DirectoryMember|null>(null);
  useEffect(()=>{setSearch('');setRole('ALL');setStatus('ALL');setGroup('ALL');setNewOnly(false);setSelected(null);},[context]);
  useEffect(()=>{let cancelled=false;setLoadedFor('');setError('');setSelected(null);
    if(user?.role==='ADMIN'&&token)adminMemberDirectoryApi.read(user.id).then(result=>{if(!cancelled){setData(result);setLoadedFor(context);}}).catch(()=>{if(!cancelled)setError('Üyeler yüklenemedi. Tekrar deneyin.');});
    return()=>{cancelled=true;};
  },[context,user?.id,user?.role,token,refresh]);
  if(user?.role!=='ADMIN')return <div className="p-8">Erişim Kısıtlı</div>;
  if(!token)return <div role="alert" className="p-8">Oturum bulunamadı. Yeniden giriş yapın.</div>;
  const ready=loadedFor===context;
  const members=ready?sortMembersNewestFirst(data?.members??[]):[];
  const recent=members.filter(m=>recentlyJoined(m,data!.asOf));
  const rows=filterDirectory(members,{search,role,status,group}).filter(m=>!newOnly||recentlyJoined(m,data!.asOf));
  const roles=[...new Set(members.map(m=>m.role).filter((r):r is string=>r!==null))].sort();
  const statuses=[...new Set(members.map(m=>m.account_status).filter((r):r is string=>r!==null))].sort();
  const groups=new Map(members.flatMap(m=>m.groups.map(g=>[g.id,g.name] as const)));
  const clearFilters=()=>{setSearch('');setRole('ALL');setStatus('ALL');setGroup('ALL');setNewOnly(false);setSelected(null);};
  return <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-2">Yönetim / Üyeler</p><h1 className="text-3xl font-bold text-slate-900">Üye Yönetimi</h1><p className="mt-2 text-sm text-slate-500">Yeni katılan üyeleri görün, bilgilerini inceleyin ve üyelik işlemlerini yönetin.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setRefresh(n=>n+1)}><RefreshCw className="w-4 h-4 mr-2"/>Yenile</Button><Button variant="outline" onClick={onOpenManagement}>Diğer üye işlemleri</Button><Link className={buttonVariants({variant:'primary'})} to="/admin/members/new"><UserPlus className="w-4 h-4 mr-2"/>Yeni üye ekle</Link></div>
    </header>
    {error?<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5"><p>{error}</p><Button className="mt-3" onClick={()=>setRefresh(n=>n+1)}>Tekrar dene</Button></div>:!ready?<div role="status" className="rounded-xl bg-white border p-12 text-center text-slate-500">Üyeler yükleniyor...</div>:<>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 flex items-center justify-between"><div><p className="text-sm text-slate-500">Toplam üye hesabı</p><p className="text-3xl font-bold mt-1 text-slate-900">{members.length}</p></div><Users className="w-9 h-9 text-slate-300"/></div>
        <button className={'rounded-xl border p-5 flex items-center justify-between text-left transition-colors '+(newOnly?'border-red-400 bg-red-50':'bg-white hover:border-red-300')} aria-pressed={newOnly} onClick={()=>{setNewOnly(v=>!v);setSelected(null);}}><div><p className="text-sm text-slate-500">Son 7 günde katılan</p><p className="text-3xl font-bold mt-1 text-red-600">{recent.length}</p></div><UserPlus className="w-9 h-9 text-red-200"/></button>
        <div className="rounded-xl border bg-white p-5 flex items-center justify-between"><div><p className="text-sm text-slate-500">Grup kaydı olmayan</p><p className="text-3xl font-bold mt-1 text-slate-900">{members.filter(m=>m.groups.length===0).length}</p></div><Users className="w-9 h-9 text-slate-300"/></div>
      </div>
      {members.length>0&&<section aria-label="Son katılan üyeler" className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4"><h2 className="font-bold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-red-600"/>Son katılan üyeler</h2><span className="text-xs text-slate-500">En yeni kayıt en üstte</span></div>
        <div className="grid md:grid-cols-3 gap-3">{members.slice(0,3).map(m=><Link key={m.id} to={'/admin/members/'+m.id} className="flex gap-3 items-center rounded-xl bg-white border border-slate-100 p-4 hover:border-red-300 transition-colors"><span className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold shrink-0">{initials(m.name)}</span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900 truncate">{m.name}</p><p className="text-xs text-slate-500 truncate">{m.company||m.profession||'Şirket / meslek belirtilmemiş'}</p><p className="text-xs text-slate-400 mt-1">{when(m.created_at)}</p></div><ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0"/></Link>)}</div>
      </section>}
      <section aria-label="Üye listesi" className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-lg text-slate-900">{newOnly?'Yeni katılan üyeler':'Tüm üyeler'} <span className="text-sm font-normal text-slate-400 ml-2">{rows.length} kişi</span></h2><p className="text-xs text-slate-500">Kayıt tarihi: en yeniden eskiye</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-slate-500">Üye ara<div className="relative mt-1"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/><input aria-label="Üye ara" placeholder="Ad, şirket, meslek, telefon..." className="border border-slate-200 rounded-lg p-2.5 pl-9 w-full text-sm text-slate-900" value={search} onChange={e=>{setSearch(e.target.value);setSelected(null);}}/></div></label>
            <label className="text-xs font-medium text-slate-500">Rol<select aria-label="Rol filtresi" className={selectClass} value={role} onChange={e=>{setRole(e.target.value);setSelected(null);}}><option value="ALL">Tüm roller</option><option value="UNKNOWN">Rol belirtilmemiş</option>{roles.map(r=><option key={r} value={'VALUE:'+r}>{directoryRole(r)}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-500">Hesap durumu<select aria-label="Hesap durumu filtresi" className={selectClass} value={status} onChange={e=>{setStatus(e.target.value);setSelected(null);}}><option value="ALL">Tüm durumlar</option><option value="UNKNOWN">Durum belirtilmemiş</option>{statuses.map(s=><option key={s} value={'VALUE:'+s}>{directoryStatus(s)}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-500">Grup<select aria-label="Grup filtresi" className={selectClass} value={group} onChange={e=>{setGroup(e.target.value);setSelected(null);}}><option value="ALL">Tüm grup kayıtları</option><option value="NONE">Grup kaydı yok</option>{[...groups].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2"><Button size="sm" variant={newOnly?'primary':'outline'} aria-pressed={newOnly} onClick={()=>{setNewOnly(v=>!v);setSelected(null);}}>Son 7 günde katılanlar</Button><button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600">Filtreleri temizle</button></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[1000px]"><thead className="bg-slate-50 border-b border-slate-100"><tr className="text-left text-xs text-slate-500">{['Üye','Meslek / Şirket','İletişim','Grup','Kayıt tarihi ↓','Hesap durumu','İşlemler'].map(t=><th key={t} className="px-5 py-3 font-semibold whitespace-nowrap">{t}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
          {rows.map(m=><tr key={m.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0">{initials(m.name)}</span><div><Link to={'/admin/members/'+m.id} className="font-bold text-slate-900 hover:text-red-600">{m.name}</Link><p className="text-xs text-slate-500 mt-1">{directoryRole(m.role)}{recentlyJoined(m,data!.asOf)&&<span className="ml-2 inline-block rounded bg-red-50 px-1.5 py-0.5 text-red-600 font-semibold">Yeni</span>}</p></div></div></td>
            <td className="px-5 py-4"><p className="font-medium text-slate-700">{m.profession||'Meslek belirtilmemiş'}</p><p className="text-xs text-slate-500 mt-1">{m.company||'Şirket belirtilmemiş'}</p><p className="text-xs text-slate-400 mt-1">{m.city||'Şehir belirtilmemiş'}</p></td>
            <td className="px-5 py-4"><a className="text-slate-600 hover:text-red-600" href={'mailto:'+m.email}>{m.email}</a><p className="text-xs text-slate-500 mt-1">{m.phone||'Telefon belirtilmemiş'}</p></td>
            <td className="px-5 py-4">{m.groups.length?m.groups.map(g=><div key={g.id} className="mb-2 last:mb-0"><p className="font-medium text-slate-700">{g.name}</p><p className="text-xs text-slate-500">Üyelik: {directoryStatus(g.membership_status)}{g.group_status!=='ACTIVE'?' · Grup: '+directoryStatus(g.group_status):''}</p></div>):<span className="text-xs text-slate-400">Henüz grup kaydı yok</span>}</td>
            <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">{when(m.created_at)}</td><td className="px-5 py-4"><span className={'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium '+(m.account_status==='ACTIVE'?'bg-emerald-50 text-emerald-700':m.account_status==='PENDING'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600')}>{directoryStatus(m.account_status)}</span></td>
            <td className="px-5 py-4"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>setSelected(m)}>Detay</Button><Link className={buttonVariants({variant:'ghost',size:'sm'})} to={'/admin/members/'+m.id} aria-label={m.name+' profilini aç'}><ArrowUpRight className="w-4 h-4"/></Link></div></td>
          </tr>)}
        </tbody></table></div>
        {rows.length===0&&<div className="p-12 text-center"><Users className="w-8 h-8 text-slate-300 mx-auto mb-3"/><p className="font-medium text-slate-700">{members.length===0?'Henüz üye kaydı yok.':'Bu filtrelerde üye bulunamadı.'}</p><button onClick={clearFilters} className="mt-2 text-sm text-red-600">Tüm üyeleri göster</button></div>}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">{rows.length} / {members.length} üye gösteriliyor · Son güncelleme: {when(data!.asOf)}</div>
      </section>
      {selected&&<section aria-label="Üye detayı" className="rounded-2xl border bg-white p-6 space-y-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">{selected.name}</h2><p className="text-sm text-slate-500 mt-1">{selected.profession} · {selected.company||'Şirket belirtilmemiş'}</p></div><Button size="icon" variant="ghost" aria-label="Detayı kapat" onClick={()=>setSelected(null)}><X className="w-4 h-4"/></Button></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">{[['E-posta',selected.email],['Telefon',selected.phone||'Belirtilmemiş'],['Kayıt tarihi',when(selected.created_at)],['Şehir',selected.city||'Belirtilmemiş'],['Görev',selected.position||'Belirtilmemiş']].map(([label,value])=><div key={label}><p className="text-xs text-slate-400 mb-1">{label}</p><p className="break-words">{value}</p></div>)}</div>{selected.linkedin_profile&&<p className="text-sm text-slate-500 break-words">LinkedIn: {selected.linkedin_profile}</p>}<Link className={buttonVariants({variant:'primary'})} to={'/admin/members/'+selected.id}>Üye profilini yönet<ArrowUpRight className="w-4 h-4 ml-2"/></Link></section>}
    </>}
  </main>;
}
