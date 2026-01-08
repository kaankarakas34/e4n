import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Calendar, Clock, User, Check, X, ExternalLink, RefreshCw } from 'lucide-react';

export function MeetingRequests() {
    const { user } = useAuthStore();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, [user]);

    const loadRequests = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await api.getMyMeetingRequests(user.id);
            // Sort: Pending first, then by date
            const sorted = data.sort((a: any, b: any) => {
                if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setRequests(sorted);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
        try {
            await api.updateMeetingStatus(id, status);
            await loadRequests();
            alert(status === 'ACCEPTED' ? 'Toplantı onaylandı ve takvim linki mail olarak gönderildi.' : 'Toplantı reddedildi.');
        } catch (e) {
            alert('İşlem sırasında hata oluştu.');
        }
    };

    if (loading) return <div className="p-4 text-center">Yükleniyor...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Calendar className="mr-3 h-8 w-8 text-indigo-600" />
                    Toplantı Talepleri
                </h1>
                <Button variant="outline" size="sm" onClick={loadRequests}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Yenile
                </Button>
            </div>

            <div className="space-y-4">
                {requests.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            Henüz bir toplantı talebi bulunmuyor.
                        </CardContent>
                    </Card>
                ) : (
                    requests.map((req) => {
                        const isIncoming = req.receiverId === user?.id;
                        const otherPartyName = isIncoming ? req.senderName : 'Siz'; // Simplified for outgoing

                        return (
                            <Card key={req.id} className={`border-l-4 ${req.status === 'PENDING' ? 'border-l-yellow-400' : req.status === 'ACCEPTED' ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        req.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {req.status === 'PENDING' ? 'Bekliyor' : req.status === 'ACCEPTED' ? 'Onaylandı' : 'Reddedildi'}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {isIncoming ? 'Gelen İstek' : 'Giden İstek'}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{req.topic}</h3>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-1 text-gray-400" />
                                                    {isIncoming ? `İsteyen: ${req.senderName}` : `Alıcı: (ID: ${req.receiverId})`}
                                                </div>
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                                    {new Date(req.proposedTime).toLocaleDateString('tr-TR')}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                                    {new Date(req.proposedTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 w-full md:w-auto">
                                            {isIncoming && req.status === 'PENDING' && (
                                                <>
                                                    <Button
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => handleAction(req.id, 'ACCEPTED')}
                                                    >
                                                        <Check className="h-4 w-4 md:mr-2" />
                                                        <span className="md:inline">Kabul Et</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                                    >
                                                        <X className="h-4 w-4 md:mr-2" />
                                                        <span className="md:inline">Reddet</span>
                                                    </Button>
                                                </>
                                            )}

                                            {req.status === 'ACCEPTED' && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        const link = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(req.topic)}&dates=${new Date(req.proposedTime).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(req.proposedTime).getTime() + (60 * 60000)).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent('Event 4 Network Toplantısı')}`;
                                                        window.open(link, '_blank');
                                                    }}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Takvime Ekle
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
