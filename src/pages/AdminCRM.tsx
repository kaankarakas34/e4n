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
  XCircle, AlertCircle, RefreshCw, ChevronRight, UserCheck,
  Upload, FileText, Check, AlertTriangle, Play
} from 'lucide-react';
import * as XLSX from 'xlsx';

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
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'import'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<PublicVisitor | null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // File Upload states
  const [dragActive, setDragActive] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResults, setImportResults] = useState<{
    total: number;
    valid: any[];
    duplicates: any[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

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
      setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead));
      await api.updatePublicVisitorStatus(leadId, newStatus);
    } catch (e) {
      console.error('Status update error:', e);
      alert('Durum güncellenirken bir hata oluştu.');
      fetchLeads();
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

  // Helper keyword matcher
  const getRowVal = (row: any, keywords: string[]) => {
    const keys = Object.keys(row);
    for (const k of keys) {
      const cleanK = k.toLowerCase().replace(/[\s_?\/\\()\-]/g, '');
      for (const kw of keywords) {
        const cleanKw = kw.toLowerCase().replace(/[\s_?\/\\()\-]/g, '');
        if (cleanK.includes(cleanKw) || cleanKw.includes(cleanK)) {
          return row[k];
        }
      }
    }
    return undefined;
  };

  // Helper cleansers for robust duplicate matching
  const cleanPhone = (phone?: string | number) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
  };

  const cleanEmail = (email?: string) => {
    if (!email) return '';
    return email.trim().toLowerCase();
  };

  // Excel parsing
  const processExcelData = (data: any[]) => {
    const valid: any[] = [];
    const duplicates: any[] = [];

    // Create maps of existing phone numbers and emails for check
    const existingPhones = new Set(leads.map(l => cleanPhone(l.phone)).filter(p => p !== ''));
    const existingEmails = new Set(leads.map(l => cleanEmail(l.email)).filter(e => e !== ''));

    data.forEach((row, index) => {
      // Map columns
      const name = getRowVal(row, ['first_name', 'name', 'ad', 'adsoyad']) || '';
      const email = getRowVal(row, ['email', 'e-mail', 'eposta']) || '';
      const phone = getRowVal(row, ['phone_number', 'phone', 'tel', 'telefon']) || '';
      const profession = getRowVal(row, ['faaliyet_gösterdiğiniz_sektör', 'sektor', 'is_kolu', 'faaliyet_gosterilen']) || '';
      const city = getRowVal(row, ['city', 'sehir', 'il']) || '';
      const created_time = getRowVal(row, ['created_time', 'tarih', 'created_at']) || '';
      const platform = getRowVal(row, ['platform']) || '';
      const own_business = getRowVal(row, ['kendi_işinizin_sahibi_misiniz', 'kendi_isiniz', 'sahibi_misiniz', 'is_sahibi']) || '';

      const cleanedPh = cleanPhone(phone);
      const cleanedEm = cleanEmail(email);

      const parsedLead = {
        name: String(name).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        profession: String(profession).trim(),
        city: String(city).trim(),
        created_time: String(created_time).trim(),
        platform: String(platform).trim(),
        own_business: String(own_business).trim(),
        originalIndex: index + 1
      };

      // Ensure we have at least a name
      if (!parsedLead.name) return;

      const isDuplicate = 
        (cleanedEm && existingEmails.has(cleanedEm)) || 
        (cleanedPh && existingPhones.has(cleanedPh));

      if (isDuplicate) {
        duplicates.push(parsedLead);
      } else {
        // Also prevent duplicates within the uploaded file itself
        const alreadyInValid = valid.some(v => 
          (cleanedEm && cleanEmail(v.email) === cleanedEm) || 
          (cleanedPh && cleanPhone(v.phone) === cleanedPh)
        );
        if (alreadyInValid) {
          duplicates.push(parsedLead);
        } else {
          valid.push(parsedLead);
        }
      }
    });

    setImportResults({
      total: data.length,
      valid,
      duplicates
    });
    setImportPreview(valid.slice(0, 10)); // preview first 10
  };

  const handleFile = (file: File) => {
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        processExcelData(json);
      } catch (err) {
        console.error(err);
        alert('Dosya okunurken bir hata oluştu. Lütfen geçerli bir Excel veya CSV dosyası yükleyin.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleImportExecute = async () => {
    if (!importResults || importResults.valid.length === 0) return;
    setIsImporting(true);
    setImportProgress(0);

    const totalToImport = importResults.valid.length;
    let importedCount = 0;

    for (const leadItem of importResults.valid) {
      try {
        await api.submitPublicVisitorApplication({
          name: leadItem.name,
          email: leadItem.email,
          phone: leadItem.phone,
          profession: leadItem.profession,
          source: 'meta_import',
          kvkk_accepted: true,
          form_data: {
            city: leadItem.city,
            own_business: leadItem.own_business,
            platform: leadItem.platform,
            created_time: leadItem.created_time
          }
        });
      } catch (err) {
        console.error('Import row fail:', leadItem, err);
      }
      importedCount++;
      setImportProgress(Math.round((importedCount / totalToImport) * 100));
    }

    setIsImporting(false);
    alert(`${importedCount} adet başvuru başarıyla CRM'e aktarıldı.`);
    setImportFile(null);
    setImportResults(null);
    setImportPreview([]);
    setViewMode('kanban');
    fetchLeads();
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
      (sourceFilter === 'web' && !lead.source);

    return matchesSearch && matchesSource;
  });

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'education_application':
        return <Badge className="bg-purple-100 text-purple-800">Eğitim</Badge>;
      case 'on_degerlendirme':
        return <Badge className="bg-indigo-100 text-indigo-800">Değerlendirme</Badge>;
      case 'meta_import':
        return <Badge className="bg-emerald-100 text-emerald-800">Meta Excel</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Genel Web</Badge>;
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'education_application': return 'Eğitim Başvurusu';
      case 'on_degerlendirme': return 'Değerlendirme Formu';
      case 'meta_import': return 'Meta CRM Veri Aktarımı';
      default: return 'Web Ziyaretçi Formu';
    }
  };

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
              <button
                onClick={() => setViewMode('import')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${viewMode === 'import' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Upload className="w-3.5 h-3.5" /> Excel Aktarımı
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

        {/* View Mode content routing */}
        {viewMode === 'import' ? (
          /* EXCEL IMPORT TAB */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Meta CRM Excel Aktarımı</h2>
              <p className="text-slate-500 text-sm mb-6">
                Meta üzerinden indirdiğiniz müşteri adayı Excel (.xlsx, .xls) veya CSV dosyasını buraya yükleyin. 
                Sistem, sütunları otomatik eşleştirip telefon ve e-posta kontrolü yaparak mükerrer kayıtları ayıklayacaktır.
              </p>

              {/* Upload Drag Area */}
              {!importFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDropFile}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center transition-all ${
                    dragActive 
                      ? 'border-slate-900 bg-slate-50' 
                      : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    id="excel-file-input"
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileInputChange}
                  />
                  <div className="bg-white p-4 rounded-full shadow-sm border mb-4">
                    <Upload className="w-8 h-8 text-slate-500 animate-bounce" />
                  </div>
                  <p className="text-slate-800 font-bold mb-1">Excel dosyanızı sürükleyin veya seçin</p>
                  <p className="text-slate-400 text-xs mb-4">Desteklenen formatlar: .xlsx, .xls, .csv</p>
                  <label 
                    htmlFor="excel-file-input"
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow hover:bg-slate-850 cursor-pointer transition-all"
                  >
                    Dosya Seçin
                  </label>
                </div>
              ) : (
                /* File Loaded Stats & Actions */
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2.5 rounded-lg border text-slate-650">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{importFile.name}</h4>
                        <p className="text-slate-400 text-xs">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setImportFile(null);
                        setImportResults(null);
                        setImportPreview([]);
                      }} 
                      variant="outline" 
                      size="sm"
                      className="border-slate-200"
                    >
                      Değiştir
                    </Button>
                  </div>

                  {importResults && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50/60 p-4 rounded-2xl border text-center">
                        <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Toplam Kayıt</p>
                        <p className="text-3xl font-black text-slate-800">{importResults.total}</p>
                      </div>
                      <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 text-center">
                        <p className="text-emerald-650 text-xs font-semibold mb-1 uppercase tracking-wider">Aktarılacak Yeni Kayıt</p>
                        <p className="text-3xl font-black text-emerald-600">{importResults.valid.length}</p>
                      </div>
                      <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 text-center">
                        <p className="text-amber-650 text-xs font-semibold mb-1 uppercase tracking-wider">Mükerrer Kayıt (Atlanacak)</p>
                        <p className="text-3xl font-black text-amber-600">{importResults.duplicates.length}</p>
                      </div>
                    </div>
                  )}

                  {/* Processing Status Bar */}
                  {isImporting ? (
                    <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                          Veriler aktarılıyor...
                        </span>
                        <span>%{importProgress}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-slate-900 h-full transition-all duration-300"
                          style={{ width: `${importProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    /* Show Import Button if there are valid records */
                    importResults && importResults.valid.length > 0 && (
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleImportExecute}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Play className="w-4 h-4" /> Aktarımı Başlat
                        </Button>
                      </div>
                    )
                  )}

                  {/* Preview Section */}
                  {importPreview.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Aktarılacak Veriler (Önizleme - İlk 10 Kayıt)
                      </h3>
                      <div className="border rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold">
                            <tr>
                              <th className="px-4 py-3">#</th>
                              <th className="px-4 py-3">Ad Soyad</th>
                              <th className="px-4 py-3">Telefon</th>
                              <th className="px-4 py-3">E-posta</th>
                              <th className="px-4 py-3">Sektör / İş Kolu</th>
                              <th className="px-4 py-3">Şehir</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-150">
                            {importPreview.map((lead, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-medium text-slate-400">{lead.originalIndex}</td>
                                <td className="px-4 py-2.5 font-bold text-slate-800">{lead.name}</td>
                                <td className="px-4 py-2.5 text-slate-600">{lead.phone}</td>
                                <td className="px-4 py-2.5 text-slate-650">{lead.email}</td>
                                <td className="px-4 py-2.5 text-slate-600">{lead.profession}</td>
                                <td className="px-4 py-2.5 text-slate-600">{lead.city}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Duplicate list warning */}
                  {importResults && importResults.duplicates.length > 0 && (
                    <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Mükerrer Tespit Edilen Kayıtlar ({importResults.duplicates.length} adet) - CRM'e eklenmeyecektir
                      </h3>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {importResults.duplicates.map((lead, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-amber-100/60 text-xs flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800">{lead.name}</span>
                              <span className="text-slate-400 mx-2">|</span>
                              <span className="text-slate-500">{lead.email || lead.phone}</span>
                            </div>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">
                              Zaten Kayıtlı
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Filter Controls (Shown in Kanban/List) */}
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
                  <option value="meta_import">Meta Excel Aktarımı</option>
                  <option value="web">Ziyaretçi Talepleri</option>
                </select>
              </div>
            </div>

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
                                <h4 className="font-bold text-slate-900 text-sm group-hover:text-slate-950 truncate max-w-[70%]">
                                  {lead.name}
                                </h4>
                                <div className="flex items-center gap-1">
                                  {getSourceBadge(lead.source)}
                                </div>
                              </div>

                              <p className="text-xs text-slate-500 truncate mb-1">
                                {lead.profession || 'Ünvan Belirtilmemiş'}
                              </p>

                              {lead.form_data?.city && (
                                <p className="text-[11px] text-slate-450 font-bold mb-3 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  Şehir: {lead.form_data.city}
                                </p>
                              )}

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
                              {lead.form_data?.city && <div className="text-xs text-slate-450 mt-0.5">Şehir: {lead.form_data.city}</div>}
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
          </>
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
                    Sisteme Kayıt Tarihi: {new Date(selectedLead.created_at).toLocaleString('tr-TR')}
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
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Sektör / İş Kolu</label>
                      <p className="text-sm font-bold text-slate-900">{selectedLead.profession || '-'}</p>
                    </div>
                    {selectedLead.company && (
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Şirket / Kurum</label>
                        <p className="text-sm font-bold text-slate-900">{selectedLead.company}</p>
                      </div>
                    )}
                    
                    {/* Meta Specific Mapped Fields */}
                    {selectedLead.form_data?.city && (
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Şehir</label>
                        <p className="text-sm font-bold text-slate-900">{selectedLead.form_data.city}</p>
                      </div>
                    )}
                    {selectedLead.form_data?.platform && (
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Platform</label>
                        <p className="text-sm font-bold text-slate-900">{selectedLead.form_data.platform}</p>
                      </div>
                    )}
                    {selectedLead.form_data?.own_business && (
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Kendi İşinin Sahibi Mi?</label>
                        <p className="text-sm font-bold text-slate-900">{selectedLead.form_data.own_business}</p>
                      </div>
                    )}
                    {selectedLead.form_data?.created_time && (
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Meta Başvuru Tarihi</label>
                        <p className="text-sm font-bold text-slate-900">{selectedLead.form_data.created_time}</p>
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
                        // Skip rendering already styled values
                        if (['why_take_training', 'work_status', 'city', 'own_business', 'platform', 'created_time'].includes(key)) return null;
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
