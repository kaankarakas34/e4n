import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  UserCheck,
  CreditCard,
  Users,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileText,
  MessageCircle,
  Briefcase
} from 'lucide-react';

export function Uyelik() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <SEO
        title="E4N Üyelik | Abonelik ve Kapalı Grup Başvurusu"
        description="E4N hesabı, yıllık üyelik yaklaşımı ve kapalı grup kabulünü inceleyin. Aktif abonelik, hizmet uyumu ve başkan görüşmesi adımlarını öğrenin."
        canonical="https://www.event4network.com/uyelik"
      />

      {/* 1. Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            E4N Üyelik Modeli
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            E4N'ye üye olun, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              size uygun gruba başvurun
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-4 leading-relaxed font-normal">
            Şirket bilgilerinizle hesabınızı açın, üyelik koşullarını inceleyin ve düzenli networking için uygun kapalı gruba başvurun. Kayıt, abonelik ve grup kabulü ayrı aşamalardır.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-xs sm:text-sm border border-emerald-500/30 mb-10">
            <span>🎁 Henüz abone olmadan 2 toplantıya ücretsiz ziyaretçi olarak katılabilirsiniz!</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/auth/register')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Ücretsiz Üye Ol & Ziyaretçi Ol
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth/login')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Giriş Yap
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Hesap, Abonelik ve Grup Kabulü Ayrımı */}
      <section className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            3 AYRI AŞAMA
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Hesap, abonelik ve grup kabulü
          </h2>

          <div className="overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm mb-6">
            <div className="divide-y divide-slate-100">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold flex-shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Hesap oluşturma</h3>
                    <p className="text-slate-600 text-sm mt-1">E4N'ye kayıt olmanızı ve kişisel hesabınızı oluşturmanızı sağlar.</p>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full w-fit">
                  Ücretsiz / Ön Onaysız
                </span>
              </div>

              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0 text-xl">
                    🎁
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Ücretsiz ziyaretçi deneyimi</h3>
                    <p className="text-slate-600 text-sm mt-1">Abonelik satın almadan önce kapalı grupların toplantılarına <strong>2 defaya kadar ücretsiz ziyaretçi</strong> olarak katılıp sistemi yerinde test edebilirsiniz.</p>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full w-fit">
                  2 Toplantı Ücretsiz
                </span>
              </div>

              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold flex-shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Aktif abonelik</h3>
                    <p className="text-slate-600 text-sm mt-1">Üyelik kapsamındaki hakları ve grup başvurusu imkânını sağlar.</p>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-3 py-1.5 rounded-full w-fit">
                  E4N Üyeliği
                </span>
              </div>

              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Kapalı grup kabulü</h3>
                    <p className="text-slate-600 text-sm mt-1">Başkan görüşmesi, hizmet uyumu ve kontenjan değerlendirmesi sonrası gerçekleşir.</p>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
                  35 Kişilik Kontenjan
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
            ℹ️ Hesap açmak için davetiye veya ön onay gerekmez. Abonelik satın almadan önce 2 toplantıya ücretsiz ziyaretçi katılabilirsiniz. Abonelik satın almak gruba otomatik kabul sağlamaz.
          </div>
        </div>
      </section>

      {/* 3. Tek Üyelik, Yıllık Yaklaşım */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            MODEL ESASI
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Tek üyelik, yıllık yaklaşım
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              E4N'nin üyelik modeli yıllık aidiyet ve düzenli ilişki geliştirme yaklaşımı üzerine kuruludur. Güncel üyelik tutarı, ödeme dönemi ve kapsamı hesabınızdaki üyelik alanında gösterilir.
            </p>
            <p>
              Sistemi yakından görüp karar vermek isteyen profesyoneller için <strong>2 toplantılık ücretsiz ziyaretçi imkânı</strong> sunulur. Böylece toplantı disiplinini ve üye sinerjisini bizzat yaşadıktan sonra aboneliğinizi güvenle başlatabilirsiniz.
            </p>
            <p>
              Ödeme yapmadan önce güncel koşulları inceleyin. Grup katılımının ayrı bir değerlendirmeye bağlı olduğunu dikkate alın.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Kapalı grup başvurusunda neler değerlendirilir? */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            DEĞERLENDİRME KRİTERLERİ
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Kapalı grup başvurusunda neler değerlendirilir?
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Şirket/tüzel kişilik bilgileri, sunduğunuz hizmetler, grubun hizmet dağılımı, uygun kontenjan ve başkan görüşmesi değerlendirilir. Şirketin bulunduğu ülke tek başına dışlama nedeni değildir.
            </p>
            <p>
              Görüşmede iş hedefleriniz ve grup çalışmasına düzenli katılım beklentileri birlikte ele alınır.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Grup üyeliğiniz değişirse */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              HAKLARIN KORUNMASI
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Grup üyeliğiniz değişirse
          </h2>
          <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Kapalı gruptan çıkarılma, tek başına E4N üyeliğinin sona ermesi anlamına gelmez. Üyeliğiniz devam ettiği sürece dış etkinlik ve indirimli bilet haklarınız, ilgili etkinliğin koşullarına göre korunur.
            </p>
            <p>
              Grup başvurusu ve yeniden katılım koşulları katılım ilkelerinde açıklanır.
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => navigate('/katilim-ilkeleri')}
              className="font-bold border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              <FileText className="w-4 h-4 mr-2" /> Katılım İlkelerini İncele
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Açık topluluklardan da başlayabilirsiniz */}
      <section className="py-20 bg-slate-50 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-2">
            ÜCRETSİZ KATILIM
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Açık topluluklardan da başlayabilirsiniz
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
            Lonca kanallarına ücretsiz katılarak sektörünüzle ilgili paylaşımları ve duyuruları takip edebilirsiniz. Bu katılım abonelik veya kapalı grup kabulü sağlamaz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/auth/register')}
              className="font-bold px-8 h-12 bg-red-600 hover:bg-red-500 shadow-md shadow-red-200"
            >
              Üye Ol
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/topluluklarimiz')}
              className="font-bold px-8 h-12 border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Loncaları Keşfet
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
