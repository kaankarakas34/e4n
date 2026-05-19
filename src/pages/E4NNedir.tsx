import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { ShieldCheck, Handshake, Users, ArrowRight, Activity, Calendar, Star } from 'lucide-react';

export function E4NNedir() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <Helmet>
        <title>E4N Nedir? | Seçici Networking Ekosistemi</title>
        <meta name="description" content="Event4Network (E4N), doğru çevrede güvene dayalı, sürdürülebilir ve nitelikli iş ilişkileri kurmak isteyen iş insanları için tasarlanmış seçici bir networking ekosistemidir." />
        <link rel="canonical" href="https://www.event4network.com/e4n-nedir" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-28 bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/20 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Seçici İş Ağı Ekosistemi
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-8 leading-tight max-w-4xl mx-auto">
            Doğru Çevrede, Güvene Dayalı <span className="text-red-500">Nitelikli İlişkiler</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Event4Network, doğru insanlarla tanışmak isteyen değil; doğru çevrede güvene dayalı, sürdürülebilir ve nitelikli iş ilişkileri kurmak isteyen iş insanları için tasarlanmış seçici bir networking ekosistemidir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-lg h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto"
            >
              Değerlendirme Başvurusu Yap
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/uyelik')}
              className="text-lg h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 w-full sm:w-auto"
            >
              Üyelik Sürecini İncele
            </Button>
          </div>
        </div>
      </section>

      {/* Klasik Networking'den Farkı */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Klasik Networking ile Farkımız Nedir?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Event4Network, yüzeysel tanışmalar yerine derinleşen güven ve kurumsal temsil üzerine kuruludur.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600"></span> Klasik Networking
              </h3>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✕</span>
                  <span><strong>Yüzeysel Tanışmalar:</strong> Tek seferlik etkinliklerde insanlar birbirini yeterince tanıyamaz, sadece kartvizit alışverişi yapılır.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✕</span>
                  <span><strong>Güven Eksikliği:</strong> İş yönlendirmesi için sadece tanışmak yetmez; güven oluşmadan referans verilmez.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✕</span>
                  <span><strong>Takip Eksikliği:</strong> Düzenli temas kurulmadığında kurulan zayıf ilişkiler kısa sürede kopar.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
              <h3 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Event4Network Yaklaşımı
              </h3>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Seçici Networking:</strong> Sadece meslek uygunluğuna değil, faaliyet süresi, referans ve profesyonel olgunluğa göre üyelik.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Düzenli Görüşmeler:</strong> Belirli aralıklarla yapılan disiplinli toplantılarla sürekli ve nitelikli görünürlük.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Karşılıklı Değer:</strong> Ortak hedeflere sahip iş insanlarının oluşturduğu güven ağı ile sürdürülebilir iş referansları.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Seçici Networking Yaklaşımı */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Felsefemiz</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-6">
                Nitelikli İş İnsanları Ağı
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  Event4Network, rastgele tanışmalardan ziyade, üyelerin her birinin profesyonel olarak birbirini temsil edebileceği bir güven ortamı yaratır. Her üye, sadece kendi uzmanlığıyla değil, iş ahlakı ve profesyonel olgunluğuyla bu yapıya değer katar.
                </p>
                <div className="grid sm:grid-cols-2 gap-6 pt-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Güven ve Temsil</h4>
                      <p className="text-sm text-gray-500">Üyelerimiz birbirini güvenle temsil eder.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Handshake className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Karşılıklı Değer</h4>
                      <p className="text-sm text-gray-500">Sadece almak değil, karşılıklı değer üretmek esastır.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 relative">
              <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden relative border border-gray-100 shadow-inner flex items-center justify-center p-8">
                <div className="text-center">
                  <Star className="h-16 w-16 text-red-600 mx-auto mb-4 animate-pulse" />
                  <p className="text-xl font-bold text-gray-900 mb-2">Seçici Eşleşme ve Denge</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Aynı meslek veya doğrudan rekabet oluşturan alanlar çakışmaz, her üye kendi koltuğunda profesyonelce yer alır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır? */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">İşleyiş</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              Sistem Nasıl Çalışır?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Event4Network ekosisteminde iş akışı ve ilişkilerin gelişmesi üç temel sürece dayanır.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1. Düzenli Toplantılar</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Üyelerimiz düzenli aralıklarla gerçekleştirilen disiplinli toplantılarda bir araya gelerek güncel faaliyetlerini, uzmanlıklarını ve hedef kitlelerini paylaşırlar.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">2. Birebir Görüşmeler</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Asıl güven inşası, üyelerin kendi aralarında düzenledikleri birebir toplantılarla gerçekleşir. Birbirlerinin işlerini, vizyonunu ve referans çevrelerini detaylıca öğrenirler.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">3. Nitelikli İş Yönlendirmesi</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Gelişen güven ilişkisi sonucunda, üyeler kendi çevrelerindeki potansiyel iş fırsatlarını diğer üyelere referans yöntemiyle aktararak nitelikli iş birlikleri oluştururlar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Nitelikli İş Çevrenizi Güvenle Genişletin
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            Eğer siz de işinizi kurumsal standartlarda temsil etmek, referans kültürüyle büyütmek ve seçici bir ekosistemin parçası olmak istiyorsanız başvurunuzu iletebilirsiniz.
          </p>
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/degerlendirme-basvurusu')}
            className="text-lg h-14 px-10 font-bold bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30"
          >
            Değerlendirme Başvurusu Yap <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
