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
  ArrowRight,
  Bell,
  MapPin,
  MessageCircle,
  Linkedin,
  Instagram,
  User
} from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';

export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { performance, isLoading, error, fetchPerformance } = usePerformanceStore();
  const [myGroup, setMyGroup] = useState<any>(null);

  useEffect(() => {
    if (user && user.role !== 'COMMUNITY_MEMBER') {
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

  if (user.role === 'COMMUNITY_MEMBER') {
    return <CommunityDashboard user={user} />;
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

function CommunityDashboard({ user }: { user: any }) {
    const navigate = useNavigate();
    const [events, setEvents] = useState<any[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const { notifications, fetchNotifications, markAsRead } = useNotificationStore();

    useEffect(() => {
        setEventsLoading(true);
        api.getEvents().then(data => {
            const now = new Date();
            const upcoming = (data || [])
                .filter((e: any) => e.status === 'PUBLISHED' && new Date(e.start_at) >= now)
                .sort((a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
            setEvents(upcoming);
            setEventsLoading(false);
        }).catch(err => {
            console.error(err);
            setEventsLoading(false);
        });

        if (user?.id) {
            fetchNotifications(user.id);
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header Banner */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Hoş Geldiniz, {user.name}</h1>
                            <p className="text-sm text-gray-500">{user.profession} • Topluluk Üyesi</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => navigate('/profile')}
                                variant="outline"
                                className="text-sm font-bold border-slate-350 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 rounded-xl"
                            >
                                <User className="w-4 h-4 text-slate-500" /> Profilimi Düzenle
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* Visitor Application Callout Banner */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-rose-600 p-8 text-white shadow-xl shadow-red-900/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]"></div>
                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white font-bold text-xs uppercase tracking-wider border border-white/20">
                            🤝 E4N Üyeliğine Geçiş Yapın
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                            Platformumuza Ziyaretçi Olarak Katılmak İster misiniz?
                        </h2>
                        <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                            Event4Network platformunda tam üyelik statüsüne geçiş yapmak, haftalık sektörel loncalarımıza ve B2B iş geliştirme gruplarımıza dahil olmak için ziyaretçi değerlendirme formunu doldurarak başvuruda bulunabilirsiniz.
                        </p>
                        <div className="pt-2">
                            <Button
                                size="lg"
                                onClick={() => navigate('/degerlendirme-basvurusu')}
                                className="bg-white text-red-600 hover:bg-slate-50 font-bold px-8 h-12 rounded-2xl shadow-lg shadow-black/10 transform active:scale-95 transition-all flex items-center gap-2 border-none"
                            >
                                Ziyaretçi Olmak İstiyorum <ArrowRight className="w-5 h-5 text-red-600 animate-pulse" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Upcoming Events */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar className="w-6 h-6 text-red-600" /> Yaklaşan Etkinlikler
                                </h2>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/events')}
                                    className="text-xs font-bold border-slate-350 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 rounded-xl px-4 py-2"
                                >
                                    Tüm Etkinlikleri Gör <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            {eventsLoading ? (
                                <div className="text-center py-12 text-slate-500">Etkinlikler yükleniyor...</div>
                            ) : events.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 italic">Yaklaşan etkinlik bulunmuyor.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {events.map(event => (
                                        <div key={event.id} className="border border-slate-200 rounded-2xl p-5 hover:border-red-500 hover:shadow-lg transition-all flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100">
                                                        {event.event_type === 'NETWORKING' ? 'Network' : 'Etkinlik'}
                                                    </span>
                                                    {event.city && (
                                                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">
                                                            {event.city}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-slate-950 text-base mb-2 line-clamp-2 min-h-[48px]">{event.title}</h3>
                                                <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <span>{new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4 text-slate-400" />
                                                        <span>{event.is_online ? 'Online Toplantı' : event.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/event/${event.id}`)}
                                                className="w-full text-xs font-bold py-2.5 rounded-xl"
                                            >
                                                Detayları Gör & Kaydol
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Notifications */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Bell className="w-6 h-6 text-indigo-600" /> Bildirimler
                            </h2>
                            {notifications.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 italic">Bildirim bulunmuyor.</div>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                    {notifications.slice(0, 10).map((n: any) => (
                                        <div 
                                            key={n.id} 
                                            onClick={() => !n.is_read && markAsRead(n.id)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                                n.is_read 
                                                    ? 'bg-slate-50 border-slate-200 text-slate-600' 
                                                    : 'bg-indigo-50/50 border-indigo-150 text-slate-800 font-medium'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">{n.title}</h4>
                                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse"></span>}
                                            </div>
                                            <p className="text-xs mt-1 leading-relaxed">{n.message}</p>
                                            <span className="text-[10px] text-slate-400 block mt-2">
                                                {new Date(n.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Topluluk Kanalları */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Users className="w-6 h-6 text-emerald-600" /> Topluluk Bağlantıları
                            </h2>
                            <p className="text-xs text-slate-500 leading-relaxed mb-6">
                                Etkinliklerimizden anında haberdar olmak ve diğer üyelerle iletişimde kalmak için ücretsiz kanallarımıza katılın.
                            </p>
                            
                            <div className="space-y-3.5">
                              {[
                                {
                                  name: "Duyurular Grubu",
                                  desc: "Etkinlik duyuruları ve önemli gelişmeler",
                                  url: "https://chat.whatsapp.com/GTlmZQUrjT402yi5swGQ5c",
                                  icon: MessageCircle,
                                  color: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                  actionText: "Gruba Katıl"
                                },
                                {
                                  name: "Genel İş Ağı Grubu",
                                  desc: "Tüm sektörlerden genel iletişim & iş ağı",
                                  url: "https://chat.whatsapp.com/DeBaBEYP0D89O1HxD6vgCK",
                                  icon: MessageCircle,
                                  color: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                  actionText: "Gruba Katıl"
                                },
                                {
                                  name: "E4N LinkedIn Grubu",
                                  desc: "İş dünyasındaki bağlantılarınızı güçlendirin",
                                  url: "https://www.linkedin.com/groups/33110020/",
                                  icon: Linkedin,
                                  color: "bg-blue-50 text-blue-600 border-blue-100",
                                  actionText: "Gruba Katıl"
                                },
                                {
                                  name: "Instagram Sayfası",
                                  desc: "Etkinlik özetleri ve görsel paylaşımlar",
                                  url: "https://www.instagram.com/event4network/",
                                  icon: Instagram,
                                  color: "bg-rose-50 text-rose-600 border-rose-100",
                                  actionText: "Takip Et"
                                }
                              ].map((item, idx) => {
                                const IconComponent = item.icon;
                                return (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.color}`}>
                                        <IconComponent className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                                      </div>
                                    </div>
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors shadow-sm shrink-0"
                                    >
                                      {item.actionText}
                                    </a>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-6 pt-5 border-t border-slate-100">
                              <Button
                                onClick={() => navigate('/topluluklarimiz')}
                                variant="outline"
                                className="w-full text-xs font-bold py-2.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 flex justify-center items-center gap-1.5"
                              >
                                Tüm Sektörel Loncaları Gör <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
