import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLMSStore } from '../stores/lmsStore';
import { Button } from '../shared/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Input } from '../shared/Input';
import { TextArea } from '../shared/TextArea';
import { Select } from '../shared/Select';
import { Badge } from '../shared/Badge';
import { Course, Lesson } from '../types';
import {
  Plus,
  Edit,
  Trash2,
  PlayCircle,
  FileText,
  Link,
  Upload,
  Eye,
  Clock,
  CheckCircle,
  BookOpen,
  X
} from 'lucide-react';

type LessonType = Lesson['content_type'];

interface LessonManagerProps {
  course: Course;
  onClose: () => void;
}

interface LessonFormData {
  title: string;
  description: string;
  content_type: LessonType;
  content_text: string;
  content_url?: string;
  duration: number;
  order_index: number;
  is_preview: boolean;
}

export function LessonManager({ course, onClose }: LessonManagerProps) {
  const { user } = useAuthStore();
  const {
    lessons,
    loading,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson
  } = useLMSStore();

  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    content_type: 'VIDEO',
    content_text: '',
    content_url: '',
    duration: 30,
    order_index: 1,
    is_preview: false
  });

  const courseLessons = lessons.filter(lesson => lesson.course_id === course.id);

  const lessonTypes: { value: LessonType; label: string; icon: any }[] = [
    { value: 'VIDEO', label: 'Video', icon: PlayCircle },
    { value: 'TEXT', label: 'Metin', icon: FileText },
    { value: 'DOCUMENT', label: 'Doküman', icon: FileText },
    { value: 'PRESENTATION', label: 'Sunum', icon: Eye }
  ];

  useEffect(() => {
    fetchLessons(course.id);
  }, [fetchLessons, course.id]);

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonFormData.title.trim()) {
      return;
    }

    try {
      if (editingLesson) {
        // @ts-ignore
        await updateLesson(editingLesson.id, lessonFormData);
      } else {
        await createLesson({
          title: lessonFormData.title,
          description: lessonFormData.description,
          content_type: lessonFormData.content_type,
          content_text: lessonFormData.content_text,
          content_url: lessonFormData.content_url,
          duration: lessonFormData.duration,
          is_preview: lessonFormData.is_preview
        }, course.id);
      }

      setShowLessonForm(false);
      setEditingLesson(null);
      resetForm();
      fetchLessons(course.id);
    } catch (error) {
      console.error('Ders kaydetme hatası:', error);
    }
  };

  const resetForm = () => {
    setLessonFormData({
      title: '',
      description: '',
      content_type: 'VIDEO',
      content_text: '',
      content_url: '',
      duration: 30,
      order_index: courseLessons.length + 1,
      is_preview: false
    });
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonFormData({
      title: lesson.title,
      description: lesson.description,
      content_type: lesson.content_type,
      content_text: lesson.content_text || '',
      content_url: lesson.content_url || '',
      duration: lesson.duration,
      order_index: lesson.order_index,
      is_preview: lesson.is_preview
    });
    setShowLessonForm(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Bu dersi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await deleteLesson(lessonId);
      fetchLessons(course.id);
    } catch (error) {
      console.error('Ders silme hatası:', error);
    }
  };

  const getLessonIcon = (type: LessonType) => {
    const typeConfig = lessonTypes.find(t => t.value === type);
    const Icon = typeConfig?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  const getLessonTypeColor = (type: LessonType) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-100 text-blue-800';
      case 'TEXT':
        return 'bg-green-100 text-green-800';
      case 'DOCUMENT':
        return 'bg-purple-100 text-purple-800';
      case 'PRESENTATION':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showLessonForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingLesson ? 'Dersi Düzenle' : 'Yeni Ders Oluştur'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowLessonForm(false);
                setEditingLesson(null);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmitLesson} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Ders Başlığı"
                  value={lessonFormData.title}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Örn: Network Temelleri"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Ders Açıklaması"
                  value={lessonFormData.description}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ders hakkında kısa açıklama..."
                  rows={3}
                />
              </div>

              <div>
                <Select
                  label="Ders Türü"
                  value={lessonFormData.content_type}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, content_type: e.target.value as LessonType }))}
                  options={lessonTypes}
                />
              </div>

