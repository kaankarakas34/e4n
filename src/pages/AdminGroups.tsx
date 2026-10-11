import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { api } from '../api/api';
import { X } from 'lucide-react';
import { AdminGroupCatalog } from '../components/AdminGroupCatalog';
import { AdminShuffle } from './AdminShuffle';
import * as Dialog from '@radix-ui/react-dialog';

export function AdminGroups() {
  const { user, token } = useAuthStore();
  const context = `${user?.id}:${user?.role}:${token}`;
  const current = useRef(context); current.current = context;
  const creationId = useRef(crypto.randomUUID());

  const [activeTab, setActiveTab] = useState<'GROUPS' | 'SHUFFLE'>('GROUPS');
  const [catalogVersion, setCatalogVersion] = useState(0);

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsGroupModalOpen(false); setIsSubmitting(false);
  }, [context]);

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
              onClick={() => setActiveTab('SHUFFLE')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'SHUFFLE' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Shuffle
            </button>
          </div>
        </div>

        {activeTab === 'GROUPS' && (
          <AdminGroupCatalog refreshVersion={catalogVersion} onCreate={() => { creationId.current = crypto.randomUUID(); setNewItemName(''); setIsGroupModalOpen(true); }} />
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

      </div>
    </div>
  );
}
