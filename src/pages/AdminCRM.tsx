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
  Upload, FileText, Check, AlertTriangle, Play, X, Ban, Armchair,
  Plus, Edit2, GraduationCap, Users
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
  status: string; // Dynamic statuses
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
  id: string;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
}

const DEFAULT_COLUMNS: Column[] = [
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
  }
];

const COLOR_SCHEMES = [
  { name: 'Mavi', color: 'text-blue-600 bg-blue-50', bgColor: 'bg-blue-50/50', borderColor: 'border-blue-200' },
  { name: 'Yeşil', color: 'text-green-600 bg-green-50', bgColor: 'bg-green-50/50', borderColor: 'border-green-200' },
  { name: 'Sarı/Turuncu', color: 'text-amber-600 bg-amber-50', bgColor: 'bg-amber-50/50', borderColor: 'border-amber-250' },
  { name: 'Mor', color: 'text-purple-600 bg-purple-50', bgColor: 'bg-purple-50/50', borderColor: 'border-purple-205' },
  { name: 'Pembe', color: 'text-pink-600 bg-pink-50', bgColor: 'bg-pink-50/50', borderColor: 'border-pink-200' },
  { name: 'İndigo', color: 'text-indigo-600 bg-indigo-50', bgColor: 'bg-indigo-50/50', borderColor: 'border-indigo-200' },
  { name: 'Gül Rengi', color: 'text-rose-600 bg-rose-50', bgColor: 'bg-rose-50/50', borderColor: 'border-rose-200' },
];

