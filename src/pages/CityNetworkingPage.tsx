import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import {
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Users,
  ShieldCheck,
  CheckCircle2,
  Info,
  Building2
} from 'lucide-react';

interface CityContent {
  cityKey: string;
  cityName: string;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  h1: string;
  lead: string;
  section1Title: string;
  section1Texts: string[];
  section2Title: string;
  section2Texts: string[];
  eventsTitle: string;
  eventsEmptyText: string;
  primaryButtonText: string;
  primaryButtonPath: string;
  secondaryButtonText: string;
  secondaryButtonPath: string;
}

const CITY_DATA: Record<string, CityContent> = {
  istanbul: {
    cityKey: 'istanbul',
    cityName: 'İstanbul',
    seoTitle: 'İstanbul Networking | E4N Topluluk ve Etkinlik Bilgileri',
    seoDescription: 'İstanbul\'da E4N networking yaklaşımını, topluluk kanallarını ve yayımlanmış etkinlikleri inceleyin. Kapalı grup başvuru modelini öğrenin.',
    canonical: 'https://www.event4network.com/networking/istanbul',
    h1: 'İstanbul\'da iş çevrenizi E4N ile geliştirin',
    lead: 'İstanbul\'da şirketinizi, uzmanlığınızı ve iş geliştirme hedeflerinizi anlayan yeni insanlarla tanışmak için E4N\'nin açık topluluklarını ve duyurularını takip edebilirsiniz.',
    section1Title: 'İhtiyacınıza göre bir katılım yolu seçin',
    section1Texts: [
      'Sektör odaklı açık loncalarda bilgi paylaşabilir, yayımlanan etkinliklere katılabilir veya düzenli grup çalışması için üyelik koşullarını inceleyebilirsiniz.',
      'Kapalı grup modeli 35 kişilik yapı, hizmet çakışması kontrolü, başkan görüşmesi ve dört ayda bir shuffle üzerine kuruludur. Şehir bazlı grup organizasyonu henüz etkin değildir; mevcut grup başvuruları genel başvuru akışından ilerler.'
    ],
    section2Title: 'Düzenli bir grup arıyorsanız',
    section2Texts: [
      'Üyelik ve grup kabulü koşullarını okuyun. Başkan görüşmesinde hizmetlerinizi, hedeflerinizi ve katılım için ayırabileceğiniz zamanı konuşun. Şehir sayfasını ziyaret etmek veya hesap açmak bir grupta yer ayırmaz.'
    ],
    eventsTitle: 'İstanbul etkinlikleri',
    eventsEmptyText: 'İstanbul için yayımlanmış yeni etkinlik bulunmuyor. Duyuruları açık topluluk kanallarımızdan takip edebilirsiniz.',
    primaryButtonText: 'Üyeliği İncele',
    primaryButtonPath: '/uyelik',
    secondaryButtonText: 'Açık Topluluklara Katıl',
    secondaryButtonPath: '/topluluklarimiz'
  },
  ankara: {
    cityKey: 'ankara',
    cityName: 'Ankara',
    seoTitle: 'Ankara Networking | E4N Topluluk ve Katılım Bilgileri',
    seoDescription: 'Ankara\'da E4N\'nin iş ağı yaklaşımını ve açık topluluklarını tanıyın. Üyelik, kapalı grup kabulü ve yerel etkinlik duyurularını inceleyin.',
    canonical: 'https://www.event4network.com/networking/ankara',
    h1: 'Ankara\'da yeni profesyonel bağlantılar için E4N\'yi tanıyın',
    lead: 'İşinizi daha açık anlatabileceğiniz, farklı uzmanlıkları tanıyabileceğiniz ve uygun iş birliklerini konuşabileceğiniz bir çevre arıyorsanız E4N\'nin katılım modelini inceleyebilirsiniz.',
    section1Title: 'Açık topluluklardan başlayın',
    section1Texts: [
      'İlginize uygun lonca kanalına katılarak sektör paylaşımlarını ve E4N duyurularını takip edin. Bu kanallar geniş katılımlıdır; kapalı grup üyeliğinden ayrı çalışır.'
    ],
    section2Title: 'Kapalı grup modelini öğrenin',
    section2Texts: [
      'E4N\'nin düzenli grup yapısı, 35 kişilik gruplar ve aynı ya da çakışan hizmetlerin ayrı tutulması üzerine kuruludur. Grup başvurusu aktif abonelik, başkan görüşmesi ve uygun kontenjanla değerlendirilir.',
      'Şehir bazlı grup ayrımı henüz etkin değildir. Ankara\'da aktif bir grubun bulunduğu veya kontenjanının açık olduğu, gerçek grup bilgisi yayımlanmadan varsayılmaz.'
    ],
    eventsTitle: 'Ankara duyuruları',
    eventsEmptyText: 'Ankara için yayımlanmış yeni etkinlik bulunmuyor. Yerel duyuruları E4N topluluk kanallarından takip edebilirsiniz.',
    primaryButtonText: 'Nasıl Çalışır?',
    primaryButtonPath: '/nasil-calisir',
    secondaryButtonText: 'Topluluklara Katıl',
    secondaryButtonPath: '/topluluklarimiz'
  },
  izmir: {
    cityKey: 'izmir',
    cityName: 'İzmir',
    seoTitle: 'İzmir Networking | E4N İş Ağı ve Topluluk Bilgileri',
    seoDescription: 'İzmir\'de E4N networking modelini, açık loncalarını ve yayımlanmış etkinliklerini inceleyin. Üyelik ve grup başvurusu koşullarını öğrenin.',
    canonical: 'https://www.event4network.com/networking/izmir',
    h1: 'İzmir\'de iş ilişkilerinizi geliştirmek için yeni bir başlangıç',
    lead: 'Yeni profesyonellerle tanışmak, iş ihtiyaçlarınızı paylaşmak ve farklı uzmanlıklarla bağlantı kurmak için E4N\'nin açık topluluklarını keşfedin.',
    section1Title: 'Sektörünüzü ve tamamlayıcı iş alanlarını tanıyın',
    section1Texts: [
      'Loncalar, kendi alanınızdaki gelişmeleri izlemenize ve birlikte çalışabileceğiniz diğer iş alanlarını tanımanıza yardımcı olur. Topluluklara katılım, E4N aboneliği veya kapalı grup kabulü sağlamaz.'
    ],
    section2Title: 'Daha düzenli bir çalışma için kapalı gruplar',
    section2Texts: [
      'Kapalı gruplar, 35 kişilik çevrede düzenli görüşmelerle birbirinizin işini daha iyi tanımanıza odaklanır. Hizmet uyumu ve başkan görüşmesi kabul sürecinin parçalarıdır. Gruplar dört ayda bir shuffle ile yenilenir.',
      'Şehir bazlı grup ayrımı henüz etkin değildir. İzmir\'e özel grup ve kontenjan bilgileri, gerçek organizasyon netleştiğinde bu sayfaya eklenir.'
    ],
    eventsTitle: 'İzmir etkinlikleri',
    eventsEmptyText: 'İzmir için yayımlanmış yeni etkinlik bulunmuyor. E4N topluluklarından yeni duyuruları takip edebilirsiniz.',
    primaryButtonText: 'Üyelik Koşulları',
    primaryButtonPath: '/uyelik',
    secondaryButtonText: 'Topluluklara Katıl',
    secondaryButtonPath: '/topluluklarimiz'
  }
};

