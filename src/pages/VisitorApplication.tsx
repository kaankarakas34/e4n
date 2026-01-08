import React, { useState } from 'react';
import { ShieldCheck, Building, User, Briefcase, Check } from 'lucide-react';
import { Button } from '../shared/Button';
import { Logo } from '../shared/Logo';
import { useNavigate } from 'react-router-dom';
import { VisitorForm } from '../components/VisitorForm';

export function VisitorApplication() {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Başvurunuz Alındı!</h2>
          <p className="text-gray-600 mb-8">
            Ziyaretçi talebiniz başarıyla bize ulaştı. En kısa sürede sizinle iletişime geçeceğiz.
          </p>
          <Button variant="primary" onClick={() => navigate('/')} className="w-full">
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Mobile-First Header */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo className="h-8 w-auto" />
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Ana Sayfa
          </Button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">

          {/* Form Section - First on Mobile as requested */}
          <div className="relative z-10">
            <div className="bg-white rounded-2xl shadow-2xl shadow-red-100/50 p-6 sm:p-8 border border-gray-100">
              <div className="mb-8">
                <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full mb-3">
                  ÜCRETSİZ KATILIM
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ziyaretçi Olun</h1>
                <p className="text-gray-600">
                  Global iş ağımızın bir parçası olmak için ilk adımı atın.
                </p>
              </div>

              <VisitorForm onSuccess={() => setIsSubmitted(true)} source="landing_page" />
            </div>
          </div>

          {/* Info Section - Below form on mobile, Right side on Desktop */}
          <div className="mt-12 lg:mt-0 lg:pl-8">
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6 border border-blue-100">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Güvenilir İş Ağı
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Neden <span className="text-red-600">Event 4 Network?</span>
              </h2>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                    <Building className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Nitelikli İş Bağlantıları</h3>
                    <p className="text-gray-600">Sektör liderleriyle tanışın, işinizi büyütecek doğru kişilerle bağlantı kurun.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Kişisel Gelişim</h3>
                    <p className="text-gray-600">Düzenli eğitimler ve mentorluk desteği ile hem kendinizi hem ekibinizi geliştirin.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Global Fırsatlar</h3>
                    <p className="text-gray-600">Sadece yerel değil, uluslararası pazarlara açılma fırsatı yakalayın.</p>
                  </div>
                </div>
              </div>

              {/* Visual Element */}
              <div className="mt-10 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="relative z-10">
                  <div className="text-3xl font-bold mb-1">₺100M+</div>
                  <div className="text-gray-400 text-sm mb-4">Oluşturulan İş Hacmi</div>
                  <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-3/4"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

