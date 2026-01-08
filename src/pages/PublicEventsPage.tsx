
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { Logo } from '../shared/Logo';
import { api } from '../api/api';
import { Calendar, MapPin, Clock, ArrowLeft } from 'lucide-react';

export function PublicEventsPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getEvents().then((data: any) => {
            // Filter only public events
            const publicEvents = data.filter((e: any) => e.is_public);
            // Sort by date close to far
            publicEvents.sort((a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
            setEvents(publicEvents);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="fixed w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <Logo className="h-10 w-auto" />
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            <button onClick={() => navigate('/')} className="text-gray-600 hover:text-red-600 font-medium transition-colors flex items-center">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Ana Sayfaya Dön
                            </button>
                        </nav>
                        <div className="flex items-center gap-4">
                            <Button variant="primary" onClick={() => navigate('/auth/login')}>Giriş Yap</Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-red-600 font-semibold tracking-wide uppercase text-sm">Takvim</span>
                    <h1 className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">Etkinlik Takvimi</h1>
                    <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                        İş ağınızı genişletebileceğiniz, yeni fırsatlar yakalayabileceğiniz tüm etkinliklerimiz.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Şu an planlanmış etkinlik bulunmuyor</h3>
                        <p className="text-gray-500 mt-2">Lütfen daha sonra tekrar kontrol edin.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                                <div className="h-2 bg-gradient-to-r from-red-600 to-orange-500"></div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.event_type === 'NETWORKING' ? 'bg-blue-100 text-blue-800' :
                                                event.event_type === 'EDUCATION' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {event.event_type === 'NETWORKING' ? 'Network' :
                                                event.event_type === 'EDUCATION' ? 'Eğitim' : 'Etkinlik'}
                                        </span>
                                        {event.has_equal_opportunity_badge && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200" title="Her meslekten tek kişi">
                                                Fırsat Eşitliği
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>

                                    <div className="space-y-3 mb-6 flex-1">
                                        <div className="flex items-start text-sm text-gray-600">
                                            <Calendar className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
                                            <span>{new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-start text-sm text-gray-600">
                                            <Clock className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
                                            <span>{new Date(event.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-start text-sm text-gray-600">
                                            <MapPin className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
                                            <span className="line-clamp-2">{event.location}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                                        <Button
                                            className="w-full justify-center shadow-lg shadow-red-100 hover:shadow-red-200"
                                            onClick={() => navigate('/auth/register')}
                                        >
                                            Katılım İçin Kaydol
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <Logo className="h-8 w-auto mx-auto mb-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                    <p className="text-gray-500 text-sm">
                        &copy; 2024 Event 4 Network. Tüm hakları saklıdır.
                    </p>
                </div>
            </footer>
        </div>
    );
}
