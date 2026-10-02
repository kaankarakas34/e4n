
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/api';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { Badge } from '../shared/Badge';

function formatProfessionDate(value: unknown) {
    if (typeof value !== 'string' || !value.trim()) return 'Tarih bilgisi yok';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString('tr-TR') : 'Tarih bilgisi yok';
}

export function AdminProfessions() {
    const [professions, setProfessions] = useState<any[]>([]);
    const [pendingProfessions, setPendingProfessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const loadVersion = useRef(0);
    const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');

    // Search state for approved list
    const [search, setSearch] = useState('');

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        category: ''
    });

    useEffect(() => {
        fetchData();
        return () => { loadVersion.current += 1; };
    }, [search, activeTab]);

    const fetchData = async () => {
        const version = ++loadVersion.current;
        setLoading(true);
        setLoadError(null);
        try {
            const data = await api.getProfessions(activeTab === 'approved' ? search : '');
            if (!Array.isArray(data)) throw new Error('Invalid profession list response');
            if (version !== loadVersion.current) return;
            setProfessions(data.filter((p: any) => p.status === 'APPROVED' || !p.status));
            setPendingProfessions(data.filter((p: any) => p.status === 'PENDING'));
        } catch (error) {
            if (version === loadVersion.current) {
                console.error(error);
                setLoadError('Meslekler yüklenemedi. Tekrar deneyin.');
            }
        } finally {
            if (version === loadVersion.current) setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editId) {
                await api.updateProfession(editId, form);
            } else {
                await api.createProfession({ ...form, status: 'APPROVED' });
            }
            setForm({ name: '', category: '' });
            setIsEditing(false);
            setEditId(null);
            fetchData();
        } catch (error) {
            alert('İşlem başarısız');
        }
    };

    const handleEdit = (prof: any) => {
        setForm({ name: prof.name, category: prof.category || '' });
        setEditId(prof.id);
        setIsEditing(true);
        // Switch to form view if needed, but form is always visible
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu mesleği silmek istediğinize emin misiniz?')) return;
        try {
            await api.deleteProfession(id);
            fetchData();
        } catch (error) {
            alert('Silme başarısız');
        }
    };

    const handleApprove = async (prof: any) => {
        try {
            await api.updateProfession(prof.id, {
                name: prof.name,
                category: prof.category || 'Genel',
                status: 'APPROVED'
            });
            fetchData();
        } catch (error) {
            alert('Onaylama başarısız');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Meslek Grupları Yönetimi</h1>

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-gray-200">
                    <button
                        className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'approved'
                                ? 'border-fuchsia-600 text-fuchsia-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('approved')}
                    >
                        Onaylı Liste
                    </button>
                    <button
                        className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'pending'
                                ? 'border-fuchsia-600 text-fuchsia-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Talepler ({loading || loadError ? '—' : pendingProfessions.length})
                    </button>
                </div>

                {loading && <div role="status">Meslekler yükleniyor…</div>}
                {loadError && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                        <p>{loadError}</p>
                        <Button variant="outline" onClick={() => fetchData()}>Tekrar dene</Button>
                    </div>
                )}

                {activeTab === 'approved' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{isEditing ? 'Meslek Düzenle' : 'Yeni Meslek Ekle'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <fieldset disabled={loading || !!loadError} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium">Meslek Adı</label>
                                        <Input
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            required
                                            placeholder="Örn: Avukat"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Kategori / Sektör</label>
                                        <Input
                                            value={form.category}
                                            onChange={e => setForm({ ...form, category: e.target.value })}
                                            placeholder="Örn: Hukuk"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">
                                            {isEditing ? 'Güncelle' : 'Ekle'}
                                        </Button>
                                        {isEditing && (
                                            <Button type="button" variant="outline" onClick={() => {
                                                setIsEditing(false);
                                                setForm({ name: '', category: '' });
                                            }}>İptal</Button>
                                        )}
                                    </div>
                                    </fieldset>
                                </form>
                            </CardContent>
                        </Card>

                        {/* List */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Meslek Listesi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <Input
                                        placeholder="Ara..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>

                                {!loading && !loadError && <div className="max-h-[500px] overflow-y-auto space-y-2">
                                    {professions.map(prof => (
                                        <div key={prof.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm">
                                            <div>
                                                <div className="font-medium">{prof.name}</div>
                                                <div className="text-xs text-gray-500">{prof.category}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(prof)}>
                                                    <Edit className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(prof.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {professions.length === 0 && <div className="text-center text-gray-500 py-4">Sonuç yok</div>}
                                </div>}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {!loading && !loadError && activeTab === 'pending' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Bekleyen Meslek Talepleri</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingProfessions.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        Bekleyen talep yok.
                                    </div>
                                )}
                                {pendingProfessions.map(prof => (
                                    <div key={prof.id} className="flex items-center justify-between p-4 bg-white border border-yellow-200 rounded-lg shadow-sm">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Talep</Badge>
                                                <span className="font-bold text-lg">{prof.name}</span>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Kategori: {prof.category || 'Belirtilmemiş'} • Kayıt Tarihi: {formatProfessionDate(prof.created_at)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={() => handleApprove(prof)}
                                                className="bg-green-600 hover:bg-green-700 text-white flex gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Onayla
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDelete(prof.id)}
                                                className="text-red-600 border-red-200 hover:bg-red-50 flex gap-2"
                                            >
                                                <X className="w-4 h-4" /> Reddet
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
}
