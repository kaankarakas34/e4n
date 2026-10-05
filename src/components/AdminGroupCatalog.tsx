import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuthStore} from '../stores/authStore';
import {adminGroupCatalogApi,filterGroupCatalog} from '../api/adminGroupCatalog';
import type {GroupCatalog} from '../api/adminGroupCatalog';
import {directoryStatus} from '../api/adminMemberDirectory';
import {Button} from '../shared/Button';
export function AdminGroupCatalog({onCreate,refreshVersion}:{onCreate:()=>void;refreshVersion:number}) {
  const {user,token}=useAuthStore();const context=`${user?.id}:${user?.role}:${token}`;
  const [data,setData]=useState<GroupCatalog|null>(null),[loadedFor,setLoadedFor]=useState(''),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const [search,setSearch]=useState(''),[status,setStatus]=useState('ALL');
  useEffect(()=>{let cancelled=false;setData(null);setLoadedFor('');setError('');setSearch('');setStatus('ALL');
    if(user?.role==='ADMIN'&&token)adminGroupCatalogApi.read(user.id).then(result=>{if(!cancelled){setData(result);setLoadedFor(context);}}).catch(()=>{if(!cancelled)setError('Grup kataloğu yüklenemedi. Tekrar deneyin.');});
    return()=>{cancelled=true;};
  },[context,user?.id,user?.role,token,refresh,refreshVersion]);
  if(user?.role!=='ADMIN')return <p>Erişim Kısıtlı</p>;
  if(!token)return <p role="alert">Oturum bulunamadı. Yeniden giriş yapın.</p>;
  const groups=data?.groups??[],rows=filterGroupCatalog(groups,search,status);
  const statuses=[...new Set(groups.map(g=>g.status).filter((s):s is string=>s!==null))].sort();
  return <section aria-label="Grup kataloğu" className="space-y-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-bold">Grup Kataloğu</h2><div className="flex gap-2"><Button variant="outline" onClick={()=>setRefresh(n=>n+1)}>Kataloğu yenile</Button><Button onClick={onCreate}>Grup Oluştur</Button></div></div>
    <p className="text-sm text-gray-600">Sayılar mevcut hesaba bağlı üyelik kayıtlarını gösterir. Aktif kayıt, grup durumu ve kabul hakkı ayrı konulardır; dönem ayı veya yeni hak hesaplanmaz.</p>
    {error?<div role="alert"><p>{error}</p><Button onClick={()=>setRefresh(n=>n+1)}>Grupları tekrar yükle</Button></div>:loadedFor!==context?<p role="status">Yükleniyor...</p>:<>
      <p>Okuma zamanı: {new Date(data!.asOf).toLocaleString('tr-TR')} · Toplam {groups.length} grup</p>
      <div className="grid sm:grid-cols-2 gap-3"><label>Grup ara<input aria-label="Grup ara" className="border rounded p-2 w-full" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Grup durumu<select aria-label="Grup durumu filtresi" className="border rounded p-2 w-full" value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">Tüm durumlar</option><option value="UNKNOWN">Durum bilinmiyor</option>{statuses.map(s=><option key={s} value={`VALUE:${s}`}>{directoryStatus(s)}</option>)}</select></label></div>
      <p>Filtrede {rows.length} grup</p><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{rows.map(g=><article key={g.id} className="border rounded-lg p-5 space-y-3 bg-white"><h3 className="text-xl font-bold break-words">{g.name}</h3><p>Grup durumu: {directoryStatus(g.status)}</p><dl className="grid grid-cols-2 gap-2 text-sm">{[['Toplam kayıt',g.total_records],['Aktif kayıt',g.active_records],['Talep kaydı',g.requested_records],['Diğer durum',g.other_records],['Durum bilinmiyor',g.unknown_records]].map(([label,n])=><div key={label}><dt className="text-gray-500">{label}</dt><dd className="font-semibold">{n}</dd></div>)}</dl><Link className="inline-block text-indigo-700 underline" to={`/admin/groups/${g.id}`}>Grup detayını aç</Link></article>)}</div>
      {!groups.length?<p className="p-8 text-center">Henüz hiç grup yok.</p>:!rows.length?<p className="p-8 text-center">Bu filtrede grup bulunamadı.</p>:null}
    </>}
  </section>;
}
