import React, { useState } from 'react';
import { SEO } from '../components/SEO';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, Globe, ArrowRight, Check, Send } from 'lucide-react';
import { Button } from '../shared/Button';

const contactSchema = z.object({
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  subject: z.string().min(3, 'Konu en az 3 karakter olmalıdır'),
  message: z.string().min(10, 'Mesajınız en az 10 karakter olmalıdır')
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate sending contact request
      await new Promise(resolve => setTimeout(resolve, 1200));
      setIsSubmitted(true);
      reset();
    } catch (error) {
      console.error(error);
      alert('Bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <SEO
        title="İletişim | Event4Network"
        description="Event4Network iletişim kanalları. Adres, telefon, e-posta, sosyal medya adreslerimiz ve mesaj gönderim formu."
        canonical="https://www.event4network.com/iletisim"
      />

      {/* Hero Section */}
      <section className="relative py-24 bg-gray-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Bize Ulaşın
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            İletişim
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed font-light">
            Platformumuz, üyelik kriterleri veya kurumsal iş birliklerimiz hakkında detaylı bilgi almak için bizimle irtibata geçebilirsiniz.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Contact Details */}
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">
                  İletişim Kanallarımız
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Sorularınız için aşağıdaki kanallar üzerinden doğrudan destek alabilirsiniz.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Adres</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Pardus Ticaret Haydar Karakaş<br />
                      Çeliktepe, İsmet İnönü Cd. no:11 NO: 501<br />
                      34413 Kağıthane/İstanbul
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Telefon</h4>
                    <p className="text-gray-650 text-sm hover:text-red-600 transition-colors">
                      <a href="tel:05363197697">0536 319 7697</a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">E-posta</h4>
                    <p className="text-gray-655 text-sm hover:text-red-600 transition-colors">
                      <a href="mailto:info@event4network.com">info@event4network.com</a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Sosyal Medya</h4>
                    <p className="text-gray-650 text-sm">
                      <a href="https://www.instagram.com/event4network/" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 mr-4 transition-colors">Instagram</a>
                      <a href="https://www.linkedin.com/company/event4network/" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">LinkedIn</a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Mock Map Area */}
              <div className="h-64 bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 flex items-center justify-center relative">
                <div className="text-center p-4">
                  <MapPin className="h-10 w-10 text-red-600 mx-auto mb-2 animate-bounce" />
                  <p className="font-bold text-gray-900 text-sm">Event4Network Merkez Ofis</p>
                  <p className="text-gray-500 text-xs mt-1">Kağıthane, İstanbul</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 p-8 sm:p-12 rounded-3xl border border-gray-200/80 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Bize Mesaj Gönderin</h3>
              
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Mesajınız İletildi!</h4>
                  <p className="text-gray-600 text-sm mb-6">
                    Bizimle iletişime geçtiğiniz için teşekkür ederiz. Destek ekibimiz en kısa sürede dönüş sağlayacaktır.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsSubmitted(false)}
                    className="w-full justify-center"
                  >
                    Yeni Mesaj Gönder
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ad Soyad</label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Adınız ve Soyadınız"
                      className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta</label>
                      <input
                        type="email"
                        {...register('email')}
                        placeholder="E-posta adresiniz"
                        className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                      <input
                        type="text"
                        {...register('phone')}
                        placeholder="Telefon numaranız"
                        className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.phone ? 'border-red-300' : 'border-gray-200'}`}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Konu</label>
                    <input
                      type="text"
                      {...register('subject')}
                      placeholder="Mesajınızın konusu"
                      className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.subject ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mesajınız</label>
                    <textarea
                      {...register('message')}
                      rows={4}
                      placeholder="Lütfen mesajınızı detaylandırınız..."
                      className={`w-full p-4 bg-white border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-sm ${errors.message ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-12 text-sm font-bold bg-red-600 hover:bg-red-500 shadow-lg shadow-red-200 mt-4 justify-center"
                    isLoading={isSubmitting}
                  >
                    Gönder <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
