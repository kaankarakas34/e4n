
import { useEffect, useState } from 'react';
import { EventItem, useEventStore } from '../stores/eventStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Calendar, MapPin, Users, Info, CheckCircle, Pin } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

import { useNavigate } from 'react-router-dom';
import { readEventPrice, readEventCurrency, formatEventPrice } from '../utils/eventPrice';
import { readParticipantCount } from '../utils/eventParticipants';

const attendanceCount = (event: EventItem) => readParticipantCount(event.attendees_count);
const eventCapacity = (event: EventItem) => Number.isSafeInteger(event.max_attendees) && event.max_attendees! > 0 ? event.max_attendees! : null;

export function UserEvents() {
    const navigate = useNavigate();
    const { events, fetchEvents, readLoading, readError, loadedFor } = useEventStore();
    const { user } = useAuthStore();

    const [filterTab, setFilterTab] = useState<'all' | 'attending'>('all');

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents, user?.id, user?.role]);


    // Event visibility: 
    // - Regular User: PUBLISHED only. Show until it ends.
    // - Admin: ALL events (so they can see their work immediately).
    const visibleEvents = events.filter(e => {
        const isAdmin = user?.role === 'ADMIN';
        const isPublished = e.status === 'PUBLISHED' || !e.status;
        const endTime = e.end_at ? new Date(e.end_at) : new Date(e.start_at);
        const isUpcomingOrOngoing = endTime > new Date();

        if (isAdmin) return true; // Admins see everything
        return isPublished && isUpcomingOrOngoing;
    });

    const attendanceKnown = !!user?.id && visibleEvents.every(e => typeof e.is_registered === 'boolean');
    const attendingEvents = attendanceKnown
        ? visibleEvents.filter(e => e.is_registered === true)
        : [];
    const displayEvents = filterTab === 'all' ? visibleEvents : attendingEvents;

    if (readError) return <div role="alert" className="p-8"><p>{readError}</p><Button onClick={() => fetchEvents()}>Tekrar dene</Button></div>;
    if (readLoading || loadedFor !== `${user?.id}:${user?.role}`) return <p role="status" className="p-8">Etkinlikler yükleniyor...</p>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Etkinlikler</h1>
                    <p className="mt-2 text-gray-650">Katılabileceğiniz güncel etkinlikler ve toplantılar.</p>
                    <Button variant="outline" onClick={() => fetchEvents()}>Etkinlikleri yenile</Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-3">
                    <button
                        onClick={() => setFilterTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            filterTab === 'all'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-250'
                        }`}
                    >
                        Tüm Etkinlikler
                    </button>
                    <button
                        onClick={() => setFilterTab('attending')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            filterTab === 'attending'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-250'
                        }`}
                    >
                        Katılacağım Etkinlikler ({attendanceKnown ? attendingEvents.length : 'Bilinmiyor'})
                    </button>
                </div>

                {filterTab === 'attending' && !attendanceKnown ? (
                    <div role="alert" className="p-6 bg-white rounded-lg">
                        <p>{user?.id ? 'Etkinlik kayıtlarınız doğrulanamadı.' : 'Etkinlik kayıtlarınızı görmek için giriş yapın.'}</p>
                        {user?.id && <Button onClick={() => fetchEvents()}>Tekrar dene</Button>}
                    </div>
                ) : displayEvents.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-505">
                                {filterTab === 'attending' 
                                    ? 'Kayıt olduğunuz yaklaşan bir etkinlik bulunmamaktadır.' 
                                    : 'Şu anda yaklaşan etkinlik bulunmamaktadır.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayEvents.map((event) => {
                            const count = attendanceCount(event);
                            const capacity = eventCapacity(event);
                            const remaining = count !== null && capacity !== null && count <= capacity ? capacity - count : null;
                            const price = readEventPrice(event.price);
                            const currency = readEventCurrency(event.currency);
                            return (
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
                                             {event.status === 'DRAFT' && user?.role === 'ADMIN' && (
                                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                    TASLAK (GİZLİ)
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
                                    <CardTitle className="text-xl line-clamp-2 min-h-[56px] flex items-start">
                                        {event.pinned && <Pin className="h-5 w-5 mr-2 text-red-600 rotate-45 shrink-0 mt-1" fill="currentColor" />}
                                        {event.title}
                                    </CardTitle>
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
                                                        {count ?? 'Bilinmiyor'} / {capacity ?? 'Bilinmiyor'}
                                                    </div>
                                                    {capacity !== null && (
                                                        <span className="text-xs text-red-600 font-medium ml-6">
                                                            Kalan: {remaining ?? 'Bilinmiyor'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={price === 0 ? 'text-green-600 font-medium' : 'font-bold text-gray-900'}>{formatEventPrice(price, currency)}</span>
                                            </div>
                                        </div>

                                        {event.has_equal_opportunity_badge && (
                                            <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-100">
                                                <strong>Fırsat Eşitliği Rozeti:</strong> Bu etkinlikte her meslek grubundan sadece bir kişi yer alabilir.
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            {event.is_registered === true && <p className="text-green-700 flex items-center mb-2"><CheckCircle className="h-4 w-4 mr-2" />Kayıtlısınız</p>}
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
                        ); })}
                    </div>
                )}
            </div>
        </div>
    );
}
