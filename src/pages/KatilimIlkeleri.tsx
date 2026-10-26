import { absenceRule, scoringActivities, memberEffort, meetingSupport } from '../data/clubContent';
import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export function KatilimIlkeleri() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <SEO
        title="E4N Katılım İlkeleri | Aylık Değerlendirme ve Grup Hakları"
        description="E4N kapalı gruplarında aktif katılım, aylık puan değerlendirmesi, gruptan çıkarılma ve üyelik haklarının devamına ilişkin modeli inceleyin."
        canonical="https://www.event4network.com/katilim-ilkeleri"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Katılım Standartları
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Düzenli katılım, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              güçlü bir iş ağının temelidir
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Kapalı grupların değeri, üyelerin birbirini tanımaya ve birlikte çalışmaya zaman ayırmasıyla oluşur. E4N bu sürekliliği aylık değerlendirme ve açık çalışma koşullarıyla takip eder.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/uyelik')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Üyelik Koşulları
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/iletisim')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Sorunuzu İletin
            </Button>
          </div>
        </div>
      </section>

      {/* Üyelerden beklenen yaklaşım */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            KÜLTÜR VE ETİK
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Üyelerden beklenen yaklaşım
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {memberEffort} {meetingSupport}
            </p>
            <p>
              Üyeler birbirinin uzmanlığına, iletişim tercihlerine ve paylaşılan bilgilerin gizliliğine saygı gösterir. İş yönlendirmeleri uygunluk ve güven dikkate alınarak yapılır.
            </p>
          </div>
        </div>
      </section>

      {/* Aylık puan değerlendirmesi */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            ŞEFFAF KURALLAR
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Aylık puan değerlendirmesi
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {scoringActivities}</p><p>{absenceRule}</p><p>Ayrıntılı kuralları ödeme öncesinde görüp kabul eder, bunlara uyacağınızı taahhüt edersiniz.
            </p>
            <p>
              Katılım koşullarını karşılamayan üyelerin kapalı gruptaki yeri, ilgili kurallara göre sona erer. Amaç, düzenli çalışma beklentisini grubun tamamı için tutarlı biçimde uygulamaktır.
            </p>
          </div>
        </div>
      </section>

      {/* Gruptan çıkarılmak üyeliği bitirir mi? */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              HAKLARIN AYRIMI
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Gruptan çıkarılmak üyeliği bitirir mi?
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Kapalı gruptan çıkarılma ile E4N üyeliğinin sona ermesi farklıdır. Üyeliği devam eden kişinin dış etkinlik ve indirimli bilet hakları ilgili koşullarla korunur.
            </p>
            <p className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-slate-800 text-sm sm:text-base font-medium">
              Grup katılımına ara vermeniz, aboneliğin otomatik iptal edildiği veya ödeme yükümlülüğünüzün kendiliğinden sona erdiği anlamına gelmez. Üyelik koşullarını ayrıca inceleyin.
            </p>
          </div>
        </div>
      </section>

      {/* İkinci çıkarılma ve yeniden başvuru */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
              DÖNEM KISITI
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            İkinci çıkarılma ve yeniden başvuru
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              İkinci kez gruptan çıkarılan üye için <strong>sekiz aylık, iki shuffle dönemine karşılık gelen</strong> grup başvurusu kısıtı uygulanır. Süre sona erdiğinde yeniden başvuru diğer kabul koşullarıyla birlikte değerlendirilir.
            </p>
            <p className="text-sm text-slate-600">
              Bu kısıt kapalı grup başvurusuna ilişkindir. Devam eden üyeliğin dış etkinlik hakları ayrı yönetilir.
            </p>
          </div>
        </div>
      </section>

      {/* Başvurmadan önce çalışma düzenini öğrenin */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Başvurmadan önce çalışma düzenini öğrenin
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
            Başkan görüşmesinde toplantı düzenini, katılım beklentilerini ve aylık değerlendirme koşullarını konuşun. Düzenli olarak ayırabileceğiniz zamanı değerlendirerek başvurun.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/uyelik')}
              className="font-bold px-8 h-12 bg-red-600 hover:bg-red-500 shadow-md shadow-red-200"
            >
              Üyelik Koşulları <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/iletisim')}
              className="font-bold px-8 h-12 border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              <HelpCircle className="w-4 h-4 mr-2" /> Sorunuzu İletin
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
