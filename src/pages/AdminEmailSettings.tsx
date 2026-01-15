import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { emailService, EmailTemplate } from '../services/emailService'; // Keeping template service for now
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Mail, Save, RotateCcw, History, Info, Server, CheckCircle, XCircle, Trash2, Play } from 'lucide-react';
import { Badge } from '../shared/Badge';

export function AdminEmailSettings() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // Tabs
    const [activeTab, setActiveTab] = useState<'SMTP' | 'TEMPLATES' | 'LOGS'>('SMTP');

    // SMTP State
    const [configs, setConfigs] = useState<any[]>([]);
    const [smtpForm, setSmtpForm] = useState({
        smtp_host: 'mail.kurumsaleposta.com',
        smtp_port: 587,
        smtp_user: 'info@event4network.com',
        smtp_pass: '4hr:b-eSM8_1:R5B',
        sender_email: 'info@event4network.com',
        sender_name: 'Event 4 Network',
        is_active: true
    });
    const [testEmail, setTestEmail] = useState('');

    // Template State
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Load Templates (Mock Service)
        setTemplates(emailService.getTemplates());
        setLogs(emailService.getLogs());

        // Load SMTP Configs (Real API)
        try {
            const data = await api.getEmailConfigs();
            if (Array.isArray(data)) {
                setConfigs(data);
            }
        } catch (e) {
            console.error('Failed to load email configs', e);
        }
    };

    // --- SMTP Handlers ---
    const handleSaveSmtp = async () => {
        try {
            await api.createEmailConfig(smtpForm);
            alert('SMTP Ayarları kaydedildi.');
            setSmtpForm({
                smtp_host: '',
                smtp_port: 587,
                smtp_user: '',
                smtp_pass: '',
                sender_email: '',
                sender_name: 'Event4Network',
                is_active: true
            });
            loadData();
        } catch (e) {
            console.error(e);
            alert('Kaydetme başarısız.');
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await api.activateEmailConfig(id);
            loadData();
        } catch (e) {
            alert('Aktivasyon başarısız.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        try {
            await api.deleteEmailConfig(id);
            loadData();
        } catch (e) {
            alert('Silme başarısız.');
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) return alert('Lütfen test için bir e-posta girin.');
        try {
            await api.testEmailConfig(testEmail);
            alert(`Test maili gönderildi: ${testEmail}`);
        } catch (e) {
            console.error(e);
            alert('Test maili gönderilemedi. Sunucu loglarını kontrol edin.');
        }
    };


    // --- Template Handlers ---
    const handleSelectTemplate = (template: EmailTemplate) => {
        setSelectedTemplate({ ...template });
    };

    const handleSaveTemplate = () => {
        if (!selectedTemplate) return;
        emailService.updateTemplate(selectedTemplate.id, {
            subject: selectedTemplate.subject,
            body: selectedTemplate.body,
            senderName: selectedTemplate.senderName,
            senderEmail: selectedTemplate.senderEmail
        });
        alert('Şablon güncellendi!');
        loadData();
    };

    const handleResetTemplates = () => {
        if (window.confirm('Tüm şablonlar varsayılan ayarlara dönecek. Emin misiniz?')) {
            emailService.resetTemplates();
            loadData();
            setSelectedTemplate(null);
        }
    };

    if (!user || user.role !== 'ADMIN') return <div>Yetkisiz alan</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Mail className="mr-3 h-8 w-8 text-indigo-600" />
                        E-Posta Servisi Ayarları
                    </h1>
                    <div className="flex space-x-2">
                        <Button
                            variant={activeTab === 'SMTP' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('SMTP')}
                        >
                            <Server className="mr-2 h-4 w-4" />
                            SMTP / Sunucu
                        </Button>
                        <Button
                            variant={activeTab === 'TEMPLATES' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('TEMPLATES')}
                        >
                            <Info className="mr-2 h-4 w-4" />
                            Şablon Yönetimi
                        </Button>
                        <Button
                            variant={activeTab === 'LOGS' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('LOGS')}
                        >
                            <History className="mr-2 h-4 w-4" />
                            Mail Logları
                        </Button>
                    </div>
                </div>

                {/* SMTP TAB */}
                {activeTab === 'SMTP' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* New Config Form */}
                        <Card>
                            <CardHeader><CardTitle>Yeni SMTP Ayarı Ekle</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">SMTP Host</label>
                                        <Input
                                            placeholder="smtp.gmail.com"
                                            value={smtpForm.smtp_host}
                                            onChange={e => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Port</label>
                                        <Input
                                            type="number"
                                            placeholder="587"
                                            value={smtpForm.smtp_port}
                                            onChange={e => setSmtpForm({ ...smtpForm, smtp_port: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Kullanıcı (E-posta)</label>
                                        <Input
                                            placeholder="user@domain.com"
                                            value={smtpForm.smtp_user}
                                            onChange={e => setSmtpForm({ ...smtpForm, smtp_user: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Şifre</label>
                                        <Input
                                            type="password"
                                            placeholder="********"
                                            value={smtpForm.smtp_pass}
                                            onChange={e => setSmtpForm({ ...smtpForm, smtp_pass: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Gönderen Email</label>
                                        <Input
                                            placeholder="noreply@domain.com"
                                            value={smtpForm.sender_email}
                                            onChange={e => setSmtpForm({ ...smtpForm, sender_email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Gönderen Adı</label>
                                        <Input
                                            placeholder="Event4Network Adı"
                                            value={smtpForm.sender_name}
                                            onChange={e => setSmtpForm({ ...smtpForm, sender_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={smtpForm.is_active}
                                        onChange={e => setSmtpForm({ ...smtpForm, is_active: e.target.checked })}
                                        id="isActive"
                                    />
                                    <label htmlFor="isActive" className="text-sm text-gray-700">Bu ayarı hemen aktif et</label>
                                </div>
                                <div className="pt-2 text-right">
                                    <Button onClick={handleSaveSmtp} className="bg-green-600 hover:bg-green-700 text-white">
                                        <Save className="h-4 w-4 mr-2" /> Kaydet
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Existing Configs List */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Kayıtlı Ayarlar</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    {configs.length === 0 && <p className="text-gray-500 text-sm">Hiçbir ayar bulunamadı. Varsayılan (Env) ayarlar kullanılıyor.</p>}
                                    {configs.map(conf => (
                                        <div key={conf.id} className={`p-4 rounded-lg border flex justify-between items-center ${conf.is_active ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">{conf.sender_name}</span>
                                                    {conf.is_active && <Badge className="bg-green-100 text-green-800">Aktif</Badge>}
                                                </div>
                                                <div className="text-sm text-gray-600">{conf.sender_email}</div>
                                                <div className="text-xs text-gray-400">{conf.smtp_host}:{conf.smtp_port} ({conf.smtp_user})</div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!conf.is_active && (
                                                    <Button size="sm" variant="outline" onClick={() => handleActivate(conf.id)} title="Aktif Et">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(conf.id)} title="Sil" className="text-red-500 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Test Email */}
                            <Card>
                                <CardHeader><CardTitle>Test Gönderimi</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Test alıcısı e-posta..."
                                            value={testEmail}
                                            onChange={e => setTestEmail(e.target.value)}
                                        />
                                        <Button onClick={handleTestEmail} variant="primary">
                                            <Play className="h-4 w-4 mr-2" /> Test Et
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Aktif olan ayarlar kullanılarak gönderilecektir.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TEMPLATES TAB */}
                {activeTab === 'TEMPLATES' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sidebar List */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Şablonlar</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {templates.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => handleSelectTemplate(t)}
                                            className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedTemplate?.id === t.id ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-gray-50 border-gray-200'}`}
                                        >
                                            <div className="font-medium text-gray-900">{t.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">{t.description}</div>
                                        </div>
                                    ))}
                                </CardContent>
                                <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                                    <Button variant="ghost" size="sm" onClick={handleResetTemplates} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <RotateCcw className="h-4 w-4 mr-2" /> Varsayılana Dön
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Editor */}
                        <div className="lg:col-span-2">
                            {selectedTemplate ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Düzenle: {selectedTemplate.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Gönderen Adı</label>
                                                <Input
                                                    value={selectedTemplate.senderName}
                                                    onChange={e => setSelectedTemplate({ ...selectedTemplate, senderName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Gönderen E-Posta</label>
                                                <Input
                                                    value={selectedTemplate.senderEmail}
                                                    onChange={e => setSelectedTemplate({ ...selectedTemplate, senderEmail: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                                            <Input
                                                value={selectedTemplate.subject}
                                                onChange={e => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                                            <textarea
                                                className="w-full h-64 border rounded-md p-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                                                value={selectedTemplate.body}
                                                onChange={e => setSelectedTemplate({ ...selectedTemplate, body: e.target.value })}
                                            />
                                            <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100 flex items-start">
                                                <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                                                <p>
                                                    Kullanılabilir değişkenler: {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}, {'{{company}}'}
                                                    <br />
                                                    Bu değişkenler mail gönderilirken gerçek verilerle değiştirilecektir.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <Button variant="primary" onClick={handleSaveTemplate}>
                                                <Save className="h-4 w-4 mr-2" /> Değişiklikleri Kaydet
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="h-full flex items-center justify-center p-12 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                    <p className="text-gray-500">Düzenlemek için sol taraftan bir şablon seçin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'LOGS' && (
                    <Card>
                        <CardHeader><CardTitle>Gönderim Logları (Son 50)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şablon</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alıcı</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konu</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {logs.map((log) => (
                                            <tr key={log.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(log.date).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {log.templateName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.recipient}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {log.subject}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    Henüz mail gönderimi yapılmamış.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
