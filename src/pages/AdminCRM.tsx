import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { 
  Shield, Kanban, List, Search, Filter, Calendar, Mail, 
  Phone, Briefcase, Eye, Trash2, CheckCircle, Clock, 
  XCircle, AlertCircle, RefreshCw, ChevronRight, UserCheck
} from 'lucide-react';

interface PublicVisitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  profession: string;
  created_at: string;
  status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
  inviter_name?: string;
  title?: string;
  web_linkedin?: string;
  activity_area?: string;
  duration?: string;
  target_customer?: string;
  why_join?: string;
  value_add?: string;
  previous_groups?: string;
  form_data?: any;
  source?: string;
}

interface Column {
  id: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
}

const COLUMNS: Column[] = [
  {
    id: 'PENDING',
    title: 'Yeni Başvuru',
    color: 'text-amber-600 bg-amber-50',
    bgColor: 'bg-amber-50/50',
    borderColor: 'border-amber-200',
    icon: Clock
  },
  {
    id: 'CONTACTED',
    title: 'İletişime Geçildi',
    color: 'text-blue-600 bg-blue-50',
    bgColor: 'bg-blue-50/50',
    borderColor: 'border-blue-200',
    icon: Phone
  },
  {
    id: 'CONVERTED',
    title: 'Üye Oldu (Kazanıldı)',
    color: 'text-green-600 bg-green-50',
    bgColor: 'bg-green-50/50',
    borderColor: 'border-green-200',
    icon: CheckCircle
  },
  {
    id: 'REJECTED',
    title: 'Reddedildi (Kaybedildi)',
    color: 'text-rose-600 bg-rose-50',
    bgColor: 'bg-rose-50/50',
    borderColor: 'border-rose-200',
    icon: XCircle
  }
];

