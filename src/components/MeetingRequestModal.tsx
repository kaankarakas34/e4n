import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/api';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useAuthStore } from '../stores/authStore';
import { Calendar, Clock, X } from 'lucide-react';

interface Props {
    targetUser: any;
    onClose: () => void;
}

export function MeetingRequestModal({ targetUser, onClose }: Props) {
    const { user } = useAuthStore();
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const context = `${user?.id}:${user?.role}:${targetUser?.id}`;
    const current = useRef(context), generation = useRef(0), active = useRef(true), lock = useRef(false);
    if (current.current !== context) { current.current = context; generation.current++; }
    const retryKey = useRef<{ fingerprint: string; id: string } | null>(null);
    const renderGeneration = generation.current;
    useEffect(() => {
        active.current = true; setTopic(''); setDate(''); setTime(''); setError(null); setSending(false);
        return () => { active.current = false; generation.current++; };
    }, [context]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!active.current || lock.current || current.current !== context || renderGeneration !== generation.current || !user?.id || !targetUser?.id || targetUser.id === user.id) return;
        const scheduledAt = new Date(`${date}T${time}`);
        const [year, month, day] = date.split('-').map(Number);
        if (!topic.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
            || !Number.isFinite(scheduledAt.getTime()) || scheduledAt.getFullYear() !== year || scheduledAt.getMonth()+1 !== month || scheduledAt.getDate() !== day) {
            setError('Konu, tarih ve saati kontrol edin.'); return;
        }
        const fingerprint = JSON.stringify([context, topic.trim(), scheduledAt.toISOString()]);
        if (retryKey.current?.fingerprint !== fingerprint) retryKey.current = { fingerprint, id: crypto.randomUUID() };
        const version = generation.current;
        const isCurrent = () => active.current && current.current === context && version === generation.current;
        lock.current = true; setSending(true); setError(null);
        try {
            const row = await api.requestMeeting({ requestId: retryKey.current!.id,
                senderId: user.id, receiverId: targetUser.id, topic: topic.trim(), proposedTime: scheduledAt.toISOString() });
            if (!isCurrent()) return;
            if (row?.id !== retryKey.current!.id || row.requester_id !== user.id || row.partner_id !== targetUser.id) throw new Error('Unconfirmed request');
            onClose();
        } catch {
            if (isCurrent()) setError('Talep sonucu doğrulanamadı. Listeyi kontrol edin; aynı bilgilerle yeniden deneyebilirsiniz.');
        } finally { lock.current = false; if (isCurrent()) setSending(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                <button aria-label="Toplantı talebi penceresini kapat" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6">
                    <div className="flex items-center mb-6">
                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-4">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Toplantı Planla</h2>
                            <p className="text-sm text-gray-500">{targetUser.full_name || targetUser.name || targetUser.id} ile 1-e-1</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p role="alert">{error}</p>}
                        <div>
                            <label htmlFor="meeting-request-topic" className="block text-sm font-medium text-gray-700 mb-1">Toplantı Konusu</label>
                            <Input
                                id="meeting-request-topic"
                                disabled={sending}
                                required
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="Örn: İş birliği fırsatları"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="meeting-request-date" className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                                <Input
                                    id="meeting-request-date"
                                    disabled={sending}
                                    required
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label htmlFor="meeting-request-time" className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                                <Input
                                    id="meeting-request-time"
                                    disabled={sending}
                                    required
                                    type="time"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg flex items-start text-xs text-blue-700">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <p>
                                Onaylanan talebin takvim bağlantısını Toplantı Talepleri ekranından açabilirsiniz. Talep kaydı gerçekleşmiş görüşme veya puan kaydı değildir.
                            </p>
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={sending}>
                                {sending ? 'Gönderiliyor...' : 'İsteği Gönder'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
