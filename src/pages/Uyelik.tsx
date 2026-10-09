import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { membershipJourney } from '../content/membershipJourney';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function Uyelik() {
  const { user } = useAuthStore();
  return <div className="bg-white min-h-screen pt-20">
    <SEO title="Normal Üyelik ve Grup Başvurusu | Event4Network" description="Şirket bilgilerinizle davetiyesiz normal üyelik kaydı, aktif abonelik ve grup başkanıyla görüşme sürecini öğrenin." canonical="https://www.event4network.com/uyelik" />
    <section className="py-20 sm:py-28 bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-red-400 font-semibold mb-4">NORMAL ÜYELİK</p>
        <h1 className="text-4xl sm:text-6xl font-extrabold mb-6">Üye olun, grubunuzu seçin</h1>
        <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-8">Şirket bilgilerinizle hesabınızı açabilirsiniz. Kayıt için davetiye veya üyelik onayı gerekmez. Abonelik ve gruba kabul, kayıt işleminden sonraki ayrı adımlardır.</p>
        <Link to={user ? '/membership' : '/auth/register'} className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-8 py-4 font-bold">{user ? 'Abonelik paketlerini incele' : 'Üye Ol'}<ArrowRight aria-hidden="true" className="w-5 h-5" /></Link>
      </div>
    </section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="text-3xl font-bold mb-8">Kayıttan gruba katılıma</h2>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {membershipJourney.map(step=><li key={step.num} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl"><span className="text-red-600 font-bold">Adım {step.num}</span><h3 className="text-lg font-bold my-3">{step.title}</h3><p className="text-slate-600 leading-relaxed">{step.desc}</p></li>)}
      </ol>
    </section>
    <section className="bg-slate-50 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10">
        <div><h2 className="text-2xl font-bold mb-5">Kayıtta gereken bilgiler</h2><ul className="space-y-3">{['Şirket adı','Türkiye şirketleri için VKN; şahıs işletmeleri için TCKN','Vergi dairesi','Şirket / fatura adresi','İl ve iletişim bilgileri'].map(item=><li key={item} className="flex gap-3"><CheckCircle2 aria-hidden="true" className="w-5 h-5 text-red-600 shrink-0 mt-1" /><span>{item}</span></li>)}</ul><p className="text-sm text-slate-600 mt-5">Bir vergi numarası yalnız bir hesapta kullanılabilir; hesap silinse de tekrar kayda açılamaz. Vergi levhası dosyası yüklemeniz gerekmez.</p></div>
        <div><h2 className="text-2xl font-bold mb-5">Abonelik ve grup kabulü</h2><p className="mb-4">Hesap oluşturmak abonelik satın almak değildir. Güncel paket ve ödeme tutarları giriş yaptıktan sonra Üyelik İşlemleri alanında gösterilir.</p><p className="mb-4">Kapalı grupların kapasitesi başkan hariç 35 üyedir. Aktif aboneliği olan üye grup başvurusu gönderebilir; meslek koltuğu ve kapasite başvuru sürecinde kontrol edilir.</p><p className="text-sm text-slate-600">İl bilginiz kaydedilir. Şehre göre grup ayrımı henüz etkin değildir. Abonelik ödeme ve başvuru durumları panelinizde ayrı takip edilir.</p></div>
      </div>
    </section>
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="text-2xl font-bold mb-5">Loncalar ve diğer topluluklar</h2><p className="mb-4">Açık loncaların topluluk kanalları, normal üyelikten ve kapalı grup kabulünden farklıdır. WhatsApp topluluğuna katılmak E4N aboneliği veya kapalı grup üyeliği kazandırmaz.</p><p className="mb-5">Pardus, E4N normal üyeliğinden ayrı, ücretsiz ve seçici bir yapıdır. Normal üyelik kaydı Pardus kabulü anlamına gelmez.</p><Link to="/topluluklarimiz" className="font-semibold text-red-600 hover:underline">Topluluk kanallarını incele</Link>
    </section>
  </div>;
}
