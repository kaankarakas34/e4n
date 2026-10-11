import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Calendar,
  Repeat,
  ArrowRight,
  Handshake,
  CheckCircle2,
  Clock
} from 'lucide-react';

export function KapaliGruplar() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <SEO
        title="E4N Kapalı Gruplar | 35 Kişilik Seçici İş Ağı"
        description="35 kişilik E4N gruplarında hizmet dengesi, başkan görüşmesi ve düzenli networking yaklaşımını öğrenin. Grup kabul koşullarını inceleyin."
        canonical="https://www.event4network.com/kapali-gruplar"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            35 Kişilik Seçici Yapı
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            İşinizi tanıyan 35 kişilik <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              bir çevre oluşturun
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            E4N'nin kapalı grupları, üyelerin düzenli olarak bir araya gelip birbirinin işini daha iyi tanıması için oluşturulur. Küçük grup yapısı; uzmanlığı, hedef müşterileri ve olası iş birliklerini daha ayrıntılı konuşmaya imkân verir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/uyelik')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Üyeliği İncele
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/shuffle')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Shuffle'ı Öğren
            </Button>
          </div>
        </div>
      </section>

      {/* Hizmet çeşitliliği nasıl korunur? */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            HİZMET DENGESİ
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Hizmet çeşitliliği nasıl korunur?
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Aynı veya çakışan hizmetleri sunan kişiler aynı kapalı grupta bulunmaz. Başvuruda yalnız meslek unvanınıza değil, şirketinizin fiilen sunduğu hizmetlere de bakılır.
            </p>
            <p>
              Örneğin farklı unvanlar kullanan iki şirketin aynı hizmeti sunması çakışma oluşturabilir. Aynı geniş sektör içinde farklı ve tamamlayıcı hizmetler sunan şirketler ise ayrı değerlendirilir.
            </p>
            <p className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-slate-800 font-medium text-sm sm:text-base">
              Bu yaklaşım, grubun farklı uzmanlıkları temsil etmesini ve üyelerin birbirini hangi ihtiyaçlar için önerebileceğini daha açık görmesini destekler.
            </p>
          </div>
        </div>
      </section>

      {/* Başkan görüşmesinin amacı */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              KABUL SÜRECİ
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Başkan görüşmesinin amacı
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              Grup başkanı, başvuran kişiyi ve işini tanır; çalışma biçimini ve katılım beklentilerini anlatır. Siz de grubun kendi hedeflerinize ve ayırabileceğiniz zamana uygunluğunu değerlendirebilirsiniz.
            </p>
            <p>
              Görüşme sonrası hizmet uyumu ve kapasite koşullarıyla birlikte kabul değerlendirmesi yapılır.
            </p>
          </div>
        </div>
      </section>

      {/* Grubun içinde ne yapılır? */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            ÇALIŞMA DÜZENİ
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Grubun içinde ne yapılır?
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-8">
            <p>
              Düzenli toplantılarda hedefler, uzmanlıklar ve ihtiyaçlar paylaşılır. Birebir görüşmelerde iş modelleri ve hedef müşteri profilleri daha ayrıntılı konuşulur. Uygun durumlarda tanıştırmalar, iş yönlendirmeleri ve ortak proje görüşmeleri gelişebilir.
            </p>
            <p>
              Katılım, açıklanan aylık puan ve çalışma koşullarına göre takip edilir.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
              <Clock className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm mb-1">Düzenli Toplantılar</h3>
              <p className="text-xs text-slate-500">Hedefler, uzmanlıklar ve ihtiyaç paylaşımları.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
              <Handshake className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm mb-1">Birebir Görüşmeler</h3>
              <p className="text-xs text-slate-500">İş modelleri ve müşteri profillerini derinlemesine tanıma.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
              <ShieldCheck className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm mb-1">Aylık Değerlendirme</h3>
              <p className="text-xs text-slate-500">Puan tablosu ve çalışma ilkelerine uyum takibi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dört aylık dönemler & Başvuru */}
      <section className="py-20 bg-slate-50 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            ROTASYON VE BAŞVURU
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Dört aylık dönemler ve başvuru
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mb-4 leading-relaxed">
            Grup dağılımı dört ayda bir shuffle ile yenilenir. Bu yapı, bir dönem içinde ilişkileri geliştirmenizi ve sonraki dönemlerde yeni insanlarla tanışmanızı sağlar.
          </p>
          <p className="text-slate-600 text-sm mb-8 leading-relaxed font-semibold bg-white p-4 rounded-2xl border border-slate-200 max-w-xl mx-auto">
            Aktif E4N aboneliğinizle grup başvurusu yapabilirsiniz. Başvuru veya ödeme, kabul ve kontenjan garantisi anlamına gelmez.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/uyelik')}
              className="font-bold px-8 h-12 bg-red-600 hover:bg-red-500 shadow-md shadow-red-200"
            >
              Üyeliği İncele <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/shuffle')}
              className="font-bold px-8 h-12 border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              <Repeat className="w-4 h-4 mr-2" /> Shuffle'ı Öğren
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
