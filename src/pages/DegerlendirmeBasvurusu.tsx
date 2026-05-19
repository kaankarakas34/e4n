import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Check, User, Mail, Phone, Building, Briefcase, ArrowRight, Search, X, Globe, Clock, Target, HelpCircle, Award } from 'lucide-react';
import { Button } from '../shared/Button';
import { api } from '../api/api';

const applicationSchema = z.object({
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  company: z.string().min(2, 'Şirket/marka adı en az 2 karakter olmalıdır'),
  title: z.string().min(2, 'Ünvan bilgisi gereklidir'),
  web_linkedin: z.string().min(3, 'Web sitesi veya LinkedIn profili giriniz'),
  profession: z.string().min(2, 'Uzmanlık alanı gereklidir'),
  activity_area: z.string().min(3, 'Faaliyet alanı gereklidir'),
  duration: z.string().min(1, 'Şirket faaliyet süresi seçimi gereklidir'),
  target_customer: z.string().min(10, 'Hedef müşteri profilinizi detaylandırınız (en az 10 karakter)'),
  why_join: z.string().min(10, 'Neden katılmak istediğinizi açıklayınız (en az 10 karakter)'),
  value_add: z.string().min(10, 'Gruba katacağınız değerleri açıklayınız (en az 10 karakter)'),
  previous_groups: z.string().min(2, 'Bu alanı doldurmanız gerekmektedir'),
  kvkk: z.boolean().refine(val => val === true, {
    message: 'KVKK aydınlatma metnini onaylamanız gerekmektedir'
  })
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export function DegerlendirmeBasvurusu() {
  const navigate = useNavigate();
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

  const { register, handleSubmit, formState: { errors } } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema)
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      await api.submitPublicVisitorApplication({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        profession: data.profession,
        title: data.title,
        web_linkedin: data.web_linkedin,
        activity_area: data.activity_area,
        duration: data.duration,
        target_customer: data.target_customer,
        why_join: data.why_join,
        value_add: data.value_add,
        previous_groups: data.previous_groups,
        kvkk_accepted: true,
        source: 'degerlendirme_formu',
        inviter_id: selectedReferral ? selectedReferral.id : undefined
      });
      setIsSubmitted(true);
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
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200 shadow-md">
            <Check className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Değerlendirme Başvurunuz Alındı</h1>
          <p className="text-gray-650 text-lg mb-8 leading-relaxed">
            Başvurunuz sisteme başarıyla kaydedilmiştir. Değerlendirme ekibimiz mesleki profilinizi, meslek koltuğu uygunluğunu ve karşılıklı değer potansiyelini inceledikten sonra en kısa sürede sizinle iletişime geçecektir.
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
        <title>Değerlendirme Başvurusu | Event4Network</title>
        <meta name="description" content="Event4Network üyelik değerlendirme başvuru formu. Mesleki profiliniz, hedefleriniz ve gruba katabileceğiniz değerler ile aramıza katılın." />
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
                Ön Değerlendirme Formu
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Değerlendirme Başvurusu
              </h1>
              <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                <strong>Event4Network’e katılım, değerlendirme süreciyle ilerler.</strong> Başvurular; iş profili, profesyonel temsil gücü, katılım disiplini ve karşılıklı değer potansiyeli doğrultusunda incelenir.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 sm:p-12 space-y-8">
            
            {/* Kişisel ve İletişim Bilgileri */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">Kişisel ve İletişim Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Adınız ve Soyadınız"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.name ? 'border-red-300' : 'border-gray-250'}`}
                    />
                  </div>
                  {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('phone')}
                      placeholder="0555 123 45 67"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.phone ? 'border-red-300' : 'border-gray-250'}`}
                    />
                  </div>
                  {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">E-posta Adresi</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="ornek@sirketiniz.com"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.email ? 'border-red-300' : 'border-gray-250'}`}
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            {/* Mesleki ve Kurumsal Profil */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">Kurumsal Profil Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Şirket / Marka Adı</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('company')}
                      placeholder="Şirketinizin veya markanızın adı"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.company ? 'border-red-300' : 'border-gray-250'}`}
                    />
                  </div>
                  {errors.company && <p className="mt-1.5 text-xs text-red-500">{errors.company.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ünvanınız</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="Örn: Kurucu Ortak, Genel Müdür, Danışman"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.title ? 'border-red-300' : 'border-gray-250'}`}
                    />
                  </div>
                  {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Web Sitesi / LinkedIn Profili</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('web_linkedin')}
                      placeholder="linkedin.com/in/profiliniz veya sirket.com"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.web_linkedin ? 'border-red-300' : 'border-gray-250'}`}
                    />
                  </div>
                  {errors.web_linkedin && <p className="mt-1.5 text-xs text-red-500">{errors.web_linkedin.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Meslek / Uzmanlık Alanı</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('profession')}
                      placeholder="Net uzmanlık alanınız (Meslek Koltuğunuz)"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.profession ? 'border-red-300' : 'border-gray-250'}`}
                    />
                  </div>
                  {errors.profession && <p className="mt-1.5 text-xs text-red-500">{errors.profession.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Şirket Faaliyet Süresi</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      {...register('duration')}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm appearance-none ${errors.duration ? 'border-red-300' : 'border-gray-250'}`}
                    >
                      <option value="">Seçiniz</option>
                      <option value="0-1">0 - 1 Yıl</option>
                      <option value="1-3">1 - 3 Yıl</option>
                      <option value="3-5">3 - 5 Yıl</option>
                      <option value="5+">5+ Yıl</option>
                    </select>
                  </div>
                  {errors.duration && <p className="mt-1.5 text-xs text-red-500">{errors.duration.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hizmet / Faaliyet Alanı</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('activity_area')}
                      placeholder="Şirketinizin ana faaliyet konusu"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.activity_area ? 'border-red-300' : 'border-gray-250'}`}
                    />
                  </div>
                  {errors.activity_area && <p className="mt-1.5 text-xs text-red-500">{errors.activity_area.message}</p>}
                </div>
              </div>
            </div>

            {/* Sorular ve Hedefler */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">İş Ağından Beklentiler ve Katkılar</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hedef Müşteri Profiliniz Nedir?</label>
                  <textarea
                    {...register('target_customer')}
                    rows={3}
                    placeholder="Hangi marka, sektör ya da ünvanlardaki kişilerle ticari referans kurmak istersiniz?"
                    className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.target_customer ? 'border-red-300' : 'border-gray-250'}`}
                  />
                  {errors.target_customer && <p className="mt-1.5 text-xs text-red-500">{errors.target_customer.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event4Network’e Neden Dahil Olmak İstiyorsunuz?</label>
                  <textarea
                    {...register('why_join')}
                    rows={3}
                    placeholder="Bu ekosisteme katılma hedeflerinizi detaylandırınız."
                    className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.why_join ? 'border-red-300' : 'border-gray-250'}`}
                  />
                  {errors.why_join && <p className="mt-1.5 text-xs text-red-500">{errors.why_join.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gruba ve Diğer Üyelere Nasıl Değer Katabilirsiniz?</label>
                  <textarea
                    {...register('value_add')}
                    rows={3}
                    placeholder="Referans ağınız, tecrübeniz ya da sektörel bağlantılarınızla gruba ne tür katkılar sunabilirsiniz?"
                    className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.value_add ? 'border-red-300' : 'border-gray-250'}`}
                  />
                  {errors.value_add && <p className="mt-1.5 text-xs text-red-500">{errors.value_add.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Daha Önce Benzer Bir Networking Yapısında / Grubunda Yer Aldınız mı?</label>
                  <input
                    type="text"
                    {...register('previous_groups')}
                    placeholder="Evet ise hangi yapılar, ne kadar süreyle? Hayır ise 'Hayır' yazabilirsiniz."
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.previous_groups ? 'border-red-300' : 'border-gray-250'}`}
                  />
                  {errors.previous_groups && <p className="mt-1.5 text-xs text-red-500">{errors.previous_groups.message}</p>}
                </div>
              </div>
            </div>

            {/* Referans Üye Arama */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Referans Üye (Sizi davet eden Event4Network üyesi - Opsiyonel)</label>
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
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm"
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

            {/* KVKK ve Gönderim */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center mt-0.5">
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
                  <a href="/kvkk" target="_blank" className="font-semibold text-red-650 hover:text-red-700 underline">KVKK Aydınlatma Metni</a>’ni okudum, kişisel verilerimin işlenmesine izin veriyorum.
                </span>
              </label>
              {errors.kvkk && <p className="mt-1 text-xs text-red-500">{errors.kvkk.message}</p>}

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-14 text-lg font-bold bg-red-600 hover:bg-red-500 shadow-xl shadow-red-200"
                  isLoading={isSubmitting}
                >
                  Değerlendirme Başvurusunu Gönder <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4">
                * Başvuru yapmak üyelik garantisi oluşturmaz.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
