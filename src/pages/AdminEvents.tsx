import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEventStore } from '../stores/eventStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Input } from '../shared/Input';
import { TextArea } from '../shared/TextArea';
import {
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  MapPin,
  Globe,
  Lock,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Pin
} from 'lucide-react';
import { Modal } from '../shared/Modal';
import { api } from '../api/api';
import { readEventPrice, readEventCurrency } from '../utils/eventPrice';
import { readParticipantCount } from '../utils/eventParticipants';

interface EventFormData {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  is_public: boolean;
  max_attendees: number | string;
  event_type: '' | 'NETWORKING' | 'WORKSHOP' | 'SEMINAR' | 'CONFERENCE' | 'SOCIAL';
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  price?: number | string;
  currency?: string;
  has_equal_opportunity_badge?: boolean;
  city?: string;
  is_online?: boolean;
  pinned?: boolean;
  generate_tickets?: boolean;
  online_link?: string;
}

const CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın', 'Tekirdağ', 'Denizli', 'Sakarya', 'Muğla', 'Eskişehir'
];
const EVENT_TYPES: Record<string, 'education' | 'meeting'> = {
  NETWORKING: 'meeting', WORKSHOP: 'education', SEMINAR: 'education', CONFERENCE: 'meeting', SOCIAL: 'meeting',
};

const readCapacity = (value: unknown): number | null => {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count > 0 ? count : null;
};
const readLocalDate = (value: string): Date | null => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!parts) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getFullYear() !== Number(parts[1])
    || date.getMonth() + 1 !== Number(parts[2]) || date.getDate() !== Number(parts[3])
    || date.getHours() !== Number(parts[4]) || date.getMinutes() !== Number(parts[5])
    || date.getSeconds() !== Number(parts[6] ?? 0)) return null;
  return date;
};

