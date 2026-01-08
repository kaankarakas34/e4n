import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLMSStore } from '../stores/lmsStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Video, FileText, HelpCircle } from 'lucide-react';
import { Course, Lesson } from '../types';

export function AdminCourseEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { courses, fetchCourses, createCourse, updateCourse, lessons, fetchLessons, createLesson, updateLesson, deleteLesson } = useLMSStore();

    const isNew = id === 'new';
    const [courseData, setCourseData] = useState<Partial<Course>>({
        title: '',
        description: '',
        category: 'NETWORKING',
        level: 'BEGINNER',
        status: 'DRAFT',
        thumbnail_url: ''
    });

    // Local lessons state for UI before proper store sync or for new courses
    const [localLessons, setLocalLessons] = useState<Partial<Lesson>[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isNew && id) {
            const existing = courses.find(c => c.id === id);
            if (existing) {
                setCourseData(existing);
                fetchLessons(id);
            } else {
                fetchCourses().then(() => {
                    // retry find? handled by reactive store usually but here dependent on effect
                });
            }
        }
    }, [id, courses, fetchCourses]);

    useEffect(() => {
        if (!isNew && id) {
            setLocalLessons(lessons.filter(l => l.course_id === id));
        }
    }, [lessons, id, isNew]);

    const handleSaveCourse = async () => {
        setIsSaving(true);
        try {
            if (isNew) {
                // For new course, we must create it first to get an ID
                // Then we can add lessons.
                // This logic implies specific flow. 
                // For simplicity: Mock success or use store
                // Note: basic createCourse in store generates ID via mockup usually if no backend
                alert('Yeni kurs oluşturma henüz tam entegre değil (Demo).');
                navigate('/admin/lms');
            } else if (id) {
                await updateCourse(id, courseData);
                alert('Kurs bilgileri güncellendi.');
            }
        } catch (e) {
            console.error(e);
            alert('Hata oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddLesson = () => {
        const newLesson: Partial<Lesson> = {
            id: 'temp-' + Date.now(),
            title: 'Yeni Ders',
            content_type: 'VIDEO',
            duration: 10,
            course_id: id || 'temp'
        };
        setLocalLessons([...localLessons, newLesson]);
        // If not new course, we should probably persist immediately or wait for "Save Lesson"?
        // Usually UX expects "Save Course" to save all, or distinct saves.
        // I'll assume distinct save per lesson for simplicity in this detail view, or just UI manipulation.
        if (!isNew && id) {
            createLesson(newLesson as any, id);
        }
    };

    const handleDeleteLesson = (lessonId: string) => {
        if (confirm('Dersi silmek istediğinize emin misiniz?')) {
            if (!isNew && id && !lessonId.startsWith('temp-')) {
                deleteLesson(lessonId);
            } else {
                setLocalLessons(localLessons.filter(l => l.id !== lessonId));
            }
        }
    };

    const handleUpdateLesson = (lessonId: string, field: string, value: any) => {
        const updated = localLessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l);
        setLocalLessons(updated);
        // Auto-save debounce could be better, but for now explicit save button next to lesson?
        // Or just update store on blur?
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Button variant="ghost" onClick={() => navigate('/admin/lms')} className="mr-4">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isNew ? 'Yeni Kurs Oluştur' : 'Kurs Düzenle'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {isNew ? 'Temel bilgileri ve müfredatı giriniz.' : courseData.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/admin/lms')}>İptal</Button>
                        <Button onClick={handleSaveCourse} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Basic Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Temel Bilgiler</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Başlık</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border rounded-md p-2"
                                        value={courseData.title}
                                        onChange={e => setCourseData({ ...courseData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kategori</label>
                                    <select
                                        className="mt-1 block w-full border rounded-md p-2"
                                        value={courseData.category}
                                        onChange={e => setCourseData({ ...courseData, category: e.target.value as any })}
                                    >
                                        <option value="NETWORKING">Networking</option>
                                        <option value="SALES">Satış</option>
                                        <option value="LEADERSHIP">Liderlik</option>
                                        <option value="COMMUNICATION">İletişim</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Seviye</label>
                                    <select
                                        className="mt-1 block w-full border rounded-md p-2"
                                        value={courseData.level}
                                        onChange={e => setCourseData({ ...courseData, level: e.target.value as any })}
                                    >
                                        <option value="BEGINNER">Başlangıç</option>
                                        <option value="INTERMEDIATE">Orta</option>
                                        <option value="ADVANCED">İleri</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                                    <select
                                        className="mt-1 block w-full border rounded-md p-2"
                                        value={courseData.status}
                                        onChange={e => setCourseData({ ...courseData, status: e.target.value as any })}
                                    >
                                        <option value="DRAFT">Taslak</option>
                                        <option value="PUBLISHED">Yayında</option>
                                        <option value="ARCHIVED">Arşiv</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Görsel URL</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border rounded-md p-2 text-xs"
                                        value={courseData.thumbnail_url || ''}
                                        onChange={e => setCourseData({ ...courseData, thumbnail_url: e.target.value })}
                                    />
                                    {courseData.thumbnail_url && (
                                        <img src={courseData.thumbnail_url} alt="Preview" className="mt-2 h-32 w-full object-cover rounded" />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                                    <textarea
                                        className="mt-1 block w-full border rounded-md p-2"
                                        rows={4}
                                        value={courseData.description}
                                        onChange={e => setCourseData({ ...courseData, description: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Curriculum */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Ders İçeriği (Müfredat)</CardTitle>
                                <Button size="sm" onClick={handleAddLesson} disabled={isNew}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ders Ekle
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {isNew && (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed">
                                        Ders eklemek için önce kursu oluşturmalısınız.
                                    </div>
                                )}
                                {!isNew && localLessons.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        Henüz ders eklenmemiş.
                                    </div>
                                )}
                                {!isNew && localLessons.map((lesson, index) => (
                                    <div key={lesson.id} className="bg-white border rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-2 text-gray-400 cursor-move">
                                                <GripVertical className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 font-medium border-none focus:ring-0 p-0 text-gray-900 placeholder-gray-400"
                                                        placeholder="Ders Başlığı"
                                                        value={lesson.title}
                                                        onChange={(e) => handleUpdateLesson(lesson.id!, 'title', e.target.value)}
                                                    />
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id!)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-1/3">
                                                        <select
                                                            className="w-full text-xs border rounded p-1"
                                                            value={lesson.content_type}
                                                            onChange={(e) => handleUpdateLesson(lesson.id!, 'content_type', e.target.value)}
                                                        >
                                                            <option value="VIDEO">Video</option>
                                                            <option value="TEXT">Metin</option>
                                                            <option value="QUIZ">Quiz</option>
                                                        </select>
                                                    </div>
                                                    <div className="w-1/4">
                                                        <input
                                                            type="number"
                                                            className="w-full text-xs border rounded p-1"
                                                            placeholder="Süre (dk)"
                                                            value={lesson.duration}
                                                            onChange={(e) => handleUpdateLesson(lesson.id!, 'duration', parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    {lesson.content_type === 'VIDEO' && (
                                                        <div className="flex items-center gap-2">
                                                            <Video className="h-4 w-4 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                className="flex-1 text-sm border rounded p-1"
                                                                placeholder="Video URL (Youtube/Vimeo)"
                                                                value={lesson.content_url || ''}
                                                                onChange={(e) => handleUpdateLesson(lesson.id!, 'content_url', e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                    {lesson.content_type === 'TEXT' && (
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-gray-400" />
                                                            <textarea
                                                                className="flex-1 text-sm border rounded p-1"
                                                                placeholder="Ders içeriği metni..."
                                                                rows={2}
                                                                value={lesson.content_text || ''}
                                                                onChange={(e) => handleUpdateLesson(lesson.id!, 'content_text', e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
