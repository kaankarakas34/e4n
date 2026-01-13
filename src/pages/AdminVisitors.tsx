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
    const [activeTab, setActiveTab] = useState<'visitors' | 'members'>('visitors');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [visitorsData, membersData] = await Promise.all([
                api.getPublicVisitors(),
                api.getMembers()
            ]);

            setVisitors(visitorsData || []);

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

    const handleVisitorStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.updatePublicVisitorStatus(id, newStatus);
            setVisitors(visitors.map(v => v.id === id ? { ...v, status: newStatus as any } : v));
        } catch (error) {
            console.error('Statü güncellenirken hata:', error);
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
                    <Button onClick={() => navigate('/admin')} className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Paneli
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('visitors')}
                        className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 flex items-center ${activeTab === 'visitors' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Ziyaretçi Formları ({visitors.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 flex items-center ${activeTab === 'members' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Yeni Üyelik Talepleri ({pendingMembers.length})
                    </button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {activeTab === 'visitors' ? 'Web Sitesi Ziyaretçi Talepleri' : 'Onay Bekleyen Üyelik Başvuruları'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Yükleniyor...</p>
                            </div>
                        ) : (activeTab === 'visitors' ? visitors.length === 0 : pendingMembers.length === 0) ? (
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meslek / Şirket</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(activeTab === 'visitors' ? visitors : pendingMembers).map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold flex-shrink-0">
                                                            {(item.name || item.full_name).charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{item.name || item.full_name}</div>
                                                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                                <Mail className="h-3 w-3 mr-1" /> {item.email}
                                                            </div>
                                                            {item.phone && (
                                                                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                                    <Phone className="h-3 w-3 mr-1" /> {item.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 font-medium flex items-center">
                                                        <Briefcase className="h-3 w-3 mr-1.5 text-gray-400" /> {item.profession}
                                                    </div>
                                                    {item.company && (
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
                                                    {activeTab === 'visitors' ? getStatusBadge(item.status) : (
                                                        <Badge className="bg-orange-100 text-orange-800">Onay Bekliyor</Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {activeTab === 'visitors' ? (
                                                        <select
                                                            value={item.status}
                                                            onChange={(e) => handleVisitorStatusChange(item.id, e.target.value)}
                                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                                        >
                                                            <option value="PENDING">Bekliyor</option>
                                                            <option value="CONTACTED">İletişime Geçildi</option>
                                                            <option value="CONVERTED">Üye Oldu</option>
                                                            <option value="REJECTED">Reddedildi</option>
                                                        </select>
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
        </div>
    );
}
