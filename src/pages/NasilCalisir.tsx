import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  UserPlus,
  CreditCard,
  Send,
  UserCheck,
  Handshake,
  Repeat,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Calendar
} from 'lucide-react';

export function NasilCalisir() {
  const navigate = useNavigate();

  const steps = [
    {
      num: "01",
      icon: UserPlus,
      title: "1. Hesabınızı oluşturun",
      desc: "Şirketiniz ve iletişim bilgilerinizle kayıt olun. Hesap açmak için davetiye veya ön onay gerekmez. Kayıt sırasında istenen bilgiler form üzerinde açıklanır.",
      note: "Hesabınızın oluşturulması ücretli abonelik başlatmaz ve kapalı grupta yer ayırmaz."
    },
    {
      num: "02",
      icon: CreditCard,
      title: "2. Üyelik koşullarını değerlendirin",
      desc: "Güncel abonelik tutarını, ödeme koşullarını ve üyelik kapsamını inceleyin. E4N'nin tek üyelik yapısı, kapalı grup kabulüyle ayrı yönetilir.",
      note: "Kapalı gruba başvurmak için aktif abonelik gerekir. Abonelik satın almadan önce grup kabulünün ayrıca değerlendirildiğini bilmeniz önemlidir."
    },
    {
      num: "03",
      icon: Send,
      title: "3. Uygun gruba başvurun",
      desc: "Mevcut başvuru alanından grup bilgilerini inceleyerek talebinizi iletin. Şirketinizin sunduğu hizmetler, grup içindeki mevcut hizmetler ve kontenjan değerlendirmede dikkate alınır.",
      note: "Kapalı grupta aynı veya çakışan hizmetlerin bir arada bulunmaması esastır."
    },
    {
      num: "04",
      icon: UserCheck,
      title: "4. Grup başkanıyla görüşün",
      desc: "Başkan görüşmesi; işinizi, hedef müşteri profilinizi, aradığınız bağlantıları ve düzenli katılıma ayırabileceğiniz zamanı konuşmak için yapılır. Görüşmede grubun çalışma biçimi ve katılım beklentileri de açıklanır.",
      note: "Başvurunuz görüşme, hizmet uyumu ve kapasite koşulları birlikte değerlendirilerek sonuçlandırılır."
    },
    {
      num: "05",
      icon: Handshake,
      title: "5. Grubunuzla ilişki geliştirin",
      desc: "Kabul sonrası düzenli toplantılara katılır, işinizi anlatır ve diğer üyelerin uzmanlıklarını öğrenirsiniz. Birebir görüşmeler, birbirinize hangi alanlarda yardımcı olabileceğinizi daha ayrıntılı konuşmanızı sağlar.",
      note: "Aylık katılım değerlendirmesi, açıklanan puan ve çalışma kurallarına göre yapılır."
    },
    {
      num: "06",
      icon: Repeat,
      title: "6. Dört ayda bir yeni grup dönemine geçin",
      desc: "Shuffle ile grup dağılımı dört ayda bir yenilenir. Hizmet uyumu ve kapasite dikkate alınarak yeni bağlantılar kurabileceğiniz dönemler oluşturulur.",
      note: "Önceki grubunuzda geliştirdiğiniz ilişkileri sürdürürken yeni üyeleri de tanımaya devam edebilirsiniz."
    }
  ];

  return (
    <div className="bg-white min-h-screen pt-20">
      <SEO
        title="E4N Nasıl Çalışır? | Üyelik, Grup Kabulü ve Shuffle"
        description="Hesap açma, E4N aboneliği, başkan görüşmesi ve kapalı grup kabulünü öğrenin. Dört aylık shuffle ve düzenli katılım modelini inceleyin."
        canonical="https://www.event4network.com/nasil-calisir"
      />

      {/* 1. Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Süreç ve Mekanizma
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Hesaptan düzenli grup çalışmasına: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              E4N nasıl çalışır?
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            E4N'de hesap oluşturma, abonelik ve kapalı gruba katılma birbirini izleyen ayrı adımlardır. Açık topluluklara katılım ise kendi kanalları üzerinden ilerler.
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
              onClick={() => navigate('/kapali-gruplar')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Kapalı Grupları İncele
            </Button>
          </div>
        </div>
      </section>

      {/* 2. 6 Adımlı Süreç */}
      <section className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              AŞAMALAR
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Katılım ve Çalışma Adımları
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:border-red-200 hover:shadow-md transition-all duration-300"
                >
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-black text-slate-300">{step.num}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">{step.desc}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    ℹ️ {step.note}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Açık Topluluklar ve Etkinlikler Nerede Duruyor? */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">
                FARK VE SINIRLAR
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                Açık topluluklar ve etkinlikler nerede duruyor?
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
                Loncalar geniş katılımlı iletişim alanlarıdır. Açık etkinlikler ise kendi katılım ve bilet koşullarıyla değerlendirilir. Bu alanlara katılmak, kapalı gruba otomatik kabul sağlamaz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="default"
                  variant="primary"
                  onClick={() => navigate('/topluluklarimiz')}
                  className="font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Loncalara Katıl
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => navigate('/etkinlikler')}
                  className="font-bold border-white/20 text-white hover:bg-white/10"
                >
                  <Calendar className="w-4 h-4 mr-2" /> Etkinlikleri İncele
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Final CTA */}
      <section className="py-20 bg-slate-50 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Ayrıntılı Koşulları İnceleyin
          </h2>
          <p className="text-slate-600 text-base mb-8 leading-relaxed">
            E4N üyelik yapısı ve 35 kişilik kapalı grupların kabul kriterleri hakkında detaylı bilgi alın.
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
              onClick={() => navigate('/kapali-gruplar')}
              className="font-bold px-8 h-12 border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              Kapalı Gruplar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
