import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import { LegalModal, LegalTexts } from '../shared/LegalModals';

export function Register() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<'membership' | 'clarification' | 'explicit' | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    profession: '',
    company: '',
    taxOffice: '',
    taxNumber: '',
    billingAddress: '',
    kvkkConsent: false,
    marketingConsent: false,
    explicitConsent: false
  });

  const openModal = (type: 'membership' | 'clarification' | 'explicit') => {
    setModalType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.requestRegistration(formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.getAttribute('data-name');
    if (name) {
      setFormData(prev => ({ ...prev, [name]: e.target.value }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md px-4 py-8">
          <Card className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">Başvurunuz Alındı</CardTitle>
            <p className="text-gray-600 mb-6">
              Üyelik başvurunuz başarıyla alınmıştır. Yöneticilerimiz bilgilerinizi kontrol ettikten sonra üyeliğinizi onaylayacaktır.
              Onay sonrası e-posta ile bilgilendirileceksiniz.
            </p>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Ana Sayfaya Dön
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-red-600">Üyelik Başvuru Formu</CardTitle>
            <p className="text-center text-sm text-gray-500 mt-2">
              Formu doldurarak üyelik talebinizi iletebilirsiniz. Başvurunuz incelendikten sonra size dönüş yapılacaktır.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 border-b pb-1">Kişisel Bilgiler</h3>
                  <Input required data-name="name" placeholder="Ad Soyad" value={formData.name} onChange={handleChange} />
                  <Input required data-name="email" placeholder="E-posta Adresi" type="email" value={formData.email} onChange={handleChange} />
                  <Input required data-name="password" placeholder="Şifre" type="password" value={formData.password} onChange={handleChange} />
                  <Input required data-name="phone" placeholder="Telefon Numarası" type="tel" value={formData.phone} onChange={handleChange} />
                  <Input required data-name="profession" placeholder="Meslek Kolu" className="border-red-200 focus:border-red-500" value={formData.profession} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 border-b pb-1">Şirket Bilgileri</h3>
                  <Input required data-name="company" placeholder="Şirket İsmi" value={formData.company} onChange={handleChange} />
                  <Input data-name="taxOffice" placeholder="Vergi Dairesi" value={formData.taxOffice} onChange={handleChange} />
                  <Input data-name="taxNumber" placeholder="Vergi Numarası" value={formData.taxNumber} onChange={handleChange} />
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Fatura Adresi"
                    rows={4}
                    data-name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* KVKK & Legal Checkboxes */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    required
                    id="kvkk-consent"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    onChange={(e) => setFormData(prev => ({ ...prev, kvkkConsent: e.target.checked }))}
                  />
                  <label htmlFor="kvkk-consent" className="text-sm text-gray-600">
                    <button type="button" onClick={() => openModal('membership')} className="text-red-600 hover:underline font-medium">Üyelik Sözleşmesi</button>'ni ve <button type="button" onClick={() => openModal('clarification')} className="text-red-600 hover:underline font-medium">Aydınlatma Metni</button>'ni okudum, anlıyorum ve kabul ediyorum.
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="explicit-consent"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    onChange={(e) => setFormData(prev => ({ ...prev, explicitConsent: e.target.checked }))}
                  />
                  <label htmlFor="explicit-consent" className="text-sm text-gray-600">
                    Kişisel verilerimin <button type="button" onClick={() => openModal('explicit')} className="text-red-600 hover:underline font-medium">Açık Rıza Metni</button> kapsamında işlenmesine rıza gösteriyorum.
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="marketing-consent"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    onChange={(e) => setFormData(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                  />
                  <label htmlFor="marketing-consent" className="text-sm text-gray-600">
                    Kampanya, etkinlik ve duyurulardan haberdar olmak için tarafıma ticari elektronik ileti (E-posta, SMS) gönderilmesine izin veriyorum.
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <Button disabled={loading} variant="primary" className="w-full h-12 text-lg shadow-lg shadow-red-200">
                  {loading ? 'İşleniyor...' : 'Başvuruyu Gönder'}
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500">
                Zaten üyeliğiniz var mı? <a href="/auth/login" className="text-red-600 hover:text-red-500 font-medium">Giriş Yap</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      <LegalModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={modalType === 'membership' ? 'Üyelik Sözleşmesi' : modalType === 'clarification' ? 'Aydınlatma Metni' : 'Açık Rıza Metni'}
        content={modalType === 'membership' ? LegalTexts.MEMBERSHIP_AGREEMENT : modalType === 'clarification' ? LegalTexts.CLARIFICATION_TEXT : LegalTexts.EXPLICIT_CONSENT}
      />
    </div>
  );
}
