import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, FileText } from 'lucide-react';
import { Button } from '../shared/Button';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Sayfa Bulunamadı | Event4Network</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-9xl font-extrabold text-gray-200">404</h1>
        <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Sayfa Bulunamadı</h2>
        <p className="mt-4 text-gray-600 px-4">
          Aradığınız sayfa bulunamadı. Event4Network hakkında bilgi almak veya ön bilgilendirme formunu doldurmak için ana sayfaya dönebilirsiniz.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 flex flex-col space-y-4">
          <Link to="/" className="w-full">
            <Button className="w-full flex items-center justify-center gap-2" variant="outline">
              <Home className="w-5 h-5" />
              Ana Sayfaya Dön
            </Button>
          </Link>
          
          <Link to="/on-bilgilendirme-formu" className="w-full">
            <Button className="w-full flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              Ön Bilgilendirme Formu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
