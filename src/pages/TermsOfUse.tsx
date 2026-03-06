import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../shared/Button';
import { ArrowLeft } from 'lucide-react';

export function TermsOfUse() {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Kullanım Koşulları</h1>

                    <div className="prose prose-red max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. TARAFLAR VE KABUL</h2>
                            <p>
                                İşbu Kullanım Koşulları ("Koşullar"), Pardus Ticaret Haydar Karakaş ("Event4Network") tarafından işletilen www.event4network.com isimli web sitesini ("Site") ve Event4Network platformunu ziyaret eden, bu platforma üye olan tüm kullanıcılar ("Kullanıcı" veya "Üye") için geçerlidir. Platformu kullanarak bu şartları tamamen okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. PLATFORMUN AMACI VE KULLANIMI</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Event4Network, iş insanlarını bir araya getirerek ticaret hacmini artırmayı, nitelikli işbirlikleri ve referans ağları ("Network") kurmayı amaçlayan iletişim bazlı bir platformdur.</li>
                                <li>Site üzerinde ve toplantılarda yürütülen tüm faaliyetlerin Türkiye Cumhuriyeti yasalarına, genel ahlak kurallarına ve Evrensel İş Ahlakı prensiplerine uygun olması zorunludur.</li>
                                <li>Kullanıcılar, diğer üyelerin kişisel sınırlarına saygı duymayı, spam veya izinsiz seri reklam iletişimlerinde bulunmamayı kabul eder.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. ÜYELİK VE GÜVENLİK</h2>
                            <p>
                                Platformun bazı bölümleri (özellikle referans atama ve üye rehberi gibi bölümler) sadece kayıtlı üyelere ("Üye") açıktır. Üye, üyelik aşamasında beyan ettiği firma bilgilerinin, ad ve soyadın tam ve doğru olduğunu taahhüt eder. Şifre güvenliğinden tamamen Kullanıcı sorumludur; üçüncü kişilerle paylaşılması durumunda doğacak tüm zararlar doğrudan Üye'ye aittir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. FİKRİ MÜLKİYET HAKLARI</h2>
                            <p>
                                Sitede yer alan Event4Network logosu, tasarımı, kodları, görselleri ve sistematiği dâhil tüm materyallerin hakları Pardus Ticaret Haydar Karakaş'a aittir. Kullanıcılar, Şirket'in yazılı onayı olmaksızın bu içerikleri ticari olarak kopyalayamaz, çoğaltamaz veya dağıtamaz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. SORUMLULUK SINIRLAMASI VE DEĞİŞİKLİK</h2>
                            <p>
                                Event4Network, üyeler arasındaki ticaretin, sağlanan bir referansın kalitesinin veya herhangi bir finansal işlemin garantörü değildir. Üyelerin kendi aralarında akdedecekleri hukuki, ticari ilişkilerden doğan ihtilaflarda Event4Network hiçbir sorumluluk kabul etmez. Event4Network, dilediği zaman işbu Kullanım Koşulları metnini önceden haber vermeksizin değiştirme ve güncelleme hakkına sahiptir.
                            </p>
                        </section>

                        <section className="bg-gray-50 p-4 rounded-lg mt-8 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-2">Kurumsal İletişim</h3>
                            <ul className="text-sm space-y-1">
                                <li>Şirket Ünvanı: Pardus Ticaret Haydar Karakaş</li>
                                <li>Adresi: Çeliktepe, İsmet İnönü Cd. no:11 NO: 501, 34413 Kağıthane/İstanbul</li>
                                <li>Telefon: 0536 319 7697</li>
                                <li>E-posta: info@event4network.com</li>
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
