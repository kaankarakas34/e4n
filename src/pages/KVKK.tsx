import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export function KVKK() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'aydinlatma' | 'acik-riza'>('aydinlatma');

  useEffect(() => {
    if (location.hash === '#acik-riza') {
      setActiveTab('acik-riza');
    } else {
      setActiveTab('aydinlatma');
    }
  }, [location.hash]);

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <Helmet>
        <title>{activeTab === 'aydinlatma' ? 'KVKK Aydınlatma Metni' : 'KVKK Açık Rıza Metni'} | Event4Network</title>
        <meta name="description" content="Event4Network Kişisel Verilerin Korunması Kanunu (KVKK) aydınlatma ve açık rıza metinleri." />
        <link rel="canonical" href="https://www.event4network.com/kvkk" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          
          {/* Tab Header */}
          <div className="flex border-b border-gray-200 bg-gray-50/50">
            <button
              onClick={() => {
                setActiveTab('aydinlatma');
                window.location.hash = '';
              }}
              className={`flex-1 text-center py-5 font-extrabold text-sm border-b-2 transition-all outline-none ${
                activeTab === 'aydinlatma'
                  ? 'border-red-650 text-red-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              KVKK Aydınlatma Metni
            </button>
            <button
              onClick={() => {
                setActiveTab('acik-riza');
                window.location.hash = 'acik-riza';
              }}
              className={`flex-1 text-center py-5 font-extrabold text-sm border-b-2 transition-all outline-none ${
                activeTab === 'acik-riza'
                  ? 'border-red-650 text-red-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              KVKK Açık Rıza Metni
            </button>
          </div>

          <div className="p-8 sm:p-12 space-y-8">
            {activeTab === 'aydinlatma' ? (
              /* ================== AYDINLATMA METNİ ================== */
              <div className="space-y-6 text-gray-655 leading-relaxed text-sm animate-in fade-in duration-300">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 border-b border-gray-150 pb-4">
                    E4N ÜYE VE KATILIMCI KİŞİSEL VERİLERİNİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ
                  </h1>
                  <p className="text-gray-400 text-xs">
                    Sürüm: 1.0 • Güncelleme Tarihi: 1 Ocak 2026
                  </p>
                </div>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">1. Amaç ve kapsam</h2>
                  <p>
                    İşbu Aydınlatma Metni; E4N üyeliğine başvuran, E4N üyesi olan, E4N tarafından düzenlenen toplantı, eğitim, söyleşi, networking buluşması ve diğer etkinliklere katılan kişilerin kişisel verilerinin işlenmesi hakkında bilgilendirilmesi amacıyla hazırlanmıştır.
                  </p>
                  <p>
                    Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”), ilgili ikincil düzenlemeler ve Kişisel Verileri Koruma Kurulu kararlarına uygun olarak aşağıda açıklanan kapsamda işlenmektedir.
                  </p>
                  <p>
                    Bu metin yalnızca bilgilendirme amacı taşımaktadır. Aydınlatma Metni’nin sunulması herhangi bir açık rıza veya onay talebi anlamına gelmez. Açık rızaya dayanan veri işleme faaliyetleri için tarafınıza ayrıca <strong>E4N Kişisel Verilerin İşlenmesine İlişkin Açık Rıza Metni</strong> sunulur.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">2. Veri sorumlusunun kimliği</h2>
                  <p>
                    KVKK kapsamında kişisel verilerinizin işlenmesinden sorumlu veri sorumlusu:
                  </p>
                  <ul className="list-none pl-0 space-y-1.5 text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200/50">
                    <li><strong>Ticaret Unvanı:</strong> Pardus Ticaret Haydar Karakaş (E4N - Event4Network)</li>
                    <li><strong>Vergi Numarası / Dairesi:</strong> 5130029725 / Kağıthane</li>
                    <li><strong>MERSİS Numarası:</strong> [●]</li>
                    <li><strong>Merkez Adresi:</strong> Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul</li>
                    <li><strong>İnternet Sitesi:</strong> <a href="https://www.event4network.com" target="_blank" rel="noopener noreferrer" className="text-red-650 hover:underline">www.event4network.com</a></li>
                    <li><strong>E-posta Adresi:</strong> <a href="mailto:info@event4network.com" className="text-red-650 hover:underline">info@event4network.com</a></li>
                    <li><strong>KEP Adresi:</strong> [●]</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">3. İşlenen kişisel veriler</h2>
                  <p>E4N ile ilişkinizin niteliğine göre aşağıdaki kişisel verileriniz işlenebilir:</p>
                  
                  <div className="space-y-3 pl-4">
                    <h3 className="font-bold text-gray-900">Kimlik bilgileri</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Ad ve soyad</li>
                      <li>Doğum tarihi veya yaş bilgisi</li>
                      <li>İmza</li>
                      <li>Üyelik, başvuru veya katılımcı numarası</li>
                      <li>Mevzuat veya ödeme belgesi düzenlenmesi için zorunlu olması hâlinde T.C. kimlik numarası ve vergi kimlik numarası</li>
                    </ul>

                    <h3 className="font-bold text-gray-900">İletişim bilgileri</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Cep telefonu numarası</li>
                      <li>E-posta adresi</li>
                      <li>Adres</li>
                      <li>Şehir ve ülke bilgisi</li>
                      <li>WhatsApp kullanıcı ve profil bilgileri</li>
                    </ul>

                    <h3 className="font-bold text-gray-900">Mesleki bilgiler</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Çalışılan şirket veya kurum</li>
                      <li>Görev ve unvan</li>
                      <li>Meslek</li>
                      <li>Sektör</li>
                      <li>Uzmanlık alanları</li>
                      <li>İş deneyimi</li>
                      <li>Mesleki ilgi alanları</li>
                      <li>İnternet sitesi</li>
                      <li>LinkedIn ve benzeri mesleki sosyal medya hesapları</li>
                    </ul>

                    <h3 className="font-bold text-gray-900">Üyelik ve etkinlik bilgileri</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Üyelik başvuru bilgileri</li>
                      <li>Üyelik başlangıç ve sona erme tarihleri</li>
                      <li>Üyelik türü ve durumu</li>
                      <li>Katılım sağlanan toplantı, eğitim ve etkinlikler</li>
                      <li>Etkinlik kayıt ve katılım bilgileri</li>
                      <li>Davet, rezervasyon ve yoklama bilgileri</li>
                      <li>Tercih edilen etkinlik ve çalışma grupları</li>
                      <li>Anket, değerlendirme ve geri bildirimler</li>
                      <li>Üyelik kapsamında iletilen talep ve şikâyetler</li>
                    </ul>

                    <h3 className="font-bold text-gray-900">Finansal bilgiler</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Üyelik veya etkinlik ücretleri</li>
                      <li>Ödeme ve tahsilat bilgileri</li>
                      <li>Fatura bilgileri</li>
                      <li>Banka hesap bilgileri</li>
                      <li>Ödeme tarihi ve ödeme durumu</li>
                    </ul>
                    <p className="text-xs text-gray-400 italic">
                      * Kredi veya banka kartı bilgileriniz doğrudan E4N tarafından saklanmamaktadır; ödeme altyapısı kullanılması hâlinde bu bilgiler yetkili ödeme hizmeti sağlayıcısı (örn. PayTR) tarafından güvenli şekilde işlenir.
                    </p>

                    <h3 className="font-bold text-gray-900">Görsel ve işitsel bilgiler</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Profil fotoğrafı</li>
                      <li>Etkinliklerde çekilen fotoğraf ve videolar</li>
                      <li>Ses kayıtları</li>
                      <li>Röportaj, konuşma ve sunum kayıtları</li>
                      <li>Çevrim içi toplantı görüntüleri</li>
                    </ul>

                    <h3 className="font-bold text-gray-900">İletişim ve işlem güvenliği bilgileri</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>E-posta ve yazışma kayıtları</li>
                      <li>WhatsApp grup ve mesaj kayıtları</li>
                      <li>Talep ve destek kayıtları</li>
                      <li>İnternet sitesi erişim ve işlem kayıtları</li>
                      <li>IP adresi</li>
                      <li>Tarih ve saat bilgisi</li>
                      <li>Kullanıcı ve oturum bilgileri</li>
                      <li>Cihaz ve tarayıcı bilgileri</li>
                      <li>Güvenlik kayıtları</li>
                    </ul>

                    <h3 className="font-bold text-gray-900">Hukuki işlem bilgileri</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Resmî kurum ve kuruluşlardan gelen yazılar</li>
                      <li>Hukuki başvuru, talep ve uyuşmazlık bilgileri</li>
                      <li>İhtarname ve dava dosyası bilgileri</li>
                      <li>KVKK kapsamındaki başvuru kayıtları</li>
                    </ul>

                    <h3 className="font-bold text-gray-900">Açık rıza ve tercih kayıtları</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verilen veya geri alınan açık rızalar</li>
                      <li>Üye rehberi paylaşım tercihleri</li>
                      <li>WhatsApp grubuna katılım tercihi</li>
                      <li>Fotoğraf ve video kullanım tercihleri</li>
                      <li>İletişim bilgilerinin paylaşılmasına ilişkin tercihleri</li>
                      <li>Rıza ve tercihlerin tarih, saat ve alınma yöntemi</li>
                    </ul>
                  </div>
                  
                  <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100 mt-4">
                    <strong>ÖNEMLİ NOT:</strong> E4N, faaliyetleri için gerekli olmayan özel nitelikli kişisel verilerin iletilmesini talep etmez. E4N’ye gönderilen mesaj, belge veya grup paylaşımlarında sağlık, siyasi düşünce, din, ceza mahkûmiyeti, biyometrik ver ibareleri içeren özel nitelikli kişisel verilerin paylaşılmaması gerekir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">4. Kişisel verilerin işlenme amaçları ve hukuki sebepleri</h2>
                  <p>Kişisel verileriniz, aşağıdaki amaç ve hukuki sebeplerle işlenmektedir:</p>

                  <div className="overflow-x-auto border border-gray-150 rounded-2xl">
                    <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-950 uppercase tracking-wider">İşleme faaliyeti ve amacı</th>
                          <th className="px-4 py-3 font-bold text-gray-950 uppercase tracking-wider">İşlenen başlıca veriler</th>
                          <th className="px-4 py-3 font-bold text-gray-950 uppercase tracking-wider">Hukuki sebep</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-gray-700">
                        <tr>
                          <td className="px-4 py-3 font-medium">Üyelik başvurularının alınması ve değerlendirilmesi</td>
                          <td className="px-4 py-3">Kimlik, iletişim, mesleki ve başvuru bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-c: Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması; m.5/2-f: E4N’nin meşru menfaati</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Üyelik ilişkisinin kurulması ve yürütülmesi</td>
                          <td className="px-4 py-3">Kimlik, iletişim, mesleki, üyelik ve finans bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-c: Sözleşmenin kurulması veya ifası</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Üyelik ödemelerinin alınması, fatura ve muhasebe işlemlerinin yürütülmesi</td>
                          <td className="px-4 py-3">Kimlik, iletişim ve finans bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-a: Kanunlarda açıkça öngörülme; m.5/2-ç: Hukuki yükümlülüğün yerine getirilmesi</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Toplantı ve etkinlik kayıtlarının alınması ve organizasyonun yürütülmesi</td>
                          <td className="px-4 py-3">Kimlik, iletişim, mesleki, katılım and ödeme bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-c: Sözleşmenin kurulması veya ifası; m.5/2-f: Meşru menfaat</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Etkinlik bağlantısı, tarih, saat, konum ve program değişikliklerinin bildirilmesi</td>
                          <td className="px-4 py-3">Ad-soyad, telefon, e-posta ve katılım bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-c: Sözleşmenin ifası; m.5/2-f: Meşru menfaat</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Üye ve katılımcı talep, soru, şikâyet ve geri bildirimlerinin cevaplandırılması</td>
                          <td className="px-4 py-3">Kimlik, iletişim, talep ve yazışma bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-c: Sözleşmenin ifası; m.5/2-f: Meşru menfaat</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">E4N faaliyetlerinin planlanması, geliştirilmesi ve raporlanması</td>
                          <td className="px-4 py-3">Üyelik, etkinlik, katılım, anket ve geri bildirim bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-f: Temel hak ve özgürlüklere zarar vermemek kaydıyla meşru menfaat</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Bilgi güvenliği, erişim kontrolü ve kötüye kullanımın önlenmesi</td>
                          <td className="px-4 py-3">İşlem güvenliği, iletişim ve erişim kayıtları</td>
                          <td className="px-4 py-3">KVKK m.5/2-ç: Hukuki yükümlülük; m.5/2-f: Meşru menfaat</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Hukuki taleplerin takibi ve uyuşmazlıkların yürütülmesi</td>
                          <td className="px-4 py-3">Kimlik, iletişim, üyelik, finans ve hukuki işlem bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-e: Bir hakkın tesisi, kullanılması veya korunması</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Saklama ve arşiv yükümlülüklerinin yerine getirilmesi</td>
                          <td className="px-4 py-3">İşlemle bağlantılı kimlik, iletişim, finans ve üyelik bilgileri</td>
                          <td className="px-4 py-3">KVKK m.5/2-a ve m.5/2-ç</td>
                        </tr>
                        <tr className="bg-red-55/10">
                          <td className="px-4 py-3 font-semibold text-red-700">Üye profilinin oluşturulması ve diğer üyelerle paylaşılması</td>
                          <td className="px-4 py-3 text-red-700">Kimlik, profil fotoğrafı ve mesleki bilgiler</td>
                          <td className="px-4 py-3 text-red-700">KVKK m.5/1: İlgili kişinin açık rızası</td>
                        </tr>
                        <tr className="bg-red-55/10">
                          <td className="px-4 py-3 font-semibold text-red-700">Telefon veya e-posta bilgisinin diğer üyelerle paylaşılması</td>
                          <td className="px-4 py-3 text-red-700">İletişim bilgileri</td>
                          <td className="px-4 py-3 text-red-700">KVKK m.5/1: İlgili kişinin açık rızası</td>
                        </tr>
                        <tr className="bg-red-55/10">
                          <td className="px-4 py-3 font-semibold text-red-700">WhatsApp grubuna ekleme ve telefon numarasının diğer katılımcılara görünmesi</td>
                          <td className="px-4 py-3 text-red-700">Ad-soyad, telefon numarası, WhatsApp profil ve grup bilgileri</td>
                          <td className="px-4 py-3 text-red-700">KVKK m.5/1: İlgili kişinin açık rızası</td>
                        </tr>
                        <tr className="bg-red-55/10">
                          <td className="px-4 py-3 font-semibold text-red-700">Etkinliklerde fotoğraf, video veya ses kaydı alınması ve yayımlanması</td>
                          <td className="px-4 py-3 text-red-700">Görsel ve işitsel kayıtlar, ad-soyad, şirket ve unvan</td>
                          <td className="px-4 py-3 text-red-700">KVKK m.5/1: İlgili kişinin açık rızası</td>
                        </tr>
                        <tr className="bg-red-55/10">
                          <td className="px-4 py-3 font-semibold text-red-700">İlgi alanlarına göre etkinlik veya üye eşleştirmesi yapılması</td>
                          <td className="px-4 py-3 text-red-700">Mesleki bilgiler, etkinlik tercihleri ve katılım geçmişi</td>
                          <td className="px-4 py-3 text-red-700">KVKK m.5/1: İlgili kişinin açık rızası</td>
                        </tr>
                        <tr className="bg-red-55/10">
                          <td className="px-4 py-3 font-semibold text-red-700">İletişim bilgilerinin sponsor veya iş ortaklarına aktarılması</td>
                          <td className="px-4 py-3 text-red-700">Ad-soyad, iletişim ve mesleki bilgiler</td>
                          <td className="px-4 py-3 text-red-700">KVKK m.5/1: İlgili kişinin açık rızası</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">5. WhatsApp kullanımına ilişkin bilgilendirme</h2>
                  <p>E4N, WhatsApp’ı aşağıdaki amaçlarla kullanabilir:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Üyelik süreçlerine ilişkin bilgilendirme yapılması,</li>
                    <li>Toplantı ve etkinlik duyurularının paylaşılması,</li>
                    <li>Etkinlik tarihi, saati, konumu veya bağlantısındaki değişikliklerin bildirilmesi,</li>
                    <li>Katılım teyitlerinin alınması,</li>
                    <li>Üyelerden gelen soruların cevaplandırılması,</li>
                    <li>Üyeler arasındaki networking iletişiminin yürütülmesi.</li>
                  </ul>
                  <p>
                    E4N WhatsApp grubu veya topluluğu üzerinden reklam, pazarlama, kampanya, promosyon, sponsor tanıtımı veya üçüncü kişilere ait ürün ve hizmet tanıtımı gönderilmez.
                  </p>
                  <p>
                    WhatsApp grubuna katılan kişinin cep telefonu numarası, WhatsApp kullanıcı adı, profil fotoğrafı, “hakkımda” bilgisi ve grup içinde paylaştığı içerikler diğer grup katılımcıları tarafından görülebilir. Bu nedenle ilgili kişi, açık rızası alınmadan WhatsApp grubuna eklenmez.
                  </p>
                  <p className="font-bold text-gray-950 bg-gray-50 border border-gray-150 p-4 rounded-xl">
                    WhatsApp grubuna katılan üyelerin, grupta gördükleri telefon numaralarını ve diğer kişisel verileri; izinsiz reklam veya pazarlama yapmak, grup amacı dışında mesaj göndermek, başka kişi veya kuruluşlarla paylaşmak veya farklı veri tabanlarına kaydetmek amacıyla kullanmaları yasaktır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">6. Kişisel verilerin toplanma yöntemleri</h2>
                  <p>
                    Kişisel verileriniz tamamen veya kısmen otomatik yollarla ya da veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yöntemlerle aşağıdaki kanallardan toplanabilir:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Basılı veya elektronik üyelik başvuru formları,</li>
                    <li>E4N internet sitesi ve üyelik platformu,</li>
                    <li>E-posta, telefon ve WhatsApp iletişimi,</li>
                    <li>Çevrim içi toplantı ve etkinlik sistemleri,</li>
                    <li>Etkinlik kayıt ve katılım formları, anketler ve geri bildirim formları,</li>
                    <li>Sözleşme, fatura ve ödeme belgeleri, yüz yüze görüşmeler,</li>
                    <li>Etkinliklerde gerçekleştirilen fotoğraf, video ve ses çekimleri,</li>
                    <li>E4N’ye doğrudan iletilen kartvizit ve mesleki profil bilgileri.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">7. Kişisel verilerin yurt içinde aktarılması</h2>
                  <p>Kişisel verileriniz, aktarım için gerekli hukuki şartların bulunması ve amaçla sınırlı olması kaydıyla aşağıdaki alıcı gruplarına aktarılabilir:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>E4N çalışanları ve yöneticileri:</strong> Üyelik ve etkinlik süreçlerinin yürütülmesi.</li>
                    <li><strong>Mali müşavir, muhasebe ve denetim hizmeti sağlayıcıları:</strong> Muhasebe, fatura, vergi ve denetim işlemleri.</li>
                    <li><strong>Avukatlar ve hukuki danışmanlar:</strong> Hukuki danışmanlık ve hakların korunması.</li>
                    <li><strong>Bankalar ve ödeme hizmeti sağlayıcıları:</strong> Ücret tahsilatı, ödeme ve iade işlemleri.</li>
                    <li><strong>Bilişim, barındırma, güvenlik ve teknik altyapı sağlayıcıları:</strong> Sistemlerin güvenli işletilmesi.</li>
                    <li><strong>Etkinlik mekânı ve organizasyon sağlayıcıları:</strong> Rezervasyon ve organizasyon süreçleri.</li>
                    <li><strong>Yetkili kamu kurum ve kuruluşları:</strong> Yasal yükümlülüklerin yerine getirilmesi.</li>
                    <li><strong>Diğer E4N üyeleri:</strong> Rıza verdiğiniz profil, iletişim ve WhatsApp grubu işlemleri kapsamında.</li>
                    <li><strong>Sponsorlar ve iş ortakları:</strong> Yalnızca ilgili kişinin ayrıca açık rıza verdiği hâllerde.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">8. Kişisel verilerin yurt dışına aktarılması</h2>
                  <p>
                    E4N’nin kullandığı WhatsApp, çevrim içi toplantı, e-posta, bulut depolama, sosyal medya veya bilişim hizmetlerinin altyapısının yurt dışında bulunması nedeniyle kişisel veriler yurt dışında bulunan hizmet sağlayıcılar tarafından işlenebilir.
                  </p>
                  <p>
                    E4N, düzenli ve sürekli yurt dışı aktarımlarını yalnızca genel nitelikli bir açık rıza beyanına dayandırmaz; somut hizmet sağlayıcı ve aktarım ilişkisi için KVKK’nın 9’uncu maddesinde düzenlenen uygun aktarım mekanizmasını (standart sözleşme vb.) ayrıca belirler.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">9. Kişisel verilerin saklanması ve imhası</h2>
                  <p>Kişisel verileriniz, ilgili işleme amacının gerektirdiği süre boyunca ve uygulanabilir mevzuatta öngörülen zamanaşımı, saklama ve denetim süreleri dikkate alınarak muhafaza edilir.</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Üyelik ve sözleşme kayıtları:</strong> Üyelik ilişkisinin devamı ve sonrasında 10 yıllık zamanaşımı süresi.</li>
                    <li><strong>Fatura ve muhasebe kayıtları:</strong> Vergi mevzuatı uyarınca 5 veya 10 yıl.</li>
                    <li><strong>Üye profilinde yayınlanan veriler:</strong> Üyelik devam ettiği sürece veya rıza geri çekilene kadar.</li>
                    <li><strong>WhatsApp grup bilgileri:</strong> Grup üyeliği veya rıza sona erene kadar.</li>
                    <li><strong>Fotoğraf ve video kayıtları:</strong> Rıza geri çekilene veya kullanım amacı sona erene kadar.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">10. Veri güvenliği</h2>
                  <p>
                    E4N, kişisel verilerin hukuka aykırı işlenmesini veya verilere yetkisiz erişilmesini önlemek amacıyla erişim sınırlandırmaları, veri aktarım güvenliği, yetki kontrolleri gibi uygun teknik ve idari tedbirleri almaktadır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">11. İlgili kişinin hakları</h2>
                  <p>
                    KVKK’nın 11’inci maddesi kapsamında; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amaç doğrultusunda kullanılıp kullanılmadığını öğrenme, yurt içinde/dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış verileri düzeltme, silme ve yok edilmesini isteme haklarına sahipsiniz.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">12. Başvuru yöntemi</h2>
                  <p>
                    KVKK kapsamındaki taleplerinizi, kimliğinizi ve talebinizi belirten bir başvuruyla aşağıdaki yöntemlerden biri üzerinden E4N’ye iletebilirsiniz:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Yazılı başvuru:</strong> Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul</li>
                    <li><strong>E-posta:</strong> <a href="mailto:info@event4network.com" className="text-red-650 hover:underline">info@event4network.com</a></li>
                    <li><strong>İnternet adresi:</strong> <a href="https://www.event4network.com/kvkk" className="text-red-650 hover:underline">www.event4network.com/kvkk</a></li>
                  </ul>
                  <p className="mt-2 text-xs">
                    Başvurular en geç 30 gün içinde sonuçlandırılır.
                  </p>
                </section>
              </div>
            ) : (
              /* ================== AÇIK RIZA METNİ ================== */
              <div className="space-y-6 text-gray-655 leading-relaxed text-sm animate-in fade-in duration-300">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 border-b border-gray-150 pb-4">
                    E4N KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AÇIK RIZA METNİ
                  </h1>
                  <p className="text-gray-400 text-xs">
                    Sürüm: 1.0 • Yayın Tarihi: 1 Ocak 2026
                  </p>
                </div>

                <section className="space-y-3 text-gray-700 bg-gray-50 p-6 rounded-2xl border border-gray-200/50">
                  <h2 className="text-base font-bold text-gray-900 mb-2">1. Veri sorumlusu</h2>
                  <p className="text-xs leading-relaxed">
                    6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu:<br />
                    <strong>Ticaret Unvanı:</strong> Pardus Ticaret Haydar Karakaş<br />
                    <strong>Vergi Numarası:</strong> 5130029725<br />
                    <strong>Adres:</strong> Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul<br />
                    <strong>E-posta:</strong> info@event4network.com<br />
                    <strong>KEP Adresi:</strong> [●]<br /><br />
                    Bundan böyle “E4N” olarak anılacaktır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">2. Açık rızanın kapsamı</h2>
                  <p>
                    E4N tarafından tarafıma ayrıca sunulan <strong>E4N Üye ve Katılımcı Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni</strong> aracılığıyla; veri sorumlusunun kimliği, işlenen kişisel veri kategorileri, kişisel verilerin işlenme amaçları, kişisel verilerin toplanma yöntemleri ve hukuki sebepleri, kişisel verilerin aktarılabileceği kişi ve kuruluşlar, kişisel verilerin saklama süreleri, KVKK’nın 11’inci maddesi kapsamındaki haklarım, başvuru ve iletişim yöntemleri hakkında bilgilendirildim.
                  </p>
                  <p className="font-semibold text-gray-800">
                    Aşağıdaki kişisel veri işleme faaliyetlerinin E4N üyeliğinin ve temel E4N hizmetlerinin zorunlu bir koşulu olmadığını; her bir faaliyet hakkında ayrı ayrı tercih yapabileceğimi; açık rıza vermememin veya verdiğim açık rızayı daha sonra geri çekmemin temel üyelik hizmetlerinden yararlanmamı engellemeyeceğini biliyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">3. Üye profilinin oluşturulması ve diğer üyelerle paylaşılması</h2>
                  <p>
                    Ad-soyad, profil fotoğrafı, görev/unvan, şirket/kurum, sektör, uzmanlık alanı, iş deneyimi, mesleki ilgi alanları, şehir, internet sitesi ve sosyal medya/LinkedIn profil bilgilerimin; E4N üye profilimin oluşturulması, E4N üye rehberinde yayımlanması, diğer E4N üyelerinin beni tanıyabilmesi, üyeler arasında iletişim, iş birliği ve networking imkânlarının oluşturulması, çalışma grubu, toplantı ve etkinlik eşleştirmelerinin gerçekleştirilmesi amaçlarıyla işlenmesine ve erişimi E4N üyeleriyle sınırlı olacak şekilde diğer E4N üyelerine açıklanmasına rıza gösteriyorum.
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    * Cep telefonu numaram ve kişisel e-posta adresim, ayrıca açıkça izin vermediğim sürece üye rehberinde yayımlanmayacak veya diğer üyelerle paylaşılmayacaktır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">4. İletişim bilgilerinin diğer E4N üyeleriyle paylaşılması</h2>
                  <p>
                    Cep telefonu numaram ve/veya e-posta adresimin; E4N üyelerinin benimle doğrudan iletişim kurabilmesi, profesyonel bağlantıların geliştirilmesi, iş birliği ve networking faaliyetlerinin yürütülmesi amaçlarıyla diğer E4N üyelerine aktarılmasına rıza gösteriyorum.
                  </p>
                  <p className="text-xs text-gray-500">
                    * Bu bilgileri edinen üyelerin verileri kendi amaçları doğrultusunda kullanmasından doğabilecek işlemler bakımından ilgili üyenin ayrıca sorumluluk taşıyabileceği konusunda bilgilendirildim.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">5. WhatsApp grubu veya topluluğuna katılım</h2>
                  <p>
                    E4N tarafından oluşturulan WhatsApp grubu veya topluluğuna katılmam hâlinde; cep telefonu numaramın, WhatsApp kullanıcı adımın, WhatsApp profil fotoğrafımın, WhatsApp “hakkımda” bilgimin, grup içerisinde paylaşacağım mesaj, belge, fotoğraf, video, ses kaydı ve diğer içeriklerin, mesaj gönderme tarihi ve saati gibi iletişim kayıtlarımın grupta bulunan diğer E4N üyeleri, katılımcılar ve grup yöneticileri tarafından görülebileceği konusunda bilgilendirildim.
                  </p>
                  <p>
                    Belirtilen kişisel verilerimin; WhatsApp grubuna veya topluluğuna katılımımın sağlanması, E4N toplantı ve etkinlik duyurularının paylaşılması, program, tarih, saat ve konum değişikliklerinin bildirilmesi, üyeler arasındaki iletişim ve networking faaliyetlerinin yürütülmesi, E4N faaliyetlerine ilişkin bilgilendirmelerin yapılması amaçlarıyla işlenmesine ve WhatsApp grubunda bulunan diğer katılımcılara açıklanmasına rıza gösteriyorum.
                  </p>
                  <p className="text-xs text-gray-500">
                    * WhatsApp grubuna katılımın isteğe bağlı olduğunu; açık rıza vermemem veya daha sonra gruptan ayrılmam nedeniyle E4N üyeliğimin sona erdirilmeyeceğini ve zorunlu üyelik bildirimlerine alternatif bir iletişim yöntemiyle ulaşabileceğimi biliyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">6. Fotoğraf, video ve ses kayıtlarının alınması</h2>
                  <p>
                    Katıldığım E4N toplantıları, eğitimleri, söyleşileri, yemekleri, networking buluşmaları, ödül programları ve diğer etkinlikler sırasında; fotoğrafımın çekilmesine, görüntü ve video kaydımın alınmasına, sesimin kaydedilmesine, ad-soyad, görev, unvan ve şirket bilgimin bu kayıtlarla ilişkilendirilmesine, etkinliğin kayıt altına alınması ve E4N kurumsal arşivinin oluşturulması amaçlarıyla rıza gösteriyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">7. Fotoğraf, video ve ses kayıtlarının yayımlanması</h2>
                  <p>
                    Katıldığım E4N etkinliklerinde çekilen fotoğraf, görüntü, video ve ses kayıtlarım ile bu kayıtlarla bağlantılı ad-soyad, şirket ve unvan bilgilerimin; E4N faaliyetlerinin tanıtılması, etkinliklerin kamuoyuna duyurulması, E4N kurumsal iletişim çalışmalarının yürütülmesi, geçmiş etkinliklere ilişkin içerik ve arşiv oluşturulması amaçlarıyla <strong>E4N internet sitesi ve üyelik platformları, E4N sosyal medya hesapları, E4N sunumları, basılı ve dijital tanıtım materyalleri ile basın, medya ve etkinlik iş ortaklarıyla</strong> yayımlanmak üzere paylaşılmasına rıza gösteriyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">8. İlgi alanlarına göre içerik ve etkinlik önerilmesi</h2>
                  <p>
                    Üyelik bilgilerim, görev ve unvanım, sektörüm, uzmanlık alanlarım, katıldığım E4N etkinlikleri, etkinlik tercihlerim, anket cevaplarım, talep ve geri bildirimlerim ile E4N içerikleriyle olan etkileşim bilgilerimin; ilgi alanlarımın ve mesleki tercihlerimin belirlenmesi, bana uygun etkinlik, toplantı, eğitim ve çalışma gruplarının önerilmesi, üye deneyiminin kişiselleştirilmesi, üyelerin ilgi alanlarına göre eşleştirilmesi amaçlarıyla analiz edilmesine ve profil oluşturma faaliyetlerinde kullanılmasına rıza gösteriyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">9. E4N sponsor ve iş ortaklarına ait içeriklerin gönderilmesi</h2>
                  <p>
                    İletişim bilgilerimin ve iletişim tercihlerimin; E4N sponsorlarının ve iş ortaklarının etkinlik, ürün, hizmet, kampanya, avantaj ve fırsatlarına ilişkin içeriklerin E4N tarafından tarafıma ulaştırılması, üyeler için sunulan sponsorluk avantajlarının duyurulması amaçlarıyla E4N tarafından işlenmesine rıza gösteriyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">10. İletişim bilgilerinin sponsor ve iş ortaklarına aktarılması</h2>
                  <p>
                    Ad-soyad, cep telefonu numarası, e-posta adresi, şirket, görev/unvan, sektör ve mesleki ilgi alanı bilgilerimin; benimle doğrudan iletişim kurulması, talep ettiğim ürün veya hizmetlere ilişkin bilgi verilmesi, iş birliği ve networking imkânlarının değerlendirilmesi amaçlarıyla, tarafıma önceden bildirilecek sponsorların/iş ortaklarının isimleri veya açıkça tanımlanmış alıcı grubu ile paylaşılmasına rıza gösteriyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">11. Etkinlik katılımcı listelerinde yer alma</h2>
                  <p>
                    Ad-soyad, şirket, görev/unvan, sektör ve profil fotoğrafı bilgilerimin; etkinlik öncesinde katılımcıların birbirlerini tanıyabilmesi, etkinlik sırasında networking faaliyetlerinin kolaylaştırılması, etkinliğe özel katılımcı listesinin hazırlanması amaçlarıyla ilgili etkinliğe kayıt yaptıran diğer katılımcılarla paylaşılmasına rıza gösteriyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">12. Referans, görüş ve başarı hikâyelerinin yayımlanması</h2>
                  <p>
                    E4N hakkında kendi isteğimle paylaşacağım görüş, değerlendirme, referans, başarı hikâyesi veya röportaj içeriğinin; ad-soyad, görev/unvan, şirket ve fotoğraf bilgilerimle birlikte E4N’nin internet sitesinde, sosyal medya hesaplarında, sunumlarında ve tanıtım materyallerinde yayımlanmasına rıza gösteriyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">13. Yurt dışı bağlantılı platformlar</h2>
                  <p>
                    WhatsApp, Meta, sosyal medya, çevrim içi toplantı, bulut depolama, e-posta ve benzeri yurt dışı bağlantılı hizmetlerin kullanılması hâlinde kişisel verilerimin yurt dışında bulunan hizmet sağlayıcılar tarafından işlenebileceği ve E4N'nin uygun veri aktarım mekanizmalarını (standart sözleşmeler vb.) işleteceği konusunda rıza gösteriyorum.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">14. Açık rızanın geri alınması</h2>
                  <p>
                    Yukarıda verdiğim açık rızalardan herhangi birini, herhangi bir gerekçe göstermek zorunda olmaksızın her zaman geri alabileceğimi biliyorum.
                  </p>
                  <p>
                    Açık rızamı geri almak veya KVKK kapsamındaki haklarımı kullanmak için tebligata esas <strong>info@event4network.com</strong> mail adresi veya <strong>Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul</strong> merkez adresi üzerinden E4N'ye her zaman başvurabileceğimi biliyorum.
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
