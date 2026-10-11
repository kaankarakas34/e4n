import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../shared/Button';
import { Search, ChevronDown, HelpCircle, ArrowRight, MessageCircle } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "E4N nedir?",
    a: "Event4Network; açık loncalar, etkinlikler ve 35 kişilik kapalı gruplarla iş insanlarının düzenli bağlantılar geliştirmesini sağlayan bir networking ekosistemidir."
  },
  {
    q: "Hesap açmak için davetiye gerekir mi?",
    a: "Şirket bilgilerinizle hesap açmak için davetiye veya ön onay gerekmez. Kapalı gruba kabul ise ayrı değerlendirilir."
  },
  {
    q: "Hesap açmak abonelik satın almak mı?",
    a: "Hesap oluşturma ve ücretli abonelik farklıdır. Güncel üyelik tutarı ve kapsamı üyelik alanında açıklanır."
  },
  {
    q: "Abonelik satın aldığımda gruba otomatik girer miyim?",
    a: "Kapalı grup kabulü aktif abonelik, başkan görüşmesi, hizmet uyumu ve uygun kontenjanla değerlendirilir. Ödeme otomatik kabul sağlamaz."
  },
  {
    q: "Kapalı gruba başvurmak için şirket şartı var mı?",
    a: "Hedef modelde şirket/tüzel kişilik şartı vardır; ülke farkı tek başına dışlama nedeni değildir. Kabul edilen şirket ve belge bilgileri başvuru sırasında açıklanır."
  },
  {
    q: "Gruplar kaç kişilik?",
    a: "Kapalı gruplar 35 kişilik yapı üzerine kuruludur. Mevcut kamuya açık üyelik metninde bu kapasite grup başkanı hariç 35 üye olarak açıklanır."
  },
  {
    q: "Aynı meslekten birden fazla kişi aynı grupta olabilir mi?",
    a: "Aynı veya çakışan hizmetlerin aynı kapalı grupta bulunmaması esastır. Sadece unvan yerine fiilen sunulan hizmetler değerlendirilir."
  },
  {
    q: "Aynı sektördeki kişiler birlikte olabilir mi?",
    a: "Geniş bir sektörde farklı hizmetler sunulabilir. Karar hizmetlerin birbirini tamamlayıp tamamlamadığına veya çakışıp çakışmadığına göre verilir."
  },
  {
    q: "Başkan görüşmesinde neler konuşulur?",
    a: "İşiniz, hedefleriniz, aradığınız bağlantılar, grup çalışma düzeni ve düzenli katılım beklentileri konuşulur."
  },
  {
    q: "Shuffle nedir?",
    a: "Kapalı grup dağılımının dört ayda bir yenilenmesidir. Grup kapasitesi ve hizmet çakışması koşulları korunarak yeni bağlantılar için dönemler oluşturulur."
  },
  {
    q: "Shuffle sonrası eski ilişkilerimi sürdürebilir miyim?",
    a: "Önceki dönemden tanıdığınız kişilerle iş ilişkilerinizi devam ettirebilirsiniz. Grup değişimi yeni insanlarla tanışma alanı açar."
  },
  {
    q: "Toplantılar ne sıklıkla yapılır?",
    a: "Kapalı gruplarda düzenli toplantılar yapılır. Güncel dönem takvimi ve katılım biçimi başvuru sürecinde ve ilgili toplantı duyurularında açıklanır."
  },
  {
    q: "Aylık puan tablosu neden var?",
    a: "Grup çalışmasına katılımı açıklanan kurallara göre değerlendirmek için kullanılır. Faaliyetler, eşik ve varsa mazeret koşulları üyeye bildirilir."
  },
  {
    q: "Katılım koşullarını karşılamazsam ne olur?",
    a: "İlgili değerlendirme kurallarına göre kapalı gruptaki yeriniz sona erebilir. Bu işlem tek başına E4N üyeliğinizin iptali anlamına gelmez."
  },
  {
    q: "İkinci kez gruptan çıkarılırsam ne olur?",
    a: "Sekiz ay, iki shuffle dönemine karşılık gelen süre boyunca yeni grup başvurusu kısıtlanır. Süre bitince başvuru diğer kabul koşullarıyla değerlendirilir."
  },
  {
    q: "Gruptan çıktığımda etkinlik haklarım devam eder mi?",
    a: "E4N üyeliğiniz devam ettiği sürece dış etkinlik ve indirimli bilet haklarınız ilgili koşullarla korunur. Grup katılımı ve abonelik ayrı yönetilir."
  },
  {
    q: "Loncalara katılmak ücretli mi?",
    a: "Açık lonca kanallarına katılım ücretsizdir. Kanal kuralları geçerlidir. Lonca katılımı kapalı grup kabulü veya E4N aboneliği sağlamaz."
  },
  {
    q: "Loncalarda aynı meslekten insanlar bulunabilir mi?",
    a: "Loncalar geniş ve açık topluluklardır. Kapalı grupların hizmet tekilliği ve 35 kişi modeli bu kanallara uygulanmaz."
  },
  {
    q: "E4N'ye üye olmadan etkinliğe katılabilir miyim?",
    a: "Açık etkinliklerin katılım koşulları kendi sayfalarında belirtilir. Size uygun etkinliği inceleyerek kayıt şartlarını öğrenebilirsiniz."
  },
  {
    q: "Birebir görüşmelerin amacı nedir?",
    a: "Birbirinizin iş modelini, hedef müşterisini ve olası iş birliği alanlarını daha iyi anlamaktır. Görüşme sonrası uygun adımlar karşılıklı belirlenir."
  },
  {
    q: "Yapay zekâ eşleştirmesi şu anda kullanılabiliyor mu?",
    a: "İş profiline göre grup içi görüşme önerileri geliştirme planındadır. Özellik devreye alındığında nasıl kullanılacağı ve veri işleme koşulları ayrıca açıklanacaktır."
  },
  {
    q: "E4N müşteri, satış veya ciro garantisi veriyor mu?",
    a: "E4N ilişki geliştirmek için ortam ve yöntem sunar. Ticari sonuçlar üyelerin sunduğu hizmet, güvenilirlik ve ilişki takibine bağlıdır."
  },
  {
    q: "İstanbul, Ankara ve İzmir'de grup seçebilir miyim?",
    a: "Şehir bazlı grup ayrımı mevcut kamuya açık akışta henüz etkin değildir. Şehir sayfaları gerçek yerel duyuruları ve güncel organizasyon bilgisini paylaşmak için hazırlanır."
  },
  {
    q: "Pardus Business Chamber E4N üyeliğine dahil mi?",
    a: "Pardus Business Chamber ayrı, ücretsiz ve seçici bir yapıdır. E4N hesabı veya aboneliği Pardus kabulü anlamına gelmez."
  },
  {
    q: "Başka sorum varsa ne yapmalıyım?",
    a: "İletişim sayfasından konunuzu seçerek ekibe ulaşabilirsiniz."
  }
];

