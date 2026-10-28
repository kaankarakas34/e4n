import React from 'react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '../shared/Button';
import { cn } from '../lib/utils';
import { NetworkingGuideLinks } from '../components/NetworkingGuideLinks';
import {
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Repeat
} from 'lucide-react';

export function BusinessNetworkingPage() {

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            🧭 Temel Rehber · Business Networking
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Business Networking Nedir? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              Güvene Dayalı Profesyonel İş Ağı
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            Business networking, profesyonellerin birbirinin işini tanıdığı, bilgi paylaştığı ve karşılıklı güven geliştirdiği ilişki kurma sürecidir. Tanışmalar; düzenli iletişim, birlikte çalışma ve uygun olduğunda izinli iş yönlendirmeleriyle derinleşir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/uyelik"
              className="inline-flex items-center justify-center text-base h-14 px-8 font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg w-full sm:w-auto shadow-lg shadow-red-900/30 transition-colors"
            >
              E4N Üyelik Modeli
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/birebir-networking"
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto')}
            >
              Birebir Görüşme Yaklaşımı
            </Link>
          </div>
        </div>
      </section>

      {/* 1. Karşılaştırma Bölümü */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Yüzeysel Tanışma ile Stratejik Networking Farkı
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              İş dünyasında zamanınızı ve enerjinizi tüketen yaklaşım ile size sürekli değer katan profesyonel model arasındaki temel çizgiler:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Yanlış Yaklaşım */}
            <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <XCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Yüzeysel Tanışma (İşlem Odaklı)</h3>
              </div>
              <ul className="space-y-4 text-slate-600 text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>"Bu kişiye hemen ne satabilirim?" sorusuyla başlar.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Onlarca kişiye aceleyle kartvizit veya broşür dağıtılır.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Yalnızca acil müşteri veya iş arandığında temas kurulur.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>İletişim tek taraflıdır ve anlık çıkar hedefler.</span>
                </li>
              </ul>
            </div>

            {/* Doğru Yaklaşım */}
            <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Business Networking (İlişki Odaklı)</h3>
              </div>
              <ul className="space-y-4 text-slate-600 text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>"Nasıl değer katabilir ve güven bağı kurabiliriz?" sorusuna odaklanır.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Derinlemesine <Link to="/birebir-networking" className="text-red-600 font-semibold hover:underline">birebir görüşmelerle</Link> uzmanlık tanınır.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Çiftçi zihniyetiyle ilişki sürekli beslenir ve referans üretilir.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Karşılıklı güvene dayalı stratejik müttefiklik inşa edilir.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4 Adımlı Döngü */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-red-600 font-bold text-sm tracking-wider uppercase mb-2 block">
              B2B Uygulama Metodolojisi
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Güvene Dayalı İş Ağı Nasıl İnşa Edilir?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Profesyonel bir iş ağı şansa bırakılamaz. B2B dünyasında ölçülebilir sonuçlar almak için 4 adımlı bir döngü izlenmelidir:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Değer Önerinizi ve Hedef Kitlenizi Netleştirin</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Kime hizmet verdiğinizi, hangi kritik iş problemini çözdüğünüzü ve ne tür müşteriler aradığınızı karmaşık terminolojiden arındırarak tek bir açık cümleyle anlatabilmelisiniz.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Doğru Çevre ve Ekosistemi Seçin</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Rastgele kalabalıklarda zaman kaybetmek yerine; toplantı disiplini olan, katılımcı profili doğrulanmış ve etik kurallarla yönetilen seçilmiş iş çevrelerinde yer alın.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Birebir Görüşmelerle İlişkiyi Derinleştirin</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Grup toplantılarında başlayan tanışıklığı, süresini birlikte belirlediğiniz birebir görüşmelere taşıyın. Karşı tarafın iş zorluklarını dinleyin ve kimlerle çalışabileceğini keşfedin.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Önce Değer Vererek Başlayın</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                İş ortaklarınızın ihtiyaç duyduğu bir kaynağı paylaşın. Uygun bir tanıştırma fırsatı varsa iki tarafın da iznini alın; katkıyı karşılığında iş beklenen bir alışverişe çevirmeyin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. E4N Çözümü ve Model */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-red-400 font-bold text-sm tracking-wider uppercase mb-2 block">
              Kurumsal Altyapı
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
              E4N Ekosistemi Satış Baskısını Nasıl Çözer?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Geleneksel ortamlarda üyelerin birbirine satış yapmaya çalışması ortamı yorar. Event4Network bu engeli yapısal kurallarla aşar:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
              <Users className="h-10 w-10 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">35 Kişilik Kapalı Gruplar</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Her grupta birbirini yakından tanıyan, düzenli toplantılarla güven bağı kurmuş odaklı bir iş insanı topluluğu yer alır.
              </p>
              <Link to="/kapali-gruplar" className="text-red-400 font-semibold text-sm hover:underline inline-flex items-center">
                Grupları İnceleyin <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
              <ShieldCheck className="h-10 w-10 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Meslek Tekilliği</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Her üye tek iş koluyla temsil edilir; grupta aynı meslekten bir kişi bulunur. Bu kural grup içi meslek çakışmasını azaltmayı amaçlar; iş yönlendirmesi üye ilişkileri ve uygun ihtiyaçlarla gelişir.
              </p>
              <Link to="/nasil-calisir" className="text-red-400 font-semibold text-sm hover:underline inline-flex items-center">
                Nasıl Çalışır? <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
              <Repeat className="h-10 w-10 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Dört Aylık Shuffle</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Dört ay boyunca grup üyelerini ve işlerini tanırsınız. Grup değiştiğinde eski ilişkileri sürdürürken yeni insanları, meslekleri ve konuları ağınıza katarsınız.
              </p>
              <Link to="/shuffle" className="text-red-400 font-semibold text-sm hover:underline inline-flex items-center">
                Shuffle Modelimiz <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NetworkingGuideLinks currentPath="/business-networking" />

      {/* 4. CTA Bölümü */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xl shadow-red-950/20">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
              İş Ağınızı Güven Temelli Büyütmeye Hazır mısınız?
            </h2>
            <p className="text-base sm:text-lg text-red-100 max-w-2xl mx-auto mb-8 leading-relaxed">
              35 kişilik kapalı grup modelini ve üyelik koşullarını inceleyin. İlişkilerin gelişmesi düzenli katılım, birebir görüşmeler ve üyelerin karşılıklı katkısıyla mümkündür.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/uyelik"
                className="inline-flex items-center justify-center text-base h-14 px-8 font-bold text-red-600 bg-white hover:bg-red-50 rounded-lg w-full sm:w-auto shadow-lg transition-colors"
              >
                E4N Üyelik Başvurusu
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/etkinlikler"
                className="inline-flex items-center justify-center text-base h-14 px-8 font-semibold text-white border border-white/30 hover:bg-white/10 rounded-lg w-full sm:w-auto transition-colors"
              >
                Açık Etkinliklerimizi Keşfedin
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