export function AdminCRM() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<PublicVisitor[]>([]);
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(true);
  
  // CRM Navigation Tabs
  const [crmTab, setCrmTab] = useState<'active' | 'education' | 'evaluation' | 'meta' | 'import' | 'rejected' | 'full_seat'>('active');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<PublicVisitor | null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Rejected Tab Sub-Filter ('all_rejected' | 'permanent' | 'not_qualified')
  const [rejectedSubFilter, setRejectedSubFilter] = useState<'all_rejected' | 'permanent' | 'not_qualified'>('all_rejected');

  // Rejection Dialog states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetLead, setRejectTargetLead] = useState<PublicVisitor | null>(null);
  const [rejectionType, setRejectionType] = useState<'permanent' | 'not_qualified' | 'full_seat'>('permanent');
  const [rejectionReason, setRejectionReason] = useState('');

  // Column Add/Edit Modal states
  const [colModalOpen, setColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<Column | null>(null);
  const [colTitle, setColTitle] = useState('');
  const [selectedColorScheme, setSelectedColorScheme] = useState(0);

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

  // File import source types
  const [importSourceType, setImportSourceType] = useState<'meta_import' | 'education_application' | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [importSourceModalOpen, setImportSourceModalOpen] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [leadsData, settingsData] = await Promise.all([
        api.getPublicVisitors(),
        api.getSystemSettings()
      ]);
      
      setLeads(leadsData || []);

      if (settingsData && settingsData.crm_columns) {
        try {
          const parsed = JSON.parse(settingsData.crm_columns);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mapped = parsed.map((col: any) => ({
              ...col,
              icon: col.id === 'PENDING' ? Clock : col.id === 'CONTACTED' ? Phone : col.id === 'CONVERTED' ? CheckCircle : List
            }));
            setColumns(mapped);
          }
        } catch (err) {
          console.error('Error parsing crm_columns:', err);
        }
      }
    } catch (e) {
      console.error('Leads fetching error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string, formData?: any) => {
    setIsUpdating(leadId);
    try {
      setLeads(prev => prev.map(lead => lead.id === leadId ? { 
        ...lead, 
        status: newStatus,
        form_data: formData ? { ...(lead.form_data || {}), ...formData } : lead.form_data
      } : lead));

      await api.updatePublicVisitorStatus(leadId, newStatus, undefined, formData);
      
      // Update selected lead details if open
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? {
          ...prev,
          status: newStatus,
          form_data: formData ? { ...(prev.form_data || {}), ...formData } : prev.form_data
        } : null);
      }
    } catch (e) {
      console.error('Status update error:', e);
      alert('Durum güncellenirken bir hata oluştu.');
      fetchLeads();
    } finally {
      setIsUpdating(null);
    }
  };

  // Rejection handler initiator
  const startRejectionProcess = (lead: PublicVisitor) => {
    setRejectTargetLead(lead);
    setRejectionType('permanent');
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const submitRejection = async () => {
    if (!rejectTargetLead) return;
    
    const finalStatus = rejectionType === 'full_seat' ? 'FULL_SEAT' : 'REJECTED';
    const rejectFormData = {
      rejection_type: rejectionType === 'full_seat' ? undefined : rejectionType,
      rejection_reason: rejectionReason,
      rejected_at: new Date().toISOString()
    };

    await handleStatusChange(rejectTargetLead.id, finalStatus, rejectFormData);
    setRejectModalOpen(false);
    setRejectTargetLead(null);
  };

  // Column Add/Edit Initiators
  const startAddColumn = () => {
    setEditingCol(null);
    setColTitle('');
    setSelectedColorScheme(0);
    setColModalOpen(true);
  };

  const startEditColumn = (col: Column) => {
    setEditingCol(col);
    setColTitle(col.title);
    const idx = COLOR_SCHEMES.findIndex(s => s.color === col.color) || 0;
    setSelectedColorScheme(idx >= 0 ? idx : 0);
    setColModalOpen(true);
  };

  const handleSaveColumn = async () => {
    if (!colTitle.trim()) return;

    let updatedCols = [...columns];
    const scheme = COLOR_SCHEMES[selectedColorScheme];

    if (editingCol) {
      updatedCols = updatedCols.map(c => c.id === editingCol.id ? {
        ...c,
        title: colTitle.trim(),
        color: scheme.color,
        bgColor: scheme.bgColor,
        borderColor: scheme.borderColor
      } : c);
    } else {
      const newCol: Column = {
        id: 'col_' + Date.now(),
        title: colTitle.trim(),
        color: scheme.color,
        bgColor: scheme.bgColor,
        borderColor: scheme.borderColor,
        icon: List
      };
      updatedCols.push(newCol);
    }

    setColumns(updatedCols);
    setColModalOpen(false);
    setEditingCol(null);
    setColTitle('');

    try {
      const cleanToSave = updatedCols.map(({ id, title, color, bgColor, borderColor }) => ({
        id, title, color, bgColor, borderColor
      }));
      await api.updateSystemSetting('crm_columns', JSON.stringify(cleanToSave));
    } catch (err) {
      console.error('Error saving columns setting:', err);
    }
  };

  const handleDeleteColumn = async (colId: string) => {
    const col = columns.find(c => c.id === colId);
    if (!col) return;

    const leadsInCol = leads.filter(l => l.status === colId);
    const confirmMsg = leadsInCol.length > 0 
      ? `Bu kolonu silmek istediğinizden emin misiniz? Kolon içindeki ${leadsInCol.length} adet aday 'Yeni Başvuru' sütununa aktarılacaktır.`
      : `Bu kolonu silmek istediğinizden emin misiniz?`;
    
    if (!confirm(confirmMsg)) return;

    const updatedCols = columns.filter(c => c.id !== colId);
    setColumns(updatedCols);

    if (leadsInCol.length > 0) {
      for (const lead of leadsInCol) {
        try {
          await api.updatePublicVisitorStatus(lead.id, 'PENDING');
        } catch (err) {
          console.error('Error migrating lead status:', lead.id, err);
        }
      }
      fetchLeads();
    }

    try {
      const cleanToSave = updatedCols.map(({ id, title, color, bgColor, borderColor }) => ({
        id, title, color, bgColor, borderColor
      }));
      await api.updateSystemSetting('crm_columns', JSON.stringify(cleanToSave));
    } catch (err) {
      console.error('Error saving columns setting:', err);
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

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
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
    
    // First pass: exact matches (case-insensitive and clean-character-insensitive)
    for (const k of keys) {
      const cleanK = k.toLowerCase().replace(/[\s_?\/\\()\-]/g, '');
      for (const kw of keywords) {
        const cleanKw = kw.toLowerCase().replace(/[\s_?\/\\()\-]/g, '');
        if (cleanK === cleanKw) {
          return row[k];
        }
      }
    }

    // Second pass: partial matches (includes) for keywords > 3 chars
    const isSearchingName = keywords.includes('first_name') || keywords.includes('name') || keywords.includes('ad') || keywords.includes('adsoyad');
    
    for (const k of keys) {
      const cleanK = k.toLowerCase().replace(/[\s_?\/\\()\-]/g, '');
      
      // If we are looking for a person's name, skip common marketing campaign/form columns containing "name" or "id"
      if (isSearchingName) {
        if (cleanK.includes('campaign') || cleanK.includes('adset') || cleanK.includes('form') || cleanK.includes('creative') || cleanK.includes('adid') || cleanK.includes('adname') || cleanK === 'id' || cleanK === 'leadid') {
          continue;
        }
      }
      
      for (const kw of keywords) {
        const cleanKw = kw.toLowerCase().replace(/[\s_?\/\\()\-]/g, '');
        if (cleanKw.length <= 3) continue; // Skip short keywords in partial matching to avoid false positives (like 'il' in 'email' or 'ad' in 'adid')
        
        if (cleanK.includes(cleanKw) || cleanKw.includes(cleanK)) {
          return row[k];
        }
      }
    }
    return undefined;
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'education_application':
        return <Badge className="bg-purple-100 text-purple-800 border border-purple-200">Eğitim</Badge>;
      case 'on_degerlendirme':
        return <Badge className="bg-cyan-100 text-cyan-800 border border-cyan-200">Ön Değerlendirme</Badge>;
      case 'meta_import':
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Meta Reklam</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border border-slate-200">Web</Badge>;
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'education_application':
        return 'Eğitim Programı Başvurusu';
      case 'on_degerlendirme':
        return 'Ön Değerlendirme Formu';
      case 'meta_import':
        return 'Meta Reklam Formu';
      default:
        return 'Web Sitesi Başvurusu';
    }
  };

  // Helper cleansers for robust duplicate matching
  const cleanPhoneStr = (phone?: string | number) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
  };

  const cleanEmailStr = (email?: string) => {
    if (!email) return '';
    return email.trim().toLowerCase();
  };

  // Excel parsing
  const processExcelData = (data: any[]) => {
    const valid: any[] = [];
    const duplicates: any[] = [];

    // Create maps of existing phone numbers and emails for check
    const existingPhones = new Set(leads.map(l => cleanPhoneStr(l.phone)).filter(p => p !== ''));
    const existingEmails = new Set(leads.map(l => cleanEmailStr(l.email)).filter(e => e !== ''));

    data.forEach((row, index) => {
      // Map columns
      const name = getRowVal(row, ['first_name', 'first name', 'firstname', 'name', 'ad', 'adı', 'adsoyad', 'ad soyad', 'ad_soyad']) || '';
      const email = getRowVal(row, ['email', 'e-mail', 'eposta', 'e-posta']) || '';
      const phone = getRowVal(row, ['phone_number', 'phone', 'tel', 'telefon', 'telefon_numarası', 'telefon numarası']) || '';
      
      const workStatusVal = getRowVal(row, ['çalışma_durumunuz', 'unvan', 'ünvan', 'calisma_durumu', 'calisma_durumunuz_/_unvaniniz']) || '';
      const sectorVal = getRowVal(row, ['faaliyet_gösterdiğiniz_sektör', 'sektör', 'sektor', 'is_kolu', 'iş_kolu', 'faaliyet_gosterilen']) || '';
      
      // If we are importing training data, prioritize work status as the primary profession
      const profession = importSourceType === 'education_application'
        ? (workStatusVal || sectorVal)
        : (sectorVal || workStatusVal);

      const city = getRowVal(row, ['city', 'sehir', 'şehir', 'il', 'ili', 'sehirler', 'şehirler']) || '';
      const created_time = getRowVal(row, ['created_time', 'tarih', 'created_at']) || '';
      const platform = getRowVal(row, ['platform']) || '';
      const own_business = getRowVal(row, ['kendi_işinizin_sahibi_misiniz', 'kendi_isiniz', 'sahibi_misiniz', 'is_sahibi']) || '';

      const cleanedPh = cleanPhoneStr(phone);
      const cleanedEm = cleanEmailStr(email);

      const parsedLead = {
        name: String(name).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        profession: String(profession).trim(),
        work_status: String(workStatusVal).trim(),
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
          (cleanedEm && cleanEmailStr(v.email) === cleanedEm) || 
          (cleanedPh && cleanPhoneStr(v.phone) === cleanedPh)
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
    setPendingImportFile(file);
    setImportSourceModalOpen(true);
  };

  const parseFileWithSource = (file: File, sourceType: 'meta_import' | 'education_application') => {
    setImportSourceType(sourceType);
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
    setImportSourceModalOpen(false);
    setPendingImportFile(null);
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
          source: importSourceType || 'meta_import',
          kvkk_accepted: true,
          form_data: {
            city: leadItem.city,
            own_business: leadItem.own_business,
            platform: leadItem.platform,
            created_time: leadItem.created_time,
            work_status: leadItem.work_status || undefined
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
    
    // Auto redirect to correct source category
    if (importSourceType === 'education_application') {
      setCrmTab('education');
    } else {
      setCrmTab('meta');
    }
    fetchLeads();
  };

  // Filter leads based on Tab and Search Term
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.profession && lead.profession.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (crmTab === 'active') {
      return lead.status !== 'REJECTED' && lead.status !== 'FULL_SEAT' && lead.source !== 'education_application' && lead.source !== 'on_degerlendirme' && lead.source !== 'meta_import';
    }
    if (crmTab === 'education') {
      return lead.status !== 'REJECTED' && lead.status !== 'FULL_SEAT' && lead.source === 'education_application';
    }
    if (crmTab === 'evaluation') {
      return lead.status !== 'REJECTED' && lead.status !== 'FULL_SEAT' && lead.source === 'on_degerlendirme';
    }
    if (crmTab === 'meta') {
      return lead.status !== 'REJECTED' && lead.status !== 'FULL_SEAT' && lead.source === 'meta_import';
    }
    if (crmTab === 'rejected') {
      return lead.status === 'REJECTED';
    }
    if (crmTab === 'full_seat') {
      return lead.status === 'FULL_SEAT';
    }
    return true;
  });

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
              Başvuruları kanallara göre filtreleyin, Kanban board üzerinde sürükleyip bırakarak yönetin.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={fetchLeads} variant="outline" size="sm" className="h-10 border-slate-200">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button onClick={() => navigate('/admin')} variant="outline" size="sm" className="h-10 border-slate-200">
              Admin Paneli
            </Button>
          </div>
        </div>

        {/* CRM Core Category Navigation Tabs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-1 flex shadow-sm flex-wrap gap-1 mb-8">
          <button
            onClick={() => { setCrmTab('active'); setSearchTerm(''); }}
            className={`p-2.5 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${crmTab === 'active' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-100'}`}
          >
            <Users className="w-3.5 h-3.5" /> Genel Adaylar
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${crmTab === 'active' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
              {leads.filter(l => l.status !== 'REJECTED' && l.status !== 'FULL_SEAT' && l.source !== 'education_application' && l.source !== 'on_degerlendirme' && l.source !== 'meta_import').length}
            </span>
          </button>
          
          <button
            onClick={() => { setCrmTab('education'); setSearchTerm(''); }}
            className={`p-2.5 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${crmTab === 'education' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-100'}`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Eğitim Başvuruları
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${crmTab === 'education' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
              {leads.filter(l => l.status !== 'REJECTED' && l.status !== 'FULL_SEAT' && l.source === 'education_application').length}
            </span>
          </button>

          <button
            onClick={() => { setCrmTab('evaluation'); setSearchTerm(''); }}
            className={`p-2.5 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${crmTab === 'evaluation' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-100'}`}
          >
            <FileText className="w-3.5 h-3.5" /> Değerlendirme Formları
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${crmTab === 'evaluation' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
              {leads.filter(l => l.status !== 'REJECTED' && l.status !== 'FULL_SEAT' && l.source === 'on_degerlendirme').length}
            </span>
          </button>

          <button
            onClick={() => { setCrmTab('meta'); setSearchTerm(''); }}
            className={`p-2.5 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${crmTab === 'meta' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-100'}`}
          >
            <Ban className="w-3.5 h-3.5" /> Meta Reklam Leads
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${crmTab === 'meta' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
              {leads.filter(l => l.status !== 'REJECTED' && l.status !== 'FULL_SEAT' && l.source === 'meta_import').length}
            </span>
          </button>

          <button
            onClick={() => { setCrmTab('import'); setSearchTerm(''); }}
            className={`p-2.5 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${crmTab === 'import' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-100'}`}
          >
            <Upload className="w-3.5 h-3.5" /> Excel Aktarımı
          </button>

          <button
            onClick={() => { setCrmTab('rejected'); setSearchTerm(''); }}
            className={`p-2.5 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${crmTab === 'rejected' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-100'}`}
          >
            <XCircle className="w-3.5 h-3.5 animate-pulse" /> Reddedilenler
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${crmTab === 'rejected' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
              {leads.filter(l => l.status === 'REJECTED').length}
            </span>
          </button>

          <button
            onClick={() => { setCrmTab('full_seat'); setSearchTerm(''); }}
            className={`p-2.5 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${crmTab === 'full_seat' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-100'}`}
          >
            <Armchair className="w-3.5 h-3.5" /> Dolu Koltuk
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${crmTab === 'full_seat' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
              {leads.filter(l => l.status === 'FULL_SEAT').length}
            </span>
          </button>
        </div>

        {/* Filter Toolbar (Search & View Mode Toggle) */}
        {(crmTab === 'active' || crmTab === 'education' || crmTab === 'evaluation' || crmTab === 'meta') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="relative w-full sm:w-80">
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

            <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Kanban className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <List className="w-3.5 h-3.5" /> Liste
              </button>
            </div>
          </div>
        )}

        {/* View Mode content routing */}
        {crmTab === 'import' ? (
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
                      <div className="bg-white p-2.5 rounded-lg border text-slate-655">
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
                          <thead className="bg-slate-50 text-slate-550 font-bold">
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
        ) : crmTab === 'rejected' ? (
          /* REDDEDİLENLER TAB VIEW */
          <div className="space-y-6">
            {/* Sub Filters for Rejections */}
            <div className="bg-white p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm flex-col sm:flex-row">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setRejectedSubFilter('all_rejected')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    rejectedSubFilter === 'all_rejected' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tüm Reddedilenler ({filteredLeads.length})
                </button>
                <button
                  onClick={() => setRejectedSubFilter('permanent')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    rejectedSubFilter === 'permanent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Kalıcı Reddedilenler ({filteredLeads.filter(l => l.form_data?.rejection_type === 'permanent').length})
                </button>
                <button
                  onClick={() => setRejectedSubFilter('not_qualified')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    rejectedSubFilter === 'not_qualified' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Not Qualified ({filteredLeads.filter(l => l.form_data?.rejection_type === 'not_qualified').length})
                </button>
              </div>

              <div className="text-xs text-slate-455 font-bold">
                * Kalıcı reddedilenlerin yeni başvuruları otomatik olarak engellenir.
              </div>
            </div>

            {/* List / Table View of Rejections */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-slate-50 text-slate-550 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Ad Soyad / İletişim</th>
                      <th className="px-6 py-4">Red Türü</th>
                      <th className="px-6 py-4">Sektör / Şehir</th>
                      <th className="px-6 py-4">Red Nedeni</th>
                      <th className="px-6 py-4">Red Tarihi</th>
                      <th className="px-6 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {filteredLeads
                      .filter(lead => {
                        if (rejectedSubFilter === 'permanent') return lead.form_data?.rejection_type === 'permanent';
                        if (rejectedSubFilter === 'not_qualified') return lead.form_data?.rejection_type === 'not_qualified';
                        return true;
                      })
                      .length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          Reddedilen aday bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads
                        .filter(lead => {
                          if (rejectedSubFilter === 'permanent') return lead.form_data?.rejection_type === 'permanent';
                          if (rejectedSubFilter === 'not_qualified') return lead.form_data?.rejection_type === 'not_qualified';
                          return true;
                        })
                        .map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{lead.name}</div>
                              <div className="flex flex-col sm:flex-row gap-x-3 text-xs text-slate-500 mt-1">
                                {lead.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}</span>}
                                {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {lead.form_data?.rejection_type === 'permanent' ? (
                                <Badge className="bg-red-100 text-red-800 border border-red-200">Kalıcı Red</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-250">Not Qualified</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-700">{lead.profession || '-'}</div>
                              {lead.form_data?.city && <div className="text-xs text-slate-455 mt-0.5">Şehir: {lead.form_data.city}</div>}
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed" title={lead.form_data?.rejection_reason}>
                                {lead.form_data?.rejection_reason || <span className="text-slate-400 italic">Sebep belirtilmemiş</span>}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                              {lead.form_data?.rejected_at 
                                ? new Date(lead.form_data.rejected_at).toLocaleDateString('tr-TR')
                                : new Date(lead.created_at).toLocaleDateString('tr-TR')
                              }
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
                                  onClick={() => handleStatusChange(lead.id, 'PENDING', { rejection_type: undefined, rejection_reason: undefined, rejected_at: undefined })}
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 border-emerald-100 hover:bg-emerald-50 text-emerald-650 text-xs px-2.5"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Yeniden Değerlendir
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
          </div>
        ) : crmTab === 'full_seat' ? (
          /* DOLU KOLTUK TAB VIEW */
          <div className="space-y-6">
            {/* Info Message Box */}
            <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 text-xs text-amber-700 flex items-start gap-3">
              <Armchair className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Dolu Koltuk Durumu</p>
                <p className="leading-relaxed">
                  Topluluk içerisinde aynı meslek dalından sadece bir temsilci yer alabilmektedir. 
                  Bu kategorideki adayların başvurduğu meslek kolu halihazırda dolu olduğu için beklemeye veya arşive alınmıştır.
                </p>
              </div>
            </div>

            {/* List / Table View of Full Seat Leads */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-slate-50 text-slate-550 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Ad Soyad / İletişim</th>
                      <th className="px-6 py-4">Sektör / Şehir</th>
                      <th className="px-6 py-4">Gerekçe / Not</th>
                      <th className="px-6 py-4">Tarih</th>
                      <th className="px-6 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-500">
                          Dolu koltuk nedeniyle ayrılmış aday bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{lead.name}</div>
                            <div className="flex flex-col sm:flex-row gap-x-3 text-xs text-slate-500 mt-1">
                              {lead.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}</span>}
                              {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-700">{lead.profession || '-'}</div>
                            {lead.form_data?.city && <div className="text-xs text-slate-455 mt-0.5">Şehir: {lead.form_data.city}</div>}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed" title={lead.form_data?.rejection_reason}>
                              {lead.form_data?.rejection_reason || <span className="text-slate-400 italic">Sebep belirtilmemiş</span>}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            {lead.form_data?.rejected_at 
                              ? new Date(lead.form_data.rejected_at).toLocaleDateString('tr-TR')
                              : new Date(lead.created_at).toLocaleDateString('tr-TR')
                            }
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
                                onClick={() => handleStatusChange(lead.id, 'PENDING', { rejection_reason: undefined })}
                                variant="outline" 
                                size="sm" 
                                className="h-8 border-emerald-100 hover:bg-emerald-50 text-emerald-650 text-xs px-2.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Yeniden Değerlendir
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
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <RefreshCw className="w-10 h-10 animate-spin text-slate-400 mb-4" />
                <p className="text-slate-500 font-medium">Veriler yükleniyor...</p>
              </div>
            ) : viewMode === 'kanban' ? (
              /* KANBAN BOARD VIEW */
              <div className="flex gap-6 overflow-x-auto pb-6 items-start select-none scrollbar-thin scrollbar-thumb-slate-200">
                {columns.map((col) => {
                  const colLeads = filteredLeads.filter(l => l.status === col.id);
                  const isOver = draggedOverCol === col.id;

                  return (
                    <div 
                      key={col.id} 
                      onDragOver={(e) => handleDragOver(e, col.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, col.id)}
                      className={`flex flex-col max-h-[80vh] w-[300px] flex-shrink-0 rounded-2xl border transition-all duration-200 group/col ${col.bgColor} ${isOver ? 'border-slate-950 ring-4 ring-slate-950/5 scale-[1.01]' : col.borderColor}`}
                    >
                      {/* Column Header */}
                      <div className="p-4 border-b flex items-center justify-between font-bold text-sm bg-white rounded-t-2xl animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-slate-800 truncate max-w-[65%]">
                          <col.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate" title={col.title}>{col.title}</span>
                          <span className="text-slate-400 font-medium text-xs ml-1 flex-shrink-0">
                            ({colLeads.length})
                          </span>
                        </div>
                        
                        {/* Header Settings Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEditColumn(col)} 
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Kolonu Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {col.id !== 'PENDING' && col.id !== 'CONVERTED' && (
                            <button 
                              onClick={() => handleDeleteColumn(col.id)} 
                              className="p-1 hover:bg-rose-50 rounded text-rose-600"
                              title="Kolonu Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
                                <p className="text-[11px] text-slate-455 font-bold mb-3 flex items-center gap-1">
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
                                    onClick={() => startRejectionProcess(lead)}
                                    className="p-1 hover:bg-rose-50 rounded text-rose-600"
                                    title="Reddet"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="p-1 hover:bg-red-50 rounded text-red-655"
                                    title="Kalıcı Sil"
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

                {/* Add Column Card */}
                <div 
                  onClick={startAddColumn}
                  className="flex flex-col min-w-[280px] h-32 border-2 border-dashed border-slate-300 hover:border-slate-450 rounded-2xl items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer transition-all bg-white/50 hover:bg-white shadow-sm flex-shrink-0"
                >
                  <span className="flex items-center gap-1.5 font-bold text-sm">
                    <Plus className="w-4.5 h-4.5" /> Kolon Ekle
                  </span>
                </div>
              </div>
            ) : (
              /* LIST / TABLE VIEW */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
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
                            Bu aşamada kayıtlı aktif aday bulunamadı.
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
                                onChange={(e) => {
                                  if (e.target.value === 'REJECTED') {
                                    startRejectionProcess(lead);
                                  } else {
                                    handleStatusChange(lead.id, e.target.value as any);
                                  }
                                }}
                                disabled={isUpdating === lead.id}
                                className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-slate-950/10 cursor-pointer"
                              >
                                {columns.map((col) => (
                                  <option key={col.id} value={col.id}>{col.title}</option>
                                ))}
                                <option value="REJECTED">Kayıt Reddet</option>
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
                                  onClick={() => startRejectionProcess(lead)} 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 border-rose-100 hover:bg-rose-50 text-rose-655 text-xs px-2.5"
                                >
                                  <Ban className="w-3.5 h-3.5 mr-1" /> Reddet
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

        {/* Add/Edit Column Settings Modal */}
        {colModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-55 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 border border-slate-100 space-y-5 animate-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Kanban className="w-5 h-5 text-slate-700" />
                  {editingCol ? 'Kolonu Düzenle' : 'Yeni Kolon Ekle'}
                </h3>
                <button 
                  onClick={() => {
                    setColModalOpen(false);
                    setEditingCol(null);
                    setColTitle('');
                  }}
                  className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-450 font-bold uppercase tracking-wider mb-2">
                    Kolon Başlığı
                  </label>
                  <input
                    type="text"
                    value={colTitle}
                    onChange={(e) => setColTitle(e.target.value)}
                    placeholder="Örn: Sıcak Takip, Görüşme Yapıldı..."
                    className="w-full border rounded-xl p-3 text-xs focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 outline-none font-bold"
                    maxLength={30}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-450 font-bold uppercase tracking-wider mb-2">
                    Renk Paleti Seçin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_SCHEMES.map((scheme, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColorScheme(idx)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          selectedColorScheme === idx 
                            ? 'border-slate-900 ring-2 ring-slate-950/5 bg-slate-50' 
                            : 'border-slate-100 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <span className={scheme.color}>{scheme.name}</span>
                        <span className={`w-3.5 h-3.5 rounded-full border border-slate-200`} style={{ backgroundColor: scheme.bgColor.includes('bg-') ? undefined : scheme.bgColor }}>
                          <span className={`w-full h-full rounded-full block ${scheme.bgColor.split(' ')[0]}`}></span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button 
                  onClick={() => {
                    setColModalOpen(false);
                    setEditingCol(null);
                    setColTitle('');
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Vazgeç
                </Button>
                <Button 
                  onClick={handleSaveColumn}
                  disabled={!colTitle.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-4"
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Import Source Selection Modal */}
        {importSourceModalOpen && pendingImportFile && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-55 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 border border-slate-100 space-y-5 animate-in zoom-in duration-200 text-center">
              <div className="flex justify-between items-center border-b pb-3 text-left">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5 text-slate-650" /> Aktarım Türü
                </h3>
                <button 
                  onClick={() => {
                    setImportSourceModalOpen(false);
                    setPendingImportFile(null);
                  }}
                  className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-slate-500 leading-relaxed text-left">
                Yüklenen Excel dosyasındaki veriler hangi başvuru türü olarak içeri aktarılsın?
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={() => parseFileWithSource(pendingImportFile, 'meta_import')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200 hover:border-slate-850 hover:bg-slate-50 transition-all text-left w-full group"
                >
                  <span className="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-3 group-hover:bg-slate-200 transition-colors">
                    <Ban className="w-5 h-5 text-slate-600 animate-pulse" />
                  </span>
                  <span className="font-bold text-slate-900 text-sm">Reklam Datası (Meta Ads)</span>
                  <span className="text-xs text-slate-450 mt-1 leading-normal text-center">
                    Genel kampanya müşteri adayları olarak içeri aktarılır.
                  </span>
                </button>

                <button
                  onClick={() => parseFileWithSource(pendingImportFile, 'education_application')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200 hover:border-slate-850 hover:bg-slate-50 transition-all text-left w-full group"
                >
                  <span className="w-10 h-10 bg-purple-50 text-purple-650 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                    <GraduationCap className="w-5 h-5 text-purple-600 animate-bounce" />
                  </span>
                  <span className="font-bold text-slate-900 text-sm">Eğitim Datası (Eğitim Başvurusu)</span>
                  <span className="text-xs text-slate-455 mt-1 leading-normal text-center">
                    Networking eğitimi başvurusu olarak içeri aktarılır.
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Cause Modal (Popup Card) */}
        {rejectModalOpen && rejectTargetLead && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-55">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Ban className="w-5 h-5 text-rose-600" /> Başvuruyu Reddet
                </h3>
                <button 
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectTargetLead(null);
                  }}
                  className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-slate-800">
                  Aday: <span className="font-bold text-slate-950">{rejectTargetLead.name}</span>
                </div>

                <div>
                  <label className="block text-xs text-slate-455 font-bold uppercase tracking-wider mb-2">
                    Reddetme Türü
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border hover:bg-slate-50 cursor-pointer text-xs">
                      <input 
                        type="radio" 
                        name="rejectionType" 
                        value="permanent"
                        checked={rejectionType === 'permanent'}
                        onChange={() => setRejectionType('permanent')}
                        className="mt-0.5 accent-rose-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Kalıcı Reddedildi</span>
                        <span className="text-slate-450 mt-0.5 block leading-normal">
                          Bu kişi/firma aynı mail veya telefonla bir daha başvuru yapamaz, özel uyarı mesajı alır.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl border hover:bg-slate-50 cursor-pointer text-xs">
                      <input 
                        type="radio" 
                        name="rejectionType" 
                        value="not_qualified"
                        checked={rejectionType === 'not_qualified'}
                        onChange={() => setRejectionType('not_qualified')}
                        className="mt-0.5 accent-rose-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Not Qualified (Niteliksiz / Uygun Değil)</span>
                        <span className="text-slate-450 mt-0.5 block leading-normal">
                          Kriterlere uygun bulunmamıştır ancak gelecekte yeniden başvurması engellenmez.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl border hover:bg-slate-50 cursor-pointer text-xs">
                      <input 
                        type="radio" 
                        name="rejectionType" 
                        value="full_seat"
                        checked={rejectionType === 'full_seat'}
                        onChange={() => setRejectionType('full_seat')}
                        className="mt-0.5 accent-rose-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Dolu Koltuk</span>
                        <span className="text-slate-450 mt-0.5 block leading-normal">
                          Başvurulan meslek kolu halihazırda dolu olduğu için listeye alınmaz.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-455 font-bold uppercase tracking-wider mb-2">
                    Reddetme Nedeni / Gerekçe <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Bu başvurunun reddedilme nedenini detaylandırın..."
                    className="w-full border rounded-xl p-3 text-xs focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 outline-none leading-relaxed"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button 
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectTargetLead(null);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Vazgeç
                </Button>
                <Button 
                  onClick={submitRejection}
                  disabled={!rejectionReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4"
                >
                  Reddetmeyi Onayla
                </Button>
              </div>
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
                    Sisteme Kayıt Tarihi: {new Date(selectedLead.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)} 
                  className="text-slate-450 hover:text-slate-650 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Status Options / Rejection Block Display */}
                {selectedLead.status === 'REJECTED' || selectedLead.status === 'FULL_SEAT' ? (
                  /* Reddedilmiş Aday Bilgi Kutusu */
                  <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-black text-rose-950">
                        <Ban className="w-4 h-4 text-rose-600" />
                        {selectedLead.status === 'FULL_SEAT' 
                          ? 'Dolu Koltuk Nedeniyle Ayrıldı' 
                          : selectedLead.form_data?.rejection_type === 'permanent' 
                            ? 'Kalıcı Olarak Reddedildi' 
                            : 'Niteliksiz (Not Qualified) Olarak Reddedildi'
                        }
                      </span>
                      <Button 
                        onClick={() => handleStatusChange(selectedLead.id, 'PENDING', { rejection_type: undefined, rejection_reason: undefined, rejected_at: undefined })}
                        variant="outline" 
                        size="sm" 
                        className="bg-white border-rose-200 text-rose-800 hover:bg-rose-50 text-xs px-2.5"
                      >
                        Yeniden Değerlendir
                      </Button>
                    </div>
                    <div>
                      <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider mb-1">Reddedilme / Ayırma Gerekçesi</div>
                      <p className="text-xs text-rose-900 leading-relaxed whitespace-pre-wrap bg-white/70 p-3.5 rounded-xl border border-rose-100/50">
                        {selectedLead.form_data?.rejection_reason || 'Gerekçe belirtilmemiş.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Aktif Aday Durum Yönetimi */
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-700">Başvuru Durumu:</div>
                    <div className="flex gap-2 flex-wrap">
                      {columns.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => handleStatusChange(selectedLead.id, col.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            selectedLead.status === col.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-655 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {col.title}
                        </button>
                      ))}
                      <button
                        onClick={() => startRejectionProcess(selectedLead)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-250 bg-rose-50 text-rose-650 hover:bg-rose-100 transition-all"
                      >
                        Reddet / Ele
                      </button>
                    </div>
                  </div>
                )}

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
                        if (['why_take_training', 'work_status', 'city', 'own_business', 'platform', 'created_time', 'rejection_type', 'rejection_reason', 'rejected_at'].includes(key)) return null;
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        
                        return (
                          <div key={key}>
                            <label className="block text-xs text-slate-455 font-semibold mb-1">{label}</label>
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
