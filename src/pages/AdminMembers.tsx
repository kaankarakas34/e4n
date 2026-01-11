import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Input } from '../shared/Input';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Phone,
  MapPin,
  CheckCircle,
  ArrowRightLeft
} from 'lucide-react';

interface Member {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  phone?: string;
  company?: string;
  profession?: string;
  city?: string;
  created_at: string;
  last_login?: string;
  subscription_status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  subscription_end_date?: string;
  group_name?: string;
  profession_status?: 'APPROVED' | 'PENDING' | 'REJECTED';
  profession_id?: string;
  profession_category?: string;
}

interface Group {
  id: string;
  name: string;
}

export function AdminMembers() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Move Modal State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, filterRole, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, groupsData] = await Promise.all([
        api.getMembers(),
        api.getGroups()
      ]);

      if (Array.isArray(membersData)) {
        setMembers(membersData);
      } else {
        setMembers([]);
      }

      if (Array.isArray(groupsData)) {
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Veriler getirilirken hata:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.profession?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'ALL') {
      filtered = filtered.filter(member => member.role === filterRole);
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(member => member.status === filterStatus);
    }

    setFilteredMembers(filtered);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      if (['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER'].includes(newRole)) {
        if (!window.confirm('Bu kullanıcıya Grup Yöneticisi/Lideri rolü atamak üzeresiniz. Onaylıyor musunuz?')) return;
      }
      await api.assignRole(memberId, newRole);

      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (error) {
      console.error('Rol güncellenirken hata:', error);
      alert('Rol güncellenemedi.');
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    if (newStatus === 'ACTIVE' && member.profession_status === 'PENDING') {
      const confirm = window.confirm(
        `DİKKAT: "${member.full_name}" üyesinin meslek grubu (${member.profession}) sistemde henüz ONAYLANMAMIŞ.\n\n` +
        `Üyeliği aktif etmek için bu meslek grubunu sisteme ekleyip ONAYLAMANIZ gerekmektedir.\n\n` +
        `Meslek grubunu onaylayıp üyeyi aktif etmek istiyor musunuz?`
      );
      if (!confirm) return;

      try {
        if (member.profession_id) {
          await api.updateProfession(member.profession_id, {
            name: member.profession || '',
            category: member.profession_category || 'Genel',
            status: 'APPROVED'
          } as any);
        }
      } catch (e) {
        console.error(e);
        alert('Meslek grubu onaylanırken bir hata oluştu. İşlem iptal edildi.');
        return;
      }
    }

    try {
      await api.updateMember(memberId, { status: newStatus } as any);
      setMembers(members.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            status: newStatus as any,
            profession_status: (newStatus === 'ACTIVE' && m.profession_status === 'PENDING') ? 'APPROVED' : m.profession_status
          };
        }
        return m;
      }));
    } catch (error) {
      console.error('Statü güncellenirken hata:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (window.confirm('Bu üyeyi silmek istediğinize emin misiniz?')) {
      try {
        await api.deleteMember(memberId);
        setMembers(members.filter(m => m.id !== memberId));
      } catch (error) {
        console.error('Üye silinirken hata:', error);
      }
    }
  };

  const openMoveModal = (member: Member) => {
    setSelectedMember(member);
    setTargetGroupId(groups[0]?.id || '');
    setShowMoveModal(true);
  };

  const handleMoveMember = async () => {
    if (!selectedMember || !targetGroupId) return;
    try {
      await api.moveMember(selectedMember.id, targetGroupId);
      alert('Üye başarıyla taşındı.');
      setShowMoveModal(false);
      setSelectedMember(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Taşıma işlemi başarısız.');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader><CardTitle>Erişim Kısıtlı</CardTitle></CardHeader>
            <CardContent><p className="text-gray-600">Bu alan yalnızca Admin rolü için.</p></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Üye Yönetimi</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/members/new')} className="flex items-center bg-indigo-600 hover:bg-indigo-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Yeni Üye Oluştur
            </Button>
            <Button onClick={() => navigate('/admin')} className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Admin Paneli
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtreleme ve Arama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Üye ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ALL">Tüm Roller</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Üye</option>
                <option value="PRESIDENT">Başkan</option>
                <option value="VICE_PRESIDENT">Başkan Yrd.</option>
                <option value="SECRETARY_TREASURER">Sekreter/Sayman</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ALL">Tüm Statüler</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Pasif</option>
                <option value="PENDING">Beklemede</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Üye Listesi ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Üyeler yükleniyor...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz üye bulunmuyor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üye Bilgileri</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol & Statü</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grup</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-medium">
                                  {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-2">
                                <span>{member.company && `${member.company} • `}{member.profession}</span>
                                {member.profession_status === 'PENDING' && (
                                  <Badge className="bg-orange-100 text-orange-800 text-[10px] px-1 py-0 h-5">Talep</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 max-w-[140px]"
                            >
                              <option value="MEMBER">Üye</option>
                              <option value="PRESIDENT">Başkan</option>
                              <option value="VICE_PRESIDENT">Başkan Yrd.</option>
                              <option value="SECRETARY_TREASURER">Sekreter/Sayman</option>
                              <option value="EDUCATION_COORDINATOR">Eğitim Koor.</option>
                              <option value="VISITOR_HOST">Ziyaretçi M.</option>
                              <option value="ADMIN">Admin</option>
                              <option value="INSTRUCTOR">Eğitmen</option>
                            </select>
                            <Badge className={`text-xs ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : member.status === 'INACTIVE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {member.status === 'ACTIVE' ? 'Aktif' : member.status === 'INACTIVE' ? 'Pasif' : 'Beklemede'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {member.phone && <div className="flex items-center text-sm text-gray-500"><Phone className="h-3 w-3 mr-1" />{member.phone}</div>}
                            {member.city && <div className="flex items-center text-sm text-gray-500"><MapPin className="h-3 w-3 mr-1" />{member.city}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start space-y-1">
                            <span className="text-sm font-medium text-gray-700">
                              {member.group_name || '-'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs text-indigo-600 hover:text-indigo-800 px-0"
                              onClick={() => openMoveModal(member)}
                            >
                              <ArrowRightLeft className="h-3 w-3 mr-1" /> Grubu Değiştir
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/members/${member.id}`)} className="flex items-center">
                              <Edit className="h-3 w-3 mr-1" /> Düzenle
                            </Button>
                            {member.status === 'PENDING' && (
                              <Button
                                size="sm"
                                className={`flex items-center text-white border-none ${member.profession_status === 'PENDING' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                                onClick={() => handleStatusChange(member.id, 'ACTIVE')}
                                title={member.profession_status === 'PENDING' ? "Meslek ve Üyelik Onayı" : "Üyelik Onayı"}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" /> {member.profession_status === 'PENDING' ? 'Tümü Onayla' : 'Onayla'}
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteMember(member.id)} className="flex items-center">
                              <Trash2 className="h-3 w-3 mr-1" /> Sil
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Move Member Modal */}
        {showMoveModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold mb-4">Grubu Değiştir</h2>
              <p className="text-gray-600 mb-4">
                <span className="font-semibold">{selectedMember.full_name}</span> adlı üyeyi taşımak istediğiniz grubu seçin.
                Mevcut grubu pasife alınacak ve yeni gruba aktif olarak eklenecektir.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Grup</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowMoveModal(false)}>İptal</Button>
                <Button variant="primary" onClick={handleMoveMember}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" /> Taşı
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}