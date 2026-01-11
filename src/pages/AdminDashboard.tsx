import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEventStore } from '../stores/eventStore';
import { useLMSStore } from '../stores/lmsStore';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import {
  Users,
  Calendar,
  BookOpen,
  BarChart3,
  Briefcase,
  Layers,
  Settings,
  Clock,
  UserPlus,
  Mail
} from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events, fetchEvents, loading: eventsLoading } = useEventStore();
  const { courses, fetchCourses } = useLMSStore();
  const [membersCount, setMembersCount] = useState(0);
  const [groupsCount, setGroupsCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);

  useEffect(() => {
    fetchEvents();
    fetchCourses();
    api.getMembers().then(r => setMembersCount(Array.isArray(r) ? r.length : 0)).catch(() => setMembersCount(0));
    api.getGroups().then(r => setGroupsCount(Array.isArray(r) ? r.length : 0)).catch(() => setGroupsCount(0));
    api.getPowerTeams().then(r => setTeamsCount(Array.isArray(r) ? r.length : 0)).catch(() => setTeamsCount(0));
  }, [fetchEvents, fetchCourses]);

  useMemo(() => [membersCount, groupsCount, teamsCount], [membersCount, groupsCount, teamsCount]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Erişim Kısıtlı</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Bu alan yalnızca Admin rolü için.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <Button onClick={() => navigate('/reports')} className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Raporlar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Toplam Üye</p>
                  <p className="text-2xl font-bold text-indigo-900">{membersCount}</p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Gruplar</p>
                  <p className="text-2xl font-bold text-blue-900">{groupsCount}</p>
                </div>
                <Layers className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Loncalar</p>
                  <p className="text-2xl font-bold text-purple-900">{teamsCount}</p>
                </div>
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Etkinlikler</p>
                  <p className="text-2xl font-bold text-green-900">{events.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              title="Etkinlik Yönetimi"
              icon={Calendar}
              color="text-green-600"
              bg="bg-green-50 hover:bg-green-100"
              onClick={() => navigate('/admin/events')}
              description="Yeni etkinlikler oluşturun ve düzenleyin."
            />
            <QuickActionCard
              title="Grup Yönetimi"
              icon={Layers}
              color="text-blue-600"
              bg="bg-blue-50 hover:bg-blue-100"
              onClick={() => navigate('/admin/groups')}
              description="Grupları ve loncaları yönetin."
            />
            <QuickActionCard
              title="Başvurular"
              icon={UserPlus}
              color="text-purple-600"
              bg="bg-purple-50 hover:bg-purple-100"
              onClick={() => navigate('/admin/visitors')}
              description="Yeni ziyaretçi başvurularını inceleyin."
            />
            <QuickActionCard
              title="Üye Yönetimi"
              icon={Users}
              color="text-indigo-600"
              bg="bg-indigo-50 hover:bg-indigo-100"
              onClick={() => navigate('/admin/members')}
              description="Üye profillerini ve rollerini düzenleyin."
            />

            <QuickActionCard
              title="Abonelik Takibi"
              icon={BarChart3}
              color="text-orange-600"
              bg="bg-orange-50 hover:bg-orange-100"
              onClick={() => navigate('/admin/subscriptions')}
              description="Üyelik aidat ve sürelerini takip edin."
            />
            <QuickActionCard
              title="Toplantı Zamanlayıcı"
              icon={Clock}
              color="text-red-600"
              bg="bg-red-50 hover:bg-red-100"
              onClick={() => navigate('/meeting-timer')}
              description="Toplantı süresini yönetin."
            />
            <QuickActionCard
              title="Shuffle Yönetimi"
              icon={Settings}
              color="text-gray-600"
              bg="bg-gray-50 hover:bg-gray-100"
              onClick={() => navigate('/admin/shuffle')}
              description="Grup üyelerini karıştırın."
            />
            <QuickActionCard
              title="Eğitim & Sınav"
              icon={BookOpen}
              color="text-teal-600"
              bg="bg-teal-50 hover:bg-teal-100"
              onClick={() => navigate('/admin/lms')}
              description="LMS ve sınav sistemini yönetin."
            />
            <QuickActionCard
              title="Raporlar"
              icon={BarChart3}
              color="text-cyan-600"
              bg="bg-cyan-50 hover:bg-cyan-100"
              onClick={() => navigate('/reports')}
              description="Sistem raporlarını görüntüleyin."
            />
            <QuickActionCard
              title="E-Posta Ayarları"
              icon={Mail}
              color="text-yellow-600"
              bg="bg-yellow-50 hover:bg-yellow-100"
              onClick={() => navigate('/admin/email-settings')}
              description="SMTP ve şablon ayarlarını yapın."
            />
            <QuickActionCard
              title="Destek Talepleri"
              icon={Mail}
              color="text-rose-600"
              bg="bg-rose-50 hover:bg-rose-100"
              onClick={() => navigate('/admin/support')}
              description="Kullanıcı destek taleplerini yönetin."
            />
            <QuickActionCard
              title="Meslek Grupları"
              icon={Briefcase}
              color="text-fuchsia-600"
              bg="bg-fuchsia-50 hover:bg-fuchsia-100"
              onClick={() => navigate('/admin/professions')}
              description="Meslekleri ve sektörleri düzenleyin."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, icon: Icon, onClick, color, bg, description }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-6 rounded-xl border border-transparent transition-all duration-200 ${bg} hover:shadow-lg hover:scale-105 hover:border-gray-200 group text-left h-full`}
    >
      <div className={`p-3 rounded-lg bg-white shadow-sm mb-4 group-hover:shadow-md transition-shadow`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
