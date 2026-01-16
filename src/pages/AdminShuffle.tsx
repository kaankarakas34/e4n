import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { ArrowLeft, Save, AlertTriangle, Lock, Unlock, Shuffle, RefreshCw, XCircle } from 'lucide-react';
import { distributeMembers } from '../utils/shuffleAlgorithm';

// Member Card Component with Lock
function MemberCard({ member, isLocked, onToggleLock }: { member: any, isLocked: boolean, onToggleLock: () => void }) {
    return (
        <div className={`p-3 bg-white border rounded-md shadow-sm mb-2 flex items-center justify-between group 
            ${member.profession === 'CONFLICT' ? 'border-red-500 bg-red-50' : isLocked ? 'border-indigo-400 bg-indigo-50' : 'hover:border-indigo-300'}`}>
            <div>
                <div className="font-medium text-sm text-gray-900">{member.full_name || member.name}</div>
                <div className="text-xs text-gray-500">{member.profession}</div>
            </div>
            <button
                onClick={onToggleLock}
                className={`p-1 rounded-full hover:bg-gray-200 transition-colors ${isLocked ? 'text-indigo-600' : 'text-gray-300'}`}
                title={isLocked ? "Kilidi Aç" : "Bu grupta kilitle"}
            >
                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
        </div>
    );
}

