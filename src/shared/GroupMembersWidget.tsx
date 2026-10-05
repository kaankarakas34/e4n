import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { webGroupsApi, WebGroup } from '../api/webGroups';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';

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
  const meetings = group ? [...new Set(group.meeting_dates)].filter(d => meetingDate(d) >= today).sort((a, b) => meetingDate(a).getTime() - meetingDate(b).getTime()).slice(0, 3) : [];
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
          <h3 className="font-semibold">Gelecek toplantılar</h3>
          {meetings.length ? <ul className="space-y-2 my-3">{meetings.map(d => <li key={d}><time dateTime={d}>{meetingDate(d).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</time><p className="text-sm text-gray-600">{group.meeting_time || 'Saat belirtilmemiş'} • {group.is_online ? 'Online' : 'Online bağlantı belirtilmemiş'}</p></li>)}</ul> : <p>Gelecek toplantı tarihi bulunmuyor.</p>}
        </>}
        <Button variant="outline" onClick={() => setRetry(n => n + 1)}>Grupları yenile</Button>
      </>}
  </CardContent></Card>;
}
