import React from 'react';
import { Helmet } from 'react-helmet-async';

export function PrivacyPolicy() {
  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <Helmet>
        <title>Gizlilik Politikası | Event4Network</title>
        <meta name="description" content="Event4Network Gizlilik ve KVKK Politikası. Verilerinizin nasıl işlendiği ve saklandığına dair tüm detaylar." />
        <link rel="canonical" href="https://www.event4network.com/gizlilik-politikasi" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-12 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 border-b border-gray-150 pb-4">
              Gizlilik Politikası
            </h1>
            <p className="text-gray-500 text-sm">
              Son Güncelleme: 1 Ocak 2026
            </p>
          </div>

          <div className="space-y-6 text-gray-650 leading-relaxed text-sm">
            <p>
              Pardus Ticaret Haydar Karakaş (bundan böyle "Şirket" veya "Event4Network" olarak anılacaktır) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve ilgili mevzuat uyarınca, üyelerimizin ve Platformumuzu (www.event4network.com) ziyaret eden kişilerin ("Veri Sahibi") kişisel verilerinin hukuka uygun olarak işlenmesine ve korunmasına büyük önem vermekteyiz.
            </p>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">1. Hangi Verileri Topluyoruz?</h2>
              <p>
                Platformumuzu kullanımınız ve değerlendirme başvurusu esnasında aşağıdaki verileri işleyebiliriz:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li><strong>Kimlik Bilgileri:</strong> Ad, soyad.</li>
                <li><strong>İletişim Bilgileri:</strong> Telefon numarası, e-posta adresi, fatura ve ikametgah adresi.</li>
                <li><strong>Mesleki ve Ticari Bilgiler:</strong> Şirket unvanı, vergi no, faaliyet alanı, web sitesi veya LinkedIn profili.</li>
                <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, giriş çıkış logları, sistem şifreleri.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">2. Veri İşleme Amaçları ve Hukuki Sebepleri</h2>
              <p>Toplanan kişisel verileriniz aşağıdaki amaçlar ve hukuki sebepler dahilinde işlenmektedir:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Üyelik sözleşmesinin kurulması ve platform hizmetlerinden (toplantılar, "Shuffle" vb.) faydalanmanız (Sözleşmenin İfası),</li>
                <li>Site üzerindeki kimliğinizin doğrulanması, ödemelerin gerçekleştirilmesi, faturanın düzenlenmesi (Hukuki Yükümlülük),</li>
                <li>Platform içerisindeki diğer üyelere referans olarak işletmenizin/şirketinizin önerilmesi (Meşru Menfaat ve Açık Rıza),</li>
                <li>Sistemin iyileştirilmesi, analizlerin yapılması, güvenlik ihlallerinin önlenmesi (Meşru Menfaat).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">3. Çerezler (Cookies)</h2>
              <p>
                Platformumuzda kullanıcı deneyimini iyileştirmek, site performansını optimize etmek ve güvenlik analizleri gerçekleştirmek amacıyla çerezler kullanılmaktadır. Tarayıcı ayarlarınız üzerinden çerez kullanımını engelleyebilir veya kısıtlayabilirsiniz; ancak bu durumda sitenin bazı işlevleri kısıtlanabilir.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">4. Verilerin Güvenliği</h2>
              <p>
                Kişisel verilerinizin yetkisiz kişilerce erişilmesini, değiştirilmesini veya ifşa edilmesini önlemek amacıyla sektör standartlarında fiziksel, idari ve teknolojik güvenlik önlemleri almaktayız. Veritabanımız güvenli sunucularda saklanmakta ve şifreleme yöntemleriyle korunmaktadır.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">5. Veri Sorumlusu İletişim Bilgileri</h2>
              <p>
                Gizlilik politikamız veya kişisel verileriniz hakkında herhangi bir sorunuz olması durumunda bizimle aşağıdaki kanallardan irtibata geçebilirsiniz:
              </p>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-150 mt-4 space-y-2">
                <p><strong>Şirket Ünvanı:</strong> Pardus Ticaret Haydar Karakaş</p>
                <p><strong>Adres:</strong> Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul</p>
                <p><strong>E-posta:</strong> info@event4network.com</p>
                <p><strong>Telefon:</strong> 0536 319 7697</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
