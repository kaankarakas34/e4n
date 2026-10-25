import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import {
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Target,
  Clock,
  Sparkles,
  Repeat
} from 'lucide-react';

export function ProfesyonelIsAgiNasilKurulurPage() {
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
            📐 B2B Sosyal Sermaye · 6 Adımlı Plan
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Profesyonel İş Ağı Nasıl Kurulur? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              B2B İçin 6 Adımlı Rehber
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            Gerçek bir profesyonel iş ağı, rastgele toplanmış telefon numaralarından oluşmaz. Tıpkı bir şirketin operasyonel altyapısı gibi planlanan, beslenen ve yönetilen bir sosyal sermayedir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/uyelik"
              className="inline-flex items-center justify-center text-base h-14 px-8 font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg w-full sm:w-auto shadow-lg shadow-red-900/30 transition-colors"
            >
              E4N Üyelik Başvurusu
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/is-cevresi-nasil-genisletilir')}
              className="text-base h-14 px-8 font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto"
            >
              İş Çevresi Yol Haritası
            </Button>
          </div>
        </div>
      </section>

      {/* 6 Adımlı Metodoloji */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Stratejik Bir İş Ağı İnşa Etmenin 6 Adımı
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              İlişkilerinizi şansa bırakmadan, ölçülebilir ticari değere ve karşılıklı referansa dönüştüren adımlar:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Adım 1: A-B-C Çemberi */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Çekirdek Çemberinizi (A-B-C) Belirleyin</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Herkesle aynı yoğunlukta iletişim kurulamaz. Kontaklarınızı 3 seviyeye ayırın:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li><strong className="text-slate-900">• A Çemberi (10-15 Kişi):</strong> İş modelinizi bilen ve sizi doğrudan tavsiye eden stratejik müttefikler.</li>
                <li><strong className="text-slate-900">• B Çemberi (30-50 Kişi):</strong> Zaman zaman ortak proje yürüttüğünüz tamamlayıcı ortaklar.</li>
                <li><strong className="text-slate-900">• C Çemberi:</strong> Etkinliklerde tanışılan geniş ekosistem.</li>
              </ul>
            </div>

            {/* Adım 2: Konumlandırma */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Profesyonel Konumlandırmanızı Netleştirin</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                "Her türlü danışmanlık hizmeti sunuyoruz" demek, kimsenin aklında kalmamak demektir. Kendinizi tek bir net formülle anlatın:
              </p>
              <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 text-xs sm:text-sm text-slate-700 italic">
                "Biz, [Hedef Grup]'un yaşadığı [Kritik Problem]'i çözerek [Somut Değer]'e ulaşmalarını sağlıyoruz."
              </div>
            </div>

            {/* Adım 3: Nurturing Rutini */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">İletişimi Besleme (Nurturing) Rutini Oluşturun</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                İlişkileri kendi haline bırakmayın. Düzenli bir takip disiplini oluşturun:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li><strong className="text-slate-900">• Haftalık 3 Temas:</strong> Çekirdek çemberden 3 kişiye yararlı içerik veya tebrik notu iletin.</li>
                <li><strong className="text-slate-900">• Ayda 2 Birebir:</strong> 45 dakikalık odaklı <Link to="/birebir-networking" className="text-red-600 underline">birebir görüşmeler</Link> organize edin.</li>
                <li><strong className="text-slate-900">• Tavsiye Takibi:</strong> Size iş yönlendiren kişiye sürecin sonucunu bildirin ve teşekkür edin.</li>
              </ul>
            </div>

            {/* Adım 4: Power Team */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Tamamlayıcı Meslek Gruplarıyla (Power Team) Bütünleşin</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Tek başınıza müşteri aramaktansa, aynı müşteri kitlesine hizmet veren farklı uzmanlarla güç birliği yapın.
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                Kurumsal bir şirkete giren bir siber güvenlik uzmanı; arkasından bulut bilişimciyi ve KVKK danışmanını da o masaya taşıyarak ortak bir yönlendirme döngüsü yaratır.
              </p>
            </div>

            {/* Adım 5: İtibarı Korumak */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                5
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">İtibarınızı ve Verilen Sözleri Koruyun</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Bir iş ortağınız sizi müşterisine tavsiye ettiğinde kendi itibarını da size emanet eder.
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                <li>• Yönlendirilen müşteriye en üst düzey titizlikle hizmet verin.</li>
                <li>• Uzmanlığınız dışındaki talepleri dürüstçe açıklayın.</li>
                <li>• Finansal ve operasyonel taahhütlerinize eksiksiz uyun.</li>
              </ul>
            </div>

            {/* Adım 6: Disiplinli Kulüp Modeli */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                6
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Yapılandırılmış Kulüp Modelini Tercih Edin</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Bireysel çabalar bir noktaya kadar işe yarar; ancak kurumsal bir zemin gereklidir.
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                <li>• <strong className="text-slate-900">35 Kişilik Kadro:</strong> Birbirini tanıyan, düzenli toplantılarla bağ kuran topluluk.</li>
                <li>• <strong className="text-slate-900">Meslek Tekilliği:</strong> Sektör çakışması ve rekabet olmayan <Link to="/kapali-gruplar" className="text-red-600 underline">kapalı gruplar</Link>.</li>
                <li>• <strong className="text-slate-900">4 Aylık Rotasyon:</strong> Ağın durağanlaşmasını önleyen <Link to="/shuffle" className="text-red-600 underline">shuffle sistemi</Link>.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 30 Günlük Uygulama Planı */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-red-600 font-bold text-sm tracking-wider uppercase mb-2 block">
              Hemen Başlayın
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              İlk 30 Günlük Hızlı Eylem Planı
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 font-bold text-xs shrink-0">
                1-10. Gün
              </div>
              <p className="text-slate-700 text-sm sm:text-base">
                Mevcut rehberinizdeki tüm kontakları A, B ve C çemberlerine ayırın; eksik sektörleri not alın.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 font-bold text-xs shrink-0">
                11-20. Gün
              </div>
              <p className="text-slate-700 text-sm sm:text-base">
                A çemberindeki 5 kilit profesyonelle birebir kahve veya online görüşme organize ederek hedef müşteri profillerinizi paylaşın.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 font-bold text-xs shrink-0">
                21-30. Gün
              </div>
              <p className="text-slate-700 text-sm sm:text-base">
                Disiplinli ve kurallı bir iş kulübü modeli araştırın ve <Link to="/uyelik" className="text-red-600 font-semibold underline">E4N Üyelik Başvurusu</Link> ile seçilmiş karar vericilerle masaya oturun.
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
              Sosyal Sermayenizi Güçlendirin
            </h2>
            <p className="text-base sm:text-lg text-red-100 max-w-2xl mx-auto mb-8 leading-relaxed">
              İş dünyasında tesadüflere yer yok. Güvenilir, kurumsal ve sonuç üreten bir iş ağına bugün katılın.
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
