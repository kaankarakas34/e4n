import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Handshake,
  Layers,
  Sparkles,
  Repeat
} from 'lucide-react';

export function IsCevresiNasilGenisletilirPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            🚀 B2B İş Ağı Rehberi · Stratejik Büyüme
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            İş Çevresi Nasıl Genişletilir? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              B2B Odaklı Yol Haritası
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            İş çevresi edinmek rastgele yüzlerce kartvizit toplamak değildir. Reklam bütçeleri tükenebilir; ancak güvene dayalı 15-20 stratejik müttefik, en krizli dönemlerde dahi işletmeniz için kesintisiz bir referans akışı sağlar.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/uyelik"
              className="inline-flex items-center justify-center text-base h-14 px-8 font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg w-full sm:w-auto shadow-lg shadow-red-900/30 transition-colors"
            >
              E4N Üyelik Başvurusu
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/business-networking')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Business Networking Nedir?
            </Button>
          </div>
        </div>
      </section>

      {/* 5 Temel Adım */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Nitelikli İş Çevresi İnşa Etmenin 5 Temel Adımı
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Yüzeysel tanıdıklar yerine işinizi ve uzmanlığınızı tavsiye edebilecek karar vericilere ulaşmak için izlemeniz gereken strateji:
            </p>
          </div>

          <div className="space-y-8">
            {/* Adım 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Mevcut Çevrenizi Denetleyin ve Boşlukları Belirleyin
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
                  İş çevrenizin yüzde kaçı sizinle aynı sektörden? Yalnızca meslektaşlarınızla vakit geçirmek size yeni müşteri veya iş fırsatı getirmez. Müşteri kitlenize farklı açılardan hizmet veren tamamlayıcı meslek sahipleriyle bağlarınızı ve son 1 yılda kimlerden nitelikli yönlendirme aldığınızı haritalandırın.
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-500">
                  💡 İpucu: Hedefsizce çevre aramaktansa, işletmenizin büyüme hedefleriyle örtüşen sektör ve karar verici profillerine odaklanın.
                </div>
              </div>
            </div>

            {/* Adım 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Tamamlayıcı Meslek Gruplarıyla (Power Team) Ortaklık Kurun
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
                  İş çevresini en hızlı ve sağlıklı genişleten mekanizma, tamamlayıcı meslek sinerjisidir. Sizinle doğrudan rekabet etmeyen ancak sizinle tamamen aynı hedef kitleye hitap eden uzmanlarla stratejik ortaklıklar kurun:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 text-sm">
                    <strong className="block text-slate-900 mb-1">Finans &amp; Hukuk</strong>
                    <span className="text-slate-600 text-xs">Mali müşavir, kurumsal avukat ve sigortacı aynı şirketin farklı ihtiyaçlarını paslaşır.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 text-sm">
                    <strong className="block text-slate-900 mb-1">İnşaat &amp; Tasarım</strong>
                    <span className="text-slate-600 text-xs">İç mimar, elektrik taahhütçüsü ve mobilya üreticisi aynı projede yönlendirme üretir.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-sm">
                    <strong className="block text-slate-900 mb-1">Pazarlama &amp; Teknoloji</strong>
                    <span className="text-slate-600 text-xs">Yazılım ajansı, dijital pazarlamacı ve marka danışmanı ortak müşteri havuzunu besler.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adım 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  İletişimi Satış Odaklı Değil, Çözüm Odaklı Başlatın
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
                  Yeni bir iş çevresine girdiğinizde yapabileceğiniz en büyük hata, tanıştığınız insanlara hemen ürün satmaya çalışmaktır. Profesyoneller kendilerine satış yapılmasından hoşlanmaz; ancak iş problemlerine çözüm getiren veya fikir alışverişinde bulunan insanlarla bağ kurmaktan memnuniyet duyarlar.
                </p>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  İlk temasta karşı tarafın en çok zorlandığı başlığı dinleyin ve hap bir içgörü sunun. Güven odaklı ilkeler için <Link to="/business-networking" className="text-red-600 font-semibold hover:underline">Business Networking Nedir?</Link> ana rehberimizi inceleyin.
                </p>
              </div>
            </div>

            {/* Adım 4 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Düzenli Birebir (1-on-1) Görüşmelerle Güven İnşa Edin
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
                  Kalabalık etkinliklerde yüz yüze gelmek yalnızca tanışma kıvılcımıdır. Ateşin yanması ve kalıcı bir iş ilişkisine dönüşmesi, baş başa yapılan derinlemesine görüşmelerle mümkündür. Haftada en az 1-2 saatinizi hedefli birebir görüşmelere ayırın.
                </p>
                <Link
                  to="/birebir-networking"
                  className="inline-flex items-center text-sm font-bold text-red-600 hover:text-red-700"
                >
                  Birebir Networking Metodolojisi <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Adım 5 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                5
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Yapılandırılmış ve Seçici İş Kulüplerine Dahil Olun
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
                  Rastgele etkinlik kovalamak bir süre sonra ciddi bir zaman ve enerji israfına yol açar. İş çevresini sürdürülebilir biçimde büyütmek isteyen kurucular ve yöneticiler, kuralları ve disiplini olan profesyonel platformları tercih eder.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Meslek Tekilliği</strong>
                    <span className="text-slate-600 text-xs">Her 35 kişilik kapalı grupta her hizmet dalından yalnızca tek temsilci yer alır; çıkar çatışması olmaz (<Link to="/kapali-gruplar" className="text-red-600 underline">Kapalı Gruplar</Link>).</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Dört Aylık Shuffle</strong>
                    <span className="text-slate-600 text-xs">Çevrenizin aynı kişilerle kısıtlı kalmaması için 4 ayda bir rotasyon yapılır (<Link to="/nasil-calisir" className="text-red-600 underline">Nasıl Çalışır?</Link>).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* İlgili Rehberler */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Bağlantılı Rehber ve İçerikler
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              İş ağınızı kurumsallaştırmak için diğer temel içeriklerimizi inceleyin:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              to="/profesyonel-is-agi-nasil-kurulur"
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-200 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
                Profesyonel İş Ağı Nasıl Kurulur?
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                A-B-C çemberi ve 6 adımlı B2B uygulama planı ile sosyal sermayenizi yönetin.
              </p>
            </Link>

            <Link
              to="/networking-neden-kartvizit-toplamak-degildir"
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-200 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
                Kartvizit Toplama Tuzağı
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Nicelik yerine nitelik: Bir etkinlikten onlarca kartla dönmek neden iş üretmez?
              </p>
            </Link>

            <Link
              to="/networking-ile-satis-arasindaki-fark"
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-200 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
                Networking ile Satışın Farkı
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Avcı zihniyetinden çiftçi zihniyetine geçerek referans ve yönlendirmeyle müşteri kazanın.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Bölümü */}
      <section className="py-20 bg-slate-950 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xl shadow-red-950/20">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
              İş Çevrenizi Seçilmiş Liderlerle Büyütün
            </h2>
            <p className="text-base sm:text-lg text-red-100 max-w-2xl mx-auto mb-8 leading-relaxed">
              Mevcut sınırlarınızı aşın; her sektörden tek bir uzmanın yer aldığı 35 kişilik kapalı gruplarımızda yerinizi alın.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/uyelik"
                className="inline-flex items-center justify-center text-base h-14 px-8 font-bold text-red-600 bg-white hover:bg-red-50 rounded-lg w-full sm:w-auto shadow-lg transition-colors"
              >
                E4N Üyelik Başvurusu
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/kapali-gruplar"
                className="inline-flex items-center justify-center text-base h-14 px-8 font-semibold text-white border border-white/30 hover:bg-white/10 rounded-lg w-full sm:w-auto transition-colors"
              >
                Kapalı Grupları İnceleyin
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
