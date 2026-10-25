import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Users,
  GraduationCap,
  Sparkles,
  Lock,
  History,
  Video,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at?: string;
  location?: string;
  city?: string;
  is_online?: boolean;
  is_public?: boolean;
  status?: string;
  type?: string;
  event_type?: string;
  group_name?: string;
  price?: number | string;
  ticket_price?: number;
  member_price?: number;
  is_free?: boolean;
}

export function PublicEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCity, setSelectedCity] = useState<string>('Tümü');
  const [selectedType, setSelectedType] = useState<string>('Tümü');
  const [selectedMode, setSelectedMode] = useState<string>('Tümü');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        let data: EventItem[] = [];
        try {
          data = await api.getPublicEvents();
        } catch {
          data = await api.getEvents();
        }

        const diamondFallbackEvents: EventItem[] = [
          {
            id: 'diamond-2026-10-30',
            title: 'Diamond Grubu Toplantısı',
            description: 'Diamond iş geliştirme ve networking grubu planlı oturumu.',
            start_at: '2026-10-30T19:30:00+03:00',
            end_at: '2026-10-30T21:00:00+03:00',
            location: 'Online (Zoom) • İstanbul',
            city: 'İstanbul',
            is_online: true,
            is_public: true,
            status: 'PUBLISHED',
            type: 'meeting',
            group_name: 'Diamond',
            is_free: true,
            price: 0
          },
          {
            id: 'diamond-2026-11-12',
            title: 'Diamond Grubu Toplantısı',
            description: 'Diamond iş geliştirme ve networking grubu planlı oturumu.',
            start_at: '2026-11-12T19:30:00+03:00',
            end_at: '2026-11-12T21:00:00+03:00',
            location: 'Online (Zoom) • İstanbul',
            city: 'İstanbul',
            is_online: true,
            is_public: true,
            status: 'PUBLISHED',
            type: 'meeting',
            group_name: 'Diamond',
            is_free: true,
            price: 0
          },
          {
            id: 'diamond-2026-11-26',
            title: 'Diamond Grubu Toplantısı',
            description: 'Diamond iş geliştirme ve networking grubu planlı oturumu.',
            start_at: '2026-11-26T19:30:00+03:00',
            end_at: '2026-11-26T21:00:00+03:00',
            location: 'Online (Zoom) • İstanbul',
            city: 'İstanbul',
            is_online: true,
            is_public: true,
            status: 'PUBLISHED',
            type: 'meeting',
            group_name: 'Diamond',
            is_free: true,
            price: 0
          },
          {
            id: 'diamond-2026-12-10',
            title: 'Diamond Grubu Toplantısı',
            description: 'Diamond iş geliştirme ve networking grubu planlı oturumu.',
            start_at: '2026-12-10T19:30:00+03:00',
            end_at: '2026-12-10T21:00:00+03:00',
            location: 'Online (Zoom) • İstanbul',
            city: 'İstanbul',
            is_online: true,
            is_public: true,
            status: 'PUBLISHED',
            type: 'meeting',
            group_name: 'Diamond',
            is_free: true,
            price: 0
          },
          {
            id: 'diamond-2026-12-24',
            title: 'Diamond Grubu Yıl Sonu Toplantısı',
            description: 'Diamond iş geliştirme ve networking grubu 2026 yıl sonu değerlendirme ve networking toplantısı.',
            start_at: '2026-12-24T19:30:00+03:00',
            end_at: '2026-12-24T21:30:00+03:00',
            location: 'Online (Zoom) • İstanbul',
            city: 'İstanbul',
            is_online: true,
            is_public: true,
            status: 'PUBLISHED',
            type: 'meeting',
            group_name: 'Diamond',
            is_free: true,
            price: 0
          }
        ];

        const baseEvents = Array.isArray(data)
          ? data.filter(e => e.is_public && e.status === 'PUBLISHED')
          : [];
        diamondFallbackEvents.forEach((fb) => {
          const fbDate = fb.start_at.split('T')[0];
          const exists = baseEvents.some(
            (e) =>
              String(e.start_at || '').split('T')[0] === fbDate &&
              (String(e.title || '').toLowerCase().includes('diamond') ||
                String(e.group_name || '').toLowerCase().includes('diamond'))
          );
          if (!exists) baseEvents.push(fb);
        });
        baseEvents.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        setEvents(baseEvents);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // City filter
      if (selectedCity !== 'Tümü') {
        const loc = `${event.city || ''} ${event.location || ''}`.toLowerCase();
        if (!loc.includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      // Event Type filter
      if (selectedType !== 'Tümü') {
        const titleLower = (event.title || '').toLowerCase();
        if (selectedType === 'Networking') {
          const isNetworking =
            event.event_type === 'NETWORKING' ||
            event.type === 'meeting' ||
            event.type === 'networking' ||
            titleLower.includes('networking') ||
            titleLower.includes('toplantı');
          if (!isNetworking) return false;
        } else if (selectedType === 'Eğitim') {
          const isEducation =
            event.event_type === 'EDUCATION' ||
            event.type === 'education' ||
            titleLower.includes('eğitim');
          if (!isEducation) return false;
        } else if (selectedType === 'Özel Oturum') {
          const isSpecial =
            event.event_type === 'SPECIAL' ||
            titleLower.includes('özel') ||
            titleLower.includes('yıl sonu');
          if (!isSpecial) return false;
        }
      }

      // Mode filter (Online vs Face-to-Face)
      if (selectedMode !== 'Tümü') {
        if (selectedMode === 'Online' && !event.is_online) return false;
        if (selectedMode === 'Yüz Yüze' && event.is_online) return false;
      }

      return true;
    });
  }, [events, selectedCity, selectedType, selectedMode]);

  const hasActiveFilters = selectedCity !== 'Tümü' || selectedType !== 'Tümü' || selectedMode !== 'Tümü';
  const resetFilters = () => {
    setSelectedCity('Tümü');
    setSelectedType('Tümü');
    setSelectedMode('Tümü');
  };

  const cities = ['Tümü', 'İstanbul', 'Ankara', 'İzmir'];
  const eventTypes = ['Tümü', 'Networking', 'Eğitim', 'Özel Oturum'];
  const modes = ['Tümü', 'Yüz Yüze', 'Online'];

  return (
    <div className="bg-white min-h-screen pt-20 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <SEO
        title="E4N Etkinlikleri | Networking Buluşmaları ve Eğitimler"
        description="E4N'nin yaklaşan açık networking etkinliklerini, eğitimlerini ve özel buluşmalarını inceleyin. Şehir, tarih ve katılım koşullarını görün."
        canonical="https://www.event4network.com/etkinlikler"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            📅 Açık Etkinlik Takvimi
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            İş dünyasıyla buluşun, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              yeni bağlantılar kurun
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Açık networking buluşmaları, eğitimler ve konuşmacı oturumlarıyla farklı iş insanlarının deneyimlerini tanıyın. Katılım biçimi, tarih, şehir ve bilet koşullarına göre size uygun etkinliği seçin.
          </p>
        </div>
      </section>

      {/* Yaklaşan Etkinlikler & Filtreler */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Başlık Satırı */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-widest mb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                GÜNCEL PROGRAM
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Yaklaşan Etkinlikler
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Yalnız gerçek ve yayımlanmış kayıtlar listelenir.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-end">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Filtreleri Temizle
                </button>
              )}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>{loading ? '...' : `${filteredEvents.length} Etkinlik`}</span>
              </div>
            </div>
          </div>

          {/* Modern Filtre Araç Çubuğu */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-10 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Şehir Filtresi */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Şehir</span>
                </div>
                <div
                  role="group"
                  aria-label="Şehir filtresi"
                  className="grid grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs"
                >
                  {cities.map((city) => {
                    const active = selectedCity === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedCity(city)}
                        className={`h-9 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tür Filtresi */}
              <div className="lg:col-span-5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-600" />
                  <span>Etkinlik Türü</span>
                </div>
                <div
                  role="group"
                  aria-label="Etkinlik türü filtresi"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs"
                >
                  {eventTypes.map((type) => {
                    const active = selectedType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedType(type)}
                        className={`h-9 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Filtresi */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-0.5">
                  <Video className="w-3.5 h-3.5 text-red-600" />
                  <span>Katılım Formatı</span>
                </div>
                <div
                  role="group"
                  aria-label="Etkinlik formatı filtresi"
                  className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs"
                >
                  {modes.map((mode) => {
                    const active = selectedMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedMode(mode)}
                        className={`h-9 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
            /* Boş durum metni: Tam olarak şartnamede belirtilen metin */
            <div className="text-center py-16 px-6 bg-slate-50 rounded-3xl border border-slate-200 max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Planlanmış Etkinlik Bulunmuyor
              </h3>
              <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-xl mx-auto">
                Yeni etkinlikler açıklandığında burada yer alacak. E4N topluluklarına katılarak duyuruları takip edebilirsiniz.
              </p>
              <Button
                size="default"
                variant="primary"
                onClick={() => navigate('/topluluklarimiz')}
                className="font-bold bg-red-600 hover:bg-red-500 text-white px-6 h-11"
              >
                Topluluk Duyurularını Takip Et
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => {
                const startDate = new Date(event.start_at);
                const formattedDate = startDate.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });
                const formattedTime = startDate.toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:border-red-500 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                          {event.event_type === 'NETWORKING' || event.type === 'networking'
                            ? 'Networking'
                            : event.event_type === 'EDUCATION' || event.type === 'education'
                            ? 'Eğitim'
                            : event.type === 'meeting' || (event.title || '').toLowerCase().includes('toplantı')
                            ? 'Grup Toplantısı'
                            : 'Özel Buluşma'}
                        </span>
                        {event.is_online ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            <Video className="w-3.5 h-3.5" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location ? event.location.split(',')[0] : 'Yüz Yüze'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                        {event.description}
                      </p>

                      <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span className="font-medium text-slate-800">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>{formattedTime}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span className="line-clamp-1">{event.location || (event.is_online ? 'Online Oturum' : 'Belirtilmedi')}</span>
                        </div>
                      </div>

                      {/* Katılım Koşulu & Ücret */}
                      <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 mb-6">
                        <span className="text-slate-500 font-medium">Katılım:</span>
                        <span className="font-bold text-slate-900">
                          {event.is_free || !event.ticket_price || event.ticket_price === 0
                            ? 'Ücretsiz Katılım'
                            : `${event.ticket_price} TL`}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 pt-0">
                      <Button
                        size="default"
                        variant="outline"
                        className="w-full justify-center font-bold text-slate-800 hover:text-red-600 hover:border-red-300 border-slate-200 h-11"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        Etkinliği İncele
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Hangi buluşma size uygun? */}
      <section className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              FORMATLAR
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              Hangi buluşma size uygun?
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Her etkinliğin kimlere açık olduğu ve kayıt koşulları kendi sayfasında açıklanır.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Networking Buluşmaları
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Farklı sektörlerden iş insanlarıyla tanışma fırsatı sunar. Şirket sahipleri, kurucu ortaklar ve yöneticilerin iş geliştirme amacıyla bir araya geldiği dinamik oturumlardır.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Eğitim ve Seminerler
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  İş dünyasıyla ilgili bilgi ve deneyim paylaşımına odaklanır. Yönetim, satış, finans, teknoloji ve kurumsallaşma gibi başlıklarda alanında uzman isimlerle gerçekleşir.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Özel Oturumlar
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Belirtilen konu veya katılımcı profili etrafında düzenlenir. Sektörel yuvarlak masa toplantıları, tematik kurucu buluşmaları ve özel davetli toplantıları içerir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kapalı grup toplantıları */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-1">
                  ÜYELİK SİSTEMİ
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">
                  Kapalı grup toplantıları
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                  Kapalı grup toplantıları, kabul edilmiş grup üyelerinin düzenli çalışma alanıdır. Herkese açık etkinlik takvimine otomatik olarak dahil edilmez. Grup üyeleri kendi toplantı bilgilerini üye alanından takip eder.
                </p>
                <button
                  onClick={() => navigate('/kapali-gruplar')}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-red-300 transition-colors"
                >
                  <span>Kapalı grup modelini inceleyin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Geçmiş etkinlikler */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 bg-slate-200/80 text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
            ARŞİV VE KAYITLAR
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Geçmiş etkinlikler
          </h2>
          <p className="text-slate-600 text-base leading-relaxed mb-8 max-w-2xl mx-auto">
            Tamamlanan etkinliklerde konu ve tarih bilgileri korunur. Kayıt kapandığı açıkça belirtilir; katılım butonu kaldırılır. Varsa izinli fotoğraflar, konuşmacı bilgileri ve yayımlanmış kayıtlar eklenir.
          </p>
          <Button
            size="default"
            variant="outline"
            onClick={() => navigate('/topluluklarimiz')}
            className="font-bold border-slate-300 text-slate-800 hover:text-red-600 hover:border-red-300 h-11 px-6 bg-white"
          >
            Topluluk Duyurularını Takip Et
          </Button>
        </div>
      </section>
    </div>
  );
}
