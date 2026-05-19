import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../shared/Logo';

export function PublicFooter() {
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Logo className="h-8 w-auto mb-4 cursor-pointer" onClick={() => navigate('/')} />
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Nitelikli iş insanlarını değerlendirme süreciyle bir araya getiren, güvene dayalı iş ilişkileri ve nitelikli referanslar oluşturan seçici bir networking ekosistemidir.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/e4n-nedir" className="hover:text-red-600">E4N Nedir?</Link></li>
              <li><Link to="/uyelik" className="hover:text-red-600">Üyelik</Link></li>
              <li><Link to="/etkinlikler" className="hover:text-red-600">Etkinlikler</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Kaynaklar</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/blog" className="hover:text-red-600">Rehber</Link></li>
              <li><Link to="/sikca-sorulan-sorular" className="hover:text-red-600">Sıkça Sorulan Sorular</Link></li>
              <li><Link to="/hakkimizda" className="hover:text-red-600">Hakkımızda</Link></li>
              <li><Link to="/iletisim" className="hover:text-red-600">İletişim</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Yasal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/kullanim-kosullari" className="hover:text-red-600">Kullanım Koşulları</Link></li>
              <li><Link to="/gizlilik-politikasi" className="hover:text-red-600">Gizlilik Politikası</Link></li>
              <li><Link to="/kvkk" className="hover:text-red-600">KVKK</Link></li>
              <li><Link to="/on-bilgilendirme-formu" className="hover:text-red-600">Ön Bilgilendirme Formu</Link></li>
              <li><Link to="/mesafeli-satis-sozlesmesi" className="hover:text-red-600">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link to="/iptal-ve-iade-kosullari" className="hover:text-red-600">İptal ve İade Koşulları</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Event4Network. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
