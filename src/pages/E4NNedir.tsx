import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { 
  ShieldCheck, 
  Handshake, 
  Users, 
  ArrowRight, 
  Activity, 
  Calendar, 
  Check, 
  Award, 
  Network, 
  ArrowUpRight, 
  TrendingUp, 
  Users2 
} from 'lucide-react';

export function E4NNedir() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <Helmet>
        <title>E4N Nedir? | Seçici Networking Ekosistemi</title>
        <meta name="description" content="Event4Network, nitelikli iş insanlarını değerlendirme süreciyle bir araya getiren, güvene dayalı ilişkiler ve nitelikli referanslar oluşturan seçici bir networking ekosistemidir." />
        <link rel="canonical" href="https://www.event4network.com/e4n-nedir" />
      </Helmet>

      {/* 1. Hero Section */}
      <section className="relative py-20 sm:py-28 bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/20 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            E4N Nedir?
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            E4N Nedir?
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed font-medium">
            Event4Network, nitelikli iş insanlarının güvene dayalı ilişkiler kurduğu, değerlendirme süreciyle şekillenen seçici bir networking ekosistemidir.
          </p>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            E4N’de amaç yalnızca yeni insanlarla tanışmak değil; doğru kişilerle düzenli temas kurmak, birbirini gerçekten tanımak, güven oluşturmak ve bu güven üzerinden nitelikli iş birlikleri geliştirmektir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-base h-14 px-8 font-bold bg-red-650 hover:bg-red-600 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Değerlendirme Başvurusu Yap
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/uyelik')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 w-full sm:w-auto"
            >
              Üyelik Sürecini İncele
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Kısaca Event4Network */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">TEMEL BAKIŞ</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-6">Kısaca Event4Network</h2>
            <div className="space-y-6 text-gray-600 text-base sm:text-lg leading-relaxed text-left">
              <p>
                Event4Network, iş insanlarını rastgele bir araya getiren klasik bir etkinlik modeli değildir. E4N, profesyonel temsil gücüne sahip, işini net konumlandırabilen ve karşılıklı değer üretme kültürünü önemseyen nitelikli iş insanlarını bir araya getirir.
              </p>
              <p>
                Bu yapı, üyelerin birbirini zaman içinde tanımasını, güven geliştirmesini ve doğru ihtiyaçları doğru kişilerle buluşturmasını hedefler. E4N’de networking, tek seferlik bir tanışma değil; düzenli temas, güven ve karşılıklı katkı üzerine kurulu profesyonel bir ilişki geliştirme sürecidir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Klasik Networking'den Farkı */}
      <section className="py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">NEDEN FARKLIYIZ?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">Klasik Networking’den Farkı</h2>
            <p className="mt-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              Klasik networking etkinliklerinde çoğu zaman kısa tanışmalar, kartvizit alışverişleri ve yüzeysel sohbetler öne çıkar. Bu temaslar değerli olabilir; ancak çoğu zaman kalıcı iş ilişkilerine dönüşmez. Event4Network ise tanışmayı başlangıç noktası olarak görür.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "İlişki Geliştirme", desc: "Tek seferlik tanışma yerine düzenli ilişki geliştirme." },
              { title: "Nitelikli Çevre", desc: "Kalabalık temas yerine nitelikli çevre." },
              { title: "Doğru Eşleşme", desc: "Rastgele tanıştırma yerine doğru eşleşme." },
              { title: "Uzun Vadeli Güven", desc: "Kısa vadeli satış yerine uzun vadeli güven." },
              { title: "Referans Kültürü", desc: "Kartvizit değişimi yerine referans kültürü." },
              { title: "Profesyonel Temsil", desc: "Sosyal temas yerine profesyonel temsil." }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-start gap-4">
                <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  <Check className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Seçici Networking Yaklaşımı */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">İŞ DENGESİ VE UYGUNLUK</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-6">Seçici Networking Yaklaşımı</h2>
              <div className="space-y-6 text-gray-600 leading-relaxed text-sm sm:text-base">
                <p>
                  E4N’de networking, herkesin aynı ortamda rastgele bulunduğu bir yapı olarak ele alınmaz. Her profesyonel çevrenin sağlıklı ilerleyebilmesi için üyeler arasında güven, kalite ve karşılıklı değer dengesi olması gerekir.
                </p>
                <p>
                  Bu nedenle Event4Network, nitelikli iş insanlarını bir araya getirirken yalnızca meslek veya sektör bilgisine bakmaz. Kişinin profesyonel duruşu, işini temsil etme biçimi, çevresine sağlayabileceği katkı ve topluluk içindeki uyumu da önemlidir.
                </p>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 bg-gray-50 p-8 rounded-3xl border border-gray-200/60 shadow-inner">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Değerlendirme Faktörleri</h3>
              <ul className="space-y-4">
                {[
                  "Profesyonel Duruş ve Temsil Standardı",
                  "Karşılıklı Değer Üretme Yaklaşımı",
                  "Grup İçi Sektörel Denge ve Koltuk Çakışması Kontrolü",
                  "Faaliyet Süresi ve İş Hacmi Olgunluğu"
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-center text-sm text-gray-700 font-medium">
                    <Award className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Güven ve Temsil Kültürü */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">REFERANS GÜVENLİĞİ</span>
          <h2 className="text-3xl font-extrabold mt-2 mb-6 text-white">Güven ve Temsil Kültürü</h2>
          <div className="space-y-6 text-gray-300 leading-relaxed text-base max-w-3xl mx-auto text-center">
            <p>
              Bir kişiyi kendi çevrenize önermek, yalnızca onun ne iş yaptığını bilmekle ilgili değildir. O kişinin iş yapma biçimini, güvenilirliğini, uzmanlığını ve temsil kalitesini tanımak gerekir.
            </p>
            <p>
              Event4Network’te güven, zamanla ve düzenli temasla oluşur. Toplantılar, birebir görüşmeler ve etkinlikler bu güvenin gelişmesi için tasarlanmıştır. Her üye yalnızca kendisini değil, dahil olduğu profesyonel çevrenin güven standardını da temsil eder.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Nasıl Çalışır? */}
      <section className="py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">SÜREÇ</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">E4N Nasıl Çalışır?</h2>
            <p className="mt-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              Event4Network, değerlendirme başvurusu, uygunluk incelemesi, düzenli toplantılar, birebir görüşmeler ve nitelikli iş yönlendirmeleri üzerine kurulu bir sistemle çalışır.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "1", title: "Değerlendirme Başvurusu", desc: "Kişisel ve iş profilinizi içeren detaylı başvuru formu." },
              { num: "2", title: "Profil & Uygunluk İncelemesi", desc: "Grup dengesi ve temsil gücünün ön incelemesi." },
              { num: "3", title: "Ön Görüşme", desc: "Aday hedeflerinin ve beklentilerinin değerlendirilmesi." },
              { num: "4", title: "Kabul ve Başlangıç", desc: "Sisteme giriş ve oryantasyon sürecinin başlatılması." },
              { num: "5", title: "Düzenli Toplantılar", desc: "Disiplinli iş tanıtımları ve iş fırsatı paylaşımları." },
              { num: "6", title: "Birebir Görüşmeler", desc: "Üyelerin birbirini derinlemesine tanıdığı buluşmalar." },
              { num: "7", title: "Nitelikli İş Yönlendirmeleri", desc: "Güven zemininde doğru bağlantı referansları." },
              { num: "8", title: "Uzun Vadeli İş İlişkileri", desc: "Sürdürülebilir, kurumsal ve güçlü profesyonel çevre." }
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative flex flex-col justify-between">
                <div>
                  <span className="inline-block px-3 py-1 bg-red-50 text-red-600 font-bold text-sm rounded-lg mb-4">Adım {step.num}</span>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Toplantı Sistemi */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">TEMAS ALANI</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-6">Toplantı Sistemi</h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base mb-6">
                E4N toplantıları, üyelerin yalnızca kendini tanıttığı buluşmalar değildir. Bu toplantılar; üyelerin işlerini net ifade ettiği, ihtiyaç duydukları bağlantıları paylaştığı, görünürlük kazandığı ve grup içinde tanınırlık oluşturduğu profesyonel temas alanlarıdır.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base mb-6 font-medium italic">
                * Bir üyenin grup içinde etkili olabilmesi için yalnızca toplantıya katılması yeterli değildir. İşini net anlatması, hangi bağlantılara ihtiyaç duyduğunu ifade etmesi ve diğer üyelerin onu doğru kişilere önerebilmesini kolaylaştırması gerekir.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200/65 shadow-sm">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Toplantıların Temel Unsurları</h3>
              <ul className="space-y-3">
                {[
                  "Kısa ve net iş tanıtımı (Asansör Konuşması)",
                  "Hedef müşteri veya bağlantı talebi paylaşımı",
                  "Üyelerin birbirinin güncel odağını tanıması",
                  "Düzenli katılım disiplini ve profesyonel temsil",
                  "Sistematik güven ve iş referansı takibi"
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-sm text-gray-700">
                    <Check className="h-5 w-5 text-red-650 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Birebir Görüşmeler */}
      <section className="py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 bg-white p-8 rounded-3xl border border-gray-250 shadow-sm">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Görüşme Odak Noktaları</h3>
              <ul className="space-y-3">
                {[
                  "Üyenin sunduğu hizmet ve ana faaliyet konusu",
                  "En başarılı olduğu ideal müşteri profili",
                  "Sektörel bağlantı güçleri ve erişebildiği ağlar",
                  "İhtiyaç duyduğu yeni iş yönlendirmeleri",
                  "Karşı taraf için sunabileceği iş ortaklıkları veya tavsiyeler"
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-sm text-gray-700">
                    <Check className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 mb-10 lg:mb-0">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">İKİLİ DİYALOG</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-6">Birebir Görüşmeler</h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base mb-6">
                Birebir görüşmeler, Event4Network sisteminin en değerli parçalarından biridir. Çünkü gerçek güven ve nitelikli iş fırsatları çoğu zaman kalabalık toplantılarda değil, iki kişinin birbirini daha derin tanıdığı birebir temaslarda oluşur.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base font-medium italic">
                * Bir kişiyi doğru şekilde önerebilmek için onu yüzeysel olarak tanımak yeterli değildir. Birebir görüşmeler, üyelerin birbirinin iş modelini, karakterini, hedeflerini ve çevresini daha iyi anlamasını sağlar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Nitelikli İş Yönlendirmesi */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">DOĞRU REFERANS KÜLTÜRÜ</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-6">Nitelikli İş Yönlendirmesi</h2>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base mb-10">
            Event4Network’te amaç rastgele tanıştırmalar yapmak değildir. Nitelikli iş yönlendirmesi, doğru ihtiyacı doğru kişiyle, güven ilişkisi üzerinden buluşturmaktır.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
            {[
              "İhtiyacın doğru analiz edilmesi",
              "En uygun uzmanın belirlenmesi",
              "Tarafların doğru bağlamla tanıştırılması",
              "Net beklentilerin oluşturulması",
              "Güven ilişkisinin korunması"
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <span className="text-xs text-gray-400 font-bold block mb-2">Unsurlar 0{idx + 1}</span>
                <p className="font-bold text-gray-900 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Kimler İçin Uygun? */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">HEDEF KİTLE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">E4N Kimler İçin Uygun?</h2>
            <p className="mt-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              Event4Network; işini yalnızca reklamla değil, güvene dayalı ilişkiler, nitelikli çevre ve profesyonel referans kültürüyle büyütmek isteyen iş insanları için uygundur.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Şirket Sahipleri", desc: "İşletmesini büyüterek nitelikli bağlantılar edinmek isteyen kurucular." },
              { title: "B2B Sağlayıcılar", desc: "Kurumsal firmalara profesyonel hizmet sunan ve referans arayan işletmeler." },
              { title: "Uzman Danışmanlar", desc: "Kendi alanlarında derin uzmanlığa sahip olan bağımsız profesyoneller." },
              { title: "İş Geliştiriciler", desc: "Sektörel ağını güvene dayalı olarak genişletmeyi amaçlayan yöneticiler." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-250 shadow-sm">
                <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Sayfa Sonu CTA */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Doğru Çevrede Yer Almak İçin İlk Adımı Atın
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            Event4Network’e katılım, değerlendirme süreciyle ilerler. Başvurunuz; iş profiliniz, profesyonel temsil gücünüz ve topluluğa katabileceğiniz değer doğrultusunda incelenir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto"
            >
              Değerlendirme Başvurusu Yap
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/uyelik')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 w-full sm:w-auto"
            >
              Üyelik Sürecini İncele
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
