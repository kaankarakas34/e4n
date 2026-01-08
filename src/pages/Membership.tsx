import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMembershipStore } from '../stores/membershipStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Check, Shield, Zap } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';
import { PayTRService } from '../services/paytrService';
import { MembershipPlan } from '../types';

export function MembershipPage() {
    const { user } = useAuthStore();
    const { items, renew } = useMembershipStore();

    // Find current user's membership
    const currentMembership = items.find(m => m.user_id === user?.id);

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentToken, setPaymentToken] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<{ plan: MembershipPlan, price: number, title: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const PLANS = [
        {
            plan: '4_MONTHS' as MembershipPlan,
            title: '4 Aylık Paket',
            price: 10000,
            monthly: '2.500 TL',
            features: ['Tüm Etkinliklere Erişim', 'Networking', 'Eğitim Materyalleri']
        },
        {
            plan: '8_MONTHS' as MembershipPlan,
            title: '8 Aylık Paket',
            price: 16000,
            monthly: '2.000 TL',
            features: ['Tüm Etkinliklere Erişim', 'Networking', 'Eğitim Materyalleri', '%10 Etkinlik İndirimi']
        },
        {
            plan: '12_MONTHS' as MembershipPlan,
            title: '12 Aylık Paket',
            price: 22800,
            monthly: '1.900 TL',
            features: ['Tüm Etkinliklere Erişim', 'Networking', 'Eğitim Materyalleri', '%20 Etkinlik İndirimi', 'Öcelikli Destek'],
            popular: true
        }
    ];

    const handleSelectPlan = async (plan: typeof PLANS[0]) => {
        if (!user) return;
        setLoading(true);
        setSelectedPlan(plan);

        try {
            // 1. Initialize Payment
            const response = await PayTRService.getPaymentToken(
                user,
                { name: plan.title, price: plan.price },
                'MEMBERSHIP'
            );

            if (response.status === 'success' && response.token) {
                setPaymentToken(response.token);
                setPaymentModalOpen(true);
            } else {
                alert('Ödeme başlatılamadı: ' + response.reason);
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Ödeme hatası oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        if (selectedPlan && currentMembership?.id) {
            await renew(currentMembership.id, selectedPlan.plan);
            alert('Ödemeniz başarıyla alındı ve üyeliğiniz yenilendi!');
        } else if (selectedPlan && user) {
            // Handle case where user has no membership record yet (create new)
            // Assuming user usually has at least a PENDING/EXPIRED one.
            // If not, we might need create() call.
            // For mock, we assume user has one or show error.
            if (!currentMembership) {
                alert('Kullanıcı abonelik kaydı bulunamadı. Lütfen yönetici ile iletişime geçin.');
            }
        }
        setPaymentModalOpen(false);
        setPaymentToken(null);
        setSelectedPlan(null);
    };

    if (!user) return <div className="p-8">Lütfen giriş yapın.</div>;

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
                    <div className="mb-12 bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                            Mevcut Üyelik Durumu
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500">Plan</span>
                                <span className="font-semibold">{currentMembership.plan?.replace('_', ' ')}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Durum</span>
                                <Badge className={currentMembership.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {currentMembership.status}
                                </Badge>
                            </div>
                            <div>
                                <span className="block text-gray-500">Bitiş Tarihi</span>
                                <span className="font-semibold">{new Date(currentMembership.end_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
                    {PLANS.map((plan) => (
                        <div key={plan.plan} className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col ${plan.popular ? 'ring-2 ring-indigo-600' : 'border-gray-200'}`}>
                            {plan.popular && (
                                <div className="absolute top-0 right-0 -mt-4 mr-4">
                                    <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-indigo-600 text-white">
                                        Popüler
                                    </span>
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900">{plan.title}</h3>
                                <p className="mt-4 flex items-baseline text-gray-900">
                                    <span className="text-4xl font-extrabold tracking-tight">₺{plan.price.toLocaleString()}</span>
                                    <span className="ml-1 text-xl font-semibold text-gray-500">/toplam</span>
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Aylık ortalama {plan.monthly}
                                </p>

                                <ul className="mt-6 space-y-6">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex">
                                            <Check className="flex-shrink-0 w-6 h-6 text-indigo-500" aria-hidden="true" />
                                            <span className="ml-3 text-gray-500">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button
                                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}
                                onClick={() => handleSelectPlan(plan)}
                                disabled={loading}
                            >
                                {loading ? 'İşleniyor...' : 'Seç ve Öde'}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                token={paymentToken}
                onSuccess={handlePaymentSuccess}
                onFail={(err) => alert('Ödeme başarısız: ' + err)}
            />
        </div>
    );
}
