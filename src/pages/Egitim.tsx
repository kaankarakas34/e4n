import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  BookOpen, Users, Check, Award, ChevronRight, ArrowRight, 
  User, Mail, Phone, Briefcase, FileText, CheckCircle, 
  HelpCircle, Star, Target, ShieldCheck
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

export function Egitim() {
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
        profession: data.work_status, // Mapping status selection to profession
        source: 'education_application',
        why_join: data.why_join, // Mapping "why want to take" to why_join
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
    <div className="min-h-screen bg-slate-50 pt-20">
      <Helmet>
        <title>Networking Eğitimi | Event4Network</title>
        <meta name="description" content="Kalıcı, güçlü ve güvene dayalı iş ilişkileri kurmanın mantığını öğrenin. Satış odaklı değil, değer odaklı networking yaklaşımıyla işinizi büyütün." />
      </Helmet>

      {/* Hero Banner Section */}
      <section className="relative py-20 lg:py-28 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-red-900/10 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/5 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-650/10 text-red-500 border border-red-555/20 uppercase tracking-wider mb-6">
              <BookOpen className="w-3.5 h-3.5" /> Özel Eğitim Programı
            </span>
            <h1 id="main-title" className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-white mb-6">
              Networking Eğitimi
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-light mb-8">
              Kartvizit toplamanın, rastgele bağlantılar kurmanın ve ilk görüşmede satış yapmaya çalışmanın ötesine geçerek; kalıcı, güçlü ve zamanla iş fırsatlarına dönüşen iş ilişkileri inşa edin.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="#application-form" 
                className="inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-bold rounded-xl text-white bg-red-600 hover:bg-red-550 hover:scale-[1.02] transform transition-all shadow-lg shadow-red-600/25"
              >
                Hemen Başvur <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              <a 
                href="#whats-included" 
                className="inline-flex items-center justify-center px-6 py-3.5 border border-slate-700 text-base font-bold rounded-xl text-slate-300 hover:text-white hover:bg-white/5 hover:border-slate-650 transition-all"
              >
                Detayları İncele
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 mb-12 lg:mb-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
                Doğru İş Bağlantıları Nasıl Oluşur?
              </h2>
              <div className="space-y-6 text-slate-650 text-base sm:text-lg leading-relaxed">
                <p>
                  Networking, yalnızca daha fazla insan tanımak değildir. Asıl mesele; doğru insanlarla, doğru zeminde, güvene dayalı ilişkiler kurabilmektir.
                </p>
                <p>
                  Bugün birçok kişi networking’i kartvizit toplamak, LinkedIn bağlantısı artırmak ya da ilk görüşmede satış yapmak olarak görüyor. Oysa gerçek networking; <strong>satıştan önce güven, talepten önce değer, bağlantıdan önce ilişki kurabilmektir.</strong>
                </p>
                <p>
                  Bu eğitim, iş dünyasında daha güçlü ilişkiler kurmak, doğru çevreye ulaşmak ve bu ilişkileri zaman içinde iş birliğine dönüştürmek isteyen profesyoneller için tasarlandı.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-slate-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Star className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-500" /> Eğitimin Özü
                </h3>
                <blockquote className="text-slate-300 italic text-base leading-relaxed mb-6">
                  "İş dünyasında fırsatlar çoğu zaman yalnızca ne bildiğinizle değil, kimin size güvendiğiyle de ilgilidir. İnsanlar sizi tanıdığı için değil, size güvendiği için tavsiye eder."
                </blockquote>
                <div className="border-t border-slate-800 pt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-650/10 flex items-center justify-center text-red-500 font-bold text-xs">✔</div>
                  <p className="text-xs text-slate-400">Güven esaslı ilişki inşası metodolojisi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Objectives Section */}
      <section id="whats-included" className="py-20 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">EĞİTİM KAZANIMLARI</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Bu Eğitimde Ne Öğreneceksiniz?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Stratejik networking yaklaşımından sürdürülebilir iş birliği yönetimine kadar ihtiyacınız olan tüm beceriler.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Networking Nedir ve Ne Değildir?",
                desc: "Networking’in gerçekte ne olduğunu ve ne olmadığını teorik ve pratik farklarla öğreneceiniz."
              },
              {
                title: "Doğru İlk İzlenim Bırakma",
                desc: "İlk tanışmalarda nasıl doğru izlenim bırakacağınızı, kendinizi nasıl daha net ve güçlü ifade edeceğinizi göreceksiniz."
              },
              {
                title: "Değer Odaklı Bakış Açısı",
                desc: "“Ne alabilirim?” yaklaşımı yerine “Nasıl değer katabilirim?” bakış açısını kazanacaksınız."
              },
              {
                title: "Contact ile Connection Farkı",
                desc: "Contact ile connection arasındaki farkı anlayacak, yalnızca insan tanımanın değil, güvenilir bir ilişki kurmanın önemini öğreneceksiniz."
              },
              {
                title: "İlişkiyi Sıcak Tutma Metotları",
                desc: "İlk temas sonrası ilişkiyi nasıl sürdüreceğinizi, takip mesajlarını nasıl yazacağınızı ve bağlantıları nasıl sıcak tutacağınızı göreceksiniz."
              },
              {
                title: "Güven Odaklı Satış Fırsatları",
                desc: "Satış odaklı değil, güven odaklı bir networking yaklaşımıyla nasıl daha güçlü iş fırsatları doğabileceğini öğreneceksiniz."
              }
            ].map((obj, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 bg-red-50 text-red-650 rounded-xl flex items-center justify-center mb-6 font-bold group-hover:bg-red-600 group-hover:text-white transition-colors">
                  0{i + 1}
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-3">{obj.title}</h4>
                <p className="text-sm text-slate-550 leading-relaxed">{obj.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 mb-12 lg:mb-0">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">HEDEF KİTLE</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2 mb-6">
                Kimler Katılmalı?
              </h2>
              <p className="text-slate-650 text-base leading-relaxed mb-6">
                Bu eğitim; iş dünyasında daha güçlü ilişkiler kurmak, doğru insanlarla tanışmak, çevresini nitelikli şekilde büyütmek ve bu ilişkileri zaman içinde fırsata dönüştürmek isteyen herkes için tasarlandı.
              </p>
              <p className="text-slate-650 text-base leading-relaxed">
                Bu eğitim yalnızca “daha fazla insan tanımak” isteyenler için değil; tanıştığı insanlarla güven kurmak, doğru izlenim bırakmak, ilişkiyi sürdürebilmek ve zaman içinde değer yaratan bağlantılar oluşturmak isteyenler içindir.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "İş sahipleri, girişimciler, kurucu ortaklar",
                  "Yöneticiler, beyaz yakalı profesyoneller",
                  "Satış ekipleri, iş geliştirme uzmanları",
                  "Danışmanlar ve serbest çalışanlar (freelancer)",
                  "Yeni mezunlar ve kariyerin başındaki öğrenciler",
                  "Sektöründe daha görünür olmak isteyen profesyoneller"
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200/50 flex gap-3">
                    <CheckCircle className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-800 leading-normal">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Education Section */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-650 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-4">NEDEN BU EĞİTİM?</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 leading-tight">
            Çünkü iyi pazarlama sizi A’dan B’ye götürebilir.<br />Ama doğru network sizi çok daha ileriye taşıyabilir.
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto font-light">
            İş dünyasında fırsatlar çoğu zaman yalnızca ne bildiğinizle değil, kimin size güvendiğiyle de ilgilidir. İnsanlar sizi tanıdığı için değil, size güvendiği için tavsiye eder. Bu eğitimde, o güveni nasıl oluşturacağınızı öğreneceksiniz.
          </p>
        </div>
      </section>

      {/* Course Contents Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">EĞİTİM MÜFREDATI</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 mb-4">
              Eğitim İçeriği
            </h2>
            <p className="text-slate-500 text-sm">
              Eğitim boyunca ele alacağımız ana başlıklar
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
              {[
                "Networking nedir, ne değildir?",
                "Kartvizit toplamak neden networking değildir?",
                "İlk görüşmede satış yapmaya çalışmak neden ilişkiyi zedeler?",
                "Güven inşası nasıl yapılır?",
                "Contact ve connection arasındaki fark nedir?",
                "Doğru çevre nasıl oluşturulur?",
                "Değer odaklı ilişki kurma modeli nedir?",
                "İlk temas sonrası takip süreci nasıl yönetilir?",
                "Referans alınabilir biri olmak ne demektir?",
                "İş ilişkileri nasıl sürdürülebilir hale getirilir?"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-200/40">
                  <ChevronRight className="w-4 h-4 text-red-650 flex-shrink-0" />
                  <span className="text-slate-700 text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Outcome Section */}
      <section className="py-20 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award className="w-12 h-12 text-red-600 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
            Eğitimin Kazanımları
          </h2>
          <p className="text-slate-650 text-base sm:text-lg leading-relaxed mb-6">
            Bu eğitimin sonunda networking’e daha stratejik bakabilecek, tanıştığınız insanlarla daha doğru iletişim kurabilecek ve ilişkilerinizi yalnızca bağlantı seviyesinde bırakmadan güvene dayalı iş birliklerine dönüştürebileceksiniz.
          </p>
          <p className="text-slate-650 text-base sm:text-lg leading-relaxed font-semibold">
            Daha net bir tanışma dili, daha güçlü bir takip yöntemi ve daha bilinçli bir ilişki yönetimi yaklaşımı kazanacaksınız.
          </p>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="application-form" className="py-20 bg-white relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">KATILIM FORMU</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 mb-4">
              Eğitime Başvurun
            </h2>
            <p className="text-slate-600 text-sm max-w-lg mx-auto">
              Networking’i yalnızca insan tanımak olarak değil, değer yaratan ilişkiler kurmak olarak görmek istiyorsanız bu eğitim sizin için hazırlandı. Formu doldurarak ön başvurunuzu yapabilirsiniz.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl relative">
            {isSubmitted ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Başvurunuz Alındı!</h3>
                <p className="text-slate-600 mb-6">
                  Networking Eğitimi başvurunuz başarıyla kaydedilmiştir. En kısa sürede sizinle iletişime geçeceğiz.
                </p>
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="primary"
                  className="px-6 py-2.5 font-bold"
                >
                  Yeni Başvuru Yap
                </Button>
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

                <div className="grid sm:grid-cols-2 gap-6">
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
                    id="kvkk-check"
                    {...register('kvkk')}
                    className="w-4 h-4 rounded text-red-650 border-slate-300 focus:ring-red-500 focus:ring-2 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="kvkk-check" className="text-xs text-slate-650 cursor-pointer select-none leading-normal">
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
                        Başvuruyu Gönder <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
