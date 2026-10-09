import React, { useState } from 'react';
import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { Search, ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

const sssItems = [
  {
    "q": "Event4Network nedir?",
    "a": "Event4Network, şirket bilgileriyle normal üyelik kaydı yapılabilen; iş ilişkileri, grup buluşmaları ve güvene dayalı yönlendirmeler sunan bir networking platformudur."
  },
  {
    "q": "Herkes üye olabilir mi?",
    "a": "Şirket adı, geçerli ve tekil VKN/TCKN, vergi dairesi, şirket adresi ve il bilgisiyle kayıt olabilirsiniz. Davetiye ve üyelik için ön onay gerekmez; kapalı gruba kabul ayrı bir süreçtir."
  },
  {
    "q": "Üye olmak için hangi bilgiler gerekir?",
    "a": "Şirket adı, VKN/TCKN, vergi dairesi, şirket/fatura adresi, il ve iletişim bilgileri zorunludur. Vergi levhası dosyası yüklemek gerekmez. Bir vergi numarası yalnız bir hesapta kullanılabilir; hesap silinse de numara yeniden kayda açılamaz."
  },
  {
    "q": "Üyelik ve abonelik aynı şey mi?",
    "a": "Hayır. Kayıt hesabınızı oluşturur. Gruplara başvuru göndermek için aktif abonelik gerekir; güncel paketler giriş sonrası Üyelik İşlemleri alanındadır. Abonelik satın almak gruba otomatik kabul sağlamaz."
  },
  {
    "q": "Gruba nasıl başvururum?",
    "a": "Aktif abonelikle panelinizde grupları, analizlerini, doluluğu ve üyelerin mesleklerini inceleyin. Katıl ile istek gönderin. Başkan telefon görüşmesini kaydettikten sonra kabul veya ret verir; sonucu panelinizden izleyebilirsiniz."
  },
  {
    "q": "Grup kapasitesi kaç kişidir?",
    "a": "Kapalı gruplarda başkan hariç en fazla 35 üye bulunur. Kapasite ve meslek koltuğu uygunluğu başvuru sürecinde kontrol edilir."
  },
  {
    "q": "Toplantılar nasıl gerçekleşir?",
    "a": "Grupların toplantı ve etkinlik takvimlerini panelinizden takip edebilirsiniz. Katılım koşulları ve kayıt durumları ilgili etkinlikte gösterilir."
  },
  {
    "q": "Birebir görüşmeler neden önemlidir?",
    "a": "Birebir görüşmeler üyelerin birbirlerinin iş süreçlerini, hedeflerini ve referans çevrelerini tanımasına yardımcı olur."
  },
  {
    "q": "Etkinlikler herkese açık mı?",
    "a": "Her etkinliğin katılım ve ödeme koşulları kendi ekranında gösterilir. Abonelik satın almak bütün etkinliklerin ücretsiz olduğu anlamına gelmez."
  },
  {
    "q": "Ücretlendirme nasıl öğrenilir?",
    "a": "Giriş yaptıktan sonra Üyelik İşlemleri alanında güncel abonelik paketlerini ve ödeme tutarlarını inceleyebilirsiniz. Kayıt için ön değerlendirme görüşmesi şartı yoktur."
  },
  {
    "q": "Topluluk kanalına katılmak grup üyeliği sağlar mı?",
    "a": "Hayır. Açık lonca ve WhatsApp topluluk kanalları farklıdır; bu kanallara katılım E4N aboneliği veya kapalı gruba kabul sağlamaz. Pardus ayrı, ücretsiz ve seçici bir yapıdır."
  },
  {
    "q": "Grup başvurum reddedilirse hesabım silinir mi?",
    "a": "Grup kararı ve normal üyelik hesabı ayrıdır. Başvurunuzun durumunu panelinizden takip edebilirsiniz; ret, otomatik sonraki dönem kabulü veya önceliği sağlamaz."
  }
];

export function SSS() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  const toggleItem = (idx: number) => {
    setOpenItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const filteredItems = sssItems.filter(item => 
    item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white">
      <SEO
        title="Sıkça Sorulan Sorular | Event4Network"
        description="Event4Network hakkında merak edilen sorular; üyelik süreci, meslek koltuğu sistemi, toplantı disiplini ve nitelikli iş yönlendirmeleri."
        canonical="https://www.event4network.com/sikca-sorulan-sorular"
        schema={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": sssItems.map(item => ({
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
      <section className="relative py-24 bg-gray-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Destek ve Bilgi
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
            E4N iş ağının yapısı, işleyişi ve başvuru süreçleriyle ilgili en çok sorulan soruların yanıtları.
          </p>

          <div className="max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Sorularda arayın..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 shadow-lg text-lg"
            />
          </div>
        </div>
      </section>

      {/* SSS List */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-150 text-gray-500">
              Aramanıza uygun bir soru bulunamadı.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item, idx) => {
                const isOpen = !!openItems[idx];
                return (
                  <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white transition-all duration-300">
                    <button
                      onClick={() => toggleItem(idx)}
                      className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="text-lg font-bold text-gray-900 flex items-center gap-3">
                        <HelpCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        {item.q}
                      </span>
                      <ChevronDown className={`h-5 w-5 text-gray-450 transition-transform duration-300 ${isOpen ? 'rotate-180 text-red-500' : ''}`} />
                    </button>
                    <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 border-t border-gray-100 bg-gray-50/30' : 'max-h-0'}`}>
                      <p className="p-6 text-gray-650 leading-relaxed text-sm whitespace-pre-line">
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Aklınızda Başka Bir Soru mu Var?
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            Sorularınız veya daha fazla bilgi almak için doğrudan iletişim ekibimizle görüşebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/auth/register')}
              className="text-lg h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto"
            >
              Üye Ol <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/iletisim')}
              className="text-lg h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              İletişime Geç
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
