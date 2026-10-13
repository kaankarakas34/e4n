import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../shared/Button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownNasilCalisir, setDropdownNasilCalisir] = useState(false);
  const [dropdownTopluluklar, setDropdownTopluluklar] = useState(false);
  const [mobileNasilCalisir, setMobileNasilCalisir] = useState(false);
  const [mobileTopluluklar, setMobileTopluluklar] = useState(false);

  const { user } = useAuthStore();

  const nasilCalisirSubItems = [
    { name: 'Nasıl Çalışır? (Genel)', path: '/nasil-calisir' },
    { name: 'E4N Nedir?', path: '/e4n-nedir' },
    { name: 'Kapalı Gruplar', path: '/kapali-gruplar' },
    { name: 'Shuffle', path: '/shuffle' },
    { name: 'Katılım İlkeleri', path: '/katilim-ilkeleri' },
  ];

  const topluluklarSubItems = [
    { name: 'Topluluklar ve Loncalar', path: '/topluluklarimiz' },
    { name: 'İstanbul', path: '/networking/istanbul' },
    { name: 'Ankara', path: '/networking/ankara' },
    { name: 'İzmir', path: '/networking/izmir' },
  ];

  return (
    <header className="fixed w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <Logo className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-7">
            {/* 1. Nasıl Çalışır? Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownNasilCalisir(true)}
              onMouseLeave={() => setDropdownNasilCalisir(false)}
            >
              <Link
                to="/nasil-calisir"
                className={`font-medium transition-colors inline-flex items-center gap-1.5 py-2 ${
                  location.pathname.startsWith('/nasil-calisir') ||
                  location.pathname === '/e4n-nedir' ||
                  location.pathname === '/kapali-gruplar' ||
                  location.pathname === '/shuffle' ||
                  location.pathname === '/katilim-ilkeleri'
                    ? 'text-red-650'
                    : 'text-gray-700 hover:text-red-650'
                }`}
              >
                <span>Nasıl Çalışır?</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-red-650" />
              </Link>
              {dropdownNasilCalisir && (
                <div className="absolute left-0 top-full w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50">
                  {nasilCalisirSubItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-4 py-2 text-sm font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'bg-red-50 text-red-650 font-bold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-red-650'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Topluluklar Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownTopluluklar(true)}
              onMouseLeave={() => setDropdownTopluluklar(false)}
            >
              <Link
                to="/topluluklarimiz"
                className={`font-medium transition-colors inline-flex items-center gap-1.5 py-2 ${
                  location.pathname.startsWith('/topluluklarimiz') ||
                  location.pathname.startsWith('/networking/')
                    ? 'text-red-650'
                    : 'text-gray-700 hover:text-red-650'
                }`}
              >
                <span>Topluluklar</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Link>
              {dropdownTopluluklar && (
                <div className="absolute left-0 top-full w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50">
                  {topluluklarSubItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-4 py-2 text-sm font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'bg-red-50 text-red-650 font-bold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-red-650'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Etkinlikler */}
            <Link
              to="/etkinlikler"
              className={`font-medium transition-colors ${
                location.pathname === '/etkinlikler'
                  ? 'text-red-650'
                  : 'text-gray-700 hover:text-red-650'
              }`}
            >
              Etkinlikler
            </Link>

            {/* 4. Üyelik */}
            <Link
              to="/uyelik"
              className={`font-medium transition-colors ${
                location.pathname === '/uyelik'
                  ? 'text-red-650'
                  : 'text-gray-700 hover:text-red-650'
              }`}
            >
              Üyelik
            </Link>

            {/* 5. Rehber */}
            <Link
              to="/is-agi-rehberi"
              className={`font-medium transition-colors ${
                location.pathname === '/is-agi-rehberi' || location.pathname.startsWith('/blog')
                  ? 'text-red-650'
                  : 'text-gray-700 hover:text-red-650'
              }`}
            >
              Rehber
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button
                  variant="primary"
                  className="shadow-md hover:shadow-lg shadow-red-200 font-bold"
                >
                  Panelim
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-red-600 font-semibold"
                  >
                    Giriş Yap
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button
                    variant="primary"
                    className="shadow-md hover:shadow-lg shadow-red-200 font-bold px-5 bg-red-600 hover:bg-red-500"
                  >
                    Üye Ol
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu trigger button */}
          <div className="md:hidden flex items-center">
            <button
              aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-2 max-h-[80vh] overflow-y-auto">
          {/* Mobile: Nasıl Çalışır? */}
          <div>
            <div className="flex justify-between items-center px-3 py-2 text-base font-semibold text-gray-800">
              <Link to="/nasil-calisir" onClick={() => setIsOpen(false)}>
                Nasıl Çalışır?
              </Link>
              <button
                type="button"
                aria-label="Nasıl çalışır alt menüsü"
                aria-expanded={mobileNasilCalisir}
                onClick={() => setMobileNasilCalisir(!mobileNasilCalisir)}
                className="p-1 text-gray-400"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileNasilCalisir ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {mobileNasilCalisir && (
              <div className="pl-6 space-y-1 py-1 bg-gray-50 rounded-xl">
                {nasilCalisirSubItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-1.5 text-sm text-gray-600 hover:text-red-650"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile: Topluluklar */}
          <div>
            <div className="flex justify-between items-center px-3 py-2 text-base font-semibold text-gray-800">
              <Link to="/topluluklarimiz" onClick={() => setIsOpen(false)}>
                Topluluklar
              </Link>
              <button
                type="button"
                aria-label="Topluluklar alt menüsü"
                aria-expanded={mobileTopluluklar}
                onClick={() => setMobileTopluluklar(!mobileTopluluklar)}
                className="p-1 text-gray-400"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileTopluluklar ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {mobileTopluluklar && (
              <div className="pl-6 space-y-1 py-1 bg-gray-50 rounded-xl">
                {topluluklarSubItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-1.5 text-sm text-gray-600 hover:text-red-650"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/etkinlikler"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 hover:bg-gray-50 hover:text-red-650"
          >
            Etkinlikler
          </Link>

          <Link
            to="/uyelik"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 hover:bg-gray-50 hover:text-red-650"
          >
            Üyelik
          </Link>

          <Link
            to="/is-agi-rehberi"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 hover:bg-gray-50 hover:text-red-650"
          >
            Rehber
          </Link>

          <div className="pt-4 flex flex-col gap-2.5 border-t border-gray-100">
            {user ? (
              <Button
                variant="primary"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full justify-center shadow-md shadow-red-200 font-bold"
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
                  className="w-full justify-center font-semibold"
                >
                  Giriş Yap
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/auth/register');
                  }}
                  className="w-full justify-center shadow-md shadow-red-200 font-bold bg-red-600 hover:bg-red-500"
                >
                  Üye Ol
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
