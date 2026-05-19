import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import { Calendar, MapPin, Clock, ArrowRight, Star, Sparkles, Image as ImageIcon } from 'lucide-react';

export function PublicEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents()
      .then((data: any) => {
        // Filter only public events
        const publicEvents = data.filter((e: any) => e.is_public);
        // Sort by date close to far
        publicEvents.sort((a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        setEvents(publicEvents);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white">
      <Helmet>
        <title>Etkinlikler | Event4Network</title>
        <meta name="description" content="Event4Network üye buluşmaları, fiziksel networking etkinlikleri, özel davetler ve yaklaşan etkinlik takvimini inceleyin." />
        <link rel="canonical" href="https://www.event4network.com/etkinlikler" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-24 bg-gray-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Buluşmalar ve Takvim
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Seçkin Etkinlikler ve Buluşmalar
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed font-light">
            Event4Network, üyelerini sadece düzenli toplantılarda değil; özel davetler, tematik fiziksel buluşmalar ve vizyoner etkinliklerde de bir araya getirir.
          </p>
        </div>
      </section>

      {/* Yaklaşan Etkinlikler */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12 border-b border-gray-100 pb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Yaklaşan Etkinlikler</h2>
              <p className="text-gray-500 mt-2">Önümüzdeki günlerde gerçekleşecek halka açık veya davetli buluşmalarımız.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
              <Calendar className="h-16 w-16 text-gray-350 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Planlanmış Yaklaşan Etkinlik Bulunmuyor</h3>
              <p className="text-gray-500 mt-2">En güncel davet ve buluşma takvimimiz için lütfen daha sonra tekrar ziyaret edin.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                  <div className="h-2 bg-gradient-to-r from-red-600 to-orange-500"></div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                        {event.event_type === 'NETWORKING' ? 'Networking' :
                         event.event_type === 'EDUCATION' ? 'Eğitim' : 'Özel Buluşma'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">{event.description}</p>

                    <div className="space-y-3 mb-8 mt-auto">
                      <div className="flex items-center text-sm text-gray-650">
                        <Calendar className="h-4 w-4 mr-3 text-red-500 flex-shrink-0" />
                        <span>{new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-650">
                        <Clock className="h-4 w-4 mr-3 text-red-500 flex-shrink-0" />
                        <span>{new Date(event.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-650">
                        <MapPin className="h-4 w-4 mr-3 text-red-500 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full justify-center text-gray-700 hover:text-red-600 hover:border-red-200 border-gray-200 transition-colors"
                      onClick={() => navigate(`/event/${event.id}`)}
                    >
                      Detayları Gör ve Katıl
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Özel Davetler ve Temalar */}
      <section className="py-24 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Formatlar</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Etkinlik Yapımız</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Özel Üye Davetleri</h3>
              <p className="text-gray-650 text-sm leading-relaxed">
                Sadece üyelerimiz ve onların özel davetlileri olan potansiyel referans ortakları için düzenlenen, kapalı kapılar ardında iş geliştirme hedeflerini konuşabildiğimiz seçkin buluşmalar.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fiziksel Networking Etkinlikleri</h3>
              <p className="text-gray-650 text-sm leading-relaxed">
                Farklı şehirlerde veya bölgelerde yer alan Event4Network gruplarının ortak katılımıyla düzenlenen genişletilmiş iş birliği ve sinerji günleri.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <ImageIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tematik Beyaz Yaka Buluşmaları</h3>
              <p className="text-gray-650 text-sm leading-relaxed">
                B2B hizmet ve kurumsal satın alım yapan karar vericilerin, belirli sektörel başlıkları tartışmak ve iş çevresi edinmek için katıldığı niş oturumlar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fotoğraf Galerisi */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900">Buluşmalarımızdan Kareler</h2>
            <p className="text-gray-500 mt-2">Etkinliklerimizde kurulan nitelikli diyaloglar ve profesyonel anlar.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 text-gray-400 text-sm">
              Görsel 1
            </div>
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 text-gray-400 text-sm">
              Görsel 2
            </div>
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 text-gray-400 text-sm">
              Görsel 3
            </div>
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 text-gray-400 text-sm">
              Görsel 4
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
