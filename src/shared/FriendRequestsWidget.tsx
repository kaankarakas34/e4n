import { useEffect, useState, useRef } from 'react';
import { connectionsApi, type ConnectionRequest } from '../api/connections';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { UserPlus, Check, X, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export function FriendRequestsWidget() {
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    const scope = `${user?.id ?? ''}:${token ?? ''}`;
    const current = useRef(scope); current.current = scope;
    const generation = useRef(0), lock = useRef(false);
    const [snapshot, setSnapshot] = useState<{ scope: string; rows: ConnectionRequest[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        const epoch = ++generation.current;
        lock.current = false; setBusy(false); setSnapshot(null); setError(''); setLoading(true);
        if (!user?.id || !token) { setLoading(false); return; }
        connectionsApi.incoming(user.id).then(rows => {
            if (epoch === generation.current && current.current === scope) setSnapshot({ scope, rows });
        }).catch(() => { if (epoch === generation.current && current.current === scope) setError('Bağlantı istekleri yüklenemedi.'); })
          .finally(() => { if (epoch === generation.current && current.current === scope) setLoading(false); });
        return () => { generation.current++; };
    }, [scope, retry]);
    const requests = snapshot?.scope === scope ? snapshot.rows : [];
    const decide = async (senderId: string, action: 'accept' | 'reject') => {
        if (!user?.id || lock.current || snapshot?.scope !== scope) return;
        const epoch = generation.current;
        lock.current = true; setBusy(true); setError('');
        try {
            await connectionsApi.mutate(user.id, senderId, action);
            if (epoch !== generation.current || current.current !== scope) return;
            setSnapshot(null); setLoading(true);
            const rows = await connectionsApi.incoming(user.id);
            if (epoch === generation.current && current.current === scope) setSnapshot({ scope, rows });
        } catch { if (epoch === generation.current && current.current === scope) setError('İşlem veya güncel istekler okunamadı. Durumu yenileyin.'); }
        finally { if (epoch === generation.current && current.current === scope) { lock.current = false; setBusy(false); setLoading(false); } }
    };
    const handleAccept = (senderId: string) => decide(senderId, 'accept');
    const handleReject = (senderId: string) => decide(senderId, 'reject');
    if (!user || !token) return null;

    return (
        <Card className="border-indigo-100 bg-indigo-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold flex items-center text-indigo-900">
                    <UserPlus className="h-5 w-5 mr-2 text-indigo-600" />
                    Arkadaşlık İstekleri
                    <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading && <p role="status">Yükleniyor...</p>}
                {error && <div role="alert">{error} <Button disabled={busy} onClick={() => setRetry(n => n + 1)}>Tekrar Dene</Button></div>}
                {!loading && !error && requests.length === 0 && <p className="text-sm text-gray-500">Bekleyen bağlantı isteği yok.</p>}
                <div className="space-y-3">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/profile/${req.sender_id}`)}>
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline">
                                            {req.sender_name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{req.sender_profession}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                                <Button size="sm" disabled={busy || loading} onClick={() => handleAccept(req.sender_id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
                                    <Check className="h-3 w-3 mr-1" /> Kabul Et
                                </Button>
                                <Button size="sm" disabled={busy || loading} variant="outline" onClick={() => handleReject(req.sender_id)} className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 h-8 text-xs">
                                    <X className="h-3 w-3 mr-1" /> Reddet
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
