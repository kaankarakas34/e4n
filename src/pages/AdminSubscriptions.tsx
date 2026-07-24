import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMembershipStore } from '../stores/membershipStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { 
  Search, 
  Mail, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  RefreshCw, 
  UserMinus,
  Edit2
} from 'lucide-react';
import { MembershipPlan } from '../types';
import { api } from '../api/api';

export function AdminSubscriptions() {
  const { user } = useAuthStore();
  const { items: memberships, fetchAll } = useMembershipStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<MembershipPlan | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PASSIVE' | 'EXPIRING'>('ALL');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');

  // Modal State
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // Edit Form Fields
  const [editPlan, setEditPlan] = useState<string>('1_MONTH');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'PASSIVE'>('ACTIVE');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const now = new Date();
  const currentMonthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthName = nextMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const handleSendReminder = async (m: any) => {
    const name = m.name || m.user?.name || 'Üye';
    const email = m.email || m.user?.email || '';
    if (!confirm(`${name} (${email}) isimli üyeye ödeme hatırlatma maili ve bildirimi gönderilecek. Onaylıyor musunuz?`)) return;
    
    setSendingReminderId(m.user_id || m.id);
    try {
      await api.remindMembership(m.user_id || m.id);
      alert('Ödeme hatırlatma maili başarıyla gönderildi.');
    } catch (e) {
      console.error(e);
      alert('Hatırlatma gönderilirken bir hata oluştu.');
    } finally {
      setSendingReminderId(null);
    }
  };

  const getDaysLeft = (dateStr?: string) => {
    if (!dateStr) return 0;
    const end = new Date(dateStr);
    const now = new Date();
    // Reset time components for calendar days
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diff = endMidnight.getTime() - nowMidnight.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const isExpired = (m: any) => getDaysLeft(m?.end_date) <= 0;
  const isExpiring = (m: any) => {
    const d = getDaysLeft(m?.end_date);
    return d > 0 && d <= 5; // Show warning within 5 days to align with reminder period
  };

  // MRR (Monthly Recurring Revenue) Estimator
  const getMRR = () => {
    return memberships.reduce((total, m) => {
      if (isExpired(m) || m.status === 'PASSIVE') return total;
      if (m.plan === '1_MONTH') return total + 7200;
      if (m.plan === '6_MONTHS') return total + 6500; // 39000 / 6
      if (m.plan === '12_MONTHS') return total + 5750; // 69000 / 12
      return total + 6000; // custom/default plan average
    }, 0);
  };

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => !isExpired(m) && m.status !== 'PASSIVE').length,
    passive: memberships.filter(m => isExpired(m) || m.status === 'PASSIVE').length,
    expiring: memberships.filter(m => isExpiring(m)).length,
    mrr: getMRR(),
  };

  const filtered = memberships.filter(m => {
    const nameStr = m.name || m.user?.name || '';
    const emailStr = m.email || m.user?.email || '';

    const nameMatch = nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchTerm.toLowerCase());

    const planMatch = filterPlan === 'ALL' || m.plan === filterPlan;

    let statusMatch = true;
    if (filterStatus === 'ACTIVE') statusMatch = !isExpired(m) && m.status !== 'PASSIVE';
    if (filterStatus === 'PASSIVE') statusMatch = isExpired(m) || m.status === 'PASSIVE';
    if (filterStatus === 'EXPIRING') statusMatch = isExpiring(m);

    let monthMatch = true;
    if (selectedMonthFilter === 'OVERDUE') {
      monthMatch = getDaysLeft(m.end_date) <= 0;
    } else if (selectedMonthFilter === 'CURRENT_MONTH') {
      if (!m.end_date) monthMatch = false;
      else {
        const d = new Date(m.end_date);
        monthMatch = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
    } else if (selectedMonthFilter === 'NEXT_MONTH') {
      if (!m.end_date) monthMatch = false;
      else {
        const d = new Date(m.end_date);
        const nextM = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        monthMatch = d.getMonth() === nextM.getMonth() && d.getFullYear() === nextM.getFullYear();
      }
    }

    return nameMatch && planMatch && statusMatch && monthMatch;
  });

  const openEditModal = (m: any) => {
    setSelectedMember(m);
    setEditPlan(m.plan || '1_MONTH');
    
    // Format date string to YYYY-MM-DD
    if (m.end_date) {
      const date = new Date(m.end_date);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      setEditEndDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditEndDate('');
    }
    
    setEditStatus(m.status === 'PASSIVE' || isExpired(m) ? 'PASSIVE' : 'ACTIVE');
    setIsModalOpen(true);
  };

  const handleUpdateMembership = async () => {
    if (!selectedMember) return;
    if (!editEndDate) {
      alert('Lütfen geçerli bir bitiş tarihi seçiniz.');
      return;
    }

    setUpdating(true);
    try {
      const targetDate = new Date(editEndDate);
      targetDate.setHours(23, 59, 59, 999); // Set to end of day

      await api.updateMembership(selectedMember.user_id || selectedMember.id, {
        plan: editPlan,
        end_date: targetDate.toISOString(),
        status: editStatus
      });

      alert('Abonelik bilgileri başarıyla güncellendi.');
      setIsModalOpen(false);
      fetchAll();
    } catch (e) {
      console.error(e);
      alert('Abonelik güncellenirken hata oluştu.');
    } finally {
      setUpdating(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return <div className="p-8 text-red-600 font-bold text-center">Erişim Yetkiniz Yok</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Abonelik &amp; Ödeme Takip Paneli</h1>
            <p className="text-slate-500 mt-1 text-sm">Üyelerin aylık üyelik sürelerini, ödeme tarihlerini ve tahsilatlarını buradan izleyebilir ve yönetebilirsiniz.</p>
          </div>
          <Button 
            onClick={() => fetchAll()} 
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        </div>

        {/* Premium KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Üye</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
              </div>
              <Users className="h-10 w-10 text-blue-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aylık Tekrarlayan Gelir (MRR)</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">₺{stats.mrr.toLocaleString('tr-TR')}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktif Üyelik</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-rose-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Süresi Dolan / Pasif</p>
                <p className="text-3xl font-bold text-rose-600 mt-1">{stats.passive}</p>
              </div>
              <XCircle className="h-10 w-10 text-rose-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ödeme Yaklaşan (≤ 5 Gün)</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.expiring}</p>
              </div>
              <Clock className="h-10 w-10 text-amber-500 opacity-20" />
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="bg-white shadow-sm border border-slate-100">
          <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-center">
            
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Üye adı veya e-posta ile ara..."
                className="pl-10 w-full rounded-xl border border-slate-200 py-2.5 text-sm bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Plan filter */}
            <div className="w-full md:w-56">
              <select
                value={filterPlan}
                onChange={(e: any) => setFilterPlan(e.target.value)}
                className="w-full h-[42px] rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tüm Paketler</option>
                <option value="1_MONTH">Aylık Paket (7.200 ₺)</option>
                <option value="6_MONTHS">6 Aylık Paket (39.000 ₺)</option>
                <option value="12_MONTHS">12 Aylık Paket (69.000 ₺)</option>
              </select>
            </div>

            {/* Month Expiry Filter for Monthly Payment Tracking */}
            <div className="w-full md:w-60">
              <select
                value={selectedMonthFilter}
                onChange={(e: any) => setSelectedMonthFilter(e.target.value)}
                className="w-full h-[42px] rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tüm Dönemler</option>
                <option value="OVERDUE">Ödemesi Gecikenler (Süresi Bitenler)</option>
                <option value="CURRENT_MONTH">Bu Ay Ödemesi Olanlar ({currentMonthName})</option>
                <option value="NEXT_MONTH">Gelecek Ay Ödemesi Olanlar ({nextMonthName})</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value as any)}
                className="w-full h-[42px] rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tüm Durumlar</option>
                <option value="ACTIVE">Aktif Aboneler</option>
                <option value="PASSIVE">Pasif / Süresi Dolanlar</option>
                <option value="EXPIRING">Süresi Yaklaşanlar</option>
              </select>
            </div>

          </CardContent>
        </Card>

        {/* Subscription Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Üye Bilgisi</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Plan / Paket</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Kalan Süre (Bitiş Tarihi)</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Durum</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-500 uppercase tracking-wider text-xs">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(m => {
                  const days = getDaysLeft(m.end_date);
                  const expired = isExpired(m) || m.status === 'PASSIVE';
                  const expiring = isExpiring(m);

                  const progressPercent = expired ? 0 : Math.min(Math.max((days / 365) * 100, 0), 100);
                  const progressBarColor = expiring ? 'bg-amber-500' : 'bg-emerald-500';

                  return (
                    <tr key={m.user_id || m.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-[15px]">{m.name || m.user?.name || 'Bilinmeyen Üye'}</div>
                        <div className="text-slate-400 flex items-center gap-1.5 mt-1 font-medium text-xs">
                          <Mail className="w-3.5 h-3.5" />
                          {m.email || m.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
                          {m.plan ? m.plan.replace('_MONTHS', ' Ay').replace('1_MONTH', 'Aylık Paket').replace('MANUAL', 'Özel Tanımlı') : 'Belirtilmemiş'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[240px]">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className={`font-bold ${expired ? 'text-rose-600' : expiring ? 'text-amber-600' : 'text-emerald-700'}`}>
                              {expired ? 'Süresi Doldu' : `${days} Gün Kaldı`}
                            </span>
                            <span className="text-slate-400 font-medium">
                              {m.end_date ? new Date(m.end_date).toLocaleDateString('tr-TR') : '-'}
                            </span>
                          </div>
                          {!expired && (
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${progressBarColor}`} style={{ width: `${progressPercent}%` }}></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            <XCircle className="w-3.5 h-3.5" />
                            Süresi Dolan
                          </span>
                        ) : expiring ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Ödeme Yaklaştı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(m)}
                            className="text-slate-700 hover:bg-slate-100 border-slate-200 hover:text-slate-900 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Yönet
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendReminder(m)}
                            disabled={sendingReminderId === (m.user_id || m.id)}
                            className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg"
                          >
                            <Mail className="w-3.5 h-3.5 mr-1" />
                            {sendingReminderId === (m.user_id || m.id) ? 'Gönderiliyor...' : 'Uyar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                      Filtre kriterlerine uygun hiçbir abonelik kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Advanced Management Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Üyelik Yönetimi: ${selectedMember?.name || 'Seçili Üye'}`}
      >
        <div className="space-y-6 pt-2">
          
          {/* Quick Info Box */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="font-medium">Mevcut Durum</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${isExpired(selectedMember) ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {isExpired(selectedMember) ? 'SÜRESİ DOLDU' : 'AKTİF'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Güncel Plan</span>
              <span className="font-semibold text-slate-800">
                {selectedMember?.plan ? selectedMember.plan.replace('_MONTHS', ' Ay').replace('1_MONTH', 'Aylık') : 'Belirtilmemiş'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Son Geçerlilik</span>
              <span className="font-semibold text-slate-800">
                {selectedMember?.end_date ? new Date(selectedMember.end_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paket Seçimi</label>
              <select
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1_MONTH">Aylık Paket (7.200 ₺)</option>
                <option value="6_MONTHS">6 Aylık Paket (39.000 ₺)</option>
                <option value="12_MONTHS">12 Aylık Paket (69.000 ₺)</option>
                <option value="MANUAL">Özel Tanımlı</option>
              </select>
            </div>

            {/* Custom Expiry Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Üyelik Bitiş Tarihi</label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hesap / Üyelik Durumu</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Aktif (Sistem Erişimi Var)</option>
                <option value="PASSIVE">Pasif (Erişim Kısıtlı)</option>
              </select>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-100 pt-5 flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => handleSendReminder(selectedMember)}
              className="text-slate-700 hover:bg-slate-50 border-slate-200"
              disabled={updating}
            >
              <Mail className="w-4 h-4 mr-2" />
              Hatırlatma Gönder
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setIsModalOpen(false)}
                disabled={updating}
              >
                İptal
              </Button>
              <Button
                onClick={handleUpdateMembership}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                {updating ? 'Kaydediliyor...' : 'Güncelle'}
              </Button>
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
}
