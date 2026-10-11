import { NotificationList } from '../components/NotificationList';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { usePerformanceStore,performanceContext } from '../stores/performanceStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Alert, AlertTitle, AlertDescription } from '../shared/Alert';
import { ScoreCard } from '../shared/ScoreCard';
import { ChampionsWidget } from '../shared/ChampionsWidget';
import { QuickActions } from '../shared/QuickActions';
import { ActivitySummary } from '../shared/ActivitySummary';
import { TasksCard } from '../shared/TasksCard';
import {GroupApplicationTasks} from '../components/GroupApplicationTasks';
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
  User,
  BookOpen,
  Shield,
  Sparkles,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';

export function Dashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const performanceState=usePerformanceStore();
  const {fetchPerformance}=performanceState;
  const fresh=performanceState.scope===performanceContext();
  const performance=fresh?performanceState.performance:null;
  const isLoading=fresh?performanceState.isLoading:true;
  const error=fresh?performanceState.error:null;

  const isSubscribed = Boolean(
    user?.role === 'ADMIN' ||
    (
      user?.subscription_plan &&
      user?.subscription_end_date &&
      new Date(user.subscription_end_date) > new Date() &&
      user?.account_status === 'ACTIVE'
    )
  );


  useEffect(() => {
    if (user) {
      fetchPerformance(user.id);
    }
  }, [user, token, fetchPerformance]);

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
                <p className="text-sm text-gray-500">Grup bilgileri</p>
                <p className="text-sm font-medium"><a href="#my-groups" className="text-indigo-700 underline">Gruplarım ve toplantılarım</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* D07 Restricted Account Notice */}
        {user.account_status === 'RESTRICTED' && (
          <div role="alert" className="mb-6 p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base">Hesabınız Kısıtlandı (Ödeme Gecikmesi)</h3>
                <p className="text-sm text-red-700 mt-0.5">
                  Üyelik aidatınızın 5 günlük ödeme süresi aşıldığı için kapalı grup faaliyetleriniz ve indirim haklarınız geçici olarak durdurulmuştur. Borcunuzu ödediğinizde hesabınız otomatik olarak aktifleşecektir.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/membership')}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm whitespace-nowrap shadow-sm border-none flex items-center"
            >
              Borcu Öde / Yenile
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Suspended Account Notice */}
        {user.account_status === 'SUSPENDED' && (
          <div role="alert" className="mb-6 p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-base">Hesabınız Askıya Alındı</h3>
              <p className="text-sm text-red-700 mt-0.5">
                Hesabınız idari nedenlerle askıya alınmıştır. Lütfen platform yönetimi ile iletişime geçiniz.
              </p>
            </div>
          </div>
        )}

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

        {/* Sözleşme Onayı ve Aktivasyon Bekleyen Üyeler İçin Banner */}
        {user && !user.explicit_consent && (
          <div className="mb-6 p-5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 bg-amber-200 text-amber-900 rounded-xl flex-shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider mb-1">
                  <span>⚠️ Sözleşme Onayı & Aktivasyon Bekleniyor</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-amber-950">
                  Üyeliğinizi Etkinleştirmek İçin Sözleşmeleri Onaylayın
                </h3>
                <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                  Satın alma işleminiz veya üyeliğiniz tamamlandıktan sonra grup protokolü ve etik kuralları içeren sözleşmeleri onaylamanız zorunludur.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/membership/activate')}
              className="bg-[#0e1b2d] hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs md:text-sm whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all self-end md:self-auto cursor-pointer"
            >
              Sözleşmeleri İncele & Onayla ↗
            </button>
          </div>
        )}

        {/* Ziyaretçi Olun ve Gruptaki Üyelerle Tanışın Banner'ı */}
        <div
          onClick={() => navigate('/chapter-management')}
          className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white shadow-xl shadow-slate-950/20 cursor-pointer transform hover:-translate-y-0.5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 border border-red-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="p-3.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-1.5 border border-emerald-500/30">
                <span>🎁 2 Toplantı Ücretsiz Ziyaretçi Hakkı</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Ziyaretçi olun ve gruptaki üyelerle tanışın (Ücretsiz)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                E4N kapalı gruplarının haftalık toplantılarına katılarak 35 kişilik seçkin iş çevreleriyle tanışın, iş yönlendirmesi ve networking modelini doğrudan yerinde deneyimleyin.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 relative z-10 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/chapter-management');
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-red-900/40 whitespace-nowrap flex items-center transition-all group-hover:translate-x-0.5"
            >
              Grupları Keşfet & Ziyaretçi Ol
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Traffic Light & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {!isSubscribed ? (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/40">
                      <BookOpen className="w-3.5 h-3.5" /> E4N Üyelik ve Çalışma Rehberi
                    </span>
                    <span className="text-xs text-slate-400 font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                      Sürüm 1.1 Taslak • 9 Sekmeli Kılavuz
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
                    Topluluk Kurallarını ve Çalışma Rehberini İnceleyin
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-3xl leading-relaxed">
                    E4N profesyonel iş ağında güven, düzenli katılım ve şeffaf kurallar esastır. Henüz aktif bir aboneliğiniz bulunmadığı için performans karnesi yerine toplantı adabı, devamsızlık ve vekil kuralları ile 9 sekmeli resmi rehber öncelikli olarak sunulmaktadır.
                  </p>

                  {/* 4 Core Pillars Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 shrink-0 mt-0.5">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">15 Dk Geç Kalma Toleransı</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Toplantı saatinden itibaren 15 dakikayı aşan gecikmeler devamsızlık sayılır.</p>
                      </div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 shrink-0 mt-0.5">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">2 Vekil & 3 Devamsızlık</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">4 aylık dönemde 3 devamsızlık ve 2 vekil hakkı; geçerli vekil devamsızlık sayılmaz.</p>
                      </div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 shrink-0 mt-0.5">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Yılda 1 Ay Dondurma</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Üyeliğinizi yılda bir defa, en fazla bir ay süreyle dondurabilirsiniz.</p>
                      </div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 shrink-0 mt-0.5">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Meslek Tekilliği & Kota Yok</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Aynı grupta mesleğinizden tek temsilci; zorunlu ciro veya satış kotası bulunmaz.</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800">
                    <Button
                      onClick={() => navigate('/rehber')}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Çalışma Rehberini İncele (9 Sekmeli Kılavuz)
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={() => navigate('/chapter-management')}
                      variant="outline"
                      className="w-full sm:w-auto border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white font-semibold px-5 py-3 rounded-xl"
                    >
                      Ücretsiz Ziyaretçi Ol
                    </Button>

                    <Button
                      onClick={() => navigate('/membership')}
                      variant="ghost"
                      className="w-full sm:w-auto text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 font-semibold px-4 py-3 rounded-xl"
                    >
                      Abonelik Satın Al
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Champions Widget */}
                <ChampionsWidget />

                {/* Performance Score Card */}
                <ScoreCard
                  performance={performance}
                  isLoading={isLoading}
                  userName={user.name}
                  onRefresh={()=>void fetchPerformance(user.id)}
                />
              </>
            )}

            {/* Tasks between performance and quick actions */}
            <GroupApplicationTasks />
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
            <div id="my-groups"><GroupMembersWidget /></div>
            {isSubscribed ? (
              <>
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
              </>
            ) : (
              <Card className="border-red-100 bg-gradient-to-br from-red-50/40 via-white to-slate-50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-red-600" />
                    Abonelikle Açılan Özellikler
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-sm text-gray-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>35 Kişilik Kapalı Grup:</strong> Grubunuzda mesleğinizin tek temsilcisi olun.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Birebir ve Referanslar:</strong> İş ortaklarıyla doğrudan 1-2-1 ve ticari yönlendirme yapın.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Performans Karnesi:</strong> Aylık trafik ışığı rozeti ve ticari hacim takibi.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Loncalar ve Shuffle:</strong> Ayda bir yüz yüze loncalara katılın ve 4 ayda bir yeni ağ kurun.</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <Button
                      onClick={() => navigate('/membership')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-900/20"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Abonelik Paketlerini İncele
                    </Button>
                    <button
                      onClick={() => navigate('/rehber')}
                      className="w-full text-center text-xs text-slate-500 hover:text-red-600 font-semibold py-1 transition-colors"
                    >
                      Çalışma Rehberini Oku →
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                      value={`${window.location.origin}/ziyaretci-basvurusu?refId=${user.id}`}
                      className="flex-1 rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm p-2 border"
                    />
                    <Button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/ziyaretci-basvurusu?refId=${user.id}`);
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
