import { ClubBenefitsSection } from '../components/PublicClubSections';
import { companyRequirement, professionRule, professionExample, memberEffort, meetingSupport, scoringActivities, absenceRule, paymentGate, noGuarantee } from '../data/clubContent';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import {
  ArrowRight,
  Users,
  Calendar,
  MessageCircle,
  Repeat,
  ShieldCheck,
  ChevronDown,
  FileText
} from 'lucide-react';
import processMeeting from '../assets/seo/process-meeting.webp';
import bizKimizNetwork from '../assets/seo/biz_kimiz_network.webp';

interface EventItem {
  id: string;
  title: string;
  start_at: string;
  is_online?: boolean;
  location?: string;
  summary?: string;
  is_public?: boolean;
  status?: string;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [showFloater, setShowFloater] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloater(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.getPublicEvents()
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          const publicEvents = data
            .filter((e: EventItem) => e.is_public && e.status === 'PUBLISHED')
            .sort((a: EventItem, b: EventItem) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
            .slice(0, 3);
          setEvents(publicEvents);
        }
        setEventsLoading(false);
      })
      .catch(() => setEventsLoading(false));
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: 'Üye olmadan önce toplantıları ziyaret edebilir miyim?',
      a: 'Evet! E4N hesabı açtıktan sonra henüz bir abonelik satın almadan dilediğiniz bir kapalı grubun toplantısına 2 defaya kadar ziyaretçi olarak katılabilirsiniz. Grupları inceleyip "Ziyaretçi olmak istiyorum" butonuyla davetiye isteyebilirsiniz. 2 toplantı sonrasında devam etmek için üyelik paketi satın almanız gerekir.'
    },
    {
      q: 'Üye olmak doğrudan bir gruba katılmak mı?',
      a: paymentGate
    },
    {
      q: 'Aynı işi yapan kişiler aynı grupta olabilir mi?',
      a: professionRule
    },
    {
      q: 'Grup ne kadar süre aynı kalır?',
      a: 'Grup dağılımı dört ayda bir shuffle ile yenilenir.'
    },
    {
      q: 'E4N bana müşteri veya satış garantisi veriyor mu?',
      a: noGuarantee
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-red-500 selection:text-white">
      <SEO
        title="Event4Network | 35 Kişilik Gruplarla İş Ağınızı Geliştirin"
        description="E4N'nin açık loncalarını, 35 kişilik kapalı gruplarını ve dört ayda bir yenilenen networking modelini keşfedin. Üyelik ve grup başvurusunu öğrenin."
        canonical="https://www.event4network.com/"
        ogImage="https://www.event4network.com/biz_kimiz_network.png"
      />

      {/* 1. Hero Alanı */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[130px] animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-red-800/15 blur-[110px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-left mb-12 lg:mb-0">
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 backdrop-blur-sm">
                  <span>İş insanları için networking kulübü</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  <span>Kulübü ziyaretçi olarak tanıyın</span>
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                İşinizi anlayan bir çevreyle <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
                  daha güçlü bağlantılar
                </span> kurun.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl font-normal">
                Event4Network; şirket sahiplerini, kurucu ortakları ve üst düzey yöneticileri açık topluluklarda, etkinliklerde ve 35 kişilik kapalı gruplarda buluşturur. Düzenli görüşmelerle birbirinizin işini tanır, uygun bağlantılar ve iş birlikleri için ortak bir zemin oluşturursunuz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => navigate('/uyelik')}
                  className="text-base font-bold px-8 h-14 bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30 transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                >
                  Üyeliği İncele
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/nasil-calisir')}
                  className="text-base font-semibold px-8 h-14 bg-white/5 border border-white/20 text-white hover:bg-white hover:text-slate-900 transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                >
                  Nasıl Çalışır?
                </Button>
              </div>

              {/* Bilgi Şeridi */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-emerald-300 font-semibold">Ziyaretçi katılımı</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span>35 kişilik kapalı gruplar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  <span>Her meslekten bir kişi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span>4 ayda bir grup yenilenmesi</span>
                </div>
              </div>
            </div>

            {/* Right Media */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl blur-2xl opacity-15"></div>
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl backdrop-blur-sm bg-white/5 p-2">
                <img
                  src={processMeeting}
                  width={1024}
                  height={1024}
                  decoding="async"
                  alt="Event4Network Seçici İş Ağı Buluşması"
                  className="rounded-2xl object-cover w-full h-[320px] sm:h-[400px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tek ekosistem, farklı katılım yolları */}
      <section className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              KATILIM MODELLERİ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Tek ekosistem, farklı katılım yolları
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              E4N'yi tanımak, bir etkinliğe katılmak ve düzenli bir grubun parçası olmak farklı adımlardır. Hedefinize göre uygun yerden başlayabilirsiniz.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Açık Loncalar */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold uppercase mb-3">
                  Açık Topluluk
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Açık loncalar</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Sektörünüze veya ilgilendiğiniz iş alanına göre WhatsApp topluluklarına katılın. Gelişmeleri takip edin, bilgi paylaşın ve yeni profesyonellerle tanışın.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/topluluklarimiz')}
                className="w-full justify-center text-sm font-semibold h-11 border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Loncaları Keşfet <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

            {/* Açık Etkinlikler */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-bold uppercase mb-3">
                  Takvim ve Buluşmalar
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Açık etkinlikler</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Networking buluşmaları, eğitimler ve konuşmacı oturumlarıyla E4N çevresini tanıyın. Her etkinliğin katılım ve bilet koşullarını kendi sayfasından inceleyin.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/etkinlikler')}
                className="w-full justify-center text-sm font-semibold h-11 border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Etkinliklere Bak <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

            {/* Kapalı Gruplar */}
            <div className="bg-white rounded-3xl p-8 border-2 border-red-500/20 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                Seçici Yapı
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold uppercase mb-3">
                  35 Kişilik Çevre
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Kapalı gruplar</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  35 kişilik yapı içinde düzenli olarak bir araya gelin. Grup kabulü; üyelik durumunuz, hizmet uyumu, kontenjan ve başkan görüşmesiyle değerlendirilir.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => navigate('/kapali-gruplar')}
                className="w-full justify-center text-sm font-bold h-11 bg-red-600 hover:bg-red-500 shadow-md shadow-red-200"
              >
                Kapalı Grupları İncele <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span>Lonca katılımı, E4N aboneliği ve kapalı grup kabulü ayrı süreçlerdir.</span>
            </p>
          </div>
        </div>
      </section>

      {/* 2.5. Gelin, İlk Önce Ziyaretçi Olun! */}
      <section className="py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden border-y border-red-900/30">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-emerald-600/10 blur-[100px]"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase tracking-wider border border-emerald-500/20 mb-4">
              ZİYARETÇİ DENEYİMİ
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-5">
              Gelin, ilk önce <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">ziyaretçi olun!</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              E4N'nin disiplinli iş birliği ortamını, her grubun kendi toplantı düzenini ve 35 kişilik grup enerjisini doğrudan yerinde görün.
              Hesabınızı oluşturup seçeceğiniz kapalı grupların toplantılarına{' '}
              <strong className="text-white font-semibold">2 toplantıya kadar ziyaretçi</strong> olarak katılabilirsiniz.
            </p>
          </div>

          {/* 3 Adımda Ziyaretçi Süreci */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Üye Olun</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {companyRequirement}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Grubunuzu Seçin & Talep Gönderin</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Paneldeki kapalı grupları inceleyin; uygun bir grup seçip "Ziyaretçi olmak istiyorum" butonuyla davetiye isteyin.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sistemi Görüp Karar Verin</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Toplantılara ziyaretçi olarak katılıp üyelerle tanışın, iş sunumlarını izleyin. Grup onayının ardından kuralları kabul ederek üyeliğe geçebilirsiniz.
              </p>
            </div>
          </div>

          <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/auth/register')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 h-12 shadow-lg shadow-emerald-900/40 w-full sm:w-auto"
            >
              Hemen Üye Ol <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/kapali-gruplar')}
              className="bg-white text-black hover:text-black hover:bg-slate-100 font-semibold px-8 h-12 w-full sm:w-auto"
            >
              Kapalı Grupları İncele
            </Button>
          </div>
        </div>
      </section>

      <ClubBenefitsSection />

      {/* 3. Küçük gruplarda birbirinizin işini daha iyi tanıyın */}
      <section className="py-20 lg:py-28 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
                HİZMET DENGESİ VE DERİNLİK
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
                Küçük gruplarda birbirinizin işini daha iyi tanıyın
              </h2>
              <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
                <p>
                  İşinizi kime, hangi durumda ve nasıl önerebileceğini bilen bir çevre oluşturmak zaman ister. Kapalı gruplar bu zamanı düzenli görüşmelerle değerlendirmenizi sağlar.
                </p>
                <p>
                  {memberEffort} {meetingSupport}
                </p>
                <p className="font-medium text-slate-900 bg-red-50/70 p-4 rounded-2xl border border-red-100 text-sm sm:text-base">
                  {professionRule} {professionExample}
                </p>
              </div>
              <div className="mt-8">
                <Link
                  to="/kapali-gruplar"
                  className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-bold text-sm group"
                >
                  <span>Grup yapısını ve kabul koşullarını öğrenin</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white p-2">
                <img
                  src={bizKimizNetwork}
                  width={1024}
                  height={1024}
                  decoding="async"
                  loading="lazy"
                  alt="E4N Hizmet Dengesi ve Küçük Gruplar"
                  className="rounded-2xl object-cover w-full h-[320px] sm:h-[380px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. İlişkinizi derinleştirin, çevrenizi yenileyin (Shuffle) */}
      <section className="py-20 lg:py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-red-900/15 blur-[120px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-4">
              <Repeat className="w-3.5 h-3.5" /> 4 AYDA BİR SHUFFLE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-6">
              İlişkinizi derinleştirin, çevrenizi yenileyin
            </h2>
            <div className="space-y-4 text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              <p>
                Dört aylık dönem boyunca 35 kişilik grubunuzdaki üyeleri, yaptıkları işleri ve uzmanlıklarını tanırsınız. Bu tanışıklıklar, sonraki dönemlerde de derinleştirebileceğiniz iş ilişkilerinin temelini oluşturur.
              </p>
              <p>
                Shuffle ile yeni bir gruba geçtiğinizde, tanıdığınız kişilerle ilişkilerinizi geliştirmeye devam edersiniz. Yeni grubunuzda ise farklı insanları, meslekleri ve konuları iş çevrenize katarsınız. Böylece kurduğunuz ilişkiler derinleşirken yeni bağlantılar için de alan açılır.
              </p>
            </div>
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/shuffle')}
              className="text-sm font-bold px-7 h-12 bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30"
            >
              Shuffle Nasıl İşler? <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* 5. İyi bir iş ağı, düzenli katkıyla gelişir (Katılım İlkeleri) */}
      <section className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              DÜZENLİ ZAMAN VE KATILIM
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
              İyi bir iş ağı, düzenli katkıyla gelişir
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-4">
              {scoringActivities}
            </p>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
              {absenceRule} Ayrıntılı kuralları ödeme öncesinde inceleyip kabul edersiniz.
            </p>
            <Link
              to="/katilim-ilkeleri"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-sm shadow-sm hover:border-red-500 hover:text-red-600 transition-colors"
            >
              <FileText className="w-4 h-4 text-red-600" />
              <span>Katılım İlkelerini İncele</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. E4N'ye nasıl katılırsınız? (4 Adım) */}
      <section className="py-20 lg:py-28 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              SÜREÇ ADIMLARI
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              E4N'ye nasıl katılırsınız?
            </h2>
            <p className="text-slate-600 text-base">
              Hesap açın, kulübü ziyaretçi olarak tanıyın; grup onayı ve kuralların kabulünden sonra ödeme adımına geçin.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-red-600/30 block mb-4">01</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Hesabınızı oluşturun</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {companyRequirement}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-red-600/30 block mb-4">02</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Kulübü ziyaret edin</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Hesabınızdaki grup bilgilerini inceleyin ve ziyaret talebi gönderin. Her grubun kendi toplantı takvimi vardır; ilgili grubun gün ve saatini takip edin.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-red-600/30 block mb-4">03</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Grup onayı alın</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Seçtiğiniz tek iş kolu ve kontenjan değerlendirilir. Başkan veya admin onayı olmadan ödeme yapamazsınız. Yer yoksa en fazla ziyaretçi olabilirsiniz.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-red-600/30 block mb-4">04</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Kuralları kabul edip ödemenizi tamamlayın</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Kuralları inceleyip kabul ederek bunlara uyacağınızı taahhüt edin. Ardından açılan ödeme ekranında işleminizi tamamlayın.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 inline-block bg-slate-100 px-5 py-2.5 rounded-full">
              Ziyaretçi deneyimi, başkan veya admin onayı ve kuralların kabulü, ödeme öncesinde tamamlanır.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Kimler için uygun? */}
      <section className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              HEDEF KİTLE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Kimler için uygun?
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              E4N; iş geliştirmeye zaman ayıran, uzmanlığını açıkça anlatabilen ve karşılıklı katkıya önem veren şirket sahipleri, kurucu ortaklar ve üst düzey yöneticiler için tasarlanır.
            </p>
            <p className="text-slate-600 text-sm mt-3">
              Yeni müşterilere ulaşmak, tamamlayıcı hizmetlerle iş birliği kurmak, farklı sektörleri tanımak veya iş çevrenizi genişletmek istiyorsanız E4N'nin katılım seçeneklerini değerlendirebilirsiniz.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {[
              "Şirket Sahipleri",
              "Kurucu Ortaklar",
              "Üst Düzey Yöneticiler",
              "C-Level Liderler",
              "İş Geliştirme Karar Vericileri",
              "Nitelikli İş Ortaklığı Arayanlar"
            ].map((role, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-4 text-center font-bold text-xs sm:text-sm text-slate-900 shadow-sm flex items-center justify-center min-h-[72px]"
              >
                {role}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Etkinliklerde tanışın */}
      <section className="py-20 lg:py-28 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
                BULUŞMALAR VE ETKİNLİKLER
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                Etkinliklerde tanışın
              </h2>
              <p className="text-slate-600 text-base max-w-2xl">
                Yaklaşan açık buluşmalarımızı ve eğitimlerimizi inceleyin. Konu, şehir, katılım biçimi ve bilet koşullarına göre size uygun etkinliği seçin.
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <Button
                variant="outline"
                onClick={() => navigate('/etkinlikler')}
                className="text-sm font-bold border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Tüm Etkinlikler <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>

          {eventsLoading ? (
            <div className="py-12 text-center text-slate-400">Etkinlikler yükleniyor...</div>
          ) : events.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-red-600 font-bold mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(ev.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{ev.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-6">
                      {ev.summary || "Etkinlik detayları ve kayıt için inceleyin."}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">
                      {ev.is_online ? "Online Oturum" : ev.location || "Fiziksel Buluşma"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/event/${ev.id}`)}
                      className="text-xs font-bold"
                    >
                      İncele
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center max-w-2xl mx-auto">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium text-sm sm:text-base leading-relaxed">
                Yeni etkinlikler açıklandığında burada yer alacak. Duyuruları topluluk kanallarımızdan takip edebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 9. İlk adımınızı seçin (CTA) */}
      <section className="py-20 lg:py-28 bg-slate-950 text-white relative overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-red-900/20 blur-[130px]"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-3">
            BAŞLANGIÇ NOKTASI
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
            İlk adımınızı seçin
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            E4N'nin çalışma modelini inceleyerek üyelik yolculuğunuza başlayın veya açık topluluklarımızdan birine katılarak çevreyi tanıyın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/auth/register')}
              className="text-base font-bold px-10 h-14 bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/40"
            >
              Üye Ol
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/topluluklarimiz')}
              className="text-base font-semibold px-10 h-14 bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900"
            >
              Topluluklara Katıl
            </Button>
          </div>
        </div>
      </section>

      {/* 10. Ana sayfada kısa SSS */}
      <section className="py-20 lg:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              MERAK EDİLENLER
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sıkça Sorulan Sorular
            </h2>
          </div>

          <div className="space-y-4 mb-10">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-5 px-6 text-left flex justify-between items-center gap-4 font-bold text-slate-900 hover:text-red-600 transition-colors"
                  >
                    <span className="text-base sm:text-lg">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-red-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              to="/sikca-sorulan-sorular"
              className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 group"
            >
              <span>Tüm Soruları İnceleyin</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Floating CTA Button for Community */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 z-40 transition-all duration-500 transform ${
          showFloater ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
        } w-[calc(100%-2.5rem)] sm:w-auto max-w-sm sm:max-w-none`}
      >
        <button
          onClick={() => navigate('/topluluklarimiz')}
          className="relative w-full flex items-center justify-between sm:justify-start gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(220,38,38,0.35)] hover:shadow-[0_15px_35px_rgba(220,38,38,0.5)] transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 active:scale-95 group border border-white/10 overflow-hidden"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-red-600"></span>
            </span>
            <Users className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="tracking-wide whitespace-nowrap">Topluluklarımıza Katılın</span>
          </div>
          <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform ml-1 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
