import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { groupApplicationsApi, applicationError, applicationLabel, type Application, type DiscoveredGroup, type RemovalBan } from '../api/groupApplications';
import { api } from '../api/api';
import { Button } from '../shared/Button';

interface FreeVisitsState {
  isSubscribed: boolean;
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
  const [detail, setDetail] = useState<string | null>(null);
  const lock = useRef(false);

  // Visitor Request Modal State
  const [visitorModalGroup, setVisitorModalGroup] = useState<DiscoveredGroup | null>(null);
  const [visitorNotes, setVisitorNotes] = useState('');
  const [visitorSubmitting, setVisitorSubmitting] = useState(false);
  const [visitorFeedback, setVisitorFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError('');
    setDetail(null);
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

  return (
    <section aria-label="Grup seçimi" className="space-y-4 rounded-lg bg-white p-5 border shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Grup Seç ve İncele</h2>
          <p className="text-sm text-slate-500">
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
          className={`p-4 rounded-lg text-sm border flex items-center justify-between ${
            visitorFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <span>{visitorFeedback.message}</span>
          <button
            onClick={() => setVisitorFeedback(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-75"
          >
            Kapat
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!snapshot && !error && <p role="status" className="text-slate-500 py-4">Gruplar yükleniyor…</p>}

      {snapshot && (
        <>
          {snapshot.removal_ban?.active && (
            <div role="alert" className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-sm space-y-1">
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
            <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎁</span>
                    <h3 className="font-bold text-slate-900 text-base">E4N'yi Keşfedin: 2 Toplantıya Ücretsiz Ziyaretçi Olun!</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Abonelik satın almadan önce E4N'nin iş birliği modelini ve toplantı disiplinini yerinde görmeniz için <strong>2 toplantıya kadar ücretsiz ziyaretçi</strong> olabilirsiniz.
                  </p>
                </div>
                <div className="flex-shrink-0 bg-white px-4 py-2 rounded-lg border border-emerald-300 shadow-sm text-center">
                  <span className="text-xs uppercase font-bold text-slate-500 block">Kalan Ziyaretçi Hakkı</span>
                  <span className="text-lg font-black text-emerald-700">
                    {freeVisits ? `${freeVisits.remainingVisits} / ${freeVisits.maxVisits}` : '...'}
                  </span>
                </div>
              </div>

              {freeVisits && freeVisits.remainingVisits === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>⚠️ Ücretsiz ziyaretçi hakkınız dolmuştur ({freeVisits.visitsUsed}/{freeVisits.maxVisits} toplantı tamamlandı). Kapalı gruplara asil üye olarak başvurmak için lütfen aboneliğinizi başlatın.</span>
                  <Link to="/membership" className="font-bold text-amber-800 underline hover:text-amber-900 whitespace-nowrap">
                    Aboneliği Başlat &rarr;
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-emerald-800 font-medium">
                  Aşağıdaki kapalı gruplardan birini seçip <strong>"Ziyaretçi olmak istiyorum"</strong> butonuna tıklayarak toplantı davetiyesi talep edebilirsiniz.
                </p>
              )}
            </div>
          )}

          {!snapshot.groups.length && <p className="text-slate-500">Henüz aktif grup yok.</p>}

          <div className="space-y-3">
            {snapshot.groups.map(g => {
              const hasRequestedThisGroupAsVisitor = !isSubscribed && freeVisits?.requests?.some(
                r => r.group_id === g.id && r.status !== 'REJECTED'
              );

              return (
                <article className="border rounded-xl p-4 space-y-2 bg-white hover:border-slate-300 transition-colors" key={g.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{g.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Başkan: {g.president ?? 'Başkan bilgisi doğrulanamadı'}
                        {g.city ? ` • ${g.city}` : ''}
                        {g.meeting_time ? ` • Toplantı: ${g.meeting_time}` : ''}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 bg-slate-50 px-3 py-1 rounded-md border w-fit">
                      {g.member_count} / 35 üye • {g.available_seats} boş koltuk
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center pt-2">
                    <Button size="sm" variant="outline" onClick={() => setDetail(detail === g.id ? null : g.id)}>
                      {detail === g.id ? 'Gizle' : 'İncele'}
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
                      ) : freeVisits && freeVisits.remainingVisits > 0 ? (
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

                  {detail === g.id && (
                    <div aria-label={`${g.name} grup analizi`} className="bg-slate-50 p-3 rounded-lg border space-y-2 mt-2 text-sm">
                      <h4 className="font-semibold text-slate-800">Üyeler ve Meslek Dağılımı</h4>
                      {!g.members.length ? (
                        <p className="text-slate-500">Aktif üye yok.</p>
                      ) : (
                        <>
                          <p className="text-xs text-slate-600">
                            {Object.entries(
                              g.members.reduce<Record<string, number>>((a, m) => {
                                a[m.profession] = (a[m.profession] ?? 0) + 1;
                                return a;
                              }, {})
                            ).map(([profession, count]) => `${profession}: ${count}`).join(' • ')}
                          </p>
                          <ul className="text-xs space-y-1 pt-1 border-t">
                            {g.members.map(m => (
                              <li key={m.id} className="text-slate-700">
                                {m.name} — {m.profession}{m.company ? ` — ${m.company}` : ''}{m.president ? ' (Başkan)' : ''}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
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
              <div className="grid gap-2 sm:grid-cols-2">
                {freeVisits.requests.map(req => (
                  <div key={req.id} className="p-3 bg-slate-50 border rounded-lg text-sm flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{req.group_name || 'Seçili Grup'}</p>
                      <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">
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
                  <article key={a.id} className="border rounded-lg p-3 text-sm bg-white">
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

      {/* Ziyaretçi Talep Modalı */}
      {visitorModalGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Ücretsiz Ziyaret</span>
                <h3 className="text-lg font-bold text-slate-900">{visitorModalGroup.name}</h3>
              </div>
              <button
                onClick={() => setVisitorModalGroup(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
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
                className="w-full text-xs p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
