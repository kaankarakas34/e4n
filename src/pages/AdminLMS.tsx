import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLMSStore } from '../stores/lmsStore';
import { Card, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { Edit, Trash2, Plus, BookOpen, Video, FileText, CheckCircle, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';

export function AdminLMS() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { courses, fetchCourses, deleteCourse } = useLMSStore();

    const [activeTab, setActiveTab] = useState<'courses' | 'documents' | 'exams'>('courses');

    // Document State (Mock)
    const [docs, setDocs] = useState<any[]>([]);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);

    // Exam State
    const [exams, setExams] = useState<any[]>([]);

    useEffect(() => {
        fetchCourses();
        api.lmsExams().then(setExams).catch(console.error);
        setDocs([
            { id: '1', title: 'Liderlik El Kitabı.pdf', type: 'PDF', created_at: '2024-11-01' },
            { id: '2', title: 'Toplantı Kuralları.docx', type: 'DOCX', created_at: '2024-11-05' }
        ]);
    }, [fetchCourses]);

    if (!user || user.role !== 'ADMIN') return <div className="p-8">Erişim Kısıtlı</div>;

    const handleDeleteExam = async (id: string) => {
        if (confirm('Sınavı silmek istediğinize emin misiniz?')) {
            await api.lmsDeleteExam(id);
            const data = await api.lmsExams();
            setExams(data);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Eğitim Yönetim Merkezi</h1>

                {/* Tabs */}
                <div className="flex space-x-4 mb-8 border-b">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`pb-4 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <BookOpen className="w-5 h-5" />
                        Eğitimler
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`pb-4 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText className="w-5 h-5" />
                        Dökümanlar
                    </button>
                    <button
                        onClick={() => setActiveTab('exams')}
                        className={`pb-4 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Award className="w-5 h-5" />
                        Sınavlar
                    </button>
                </div>

                {/* CONTENT */}
                {activeTab === 'courses' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={() => navigate('/admin/lms/course/new')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Yeni Kurs Ekle
                            </Button>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kurs</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {courses.map(course => (
                                        <tr key={course.id}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-16 bg-gray-200 rounded overflow-hidden mr-3">
                                                        {course.thumbnail_url && <img src={course.thumbnail_url} className="h-full w-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{course.title}</div>
                                                        <div className="text-xs text-gray-500">{course.description ? course.description.substring(0, 50) + '...' : ''}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {course.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${course.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/lms/course/${course.id}`)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => { if (confirm('Sil?')) deleteCourse(course.id); }}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">Henüz kurs bulunmuyor.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={() => setIsDocModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Döküman Yükle
                            </Button>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosya Adı</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tür</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yüklenme Tarihi</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {docs.map(doc => (
                                        <tr key={doc.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{doc.title}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{doc.type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{doc.created_at}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="ghost" onClick={() => { if (confirm('Sil?')) setDocs(docs.filter(d => d.id !== doc.id)); }}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'exams' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-sm text-gray-500">
                                Detaylı sınav düzenleme ve soru ekleme ekranı için <span className="font-semibold text-indigo-600 cursor-pointer" onClick={() => navigate('/admin/exams')}>Yönetim Paneline</span> gidebilirsiniz.
                            </div>
                            <Button onClick={() => navigate('/admin/exams')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Sınav Oluştur
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.map(exam => (
                                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <Award className="h-8 w-8 text-indigo-500" />
                                            <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded">
                                                {exam.duration} Dk
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1">{exam.title}</h3>
                                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{exam.description}</p>
                                        <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2">
                                            <span>{exam.questions?.length || 0} Soru</span>
                                            <span>Geçme: %{exam.passingScore}</span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <Button size="sm" variant="outline" className="w-full" onClick={() => navigate('/admin/exams')}>
                                                <Edit className="w-3 h-3 mr-1" /> Düzenle
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600 w-full" onClick={() => handleDeleteExam(exam.id)}>
                                                <Trash2 className="w-3 h-3 mr-1" /> Sil
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {exams.length === 0 && (
                                <div className="col-span-3 text-center py-12 bg-white rounded border border-dashed text-gray-500">
                                    Sınav bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Doc Modal */}
            <Modal open={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="Yeni Döküman Yükle">
                <div className="p-4 space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                        <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Dosyayı buraya sürükleyin veya seçin</p>
                        <Button size="sm" variant="outline" className="mt-2">Dosya Seç</Button>
                    </div>
                    <input type="text" placeholder="Döküman Adı (Opsiyonel)" className="border rounded p-2 text-sm w-full" />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setIsDocModalOpen(false)}>İptal</Button>
                        <Button onClick={() => { alert('Demo: Yüklendi'); setIsDocModalOpen(false); }}>Yükle</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
