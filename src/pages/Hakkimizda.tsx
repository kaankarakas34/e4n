import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../shared/Button';
import {
  Shield,
  Handshake,
  Repeat,
  Eye,
  Users,
  Compass,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export function Hakkimizda() {
  const navigate = useNavigate();

  const values = [
    {
      title: 'Güven',
      desc: 'Uzmanlık ve çalışma biçimi zaman içinde tanınır.',
      icon: Shield
    },
    {
      title: 'Karşılıklı katkı',
      desc: 'Bilgi, bağlantı ve deneyim paylaşımı önemlidir.',
      icon: Handshake
    },
    {
      title: 'Süreklilik',
      desc: 'Düzenli katılım ve takip, ilişki geliştirme sürecinin parçasıdır.',
      icon: Repeat
    },
    {
      title: 'Açıklık',
      desc: 'Katılım yolu, üyelik koşulları ve grup kabulü anlaşılır biçimde açıklanır.',
      icon: Eye
    }
  ];

  const founders = [
    {
      name: 'Kaan Karakaş',
      role: 'Kurucu',
      desc: 'İş dünyasında sürdürülebilir networking modelinin ve E4N ekosisteminin kurucu lideri.'
    },
    {
      name: 'Ada Topçu',
      role: 'Kurucu',
      desc: 'Topluluk yönetimi, üye deneyimi ve iş geliştirme stratejilerinin kurucu ortağı.'
    }
  ];

  return (
    <div className="bg-white min-h-screen pt-20 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <SEO
        title="E4N Hakkımızda | Event4Network'ün Kuruluş Amacı"
        description="Event4Network'ün kuruluş amacını, güven ve karşılıklı katkı yaklaşımını ve kurucuları Kaan Karakaş ile Ada Topçu'yu tanıyın."
        canonical="https://www.event4network.com/hakkimizda"
        schema={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "mainEntity": {
            "@type": "Organization",
            "name": "Event4Network",
            "alternateName": "E4N",
            "url": "https://www.event4network.com",
            "logo": "https://www.event4network.com/e4n-logo.png",
            "description": "Event4Network'ün kuruluş amacını, güven ve karşılıklı katkı yaklaşımını ve kurucuları Kaan Karakaş ile Ada Topçu'yu tanıyın."
          }
        }}
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            Kuruluş Amacımız
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            İş ilişkilerine süreklilik <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              kazandırmak için buradayız
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Event4Network, iş insanlarının birbirini düzenli olarak tanıyabildiği ve uzmanlığını daha iyi anlayabildiği bir ilişki ağı oluşturmak amacıyla geliştirildi.
          </p>
        </div>
      </section>

      {/* Giriş & Süreç Özeti */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              Yeni bir bağlantının değer kazanması zaman, takip ve karşılıklı güven gerektirir. E4N; açık topluluklar, etkinlikler ve küçük kapalı gruplarla bu sürece düzenli bir çalışma zemini sunar.
            </p>
          </div>
        </div>
      </section>

      {/* Kuruluş Fikrimiz */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            BAŞLANGIÇ NOKTAMIZ
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Kuruluş fikrimiz
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              Bir işletmenin güçlü bir çevre oluşturması için işini anlayan insanlarla temas kurması gerekir. Bu insanlar uygun müşterileri, tamamlayıcı hizmetleri veya yeni iş ortaklarını tanıyor olabilir.
            </p>
            <p>
              E4N'nin kuruluş fikri, bu ilişkilerin oluşmasını ve gelişmesini destekleyen bir model kurmaktır. Üyeler işlerini anlatır, birbirini dinler ve zaman içinde nerede ortak değer üretebileceklerini daha iyi görür.
            </p>
          </div>
        </div>
      </section>

      {/* Çalışma Yaklaşımımız */}
      <section className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            MODELİMİZ
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Çalışma yaklaşımımız
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-8">
            <p>
              Açık loncalar geniş bir iletişim alanı oluşturur. Etkinlikler yeni insanlarla ve fikirlerle karşılaşma fırsatı sunar. Kapalı gruplar düzenli ve daha odaklı ilişki geliştirmeye imkân verir.
            </p>
            <p>
              Grup kabulünde hizmet dengesi ve uyum değerlendirilir. Dört aylık dönemler ve shuffle, ilişkilerin hem derinleşmesini hem yeni çevrelere açılmasını destekler.
            </p>
          </div>
        </div>
      </section>

      {/* Değerlerimiz */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              İLKELERİMİZ
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Değerlerimiz
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-white text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-200/60">
                    <val.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{val.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kurucular */}
      <section className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            LİDERLİK
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
            Kurucular
          </h2>

          <div className="grid sm:grid-cols-2 gap-8">
            {founders.map((founder, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-black text-xl mb-6">
                    <UserCheck className="w-7 h-7 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{founder.name}</h3>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-4">
                    {founder.role}
                  </span>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {founder.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Birlikte çalışalım */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">
            İLETİŞİM
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
            Birlikte çalışalım
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Üyelik, etkinlik, konuşmacılık veya kurumsal iş birliği hakkında bizimle iletişime geçebilirsiniz.
          </p>
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/iletisim')}
            className="font-bold bg-red-600 hover:bg-red-500 text-white px-8 h-12 shadow-lg shadow-red-900/30"
          >
            İletişime Geçin
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
