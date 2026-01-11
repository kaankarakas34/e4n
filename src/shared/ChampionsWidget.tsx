import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Trophy, Users, TrendingUp, HandCoins } from 'lucide-react';
import { api } from '../api/api';

type PeriodType = 'WEEK' | 'MONTH' | 'TERM' | 'YEAR';

interface Champion {
    id: string;
    metric_type: 'REFERRAL_COUNT' | 'VISITOR_COUNT' | 'REVENUE';
    user_name: string;
    profession: string;
    company_name: string;
    value: number;
}

export function ChampionsWidget() {
    const [period, setPeriod] = useState<PeriodType>('WEEK');
    const [champions, setChampions] = useState<Champion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChampions();
    }, []);

    const loadChampions = async () => {
        try {
            setLoading(true);
            const data = await api.getChampions();
            setChampions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Filter for current selected period
    const currentChampions = champions.filter((c: any) => c.period_type === period);

    // Group by metric type to ensure we display one card per metric if data exists
    const getChampionByMetric = (metric: string) => currentChampions.find(c => c.metric_type === metric);

    const referralChamp = getChampionByMetric('REFERRAL_COUNT');
    const visitorChamp = getChampionByMetric('VISITOR_COUNT');
    const revenueChamp = getChampionByMetric('REVENUE');

    return (
        <Card className="bg-gradient-to-br from-indigo-50 to-white overflow-hidden border-indigo-100">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-indigo-900">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                        Dönemin Yıldızları
                    </CardTitle>
                    <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                        {(['WEEK', 'MONTH', 'TERM', 'YEAR'] as PeriodType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${period === p
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {p === 'WEEK' ? 'Hafta' : p === 'MONTH' ? 'Ay' : p === 'TERM' ? 'Dönem' : 'Yıl'}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Referral Champion */}
                        <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <HandCoins className="h-16 w-16 text-indigo-600" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">En Çok İş Yönlendiren</p>
                                {referralChamp ? (
                                    <>
                                        <h4 className="font-bold text-gray-900 text-lg truncate" title={referralChamp.user_name}>{referralChamp.user_name}</h4>
                                        <p className="text-sm text-gray-500 mb-2 truncate">{referralChamp.company_name}</p>
                                        <div className="flex items-baseline">
                                            <span className="text-2xl font-bold text-indigo-700">{referralChamp.value}</span>
                                            <span className="ml-1 text-xs text-gray-400">Yönlendirme</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-20 flex items-center text-sm text-gray-400 italic">Henüz veri yok</div>
                                )}
                            </div>
                        </div>

                        {/* Visitor Champion */}
                        <div className="bg-white p-4 rounded-xl border border-blue-50 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users className="h-16 w-16 text-blue-600" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">En Çok Ziyaretçi Getiren</p>
                                {visitorChamp ? (
                                    <>
                                        <h4 className="font-bold text-gray-900 text-lg truncate" title={visitorChamp.user_name}>{visitorChamp.user_name}</h4>
                                        <p className="text-sm text-gray-500 mb-2 truncate">{visitorChamp.company_name}</p>
                                        <div className="flex items-baseline">
                                            <span className="text-2xl font-bold text-blue-700">{visitorChamp.value}</span>
                                            <span className="ml-1 text-xs text-gray-400">Ziyaretçi</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-20 flex items-center text-sm text-gray-400 italic">Henüz veri yok</div>
                                )}
                            </div>
                        </div>

                        {/* Revenue Champion */}
                        <div className="bg-white p-4 rounded-xl border border-emerald-50 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="h-16 w-16 text-emerald-600" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">En Yüksek Ciro</p>
                                {revenueChamp ? (
                                    <>
                                        <h4 className="font-bold text-gray-900 text-lg truncate" title={revenueChamp.user_name}>{revenueChamp.user_name}</h4>
                                        <p className="text-sm text-gray-500 mb-2 truncate">{revenueChamp.company_name}</p>
                                        <div className="flex items-baseline">
                                            <span className="text-2xl font-bold text-emerald-700">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(revenueChamp.value)}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-20 flex items-center text-sm text-gray-400 italic">Henüz veri yok</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
