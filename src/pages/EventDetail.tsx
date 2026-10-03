import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Button } from '../shared/Button';
import { Calendar, MapPin, Clock, Share2, Users, CheckCircle, ArrowLeft, ShieldAlert, Video } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';

export function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const loadSequence = useRef(0);
    const registrationPending = useRef(false);
    const contextSequence = useRef(0);
    const pageActive = useRef(true);
    const [registrationError, setRegistrationError] = useState<string | null>(null);

    useEffect(() => {
        pageActive.current = true;
        setRegistrationError(null);
        setIsPaymentModalOpen(false);
        if (id) {
            loadEvent(id);
        }
        return () => { loadSequence.current++; contextSequence.current++; pageActive.current = false; };
    }, [id, user?.id, user?.role]);

    const loadEvent = async (eventId: string) => {
        const sequence = ++loadSequence.current;
        setLoading(true);
        setLoadError(null);
        setEvent(null);
        setRegistered(false);
        try {
            const data = await api.getEvent(eventId);
            if (sequence !== loadSequence.current) return;
            if (!data || data.id !== eventId || (data.attendees != null && !Array.isArray(data.attendees))) {
                throw new Error('Invalid event response');
            }
            setEvent(data);
            if (user && data.attendees?.some((att: any) => att.id === user.id)) {
                setRegistered(true);
            } else {
                setRegistered(false);
            }
        } catch (e) {
            if (sequence === loadSequence.current) setLoadError('Etkinlik bilgileri yüklenemedi.');
        } finally {
            if (sequence === loadSequence.current) setLoading(false);
        }
    };

    useEffect(() => {
        if (event && user) {
            const isReg = event.attendees?.some((att: any) => att.id === user.id);
            setRegistered(!!isReg);
        } else {
            setRegistered(false);
        }
    }, [event, user]);

    const handlePaymentSuccess = async () => {
        if (!id || !user) return;
        setIsPaymentModalOpen(false);
        setRegistering(true);
        alert('Ödeme bildirimi alındı. Güncel etkinlik kaydınızı kontrol edin.');
        try {
            // The recorded payment action is applied by the server callback.
            await loadEvent(id);
        } finally {
            setRegistering(false);
        }
    };

    const handleRegister = async () => {
        if (registrationPending.current || registering || loading || !event || event.id !== id || registered) return;
        if (!user) {
            navigate('/auth/login', { state: { from: `/event/${id}` } });
            return;
        }

        if (event.price && Number(event.price) > 0) {
            setIsPaymentModalOpen(true);
            return;
        }

        if (!window.confirm('Bu etkinliğe kayıt olmak istiyor musunuz?')) return;

        registrationPending.current = true;
        const context = contextSequence.current;
        setRegistering(true);
        setRegistrationError(null);
        try {
            const result = await api.registerForEvent(id!);
            if (!pageActive.current || context !== contextSequence.current) return;
            if (!result || result.success !== true) throw new Error('Invalid event registration response');
            setRegistered(true);
            alert('Etkinlik kaydınız doğrulandı.');
        } catch {
            if (pageActive.current && context === contextSequence.current) {
                setRegistrationError('Kayıt sonucu doğrulanamadı. Yeniden göndermeden mevcut kaydınızı kontrol edin.');
            }
        } finally {
            registrationPending.current = false;
            if (pageActive.current) setRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div role="status" aria-label="Etkinlik yükleniyor" className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div role="alert" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <p>{loadError}</p>
                <Button onClick={() => id && loadEvent(id)}>Tekrar dene</Button>
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

    const eventSchema = event ? {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.title,
        "description": event.description || event.title,
        "startDate": event.start_at,
        "endDate": event.end_at || event.start_at,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": event.is_online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
        "location": event.is_online
            ? {
                "@type": "VirtualLocation",
                "url": event.location && event.location.startsWith('http') ? event.location : "https://www.event4network.com"
            }
            : {
                "@type": "Place",
                "name": event.location || "Event4Network Etkinlik Alanı",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": event.city || "İstanbul",
                    "addressCountry": "TR"
                }
            },
        "organizer": {
            "@type": "Organization",
            "name": "Event4Network",
            "url": "https://www.event4network.com"
        }
    } : undefined;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {registrationError && <div role="alert" className="p-4 bg-red-50 text-red-700">{registrationError}</div>}
            <SEO
                title={`${event.title} | Event4Network Etkinlik`}
                description={event.description ? event.description.slice(0, 150) : event.title}
                canonical={`https://www.event4network.com/event/${id}`}
                schema={eventSchema}
            />
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


                        </div>

                        {/* Location Section */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Konum</h2>
                            <div className="flex items-center space-x-3 p-4 rounded-lg bg-red-50 border border-red-100">
                                {event.is_online ? (
                                    <Video className="h-6 w-6 text-red-600 flex-shrink-0" />
                                ) : (
                                    <MapPin className="h-6 w-6 text-red-600 flex-shrink-0" />
                                )}
                                <div>
                                    {event.is_online ? (
                                        event.location && (event.location.startsWith('http://') || event.location.startsWith('https://')) ? (
                                            <a
                                                href={event.location}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                                            >
                                                Online / Zoom Meeting
                                            </a>
                                        ) : (
                                            <span className="font-medium text-gray-900">
                                                Online / Zoom Meeting
                                            </span>
                                        )
                                    ) : (
                                        <>
                                            <a
                                                href={event.location && (event.location.startsWith('http://') || event.location.startsWith('https://'))
                                                    ? event.location
                                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((event.location || '') + (event.city ? ', ' + event.city : ''))}`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                                            >
                                                Etkinlik konumu için tıklayınız
                                            </a>
                                            {event.location && !event.location.startsWith('http') && (
                                                <p className="text-xs text-gray-500 mt-0.5">({event.location})</p>
                                            )}
                                        </>
                                    )}
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

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                planTitle={event?.title || ''}
                amount={Number(event?.price) || 0}
                onSuccess={handlePaymentSuccess}
                action={{
                    type: 'event_registration',
                    data: {
                        event_id: id,
                        user_id: user?.id
                    }
                }}
            />
        </div>
    );
}
