import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../shared/Button';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy() {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Gizlilik ve KVKK Politikası</h1>

                    <div className="prose prose-red max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. GİRİŞ VE VERİ SORUMLUSU</h2>
                            <p>
                                Pardus Ticaret Haydar Karakaş (bundan böyle "Şirket" veya "Event4Network" olarak anılacaktır) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve ilgili mevzuat uyarınca, üyelerimizin ve Platformumuzu (www.event4network.com) ziyaret eden kişilerin ("Veri Sahibi") kişisel verilerinin hukuka uygun olarak işlenmesine ve korunmasına büyük önem vermekteyiz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. İŞLENEN KİŞİSEL VERİLERİNİZ</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="font-semibold">Kimlik Bilgileri:</span> Ad, soyad, TCKN (gerekli durumlarda).</li>
                                <li><span className="font-semibold">İletişim Bilgileri:</span> Telefon numarası, e-posta adresi, fatura ve ikametgah adresi.</li>
                                <li><span className="font-semibold">Mesleki ve Ticari Bilgiler:</span> Şirket unvanı, vergi no, faaliyet alanı, platform içi ticari işlemler (verilen/alınan referanslar).</li>
                                <li><span className="font-semibold">İşlem Güvenliği Bilgileri:</span> IP adresi, giriş çıkış logları, şifre bilgileri.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI VE HUKUKİ SEBEPLERİ</h2>
                            <p>Toplanan kişisel verileriniz aşağıdaki amaçlar ve hukuki sebepler dahilinde işlenmektedir:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Üyelik sözleşmesinin kurulması ve platform hizmetlerinden (toplantılar, "Shuffle" vb.) faydalanmanız (Sözleşmenin İfası),</li>
                                <li>Site üzerindeki kimliğinizin doğrulanması, ödemelerin gerçekleştirilmesi, faturanın düzenlenmesi (Hukuki Yükümlülük),</li>
                                <li>Platform içerisindeki diğer üyelere referans olarak işletmenizin/şirketinizin önerilmesi (Meşru Menfaat ve Açık Rıza),</li>
                                <li>Sistemin iyileştirilmesi, analizlerin yapılması, güvenlik ihlallerinin önlenmesi (Meşru Menfaat).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. KİŞİSEL VERİLERİN AKTARILMASI</h2>
                            <p>
                                Şirketimiz tarafınızca sağlanan kişisel verileri yalnızca yukarıda belirtilen amaçlar doğrultusunda iş ortaklarına, ödeme altyapısı sağlayıcılarına, hukuki süreçlerin yürütülmesi için yetkili avukatlara ve kanunen yetkili kamu kurumlarına aktarabilir. Yurtdışı sunucu ve bulut hizmetleri (AWS, Google vb.) kullanılmaktaysa verileriniz yurtdışında saklanabilmektedir (Açık Rızanıza istinaden).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) 11. MADDE UYARINCA HAKLARINIZ</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                                <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
                                <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                                <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</li>
                                <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
                                <li>Kanunda öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme.</li>
                            </ul>
                            <p className="mt-4">
                                Bu haklarınızı kullanmak için <span className="font-semibold">info@event4network.com</span> adresine e-posta gönderebilir veya aşağıda bilgileri yer alan şirket merkezimize noter kanalıyla veya iadeli taahhütlü mektupla yazılı olarak başvurabilirsiniz.
                            </p>
                        </section>

                        <section className="bg-gray-50 p-4 rounded-lg mt-8">
                            <h3 className="font-bold text-gray-900 mb-2">Veri Sorumlusu İletişim Bilgileri</h3>
                            <ul className="text-sm space-y-1">
                                <li>Şirket Ünvanı: Pardus Ticaret Haydar Karakaş</li>
                                <li>Adres: Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul</li>
                                <li>E-posta: info@event4network.com</li>
                                <li>Telefon: 0536 319 7697</li>
                                <li>Vergi No: 5130029725</li>
                            </ul>
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