// ... (duration and order inputs omitted from replacement for brevity, assuming context match works)
              // Actually I need to match a block. 
              // I will target the select and content fields.
              <div>
                <Input
                  label="Süre (dakika)"
                  type="number"
                  value={lessonFormData.duration}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  min="1"
                  required
                />
              </div>

              <div>
                <Input
                  label="Sıra Numarası"
                  type="number"
                  value={lessonFormData.order_index}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) }))}
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_preview"
                  checked={lessonFormData.is_preview}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, is_preview: e.target.checked }))}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="is_preview" className="ml-2 text-sm text-gray-700">
                  Önizleme olarak göster
                </label>
              </div>
            </div>

            {/* Content based on lesson type */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">İçerik</h3>

              {lessonFormData.content_type === 'VIDEO' && (
                <div>
                  <Input
                    label="Video URL"
                    value={lessonFormData.content_url || ''}
                    onChange={(e) => setLessonFormData(prev => ({ ...prev, content_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=... veya video dosyası URL'si"
                  />
                </div>
              )}

              {lessonFormData.content_type === 'TEXT' && (
                <div>
                  <TextArea
                    label="Metin İçeriği"
                    value={lessonFormData.content_text || ''}
                    onChange={(e) => setLessonFormData(prev => ({ ...prev, content_text: e.target.value }))}
                    placeholder="Ders metnini buraya yazın..."
                    rows={8}
                  />
                </div>
              )}

              {lessonFormData.content_type === 'DOCUMENT' && (
                <div>
                  <Input
                    label="Doküman URL"
                    value={lessonFormData.content_url || ''}
                    onChange={(e) => setLessonFormData(prev => ({ ...prev, content_url: e.target.value }))}
                    placeholder="PDF, Word, PowerPoint vb. doküman URL'si"
                  />
                </div>
              )}

              {lessonFormData.content_type === 'PRESENTATION' && (
                <div>
                  <Input
                    label="Sunum URL"
                    value={lessonFormData.content_url || ''}
                    onChange={(e) => setLessonFormData(prev => ({ ...prev, content_url: e.target.value }))}
                    placeholder="Sunum URL'si"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLessonForm(false);
                  setEditingLesson(null);
                  resetForm();
                }}
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (editingLesson ? 'Güncelle' : 'Oluştur')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {course.title} - Ders Yönetimi
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Eğitim içeriğini düzenleyin ve yeni dersler ekleyin
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <BookOpen className="h-4 w-4 mr-1" />
                {courseLessons.length} ders
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {courseLessons.reduce((total, lesson) => total + lesson.duration, 0)} dk toplam süre
              </div>
            </div>
            <Button
              onClick={() => setShowLessonForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ders
            </Button>
          </div>

          {courseLessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz ders yok
              </h3>
              <p className="text-gray-600 mb-4">
                Bu eğitime ilk dersinizi ekleyin
              </p>
              <Button
                onClick={() => setShowLessonForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                İlk Dersi Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {courseLessons
                .sort((a, b) => a.order_index - b.order_index)
                .map((lesson) => (
                  <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <Badge className={getLessonTypeColor(lesson.content_type)}>
                              {getLessonIcon(lesson.content_type)}
                            </Badge>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {lesson.title}
                              </h3>
                              {lesson.is_preview && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Önizleme
                                </Badge>
                              )}
                            </div>

                            {lesson.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {lesson.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {lesson.duration} dk
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs font-medium">
                                  {lessonTypes.find(t => t.value === lesson.content_type)?.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLesson(lesson)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
