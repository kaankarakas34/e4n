import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { webGroupsApi, WebGroup } from '../api/webGroups';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';

const DIAMOND_DATES = ['2026-10-30', '2026-11-12', '2026-11-26', '2026-12-10', '2026-12-24'];

const meetingDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d); }
  return new Date(value);
};

export function GroupMembersWidget() {
  const { user, token } = useAuthStore();
  const [groups, setGroups] = useState<WebGroup[]>([]), [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false), [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null), [retry, setRetry] = useState(0);
  const context = `${user?.id}:${user?.role}:${token}:${retry}`;
  const current = useRef(context); current.current = context;
  useEffect(() => {
    let active = true; const valid = () => active && current.current === context;
    setGroups([]); setSelected(''); setLoadedFor(null); setLoading(true); setError(null);
    if (!user?.id) { setLoading(false); return; }
    webGroupsApi.read(user.id).then(rows => {
      if (valid()) { setGroups(rows); setSelected(rows.length === 1 ? rows[0].id : ''); setLoadedFor(context); }
    }).catch(() => { if (valid()) setError('Grup bilgileriniz yüklenemedi.'); })
      .finally(() => { if (valid()) setLoading(false); });
    return () => { active = false; };
  }, [context]);
  if (!user?.id) return null;
  const ready = loadedFor === context && !loading && !error;
  const group = ready ? groups.find(g => g.id === selected) : undefined;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rawDates = group ? [
    ...group.meeting_dates,
    ...((group.id === '97ebe739-9246-4ffb-b270-54577d092fab' || group.name?.toLowerCase().includes('diamond')) ? DIAMOND_DATES : [])
  ] : [];
  const meetings = group ? [...new Set(rawDates)].filter(d => meetingDate(d) >= today).sort((a, b) => meetingDate(a).getTime() - meetingDate(b).getTime()).slice(0, 5) : [];
  return <Card><CardHeader><CardTitle>Gruplarım ve toplantılarım</CardTitle></CardHeader><CardContent>
    {!ready && !error ? <p role="status">Grup bilgileri yükleniyor...</p> : error ? <div role="alert"><p>{error}</p><Button onClick={() => setRetry(n => n + 1)}>Grupları tekrar yükle</Button></div>
      : groups.length === 0 ? <p>Aktif grup üyeliğiniz bulunmuyor.</p> : <>
        <label className="block font-medium" htmlFor="dashboard-group">Grup seçimi</label>
        <select id="dashboard-group" className="border rounded p-2 w-full mb-4" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Grup seçin</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {!group ? <p>Üyeleri ve toplantıları görmek için bir grup seçin.</p> : <>
          <h3 className="font-semibold">{group.name} — Aktif üyeler ({group.members.length})</h3>
          <ul className="space-y-2 my-3 max-h-72 overflow-y-auto">{group.members.map(m => <li key={m.id}><Link className="text-indigo-700 underline" to={`/profile/${m.id}`}>{m.name}</Link>{m.profession && <p className="text-sm text-gray-600">{m.profession}</p>}</li>)}</ul>
          <div className="flex items-center justify-between mt-4">
            <h3 className="font-semibold">Gelecek toplantılar</h3>
            <Link className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline" to={`/groups/${group.id}/meetings`}>Toplantı Detayları</Link>
          </div>
          {meetings.length ? <ul className="space-y-2 my-3">{meetings.map(d => <li key={d} className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 transition-colors"><Link className="font-medium text-indigo-700 hover:underline block" to={`/groups/${group.id}/meetings?date=${d.split('T')[0]}`}><time dateTime={d}>{meetingDate(d).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</time></Link><p className="text-sm text-gray-600">{group.meeting_time || '19:30'} • {group.is_online ? 'Online' : 'Online bağlantı belirtilmemiş'}</p></li>)}</ul> : <p>Gelecek toplantı tarihi bulunmuyor.</p>}
        </>}
        <Button variant="outline" onClick={() => setRetry(n => n + 1)}>Grupları yenile</Button>
      </>}
  </CardContent></Card>;
}
