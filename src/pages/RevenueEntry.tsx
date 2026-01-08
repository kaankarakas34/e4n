import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useReferralStore } from '../stores/referralStore';
import { Card, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { DollarSign, Search, CheckCircle, Clock } from 'lucide-react';
import { Select } from '../shared/Select';
import { api } from '../api/api';

export function RevenueEntry() {
    const { user } = useAuthStore();
    const { referrals, fetchReferrals, updateReferral } = useReferralStore();
    const [selectedReferral, setSelectedReferral] = useState<string | null>(null);
    const [revenueType, setRevenueType] = useState<'NEW' | 'RECURRING'>('NEW');
    const [amount, setAmount] = useState<number>(0);
    const [currency, setCurrency] = useState('TRY');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.id) fetchReferrals(user.id);
    }, [user, fetchReferrals]);

    // Filter referrals where user is the RECEIVER (who gets the job) or GIVER?
    // Ciro Girişi: "Teşekkür ederim, bana iş yönlendirdin" (TYFCB).
    // Usually, the RECEIVER of the referral (User A) creates a TYFCB record thanking the GIVER (User B).
    // Or User A (Giver of money) thanks User B (Provider of service).
    // In E4N: Record "Thank You For Closed Business" given TO the member who gave the referral.
    // So "I (User) paid Amount to X". Wait.
    // "Teşekkür Ederim" is filled by the person who RECEIVED the money/business, thanking the Referrer.
    // So Filter: Referrals where I am the RECEIVER_ID ? (Someone referred me).
    // Then I mark it as "Successful" and enter Amount.

    const myReceivedReferrals = referrals.filter(r =>
        r.receiver_id === user?.id && // I received the job
        (r.status === 'PENDING' || r.status === 'SUCCESSFUL') // Only pending or already successful ones
    );

    const filteredReferrals = myReceivedReferrals.filter(r =>
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.giver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReferral) return alert('Lütfen bir yönlendirme seçin.');
        if (amount <= 0) return alert('Lütfen geçerli bir tutar girin.');

        try {
            // 1. Update the referral status to SUCCESSFUL if not already
            await updateReferral(selectedReferral, {
                status: 'SUCCESSFUL',
                amount: amount, // Maybe store total amount here?
                updated_at: new Date().toISOString()
            });

            // 2. We should ideally create a Revenue/TYFCB record. 
            // For now, updating the Referral is the primary action requested.
            // "Ciro girişi yapsın" -> Entering revenue amount.

            alert('Ciro başarıyla kaydedildi!');
            setAmount(0);
            setSelectedReferral(null);
        } catch (err) {
            alert('Bir hata oluştu.');
        }
    };

    const selectedRefData = referrals.find(r => r.id === selectedReferral);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Ciro (Teşekkür) Girişi</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List of Referrals to Close */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-700 mb-4">Size Yönlendirilen İşler</h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text" placeholder="İş ara..."
                                    className="pl-10 w-full border rounded-md py-2 text-sm"
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {filteredReferrals.map(r => (
                                    <div
                                        key={r.id}
                                        onClick={() => setSelectedReferral(r.id)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedReferral === r.id ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-900">{r.giver?.name || 'Bilinmeyen Üye'}</span>
                                            <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            {r.status === 'SUCCESSFUL' ? <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Tamamlandı</span> : <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Bekliyor</span>}
                                        </div>
                                    </div>
                                ))}
                                {filteredReferrals.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Kayıt yok.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Entry Form */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-gray-700 mb-6 border-b pb-2">Ciro Detayları</h3>

                            {selectedRefData ? (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="bg-gray-50 p-3 rounded text-sm mb-4">
                                        <span className="block text-gray-500">Seçilen İş:</span>
                                        <span className="font-medium">{selectedRefData.description}</span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciro Türü</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center">
                                                <input type="radio" name=" type" checked={revenueType === 'NEW'} onChange={() => setRevenueType('NEW')} className="mr-2" />
                                                Yeni İş
                                            </label>
                                            <label className="flex items-center">
                                                <input type="radio" name="type" checked={revenueType === 'RECURRING'} onChange={() => setRevenueType('RECURRING')} className="mr-2" />
                                                Tekrar Eden
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={amount}
                                                onChange={e => setAmount(Number(e.target.value))}
                                                className="flex-1"
                                            />
                                            <Select value={currency} onChange={(e: any) => setCurrency(e.target.value)} className="w-24">
                                                <option value="TRY">TRY</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Kaydet
                                    </Button>
                                </form>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <DollarSign className="w-12 h-12 mb-2 opacity-20" />
                                    <p>Lütfen soldan bir iş seçiniz.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
