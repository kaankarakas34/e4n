import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMembershipStore } from '../stores/membershipStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Check, Shield, Zap } from 'lucide-react';
import { MembershipPlan } from '../types';
import { PaymentModal } from '../components/PaymentModal';

export function MembershipPage() {
    const { user } = useAuthStore();
    const { items, renew } = useMembershipStore();

    // Find current user's membership
    const currentMembership = items.find(m => m.user_id === user?.id);

    const [selectedPlan, setSelectedPlan] = useState<{ plan: MembershipPlan, price: number, title: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    const PLANS = [
        {
            plan: '1_MONTH' as MembershipPlan,
            title: 'Aylık Paket',
            price: 7200,
            netPrice: '6.000 TL + KDV',
            monthly: '7.200 TL KDV Dahil',
            features: ['Tüm Etkinliklere Erişim', 'Networking Ağma Katılım', 'Eğitim Materyalleri']
        },
        {
            plan: '6_MONTHS' as MembershipPlan,
            title: '6 Aylık Paket',
            price: 39000,
            netPrice: '32.500 TL + KDV',
            monthly: 'Ort. 6.500 TL KDV Dahil / ay',
            features: ['Tüm Etkinliklere Erişim', 'Networking Ağma Katılım', 'Eğitim Materyalleri', '%10 Etkinlik İndirimi']
        },
        {
            plan: '12_MONTHS' as MembershipPlan,
            title: '12 Aylık Paket',
            price: 69000,
            netPrice: '57.500 TL + KDV',
            monthly: 'Ort. 5.750 TL KDV Dahil / ay',
            features: ['Tüm Etkinliklere Erişim', 'Networking Ağma Katılım', 'Eğitim Materyalleri', '%20 Etkinlik İndirimi', 'Öncelikli Destek'],
            popular: true
        }
    ];

    const formatPlanName = (plan?: string) => {
        if (!plan) return 'Varsayılan';
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

    const handlePaymentSuccess = async (paymentDetails?: any) => {
        if (!selectedPlan || !user) return;

        const paidAmount = paymentDetails?.finalAmount || selectedPlan.price;

        setLoading(true);
        try {
            if (currentMembership?.id) {
                await renew(currentMembership.id, selectedPlan.plan, paidAmount);
            } else {
                await useMembershipStore.getState().create({
                    user_id: user.id!,
                    plan: selectedPlan.plan,
                    start_date: new Date().toISOString(),
                    payment_amount: paidAmount
                });
                await useMembershipStore.getState().fetchAll(); // refresh state
            }
            alert('Ödemeniz başarıyla alındı ve üyeliğiniz yenilendi!');
        } catch (error) {
            console.error('Payment error:', error);
            alert('Ödeme sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
            setSelectedPlan(null);
            setPaymentModalOpen(false);
        }
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

                {/* Current Status */}
                {currentMembership && (
                    <div className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                            Mevcut Üyelik Durumu
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500">Plan</span>
                                <span className="font-semibold text-gray-900">{formatPlanName(currentMembership.plan)}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Durum</span>
                                <Badge className={currentMembership.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {currentMembership.status === 'ACTIVE' ? 'Aktif' : currentMembership.status === 'EXPIRED' ? 'Süresi Doldu' : currentMembership.status}
                                </Badge>
                            </div>
                            <div>
                                <span className="block text-gray-500">Bitiş Tarihi</span>
                                <span className="font-semibold text-gray-900">{new Date(currentMembership.end_date).toLocaleDateString('tr-TR')}</span>
                            </div>
                        </div>
                    </div>
                )}

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
                                disabled={loading}
                            >
                                {loading ? 'İşleniyor...' : 'Seç ve Öde'}
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
                />
            )}
        </div>
    );
}
