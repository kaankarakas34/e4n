import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLMSStore } from '../stores/lmsStore';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { TextArea } from '../shared/TextArea';
import { Select } from '../shared/Select';
import { Course, CourseFormData } from '../types';
import { X, Upload, Award } from 'lucide-react';

interface CourseFormProps {
  course?: Course;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CourseForm({ course, onClose, onSuccess }: CourseFormProps) {
  const { user } = useAuthStore();
  const { createCourse, updateCourse, loading } = useLMSStore();

  const [formData, setFormData] = useState<CourseFormData>({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || 'OTHER',
    level: course?.level || 'BEGINNER',
    duration: course?.duration || 60,
    certificate_enabled: course?.certificate_enabled || false,
    thumbnail_url: course?.thumbnail_url || '',
    status: course?.status || 'DRAFT'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'NETWORKING', label: 'Network' },
    { value: 'SALES', label: 'Satış' },
    { value: 'LEADERSHIP', label: 'Liderlik' },
    { value: 'COMMUNICATION', label: 'İletişim' },
    { value: 'TECHNOLOGY', label: 'Teknoloji' },
    { value: 'OTHER', label: 'Diğer' }
  ];

  const levels = [
    { value: 'BEGINNER', label: 'Başlangıç' },
    { value: 'INTERMEDIATE', label: 'Orta' },
    { value: 'ADVANCED', label: 'İleri' }
  ];

  const statuses = [
    { value: 'DRAFT', label: 'Taslak' },
    { value: 'PUBLISHED', label: 'Yayında' },
    { value: 'ARCHIVED', label: 'Arşivlendi' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Eğitim başlığı gereklidir';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Eğitim açıklaması gereklidir';
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Süre 0 dan büyük olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload = { ...formData };
      if (course) {
        await updateCourse(course.id, payload);
      } else {
        const instructorId = user?.id || 'user1';
        const chapterId = 'chapter1';
        await createCourse(payload, instructorId, chapterId);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Eğitim kaydetme hatası:', error);
      setErrors({ submit: 'Eğitim kaydedilirken bir hata oluştu' });
    }
  };

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For demo purposes, create a local URL
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, thumbnail_url: imageUrl }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {course ? 'Eğitimi Düzenle' : 'Yeni Eğitim Oluştur'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Temel Bilgiler</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Eğitim Başlığı"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={errors.title}
                  placeholder="Örn: Profesyonel Network Becerileri"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Eğitim Açıklaması"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={errors.description}
                  placeholder="Eğitim hakkında detaylı açıklama..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Select
                  label="Kategori"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  options={categories}
                />
              </div>

              <div>
                <Select
                  label="Seviye"
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  options={levels}
                />
              </div>

              <div>
                <Input
                  label="Süre (dakika)"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  error={errors.duration}
                  placeholder="60"
                  min="1"
                  required
                />
              </div>

              <div>
                <Select
                  label="Durum"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  options={statuses}
                />
              </div>
            </div>
          </div>

          {/* Fiyatlandırma kaldırıldı: Eğitimler ücretsizdir */}

          {/* Certificate */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Sertifika</h3>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="certificate_enabled"
                checked={formData.certificate_enabled}
                onChange={(e) => handleInputChange('certificate_enabled', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="certificate_enabled" className="ml-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Eğitim tamamlama sertifikası ver
                </div>
              </label>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Görsel</h3>

            <div className="flex items-center space-x-4">
              {formData.thumbnail_url && (
                <img
                  src={formData.thumbnail_url}
                  alt="Eğitim görseli"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}

              <div>
                <input
                  type="file"
                  id="thumbnail"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('thumbnail')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2 inline" />
                  Görsel Yükle
                </Button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
              <p className="text-sm text-indigo-700">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : (course ? 'Güncelle' : 'Oluştur')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
