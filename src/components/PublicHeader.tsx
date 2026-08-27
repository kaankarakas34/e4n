import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../shared/Button';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAuthStore();

  const navLinks = [
    { name: 'E4N Nedir?', path: '/e4n-nedir' },
    { name: 'Nasıl Çalışır?', path: '/nasil-calisir' },
    { name: 'Üyelik', path: '/uyelik' },
    { name: 'Eğitim', path: '/egitim' },
    { name: 'Etkinlikler', path: '/etkinlikler' },
    { name: 'Hakkımızda', path: '/hakkimizda' }
  ];

  return (
    <header className="fixed w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <Logo className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-red-650'
                    : 'text-gray-600 hover:text-red-650'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button
                  variant="primary"
                  className="shadow-md hover:shadow-lg shadow-red-200"
                >
                  Panelim
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button
                    variant="ghost"
                  >
                    Giriş Yap
                  </Button>
                </Link>
                <Link to="/degerlendirme-basvurusu">
                  <Button
                    variant="primary"
                    className="shadow-md hover:shadow-lg shadow-red-200"
                  >
                    Katıl
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-505 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === link.path
                  ? 'bg-red-50 text-red-650'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-red-650'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            {user ? (
              <Button
                variant="primary"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full justify-center shadow-md shadow-red-200"
              >
                Panelim
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/auth/login');
                  }}
                  className="w-full justify-center"
                >
                  Giriş Yap
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/degerlendirme-basvurusu');
                  }}
                  className="w-full justify-center shadow-md shadow-red-200"
                >
                  Katıl
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
