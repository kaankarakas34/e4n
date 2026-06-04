import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Check,
  Briefcase,
  Award,
  Users,
  Clock,
  Compass,
  HeartHandshake
} from 'lucide-react';

export function Uyelik() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <Helmet>
        <title>Üyelik Süreci ve Kriterleri | Event4Network</title>
        <meta name="description" content="E4N’de amaç çok kişi almak değil, doğru insanları doğru zeminde buluşturmaktır. Değerlendirme adımlarını ve üyelik şartlarını detaylarıyla öğrenin." />
        <link rel="canonical" href="https://www.event4network.com/uyelik" />
      </Helmet>

      {/* 1. Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Üye Olgunluğu & Seçicilik
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Üyelik Süreci ve Kriterleri
          </h1>
          <p className="text-lg sm:text-xl text-slate-350 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            E4N’de amaç çok kişi almak değil, doğru insanları doğru zeminde buluşturmaktır. Üyelik, doğrudan bir kayıt işlemi değil; adayın iş profilini, temsil gücünü ve gruba sunabileceği katkıyı ele alan karşılıklı bir değerlendirme sürecidir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Değerlendirme Başvurusu Yap
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/nasil-calisir')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Sistem Nasıl Çalışır?
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Değerlendirme Neden Önemli? */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">SÜREÇ YAKLAŞIMI</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
            Neden Kayıt Değil de Değerlendirme?
          </h2>
          <div className="space-y-6 text-slate-650 text-base sm:text-lg leading-relaxed text-left max-w-4xl mx-auto">
            <p>
              E4N sıradan bir rehber listesi veya herkesin serbestçe katılabildiği bir organizasyon değildir. Biz, üyelerimizin kendi çevrelerine güvenle önerebileceği nitelikli bir iş çevresi oluşturmayı hedefliyoruz.
            </p>
            <p>
              Bir üyenin diğer bir üyeye güvenerek onu kendi referans ağına açabilmesi için, her üyenin profesyonel duruşunun, etik standartlarının ve iş kalitesinin belirli bir düzeyde olması gerekir. Bu sebeple değerlendirme süreci, topluluğumuzun kalite standartlarını korumak için zorunlu bir adımdır.
            </p>
            <p className="font-semibold text-slate-950 bg-slate-50 border border-slate-200 rounded-2xl p-6">
              📌 Değerlendirme süreci bir dışlama aracı değil; grup içindeki sinerjiyi, sektörel dengeleri ve güvenli referans ortamını güvenceye alma yöntemidir.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Kimler İçin Uygun Değildir? */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">AÇIK VE NET DURUŞ</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-6">
                E4N Kimler İçin Uygun Değildir?
              </h2>
              <p className="text-slate-350 leading-relaxed mb-6 text-sm sm:text-base">
                Event4Network, her iş modeli veya her profesyonel yaklaşım için doğru yer olmayabilir. Aşağıdaki yaklaşımlara sahip kişilerin platformdan verim alması mümkün değildir:
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
              <ul className="space-y-6">
                {[
                  {
                    title: "Hızlı Satış Odaklılar",
                    desc: "Güven bağı kurmak yerine, ilk toplantıdan itibaren gruptaki üyelere doğrudan satış yapmaya odaklananlar."
                  },
                  {
                    title: "Zaman Ayıramayacak Olanlar",
                    desc: "Düzenli toplantılara katılmak, birebir görüşmelere zaman ayırmak ve ilişkileri beslemek istemeyenler."
                  },
                  {
                    title: "Katkı Kültürüne Uzak Olanlar",
                    desc: "Sadece gruptan iş referansı veya müşteri almayı bekleyip, kendi çevresini ve bağlantılarını paylaşmaktan kaçınanlar."
                  },
                  {
                    title: "Disiplinsiz Yaklaşımlar",
                    desc: "Temsil standardına, iletişim kurallarına ve katılım sözlerine önem vermeyen, süreksiz profiller."
                  }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4 items-start text-sm">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">{item.title}</strong>
                      <span className="text-slate-350 text-xs leading-relaxed">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Temel Üyelik Kriterleri */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">KRİTERLERİMİZ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Üye Değerlendirme Kriterleri
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Ön değerlendirmede adayın mesleğinden ziyade, platformun referans kültürüne katabileceği değerler ve profesyonel olgunluğu ele alınır.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Briefcase,
                title: "Profesyonel Tecrübe",
                desc: "Adayın iş modelinin belirli bir olgunluğa, faaliyet geçmişine ve hizmet kalitesine ulaşmış olması beklenir."
              },
              {
                icon: Award,
                title: "Temsil ve Konumlandırma",
                desc: "Kişinin kendi uzmanlığını net ifade edebilmesi, profesyonel itibar standartlarını taşıması önemlidir."
              },
              {
                icon: Users,
                title: "Karşılıklı Katkı Anlayışı",
                desc: "Topluluğa sadece referans almak için değil, diğer üyelerin işini de büyütmeye yardımcı olmak amacıyla katılması esastır."
              },
              {
                icon: Clock,
                title: "Katılım Disiplini",
                desc: "Düzenli online ve yüz yüze toplantılara katılım ve birebir görüşmelere zaman ayırma sözü aranır."
              },
              {
                icon: HeartHandshake,
                title: "Güven ve Etik Değerler",
                desc: "Ticari ve profesyonel ilişkilerde şeffaflık, iş ahlakına uygun hareket etme prensibi ön koşuldur."
              },
              {
                icon: Compass,
                title: "Nitelikli Çevre Paylaşımı",
                desc: "Üyenin kendi güvenilir bağlantılarını, uygun durumlarda gruptaki diğer profesyonellerle tanıştırmaya açık olması istenir."
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200/70 p-8 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                  <div>
                    <div className="w-12 h-12 bg-red-50 text-red-650 flex items-center justify-center rounded-xl mb-6">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-3">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Önemli Bilgilendirme */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-8 flex items-start gap-4 shadow-sm">
            <ShieldAlert className="h-8 w-8 text-red-650 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-950 text-lg mb-2">Önemli Bilgilendirme</h3>
              <p className="text-red-900/90 text-sm leading-relaxed">
                Event4Network seçici bir yapıyla çalışır. Form doldurularak yapılan başvurular doğrudan bir kayıt veya üyelik garantisi oluşturmaz. Tüm başvurular sektörel çakışma, grup dengeleri ve topluluk kültürü doğrultusunda değerlendirilir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Sayfa Sonu CTA */}
      <section className="py-20 bg-slate-950 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Event4Network Kültürüne Katılın
          </h2>
          <p className="text-lg text-slate-350 mb-10 max-w-2xl mx-auto font-light">
            Eğer siz de karşılıklı değer ve güven esasına dayalı seçici bir yapıda yer almak istiyorsanız, ilk adımı atın ve başvurunuzu iletin.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-base h-14 px-10 font-bold bg-red-600 hover:bg-red-500 shadow-lg shadow-red-950/50"
            >
              Değerlendirme Başvurusu Başlat
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
