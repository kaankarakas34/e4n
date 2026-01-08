import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { FileText, Download, Trash2, Upload, Search, File } from 'lucide-react';
import type { Document } from '../types';

export function DocumentsPage({ embedded = false }: { embedded?: boolean }) {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRESIDENT'; // Admins or Presidents can upload

    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Upload Form State
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        category: 'GENERAL',
        url: '#', // Mock URL
        file_type: 'PDF',
        allowed_roles: [] as string[]
    });

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const docs = await api.getDocuments();
            let visibleDocs = docs;
            if (user?.role !== 'ADMIN') {
                visibleDocs = docs.filter(doc => {
                    if (doc.uploaded_by === user?.id) return true;
                    if (!doc.allowed_roles || doc.allowed_roles.length === 0) return true;
                    if (user?.role && doc.allowed_roles.includes(user.role)) return true;
                    return false;
                });
            }
            setDocuments(visibleDocs);
        } catch (e) {
            console.error('Failed to load docs', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            await api.uploadDocument({
                ...uploadForm,
                uploaded_by: user.id,
                uploader: user
            });
            setShowUploadModal(false);
            setUploadForm({ title: '', description: '', category: 'GENERAL', url: '#', file_type: 'PDF', allowed_roles: [] });
            loadDocuments();
            alert('Doküman başarıyla yüklendi.');
        } catch (error) {
            alert('Yükleme sırasında hata oluştu.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return;
        try {
            await api.deleteDocument(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
        } catch (e) {
            alert('Silme işlemi başarısız.');
        }
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = [
        { id: 'ALL', label: 'Tümü' },
        { id: 'GENERAL', label: 'Genel' },
        { id: 'EDUCATION', label: 'Eğitim' },
        { id: 'LEGAL', label: 'Hukuki' },
        { id: 'MARKETING', label: 'Pazarlama' },
    ];

    return (
        <div className={embedded ? "p-0" : "min-h-screen bg-gray-50 p-6"}>
            <div className={embedded ? "" : "max-w-7xl mx-auto"}>
                {!embedded && (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Doküman Merkezi</h1>
                            <p className="text-gray-500 mt-1">Eğitim materyalleri, sözleşmeler ve rehberler.</p>
                        </div>
                        {isAdmin && (
                            <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                                <Upload className="h-4 w-4" />
                                Doküman Yükle
                            </Button>
                        )}
                    </div>
                )}

                {embedded && (
                    <div className="flex justify-end mb-4">
                        {isAdmin && (
                            <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                                <Upload className="h-4 w-4" />
                                Doküman Yükle
                            </Button>
                        )}
                    </div>
                )}

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Doküman ara..."
                                className="pl-10 w-full rounded-md border border-gray-300 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoryFilter(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === cat.id
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocs.map(doc => (
                        <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-gray-900 font-semibold truncate component-title" title={doc.title}>{doc.title}</h3>
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                                                {categories.find(c => c.id === doc.category)?.label || doc.category}
                                            </span>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="İndir">
                                                <Download className="h-4 w-4 text-gray-500 hover:text-indigo-600" />
                                            </Button>
                                            {isAdmin && (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Sil" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}>
                                                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.description || 'Açıklama yok.'}</p>
                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                        <span>{new Date(doc.created_at).toLocaleDateString('tr-TR')}</span>
                                        <span className="uppercase">{doc.file_type}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {loading && <div className="text-center py-10 text-gray-500">Yükleniyor...</div>}
                {!loading && filteredDocs.length === 0 && (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        <File className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                        <p>Doküman bulunamadı.</p>
                    </div>
                )}

                {/* Upload Modal (In-page basic modal for simplicity) */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Yeni Doküman Yükle</h2>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={uploadForm.title}
                                        onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                    <textarea
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        rows={3}
                                        value={uploadForm.description}
                                        onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={uploadForm.category}
                                        onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                                    >
                                        <option value="GENERAL">Genel</option>
                                        <option value="EDUCATION">Eğitim</option>
                                        <option value="LEGAL">Hukuki</option>
                                        <option value="MARKETING">Pazarlama</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Görünürlük (Boş bırakılırsa herkes görür)</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'PRESIDENT', label: 'Başkan' },
                                            { id: 'VICE_PRESIDENT', label: 'Başkan Yrd.' },
                                            { id: 'MEMBER', label: 'Üyeler' },
                                        ].map(role => (
                                            <label key={role.id} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                                                <input
                                                    type="checkbox"
                                                    checked={uploadForm.allowed_roles.includes(role.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setUploadForm(prev => ({
                                                            ...prev,
                                                            allowed_roles: checked
                                                                ? [...prev.allowed_roles, role.id]
                                                                : prev.allowed_roles.filter(r => r !== role.id)
                                                        }));
                                                    }}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">{role.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)}>İptal</Button>
                                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Yükle</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