export function AdminEvents() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events, createEvent, updateEvent, deleteEvent, fetchEvents, readLoading, readError, loadedFor } = useEventStore();
  const [showForm, setShowForm] = useState(false);
  const [eventWriteError, setEventWriteError] = useState<string | null>(null);
  const [eventWritePending, setEventWritePending] = useState(false);
  const eventWriteBusy = useRef(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const formVersion = useRef(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [viewingEventTitle, setViewingEventTitle] = useState('');
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  const eventWriteContext = `${user?.id}:${user?.role}:${editingEvent?.id}:${showForm}:${formVersion.current}`;
  const latestEventWriteContext = useRef(eventWriteContext);
  latestEventWriteContext.current = eventWriteContext;
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [participantNotice, setParticipantNotice] = useState<string | null>(null);
  const [participantNoticeFor, setParticipantNoticeFor] = useState<string | null>(null);
  const [participantRetry, setParticipantRetry] = useState(0);
  const [participantsLoadedFor, setParticipantsLoadedFor] = useState<string | null>(null);
  const [removePending, setRemovePending] = useState(false);
  const removeBusy = useRef(false);
  const participantContext = `${user?.id}:${user?.role}:${viewingEventId}:${showParticipants}`;
  const currentParticipantContext = useRef(participantContext);
  currentParticipantContext.current = participantContext;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    if (!showParticipants || !viewingEventId || user?.role !== 'ADMIN') return;
    setParticipantLoading(true); setParticipantError(null); setParticipantsLoadedFor(null); setParticipants([]);
    const load = async () => {
      try {
        const rows = await api.getMeetingAttendance(viewingEventId);
        if (!Array.isArray(rows) || rows.some(row => !row || row.event_id !== viewingEventId)) throw new Error('Invalid participants');
        if (!cancelled) { setParticipants(rows); setParticipantsLoadedFor(participantContext); }
      } catch {
        if (!cancelled) setParticipantError('Katılımcı listesi yüklenemedi.');
      } finally { if (!cancelled) setParticipantLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [showParticipants, viewingEventId, user?.id, user?.role, participantContext, participantRetry]);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    is_public: true,
    max_attendees: 50,
    event_type: 'NETWORKING',
    status: 'PUBLISHED',
    price: 0,
    currency: 'TRY',
    has_equal_opportunity_badge: false,
    city: '',
    is_online: false,
    pinned: false,
    generate_tickets: false,
    online_link: ''
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchEvents();
  }, [fetchEvents, user?.id, user?.role]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || event.status === filterStatus;
    const matchesType = filterType === 'ALL' || event.event_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventWriteBusy.current || !alive.current || user?.role !== 'ADMIN' || latestEventWriteContext.current !== eventWriteContext || loadedFor !== `${user?.id}:${user?.role}`) return;
    const price = readEventPrice(formData.price);
    const currency = readEventCurrency(formData.currency);
    if (price === null || currency === null) {
      setEventWriteError('Ücret ve para birimini doğrulayın. Ücretsiz etkinlik için ücret alanına 0 yazın.');
      return;
    }
    const selectedType = Object.prototype.hasOwnProperty.call(EVENT_TYPES, formData.event_type) ? EVENT_TYPES[formData.event_type] : undefined;
    if ((!editingEvent && !selectedType) || (formData.event_type !== '' && !selectedType)) {
      setEventWriteError('Geçerli bir etkinlik türü seçin.');
      return;
    }
    const changeType = !editingEvent || (formData.event_type !== '' && formData.event_type !== editingEvent.event_type);
    const capacity = readCapacity(formData.max_attendees);
    const start = readLocalDate(formData.start_at);
    const end = readLocalDate(formData.end_at);
    if (capacity === null) {
      setEventWriteError('Maksimum katılımcı için pozitif bir tam sayı girin.');
      return;
    }
    if (!start || !end || end.getTime() < start.getTime()) {
      setEventWriteError('Başlangıç ve bitiş tarihlerini doğrulayın. Bitiş başlangıçtan önce olamaz.');
      return;
    }
    const context = eventWriteContext;
    const isCurrent = () => alive.current && latestEventWriteContext.current === context;
    eventWriteBusy.current = true; setEventWritePending(true);
    setEventWriteError(null);

    try {
      const serverPayload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        created_by: user?.id,
        is_public: formData.is_public,
        ...(changeType ? { type: selectedType } : {}),
        ...(!editingEvent ? { group_id: null } : {}),
        member_id: null,
        has_equal_opportunity_badge: formData.has_equal_opportunity_badge,
        city: formData.city,
        is_online: formData.is_online,
        pinned: formData.pinned,
        max_attendees: capacity,
        generate_tickets: formData.generate_tickets,
        status: formData.status,
        price,
        currency,
        online_link: formData.online_link || null
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, serverPayload);
      } else {
        await createEvent(serverPayload as any);
      }

      if (isCurrent()) { resetForm(); fetchEvents(); }
    } catch (error) {
      if (isCurrent()) setEventWriteError('Etkinlik kayıt sonucu doğrulanamadı. Yeniden göndermeden önce kayıtları kontrol edin.');
    } finally {
      eventWriteBusy.current = false; if (alive.current) setEventWritePending(false);
    }
  };

  const resetForm = () => {
    formVersion.current++;
    setFormData({
      title: '',
      description: '',
      start_at: '',
      end_at: '',
      location: '',
      is_public: true,
      max_attendees: 50,
      event_type: 'NETWORKING',
      status: 'PUBLISHED',
      price: 0,
      currency: 'TRY',
      has_equal_opportunity_badge: false,
      city: '',
      is_online: false,
      pinned: false,
      generate_tickets: false,
      online_link: ''
    });
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleEdit = (event: any) => {
    if (eventWriteBusy.current) return;
    formVersion.current++;
    // Helper to format date for datetime-local input (YYYY-MM-DDThh:mm)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        const offset = d.getTimezoneOffset();
        const localTime = new Date(d.getTime() - offset * 60 * 1000);
        return localTime.toISOString().slice(0, 16);
      } catch (e) {
        return '';
      }
    };

    setFormData({
      title: event.title,
      description: event.description,
      start_at: formatDateForInput(event.start_at),
      end_at: formatDateForInput(event.end_at),
      location: event.location,
      is_public: event.is_public,
      max_attendees: readCapacity(event.max_attendees) !== null ? event.max_attendees : '',
      event_type: Object.prototype.hasOwnProperty.call(EVENT_TYPES, event.event_type) ? event.event_type : '',
      status: event.status,
      price: readEventPrice(event.price) !== null ? event.price : '',
      currency: readEventCurrency(event.currency) ?? '',
      has_equal_opportunity_badge: event.has_equal_opportunity_badge || false,
      city: event.city || '',
      is_online: event.is_online || false,
      pinned: event.pinned || false,
      online_link: event.online_link || ''
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (eventWriteBusy.current || !alive.current || user?.role !== 'ADMIN' || latestEventWriteContext.current !== eventWriteContext || loadedFor !== `${user?.id}:${user?.role}`) return;
    if (window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
      const context = eventWriteContext;
      const isCurrent = () => alive.current && latestEventWriteContext.current === context;
      eventWriteBusy.current = true; setEventWritePending(true);
      try {
        setEventWriteError(null);
        await deleteEvent(eventId);
        if (isCurrent()) fetchEvents();
      } catch (error) {
        if (isCurrent()) setEventWriteError('Etkinlik silme sonucu doğrulanamadı. Kayıtları kontrol edin.');
      } finally {
        eventWriteBusy.current = false; if (alive.current) setEventWritePending(false);
      }
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    if (eventWriteBusy.current || !alive.current || user?.role !== 'ADMIN' || latestEventWriteContext.current !== eventWriteContext || loadedFor !== `${user?.id}:${user?.role}`) return;
    const context = eventWriteContext;
    const isCurrent = () => alive.current && latestEventWriteContext.current === context;
    eventWriteBusy.current = true; setEventWritePending(true);
    try {
      setEventWriteError(null);
      await updateEvent(eventId, { status: newStatus });
      if (isCurrent()) fetchEvents();
    } catch (error) {
      if (isCurrent()) setEventWriteError('Etkinlik durumu güncellenemedi. Kayıtları kontrol edin.');
    } finally {
      eventWriteBusy.current = false; if (alive.current) setEventWritePending(false);
    }
  };

  const handleViewParticipants = (event: any) => {
    if (user?.role !== 'ADMIN') return;
    setParticipants([]); setParticipantError(null); setParticipantNotice(null);
    setParticipantLoading(true); setParticipantsLoadedFor(null);
    setViewingEventId(event.id); setViewingEventTitle(event.title); setShowParticipants(true);
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (removeBusy.current || !alive.current || currentParticipantContext.current !== participantContext || user?.role !== 'ADMIN' || !viewingEventId || participantsLoadedFor !== participantContext || !participants.some(p => p.user_id === userId)) return;
    if (!window.confirm('Bu katılımcıyı etkinlikten çıkarmak istediğinize emin misiniz?')) return;
    const context = participantContext;
    const isCurrent = () => alive.current && currentParticipantContext.current === context;
    removeBusy.current = true; setRemovePending(true); setParticipantNotice(null); setParticipantNoticeFor(context);
    try {
      const result = await api.removeEventParticipant(viewingEventId, userId);
      if (!isCurrent()) return;
      if (result?.success !== true) throw new Error('Unconfirmed remove');
      setParticipantNotice('Katılımcı çıkarma işlemi sunucu tarafından onaylandı.');
      setParticipants([]); setParticipantsLoadedFor(null); setParticipantLoading(true);
      try {
        const rows = await api.getMeetingAttendance(viewingEventId);
        if (!Array.isArray(rows) || rows.some(row => !row || row.event_id !== viewingEventId)) throw new Error('Invalid participants');
        if (isCurrent()) { setParticipants(rows); setParticipantsLoadedFor(context); }
      } catch {
        if (isCurrent()) { setParticipantError('Katılımcı listesi yüklenemedi.'); setParticipantNotice('Çıkarma işlemi onaylandı; liste yenilenemedi. Çıkarma işlemini yeniden göndermeyin.'); }
      } finally { if (isCurrent()) setParticipantLoading(false); }
      if (isCurrent()) {
        try { await fetchEvents(); } catch { if (isCurrent()) setParticipantNotice('Çıkarma işlemi onaylandı; etkinlik özeti yenilenemedi.'); }
      }
    } catch {
      if (isCurrent()) setParticipantNotice('Çıkarma sonucu doğrulanamadı. Yeniden göndermeden önce listeyi kontrol edin.');
    } finally { removeBusy.current = false; if (alive.current) setRemovePending(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'Yayında';
      case 'DRAFT': return 'Taslak';
      case 'CANCELLED': return 'İptal Edildi';
      case 'COMPLETED': return 'Tamamlandı';
      default: return status;
    }
  };

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

  if (readError) return <div role="alert" className="p-8"><p>{readError}</p><Button onClick={() => fetchEvents()}>Tekrar dene</Button></div>;
  if (readLoading || loadedFor !== `${user?.id}:${user?.role}`) return <p role="status" className="p-8">Etkinlikler yükleniyor...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {eventWriteError && <p role="alert" className="mb-4">{eventWriteError}</p>}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Etkinlik Yönetimi</h1>
          <div className="flex space-x-3">
            <Button onClick={() => navigate('/admin')} className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Admin Paneli
            </Button>
            <Button onClick={() => setShowForm(true)} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Etkinlik
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Etkinlik Başlığı
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Etkinlik Türü
                    </label>
                    <select
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      required={!editingEvent}
                    >
                      <option value="">{editingEvent ? 'Mevcut türü koru' : 'Etkinlik türü seçin'}</option>
                      <option value="NETWORKING">Network Etkinliği</option>
                      <option value="WORKSHOP">Atölye</option>
                      <option value="SEMINAR">Seminer</option>
                      <option value="CONFERENCE">Konferans</option>
                      <option value="SOCIAL">Sosyal Etkinlik</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <TextArea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlangıç Tarihi
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.start_at}
                      onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bitiş Tarihi
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.end_at}
                      onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şehir
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    >
                      <option value="">Seçiniz</option>
                      {CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konum {formData.is_online && '(Online - Devre Dışı)'}
                    </label>
                    <Input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={formData.is_online}
                      placeholder={formData.is_online ? 'Online Etkinlik' : 'Adres veya mekan adı'}
                      required={!formData.is_online}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_online"
                    checked={formData.is_online || false}
                    onChange={(e) => setFormData({ ...formData, is_online: e.target.checked, location: e.target.checked ? 'Online' : formData.location, online_link: e.target.checked ? formData.online_link : '' })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_online" className="ml-2 block text-sm text-gray-900">
                    Online Etkinlik
                  </label>
                </div>

                {formData.is_online && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Toplantı Katılım Linki (Zoom, Teams, Google Meet vb.)
                    </label>
                    <Input
                      type="url"
                      value={formData.online_link || ''}
                      onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                      required={formData.is_online}
                    />
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={formData.pinned || false}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="pinned" className="ml-2 block text-sm text-gray-900">
                    Başa Tuttur (Tüm listelerde en üstte görünür)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maksimum Katılımcı
                    </label>
                    <Input
                      type="number"
                      value={formData.max_attendees}
                      onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  {/* Empty col for alignment or additional field */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ücret (Ücretsiz için 0)
                    </label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Para Birimi
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      required
                    >
                      <option value="">Para birimi seçin</option>
                      {formData.currency && !['TRY', 'USD', 'EUR'].includes(formData.currency) && <option value={formData.currency}>{formData.currency}</option>}
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statü
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    >
                      <option value="DRAFT">Taslak</option>
                      <option value="PUBLISHED">Yayında</option>
                      <option value="CANCELLED">İptal Edildi</option>
                      <option value="COMPLETED">Tamamlandı</option>
                    </select>
                  </div>
                </div>

                {/* Herkese Açık Ayarı (Gizlendi: Her zaman true) */}
                {/* 
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                    Herkese Açık Etkinlik
                  </label>
                </div>
                */}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="has_fe_badge"
                    checked={formData.has_equal_opportunity_badge || false}
                    onChange={(e) => setFormData({ ...formData, has_equal_opportunity_badge: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="has_fe_badge" className="ml-2 block text-sm text-gray-900">
                    Fırsat Eşitliği (FE: Her meslekten tek kişi)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="generate_tickets"
                      checked={formData.generate_tickets}
                      onChange={(e) => setFormData({ ...formData, generate_tickets: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="generate_tickets" className="text-sm font-medium text-gray-700">
                      Bilet Sistemi Aktif (Eşsiz Numara ve Mail)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t font-primary">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={eventWritePending}>
                    {editingEvent ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtreleme ve Arama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Etkinlik ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ALL">Tüm Statüler</option>
                <option value="DRAFT">Taslak</option>
                <option value="PUBLISHED">Yayında</option>
                <option value="CANCELLED">İptal Edildi</option>
                <option value="COMPLETED">Tamamlandı</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ALL">Tüm Türler</option>
                <option value="NETWORKING">Network</option>
                <option value="WORKSHOP">Atölye</option>
                <option value="SEMINAR">Seminer</option>
                <option value="CONFERENCE">Konferans</option>
                <option value="SOCIAL">Sosyal</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    {event.pinned && <Pin className="h-4 w-4 mr-2 text-red-600 rotate-45" fill="currentColor" />}
                    {event.title}
                  </CardTitle>
                  <Badge className={getStatusColor(event.status)}>
                    {getStatusText(event.status)}
                  </Badge>
                </div>
                {/* 
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  {event.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                  {event.is_public ? 'Herkese Açık' : 'Özel'}
                </div> 
                */}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm line-clamp-3">{event.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.start_at).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {readParticipantCount(event.attendees_count) ?? 'Bilinmiyor'} / {readCapacity(event.max_attendees) ?? 'Bilinmiyor'} katılımcı
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <Badge className="bg-blue-100 text-blue-800">
                      {event.event_type === 'NETWORKING' ? 'Network' :
                        event.event_type === 'WORKSHOP' ? 'Atölye' :
                          event.event_type === 'SEMINAR' ? 'Seminer' :
                            event.event_type === 'CONFERENCE' ? 'Konferans' :
                              event.event_type === 'SOCIAL' ? 'Sosyal' : 'Tür bilinmiyor'}
                    </Badge>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={eventWritePending}
                        onClick={() => handleEdit(event)}
                        className="flex items-center"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={eventWritePending}
                        onClick={() => handleDelete(event.id)}
                        className="flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Sil
                      </Button>
                    </div>
                  </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewParticipants(event)}
                        className="flex items-center flex-1"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Katılımcılar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/event/${event.id}`)}
                        className="flex items-center"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                      </Button>
                      {event.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          disabled={eventWritePending}
                        onClick={() => handleStatusChange(event.id, 'PUBLISHED')}
                          className="flex items-center"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Yayınla
                        </Button>
                      )}
                      {event.status === 'PUBLISHED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={eventWritePending}
                        onClick={() => handleStatusChange(event.id, 'DRAFT')}
                          className="flex items-center"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Modal
            open={showParticipants && user?.role === 'ADMIN'}
            onClose={() => setShowParticipants(false)}
            title={`${viewingEventTitle} - Katılımcı Listesi`}
          >
            <div className="space-y-4">
              {participantNotice && participantNoticeFor === participantContext && <p role="status">{participantNotice}</p>}
              {participantError ? <div role="alert"><p>{participantError}</p><Button onClick={() => { setParticipantError(null); setParticipantLoading(true); setParticipantRetry(count => count + 1); }}>Tekrar dene</Button></div> : participantLoading || participantsLoadedFor !== participantContext ? <p role="status">Katılımcılar yükleniyor...</p> : <>
              <div className="text-sm text-gray-500 mb-4">
                Toplam Kayıt: <span className="font-bold text-gray-900">{participants.length}</span>
              </div>
              <p className="text-xs text-gray-500">Kayıt sayısı gerçek katılım sayısı değildir. Eski PRESENT kayıtları kayıt ile yoklamayı ayırmadığı için doğrulanmış katılım kabul edilmez.</p>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  Henüz katılımcı bulunmamaktadır.
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                  {participants.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-indigo-200">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name || p.user_name || ''} className="w-full h-full object-cover" />
                          ) : (
                            (p.name || p.user_name || p.member_name || '?').charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {p.name || p.user_name || p.member_name || 'İsimsiz Üye'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {p.profession || 'Meslek Belirtilmemiş'}
                            {(p.email || p.phone) && (
                              <span className="block text-[10px] text-gray-400 mt-0.5 font-mono">
                                {p.email} {p.phone ? `• ${p.phone}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={p.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {p.status === 'REGISTERED' ? 'Kayıtlı — yoklama yapılmadı' : p.status === 'PRESENT' ? 'Eski PRESENT kaydı' : p.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={removePending}
                          onClick={() => handleRemoveParticipant(p.user_id)}
                          className="h-7 px-2 text-xs flex items-center gap-1 rounded-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setShowParticipants(false)}>Kapat</Button>
              </div>
            </div>
          </Modal>

        {filteredEvents.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'ALL' || filterType !== 'ALL'
                  ? 'Arama kriterlerinize uygun etkinlik bulunamadı.'
                  : 'Henüz etkinlik bulunmuyor.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
