import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { api } from '../api/api';
import { Layers, Users } from 'lucide-react';
import { AdminShuffle } from './AdminShuffle';

export function AdminGroups() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'TEAMS' | 'SHUFFLE'>('GROUPS');
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [teamName, setTeamName] = useState('');

  // ... load effect ...
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const g = await api.getGroups();
        const t = await api.getPowerTeams();
        setGroups(g || []);
        setTeams(t || []);
      } catch (e) {
        setError('Gruplar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ... access check ...
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader><CardTitle>Erişim Kısıtlı</CardTitle></CardHeader>
            <CardContent><p className="text-gray-600">Bu sayfa yalnızca Admin için.</p></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ... create functions ...
  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const created = await api.createGroup({ name: groupName });
      setGroups([created, ...groups]);
      setGroupName('');
    } catch (e) {
      setError('Grup oluşturulamadı');
    }
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;
    try {
      const created = await api.createPowerTeam({ name: teamName });
      setTeams([created, ...teams]);
      setTeamName('');
    } catch (e) {
      setError('Lonca oluşturulamadı');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Grup Yönetimi</h1>
          <div className="flex space-x-2 bg-white p-1 rounded-lg border shadow-sm">
            <button
              onClick={() => setActiveTab('GROUPS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'GROUPS' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Gruplar
            </button>
            <button
              onClick={() => setActiveTab('TEAMS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'TEAMS' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Loncalar
            </button>
            <button
              onClick={() => setActiveTab('SHUFFLE')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'SHUFFLE' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Shuffle Yönetimi
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {activeTab === 'GROUPS' && (
          <Card>
            <CardHeader><CardTitle>Grup Listesi</CardTitle></CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-6">
                <Input placeholder="Yeni grup adı" value={groupName} onChange={e => setGroupName(e.target.value)} />
                <Button onClick={createGroup}>Oluştur</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((g: any) => (
                  <div
                    key={g.id}
                    className="p-4 border rounded-lg hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-white"
                    onClick={() => navigate(`/admin/groups/${g.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Layers className="h-5 w-5 text-indigo-600" />
                      <span className={`text-xs font-bold px-2 py-1 rounded ${g.current_month >= 4 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {g.current_month || 1}. Ay
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{g.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{g.member_count || 0} Üye</p>
                  </div>
                ))}
              </div>
              {loading && <p className="py-2 text-gray-500 text-center">Yükleniyor...</p>}
            </CardContent>
          </Card>
        )}

        {activeTab === 'TEAMS' && (
          <Card>
            <CardHeader><CardTitle>Loncalar</CardTitle></CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-6">
                <Input placeholder="Yeni lonca adı" value={teamName} onChange={e => setTeamName(e.target.value)} />
                <Button onClick={createTeam}>Oluştur</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-4 border rounded-lg hover:border-purple-300 hover:shadow-md cursor-pointer transition-all bg-white"
                    onClick={() => navigate(`/admin/power-teams/${t.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t.description || 'Açıklama yok'}</p>
                  </div>
                ))}
              </div>
              {loading && <p className="py-2 text-gray-500 text-center">Yükleniyor...</p>}
            </CardContent>
          </Card>
        )}

        {activeTab === 'SHUFFLE' && (
          <AdminShuffle />
        )}

      </div>
    </div>
  );
}

