import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePerformanceStore } from '../stores/performanceStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Alert, AlertTitle, AlertDescription } from '../shared/Alert';
import { ScoreCard } from '../shared/ScoreCard';
import { ChampionsWidget } from '../shared/ChampionsWidget';
import { QuickActions } from '../shared/QuickActions';
import { ActivitySummary } from '../shared/ActivitySummary';
import { TasksCard } from '../shared/TasksCard';
import { GroupMembersWidget } from '../shared/GroupMembersWidget';
import { FriendRequestsWidget } from '../shared/FriendRequestsWidget';
import {
  Users,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuthStore();
  const { performance, isLoading, error, fetchPerformance } = usePerformanceStore();

  useEffect(() => {
    if (user) {
      fetchPerformance(user.id);
    }
  }, [user, fetchPerformance]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">
          <AlertTitle>Giriş Gerekli</AlertTitle>
          <AlertDescription>
            Dashboard'u görüntülemek için lütfen giriş yapın.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hoş Geldiniz, {user.name}
              </h1>
              <p className="text-sm text-gray-500">
                {user.profession} {user.role ? `• ${String(user.role).replace(/_/g, ' ')}` : ''}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Grup Üyesi</p>
                <p className="text-sm font-medium">İstanbul E4N</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="error" className="mb-6">
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Traffic Light & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Champions Widget */}
            <ChampionsWidget />

            {/* Performance Score Card */}
            <ScoreCard
              performance={performance}
              isLoading={isLoading}
              userName={user.name}
            />

            {/* Tasks between performance and quick actions */}
            <TasksCard />

            {/* Quick Actions moved to right column */}

            {/* Activity Summary */}
            <ActivitySummary />
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            <FriendRequestsWidget />
            <QuickActions />
            <GroupMembersWidget />
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Bu Ayki Yönlendirmeler</p>
                      <p className="text-2xl font-bold text-gray-900">{performance?.breakdown?.referrals || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Birebir Görüşmeler</p>
                      <p className="text-2xl font-bold text-gray-900">{performance?.breakdown?.one_to_ones || 0}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Getirilen Ziyaretçiler</p>
                      <p className="text-2xl font-bold text-gray-900">{performance?.breakdown?.visitors || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Meeting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Sonraki Toplantı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">Salı, 14:00 - 16:00</p>
                  <p className="text-sm text-gray-500">Hilton İstanbul Kozyatağı</p>
                  <div className="flex items-center space-x-2 mt-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Katılımınız Onaylandı</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Performans İpuçları
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performance?.recommendations && performance.recommendations.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-600">
                    {performance.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Harika gidiyorsunuz! Şu an için bir öneri yok.</p>
                )}
              </CardContent>
            </Card>

            {/* Visitor Registration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Yeni Ziyaretçi Kaydı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={async (e) => {
                  e.preventDefault();
                  // Basic form data handling
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const payload = {
                    name: formData.get('name'),
                    company: formData.get('company'),
                    profession: formData.get('profession'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    group_id: '1', // Default to user's group
                    inviter_id: user.id
                  };

                  try {
                    await import('../api/api').then(m => m.api.createVisitor(payload));
                    alert('Ziyaretçi başarıyla kaydedildi! (+5 Puan kazandınız)');
                    form.reset();
                    fetchPerformance(user.id); // Refresh traffic light
                  } catch (err) {
                    alert('Hata oluştu.');
                  }
                }}>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Ad Soyad</label>
                    <input name="name" required className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border" placeholder="Örn: Ahmet Yılmaz" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Şirket İsmi</label>
                    <input name="company" className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border" placeholder="Örn: Yılmaz A.Ş." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Meslek</label>
                    <input name="profession" required className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border" placeholder="Örn: Mimar" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Telefon</label>
                      <input name="phone" required className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border" placeholder="0555..." />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">E-posta</label>
                      <input name="email" type="email" required className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border" placeholder="ornek@mail.com" />
                    </div>
                  </div>
                  <Button type="submit" variant="primary" className="w-full mt-2">
                    Kaydet
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
