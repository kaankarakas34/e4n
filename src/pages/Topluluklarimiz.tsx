import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../shared/Button';
import {
  Megaphone,
  Network,
  Lightbulb,
  Factory,
  Briefcase,
  MessageSquare,
  HeartPulse,
  ShoppingBag,
  Cpu,
  Building2,
  Linkedin,
  Instagram,
  ArrowRight,
  MessageCircle,
  Users,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface CommunityItem {
  name: string;
  url: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

export function Topluluklarimiz() {
  const navigate = useNavigate();

  const generalCommunities: CommunityItem[] = [
    {
      name: "Duyurular Grubu",
      url: "https://chat.whatsapp.com/GTlmZQUrjT402yi5swGQ5c",
      description: "Etkinliklerimizden, duyurularımızdan ve önemli gelişmelerden anında haberdar olun.",
      icon: Megaphone,
      badge: "Resmi Duyurular"
    },
    {
      name: "Genel İş Ağı Grubu",
      url: "https://chat.whatsapp.com/DeBaBEYP0D89O1HxD6vgCK",
      description: "Tüm sektörlerden profesyonellerin yer aldığı genel iş ağı topluluğumuz.",
      icon: Network,
      badge: "Genel Ağ"
    }
  ];

  const guilds: CommunityItem[] = [
    {
      name: "Girişimcilik Loncası",
      url: "https://chat.whatsapp.com/FMovNudN2AyBYpoiW4VmtD",
      description: "Girişim kurma ve geliştirme süreçleri, iş modelleri ve kurucu deneyimleri üzerine bilgi alışverişi.",
      icon: Lightbulb
    },
    {
      name: "Yazılım ve Yapay Zekâ Loncası",
      url: "https://chat.whatsapp.com/BqUKVSoC6zL91ml0rh9Lxk",
      description: "Yazılım, teknoloji üretimi ve yapay zekâ uygulamaları etrafında profesyonel paylaşım.",
      icon: Cpu,
      badge: "Teknoloji"
    },
    {
      name: "Üretim, Sanayi ve İhracat Loncası",
      url: "https://chat.whatsapp.com/KCpg9gk5AFk7oNkLRkI0eo",
      description: "Üretim, sanayi ve dış pazarlara açılma konularında deneyim ve iş bağlantıları.",
      icon: Factory
    },
    {
      name: "Pazarlama, Medya ve İletişim Loncası",
      url: "https://chat.whatsapp.com/I8UWdo9VXUmHABcHNAKs8S",
      description: "Pazarlama, reklam, medya ve iletişim alanındaki uzmanlıkları buluşturan topluluk.",
      icon: MessageSquare
    },
    {
      name: "Hukuk, Mali ve Kurumsal Hizmetler Loncası",
      url: "https://chat.whatsapp.com/DcIXluAZmgTE9p2MfiSnfj",
      description: "İşletmelerin hukuki, mali ve kurumsal ihtiyaçlarına ilişkin profesyonel paylaşım.",
      icon: Briefcase
    },
    {
      name: "Sağlık ve Medikal Loncası",
      url: "https://chat.whatsapp.com/LU4Ebh7aBvUJ4Ww5vMpsG2",
      description: "Sağlık işletmeleri, sağlık turizmi ve medikal alanda çalışan profesyonellerin iletişim alanı.",
      icon: HeartPulse
    },
    {
      name: "E-Ticaret ve E-İhracat Loncası",
      url: "https://chat.whatsapp.com/CH0MKdmSnCaCTzSMjuzfos",
      description: "Dijital ticaret, pazar yerleri, lojistik ve dış pazarlar üzerine bilgi alışverişi.",
      icon: ShoppingBag
    },
    {
      name: "Yapı ve Gayrimenkul Loncası",
      url: "https://chat.whatsapp.com/H3rqf63KLKBDQeCvZBe7eg",
      description: "Yapı sektörü, gayrimenkul ve tamamlayıcı hizmetlerde çalışan profesyonellerin topluluğu.",
      icon: Building2
    }
  ];

  const socialMedia: CommunityItem[] = [
    {
      name: "LinkedIn Grubu",
      url: "https://www.linkedin.com/groups/33110020/",
      description: "İş dünyasındaki bağlantılarınızı güçlendirmek ve gönderilerinizi paylaşmak için grubumuza katılın.",
      icon: Linkedin
    },
    {
      name: "LinkedIn Sayfası",
      url: "https://www.linkedin.com/company/event4network",
      description: "E4N gelişmelerini, etkinlik fotoğraflarını ve kurumsal duyuruları resmi sayfamızdan takip edin.",
      icon: Linkedin
    },
    {
      name: "Instagram Sayfası",
      url: "https://www.instagram.com/event4network/",
      description: "Görsel paylaşımlarımız, etkinlik özetleri ve canlı yayın duyurularımız için bizi Instagram'da takip edin.",
      icon: Instagram
    }
  ];

  const cities = [
    {
      name: "İstanbul",
      path: "/networking/istanbul",
      desc: "İstanbul iş dünyası için açık topluluklar, etkinlik takvimi ve grup başvuru süreci."
    },
    {
      name: "Ankara",
      path: "/networking/ankara",
      desc: "Başkentteki girişimciler ve şirket yöneticileri için E4N buluşmaları ve duyuruları."
    },
    {
      name: "İzmir",
      path: "/networking/izmir",
      desc: "Ege bölgesindeki iş insanları için networking kanalları ve yerel etkinlik bilgileri."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-500 selection:text-white pt-20">
      <SEO
        title="E4N Toplulukları ve Loncaları | Açık İş Ağı Kanalları"
        description="E4N'nin ücretsiz açık loncalarına katılın. Sektörel paylaşımları, etkinlik duyurularını ve iş dünyası topluluklarını keşfedin."
        canonical="https://www.event4network.com/topluluklarimiz"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[120px]"></div>
          <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-red-800/10 blur-[100px]"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            👥 Ücretsiz Açık Loncalar
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            İş alanınıza uygun topluluklarla <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              bağlantıda kalın
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            E4N'nin açık loncaları; aynı sektörün profesyonellerini ve o alanla iş birliği geliştirmek isteyen kişileri buluşturur. Bilgi paylaşımı, sektör gündemi ve etkinlik duyuruları için size uygun topluluğa katılabilirsiniz.
          </p>
        </div>
      </section>

      {/* Açık loncalar nasıl çalışır? */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              ÇALIŞMA MODELİ
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              Açık loncalar nasıl çalışır?
            </h2>
            <div className="space-y-4 text-slate-700 text-base leading-relaxed">
              <p>
                Loncalar geniş katılımlı topluluk kanallarıdır. Kapalı grupların 35 kişilik kapasite ve hizmet tekilliği modeli bu alanlara uygulanmaz. Aynı meslekten veya sektörden birden fazla kişi bir loncada bulunabilir.
              </p>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Açık WhatsApp topluluklarına katılmak için E4N hesabı açmanız veya abonelik satın almanız gerekmez.</strong> Topluluk katılımı ücretsizdir; ilgili kanalın iletişim kuralları geçerlidir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Category 1: Genel Gruplar */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Genel İletişim & Duyuru Kanalları</h2>
              <p className="text-sm text-slate-500 mt-0.5">Topluluk duyuruları ve genel iş ağı kanalları</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {generalCommunities.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                      <item.icon className="w-6 h-6" />
                    </div>
                    {item.badge && (
                      <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {item.name}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8">
                    {item.description}
                  </p>
                </div>
                
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide shadow-md shadow-emerald-950/10 hover:shadow-lg transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  Topluluğa Katıl
                  <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Category 2: Sektörel Loncalar */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Loncaları Keşfedin</h2>
              <p className="text-sm text-slate-500 mt-0.5">8 temel iş alanında aktif ücretsiz WhatsApp loncaları</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {guilds.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5" />
                    </div>
                    {item.badge && (
                      <span className="bg-red-50 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-100">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>
                
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold text-xs tracking-wide transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Topluluğa Katıl
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Category 3: Sosyal Medya */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Linkedin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sosyal Medya Kanallarımız</h2>
              <p className="text-sm text-slate-500 mt-0.5">Profesyonel ağlarda E4N topluluğunu takip edin</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {socialMedia.map((item, idx) => {
              const isLinkedin = item.name.includes("LinkedIn");
              const buttonColorClass = isLinkedin 
                ? "bg-[#0a66c2] hover:bg-[#004182]" 
                : "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90";
              const buttonText = isLinkedin 
                ? (item.name.includes("Grubu") ? "LinkedIn Grubuna Katıl" : "LinkedIn'de Takip Et")
                : "Instagram'da Takip Et";

              return (
                <div 
                  key={idx} 
                  className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${isLinkedin ? 'bg-[#0a66c2]' : 'bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045]'}`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {item.name}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-8">
                      {item.description}
                    </p>
                  </div>
                  
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm tracking-wide shadow-md transition-all ${buttonColorClass}`}
                  >
                    <item.icon className="w-5 h-5" />
                    {buttonText}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Düzenli grup çalışması arıyorsanız */}
        <div className="mb-20 bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-3xl relative z-10">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-3">
              KAPALI GRUP FARKI
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mb-4">
              Düzenli grup çalışması arıyorsanız
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              Bir lonca kanalına katılmak E4N aboneliği veya kapalı grup üyeliği sağlamaz. 35 kişilik bir grupta düzenli ilişki geliştirmek için üyelik ve grup başvuru sürecini inceleyebilirsiniz.
            </p>
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/kapali-gruplar')}
              className="font-bold bg-red-600 hover:bg-red-500 text-white px-8 h-12 shadow-lg shadow-red-900/30"
            >
              Kapalı Grupları İncele
            </Button>
          </div>
        </div>

        {/* Şehrinizde E4N */}
        <div id="sehirler" className="pt-8 border-t border-slate-200 scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Şehrinizde E4N</h2>
              <p className="text-sm text-slate-500 mt-0.5">Yerel duyurular ve başvuru bilgileri</p>
            </div>
          </div>
          <p className="text-slate-700 text-base leading-relaxed mb-8 max-w-3xl">
            İstanbul, Ankara ve İzmir sayfalarından yerel duyuruları ve başvuru bilgilerini takip edebilirsiniz. Grup veya etkinliklerin güncel durumu her şehir sayfasında açıklanır.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {cities.map((city, idx) => (
              <div 
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-red-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{city.name}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-6">{city.desc}</p>
                </div>
                <button
                  onClick={() => navigate(city.path)}
                  className="inline-flex items-center justify-between text-sm font-bold text-red-600 hover:text-red-700 group pt-2 border-t border-slate-100"
                >
                  <span>Şehir Bilgilerini Gör</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
