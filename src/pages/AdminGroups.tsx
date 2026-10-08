import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { api, type PowerTeamSettings } from '../api/api';
import { Users, Plus, X } from 'lucide-react';
import { AdminGroupCatalog } from '../components/AdminGroupCatalog';
import { AdminShuffle } from './AdminShuffle';
import * as Dialog from '@radix-ui/react-dialog';

export function AdminGroups() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const context = `${user?.id}:${user?.role}:${token}`;
  const current = useRef(context); current.current = context;
  const creationId = useRef(crypto.randomUUID());
  const teamBusy = useRef(false);
  const teamEpoch = useRef(0);
  const teamRead = useRef(0);
  const [teamIntent,setTeamIntent] = useState<{id:string,name:string}|null>(null);
  const [teamNotice,setTeamNotice] = useState('');
  const [teamSearch,setTeamSearch] = useState('');
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'TEAMS' | 'SHUFFLE'>('GROUPS');
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [teams, setTeams] = useState<PowerTeamSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    teamEpoch.current++; teamBusy.current=false; setTeamIntent(null); setTeamNotice('');
    setIsGroupModalOpen(false); setIsTeamModalOpen(false); setIsSubmitting(false);
  }, [context]);
  useEffect(() => {
    if (activeTab === 'TEAMS') loadData();
  }, [context, activeTab]);

  const loadData = async () => {
    const scope = context,read=++teamRead.current;
    setLoading(true); setError(null); setLoadedFor(null); setTeams([]);
    if (user?.role !== 'ADMIN') { setLoading(false); return; }
    try {
      const t = await api.getAdminPowerTeamSettings(user.id);
      if (current.current !== scope || teamRead.current!==read) return;
      if (!Array.isArray(t)) throw new Error('Invalid management lists');
      setTeams(t || []);
    } catch (e) {
      if (current.current === scope && teamRead.current===read) setError('Veriler yüklenemedi');
    } finally {
      if (current.current === scope && teamRead.current===read) { setLoading(false); setLoadedFor(scope); }
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
    if (!newItemName.trim() || isSubmitting) return;
    const scope = context;
    setIsSubmitting(true);
    try {
      await api.createGroup({ id: creationId.current, name: newItemName });
      if (current.current !== scope) return;
      setIsGroupModalOpen(false);
      setNewItemName('');
      setCatalogVersion(n => n + 1); // Read new saved group from catalog
    } catch (e: any) {
      if (current.current === scope) alert('Hata: ' + (e.message || 'Grup oluşturulamadı'));
    } finally {
      if (current.current === scope) setIsSubmitting(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !newItemName.trim() || teamBusy.current) return;
    const scope=context,epoch=teamEpoch.current;
    const intent=teamIntent ?? {id:crypto.randomUUID(),name:newItemName.trim()};
    teamBusy.current=true; setTeamIntent(intent); setIsSubmitting(true); setTeamNotice('');
    try {
      const saved=await api.createPowerTeam(intent,user.id);
      if(current.current!==scope || teamEpoch.current!==epoch)return;
      // Acknowledgement clears the pending write before a separate list refresh.
      setTeamIntent(null); setTeamNotice(`${saved.name} kaydedildi.`);
      setIsTeamModalOpen(false);
      setNewItemName('');
      loadData(); // Refresh list
    } catch (e: any) {
      if(current.current===scope && teamEpoch.current===epoch) {
        setTeamNotice('Kayıt doğrulanamadı. Tekrar dene aynı oluşturma kimliğini kullanır.');
        if(e.status>=400 && e.status<500) {setTeamIntent(null);setTeamNotice('Lonca kaydedilemedi: '+e.message);}
      }
    } finally {
      if(current.current===scope && teamEpoch.current===epoch){teamBusy.current=false;setIsSubmitting(false);}
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

        {activeTab === 'TEAMS' && teamNotice && <p role="status" className="p-3 mb-4 bg-purple-50">{teamNotice}</p>}
        {activeTab === 'TEAMS' && error && <div role="alert" className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border border-red-200">{error}</div>}

        {activeTab === 'GROUPS' && (
          <AdminGroupCatalog refreshVersion={catalogVersion} onCreate={() => { creationId.current = crypto.randomUUID(); setNewItemName(''); setIsGroupModalOpen(true); }} />
        )}

        {activeTab === 'TEAMS' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Lonca Listesi</CardTitle>
              <Button disabled={isSubmitting} onClick={() => { if(!teamIntent){setTeamNotice('');setNewItemName('');} setIsTeamModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                <Plus className="h-4 w-4" /> {teamIntent?'Bekleyen lonca işlemini aç':'Lonca Oluştur'}
              </Button>
            </CardHeader>
            <CardContent>
              <Input aria-label="Lonca ara" placeholder="Lonca adı veya açıklaması" value={teamSearch} onChange={e=>setTeamSearch(e.target.value)} />
              {loading || loadedFor !== context ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
              ) : error ? (<Button onClick={loadData}>Loncaları tekrar yükle</Button>) : teams.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">Henüz hiç lonca yok.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {!teams.some(t=>`${t.name} ${t.description||''}`.toLocaleLowerCase('tr-TR').includes(teamSearch.toLocaleLowerCase('tr-TR'))) && <p>Aramaya uygun lonca bulunamadı.</p>}
                  {teams.filter(t=>`${t.name} ${t.description||''}`.toLocaleLowerCase('tr-TR').includes(teamSearch.toLocaleLowerCase('tr-TR'))).map(t => (
                    <button type="button"
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
                      <p className="text-sm">{t.status==='ACTIVE'?'Aktif':t.status==='DRAFT'?'Taslak':t.status||'Durum belirtilmemiş'}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{t.description || 'Açıklama girilmemiş.'}</p>
                    </button>
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
        <Dialog.Root open={isTeamModalOpen} onOpenChange={open=>{if(!teamBusy.current)setIsTeamModalOpen(open);}}>
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
                    aria-label="Lonca Adı"
                    disabled={isSubmitting || !!teamIntent}
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    autoFocus
                  />
                </div>
                {teamNotice && <p role="status">{teamNotice}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" disabled={isSubmitting} onClick={() => setIsTeamModalOpen(false)}>{teamIntent?'Kapat — işlem anahtarı korunur':'İptal'}</Button>
                  <Button onClick={handleCreateTeam} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                    {isSubmitting ? 'Oluşturuluyor...' : teamIntent ? 'Aynı işlemi tekrar dene' : 'Oluştur'}
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
