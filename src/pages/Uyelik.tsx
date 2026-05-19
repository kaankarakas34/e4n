import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ShieldAlert, 
  Check, 
  Briefcase, 
  Award, 
  Users, 
  Clock, 
  Compass, 
  HeartHandshake 
} from 'lucide-react';

export function Uyelik() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pt-20">
      <Helmet>
        <title>Üyelik Süreci ve Kriterleri | Event4Network</title>
        <meta name="description" content="Event4Network üyelik süreci değerlendirme ile ilerler. Üyelik kriterlerini, başvuru adımlarını ve nitelikli iş insanları için seçici networking yapısını inceleyin." />
        <link rel="canonical" href="https://www.event4network.com/uyelik" />
      </Helmet>

      {/* 1. Hero Section */}
      <section className="relative py-20 sm:py-28 bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/20 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Üyelik & Değerlendirme
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Üyelik Süreci ve Kriterleri
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Event4Network’e katılım, yalnızca form doldurarak gerçekleşen bir kayıt süreci değildir. Her başvuru; iş profili, profesyonel temsil gücü, uygunluk ve karşılıklı değer potansiyeli doğrultusunda değerlendirilir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto shadow-lg shadow-red-900/30"
            >
              Değerlendirme Başvurusu Yap
            </Button>
            <a
              href="#kriterler"
              className="inline-flex items-center justify-center text-base h-14 px-8 font-semibold border border-white/20 text-white bg-transparent hover:bg-white/10 rounded-xl transition-all w-full sm:w-auto text-center"
            >
              Kriterleri İncele
            </a>
          </div>
        </div>
      </section>

      {/* 2. Üyelik Yaklaşımı */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">TOPLULUK STANDARDI</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-6">Üyelik Yaklaşımı</h2>
            <div className="space-y-6 text-gray-600 text-base sm:text-lg leading-relaxed text-left">
              <p>
                Event4Network’te üyelik, topluluğun nitelik standardını korumak için değerlendirme süreciyle ilerler. Amaç, mümkün olduğunca çok kişiyi bir araya getirmek değil; birbirine değer katabilecek doğru profesyonelleri aynı çevrede buluşturmaktır.
              </p>
              <p>
                Bu nedenle başvurular yalnızca iletişim bilgileri üzerinden değerlendirilmez. Kişinin iş deneyimi, faaliyet alanı, profesyonel duruşu, toplantı disiplini, güvenilirliği ve gruba katabileceği değer birlikte ele alınır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Kimler İçin Uygun? */}
      <section className="py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">HEDEF PROFiL</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Kimler İçin Uygun?</h2>
            <p className="mt-4 text-gray-650 leading-relaxed text-sm sm:text-base">
              Event4Network, işini güvene dayalı ilişkilerle büyütmek isteyen, profesyonel temsil gücüne sahip ve nitelikli bir iş çevresinde yer alabilecek kişiler için uygundur.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "Şirket sahipleri ve girişimciler",
              "B2B hizmet sağlayıcılar ve çözüm ortakları",
              "Kurumsal danışmanlar ve bağımsız uzmanlar",
              "Sektöründe derin bilgi ve tecrübeye sahip kişiler",
              "Referans ve dayanışma kültürüne değer veren iş insanları",
              "Kendi iş çevresini doğru kişilerle paylaşmaya açık liderler"
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-250/60 shadow-sm flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Üyelik Kriterleri */}
      <section id="kriterler" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">KRİTERLER</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Üyelik Kriterleri</h2>
            <p className="mt-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              Event4Network’te üyelik kriterleri, topluluğun güven ve nitelik standardını korumak için oluşturulmuştur. Kriterler yalnızca kişinin hangi işi yaptığına değil, o işi nasıl temsil ettiğine ve topluluğa nasıl değer katabileceğine odaklanır.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Briefcase,
                title: "A. Profesyonel Olgunluk",
                desc: "Başvuran kişinin aktif iş hayatında yer alması, yaptığı işi belirli bir ciddiyet ve süreklilik içinde yürütmesi beklenir. İşletmenin faaliyet süresi, iş hacmi, müşteri profili ve hizmet standardı değerlendirmede dikkate alınabilir."
              },
              {
                icon: Award,
                title: "B. Net Uzmanlık Alanı",
                desc: "Üyenin hangi konuda değer sunduğunu açık şekilde ifade edebilmesi önemlidir. Net uzmanlık, diğer üyelerin kişiyi doğru ihtiyaçlarda ve doğru kişilere önerebilmesini kolaylaştırır."
              },
              {
                icon: CheckCircle2,
                title: "C. Güvenilirlik",
                desc: "E4N’de güven, sistemin temelidir. Üyenin profesyonel ilişkilerde güven veren, sözünü takip eden ve iş etiğine uygun hareket eden bir yapıda olması beklenir."
              },
              {
                icon: Users,
                title: "D. Temsil Gücü",
                desc: "Her üye yalnızca kendisini değil, bulunduğu profesyonel çevrenin standardını da temsil eder. Bu nedenle iletişim dili, iş disiplini, görünürlük ve profesyonel duruş önemlidir."
              },
              {
                icon: Clock,
                title: "E. Katılım Disiplini",
                desc: "Event4Network’te görünürlük ve güven, düzenli temasla oluşur. Toplantılara katılım, birebir görüşmelere zaman ayırma ve ilişki geliştirme sürecine aktif katılım beklenir."
              },
              {
                icon: HeartHandshake,
                title: "F. Karşılıklı Değer Kültürü",
                desc: "E4N yalnızca referans almak isteyen kişiler için değil, aynı zamanda çevresine değer katmaya açık profesyoneller için tasarlanmıştır. Üyelerden, uygun durumlarda kendi çevrelerini ve bağlantılarını doğru kişilerle paylaşmaya açık olmaları beklenir."
              },
              {
                icon: Compass,
                title: "G. Nitelikli Referans Anlayışı",
                desc: "Amaç herkesi herkesle tanıştırmak değildir. Üyelerden, doğru ihtiyaç ile doğru kişiyi dikkatli ve güvene dayalı şekilde buluşturmaları beklenir."
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-gray-50 p-8 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Kimler İçin Uygun Değildir? */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">NET DURUŞ</span>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-6">Kimler İçin Uygun Değildir?</h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base mb-6">
                Event4Network herkes için doğru yapı olmayabilir. Bu ifade dışlayıcı olmak için değil, topluluğun verimli ve güvenli şekilde ilerlemesini sağlamak için önemlidir.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
              <ul className="space-y-4">
                {[
                  { title: "Hızlı Satış Odaklılar", desc: "Kısa vadeli kazanç beklentisiyle hareket eden, güven oluşturmadan sadece hızlı satış yapmayı hedefleyenler." },
                  { title: "Zaman Ayıramayacak Kişiler", desc: "Düzenli toplantılara, birebir görüşmelere ve grup kültürüne katkı sağlamaya zaman ayırmak istemeyenler." },
                  { title: "Değer Üretimine Kapalı Olanlar", desc: "Sadece referans ve iş fırsatı almaya odaklanıp, kendi çevresini paylaşmaktan çekinen veya katkı sunmayanlar." },
                  { title: "Zayıf Temsil Standardı", desc: "İşini net ifade edemeyen, kurumsal ve profesyonel temsil standardına önem vermeyen profiller." }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-sm text-gray-300">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Üyelik Süreci */}
      <section className="py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">SÜREÇ ADIMLARI</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Üyelik Süreci</h2>
            <p className="mt-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              Event4Network’e katılım, başvuru ve değerlendirme adımlarından oluşur. Süreç, hem başvuran kişinin yapıyı doğru anlamasını hem de E4N’nin başvuruyu uygunluk açısından değerlendirmesini sağlar.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-100 transform -translate-x-1/2 hidden lg:block"></div>
            <div className="space-y-12">
              {[
                { step: "01", title: "Değerlendirme Başvurusu", desc: "Başvuran kişi, ön değerlendirme formunu doldurarak işini, profesyonel profilini, beklentilerini ve topluluğa katabileceği değeri paylaşır." },
                { step: "02", title: "Profil İncelemesi", desc: "Başvuru; faaliyet alanı, iş profili, profesyonel duruş, iş hacmi, temsil gücü ve karşılıklı değer potansiyeli açısından incelenir." },
                { step: "03", title: "Ön Görüşme", desc: "Uygun görülen başvurular için kısa bir tanışma veya ön görüşme yapılabilir. Bu görüşmede hem Event4Network yapısı aktarılır hem de karşılıklı uygunluk değerlendirilir." },
                { step: "04", title: "Uygunluk Değerlendirmesi", desc: "Başvuran kişinin mevcut yapı, grup dengesi ve topluluğun nitelik standardı ile uyumu değerlendirilir." },
                { step: "05", title: "Kabul ve Başlangıç", desc: "Uygunluk sağlandığında üyelik süreci başlatılır. Üye, toplantı sistemi, birebir görüşmeler ve referans kültürü hakkında bilgilendirilir." },
                { step: "06", title: "Oryantasyon", desc: "Yeni üyenin işini net anlatabilmesi, toplantı kültürünü anlaması ve gruba daha sağlıklı dahil olması için temel yönlendirmeler yapılır." },
                { step: "07", title: "Aktif Katılım", desc: "Üyelik yalnızca bir kayıt değil, aktif katılım gerektiren bir ilişki geliştirme sürecidir. Toplantılar, birebir görüşmeler ve katkı kültürü bu sürecin temel parçalarıdır." }
              ].map((item, idx) => (
                <div key={idx} className={`flex flex-col lg:flex-row items-center gap-8 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  <div className="lg:w-1/2 flex justify-center lg:justify-end px-4">
                    <div className={`text-center lg:text-right ${idx % 2 === 1 ? 'lg:text-left' : ''} max-w-md`}>
                      <span className="text-red-650 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg block w-max mx-auto lg:mx-0 lg:inline-block mb-2">Adım {item.step}</span>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm z-10 border-4 border-white shadow-md">
                    {item.step}
                  </div>
                  <div className="lg:w-1/2 hidden lg:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Neden Katılmalısınız? */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">KAZANIMLAR</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Neden Katılmalısınız?</h2>
            <p className="mt-4 text-gray-650 leading-relaxed text-sm sm:text-base">
              Event4Network’e dahil olmak, yalnızca yeni insanlarla tanışmak anlamına gelmez. E4N, doğru çevrede görünür olma, güvene dayalı ilişkiler kurma ve nitelikli referans kültürü içinde yer alma fırsatı sunar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Doğru Çevrede Yer Almak", desc: "İş dünyasında her bağlantı aynı değerde değildir. Event4Network, nitelikli ve profesyonel bir çevrede düzenli olarak görünür olmanızı sağlar." },
              { title: "Profesyonel Görünürlük Kazanmak", desc: "Düzenli toplantılar ve kendinizi doğru ifade etme fırsatları sayesinde işiniz, uzmanlığınız ve aradığınız bağlantılar daha net anlaşılır." },
              { title: "Güvene Dayalı İlişkiler Kurmak", desc: "Kalıcı iş ilişkileri güvenle başlar. E4N’de güven, düzenli temas ve birebir görüşmelerle zaman içinde gelişir." },
              { title: "Nitelikli Referanslar Geliştirmek", desc: "Doğru kişiler tarafından doğru çevrelere önerilmek, iş geliştirme sürecinde güçlü bir avantaj oluşturabilir." },
              { title: "Stratejik İş Birlikleri Kurmak", desc: "E4N yalnızca müşteri kazanımı için değil, aynı zamanda ortak proje, iş birliği ve stratejik partnerlik fırsatları için de güçlü bir zemin oluşturur." },
              { title: "Kendi Çevrenize Değer Katmak", desc: "Event4Network’te değer yalnızca almakla değil, doğru kişileri doğru fırsatlarla buluşturmakla da oluşur." }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-8 rounded-2xl border border-gray-250 shadow-sm flex items-start gap-4">
                <Check className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Başvuru Üyelik Garantisi Değildir */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200/80 rounded-2xl p-6 sm:p-8 flex items-start gap-4">
            <ShieldAlert className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-950 text-lg mb-2">Önemli Bilgilendirme</h3>
              <p className="text-red-900/90 text-sm leading-relaxed">
                Event4Network’e yapılan başvurular, topluluğun nitelik standardı, uygunluk ve karşılıklı değer ilkesi doğrultusunda değerlendirilir. Başvuru formunu doldurmak üyelik garantisi oluşturmaz. Uygun görülen başvurular için iletişime geçilir ve süreç karşılıklı değerlendirme ile ilerler.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Sayfa Sonu CTA */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Event4Network’e Uygunluğunuzu Değerlendirelim
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            İş profilinizin, profesyonel temsil gücünüzün ve topluluğa katabileceğiniz değerin Event4Network yapısıyla uyumlu olduğunu düşünüyorsanız ön değerlendirme başvurunuzu iletebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-base h-14 px-8 font-bold bg-red-600 hover:bg-red-500 w-full sm:w-auto"
            >
              Değerlendirme Başvurusu Yap
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/e4n-nedir')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 w-full sm:w-auto"
            >
              E4N Nedir?
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
