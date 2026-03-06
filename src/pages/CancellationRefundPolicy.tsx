import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../shared/Button';
import { ArrowLeft } from 'lucide-react';

export function CancellationRefundPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="fixed w-full bg-white/100 border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <Logo className="h-10 w-auto" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" /> Geri Dön
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">İptal ve İade Koşulları</h1>

                    <div className="prose prose-red max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. GENEL BİLGİLER</h2>
                            <p>
                                İşbu İptal ve İade Koşulları, Event4Network tarafından sunulan üyelik, grup katılımı (Shuffle) ve diğer networking hizmetlerinden faydalanan tüm kullanıcılar için geçerlidir. Kullanıcılar (Üyeler), platform üzerinden hizmet satın alarak veya platformdaki gruplara dahil olarak bu şartları kabul etmiş sayılırlar.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. İPTAL VE İADE ŞARTLARI (SHUFFLE DÖNEMİ İÇİN)</h2>
                            <p>
                                Event4Network platformunda grupların yeniden karma hale getirildiği (Shuffle) dönemler, üyelik sürecinin yapı taşıdır ve grupların yapısında köklü değişiklikler içerir.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>
                                    <span className="font-semibold text-red-600">Shuffle'dan 2 Gün Öncesine Kadar:</span> Üyeler, katılacakları veya dahil oldukları yeni Shuffle (Grup oluşturma) işleminden <strong>en geç 2 gün (48 saat) önce</strong> üyelik iptali ve iade talebinde bulunabilirler. Bu süre zarfında yapılan başvurular değerlendirmeye alınarak, ilgili hizmet bedelinin iadesi gerçekleştirilir.
                                </li>
                                <li>
                                    <span className="font-semibold text-red-600">Shuffle'a 2 Gün'den Az Kala veya Sonrası:</span> Söz konusu Shuffle (Grup dağılımı/karma) işlemine 2 günden az bir süre kaldığında veya Shuffle işlemi gerçekleştikten sonra iptal talebinde bulunulması halinde; ilgili kullanıcı <strong>sisteme dahil olmuş (gruplara yerleşmiş) kabul edilir</strong> ve hizmet tamamen ifa edilmeye (kullanımınıza sunulmaya) başlanmış sayılacağı için <strong>hiçbir şekilde ücret iadesi yapılmaz.</strong>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. İADE SÜRECİNİN İŞLEYİŞİ</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    İade talepleri, üyeler tarafından yazılı olarak (örneğin kayıtlı e-posta adresinden gönderilecek bir e-posta yoluyla) Şirket'e bildirilmelidir.
                                </li>
                                <li>
                                    İptal ve iadenin onaylanması durumunda, ödeme yapılan kredi kartına veya banka hesabına iade işlemi, ilgili bankanın veya ödeme kuruluşunun prosedürlerine bağlı olarak genellikle 7-14 iş günü içerisinde gerçekleştirilir.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. TOPLANTI VE ETKİNLİK İPTALLERİ</h2>
                            <p>
                                Belirli bir etkinliğe, eğitime veya ekstra bir organizasyona yapılan katılım ödemeleri için farklı bir iptal/iade prosedürü uygulanabilir. İlgili organizasyonun bilet veya duyuru sayfasında aksi belirtilmedikçe, bu tür etkinlikler için iptal talepleri, etkinliğin başlama saatinden en geç 48 saat öncesine kadar şirketimize ulaştırılmalıdır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. PLATFORM KURALLARININ İHLALİ</h2>
                            <p>
                                Event4Network'ün topluluk kurallarını ihlal ettiği, etik dışı davranışlarda bulunduğu, diğer üyeleri rahatsız edici faaliyetler sergilediği veya bir grupta kabul görmeyen eylemlere giriştiği tespit edilen üyelerin kayıtları tek taraflı olarak feshedilebilir. Bu gibi, Disiplin ve Kurallar bağlamında gerçekleşen üyelik iptallerinde <strong>kesinlikle ücret iadesi yapılmaz.</strong>
                            </p>
                        </section>

                        <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500">
                            <p>Bu politika, yayınlandığı tarihte yürürlüğe girer ve Event4Network dilediği zaman bu politikada tek taraflı değişiklik yapma hakkını saklı tutar.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer (Simplified) */}
            <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Event 4 Network. Tüm hakları saklıdır.</p>
                </div>
            </footer>
        </div>
    );
}
