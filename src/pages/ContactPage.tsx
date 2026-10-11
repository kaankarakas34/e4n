import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  Building,
  UserCheck,
  Calendar,
  Briefcase
} from 'lucide-react';
import { Button } from '../shared/Button';

const contactSchema = z.object({
  name: z.string().min(2, 'Lütfen adınızı ve soyadınızı giriniz'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Lütfen bir konu seçiniz'),
  message: z.string().min(10, 'Mesajınız en az 10 karakter olmalıdır')
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactPage() {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: 'Üyelik ve grup katılımı'
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      // Gerçek iletişim gönderimi simülasyonu
      await new Promise(resolve => setTimeout(resolve, 900));
      setIsSubmitted(true);
      reset();
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const helpTopics = [
    {
      title: "Üyelik ve grup katılımı",
      desc: "Abonelik, kabul süreci ve grup çalışma düzeni hakkında bilgi.",
      icon: UserCheck
    },
    {
      title: "Etkinlik ve konuşmacılık",
      desc: "Etkinlik katılımı, içerik önerileri ve konuşmacılık talepleri.",
      icon: Calendar
    },
    {
      title: "Kurumsal iş birliği",
      desc: "Mekân, sponsorluk ve ortak etkinlik önerileri.",
      icon: Briefcase
    },
    {
      title: "Mevcut üyelik desteği",
      desc: "Hesap, grup başvurusu veya üyelik durumuyla ilgili sorular.",
      icon: Building
    }
  ];

  return (
    <div className="bg-white min-h-screen pt-20 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <SEO
        title="E4N İletişim | Üyelik, Etkinlik ve İş Birliği"
        description="E4N üyeliği, kapalı grup katılımı, etkinlikler ve kurumsal iş birliği hakkında ekibe ulaşın. Talebinizi ilgili konu başlığıyla iletin."
        canonical="https://www.event4network.com/iletisim"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-slate-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6 backdrop-blur-sm">
            İletişim ve Danışma
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            E4N hakkında <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
              konuşalım
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Üyelik süreci, grup katılımı, açık etkinlikler veya kurumsal iş birliği hakkında sorularınızı iletebilirsiniz. Talebinizin konusunu seçerek bize kısa bir açıklama gönderin.
          </p>
        </div>
      </section>

      {/* Hangi konuda yardımcı olabiliriz? */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
              DESTEK ALANLARI
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hangi konuda yardımcı olabiliriz?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpTopics.map((topic, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                    <topic.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-2">{topic.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{topic.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İletişim Formu & Bilgiler */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Form Alanı */}
            <div className="bg-slate-50 p-8 sm:p-10 rounded-3xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Bize Mesaj Gönderin
              </h2>

              {isSubmitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-emerald-950 mb-2">
                    Mesajınız alındı.
                  </h3>
                  <p className="text-emerald-800 text-sm leading-relaxed mb-6">
                    Talebiniz seçtiğiniz konuya göre değerlendirilecek.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSubmitted(false)}
                    className="border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                  >
                    Yeni bir mesaj gönder
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {submitError && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-900 text-sm">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p>
                        Mesajınız gönderilemedi. Lütfen tekrar deneyin veya yayımlanan diğer iletişim kanalımızı kullanın.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Adınız Soyadınız"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      E-posta Adresi *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="adiniz@sirketiniz.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Telefon (Opsiyonel)
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Konu *
                    </label>
                    <select
                      {...register('subject')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Üyelik ve grup katılımı">Üyelik ve grup katılımı</option>
                      <option value="Etkinlik ve konuşmacılık">Etkinlik ve konuşmacılık</option>
                      <option value="Kurumsal iş birliği">Kurumsal iş birliği</option>
                      <option value="Mevcut üyelik desteği">Mevcut üyelik desteği</option>
                      <option value="Diğer soru ve görüşler">Diğer soru ve görüşler</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Mesajınız *
                    </label>
                    <textarea
                      rows={4}
                      {...register('message')}
                      placeholder="Talebinizi veya sorunuzu kısaca açıklayınız..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {errors.message && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.message.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    variant="primary"
                    disabled={isSubmitting}
                    className="w-full font-bold bg-red-600 hover:bg-red-500 text-white h-12 shadow-md shadow-red-900/20"
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              )}
            </div>

            {/* İletişim Bilgileri & Kurumsal Detaylar */}
            <div className="space-y-8">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-2">
                  İLETİŞİM KANALLARI
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-4">
                  Doğrudan İletişim
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Platformumuz, üyelik süreci veya kurumsal iş birliklerimiz hakkında resmi kanallarımız üzerinden bilgi alabilirsiniz.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Adres</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Pardus Ticaret Haydar Karakaş<br />
                      Çeliktepe, İsmet İnönü Cd. no:11 NO: 501<br />
                      34413 Kağıthane / İstanbul
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Telefon</h4>
                    <p className="text-slate-600 text-xs">
                      <a href="tel:05363197697" className="hover:text-red-600 transition-colors font-medium">
                        0536 319 7697
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">E-posta</h4>
                    <p className="text-slate-600 text-xs">
                      <a href="mailto:info@event4network.com" className="hover:text-red-600 transition-colors font-medium">
                        info@event4network.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Önce çalışma modelini inceleyebilirsiniz */}
              <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">
                  BİLGİ MERKEZİ
                </span>
                <h4 className="text-lg font-bold mb-2">
                  Önce çalışma modelini inceleyebilirsiniz
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed mb-6">
                  Üyelik, kapalı grup kabulü ve lonca katılımı farklı süreçlerdir. Nasıl Çalışır ve SSS sayfaları temel ayrımları öğrenmenize yardımcı olabilir.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/nasil-calisir')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-red-300 transition-colors"
                  >
                    <span>Nasıl Çalışır?</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate('/sikca-sorulan-sorular')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-red-300 transition-colors"
                  >
                    <span>Sıkça Sorulan Sorular</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
