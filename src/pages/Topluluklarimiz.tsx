import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
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
  Users
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
  const { user } = useAuthStore();

  const generalCommunities: CommunityItem[] = [
    {
      name: "Duyurular Grubu",
      url: "https://chat.whatsapp.com/GTlmZQUrjT402yi5swGQ5c",
      description: "Etkinliklerimizden, duyurularımızdan ve önemli gelişmelerden anında haberdar olun.",
      icon: Megaphone,
      badge: "Önemli"
    },
    {
      name: "Genel İş Ağı Grubu",
      url: "https://chat.whatsapp.com/DeBaBEYP0D89O1HxD6vgCK",
      description: "Tüm sektörlerden profesyonellerin yer aldığı genel iş ağı topluluğumuz.",
      icon: Network
    }
  ];

  const guilds: CommunityItem[] = [
    {
      name: "Girişimcilik Loncası",
      url: "https://chat.whatsapp.com/FMovNudN2AyBYpoiW4VmtD",
      description: "Girişimciler, start-up kurucuları ve yatırımcılar için iş geliştirme alanı.",
      icon: Lightbulb
    },
    {
      name: "Üretim Sanayi İhracat Loncası",
      url: "https://chat.whatsapp.com/KCpg9gk5AFk7oNkLRkI0eo",
      description: "Sanayiciler, üreticiler ve ihracat odaklı iş yapan profesyonellerin grubu.",
      icon: Factory
    },
    {
      name: "Hukuk Mali ve Kurumsal Hizmetler Loncası",
      url: "https://chat.whatsapp.com/DcIXluAZmgTE9p2MfiSnfj",
      description: "Avukatlar, mali müşavirler, kurumsal danışmanlar ve hizmet sağlayıcılar.",
      icon: Briefcase
    },
    {
      name: "Pazarlama Medya ve İletişim Loncası",
      url: "https://chat.whatsapp.com/I8UWdo9VXUmHABcHNAKs8S",
      description: "Reklam, pazarlama, PR, sosyal medya ve yaratıcı ajans liderleri.",
      icon: MessageSquare
    },
    {
      name: "Sağlık ve Medikal Loncası",
      url: "https://chat.whatsapp.com/LU4Ebh7aBvUJ4Ww5vMpsG2",
      description: "Sağlık turizmi, klinik sahipleri, medikal üreticiler ve sağlık sektörü paydaşları.",
      icon: HeartPulse
    },
    {
      name: "E-Ticaret ve E-İhracat Loncası",
      url: "https://chat.whatsapp.com/CH0MKdmSnCaCTzSMjuzfos",
      description: "E-ticaret marka sahipleri, pazar yeri satıcıları ve lojistik/ödeme entegratörleri.",
      icon: ShoppingBag
    },
    {
      name: "Yazılım ve Yapay Zeka Loncası",
      url: "https://chat.whatsapp.com/BqUKVSoC6zL91ml0rh9Lxk",
      description: "Yazılım şirketi kurucuları, CTO'lar ve yapay zeka alanında çalışan teknoloji uzmanları.",
      icon: Cpu,
      badge: "Popüler"
    },
    {
      name: "Yapı ve Gayrimenkul Loncası",
      url: "https://chat.whatsapp.com/H3rqf63KLKBDQeCvZBe7eg",
      description: "İnşaat, mimarlık, iç mimarlık, gayrimenkul geliştirme ve danışmanlık ağı.",
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <Helmet>
        <title>Topluluklarımıza Katılın | Event4Network</title>
        <meta name="description" content="Event4Network ücretsiz WhatsApp gruplarına ve loncalarına katılın. Sektörel iş ağınızı genişletin ve etkinliklerden anında haberdar olun." />
        <link rel="canonical" href="https://www.event4network.com/topluluklarimiz" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[120px]"></div>
          <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-red-800/10 blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            👥 Ücretsiz İş Ağımıza Dahil Olun
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-6">
            E4N Topluluklarına Katılın
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto font-light">
            Ücretsiz topluluklarımıza katılıp etkinliklerimizden anında haberdar olun, sektörel gelişmeleri takip edin ve birçok profesyonelle tanışma şansı yakalayın.
          </p>
        </div>
      </section>

            {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
        {!user ? (
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl shadow-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
              
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>

              <span className="text-xs font-mono font-bold text-red-650 uppercase tracking-widest block mb-3">
                E4N TOPLULUK GİRİŞ KAPISI
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                Ücretsiz Topluluk Profili Oluşturun
              </h2>
              
              <p className="text-slate-650 text-base leading-relaxed mb-8 max-w-xl mx-auto">
                Event4Network, kapalı ve seçici bir iş dünyası kulübüdür. Loncalara katılarak ağımızdaki seçkin iş insanlarını takip etmek, deneyimlerini izlemek ve dışarıya açık etkinliklerimizi takip etmek için ücretsiz Topluluk Profili oluşturun.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => navigate('/auth/register-community')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-red-600 hover:bg-red-550 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-200 transition-all transform active:scale-95"
                >
                  Topluluk Profili Oluştur
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/auth/login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl border border-slate-350 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm tracking-wide transition-all transform active:scale-95"
                >
                  Giriş Yap
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Category 1: Genel Gruplar */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8 pb-3 border-b border-slate-200">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Genel İletişim & Duyuru Kanalları</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {generalCommunities.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                          <item.icon className="w-6 h-6" />
                        </div>
                        {item.badge && (
                          <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-red-650 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-slate-655 text-sm leading-relaxed mb-8">
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
                      WhatsApp Grubuna Katıl
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 2: Sektörel Loncalar */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8 pb-3 border-b border-slate-200">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Sektörel Loncalar (WhatsApp)</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {guilds.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-10 h-10 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center group-hover:bg-red-650 group-hover:text-white transition-all duration-300">
                          <item.icon className="w-5 h-5" />
                        </div>
                        {item.badge && (
                          <span className="bg-red-50 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-100">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-red-655 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed mb-6">
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
                      Katıl
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 3: Sosyal Medya */}
            <div>
              <div className="flex items-center gap-3 mb-8 pb-3 border-b border-slate-200">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <Linkedin className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Sosyal Medya Kanallarımız</h2>
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
                      className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 group flex flex-col justify-between"
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
                        <p className="text-slate-655 text-sm leading-relaxed mb-8">
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
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
</div>
  );
}
