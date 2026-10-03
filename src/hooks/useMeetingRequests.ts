import { useEffect, useRef, useState } from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';

export const meetingStatusLabel = (status: string) => ({ PENDING: 'Bekliyor', ACCEPTED: 'Onaylandı', REJECTED: 'Reddedildi', COMPLETED: 'Tamamlandı' }[status] ?? 'Bilinmeyen durum');
export function useMeetingRequests() {
  const { user } = useAuthStore();
  const context = `${user?.id}:${user?.role}`;
  const current = useRef(context); current.current = context;
  const active = useRef(true), sequence = useRef(0), lock = useRef<object | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [pendingFor, setPendingFor] = useState<string | null>(null);
  const [notice, setNotice] = useState<{context: string; text: string} | null>(null);
  const isCurrent = () => active.current && current.current === context && !!user?.id;
  const loadRequests = async () => {
    if (!isCurrent()) return;
    const version = ++sequence.current;
    const valid = () => isCurrent() && sequence.current === version;
    setLoading(true); setError(null);
    try {
      const data = await api.getMyMeetingRequests(user!.id);
      if (!Array.isArray(data) || data.some(r => !r || typeof r.id !== 'string' || !r.id.trim()
        || typeof r.status !== 'string' || typeof r.topic !== 'string'
        || !Number.isFinite(Date.parse(r.created_at)) || !Number.isFinite(Date.parse(r.proposedTime))
        || (r.senderId !== user!.id && r.receiverId !== user!.id))) throw new Error('Invalid meetings');
      if (valid()) setRequests([...data].sort((a,b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING') || Date.parse(b.created_at)-Date.parse(a.created_at)));
    } catch { if (valid()) setError('Toplantı talepleri yüklenemedi.'); }
    finally { if (valid()) { setLoading(false); setLoadedFor(context); } }
  };
  useEffect(() => {
    active.current = true; setNotice(null); setPendingFor(null);
    if (user?.id) void loadRequests();
    return () => { active.current = false; sequence.current++; };
  }, [user?.id, user?.role]);
  const renderSequence = sequence.current;
  const handleAction = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    const row = requests.find(r => r.id === id);
    if (!isCurrent() || lock.current || loading || error || loadedFor !== context || renderSequence !== sequence.current
      || !row || row.receiverId !== user!.id || row.status !== 'PENDING' || !['ACCEPTED','REJECTED'].includes(status)) return;
    const token = {}; lock.current = token; setPendingFor(context); setNotice(null);
    const version = sequence.current;
    try {
      const result = await api.updateMeetingStatus(id,status);
      if (!isCurrent() || version !== sequence.current) return;
      if (result?.success !== true || result.data?.id !== id || result.data?.partner_id !== user!.id || result.data?.status !== status) throw new Error('Unconfirmed status');
      setNotice({context,text:status === 'ACCEPTED' ? 'Toplantı talebi onaylandı.' : 'Toplantı talebi reddedildi.'});
      await loadRequests();
    } catch { if (isCurrent() && version === sequence.current) setNotice({context,text:'İşlem sonucu doğrulanamadı. Yeniden işlem yapmadan listeyi yenileyip kontrol edin.'}); }
    finally { if (lock.current === token) { lock.current = null; if (isCurrent()) setPendingFor(null); } }
  };
  const ready = loadedFor === context && !!user?.id;
  return { requests: ready && !loading && !error ? requests : [], loading: !!user?.id && (!ready || loading),
    error: ready ? error : null, notice: notice?.context === context ? notice.text : null,
    pending: pendingFor === context, loadRequests, handleAction };
}
