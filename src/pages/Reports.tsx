import {useEffect,useRef,useState} from 'react';
import {useAuthStore} from '../stores/authStore';
import {personalReportsApi,PersonalReport,ReportRange,ReferralMetric} from '../api/personalReports';
import {Card,CardContent,CardHeader,CardTitle} from '../shared/Card';
import {Button} from '../shared/Button';
import AdminReports from './AdminReports';

const labels:Record<ReportRange,string>={'7d':'Son 7 gün','30d':'Son 30 gün','90d':'Son 90 gün','1y':'Son 365 gün'};
const colors:Record<string,string>={GREY:'Gri',GREEN:'Yeşil',YELLOW:'Sarı',RED:'Kırmızı'};
const volume=(r:ReferralMetric)=>r.volume===null?`Eksik tutar: ${r.missingAmounts} kayıt. Bilinen toplam: ${r.knownVolume}`:r.volume;
export function Reports(){
  const {user,token}=useAuthStore();
  const [range,setRange]=useState<ReportRange>('30d');
  const [revision,setRevision]=useState(0);
  const [result,setResult]=useState<{key:string;data?:PersonalReport;error?:string}|null>(null);
  const generation=useRef(0);
  const context=`${user?.id}:${user?.role}:${token}:${range}:${revision}`;
  const scope=useRef({context,serial:0});
  if(scope.current.context!==context){scope.current={context,serial:scope.current.serial+1};generation.current++;}
  const key=`${context}:${scope.current.serial}`;
  useEffect(()=>{
    const current=++generation.current;
    if(user && user.role!=='ADMIN'){
      personalReportsApi.get(user.id,range).then(data=>{if(generation.current===current)setResult({key,data});})
        .catch(()=>{if(generation.current===current)setResult({key,error:'Kişisel rapor yüklenemedi. Tekrar deneyin.'});});
    }
    return()=>{generation.current++;};
  },[key]);
  if(user?.role==='ADMIN')return <AdminReports/>;
  if(!user)return <p>Rapor için giriş yapın.</p>;
  const current=result?.key===key?result:null;
  const data=current?.data;
  const cards=data?[
    ['Verilen referans',data.referralsGiven.count],['Alınan referans',data.referralsReceived.count],
    ['Tamamlanan birebir',data.meetingsCompleted],['Katılan ziyaretçi',data.visitorsHosted],
    ['Verilen referans iş hacmi',volume(data.referralsGiven)],['Alınan referans iş hacmi',volume(data.referralsReceived)],
    ['Kayıtlı eğitim saati',data.educationHours],
    ['Güncel kayıtlı performans',`${data.performance.score===null?'Bilinmiyor':data.performance.score+'/100'} · ${data.performance.color?colors[data.performance.color]:'Renk bilinmiyor'}`]
  ]:[];
  return <main className="max-w-7xl mx-auto p-6 space-y-6">
    <h1 className="text-2xl font-bold">Kişisel Aktivite Raporu</h1>
    <label htmlFor="report-range">Rapor dönemi </label>
    <select id="report-range" value={range} onChange={e=>setRange(e.target.value as ReportRange)} className="border rounded p-2">
      {Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
    {!current && <p role="status">Rapor yükleniyor…</p>}
    {current?.error && <div role="alert"><p>{current.error}</p><Button onClick={()=>setRevision(v=>v+1)}>Raporu tekrar yükle</Button></div>}
    {data && <>
      <p>{labels[range]} · {new Date(data.period.start).toLocaleString('tr-TR')} – {new Date(data.period.end).toLocaleString('tr-TR')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([title,value])=><Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{value}</CardContent></Card>)}</div>
      <p className="text-sm text-gray-600">Referanslar oluşturulma tarihine göre seçilir; sonuçları güncel durumlarını gösterir. İş hacmi yalnız başarılı referansların kayıtlı tutarıdır, tahsilat veya ödeme geliri değildir.</p>
      <p className="text-sm text-gray-600">Birebirler gerçekleşme, ziyaretçiler katılım, eğitimler tamamlanma tarihine göre sayılır. Görüşme talepleri tamamlanan görüşme sayılmaz. Güncel performans puanı seçilen dönemin ortalaması değildir.</p>
    </>}
  </main>;
}
