import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Card, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { Badge } from '../shared/Badge';
import { 
  Search, 
  Mail, 
  User, 
  Building, 
  DollarSign, 
  Calendar, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  FileText,
  FileCheck,
  ChevronRight,
  Phone,
  MapPin,
  Landmark,
  Trash2
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  profession: string;
  created_at: string;
  type: 'VISITOR' | 'MEMBER';
  amount: number;
  invoice_url: string | null;
  invoice_issued: boolean;
  tax_number: string | null;
  tax_office: string | null;
  billing_address: string | null;
  event_title?: string;
  plan?: string;
}

export function AdminAccounting() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tabs: 'ALL' | 'VISITOR' | 'MEMBER' | 'PENDING' | 'COMPLETED'
  const [activeTab, setActiveTab] = useState<'ALL' | 'VISITOR' | 'MEMBER' | 'PENDING' | 'COMPLETED'>('ALL');
  
  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);
  
  // File Upload State
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ id: string; type: 'VISITOR' | 'MEMBER' } | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await api.getAccountingPayments();
      setPayments(data || []);
    } catch (err) {
      console.error('Ödemeler yüklenirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleUploadClick = (record: PaymentRecord) => {
    setUploadTarget({ id: record.id, type: record.type });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    // Check size limit (e.g. 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Dosya boyutu çok büyük. Maksimum 10MB yükleyebilirsiniz.');
      return;
    }

    setUploadingId(uploadTarget.id);
    try {
      await api.uploadAccountingInvoice(uploadTarget.type, uploadTarget.id, file);
      alert('Fatura başarıyla yüklendi ve kullanıcının e-posta adresine gönderildi.');
      fetchPayments(); // Refresh list
    } catch (err) {
      console.error(err);
      alert('Fatura yüklenirken veya gönderilirken bir hata oluştu.');
    } finally {
      setUploadingId(null);
      setUploadTarget(null);
    }
  };

  const handleDeletePayment = async (record: PaymentRecord) => {
    const confirmDelete = window.confirm(`${record.name} isimli kişiye ait bu ödeme kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`);
    if (!confirmDelete) return;

    try {
      await api.deleteAccountingPayment(record.type, record.id);
      alert('Kayıt başarıyla silindi.');
      fetchPayments(); // Refresh list
    } catch (err: any) {
      console.error('Kayıt silinirken hata oluştu:', err);
      alert(err.error || err.message || 'Kayıt silinirken bir hata oluştu.');
    }
  };

  const getFilteredPayments = () => {
    return payments.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.company && p.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchSearch) return false;

      if (activeTab === 'VISITOR') return p.type === 'VISITOR';
      if (activeTab === 'MEMBER') return p.type === 'MEMBER';
      if (activeTab === 'PENDING') return !p.invoice_issued;
      if (activeTab === 'COMPLETED') return p.invoice_issued;
      
      return true;
    });
  };

  const filtered = getFilteredPayments();

  const stats = {
    totalRevenue: payments.reduce((acc, p) => acc + p.amount, 0),
    visitorRevenue: payments.filter(p => p.type === 'VISITOR').reduce((acc, p) => acc + p.amount, 0),
    memberRevenue: payments.filter(p => p.type === 'MEMBER').reduce((acc, p) => acc + p.amount, 0),
    pendingInvoices: payments.filter(p => !p.invoice_issued).length,
    completedInvoices: payments.filter(p => p.invoice_issued).length
  };

  if (!user || user.role !== 'ADMIN') return <div className="p-8 text-red-600 font-bold text-center">Erişim Yetkiniz Yok</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf,image/*" 
          className="hidden" 
        />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 cursor-pointer hover:text-slate-800 transition-colors" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Admin Paneline Dön</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Muhasebe &amp; Fatura Yönetimi</h1>
            <p className="text-slate-500 mt-1 text-sm">Ziyaretçiler ve üyeler tarafından gerçekleştirilen tüm başarılı ödemeleri listeleyip faturalandırabilirsiniz.</p>
          </div>
          <Button 
            onClick={() => fetchPayments()} 
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl"
            variant="outline"
          >
            Yenile
          </Button>
        </div>

        {/* Accounting Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Tahsilat</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">₺{stats.totalRevenue.toLocaleString('tr-TR')}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ziyaretçi Geliri (₺1k)</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">₺{stats.visitorRevenue.toLocaleString('tr-TR')}</p>
              </div>
              <User className="h-10 w-10 text-blue-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bekleyen Faturalar</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingInvoices}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-amber-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-indigo-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kesilen Faturalar</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.completedInvoices}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-indigo-500 opacity-20" />
            </CardContent>
          </Card>
        </div>

        {/* Toolbar & Filters */}
        <Card className="bg-white shadow-sm border border-slate-100">
          <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-center">
            
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Ödeyen kişi, e-posta veya şirket ile ara..."
                className="pl-10 w-full rounded-xl border border-slate-200 py-2.5 text-sm bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tümü ({payments.length})
              </button>
              <button
                onClick={() => setActiveTab('VISITOR')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${activeTab === 'VISITOR' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Ziyaretçiler ({payments.filter(p => p.type === 'VISITOR').length})
              </button>
              <button
                onClick={() => setActiveTab('MEMBER')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${activeTab === 'MEMBER' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Üyeler ({payments.filter(p => p.type === 'MEMBER').length})
              </button>
              <button
                onClick={() => setActiveTab('PENDING')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${activeTab === 'PENDING' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Fatura Bekleyen ({stats.pendingInvoices})
              </button>
              <button
                onClick={() => setActiveTab('COMPLETED')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${activeTab === 'COMPLETED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Kesilenler ({stats.completedInvoices})
              </button>
            </div>

          </CardContent>
        </Card>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-slate-400 mt-4 text-sm font-medium">Ödeme kayıtları yükleniyor...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Ödeyen Bilgisi</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Ödeme Tipi</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Tutar ve Tarih</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Fatura Durumu</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-500 uppercase tracking-wider text-xs">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map(p => {
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-[15px]">{p.name}</div>
                          <div className="text-slate-400 flex items-center gap-1.5 mt-1 font-medium text-xs">
                            <Mail className="w-3.5 h-3.5" />
                            {p.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            p.type === 'VISITOR' 
                              ? 'bg-blue-50 text-blue-700 border-blue-100' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {p.type === 'VISITOR' ? 'Ziyaretçi Formu' : 'Üyelik Yenileme'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800">₺{p.amount.toLocaleString('tr-TR')}</div>
                          <div className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(p.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {p.invoice_issued ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Fatura Kesildi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                              Fatura Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRecord(p)}
                              className="text-slate-700 hover:bg-slate-100 border-slate-200 rounded-lg text-xs py-1.5"
                            >
                              Detay
                            </Button>
                            
                            {p.invoice_issued && p.invoice_url ? (
                              <a 
                                href={p.invoice_url.startsWith('http') ? p.invoice_url : `${api.getSystemSettings ? '/api' : 'http://localhost:4005'}${p.invoice_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition-colors"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                Faturayı Gör
                              </a>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleUploadClick(p)}
                                disabled={uploadingId === p.id}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center gap-1.5 py-1.5"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {uploadingId === p.id ? 'Gönderiliyor...' : 'Fatura Yükle'}
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePayment(p)}
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 hover:border-rose-300 rounded-lg text-xs py-1.5 px-2 flex items-center justify-center"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                        Kayıt bulunamadı veya arama kriterlerine uygun veri yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Accounting Billing Detail Modal */}
      <Modal 
        open={!!selectedRecord} 
        onClose={() => setSelectedRecord(null)} 
        title="Fatura &amp; Şirket Detayları"
      >
        {selectedRecord && (
          <div className="space-y-6 pt-2">
            
            {/* Payment Summary */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tahsilat Tutarı</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">₺{selectedRecord.amount.toLocaleString('tr-TR')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">İşlem Tarihi</p>
                <p className="font-semibold text-slate-800 mt-0.5">{new Date(selectedRecord.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>

            {/* Invoicing Company Details Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Faturalandırılacak Şirket &amp; Kişi Bilgileri</h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="col-span-2">
                  <label className="text-slate-400 block mb-0.5">Müşteri / Üye Adı Soyadı</label>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {selectedRecord.name}
                  </p>
                </div>
                
                <div>
                  <label className="text-slate-400 block mb-0.5">E-Posta Adresi</label>
                  <p className="font-semibold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedRecord.email}
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Telefon Numarası</label>
                  <p className="font-semibold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedRecord.phone || '-'}
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-0.5">Şirket Unvanı</label>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {selectedRecord.company || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Vergi Numarası / T.C. Kimlik</label>
                  <p className="font-bold text-slate-800 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                    <FileText className="w-3.5 h-3.5 text-slate-400 mr-0.5" /> {selectedRecord.tax_number || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Vergi Dairesi</label>
                  <p className="font-semibold text-slate-700 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" /> {selectedRecord.tax_office || '-'}
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-0.5">Fatura Adresi</label>
                  <p className="font-semibold text-slate-700 flex items-start gap-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-line">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    {selectedRecord.billing_address || '-'}
                  </p>
                </div>
                
                {selectedRecord.type === 'VISITOR' && selectedRecord.event_title && (
                  <div className="col-span-2 bg-purple-50 p-2.5 rounded-lg border border-purple-100 text-purple-800">
                    <span className="font-bold block mb-0.5 text-[10px] uppercase tracking-wider">Başvuru Yaptığı Toplantı</span>
                    <span className="font-semibold">{selectedRecord.event_title}</span>
                  </div>
                )}

                {selectedRecord.type === 'MEMBER' && selectedRecord.plan && (
                  <div className="col-span-2 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 text-indigo-800">
                    <span className="font-bold block mb-0.5 text-[10px] uppercase tracking-wider">Satın Alınan Plan</span>
                    <span className="font-semibold">{selectedRecord.plan.replace('_MONTHS', ' Ay').replace('1_MONTH', 'Aylık Paket')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-slate-100 pt-5 flex justify-between gap-3">
              {selectedRecord.invoice_issued && selectedRecord.invoice_url ? (
                <a 
                  href={selectedRecord.invoice_url.startsWith('http') ? selectedRecord.invoice_url : `${api.getSystemSettings ? '/api' : 'http://localhost:4005'}${selectedRecord.invoice_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors"
                >
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Faturayı Aç
                </a>
              ) : (
                <Button
                  onClick={() => {
                    setSelectedRecord(null);
                    handleUploadClick(selectedRecord);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs flex items-center gap-1.5 py-2 px-4"
                >
                  <Upload className="w-4 h-4" />
                  Fatura Yükle &amp; Gönder
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                onClick={() => setSelectedRecord(null)}
              >
                Kapat
              </Button>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
