import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Alert } from '../shared/Alert';
import { useReferralStore } from '../stores/referralStore';
import { useAuthStore } from '../stores/authStore';
import { CreateReferralFormData, Referral } from '../types';
import { api } from '../api/api';
import {
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Eye,
  Building2,
  Layers,
  UserSearch,
  Flame,
  Snowflake,
  Thermometer,
  Wallet,
  Info,
  CheckCircle,
  X
} from 'lucide-react';

// Simple Modal Logic
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              {title}
            </h3>
            <button onClick={onClose} className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
              <span className="sr-only">Kapat</span>
              <X className="h-6 w-6" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Modal Component for Success/Details
const ReferralModal = ({ isOpen, onClose, referral }: { isOpen: boolean; onClose: () => void; referral: Referral | null }) => {
  if (!referral) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center text-green-600">
        <CheckCircle className="h-6 w-6 mr-2" />
        Yönlendirme Oluşturuldu
      </div>
    }>
      <div className="mt-4 space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Alıcı Üye</p>
          <p className="font-medium text-gray-900">{referral.receiver_name}</p>
          {referral.profession && <p className="text-sm text-gray-500">{referral.profession}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Derece</p>
            <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block
                ${referral.temperature === 'HOT' ? 'bg-red-100 text-red-800' :
                referral.temperature === 'WARM' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
              {referral.temperature === 'HOT' ? 'Sıcak' : referral.temperature === 'WARM' ? 'Ilık' : 'Soğuk'}
            </span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Tahmini Tutar</p>
            <p className="font-bold text-gray-900">₺{referral.amount?.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Açıklama</p>
          <p className="text-sm text-gray-700">{referral.description}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Tamam
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Modal Component for Revenue Entry
// Modal Component for Revenue Entry
const RevenueModal = ({ isOpen, onClose, referral, onSubmit }: { isOpen: boolean; onClose: () => void; referral: Referral | null; onSubmit: (amount: number) => void }) => {
  const [amount, setAmount] = useState(referral?.amount || 0);

  if (!referral) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center text-green-600">
        <Wallet className="h-6 w-6 mr-2" />
        Ciro Girişi (Teşekkür)
      </div>
    }>
      <div className="mt-4 space-y-4">
        <p className="text-sm text-gray-600">
          Bu iş yönlendirmesi başarıyla sonuçlandıysa, lütfen elde edilen ciro miktarını giriniz.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gerçekleşen Ciro Tutarı (TL)</label>
          <Input
            type="number"
            min="0"
            className="mt-1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            autoFocus
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>İptal</Button>
        <Button variant="primary" onClick={() => onSubmit(amount)}>Kabul Et ve Kaydet</Button>
      </div>
    </Modal>
  );
}

const referralSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INTERNAL'),
    receiverId: z.string().min(1, 'Alıcı üye seçiniz'),
    receiver: z.string().min(1, 'Alıcı adı giriniz'),
    profession: z.string().min(1, 'Meslek giriniz'),
    temperature: z.enum(['HOT', 'WARM', 'COLD']),
    description: z.string().min(10, 'Açıklama en az 10 karakter olmalı'),
    amount: z.number().min(0, 'Tutar 0 veya daha büyük olmalı'),
  }),
  z.object({
    type: z.literal('EXTERNAL'),
    receiver: z.string().min(1, 'Kişi adı giriniz'),
    profession: z.string().optional(),
    temperature: z.enum(['HOT', 'WARM', 'COLD']),
    description: z.string().min(10, 'Açıklama en az 10 karakter olmalı'),
    amount: z.number().min(0, 'Tutar 0 veya daha büyük olmalı'),
  }),
]);

type ReferralFormData = z.infer<typeof referralSchema>;

