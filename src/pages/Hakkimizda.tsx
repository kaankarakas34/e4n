import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { ArrowRight, Shield, Target, Award, CheckCircle, Handshake, Landmark } from 'lucide-react';

export function Hakkimizda() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <SEO
        title="Hakkımızda | Event4Network"
        description="Event4Network vizyonu, misyonu, kuruluş fikri ve değerleri. Seçici networking, güven ve referans kültürü üzerine inşa edilmiş bir iş ağı."
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
            "description": "Event4Network vizyonu, misyonu, kuruluş fikri ve değerleri. Seçici networking, güven ve referans kültürü üzerine inşa edilmiş bir iş ağı."
          }
        }}
      />

      {/* Hero Section */}
      <section className="relative py-24 bg-gray-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Hikayemiz ve Değerlerimiz
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Biz Kimiz?
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed font-light">
            Event4Network, iş dünyasında ilişkilerin hızlıca kurulup unutulduğu klasik yöntemler yerine, kalıcı ve nitelikli bağlar inşa eden bir referans ekosistemidir.
          </p>
        </div>
      </section>

      {/* Kuruluş Fikri */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
                Event4Network’ün Kuruluş Fikri
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  Geleneksel networking etkinliklerinde katılımcılar onlarca insanla tanışır, kartvizitlerini paylaşır ve ardından bu bağlantıları sürdüremeyip unuturlar. Güvenin oluşması, zaman ve düzenli temas gerektirir.
                </p>
                <p>
                  Event4Network, bu kopukluğu gidermek amacıyla kurulmuştur. Rastgele buluşmalar yerine dengeli, seçici ve disiplinli bir gruplaşma modeli sunarak, iş insanlarının birbirlerini derinlemesine tanımalarına ve güvene dayalı, sürdürülebilir referans ilişkileri kurmalarına zemin hazırlar.
                </p>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-inner flex flex-col justify-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Güven ve Referans Kültürü</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Bizler sadece bir networking kulübü değiliz; her üyenin kendi mesleğini en üst düzeyde temsil ettiği, iş itibarının karşılıklı referanslarla ödüllendirildiği profesyonel bir ekosistemiz.
              </p>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Seçicilik ve Standart</h4>
                  <p className="text-gray-500 text-xs">Maksimum verimlilik ve güven için her üye ön incelemeye tabi tutulur.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vizyon & Misyon */}
      <section className="py-24 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-sm flex gap-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Vizyonumuz</h3>
                <p className="text-gray-650 text-sm leading-relaxed">
                  Türkiye ve küresel pazarda, iş dünyası profesyonellerinin referansla büyümesini standartlaştıran en prestijli ve güvenilir seçici networking ekosistemi olmak.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-sm flex gap-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Misyonumuz</h3>
                <p className="text-gray-650 text-sm leading-relaxed">
                  Doğru iş insanlarını karşılıklı değer ve güven ilkeleri etrafında bir araya getirmek; kurumsal standartlarda dikey ağ buluşmaları ile iş hacimlerini artırmalarına öncülük etmek.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Değerlerimiz */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">İlkelerimiz</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Değerlerimiz</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Güven',
                desc: 'Tüm ilişkilerimizin temel taşıdır. Birbirimizin kalitesine ve taahhütlerine inanırız.'
              },
              {
                icon: CheckCircle,
                title: 'Nitelik',
                desc: 'Kalabalık olmaktansa nitelikli olmayı seçer, üye profilimizde kaliteyi koruruz.'
              },
              {
                icon: Award,
                title: 'Seçicilik',
                desc: 'Üyelerimizin iş geçmişi, temsil gücü ve meslek koltuğu durumlarını hassasiyetle eleriz.'
              },
              {
                icon: Landmark,
                title: 'Profesyonel Temsil',
                desc: 'Her üye, hem kendi işini hem de grubun itibarını en iyi şekilde temsil eder.'
              },
              {
                icon: Handshake,
                title: 'Karşılıklı Değer',
                desc: 'Sadece faydalanmak için değil, ekosisteme katkı sağlamak amacıyla hareket ederiz.'
              },
              {
                icon: Target,
                title: 'Uzun Vadeli İlişki',
                desc: 'Günübirlik ticari kazançlar yerine, yıllar boyu sürecek stratejik dostluklar hedefleriz.'
              }
            ].map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-6">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{value.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Bizimle İletişime Geçin
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            Sorularınız, iş birliği teklifleriniz veya kurumsal talepleriniz için ekibimizle temasa geçebilirsiniz.
          </p>
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/iletisim')}
            className="text-lg h-14 px-10 font-bold bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30"
          >
            İletişim Formunu Doldur <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Kurucular Section */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">YÖNETİM</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Kurucular</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex items-center justify-center h-32 hover:shadow-md transition-shadow duration-300">
              <span className="text-xl font-bold text-gray-900">Kaan Karakaş</span>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex items-center justify-center h-32 hover:shadow-md transition-shadow duration-300">
              <span className="text-xl font-bold text-gray-900">Ada Topçu</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
