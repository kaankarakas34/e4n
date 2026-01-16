import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import {
    Users,
    Layers,
    BarChart3,
    DollarSign,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    UserPlus,
    FileText,
    Briefcase,
    FileCheck
} from 'lucide-react';

export function GroupManagerDashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [myGroups, setMyGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'ATTENDANCE' | 'POWER_TEAM' | 'RESPONSIBILITIES' | 'APPLICATIONS' | 'TAKE_ATTENDANCE'>('OVERVIEW');
    const [loading, setLoading] = useState(true);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({}); // memberId -> status



    // Initialize attendance data when members change
    useEffect(() => {
        if (members.length > 0) {
            const initial: Record<string, string> = {};
            members.forEach((m: any) => {
                initial[m.id] = 'PRESENT';
            });
            setAttendanceData(initial);
        }
    }, [members]);
    const [activities, setActivities] = useState<any[]>([]);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [powerTeams, setPowerTeams] = useState<any[]>([]);
    const [myPowerTeam, setMyPowerTeam] = useState<any>(null);
    const [ptMembers, setPtMembers] = useState<any[]>([]);
    const [ptSynergy, setPtSynergy] = useState<any[]>([]);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [substitutes, setSubstitutes] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                // 1. Get User Groups
                const groups = await api.getUserGroups(user.id);
                setMyGroups(groups);

                if (groups.length > 0) {
                    const groupId = groups[0].id;
                    const groupDetails = (await api.getGroups()).find((g: any) => g.id === groupId);
                    setSelectedGroup(groupDetails || groups[0]);

                    // 2. Fetch Members for this group
                    const allMembers = await api.getGroupMembers(groupId);
                    setMembers(allMembers);

                    // 3. Fetch Meetings
                    const groupMeetings = await api.getGroupMeetings(groupId);
                    setMeetings(groupMeetings);

                    // 4. Fetch Visitors
                    const groupVisitors = await api.getGroupVisitors(groupId);
                    setVisitors(groupVisitors);

                    // NEW: Fetch Group Activities (121s)
                    const acts = await api.getGroupActivities(groupId);
                    setActivities(acts);

                    // NEW: Fetch Substitute Reports
                    const subs = await api.getAttendanceSubstitutes(groupId);
                    setSubstitutes(subs);

                    // NEW: Fetch Referrals
                    try {
                        const refs = await api.getGroupReferrals(groupId);
                        setReferrals(refs || []);
                    } catch (e) {
                        console.error("Referrals fetch failed", e);
                        setReferrals([]);
                    }
                }

                // 5. Check Power Team Leadership - Real Logic
                if (user.role === 'PRESIDENT' || user.role === 'VICE_PRESIDENT' || user.role === 'ADMIN') {
                    const myPts = await api.getUserPowerTeams(user.id);
                    if (myPts.length > 0) {
                        const pt = myPts[0]; // Assume primary PT
                        setMyPowerTeam(pt);
                        const ptMems = await api.getPowerTeamMembers(pt.id);
                        setPtMembers(ptMems);
                        const synergy = await api.getPowerTeamSynergy(pt.id);
                        setPtSynergy(synergy);
                    }
                }

            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const handleGroupRequest = async (userId: string, status: 'ACTIVE' | 'REJECTED') => {
        if (!selectedGroup) return;
        try {
            await api.updateGroupMemberStatus(selectedGroup.id, userId, status);
            // Refresh members
            const all = await api.getGroupMembers(selectedGroup.id);
            setMembers(all);
            alert(`İstek ${status === 'ACTIVE' ? 'onaylandı' : 'reddedildi'}.`);
        } catch (e) {
            alert('İşlem başarısız.');
        }
    };

    const handlePTRequest = async (userId: string, status: 'ACTIVE' | 'REJECTED') => {
        if (!myPowerTeam) return;
        try {
            await api.updatePowerTeamMemberStatus(myPowerTeam.id, userId, status);
            // Refresh
            const all = await api.getPowerTeamMembers(myPowerTeam.id);
            setPtMembers(all);
            alert(`İstek ${status === 'ACTIVE' ? 'onaylandı' : 'reddedildi'}.`);
        } catch (e) {
            alert('İşlem başarısız.');
        }
    };

    if (!user) return <div>Giriş yapmalısınız.</div>;
    if (loading) return <div className="p-8 text-center text-gray-500">Veriler yükleniyor...</div>;
    if (!selectedGroup) return <div className="p-8 text-center">Yönetici olduğunuz bir grup bulunamadı.</div>;

    // Calculate Dynamic Stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isThisMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const totalTurnover = referrals.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const referralsThisMonth = activities.filter(a => isThisMonth(a.meeting_date)).length; // Assuming activities are 1-2-1s here? NO, Wait. 
    // The previous code had "Birebir Görüşmeler" (One-to-Ones) tied to "referralsThisMonth" variable name which was confusing or I misread.
    // The UI says "Birebir Görüşmeler ... Bu ay". Let's use activities for that.
    // The UI says "Toplam Ciro".
    // Let's match labels correctly.

    const onetoonesThisMonth = activities ? activities.filter(a => isThisMonth(a.meeting_date)).length : 0;
    const visitorsThisMonthCount = visitors ? visitors.filter(v => isThisMonth(v.visited_at)).length : 0;

    // Attendance Rate
    let attendanceRate = 0;
    if (meetings && meetings.length > 0) {
        const totalPossible = meetings.reduce((acc, m) => acc + (m.total_members || 0), 0);
        const totalPresent = meetings.reduce((acc, m) => acc + (m.attendees_count || 0), 0);
        if (totalPossible > 0) attendanceRate = Math.round((totalPresent / totalPossible) * 100);
    }

    const stats = {
        totalTurnover: totalTurnover,
        referralsThisMonth: onetoonesThisMonth, // Using 121s for the "Birebir Görüşmeler" card logic
        attendanceRate: attendanceRate,
        visitorsThisMonth: visitorsThisMonthCount
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Users className="h-8 w-8 text-red-600 mr-3" />
                        {selectedGroup.name} Yönetim Paneli
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Grup Başkanı: {user.name} • {selectedGroup.status === 'ACTIVE' ? 'Aktif Grup' : 'Pasif'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-gray-200 mb-6 overflow-x-auto">
                    {[
                        { id: 'OVERVIEW', label: 'Genel Bakış', icon: BarChart3 },
                        { id: 'MEMBERS', label: 'Üyeler & Performans', icon: Users },
                        { id: 'RESPONSIBILITIES', label: 'Sorumluluklar', icon: Briefcase },
                        { id: 'ATTENDANCE', label: 'Yoklama', icon: Calendar },
                        { id: 'APPLICATIONS', label: 'Başvurular', icon: FileCheck },
                        ...(myPowerTeam ? [{ id: 'POWER_TEAM', label: 'Lonca Yönetimi', icon: Layers }] : [])
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'border-red-600 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="h-4 w-4 mr-2" />
                            {tab.label}
                            {tab.id === 'APPLICATIONS' && (
                                (() => {
                                    const count = (members.filter((m: any) => m.status === 'PENDING').length) +
                                        (myPowerTeam ? ptMembers.filter((m: any) => m.status === 'PENDING').length : 0);
                                    return count > 0 ? (
                                        <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
                                    ) : null;
                                })()
                            )}
                        </button>
                    ))}
                </div>

                {/* CONTENT: OVERVIEW */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-white border-l-4 border-l-blue-500">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Toplam Üye</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{members.filter((m: any) => m.status === 'ACTIVE').length}</h3>
                                        </div>
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-l-4 border-l-green-500">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Birebir Görüşmeler</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.referralsThisMonth}</h3>
                                            <p className="text-xs text-green-600 mt-1">Bu ay</p>
                                        </div>
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-l-4 border-l-yellow-500">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Ziyaretçi Sayısı</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.visitorsThisMonth}</h3>
                                            <p className="text-xs text-gray-500 mt-1">Hedef: 10</p>
                                        </div>
                                        <div className="p-2 bg-yellow-50 rounded-lg">
                                            <UserPlus className="h-6 w-6 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-l-4 border-l-purple-500">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Toplam Ciro</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">₺{stats.totalTurnover.toLocaleString()}</h3>
                                            <p className="text-xs text-gray-500 mt-1">Genel Toplam</p>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <DollarSign className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activities / Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Activities & Upcoming */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Completed Activities */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                                            Tamamlanan Birebirler
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {activities.filter((a: any) => new Date(a.meeting_date) < new Date()).length === 0 ? (
                                                <p className="text-gray-500 text-sm">Henüz tamamlanan bir aktivite yok.</p>
                                            ) : activities
                                                .filter((a: any) => new Date(a.meeting_date) < new Date())
                                                .slice(0, 6)
                                                .map((act: any) => (
                                                    <li key={act.id} className="flex flex-col p-3 bg-gray-50 rounded-md gap-1 border-l-4 border-green-500">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-medium text-gray-900 text-sm">
                                                                {act.requester_name} <span className="text-gray-400">→</span> {act.partner_name}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(act.meeting_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 italic line-clamp-1">"{act.notes}"</p>
                                                    </li>
                                                ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Upcoming Activities */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                                            Yaklaşan Birebirler
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {activities.filter((a: any) => new Date(a.meeting_date) >= new Date()).length === 0 ? (
                                                <p className="text-gray-500 text-sm">Planlanmış bir görüşme yok.</p>
                                            ) : activities
                                                .filter((a: any) => new Date(a.meeting_date) >= new Date())
                                                .sort((a: any, b: any) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
                                                .slice(0, 3)
                                                .map((act: any) => (
                                                    <li key={act.id} className="flex flex-col p-3 bg-blue-50 rounded-md gap-1 border-l-4 border-blue-500">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-medium text-gray-900 text-sm">
                                                                {act.requester_name} <span className="text-gray-400">↔</span> {act.partner_name}
                                                            </span>
                                                            <span className="text-xs text-blue-600 font-semibold">
                                                                {new Date(act.meeting_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 italic">"{act.notes}"</p>
                                                        <div className="flex justify-end">
                                                            <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Planlandı</span>
                                                        </div>
                                                    </li>
                                                ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                                        Dikkat Gerektirenler
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {(() => {
                                            // Check if meeting report exists for this week (assuming ISO week starts Monday)
                                            const today = new Date();
                                            const day = today.getDay(); // 0 is Sunday
                                            const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Audit: Monday
                                            const monday = new Date(today.setDate(diff));
                                            monday.setHours(0, 0, 0, 0);

                                            const hasMeetingThisWeek = meetings.some((m: any) => new Date(m.date) >= monday);

                                            if (!hasMeetingThisWeek) {
                                                return (
                                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center text-blue-700">
                                                        <FileText className="h-5 w-5 mr-2" />
                                                        <span>Bu haftaki toplantı raporu henüz girilmedi.</span>
                                                    </div>
                                                );
                                            }
                                            return <p className="text-gray-500 text-sm">Şu an dikkat gerektiren bir durum yok.</p>;
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* CONTENT: ATTENDANCE */}
                {activeTab === 'ATTENDANCE' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex justify-between items-center">
                                <CardTitle>Yoklama Yönetimi</CardTitle>
                                <Button variant="primary" onClick={() => setActiveTab('TAKE_ATTENDANCE')}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Bu Haftanın Yoklamasını Gir
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500 mb-4">Son toplantıların katılım oranları:</p>
                                <div className="space-y-4">
                                    {meetings.map((m: any) => (
                                        <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{m.topic}</h4>
                                                <p className="text-sm text-gray-500">{new Date(m.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="mr-4 text-right">
                                                    <span className="block text-2xl font-bold text-gray-900">%{Math.round((m.attendees_count / m.total_members) * 100)}</span>
                                                    <span className="text-xs text-gray-500">Katılım</span>
                                                </div>
                                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Substitute Notifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                                    Toplantı Vekil Bildirimleri
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {substitutes.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-4">Henüz bir vekil bildirimi yapılmamış.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplantı Tarihi</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Üye</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gelecek Vekil</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bildirim Tarihi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {substitutes.map((sub: any) => (
                                                    <tr key={sub.id} className="hover:bg-blue-50/30">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {new Date(sub.meeting_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                            {sub.user_name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                                                            {sub.substitute_name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                            {new Date(sub.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}



                {/* CONTENT: TAKE ATTENDANCE */}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Toplantı Konusu</label>
                                <input type="text" className="w-full border rounded-md p-2" defaultValue="Haftalık Toplantı" id="meeting-topic" />
                            </div>
                            <div className="overflow-x-auto border rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Üye</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Var</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Yok</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Geç</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Yedek</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {members.filter((m: any) => m.status === 'ACTIVE').map((member: any) => (
                                            <tr key={member.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{member.full_name}</td>
                                                {['PRESENT', 'ABSENT', 'LATE', 'SUBSTITUTE'].map((status) => (
                                                    <td key={status} className="px-6 py-4 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`status-${member.id}`}
                                                            checked={attendanceData[member.id] === status}
                                                            onChange={() => setAttendanceData({ ...attendanceData, [member.id]: status })}
                                                            className={`focus:ring-indigo-500 h-4 w-4 border-gray-300 ${status === 'PRESENT' ? 'text-green-600' : status === 'ABSENT' ? 'text-red-600' : status === 'LATE' ? 'text-yellow-600' : 'text-blue-600'}`}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button variant="primary" onClick={async () => {
                                    if (confirm('Yoklamayı kaydetmek istiyor musunuz?')) {
                                        try {
                                            const topic = (document.getElementById('meeting-topic') as HTMLInputElement).value;

                                            // Send to API
                                            await api.submitAttendance({
                                                group_id: selectedGroup.id,
                                                meeting_date: new Date().toISOString(),
                                                topic: topic,
                                                items: Object.entries(attendanceData).map(([uid, status]) => ({ user_id: uid, status }))
                                            });

                                            alert('Yoklama başarıyla kaydedildi.');
                                            setActiveTab('ATTENDANCE');

                                            // Refresh meetings list if possible
                                            const updatedMeetings = await api.getGroupMeetings(selectedGroup.id);
                                            setMeetings(updatedMeetings);

                                        } catch (e: any) {
                                            alert('Kaydedilirken hata oluştu: ' + (e.message || e));
                                            console.error(e);
                                        }
                                    }
                                }}>
                                    Yoklamayı Kaydet
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* CONTENT: MEMBERS */}
                {activeTab === 'MEMBERS' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Grup Üyeleri ve Performans</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İsim</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meslek</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performans</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {members.filter((m: any) => m.status === 'ACTIVE').map((m: any) => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 cursor-pointer hover:text-indigo-600 hover:underline" onClick={() => navigate(`/profile/${m.id}`)}>
                                                    {m.full_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{m.profession}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className={`px-3 py-1 text-xs rounded-full font-bold mr-2 ${m.performance_color === 'GREEN' ? 'bg-green-100 text-green-800' :
                                                            m.performance_color === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                                                                m.performance_color === 'RED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {m.performance_score || 0}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {m.performance_color === 'GREEN' ? 'Yeşil' :
                                                                m.performance_color === 'YELLOW' ? 'Sarı' :
                                                                    m.performance_color === 'RED' ? 'Kırmızı' : 'Gri'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{m.role}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* CONTENT: APPLICATIONS */}
                {activeTab === 'APPLICATIONS' && (
                    <div className="space-y-6">
                        {/* Group Applications */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                    <Users className="h-5 w-5 mr-3 text-indigo-600" />
                                    Grup Katılım Başvuruları
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {members.filter((m: any) => m.status === 'PENDING').length === 0 ? (
                                    <p className="text-gray-500 text-sm">Bekleyen grup katılım isteği yok.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {members.filter((m: any) => m.status === 'PENDING').map((m: any) => (
                                            <div key={m.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="flex items-center mb-3 sm:mb-0">
                                                    <Link to={`/profile/${m.id}`} className="flex items-center group">
                                                        <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3 group-hover:bg-indigo-200 transition-colors">
                                                            {m.full_name ? m.full_name.charAt(0) : 'U'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 group-hover:underline">
                                                                {m.full_name || m.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500">{m.profession} • {m.city}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">Başvuru: {new Date(m.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </Link>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleGroupRequest(m.id, 'REJECTED')} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                        Reddet
                                                    </Button>
                                                    <Button variant="primary" size="sm" onClick={() => handleGroupRequest(m.id, 'ACTIVE')}>
                                                        Onayla
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Power Team Applications */}
                        {myPowerTeam && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <Layers className="h-5 w-5 mr-3 text-purple-600" />
                                        Lonca Başvuruları ({myPowerTeam.name})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {ptMembers.filter((m: any) => m.status === 'PENDING').length === 0 ? (
                                        <p className="text-gray-500 text-sm">Bekleyen lonca katılım isteği yok.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {ptMembers.filter((m: any) => m.status === 'PENDING').map((m: any) => (
                                                <div key={m.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex items-center mb-3 sm:mb-0">
                                                        <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold mr-3">
                                                            {m.full_name ? m.full_name.charAt(0) : 'U'}
                                                        </div>
                                                        <div>
                                                            <h4
                                                                className="font-bold text-gray-900 cursor-pointer hover:text-indigo-600 hover:underline"
                                                                onClick={() => navigate(`/profile/${m.id}`)}
                                                            >
                                                                {m.full_name || m.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500">{m.profession} • {m.city}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">Başvuru: {new Date(m.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handlePTRequest(m.id, 'REJECTED')} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                            Reddet
                                                        </Button>
                                                        <Button variant="primary" size="sm" onClick={() => handlePTRequest(m.id, 'ACTIVE')}>
                                                            Onayla
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}


                {/* CONTENT: POWER TEAM MANAGEMENT */}
                {activeTab === 'POWER_TEAM' && myPowerTeam && (
                    <div className="space-y-6">
                        <div className="bg-purple-900 text-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold flex items-center">
                                <Layers className="h-6 w-6 mr-3" />
                                {myPowerTeam.name} - Lonca Yönetimi
                            </h2>
                            <p className="mt-2 text-purple-200 opacity-80">{myPowerTeam.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Takım Üyeleri</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="divide-y divide-gray-100">
                                        {ptMembers.filter((m: any) => m.status === 'ACTIVE').map((m: any) => (
                                            <li key={m.id} className="py-3 flex justify-between items-center">
                                                <div>
                                                    <p
                                                        className="font-medium text-gray-900 cursor-pointer hover:text-indigo-600 hover:underline"
                                                        onClick={() => navigate(`/profile/${m.id}`)}
                                                    >
                                                        {m.full_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{m.profession}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full">Aktif</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Sinerji Matrisi (En İyi İşbirlikleri)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {ptSynergy.slice(0, 5).map((s: any, idx: number) => (
                                            <li key={idx} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center max-w-[60%] truncate">
                                                    <span className="font-medium">{s.from}</span>
                                                    <span className="mx-2 text-gray-400">→</span>
                                                    <span className="font-medium">{s.to}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="w-16 h-2 bg-gray-100 rounded-full mr-2 overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{ width: `${Math.min(s.count * 10, 100)}%` }}></div>
                                                    </div>
                                                    <span className="font-bold text-gray-900">{s.count} İş</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* CONTENT: RESPONSIBILITIES */}
                {activeTab === 'RESPONSIBILITIES' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Grup Sorumluluk Atamaları</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-6 text-sm">
                                Grubun işleyişini sağlamak için üyelerinize görev ataması yapın. Bu görevler 6 aylık dönemler için geçerlidir.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { id: 'membership_president', title: 'Üyelik İşleri Başkanı', desc: 'Üyelik süreçlerini ve üye ilişkilerini yönetir.' },
                                    { id: 'visitor_president', title: 'Ziyaretçi Komitesi Başkanı', desc: 'Ziyaretçi davet ve karşılama süreçlerini yönetir.' },
                                    { id: 'one_to_one_coord', title: 'Birebir Koordinatörü', desc: 'Üyeler arası birebir görüşmeleri koordine eder.' },
                                    { id: 'edu_coord', title: 'Eğitim Koordinatörü', desc: 'Haftalık eğitim sunumlarını planlar.' },
                                    { id: 'event_planner', title: 'Etkinlik Sorumlusu', desc: 'Grup dışı sosyal etkinlikleri organize eder.' },
                                ].map((role) => (
                                    <div key={role.id} className="border rounded-lg p-4 bg-gray-50 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{role.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1 mb-4 h-8">{role.desc}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Sorumlu Üye</label>
                                            <select className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md bg-white shadow-sm">
                                                <option value="">Atama Yapılmadı</option>
                                                {members.map((m: any) => (
                                                    <option key={m.id} value={m.id}>{m.full_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-end border-t pt-4">
                                <Button variant="primary" onClick={() => alert('Sorumluluk atamaları kaydedildi!')}>
                                    Değişiklikleri Kaydet
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
