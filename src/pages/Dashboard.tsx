import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
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
import { VisitorInviteWidget } from '../shared/VisitorInviteWidget';
import {
  Users,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  ArrowRight
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { performance, isLoading, error, fetchPerformance } = usePerformanceStore();
  const [myGroup, setMyGroup] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchPerformance(user.id);
      api.getUserGroups(user.id).then(async groups => {
        if (groups && groups.length > 0) {
          // fetch full group details to get meeting_dates
          const allGroups = await api.getGroups();
          const fullGroup = allGroups.find((g: any) => g.id === groups[0].id);
          setMyGroup(fullGroup || groups[0]);
        }
      }).catch(console.error);
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
                <p className="text-sm font-medium">{myGroup ? myGroup.name : 'Yükleniyor...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Days Left Indicator */}
        {user.subscription_end_date && (() => {
          const endDate = new Date(user.subscription_end_date);
          const now = new Date();
          // Reset hours to midnight for pure calendar days comparison
          const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const diffTime = endMidnight.getTime() - nowMidnight.getTime();
          const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
          const isExpired = daysLeft <= 0;
          const isWarning = daysLeft > 0 && daysLeft <= 3;

          return (
            <div className={`mb-6 p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-200 ${
              isExpired 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : isWarning 
                  ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse' 
                  : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-green-100'}`}>
                  <CreditCard className={`h-6 w-6 ${isExpired ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {isExpired 
                      ? 'Üyelik Süreniz Doldu' 
                      : `Üyeliğinizin Bitmesine ${daysLeft} Gün Kaldı`}
                  </h3>
                  <p className="text-sm opacity-90 mt-0.5">
                    {isExpired 
                      ? 'Hesabınızın kısıtlanmaması için lütfen ödemenizi gerçekleştiriniz.' 
                      : `Mevcut üyelik planınız: ${user.subscription_plan ? user.subscription_plan.replace('_MONTHS', ' Ay').replace('1_MONTH', 'Aylık') : 'Belirtilmemiş'}. Son gün: ${endDate.toLocaleDateString('tr-TR')}`}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/membership')}
                className={`${
                  isExpired 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : isWarning 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                } font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center shadow-sm border-none`}
              >
                {isExpired || isWarning ? 'Şimdi Öde / Yenile' : 'Üyelik Bilgileri'}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          );
        })()}

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
            <VisitorInviteWidget />
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
                  Gelecek Toplantılar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myGroup && myGroup.meeting_dates && myGroup.meeting_dates.length > 0 ? (
                  <div className="space-y-4">
                    {myGroup.meeting_dates.filter((d: string) => new Date(d) >= new Date(new Date().setHours(0,0,0,0))).slice(0, 3).map((dateStr: string, idx: number) => {
                      const d = new Date(dateStr);
                      return (
                        <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-sm text-gray-500">{myGroup.meeting_time ? `${myGroup.meeting_time} ` : ''}({myGroup.meeting_link ? 'Online' : 'Yüz Yüze'})</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {idx === 0 && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-bold">Yaklaşan</span>}
                          </div>
                        </div>
                      );
                    })}
                    {myGroup.meeting_dates.filter((d: string) => new Date(d) >= new Date(new Date().setHours(0,0,0,0))).length === 0 && (
                      <p className="text-sm text-gray-500">Gelecek toplantı tarihi bulunmuyor.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-500 text-sm">Toplantı tarihleri henüz planlanmamış.</p>
                  </div>
                )}
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

            {/* Visitor Link Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Ziyaretçi Davet Et
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600">
                  <p>
                    Ziyaretçilerinizi doğrudan sisteme kaydetmek yerine onlara özel bir davet linki gönderebilirsiniz. 
                    Bu link ile kayıt olduklarında sizin referansınızla geldikleri otomatik olarak kaydedilir.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/degerlendirme-basvurusu?refId=${user.id}`} 
                      className="flex-1 rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm p-2 border"
                    />
                    <Button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/degerlendirme-basvurusu?refId=${user.id}`);
                      alert('Davet linki kopyalandı!');
                    }}>
                      Kopyala
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
