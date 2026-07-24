import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Check, User, Mail, Phone, Building, Briefcase, FileText, Landmark, MapPin, ShieldAlert, ShieldCheck, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '../shared/Button';
import { Logo } from '../shared/Logo';
import { api } from '../api/api';
import { PaymentModal } from '../components/PaymentModal';

const visitorPaymentSchema = z.object({
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  company: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır'),
  profession: z.string().min(2, 'Meslek bilgisi gereklidir'),
  taxOffice: z.string().min(2, 'Vergi dairesi gereklidir'),
  taxNumber: z.string().min(10, 'Vergi numarası en az 10 karakter olmalıdır (şahıs şirketleri için T.C. girilebilir)'),
  address: z.string().min(10, 'Lütfen tam adresinizi giriniz'),
  eventId: z.string().min(1, 'Lütfen katılmak istediğiniz toplantıyı seçiniz'),
  kvkk: z.boolean().refine(val => val === true, {
    message: 'KVKK aydınlatma metnini onaylamanız gerekmektedir'
  })
});

type VisitorPaymentFormData = z.infer<typeof visitorPaymentSchema>;

export function VisitorPaymentPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [inviterName, setInviterName] = useState<string>('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<VisitorPaymentFormData | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<VisitorPaymentFormData>({
    resolver: zodResolver(visitorPaymentSchema),
    defaultValues: {
      kvkk: false,
      eventId: ''
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    }
    fetchPublicEvents();
  }, []);

  const fetchPublicEvents = async () => {
    try {
      setEventsLoading(true);
      const data = await api.getPublicEvents();
      setEvents(data || []);
    } catch (err) {
      console.error('Etkinlikler yüklenirken hata oluştu:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const verifyToken = async (t: string) => {
    setTokenLoading(true);
    setTokenError(null);
    try {
      const res = await api.verifyVisitorInvite(t);
      if (res.valid) {
        setIsTokenValid(true);
        setInviterName(res.inviter_name || 'E4N Üyesi');
        setValue('email', res.email);
      } else {
        setIsTokenValid(false);
        setTokenError(res.error || 'Davet linki geçersiz.');
      }
    } catch (err: any) {
      setIsTokenValid(false);
      setTokenError('Davetiyenin süresi dolmuş veya geçersiz.');
      console.error(err);
    } finally {
      setTokenLoading(false);
    }
  };

  const handleFormSubmit = (data: VisitorPaymentFormData) => {
    if (isTokenValid) {
      // Free registration
      submitRegistration(data, null);
    } else {
      // Payment required
      setPendingFormData(data);
      setPaymentModalOpen(true);
    }
  };

  const submitRegistration = async (data: VisitorPaymentFormData, paymentDetails: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        profession: data.profession,
        kvkk_accepted: true,
        source: isTokenValid ? 'visitor_invite' : 'visitor_payment',
        token: isTokenValid ? token : undefined,
        event_id: data.eventId,
        form_data: {
          tax_office: data.taxOffice,
          tax_number: data.taxNumber,
          address: data.address,
          payment_status: isTokenValid ? 'FREE' : 'PAID',
          payment_amount: isTokenValid ? 0 : 1000,
          payment_date: new Date().toISOString(),
          payment_card_holder: paymentDetails?.cardName || null
        }
      };

      await api.submitPublicVisitorApplication(payload);
      setIsSubmitted(true);
      setPaymentModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Helmet>
          <title>Ziyaretçi Başvurusu Tamamlandı | Event4Network</title>
        </Helmet>
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Başvurunuz Alındı!</h2>
          <p className="text-gray-600 mb-8">
            Ziyaretçi kaydınız başarıyla tamamlandı. Detaylı bilgiler e-posta adresinize gönderilecektir.
          </p>
          <Button variant="primary" onClick={() => navigate('/')} className="w-full">
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 font-sans">
      <Helmet>
        <title>Ziyaretçi Kayıt Formu | Event4Network</title>
      </Helmet>
      
      <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo className="h-8 w-auto" />
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Ana Sayfa
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-8 py-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full filter blur-xl"></div>
            <h1 className="text-3xl font-extrabold relative z-10">Ziyaretçi Kayıt Formu</h1>
            <p className="mt-2 text-red-100 font-medium relative z-10">Event4Network Seçici İş Ağı Toplantısı Katılımı</p>
          </div>

          <div className="p-8">
            {/* Token Status Feedback */}
            {tokenLoading && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3 text-blue-700 animate-pulse">
                <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
                <span className="text-sm font-medium">Davetiye kontrol ediliyor...</span>
              </div>
            )}

            {!tokenLoading && token && isTokenValid && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-green-800">Özel Davetiye Geçerli</h4>
                  <p className="text-xs text-green-700 mt-1">
                    <strong>{inviterName}</strong> tarafından gönderilen davetiyeniz doğrulandı. Bu kayıt sizin için <strong>ücretsizdir</strong> (1000 TL katılım bedeli muafiyeti uygulanmıştır).
                  </p>
                </div>
              </div>
            )}

            {!tokenLoading && token && isTokenValid === false && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-800">Davetiye Geçersiz veya Süresi Dolmuş</h4>
                  <p className="text-xs text-red-700 mt-1">
                    Gönderilen davet bağlantısı 6 saatlik geçerlilik süresini doldurmuş veya geçersizdir. Toplantıya katılmak için 1000 TL katılım bedeli ödemeniz gerekmektedir.
                  </p>
                </div>
              </div>
            )}

            {!token && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3">
                <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Standart Kayıt</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Toplantılarımıza katılım standart olarak <strong>1000 TL</strong> katılım bedeline tabidir. Kayıt işleminin sonunda ödeme adımına yönlendirileceksiniz.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('name')}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">E-Posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('email')}
                      readOnly={!!isTokenValid}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${isTokenValid ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50'} ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="ornek@sirket.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon Numarası</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('phone')}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.phone ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="0555 123 45 67"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Şirket İsmi</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('company')}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.company ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="Şirketinizin Adı"
                    />
                  </div>
                  {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Meslek / Sektör</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('profession')}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.profession ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="Örn. Dijital Pazarlama"
                    />
                  </div>
                  {errors.profession && <p className="mt-1 text-xs text-red-500">{errors.profession.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vergi Dairesi</label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('taxOffice')}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.taxOffice ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="Örn. Kadıköy Vergi Dairesi"
                    />
                  </div>
                  {errors.taxOffice && <p className="mt-1 text-xs text-red-500">{errors.taxOffice.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vergi Numarası / T.C. Kimlik</label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('taxNumber')}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.taxNumber ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="Örn. 1234567890"
                    />
                  </div>
                  {errors.taxNumber && <p className="mt-1 text-xs text-red-500">{errors.taxNumber.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Katılmak İstediğiniz Toplantı / Etkinlik</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      {...register('eventId')}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none appearance-none ${errors.eventId ? 'border-red-300' : 'border-gray-200'}`}
                    >
                      <option value="">Katılacağınız Etkinliği Seçiniz</option>
                      {events.map((e: any) => (
                        <option key={e.id} value={e.id}>
                          {e.title} ({new Date(e.start_at).toLocaleDateString('tr-TR')} {e.group_name ? `- ${e.group_name}` : ''})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {errors.eventId && <p className="mt-1 text-xs text-red-500">{errors.eventId.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Şirket Adresi</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                  <textarea
                    {...register('address')}
                    rows={3}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.address ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="Fatura ve şirket adresi..."
                  ></textarea>
                </div>
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      {...register('kvkk')}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-red-500 checked:bg-red-500"
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                    <a href="/kvkk" target="_blank" rel="noopener noreferrer" className="font-semibold text-red-600 hover:text-red-700 underline">KVKK Aydınlatma Metni</a>'ni okudum, kişisel verilerimin işlenmesine izin veriyorum.
                  </span>
                </label>
                {errors.kvkk && <p className="mt-1 text-xs text-red-500">{errors.kvkk.message}</p>}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-12 text-lg shadow-lg shadow-red-200 flex items-center justify-center"
                  isLoading={isSubmitting}
                >
                  {isTokenValid ? (
                    <>
                      Kaydı Tamamla <Check className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Ödeme Adımına Geç (₺1.000) <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Secure Payment Modal */}
      {isPaymentModalOpen && pendingFormData && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          planTitle="Ziyaretçi Katılım Bedeli"
          amount={1000}
          onSuccess={(paymentDetails) => {
            submitRegistration(pendingFormData, paymentDetails);
          }}
        />
      )}
    </div>
  );
}
