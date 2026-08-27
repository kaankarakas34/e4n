import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  ClipboardList,
  UserCheck,
  Calendar,
  Handshake,
  Target,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Compass,
  ShieldAlert,
  XCircle,
  Check
} from 'lucide-react';

export function NasilCalisir() {
  const navigate = useNavigate();

  const steps = [
    {
      num: "01",
      icon: ClipboardList,
      title: "Başvuru ve Ön Değerlendirme",
      desc: "Katılım süreci başvuru ile başır. Adayın iş alanı, profili, beklentileri ve platforma sağlayabileceği potansiyel katkılar ekibimiz tarafından detaylıca incelenir.",
      details: "Form doldurulduktan sonra ilk aşamada sektörel çakışma olmaması ve meslek grubunun topluluk yapısına uygunluğu incelenir."
    },
    {
      num: "02",
      icon: UserCheck,
      title: "Tanışma ve Uyum Görüşmesi",
      desc: "Başvuru sonrasında adayla birebir bir ön görüşme yapılır. E4N’den ne beklediğiniz, hangi iş çevrelerine ulaşmak istediğiniz ve mevcut üyelerle nasıl bir değer alışverişi oluşturabileceğiniz anlaşılır.",
      details: "Bu görüşme hem platformun adayı hem de adayın platformu daha yakından tanıması için karşılıklı bir uyum değerlendirmesidir."
    },
    {
      num: "03",
      icon: Calendar,
      title: "Düzenli Toplantı Sistemi",
      desc: "E4N’de üyeler her ay düzenli ve disiplinli olarak bir araya gelir. Yeni dönemde bu süreç hem zaman verimliliği hem de ilişki derinliği için hibrit olarak tasarlanmıştır.",
      details: "Her ay: 1 online toplantı (hızlı temas, aranan bağlantılar) ve 1 yüz yüze toplantı (derin ilişki kurma, güven inşası)."
    },
    {
      num: "04",
      icon: Handshake,
      title: "Birebir Görüşmeler (1-on-1)",
      desc: "E4N’de asıl ticari değer sadece kalabalık toplantılarda değil, üyelerin kendi aralarında yaptığı birebir görüşmelerde ortaya çıkar.",
      details: "Üyeler bu görüşmelerde birbirlerinin iş modellerini, ideal hedef müşteri profillerini öğrenir ve hangi bağlantılarda birbirine yardımcı olabileceğini netleştirir."
    },
    {
      num: "05",
      icon: Target,
      title: "Hedef Kişi ve Firma Listeleri",
      desc: "Üyeler ulaşmak istedikleri şirketleri, karar verici profillerini veya sektörleri doğrudan paylaşır. Bu sayede networking rastgele temas olmaktan çıkar.",
      details: "Amaç 'herkesle tanışmak' değil; üyelerimizin kendi çevrelerini açmasıyla doğru kişilere doğrudan ve referanslı şekilde ulaşabilmektir."
    },
    {
      num: "06",
      icon: ShieldCheck,
      title: "Güvene Dayalı Yönlendirme",
      desc: "E4N'de iş yönlendirmesi, üyeler arasında gerçek bir güven oluştuktan sonra anlam kazanır.",
      details: "Soğuk satışın aksine, üyeler birbirini tanıdıkça ve iş yapma standardından emin oldukça kendi çevrelerine tavsiye eder. Bu da yüksek dönüşüm oranlı referanslar sağlar."
    }
  ];

  return (
    <div className="bg-white min-h-screen pt-20">
      <SEO
        title="Nasıl Çalışır? | Event4Network Seçici Networking"
        description="Event4Network networking modelinin işleyişi. Değerlendirme süreci, toplantı periyotları, birebir görüşmeler ve güvene dayalı iş yönlendirme sistemini keşfedin."
        canonical="https://www.event4network.com/nasil-calisir"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            E4N Çalışma Mekanizması
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Sistem Nasıl Çalışır?
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Event4Network, rastgele tanışmaları organize eden bir organizasyon firması değildir. Burası düzenli temas, planlı iş birlikleri ve güvene dayalı bir referans üretme mekanizmasıdır.
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
              onClick={() => navigate('/uyelik')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Üyelik Kriterleri
            </Button>
          </div>
        </div>
      </section>

      {/* 6 Steps Walkthrough */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">ADIM ADIM YAPILANDIRMA</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-6">
              Stratejik Networking Süreci
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Her adım, platform içindeki üyeler arasında sağlıklı bir iletişim kurmak, güven zeminini test etmek ve en verimli iş fırsatlarını ortaya çıkarmak için özel olarak tasarlanmıştır.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-8 border border-gray-150 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 flex flex-col group"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="text-5xl font-black text-gray-100 group-hover:text-red-500/10 transition-colors duration-300">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                    {step.desc}
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100 text-xs text-gray-450 leading-relaxed italic bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200">
                    💡 {step.details}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hybrid Model Deep Dive */}
      <section className="py-24 bg-gray-50 border-t border-b border-gray-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">TOPLANTI YAKLAŞIMI</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-6">1 Online + 1 Yüz Yüze Modeli</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Event4Network, iş dünyasının zaman hassasiyetini ve yüz yüze güvenin önemini çok iyi analiz etmiştir. Bu sebeple toplantı yapımız hem hız hem de derinlik sunar:
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">Online Toplantılar (Verimlilik)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1 mb-3">
                      Ayda 1 kez gerçekleştirilen online toplantılarda üyeler güncel hedeflerini, aradıkları spesifik bağlantıları paylaşır ve zamanı en verimli şekilde kullanarak temaslarını canlı tutar.
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/40 p-4 rounded-2xl border border-gray-150 text-xs text-gray-650">
                      {[
                        "Üyeler kendilerini ve işlerini tanıtır,",
                        "Spesifik bağlantı ve ihtiyaçlarını paylaşır,",
                        "Seçilen üyeler detaylı sunum gerçekleştirir,",
                        "İş birliği ve yönlendirme fırsatları değerlendirilir."
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">Yüz Yüze Toplantılar (Derinlik)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1 mb-3">
                      Ayda 1 kez fiziksel olarak bir araya geldiğimiz bu toplantılar, ekranların ötesinde samimi bir bağ kurmak, güveni pekiştirmek ve daha doğal, kalıcı iş ortaklıkları oluşturmak için tasarlanmıştır.
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/40 p-4 rounded-2xl border border-gray-150 text-xs text-gray-650">
                      {[
                        "Üyeler arasındaki güven güçlendirilir,",
                        "Konuşmacı ve panel içerikleri sunulur,",
                        "Nitelikli ziyaretçilerle tanışılır,",
                        "Yapılandırılmış ve serbest networking gerçekleştirilir."
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Sparkles className="w-48 h-48" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Bu Sistemin Amacı Nedir?</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Modelin amacı, üyelerin hem düzenli olarak görünür kalmasını sağlamak hem de yüz yüze temaslarla daha güçlü, kopmaz bağlar kurmasını kolaylaştırmaktır. E4N’de networking tek seferlik bir tanışma değil; sürekli gelişen, iş hacmini büyüten canlı bir ilişki sürecidir.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2 text-red-400">
                  <Users className="w-5 h-5" />
                  <span className="font-bold">E4N Kültürünün Özü</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Platformumuzda yer alan iş insanları, sadece iş fırsatı almak için değil; diğer üyelerin de büyümesine katkıda bulunmak ve ortak bir iş ahlakını temsil etmek için buradadır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules & Ethics (Commission Ban & Sales Rules) */}
      <section className="py-24 bg-white border-t border-gray-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">İŞ ETİĞİ VE İLKELER</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-6">
              Platform Kuralları & İş Etiği
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              E4N ekosisteminde güven, profesyonellik ve dürüstlük en üst düzeyde korunur. Üyelerimizin uyması zorunlu olan temel kurallar aşağıda belirtilmiştir.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Komisyon ve Maddi Menfaat Yasağı */}
            <div className="bg-slate-50 border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-100 transition-all duration-300 relative overflow-hidden group">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-655 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Komisyon ve Maddi Menfaat Yasağı</h3>
                </div>
                <p className="text-sm text-gray-650 leading-relaxed mb-6">
                  E4N içerisinde oluşan iş yönlendirmeleri, referanslar ve tanıştırmalar karşılığında üyeler birbirlerine;
                </p>
                <ul className="grid grid-cols-2 gap-3 mb-6">
                  {["Komisyon,", "Aracılık ücreti,", "Maddi hediye,", "Başka bir kişisel menfaat"].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white p-3 rounded-xl border border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-550 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-650 leading-relaxed mb-4">
                  teklif edemez veya karşı taraftan talep edemez. <strong>İş yönlendirmesinin kendisi ücret konusu yapılamaz.</strong>
                </p>
              </div>
              <div className="pt-6 border-t border-gray-200 text-xs text-red-750 font-semibold leading-relaxed bg-red-50/50 p-4 rounded-xl border border-dashed border-red-200">
                ⚠️ Bu yasağın ihlal edilmesi hâlinde ilgili kişinin üyeliği yalnızca bulunduğu grupta değil, E4N’nin bütün sisteminde sona erdirilebilir.
              </div>
            </div>

            {/* Satış ve İletişim Kuralları */}
            <div className="bg-slate-50 border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-100 transition-all duration-300 relative overflow-hidden group">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-655 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Satış ve İletişim Kuralları</h3>
                </div>
                <p className="text-sm text-gray-650 leading-relaxed mb-4 font-semibold">
                  E4N toplantıları ve iletişim grupları bir toplu satış alanı değildir.
                </p>
                <p className="text-xs text-gray-500 mb-4">Üyelerimiz aşağıdakileri yapmaktan kaçınmalıdır:</p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Israrlı teklif gönderemez,",
                    "Olumsuz cevaba rağmen iletişimi sürdüremez,",
                    "Üye listesini satış listesine çeviremez,",
                    "Üyelere izinsiz toplu mesaj gönderemez,",
                    "Her görüşmeyi ürün tanıtımına dönüştüremez."
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-650">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 border-t border-gray-200 text-xs text-gray-500 italic">
                💡 İlişkilerin satıştan önce güven temelinde gelişmesi esastır. E4N’de önce güven inşa edilir, ardından ticari iş birlikleri doğal olarak gelişir.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-slate-950 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Yeni Dönem Networking Modelinde Yerinizi Alın
          </h2>
          <p className="text-lg text-gray-350 mb-10 max-w-2xl mx-auto font-light">
            Eğer siz de rastgele kartvizit toplamak yerine güvene dayalı, stratejik ve sürdürülebilir bir iş çevresi inşa etmek istiyorsanız, ön değerlendirme sürecinizi bugün başlatın.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-base h-14 px-10 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto"
            >
              Hemen Başvurun
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/e4n-nedir')}
              className="text-base h-14 px-10 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Klasik Networking'den Farkı
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
