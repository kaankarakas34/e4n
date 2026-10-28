import { Link } from 'react-router-dom';
import { networkingGuides, networkingGuidesModified } from '../data/networkingGuides';

export function NetworkingGuideLinks({ currentPath }: { currentPath?: string }) {
  return (
    <section className="py-12 bg-white" aria-label="Networking temelleri rehberleri">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {currentPath && (
          <p className="text-sm text-slate-600 mb-6">
            Hazırlayan: Event4Network · Güncellendi: <time dateTime={networkingGuidesModified}>28 Ekim 2026</time>
          </p>
        )}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">{currentPath ? 'Bağlantılı Rehber ve İçerikler' : 'Networking Temelleri'}</h2>
        <nav className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Networking rehberleri">
          {networkingGuides.filter(guide => guide.path !== currentPath).map(guide => (
            <Link key={guide.path} to={guide.path} className="block p-6 rounded-2xl border border-slate-200 hover:border-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 transition-colors">
              <h3 className="font-bold text-slate-900 mb-2">{guide.title}</h3>
              <p className="text-sm text-slate-600">{guide.description}</p>
            </Link>
          ))}
        </nav>
        {currentPath && (
          <p className="text-sm text-slate-600 mt-6 leading-relaxed">
            Dinleme, izinli tanıştırma ve takip önerileri için ek okuma: <a href="https://www.careers.cam.ac.uk/networking" className="underline text-red-700">Cambridge Üniversitesi Networking Rehberi</a>.
            {' '}Bu rehberlerdeki çalışma planları örnektir; E4N toplantı ve katılım koşulları için <Link to="/nasil-calisir" className="underline text-red-700">Nasıl Çalışır?</Link> sayfasını inceleyin. İş veya satış sonucu garanti edilmez.
          </p>
        )}
      </div>
    </section>
  );
}
