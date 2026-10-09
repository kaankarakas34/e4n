import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import { LegalModal, LegalTexts } from '../shared/LegalModals';
import { ProfessionSelect } from '../components/ProfessionSelect';
import { TURKEY_PROVINCES } from '../../server/src/turkey-provinces.js';

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalType, setModalType] = useState<'membership' | 'clarification' | 'explicit' | null>(null);
  const refParam = searchParams.get('ref') || searchParams.get('referral') || searchParams.get('sponsor');
  const [referralInput, setReferralInput] = useState(refParam || '');
  const [referrerPreview, setReferrerPreview] = useState<{ name: string; company?: string | null } | null>(null);
  const [referralChecking, setReferralChecking] = useState(false);

  useEffect(() => {
    const code = referralInput || token;
    if (!code) {
      setReferrerPreview(null);
      return;
    }
    let active = true;
    setReferralChecking(true);
    api.getReferralPreview({ ref: referralInput, token: token || undefined })
      .then((res: any) => {
        if (active && res && res.valid && res.referrer) {
          setReferrerPreview(res.referrer);
        } else if (active) {
          setReferrerPreview(null);
        }
      })
      .catch(() => {
        if (active) setReferrerPreview(null);
      })
      .finally(() => {
        if (active) setReferralChecking(false);
      });
    return () => { active = false; };
  }, [referralInput, token]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    profession: '',
    company: '',
    taxOffice: '',
    taxNumber: '',
    billingAddress: '',
    kvkkConsent: false,
    marketingConsent: false,
    explicitConsent: false,
    city: ''
  });

  const openModal = (type: 'membership' | 'clarification' | 'explicit') => {
    setModalType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      return;
    }

    // KVKK and Explicit Consent must be accepted
    if (!formData.kvkkConsent || !formData.explicitConsent) {
      setError('Devam etmek için kayıt metinlerini onaylamalısınız.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.requestRegistration({ ...formData, token, ref: referralInput.trim() || undefined });
      setSubmitted(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      let message = 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.';
      try { const body = JSON.parse(error.responseBody); if (typeof body.error === 'string') message = body.error; } catch {}
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatName = (value: string) => {
    return value
      .replace(/\s+/g, ' ') // Remove multiple spaces
      .split(' ')
      .map(word => {
        if (word.length === 0) return '';
        // Turkeys locale specific upper/lower casing could be tricky but for generic standard:
        return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
      })
      .join(' ');
  };

  const formatPhone = (value: string) => {
    // 1. Clean non-digits
    let cleaned = value.replace(/\D/g, '');

    // 2. Ensure it starts with 0
    if (cleaned.length > 0 && cleaned[0] !== '0') {
      cleaned = '0' + cleaned;
    }

    // 3. Limit to 11 digits (05xx xxx xx xx is 11 digits)
    if (cleaned.length > 11) {
      cleaned = cleaned.substring(0, 11);
    }

    // 4. Format
    // 05xx -> 05xx
    // 05xx xxx -> 05xx xxx
    // 05xx xxx xx -> 05xx xxx xx
    // 05xx xxx xx xx -> 05xx xxx xx xx

    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    if (cleaned.length > 7) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length > 9) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }

    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.getAttribute('data-name');
    let value = e.target.value;

    if (name) {
      if (name === 'name') {
        value = formatName(value);
      }
      if (name === 'phone') {
        // Allow deletion (backspace) without forcing format immediately if empty
        // But requested to PREVENT wrong format.
        // We will enable strict formatting on change to guide user.
        value = formatPhone(value);
      }
      setFormData(prev => ({ ...prev, [name]: value }));
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
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              Üyeliğiniz oluşturuldu
            </CardTitle>
            <p className="text-gray-600 mb-6">
              Hemen giriş yapabilirsiniz. Gruplara başvurmak için aktif abonelik gerekir.
            </p>
            <Button onClick={() => navigate('/auth/login')} variant="primary" className="w-full">
              Giriş Yap
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
            <CardTitle className="text-center text-2xl font-bold text-red-600">
              Üye Ol
            </CardTitle>
            <p className="text-center text-sm text-gray-500 mt-2">Şirket bilgilerinizle doğrudan üye olun. Davetiye veya yönetici onayı gerekmez. Grup başvurusu için abonelik gerekir.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <p role="alert" className="text-red-700">{error}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Personal Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Kişisel Bilgiler</h3>
                  <div className="space-y-3">
                    <Input required data-name="name" aria-label="Ad Soyad" placeholder="Ad Soyad" value={formData.name} onChange={handleChange} />
                    <Input required data-name="email" aria-label="E-posta Adresi" placeholder="E-posta Adresi" type="email" value={formData.email} onChange={handleChange} />
                    <Input required data-name="phone" aria-label="Telefon" placeholder="05xx xxx xx xx" type="tel" value={formData.phone} onChange={handleChange} />
                    <label className="block text-sm text-gray-700" htmlFor="registration-city">Bulunduğunuz İl</label>
                    <select id="registration-city" required name="city" aria-label="Bulunduğunuz İl" autoComplete="address-level1" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none" value={formData.city} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}>
                      <option value="">İl seçin</option>
                      {TURKEY_PROVINCES.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                </div>

                {/* Right Column: Professional Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Meslek & Şirket Bilgileri</h3>
                  <div className="space-y-3">
                    <ProfessionSelect
                      value={formData.profession}
                      onChange={(val) => setFormData(prev => ({ ...prev, profession: val }))}
                      className="border-red-200 focus:border-red-500"
                    />

                    <Input
                      data-name="company"
                      placeholder="Şirket İsmi" aria-label="Şirket İsmi"
                      required
                      value={formData.company}
                      onChange={handleChange}
                    />

                    <Input required data-name="taxNumber" aria-label="VKN veya TCKN" placeholder="VKN (10 hane) / TCKN (11 hane)" inputMode="numeric" pattern="([0-9]{10}|[1-9][0-9]{10})" maxLength={11} value={formData.taxNumber} onChange={handleChange} />
                    <p className="text-xs text-gray-500">Şahıs işletmelerinde TCKN kabul edilir. Her numara yalnızca bir hesaba bağlanır; hesap silinse de kayıtlı kalır.</p>
                    <Input data-name="taxOffice" aria-label="Vergi Dairesi" placeholder="Vergi Dairesi" required maxLength={100} value={formData.taxOffice} onChange={handleChange} />
                    <Input data-name="billingAddress" aria-label="Fatura Adresi" placeholder="Fatura Adresi" required maxLength={5000} value={formData.billingAddress} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Password Section - Full Width / 2 Col */}
              <div className="pt-4">
                <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">Güvenlik</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input required data-name="password" aria-label="Şifre Oluştur" placeholder="Şifre Oluştur" type="password" value={formData.password} onChange={handleChange} />
                  <Input required data-name="confirmPassword" aria-label="Şifre Tekrar" placeholder="Şifre Tekrar" type="password" value={formData.confirmPassword} onChange={handleChange} />
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
                    required
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
                  {loading ? 'İşleniyor...' : 'Üye Ol'}
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