export function AdminShuffle() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [items, setItems] = useState<Record<string, string[]>>({}); // groupId -> memberIds
    const [lockedMembers, setLockedMembers] = useState<string[]>([]);
    const [stats, setStats] = useState({ conflicts: 0, maxOverlap: 0 });
    const [excludedCount, setExcludedCount] = useState(0);
    const [periodEndDate, setPeriodEndDate] = useState(new Date().toISOString().split('T')[0]); // Default to today for demo
    const [shuffleDate, setShuffleDate] = useState<string>('');
    const [canShuffle, setCanShuffle] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        calculateShuffleDate();
    }, [periodEndDate]);

    const calculateShuffleDate = () => {
        const end = new Date(periodEndDate);
        // "1 dönem bitmeden 2 gün önce"
        const target = new Date(end);
        target.setDate(end.getDate() - 2);

        // "haftasonuna denk geldiyse sonraki ilk iş günü"
        // 0 = Sunday, 6 = Saturday
        if (target.getDay() === 0) { // Sunday -> Monday (+1)
            target.setDate(target.getDate() + 1);
        } else if (target.getDay() === 6) { // Saturday -> Monday (+2)
            target.setDate(target.getDate() + 2);
        }

        const dateStr = target.toLocaleDateString('tr-TR');
        setShuffleDate(dateStr);

        // Check if today is the day (Simulated check)
        // In real app, we compare new Date() with target
        setCanShuffle(true); // Allow for demo, but normally would check date
    };

    const loadData = async () => {
        const [g, m] = await Promise.all([api.getGroups(), api.getMembers()]);
        setGroups(g);

        // Filter active members only AND exclude ADMINs
        // Mocking subscription_status if missing for demo purposes, assume explicit ACTIVE check
        const activeMembers = m.filter((mem: any) => mem.account_status === 'ACTIVE' && mem.role !== 'ADMIN');
        const excluded = m.length - activeMembers.length;
        setExcludedCount(excluded);

        // Add mock previous_group_id to members for testing overlap roughly
        const membersWithHistory = activeMembers.map((mem: any, i: number) => ({
            ...mem,
            previous_group_id: g[i % 3]?.id || '1' // Mock history: members came from first 3 groups mostly
        }));
        setMembers(membersWithHistory);

        // Initial Dist: Just place them as they are in DB or Random
        const initialItems: Record<string, string[]> = {};
        g.forEach((group: any) => initialItems[group.id] = []);
        membersWithHistory.forEach((member: any, index: number) => {
            const groupIndex = index % g.length;
            initialItems[g[groupIndex].id].push(member.id);
        });
        setItems(initialItems);
        calculateStats(initialItems, membersWithHistory, g);
    };

    // ... calculateStats ...
    const calculateStats = (currentItems: Record<string, string[]>, currentMembers: any[], currentGroups: any[]) => {
        let conflictCount = 0;
        let maxOverlapCount = 0;

        currentGroups.forEach(g => {
            const groupMemberIds = currentItems[g.id] || [];
            const groupMembers = groupMemberIds.map(id => currentMembers.find(m => m.id === id)).filter(Boolean);

            // Check Profession Conflicts
            const professions = groupMembers.map(m => m.profession);
            const hasDupes = professions.some((p, i) => professions.indexOf(p) !== i);
            if (hasDupes) conflictCount++; // Count groups with conflicts, or could count total people in conflict

            // Check Overlap (Max people from same previous group)
            const historyCounts: Record<string, number> = {};
            groupMembers.forEach(m => {
                if (m.previous_group_id) {
                    historyCounts[m.previous_group_id] = (historyCounts[m.previous_group_id] || 0) + 1;
                }
            });
            const currentMax = Math.max(...Object.values(historyCounts), 0);
            if (currentMax > maxOverlapCount) maxOverlapCount = currentMax;
        });

        setStats({ conflicts: conflictCount, maxOverlap: maxOverlapCount });
    };

    const handleShuffle = () => {
        if (!canShuffle) {
            if (!window.confirm('Planlanan shuffle tarihi henüz gelmedi. Yine de devam etmek istiyor musunuz?')) return;
        }

        const result = distributeMembers(members, groups, items, lockedMembers, {
            respectLocks: true,
            minimizeOverlap: true,
            maxAttempts: 1
        });
        setItems(result);
        calculateStats(result, members, groups);
    };

    const toggleLock = (memberId: string) => {
        if (lockedMembers.includes(memberId)) {
            setLockedMembers(lockedMembers.filter(id => id !== memberId));
        } else {
            setLockedMembers([...lockedMembers, memberId]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" onClick={() => navigate('/admin/groups')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Gruplara Dön
                        </Button>
                        <h1 className="text-2xl font-bold">Grup Shuffle Yönetimi</h1>
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={loadData}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Sıfırla
                        </Button>
                        <Button variant="primary" onClick={async () => {
                            if (!window.confirm('Bu dağıtımı kaydetmek istediğinize emin misiniz? Mevcut liderlik rolleri sıfırlanacak ve üyeler yeni gruplarına atanacaktır.')) return;
                            try {
                                await api.saveShuffle(items);
                                // Notify members
                                await api.notifyMembersOfShuffle(items);
                                alert('Dağıtım kaydedildi ve üyelere bildirim maili gönderildi!');
                                loadData(); // Reload to see fresh state
                            } catch (error) {
                                console.error(error);
                                alert('Kaydedilirken bir hata oluştu.');
                            }
                        }}>
                            <Save className="h-4 w-4 mr-2" /> Dağıtımı Kaydet
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    {/* Control Panel */}
                    <Card className="lg:col-span-1">
                        <CardHeader><CardTitle>Ayarlar & Durum</CardTitle></CardHeader>
                        <CardContent className="space-y-4">

                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                                <p className="text-sm font-bold text-yellow-800 mb-1">Dönem Kontrolü</p>
                                <div className="text-xs text-yellow-700 space-y-2">
                                    <div>
                                        <label className="block mb-1">Dönem Bitiş Tarihi:</label>
                                        <input
                                            type="date"
                                            value={periodEndDate}
                                            onChange={(e) => setPeriodEndDate(e.target.value)}
                                            className="w-full text-xs p-1 rounded border"
                                        />
                                    </div>
                                    <p>Planlanan Shuffle: <strong>{shuffleDate}</strong></p>
                                </div>
                            </div>

                            {excludedCount > 0 && (
                                <div className="bg-red-50 p-3 rounded-md border border-red-200 flex items-start">
                                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-red-800">Ödeme Uyarısı</p>
                                        <p className="text-xs text-red-700">
                                            {excludedCount} üye aktif aboneliği olmadığı için shuffle'a dahil edilmedi.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleShuffle}>
                                <Shuffle className="h-4 w-4 mr-2" />
                                Akıllı Dağıt (Shuffle)
                            </Button>

                            <Button className="w-full bg-red-600 hover:bg-red-700 mt-2" onClick={() => navigate('/admin')}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Durdur / Kapat
                            </Button>


                            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                                <p className="font-bold mb-1">Dağıtım Kuralları:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Periyot: <strong>4 ayda bir</strong></li>
                                    <li>Kapsam: Tüm gruplar birlikte (Güç Takımları hariç)</li>
                                    <li>Her grupta 1 benzersiz meslek</li>
                                    <li>Eski grup arkadaşları ayrıştırılır</li>
                                    <li>Kilitli üyeler yerinde kalır</li>
                                </ul>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">İstatistikler</p>
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className={`p-2 rounded border ${stats.conflicts > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                        <div className="text-xl font-bold">{stats.conflicts}</div>
                                        <div className="text-xs">Çakışan Grup</div>
                                    </div>
                                    <div className="p-2 rounded border bg-gray-50 border-gray-200 text-gray-700">
                                        <div className="text-xl font-bold">{stats.maxOverlap}</div>
                                        <div className="text-xs">Max Çakışma</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Groups Area */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Unassigned Members Warning */}
                        {items['unassigned'] && items['unassigned'].length > 0 && (
                            <Card className="border-red-500 bg-red-50 shadow-md">
                                <CardHeader className="py-3 border-b border-red-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-red-800 font-bold">
                                            <AlertTriangle className="mr-2 h-5 w-5" />
                                            Atanamayan Üyeler ({items['unassigned'].length})
                                        </div>
                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Kritik Çakışma</span>
                                    </div>
                                    <p className="text-sm text-red-700 mt-1">
                                        Aşağıdaki üyeler, mevcut grup yapısında meslek çakışması (Conflict) olmaksızın yerleştirilememiştir.
                                        Lütfen manuel olarak yeni bir grup açmayı veya meslek kollarını düzenlemeyi değerlendirin.
                                    </p>
                                </CardHeader>
                                <CardContent className="py-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {items['unassigned'].map(id => {
                                            const m = members.find(mem => mem.id === id);
                                            if (!m) return null;
                                            return (
                                                <div key={id} className="bg-white border border-red-300 p-3 rounded shadow-sm flex flex-col">
                                                    <span className="font-bold text-gray-900">{m.full_name}</span>
                                                    <span className="text-xs text-red-600 font-semibold">{m.profession}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.map(group => {
                                const groupMemberIds = items[group.id] || [];
                                const groupMembers = groupMemberIds.map(id => members.find(m => m.id === id)).filter(Boolean);

                                // Local conflict check
                                const professions = groupMembers.map(m => m.profession);
                                const hasConflict = professions.some((p, i) => professions.indexOf(p) !== i);

                                return (
                                    <Card key={group.id} className={`min-h-[200px] flex flex-col ${hasConflict ? 'ring-2 ring-red-400' : ''}`}>
                                        <CardHeader className="bg-gray-50 border-b py-3 flex-shrink-0">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-base">{group.name}</CardTitle>
                                                <div className="flex items-center space-x-2">
                                                    {hasConflict && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                                        {groupMemberIds.length} Üye
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3 bg-gray-50/30 flex-grow overflow-y-auto max-h-[500px]">
                                            <div className="space-y-2">
                                                {groupMembers.map(member => (
                                                    <MemberCard
                                                        key={member.id}
                                                        member={member}
                                                        isLocked={lockedMembers.includes(member.id)} // Pass lock state
                                                        onToggleLock={() => toggleLock(member.id)}
                                                    />
                                                ))}
                                                {groupMembers.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Üye yok</p>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
