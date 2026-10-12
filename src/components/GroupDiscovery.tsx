import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { groupApplicationsApi, applicationError, applicationLabel, type Application, type DiscoveredGroup, type RemovalBan } from '../api/groupApplications';
import { api } from '../api/api';
import { Button } from '../shared/Button';
import { Users, TrendingUp, Handshake, Calendar, Clock, AlertTriangle, CheckCircle, X, ShieldAlert } from 'lucide-react';

interface FreeVisitsState {
  isSubscribed: boolean;
  userProfession?: string;
  visitsUsed: number;
  maxVisits: number;
  remainingVisits: number;
  canRequestVisitor: boolean;
  requests: Array<{
    id: string;
    group_id: string;
    status: string;
    created_at: string;
    group_name?: string;
  }>;
}

interface GroupStats {
  groupId: string;
  groupName: string;
  meetingDay: string;
  meetingTime: string;
  currentMonth: number;
  totalTurnover: number;
  totalReferrals: number;
  visitorCount: number;
  activeMembers: number;
  availableSeats: number;
}

export function GroupDiscovery() {
  const { user, token } = useAuthStore();
  const context = `${user?.id}:${token}`;
  const current = useRef(context);
  current.current = context;

  const [data, setData] = useState<{
    context: string;
    hasSubscription: boolean;
    removal_ban?: RemovalBan;
    groups: DiscoveredGroup[];
    applications: Application[];
  } | null>(null);

  const [freeVisits, setFreeVisits] = useState<FreeVisitsState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const lock = useRef(false);

  // Inspection Popup Modal State
  const [inspectModalGroup, setInspectModalGroup] = useState<DiscoveredGroup | null>(null);
  const [inspectTab, setInspectTab] = useState<'MEMBERS' | 'STATS'>('MEMBERS');
  const [groupStatsCache, setGroupStatsCache] = useState<Record<string, GroupStats>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Visitor Request Modal State
  const [visitorModalGroup, setVisitorModalGroup] = useState<DiscoveredGroup | null>(null);
  const [visitorNotes, setVisitorNotes] = useState('');
  const [visitorSubmitting, setVisitorSubmitting] = useState(false);
  const [visitorFeedback, setVisitorFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError('');
    if (user?.id) {
      Promise.all([
        groupApplicationsApi.discover(user.id),
        groupApplicationsApi.mine(user.id),
        api.getFreeVisits().catch(() => null)
      ]).then(([d, applications, visits]) => {
        if (!cancelled) {
          setData({ ...d, context, applications });
          if (visits) setFreeVisits(visits);
        }
      }).catch(e => {
        if (!cancelled) setError(applicationError(e));
      });
    }
    return () => { cancelled = true; };
  }, [context, retry]);

  const join = async (group: string) => {
    if (!user?.id || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await groupApplicationsApi.join(user.id, group);
      if (current.current === context) setRetry(n => n + 1);
    } catch (e) {
      if (current.current === context) setError(applicationError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const openInspectionModal = async (group: DiscoveredGroup) => {
    setInspectModalGroup(group);
    setInspectTab('MEMBERS');
    if (!groupStatsCache[group.id]) {
      setLoadingStats(true);
      try {
        const stats = await api.getGroupStats(group.id);
        setGroupStatsCache(prev => ({ ...prev, [group.id]: stats }));
      } catch (e) {
        console.error('Grup istatistikleri yüklenemedi', e);
      } finally {
        setLoadingStats(false);
      }
    }
  };

  const submitVisitorRequest = async () => {
    if (!visitorModalGroup) return;
    setVisitorSubmitting(true);
    setVisitorFeedback(null);
    try {
      const res = await api.requestGroupVisitor(visitorModalGroup.id, visitorNotes);
      setVisitorFeedback({
        type: 'success',
        message: res.message || `"${visitorModalGroup.name}" grubuna ziyaretçi talebiniz başarıyla oluşturuldu!`
      });
      setVisitorModalGroup(null);
      setVisitorNotes('');
      setInspectModalGroup(null);
      setRetry(n => n + 1);
    } catch (e: any) {
      setVisitorFeedback({
        type: 'error',
        message: e?.message || 'Ziyaretçi talebi oluşturulurken bir hata oluştu.'
      });
    } finally {
      setVisitorSubmitting(false);
    }
  };

  const snapshot = data?.context === context ? data : null;
  const isSubscribed = snapshot?.hasSubscription ?? freeVisits?.isSubscribed ?? false;
  const userProfession = (user?.profession || freeVisits?.userProfession || '').trim().toLowerCase();

  // Profession Conflict Helper
  const isGroupProfessionConflicted = (g: DiscoveredGroup) => {
    if (!userProfession) return false;
    return g.members.some(m => (m.profession || '').trim().toLowerCase() === userProfession);
  };

  const getConflictingMember = (g: DiscoveredGroup) => {
    if (!userProfession) return null;
    return g.members.find(m => (m.profession || '').trim().toLowerCase() === userProfession);
  };

  const remainingVisits = freeVisits ? freeVisits.remainingVisits : 2;

  return (
    <section aria-label="Grup seçimi" className="space-y-4 rounded-xl bg-white p-6 border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Grup Seç ve İncele</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isSubscribed
              ? 'Kapalı grupları inceleyebilir ve asil üyelik başvurusunda bulunabilirsiniz.'
              : 'Grupları inceleyebilir ve ücretsiz ziyaretçi olarak toplantılara katılabilirsiniz.'}
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => setRetry(n => n + 1)}>
          Yenile
        </Button>
      </div>

      {visitorFeedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-sm border flex items-center justify-between shadow-sm ${
            visitorFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {visitorFeedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{visitorFeedback.message}</span>
          </div>
          <button
            onClick={() => setVisitorFeedback(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-75"
          >
            Kapat
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      {!snapshot && !error && <p role="status" className="text-slate-500 py-6 text-center">Gruplar yükleniyor…</p>}

      {snapshot && (
        <>
          {snapshot.removal_ban?.active && (
            <div role="alert" className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>⚠️</span> Kapalı Grup Başvuru Yasağı (8 Ay / 2 Dönem Aktif)
              </p>
              <p>
                2. kez gruptan çıkarılma nedeniyle <strong>{snapshot.removal_ban.daysLeft} gün</strong> ({snapshot.removal_ban.bannedUntil ? new Date(snapshot.removal_ban.bannedUntil).toLocaleDateString('tr-TR') : ''} tarihine kadar) kapalı gruplara başvuru yapılamaz.
              </p>
              <p className="text-xs text-amber-700">
                Dış etkinliklere katılım ve açık WhatsApp topluluklarına katılımınız kısıtlanmamıştır.
              </p>
            </div>
          )}

          {/* Sadece Abone Olmamış Üyelere Özel Ziyaretçi Banner'ı */}
          {!isSubscribed && (
            <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎁</span>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      E4N'yi Keşfedin: 2 Toplantıya Ücretsiz Ziyaretçi Olun!
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    Abonelik satın almadan önce E4N'nin iş birliği modelini ve toplantı disiplinini yerinde görmeniz için <strong>2 toplantıya kadar ücretsiz ziyaretçi</strong> olabilirsiniz.
                  </p>
                </div>
                <div className="flex-shrink-0 bg-white px-5 py-2.5 rounded-xl border border-emerald-300 shadow-sm text-center">
                  <span className="text-xs uppercase font-bold text-slate-500 block">Kalan Ziyaretçi Hakkı</span>
                  <span className="text-xl font-black text-emerald-700">
                    {freeVisits ? `${freeVisits.remainingVisits} / ${freeVisits.maxVisits}` : '2 / 2'}
                  </span>
                </div>
              </div>

              {freeVisits && freeVisits.remainingVisits === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>⚠️ Ücretsiz ziyaretçi hakkınız dolmuştur ({freeVisits.visitsUsed}/{freeVisits.maxVisits} toplantı tamamlandı). Kapalı gruplara asil üye olarak başvurmak için lütfen aboneliğinizi başlatın.</span>
                  <Link to="/membership" className="font-bold text-amber-800 underline hover:text-amber-900 whitespace-nowrap">
                    Aboneliği Başlat &rarr;
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-emerald-800 font-medium">
                  Aşağıdaki kapalı grupları <strong>"İncele"</strong> butonuna tıklayarak üyeleri ve ciro istatistiklerini görebilir, mesleğinizin boş olduğu gruplara <strong>"Ziyaretçi olmak istiyorum"</strong> diyebilirsiniz.
                </p>
              )}
            </div>
          )}

          {!snapshot.groups.length && <p className="text-slate-500 py-4 text-center">Henüz aktif grup yok.</p>}

          <div className="space-y-4">
            {snapshot.groups.map(g => {
              const hasRequestedThisGroupAsVisitor = !isSubscribed && freeVisits?.requests?.some(
                r => r.group_id === g.id && r.status !== 'REJECTED'
              );
              const isConflicted = !isSubscribed && isGroupProfessionConflicted(g);
              const conflictMember = isConflicted ? getConflictingMember(g) : null;

              return (
                <article
                  className="border rounded-2xl p-5 space-y-3 bg-white hover:border-slate-300 hover:shadow-md transition-all"
                  key={g.id}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-lg">{g.name}</h3>
                        {isConflicted && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                            Meslek Dolu ({user?.profession})
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Başkan: {g.president ?? (g.president_ready?'Admin yönetiminde':'Başkan bilgisi doğrulanamadı')}
                        {g.city ? ` • ${g.city}` : ''}
                        {g.meeting_time ? ` • Toplantı: ${g.meeting_time}` : ''}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-lg border w-fit font-medium">
                      {g.member_count} / 35 üye • {g.available_seats} boş koltuk
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 items-center pt-1 border-t">
                    <Button size="sm" variant="outline" onClick={() => openInspectionModal(g)}>
                      İncele (Popup)
                    </Button>

                    {/* ABONE OLMUŞ ÜYELER İÇİN ASİL ÜYELİK BUTONU */}
                    {isSubscribed ? (
                      g.own_status === 'ACTIVE' ? (
                        <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-md">Üyesiniz</span>
                      ) : g.application_state ? (
                        <span className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-800 rounded-md">{applicationLabel(g.application_state)}</span>
                      ) : g.own_status === 'REQUESTED' || g.own_status === 'PENDING' ? (
                        <span className="text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-800 rounded-md">Başvuru bekliyor</span>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busy || !g.president_ready || g.available_seats === 0 || Boolean(snapshot.removal_ban?.active)}
                          onClick={() => join(g.id)}
                        >
                          Katıl
                        </Button>
                      )
                    ) : (
                      /* SADECE ABONE OLMAMIŞ ÜYELERE ÖZEL ZİYARETÇİ BUTONU */
                      hasRequestedThisGroupAsVisitor ? (
                        <span className="text-xs font-semibold px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md flex items-center gap-1">
                          <span>✓</span> Ziyaretçi Talebi Gönderildi (İnceleniyor)
                        </span>
                      ) : isConflicted ? (
                        <span
                          className="text-xs font-medium px-3 py-1.5 bg-slate-100 text-slate-500 rounded-md border cursor-not-allowed"
                          title={`Bu grupta mesleğiniz (${user?.profession}) temsil edildiği için ziyaretçi kabul edilemez.`}
                        >
                          Meslek Dolu ({conflictMember?.profession})
                        </span>
                      ) : remainingVisits > 0 ? (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                          disabled={busy}
                          onClick={() => {
                            setVisitorModalGroup(g);
                            setVisitorNotes('');
                          }}
                        >
                          Ziyaretçi olmak istiyorum
                        </Button>
                      ) : (
                        <Link to="/membership">
                          <Button size="sm" variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-50 text-xs">
                            Ziyaretçi Hakkı Doldu (Abone Olun)
                          </Button>
                        </Link>
                      )
                    )}

                    {snapshot.removal_ban?.active && isSubscribed && !['ACTIVE', 'REQUESTED', 'PENDING'].includes(g.own_status || '') && !g.application_state && (
                      <span className="text-xs text-amber-700">Başvuru Yasağı Aktif</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Abone Olmamış Üyenin Gönderdiği Ziyaretçi Talepleri */}
          {!isSubscribed && freeVisits && freeVisits.requests.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="text-base font-bold text-slate-800 mb-2">
                Ziyaretçi Taleplerim ({freeVisits.requests.length}/{freeVisits.maxVisits})
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {freeVisits.requests.map(req => (
                  <div key={req.id} className="p-3.5 bg-slate-50 border rounded-xl text-sm flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{req.group_name || 'Seçili Grup'}</p>
                      <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
                      {req.status === 'PENDING' ? 'İnceleniyor' : req.status === 'CONTACTED' ? 'İletişime Geçildi' : req.status === 'INVITED' ? 'Davet Edildi' : req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asil Üyelik Başvuruları Listesi */}
          <div className="pt-4 border-t">
            <h2 className="text-lg font-bold text-slate-900">Başvurularım</h2>
            {!snapshot.applications.length ? (
              <p className="text-sm text-slate-500">Henüz asil grup başvurunuz bulunmuyor.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {snapshot.applications.map(a => (
                  <article key={a.id} className="border rounded-xl p-3 text-sm bg-white">
                    <h3 className="font-semibold text-slate-900">{a.group_name}</h3>
                    <p className="text-slate-600">{applicationLabel(a.state)}</p>
                    {a.decision_note && <p className="text-xs text-slate-500 mt-1">Karar açıklaması: {a.decision_note}</p>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* POPUP MODAL: GRUP İNCELE (ÜYELER & İSTATİSTİKLER TABLARI) */}
      {inspectModalGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-slate-900">{inspectModalGroup.name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                    {inspectModalGroup.city || 'Tüm Şehirler'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Başkan: {inspectModalGroup.president ?? (inspectModalGroup.president_ready?'Admin yönetiminde':'Başkan bilgisi doğrulanamadı')} • {inspectModalGroup.meeting_time ? `Toplantı: ${inspectModalGroup.meeting_time}` : 'Haftalık Toplantı'}
                </p>
              </div>
              <button
                onClick={() => setInspectModalGroup(null)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1.5 hover:bg-slate-100 transition-colors"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex space-x-2 border-b">
              <button
                onClick={() => setInspectTab('MEMBERS')}
                className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                  inspectTab === 'MEMBERS'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Grup Üyeleri ({inspectModalGroup.member_count})
              </button>
              <button
                onClick={() => setInspectTab('STATS')}
                className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                  inspectTab === 'STATS'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Grup İstatistikleri (Ciro & Yönlendirme)
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {inspectTab === 'MEMBERS' && (
                <div className="space-y-4">
                  {/* Meslek Çakışması Uyarısı */}
                  {!isSubscribed && isGroupProfessionConflicted(inspectModalGroup) && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-sm space-y-1">
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <span>Meslek Çakışması Bulunuyor</span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        Sizin mesleğinizden (<strong>{user?.profession}</strong>) aktif bir üye ({getConflictingMember(inspectModalGroup)?.name}) bu grupta yer almaktadır. E4N kapalı grup ilkeleri gereği her meslek dalından tek bir temsilci kabul edilir. Bu nedenle bu gruba ziyaretçi kabul edilemez.
                      </p>
                    </div>
                  )}

                  {/* Meslek Dağılımı Özeti */}
                  {inspectModalGroup.members.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border text-xs text-slate-700">
                      <span className="font-semibold block mb-1.5 text-slate-800">Meslek Dağılımı:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(
                          inspectModalGroup.members.reduce<Record<string, number>>((a, m) => {
                            a[m.profession] = (a[m.profession] ?? 0) + 1;
                            return a;
                          }, {})
                        ).map(([profession, count]) => (
                          <span key={profession} className="px-2 py-0.5 bg-white rounded border text-slate-600">
                            {profession}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Üye Listesi */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 text-sm">Aktif Üye Kadrosu</h4>
                    {!inspectModalGroup.members.length ? (
                      <p className="text-sm text-slate-500 py-4 text-center">Bu grupta henüz aktif üye bulunmuyor.</p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {inspectModalGroup.members.map(m => {
                          const isConflict = userProfession && (m.profession || '').trim().toLowerCase() === userProfession;
                          return (
                            <div
                              key={m.id}
                              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                isConflict ? 'bg-amber-50/70 border-amber-200' : 'bg-white'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span>{m.name}</span>
                                  {m.president && (
                                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">
                                      Başkan
                                    </span>
                                  )}
                                </p>
                                <p className="text-slate-600 font-medium">{m.profession}</p>
                                {m.company && <p className="text-slate-400">{m.company}</p>}
                              </div>
                              {isConflict && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                  Aynı Meslek
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {inspectTab === 'STATS' && (
                <div className="space-y-4">
                  {loadingStats ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      Grup istatistikleri yükleniyor...
                    </div>
                  ) : (() => {
                    const stats = groupStatsCache[inspectModalGroup.id] || {
                      totalTurnover: 0,
                      totalReferrals: 0,
                      visitorCount: 0,
                      activeMembers: inspectModalGroup.member_count,
                      meetingDay: inspectModalGroup.meeting_time ? 'Haftalık' : 'Belirlenmedi',
                      meetingTime: inspectModalGroup.meeting_time || '07:00',
                      currentMonth: 1,
                      availableSeats: inspectModalGroup.available_seats
                    };

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {/* Ciro */}
                          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                            <span className="text-xs font-semibold text-emerald-800 block">Toplam Ciro (Hacim)</span>
                            <span className="text-xl font-black text-emerald-700 mt-1 block">
                              ₺{stats.totalTurnover.toLocaleString('tr-TR')}
                            </span>
                            <span className="text-[11px] text-emerald-600">Üretilen ticari ciro</span>
                          </div>

                          {/* İş Yönlendirmeleri */}
                          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl">
                            <span className="text-xs font-semibold text-blue-800 block">İş Yönlendirmeleri</span>
                            <span className="text-xl font-black text-blue-700 mt-1 block">
                              {stats.totalReferrals} Adet
                            </span>
                            <span className="text-[11px] text-blue-600">Başarılı referanslar</span>
                          </div>

                          {/* Ziyaretçi */}
                          <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl">
                            <span className="text-xs font-semibold text-purple-800 block">Ziyaretçi Sayısı</span>
                            <span className="text-xl font-black text-purple-700 mt-1 block">
                              {stats.visitorCount} Ziyaretçi
                            </span>
                            <span className="text-[11px] text-purple-600">Toplantı misafirleri</span>
                          </div>

                          {/* Üye Doluluk */}
                          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
                            <span className="text-xs font-semibold text-amber-800 block">Grup Doluluk</span>
                            <span className="text-xl font-black text-amber-700 mt-1 block">
                              {inspectModalGroup.member_count} / 35
                            </span>
                            <span className="text-[11px] text-amber-600">{inspectModalGroup.available_seats} boş koltuk</span>
                          </div>

                          {/* Toplantı Zamanı */}
                          <div className="p-4 bg-slate-50 border rounded-2xl col-span-2 sm:col-span-2">
                            <span className="text-xs font-semibold text-slate-700 block">Haftalık Toplantı Düzeni</span>
                            <div className="flex items-center gap-3 mt-1.5 text-sm font-bold text-slate-900">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-red-600" /> {stats.meetingDay}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-red-600" /> {stats.meetingTime}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 block">
                              {stats.currentMonth}. Ay (4 Aylık Shuffle Döngüsü)
                            </span>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 border rounded-2xl text-xs text-slate-600 leading-relaxed">
                          ℹ️ <strong>E4N Grup İstatistikleri:</strong> Kapalı gruplar haftalık toplantılar ve birebir görüşmelerle düzenli ticari referans üretir. Grup verileri üyelerin doğrulanmış işlem kayıtlarından derlenmektedir.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => setInspectModalGroup(null)}>
                Kapat
              </Button>

              {!isSubscribed && (
                isGroupProfessionConflicted(inspectModalGroup) ? (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-300">
                    Meslek Dolu — Bu Gruba Ziyaretçi Kabul Edilemez
                  </span>
                ) : freeVisits?.requests?.some(r => r.group_id === inspectModalGroup.id && r.status !== 'REJECTED') ? (
                  <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3.5 py-2 rounded-xl">
                    ✓ Ziyaretçi Talebiniz İnceleniyor
                  </span>
                ) : remainingVisits > 0 ? (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5"
                    onClick={() => {
                      setVisitorModalGroup(inspectModalGroup);
                      setVisitorNotes('');
                    }}
                  >
                    Bu Gruba Ziyaretçi Olmak İstiyorum
                  </Button>
                ) : (
                  <Link to="/membership">
                    <Button size="sm" variant="outline" className="text-amber-800 border-amber-300 text-xs">
                      Ziyaretçi Hakkı Doldu (Abone Olun)
                    </Button>
                  </Link>
                )
              )}

              {isSubscribed && (
                <Button
                  size="sm"
                  disabled={busy || !inspectModalGroup.president_ready || inspectModalGroup.available_seats === 0}
                  onClick={() => join(inspectModalGroup.id)}
                >
                  Gruba Asil Başvuru Yap
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ziyaretçi Talep Modalı */}
      {visitorModalGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Ücretsiz Ziyaret</span>
                <h3 className="text-xl font-bold text-slate-900">{visitorModalGroup.name}</h3>
              </div>
              <button
                onClick={() => setVisitorModalGroup(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p className="font-semibold">Toplantı Bilgisi:</p>
              <p>Toplantı Saati / Günü: {visitorModalGroup.meeting_time || 'Haftalık Toplantı'}</p>
              <p>Başkan: {visitorModalGroup.president || 'Grup Başkanı'}</p>
              <p className="pt-1 text-slate-600">
                Kalan Ziyaretçi Hakkınız: <strong>{freeVisits ? freeVisits.remainingVisits : 2} / 2</strong> (Bu taleple 1 hak kullanılacaktır).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kendinizi veya işinizi tanıtan kısa not (Opsiyonel)
              </label>
              <textarea
                value={visitorNotes}
                onChange={e => setVisitorNotes(e.target.value)}
                placeholder="Örn: Yazılım geliştirme ajansıyız, toplantıya misafir olarak katılıp ekiple tanışmak istiyorum."
                className="w-full text-xs p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={visitorSubmitting}
                onClick={() => setVisitorModalGroup(null)}
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                disabled={visitorSubmitting}
                onClick={submitVisitorRequest}
              >
                {visitorSubmitting ? 'Gönderiliyor...' : 'Ziyaretçi Talebini Gönder'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
