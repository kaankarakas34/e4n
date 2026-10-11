import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  Repeat,
  ShieldCheck,
  Calendar,
  Users,
  ArrowRight,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

export function ShufflePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <SEO
        title="E4N Shuffle | Dört Ayda Bir Yenilenen Networking Grupları"
        description="E4N shuffle sistemiyle grup dağılımının dört ayda bir nasıl yenilendiğini ve hizmet uyumu ile kapasitenin neden korunduğunu öğrenin."
        canonical="https://www.event4network.com/shuffle"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            <Repeat className="w-3.5 h-3.5" /> Dört Aylık Döngü
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Her dört ayda yeni bağlantılar için <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              yeni bir grup dönemi
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Shuffle, E4N'nin kapalı grup dağılımını dört ayda bir yenilemesidir. Bir dönem boyunca birlikte çalıştığınız insanları tanırken, sonraki dönemlerde farklı uzmanlıklarla ilişki geliştirme fırsatı bulursunuz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/kapali-gruplar')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Kapalı Grupları İncele
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/katilim-ilkeleri')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Katılım İlkeleri
            </Button>
          </div>
        </div>
      </section>

      {/* Bir dönem neden önemlidir? */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            SÜREKLİLİK VE DERİNLİK
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Bir dönem neden önemlidir?
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Karşı tarafın işini ve çalışma biçimini öğrenmek düzenli temas gerektirir. Dört aylık dönem, aynı grup içinde birbirinizi tanıyabileceğiniz bir süreklilik oluşturur.
            </p>
            <p>
              Yeni dönem, bu sürekliliği daha geniş bir çevreye taşıma fırsatı sunar. Önceki dönemde kurduğunuz ilişkiler, grup değiştiğinde sona ermek zorunda değildir.
            </p>
          </div>
        </div>
      </section>

      {/* Yeni dağılımda neler korunur? */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              GÜVENCE VE KURALLAR
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Yeni dağılımda neler korunur?
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Grup kapasitesi ve aynı ya da çakışan hizmetlerin aynı grupta bulunmaması koşulları korunur. Üyelerin grup katılımına uygunluğu da dönem değerlendirmesinde dikkate alınır.
            </p>
            <p className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-800 text-sm sm:text-base font-medium">
              ⚠️ Shuffle, her başvuru sahibine veya her üyeye otomatik yerleşim garantisi değildir. Yeni grup dağılımı, geçerli katılım koşulları ve uygun kontenjanlarla birlikte değerlendirilir.
            </p>
          </div>
        </div>
      </section>

      {/* Üye olarak nasıl hazırlanırsınız? */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            HAZIRLIK
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Üye olarak nasıl hazırlanırsınız?
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              İş ve iletişim bilgilerinizi güncel tutun. Sunduklarınız, aradığınız müşteriler ve ihtiyaç duyduğunuz bağlantıları açık anlatın. Yeni dönemde tanışacağınız kişilere işinizi anlaşılır biçimde aktarın; önceki dönemin ilişkilerini de takip etmeye devam edin.
            </p>
          </div>
        </div>
      </section>

      {/* Yeni dönem, yeni sorumluluk */}
      <section className="py-20 bg-slate-50 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            SORUMLULUK
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Yeni dönem, yeni sorumluluk
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
            Yeni gruba katıldığınızda çalışma düzeni ve aylık katılım koşulları devam eder. İyi bir ilişki ağı, dönemler boyunca düzenli görüşme ve karşılıklı katkıyla gelişir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/kapali-gruplar')}
              className="font-bold px-8 h-12 bg-red-600 hover:bg-red-500 shadow-md shadow-red-200"
            >
              Kapalı Grupları İncele <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/katilim-ilkeleri')}
              className="font-bold px-8 h-12 border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              <FileText className="w-4 h-4 mr-2" /> Katılım İlkeleri
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