export function AdminCRM() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<PublicVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<PublicVisitor | null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getPublicVisitors();
      setLeads(data || []);
    } catch (e) {
      console.error('Leads fetching error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED') => {
    setIsUpdating(leadId);
    try {
      // Optimiztic UI update
      setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead));
      await api.updatePublicVisitorStatus(leadId, newStatus);
    } catch (e) {
      console.error('Status update error:', e);
      alert('Durum güncellenirken bir hata oluştu.');
      fetchLeads(); // rollback
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Bu başvuruyu kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    try {
      await api.deletePublicVisitor(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch (e) {
      console.error('Delete error:', e);
      alert('Başvuru silinirken bir hata oluştu.');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedOverCol !== colId) {
      setDraggedOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED') => {
    e.preventDefault();
    setDraggedOverCol(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status !== targetStatus) {
        handleStatusChange(leadId, targetStatus);
      }
    }
  };

  // Filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.profession && lead.profession.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSource = 
      sourceFilter === 'all' || 
      lead.source === sourceFilter ||
      (sourceFilter === 'web' && !lead.source); // Fallback for empty sources

    return matchesSearch && matchesSource;
  });

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'education_application':
        return <Badge className="bg-purple-100 text-purple-800">Eğitim</Badge>;
      case 'on_degerlendirme':
        return <Badge className="bg-indigo-100 text-indigo-800">Değerlendirme</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Genel Web</Badge>;
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'education_application': return 'Eğitim Başvurusu';
      case 'on_degerlendirme': return 'Değerlendirme Formu';
      default: return 'Web Ziyaretçi Formu';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800">Yeni</Badge>;
      case 'CONTACTED':
        return <Badge className="bg-blue-100 text-blue-800">İletişimde</Badge>;
      case 'CONVERTED':
        return <Badge className="bg-green-100 text-green-800">Üye Oldu</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-100 text-rose-800">Reddedildi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Extract unique sources for filter dropdown
  const sources = Array.from(new Set(leads.map(l => l.source || 'web')));

  // Render role restriction banner if not admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-2xl border shadow-sm">
          <Shield className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erişim Kısıtlı</h2>
          <p className="text-gray-500 mb-6">Bu sayfayı yalnızca yöneticiler görüntüleyebilir.</p>
          <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full">
            Panele Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              CRM Yönetimi
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Potansiyel adayları ve eğitim başvurularını Kanban board üzerinde sürükleyip bırakarak yönetin.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle Buttons */}
            <div className="bg-white border rounded-xl p-1 flex shadow-sm">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Kanban className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <List className="w-3.5 h-3.5" /> Liste
              </button>
            </div>

            <Button onClick={fetchLeads} variant="outline" size="sm" className="h-10 border-slate-200">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button onClick={() => navigate('/admin')} variant="outline" size="sm" className="h-10 border-slate-200">
              Admin Paneli
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İsim, e-posta veya meslek ara..."
              className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter className="w-4 h-4" />
              <span>Kaynak Filtresi:</span>
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950"
            >
              <option value="all">Tüm Kaynaklar</option>
              <option value="education_application">Eğitim Başvuruları</option>
              <option value="on_degerlendirme">Değerlendirme Başvuruları</option>
              <option value="web">Ziyaretçi Talepleri</option>
            </select>
          </div>
        </div>

        {/* Board or Table content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <RefreshCw className="w-10 h-10 animate-spin text-slate-400 mb-4" />
            <p className="text-slate-500 font-medium">Veriler yükleniyor...</p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* KANBAN BOARD VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {COLUMNS.map((col) => {
              const colLeads = filteredLeads.filter(l => l.status === col.id);
              const isOver = draggedOverCol === col.id;

              return (
                <div 
                  key={col.id} 
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col max-h-[80vh] rounded-2xl border transition-all duration-200 ${col.bgColor} ${isOver ? 'border-slate-950 ring-4 ring-slate-950/5 scale-[1.01]' : col.borderColor}`}
                >
                  {/* Column Header */}
                  <div className="p-4 border-b flex items-center justify-between font-bold text-sm bg-white rounded-t-2xl">
                    <div className="flex items-center gap-2 text-slate-800">
                      <col.icon className="w-4 h-4 text-slate-500" />
                      <span>{col.title}</span>
                    </div>
                    <span className="text-slate-450 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Column Body / Cards List */}
                  <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[400px]">
                    {colLeads.length === 0 ? (
                      <div className="h-44 border-2 border-dashed border-slate-200/80 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-4">
                        Adayları sürükleyip buraya bırakabilirsiniz
                      </div>
                    ) : (
                      colLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className={`bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${isUpdating === lead.id ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-slate-950 truncate max-w-[80%]">
                              {lead.name}
                            </h4>
                            <div className="flex items-center gap-1">
                              {getSourceBadge(lead.source)}
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 truncate mb-3">
                            {lead.profession || 'Ünvan Belirtilmemiş'}
                          </p>

                          <div className="space-y-1.5 text-xs text-slate-600 mb-4 border-t pt-3">
                            {lead.phone && (
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                              </p>
                            )}
                            {lead.email && (
                              <p className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t pt-3 mt-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(lead.created_at).toLocaleDateString('tr-TR')}
                            </span>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setSelectedLead(lead)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                                title="Detayları Gör"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1 hover:bg-red-50 rounded text-red-655"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST / TABLE VIEW */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-slate-50 text-slate-550 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Ad Soyad / İletişim</th>
                    <th className="px-6 py-4">Kaynak</th>
                    <th className="px-6 py-4">Çalışma Durumu / Sektör</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        Arama kriterlerine uygun aday bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{lead.name}</div>
                          <div className="flex flex-col sm:flex-row gap-x-3 text-xs text-slate-500 mt-1">
                            {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>}
                            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSourceBadge(lead.source)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-700">{lead.profession || '-'}</div>
                          {lead.company && <div className="text-xs text-slate-500 mt-0.5">{lead.company}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                            disabled={isUpdating === lead.id}
                            className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-slate-950/10 cursor-pointer"
                          >
                            <option value="PENDING">Yeni Başvuru</option>
                            <option value="CONTACTED">İletişimde</option>
                            <option value="CONVERTED">Üye Oldu</option>
                            <option value="REJECTED">Reddedildi</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(lead.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              onClick={() => setSelectedLead(lead)} 
                              variant="outline" 
                              size="sm" 
                              className="h-8 border-slate-200 text-xs px-2.5"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> İncele
                            </Button>
                            <Button 
                              onClick={() => handleDeleteLead(lead.id)} 
                              variant="outline" 
                              size="sm" 
                              className="h-8 border-red-100 hover:bg-red-50 text-red-655 text-xs px-2.5"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Sil
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lead Detail Modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
            <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-slate-100">
              <div className="flex justify-between items-start border-b pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">CRM Başvuru Detayı</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Başvuru Tarihi: {new Date(selectedLead.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)} 
                  className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Status Options */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-slate-700">Başvuru Durumu:</div>
                  <div className="flex gap-2 flex-wrap">
                    {(['PENDING', 'CONTACTED', 'CONVERTED', 'REJECTED'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedLead.id, status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedLead.status === status
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-650 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {status === 'PENDING' && 'Yeni Başvuru'}
                        {status === 'CONTACTED' && 'İletişimde'}
                        {status === 'CONVERTED' && 'Üye Yap'}
                        {status === 'REJECTED' && 'Reddet'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personal Info */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Aday Bilgileri</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Ad Soyad</label>
                      <p className="text-sm font-bold text-slate-900">{selectedLead.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Kaynak</label>
                      <p className="text-sm font-bold text-slate-900">{getSourceLabel(selectedLead.source)}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Telefon</label>
                      <p className="text-sm font-bold text-slate-900">{selectedLead.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">E-posta</label>
                      <p className="text-sm font-bold text-slate-900">{selectedLead.email || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Çalışma Durumu / Ünvan</label>
                      <p className="text-sm font-bold text-slate-900">{selectedLead.profession || '-'}</p>
                    </div>
                    {selectedLead.company && (
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Şirket / Kurum</label>
                        <p className="text-sm font-bold text-slate-900">{selectedLead.company}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Additional details */}
                {selectedLead.why_join && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Niyet ve Katılma Sebebi</h3>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedLead.why_join}
                    </div>
                  </section>
                )}

                {/* Extra custom Form Data fields */}
                {selectedLead.form_data && Object.keys(selectedLead.form_data).length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Ek Form Bilgileri</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(selectedLead.form_data).map(([key, val]) => {
                        // Skip rendering things we already showed above
                        if (key === 'why_take_training' || key === 'work_status') return null;
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        
                        return (
                          <div key={key}>
                            <label className="block text-xs text-slate-450 font-semibold mb-1">{label}</label>
                            <p className="text-sm font-medium text-slate-800">
                              {Array.isArray(val) ? val.join(', ') : String(val || '-')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>Kapat</Button>
                {selectedLead.status === 'CONVERTED' && (
                  <Button 
                    onClick={() => {
                      setSelectedLead(null);
                      navigate('/admin/members/new', { state: { lead: selectedLead } });
                    }} 
                    variant="primary" 
                    className="flex items-center gap-1"
                  >
                    <UserCheck className="w-4 h-4" /> Üye Olarak Kaydet
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
