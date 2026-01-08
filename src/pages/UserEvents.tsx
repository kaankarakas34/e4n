
import { useEffect, useState } from 'react';
import { useEventStore } from '../stores/eventStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Calendar, MapPin, Users, Info, CheckCircle } from 'lucide-react';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';

import { useNavigate } from 'react-router-dom';

export function UserEvents() {
    const navigate = useNavigate();
    const { events, fetchEvents } = useEventStore();
    const { user } = useAuthStore();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [successMap, setSuccessMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleRegister = async (eventId: string) => {
        if (!window.confirm('Bu etkinliğe kayıt olmak istiyor musunuz?')) return;

        setLoadingMap(prev => ({ ...prev, [eventId]: true }));
        try {
            await api.registerForEvent(eventId);
            setSuccessMap(prev => ({ ...prev, [eventId]: true }));
            alert('Kayıt başarılı!');
        } catch (error: any) {
            let msg = error.message;
            try {
                const parsed = JSON.parse(msg);
                if (parsed.code === 'FE_RESTRICTION') {
                    msg = 'UYARI: Fırsat Eşitliği (FE) Kısıtlaması\n\nBu etkinlikte her meslek grubundan sadece bir kişi katılabilir. Sizin mesleğinizden başka bir üye zaten kayıtlı.';
                } else {
                    msg = parsed.error || msg;
                }
            } catch {
                // use original text
            }
            alert('İşlem Başarısız: ' + msg);
        } finally {
            setLoadingMap(prev => ({ ...prev, [eventId]: false }));
        }
    };

    // Only show PUBLISHED events for users (or events with no status for mock/legacy)
    const visibleEvents = events.filter(e => (e.status === 'PUBLISHED' || !e.status) && new Date(e.start_at) > new Date());

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Etkinlikler</h1>
                    <p className="mt-2 text-gray-600">Katılabileceğiniz güncel etkinlikler ve toplantılar.</p>
                </div>

                {visibleEvents.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Şu anda yaklaşan etkinlik bulunmamaktadır.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleEvents.map((event) => (
                            <Card key={event.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-red-600">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2 flex-wrap">
                                            <Badge className="bg-red-50 text-red-700 border border-red-100">
                                                {event.event_type === 'NETWORKING' ? 'Network' :
                                                    event.event_type === 'WORKSHOP' ? 'Atölye' :
                                                        event.event_type === 'SEMINAR' ? 'Seminer' :
                                                            event.event_type === 'CONFERENCE' ? 'Konferans' :
                                                                event.event_type === 'SOCIAL' ? 'Sosyal' : 'Etkinlik'}
                                            </Badge>
                                            {event.city && (
                                                <Badge className="bg-blue-50 text-blue-700 border border-blue-100">
                                                    {event.city}
                                                </Badge>
                                            )}
                                        </div>
                                        {event.has_equal_opportunity_badge && (
                                            <div className="flex" title="Fırsat Eşitliği: Her meslekten tek katılımcı">
                                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center">
                                                    <Info className="w-3 h-3 mr-1" />
                                                    FE
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl line-clamp-2 min-h-[56px]">{event.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-gray-600 text-sm line-clamp-3 min-h-[60px]">{event.description}</p>

                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                                            <div className="flex items-center text-gray-700">
                                                <Calendar className="h-4 w-4 mr-2 text-red-500" />
                                                <span className="font-medium">{new Date(event.start_at).toLocaleDateString('tr-TR')}</span>
                                                <span className="mx-1">•</span>
                                                <span>{new Date(event.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            <div className="flex items-center text-gray-700">
                                                <MapPin className="h-4 w-4 mr-2 text-red-500" />
                                                {event.location}
                                                {event.city && (
                                                    <span className="text-gray-500 ml-1">
                                                        / {event.city}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center text-gray-500">
                                                        <Users className="h-4 w-4 mr-2" />
                                                        {event.attendees?.length || 0} / {event.max_attendees || '∞'}
                                                    </div>
                                                    {event.max_attendees && (
                                                        <span className="text-xs text-red-600 font-medium ml-6">
                                                            Kalan: {Math.max(0, event.max_attendees - (event.attendees?.length || 0))}
                                                        </span>
                                                    )}
                                                </div>
                                                {event.price && event.price > 0 ? (
                                                    <span className="font-bold text-gray-900">{event.price} {event.currency}</span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">Ücretsiz</span>
                                                )}
                                            </div>
                                        </div>

                                        {event.has_equal_opportunity_badge && (
                                            <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-100">
                                                <strong>Fırsat Eşitliği Rozeti:</strong> Bu etkinlikte her meslek grubundan sadece bir kişi yer alabilir.
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => navigate(`/event/${event.id}`)}
                                            >
                                                Detaylar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
