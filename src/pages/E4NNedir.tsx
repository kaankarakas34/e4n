import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  ShieldCheck,
  Handshake,
  Users,
  ArrowRight,
  Check,
  Award,
  Sparkles,
  Zap,
  TrendingUp,
  XCircle
} from 'lucide-react';

export function E4NNedir() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <SEO
        title="E4N Nedir? | Event4Network Seçici Networking Ekosistemi"
        description="E4N, iş insanlarının düzenli temas, güven ve karşılıklı katkı üzerinden daha güçlü iş ilişkileri kurmasını sağlayan seçici bir networking platformudur."
        canonical="https://www.event4network.com/e4n-nedir"
      />

      {/* 1. Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            E4N Felsefesi
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            E4N Nedir?
          </h1>
          <div className="bg-red-950/40 border border-red-500/30 rounded-3xl px-8 py-6 max-w-3xl mx-auto mb-8 shadow-lg backdrop-blur-sm">
            <p className="text-lg sm:text-xl text-white font-bold leading-relaxed">
              E4N, iş insanlarının düzenli temas, güven ve karşılıklı katkı üzerinden daha güçlü iş ilişkileri kurmasını sağlayan seçici bir networking platformudur.
            </p>
          </div>
          <p className="text-sm sm:text-base text-slate-350 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Event4Network, üyelerin sadece kendilerini tanıttığı sıradan toplantılar düzenlemez. Üyelerimiz zaman içinde birbirlerinin iş modellerini, hedef müşteri profillerini, güçlü yönlerini ve ulaşmak istedikleri çevreleri daha yakından tanır. Bu sayede rastgele tanışmalar, güvene dayalı gerçek ticari fırsatlara dönüşür.
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

      {/* 2. Biz Kimiz & Ne Yapıyoruz */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            {/* Biz Kimiz? */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col justify-between hover:border-red-100 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Biz Kimiz?</h2>
                </div>
                <p className="text-slate-800 text-base leading-relaxed mb-6 font-semibold">
                  Event4Network, iş dünyasının liderlerini, girişimcilerini ve karar vericilerini aynı çatı altında buluşturan seçkin bir network platformu ve iş kulübüdür.
                </p>
                <p className="text-slate-655 text-sm leading-relaxed mb-6">
                  Amacımız yalnızca insanların tanışmasını veya birbirlerine satış yapmasını sağlamak değildir. E4N’de temel hedef; üyelerin birbirini tanıdığı, uzmanlığına güvendiği ve zaman içerisinde birbirine iş, bilgi, bağlantı ve fırsat yönlendirebildiği kalıcı ilişkiler oluşturmaktır.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center gap-2 text-red-650 font-bold text-sm">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span>Kalıcı iş ilişkileri için seçici networking.</span>
              </div>
            </div>

            {/* Ne Yapıyoruz? */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col justify-between hover:border-red-100 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Handshake className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Ne Yapıyoruz?</h2>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">
                  E4N üyeleri arasında;
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Nitelikli iş ilişkileri kurulmasını,",
                    "Üyelerin birbirlerini ve işlerini yakından tanımasını,",
                    "Güvene dayalı iş yönlendirmeleri oluşmasını,",
                    "Doğru kişi ve şirketlerle tanışılmasını,",
                    "Sektörel iş birlikleri ve projeler geliştirilmesini,",
                    "Üyelerin network, bilgi ve deneyimlerini paylaşmasını"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-red-655 flex-shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-slate-700 text-sm font-semibold">
                  sağlayan bir yapı oluşturuyoruz.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 leading-relaxed italic">
                * E4N doğrudan müşteri, satış, ciro, yatırım veya iş garantisi vermez. E4N doğru ortamı ve ilişki imkânını oluşturur; ticari sonuç üyelerin güvenilirliğine, takip disiplinine ve sundukları hizmetin kalitesine bağlıdır.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Klasik Networking'den Farkı */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">KARŞILAŞTIRMA</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Klasik Networking ile Farkımız Nedir?
            </h2>
            <p className="text-slate-655 text-base">
              Klasik etkinliklerde kartvizitler dağıtılır ve genellikle ertesi gün herkes birbirini unutur. E4N ise kalıcı ve sistemli iş ilişkileri inşa eder.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            {/* Klasik Networking */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Klasik Networking</h3>
                </div>

                <ul className="space-y-4">
                  {[
                    "Tek seferlik tanışmalar ve yüzeysel sohbetler",
                    "Kartvizit alışverişi odaklı, kopuk iletişim",
                    "Doğrudan ve aceleci satış yapmaya çalışma kaygısı",
                    "Disiplinsiz, takipsiz ve sürekliliği olmayan katılım",
                    "Güven bağı kurulmadan referans bekleme çıkmazı"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-605">
                      <span className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 italic">
                * Sonuç: Zaman kaybı ve kalıcı olmayan, verimsiz iş ağları.
              </div>
            </div>

            {/* E4N Seçici Platformu */}
            <div className="bg-red-50/30 border border-red-100 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Sparkles className="w-32 h-32 text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">E4N Platformu</h3>
                </div>

                <ul className="space-y-4">
                  {[
                    "Zaman içinde birbirini tanıma ve güven derinleşmesi",
                    "Düzenli temas ve 1 Online + 1 Yüz Yüze sistemi",
                    "Tamamlayıcı meslekler arasında rakipsiz iş birlikleri",
                    "Hedef listeler üzerinden stratejik referans akışı",
                    "Platformun kalitesini koruyan seçici üyelik yapısı"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                      <Check className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-red-100 text-xs text-red-750 font-semibold italic">
                * Sonuç: Güvene dayalı, yüksek verimli ve sürdürülebilir iş referansları.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Üyelerden Ne Bekliyoruz? */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">SORUMLULUK & ETİK</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Üyelerden Ne Bekliyoruz?
            </h2>
            <p className="text-slate-655 text-base leading-relaxed">
              E4N bir pasif üyelik platformu değildir. Aktif ve sürekli katkı sağlayan bir topluluk kültürü için üyelerimizden belirli katılım ve iletişim standartlarına uymalarını bekleriz.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Users className="w-48 h-48" />
              </div>
              <h3 className="text-xl font-bold mb-6 text-red-400">Aktif üyelerden beklenen temel sorumluluklar:</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <ul className="space-y-4">
                  {[
                    "Ana toplantıların en az yüzde 70’ine katılmaları,",
                    "Ayda en az bir üye ile birebir görüşme yapmaları,",
                    "Kendilerine yapılan yönlendirmelere en geç iki iş günü içerisinde dönüş yapmaları,",
                    "Katılamayacakları toplantıları mümkünse önceden bildirmeleri,"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-4">
                  {[
                    "Üyeleri ve işlerini tanımaya zaman ayırmaları,",
                    "Topluluğa bilgi, bağlantı ve deneyimleriyle katkı sunmaları,",
                    "E4N’nin ve diğer üyelerin itibarını korumaları"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-3 text-sm text-red-400 font-bold bg-white/5 p-3 rounded-xl border border-white/10 mt-2">
                    <Zap className="w-4 h-4 flex-shrink-0" />
                    <span>Üyeliğin devamı bu aktif katılım disiplinine bağlıdır.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-red-100 text-red-700 flex items-center justify-center rounded-xl flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-sm text-red-950 font-medium leading-relaxed">
                💡 <strong>Kota Muafiyeti:</strong> Üyeler için zorunlu müşteri veya ziyaretçi getirme kotası bulunmaz. Odak noktamız nicelik değil, niteliktir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Toplantı Sistemi Nasıl İşler? */}
      <section className="py-24 bg-white border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">YAPILANDIRILMIŞ MODEL</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Toplantı Sistemi Nasıl İşler?
            </h2>
            <p className="text-slate-655 text-base leading-relaxed">
              E4N’nin temel toplantı sistemi aylık olarak; <strong>Bir çevrim içi üye toplantısı</strong> ve <strong>Bir yüz yüze toplantı veya etkinlik</strong> şeklindedir.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Çevrim İçi Toplantılar */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all duration-300">
              <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-6 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Çevrim İçi Toplantılarda</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Zaman verimliliğini korurken üyelerin hedeflerini güncel tutmasını ve yeni yönlendirmeleri paylaşmasını sağlayan dijital buluşmalardır.
              </p>
              <ul className="space-y-3">
                {[
                  "Üyeler kendilerini ve işlerini tanıtır,",
                  "Spesifik bağlantı ve ihtiyaçlarını paylaşır,",
                  "Seçilen üyeler detaylı sunum gerçekleştirir,",
                  "İş birliği ve yönlendirme fırsatları değerlendirilir."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-655">
                    <Check className="w-4 h-4 text-red-655 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Yüz Yüze Etkinlikler */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all duration-300">
              <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-6 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                <Handshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Yüz Yüze Etkinliklerde</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Üyeler arasındaki güveni derinleştiren, stratejik konuklarla tanışmayı sağlayan ve fiziksel temasın gücünü kullanan etkinliklerdir.
              </p>
              <ul className="space-y-3">
                {[
                  "Üyeler arasındaki güven güçlendirilir,",
                  "Konuşmacı ve panel içerikleri sunulur,",
                  "Nitelikli ziyaretçilerle tanışılır,",
                  "Yapılandırılmış ve serbest networking gerçekleştirilir."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-655">
                    <Check className="w-4 h-4 text-red-655 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Güvene Dayalı İlişki ve Karşılıklı Katkı */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">    </section>

      {/* 3. Güvene Dayalı İlişki ve Karşılıklı Katkı */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest">EKOSİSTEM FELSEFESİ</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-6">
            Güven ve Katkı Kültürü
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto mb-8">
            E4N’de asıl güç, masadaki kişilerin kendi işlerinden çok, o kişilerin sahip olduğu geniş iş çevreleri ve güven ağlarından doğar. Bir üye sizi tanıdıkça, işinizi anladıkça ve size güven duydukça, kendi çevresinde sizi doğru karar vericilere tavsiye eder.
          </p>
          <div className="inline-flex items-center gap-2 text-red-400 font-bold bg-white/5 border border-white/10 px-6 py-3 rounded-full text-sm">
            <Zap className="w-4 h-4" /> Amacımız herkesin herkese satış yapması değil, güvenle referans olabilmesidir.
          </div>
        </div>
      </section>

      {/* 4. Katılım Aşamaları */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">SÜREÇ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Platforma Kabul Süreci
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Platform kalitesini ve sektörel dengeleri korumak adına üyelikler belirli aşamalardan geçerek onaylanır.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Başvuru", desc: "Aday, temel şirket bilgilerini ve E4N'e katılma motivasyonunu iletir." },
              { num: "02", title: "Ön Görüşme", desc: "Adayın hedefleri, beklentileri ve platforma katabileceği değer değerlendirilir." },
              { num: "03", title: "Uyum Analizi", desc: "E4N ekibi adayın platform kültürüyle ve sektörel yapıyla uyumunu inceler." },
              { num: "04", title: "Kabul ve Başlangıç", desc: "Değerlendirmesi tamamlanan adaylar oryantasyonla gruba dahil edilir." }
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-red-150 transition-colors">
                <div>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full inline-block mb-4">Adım {step.num}</span>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Sayfa Sonu CTA */}
      <section className="py-20 bg-slate-950 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Nitelikli Bir İş Çevresinin Parçası Olun
          </h2>
          <p className="text-lg text-slate-350 mb-10 max-w-2xl mx-auto font-light">
            E4N'in seçici yapısı ve güven odaklı referans sistemiyle işinizi doğru insanlarla büyütmek için bugün başvuruda bulunun.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-base h-14 px-10 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-950/50"
            >
              Hemen Başvurun
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/uyelik')}
              className="text-base h-14 px-10 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Üyelik Kriterlerini İncele
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
