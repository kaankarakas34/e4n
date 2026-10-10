import {useNavigate} from 'react-router-dom';
import {membershipPrices} from '../../shared/membership-pricing.js';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Check, Shield, Zap } from 'lucide-react';
import { MembershipPlan } from '../types';
import { PaymentModal } from '../components/PaymentModal';
import { api } from '../api/api';

export function MembershipPage() {
    const navigate=useNavigate();
    const { user } = useAuthStore();
    const [record, setRecord] = useState<{ id: string; subscription_plan?: string | null; subscription_end_date?: string | null; account_status?: string | null } | null>(null);
    const [readState, setReadState] = useState<{ userId?: string; loading: boolean; error: string | null }>({ loading: true, error: null });
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const userId = user?.id;
        setRecord(null);
        setReadState({ userId, loading: true, error: null });
        if (!userId) return () => { cancelled = true; };
        api.getMe().then(data => {
            if (cancelled) return;
            if (!data || data.id !== userId ||
                (data.subscription_plan != null && typeof data.subscription_plan !== 'string') ||
                (data.subscription_end_date != null && typeof data.subscription_end_date !== 'string') ||
                (data.account_status != null && typeof data.account_status !== 'string')) {
                throw new Error('Invalid own profile response');
            }
            setRecord({ id: data.id, subscription_plan: data.subscription_plan, subscription_end_date: data.subscription_end_date, account_status: data.account_status });
            setReadState({ userId, loading: false, error: null });
        }).catch(() => {
            if (cancelled) return;
            setRecord(null);
            setReadState({ userId, loading: false, error: 'Üyelik bilgileri yüklenemedi.' });
        });
        return () => { cancelled = true; };
    }, [user?.id, retry]);

    const readReady = readState.userId === user?.id && !readState.loading;
    const ownRecord = readReady && !readState.error && record?.id === user?.id ? record : null;
    const endDate = ownRecord?.subscription_end_date ? new Date(ownRecord.subscription_end_date) : null;
    const subscriptionStatus = !ownRecord?.account_status ? 'Durum doğrulanamadı' :
        !['ACTIVE','UNSUBSCRIBED','PENDING'].includes(ownRecord.account_status) ? 'Hesap kısıtlı' :
        !ownRecord.subscription_plan || !endDate || Number.isNaN(endDate.getTime()) ? 'Aktif abonelik yok' :
        endDate <= new Date() ? 'Abonelik süresi doldu' :
        ownRecord.account_status === 'ACTIVE' ? 'Abonelik aktif' : 'Abonelik etkin değil';

    const [selectedPlan, setSelectedPlan] = useState<{ plan: MembershipPlan, price: number, title: string } | null>(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    const PLANS = [
        {
            plan: '1_MONTH' as MembershipPlan,
            title: 'Aylık Paket',
            price: membershipPrices['1_MONTH'],
            netPrice: '6.000 TL + KDV',
            monthly: '7.200 TL KDV Dahil',
            features: ['Etkinlikleri ve katılım koşullarını inceleme', 'Networking ağı ve üye paneli', 'Grup analizi ve başvurusu']
        },
        {
            plan: '6_MONTHS' as MembershipPlan,
            title: '6 Aylık Paket',
            price: membershipPrices['6_MONTHS'],
            netPrice: '32.500 TL + KDV',
            monthly: 'Ort. 6.500 TL KDV Dahil / ay',
            features: ['Etkinlikleri ve katılım koşullarını inceleme', 'Networking ağı ve üye paneli', 'Grup analizi ve başvurusu']
        },
        {
            plan: '12_MONTHS' as MembershipPlan,
            title: '12 Aylık Paket',
            price: membershipPrices['12_MONTHS'],
            netPrice: '57.500 TL + KDV',
            monthly: 'Ort. 5.750 TL KDV Dahil / ay',
            features: ['Etkinlikleri ve katılım koşullarını inceleme', 'Networking ağı ve üye paneli', 'Grup analizi ve başvurusu'],
            popular: true
        }
    ];

    const formatPlanName = (plan?: string) => {
        if (!plan) return 'Veri yok';
        if (plan === '1_MONTH') return 'Aylık Paket';
        if (plan === '6_MONTHS') return '6 Aylık Paket';
        if (plan === '12_MONTHS') return '12 Aylık Paket';
        if (plan === '4_MONTHS') return '4 Aylık Paket';
        if (plan === '8_MONTHS') return '8 Aylık Paket';
        return plan.replace('_', ' ');
    };

    const handleSelectPlan = async (plan: typeof PLANS[0]) => {
        if (!user) return;
        setSelectedPlan(plan);
        setPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        if (!selectedPlan || !user) return;
        // The server callback applies the recorded payment action. A popup notification
        // only triggers a fresh read; it must not grant or extend membership again.
        setRecord(null);
        setReadState({ userId: user.id, loading: true, error: null });
        setRetry(value => value + 1);
        setSelectedPlan(null);
        setPaymentModalOpen(false);
        alert('Ödeme bildirimi alındı. Güncel üyelik bilgilerinizi kontrol edin.');
    };

    if (!user) return <div className="p-8 text-center text-gray-600">Lütfen giriş yapın.</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Üyelik Paketleri
                    </h2>
                    <p className="mt-4 text-xl text-gray-500">
                        Size en uygun planı seçin ve networking ağınızı genişletin.
                    </p>
                </div>

                <div className="text-center mb-6"><Button onClick={()=>navigate('/membership-records')}>Üyelik ve Ödeme Kayıtlarım</Button></div>
                {/* Current Status */}
                <div className="mb-12" aria-live="polite">
                    {!readReady ? <p role="status">Üyelik bilgileri yükleniyor…</p> : readState.error ? (
                        <div role="alert">
                            <p>{readState.error}</p>
                            <Button onClick={() => setRetry(value => value + 1)}>Tekrar dene</Button>
                        </div>
                    ) : ownRecord && (
                    <>
                    {ownRecord.account_status === 'RESTRICTED' && (
                        <div role="alert" className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 max-w-3xl mx-auto flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-amber-100 mt-0.5">
                                <Shield className="h-5 w-5 text-amber-700" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Hesabınız Kısıtlı Durumda (Aidat Gecikmesi)</p>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    Aidat ödemeniz 5 günlük gecikme süresini aştığı için kapalı grup faaliyetleriniz ve indirim haklarınız geçici olarak durdurulmuştur.
                                    Aşağıdaki paketlerden birini seçip ödemenizi tamamladığınızda hesabınız ve tüm haklarınız anında otomatik olarak yeniden açılacaktır.
                                </p>
                            </div>
                        </div>
                    )}
                    {ownRecord.account_status === 'SUSPENDED' && (
                        <div role="alert" className="mb-6 p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 max-w-3xl mx-auto flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-red-100 mt-0.5">
                                <Shield className="h-5 w-5 text-red-700" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Hesabınız Askıya Alındı</p>
                                <p className="text-xs text-red-800 mt-0.5">
                                    Hesabınız idari nedenlerle askıya alınmıştır. Askıya alınan hesaplar üzerinden ödeme yapılamaz. Lütfen platform yönetimi ile iletişime geçiniz.
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                            Kayıtlı Üyelik Bilgileri
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500">Plan</span>
                                <span className="font-semibold text-gray-900">{formatPlanName(ownRecord.subscription_plan)}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Durum</span>
                                <span>{subscriptionStatus}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Bitiş Tarihi</span>
                                <span className="font-semibold text-gray-900">{endDate && !Number.isNaN(endDate.getTime()) ? endDate.toLocaleDateString('tr-TR') : 'Veri yok'}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
                            <span className="text-xs text-gray-500">Ödeme geçmişi ve onaylı fatura dosyalarınızı inceleyin</span>
                            <Button variant="outline" size="sm" onClick={() => navigate('/membership-records')}>
                                Fatura ve Ödeme Kayıtlarım
                            </Button>
                        </div>
                        {/*
                            </div>
                        */}
                    </div>
                    </>
                )}
                </div>

                {/* Pricing Cards */}
                <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
                    {PLANS.map((plan) => (
                        <div key={plan.plan} className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md ${plan.popular ? 'ring-2 ring-indigo-600 border-transparent' : 'border-gray-200'}`}>
                            {plan.popular && (
                                <div className="absolute top-0 right-0 -mt-4 mr-4">
                                    <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-indigo-600 text-white shadow-sm">
                                        En Çok Tercih Edilen
                                    </span>
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                                <div className="mt-4">
                                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">₺{plan.price.toLocaleString('tr-TR')}</span>
                                    <span className="ml-2 text-sm font-medium text-gray-500">KDV Dahil</span>
                                </div>
                                <div className="mt-1 text-xs font-semibold text-indigo-600 bg-indigo-50 inline-block px-2.5 py-1 rounded">
                                    {plan.netPrice}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {plan.monthly}
                                </p>

                                <ul className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <Check className="flex-shrink-0 w-5 h-5 text-indigo-500" aria-hidden="true" />
                                            <span className="ml-3 text-sm text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button
                                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-xl text-center font-semibold text-base transition-colors ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}
                                onClick={() => handleSelectPlan(plan)}
                                disabled={isPaymentModalOpen || ownRecord?.account_status === 'SUSPENDED'}
                            >
                                {ownRecord?.account_status === 'SUSPENDED' ? 'Hesap Askıda' : 'Seç ve Öde'}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedPlan && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    planTitle={selectedPlan.title}
                    amount={selectedPlan.price}
                    onSuccess={handlePaymentSuccess}
                    isMembership={true}
                    action={{
                        type: 'membership',
                        data: {
                            user_id: user?.id,
                            plan: selectedPlan.plan,
                            amount: selectedPlan.price
                        }
                    }}
                />
            )}
        </div>
    );
}
