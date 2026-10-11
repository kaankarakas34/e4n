import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../shared/Button';
import {
  MessageSquare,
  Users,
  Target,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ListOrdered,
  Send,
  CalendarCheck
} from 'lucide-react';

export function BirebirNetworking() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <SEO
        title="E4N Birebir Networking | İşinizi Daha İyi Anlatın"
        description="Birebir networking görüşmelerinde iş modelinizi, hedef müşterilerinizi ve olası iş birliklerini konuşun. E4N'nin görüşme yaklaşımını öğrenin."
        canonical="https://www.event4network.com/birebir-networking"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            🤝 Birebir Networking Yaklaşımı
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Birbirinizin işini anlamaya <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              zaman ayırın
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            Birebir görüşmeler, grup toplantılarında başlayan tanışıklığı daha ayrıntılı bir iş ilişkisine taşımanızı sağlar. İşinizi nasıl yaptığınızı, hangi müşterilere hizmet verdiğinizi ve hangi bağlantıları aradığınızı karşılıklı konuşabilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/kapali-gruplar')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Kapalı Gruplar
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/nasil-calisir')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Nasıl Çalışır?
            </Button>
          </div>
        </div>
      </section>

      {/* Neleri konuşabilirsiniz? */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
            GÖRÜŞME ODAĞI
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Neleri konuşabilirsiniz?
          </h2>
          <div className="space-y-6 text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              Şirketinizin sunduğu hizmetleri, hedef müşteri profilinizi, güçlü yönlerinizi ve birlikte çalışmak istediğiniz iş ortaklarını anlatın. Karşı tarafın aynı konulardaki ihtiyaçlarını da öğrenin.
            </p>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-slate-800 font-medium text-base">
                  Birbirinizi hangi durumlarda önerebileceğinizi ve uygun bir tanıştırma için hangi bilgilerin gerekli olduğunu netleştirin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Örnek görüşme akışı */}
      <section className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ListOrdered className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              YAPILANDIRILMIŞ DİYALOG
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
            Örnek görüşme akışı
          </h2>

          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex gap-5 items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">İşinizi ve Mevcut Hedefinizi Anlatın</h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  Önce işinizi ve mevcut hedefinizi kısa anlatın.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex gap-5 items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Somut Değer Üretimini Örneklendirin</h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  Ardından bir örnek müşteri veya proje üzerinden nasıl değer ürettiğinizi açıklayın.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex gap-5 items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Soruları Yanıtlayın ve Karşı Tarafı Dinleyin</h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  Karşı tarafın sorularını yanıtlayın ve onun iş modelini dinleyin.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex gap-5 items-start">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-black text-sm flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sonraki Adımı Belirleyin</h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  Görüşmenin sonunda takip edilecek bir bağlantı veya iş birliği ihtimali varsa bir sonraki adımı birlikte belirleyin. Somut bir fırsat bulunmasa da birbirinizin işini daha iyi tanımış olmanız gelecekteki uygun yönlendirmelere yardımcı olabilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Görüşmeden sonra */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              TAKİP VE GÜVEN
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            Görüşmeden sonra
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center mb-4">
                  01
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">Notlarla Takip</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Konuştuğunuz ihtiyaçları kısa notlarla takip edin.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center mb-4">
                  02
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">Uygunluk ve İzin</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Paylaşılan bir bağlantı için iletişim kurulacaksa uygunluğu ve izin durumunu gözetin.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center mb-4">
                  03
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">Zamanında Tamamlama</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Üzerinde anlaşılan adımları zamanında tamamlayın.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-start">
            <Button
              size="default"
              variant="primary"
              onClick={() => navigate('/kapali-gruplar')}
              className="font-bold bg-red-600 hover:bg-red-500 text-white px-6 h-12"
            >
              Kapalı Gruplar
            </Button>
            <Button
              size="default"
              variant="outline"
              onClick={() => navigate('/nasil-calisir')}
              className="font-semibold border-slate-300 text-slate-800 hover:text-red-600 hover:border-red-300 px-6 h-12"
            >
              Nasıl Çalışır?
            </Button>
          </div>
        </div>
      </section>

      {/* Planlanan özellik için ayrı duyuru metni (Ürün Yol Haritası) */}
      <section className="py-20 bg-amber-50/60 border-b border-amber-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-amber-200 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Ürün Yol Haritası
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-4">
              Geliştirme aşamasında: İş profilinize göre görüşme önerileri
            </h3>
            <div className="space-y-4 text-slate-700 text-base leading-relaxed">
              <p>
                E4N için planlanan eşleştirme özelliği; sunduğunuz hizmetleri, hedef müşterilerinizi ve iş birliği ihtiyaçlarınızı değerlendirerek grup içinde birebir görüşme önerileri sunacak. Öneri almak için iş profilinizi tamamlamanız gerekecek. Görüşme talepleri E4N'nin kendi talep ve takvim akışı üzerinden ilerleyecek.
              </p>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-sm">
                <ShieldCheck className="w-5 h-5 text-amber-700 inline-block mr-2 -mt-0.5" />
                Özel eşleştirme formundaki bilgiler reklam veya pazarlama amacıyla paylaşılmayacak; eşleştirme amacıyla kullanılacak.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
