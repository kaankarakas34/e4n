import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { Shield, CheckCircle, Globe, Users, CreditCard, LogOut } from 'lucide-react';
import { Button } from '../shared/Button';

export function PaymentLanding() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [iframeToken, setIframeToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'4_MONTHS' | '8_MONTHS' | '12_MONTHS'>('12_MONTHS');

    // Get reason from state or query params (e.g., 'expired', 'initial')
    const reason = (location.state as any)?.reason || 'expired';

    // Base monthly rate for comparison (4 Months: 10,000 / 4 = 2,500)
    const BASE_MONTHLY_RATE = 2500;

    const PLANS = {
        '4_MONTHS': {
            id: '4_MONTHS',
            title: '4 Aylık Üyelik',
            months: 4,
            basePrice: 10000,
            basePriceStr: '10.000 TL',
            vat: 2000,
            totalPrice: 12000,
            totalStr: '12.000 TL',
            description: 'Kısa dönem başlangıç paketi',
            discountPercent: 0
        },
        '8_MONTHS': {
            id: '8_MONTHS',
            title: '8 Aylık Üyelik',
            months: 8,
            basePrice: 17500,
            basePriceStr: '17.500 TL',
            vat: 4000,
            totalPrice: 21500,
            totalStr: '21.500 TL',
            description: 'Orta vadeli avantajlı paket',
            discountPercent: 12.5 // (2500 - (17500/8)) / 2500 = 12.5%
        },
        '12_MONTHS': {
            id: '12_MONTHS',
            title: 'Yıllık Üyelik',
            months: 12,
            basePrice: 24000,
            basePriceStr: '24.000 TL',
            vat: 4800,
            totalPrice: 28800,
            totalStr: '28.800 TL',
            description: 'En avantajlı tam kapsamlı paket',
            recommended: true,
            discountPercent: 20 // (2500 - (24000/12)) / 2500 = 20%
        }
    };

    const [billingInfo, setBillingInfo] = useState({
        type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'CORPORATE',
        name: user?.name || '',
        identityNumber: '',
        companyName: '',
        taxOffice: '',
        taxNumber: '',
        city: (user as any)?.city || '', // Assuming simplified user object might have city or we use loose typing
        address: '',
        phone: user?.phone || ''
    });

    const [showIframe, setShowIframe] = useState(false);

    useEffect(() => {
        // If no user, redirect to login unless it's a new registration flow handled differently
        if (!user) {
            navigate('/auth/login');
            return;
        }
        // Pre-fill some info if possible
        if (user) {
            setBillingInfo(prev => ({
                ...prev,
                name: user.name || '',
                phone: user.phone || ''
            }));
        }
    }, [user, navigate]);

    // Reset iframe when plan changes to force re-confirmation
    useEffect(() => {
        setShowIframe(false);
        setIframeToken(null);
    }, [selectedPlan]);

    const handleBillingChange = (field: string, value: string) => {
        setBillingInfo(prev => ({ ...prev, [field]: value }));
        setShowIframe(false); // Reset if they change details
    };

    const startPaymentProcess = () => {
        // Simple validation
        if (!billingInfo.address || !billingInfo.city || !billingInfo.phone) {
            setError('Lütfen fatura adresi, şehir ve telefon alanlarını doldurunuz.');
            return;
        }
        if (billingInfo.type === 'CORPORATE' && (!billingInfo.companyName || !billingInfo.taxNumber)) {
            setError('Lütfen şirket ünvanı ve vergi numarası giriniz.');
            return;
        }

        initializePayment(selectedPlan);
    };

    const initializePayment = async (planId: keyof typeof PLANS) => {
        setLoading(true);
        setError(null);
        setIframeToken(null);
        setShowIframe(true);

        try {
            const plan = PLANS[planId];
            const fullAddress = `${billingInfo.address} ${billingInfo.city}`;

            const response = await api.getPaymentToken({
                amount: plan.totalPrice,
                currency: 'TL',
                installment: '0',
                plan: planId,
                user_name: billingInfo.name,
                user_address: fullAddress,
                user_phone: billingInfo.phone,
                billing_info: billingInfo
            });

            if (response.token) {
                setIframeToken(response.token);
            } else {
                setError('Ödeme sistemi yanıt vermedi.');
                setShowIframe(false);
            }
        } catch (err: any) {
            console.error(err);
            setError('Ödeme başlatılamadı. Lütfen bilgilerinizi kontrol edin.');
            setShowIframe(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            {/* Left Side - Value Prop */}
            <div className="md:w-5/12 bg-gradient-to-br from-red-700 to-red-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex">
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-8">
                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-red-700 font-bold text-xl">E4N</span>
                        </div>
                        <span className="text-xl font-medium tracking-wide opacity-90">Event 4 Network</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                        {reason === 'expired' ? 'Üyeliğinizi Yenileyin' : 'Profesyonel Ağınıza Katılın'}
                    </h1>
                    <p className="text-base text-red-100 mb-8 max-w-md">
                        {reason === 'expired'
                            ? 'Aktif ağınızda kalmaya devam etmek ve fırsatları kaçırmamak için üyeliğinizi hemen yenileyin.'
                            : 'Global iş dünyasına açılan kapınız. Hemen üyeliğinizi başlatın.'}
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-red-800 rounded-lg">
                                <Globe className="h-5 w-5 text-red-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Global Erişim</h3>
                                <p className="text-red-200 text-xs">Dünya çapında binlerce profesyonelle bağlantı kurun.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-red-800 rounded-lg">
                                <Users className="h-5 w-5 text-red-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Loncalar</h3>
                                <p className="text-red-200 text-xs">Sizin için çalışan özel ekipler.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-8 text-xs text-red-300">
                    &copy; 2025 Event 4 Network. Tüm hakları saklıdır.
                </div>
            </div>

            {/* Right Side - Payment */}
            <div className="md:w-7/12 p-4 md:p-8 bg-gray-50 flex flex-col overflow-y-auto h-screen">
                <div className="max-w-3xl mx-auto w-full pb-20">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Üyelik Planı & Ödeme</h2>
                        <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 flex items-center">
                            <LogOut className="h-4 w-4 mr-1" /> Çıkış
                        </button>
                    </div>

                    {/* Plan Selection Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {(Object.values(PLANS) as any[]).map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => !showIframe && setSelectedPlan(plan.id)}
                                className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${selectedPlan === plan.id
                                    ? 'border-red-600 bg-white shadow-lg transform scale-105 z-10'
                                    : 'border-gray-200 bg-white hover:border-red-200'
                                    } ${showIframe ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                        Önerilen
                                    </div>
                                )}
                                {plan.discountPercent > 0 && (
                                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                                        %{plan.discountPercent} İndirim
                                    </div>
                                )}
                                <div className="text-center pt-2">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-2">{plan.title}</h3>
                                    <div className="text-2xl font-bold text-gray-900 mb-1">{plan.basePriceStr}</div>
                                    <p className="text-xs text-gray-400 font-medium">+ KDV</p>

                                    {plan.discountPercent > 0 && (
                                        <p className="text-[10px] text-red-500 mt-2 font-medium">
                                            4 aylık pakete göre %{plan.discountPercent} avantajlı
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Billing Information */}
                    {!showIframe && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <CreditCard className="h-5 w-5 mr-2 text-red-600" />
                                Fatura Bilgileri
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <button
                                    onClick={() => handleBillingChange('type', 'INDIVIDUAL')}
                                    className={`py-2 px-4 rounded-lg border text-sm font-medium ${billingInfo.type === 'INDIVIDUAL' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-600'}`}
                                >
                                    Bireysel Fatura
                                </button>
                                <button
                                    onClick={() => handleBillingChange('type', 'CORPORATE')}
                                    className={`py-2 px-4 rounded-lg border text-sm font-medium ${billingInfo.type === 'CORPORATE' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-600'}`}
                                >
                                    Kurumsal Fatura
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {billingInfo.type === 'INDIVIDUAL' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Ad Soyad</label>
                                            <input
                                                type="text"
                                                value={billingInfo.name}
                                                onChange={(e) => handleBillingChange('name', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Telefon</label>
                                            <input
                                                type="tel"
                                                value={billingInfo.phone}
                                                onChange={(e) => handleBillingChange('phone', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                                placeholder="05..."
                                            />
                                        </div>
                                    </>
                                )}

                                {billingInfo.type === 'CORPORATE' && (
                                    <>
                                        {/* Name and Phone are taken from User Profile automatically for Corporate, not shown to reduce friction as requested */}
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Firma Ünvanı</label>
                                            <input
                                                type="text"
                                                value={billingInfo.companyName}
                                                onChange={(e) => handleBillingChange('companyName', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Vergi Dairesi</label>
                                            <input
                                                type="text"
                                                value={billingInfo.taxOffice}
                                                onChange={(e) => handleBillingChange('taxOffice', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Vergi Numarası</label>
                                            <input
                                                type="text"
                                                value={billingInfo.taxNumber}
                                                onChange={(e) => handleBillingChange('taxNumber', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                            />
                                        </div>
                                    </>
                                )}

                                {billingInfo.type === 'INDIVIDUAL' && (
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-medium text-gray-700">TC Kimlik No (Opsiyonel)</label>
                                        <input
                                            type="text"
                                            value={billingInfo.identityNumber}
                                            onChange={(e) => handleBillingChange('identityNumber', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Şehir</label>
                                    <input
                                        type="text"
                                        value={billingInfo.city}
                                        onChange={(e) => handleBillingChange('city', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Açık Adres</label>
                                    <textarea
                                        value={billingInfo.address}
                                        onChange={(e) => handleBillingChange('address', e.target.value)}
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Area */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 font-medium">Paket Tutarı (KDV Hariç)</span>
                                <span className="font-bold text-gray-900">{PLANS[selectedPlan].basePriceStr}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                                <span className="text-gray-600 font-medium">KDV (%20)</span>
                                <span className="font-medium text-gray-900">{PLANS[selectedPlan].vat.toLocaleString('tr-TR')} TL</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500">Ödenecek Toplam Tutar</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-2xl text-red-600">{PLANS[selectedPlan].totalStr}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Actions / Iframe */}
                        <div className="p-6 bg-slate-50 relative min-h-[200px] flex flex-col items-center justify-center">

                            {error && (
                                <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {!showIframe ? (
                                <div className="w-full text-center">
                                    <p className="text-sm text-gray-500 mb-6">
                                        Ödeme işlemine geçmek için fatura bilgilerini doldurup aşağıdaki butona tıklayınız.
                                    </p>
                                    <Button
                                        onClick={startPaymentProcess}
                                        size="lg"
                                        className="w-full md:w-auto px-12 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all"
                                    >
                                        Ödeme Ekranına Geç
                                    </Button>
                                    <div className="mt-6 flex justify-center space-x-4 opacity-70 grayscale hover:grayscale-0 transition-all">
                                        <img src="https://www.paytr.com/img/odeme_guvenli.png" alt="PayTR" className="h-6" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full animate-in fade-in duration-500">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-3"></div>
                                            <p className="text-sm text-gray-500">Güvenli ödeme sayfası yükleniyor...</p>
                                        </div>
                                    ) : iframeToken ? (
                                        <iframe
                                            src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                                            className="w-full min-h-[600px] border-0 rounded-lg shadow-inner"
                                            scrolling="no"
                                        ></iframe>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-gray-500">Bir hata oluştu.</p>
                                            <Button variant="ghost" onClick={() => setShowIframe(false)}>Geri Dön</Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
