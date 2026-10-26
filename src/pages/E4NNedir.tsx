import { ClubBenefitsSection } from '../components/PublicClubSections';
import { companyRequirement, professionRule } from '../data/clubContent';
import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  Users,
  Repeat,
  HeartHandshake,
  ArrowRight,
  Calendar,
  Layers
} from 'lucide-react';

export function E4NNedir() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <SEO
        title="E4N Nedir? | İş İnsanları İçin Networking Ekosistemi"
        description="Event4Network'ün açık loncalar, etkinlikler ve 35 kişilik kapalı gruplardan oluşan iş ağı modelini ve karşılıklı katkı yaklaşımını tanıyın."
        canonical="https://www.event4network.com/e4n-nedir"
      />

      {/* 1. Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            E4N Modeli
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-8 leading-[1.15] max-w-4xl mx-auto">
            İşinizi tanıyan insanlarla <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              gelişen bir iş ağı
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Event4Network, iş insanlarının düzenli görüşmelerle birbirinin uzmanlığını, hedeflerini ve iş çevresini tanımasını sağlayan bir networking ekosistemidir. Açık loncalar, etkinlikler ve seçilmiş kapalı gruplar birbirini tamamlayan katılım alanları sunar.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/nasil-calisir')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Nasıl Çalışır? <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/uyelik')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Üyeliği İncele
            </Button>
          </div>
        </div>
      </section>

      {/* 2. İş ilişkileri için süreklilik */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            TEMEL YAKLAŞIM
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            İş ilişkileri için süreklilik
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              Bir tanışıklığın iş birliğine dönüşmesi için karşı tarafın ne yaptığını, hangi müşterilere hizmet verdiğini ve nasıl değer ürettiğini anlamak gerekir. E4N, bu bilgilerin düzenli olarak paylaşılabildiği ve takip edilebildiği bir çalışma ortamı oluşturur.
            </p>
            <p>
              Bu ortamda üyeler yeni bağlantılar kurabilir, birbirini uygun kişilere tanıştırabilir, tamamlayıcı hizmetlerini birlikte sunabilir veya deneyimlerini paylaşabilir.
            </p>
          </div>
        </div>
      </section>

      {/* 3. E4N'nin üç katmanı */}
      <section className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              MİMARİ
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              E4N'nin üç katmanı
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Farklı ihtiyaçlara ve hedeflere hitap eden, birbirini tamamlayan üç çalışma alanı:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Açık loncalar</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Sektör ve ilgi alanı etrafında geniş bir profesyonel çevre sunar. Bilgi ve deneyim paylaşımı için açık katılım alanlarıdır.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-emerald-700">
                Geniş ve Açık Ekosistem
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Etkinlikler</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Farklı deneyimleri, konuşmacıları ve yeni insanları bir araya getirir. Açık buluşmalar ve eğitimlerle topluluk genişler.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-orange-700">
                Dönemsel Buluşmalar
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border-2 border-red-500/20 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Kapalı gruplar</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  35 kişilik kapalı grupta her üye tek bir iş kolunu temsil eder. Her meslekten yalnızca bir kişi bulunabilir.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-red-700">
                35 Kişi · 4 Ayda Bir Shuffle
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-700 leading-relaxed max-w-4xl mx-auto flex items-start gap-4">
            <Repeat className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p>
              Kapalı grup dağılımı <strong>dört ayda bir yenilenir</strong>. Böylece mevcut ilişkilerinizi geliştirirken sonraki dönemlerde yeni çevrelere ulaşma fırsatınız da artar.
            </p>
          </div>
        </div>
      </section>

      <ClubBenefitsSection />
      {/* 4. Karşılıklı katkı */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              DEĞER ÜRETİMİ
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Karşılıklı katkı
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              E4N'de değer; bilgi, uzmanlık, tanıştırma, geri bildirim ve uygun iş yönlendirmeleriyle oluşur. Bir üyenin katkısı yalnız o an satın alabileceği hizmetlerle sınırlı değildir. İşini iyi tanıdığınız bir kişi, kendi çevresindeki uygun bağlantılara ulaşmanıza da yardımcı olabilir.
            </p>
            <p>
              Kapalı gruplarda bu ilişkinin gelişmesi için düzenli katılım beklenir. Başvuru sırasında çalışma düzeni ve değerlendirme kuralları açıklanır.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Kimler için? */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            HEDEF KİTLE
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Kimler için?
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-8">
            <p>
              Şirket sahipleri, kurucu ortaklar ve üst düzey yöneticiler; işlerini geliştirmek, farklı uzmanlıklarla çalışmak ve yeni profesyonel çevreler tanımak için E4N'yi değerlendirebilir.
            </p>
            <p>
              {companyRequirement} {professionRule} Ziyaretçi deneyimi ve başkan veya admin onayı, üyelik ödemesinden önce tamamlanır.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center font-bold text-slate-900 text-sm shadow-sm">
              Şirket Sahipleri
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center font-bold text-slate-900 text-sm shadow-sm">
              Kurucu Ortaklar
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center font-bold text-slate-900 text-sm shadow-sm">
              Üst Düzey Yöneticiler
            </div>
          </div>
        </div>
      </section>

      {/* 6. Size uygun yolu bulun (Final CTA) */}
      <section className="py-20 lg:py-24 bg-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            İLK ADIM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Size uygun yolu bulun
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
            Topluluk kanallarından başlayabilir, açık etkinliklere katılabilir veya düzenli grup çalışması için üyelik koşullarını inceleyebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/nasil-calisir')}
              className="font-bold px-8 h-12 bg-red-600 hover:bg-red-500 shadow-md shadow-red-200"
            >
              Nasıl Çalışır? <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/uyelik')}
              className="font-bold px-8 h-12 border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              Üyeliği İncele
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
