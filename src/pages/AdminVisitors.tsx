import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Shield, Phone, Mail, Building, Briefcase, Calendar, CheckCircle, Clock, XCircle, UserPlus, FileText } from 'lucide-react';

interface PublicVisitor {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    profession: string;
    created_at: string;
    status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
    inviter_name?: string;
    title?: string;
    web_linkedin?: string;
    activity_area?: string;
    duration?: string;
    target_customer?: string;
    why_join?: string;
    value_add?: string;
    previous_groups?: string;
    form_data?: any;
    source?: string;
    event_id?: string;
    event_title?: string;
    event_start_at?: string;
}

interface Member {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    company?: string;
    profession?: string;
    status: string;
    created_at: string;
    profession_status?: 'APPROVED' | 'PENDING' | 'REJECTED';
    profession_id?: string;
    profession_category?: string;
}

export function AdminVisitors() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [visitors, setVisitors] = useState<PublicVisitor[]>([]);
    const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'visitors' | 'members' | 'education'>('visitors');
    const [groups, setGroups] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    const getFilteredItems = () => {
        if (activeTab === 'visitors') {
            return visitors.filter(v => {
                if (selectedEventId && v.event_id !== selectedEventId) {
                    return false;
                }
                if (v.why_join && v.why_join.trim() !== '') return true;
                return (
                    v.source !== 'education_application' && 
                    v.source !== 'on_degerlendirme' && 
                    v.source !== 'meta_import' && 
                    v.source !== 'legacy_data'
                );
            });
        } else if (activeTab === 'education') {
            return visitors.filter(v => {
                if (selectedEventId && v.event_id !== selectedEventId) {
                    return false;
                }
                return v.source === 'education_application';
            });
        } else {
            return pendingMembers;
        }
    };
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [selectedVisitorForGroup, setSelectedVisitorForGroup] = useState<PublicVisitor | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedVisitorDetails, setSelectedVisitorDetails] = useState<PublicVisitor | null>(null);

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [inviteError, setInviteError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [visitorsData, membersData, groupsData, eventsData] = await Promise.all([
                api.getPublicVisitors(),
                api.getMembers(),
                api.getGroups(),
                api.getEvents()
            ]);

            setVisitors(visitorsData || []);
            setGroups(groupsData || []);
            setEvents(eventsData || []);

            if (Array.isArray(membersData)) {
                // Filter only PENDING members for this view
                setPendingMembers(membersData.filter((m: any) => m.status === 'PENDING' || m.account_status === 'PENDING'));
            }
        } catch (error) {
            console.error('Veriler getirilirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVisitorStatusChange = async (id: string, newStatus: string, groupId?: string) => {
        try {
            if (newStatus === 'REJECTED') {
                await api.deletePublicVisitor(id);
                setVisitors(visitors.filter(v => v.id !== id));
                return;
            }

            if (groupId) {
                await api.updatePublicVisitorStatus(id, newStatus, groupId);
            } else {
                await api.updatePublicVisitorStatus(id, newStatus);
            }
            setVisitors(visitors.map(v => v.id === id ? { ...v, status: newStatus as any } : v));
        } catch (error) {
            console.error('İşlem sırasında hata:', error);
        }
    };

    const confirmVisitorApprove = async () => {
        if (!selectedVisitorForGroup || !selectedGroupId) return;
        try {
            // Update backend
            // Update backend using the api utility
            await api.updatePublicVisitorStatus(selectedVisitorForGroup.id, 'CONVERTED', selectedGroupId);

            setVisitors(visitors.map(v => v.id === selectedVisitorForGroup.id ? { ...v, status: 'CONVERTED' } : v));
            setIsGroupModalOpen(false);
            setSelectedVisitorForGroup(null);
            setSelectedGroupId('');
            alert('Ziyaretçi başarıyla gruba atandı ve onaylandı.');
        } catch (error) {
            console.error('Onay hatası:', error);
            alert('İşlem sırasında bir hata oluştu.');
        }
    };

    const [selectedApplication, setSelectedApplication] = useState<Member | null>(null);

    const handleApproveMember = async (member: Member) => {
        if (!confirm(`${member.full_name} isimli üyenin kaydını onaylamak istiyor musunuz?`)) return;

        try {
            // 1. Approve Profession if needed
            if (member.profession_status === 'PENDING' && member.profession_id) {
                await api.updateProfession(member.profession_id, {
                    name: member.profession || '',
                    category: member.profession_category || 'Genel',
                    status: 'APPROVED'
                } as any);
            }

            // 2. Approve User
            const res = await api.updateMember(member.id, { status: 'ACTIVE' } as any);
            console.log('Update response:', res);

            // Remove from local list
            setPendingMembers(pendingMembers.filter(m => m.id !== member.id));
            alert('Üye kaydı başarıyla onaylandı ve aktif edildi.');
        } catch (error: any) {
            console.error('Onay hatası:', error);
            alert(`İşlem sırasında bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Bekliyor</Badge>;
            case 'CONTACTED':
                return <Badge className="bg-blue-100 text-blue-800"><Phone className="w-3 h-3 mr-1" /> İletişime Geçildi</Badge>;
            case 'CONVERTED':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Üye Oldu</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Reddedildi</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Erişim Kısıtlı</h2>
                    <p className="text-gray-500">Bu sayfayı görüntüleme yetkiniz yok.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Gelen Başvurular</h1>
                    <div className="flex space-x-3">
                        <Button onClick={() => {
                            setIsInviteModalOpen(true);
                            setInviteStatus('idle');
                            setInviteEmail('');
                        }} className="bg-red-600 hover:bg-red-700 text-white flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            Ziyaretçi Davet Et
                        </Button>
                        <Button onClick={() => navigate('/admin')} className="flex items-center" variant="outline">
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Paneli
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('visitors')}
                        className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 flex items-center ${activeTab === 'visitors' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Ziyaretçi Formları ({visitors.filter(v => {
                            if (v.why_join && v.why_join.trim() !== '') return true;
                            return (
                                v.source !== 'education_application' && 
                                v.source !== 'on_degerlendirme' && 
                                v.source !== 'meta_import' && 
                                v.source !== 'legacy_data'
                            );
                        }).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 flex items-center ${activeTab === 'members' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Yeni Üyelik Talepleri ({pendingMembers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('education')}
                        className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 flex items-center ${activeTab === 'education' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Shield className="w-4 h-4 mr-2" />
                        Eğitim Başvuruları ({visitors.filter(v => v.source === 'education_application').length})
                    </button>
                </div>

                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4 border-b border-gray-100">
                        <CardTitle>
                            {activeTab === 'visitors' 
                                ? 'Web Sitesi Ziyaretçi Talepleri' 
                                : activeTab === 'education' 
                                    ? 'Eğitim Başvuruları' 
                                    : 'Onay Bekleyen Üyelik Başvuruları'}
                        </CardTitle>
                        {(activeTab === 'visitors' || activeTab === 'education') && (
                            <div className="flex items-center space-x-2 w-full md:w-auto">
                                <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Etkinlik Filtresi:</label>
                                <select
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    className="w-full md:w-[260px] h-9 rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">Tüm Etkinlikler</option>
                                    {events.map((e: any) => (
                                        <option key={e.id} value={e.id}>
                                            {e.title} ({new Date(e.start_at).toLocaleDateString('tr-TR')})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Yükleniyor...</p>
                            </div>
                        ) : (getFilteredItems().length === 0) ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Kayıt Bulunamadı</h3>
                                <p className="text-gray-500">Bu kategoride bekleyen başvuru yoktur.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad / İletişim</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{activeTab === 'education' ? 'Çalışma Durumu' : 'Meslek / Şirket'}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {getFilteredItems().map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold flex-shrink-0">
                                                            {(item.name || item.full_name).charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                                {item.name || item.full_name}
                                                                {(item.source === 'visitor_invite' || item.form_data?.payment_status === 'FREE') && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                                                        Davetli (Ücretsiz)
                                                                    </span>
                                                                )}
                                                                {item.source === 'visitor_payment' && item.form_data?.payment_status === 'PAID' && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                                                        Ödemeli (₺1.000)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                                <Mail className="h-3 w-3 mr-1" /> {item.email}
                                                            </div>
                                                            {item.phone && (
                                                                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                                    <Phone className="h-3 w-3 mr-1" /> {item.phone}
                                                                </div>
                                                            )}
                                                            {(activeTab === 'visitors' || activeTab === 'education') && item.inviter_name && (
                                                                <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    <UserPlus className="h-3 w-3 mr-1" /> Ref: {item.inviter_name}
                                                                </div>
                                                            )}
                                                            {(activeTab === 'visitors' || activeTab === 'education') && item.event_title && (
                                                                <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                    <Calendar className="h-3 w-3 mr-1" /> Etkinlik: {item.event_title} {item.event_start_at && `(${new Date(item.event_start_at).toLocaleDateString('tr-TR')})`}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 font-medium flex items-center">
                                                        <Briefcase className="h-3 w-3 mr-1.5 text-gray-400" /> {item.profession}
                                                    </div>
                                                    {item.company && activeTab !== 'education' && (
                                                        <div className="text-sm text-gray-500 flex items-center mt-1">
                                                            <Building className="h-3 w-3 mr-1.5 text-gray-400" /> {item.company}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                        {new Date(item.created_at).toLocaleDateString('tr-TR')}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 pl-6">
                                                        {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(activeTab === 'visitors' || activeTab === 'education') ? getStatusBadge(item.status) : (
                                                        <Badge className="bg-orange-100 text-orange-800">Onay Bekliyor</Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {(activeTab === 'visitors' || activeTab === 'education') ? (
                                                        <div className="flex space-x-2">
                                                            {item.status !== 'CONVERTED' ? (
                                                                <>
                                                                    {activeTab === 'visitors' && (
                                                                        <Button size="sm" onClick={() => {
                                                                            setSelectedVisitorForGroup(item);
                                                                            setIsGroupModalOpen(true);
                                                                        }} className="bg-green-600 hover:bg-green-700 text-white">
                                                                            <CheckCircle className="w-4 h-4 mr-1" /> Onayla
                                                                        </Button>
                                                                    )}
                                                                    {activeTab === 'education' && item.status !== 'CONTACTED' && (
                                                                        <Button size="sm" onClick={() => handleVisitorStatusChange(item.id, 'CONTACTED')} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                                            <Phone className="w-4 h-4 mr-1" /> İletişime Geçildi
                                                                        </Button>
                                                                    )}
                                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setSelectedVisitorDetails(item)}>
                                                                        <FileText className="w-4 h-4 mr-1" /> Detayları Gör
                                                                    </Button>
                                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                                                                        if (confirm('Başvuruyu silmek istediğinize emin misiniz?')) {
                                                                            handleVisitorStatusChange(item.id, 'REJECTED');
                                                                        }
                                                                    }}>
                                                                        <XCircle className="w-4 h-4 mr-1" /> Sil
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">Onaylandı</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex space-x-2">
                                                            <Button size="sm" onClick={() => handleApproveMember(item)} className="bg-green-600 hover:bg-green-700 text-white">
                                                                <CheckCircle className="w-4 h-4 mr-1" /> Onayla
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={() => setSelectedApplication(item)}>
                                                                <FileText className="w-4 h-4 mr-1" /> İncele
                                                            </Button>
                                                        </div>
                                                    )}
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


            {/* Application Detail Modal */}
            {selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Başvuru Detayı</h2>
                            <button onClick={() => setSelectedApplication(null)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Kapat</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Ad Soyad</label>
                                <p className="mt-1 text-lg font-medium text-gray-900">{selectedApplication.full_name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">E-posta</label>
                                    <p className="mt-1 text-base text-gray-900">{selectedApplication.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Telefon</label>
                                    <p className="mt-1 text-base text-gray-900">{selectedApplication.phone || '-'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Şirket</label>
                                    <p className="mt-1 text-base text-gray-900">{selectedApplication.company || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Meslek</label>
                                    <div className="flex items-center mt-1">
                                        <p className="text-base text-gray-900">{selectedApplication.profession || '-'}</p>
                                        {selectedApplication.profession_status === 'PENDING' && (
                                            <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">Yeni Meslek</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500">Başvuru Tarihi</label>
                                <p className="mt-1 text-base text-gray-900">
                                    {new Date(selectedApplication.created_at).toLocaleString('tr-TR')}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
                                <h4 className="font-medium text-gray-700 mb-2">Onay Durumları</h4>
                                <ul className="space-y-1 text-gray-600">
                                    <li className="flex items-center"><CheckCircle className="w-3 h-3 text-green-500 mr-2" /> Üyelik Sözleşmesi: Kabul Edildi</li>
                                    <li className="flex items-center"><CheckCircle className="w-3 h-3 text-green-500 mr-2" /> KVKK Aydınlatma Metni: Okundu/Onaylandı</li>
                                    <li className="flex items-center"><CheckCircle className="w-3 h-3 text-green-500 mr-2" /> Açık Rıza Metni: Onaylandı</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => setSelectedApplication(null)}>Kapat</Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { handleApproveMember(selectedApplication); setSelectedApplication(null); }}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Başvuruyu Onayla
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Visitor Detail Modal */}
            {selectedVisitorDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6 pb-4 border-b">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Değerlendirme Başvurusu Detayı</h2>
                                <p className="text-sm text-gray-500 mt-1">{new Date(selectedVisitorDetails.created_at).toLocaleString('tr-TR')}</p>
                            </div>
                            <button onClick={() => setSelectedVisitorDetails(null)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Kapat</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {selectedVisitorDetails.source === 'education_application' ? (
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Aday Bilgileri</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-slate-500">Ad Soyad</label>
                                            <p className="font-medium text-gray-900">{selectedVisitorDetails.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-500">Telefon</label>
                                            <p className="font-medium text-gray-900">{selectedVisitorDetails.phone}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-500">E-posta</label>
                                            <p className="font-medium text-gray-900">{selectedVisitorDetails.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-500">Çalışma Durumu / Ünvan</label>
                                            <p className="font-medium text-gray-900">{selectedVisitorDetails.profession}</p>
                                        </div>
                                        {selectedVisitorDetails.event_title && (
                                            <div className="col-span-2">
                                                <label className="block text-sm text-slate-500">Katılmak İstediği Toplantı / Etkinlik</label>
                                                <p className="font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-md border border-purple-200 mt-1 inline-block">
                                                    {selectedVisitorDetails.event_title} {selectedVisitorDetails.event_start_at && `(${new Date(selectedVisitorDetails.event_start_at).toLocaleDateString('tr-TR')})`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Eğitime Katılma Nedeni</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                                        {selectedVisitorDetails.why_join || selectedVisitorDetails.form_data?.why_take_training || '-'}
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Temel Bilgiler */}
                                <section>
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Kişisel Bilgiler</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm text-gray-500">Ad Soyad</label><p className="font-medium text-gray-900">{selectedVisitorDetails.name}</p></div>
                                        <div><label className="block text-sm text-gray-500">Telefon</label><p className="font-medium text-gray-900">{selectedVisitorDetails.phone}</p></div>
                                        <div><label className="block text-sm text-gray-500">E-posta</label><p className="font-medium text-gray-900">{selectedVisitorDetails.email}</p></div>
                                        <div><label className="block text-sm text-gray-500">Şehir</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.city || '-'}</p></div>
                                        <div className="col-span-2"><label className="block text-sm text-gray-500">LinkedIn</label><p className="font-medium text-blue-600 break-all">{selectedVisitorDetails.form_data?.linkedin_profile || '-'}</p></div>
                                        {selectedVisitorDetails.event_title && (
                                            <div className="col-span-2">
                                                <label className="block text-sm text-gray-500">Seçilen Toplantı / Etkinlik</label>
                                                <p className="font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-md border border-purple-200 mt-1 inline-block">
                                                    {selectedVisitorDetails.event_title} {selectedVisitorDetails.event_start_at && `(${new Date(selectedVisitorDetails.event_start_at).toLocaleDateString('tr-TR')})`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Şirket / Profesyonel Profil</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm text-gray-500">Şirket</label><p className="font-medium text-gray-900">{selectedVisitorDetails.company}</p></div>
                                        <div><label className="block text-sm text-gray-500">Ünvan</label><p className="font-medium text-gray-900">{selectedVisitorDetails.title || selectedVisitorDetails.form_data?.title || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Faaliyet Alanı</label><p className="font-medium text-gray-900">{selectedVisitorDetails.profession || selectedVisitorDetails.activity_area || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Sektör</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.industry || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Faaliyet Süresi</label><p className="font-medium text-gray-900">{selectedVisitorDetails.duration || selectedVisitorDetails.form_data?.duration || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Web / LinkedIn</label><p className="font-medium text-blue-600 break-all">{selectedVisitorDetails.web_linkedin || selectedVisitorDetails.form_data?.web_linkedin || '-'}</p></div>
                                    </div>
                                </section>

                                {(selectedVisitorDetails.form_data?.tax_number || selectedVisitorDetails.form_data?.address || selectedVisitorDetails.form_data?.payment_status) && (
                                    <section>
                                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Fatura &amp; Ödeme Bilgileri</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-sm text-gray-500">Vergi Numarası / T.C.</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.tax_number || '-'}</p></div>
                                            <div>
                                                <label className="block text-sm text-gray-500">Ödeme Durumu</label>
                                                <p className="font-medium text-gray-900">
                                                    {selectedVisitorDetails.form_data?.payment_status === 'FREE' ? (
                                                        <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded text-xs">Davetli (Ücretsiz)</span>
                                                    ) : selectedVisitorDetails.form_data?.payment_status === 'PAID' ? (
                                                        <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded text-xs">₺1.000 (Ödendi)</span>
                                                     ) : (
                                                         '-'
                                                     )}
                                                </p>
                                            </div>
                                            <div className="col-span-2"><label className="block text-sm text-gray-500">Fatura Adresi</label><p className="font-medium text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.address || '-'}</p></div>
                                        </div>
                                    </section>
                                )}

                                <section>
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">İş Hacmi ve Uzmanlık</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div><label className="block text-sm text-gray-500">İşletme Seviyesi</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.business_level || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">İş Hacmi</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.business_volume || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Ekip Büyüklüğü</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.team_size || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Aylık Müşteri/Proje</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.monthly_customers || '-'}</p></div>
                                    </div>
                                    <div className="space-y-4">
                                        <div><label className="block text-sm text-gray-500">Hedef Müşteri Profili</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.target_customer || selectedVisitorDetails.form_data?.target_customer || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">İş Tanımı (2-3 cümle)</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.business_description || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Ayıran Güçlü Yön</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.differentiating_factor || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Sağlanan Değer</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.value_provided || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">İdeal Yönlendirme</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.ideal_referral || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Başarı Örneği</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.success_story || '-'}</p></div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Networke Katkı ve Karşılıklı Değer</h3>
                                    <div className="space-y-4">
                                        <div><label className="block text-sm text-gray-500">Event4Network'e Katacağı Değer</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.value_add || selectedVisitorDetails.form_data?.value_add || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Mevcut İş Çevresi</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.network_size || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Güçlü Bağlantı Sektörleri</label><p className="text-gray-900">{selectedVisitorDetails.form_data?.network_sectors || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Sağlayabileceği Bağlantılar</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.network_opportunities || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Referans Örneği</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.referral_example || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">Network Paylaşım Yaklaşımı</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.network_sharing_approach || '-'}</p></div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Niyet Mektubu ve Beklentiler</h3>
                                    <div className="space-y-4">
                                        <div><label className="block text-sm text-gray-500">Katılım Niyeti</label><p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedVisitorDetails.why_join || selectedVisitorDetails.form_data?.why_join || '-'}</p></div>
                                        <div>
                                            <label className="block text-sm text-gray-500">Öncelikli Beklentiler</label>
                                            <ul className="list-disc pl-5 mt-1 text-gray-900">
                                                {Array.isArray(selectedVisitorDetails.form_data?.primary_expectation) 
                                                    ? selectedVisitorDetails.form_data.primary_expectation.map((e: string, i: number) => <li key={i}>{e}</li>)
                                                    : <li>{selectedVisitorDetails.form_data?.primary_expectation || '-'}</li>}
                                            </ul>
                                        </div>
                                        <div><label className="block text-sm text-gray-500">Tanışmak İstenen Kişiler</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.target_connection_types || '-'}</p></div>
                                        <div><label className="block text-sm text-gray-500">İdeal İş Yönlendirmesi Tanımı</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.form_data?.ideal_referral_definition || '-'}</p></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-sm text-gray-500">Zaman Ayırma Taahhüdü</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.time_commitment || '-'}</p></div>
                                            <div><label className="block text-sm text-gray-500">Önemsenen En Temel Değer</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.core_value || '-'}</p></div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Deneyim, Referans ve Onaylar</h3>
                                    <div className="space-y-4">
                                        <div><label className="block text-sm text-gray-500">Daha Önceki Topluluk/Grup Deneyimi</label><p className="text-gray-900 whitespace-pre-wrap">{selectedVisitorDetails.previous_groups || selectedVisitorDetails.form_data?.previous_groups || '-'}</p></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-sm text-gray-500">Nereden Duydu?</label><p className="font-medium text-gray-900">{selectedVisitorDetails.form_data?.discovery_source || '-'}</p></div>
                                            <div><label className="block text-sm text-gray-500">Sisteme Öneren Kişi (Referans)</label>
                                                <p className="font-medium text-gray-900">
                                                    {selectedVisitorDetails.form_data?.referral_name || selectedVisitorDetails.inviter_name || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                            </div>
                        )}

                        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => setSelectedVisitorDetails(null)}>Kapat</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Assignment Modal for Visitors */}
            {isGroupModalOpen && selectedVisitorForGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Gruba Ata ve Onayla</h2>
                            <button onClick={() => { setIsGroupModalOpen(false); setSelectedVisitorForGroup(null); }} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Kapat</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">
                                <strong>{selectedVisitorForGroup.name}</strong> isimli ziyaretçi için hangi gruba atama yapmak istiyorsunuz?
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Grup Seçin</label>
                                <select
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                >
                                    <option value="">-- Grup Seçiniz --</option>
                                    {groups.filter(g => !g.status || g.status.toUpperCase() === 'ACTIVE').map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => { setIsGroupModalOpen(false); setSelectedVisitorForGroup(null); }}>İptal</Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={!selectedGroupId} onClick={confirmVisitorApprove}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Onayla ve Ata
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Visitor Invitation Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Ziyaretçi Davet Et</h2>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Kapat</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-4">
                            Bu alandan davet edeceğiniz e-posta adresine 6 saat geçerli, ücretsiz ziyaretçi kayıt bağlantısı gönderilir.
                        </p>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!inviteEmail.trim()) return;
                            setInviteLoading(true);
                            setInviteStatus('idle');
                            try {
                                await api.sendVisitorInvite({
                                    email: inviteEmail.trim(),
                                    origin: window.location.origin
                                });
                                setInviteStatus('success');
                                setInviteEmail('');
                            } catch (err: any) {
                                console.error(err);
                                setInviteStatus('error');
                                setInviteError(err.message || 'Davetiye gönderilemedi.');
                            } finally {
                                setInviteLoading(false);
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="davetli@sirket.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 text-sm outline-none animate-all"
                                />
                            </div>

                            {inviteStatus === 'success' && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium">
                                    Davetiye başarıyla gönderildi!
                                </div>
                            )}

                            {inviteStatus === 'error' && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                                    {inviteError}
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>Kapat</Button>
                                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" isLoading={inviteLoading}>Gönder</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
