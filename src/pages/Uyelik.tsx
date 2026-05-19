import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { CheckCircle2, XCircle, ArrowRight, UserCheck, Search, ClipboardList, Shield, Check } from 'lucide-react';

export function Uyelik() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <Helmet>
        <title>Üyelik ve Değerlendirme Süreci | Event4Network</title>
        <meta name="description" content="Event4Network üyelik kriterleri, değerlendirme süreci ve kimler için uygun olduğuna dair detaylar. Başvuru üyelik garantisi oluşturmaz." />
        <link rel="canonical" href="https://www.event4network.com/uyelik" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-24 bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Kriterler ve Başvuru
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Üyelik ve Değerlendirme Süreci
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed font-light">
            Event4Network’e katılım, rastgele bir üyelik süreciyle değil; belirli mesleki kriterler, profesyonel temsil gücü ve karşılıklı değer üretme potansiyeli doğrultusunda şekillenir.
          </p>
          <div className="bg-red-950/30 border border-red-500/20 text-red-200 text-sm py-3 px-6 rounded-xl inline-block max-w-2xl mx-auto mb-8">
            <strong>Önemli Not:</strong> Başvuru üyelik garantisi oluşturmaz. Başvurular, uygunluk ve karşılıklı değer potansiyeli doğrultusunda değerlendirilir.
          </div>
          <div>
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-lg h-14 px-8 font-bold bg-red-600 hover:bg-red-500"
            >
              Değerlendirme Başvurusu Başlat
            </Button>
          </div>
        </div>
      </section>

      {/* Kimler İçin Uygun & Uygun Değildir */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Kimler İçin Uygun */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-8 pb-3 border-b border-gray-100 flex items-center gap-3">
                <CheckCircle2 className="h-7 w-7 text-green-600" /> Kimler İçin Uygun?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: 'Profesyonel Olgunluk',
                    desc: 'Faaliyet gösterdiği sektörde en az 2 yıllık iş geçmişi olan ve kurumsal temsile önem veren iş insanları.'
                  },
                  {
                    title: 'Net Uzmanlık Alanı',
                    desc: 'Grubun meslek koltuğu sistemine uygun, kendi alanında derinleşmiş ve doğrudan rekabet yaratmayan profesyoneller.'
                  },
                  {
                    title: 'Güvenilirlik ve Temsil Gücü',
                    desc: 'Karşılıklı yönlendirmelerde ve iş ortaklıklarında referans gücünü koruyabilecek, iş ahlakına bağlı profiller.'
                  },
                  {
                    title: 'Katılım Disiplini',
                    desc: 'Düzenli toplantılara, birebir görüşmelere ve ağ etkinliklerine zaman ayırabilecek disipline sahip liderler.'
                  },
                  {
                    title: 'Karşılıklı Değer Kültürü',
                    desc: 'Sadece alıcı değil, diğer üyelerin işini de büyütmeye odaklanan, referans ve dayanışma bilincine sahip olanlar.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kimler İçin Uygun Değildir */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-8 pb-3 border-b border-gray-200 flex items-center gap-3">
                <XCircle className="h-7 w-7 text-red-600" /> Kimler İçin Uygun Değildir?
              </h2>
              <ul className="space-y-6 text-gray-600">
                <li className="flex gap-3 items-start">
                  <span className="text-red-500 font-bold text-lg mt-0.5">✕</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Hızlı Satış Odaklılar</h4>
                    <p className="text-sm text-gray-500">Güven ilişkisi kurmadan sadece anlık müşteri arayan veya doğrudan gruptaki üyelere agresif satış yapmayı hedefleyenler.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-red-500 font-bold text-lg mt-0.5">✕</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Disiplinsiz ve Katılımı Düşük Olanlar</h4>
                    <p className="text-sm text-gray-500">Toplantı sürekliliğine, zaman yönetimine ve birebir görüşme prensiplerine uymakta zorlananlar.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-red-500 font-bold text-lg mt-0.5">✕</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Meslek Çakışması Olan Sektörler</h4>
                    <p className="text-sm text-gray-500">Mevcut üye gruplarında koltuğu dolu olan ve doğrudan rekabet oluşturan meslek grupları (üyelik başvurusu ancak başka boş koltuklar için yedeklenebilir).</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Üyelik Süreci Yol Haritası */}
      <section className="py-24 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Aşamalardan Geçiş</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
              Değerlendirme ve Kabul Süreci
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Event4Network ekosistemine dahil olma süreci 5 adımdan oluşan objektif bir değerlendirmeyle yürütülür.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-8 right-8 h-1 bg-red-100 -z-10"></div>
            {[
              {
                step: '01',
                title: 'Değerlendirme Başvurusu',
                desc: 'Başvuru formunu doldurarak mesleki profilinizi iletin.'
              },
              {
                step: '02',
                title: 'Profil İncelemesi',
                desc: 'İş hacmi, faaliyet süresi ve meslek koltuğu kontrol edilir.'
              },
              {
                step: '03',
                title: 'Ön Görüşme',
                desc: 'Ekibimiz hedeflerinizi ve beklentilerinizi öğrenmek için sizinle iletişime geçer.'
              },
              {
                step: '04',
                title: 'Tanışma Katılımı',
                desc: 'Sistemi gözlemlemeniz için uygun bir toplantıya konuk olarak davet edilirsiniz.'
              },
              {
                step: '05',
                title: 'Kabul ve Başlangıç',
                desc: 'Uygunluk durumunda üyeliğiniz onaylanır ve grubunuza dahil olursunuz.'
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
                <span className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold text-lg mb-4 border-2 border-red-100">
                  {step.step}
                </span>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{step.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neden Katılmalısınız? */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Kazanımlar</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
              Neden Event4Network’e Katılmalısınız?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Doğru Çevreye Dahil Olmak',
                desc: 'Seçici kurallarla filtrelenmiş, vizyon sahibi ve işini büyütme hedefinde olan saygın profesyonellerle bir arada bulunursunuz.'
              },
              {
                title: 'Profesyonel Görünürlük',
                desc: 'Düzenli sunumlar ve toplantılar aracılığıyla işinizi ve uzmanlığınızı en doğru şekilde temsil edersiniz.'
              },
              {
                title: 'Güvene Dayalı İlişkiler',
                desc: 'Birebir görüşmelerle birbirinizin iş süreçlerini tanır ve yapay reklam kanallarına kıyasla daha kalıcı bağlar kurarsınız.'
              },
              {
                title: 'Nitelikli Referanslar',
                desc: 'Gruptaki diğer üyeler, sizin adınıza piyasada güvenilir birer tavsiye ve iş yönlendirme elçisi gibi hareket eder.'
              },
              {
                title: 'Stratejik İş Birlikleri',
                desc: 'Farklı sektörlerdeki tamamlayıcı meslek gruplarıyla ortak projeler, ortak B2B iş geliştirme adımları planlayabilirsiniz.'
              }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Check className="h-5 w-5 text-red-600" /> {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Değerlendirme Sürecimize Dahil Olun
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            E4N iş ağında profesyonel temsil gücünüzü göstermek ve karşılıklı değer yaratmak istiyorsanız başvurunuzu hemen başlatabilirsiniz.
          </p>
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/degerlendirme-basvurusu')}
            className="text-lg h-14 px-10 font-bold bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30"
          >
            Hemen Başvur <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
