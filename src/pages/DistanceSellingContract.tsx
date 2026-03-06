import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../shared/Button';
import { ArrowLeft } from 'lucide-react';

export function DistanceSellingContract() {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Mesafeli Satış Sözleşmesi</h1>

                    <div className="prose prose-red max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">MADDE 1 – TARAFLAR</h2>
                            <p className="font-semibold mb-2">1.1. SATICI BİLGİLERİ:</p>
                            <ul className="list-disc pl-5 space-y-1 mb-4">
                                <li>Ünvanı: Pardus Ticaret Haydar Karakaş (Event4Network)</li>
                                <li>Adresi: Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul</li>
                                <li>Telefon: 0536 319 7697</li>
                                <li>Vergi No: 5130029725</li>
                                <li>E-posta: info@event4network.com</li>
                            </ul>

                            <p className="font-semibold mb-2">1.2. ALICI BİLGİLERİ:</p>
                            <p>Platform üzerinden üyelik/hizmet satın alan gerçek veya tüzel kişi ("Alıcı") olarak anılacaktır.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">MADDE 2 – KONU</h2>
                            <p>
                                İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait Event4Network platformu üzerinden elektronik ortamda siparişini (satın almasını) yaptığı üyelik ve networking hizmetlerinin satışı ve ifası ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">MADDE 3 – SÖZLEŞMEYE KONU HİZMET, FİYAT VE ÖDEME BİLGİLERİ</h2>
                            <p>
                                3.1. Hizmetin türü, süresi, satış bedeli, ödeme şekli, platform üzerindeki tanıtım ve satın alma sayfalarında belirtildiği gibidir ve Alıcı tarafından onaylanan koşullarda geçerlidir.
                            </p>
                            <p>
                                3.2. Fiyatlara tüm vergiler (KDV vb.) dahildir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">MADDE 4 – CAYMA HAKKI VE İADE KOŞULLARI</h2>
                            <p>
                                4.1. ALICI, dijital içerik ve anında ifa edilen hizmetler söz konusu olduğunda (networking platformuna erişim, üyelik profilinin aktifleştirilmesi vb.), Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesinin (ğ) bendi uyarınca "elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler" kapsamında cayma hakkını kullanamaz.
                            </p>
                            <p>
                                4.2. Hizmetin ifasına başlanmamış olması şartıyla, Alıcı satın alma işleminden itibaren 14 (on dört) gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Ancak üyelik aktifleştirilip platform kullanılmaya başlandığı anda cayma hakkı sona erer.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">MADDE 5 – GENEL HÜKÜMLER</h2>
                            <ul className="list-decimal pl-5 space-y-2">
                                <li>
                                    ALICI, platform üzerinden sözleşme konusu hizmetin temel nitelikleri, satış fiyatı, ödeme şekli ve diğer ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli onayı verdiğini kabul, beyan ve taahhüt eder.
                                </li>
                                <li>
                                    SATICI, sözleşme konusu hizmetin platform kurallarına (Community Rules vb.) uygun ve taahhüt edilen niteliklerde ifa edilmesinden sorumludur.
                                </li>
                                <li>
                                    Event4Network bir networking, tanışma ve iş ilişkisi geliştirme platformudur. SATICI, ALICI'nın platform üzerinden maddi bir kazanç elde edeceğini kesin olarak garanti etmez. Platform sadece uygun ortamı ve yapıyı sunmakla yükümlüdür.
                                </li>
                                <li>
                                    ALICI'nın platform kurallarına veya genel ahlak kuralarına aykırı davranışları nedeniyle üyeliğine son verilmesi durumunda ücret iadesi yapılmaz.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">MADDE 6 – UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
                            <p>
                                İşbu sözleşmenin uygulanmasında, Gümrük ve Ticaret Bakanlığınca ilan edilen değere kadar Alıcının yerleşim yerindeki veya hizmetin satın alındığı yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir. Şirket alımlarında (Tüzel kişiler ve tacirler arası) ise İstanbul Çağlayan Mahkemeleri ve İcra Daireleri yetkilidir.
                            </p>
                        </section>

                        <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500">
                            <p>Bu sözleşme, alıcı tarafından elektronik ortamda onaylandığı tarihte yürürlüğe girer.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer (Simplified) */}
            <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Event 4 Network - Pardus Ticaret Haydar Karakaş. Tüm hakları saklıdır.</p>
                </div>
            </footer>
        </div>
    );
}
