import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { api } from '../api/api';
import { Layers, Users, Plus, X } from 'lucide-react';
import { AdminShuffle } from './AdminShuffle';
import * as Dialog from '@radix-ui/react-dialog';

export function AdminGroups() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'TEAMS' | 'SHUFFLE'>('GROUPS');
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const g = await api.getGroups();
      const t = await api.getPowerTeams();
      setGroups(g || []);
      setTeams(t || []);
    } catch (e) {
      setError('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const verifyAdmin = () => {
    if (!user || user.role !== 'ADMIN') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader><CardTitle>Erişim Kısıtlı</CardTitle></CardHeader>
            <CardContent><p className="text-gray-600">Bu sayfa yalnızca Admin içindir.</p></CardContent>
          </Card>
        </div>
      );
    }
    return null;
  };

  const handleCreateGroup = async () => {
    if (!newItemName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createGroup({ name: newItemName });
      setIsGroupModalOpen(false);
      setNewItemName('');
      loadData(); // Refresh list
    } catch (e: any) {
      alert('Hata: ' + (e.message || 'Grup oluşturulamadı'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newItemName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createPowerTeam({ name: newItemName });
      setIsTeamModalOpen(false);
      setNewItemName('');
      loadData(); // Refresh list
    } catch (e: any) {
      alert('Hata: ' + (e.message || 'Lonca oluşturulamadı'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const accessDenied = verifyAdmin();
  if (accessDenied) return accessDenied;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Grup Yönetimi</h1>

          <div className="flex space-x-2 bg-white p-1 rounded-lg border shadow-sm">
            <button
              onClick={() => setActiveTab('GROUPS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'GROUPS' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Gruplar
            </button>
            <button
              onClick={() => setActiveTab('TEAMS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'TEAMS' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Loncalar
            </button>
            <button
              onClick={() => setActiveTab('SHUFFLE')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'SHUFFLE' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Shuffle
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border border-red-200">{error}</div>}

        {activeTab === 'GROUPS' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Grup Listesi</CardTitle>
              <Button onClick={() => { setNewItemName(''); setIsGroupModalOpen(true); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Grup Oluştur
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">Henüz hiç grup yok.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {groups.map((g: any) => (
                    <div
                      key={g.id}
                      className="p-5 border rounded-lg hover:border-indigo-400 hover:shadow-lg cursor-pointer transition-all bg-white group relative"
                      onClick={() => navigate(`/admin/groups/${g.id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-indigo-50 p-2 rounded-full">
                          <Layers className="h-6 w-6 text-indigo-600" />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${g.current_month >= 4 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {g.current_month || 1}. Dönem Ayı
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{g.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="h-4 w-4" /> {g.member_count || 0} Üye
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'TEAMS' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Lonca Listesi</CardTitle>
              <Button onClick={() => { setNewItemName(''); setIsTeamModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Lonca Oluştur
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">Henüz hiç lonca yok.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {teams.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-5 border rounded-lg hover:border-purple-400 hover:shadow-lg cursor-pointer transition-all bg-white"
                      onClick={() => navigate(`/admin/power-teams/${t.id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-purple-50 p-2 rounded-full">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{t.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{t.description || 'Açıklama girilmemiş.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'SHUFFLE' && (
          <AdminShuffle />
        )}

        {/* --- MODALS --- */}

        {/* Create Group Modal */}
        <Dialog.Root open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-bold">Yeni Grup Oluştur</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grup Adı</label>
                  <Input
                    placeholder="Örn: Global Liderler"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>İptal</Button>
                  <Button onClick={handleCreateGroup} disabled={isSubmitting}>
                    {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Create Team Modal */}
        <Dialog.Root open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-bold">Yeni Lonca Oluştur</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lonca Adı</label>
                  <Input
                    placeholder="Örn: Teknoloji Loncası"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsTeamModalOpen(false)}>İptal</Button>
                  <Button onClick={handleCreateTeam} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                    {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

      </div>
    </div>
  );
}
