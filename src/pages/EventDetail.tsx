import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Button } from '../shared/Button';
import { Calendar, MapPin, Clock, Share2, Users, CheckCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        if (id) {
            loadEvent(id);
        }
    }, [id]);

    const loadEvent = async (eventId: string) => {
        setLoading(true);
        try {
            const data = await api.getEvent(eventId);
            setEvent(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!user) {
            navigate('/auth/login', { state: { from: `/event/${id}` } });
            return;
        }

        if (!window.confirm('Bu etkinliğe kayıt olmak istiyor musunuz?')) return;

        setRegistering(true);
        try {
            await api.registerForEvent(id!);
            setRegistered(true);
            alert('Kayıt başarılı!');
        } catch (error: any) {
            alert('Kayıt başarısız: ' + error.message);
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Etkinlik Bulunamadı</h2>
                <Button onClick={() => navigate(-1)}>Geri Dön</Button>
            </div>
        );
    }

    // Access control for private events
    if (!event.is_public && !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bu Etkinlik Üyelere Özeldir</h2>
                <p className="text-gray-600 mb-8 max-w-md">
                    Bu etkinliğin detaylarını görüntülemek için lütfen giriş yapın.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate('/')}>Ana Sayfa</Button>
                    <Button onClick={() => navigate('/auth/login', { state: { from: `/event/${id}` } })}>
                        Giriş Yap
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Section */}
            <div className="relative h-64 md:h-96 bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30 z-10"></div>
                {/* Fallback pattern if no image */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center"></div>

                <div className="absolute top-6 left-4 md:left-8 z-20">
                    <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5 mr-2" /> Geri
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20">
                    <div className="max-w-5xl mx-auto">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white mb-4">
                            {event.is_public ? 'Halka Açık' : 'Üyelere Özel'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-gray-200 text-sm md:text-base">
                            <div className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-red-500" />
                                {new Date(event.start_at).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-red-500" />
                                {new Date(event.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-red-500" />
                                {event.location}
                                {event.city && <span className="ml-1">- {event.city}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Etkinlik Hakkında</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>

                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Konuşmacılar</h3>
                                {/* Placeholder for speakers */}
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Murat Yılmaz</p>
                                        <p className="text-sm text-gray-500">Event 4 Network Kurucusu</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Katılımcılar ({event.attendees?.length || 0})</h3>
                                {event.attendees && event.attendees.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {event.attendees.map((attendee: any) => (
                                            <div key={attendee.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                    {attendee.avatar ? (
                                                        <img src={attendee.avatar} alt={attendee.name} className="h-full w-full rounded-full object-cover" />
                                                    ) : (
                                                        <span>{attendee.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{attendee.name}</p>
                                                    <p className="text-xs text-gray-500">{attendee.profession || 'Üye'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">Henüz katılımcı bulunmamaktadır.</p>
                                )}
                            </div>
                        </div>

                        {/* Location Map Placeholder */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Konum</h2>
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                                    <p>{event.location}</p>
                                    {event.city && <p className="text-sm text-gray-500">{event.city}</p>}
                                    <p className="text-xs mt-1">Harita yüklenemedi (API Key Gerekli)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-600">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Kayıt Ol</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Kontenjan</span>
                                    <span className="font-medium text-gray-900">Sınırlı Sayıda</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Ücret</span>
                                    <span className="font-bold text-gray-900">Ücretsiz</span>
                                </div>

                                {registered ? (
                                    <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                                        <CheckCircle className="h-4 w-4 mr-2" /> Kayıtlısınız
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        className="w-full shadow-md shadow-red-200"
                                        onClick={handleRegister}
                                        disabled={registering}
                                    >
                                        {registering ? 'İşleniyor...' : (user ? 'Hemen Kayıt Ol' : 'Giriş Yap ve Kayıt Ol')}
                                    </Button>
                                )}

                                <p className="text-xs text-center text-gray-400 mt-4">
                                    Kayıt olarak KVKK metnini kabul etmiş olursunuz.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Paylaş</h3>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="flex-1 border border-gray-200">
                                    <Share2 className="h-4 w-4 mr-2" /> Kopyala
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
