import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  Handshake,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Percent,
  Compass,
  Repeat,
  Share2
} from 'lucide-react';

export function NetworkingSatisFarkiPage() {
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
            🌾 Avcı vs Çiftçi Zihniyeti · Referans Kültürü
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Networking ile Satış <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              Arasındaki Fark Nedir?
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            Networking bir doğrudan satış taktiği midir? Odadaki kişilere hemen satış yapma baskısı yerine, 34 iş insanının sizin adınıza referans ürettiği sürdürülebilir bir B2B yönlendirme kültürü kurmanın yollarını keşfedin.
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
              onClick={() => navigate('/business-networking')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              Business Networking Nedir?
            </Button>
          </div>
        </div>
      </section>

      {/* Temel Farklar Karşılaştırması */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Doğrudan Satış ile Stratejik Networking Farkı
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              İki yaklaşım arasındaki farkı anlamak, enerjinizi ve zamanınızı nereye yatırmanız gerektiğini belirler:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Doğrudan Satış */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <XCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Doğrudan Satış (Avcı Modeli)</h3>
              </div>
              <ul className="space-y-4 text-slate-600 text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>Karşısındaki kişiyi potansiyel bir alıcı olarak görür.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>Odak noktası anlık ikna, teklif verme ve sözleşme imzalamaktır.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>İletişim işlem (transaction) odaklıdır; iş bitince temas zayıflar.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>Her gün yeni bir müşteri avlamak zorundadır.</span>
                </li>
              </ul>
            </div>

            {/* Business Networking */}
            <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Business Networking (Çiftçi Modeli)</h3>
              </div>
              <ul className="space-y-4 text-slate-600 text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Karşısındaki kişiyi <strong>stratejik bir iş ortağı ve yönlendirme elçisi</strong> görür.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Odak noktası karşılıklı güven ve uzun vadeli referans akışıdır.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>İletişim ilişki (relationship) odaklıdır; çiftçi gibi bağ beslenir.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Ortaklar onun adına dış pazarlardan sürekli müşteri yönlendirir.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Referansın Gücü */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              B2B Dünyasında Referansın (Tavsiyenin) Gücü
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Soğuk aramalar (cold call) veya reklamlarla B2B müşteri kazanmak zorlaşırken; güvenilir bir iş ortağının tavsiyesiyle gelen müşteri büyük avantaj sağlar:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-3xl font-black text-red-600 mb-2 block">Hızlı Karar</span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Güven Bariyeri Aşılmıştır</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Referansla gelen müşteri kim olduğunuzu sorgulamaz; tavsiye eden kişinin itibarı güven bariyerini önceden aşmıştır.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-3xl font-black text-red-600 mb-2 block">Değer Odaklı</span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Fiyat Rekabetine Girmez</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sizi en ucuz seçenek olduğunuz için değil, işini hakkıyla yapacak onaylanmış uzman olduğunuz için tercih eder.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-3xl font-black text-red-600 mb-2 block">%50+</span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Yüksek Kapanış Oranı</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Soğuk satış kanallarında dönüşüm %2-3 iken; nitelikli yönlendirmelerde anlaşmaya varma oranı %50'nin üzerindedir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Referans Kültürü İnşa Etmenin 3 Kuralı */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-red-600 font-bold text-sm tracking-wider uppercase mb-2 block">
              Pratik İlkeler
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Referans Kültürü Nasıl İnşa Edilir? (3 Altın Kural)
            </h2>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">"Önce Değer Veren Kazanır" İlkesi</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  İş yönlendirmesi almak istiyorsanız işe yönlendirme vererek başlayın. Başka bir profesyonelin işine katkı sağlamak derin bir mesleki minnet ve güven oluşturur.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Nasıl Bir Müşteri Aradığınızı Basitleştirin</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  "Bize her türlü firma gelebilir" demek hafızada kalmaz. "Çalışan sayısı 50'yi aşmış ve ihracata odaklanan gıda firmaları" gibi somut profiller verin.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Birebir Görüşmelerle Uzmanlığı Pekiştirin</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Kimse tam olarak ne yaptığını bilmediği birine referans vermez. Düzenli <Link to="/birebir-networking" className="text-red-600 font-semibold underline">birebir görüşmelerle</Link> son projelerinizi ve başarılarınızı paylaşın.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bölümü */}
      <section className="py-20 bg-slate-950 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xl shadow-red-950/20">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
              Satıcı Olmayı Bırakın, Güven İnşa Edin
            </h2>
            <p className="text-base sm:text-lg text-red-100 max-w-2xl mx-auto mb-8 leading-relaxed">
              34 iş insanının sizin adınıza referans ürettiği kurumsal bir ekosisteme katılın.
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
                to="/nasil-calisir"
                className="inline-flex items-center justify-center text-base h-14 px-8 font-semibold text-white border border-white/30 hover:bg-white/10 rounded-lg w-full sm:w-auto transition-colors"
              >
                Nasıl Çalışır?
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
