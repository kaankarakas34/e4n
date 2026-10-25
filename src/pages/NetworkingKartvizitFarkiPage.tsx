import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  CreditCard,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mail,
  Repeat
} from 'lucide-react';

export function NetworkingKartvizitFarkiPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            📇 İlişki Kültürü · Nicelik vs Nitelik
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Networking Neden Kartvizit <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              Toplamak Değildir?
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            Bir etkinlikten onlarca kartvizitle dönmek başarı göstergesi değildir. Birkaç hafta sonra unutulan numaralar yerine, güvene ve karşılıklı iş yönlendirmesine dayalı stratejik bağlar kurmanın metodolojisini keşfedin.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/uyelik"
              className="inline-flex items-center justify-center text-base h-14 px-8 font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg w-full sm:w-auto shadow-lg shadow-red-900/30 transition-colors"
            >
              E4N Üyelik Modeli
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/birebir-networking')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Birebir Görüşme İlkeleri
            </Button>
          </div>
        </div>
      </section>

      {/* Neden İşe Yaramaz? */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Kartvizit Saçma Refleksi Neden Sonuç Üretmez?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Etkinliklerde elindeki kartları broşür gibi dağıtan yaklaşımların başarısızlığa mahkum olmasının 3 temel sebebi:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-4">
                <XCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Güven Olmadan Paylaşılan Bilgi Değersizdir</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Karşınızdaki kişi uzmanlığınıza veya iş ahlakınıza dair izlenim edinmemişse, kartvizitinizdeki logo ve telefon numarası çekmecede unutulmaya mahkumdur.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-4">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">İhtiyaç ve Rıza Yoktur</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Karşı tarafın neye ihtiyaç duyduğunu dinlemeden uzatılan bir kartvizit, istenmeyen bir reklamdan farksızdır. İletişim bilgisi karşılıklı merak doğduğunda anlam kazanır.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Takip (Follow-up) Zemini Eksiktir</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Konuşulmuş ortak bir zemin yoksa ertesi gün gönderilen "hizmetlerimizi sunmak isteriz" mesajı soğuk bir satış baskısı (pitch slap) olarak tepki çeker.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Matematik ve Karşılaştırma */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden mb-16">
            <h2 className="text-2xl sm:text-3xl font-black mb-4">
              Nicelik Tuzağı: 50 Kartvizit vs. 3 Stratejik Ortak
            </h2>
            <blockquote className="text-lg sm:text-xl text-slate-300 italic border-l-4 border-red-500 pl-4 my-6">
              "Bir etkinlikte 50 kişiyle 1'er dakika ayaküstü konuşup kart dağıtmak yerine; iş modeli ve değerleri sizinle örtüşen 3 kişiyle 15'er dakika derinlemesine sohbet etmek, katbekat daha yüksek ticari geri dönüş sağlar."
            </blockquote>
            <p className="text-slate-400 text-sm leading-relaxed">
              Bu 3 kişiyle kurulan kaliteli bağ, etkinlik sonrasında <Link to="/birebir-networking" className="text-red-400 underline">birebir görüşmelere</Link> dönüşür; birbirinizin işini tanıma fırsatı sunar ve uzun vadeli bir referans kanalının temelini atar.
            </p>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
              Kartvizit Doğru Zamanda Nasıl Paylaşılmalı?
            </h3>
            <p className="text-slate-600 text-sm sm:text-base">
              Kartvizit bir "tanışma aracı" değil, tamamlanmış bir sohbetin "kapanış köprüsü" olmalıdır:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="w-8 h-8 rounded-full bg-red-600 text-white font-bold inline-flex items-center justify-center text-sm mb-3">1</span>
              <h4 className="font-bold text-slate-900 mb-1">Önce Dinleyin</h4>
              <p className="text-xs text-slate-600">Karşı tarafın sektörünü ve mevcut zorluklarını anlayın.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="w-8 h-8 rounded-full bg-red-600 text-white font-bold inline-flex items-center justify-center text-sm mb-3">2</span>
              <h4 className="font-bold text-slate-900 mb-1">Değer Katın</h4>
              <p className="text-xs text-slate-600">Deneyiminiz veya faydalı bir kaynakla çözüm önerin.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="w-8 h-8 rounded-full bg-red-600 text-white font-bold inline-flex items-center justify-center text-sm mb-3">3</span>
              <h4 className="font-bold text-slate-900 mb-1">İzin İsteyin</h4>
              <p className="text-xs text-slate-600">"Bahsettiğim raporu iletmek için kartınızı alabilir miyim?" deyin.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="w-8 h-8 rounded-full bg-red-600 text-white font-bold inline-flex items-center justify-center text-sm mb-3">4</span>
              <h4 className="font-bold text-slate-900 mb-1">Talep Üzerine Verin</h4>
              <p className="text-xs text-slate-600">Kendi kartınızı sadece karşı taraf talep ettiğinde takdim edin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* E4N Yaklaşımı */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4">
              E4N: Kartvizit Kalabalığı Yerine Güven Ekosistemi
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Event4Network üyeleri birbirine kartvizit dağıtmaz; her hafta birbirinin uzmanlığını öğrenir ve dışarıdaki gerçek müşterileri birbirine yönlendirir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-red-600 mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Rekabet Sıfırlayan Meslek Tekilliği</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Her grupta tek bir meslek dalı yer alır. Grupta tek kurumsal avukat veya tek yazılımcı siz olursunuz. Çıkar çatışması olmadan doğrudan tavsiye alırsınız (<Link to="/kapali-gruplar" className="text-red-600 underline">Kapalı Gruplar</Link>).
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <Repeat className="h-8 w-8 text-red-600 mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Periyodik 4 Aylık Rotasyon</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Kartvizit biriktirmek yerine, 4 ayda bir rotasyonla yeni sektörlerden seçilmiş karar vericilerle masaya oturursunuz (<Link to="/nasil-calisir" className="text-red-600 underline">Nasıl Çalışır?</Link>).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bölümü */}
      <section className="py-20 bg-slate-950 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xl shadow-red-950/20">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
              Kartvizitlerinizi Çekmeceden Çıkarın
            </h2>
            <p className="text-base sm:text-lg text-red-100 max-w-2xl mx-auto mb-8 leading-relaxed">
              Kartvizit dağıtma telaşını bırakın. Güven temelli, kurumsal ve ölçülebilir bir yönlendirme ağına katılın.
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
                to="/business-networking"
                className="inline-flex items-center justify-center text-base h-14 px-8 font-semibold text-white border border-white/30 hover:bg-white/10 rounded-lg w-full sm:w-auto transition-colors"
              >
                Business Networking Rehberi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