export function SSS() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const toggleItem = (idx: number) => {
    setOpenItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const filteredItems = FAQ_ITEMS.filter(item =>
    item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen pt-20 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <SEO
        title="E4N Sıkça Sorulan Sorular | Üyelik ve Grup Katılımı"
        description="E4N hesabı, abonelik, 35 kişilik gruplar, shuffle, loncalar ve katılım koşulları hakkındaki soruların yanıtlarını bulun."
        canonical="https://www.event4network.com/sikca-sorulan-sorular"
        schema={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ_ITEMS.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.a
            }
          }))
        }}
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            Yardım ve Bilgilendirme
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            E4N hakkında <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              merak ettikleriniz
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            Hesap oluşturma, üyelik, kapalı grup kabulü ve açık toplulukların çalışma biçimiyle ilgili temel soruların yanıtları.
          </p>

          {/* Arama Çubuğu */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Sorularda arayın (örn: shuffle, üyelik, 35 kişi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </section>

      {/* SSS Accordion Listesi */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredItems.map((item, idx) => {
              const isOpen = !!openItems[idx];
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-300"
                >
                  <button
                    onClick={() => toggleItem(idx)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="font-bold text-slate-900 text-base sm:text-lg">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180 text-red-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-slate-700 text-sm sm:text-base leading-relaxed border-t border-slate-100 bg-slate-50/40">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p className="text-base">Aramanızla eşleşen soru bulunamadı.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-red-600 font-bold hover:underline"
                >
                  Tüm soruları göster
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Alt Destek / İletişim Çağrısı */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Başka sorunuz var mı?
          </h2>
          <p className="text-slate-600 text-base leading-relaxed mb-8 max-w-xl mx-auto">
            İletişim sayfasından konunuzu seçerek ekibimize doğrudan ulaşabilirsiniz.
          </p>
          <Button
            size="default"
            variant="primary"
            onClick={() => navigate('/iletisim')}
            className="font-bold bg-red-600 hover:bg-red-500 text-white px-8 h-12 shadow-md shadow-red-900/20"
          >
            İletişime Geçin
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
