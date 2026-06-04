import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../shared/Button';
import {
  ArrowRight,
  CheckCircle,
  Users,
  Calendar,
  Trophy,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  Handshake,
  Check,
  Compass,
  Target,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';
import processMeeting from '../assets/process-meeting.png';

export function LandingPage() {
  const navigate = useNavigate();

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-red-500 selection:text-white">
      <Helmet>
        <title>Event4Network | Kalıcı İş İlişkileri İçin Seçici Networking</title>
        <meta name="description" content="Event4Network, şirket sahipleri, kurucu ortaklar ve üst düzey yöneticileri güvene dayalı seçici bir iş ağı içinde bir araya getirerek kalıcı iş ilişkileri oluşturur." />
        <meta name="keywords" content="seçici networking, iş ağı, referansla iş geliştirme, şirket sahipleri, kurucu ortaklar, B2B networking, kalıcı iş ilişkileri, event4network" />
        <link rel="canonical" href="https://www.event4network.com/" />
      </Helmet>

      {/* 1. Hero Alanı */}
      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 bg-slate-950 text-white overflow-hidden">
        {/* Ambient Blur Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-red-800/10 blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-left mb-16 lg:mb-0">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm animate-fade-in">
                ⚡ Seçici Profesyonel İş Ağı
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-6">
                Kalıcı iş ilişkileri için <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
                  seçici networking
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl font-light">
                Event4Network, şirket sahipleri, kurucu ortaklar ve üst düzey yöneticileri güvene dayalı bir iş ağı içinde bir araya getirir. Amaç yalnızca tanışmak değil; birbirini gerçekten tanıyan, anlayan ve doğru çevrelere yönlendirebilen bir iş insanları topluluğu oluşturmaktır.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => navigate('/degerlendirme-basvurusu')}
                  className="text-base font-bold px-8 h-14 bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30 transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                >
                  Üyelik Başvurusu Yap
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('nasil-calisir')}
                  className="text-base font-semibold px-8 h-14 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                >
                  E4N Nasıl Çalışır?
                </Button>
              </div>
            </div>

            {/* Right Media */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl blur-2xl opacity-15"></div>
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl backdrop-blur-sm bg-white/5 p-2">
                <img
                  src={processMeeting}
                  alt="Event4Network Seçici İş Ağı Buluşması"
                  className="rounded-2xl object-cover w-full h-[320px] sm:h-[400px] hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Kalıcı İş İlişkileri İçin Seçici Networking (Ana Mesaj) */}
      <section className="py-24 bg-white relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">ÖZ DEĞER ÖNERİSİ</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-8 text-slate-900">
            Güvene Dayalı, Nitelikli ve Sürdürülebilir Bağlantılar
          </h2>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/55 border border-slate-150 rounded-3xl p-8 sm:p-10 shadow-sm text-left max-w-4xl mx-auto">
            <p className="text-xl sm:text-2xl text-slate-950 font-bold leading-relaxed mb-6 border-l-4 border-red-600 pl-6">
              Event4Network, iş insanlarını yalnızca tanıştıran değil; güvene dayalı ilişkiler, nitelikli bağlantılar ve uzun vadeli iş birlikleri geliştirmek için bir araya getiren seçici bir networking platformudur.
            </p>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed pl-6">
              Burada amaç kalabalık bir çevre oluşturmak değil; doğru insanlarla düzenli olarak bir araya gelmek, zaman içinde güven inşa etmek ve bu güven üzerinden daha güçlü iş fırsatları yaratmaktır.
            </p>
          </div>
        </div>
      </section>

      {/* 3. E4N Nedir? */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">NEDİR?</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
                E4N Seçici Networking Platformu
              </h2>
              <div className="space-y-6 text-slate-650 text-base sm:text-lg leading-relaxed">
                <p>
                  Event4Network, iş dünyasında güvene dayalı bağlantılar kurmak isteyen profesyoneller için tasarlanmış seçici bir networking platformudur.
                </p>
                <p>
                  E4N’de üyeler yalnızca toplantılarda kendilerini tanıtmaz; zaman içinde birbirlerinin iş modellerini, hedef müşteri profillerini, güçlü yönlerini ve ulaşmak istedikleri çevreleri daha yakından tanır.
                </p>
                <p className="font-semibold text-slate-900">
                  Bu yapı sayesinde networking, rastgele tanışmalardan çıkar; düzenli temas, güven ve karşılıklı katkı üzerinden iş birliği üreten bir sisteme dönüşür.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Nitelikli Topluluk</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sadece iş profili ve değer katma hedefleri onaylanmış elit yöneticiler yer alır.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-4">
                  <Handshake className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Güven Odaklı Buluşma</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tek seferlik kartvizit alışverişi yerine birbirini gerçekten tanıma esastır.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Stratejik Ağ Paylaşımı</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kişisel veya kurumsal bağlantı listeleri üzerinden bilinçli yönlendirmeler yapılır.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Süreç Verimliliği</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Toplantı ve 1-on-1 sistemleri sayesinde minimum zaman kaybı, maksimum iş hacmi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. E4N Ne Değildir? */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">NET DURUŞUMUZ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              E4N Ne Değildir?
            </h2>
            <p className="text-slate-550 text-base sm:text-lg">
              Event4Network platformunu doğru anlamak için ne olduğu kadar ne olmadığını da bilmek önemlidir.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              {
                title: "Kartvizit Toplama Alanı Değildir",
                desc: "Amacımız sadece kalabalık etkinliklerde yüzlerce kişiyle tanışıp kartvizit biriktirmek değildir. Önemli olan nitelikli ve işlevsel ilişkilerdir."
              },
              {
                title: "Hızlı Satış Ortamı Değildir",
                desc: "Herkesin herkese doğrudan ve ısrarla bir şeyler satmaya çalıştığı, yüzeysel ve rahatsız edici bir ticaret alanı değildir."
              },
              {
                title: "Kalabalık Buluşma Kulübü Değildir",
                desc: "Sadece kahve içip sohbet edilen veya kalabalık partiler düzenlenen, disiplinsiz ve verimsiz bir buluşma organizasyonu değildir."
              },
              {
                title: "Pasif Bekleme Yeri Değildir",
                desc: "Sadece kaydolup kenarda oturarak müşteri gelmesini umacağınız bir yer değildir. Düzenli katılım ve aktif katkı gerektirir."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600 mb-4">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3">{item.title}</h4>
                  <p className="text-xs text-slate-550 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 text-white rounded-3xl p-8 text-center max-w-4xl mx-auto border border-white/10 shadow-lg">
            <p className="text-lg sm:text-xl font-bold leading-relaxed">
              💡 E4N; düzenli katılım, güven, katkı, görünürlük ve doğru yönlendirme kültürü üzerine kurulu seçici bir iş ağıdır.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Neden Seçici Networking? */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.2),transparent_70%)]"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest">KOLTUK KALİTESİ VE SEÇİCİLİK</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-6">
            Neden Seçici Bir Networking Platformu?
          </h2>
          <p className="text-xl text-red-400 font-bold mb-8 max-w-3xl mx-auto">
            Çünkü her tanışma değer üretmez.
          </p>

          <div className="space-y-6 text-slate-300 text-base sm:text-lg leading-relaxed text-left max-w-3xl mx-auto mb-10">
            <p>
              İş dünyasında gerçek fırsatlar, rastgele temaslardan değil; güven duyulan, doğru zamanda doğru kişiye yönlendirilen ilişkilerden doğar.
            </p>
            <p>
              E4N bu yüzden seçici bir yapı üzerine kuruludur. Amaç, mümkün olduğunca çok kişiyi bir araya getirmek değil; birbirine gerçekten değer katabilecek insanları aynı zeminde buluşturmaktır.
            </p>
            <p className="border-l-4 border-red-500 pl-4 font-semibold text-white">
              Seçicilik, E4N’in kalite standardını korur. Böylece üyeler yalnızca yeni insanlarla tanışmaz; güvenilir, nitelikli ve sürdürülebilir bir iş çevresinin parçası olur.
            </p>
          </div>
        </div>
      </section>

      {/* 6. E4N Nasıl Çalışır? */}
      <section id="nasil-calisir" className="py-24 bg-white relative border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">PLATFORM MEKANİĞİ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              E4N Nasıl Çalışır?
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              E4N sistemi, rastgelelikten arındırılmış, belirli kurallar ve aşamalardan oluşan profesyonel bir süreçtir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Başvuru ve Ön Değerlendirme",
                desc: "E4N’e katılım başvuru süreciyle başlar. Adayın iş alanı, profili, beklentileri ve platforma sağlayabileceği katkı değerlendirilir."
              },
              {
                step: "02",
                title: "Tanışma ve Uyum Görüşmesi",
                desc: "Başvuru sonrasında adayla bir ön görüşme yapılır. Bu görüşmede adayın E4N’den ne beklediği, hangi çevrelere ulaşmak istediği ve mevcut üyelerle nasıl bir değer alışverişi oluşturabileceği anlaşılır."
              },
              {
                step: "03",
                title: "Düzenli Toplantı Sistemi",
                desc: "E4N’de üyeler her ay düzenli olarak bir araya gelir. Yeni dönemde yapı şu şekilde ilerler: Ayda 1 online toplantı (verimlilik için) + Ayda 1 yüz yüze toplantı (derin güven ve ilişkiler için)."
              },
              {
                step: "04",
                title: "Birebir Görüşmeler",
                desc: "E4N’de asıl değer sadece toplu toplantılarda değil, üyelerin kendi aralarında yaptığı birebir görüşmelerde ortaya çıkar. Bu görüşmelerde üyeler birbirlerinin işini ve müşteri profilini tanır."
              },
              {
                step: "05",
                title: "Hedef Kişi ve Firma Listeleri",
                desc: "Üyeler ulaşmak istedikleri şirketleri, sektörleri veya karar verici profillerini paylaşabilir. Amaç 'herkesle tanışmak' değil, doğru kişilere doğru şekilde ulaşabilmektir."
              },
              {
                step: "06",
                title: "Güvene Dayalı Yönlendirme",
                desc: "İş yönlendirmesi, güven oluştuktan sonra anlam kazanır. Üyeler birbirini tanıdıkça, doğru fırsatlarda birbirlerini kendi çevrelerine tavsiye ederek referans sistemi oluşturur."
              }
            ].map((item, index) => (
              <div key={index} className="bg-slate-50 border border-slate-200/70 hover:shadow-xl hover:bg-white hover:border-red-100 rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <span className="text-4xl font-black text-slate-250 group-hover:text-red-500/10 transition-colors block mb-4">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-red-650 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. 1 Online + 1 Yüz Yüze Toplantı Modeli */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">YENİ DÖNEM MODELİ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              1 Online + 1 Yüz Yüze Toplantı Modeli
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              E4N’nin yeni dönem toplantı modeli, hem sürdürülebilir zaman verimliliği hem de ilişki derinliği üzerine kuruludur.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Online */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
              <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Online Toplantılar (Her Ay 1 Kez)</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Online toplantılar, üyelerin düzenli olarak temas kurmasını sağlar. Bu toplantılarda üyeler kendilerini, güncel hedeflerini, aradıkları bağlantıları ve sağlayabilecekleri katkıları paylaşır.
              </p>
              <span className="inline-block text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                ⏱️ Zaman Verimliliği & Temas Sürekliliği
              </span>
            </div>

            {/* Fiziksel */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
              <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-xl mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Yüz Yüze Toplantılar (Her Ay 1 Kez)</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Yüz yüze toplantılar, güvenin güçlendiği ana alanlardır. İnsanlar birbirini yalnızca ekran üzerinden değil, gerçek temasla tanıdığında ilişkiler daha doğal ve daha kalıcı hale gelir.
              </p>
              <span className="inline-block text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                🤝 İlişki Derinliği & Stratejik Temas
              </span>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-8 text-center max-w-4xl mx-auto border border-white/10 shadow-lg">
            <h4 className="font-bold text-lg mb-2">Modelin Amacı</h4>
            <p className="text-sm text-slate-350 leading-relaxed">
              Bu sistem sayesinde üyeler hem düzenli olarak görünür kalır hem de yüz yüze temaslarla daha güçlü bağlar kurar. E4N’de networking bir defalık tanışma değil, sürekli gelişen bir ilişki sürecidir.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Kimler İçin Uygun? */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">HEDEF KİTLE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Kimler İçin Uygun?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              E4N platformu, belirli bir profesyonel olgunluğa ve temsil gücüne sahip yöneticiler için verimlidir.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {[
              "Şirket Sahipleri",
              "Kurucu Ortaklar",
              "C-Level Yöneticiler",
              "Üst Düzey Yöneticiler",
              "İş Geliştirme Profesyonelleri",
              "Nitelikli Bağlantı Arayanlar"
            ].map((title, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center hover:border-red-500 hover:bg-white hover:shadow-md transition-all duration-300">
                <span className="font-bold text-sm text-slate-900">{title}</span>
              </div>
            ))}
          </div>

          <div className="bg-red-50 border border-red-200/80 rounded-3xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="w-12 h-12 bg-red-150 text-red-700 flex items-center justify-center rounded-2xl flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-red-950 text-lg mb-2">E4N'e Uygun Profil Felsefesi</h4>
              <p className="text-sm text-red-900/90 leading-relaxed">
                E4N’e katılacak kişiler yalnızca networkten faydalanmak isteyen değil, aynı zamanda networke katkı sağlayabilecek kişiler olmalıdır. Networke sadece almak için değil, katkı sağlamak için dahil olacak kişiler E4N kültürünün merkezindedir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Üyelerin Çevresine Açılan Güven Kapısı */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest">GÜVEN ZİNCİRİ</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-6">
            Üyelerin Çevresine Açılan Güven Kapısı
          </h2>
          <div className="space-y-6 text-slate-350 text-base sm:text-lg leading-relaxed text-left max-w-3xl mx-auto">
            <p>
              E4N’de değer yalnızca toplantıya katılan kişilerle sınırlı değildir. Bir üye sizi tanıdıkça, işinizi anladıkça ve size güven duydukça, kendi çevresinde sizi doğru kişilere önerebilir.
            </p>
            <p className="font-bold text-white border-l-4 border-red-500 pl-4">
              Bu nedenle E4N’de asıl güç yalnızca masadaki kişilerden değil; o kişilerin çevrelerinden, ilişkilerinden ve güven ağlarından doğar.
            </p>
            <p>
              Amaç, herkesin herkese satış yaptığı bir ortam yaratmak değil; doğru kişilerin doğru zamanda birbirine güvenle referans olabileceği bir sistem kurmaktır.
            </p>
          </div>
        </div>
      </section>

      {/* 10. Birebir Görüşmeler */}
      <section className="py-24 bg-white relative border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">DERİNLEMESİNE TANIŞMA</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
                Birebir Görüşmeler (1-on-1)
              </h2>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed mb-6">
                E4N’de asıl değer sadece toplu toplantılarda değil, üyelerin kendi aralarında yaptığı birebir görüşmelerde ortaya çıkar.
              </p>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed">
                Bu görüşmelerde üyeler birbirlerinin işini daha iyi anlar, hedef müşteri profilini öğrenir ve hangi bağlantılarda birbirine yardımcı olabileceğini netleştirir. İlişkiyi hızlandırmanın en samimi ve kurumsal yolu budur.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8">
              <h4 className="font-bold text-slate-900 mb-4">Görüşme Çıktıları Nelerdir?</h4>
              <ul className="space-y-4">
                {[
                  "İş modelinin ve güçlü yönlerin net anlaşılması",
                  "Hedef müşteri portföyü ve kilit kişilerin tespiti",
                  "Güven ilişkisinin bireysel seviyede derinleşmesi",
                  "Sektörel tavsiyeler ve bilgi alışverişi"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Hedef Kişi ve Firma Listeleri */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 bg-white border border-slate-200 rounded-3xl p-8">
              <h4 className="font-bold text-slate-900 mb-4">Stratejik Hedefleme Kapsamı</h4>
              <ul className="space-y-4">
                {[
                  "Ulaşılmak istenen öncelikli şirketlerin listelenmesi",
                  "Sektörel karar verici pozisyonların belirlenmesi",
                  "Diğer üyelerin bu firmalardaki bağlantılarının taranması",
                  "Soğuk arama yerine güvenli referansla giriş yapılması"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <Check className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 lg:order-2 mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">STRATEJİK HEDEFLEME</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
                Hedef Kişi ve Firma Listeleri
              </h2>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed">
                Üyeler ulaşmak istedikleri şirketleri, sektörleri veya karar verici profillerini paylaşabilir.
              </p>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed mt-4">
                Bu sayea networking daha stratejik hale gelir. Amaç “herkesle tanışmak” değil, doğru kişilere doğru şekilde ulaşabilmektir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Lonca Mantığı */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">TAMAMLAYICI BİRLİKTELİK</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
                Lonca Mantığı (Sektörel Kümelenme)
              </h2>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed mb-6">
                E4N içinde zamanla aynı müşteri kitlesine hizmet eden ama birbirinin doğrudan rakibi olmayan uzmanlar arasında daha odaklı iş birlikleri gelişebilir.
              </p>
              <p className="text-slate-650 text-base sm:text-lg leading-relaxed">
                Bu yapı, tamamlayıcı hizmet veren kişilerin birlikte daha güçlü fırsatlar üretmesini sağlar. Rekabet yerine kollektif iş geliştirme gücü esastır.
              </p>
            </div>

            <div className="bg-slate-950 text-white rounded-3xl p-8 border border-white/10 shadow-xl">
              <div className="flex gap-3 items-center mb-4 text-red-400">
                <Sparkles className="w-6 h-6" />
                <span className="font-bold">Örnek Lonca Ekosistemi</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Bir sağlık turizmi markasına hizmet veren; dijital pazarlama uzmanı, CRM danışmanı, çağrı merkezi çözüm sağlayıcısı, teşvik danışmanı ve video prodüksiyon firması aynı hedef kitleye farklı açılardan değer sunabilir.
              </p>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 italic">
                * Bu mantık, E4N içinde doğal olarak oluşabilecek en güçlü iş geliştirme alanlarından biridir.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13. Üyelik Süreci */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">SÜREÇ ADIMLARI</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Üyelik Süreci Nasıl İlerler?
            </h2>
            <p className="text-slate-650 text-sm sm:text-base">
              E4N’e katılım doğrudan bir kayıt sistemiyle değil, başvuru ve değerlendirme süreciyle ilerler.
            </p>
          </div>

          <div className="relative">
            {/* Desktop Line */}
            <div className="hidden lg:block absolute top-12 left-12 right-12 h-0.5 bg-slate-200"></div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Başvuru",
                  desc: "Aday, temel bilgilerini ve E4N’e katılma motivasyonunu paylaşır."
                },
                {
                  step: "02",
                  title: "Ön Görüşme",
                  desc: "Adayın iş profili, beklentileri ve platforma sağlayabileceği katkı değerlendirilir."
                },
                {
                  step: "03",
                  title: "Değerlendirme",
                  desc: "E4N ekibi, adayın platform kültürüne ve mevcut yapıya uygunluğunu değerlendirir."
                },
                {
                  step: "04",
                  title: "Kabul ve Başlangıç",
                  desc: "Uygun bulunan adaylar E4N yapısına dahil edilir ve oryantasyon süreci başlatılır."
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center relative z-10 flex flex-col items-center group">
                  <div className="w-12 h-12 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-sm mb-4 group-hover:bg-red-650 transition-colors">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-550 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 14. Başvuru Çağrısı (Final CTA) */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full bg-red-900/10 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full bg-red-950/5 blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-4">KATILIM SÜRECİ</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            E4N’e Katılmak İçin Başvurun
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Event4Network seçici bir yapıyla çalışır. Başvurular, karşılıklı değer potansiyeli ve platform kültürüne uyum açısından değerlendirilir.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/degerlendirme-basvurusu')}
              className="text-lg h-16 px-12 bg-red-600 hover:bg-red-550 hover:scale-105 transform transition-all shadow-xl font-bold rounded-xl"
            >
              Değerlendirme Başvurusu Yap <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
