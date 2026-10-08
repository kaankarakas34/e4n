import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { connectionsApi, type AcceptedConnection } from '../api/connections';

export function AcceptedConnectionsPanel() {
  const {user,token}=useAuthStore();
  const scope=`${user?.id}:${user?.role}:${token}`;
  const current=useRef(scope),seq=useRef(0),active=useRef(true);
  if(current.current!==scope){current.current=scope;seq.current++;}
  const [data,setData]=useState<{scope:string;rows:AcceptedConnection[]}|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[search,setSearch]=useState('');
  const load=async()=>{
    if(!user?.id)return;
    const request=++seq.current;setLoading(true);setError(null);setData(null);
    const valid=()=>active.current&&current.current===scope&&seq.current===request;
    try{const rows=await connectionsApi.list(user.id);if(valid())setData({scope,rows});}
    catch{if(valid())setError('Kabul edilmiş bağlantılar yüklenemedi.');}
    finally{if(valid())setLoading(false);}
  };
  useEffect(()=>{active.current=true;setSearch('');void load();return()=>{active.current=false;seq.current++;};},[scope]);
  if(!user?.id)return <p>Bağlantılarınız için giriş yapın.</p>;
  const ready=data?.scope===scope&&!loading&&!error;
  const shown=ready?data.rows.filter(p=>[p.name,p.profession,p.company,p.city].some(v=>v?.toLocaleLowerCase('tr-TR').includes(search.trim().toLocaleLowerCase('tr-TR')))):[];
  return <section aria-label="Kabul edilmiş bağlantılar" className="space-y-4 rounded-xl border bg-white p-6">
    <h2 className="text-xl font-semibold">Bağlantılarım (Network)</h2>
    <p className="text-sm text-gray-600">Kabul edilmiş bağlantılarınız. Grup değişikliği bağlantıyı kaldırmaz; ortak grup üyeliği tek başına bağlantı kabulü değildir.</p>
    <div className="flex flex-wrap gap-3"><input aria-label="Bağlantı ara" placeholder="İsim, meslek, şirket veya şehir ara" value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 rounded border p-2"/>
      <button type="button" disabled={loading} onClick={()=>void load()} className="rounded border px-4 py-2 disabled:opacity-50">Bağlantıları yenile</button></div>
    {loading&&<p role="status">Bağlantılar yükleniyor…</p>}
    {error&&<p role="alert">{error}</p>}
    {ready&&data.rows.length===0&&<p>Henüz kabul edilmiş bağlantınız yok.</p>}
    {ready&&data.rows.length>0&&shown.length===0&&<p>Arama kriterlerine uygun bağlantı bulunamadı.</p>}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{shown.map(p=><article key={p.id} className="space-y-2 rounded-lg border p-4">
      <h3 className="font-semibold">{p.name}</h3><p>{p.profession||'Meslek belirtilmemiş'}</p><p className="text-sm text-gray-600">{[p.company,p.city].filter(Boolean).join(' · ')||'Şirket/şehir belirtilmemiş'}</p>
      <div className="flex flex-wrap gap-3"><Link className="rounded border px-3 py-2" to={`/profile/${p.id}`}>Profili Gör</Link><Link className="rounded border px-3 py-2" to={`/messages?recipient=${encodeURIComponent(p.id)}`}>Mesaj</Link></div>
    </article>)}</div>
  </section>;
}
