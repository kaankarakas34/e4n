import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { emailService, EmailTemplate } from '../services/emailService';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Mail, Save, RotateCcw, History, Info } from 'lucide-react';

export function AdminEmailSettings() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'SETTINGS' | 'LOGS'>('SETTINGS');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setTemplates(emailService.getTemplates());
        setLogs(emailService.getLogs());
    };

    const handleSelectTemplate = (template: EmailTemplate) => {
        setSelectedTemplate({ ...template });
    };

    const handleSave = () => {
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

    const handleReset = () => {
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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Mail className="mr-3 h-8 w-8 text-indigo-600" />
                        E-Posta Servisi Ayarları
                    </h1>
                    <div className="flex space-x-2">
                        <Button
                            variant={activeTab === 'SETTINGS' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('SETTINGS')}
                        >
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

                {activeTab === 'SETTINGS' && (
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
                                    <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
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
                                            <Button variant="primary" onClick={handleSave}>
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
