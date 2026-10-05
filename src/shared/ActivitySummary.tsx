import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { webActivitiesApi, WebActivity } from '../api/webActivities';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';

const headings = { one_to_one: 'Birebir görüşme kaydı', referral: 'İş yönlendirme kaydı', visitor: 'Ziyaretçi kaydı', attendance: 'Etkinlik kaydı' };
const statuses: Record<string, Record<string, string>> = {
  one_to_one: { PENDING: 'Yanıt bekliyor', ACCEPTED: 'Görüşme kabul edildi', REJECTED: 'Görüşme reddedildi', COMPLETED: 'Tamamlandı olarak kayıtlı' },
  referral: { PENDING: 'Bekliyor', ACCEPTED: 'Kabul edildi', REJECTED: 'Reddedildi', SUCCESSFUL: 'Başarılı olarak kayıtlı', FAILED: 'Başarısız olarak kayıtlı' },
  visitor: { INVITED: 'Davet edildi', ATTENDED: 'Katıldı olarak kayıtlı', JOINED: 'Üye oldu olarak kayıtlı' },
  attendance: { PRESENT: 'Katılım kaydı var', ABSENT: 'Katılmadı olarak kayıtlı', LATE: 'Geç katılım olarak kayıtlı', EXCUSED: 'Mazeretli olarak kayıtlı' },
};
const scheduledDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { const [y,m,d] = value.split('-').map(Number); return new Date(y,m-1,d); }
  return new Date(value);
};

export function ActivitySummary({ refreshVersion = 0 }: { refreshVersion?: number } = {}) {
  const { user, token } = useAuthStore();
  const [items, setItems] = useState<WebActivity[]>([]), [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null), [loadedFor, setLoadedFor] = useState<string | null>(null), [retry, setRetry] = useState(0);
  const context = `${user?.id}:${user?.role}:${token}:${refreshVersion}:${retry}`;
  const current = useRef(context); current.current = context;
  useEffect(() => {
    let active = true; const valid = () => active && current.current === context;
    setItems([]); setLoadedFor(null); setError(null); setLoading(true);
    if (!user?.id) { setLoading(false); return; }
    webActivitiesApi.read(user.id).then(rows => { if (valid()) { setItems(rows); setLoadedFor(context); } })
      .catch(() => { if (valid()) setError('Aktivite özeti yüklenemedi.'); }).finally(() => { if (valid()) setLoading(false); });
    return () => { active = false; };
  }, [context]);
  if (!user?.id) return <p>Aktiviteler için giriş yapın.</p>;
  const ready = loadedFor === context && !loading && !error;
  return <Card><CardHeader><CardTitle>Son aktivite kayıtları</CardTitle><p className="text-sm text-gray-600">En yeni 10 aktivite kaydı</p></CardHeader><CardContent>
    {!ready && !error ? <p role="status">Aktivite özeti yükleniyor...</p> : error ? <div role="alert"><p>{error}</p><Button onClick={() => setRetry(n => n + 1)}>Özeti tekrar yükle</Button></div>
      : items.length === 0 ? <p>Henüz bir aktivite kaydı bulunmuyor.</p> : <ul className="space-y-3">{items.map(item => <li key={`${item.type}:${item.id}`} className="border rounded p-3">
        <h3 className="font-semibold">{headings[item.type]}</h3>
        <p>{item.type === 'referral' ? `${item.direction === 'given' ? 'Gönderilen' : 'Alınan'} yönlendirme • ` : ''}{item.title || 'İsim bilgisi bulunmuyor'}</p>
        <p className="text-sm text-gray-700">{item.status ? statuses[item.type][item.status] || 'Kayıt durumu tanınmıyor' : 'Kayıt durumu belirtilmemiş'}</p>
        {item.scheduled_at && <p className="text-sm text-gray-600">İlgili gün: <time dateTime={item.scheduled_at}>{scheduledDate(item.scheduled_at).toLocaleDateString('tr-TR')}</time></p>}
        <p className="text-xs text-gray-600">Kayıt tarihi: <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('tr-TR')}</time></p>
        {item.event_id && <Link className="text-indigo-700 underline" to={`/event/${item.event_id}`}>Etkinlik detayını aç</Link>}
      </li>)}</ul>}
    <div className="mt-4 flex items-center justify-between"><Link className="text-indigo-700 underline" to="/activities">Aktivite panelini aç</Link><Button variant="outline" disabled={loading} onClick={() => setRetry(n => n + 1)}>Özeti yenile</Button></div>
  </CardContent></Card>;
}
