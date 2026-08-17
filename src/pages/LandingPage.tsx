import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../shared/Button';
import {
  ArrowRight,
  CheckCircle,
  Users,
  Calendar,
  Trophy,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  Handshake,
  Check,
  Compass,
  Target,
  Sparkles,
  Award,
  AlertCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import processMeeting from '../assets/process-meeting.png';
import bizKimizNetwork from '../assets/biz_kimiz_network.png';

export function LandingPage() {
  const navigate = useNavigate();
  const [showFloater, setShowFloater] = useState(false);
  const [guildIndex, setGuildIndex] = useState(0);

  const carouselGuilds = [
    {
      name: "Girişimcilik Loncası",
      url: "https://chat.whatsapp.com/FMovNudN2AyBYpoiW4VmtD",
      description: "Girişimciler, start-up kurucuları ve yatırımcılar için ortak iş geliştirme ve fikir alışverişi alanı.",
      tag: "Girişimcilik"
    },
    {
      name: "Yazılım ve Yapay Zeka Loncası",
      url: "https://chat.whatsapp.com/BqUKVSoC6zL91ml0rh9Lxk",
      description: "Yazılım şirketi sahipleri, CTO'lar ve yapay zeka alanında faaliyet gösteren teknoloji üreticileri.",
      tag: "Teknoloji"
    },
    {
      name: "Üretim Sanayi İhracat Loncası",
      url: "https://chat.whatsapp.com/KCpg9gk5AFk7oNkLRkI0eo",
      description: "Sanayiciler, yerli üreticiler ve ihracat odaklı iş geliştirme hedefi olan profesyoneller.",
      tag: "Sanayi & İhracat"
    },
    {
      name: "Pazarlama Medya ve İletişim Loncası",
      url: "https://chat.whatsapp.com/I8UWdo9VXUmHABcHNAKs8S",
      description: "Reklam, pazarlama, sosyal medya yönetimi, PR ve yaratıcı tasarım ajansı yöneticileri.",
      tag: "Pazarlama & Medya"
    },
    {
      name: "Hukuk Mali ve Kurumsal Hizmetler Loncası",
      url: "https://chat.whatsapp.com/DcIXluAZmgTE9p2MfiSnfj",
      description: "Hukuki danışmanlık, mali müşavirlik, kurumsal eğitim ve insan kaynakları uzmanları.",
      tag: "Hukuk & Finans"
    },
    {
      name: "Sağlık ve Medikal Loncası",
      url: "https://chat.whatsapp.com/LU4Ebh7aBvUJ4Ww5vMpsG2",
      description: "Sağlık turizmi acenteleri, klinik yöneticileri, medikal ürün üreticileri ve distribütörler.",
      tag: "Sağlık & Medikal"
    },
    {
      name: "E-Ticaret ve E-İhracat Loncası",
      url: "https://chat.whatsapp.com/CH0MKdmSnCaCTzSMjuzfos",
      description: "E-ticaret marka sahipleri, pazar yeri satıcıları, kargo, lojistik ve ödeme sistemleri sağlayıcıları.",
      tag: "E-Ticaret"
    },
    {
      name: "Yapı ve Gayrimenkul Loncası",
      url: "https://chat.whatsapp.com/H3rqf63KLKBDQeCvZBe7eg",
      description: "Müteahhitler, mimarlar, gayrimenkul yatırım danışmanları ve yapı sektörü tedarikçileri.",
      tag: "Yapı & Emlak"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloater(true);
      } else {
        setShowFloater(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-red-500 selection:text-white">
      <Helmet>
        <title>Event4Network | Kalıcı İş İlişkileri İçin Seçici Networking</title>
        <meta name="description" content="Event4Network, şirket sahipleri, kurucu ortaklar ve üst düzey yöneticileri güvene dayalı seçici bir iş ağı içinde bir araya getirerek kalıcı iş ilişkileri oluşturur." />
        <meta name="keywords" content="seçici networking, iş ağı, referansla iş geliştirme, şirket sahipleri, kurucu ortaklar, B2B networking, kalıcı iş ilişkileri, event4network" />
        <link rel="canonical" href="https://www.event4network.com/" />
      </Helmet>

      {/* 1. Hero Alanı */}
      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 bg-slate-950 text-white overflow-hidden">
        {/* Ambient Blur Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-red-800/10 blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-left mb-16 lg:mb-0">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm animate-fade-in">
                ⚡ Seçici Profesyonel İş Ağı
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-6">
                Kalıcı iş ilişkileri için <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
                  seçici networking
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl font-light">
                Event4Network, şirket sahipleri, kurucu ortaklar ve üst düzey yöneticileri güvene dayalı bir iş ağı içinde bir araya getirir. Amaç yalnızca tanışmak değil; birbirini gerçekten tanıyan, anlayan ve doğru çevrelere yönlendirebilen bir iş insanları topluluğu oluşturmaktır.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => navigate('/degerlendirme-basvurusu')}
                  className="text-base font-bold px-8 h-14 bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30 transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                >
                  Üyelik Başvurusu Yap
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('nasil-calisir')}
                  className="text-base font-semibold px-8 h-14 bg-white border-transparent text-slate-900 hover:bg-transparent hover:text-white border hover:border-white/20 transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                >
                  E4N Nasıl Çalışır?
                </Button>
              </div>
            </div>

            {/* Right Media */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl blur-2xl opacity-15"></div>
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl backdrop-blur-sm bg-white/5 p-2">
                <img
                  src={processMeeting}
                  alt="Event4Network Seçici İş Ağı Buluşması"
                  className="rounded-2xl object-cover w-full h-[320px] sm:h-[400px] hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Biz Kimiz? */}
      <section className="relative py-20 lg:py-28 bg-slate-50 overflow-hidden border-b border-slate-200/60">
        {/* Subtle background branding glow */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full bg-red-950/5 blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Text Content */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-650 font-bold text-xs uppercase tracking-wider border border-red-100 mb-6 w-fit">
                🤝 BİZ KİMİZ?
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-8">
                Nitelikli İş Ağınızı <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                  Güvenle İnşa Edin
                </span>
              </h2>
              
              <div className="space-y-6 text-slate-700">
                <p className="text-lg sm:text-xl text-slate-900 font-bold leading-relaxed border-l-4 border-red-650 pl-5">
                  Event4Network, iş dünyasının liderlerini, girişimcilerini ve karar vericilerini aynı çatı altında buluşturan seçkin bir network platformu ve iş kulübüdür.
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-slate-600 pl-5">
                  Amacımız yalnızca insanların tanışmasını veya birbirlerine satış yapmasını sağlamak değildir. E4N’de temel hedef; üyelerin birbirini tanıdığı, uzmanlığına güvendiği ve zaman içerisinde birbirine iş, bilgi, bağlantı ve fırsat yönlendirebildiği kalıcı ilişkiler oluşturmaktır.
                </p>
              </div>

              <div className="mt-8 bg-red-50/50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-red-950 text-sm mb-1">E4N’nin Temel Yaklaşımı</h4>
                  <p className="text-red-900/90 text-sm font-semibold">Kalıcı iş ilişkileri için seçici networking.</p>
                </div>
              </div>
            </div>

            {/* Premium Interactive Image Card (Optimized for Mobile/Desktop layout hierarchy) */}
            <div className="lg:col-span-5 relative w-full flex justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl blur-2xl opacity-10"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white p-2 group hover:scale-[1.01] transition-transform duration-500 max-w-md w-full">
                <img
                  src={bizKimizNetwork}
                  alt="Event4Network Biz Kimiz"
                  className="rounded-2xl object-cover w-full h-[280px] sm:h-[360px] lg:h-[440px] hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
                
                {/* Float pulse badge */}
                <div className="absolute top-6 left-6 bg-slate-950/90 backdrop-blur-sm text-white px-4 py-2 rounded-2xl border border-white/10 text-xs font-bold shadow-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Güvene Dayalı Ekosistem
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. E4N Nedir? */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">NEDİR?</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
                E4N Seçici Networking Platformu
              </h2>
              <div className="space-y-6 text-slate-650 text-base sm:text-lg leading-relaxed">
                <p>
                  Event4Network, doğru insanları aynı ortamda buluşturmanın ötesinde, iş dünyasında kalıcı ve güvenilir ilişkiler geliştirmeyi hedefleyen seçici bir networking platformudur.
                </p>
                <p>
                  E4N üyeleri, tek bir karşılaşmayla sınırlı kalmadan düzenli olarak bir araya gelir; böylece zaman içinde birbirlerinin ne yaptığını, kime ulaşmak istediğini ve hangi alanlarda değer yaratabileceğini daha iyi anlar.
                </p>
                <p className="font-semibold text-slate-900">
                  Bu süreklilik, tanışıklıkları daha anlamlı bağlantılara dönüştürür ve doğru fırsatların, yönlendirmelerin ve iş birliklerinin doğal biçimde ortaya çıkmasına zemin hazırlar.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Nitelikli Topluluk</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sadece iş profili ve değer katma hedefleri onaylanmış elit yöneticiler yer alır.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-4">
                  <Handshake className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Güven Odaklı Buluşma</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tek seferlik kartvizit alışverişi yerine birbirini gerçekten tanıma esastır.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Stratejik Ağ Paylaşımı</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kişisel veya kurumsal bağlantı listeleri üzerinden bilinçli yönlendirmeler yapılır.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Süreç Verimliliği</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Toplantı ve 1-on-1 sistemleri sayesinde minimum zaman kaybı, maksimum iş hacmi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. E4N Ne Değildir? */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">NET DURUŞUMUZ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              E4N Ne Değildir?
            </h2>
            <p className="text-slate-550 text-base sm:text-lg">
              Event4Network platformunu doğru anlamak için ne olduğu kadar ne olmadığını da bilmek önemlidir.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              {
                title: "Kartvizit Toplama Alanı Değildir",
                desc: "Amacımız sadece kalabalık etkinliklerde yüzlerce kişiyle tanışıp kartvizit biriktirmek değildir. Önemli olan nitelikli ve işlevsel ilişkilerdir."
              },
              {
                title: "Hızlı Satış Ortamı Değildir",
                desc: "Herkesin herkese doğrudan ve ısrarla bir şeyler satmaya çalıştığı, yüzeysel ve rahatsız edici bir ticaret alanı değildir."
              },
              {
                title: "Kalabalık Buluşma Kulübü Değildir",
                desc: "Sadece kahve içip sohbet edilen veya kalabalık partiler düzenlenen, disiplinsiz ve verimsiz bir buluşma organizasyonu değildir."
              },
              {
                title: "Pasif Bekleme Yeri Değildir",
                desc: "Sadece kaydolup kenarda oturarak müşteri gelmesini umacağınız bir yer değildir. Düzenli katılım ve aktif katkı gerektirir."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600 mb-4">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3">{item.title}</h4>
                  <p className="text-xs text-slate-550 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. E4N Başvuru ve Üyelik Süreci */}
      <section id="nasil-calisir" className="py-24 bg-white relative border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">PLATFORM MEKANİĞİ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              E4N Nasıl Çalışır?
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              E4N sistemi, rastgelelikten arındırılmış, belirli kurallar ve aşamalardan oluşan profesyonel bir süreçtir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Başvuru ve Ön Değerlendirme",
                desc: "E4N’e katılım başvuru süreciyle başlar. Adayın iş alanı, profili, beklentileri ve platforma sağlayabileceği katkı değerlendirilir."
              },
              {
                step: "02",
                title: "Tanışma ve Uyum Görüşmesi",
                desc: "Başvuru sonrasında adayla bir ön görüşme yapılır. Bu görüşmede adayın E4N’den ne beklediği, hangi çevrelere ulaşmak istediği ve mevcut üyelerle nasıl bir değer alışverişi oluşturabileceği anlaşılır."
              },
              {
                step: "03",
                title: "Düzenli Toplantı Sistemi",
                desc: "E4N’de üyeler her ay düzenli olarak bir araya gelir. Yeni dönemde yapı şu şekilde ilerler: Ayda 1 online toplantı (verimlilik için) + Ayda 1 yüz yüze toplantı (derin güven ve ilişkiler için)."
              },
              {
                step: "04",
                title: "Birebir Görüşmeler",
                desc: "E4N’de asıl değer sadece toplu toplantılarda değil, üyelerin kendi aralarında yaptığı birebir görüşmelerde ortaya çıkar. Bu görüşmelerde üyeler birbirlerinin işini ve müşteri profilini tanır."
              },
              {
                step: "05",
                title: "Hedef Kişi ve Firma Listeleri",
                desc: "Üyeler ulaşmak istedikleri şirketleri, sektörleri veya karar verici profillerini paylaşabilir. Amaç 'herkesle tanışmak' değil, doğru kişilere doğru şekilde ulaşabilmektir."
              },
              {
                step: "06",
                title: "Güvene Dayalı Yönlendirme",
                desc: "İş yönlendirmesi, güven oluştuktan sonra anlam kazanır. Üyeler birbirini tanıdıkça, doğru fırsatlarda birbirlerini kendi çevrelerine tavsiye ederek referans sistemi oluşturur."
              }
            ].map((item, index) => (
              <div key={index} className="bg-slate-50 border border-slate-200/70 hover:shadow-xl hover:bg-white hover:border-red-100 rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <span className="text-4xl font-black text-slate-250 group-hover:text-red-500/10 transition-colors block mb-4">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-red-650 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Kimler İçin Uygun? */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">HEDEF KİTLE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Kimler İçin Uygun?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              E4N platformu, belirli bir profesyonel olgunluğa ve temsil gücüne sahip yöneticiler için verimlidir.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {[
              "Şirket Sahipleri",
              "Kurucu Ortaklar",
              "C-Level Yöneticiler",
              "Üst Düzey Yöneticiler",
              "İş Geliştirme Profesyonelleri",
              "Nitelikli Bağlantı Arayanlar"
            ].map((title, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center hover:border-red-500 hover:bg-white hover:shadow-md transition-all duration-300">
                <span className="font-bold text-sm text-slate-900">{title}</span>
              </div>
            ))}
          </div>

          <div className="bg-red-50 border border-red-200/80 rounded-3xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="w-12 h-12 bg-red-150 text-red-700 flex items-center justify-center rounded-2xl flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-red-950 text-lg mb-2">E4N'e Uygun Profil Felsefesi</h4>
              <p className="text-sm text-red-900/90 leading-relaxed">
                E4N’e katılan kişiler yalnızca networkten fayda sağlamayı değil, aynı zamanda sahip oldukları deneyim, bilgi ve bağlantılarla bu yapıya katkıda bulunmayı da önemsemelidir. Karşılıklı değer yaratma anlayışıyla hareket eden üyeler, E4N kültürünün ve güçlü bir iş ekosisteminin temelini oluşturur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Birebir Görüşmeler */}
      <section className="py-24 bg-white relative border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">DERİNLEMESİNE TANIŞMA</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
                Birebir Görüşmeler (1-on-1)
              </h2>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed mb-6">
                E4N’de asıl değer sadece toplu toplantılarda değil, üyelerin kendi aralarında yaptığı birebir görüşmelerde ortaya çıkar.
              </p>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed">
                Bu görüşmelerde üyeler birbirlerinin işini daha iyi anlar, hedef müşteri profilini öğrenir ve hangi bağlantılarda birbirine yardımcı olabileceğini netleştirir. İlişkiyi hızlandırmanın en samimi ve kurumsal yolu budur.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8">
              <h4 className="font-bold text-slate-900 mb-4">Görüşme Çıktıları Nelerdir?</h4>
              <ul className="space-y-4">
                {[
                  "İş modelinin ve güçlü yönlerin net anlaşılması",
                  "Hedef müşteri portföyü ve kilit kişilerin tespiti",
                  "Güven ilişkisinin bireysel seviyede derinleşmesi",
                  "Sektörel tavsiyeler ve bilgi alışverişi"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Lonca Mantığı (Sektörel Kümelenme) */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-650 uppercase tracking-widest font-mono">TAMAMLAYICI BİRLİKTELİK</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
                Lonca Topluluklarımıza Katılın
              </h2>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed mb-6 font-medium text-slate-800">
                Aynı sektörden iş insanlarının buluştuğu veya hedefiniz olan sektörden insanlarla tanışmak için lonca topluluklarımıza katılın.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                E4N içinde zamanla aynı müşteri kitlesine hizmet eden ama birbirinin doğrudan rakibi olmayan uzmanlar arasında daha odaklı iş birlikleri gelişebilir. Bu yapı, tamamlayıcı hizmet veren kişilerin birlikte daha güçlü fırsatlar üretmesini sağlar. Rekabet yerine kollektif iş geliştirme gücü esastır.
                <br /><br />
                E4N kendi üyelerinin dışarıdaki görünürlüğünü de desteklemek için bu ücretsiz toplulukları sık sık değerlendirir, kendi üyelerinin seminerler, webinarlar ve çeşitli paneller vermesini sağlayarak bu etkinliklerin duyurularını da bu loncalardan yapar.
              </p>
              <Button
                onClick={() => navigate('/auth/register-community')}
                className="text-xs font-bold px-6 h-10 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 rounded-xl"
              >
                Topluluklarımıza Katılın <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Guilds Carousel */}
            <div className="bg-slate-950 text-white rounded-3xl p-8 border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[350px]">
              <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-transparent pointer-events-none"></div>
              
              <div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <div className="flex gap-2 items-center text-emerald-400 font-bold text-sm">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    <span>Aktif WhatsApp Loncaları</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setGuildIndex(prev => (prev === 0 ? carouselGuilds.length - 1 : prev - 1))}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setGuildIndex(prev => (prev === carouselGuilds.length - 1 ? 0 : prev + 1))}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="min-h-[140px] relative z-10">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                    {carouselGuilds[guildIndex].tag || "Sektörel Lonca"}
                  </span>
                  <h3 className="text-xl font-bold mt-2 text-white mb-2">
                    {carouselGuilds[guildIndex].name}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {carouselGuilds[guildIndex].description}
                  </p>
                </div>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-white/5 pt-6 mt-4">
                {/* Dots indicator */}
                <div className="flex space-x-1.5">
                  {carouselGuilds.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGuildIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === guildIndex ? 'bg-emerald-500 w-4' : 'bg-white/20'
                      }`}
                    ></button>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/auth/register-community')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/20 transition-all transform active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" />
                  Gruba Katıl
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 14. Başvuru Çağrısı (Final CTA) */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full bg-red-900/10 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full bg-red-950/5 blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-4">KATILIM SÜRECİ</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            E4N’e Katılmak İçin Başvurun
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Event4Network, kapalı ve seçici bir iş dünyası kulübüdür. Kulüp üyeliği yalnızca sınırlı kontenjanla ve detaylı bir ön değerlendirme süreciyle gerçekleşir. Değerlendirme sürecine başvurarak uygunluğunuzu sorgulatabilir veya dışarıya açık ücretsiz topluluklarımıza katılarak ağımızdaki profesyonelleri takip edebilir, etkinliklerimizi izleyebilirsiniz.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-lg h-16 px-12 bg-red-600 hover:bg-red-550 hover:scale-105 transform transition-all shadow-xl font-bold rounded-xl"
            >
              Değerlendirme Başvurusu Yap <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
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
          onClick={() => navigate('/auth/register-community')}
          className="relative w-full flex items-center justify-between sm:justify-start gap-3 px-5 py-4 sm:py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(220,38,38,0.35)] hover:shadow-[0_15px_35px_rgba(220,38,38,0.5)] transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 active:scale-95 group border border-white/10 overflow-hidden"
        >
          {/* Shine background sweep effect on hover */}
          <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-25deg] -translate-x-full group-hover:animate-shine pointer-events-none"></div>

          <div className="flex items-center gap-2.5">
            {/* Pulse Green Dot Indicator */}
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
