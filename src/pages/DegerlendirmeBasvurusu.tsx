import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Check, User, Mail, Phone, Building, Briefcase, ArrowRight, Search, X, Globe, Clock, Target, HelpCircle, Award, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../shared/Button';
import { api } from '../api/api';

const applicationSchema = z.object({
  // Adım 1: Kişisel Bilgiler
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  linkedin_profile: z.string().optional(),
  city: z.string().optional(),

  // Adım 2: Profesyonel Profil
  company: z.string().min(2, 'Şirket/marka adı en az 2 karakter olmalıdır'),
  title: z.string().min(2, 'Ünvan bilgisi gereklidir'),
  web_linkedin: z.string().optional(),
  activity_area: z.string().min(2, 'Faaliyet alanınız nedir?'),
  industry: z.string().min(2, 'Hangi sektörde hizmet veriyorsunuz?'),
  duration: z.string().min(1, 'Şirket faaliyet süresi seçimi gereklidir'),

  // Adım 3: İş Hacmi ve Uzmanlık
  business_level: z.string().min(1, 'İşletmenizin mevcut seviyesini tanımlayınız'),
  business_volume: z.string().min(1, 'Mevcut iş hacminizi tanımlayınız'),
  team_size: z.string().optional(),
  monthly_customers: z.string().optional(),
  target_customer: z.string().min(5, 'Hedef müşteri profiliniz kimlerden oluşur?'),
  business_description: z.string().min(10, 'Yaptığınız işi tanımlayınız (En az 10 karakter)'),
  differentiating_factor: z.string().min(5, 'Sizi ayıran en güçlü yön nedir?'),
  value_provided: z.string().min(5, 'Müşterilerinize en çok hangi konuda değer sağlıyorsunuz?'),
  success_story: z.string().optional(),
  ideal_referral: z.string().min(10, 'Sizi kimlere ve hangi ihtiyaçta önermeliyiz? (En az 10 karakter)'),

  // Adım 4: Networke Katkı
  value_add: z.string().min(10, 'Topluluğa nasıl bir değer katabileceğinizi düşünüyorsunuz? (En az 10 karakter)'),
  network_size: z.string().min(1, 'Mevcut iş çevrenizi tanımlayınız'),
  network_sectors: z.string().optional(),
  network_opportunities: z.string().optional(),
  referral_example: z.string().optional(),
  network_sharing_approach: z.string().min(1, 'Network paylaşımı konusundaki yaklaşımınız nedir?'),

  // Adım 5: Niyet Mektubu ve Beklentiler
  why_join: z.string().min(100, 'Lütfen niyetinizi, beklentinizi ve katacağınız değeri daha detaylı anlatınız (En az 100 karakter)'),
  primary_expectation: z.array(z.string()).min(1, 'En az bir beklenti seçmelisiniz'),
  target_connection_types: z.string().optional(),
  ideal_referral_definition: z.string().optional(),
  time_commitment: z.string().min(1, 'Toplantılara zaman ayırabilir misiniz?'),
  core_value: z.string().optional(),

  // Adım 6: Referans ve Onaylar
  previous_networking_experience: z.string().optional(),
  discovery_source: z.string().optional(),
  // referral_name is handled via states, but we can capture it here too
  kvkk: z.boolean().refine(val => val === true, {
    message: 'KVKK onayı zorunludur'
  }),
  application_consent: z.boolean().refine(val => val === true, {
    message: 'Başvuru bilgilendirme onayı zorunludur'
  })
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const STEPS = [
  'Kişisel Bilgiler',
  'Profesyonel Profil',
  'İş Hacmi ve Uzmanlık',
  'Networke Katkı',
  'Niyet Mektubu',
  'Referans ve Onaylar'
];

export function DegerlendirmeBasvurusu() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referral Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refId = params.get('refId');
    if (refId) {
      api.getPublicMember(refId).then(member => {
        if (member) setSelectedReferral(member);
      });
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      api.searchPublicMembers(searchQuery).then(results => {
        setSearchResults(results);
        setIsSearching(false);
      });
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const { register, handleSubmit, control, trigger, formState: { errors } } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    mode: 'onTouched',
    defaultValues: {
      primary_expectation: []
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 0) fieldsToValidate = ['name', 'phone', 'email', 'linkedin_profile', 'city'];
    if (currentStep === 1) fieldsToValidate = ['company', 'title', 'web_linkedin', 'activity_area', 'industry', 'duration'];
    if (currentStep === 2) fieldsToValidate = ['business_level', 'business_volume', 'team_size', 'monthly_customers', 'target_customer', 'business_description', 'differentiating_factor', 'value_provided', 'success_story', 'ideal_referral'];
    if (currentStep === 3) fieldsToValidate = ['value_add', 'network_size', 'network_sectors', 'network_opportunities', 'referral_example', 'network_sharing_approach'];
    if (currentStep === 4) fieldsToValidate = ['why_join', 'primary_expectation', 'target_connection_types', 'ideal_referral_definition', 'time_commitment', 'core_value'];
    
    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        profession: data.activity_area, // Map activity_area to legacy profession field for compatibility
        title: data.title,
        web_linkedin: data.web_linkedin,
        activity_area: data.activity_area,
        duration: data.duration,
        target_customer: data.target_customer,
        why_join: data.why_join,
        value_add: data.value_add,
        previous_groups: data.previous_networking_experience || 'Hayır',
        kvkk_accepted: true,
        source: 'on_degerlendirme',
        inviter_id: selectedReferral ? selectedReferral.id : undefined,
        form_data: {
          linkedin_profile: data.linkedin_profile,
          city: data.city,
          industry: data.industry,
          business_level: data.business_level,
          business_volume: data.business_volume,
          team_size: data.team_size,
          monthly_customers: data.monthly_customers,
          business_description: data.business_description,
          differentiating_factor: data.differentiating_factor,
          value_provided: data.value_provided,
          success_story: data.success_story,
          ideal_referral: data.ideal_referral,
          network_size: data.network_size,
          network_sectors: data.network_sectors,
          network_opportunities: data.network_opportunities,
          referral_example: data.referral_example,
          network_sharing_approach: data.network_sharing_approach,
          primary_expectation: data.primary_expectation,
          target_connection_types: data.target_connection_types,
          ideal_referral_definition: data.ideal_referral_definition,
          time_commitment: data.time_commitment,
          core_value: data.core_value,
          discovery_source: data.discovery_source,
          referral_name: selectedReferral ? selectedReferral.name : undefined
        }
      };

      await api.submitPublicVisitorApplication(payload);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      alert('Başvuru gönderilirken bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white min-h-screen py-24 flex items-center justify-center">
        <Helmet>
          <title>Başvuru Alındı | Event4Network</title>
        </Helmet>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200 shadow-md">
            <Check className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Başvurunuz değerlendirme sürecine alınmıştır.</h1>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Event4Network’e gösterdiğiniz ilgi için teşekkür ederiz. Başvurunuz, topluluğun nitelik standardı ve karşılıklı değer ilkesi doğrultusunda incelenecektir.<br /><br />
            Uygunluk halinde sizinle iletişime geçilecektir.
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/')}
            className="px-8"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <Helmet>
        <title>Ön Değerlendirme Başvurusu | Event4Network</title>
        <meta name="description" content="Event4Network’e katılım ön değerlendirme süreciyle ilerler. İş profilinizi, profesyonel deneyiminizi ve topluluğa katabileceğiniz değeri paylaşarak başvurunuzu iletin." />
        <meta property="og:title" content="Ön Değerlendirme Başvurusu | Event4Network" />
        <meta property="og:description" content="Event4Network’e katılım, iş profili, profesyonel temsil gücü ve karşılıklı değer potansiyeli doğrultusunda yapılan ön değerlendirme süreciyle ilerler." />
        <link rel="canonical" href="https://www.event4network.com/degerlendirme-basvurusu" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gray-950 text-white p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full bg-red-950/20 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <div className="relative z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-4">
                Ön Değerlendirme Süreci
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Ön Değerlendirme Başvurusu
              </h1>
              <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Event4Network’e katılım, doğrudan kayıt sistemiyle değil; ön değerlendirme süreciyle ilerler.<br /><br />
                Bu form, sizi, işinizi, profesyonel deneyiminizi ve Event4Network topluluğuna katabileceğiniz değeri daha iyi anlayabilmemiz için hazırlanmıştır.<br /><br />
                Başvurular; iş profili, profesyonel temsil gücü, faaliyet alanı, networke sağlayabileceğiniz katkı ve mevcut yapı ile uygunluk doğrultusunda değerlendirilir. Formu doldurmanız üyelik garantisi oluşturmaz. Uygun görülen başvurular için sizinle iletişime geçilir.
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 sm:px-12 pt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Adım {currentStep + 1} / {STEPS.length}</span>
              <span className="text-sm font-medium text-gray-500">{STEPS[currentStep]}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 sm:p-12 space-y-8">
            
            {/* Adım 1: Kişisel Bilgiler */}
            {currentStep === 0 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-xl font-bold text-gray-900 mb-6">1. Kişisel Bilgiler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Soyad *</label>
                    <input type="text" {...register('name')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.name ? 'border-red-300' : 'border-gray-250'}`} />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon *</label>
                    <input type="tel" {...register('phone')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.phone ? 'border-red-300' : 'border-gray-250'}`} />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">E-posta Adresi *</label>
                    <input type="email" {...register('email')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.email ? 'border-red-300' : 'border-gray-250'}`} />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn Profiliniz</label>
                    <input type="text" {...register('linkedin_profile')} placeholder="linkedin.com/in/profiliniz" className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Yaşadığınız Şehir</label>
                    <input type="text" {...register('city')} className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Adım 2: Profesyonel Profil */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-xl font-bold text-gray-900 mb-6">2. Şirket / Profesyonel Profil Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Şirket / Marka Adı *</label>
                    <input type="text" {...register('company')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.company ? 'border-red-300' : 'border-gray-250'}`} />
                    {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pozisyon / Ünvan *</label>
                    <input type="text" {...register('title')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.title ? 'border-red-300' : 'border-gray-250'}`} />
                    {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Web Sitesi</label>
                    <input type="text" {...register('web_linkedin')} className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Faaliyet Alanınız *</label>
                    <input type="text" {...register('activity_area')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.activity_area ? 'border-red-300' : 'border-gray-250'}`} />
                    {errors.activity_area && <p className="mt-1 text-xs text-red-500">{errors.activity_area.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hangi sektörde hizmet veriyorsunuz? *</label>
                    <input type="text" {...register('industry')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.industry ? 'border-red-300' : 'border-gray-250'}`} />
                    {errors.industry && <p className="mt-1 text-xs text-red-500">{errors.industry.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Şirketiniz kaç yıldır aktif? *</label>
                    <select {...register('duration')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.duration ? 'border-red-300' : 'border-gray-250'}`}>
                      <option value="">Seçiniz</option>
                      <option value="0-1 yıl">0-1 yıl</option>
                      <option value="1-2 yıl">1-2 yıl</option>
                      <option value="2-5 yıl">2-5 yıl</option>
                      <option value="5-10 yıl">5-10 yıl</option>
                      <option value="10 yıl ve üzeri">10 yıl ve üzeri</option>
                    </select>
                    {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Adım 3: İş Hacmi ve Uzmanlık */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">3. İş Hacmi ve Profesyonel Olgunluk</h3>
                <p className="text-sm text-gray-500 mb-6">Başvuran kişinin işinin olgunluğunu, hacmini ve profesyonel seviyesini anlamak amacıyla.</p>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">İşletmenizin mevcut seviyesini nasıl tanımlarsınız? *</label>
                  <select {...register('business_level')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.business_level ? 'border-red-300' : 'border-gray-250'}`}>
                    <option value="">Seçiniz</option>
                    <option value="Yeni kurulan / gelişim aşamasında">Yeni kurulan / gelişim aşamasında</option>
                    <option value="Düzenli müşteri portföyü olan">Düzenli müşteri portföyü olan</option>
                    <option value="Büyüme sürecinde olan">Büyüme sürecinde olan</option>
                    <option value="Oturmuş sistem ve ekibe sahip olan">Oturmuş sistem ve ekibe sahip olan</option>
                    <option value="Kurumsal / ölçeklenmiş yapı">Kurumsal / ölçeklenmiş yapı</option>
                  </select>
                  {errors.business_level && <p className="mt-1 text-xs text-red-500">{errors.business_level.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Şirketinizin mevcut iş hacmini nasıl tanımlarsınız? *</label>
                  <select {...register('business_volume')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.business_volume ? 'border-red-300' : 'border-gray-250'}`}>
                    <option value="">Seçiniz</option>
                    <option value="Dönemsel ve değişken iş hacmi">Dönemsel ve değişken iş hacmi</option>
                    <option value="Düzenli ama sınırlı iş hacmi">Düzenli ama sınırlı iş hacmi</option>
                    <option value="Düzenli ve büyüyen iş hacmi">Düzenli ve büyüyen iş hacmi</option>
                    <option value="Güçlü müşteri portföyü ve sürdürülebilir iş hacmi">Güçlü müşteri portföyü ve sürdürülebilir iş hacmi</option>
                    <option value="Kurumsal ölçekte iş hacmi">Kurumsal ölçekte iş hacmi</option>
                  </select>
                  {errors.business_volume && <p className="mt-1 text-xs text-red-500">{errors.business_volume.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ekibinizin büyüklüğü nedir?</label>
                    <select {...register('team_size')} className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm">
                      <option value="">Seçiniz</option>
                      <option value="Tek kişi / freelance yapı">Tek kişi / freelance yapı</option>
                      <option value="2-5 kişi">2-5 kişi</option>
                      <option value="6-10 kişi">6-10 kişi</option>
                      <option value="11-25 kişi">11-25 kişi</option>
                      <option value="26-50 kişi">26-50 kişi</option>
                      <option value="50+ kişi">50+ kişi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Aylık ortalama hizmet verdiğiniz müşteri/proje sayısı?</label>
                    <select {...register('monthly_customers')} className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm">
                      <option value="">Seçiniz</option>
                      <option value="Dönemsel">Dönemsel</option>
                      <option value="1-3 aktif müşteri/proje">1-3 aktif müşteri/proje</option>
                      <option value="4-10 aktif müşteri/proje">4-10 aktif müşteri/proje</option>
                      <option value="10+ aktif müşteri/proje">10+ aktif müşteri/proje</option>
                      <option value="Kurumsal portföy">Kurumsal portföy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hedef müşteri profiliniz kimlerden oluşur? *</label>
                  <p className="text-xs text-gray-400 mb-2">Örn: KOBİ’ler, kurumsal şirketler, ihracat firmaları, sağlık turizmi şirketleri vb.</p>
                  <textarea {...register('target_customer')} rows={2} className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.target_customer ? 'border-red-300' : 'border-gray-250'}`} />
                  {errors.target_customer && <p className="mt-1 text-xs text-red-500">{errors.target_customer.message}</p>}
                </div>

                <h3 className="text-lg font-bold text-gray-900 pt-4 border-t border-gray-100 mt-6">Uzmanlık ve Değer Önerisi</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Yaptığınız işi 2-3 cümleyle nasıl tanımlarsınız? *</label>
                  <textarea {...register('business_description')} rows={3} className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.business_description ? 'border-red-300' : 'border-gray-250'}`} />
                  {errors.business_description && <p className="mt-1 text-xs text-red-500">{errors.business_description.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sizi benzer hizmet veren kişilerden ayıran en güçlü yön nedir? *</label>
                  <textarea {...register('differentiating_factor')} rows={2} className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.differentiating_factor ? 'border-red-300' : 'border-gray-250'}`} />
                  {errors.differentiating_factor && <p className="mt-1 text-xs text-red-500">{errors.differentiating_factor.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Müşterilerinize en çok hangi konuda değer sağlıyorsunuz? *</label>
                  <textarea {...register('value_provided')} rows={2} className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.value_provided ? 'border-red-300' : 'border-gray-250'}`} />
                  {errors.value_provided && <p className="mt-1 text-xs text-red-500">{errors.value_provided.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sizi doğru anlayan biri, sizi hangi ihtiyaçta ve kimlere önermeli? *</label>
                  <textarea 
                    {...register('ideal_referral')} 
                    rows={3} 
                    placeholder="Örn: Beni, dijital pazarlama ve satış süreçlerini büyütmek isteyen sağlık turizmi şirketlerine, e-ticaret markalarına veya B2B hizmet firmalarına önerebilirsiniz. Özellikle daha nitelikli lead üretimi, reklam performansı ve büyüme stratejisi ihtiyacı olan işletmelere değer sağlayabilirim."
                    className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm placeholder-gray-400 ${errors.ideal_referral ? 'border-red-300' : 'border-gray-250'}`} 
                  />
                  {errors.ideal_referral && <p className="mt-1 text-xs text-red-500">{errors.ideal_referral.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gerçekleştirdiğiniz güçlü bir iş, proje veya başarı örneğini paylaşır mısınız?</label>
                  <textarea {...register('success_story')} rows={2} className="w-full p-4 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                </div>
              </div>
            )}

            {/* Adım 4: Networke Katkı */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">4. Networke Katkı ve Karşılıklı Değer</h3>
                <p className="text-sm text-gray-500 mb-6">Topluluğa ne katabileceğinizi daha iyi anlamamız için.</p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event4Network topluluğuna nasıl bir değer katabileceğinizi düşünüyorsunuz? *</label>
                  <textarea 
                    {...register('value_add')} 
                    rows={3} 
                    placeholder="Örn: Kendi uzmanlık alanımdaki deneyimimi paylaşarak, üyelerin dijital görünürlük, satış, iş geliştirme veya stratejik bağlantı ihtiyaçlarına katkı sağlayabilirim. Ayrıca uygun gördüğüm durumlarda kendi profesyonel çevremden doğru kişilerle nitelikli bağlantılar kurmalarına destek olabilirim."
                    className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm placeholder-gray-400 ${errors.value_add ? 'border-red-300' : 'border-gray-250'}`} 
                  />
                  {errors.value_add && <p className="mt-1 text-xs text-red-500">{errors.value_add.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mevcut iş çevrenizi nasıl tanımlarsınız? *</label>
                  <select {...register('network_size')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.network_size ? 'border-red-300' : 'border-gray-250'}`}>
                    <option value="">Seçiniz</option>
                    <option value="Sınırlı ama odaklı bir çevrem var">Sınırlı ama odaklı bir çevrem var</option>
                    <option value="Belirli sektörlerde güçlü bağlantılarım var">Belirli sektörlerde güçlü bağlantılarım var</option>
                    <option value="Geniş ve aktif bir profesyonel çevrem var">Geniş ve aktif bir profesyonel çevrem var</option>
                    <option value="Karar verici seviyesinde güçlü bağlantılarım var">Karar verici seviyesinde güçlü bağlantılarım var</option>
                    <option value="Farklı sektörlere erişebilen geniş bir networküm var">Farklı sektörlere erişebilen geniş bir networküm var</option>
                  </select>
                  {errors.network_size && <p className="mt-1 text-xs text-red-500">{errors.network_size.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hangi sektörlerde güçlü bağlantılarınız var?</label>
                  <p className="text-xs text-gray-400 mb-2">Örn: sağlık, gayrimenkul, finans, teknoloji, hukuk, üretim, e-ticaret, turizm vb.</p>
                  <input type="text" {...register('network_sectors')} className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Grup içindeki diğer üyelere hangi tür bağlantılar veya fırsatlar sağlayabilirsiniz?</label>
                  <textarea 
                    {...register('network_opportunities')} 
                    rows={2} 
                    placeholder="Örn: Sağlık, turizm, yazılım, e-ticaret ve hizmet sektörlerinde çalışan şirket sahipleri, yöneticiler ve karar vericilerle bağlantılar sağlayabilirim. Doğru ihtiyaç oluştuğunda üyeleri potansiyel müşteri, iş ortağı, tedarikçi veya stratejik partnerlerle tanıştırabilirim."
                    className="w-full p-4 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm placeholder-gray-400" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Daha önce bir kişiyi doğru bir iş fırsatıyla buluşturduğunuz bir örnek paylaşır mısınız?</label>
                  <textarea {...register('referral_example')} rows={2} className="w-full p-4 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Networkünüzü paylaşma konusunda yaklaşımınız nedir? *</label>
                  <select {...register('network_sharing_approach')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.network_sharing_approach ? 'border-red-300' : 'border-gray-250'}`}>
                    <option value="">Seçiniz</option>
                    <option value="Uygun gördüğüm durumlarda bağlantı kurmaya açığım">Uygun gördüğüm durumlarda bağlantı kurmaya açığım</option>
                    <option value="Güven oluştuğunda çevremi paylaşırım">Güven oluştuğunda çevremi paylaşırım</option>
                    <option value="Doğru ihtiyaç ve doğru kişi eşleşirse aktif yönlendirme yaparım">Doğru ihtiyaç ve doğru kişi eşleşirse aktif yönlendirme yaparım</option>
                    <option value="Network paylaşımını profesyonel iş kültürünün önemli parçası olarak görürüm">Network paylaşımını profesyonel iş kültürünün önemli parçası olarak görürüm</option>
                  </select>
                  {errors.network_sharing_approach && <p className="mt-1 text-xs text-red-500">{errors.network_sharing_approach.message}</p>}
                </div>
              </div>
            )}

            {/* Adım 5: Niyet Mektubu ve Beklentiler */}
            {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">5. Niyet Mektubu ve Beklentiler</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Event4Network’e neden katılmak istiyorsunuz? *</label>
                  <p className="text-xs text-gray-500 mb-2">Lütfen niyetinizi, beklentinizi ve topluluğa katabileceğiniz değeri birkaç paragrafla anlatınız. (Minimum 100 karakter)</p>
                  <textarea 
                    {...register('why_join')} 
                    rows={6} 
                    placeholder="Örn: Sadece yeni insanlarla tanışmak için değil, güvene dayalı ve uzun vadeli iş ilişkileri kurabileceğim nitelikli bir çevrenin parçası olmak istiyorum. Kendi uzmanlığımı doğru insanlara anlatmak, değer katabileceğim profesyonellerle tanışmak ve karşılıklı referans kültürü içinde yer almak benim için önemli." 
                    className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm placeholder-gray-400 ${errors.why_join ? 'border-red-300' : 'border-gray-250'}`} 
                  />
                  {errors.why_join && <p className="mt-1 text-xs text-red-500">{errors.why_join.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event4Network’ten öncelikli beklentiniz nedir? * (Birden fazla seçebilirsiniz)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Nitelikli iş insanlarıyla tanışmak',
                      'Referansla iş geliştirmek',
                      'Stratejik iş birlikleri kurmak',
                      'Profesyonel çevremi güçlendirmek',
                      'Kendi uzmanlığımı doğru çevrede görünür kılmak',
                      'Yeni sektörlere erişim sağlamak'
                    ].map((opt) => (
                      <label key={opt} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" value={opt} {...register('primary_expectation')} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {errors.primary_expectation && <p className="mt-1 text-xs text-red-500">{errors.primary_expectation.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hangi tür kişilerle veya şirketlerle tanışmak sizin için değerlidir?</label>
                  <textarea {...register('target_connection_types')} rows={2} className="w-full p-4 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sizin için ideal bir iş yönlendirmesi nasıl olur?</label>
                  <textarea {...register('ideal_referral_definition')} rows={2} className="w-full p-4 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Düzenli toplantı ve birebir görüşmelere zaman ayırabilir misiniz? *</label>
                    <select {...register('time_commitment')} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm ${errors.time_commitment ? 'border-red-300' : 'border-gray-250'}`}>
                      <option value="">Seçiniz</option>
                      <option value="Evet, düzenli zaman ayırabilirim">Evet, düzenli zaman ayırabilirim</option>
                      <option value="Yoğunluğuma göre zaman ayırabilirim">Yoğunluğuma göre zaman ayırabilirim</option>
                      <option value="Şu an emin değilim">Şu an emin değilim</option>
                    </select>
                    {errors.time_commitment && <p className="mt-1 text-xs text-red-500">{errors.time_commitment.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Profesyonel bir toplulukta en çok önem verdiğiniz değer nedir?</label>
                    <select {...register('core_value')} className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm">
                      <option value="">Seçiniz</option>
                      <option value="Güven">Güven</option>
                      <option value="Nitelik">Nitelik</option>
                      <option value="Disiplin">Disiplin</option>
                      <option value="Karşılıklı fayda">Karşılıklı fayda</option>
                      <option value="Uzun vadeli ilişki">Uzun vadeli ilişki</option>
                      <option value="Profesyonel temsil">Profesyonel temsil</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Adım 6: Referans ve Onaylar */}
            {currentStep === 5 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">6. Deneyim, Referans ve Onaylar</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Daha önce herhangi bir networking grubu, iş kulübü, dernek veya profesyonel toplulukta yer aldınız mı?</label>
                  <textarea {...register('previous_networking_experience')} rows={2} placeholder="Evet ise hangi yapılar, ne kadar süreyle? Hayır ise 'Hayır' yazabilirsiniz." className="w-full p-4 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event4Network’ü nereden duydunuz?</label>
                    <select {...register('discovery_source')} className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm">
                      <option value="">Seçiniz</option>
                      <option value="Üye referansı">Üye referansı</option>
                      <option value="Sosyal medya">Sosyal medya</option>
                      <option value="Google">Google</option>
                      <option value="Etkinlik">Etkinlik</option>
                      <option value="Arkadaş / iş çevresi">Arkadaş / iş çevresi</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sizi Event4Network’e öneren biri varsa belirtin</label>
                    {selectedReferral ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{selectedReferral.name}</span>
                          {selectedReferral.company && <span className="text-xs text-gray-500">{selectedReferral.company}</span>}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { setSelectedReferral(null); setSearchQuery(''); }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm"
                            placeholder="Referans üye ara (İsim veya Şirket)"
                          />
                        </div>
                        {isSearching && <p className="text-xs text-gray-500 mt-1">Aranıyor...</p>}
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {searchResults.map((member) => (
                              <div 
                                key={member.id}
                                onClick={() => {
                                  setSelectedReferral(member);
                                  setSearchResults([]);
                                  setSearchQuery('');
                                }}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                              >
                                <div className="text-sm font-bold text-gray-900">{member.name}</div>
                                {member.company && <div className="text-xs text-gray-500">{member.company}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input type="checkbox" {...register('kvkk')} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-red-500 checked:bg-red-500" />
                      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                      Kişisel verilerimin Event4Network ön değerlendirme süreci kapsamında işlenmesini kabul ediyorum. *
                    </span>
                  </label>
                  {errors.kvkk && <p className="mt-1 text-xs text-red-500 pl-8">{errors.kvkk.message}</p>}

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input type="checkbox" {...register('application_consent')} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-red-500 checked:bg-red-500" />
                      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                      Başvuru formunu doldurmanın üyelik garantisi oluşturmadığını; başvuruların uygunluk ve karşılıklı değer potansiyeli doğrultusunda değerlendirileceğini kabul ediyorum. *
                    </span>
                  </label>
                  {errors.application_consent && <p className="mt-1 text-xs text-red-500 pl-8">{errors.application_consent.message}</p>}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100">
              {currentStep > 0 ? (
                <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-6">
                  <ChevronLeft className="mr-2 h-5 w-5" /> Geri
                </Button>
              ) : (
                <div></div>
              )}

              {currentStep < STEPS.length - 1 ? (
                <Button type="button" variant="primary" onClick={nextStep} className="h-12 px-8 bg-gray-900 hover:bg-gray-800 shadow-md">
                  Devam Et <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button type="submit" variant="primary" isLoading={isSubmitting} className="h-14 px-8 text-lg font-bold bg-red-600 hover:bg-red-500 shadow-xl shadow-red-200">
                  Başvurumu Değerlendirmeye Gönder <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-6 pt-4 border-t border-gray-50">
              Event4Network’e yapılan başvurular; topluluğun nitelik standardı, uygunluk ve karşılıklı değer ilkesi doğrultusunda incelenir. Başvuru formunu doldurmak üyelik garantisi oluşturmaz.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
