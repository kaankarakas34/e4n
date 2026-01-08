import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';

interface EventFormData {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  is_public: boolean;
  max_attendees: number;
  event_type: 'NETWORKING' | 'WORKSHOP' | 'SEMINAR' | 'CONFERENCE' | 'SOCIAL';
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  chapter_id?: string;
  price?: number;
  currency?: string;
  has_equal_opportunity_badge?: boolean;
}

export function AdminEvents() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events, createEvent, updateEvent, deleteEvent, fetchEvents } = useEventStore();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    is_public: true,
    max_attendees: 50,
    event_type: 'NETWORKING',
    status: 'DRAFT',
    chapter_id: '',
    price: 0,
    currency: 'TRY',
    has_equal_opportunity_badge: false
  });

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || event.status === filterStatus;
    const matchesType = filterType === 'ALL' || event.event_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const typeMap: Record<string, 'education' | 'meeting' | 'one_to_one' | 'visitor'> = {
        NETWORKING: 'meeting',
        WORKSHOP: 'education',
        SEMINAR: 'education',
        CONFERENCE: 'meeting',
        SOCIAL: 'meeting',
      };

      const serverPayload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_at: formData.start_at,
        end_at: formData.end_at,
        created_by: user?.id,
        is_public: formData.is_public,
        type: typeMap[formData.event_type] || 'meeting',
        group_id: formData.chapter_id || null,
        member_id: null,
        has_equal_opportunity_badge: formData.has_equal_opportunity_badge,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, serverPayload);
      } else {
        await createEvent(serverPayload as any);
      }

      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Etkinlik kaydedilirken hata:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_at: '',
      end_at: '',
      location: '',
      is_public: true,
      max_attendees: 50,
      event_type: 'NETWORKING',
      status: 'DRAFT',
      chapter_id: '',
      price: 0,
      currency: 'TRY',
      has_equal_opportunity_badge: false
    });
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleEdit = (event: any) => {
    setFormData({
      title: event.title,
      description: event.description,
      start_at: event.start_at,
      end_at: event.end_at,
      location: event.location,
      is_public: event.is_public,
      max_attendees: event.max_attendees,
      event_type: event.event_type,
      status: event.status,
      chapter_id: event.chapter_id || '',
      price: event.price || 0,
      currency: event.currency || 'TRY',
      has_equal_opportunity_badge: event.has_equal_opportunity_badge || false
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
      try {
        await deleteEvent(eventId);
        fetchEvents();
      } catch (error) {
        console.error('Etkinlik silinirken hata:', error);
      }
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await updateEvent(eventId, { status: newStatus });
      fetchEvents();
    } catch (error) {
      console.error('Statü güncellenirken hata:', error);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    >
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
                      Konum
                    </label>
                    <Input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maksimum Katılımcı
                    </label>
                    <Input
                      type="number"
                      value={formData.max_attendees}
                      onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ücret (İsteğe Bağlı)
                    </label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
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
                    >
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
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    İptal
                  </Button>
                  <Button type="submit">
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
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Badge className={getStatusColor(event.status)}>
                    {getStatusText(event.status)}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  {event.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                  {event.is_public ? 'Herkese Açık' : 'Özel'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm line-clamp-3">{event.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.start_at).toLocaleString('tr-TR')}
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(event.end_at).toLocaleString('tr-TR')}
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {event.attendees?.length || 0} / {event.max_attendees} katılımcı
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <Badge className="bg-blue-100 text-blue-800">
                      {event.event_type === 'NETWORKING' ? 'Network' :
                        event.event_type === 'WORKSHOP' ? 'Atölye' :
                          event.event_type === 'SEMINAR' ? 'Seminer' :
                            event.event_type === 'CONFERENCE' ? 'Konferans' :
                              'Sosyal'}
                    </Badge>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(event)}
                        className="flex items-center"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
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
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="flex items-center flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Görüntüle
                    </Button>
                    {event.status === 'DRAFT' && (
                      <Button
                        size="sm"
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
                        onClick={() => handleStatusChange(event.id, 'DRAFT')}
                        className="flex items-center"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Taslak Yap
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
