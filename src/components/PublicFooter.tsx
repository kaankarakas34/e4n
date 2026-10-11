import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../shared/Logo';

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Logo & Brand Message */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <Logo className="h-8 w-auto cursor-pointer" />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Şirket sahipleri, kurucu ortaklar ve üst düzey yöneticiler için düzenli temas ve karşılıklı katkıya dayalı iş ağı.
            </p>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <a
                href="https://www.linkedin.com/company/event4network/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600 font-medium transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://www.instagram.com/event4network/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600 font-medium transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Kolon 1: E4N */}
          <div>
            <div className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">E4N</div>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/e4n-nedir" className="hover:text-red-600 transition-colors">E4N Nedir?</Link></li>
              <li><Link to="/nasil-calisir" className="hover:text-red-600 transition-colors">Nasıl Çalışır?</Link></li>
              <li><Link to="/kapali-gruplar" className="hover:text-red-600 transition-colors">Kapalı Gruplar</Link></li>
              <li><Link to="/shuffle" className="hover:text-red-600 transition-colors">Shuffle</Link></li>
              <li><Link to="/katilim-ilkeleri" className="hover:text-red-600 transition-colors">Katılım İlkeleri</Link></li>
              <li><Link to="/hakkimizda" className="hover:text-red-600 transition-colors">Hakkımızda</Link></li>
            </ul>
          </div>

          {/* Kolon 2: Topluluk ve Etkinlikler */}
          <div>
            <div className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Topluluk ve Etkinlikler</div>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/topluluklarimiz" className="hover:text-red-600 transition-colors">Loncalar</Link></li>
              <li><Link to="/etkinlikler" className="hover:text-red-600 transition-colors">Etkinlikler</Link></li>
              <li><Link to="/birebir-networking" className="hover:text-red-600 transition-colors">Birebir Görüşmeler</Link></li>
              <li><Link to="/networking/istanbul" className="hover:text-red-600 transition-colors">İstanbul</Link></li>
              <li><Link to="/networking/ankara" className="hover:text-red-600 transition-colors">Ankara</Link></li>
              <li><Link to="/networking/izmir" className="hover:text-red-600 transition-colors">İzmir</Link></li>
            </ul>
          </div>

          {/* Kolon 3: Yardım */}
          <div>
            <div className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Yardım</div>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/sikca-sorulan-sorular" className="hover:text-red-600 transition-colors">Sıkça Sorulan Sorular</Link></li>
              <li><Link to="/iletisim" className="hover:text-red-600 transition-colors">İletişim</Link></li>
              <li><Link to="/uyelik" className="hover:text-red-600 transition-colors">Üyelik Koşulları</Link></li>
            </ul>
          </div>

          {/* Kolon 4: Yasal Bilgiler */}
          <div>
            <div className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Yasal Bilgiler</div>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/kullanim-kosullari" className="hover:text-red-600 transition-colors">Kullanım Koşulları</Link></li>
              <li><Link to="/gizlilik-politikasi" className="hover:text-red-600 transition-colors">Gizlilik Politikası</Link></li>
              <li><Link to="/kvkk" className="hover:text-red-600 transition-colors">KVKK Aydınlatma Metni</Link></li>
              <li><Link to="/mesafeli-satis-sozlesmesi" className="hover:text-red-600 transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link to="/iptal-ve-iade-kosullari" className="hover:text-red-600 transition-colors">İptal ve İade Koşulları</Link></li>
              <li><Link to="/cerez-politikasi" className="hover:text-red-600 transition-colors">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>

        {/* Alt Satır & Pardus Notu */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Event4Network. Tüm hakları saklıdır.</p>
          <div className="text-gray-400 text-center md:text-right">
            <span>Bağımsız oluşum: </span>
            <span className="text-gray-600 font-medium">Pardus Business Chamber</span>
            <span className="text-gray-400"> (Ücretsiz ve seçici iş topluluğu)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
