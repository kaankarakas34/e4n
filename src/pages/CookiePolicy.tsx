import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../shared/Button';
import { ArrowLeft } from 'lucide-react';

export function CookiePolicy() {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Çerez (Cookie) Politikası</h1>

                    <div className="prose prose-red max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. ÇEREZ NEDİR?</h2>
                            <p>
                                Çerezler (cookies), ziyaret ettiğiniz web siteleri tarafından tarayıcınız aracılığıyla bilgisayarınıza veya mobil cihazınıza kaydedilen, genellikle harf ve rakamlardan oluşan küçük metin dosyalarıdır. Event4Network ("Şirket") olarak, www.event4network.com sitemizi ziyaret eden kullanıcılarımızın ("Kullanıcı") deneyimini zenginleştirmek ve hizmetlerimizi optimize etmek amacıyla çerez kullanıyoruz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. KULLANDIĞIMIZ ÇEREZ TÜRLERİ VE KULLANIM AMAÇLARI</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <span className="font-semibold text-gray-900">Zorunlu Çerezler:</span> Sitenin düzgün bir şekilde çalışabilmesi için kesinlikle gerekli olan çerezlerdir. Kimlik doğrulama, mevcut oturumunuzu sürdürme ve güvenlik sağlama amaçlarıyla kullanılır.
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-900">Performans ve Analiz Çerezleri:</span> Ziyaretçilerin Siteyi nasıl kullandığını (en çok ziyaret edilen sayfalar, hata mesajları vb.) analiz ederek, Site'nin performansını artırmamıza ve daha iyi bir deneyim sunmamıza yardımcı olur.
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-900">İşlevsellik Çerezleri:</span> Siteyi tekrar ziyaret ettiğinizde tercihlerinizin (dil, bölge vb.) hatırlanmasını sağlar.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. ÇEREZ KONTROLÜ VE SİLİNMESİ</h2>
                            <p>
                                Birçok internet tarayıcısı, varsayılan olarak çerezleri otomatik olarak kabul etmeye ayarlıdır. Tarayıcınızın ayarlarını değiştirerek çerezleri reddedebilir, silebilir veya çerez kaydedildiğinde size uyarı verilmesini sağlayabilirsiniz.
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                Lütfen zorunlu çerezlerin kapatılması durumunda sitemizdeki bazı özelliklerin (örneğin kullanıcı girişi yapma) düzgün çalışamayabileceğini unutmayın.
                            </p>
                        </section>

                        <section className="bg-gray-50 p-4 rounded-lg mt-8 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-2">İletişim</h3>
                            <p className="text-sm">Politika hakkında sorularınız için bize <a href="mailto:info@event4network.com" className="text-red-600 hover:underline">info@event4network.com</a> adresinden ulaşabilirsiniz.</p>
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
