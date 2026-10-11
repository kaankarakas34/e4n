import {GroupDiscovery} from '../components/GroupDiscovery';
import { AcceptedConnectionsPanel } from '../components/AcceptedConnectionsPanel';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Users, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';

export function ChapterManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [members, setMembers] = useState<Array<{ id: string; name: string; profession: string }>>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<{ name?: string; profession?: string; city?: string }>({});
  const [myGroup, setMyGroup] = useState<Array<{ id: string; name: string }>>([]);

  const [groupMembers, setGroupMembers] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (user?.id) {
      api.getUserGroups(user.id).then(setMyGroup).catch(() => { });
    }
  }, [user?.id]);

  useEffect(() => {
    if (myGroup.length > 0) {
      myGroup.forEach(async (g) => {
        const members = await api.getGroupMembers(g.id);
        setGroupMembers(prev => ({ ...prev, [g.id]: members }));
      });
    }
  }, [myGroup]);

  // Network Logic
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'NETWORK'>('GROUPS');
  const onSearch = async () => {
    const res = await api.searchMembers({ name: filters.name || query, profession: filters.profession, city: filters.city });
    setMembers(res || []);
  };

  // Deduplicate groups by name to handle potential DB duplicates
  const uniqueMyGroups = myGroup.filter((group, index, self) =>
    index === self.findIndex((g) => g.name === group.name)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Gruplarım ve Ağ</h1>

        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <button
            className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'GROUPS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('GROUPS')}
          >
            Gruplar
          </button>

          <button
            className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'NETWORK' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('NETWORK')}
          >
            Bağlantılarım (Network)
          </button>
        </div>

        {activeTab === 'GROUPS' && (
          <>
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Users className="h-5 w-5 mr-2 text-indigo-600" /> Benim Gruplarım</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {uniqueMyGroups.length === 0 ? (
                      <li className="text-sm text-gray-500">Aktif grup üyeliğiniz yok</li>
                    ) : uniqueMyGroups.map(g => (
                      <li key={g.id} className="flex items-center justify-between p-3 border rounded-md">
                        <span className="text-sm text-gray-900">{g.name}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500 flex items-center">Aktif Üyelik</span>
                          <Button size="sm" variant="outline" onClick={() => {
                            const isAdmin = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER', 'ADMIN'].includes(user?.role || '');
                            navigate(isAdmin ? `/admin/groups/${g.id}` : `/groups/${g.id}`);
                          }}>
                            {['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER', 'ADMIN'].includes(user?.role || '') ? 'Yönet' : 'Grup Detayı'}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

            </div>

            <div className="mt-6">
              <GroupDiscovery />

            </div>

            {/* Full Width Members Section */}
            <div className="mt-6 space-y-6">
              {myGroup.length > 0 && (
                <Card className="w-full shadow-lg border-indigo-100">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl"><Users className="h-6 w-6 mr-3 text-indigo-600" /> Grup Üyeleri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {uniqueMyGroups.map(group => (
                        <div key={group.id}>
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{group.name} Üyeleri</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupMembers[group.id]?.length > 0 ? (
                              groupMembers[group.id].map((m: any) => (
                                <div key={m.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/profile/${m.id}`)}>
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      {m.full_name ? m.full_name.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors block">
                                        {m.full_name || m.name}
                                      </span>
                                      <span className="text-sm text-gray-500 block">{m.profession}</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg">Üye bulunamadı veya yükleniyor...</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center"><Search className="h-5 w-5 mr-2 text-cyan-600" /> Üye Arama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <Input value={filters.name || ''} onChange={e => setFilters({ ...filters, name: e.target.value })} placeholder="İsim" />
                  <Input value={filters.profession || ''} onChange={e => setFilters({ ...filters, profession: e.target.value })} placeholder="İş Kolu / Meslek" />
                  <Input value={filters.city || ''} onChange={e => setFilters({ ...filters, city: e.target.value })} placeholder="Şehir" />
                  <Button variant="primary" onClick={onSearch}>Ara</Button>
                </div>
                <ul className="space-y-2 max-h-[320px] overflow-y-auto">
                  {members.map(m => (
                    <li key={m.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p
                          className="text-sm text-gray-900 cursor-pointer hover:text-indigo-600 hover:underline"
                          onClick={() => navigate(`/profile/${m.id}`)}
                        >
                          {m.name}
                        </p>
                        <p className="text-xs text-gray-600">{m.profession}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'NETWORK' && <AcceptedConnectionsPanel />}

      </div>



    </div>
  );
}
