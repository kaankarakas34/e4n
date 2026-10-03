import { useState } from 'react';
import { useMeetingRequests, meetingStatusLabel } from '../hooks/useMeetingRequests';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Calendar, Clock, User, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export function MeetingRequestsList() {
    const { user } = useAuthStore();
    const { requests, loading, error, notice, pending, loadRequests, handleAction } = useMeetingRequests();
    const [isExpanded, setIsExpanded] = useState(true);
    if (!user?.id) return <p>Toplantı talepleri için giriş yapın.</p>;
    if (loading || error) return <div><p role="status">{notice}</p>{loading ? <p role="status">Toplantı talepleri yükleniyor...</p> : <p role="alert">{error}</p>}<Button disabled={loading || pending} onClick={loadRequests}>Tekrar yükle</Button></div>;


    if (requests.length === 0) {
        return (
            <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                        <Calendar className="h-8 w-8 text-indigo-400" />
                    </div>
                    {notice && <p role="status">{notice}</p>}
                    <h3 className="text-lg font-medium text-gray-900">Toplantı Talebi Yok</h3>
                    <p className="max-w-sm mt-2 text-sm text-gray-500">
                        Şu anda bekleyen veya onaylanmış bir toplantı talebiniz bulunmuyor. Yeni iş birlikleri için "Birebir Görüşme" butonunu kullanarak ilk adımı atabilirsiniz.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            {notice && <p role="status">{notice}</p>}
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
                    Toplantı Talepleri
                    {requests.some(r => r.status === 'PENDING' && r.receiverId === user?.id) && (
                        <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full animate-pulse">
                            Yeni
                        </span>
                    )}
                </CardTitle>
                <button aria-label={isExpanded ? 'Toplantı listesini daralt' : 'Toplantı listesini genişlet'} aria-expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    <div className="space-y-3">
                        {requests.map((req) => {
                            const isIncoming = req.receiverId === user?.id;

                            return (
                                <div key={req.id} className={`border rounded-lg p-3 ${req.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">{req.topic}</h4>
                                            <p className="text-xs text-gray-500 flex items-center mt-1">
                                                <User className="h-3 w-3 mr-1" />
                                                {isIncoming ? req.senderName : `Alıcı: ${req.receiverName || req.receiverId}`}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center mt-1">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {new Date(req.proposedTime).toLocaleString('tr-TR')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${req.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
                                                req.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {meetingStatusLabel(req.status)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-2">
                                        {isIncoming && req.status === 'PENDING' && (
                                            <>
                                                <Button size="sm" className="flex-1 bg-green-600 text-white h-7 text-xs" disabled={pending} onClick={() => handleAction(req.id, 'ACCEPTED')}>
                                                    Kabul
                                                </Button>
                                                <Button size="sm" variant="outline" className="flex-1 text-red-600 h-7 text-xs" disabled={pending} onClick={() => handleAction(req.id, 'REJECTED')}>
                                                    Red
                                                </Button>
                                            </>
                                        )}
                                        {req.status === 'ACCEPTED' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full h-7 text-xs"
                                                onClick={() => {
                                                    const link = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(req.topic)}&dates=${new Date(req.proposedTime).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(req.proposedTime).getTime() + (60 * 60000)).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent('Event 4 Network Toplantısı')}`;
                                                    window.open(link, '_blank');
                                                }}
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                Takvime Ekle
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