export function Referrals() {

  const [activeTab, setActiveTab] = useState<'create' | 'sent' | 'received'>('sent');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();
  const { referrals, loading, error, fetchReferrals, createReferral, updateReferral } = useReferralStore();

  // Modal States
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdReferral, setCreatedReferral] = useState<Referral | null>(null);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  // Data States
  const [myGroups, setMyGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [myPowerTeams, setMyPowerTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [network, setNetwork] = useState<any[]>([]);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      type: 'INTERNAL',
      temperature: 'WARM',
      amount: 0,
    },
  });
  const typeWatch = watch('type');

  useEffect(() => {
    if (user?.id) {
      fetchReferrals(user.id);

      // Fetch initial data
      api.getUserGroups(user.id).then(setMyGroups).catch(() => { });
      api.getUserPowerTeams(user.id).then(setMyPowerTeams).catch(() => { });
      api.getNetwork().then(setNetwork).catch(() => { });
    }
  }, [user?.id, fetchReferrals]);

  // Handle Group/Team Selection Change
  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedMembership) {
        setAvailableMembers([]);
        return;
      }

      setAvailableMembers([]); // Clear previous
      setValue('receiverId', ''); // Reset selected member

      try {
        const [type, id] = selectedMembership.split(':');
        let members = [];
        if (type === 'grp') {
          members = await api.getGroupMembers(id);
        } else if (type === 'pt') {
          members = await api.getPowerTeamMembers(id);
        }
        // Filter out self
        setAvailableMembers(members.filter((m: any) => m.id !== user?.id));
      } catch (err) {
        console.error("Error fetching members", err);
      }
    };

    fetchMembers();
  }, [selectedMembership, user?.id, setValue]);

  const onSubmit = async (data: ReferralFormData) => {
    if (!user?.id) return;

    try {
      const formData: CreateReferralFormData = {
        ...data,
        // @ts-ignore
        receiverId: 'receiverId' in data ? data.receiverId : '',
        receiver: data.receiver,
        profession: data.profession || '',
        giverId: user.id,
      };

      const newReferral = await createReferral(formData, user.id);
      setCreatedReferral(newReferral);
      setSuccessModalOpen(true);

      reset();
      setSelectedMembership('');
    } catch (error) {
      console.error('Error creating referral:', error);
    }
  };

  const handleMarkUnsuccessful = async (referral: Referral) => {
    if (!user) return;
    try {
      await updateReferral(referral.id, {
        status: 'UNSUCCESSFUL',
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking referral as unsuccessful:', error);
    }
  };

  const handleRevenueSubmit = async (amount: number) => {
    if (!selectedReferral) return;
    try {
      await updateReferral(selectedReferral.id, {
        status: 'SUCCESSFUL',
        amount: amount, // Update with actual revenue
        updated_at: new Date().toISOString()
      });
      setRevenueModalOpen(false);
      setSelectedReferral(null);
    } catch (e) {
      console.error("Failed to update revenue", e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'UNSUCCESSFUL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemperatureColor = (temperature: string) => {
    switch (temperature) {
      case 'HOT': return 'bg-red-100 text-red-800';
      case 'WARM': return 'bg-orange-100 text-orange-800';
      case 'COLD': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INTERNAL': return 'bg-purple-100 text-purple-800';
      case 'EXTERNAL': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter Referrals
  // Sent: giver_id === user.id
  // Received: receiver_id === user.id OR receiver_name === user.name (fallback for mocks)
  const sentReferrals = referrals.filter(r => r.giver_id === user?.id);
  // Note: For mock purposes, using name match if receiver_id is missing or mock
  const receivedReferrals = referrals.filter(r => r.receiver_id === user?.id || (user?.name && r.receiver_name === user.name));

  const displayReferrals = activeTab === 'sent' ? sentReferrals : receivedReferrals;

  const filteredReferrals = displayReferrals.filter(referral =>
    (referral.receiver_name || (typeof referral.receiver === 'object' ? (referral.receiver as any).full_name : ''))?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    successful: referrals.filter(r => r.status === 'SUCCESSFUL').length,
    pending: referrals.filter(r => r.status === 'PENDING').length,
    unsuccessful: referrals.filter(r => r.status === 'UNSUCCESSFUL').length,
    totalVolume: referrals.filter(r => r.status === 'SUCCESSFUL').reduce((sum, r) => sum + (r.amount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">İş Yönlendirmeleri</h1>
          <p className="mt-2 text-gray-600">
            Networking aktivitelerinizi yönetin ve takip edin
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              {error}
            </Alert>
          </div>
        )}

        {/* Stats Cards */}
        {/* ... stats cards code remains same ... */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Başarılı</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successful}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Beklemede</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Başarısız</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unsuccessful}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Toplam Hacim</p>
                  <p className="text-2xl font-bold text-gray-900">₺{stats.totalVolume.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('sent')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'sent'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Gönderilenler
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'received'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Gelenler
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'create'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Yeni Yönlendirme
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {(activeTab === 'sent' || activeTab === 'received') && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Yönlendirme ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" disabled={loading}>
                <Filter className="h-4 w-4 mr-2" />
                Filtrele
              </Button>
            </div>

            {/* Referrals List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Yönlendirmeler yükleniyor...</p>
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz yönlendirme yok</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Aramanıza uygun yönlendirme bulunamadı.' : activeTab === 'sent' ? 'Henüz hiç yönlendirme yapmadınız.' : 'Henüz size gelen bir yönlendirme yok.'}
                  </p>
                  {activeTab === 'sent' && (
                    <Button variant="primary" className="mt-4" onClick={() => setActiveTab('create')}>
                      Yeni Yönlendirme Oluştur
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredReferrals.map((referral) => (
                    <li key={referral.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {activeTab === 'sent'
                                    ? (referral.receiver_name || (typeof referral.receiver === 'object' ? (referral.receiver as any).full_name : referral.receiver))
                                    : `Gönderen: ${referral.giver_id}` /* In real app, name should be resolved */
                                  }
                                  {/* Note: In a real app we'd resolve giver name properly. For now showing ID or assuming mock data has it if available */}
                                </h3>
                                {referral.profession && (
                                  <span className="ml-2 text-sm text-gray-500">
                                    ({referral.profession})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(referral.type)}`}>
                                  {referral.type === 'INTERNAL' ? 'İç' : 'Dış'}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTemperatureColor(referral.temperature)}`}>
                                  {referral.temperature === 'HOT' ? 'Sıcak' : referral.temperature === 'WARM' ? 'Ilık' : 'Soğuk'}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(referral.status)}`}>
                                  {referral.status === 'SUCCESSFUL' ? 'Başarılı' :
                                    referral.status === 'PENDING' ? 'Beklemede' : 'Başarısız'}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {referral.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{referral.created_at || referral.createdAt}</span>
                                {referral.amount > 0 && (
                                  <span className="font-medium text-green-600">
                                    ₺{referral.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className='flex gap-2'>
                                {user?.id === referral.receiver_id && referral.status === 'PENDING' && (
                                  <>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleMarkUnsuccessful(referral)}>
                                      <X className="h-4 w-4 mr-1" />
                                      Başarısız
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={() => {
                                      setSelectedReferral(referral);
                                      setRevenueModalOpen(true);
                                    }}>
                                      <Wallet className="h-4 w-4 mr-1" />
                                      Ciro Gir
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-indigo-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Yeni Yönlendirme</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Grup içi veya grup dışı yönlendirme oluşturun</p>
                  </div>
                  <div className="flex items-center text-indigo-700">
                    <Info className="h-4 w-4 mr-2" />
                    <span className="text-xs">Doğru seçimler performans puanınızı artırır</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yönlendirme Türü</label>
                    <div className="inline-flex rounded-lg border bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setValue('type', 'INTERNAL')}
                        className={`px-4 py-2 text-sm ${typeWatch === 'INTERNAL' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Grup İçi
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue('type', 'EXTERNAL')}
                        className={`px-4 py-2 text-sm border-l ${typeWatch === 'EXTERNAL' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Grup Dışı (Bağlantılar)
                      </button>
                    </div>
                    <select {...register('type')} className="sr-only">
                      <option value="INTERNAL">Grup İçi</option>
                      <option value="EXTERNAL">Grup Dışı</option>
                    </select>
                  </div>
                  {typeWatch === 'INTERNAL' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Grup veya Lonca Seçin</label>
                        <select
                          value={selectedMembership}
                          onChange={(e) => setSelectedMembership(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="">Seçiniz...</option>
                          {myGroups.map((g) => (
                            <option key={`grp:${g.id}`} value={`grp:${g.id}`}>{g.name} (Grup)</option>
                          ))}
                          {myPowerTeams.map((pt) => (
                            <option key={`pt:${pt.id}`} value={`pt:${pt.id}`}>{pt.name} (Lonca)</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Sadece üyesi olduğunuz gruplar ve takımlar listelenir.</p>
                      </div>

                      {selectedMembership && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mt-4">Alıcı Üye</label>
                          <select
                            {...register('receiverId')}
                            onChange={(e) => {
                              const selected = availableMembers.find(m => m.id === e.target.value);
                              if (selected) {
                                setValue('receiverId', selected.id);
                                setValue('receiver', selected.full_name || selected.name);
                                setValue('profession', selected.profession);
                              }
                            }}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="">Üye seçin...</option>
                            {availableMembers.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.full_name || member.name} - {member.profession}
                              </option>
                            ))}
                          </select>
                          {/* @ts-ignore */}
                          {errors.receiverId && (
                            /* @ts-ignore */
                            <p className="mt-1 text-sm text-red-600">{errors.receiverId.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {typeWatch === 'EXTERNAL' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kişi Seçin (Bağlantılarınız)</label>
                        <select
                          {...register('receiver')}
                          onChange={(e) => {
                            const selected = network.find(n => (n.full_name || n.name) === e.target.value);
                            if (selected) {
                              setValue('receiver', selected.full_name || selected.name);
                              setValue('profession', selected.profession);
                            }
                          }}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="">Bağlantılarınızdan seçin...</option>
                          {network.map((friend) => (
                            <option key={friend.id} value={friend.full_name || friend.name}>
                              {friend.full_name || friend.name} ({friend.profession})
                            </option>
                          ))}
                        </select>
                        {errors.receiver && (
                          <p className="mt-1 text-sm text-red-600">{errors.receiver.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Sadece "Bağlantılarım" listesindeki kişiler listelenir.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Meslek</label>
                        <Input
                          {...register('profession')}
                          placeholder="Meslek/pozisyon"
                          className="mt-1"
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sıcaklık Derecesi</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setValue('temperature', 'HOT')} className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm ${watch('temperature') === 'HOT' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                          <Flame className="h-4 w-4 mr-2" /> Sıcak
                        </button>
                        <button type="button" onClick={() => setValue('temperature', 'WARM')} className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm ${watch('temperature') === 'WARM' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                          <Thermometer className="h-4 w-4 mr-2" /> Ilık
                        </button>
                        <button type="button" onClick={() => setValue('temperature', 'COLD')} className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm ${watch('temperature') === 'COLD' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                          <Snowflake className="h-4 w-4 mr-2" /> Soğuk
                        </button>
                      </div>
                      <select {...register('temperature')} className="sr-only">
                        <option value="HOT">Sıcak</option>
                        <option value="WARM">Ilık</option>
                        <option value="COLD">Soğuk</option>
                      </select>
                      {errors.temperature && (
                        <p className="mt-2 text-sm text-red-600">{errors.temperature.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tahmini İş Hacmi</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                        <Input type="number" {...register('amount', { valueAsNumber: true })} placeholder="0" className="pl-8" />
                      </div>
                      {errors.amount && (
                        <p className="mt-2 text-sm text-red-600">{errors.amount.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">İş Açıklaması</label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Yönlendirilen işin detaylarını açıklayın..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setActiveTab('sent');
                      }}
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? 'Oluşturuluyor...' : 'Yönlendirme Oluştur'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ReferralModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        referral={createdReferral}
      />
      <RevenueModal
        isOpen={revenueModalOpen}
        onClose={() => setRevenueModalOpen(false)}
        referral={selectedReferral}
        onSubmit={handleRevenueSubmit}
      />
    </div>
  );
}
