import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  DollarSign,
  TrendingUp,
  UserCheck,
  BarChart2,
  Share2,
  AlertCircle,
  Save,
  ChevronRight
} from 'lucide-react';

export function GroupMeetingDetailPage() {
  const { id: groupId, date: dateParam } = useParams<{ id: string; date?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Attendance local editing state: { [userId: string]: 'PRESENT' | 'ABSENT' | 'LATE' | 'SUBSTITUTE' | 'REGISTERED' }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'ATTENDANCE' | 'REFERRALS' | 'VISITORS'>('ATTENDANCE');

  // Load all initial data
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!groupId) return;
      setLoading(true);
      setError(null);
      try {
        const [gData, gMembers, gMeetings, gReferrals, gVisitors] = await Promise.all([
          api.getGroup(groupId),
          api.getGroupMembers(groupId),
          api.getGroupMeetings(groupId).catch(() => []),
          api.getGroupReferrals(groupId).catch(() => []),
          api.getGroupVisitors(groupId).catch(() => [])
        ]);

        if (cancelled) return;
        setGroup(gData);
        setMembers(Array.isArray(gMembers) ? gMembers : []);
        setMeetings(Array.isArray(gMeetings) ? gMeetings : []);
        setReferrals(Array.isArray(gReferrals) ? gReferrals : []);
        setVisitors(Array.isArray(gVisitors) ? gVisitors : []);

        // Determine all possible meeting dates
        const allDates = new Set<string>();
        if (Array.isArray(gData?.meeting_dates)) {
          gData.meeting_dates.forEach((d: string) => {
            if (typeof d === 'string' && d.trim()) allDates.add(d.split('T')[0]);
          });
        }
        if (Array.isArray(gMeetings)) {
          gMeetings.forEach((m: any) => {
            const raw = m.date || m.start_at;
            if (raw) allDates.add(String(raw).split('T')[0]);
          });
        }

        // Diamond default meeting dates if group is Diamond and dates are missing
        if ((gData?.name?.toLowerCase().includes('diamond') || groupId === '97ebe739-9246-4ffb-b270-54577d092fab')) {
          ['2026-10-30', '2026-11-12', '2026-11-26', '2026-12-10', '2026-12-24'].forEach(d => allDates.add(d));
        }

        // Target date from param or search param or default
        const queryDate = (dateParam || searchParams.get('date') || '').split('T')[0];
        if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
          allDates.add(queryDate);
        }
        const sortedDates = Array.from(allDates).sort();

        if (queryDate && sortedDates.includes(queryDate)) {
          setSelectedDate(queryDate);
        } else if (sortedDates.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          // Find next upcoming date or last past date
          const nextUpcoming = sortedDates.find(d => d >= todayStr);
          setSelectedDate(nextUpcoming || sortedDates[sortedDates.length - 1]);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Toplantı bilgileri yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [groupId, dateParam, searchParams]);

  // Load attendance whenever selectedDate changes
  useEffect(() => {
    let cancelled = false;
    const loadMeetingAttendance = async () => {
      if (!selectedDate || !groupId) return;
      setAttendanceLoading(true);
      setSaveSuccessNotice(null);

      // Find matching meeting event
      const matchingEvent = meetings.find(m => {
        const mDate = (m.date || m.start_at || '').split('T')[0];
        return mDate === selectedDate;
      });

      if (matchingEvent?.id) {
        try {
          const attRows = await api.getMeetingAttendance(matchingEvent.id).catch(() => []);
          if (!cancelled && Array.isArray(attRows) && attRows.length > 0) {
            const map: Record<string, string> = {};
            attRows.forEach((r: any) => {
              if (r.user_id) map[r.user_id] = r.status || 'REGISTERED';
            });
            setAttendanceMap(map);
            setAttendanceLoading(false);
            return;
          }
        } catch {
          // fallback to active members
        }
      }

      // Default attendance map from active members
      if (!cancelled) {
        const defaultMap: Record<string, string> = {};
        members.forEach((m: any) => {
          defaultMap[m.id] = 'REGISTERED';
        });
        setAttendanceMap(defaultMap);
        setAttendanceLoading(false);
      }
    };

    loadMeetingAttendance();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, meetings, members, groupId]);

  // Handle Save Attendance
  const handleSaveAttendance = async () => {
    if (!groupId || !selectedDate) return;
    setIsSavingAttendance(true);
    setSaveSuccessNotice(null);

    try {
      const items = Object.entries(attendanceMap).map(([userId, status]) => ({
        user_id: userId,
        status: status || 'REGISTERED'
      }));

      // Find if event title is custom (e.g. Yıl Sonu)
      let topic = 'Grup Toplantısı';
      if (selectedDate === '2026-12-24') {
        topic = `${group?.name || 'Grup'} Yıl Sonu Toplantısı`;
      } else {
        topic = `${group?.name || 'Grup'} Toplantısı`;
      }

      await api.submitAttendance({
        group_id: groupId,
        meeting_date: `${selectedDate}T${group?.meeting_time || '19:30:00'}`,
        topic,
        items
      });

      // Refresh meetings list to capture the newly created / updated event
      const updatedMeetings = await api.getGroupMeetings(groupId).catch(() => meetings);
      setMeetings(updatedMeetings);
      setSaveSuccessNotice('Yoklama başarıyla kaydedildi ve puanlar güncellendi.');
    } catch (err: any) {
      alert('Yoklama kaydedilirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsSavingAttendance(false);
    }
  };

  if (!user) return <div className="p-8">Giriş Yapılmalı</div>;

  const isAdmin = user.role === 'ADMIN';
  const isPresident = members.some(m => m.id === user.id && (m.role === 'PRESIDENT' || m.group_title === 'PRESIDENT'));
  const canEditAttendance = isAdmin || isPresident;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Toplantı detayları ve analitik veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-red-200 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Toplantı Verileri Alınamadı</h2>
          <p className="text-slate-600 mb-6">{error || 'Grup bulunamadı.'}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  // Compile all dates
  const allMeetingDates = Array.from(
    new Set([
      ...(Array.isArray(group.meeting_dates) ? group.meeting_dates.map((d: string) => d.split('T')[0]) : []),
      ...meetings.map((m: any) => (m.date || m.start_at || '').split('T')[0]),
      ...(group.name?.toLowerCase().includes('diamond') || groupId === '97ebe739-9246-4ffb-b270-54577d092fab'
        ? ['2026-10-30', '2026-11-12', '2026-11-26', '2026-12-10', '2026-12-24']
        : [])
    ])
  )
    .filter(Boolean)
    .sort();

  const todayStr = new Date().toISOString().split('T')[0];
  const isPastMeeting = selectedDate < todayStr;
  const isTodayMeeting = selectedDate === todayStr;

  // Find matching event
  const currentMeetingEvent = meetings.find(m => {
    const d = (m.date || m.start_at || '').split('T')[0];
    return d === selectedDate;
  });

  // Calculate meeting specific analytics
  const activeMembersList = members.filter(m => m.status === 'ACTIVE');
  const totalMembersCount = activeMembersList.length || 1;

  // Attendance stats
  let presentCount = 0;
  let absentCount = 0;
  let excusedCount = 0;

  activeMembersList.forEach(m => {
    const st = attendanceMap[m.id];
    if (st === 'PRESENT') presentCount++;
    else if (st === 'ABSENT') absentCount++;
    else if (st === 'LATE' || st === 'SUBSTITUTE' || st === 'EXCUSED') excusedCount++;
  });

  const attendanceRatio = Math.round((presentCount / totalMembersCount) * 100);

  // Filter referrals for selected meeting date / window (within 7 days of meeting)
  const meetingReferrals = referrals.filter(r => {
    if (!r.created_at) return false;
    const rDate = r.created_at.split('T')[0];
    // Check if within 6 days before or after meeting
    const diffDays = Math.abs(
      (new Date(rDate).getTime() - new Date(selectedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7;
  });

  const totalReferralAmount = meetingReferrals.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Filter visitors for selected meeting date / window
  const meetingVisitors = visitors.filter(v => {
    const vDate = (v.visited_at || v.created_at || '').split('T')[0];
    if (!vDate) return false;
    const diffDays = Math.abs(
      (new Date(vDate).getTime() - new Date(selectedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7;
  });

  const backUrl = isAdmin ? `/admin/groups/${groupId}` : `/groups/${groupId}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={backUrl}
              className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {group.name} Paneline Dön
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Toplantı Detayları &amp; Analitik
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPastMeeting
                  ? 'bg-emerald-100 text-emerald-800'
                  : isTodayMeeting
                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {isPastMeeting ? 'Tamamlandı' : isTodayMeeting ? 'Bugün Gerçekleşiyor' : 'Gelecek Toplantı'}
            </span>
            {canEditAttendance && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                {isAdmin ? 'Yönetici Yetkisi' : 'Başkan Yetkisi'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Meeting Date Selector Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Toplantı Tarihi Seçimi ({allMeetingDates.length} Toplantı)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Geçmiş ve planlanan tüm toplantı günlerini seçerek yoklama, yönlendirme ve ziyaretçi detaylarını inceleyebilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {allMeetingDates.map(d => {
              const isSelected = d === selectedDate;
              const isPast = d < todayStr;
              const isToday = d === todayStr;
              const dateObj = new Date(d);

              return (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDate(d);
                    setSearchParams({ date: d });
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200 scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span>
                    {dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase font-bold ${
                      isSelected
                        ? 'bg-indigo-700 text-white'
                        : isPast
                        ? 'bg-slate-200 text-slate-600'
                        : isToday
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {isToday ? 'Bugün' : isPast ? 'Geçmiş' : 'Planlanan'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Meeting Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-indigo-300 font-semibold text-xs mb-3 border border-white/10">
                {group.name} · Haftalık / İki Haftalık Toplantı
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                {selectedDate === '2026-12-24'
                  ? `${group.name} Yıl Sonu Toplantısı`
                  : currentMeetingEvent?.title || `${group.name} Toplantısı`}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  {new Date(selectedDate).toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  {group.meeting_time ? `${group.meeting_time}` : '19:30:00'}
                </span>
                {group.meeting_link && (
                  <a
                    href={
                      group.meeting_link.startsWith('http')
                        ? group.meeting_link
                        : `https://${group.meeting_link}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-300 hover:text-white underline font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Toplantı Bağlantısı (Zoom / Çevrimiçi)
                  </a>
                )}
              </div>
            </div>

            {canEditAttendance && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-6 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSavingAttendance ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
                </Button>
              </div>
            )}
          </div>

          {saveSuccessNotice && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}
        </div>

        {/* 4 Analytics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Katılım Oranı */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Katılım Oranı
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">%{attendanceRatio}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({presentCount} / {totalMembersCount} Üye)
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, attendanceRatio)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Yönlendirme Sayısı */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Yönlendirme Sayısı
                  </p>
                  <span className="text-3xl font-black text-slate-900">
                    {meetingReferrals.length}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">Bu toplantı döngüsü</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Share2 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Üretilen Ciro */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Üretilen Ciro
                  </p>
                  <span className="text-2xl font-black text-slate-900">
                    {totalReferralAmount > 0
                      ? totalReferralAmount.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          maximumFractionDigits: 0
                        })
                      : '0 ₺'}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">İş hacmi katkısı</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ziyaretçi Sayısı */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ziyaretçi Sayısı
                  </p>
                  <span className="text-3xl font-black text-slate-900">
                    {meetingVisitors.length}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">Toplantıya davet edilen</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sub-Tabs: Yoklama, Yönlendirmeler, Ziyaretçiler */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 pt-4 flex gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('ATTENDANCE')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'ATTENDANCE'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Yoklama Kaydı ({activeMembersList.length} Üye)
            </button>

            <button
              onClick={() => setActiveSubTab('REFERRALS')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'REFERRALS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Yönlendirmeler ({meetingReferrals.length})
            </button>

            <button
              onClick={() => setActiveSubTab('VISITORS')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'VISITORS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Ziyaretçiler ({meetingVisitors.length})
            </button>
          </div>

          <div className="p-6">
            {/* SUB-TAB 1: ATTENDANCE */}
            {activeSubTab === 'ATTENDANCE' && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Üye Katılım ve Yoklama Listesi</h3>
                    <p className="text-xs text-slate-500">
                      {canEditAttendance
                        ? 'Her üye için katılım durumunu belirleyip üstteki "Yoklamayı Kaydet" butonuyla onaylayabilirsiniz.'
                        : 'Bu toplantıya ait katılım durumları listelenmektedir.'}
                    </p>
                  </div>

                  {canEditAttendance && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const allPresent: Record<string, string> = {};
                          activeMembersList.forEach(m => {
                            allPresent[m.id] = 'PRESENT';
                          });
                          setAttendanceMap(allPresent);
                        }}
                        className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      >
                        Tümünü Katıldı İşaretle
                      </Button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Üye
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Meslek / Şirket
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Grup Rolü
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Yoklama Durumu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {activeMembersList.map(member => {
                        const status = attendanceMap[member.id] || 'REGISTERED';

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                                  {member.full_name
                                    ? member.full_name.slice(0, 2).toUpperCase()
                                    : member.name
                                    ? member.name.slice(0, 2).toUpperCase()
                                    : 'ÜY'}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-slate-900">
                                    {member.full_name || member.name}
                                  </div>
                                  <div className="text-xs text-slate-500">{member.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-800">
                                {member.profession || 'Meslek Belirtilmemiş'}
                              </div>
                              {member.company && (
                                <div className="text-xs text-slate-500">{member.company}</div>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                {member.group_title || member.role || 'Üye'}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {canEditAttendance ? (
                                <select
                                  value={status}
                                  onChange={e =>
                                    setAttendanceMap({
                                      ...attendanceMap,
                                      [member.id]: e.target.value
                                    })
                                  }
                                  className={`text-xs font-bold rounded-lg px-3 py-1.5 border transition-all cursor-pointer ${
                                    status === 'PRESENT'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : status === 'ABSENT'
                                      ? 'bg-red-50 text-red-700 border-red-300'
                                      : status === 'EXCUSED' || status === 'SUBSTITUTE'
                                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  <option value="PRESENT">Katıldı (PRESENT)</option>
                                  <option value="ABSENT">Katılmadı (ABSENT)</option>
                                  <option value="EXCUSED">İzinli (EXCUSED)</option>
                                  <option value="SUBSTITUTE">Vekil Gönderdi (SUBSTITUTE)</option>
                                  <option value="REGISTERED">Belirlenmedi</option>
                                </select>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                    status === 'PRESENT'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : status === 'ABSENT'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {status === 'PRESENT'
                                    ? 'Katıldı'
                                    : status === 'ABSENT'
                                    ? 'Katılmadı'
                                    : 'Kayıt Yok'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: REFERRALS */}
            {activeSubTab === 'REFERRALS' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Bu Toplantı Döneminde Verilen Yönlendirmeler
                    </h3>
                    <p className="text-xs text-slate-500">
                      Toplantı tarihi etrafında üyeler arasında paylaşılan iş yönlendirmeleri.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Dönem Cirosu</span>
                    <span className="text-base font-black text-slate-900">
                      {totalReferralAmount.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>

                {meetingReferrals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Gönderen
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Alan Üye
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Konu / Açıklama
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Tutar
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Durum
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {meetingReferrals.map((r: any) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {r.sender_name || 'Bilinmiyor'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {r.recipient_name || 'Bilinmiyor'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                              {r.title || r.notes || 'Açıklama belirtilmedi'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                              {r.amount
                                ? Number(r.amount).toLocaleString('tr-TR', {
                                    style: 'currency',
                                    currency: 'TRY',
                                    maximumFractionDigits: 0
                                  })
                                : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                  r.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {r.status === 'COMPLETED' ? 'Tamamlandı' : 'Beklemede'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Share2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 text-sm">Yönlendirme Kaydı Bulunamadı</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Bu toplantı gününde veya haftasında henüz kaydedilmiş bir yönlendirme bulunmuyor.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: VISITORS */}
            {activeSubTab === 'VISITORS' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Bu Toplantıya Katılan Ziyaretçiler
                    </h3>
                    <p className="text-xs text-slate-500">
                      Toplantıya davet edilen ve katılım sağlayan misafir iş insanları.
                    </p>
                  </div>

                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/admin/visitors?group=${groupId}`)}
                      className="text-xs font-semibold"
                    >
                      Ziyaretçi Yönetimi
                    </Button>
                  )}
                </div>

                {meetingVisitors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Ziyaretçi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Şirket / Meslek
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Davet Eden Üye
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            İletişim
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Durum
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {meetingVisitors.map((v: any) => (
                          <tr key={v.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                              {v.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              <div>{v.profession || 'Meslek Belirtilmemiş'}</div>
                              {v.company && <div className="text-xs text-slate-400">{v.company}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {v.inviter_name ||
                                members.find(m => m.id === v.inviter_id)?.full_name ||
                                'Doğrudan Başvuru'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                              <div>{v.phone || '-'}</div>
                              <div>{v.email || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                  v.status === 'ATTENDED' || v.status === 'CONVERTED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {v.status === 'ATTENDED'
                                  ? 'Katıldı'
                                  : v.status === 'CONVERTED'
                                  ? 'Üye Oldu'
                                  : 'Davetli'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 text-sm">Ziyaretçi Kaydı Bulunmuyor</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Bu toplantı gününde kayıtlı ziyaretçi bulunmuyor.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
