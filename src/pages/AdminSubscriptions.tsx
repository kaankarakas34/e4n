import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMembershipStore } from '../stores/membershipStore';
import { Card, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
import { Modal } from '../shared/Modal';
import { Search, Mail, Users, CheckCircle, XCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { MembershipPlan } from '../types';
import { api } from '../api/api';

export function AdminSubscriptions() {
  const { user } = useAuthStore();
  const { items: memberships, fetchAll } = useMembershipStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<MembershipPlan | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PASSIVE' | 'EXPIRING'>('ALL');

  // Modal State
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSendReminder = async (m: any) => {
    const name = m.name || m.user?.name || 'Üye';
    if (!confirm(`${name} isimli kişiye hatırlatma gönderilsin mi?`)) return;
    alert('Hatırlatma maili gönderildi.');
  };

  const getDaysLeft = (dateStr?: string) => {
    if (!dateStr) return 0;
    const end = new Date(dateStr);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isExpired = (m: any) => getDaysLeft(m?.end_date) <= 0;
  const isExpiring = (m: any) => {
    const d = getDaysLeft(m?.end_date);
    return d > 0 && d <= 30;
  };

  // Stats Calculation
  const stats = {
    total: memberships.length,
    active: memberships.filter(m => !isExpired(m) && (m as any).status !== 'PASSIVE').length,
    passive: memberships.filter(m => isExpired(m) || (m as any).status === 'PASSIVE').length,
    expiring: memberships.filter(m => isExpiring(m)).length,
  };

  const filtered = memberships.filter(m => {
    const nameStr = m.name || m.user?.name || '';
    const emailStr = m.email || m.user?.email || '';

    const nameMatch = nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchTerm.toLowerCase());

    const planMatch = filterPlan === 'ALL' || m.plan === filterPlan;

    let statusMatch = true;
    if (filterStatus === 'ACTIVE') statusMatch = !isExpired(m) && (m as any).status !== 'PASSIVE';
    if (filterStatus === 'PASSIVE') statusMatch = isExpired(m) || (m as any).status === 'PASSIVE';
    if (filterStatus === 'EXPIRING') statusMatch = isExpiring(m);

    return nameMatch && planMatch && statusMatch;
  });

  const handleExtend = async (months: number) => {
    if (!selectedMember) return;
    if (confirm(`${selectedMember.name || 'Üye'} için ${months} ay süre uzatılacak. Onaylıyor musunuz?`)) {
      try {
        await api.extendMembership(selectedMember.id || selectedMember.user_id, months);
        alert('Süre başarıyla uzatıldı.');
        setIsModalOpen(false);
        fetchAll();
      } catch (e) {
        console.error(e);
        alert('İşlem sırasında hata oluştu.');
      }
    }
  };

  if (!user || user.role !== 'ADMIN') return <div className="p-8">Erişim Kısıtlı</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Abonelik Takibi</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Toplam Üye</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </CardContent>
          </Card>
          <Card className="bg-white border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Aktif Abonelik</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
            </CardContent>
          </Card>
          <Card className="bg-white border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pasif / Dolmuş</p>
                <p className="text-2xl font-bold text-gray-900">{stats.passive}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-20" />
            </CardContent>
          </Card>
          <Card className="bg-white border-l-4 border-l-yellow-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Yaklaşan Ödemeler</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiring}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="İsim veya E-posta ile ara..."
                className="pl-10 w-full border rounded-md py-2"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterPlan} onChange={(e: any) => setFilterPlan(e.target.value)} className="w-full md:w-48">
              <option value="ALL">Tüm Paketler</option>
              <option value="4_MONTHS">4 Aylık</option>
              <option value="8_MONTHS">8 Aylık</option>
              <option value="12_MONTHS">12 Aylık</option>
            </Select>
            <Select value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value as any)} className="w-full md:w-48">
              <option value="ALL">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="PASSIVE">Pasif</option>
              <option value="EXPIRING">Süresi Yaklaşan</option>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Üye Bilgisi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kalan Süre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(m => {
                const days = getDaysLeft(m.end_date);
                const expired = isExpired(m);
                const expiring = isExpiring(m);

                const percent = Math.min(Math.max((days / 365) * 100, 0), 100);
                const barColor = expired ? 'bg-gray-300' : expiring ? 'bg-yellow-500' : 'bg-green-500';

                return (
                  <tr key={m.id || Math.random()} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{m.name || m.user?.name || 'Bilinmeyen Üye'}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {m.email || m.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                        {m.plan ? m.plan.replace('_MONTHS', ' Ay').replace('MANUAL', 'Özel Paketi') : 'VARSAYILAN'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">
                            {days > 0 ? `${days} Gün` : 'Süre Bitti'}
                          </span>
                          <span className="text-gray-400">
                            {m.end_date ? new Date(m.end_date).toLocaleDateString() : '-'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {expired || (m as any).status === 'PASSIVE' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Pasif
                        </span>
                      ) : expiring ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Yenileme Gerekli
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(m);
                          setIsModalOpen(true);
                        }}
                      >
                        Yönet
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Üyelik Yönetimi: ${selectedMember?.name || 'Seçili Üye'}`}>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Mevcut Durum</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${isExpired(selectedMember) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {isExpired(selectedMember) ? 'PASİF' : 'AKTİF'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Son Geçerlilik</span>
              <span className="font-semibold text-gray-900">
                {selectedMember?.end_date ? new Date(selectedMember.end_date).toLocaleDateString() : 'Belirtilmemiş'}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">Kalan Gün</span>
              <span className="font-semibold text-indigo-600">
                {getDaysLeft(selectedMember?.end_date)} Gün
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Paket Seçimi
            </h4>
            <div className="grid grid-cols-1 gap-3 mb-4">
              {[4, 8, 12].map(m => (
                <button
                  key={m}
                  onClick={() => handleExtend(m)}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 hover:border-indigo-500 transition-all group"
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-colors ${m === 4 ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : m === 8 ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'}`}>{m}</div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{m} Aylık Paket</p>
                      <p className="text-xs text-gray-500">{m === 4 ? 'Standart' : m === 8 ? 'Avantajlı' : 'Tam Yıl'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 group-hover:text-indigo-700">Seç</span>
                </button>
              ))}
            </div>

            {/* Manual Definition */}
            <div className="bg-gray-100 p-3 rounded-lg">
              <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Elle Paket Tanımlama</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Paket Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Özel Kampanya"
                    className="w-full text-sm border-gray-300 rounded-md p-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                    id="manualPlanName"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    className="w-full text-sm border-gray-300 rounded-md p-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                    id="manualEndDate"
                  />
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-3"
                onClick={async () => {
                  const dateInput = document.getElementById('manualEndDate') as HTMLInputElement;
                  const nameInput = document.getElementById('manualPlanName') as HTMLInputElement;

                  if (!dateInput.value) {
                    alert('Bitiş tarihi seçilmelidir.');
                    return;
                  }

                  const name = nameInput.value || 'Özel Tanımlı';

                  if (confirm(`${name} olarak ${new Date(dateInput.value).toLocaleDateString()} tarihine kadar tanımlanacak. Onaylıyor musunuz?`)) {
                    try {
                      await api.extendMembership(selectedMember.id || selectedMember.user_id, undefined, dateInput.value, name);
                      alert('Manuel paket başarıyla tanımlandı.');
                      setIsModalOpen(false);
                      fetchAll();
                    } catch (e) {
                      console.error(e);
                      alert('Hata oluştu.');
                    }
                  }
                }}
              >
                Tanımla ve Kaydet
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between">
            <Button variant="ghost" onClick={() => handleSendReminder(selectedMember)}>
              <Mail className="w-4 h-4 mr-2" />
              Hatırlatma Gönder
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
