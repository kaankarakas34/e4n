import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Building2,
  Layers,
  Search,
  FileText,
  Users,
  Target,
  Share2,
} from 'lucide-react';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../shared/Button';
import { Alert, AlertDescription } from '../shared/Alert';
import {
  BUSINESS_DNA_SECTIONS,
  BUSINESS_DNA_QUESTIONS,
  SERVICE_DELIVERY_METHODS,
  BUSINESS_MODELS,
  CUSTOMER_TYPES,
  SECTORS_TAXONOMY,
  SERVICES_TAXONOMY,
  INTERESTS_TAXONOMY,
  GOALS_TAXONOMY,
  BusinessDnaAnswers,
  MemberBusinessProfile,
  StructuredProjectAnswer,
  ServiceDeliveryMethod,
} from '../data/businessDnaData';

export function BusinessDnaPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<BusinessDnaAnswers>({});
  const [profile, setProfile] = useState<MemberBusinessProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & custom entry states for taxonomies
  const [serviceSearch, setServiceSearch] = useState('');
  const [customService, setCustomService] = useState('');
  const [customSector, setCustomSector] = useState('');
  const [customCustomerType, setCustomCustomerType] = useState('');
  const [customNeedInput, setCustomNeedInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.getMyBusinessProfile();
      if (res?.profile) {
        setProfile(res.profile);
        const ans = res.profile.answers || {};
        // Auto-seed Q02 if profession exists on user
        if (!ans.q02?.profession && res.profession) {
          ans.q02 = { profession: res.profession };
        }
        setAnswers(ans);
        if (res.profile.currentStep && res.profile.status === 'draft') {
          setCurrentStep(res.profile.currentStep);
        }
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async (stepToSave = currentStep, silent = false) => {
    setIsSaving(true);
    try {
      const res: any = await api.saveBusinessProfileDraft(answers, stepToSave);
      if (res?.profile) {
        setProfile(res.profile);
      }
      if (!silent) {
        setNotification({ type: 'success', message: 'Taslak başarıyla kaydedildi.' });
        setTimeout(() => setNotification(null), 3500);
      }
    } catch (err: any) {
      if (!silent) {
        setNotification({ type: 'error', message: err.message || 'Taslak kaydedilirken hata oluştu.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = async () => {
    await handleSaveDraft(currentStep + 1, true);
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setNotification(null);
    try {
      const res: any = await api.completeBusinessProfile(answers);
      if (res?.profile) {
        setProfile(res.profile);
        setIsEditing(false);
        setNotification({ type: 'success', message: 'Tebrikler! Seviye 1 Üye İş DNA profiliniz başarıyla tamamlandı.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      let msg = err.message || 'Profil tamamlanırken doğrulama hatası oluştu.';
      try {
        const parsed = JSON.parse(err.responseBody || '{}');
        if (parsed.details && Array.isArray(parsed.details)) {
          msg = parsed.details.join(' • ');
        }
      } catch {}
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!profile) return;
    const nextVal = !profile.isPublicToGroup;
    try {
      const res: any = await api.updateBusinessProfileVisibility(nextVal);
      if (res?.profile) {
        setProfile(res.profile);
        setNotification({
          type: 'success',
          message: nextVal
            ? 'İş profiliniz grup arkadaşlarınızın incelemesine açıldı.'
            : 'İş profiliniz grup arkadaşlarınıza kapatıldı (Sadece Admin ve Grup Başkanı görebilir).',
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Görünürlük güncellenemedi.' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">İş DNA Bilgileriniz Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const isCompleted = profile?.status === 'completed' && !isEditing;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0e1b2d] text-white py-8 border-b border-slate-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/40">
                  <Sparkles className="w-3.5 h-3.5" /> Seviye 1 • Üye İş DNA'sı
                </span>
                <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                  Sürüm 1.0 • 16 Soru
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                İş ve Yönlendirme Profili
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Yapay zekâ algoritmamızın sizlere en nitelikli işleri yönlendirmesi ve kapalı grup başvurularınızı değerlendirmesi için faaliyetlerinizi yapılandırın.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs sm:text-sm"
              >
                Dashboard'a Dön
              </Button>
              {profile?.status === 'completed' && !isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm"
                >
                  Bilgileri Düzenle
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {notification && (
          <Alert variant={notification.type === 'success' ? 'default' : 'error'} className="mb-6">
            <AlertDescription className="font-semibold text-sm">{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Read-Only Profile Overview (If Completed and Not Editing) */}
        {isCompleted ? (
          <div className="space-y-6">
            {/* Privacy & Visibility Control Bar */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-2xl ${profile.isPublicToGroup ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                  {profile.isPublicToGroup ? <Globe className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Grup İçi Profil Görünürlüğü: {profile.isPublicToGroup ? 'Açık' : 'Kapalı (Gizli)'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                    {profile.isPublicToGroup
                      ? 'Profil özetiniz dahil olduğunuz gruptaki iş arkadaşlarınız tarafından görüntülenebilir. Bu sayede size daha nitelikli yönlendirmeler yapabilirler.'
                      : 'Profiliniz şu anda dışarıya kapalıdır. Sadece Admin ve Grup Başkanı görebilir. Arkadaşlarınızın sizi tanıması için açabilirsiniz.'}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleToggleVisibility}
                variant={profile.isPublicToGroup ? 'outline' : 'default'}
                className={profile.isPublicToGroup ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'bg-blue-600 hover:bg-blue-500 text-white font-bold'}
              >
                {profile.isPublicToGroup ? 'Görünürlüğü Kapat' : 'Grup Arkadaşlarına Aç'}
              </Button>
            </div>

            {/* Read-Only Answers Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-8">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Kayıtlı İş DNA Özeti</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Son güncelleme: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('tr-TR') : '-'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tamamlandı
                </span>
              </div>

              {/* Section 1 */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">A — İş ve Uzmanlık</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">Şirket Faaliyeti (Q01)</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{answers.q01 || '-'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">Ana Meslek (Q02)</span>
                    <p className="text-slate-800 font-bold">{answers.q02?.profession || '-'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block font-semibold mb-2">Sunulan Hizmetler ve İcra Yöntemi (Q03 & Q04)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {answers.q03?.map((svc) => (
                      <div key={svc} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-xs">{svc}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {SERVICE_DELIVERY_METHODS.find((m) => m.id === answers.q04?.[svc])?.label || 'Belirtilmemiş'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">B — Müşteri ve Sektör</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">Hedef Müşteriler (Q05)</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {answers.q05?.businessModels?.map((bm) => (
                        <span key={bm} className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                          {bm}
                        </span>
                      ))}
                      {answers.q05?.customerTypes?.map((ct) => (
                        <span key={ct} className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[11px] font-medium">
                          {ct}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">Geçmiş Sektörler (Q06)</span>
                    {answers.q06?.noExperience ? (
                      <span className="text-amber-700 italic">Henüz sektör deneyimi yok</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {answers.q06?.sectors?.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">Hedef Sektörler (Q07)</span>
                    {answers.q07?.notDetermined ? (
                      <span className="text-slate-500 italic">Henüz belirlenmedi</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {answers.q07?.sectors?.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-semibold">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block font-semibold mb-1">Çözülen İhtiyaçlar (Q08)</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-800 text-xs sm:text-sm font-medium">
                    {answers.q08?.map((need, idx) => (
                      <li key={idx}>{need}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">C — Gerçek İş Deneyimi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">Proje Örneği (Q09)</span>
                    {answers.q09?.hasCompletedProject ? (
                      <div className="space-y-1 text-slate-800">
                        <p><strong>Sektör:</strong> {answers.q09.sector}</p>
                        <p><strong>Müşteri Tipi:</strong> {answers.q09.customerType}</p>
                        <p><strong>İhtiyaç:</strong> {answers.q09.clientNeed}</p>
                        <p><strong>Yapılan İş:</strong> {answers.q09.workDone}</p>
                        <p><strong>Çıktı:</strong> {answers.q09.deliverable}</p>
                      </div>
                    ) : (
                      <span className="text-amber-700 italic">Henüz tamamlanmış proje yok / Hazırlık aşamasında</span>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">Sunulmayan / Kapsam Dışı İşler (Q10)</span>
                    <p className="text-slate-800 font-medium">{answers.q10 || 'Belirtilmedi'}</p>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">D — Network ve Yönlendirme</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">İdeal Müşteri Profili (Q11)</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{answers.q11 || '-'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">İş Birliği Yapılmak İstenen Meslekler (Q12)</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {answers.q12?.professions?.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-semibold">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">E — İlgi Alanları ve Beklentiler</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">İlgi Alanları (Q14)</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {answers.q14?.map((item) => (
                        <span key={item} className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[11px]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">E4N Amacı (Q15)</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-800 text-xs font-medium">
                      {answers.q15?.map((goal, idx) => (
                        <li key={idx}>{goal}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block font-semibold mb-1">Üyelere Katkı (Q16)</span>
                    <p className="text-slate-800 text-xs leading-relaxed">{answers.q16 || 'Belirtilmedi'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step-by-Step Interactive Form */
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            {/* Step Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                  Adım {currentStep} / 5 • {BUSINESS_DNA_SECTIONS[currentStep - 1].title}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {Math.round((currentStep / 5) * 100)}% Tamamlandı
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>

              {/* 5 Section Pills */}
              <div className="grid grid-cols-5 gap-2 mt-3">
                {BUSINESS_DNA_SECTIONS.map((sec) => (
                  <button
                    key={sec.step}
                    type="button"
                    onClick={() => {
                      handleSaveDraft(sec.step, true);
                      setCurrentStep(sec.step);
                    }}
                    className={`text-left p-2 rounded-xl transition-all ${
                      currentStep === sec.step
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold'
                        : sec.step < currentStep
                          ? 'text-slate-600 hover:bg-slate-50 font-medium'
                          : 'text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] block opacity-80">Bölüm {sec.step}</span>
                    <span className="text-xs truncate block">{sec.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 1: İŞ VE UZMANLIK */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Bölüm A — İş ve Uzmanlık</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Faaliyetlerinizi ve temel uzmanlık alanınızı tanımlayın.</p>
                </div>

                {/* Q01 */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q01 — Şirketiniz tam olarak ne iş yapıyor? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Kime, hangi ürün veya hizmeti sunduğunuzu somut biçimde anlatın (30-1000 karakter).</p>
                  <textarea
                    rows={4}
                    value={answers.q01 || ''}
                    onChange={(e) => setAnswers({ ...answers, q01: e.target.value })}
                    placeholder="Örn: Endüstriyel imalat şirketlerine özel depo ve stok yönetim yazılımları geliştiriyoruz..."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 block text-right">
                    {(answers.q01 || '').length} / 1000 karakter (Min: 30)
                  </span>
                </div>

                {/* Q02 */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q02 — Ana mesleğiniz veya faaliyet alanınız nedir? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Grup tekil temsil kuralı için birincil ana mesleğinizi belirtin.</p>
                  <input
                    type="text"
                    value={answers.q02?.profession || ''}
                    onChange={(e) => setAnswers({ ...answers, q02: { ...answers.q02, profession: e.target.value } })}
                    placeholder="Örn: Yazılım Geliştirici, Mali Müşavir, İç Mimar..."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Q03 */}
                <div className="space-y-2">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q03 — Hangi ürün veya hizmetleri sunuyorsunuz? (1–5 Hizmet) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Sunduğunuz en güçlü hizmetleri seçin veya kendiniz ekleyin.</p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      placeholder="Yeni hizmet ekle..."
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (!customService.trim()) return;
                        const curr = answers.q03 || [];
                        if (curr.length >= 5) return alert('En fazla 5 hizmet seçebilirsiniz.');
                        if (!curr.includes(customService.trim())) {
                          const next = [...curr, customService.trim()];
                          setAnswers({ ...answers, q03: next });
                        }
                        setCustomService('');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Ekle
                    </Button>
                  </div>

                  {/* Taxonomy chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SERVICES_TAXONOMY.map((item) => {
                      const selected = (answers.q03 || []).includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const curr = answers.q03 || [];
                            if (selected) {
                              setAnswers({ ...answers, q03: curr.filter((s) => s !== item.label) });
                            } else {
                              if (curr.length >= 5) return alert('En fazla 5 hizmet seçebilirsiniz.');
                              setAnswers({ ...answers, q03: [...curr, item.label] });
                            }
                          }}
                          className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                            selected
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '} {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q04 */}
                {(answers.q03 || []).length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="block text-sm font-extrabold text-slate-900">
                      Q04 — Bu hizmetleri nasıl sunuyorsunuz? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500">Seçtiğiniz her hizmet için icra biçimini belirleyin.</p>

                    <div className="space-y-2">
                      {answers.q03?.map((svc) => (
                        <div key={svc} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-800">{svc}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {SERVICE_DELIVERY_METHODS.map((method) => {
                              const active = answers.q04?.[svc] === method.id;
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => {
                                    const nextQ04 = { ...(answers.q04 || {}), [svc]: method.id };
                                    setAnswers({ ...answers, q04: nextQ04 });
                                  }}
                                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                                    active
                                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {method.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: MÜŞTERİ VE SEKTÖR */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Bölüm B — Müşteri ve Sektör</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Hedef müşteri tiplerinizi, geçmiş ve gelecek sektörlerinizi belirleyin.</p>
                </div>

                {/* Q05 */}
                <div className="space-y-3">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q05 — Kimlere hizmet veriyorsunuz? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">İş modelinizi ve çalıştığınız müşteri tiplerini seçin.</p>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">İş Modelleri:</span>
                    <div className="flex flex-wrap gap-2">
                      {BUSINESS_MODELS.map((bm) => {
                        const selected = (answers.q05?.businessModels || []).includes(bm.id);
                        return (
                          <button
                            key={bm.id}
                            type="button"
                            onClick={() => {
                              const curr = answers.q05?.businessModels || [];
                              const next = selected ? curr.filter((x) => x !== bm.id) : [...curr, bm.id];
                              setAnswers({
                                ...answers,
                                q05: { businessModels: next, customerTypes: answers.q05?.customerTypes || [] },
                              });
                            }}
                            className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all ${
                              selected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '} {bm.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">Müşteri Tipleri:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {CUSTOMER_TYPES.map((ct) => {
                        const selected = (answers.q05?.customerTypes || []).includes(ct.label);
                        return (
                          <button
                            key={ct.id}
                            type="button"
                            onClick={() => {
                              const curr = answers.q05?.customerTypes || [];
                              const next = selected ? curr.filter((x) => x !== ct.label) : [...curr, ct.label];
                              setAnswers({
                                ...answers,
                                q05: { businessModels: answers.q05?.businessModels || [], customerTypes: next },
                              });
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                              selected ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '} {ct.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Q06 */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q06 — Bugüne kadar hangi sektörlerde çalıştınız? (En fazla 5) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Geçmiş fiili iş tecrübenizi yansıtan sektörleri seçin.</p>

                  <label className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.q06?.noExperience || false}
                      onChange={(e) => {
                        setAnswers({
                          ...answers,
                          q06: { noExperience: e.target.checked, sectors: e.target.checked ? [] : answers.q06?.sectors || [] },
                        });
                      }}
                      className="rounded-sm"
                    />
                    <span>Henüz sektör deneyimim yok (Yeni kurulan işletme)</span>
                  </label>

                  {!answers.q06?.noExperience && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {SECTORS_TAXONOMY.map((sec) => {
                        const selected = (answers.q06?.sectors || []).includes(sec.label);
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              const curr = answers.q06?.sectors || [];
                              if (selected) {
                                setAnswers({ ...answers, q06: { noExperience: false, sectors: curr.filter((s) => s !== sec.label) } });
                              } else {
                                if (curr.length >= 5) return alert('En fazla 5 sektör seçebilirsiniz.');
                                setAnswers({ ...answers, q06: { noExperience: false, sectors: [...curr, sec.label] } });
                              }
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                              selected ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '} {sec.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Q07 */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q07 — Önümüzdeki dönemde hangi sektörlerde iş yapmak istiyorsunuz? (En fazla 3) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Hedeflediğiniz sektörleri seçin (Geçmiş tecrübelerden ayrı tutulur).</p>

                  <label className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.q07?.notDetermined || false}
                      onChange={(e) => {
                        setAnswers({
                          ...answers,
                          q07: { notDetermined: e.target.checked, sectors: e.target.checked ? [] : answers.q07?.sectors || [] },
                        });
                      }}
                      className="rounded-sm"
                    />
                    <span>Henüz belirlemedim / Sektör bağımsız çalışıyorum</span>
                  </label>

                  {!answers.q07?.notDetermined && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {SECTORS_TAXONOMY.map((sec) => {
                        const selected = (answers.q07?.sectors || []).includes(sec.label);
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              const curr = answers.q07?.sectors || [];
                              if (selected) {
                                setAnswers({ ...answers, q07: { notDetermined: false, sectors: curr.filter((s) => s !== sec.label) } });
                              } else {
                                if (curr.length >= 3) return alert('En fazla 3 hedef sektör seçebilirsiniz.');
                                setAnswers({ ...answers, q07: { notDetermined: false, sectors: [...curr, sec.label] } });
                              }
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                              selected ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '} {sec.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Q08 */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q08 — Müşterilerinizin hangi ihtiyaçlarını çözüyorsunuz? (1–3 Somut İhtiyaç) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Her biri 10 ile 250 karakter arasında somut bir müşteri acı noktası yazın.</p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customNeedInput}
                      onChange={(e) => setCustomNeedInput(e.target.value)}
                      placeholder="Örn: Stok maliyetlerini %30 azaltarak sipariş teslim süresini hızlandırma"
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (!customNeedInput.trim() || customNeedInput.trim().length < 10) {
                          return alert('İhtiyaç tanımı en az 10 karakter olmalıdır.');
                        }
                        const curr = answers.q08 || [];
                        if (curr.length >= 3) return alert('En fazla 3 ihtiyaç ekleyebilirsiniz.');
                        setAnswers({ ...answers, q08: [...curr, customNeedInput.trim()] });
                        setCustomNeedInput('');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Ekle
                    </Button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {answers.q08?.map((need, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{need}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = (answers.q08 || []).filter((_, i) => i !== idx);
                            setAnswers({ ...answers, q08: next });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: GERÇEK İŞ DENEYİMİ */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Bölüm C — Gerçek İş Deneyimi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Örnek bir proje tecrübenizi ve yapmadığınız işleri özetleyin.</p>
                </div>

                {/* Q09 */}
                <div className="space-y-3">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q09 — Son dönemde gerçekleştirdiğiniz bir işi kısaca anlatır mısınız? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Müşteri adı ve ticari sır vermeden, somut problemi ve çıktınızı yazın.</p>

                  <label className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!answers.q09?.hasCompletedProject}
                      onChange={(e) => {
                        const notDone = e.target.checked;
                        setAnswers({
                          ...answers,
                          q09: {
                            ...(answers.q09 || {}),
                            hasCompletedProject: !notDone,
                            note: notDone ? 'Henüz tamamlanmış projem yok / Ürün geliştirme aşamasındayım' : '',
                          },
                        });
                      }}
                      className="rounded-sm"
                    />
                    <span>Henüz tamamlanmış projem yok / Ürün hazırlık aşamasındayım</span>
                  </label>

                  {answers.q09?.hasCompletedProject !== false && (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Sektör:</label>
                        <input
                          type="text"
                          value={answers.q09?.sector || ''}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              q09: { ...(answers.q09 || {}), hasCompletedProject: true, sector: e.target.value },
                            })
                          }
                          placeholder="Örn: Otomotiv Yedek Parça İhracatı"
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Müşteri Tipi:</label>
                        <input
                          type="text"
                          value={answers.q09?.customerType || ''}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              q09: { ...(answers.q09 || {}), hasCompletedProject: true, customerType: e.target.value },
                            })
                          }
                          placeholder="Örn: 50 çalışanlı orta ölçekli üretici"
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Müşterinin İhtiyacı / Problemi:</label>
                        <input
                          type="text"
                          value={answers.q09?.clientNeed || ''}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              q09: { ...(answers.q09 || {}), hasCompletedProject: true, clientNeed: e.target.value },
                            })
                          }
                          placeholder="Örn: Siparişlerin takibi Excel üzerinden yapılıyordu ve kayıplar yaşanıyordu"
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Yaptığınız İş / Müdahale:</label>
                        <input
                          type="text"
                          value={answers.q09?.workDone || ''}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              q09: { ...(answers.q09 || {}), hasCompletedProject: true, workDone: e.target.value },
                            })
                          }
                          placeholder="Örn: Bulut tabanlı sipariş takip portalı kurduk ve barkod sistemine geçirdik"
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Teslim Edilen Çıktı:</label>
                        <input
                          type="text"
                          value={answers.q09?.deliverable || ''}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              q09: { ...(answers.q09 || {}), hasCompletedProject: true, deliverable: e.target.value },
                            })
                          }
                          placeholder="Örn: Canlıya alınan yazılım, çalışan eğitimi ve 6 aylık bakım kılavuzu"
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Q10 */}
                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q10 — Hangi işleri veya hizmetleri sunmuyorsunuz? (İsteğe bağlı)
                  </label>
                  <p className="text-xs text-slate-500">Size yanlış müşteri yönlendirilmesini engellemek için kapsam dışı işleri yazın (0-600 karakter).</p>
                  <textarea
                    rows={3}
                    value={answers.q10 || ''}
                    onChange={(e) => setAnswers({ ...answers, q10: e.target.value })}
                    placeholder="Örn: Bireysel tekil kullanıcılara hizmet vermiyoruz; kurumsal sözleşmeli çalışıyoruz..."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: NETWORK VE YÖNLENDİRME */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Bölüm D — Network ve Yönlendirme</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Gruptaki arkadaşlarınızın size en doğru müşterileri yönlendirebilmesi için kriterlerinizi netleştirin.</p>
                </div>

                {/* Q11 */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q11 — Size nasıl bir müşteri yönlendirilmesini istersiniz? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">İdeal müşterinizin profilini ve bütçe/ihtiyaç ölçeğini somutlaştırın (30-800 karakter).</p>
                  <textarea
                    rows={4}
                    value={answers.q11 || ''}
                    onChange={(e) => setAnswers({ ...answers, q11: e.target.value })}
                    placeholder="Örn: E-ticaret kanalını büyütmek isteyen, minimum 10 kişilik ekibi olan ve kurumsal dijital pazarlama bütçesi ayıran markalar..."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 block text-right">
                    {(answers.q11 || '').length} / 800 karakter (Min: 30)
                  </span>
                </div>

                {/* Q12 */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q12 — Hangi meslek gruplarıyla iş birliği yapmak istersiniz? (En fazla 8) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Ortak müşteri havuzu oluşturabileceğiniz (Power Team) meslekleri seçin.</p>

                  <label className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.q12?.notDetermined || false}
                      onChange={(e) => {
                        setAnswers({
                          ...answers,
                          q12: { notDetermined: e.target.checked, professions: e.target.checked ? [] : answers.q12?.professions || [] },
                        });
                      }}
                      className="rounded-sm"
                    />
                    <span>Henüz belirlemedim</span>
                  </label>

                  {!answers.q12?.notDetermined && (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Mali Müşavir',
                          'Avukat',
                          'Dijital Pazarlamacı',
                          'Yazılımcı',
                          'İç Mimar',
                          'Gayrimenkul Danışmanı',
                          'Sigortacı',
                          'Gümrük Müşaviri',
                          'İnsan Kaynakları Uzmanı',
                          'Matbaacı / Prodüksiyon',
                          'Etkinlik Organizatörü',
                          'Bankacı / Finans Danışmanı',
                        ].map((prof) => {
                          const selected = (answers.q12?.professions || []).includes(prof);
                          return (
                            <button
                              key={prof}
                              type="button"
                              onClick={() => {
                                const curr = answers.q12?.professions || [];
                                if (selected) {
                                  setAnswers({ ...answers, q12: { notDetermined: false, professions: curr.filter((p) => p !== prof) } });
                                } else {
                                  if (curr.length >= 8) return alert('En fazla 8 meslek seçebilirsiniz.');
                                  setAnswers({ ...answers, q12: { notDetermined: false, professions: [...curr, prof] } });
                                }
                              }}
                              className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                                selected ? 'bg-purple-700 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {selected ? '✓ ' : '+ '} {prof}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Q13 */}
                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q13 — Siz hangi ihtiyaçları olan müşterileri başka üyelere yönlendirebilirsiniz? (İsteğe bağlı)
                  </label>
                  <p className="text-xs text-slate-500">Müşterilerinizden duyduğunuz fakat sizin yapmadığınız talepleri belirtin.</p>
                  <textarea
                    rows={3}
                    value={answers.q13 || ''}
                    onChange={(e) => setAnswers({ ...answers, q13: e.target.value })}
                    placeholder="Örn: Marka tescili, depolama alanı ve kurumsal catering taleplerini yönlendirebilirim..."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: İLGİ ALANLARI VE BEKLENTİLER */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Bölüm E — İlgi Alanları ve Beklentiler</h3>
                  <p className="text-xs text-slate-500 mt-0.5">İş vizyonunuzu, topluluktan beklentinizi ve katkılarınızı paylaşın.</p>
                </div>

                {/* Q14 */}
                <div className="space-y-2">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q14 — İş hayatınızda özellikle ilgilendiğiniz konular nelerdir? (En fazla 10) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Kişisel/mesleki ilgi alanlarınızı seçin (Not: Yetkinlik/hizmet yerine geçmez).</p>

                  <div className="flex flex-wrap gap-1.5">
                    {INTERESTS_TAXONOMY.map((item) => {
                      const selected = (answers.q14 || []).includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const curr = answers.q14 || [];
                            if (selected) {
                              setAnswers({ ...answers, q14: curr.filter((i) => i !== item.label) });
                            } else {
                              if (curr.length >= 10) return alert('En fazla 10 konu seçebilirsiniz.');
                              setAnswers({ ...answers, q14: [...curr, item.label] });
                            }
                          }}
                          className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                            selected ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '} {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q15 */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q15 — E4N'ye katılmaktaki öncelikli amacınız nedir? (1–2 Seçim) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">En önemli 1 veya 2 hedefinizi seçin.</p>

                  <div className="space-y-2">
                    {GOALS_TAXONOMY.map((item) => {
                      const selected = (answers.q15 || []).includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const curr = answers.q15 || [];
                            if (selected) {
                              setAnswers({ ...answers, q15: curr.filter((g) => g !== item.label) });
                            } else {
                              if (curr.length >= 2) return alert('En fazla 2 amaç seçebilirsiniz.');
                              setAnswers({ ...answers, q15: [...curr, item.label] });
                            }
                          }}
                          className={`w-full text-left p-3 rounded-2xl border text-xs sm:text-sm transition-all flex items-center justify-between ${
                            selected
                              ? 'bg-slate-900 text-white border-slate-900 font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className="text-xs">{selected ? '✓ Seçildi' : '+'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q16 */}
                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-extrabold text-slate-900">
                    Q16 — Diğer E4N üyelerine hangi konularda katkı sağlayabilirsiniz? (İsteğe bağlı)
                  </label>
                  <p className="text-xs text-slate-500">Uzmanlığınızla topluluk üyelerine ne gibi değerler katabilirsiniz?</p>
                  <textarea
                    rows={3}
                    value={answers.q16 || ''}
                    onChange={(e) => setAnswers({ ...answers, q16: e.target.value })}
                    placeholder="Örn: Dış ticaret süreçleri ve devlet teşvikleri hakkında grup üyelerine ücretsiz deneyim aktarabilirim..."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-slate-300 text-slate-700 flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Önceki Adım
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleSaveDraft(currentStep, false)}
                  disabled={isSaving}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-xs"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Kaydediliyor...' : 'Taslağı Kaydet'}
                </Button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Kaydet ve Devam Et</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleComplete}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-black px-7 py-3 rounded-xl text-sm shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Seviye 1 İş DNA'sını Tamamla</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default BusinessDnaPage;
