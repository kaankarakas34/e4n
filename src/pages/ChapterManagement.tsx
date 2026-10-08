import { AcceptedConnectionsPanel } from '../components/AcceptedConnectionsPanel';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Users, Layers, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Modal } from '../shared/Modal';
import { PowerTeams } from './PowerTeams';

export function ChapterManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [powerTeams, setPowerTeams] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [members, setMembers] = useState<Array<{ id: string; name: string; profession: string }>>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<{ name?: string; profession?: string; city?: string }>({});
  const [myGroup, setMyGroup] = useState<Array<{ id: string; name: string }>>([]);

  const [myPowerTeams, setMyPowerTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [groupMembers, setGroupMembers] = useState<Record<string, any[]>>({});
  const [ptMembers, setPtMembers] = useState<Record<string, any[]>>({});
  const [selectedPTIds, setSelectedPTIds] = useState<string[]>([]);
  const [ptSearchQuery, setPtSearchQuery] = useState('');

  const [viewEntity, setViewEntity] = useState<{ type: 'GROUP' | 'POWER_TEAM'; id: string; name: string; description?: string } | null>(null);
  const [entityMembers, setEntityMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [pendingGroupIds, setPendingGroupIds] = useState<string[]>([]);
  const [pendingPTIds, setPendingPTIds] = useState<string[]>([]);

  useEffect(() => {
    api.getGroups().then(setGroups).catch(() => { });
    api.getPowerTeams().then(setPowerTeams).catch(() => { });
    if (user?.id) {
      api.getUserGroups(user.id).then(setMyGroup).catch(() => { });
      api.getUserPowerTeams(user.id).then(setMyPowerTeams).catch(() => { });
      api.getUserGroupRequests(user.id).then(setPendingGroupIds).catch(() => { });
      api.getUserPowerTeamRequests(user.id).then(setPendingPTIds).catch(() => { });
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

  useEffect(() => {
    if (myPowerTeams.length > 0) {
      myPowerTeams.forEach(async (pt) => {
        const members = await api.getPowerTeamMembers(pt.id);
        setPtMembers(prev => ({ ...prev, [pt.id]: members }));
      });
    }
  }, [myPowerTeams]);

  useEffect(() => {
    if (viewEntity) {
      setLoadingMembers(true);
      const fetchMembers = async () => {
        try {
          let members = [];
          if (viewEntity.type === 'GROUP') {
            members = await api.getGroupMembers(viewEntity.id);
          } else {
            members = await api.getPowerTeamMembers(viewEntity.id);
          }
          setEntityMembers(members);
        } finally {
          setLoadingMembers(false);
        }
      };
      fetchMembers();
    } else {
      setEntityMembers([]);
    }
  }, [viewEntity]);

  // Network Logic
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'NETWORK' | 'POWER_TEAMS'>('GROUPS');
  const onSearch = async () => {
    const res = await api.searchMembers({ name: filters.name || query, profession: filters.profession, city: filters.city });
    setMembers(res || []);
  };

  const requestGroup = async (groupId: string) => {
    if (!user?.id) return;
    try {
      await api.requestJoinGroup(user.id, groupId);
      setPendingGroupIds(prev => [...prev, groupId]);
    } catch (error) {
      console.error('Failed to request group join:', error);
    }
  };

  const requestPowerTeam = async (ptId: string) => {
    if (!user?.id) return;
    try {
      await api.requestJoinPowerTeam(user.id, ptId);
      setPendingPTIds(prev => [...prev, ptId]);
    } catch (error) {
      console.error('Failed to request power team join:', error);
    }
  };

  // Deduplicate groups by name to handle potential DB duplicates
  const uniqueMyGroups = myGroup.filter((group, index, self) =>
    index === self.findIndex((g) => g.name === group.name)
  );

  const uniqueAllGroups = groups.filter((group, index, self) =>
    index === self.findIndex((g) => g.name === group.name)
  );

  const uniquePowerTeams = powerTeams.filter((pt, index, self) =>
    index === self.findIndex((p) => p.name === pt.name)
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
            className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'POWER_TEAMS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('POWER_TEAMS')}
          >
            Loncalar
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Layers className="h-5 w-5 mr-2 text-purple-600" /> Benim Loncalarım</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {myPowerTeams.length === 0 ? (
                      <li className="text-sm text-gray-500">Aktif lonca üyeliğiniz yok</li>
                    ) : myPowerTeams.map(pt => (
                      <li key={pt.id} className="flex items-center justify-between p-3 border rounded-md">
                        <span className="text-sm text-gray-900">{pt.name}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500 flex items-center">Aktif Üyelik</span>
                          <Button size="sm" variant="outline" onClick={() => {
                            const isAdmin = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER', 'ADMIN'].includes(user?.role || '');
                            navigate(isAdmin ? `/admin/power-teams/${pt.id}` : `/power-teams/${pt.id}`);
                          }}>
                            {['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER', 'ADMIN'].includes(user?.role || '') ? 'Yönet' : 'Lonca Detayı'}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className={`mt-6 grid grid-cols-1 ${myGroup.length === 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
              {myGroup.length === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tüm Gruplar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {uniqueAllGroups.map(g => {
                        const isMember = myGroup.some(mg => mg.name === g.name);
                        const isPending = pendingGroupIds.includes(g.id);
                        return (
                          <li key={g.id} className="flex items-center justify-between p-3 border rounded-md">
                            <span className="text-sm text-gray-900">{g.name}</span>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => setViewEntity({ type: 'GROUP', id: g.id, name: g.name })}>
                                İncele
                              </Button>
                              {isMember ? (
                                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center">Üyesiniz</span>
                              ) : isPending ? (
                                <Button variant="secondary" size="sm" disabled className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  İstek Gönderildi
                                </Button>
                              ) : (
                                <Button variant="primary" size="sm" onClick={() => requestGroup(g.id)}>
                                  Katıl
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Tüm Loncalar</CardTitle>
                  <div className="mt-2">
                    <Input
                      placeholder="Lonca Ara..."
                      value={ptSearchQuery}
                      onChange={(e) => setPtSearchQuery(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 h-[200px] overflow-y-auto">
                    {uniquePowerTeams
                      .filter(pt => pt.name.toLowerCase().includes(ptSearchQuery.toLowerCase()))
                      .map(pt => {
                        const isPending = pendingPTIds.includes(pt.id);
                        return (
                          <li key={pt.id} className="flex items-center justify-between p-3 border rounded-md">
                            <span className="text-sm text-gray-900">{pt.name}</span>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => setViewEntity({ type: 'POWER_TEAM', id: pt.id, name: pt.name, description: pt.description })}>
                                İncele
                              </Button>
                              {isPending ? (
                                <Button variant="secondary" size="sm" disabled className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  İstek Gönderildi
                                </Button>
                              ) : (
                                <Button variant="primary" size="sm" onClick={() => requestPowerTeam(pt.id)}>Katıl</Button>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    {uniquePowerTeams.filter(pt => pt.name.toLowerCase().includes(ptSearchQuery.toLowerCase())).length === 0 && (
                      <li className="text-sm text-gray-500 text-center py-4">Sonuç bulunamadı</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
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

              {myPowerTeams.length > 0 && (
                <Card className="w-full shadow-lg border-purple-100">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl"><Layers className="h-6 w-6 mr-3 text-purple-600" /> Lonca Üyeleri</CardTitle>
                    </div>
                    {/* Filter Section */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedPTIds.length === 0 ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'}`}
                        onClick={() => setSelectedPTIds([])}
                      >
                        Tümü ({myPowerTeams.length})
                      </button>
                      {myPowerTeams.map(pt => (
                        <button
                          key={pt.id}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedPTIds.includes(pt.id) ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'}`}
                          onClick={() => {
                            if (selectedPTIds.includes(pt.id)) {
                              setSelectedPTIds(selectedPTIds.filter(id => id !== pt.id));
                            } else {
                              setSelectedPTIds([...selectedPTIds, pt.id]);
                            }
                          }}
                        >
                          {pt.name}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {myPowerTeams
                        .filter(pt => selectedPTIds.length === 0 || selectedPTIds.includes(pt.id))
                        .map(pt => (
                          <div key={pt.id}>
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{pt.name} Üyeleri</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {ptMembers[pt.id]?.length > 0 ? (
                                ptMembers[pt.id].map((m: any) => (
                                  <div key={m.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/profile/${m.id}`)}>
                                    <div className="flex items-center">
                                      <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold mr-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        {m.full_name ? m.full_name.charAt(0) : 'U'}
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors block">
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

        {activeTab === 'POWER_TEAMS' && (
          <div className="mt-6">
            <PowerTeams />
          </div>
        )}

        {activeTab === 'NETWORK' && <AcceptedConnectionsPanel />}

      </div>

      {/* Entity Details Modal */}
      <Modal
        open={!!viewEntity}
        title={viewEntity?.name || 'Detaylar'}
        onClose={() => setViewEntity(null)}
      >
        <div className="space-y-6">
          {viewEntity?.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Hakkında</h4>
              <p className="text-sm text-gray-600">{viewEntity.description}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center justify-between">
              <span>Mevcut Üyeler</span>
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{entityMembers.length} Üye</span>
            </h4>

            {loadingMembers ? (
              <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : entityMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                {entityMembers.map((m: any) => (
                  <div key={m.id} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                    setViewEntity(null);
                    navigate(`/profile/${m.id}`);
                  }}>
                    <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3 text-xs">
                      {m.full_name ? m.full_name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">{m.full_name || m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.profession}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg text-sm">
                Bu grupta henüz hiç üye yok. İlk katılan siz olun!
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setViewEntity(null)} className="mr-2">Kapat</Button>
            {(() => {
              const isMember = viewEntity?.type === 'GROUP'
                ? myGroup.some(g => g.id === viewEntity.id)
                : myPowerTeams.some(pt => pt.id === viewEntity?.id);

              const isPending = viewEntity?.type === 'GROUP'
                ? pendingGroupIds.includes(viewEntity.id)
                : !!(viewEntity && pendingPTIds.includes(viewEntity.id));

              if (isMember) {
                return (
                  <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-2 rounded-md flex items-center">
                    Zaten Üyesiniz
                  </span>
                );
              }

              if (isPending) {
                return (
                  <Button variant="secondary" disabled className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    İstek Gönderildi
                  </Button>
                );
              }

              return (
                <Button variant="primary" onClick={() => {
                  if (viewEntity?.type === 'GROUP') requestGroup(viewEntity.id);
                  else if (viewEntity) requestPowerTeam(viewEntity.id);
                  setViewEntity(null);
                }}>
                  {viewEntity?.name} {viewEntity?.type === 'GROUP' ? 'Grubuna' : 'Loncaya'} Katıl
                </Button>
              );
            })()}
          </div>
        </div>
      </Modal>
    </div>
  );
}
