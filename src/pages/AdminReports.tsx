import { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Users, TrendingUp, DollarSign, Calendar, Target, Activity,
    Building, FileText, CheckCircle
} from 'lucide-react';
import { Button } from '../shared/Button';

export default function AdminReports() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState<any>(null);
    const [charts, setCharts] = useState<any>(null);
    const [groups, setGroups] = useState<any[]>([]);
    const [geo, setGeo] = useState<any[]>([]);
    const [trafficLights, setTrafficLights] = useState<any[]>([]);
    const [palms, setPalms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Promise.allSettled might be better to avoid one failure blocking all
            const results = await Promise.allSettled([
                api.getAdminStats?.() || Promise.resolve({}),
                api.getAdminCharts?.() || Promise.resolve({}),
                api.getAdminGroupStats?.() || Promise.resolve([]),
                api.getAdminGeoStats?.() || Promise.resolve([]),
                api.getTrafficLightReport(),
                api.getPALMSReport()
            ]);

            // Helper to get fulfilled value or default
            const getVal = (idx: number, def: any) => results[idx].status === 'fulfilled' ? (results[idx] as any).value : def;

            setStats(getVal(0, { totalRevenue: 0, internalRevenue: 0, externalRevenue: 0, totalMembers: 0, totalGroups: 0, totalEvents: 0 }));
            setCharts(getVal(1, { revenue: [], growth: [] }));
            setGroups(getVal(2, []));
            setGeo(getVal(3, []));
            setTrafficLights(getVal(4, []));
            setPalms(getVal(5, []));

        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const renderOverview = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Toplam Ciro"
                    value={`₺${(stats.totalRevenue || 0).toLocaleString()}`}
                    subvalue={`₺${(stats.internalRevenue || 0).toLocaleString()} İç / ₺${(stats.externalRevenue || 0).toLocaleString()} Dış`}
                    icon={DollarSign}
                    color="green"
                />
                <KPICard
                    title="Toplam Üye"
                    value={stats.totalMembers || 0}
                    subvalue={`${stats.lostMembers || 0} Kayıp (Son 30 Gün)`}
                    icon={Users}
                    color="indigo"
                />
                <KPICard
                    title="Aktif Gruplar"
                    value={stats.totalGroups || 0}
                    subvalue={`${stats.totalPowerTeams || 0} Lonca`}
                    icon={Building}
                    color="blue"
                />
                <KPICard
                    title="Toplam Etkinlik"
                    value={stats.totalEvents || 0}
                    subvalue={`${stats.totalVisitors || 0} Ziyaretçi`}
                    icon={Calendar}
                    color="purple"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Aylık Ciro Trendi</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts?.revenue || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `₺${value.toLocaleString()}`} />
                                <Area type="monotone" dataKey="value" stroke="#10b981" fill="#d1fae5" name="Ciro" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Üye Büyümesi</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts?.growth || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} name="Yeni Üye" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Ziyaretçi Dönüşüm Oranı</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">%{stats.visitorConversionRate || 0}</h3>
                            <p className="text-xs text-green-600 mt-1 font-medium">Hedef: %20</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">1-1 Toplantılar</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOneToOnes || 0}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Ortalama Başarı Puanı</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">78.5</h3>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <Target className="w-6 h-6 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderTrafficLights = () => (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
                <CardTitle>Trafik Işıkları Raporu</CardTitle>
                <p className="text-sm text-gray-500">Üye performans puanları ve durumları.</p>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üye</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meslek</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trafficLights.map((user: any) => {
                                let colorClass = 'bg-gray-100 text-gray-800';
                                if (user.color === 'GREEN') colorClass = 'bg-green-100 text-green-800';
                                if (user.color === 'YELLOW') colorClass = 'bg-yellow-100 text-yellow-800';
                                if (user.color === 'RED') colorClass = 'bg-red-100 text-red-800';

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.profession}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{user.score}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
                                                {user.color}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );

    const renderPALMS = () => (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
                <CardTitle>PALMS Raporu</CardTitle>
                <p className="text-sm text-gray-500">Katılım ve yoklama özeti (Present, Absent, Late, Medical, Substitute).</p>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üye</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Present">P</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Absent">A</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Late">L</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Medical">M</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Substitute">S</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {palms.map((Stats: any) => (
                                <tr key={Stats.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Stats.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-bold">{Stats.present}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600">{Stats.absent}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600">{Stats.late}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blue-600">{Stats.medical}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-purple-600">{Stats.substitute}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Yönetici Raporları</h1>
                    <p className="text-gray-500 mt-1">Sistem genelindeki performans metrikleri ve analizler.</p>
                </div>
                <div className="flex space-x-2 bg-white rounded-lg p-1 border shadow-sm">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Genel Bakış
                    </button>
                    <button
                        onClick={() => setActiveTab('traffic')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'traffic' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Trafik Işıkları
                    </button>
                    <button
                        onClick={() => setActiveTab('palms')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'palms' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        PALMS
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'traffic' && renderTrafficLights()}
            {activeTab === 'palms' && renderPALMS()}
        </div>
    );
}

function KPICard({ title, value, subvalue, icon: Icon, color }: any) {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
    }[color as string] || 'bg-gray-50 text-gray-600';

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colorClasses}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className="mt-2 flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">{value}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{subvalue}</p>
            </CardContent>
        </Card>
    );
}
