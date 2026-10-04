import {useEffect,useRef,useState} from 'react';
import {useAuthStore} from '../stores/authStore';
import {adminReportsApi,AdminReport} from '../api/adminReports';
import type {ReportRange,ReferralMetric} from '../api/personalReports';
import {Card,CardHeader,CardContent,CardTitle} from '../shared/Card';
import {Button} from '../shared/Button';
const ranges:Record<ReportRange,string>={'7d':'Son 7 gün','30d':'Son 30 gün','90d':'Son 90 gün','1y':'Son 365 gün'};
const colors:Record<string,string>={GREY:'Gri',GREEN:'Yeşil',YELLOW:'Sarı',RED:'Kırmızı'};
const volume=(m:ReferralMetric)=>m.volume===null?`Bilinmiyor (${m.missingAmounts} eksik tutar; bilinen toplam ${m.knownVolume})`:m.volume;
function DataTable({headers,rows}:{headers:string[];rows:(string|number)[][]}){
  return <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr>{headers.map(h=><th key={h} scope="col" className="text-left p-3 border-b">{h}</th>)}</tr></thead><tbody>
    {rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} className="p-3 border-b">{v}</td>)}</tr>)}
    {!rows.length&&<tr><td colSpan={headers.length} className="p-3">Kayıt yok.</td></tr>}
  </tbody></table></div>;
}
export default function AdminReports(){
  const {user,token}=useAuthStore();
  const [range,setRange]=useState<ReportRange>('30d');
  const [tab,setTab]=useState('overview');
  const [revision,setRevision]=useState(0);
  const [result,setResult]=useState<{key:string;data?:AdminReport;error?:string}|null>(null);
  const generation=useRef(0);
  const context=`${user?.id}:${user?.role}:${token}:${range}:${revision}`;
  const scope=useRef({context,serial:0});
  if(scope.current.context!==context){scope.current={context,serial:scope.current.serial+1};generation.current++;}
  const key=`${context}:${scope.current.serial}`;
  useEffect(()=>{
    const current=++generation.current;
    if(user?.role==='ADMIN')adminReportsApi.get(user.id,range)
      .then(data=>{if(generation.current===current)setResult({key,data});})
      .catch(()=>{if(generation.current===current)setResult({key,error:'Yönetici raporu yüklenemedi. Tekrar deneyin.'});});
    return()=>{generation.current++;};
  },[key]);
  if(user?.role!=='ADMIN')return <p role="alert" className="p-6">Bu rapor yalnız yöneticiye açıktır.</p>;
  const current=result?.key===key?result:null,data=current?.data;
  const cards=data?[
    ['Kayıtlı hesap',data.stock.accounts],['Aktif grup',data.stock.active_groups],['Aktif lonca',data.stock.active_teams],
    ['Dönemde yeni hesap',data.activity.new_accounts],['Dönemde etkinlik',data.activity.events],['Tamamlanan birebir',data.activity.meetings],
    ['Ziyaretçi kaydı',data.activity.visitor_records],['Katılmış ziyaretçi',data.activity.attended_visitors],['Üyeye dönüşmüş ziyaretçi kaydı',data.activity.joined_visitors],
    ['Başarılı referans iş hacmi',volume(data.volumes.total)],['İç referans iş hacmi',volume(data.volumes.internal)],['Dış referans iş hacmi',volume(data.volumes.external)]
  ]:[];
  return <main className="max-w-7xl mx-auto p-6 space-y-6">
    <h1 className="text-3xl font-bold">Yönetici Raporları</h1>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor="admin-report-range">Faaliyet dönemi</label>
      <select id="admin-report-range" className="p-2 border rounded" value={range} onChange={e=>setRange(e.target.value as ReportRange)}>
        {Object.entries(ranges).map(([v,label])=><option key={v} value={v}>{label}</option>)}
      </select>
      <nav aria-label="Rapor bölümleri" className="flex gap-2">{[['overview','Genel Bakış'],['traffic','Trafik Işıkları'],['attendance','Katılım Raporu']].map(([v,label])=><button key={v} aria-pressed={tab===v} onClick={()=>setTab(v)} className={tab===v?'p-2 bg-indigo-100 rounded':'p-2 rounded'}>{label}</button>)}</nav>
    </div>
    {!current&&<p role="status">Yönetici raporu yükleniyor…</p>}
    {current?.error&&<div role="alert"><p>{current.error}</p><Button onClick={()=>setRevision(v=>v+1)}>Raporu tekrar yükle</Button></div>}
    {data&&<>
      <p className="text-sm text-gray-600">{ranges[range]} · {new Date(data.period.start).toLocaleString('tr-TR')} – {new Date(data.period.end).toLocaleString('tr-TR')}</p>
      {tab==='overview'&&<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([title,value])=><Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{value}</CardContent></Card>)}</div>
        {data.volumes.unclassified.count>0&&<p>Sınıflandırılmamış referans: {data.volumes.unclassified.count}; başarılı iş hacmi: {volume(data.volumes.unclassified)}.</p>}
        <p className="text-sm text-gray-600">Mevcut hesap/grup/lonca sayıları seçilen dönemden bağımsızdır. İş hacmi başarılı referansların kayıtlı tutarıdır, tahsilat değildir. Ziyaretçiler kaydedilen durumlarıyla sayılır; bu kayıtlar üyelik hakkını göstermez.</p>
        <Card><CardHeader><CardTitle>Aylık kayıt özeti (UTC)</CardTitle></CardHeader><CardContent>
          <DataTable headers={['Ay','Dönemde yeni hesap','Referans kaydı','Başarılı referans','Kayıtlı başarılı iş hacmi']} rows={data.monthly.map(m=>[m.month,m.newAccounts,m.referrals.count,m.referrals.successful,volume(m.referrals)])}/>
          <p className="text-sm text-gray-600 mt-3">İlk ve son ay seçilen dönemle sınırlıdır. Referans oluşturulma ayı ve güncel sonucu gösterilir; yeni hesap sayısı silinmemiş kayıtların oluşturulma tarihidir, net büyüme veya kayıp üye ölçümü değildir.</p>
        </CardContent></Card>
      </>}
      {tab==='traffic'&&<Card><CardHeader><CardTitle>Güncel kayıtlı performans</CardTitle></CardHeader><CardContent>
        <p className="mb-3 text-sm text-gray-600">Mevcut hesap puan ve renkleri; seçilen dönemin ortalaması değildir. Rapor okuması puan hesaplamaz.</p>
        <DataTable headers={['Hesap','Meslek','Kayıtlı puan','Kayıtlı renk']} rows={data.performance.map(p=>[p.name,p.profession,p.score??'Bilinmiyor',p.color?colors[p.color]:'Bilinmiyor'])}/>
      </CardContent></Card>}
      {tab==='attendance'&&<Card><CardHeader><CardTitle>Kaydedilmiş yoklama</CardTitle></CardHeader><CardContent>
        <p className="mb-3 text-sm text-gray-600">Etkinlik başlangıç tarihi seçilen dönemdedir. Kaydı olmayan yoklamalar devamsızlık sayılmaz; gelecek etkinlikler dahil değildir.</p>
        <DataTable headers={['Hesap','Var','Yok','Geç','Sağlık','Yedek']} rows={data.attendance.map(a=>[a.name,a.present,a.absent,a.late,a.medical,a.substitute])}/>
      </CardContent></Card>}
    </>}
  </main>;
}
