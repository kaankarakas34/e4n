import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import { Layers, Users, ArrowLeft, BarChart3, DollarSign, Calendar } from 'lucide-react';

export function AdminGroupDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]); // Use 'members' to match rendering usage
    const [meetings, setMeetings] = useState<any[]>([]);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [synergy, setSynergy] = useState<any[]>([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const isPowerTeam = location.pathname.includes('power-teams');
    const typeLabel = isPowerTeam ? 'Lonca' : 'Grup';

    // Dynamic Stats
    const stats = {
        totalTurnover: referrals.reduce((acc, curr) => acc + (curr.amount || 0), 0),
        totalReferrals: referrals.length,
        activeMembers: members.filter(m => m.status === 'ACTIVE').length,
        upcomingEvents: isPowerTeam ? 0 : 0 // Backend currently doesn't fetch future events count here, default to 0
    };

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ATTENDANCE' | 'VISITORS' | 'REFERRALS' | 'MEETINGS' | 'SYNERGY'>('OVERVIEW');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                let foundItem;
                if (isPowerTeam) {
                    const teams = await api.getPowerTeams();
                    foundItem = teams.find((t: any) => t.id === id);
                } else {
                    const groups = await api.getGroups();
                    foundItem = groups.find((g: any) => g.id === id);
                }

                if (foundItem) {
                    setData(foundItem);
                    // Fetch members
                    let teamMembers = [];
                    if (isPowerTeam) {
                        teamMembers = (await api.getPowerTeamMembers(id)) || [];
                    } else {
                        teamMembers = (await api.getGroupMembers(id)) || [];
                    }
                    setMembers(teamMembers);

                    // Fetch meetings
                    if (id) {
                        const groupMeetings = await api.getGroupMeetings(id);
                        setMeetings(groupMeetings);

                        const groupVisitors = await api.getGroupVisitors(id);
                        setVisitors(groupVisitors);

                        if (isPowerTeam) {
                            const synergyData = await api.getPowerTeamSynergy(id);
                            setSynergy(synergyData);
                            const refData = await api.getPowerTeamReferrals(id);
                            setReferrals(refData || []);
                        } else {
                            const refData = await api.getGroupReferrals(id);
                            setReferrals(refData || []);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadData();
        }
    }, [id, isPowerTeam]);


    // Note: Admin doesn't need to be in the group to see it, as long as role is ADMIN
    if (!user) return <div className="p-8">Giriş Yapılmalı</div>;

    const allowedRoles = ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER'];

    if (!allowedRoles.includes(user.role)) {
        return <div className="p-8">Erişim Kısıtlı</div>;
    }

    if (loading) {
        return <div className="p-8">Yükleniyor...</div>;
    }

    if (!data) {
        return <div className="p-8">{typeLabel} bulunamadı.</div>;
    }

    const allRoles = [
        { title: 'Grup Başkanı', role: 'PRESIDENT', group_title: 'PRESIDENT', icon: Users, desc: 'Grubu yönetir.', color: 'indigo' },
        { title: 'Üyelik İşleri Bşk.', role: 'VICE_PRESIDENT', group_title: 'MEMBERSHIP_PRESIDENT', icon: Users, desc: 'Üye performansı.', color: 'purple' },
        { title: 'Ziyaretçi Komitesi Bşk.', role: 'VICE_PRESIDENT', group_title: 'VISITOR_PRESIDENT', icon: Users, desc: 'Ziyaretçi takibi.', color: 'purple' },
        { title: 'Birebir Koord.', role: 'MEMBER', group_title: 'ONE_TO_ONE_COORD', icon: Users, desc: '1-1 Takibi.', color: 'blue' },
        { title: 'Eğitim Koord.', role: 'MEMBER', group_title: 'EDUCATION_COORD', icon: Users, desc: 'Eğitim takibi.', color: 'blue' },
    ];
    const displayRoles = isPowerTeam ? [allRoles[0]] : allRoles;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/groups')}
                    className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Yönetime Dön
                </Button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            {isPowerTeam ? <Users className="h-8 w-8 text-purple-600" /> : <Layers className="h-8 w-8 text-red-600" />}
                            {data.name}
                        </h1>
                        <div className="flex items-center mt-2 space-x-3 text-sm">
                            <span className="text-gray-500">ID: {data.id}</span>
                            <span className="text-gray-300">•</span>
                            <span className={`px-2 py-0.5 rounded-full ${data.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {data.status || 'Aktif'}
                            </span>
                            {!isPowerTeam && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span className={`font-medium ${(data.current_month || 1) >= 4 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {data.current_month || 1}. Ay (Dönem Sonu: 4. Ay)
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        {(activeTab === 'MEETINGS' || activeTab === 'OVERVIEW') && (
                            <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50" onClick={() => setShowReportModal(true)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Toplantı Raporu Gir
                            </Button>
                        )}
                        <Button variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            onClick={async () => {
                                if (members.length > 0) {
                                    alert('HATA: İçinde aktif üye bulunan bir grubu silemezsiniz. Lütfen önce üyeleri çıkarın veya taşıyın.');
                                    return;
                                }
                                if (confirm(`"${data.name}" grubunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
                                    try {
                                        if (isPowerTeam) {
                                            // api delete for PowerTeam
                                        } else {
                                            await api.deleteGroup(data.id);
                                        }
                                        alert('Grup başarıyla silindi.');
                                        navigate('/admin/groups');
                                    } catch (e: any) {
                                        alert('Silme işlemi başarısız: ' + e.message);
                                    }
                                }
                            }}
                        >
                            {typeLabel} Sil
                        </Button>
                        <Button variant="primary">{typeLabel} Düzenle</Button>
                    </div>
                </div>

                {/* Report Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold mb-4">Haftalık Toplantı Raporu</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Toplantı Tarihi</label>
                                    <input type="date" className="mt-1 block w-full border rounded-md p-2" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">En İyi Networker</label>
                                    <select className="mt-1 block w-full border rounded-md p-2">
                                        <option value="">Seçiniz...</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ortam Puanı (1-10)</label>
                                    <input type="number" min="1" max="10" className="mt-1 block w-full border rounded-md p-2" defaultValue="8" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Yönetici Notları</label>
                                    <textarea className="mt-1 block w-full border rounded-md p-2" rows={3} placeholder="Toplantı akışı, önemli duyurular vb."></textarea>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <Button variant="ghost" onClick={() => setShowReportModal(false)}>İptal</Button>
                                <Button variant="primary" onClick={() => {
                                    api.submitMeetingReport({ group_id: id, date: new Date().toISOString() });
                                    setShowReportModal(false);
                                    alert('Rapor başarıyla kaydedildi!');
                                }}>Raporu Kaydet</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-gray-200 mb-6 overflow-x-auto">
                    {['OVERVIEW', 'ATTENDANCE', 'VISITORS', 'REFERRALS', 'MEETINGS', ...(isPowerTeam ? ['SYNERGY'] : [])].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab === 'OVERVIEW' ? 'Genel Bakış' :
                                tab === 'ATTENDANCE' ? 'Yoklama' :
                                    tab === 'VISITORS' ? 'Ziyaretçiler' :
                                        tab === 'REFERRALS' ? 'Yönlendirmeler' :
                                            tab === 'MEETINGS' ? 'Toplantılar' : 'Sinerji Analizi'}
                        </button>
                    ))}
                </div>

                {activeTab === 'OVERVIEW' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Stats Cards */}
                            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-indigo-600">Toplam Ciro</p>
                                            <p className="text-2xl font-bold text-gray-900">₺{stats.totalTurnover.toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-indigo-100 rounded-full">
                                            <DollarSign className="h-6 w-6 text-indigo-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600">Aktif Üyeler</p>
                                            <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                                        </div>
                                        <div className="p-3 bg-blue-100 rounded-full">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-600">İş Yönlendirmeleri</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
                                        </div>
                                        <div className="p-3 bg-purple-100 rounded-full">
                                            <BarChart3 className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-600">Gelecek Etkinlikler</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                                        </div>
                                        <div className="p-3 bg-green-100 rounded-full">
                                            <Calendar className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mb-8 border-indigo-200 bg-indigo-50/30">
                            <CardHeader className="border-b border-indigo-100 flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center text-indigo-900">
                                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                                    Liderlik Ekibi ve Görevliler
                                </CardTitle>
                                {user?.role === 'ADMIN' && <span className="text-xs text-indigo-500 font-normal border border-indigo-200 px-2 py-1 rounded-full">Yönetici Yetkisi</span>}
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                                    {/* Helper to render a role card */}
                                    {displayRoles.map((roleDef, idx) => {
                                        // Find current holder
                                        const current = members.find(m =>
                                            roleDef.role === 'PRESIDENT' ? m.role === 'PRESIDENT' : m.group_title === roleDef.group_title
                                        );
                                        const Icon = roleDef.icon;
                                        const borderColor = roleDef.color === 'indigo' ? 'border-indigo-100' : roleDef.color === 'purple' ? 'border-purple-100' : 'border-blue-100';
                                        const textColor = roleDef.color === 'indigo' ? 'text-indigo-900' : roleDef.color === 'purple' ? 'text-purple-900' : 'text-blue-900';
                                        const iconColor = roleDef.color === 'indigo' ? 'text-indigo-600' : roleDef.color === 'purple' ? 'text-purple-600' : 'text-blue-600';
                                        const bgIconColor = roleDef.color === 'indigo' ? 'bg-indigo-100' : roleDef.color === 'purple' ? 'bg-purple-100' : 'bg-blue-100';

                                        return (
                                            <div key={idx} className={`bg-white p-3 rounded-lg border ${borderColor} shadow-sm relative overflow-hidden group flex flex-col justify-between`}>
                                                <div>
                                                    <h3 className={`text-xs font-bold ${textColor} uppercase tracking-wide mb-1 leading-tight`}>{roleDef.title}</h3>
                                                    <p className="text-[10px] text-gray-500 mb-2">{roleDef.desc}</p>

                                                    {current ? (
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <div className={`h-8 w-8 rounded-full ${bgIconColor} flex items-center justify-center font-bold border-2 border-white shadow-sm text-xs`}>
                                                                {current.full_name?.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="font-bold text-gray-900 text-xs truncate">{current.full_name}</p>
                                                                <p className="text-[10px] text-gray-500 truncate">{current.profession}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-2 mb-2 text-gray-400 italic text-xs py-1">
                                                            Atanmamış
                                                        </div>
                                                    )}
                                                </div>

                                                {user?.role === 'ADMIN' && (
                                                    <div className="mt-1">
                                                        <select
                                                            className="block w-full text-[10px] border-gray-300 rounded shadow-sm focus:ring-0 py-1 px-1"
                                                            value={current?.id || ''}
                                                            onChange={async (e) => {
                                                                const newId = e.target.value;
                                                                if (confirm(`${current ? current.full_name + ' yerine ' : ''}yeni ${roleDef.title} atamak istiyor musunuz?`)) {
                                                                    try {
                                                                        // Demote current
                                                                        if (current) await api.assignRole(current.id, 'MEMBER', null); // Clear title
                                                                        // Promote new
                                                                        if (newId) await api.assignRole(newId, roleDef.role, roleDef.group_title);

                                                                        // Refresh
                                                                        if (isPowerTeam) {
                                                                            const teamMembers = (await api.getPowerTeamMembers(id!)) || [];
                                                                            setMembers(teamMembers);
                                                                        } else {
                                                                            const groupMembers = (await api.getGroupMembers(id!)) || [];
                                                                            setMembers(groupMembers);
                                                                        }
                                                                    } catch (err) {
                                                                        alert('Hata oluştu.');
                                                                        console.error(err);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Seç...</option>
                                                            {members.sort((a, b) => a.full_name.localeCompare(b.full_name)).map(m => (
                                                                <option key={m.id} value={m.id}>
                                                                    {m.full_name} ({m.role === 'MEMBER' ? 'Üye' : m.group_title || m.role})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>{isPowerTeam ? 'Lonca Üyeleri' : 'Grup Üyeleri'}</CardTitle>
                                <span className="text-sm text-gray-500">{members.length} Üye</span>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meslek</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performans</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Katılım Tarihi</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {members.map((member: any) => (
                                                <tr key={member.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{member.full_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{member.profession}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center space-x-2">
                                                            <div className={`w-3 h-3 rounded-full ${(member.performance_score || 0) >= 70 ? 'bg-green-500' :
                                                                (member.performance_score || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`} />
                                                            <span className="text-xs text-gray-500 font-medium">{member.performance_score || 0} Puan</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{member.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                        {new Date(member.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                            (member.status === 'PENDING' || member.status === 'REQUESTED') ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {member.status === 'ACTIVE' ? 'Aktif' :
                                                                (member.status === 'PENDING' || member.status === 'REQUESTED') ? 'Beklemede' : 'Pasif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {(member.status === 'PENDING' || member.status === 'REQUESTED') && (
                                                            <div className="flex justify-end space-x-2">
                                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                                                                    if (confirm('Üyeyi onaylamak istiyor musunuz?')) {
                                                                        if (isPowerTeam) await api.updatePowerTeamMemberStatus(id!, member.id, 'ACTIVE');
                                                                        else await api.updateGroupMemberStatus(id!, member.id, 'ACTIVE');
                                                                        // Optimistic update
                                                                        setMembers(members.map(m => m.id === member.id ? { ...m, status: 'ACTIVE' } : m));
                                                                    }
                                                                }}>
                                                                    Onayla
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={async () => {
                                                                    if (confirm('İsteği reddetmek istiyor musunuz?')) {
                                                                        if (isPowerTeam) await api.deletePowerTeamMember(id!, member.id);
                                                                        else await api.deleteGroupMember(id!, member.id);
                                                                        setMembers(members.filter(m => m.id !== member.id)); // Remove from list
                                                                    }
                                                                }}>
                                                                    Reddet
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {members.length === 0 && (
                                        <div className="text-center py-6 text-gray-500">Bu grupta henüz üye bulunmuyor.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {activeTab === 'ATTENDANCE' && (
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>Toplantı Geçmişi</CardTitle>
                            <Button size="sm" onClick={() => setActiveTab('TAKE_ATTENDANCE' as any)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Yeni Yoklama
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-4">Yükleniyor...</div>
                            ) : (meetings && meetings.length > 0) ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konu</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Katılım</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oran</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {meetings.map((meeting: any) => (
                                                <tr key={meeting.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {new Date(meeting.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.topic}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {meeting.attendees_count} / {meeting.total_members}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                                                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(meeting.attendees_count / meeting.total_members) * 100}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-gray-500">{Math.round((meeting.attendees_count / meeting.total_members) * 100)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-900">
                                                            Detay
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Yoklama Kaydı Yok</h3>
                                    <p className="mt-1 text-sm text-gray-500">Henüz bu grup için bir yoklama kaydı oluşturulmadı.</p>
                                    <div className="mt-6">
                                        <Button onClick={() => setActiveTab('TAKE_ATTENDANCE' as any)}>
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Yeni Yoklama Başlat
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* TAKE ATTENDANCE VIEW */}
                {(activeTab as any) === 'TAKE_ATTENDANCE' && (
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <CardTitle>Yeni Yoklama Al</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString()} Tarihli Toplantı</p>
                            </div>
                            <Button variant="ghost" onClick={() => setActiveTab('ATTENDANCE')}>İptal</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Toplantı Konusu</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" defaultValue="Haftalık Toplantı" />
                            </div>
                            <div className="overflow-x-auto border rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üye</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Var</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Yok</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Geç</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Yedek</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {members.map(member => (
                                            <tr key={member.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.full_name}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <input type="radio" name={`status-${member.id}`} defaultChecked className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input type="radio" name={`status-${member.id}`} className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300" />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input type="radio" name={`status-${member.id}`} className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300" />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input type="radio" name={`status-${member.id}`} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button variant="primary" onClick={() => {
                                    // Mock save
                                    const newMeeting = {
                                        id: Math.random().toString(),
                                        group_id: id,
                                        date: new Date().toISOString(),
                                        topic: 'Haftalık Toplantı',
                                        attendees_count: members.length, // Mock all present
                                        total_members: members.length
                                    };
                                    setMeetings([newMeeting, ...meetings]);
                                    setActiveTab('ATTENDANCE');
                                }}>
                                    Yoklamayı Kaydet
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* VISITORS TAB */}
                {activeTab === 'VISITORS' && (
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>Ziyaretçi Listesi</CardTitle>
                            <Button size="sm" onClick={() => {
                                // Mock add visitor logic (simplified alert or console for now)
                                const name = prompt('Ziyaretçi Adı:');
                                if (name) {
                                    api.createVisitor({ group_id: id, name, profession: 'Yeni Ziyaretçi', inviter_id: '1' }).then(newV => setVisitors([newV, ...visitors]));
                                }
                            }}>
                                <Users className="h-4 w-4 mr-2" />
                                Yeni Ziyaretçi Ekle
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {visitors.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meslek</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Davet Eden</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarİh</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {visitors.map((visitor: any) => (
                                                <tr key={visitor.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{visitor.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{visitor.profession}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                        {/* Find inviter name from members list if possible, else show ID */}
                                                        {members.find(m => m.id === visitor.inviter_id)?.full_name || 'Bilinmiyor'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                        {new Date(visitor.visited_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${visitor.status === 'CONVERTED' ? 'bg-green-100 text-green-800' :
                                                            'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {visitor.status === 'CONVERTED' ? 'Üye Oldu' : 'Ziyaret Etti'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {visitor.status !== 'CONVERTED' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                onClick={async () => {
                                                                    if (confirm(`${visitor.name} adlı ziyaretçiyi üye yapmak istiyor musunuz?`)) {
                                                                        await api.convertVisitorToMember(visitor.id);
                                                                        // Update local state
                                                                        setVisitors(visitors.map(v => v.id === visitor.id ? { ...v, status: 'CONVERTED' } : v));
                                                                        // Refresh members
                                                                        const upgradedMembers = await api.getMembers();
                                                                        setMembers(upgradedMembers.slice(0, 50)); // Simplified fetch
                                                                    }
                                                                }}
                                                            >
                                                                Üye Yap
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz Ziyaretçi Yok</h3>
                                    <div className="mt-6">
                                        <Button onClick={() => {
                                            const name = prompt('Ziyaretçi Adı:');
                                            if (name) {
                                                api.createVisitor({ group_id: id, name, profession: 'Yeni Ziyaretçi', inviter_id: '1' }).then(newV => setVisitors([newV, ...visitors]));
                                            }
                                        }}>
                                            <Users className="h-4 w-4 mr-2" />
                                            Ziyaretçi Ekle
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* SYNERGY TAB */}
                {(activeTab as any) === 'SYNERGY' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Lonca İçi İş Yönlendirme Analizi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gönderen</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İş Sayısı</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etki</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {synergy && synergy.map((s: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{s.from}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{s.to}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-bold">{s.count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(s.count * 5, 100)}%` }}></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(!synergy || synergy.length === 0) && (
                                    <div className="text-center py-6 text-gray-500">Veri bulunamadı.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Placeholder for other tabs */}
                {/* REFERRALS TAB */}
                {(activeTab as any) === 'REFERRALS' && (
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>İş Yönlendirmeleri</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {referrals.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gönderen</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alan</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {referrals.map((ref: any, i: number) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ref.from_member_name || 'Bilinmiyor'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ref.to_member_name || 'Bilinmiyor'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ref.amount ? `₺${ref.amount.toLocaleString()}` : '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ref.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {ref.status === 'COMPLETED' ? 'Tamamlandı' : 'Beklemede'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Yönlendirme Kaydı Yok</h3>
                                    <p className="mt-1 text-sm text-gray-500">Bu grup için henüz bir iş yönlendirmesi yapılmamış.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* MEETINGS TAB */}
                {(activeTab === 'MEETINGS') && (
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>Geçmiş Toplantılar ve Raporlar</CardTitle>
                            <Button size="sm" onClick={() => setActiveTab('TAKE_ATTENDANCE' as any)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Yeni Yoklama / Rapor
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {(meetings && meetings.length > 0) ? (
                                <div className="space-y-4">
                                    {meetings.map((meeting: any) => (
                                        <div key={meeting.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer"
                                                onClick={async (e) => {
                                                    // Toggle details logic could be state based. For simplicity using a simple alert or ideally expanding.
                                                    // Let's implement expansion state properly.
                                                    const current = (data as any).expandedMeeting === meeting.id ? null : meeting.id;
                                                    setData({ ...data, expandedMeeting: current });
                                                    if (current) {
                                                        const att = await api.getMeetingAttendance(current);
                                                        setData((d: any) => ({ ...d, expandedMeetingData: att, expandedMeeting: current }));
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                                                        <Calendar className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{meeting.topic}</h4>
                                                        <p className="text-sm text-gray-500">{new Date(meeting.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 md:mt-0 flex items-center space-x-6 text-sm">
                                                    <div className="text-center">
                                                        <p className="text-gray-500">Katılım</p>
                                                        <span className="font-bold text-gray-900">{meeting.attendees_count} / {meeting.total_members}</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-gray-500">Ortam</p>
                                                        <span className="font-bold text-green-600">{meeting.report?.rating || '-'}/10</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm">
                                                        {(data as any).expandedMeeting === meeting.id ? 'Gizle' : 'Detaylar'}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* EXPANDED DETAILS */}
                                            {(data as any).expandedMeeting === meeting.id && (
                                                <div className="mt-4 pt-4 border-t grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                                                    {/* LEFT: REPORT INFO */}
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 mb-3 flex items-center">
                                                            <Layers className="h-4 w-4 mr-2 text-indigo-500" /> Toplantı Raporu
                                                        </h5>
                                                        <div className="bg-gray-50 p-4 rounded-md space-y-3 text-sm">
                                                            <div>
                                                                <span className="font-medium text-gray-700">En İyi Networker:</span>
                                                                <span className="ml-2 text-gray-900">{meeting.report?.best_networker || '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-700">Yönetici Notu:</span>
                                                                <p className="mt-1 text-gray-600 italic">"{meeting.report?.notes || 'Not girilmemiş.'}"</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT: ATTENDANCE LIST */}
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 mb-3 flex items-center">
                                                            <Users className="h-4 w-4 mr-2 text-indigo-500" /> Katılım Listesi
                                                        </h5>
                                                        <div className="bg-white border rounded-md max-h-40 overflow-y-auto">
                                                            {(data as any).expandedMeetingData ? (
                                                                <table className="min-w-full text-sm">
                                                                    <thead className="bg-gray-50 sticky top-0">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left">Üye</th>
                                                                            <th className="px-4 py-2 text-right">Durum</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(data as any).expandedMeetingData.map((att: any, i: number) => (
                                                                            <tr key={i} className="border-t">
                                                                                <td className="px-4 py-2 text-gray-900">{att.member_name}</td>
                                                                                <td className="px-4 py-2 text-right">
                                                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${att.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                                                        att.status === 'EXCUSED' ? 'bg-yellow-100 text-yellow-800' :
                                                                                            'bg-red-100 text-red-800'
                                                                                        }`}>
                                                                                        {att.status === 'PRESENT' ? 'Var' : att.status === 'EXCUSED' ? 'İzinli/Yedek' : 'Yok'}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            ) : (
                                                                <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">Kayıt bulunamadı.</div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
