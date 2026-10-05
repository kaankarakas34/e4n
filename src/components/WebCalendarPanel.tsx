import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { webCalendarApi, WebCalendarItem } from '../api/webCalendar';
import { calendarDay, calendarRange } from '../utils/calendarDates';
import { Calendar } from '../shared/Calendar';
import { Button } from '../shared/Button';

export function WebCalendarPanel({ refreshVersion = 0 }: { refreshVersion?: number }) {
  const { user, token } = useAuthStore();
  const [month, setMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const [selected, setSelected] = useState(() => calendarDay(new Date()));
  const [items, setItems] = useState<WebCalendarItem[]>([]);
  const [loading, setLoading] = useState(false), [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null), [retry, setRetry] = useState(0);
  const range = calendarRange(month);
  const context = `${user?.id}:${user?.role}:${token}:${range.from}:${range.to}:${refreshVersion}:${retry}`;
  const current = useRef(context); current.current = context;
  useEffect(() => {
    let active = true;
    const valid = () => active && current.current === context;
    setLoading(true); setError(null); setLoadedFor(null); setItems([]);
    if (!user?.id) { setLoading(false); return; }
    webCalendarApi.read(user.id, range.from, range.to).then(rows => {
      if (valid()) { setItems(rows); setLoadedFor(context); }
    }).catch(() => { if (valid()) setError('Aktivite takvimi yüklenemedi.'); })
      .finally(() => { if (valid()) setLoading(false); });
    return () => { active = false; };
  }, [context]);
  const ready = loadedFor === context && !error && !loading;
  const visible = ready ? items : [];
  const dayItems = visible.filter(item => calendarDay(new Date(item.start_at)) === selected);
  const monthChanged = (value: Date) => { setMonth(value); setSelected(calendarDay(value)); };
  if (!user?.id) return <p>Takviminizi görmek için giriş yapın.</p>;
  return <section aria-label="Aktivite takvimi">
    <Calendar month={month} selectedDate={selected} onMonthChange={monthChanged} onSelectDate={setSelected}
      events={visible.map(item => ({ date: calendarDay(new Date(item.start_at)), type: item.type, title: item.title }))} />
    <div className="mt-4 flex items-center justify-between"><h3 className="font-semibold">{selected.split('-').reverse().join('.')} — Günün programı</h3>
      <Button variant="outline" disabled={loading} onClick={() => setRetry(value => value + 1)}>Takvimi yenile</Button></div>
    {loading || (!error && !ready) ? <p role="status" className="mt-3">Takvim yükleniyor...</p> : error ? <div role="alert" className="mt-3"><p>{error}</p><Button onClick={() => setRetry(value => value + 1)}>Takvimi tekrar yükle</Button></div>
      : dayItems.length === 0 ? <p className="mt-3 text-gray-600">Bu gün için kayıt bulunmuyor.</p>
      : <ul className="mt-3 space-y-2">{dayItems.map(item => <li key={`${item.type}:${item.id}`} className="rounded border p-3">
        <span className="text-sm text-gray-600 mr-2">{new Date(item.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
        {item.type === 'meeting' ? <Link className="text-indigo-700 underline" to={`/event/${item.id}`}>{item.title}</Link> : <span>{item.title}</span>}
        {item.location && <p className="text-sm text-gray-600">{item.location}</p>}
      </li>)}</ul>}
  </section>;
}