export function CityNetworkingPage() {
  const { city } = useParams<{ city?: string }>();
  const navigate = useNavigate();
  const [cityEvents, setCityEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedCityKey = (city || '').toLowerCase().trim();
  const cityInfo = CITY_DATA[normalizedCityKey];

  useEffect(() => {
    if (!cityInfo) return;

    const fetchEvents = async () => {
      try {
        let data: any = [];
        try {
          data = await api.getPublicEvents();
        } catch {
          data = await api.getEvents();
        }

        if (Array.isArray(data)) {
          const matched = data.filter((e: any) => {
            if (!e.is_public || e.status !== 'PUBLISHED') return false;
            const loc = (e.location || '').toLowerCase();
            return loc.includes(cityInfo.cityName.toLowerCase()) || loc.includes(cityInfo.cityKey);
          });
          setCityEvents(matched);
        }
      } catch {
        setCityEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [cityInfo]);

  // Bilinmeyen şehir girilirse 404 vermek yerine Topluluklar sayfasına yönlendir
  if (!cityInfo) {
    return <Navigate to="/topluluklarimiz#sehirler" replace />;
  }

  return (
    <div className="bg-white min-h-screen pt-20 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <SEO
        title={cityInfo.seoTitle}
        description={cityInfo.seoDescription}
        canonical={cityInfo.canonical}
        noindex={true}
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            <MapPin className="w-3.5 h-3.5" />
            {cityInfo.cityName} Yerel Bilgilendirme
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            {cityInfo.h1}
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            {cityInfo.lead}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate(cityInfo.primaryButtonPath)}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              {cityInfo.primaryButtonText}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(cityInfo.secondaryButtonPath)}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              {cityInfo.secondaryButtonText}
            </Button>
          </div>
        </div>
      </section>

      {/* Bölüm 1 */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            KATILIM YOLLARI
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            {cityInfo.section1Title}
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
            {cityInfo.section1Texts.map((text, idx) => (
              <p key={idx}>{text}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Bölüm 2 */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
                KAPALI GRUPLAR
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              {cityInfo.section2Title}
            </h2>
            <div className="space-y-4 text-slate-700 text-base leading-relaxed">
              {cityInfo.section2Texts.map((text, idx) => (
                <p key={idx}>{text}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Şehir Etkinlikleri */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            YEREL TAKVİM
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            {cityInfo.eventsTitle}
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
            </div>
          ) : cityEvents.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-700 text-base font-medium leading-relaxed max-w-xl mx-auto mb-6">
                {cityInfo.eventsEmptyText}
              </p>
              <Button
                size="default"
                variant="primary"
                onClick={() => navigate('/topluluklarimiz')}
                className="font-bold bg-red-600 hover:bg-red-500 text-white px-6 h-11"
              >
                Topluluk Kanallarına Katıl
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {cityEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-red-500 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">{evt.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{evt.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span>{new Date(evt.start_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/event/${evt.id}`)}
                    className="w-full mt-4 justify-center"
                  >
                    Detayları Gör
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
