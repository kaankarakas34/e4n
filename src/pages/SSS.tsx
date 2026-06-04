import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { Search, ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

const sssItems = [
  {
    q: "Event4Network nedir?",
    a: "Event4Network, nitelikli iş insanlarını değerlendirme süreciyle bir araya getiren, güvene dayalı iş ilişkileri ve nitelikli referanslar oluşturan seçici bir networking ekosistemidir."
  },
  {
    q: "Herkes katılabilir mi?",
    a: "Hayır. Event4Network seçici bir yapıya sahiptir. Başvurular; adayın sektörü, iş yapma biçimi, mevcut grup yapısı, meslek koltuğu uygunluğu, temsil gücü ve gruba sağlayabileceği katkılar doğrultusunda değerlendirilir."
  },
  {
    q: "Üyelik neden değerlendirme ile ilerler?",
    a: "Ekosistem içerisindeki güveni, dengeyi ve iş yönlendirme kalitesini korumak için üyelikler ön değerlendirme görüşmesi, meslek koltuğu uygunluğu ve profil incelemesi aşamalarından geçer."
  },
  {
    q: "Başvuru yapmak üyelik garantisi midir?",
    a: "Hayır. Başvuru yapmak üyelik garantisi oluşturmaz. Başvurular, grubun dengesi, meslek koltuğu boşluğu ve karşılıklı değer potansiyeli doğrultusunda incelenir."
  },
  {
    q: "Üyelik süreci nasıl ilerler?",
    a: "Süreç; başvuru formu iletimi, ön profil incelemesi, ön görüşme, uygun bir toplantıya tanışma/konuk katılımı ve son uygunluk değerlendirmesi adımlarından oluşur."
  },
  {
    q: "Toplantılar nasıl gerçekleşir?",
    a: "Event4Network grupları disiplinli bir takvim dahilinde, çoğunlukla online olarak düzenli toplantılar gerçekleştirir. Bununla birlikte yüz yüze kahve görüşmeleri ve ortak ağ buluşmaları da planlanır."
  },
  {
    q: "Birebir görüşmeler neden önemlidir?",
    a: "Birebir görüşmeler (1-on-1), üyelerin birbirlerinin iş süreçlerini, hedeflerini ve referans çevrelerini detaylıca tanımasını sağlayarak asıl güven ilişkisinin kurulduğu aşamadır."
  },
  {
    q: "Üyelerden ne beklenir?",
    a: "Üyelerimizden toplantılara düzenli katılım, birebir görüşmeler yapmaları, profesyonel temsil kurallarına uymaları ve gruba karşılıklı değer/referans yönlendirmeleriyle katkı sunmaları beklenir."
  },
  {
    q: "Nitelikli iş yönlendirmesi nedir?",
    a: "Üyelerin kendi çevrelerindeki gerçek ihtiyaç sahiplerini, güvendikleri diğer grup üyelerine referans kanalıyla yönlendirmesidir. Bu yöntem, soğuk satış aramaları yerine sıcak ve güvenilir iş kapıları açar."
  },
  {
    q: "Aynı sektörden kişiler aynı grupta yer alabilir mi?",
    a: "Event4Network’te grup içi rekabeti önlemek için 'Meslek Koltuğu' sistemi uygulanır. Bu doğrultuda her grupta her meslek dalından yalnızca tek bir temsilci yer alabilir."
  },
  {
    q: "Etkinlikler herkese açık mı?",
    a: "Etkinliklerimizin bir kısmı sadece üyelere özel kapalı davetlerken, bazı networking ve eğitim etkinlikleri kamuya açık/ziyaretçi katılımına uygundur."
  },
  {
    q: "Ücretlendirme nasıl öğrenilir?",
    a: "Event4Network yıllık üyelik modeliyle çalışmaktadır. Üyelik katılım koşulları ve detayları, ön değerlendirme görüşmesi olumlu geçen adaylarla paylaşılmaktadır."
  },
  {
    q: "Uygun görülmeyen başvurulara ne olur?",
    a: "Meslek koltuğu doluluğu veya diğer kriterler nedeniyle uygun görülmeyen başvurular veri politikamıza uygun olarak arşivlenir ve gelecekte yeni gruplar açıldığında öncelikli olarak değerlendirilebilir."
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
      <Helmet>
        <title>Sıkça Sorulan Sorular | Event4Network</title>
        <meta name="description" content="Event4Network hakkında merak edilen sorular; üyelik süreci, meslek koltuğu sistemi, toplantı disiplini ve nitelikli iş yönlendirmeleri." />
        <link rel="canonical" href="https://www.event4network.com/sikca-sorulan-sorular" />
      </Helmet>

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
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-lg h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto"
            >
              Başvuru Yap <ArrowRight className="ml-2 h-5 w-5" />
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
