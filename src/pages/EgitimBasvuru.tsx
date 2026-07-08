import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, User, Mail, Phone, Briefcase, 
  FileText, CheckCircle, GraduationCap, ShieldCheck 
} from 'lucide-react';
import { Button } from '../shared/Button';
import { api } from '../api/api';

const egitimFormSchema = z.object({
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz (en az 10 karakter)'),
  work_status: z.string().min(1, 'Lütfen çalışma durumunuzu seçiniz'),
  why_join: z.string().min(10, 'Lütfen bu eğitimi neden almak istediğinizi açıklayınız (en az 10 karakter)'),
  kvkk: z.boolean().refine(val => val === true, {
    message: 'KVKK bilgilendirmesini onaylamanız zorunludur'
  })
});

type EgitimFormData = z.infer<typeof egitimFormSchema>;

export function EgitimBasvuru() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EgitimFormData>({
    resolver: zodResolver(egitimFormSchema)
  });

  const onSubmit = async (data: EgitimFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        profession: data.work_status,
        source: 'education_application',
        why_join: data.why_join,
        kvkk_accepted: true,
        company: data.work_status === 'Şirketim var' ? 'Şirket Sahibi' : data.work_status,
        form_data: {
          work_status: data.work_status,
          why_take_training: data.why_join
        }
      };

      await api.submitPublicVisitorApplication(payload);
      setIsSubmitted(true);
      reset();
    } catch (error) {
      console.error(error);
      alert('Başvuru gönderilirken bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 flex flex-col justify-center">
      <Helmet>
        <title>Networking Eğitimi Başvuru Formu | Event4Network</title>
      </Helmet>

      <div className="max-w-xl w-full mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/egitim')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Eğitim Bilgilerine Dön
        </button>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Networking Eğitimi Başvurusu
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Lütfen formu eksiksiz doldurunuz. Başvurunuz ekibimiz tarafından değerlendirilecektir.
            </p>
          </div>

          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Başvurunuz Alındı!</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Networking Eğitimi başvurunuz başarıyla kaydedilmiştir. En kısa sürede sizinle iletişime geçeceğiz.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="primary"
                  className="w-full h-11 font-bold"
                >
                  Yeni Başvuru Yap
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full h-11"
                >
                  Anasayfaya Dön
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <User className="w-4 h-4 text-slate-400" /> Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Adınız ve soyadınız"
                  className={`block w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-slate-400" /> E-posta Adresi <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="E-posta adresiniz"
                  className={`block w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-slate-400" /> Telefon Numarası <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="5xxxxxxxxx"
                  className={`block w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-slate-400" /> Çalışma Durumunuz / Ünvanınız <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('work_status')}
                  className={`block w-full rounded-xl border px-4 py-3 text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${errors.work_status ? 'border-red-500' : 'border-slate-200'}`}
                >
                  <option value="">Seçiniz</option>
                  <option value="Beyaz yaka çalışanım">Beyaz yaka çalışanım</option>
                  <option value="Şirketim var">Şirketim var</option>
                  <option value="Öğrenciyim">Öğrenciyim</option>
                  <option value="Girişimciyim">Girişimciyim</option>
                  <option value="Diğer">Diğer</option>
                </select>
                {errors.work_status && <p className="mt-1.5 text-xs text-red-500">{errors.work_status.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-slate-400" /> Bu Eğitimi Neden Almak İstiyorsunuz? <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  {...register('why_join')}
                  placeholder="Eğitime katılma nedeniniz, hedefleriniz ve beklentileriniz..."
                  className={`block w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${errors.why_join ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.why_join && <p className="mt-1.5 text-xs text-red-500">{errors.why_join.message}</p>}
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="kvkk-check-basvuru"
                  {...register('kvkk')}
                  className="w-4 h-4 rounded text-red-655 border-slate-300 focus:ring-red-500 focus:ring-2 mt-0.5 cursor-pointer"
                />
                <label htmlFor="kvkk-check-basvuru" className="text-xs text-slate-650 cursor-pointer select-none leading-normal">
                  Eğitim başvurum kapsamında paylaştığım kişisel verilerimin <a href="/kvkk" target="_blank" className="font-semibold text-red-600 hover:underline">KVKK Aydınlatma Metni</a> uyarınca işlenmesine, saklanmasına ve iletişim amaçlı kullanılmasına izin veriyorum. <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.kvkk && <p className="text-xs text-red-500 mt-1">{errors.kvkk.message}</p>}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full h-12 text-sm font-bold shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Başvuruluyor...
                    </>
                  ) : (
                    <>
                      Başvuruyu Tamamla <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
