import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../shared/Button';
import { ArrowLeft } from 'lucide-react';

export function PreInformationForm() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="fixed w-full bg-white/100 border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <Logo className="h-10 w-auto" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Geri Dön
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Ön Bilgilendirme Formu</h1>

                    <div className="prose prose-red max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. SATICI BİLGİLERİ</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="font-semibold">Şirket Ünvanı:</span> Pardus Ticaret Haydar Karakaş (Event4Network)</li>
                                <li><span className="font-semibold">Adres:</span> Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul</li>
                                <li><span className="font-semibold">Telefon:</span> 0536 319 7697</li>
                                <li><span className="font-semibold">E-posta:</span> info@event4network.com</li>
                                <li><span className="font-semibold">Vergi No:</span> 5130029725</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. KONU</h2>
                            <p>
                                İşbu Ön Bilgilendirme Formu'nun ("Form") konusu, ALICI'nın SATICI'ya ait Event4Network platformu ("Platform") üzerinden elektronik ortamda sipariş verdiği, nitelikleri ve satış fiyatı belirtilen üyeliğin/hizmetin ("Hizmet") satışı ve ifası ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca ALICI'nın bilgilendirilmesidir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. SÖZLEŞMEYE KONU HİZMETİN TEMEL NİTELİKLERİ VE FİYATI</h2>
                            <p>
                                Platform üzerinden sunulan hizmet; profesyonel iş ağı toplantılarına katılım (online ve yüz yüze), referans sistemi dahilinde etkileşim kurma imkânı ("Shuffle" grupları vb.) ve eğitim olanaklarından faydalanma hakkını içerir. Alınan spesifik paket, süre ve fiyat bilgisi ödeme sayfasında açıkça listelenmektedir. Belirtilen fiyatlara tüm vergiler dâhildir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. GEÇERLİLİK SÜRESİ</h2>
                            <p>
                                Belirtilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. CAYMA HAKKI VE İADE KOŞULLARI</h2>
                            <p>
                                ALICI, hizmet ifasına başlanmamış olması şartıyla 14 gün içinde cayma hakkını kullanabilir. Ancak, platformun dinamikleri gereği (özellikle "Shuffle" işlemlerinde), ALICI katılacağı/dahil olduğu grup oluşturma (Shuffle) işleminden en geç <strong>2 gün (48 saat) önce</strong> iptal talebinde bulunursa cayma hakkını ve iade politikasını tam olarak işletebilir. Shuffle'a 2 günden az kalması veya Shuffle işleminden sonra iptal talebinde bulunulması halinde, ALICI'nın ilgili gruba sistemsel entegrasyonu tamamlandığı için (hizmet ifasına başlanmış olduğundan) <strong>cayma hakkı kullanılamaz ve hiçbir şekilde ücret iadesi yapılmaz.</strong>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
                            <p>
                                İşbu form ve sözleşmeden doğabilecek uyuşmazlıklarda, her yıl Gümrük ve Ticaret Bakanlığı tarafından ilan edilen değere kadar Tüketici Hakem Heyetleri, söz konusu değerin üzerindeki ihtilaflarda ise Tüketici Mahkemeleri yetkilidir. Şirket alımlarında (tacirler arası) ise İstanbul Çağlayan Mahkemeleri ve İcra Daireleri yetkilidir.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Event 4 Network - Pardus Ticaret Haydar Karakaş. Tüm hakları saklıdır.</p>
                </div>
            </footer>
        </div>
    );
}
