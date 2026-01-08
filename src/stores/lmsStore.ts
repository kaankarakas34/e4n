import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course, Lesson, Enrollment, Quiz, CourseReview, CreateCourseFormData, CreateLessonFormData } from '../types';
import { supabase } from '../api/supabase';

interface LMSStore {
  courses: Course[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  reviews: CourseReview[];
  loading: boolean;
  error: string | null;

  // Course operations
  fetchCourses: (chapterId?: string) => Promise<void>;
  fetchCourse: (id: string) => Promise<Course | null>;
  createCourse: (data: CreateCourseFormData, instructorId: string, chapterId: string) => Promise<void>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Lesson operations
  fetchLessons: (courseId: string) => Promise<void>;
  createLesson: (data: CreateLessonFormData, courseId: string) => Promise<void>;
  updateLesson: (id: string, data: Partial<Lesson>) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;

  // Enrollment operations
  fetchEnrollments: (userId: string) => Promise<void>;
  enrollInCourse: (userId: string, courseId: string) => Promise<void>;
  updateProgress: (enrollmentId: string, lessonId: string, progress: number) => Promise<void>;
  completeCourse: (enrollmentId: string) => Promise<void>;

  // Review operations
  fetchReviews: (courseId: string) => Promise<void>;
  createReview: (data: Omit<CourseReview, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

// Mock data
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Profesyonel Network Becerileri',
    description: 'Etkili networking teknikleri ve ilişki kurma stratejileri öğrenin. E4N toplantılarında başarılı olmanın yolları.',
    instructor_id: 'user1',
    chapter_id: 'chapter1',
    category: 'NETWORKING',
    level: 'BEGINNER',
    duration: 180,
    status: 'PUBLISHED',
    thumbnail_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional+networking+skills+course+with+modern+clean+design+featuring+business+people+connecting+in+a+meeting+room&image_size=landscape_16_9',
    certificate_enabled: true,
    created_at: '2024-11-01',
    updated_at: '2024-11-01',
    enrolled_students: 45,
    average_rating: 4.8,
  },
  {
    id: '2',
    title: 'Satış ve İletişim Teknikleri',
    description: 'Etkili satış sunumları, müşteri ilişkileri ve iletişim becerileri geliştirme.',
    instructor_id: 'user2',
    chapter_id: 'chapter1',
    category: 'SALES',
    level: 'INTERMEDIATE',
    duration: 240,
    status: 'PUBLISHED',
    thumbnail_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Sales+and+communication+training+course+with+professional+presenter+and+engaged+audience+in+modern+classroom&image_size=landscape_16_9',
    certificate_enabled: true,
    created_at: '2024-10-15',
    updated_at: '2024-10-15',
    enrolled_students: 32,
    average_rating: 4.6,
  },
  {
    id: '3',
    title: 'Liderlik ve Takım Yönetimi',
    description: 'Etkili liderlik stilleri, takım motivasyonu ve performans yönetimi stratejileri.',
    instructor_id: 'user3',
    chapter_id: 'chapter1',
    category: 'LEADERSHIP',
    level: 'ADVANCED',
    duration: 300,
    status: 'PUBLISHED',
    thumbnail_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Leadership+and+team+management+course+with+confident+leader+guiding+a+diverse+team+in+a+professional+setting&image_size=landscape_16_9',
    certificate_enabled: true,
    created_at: '2024-09-20',
    updated_at: '2024-09-20',
    enrolled_students: 28,
    average_rating: 4.9,
  },
  {
    id: '4',
    title: 'Grup Yönetimi ve Liderlik Stratejileri',
    description: 'Sadece Lider Ekip (Başkan, Bşk. Yrd. ve Sekreter) için özel eğitim.',
    instructor_id: 'user1',
    chapter_id: 'chapter1',
    category: 'LEADERSHIP',
    level: 'ADVANCED',
    duration: 120,
    status: 'PUBLISHED',
    thumbnail_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000',
    certificate_enabled: true,
    created_at: '2024-11-20',
    updated_at: '2024-11-20',
    enrolled_students: 5,
    average_rating: 5.0,
    allowed_roles: ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER', 'ADMIN'],
  },
];

const mockLessons: Lesson[] = [
  {
    id: '1',
    course_id: '1',
    title: 'Networking Temelleri',
    description: 'Profesyonel networkingin temel prensiplerini öğrenin',
    content_type: 'VIDEO',
    content_url: 'https://example.com/video1.mp4',
    duration: 45,
    order_index: 1,
    is_preview: true,
    created_at: '2024-11-01',
    updated_at: '2024-11-01',
  },
  {
    id: '2',
    course_id: '1',
    title: 'İlk İzlenim Stratejileri',
    description: 'İlk buluşmalarda etkili izlenim bırakma teknikleri',
    content_type: 'TEXT',
    content_text: 'İlk izlenim, profesyonel ilişkilerde en önemli faktörlerden biridir...',
    duration: 30,
    order_index: 2,
    is_preview: false,
    created_at: '2024-11-01',
    updated_at: '2024-11-01',
  },
  {
    id: '3',
    course_id: '1',
    title: 'Network Becerileri Quiz',
    description: 'Öğrendiklerinizi test edin',
    content_type: 'QUIZ',
    duration: 15,
    order_index: 3,
    is_preview: false,
    created_at: '2024-11-01',
    updated_at: '2024-11-01',
  },
];

const mockEnrollments: Enrollment[] = [
  {
    id: '1',
    user_id: 'user1',
    course_id: '1',
    status: 'COMPLETED',
    progress_percentage: 100,
    completed_lessons: ['1', '2', '3'],
    enrolled_at: '2024-11-05',
    started_at: '2024-11-05',
    completed_at: '2024-11-10',
    certificate_issued: true,
    certificate_url: 'https://example.com/certificates/1.pdf',
  },
  {
    id: '2',
    user_id: 'user1',
    course_id: '2',
    status: 'IN_PROGRESS',
    progress_percentage: 65,
    completed_lessons: ['1', '2'],
    enrolled_at: '2024-11-15',
    started_at: '2024-11-15',
  },
];

const mockReviews: CourseReview[] = [
  {
    id: '1',
    course_id: '1',
    user_id: 'user1',
    rating: 5,
    title: 'Mükemmel bir eğitim',
    comment: 'Çok faydalı ve uygulanabilir teknikler öğrendim. Herkese tavsiye ederim.',
    would_recommend: true,
    created_at: '2024-11-12',
    updated_at: '2024-11-12',
  },
  {
    id: '2',
    course_id: '1',
    user_id: 'user2',
    rating: 4,
    title: 'İşe yarar içerik',
    comment: 'Networking becerilerimi geliştirmemde çok yardımcı oldu.',
    would_recommend: true,
    created_at: '2024-11-14',
    updated_at: '2024-11-14',
  },
];

export const useLMSStore = create<LMSStore>()(
  persist(
    (set, get) => ({
      courses: mockCourses,
      lessons: mockLessons,
      enrollments: mockEnrollments,
      reviews: mockReviews,
      loading: false,
      error: null,

      // Course operations
      fetchCourses: async (chapterId?: string) => {
        set({ loading: true, error: null });
        try {
          const courses = await import('../api/api').then(m => m.api.lmsGetCourses());
          if (courses && courses.length > 0) {
            set({ courses, loading: false });
          } else {
            set({ courses: mockCourses, loading: false });
          }
        } catch (error) {
          console.error('Error fetching courses:', error);
          set({ courses: mockCourses, loading: false });
        }
      },

      fetchCourse: async (id: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data, error } = await supabase
              .from('courses')
              .select(`
                *,
                instructor:users!instructor_id(*),
                lessons(*)
              `)
              .eq('id', id)
              .single();

            if (error) throw error;
            set({ loading: false });
            return data;
          } else {
            const course = mockCourses.find(c => c.id === id);
            set({ loading: false });
            return course || null;
          }
        } catch (error) {
          console.error('Error fetching course:', error);
          set({ error: 'Eğitim yüklenirken hata oluştu', loading: false });
          return null;
        }
      },

      createCourse: async (data: CreateCourseFormData, instructorId: string, chapterId: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data: course, error } = await supabase
              .from('courses')
              .insert([{
                ...data,
                instructor_id: instructorId,
                chapter_id: chapterId,
                status: 'DRAFT',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }])
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              courses: [course, ...state.courses],
              loading: false,
            }));
          } else {
            const newCourse: Course = {
              id: Date.now().toString(),
              ...data,
              instructor_id: instructorId,
              chapter_id: chapterId,
              status: 'DRAFT',
              created_at: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString().split('T')[0],
              enrolled_students: 0,
              average_rating: 0,
            };

            set(state => ({
              courses: [newCourse, ...state.courses],
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error creating course:', error);
          set({ error: 'Eğitim oluşturulurken hata oluştu', loading: false });
          throw error;
        }
      },

      updateCourse: async (id: string, data: Partial<Course>) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data: course, error } = await supabase
              .from('courses')
              .update({
                ...data,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id)
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              courses: state.courses.map(c => c.id === id ? course : c),
              loading: false,
            }));
          } else {
            set(state => ({
              courses: state.courses.map(c => c.id === id ? { ...c, ...data } : c),
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error updating course:', error);
          set({ error: 'Eğitim güncellenirken hata oluştu', loading: false });
          throw error;
        }
      },

      deleteCourse: async (id: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { error } = await supabase
              .from('courses')
              .delete()
              .eq('id', id);

            if (error) throw error;
          }

          set(state => ({
            courses: state.courses.filter(c => c.id !== id),
            loading: false,
          }));
        } catch (error) {
          console.error('Error deleting course:', error);
          set({ error: 'Eğitim silinirken hata oluştu', loading: false });
          throw error;
        }
      },

      // Lesson operations
      fetchLessons: async (courseId: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data, error } = await supabase
              .from('lessons')
              .select('*')
              .eq('course_id', courseId)
              .order('order_index', { ascending: true });

            if (error) throw error;
            set({ lessons: data || [], loading: false });
          } else {
            const courseLessons = mockLessons.filter(l => l.course_id === courseId);
            set({ lessons: courseLessons, loading: false });
          }
        } catch (error) {
          console.error('Error fetching lessons:', error);
          set({ error: 'Dersler yüklenirken hata oluştu', loading: false });
        }
      },

      createLesson: async (data: CreateLessonFormData, courseId: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data: lesson, error } = await supabase
              .from('lessons')
              .insert([{
                ...data,
                course_id: courseId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }])
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              lessons: [...state.lessons, lesson],
              loading: false,
            }));
          } else {
            const newLesson: Lesson = {
              id: Date.now().toString(),
              ...data,
              course_id: courseId,
              order_index: get().lessons.filter(l => l.course_id === courseId).length + 1,
              created_at: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString().split('T')[0],
            };

            set(state => ({
              lessons: [...state.lessons, newLesson],
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error creating lesson:', error);
          set({ error: 'Ders oluşturulurken hata oluştu', loading: false });
          throw error;
        }
      },

      updateLesson: async (id: string, data: Partial<Lesson>) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data: lesson, error } = await supabase
              .from('lessons')
              .update({
                ...data,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id)
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              lessons: state.lessons.map(l => l.id === id ? lesson : l),
              loading: false,
            }));
          } else {
            set(state => ({
              lessons: state.lessons.map(l => l.id === id ? { ...l, ...data } : l),
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error updating lesson:', error);
          set({ error: 'Ders güncellenirken hata oluştu', loading: false });
          throw error;
        }
      },

      deleteLesson: async (id: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { error } = await supabase
              .from('lessons')
              .delete()
              .eq('id', id);

            if (error) throw error;
          }

          set(state => ({
            lessons: state.lessons.filter(l => l.id !== id),
            loading: false,
          }));
        } catch (error) {
          console.error('Error deleting lesson:', error);
          set({ error: 'Ders silinirken hata oluştu', loading: false });
          throw error;
        }
      },

      // Enrollment operations
      fetchEnrollments: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data, error } = await supabase
              .from('enrollments')
              .select(`
                *,
                course:courses(*),
                user:users(*)
              `)
              .eq('user_id', userId)
              .order('enrolled_at', { ascending: false });

            if (error) throw error;
            set({ enrollments: data || [], loading: false });
          } else {
            const userEnrollments = mockEnrollments.filter(e => e.user_id === userId);
            set({ enrollments: userEnrollments, loading: false });
          }
        } catch (error) {
          console.error('Error fetching enrollments:', error);
          set({ error: 'Kayıtlar yüklenirken hata oluştu', loading: false });
        }
      },

      enrollInCourse: async (userId: string, courseId: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data: enrollment, error } = await supabase
              .from('enrollments')
              .insert([{
                user_id: userId,
                course_id: courseId,
                status: 'ENROLLED',
                progress_percentage: 0,
                completed_lessons: [],
                enrolled_at: new Date().toISOString(),
              }])
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              enrollments: [enrollment, ...state.enrollments],
              loading: false,
            }));
          } else {
            const newEnrollment: Enrollment = {
              id: Date.now().toString(),
              user_id: userId,
              course_id: courseId,
              status: 'ENROLLED',
              progress_percentage: 0,
              completed_lessons: [],
              enrolled_at: new Date().toISOString().split('T')[0],
            };

            set(state => ({
              enrollments: [newEnrollment, ...state.enrollments],
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error enrolling in course:', error);
          set({ error: 'Eğitime kayıt olunurken hata oluştu', loading: false });
          throw error;
        }
      },

      updateProgress: async (enrollmentId: string, lessonId: string, progress: number) => {
        set({ loading: true, error: null });
        try {
          const enrollment = get().enrollments.find(e => e.id === enrollmentId);
          if (!enrollment) throw new Error('Kayıt bulunamadı');

          const completedLessons = enrollment.completed_lessons.includes(lessonId)
            ? enrollment.completed_lessons
            : [...enrollment.completed_lessons, lessonId];

          if (supabase) {
            const { data: updatedEnrollment, error } = await supabase
              .from('enrollments')
              .update({
                progress_percentage: progress,
                completed_lessons: completedLessons,
              })
              .eq('id', enrollmentId)
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              enrollments: state.enrollments.map(e => e.id === enrollmentId ? updatedEnrollment : e),
              loading: false,
            }));
          } else {
            set(state => ({
              enrollments: state.enrollments.map(e => e.id === enrollmentId ? {
                ...e,
                progress_percentage: progress,
                completed_lessons: completedLessons,
              } : e),
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error updating progress:', error);
          set({ error: 'İlerleme güncellenirken hata oluştu', loading: false });
          throw error;
        }
      },

      completeCourse: async (enrollmentId: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data: updatedEnrollment, error } = await supabase
              .from('enrollments')
              .update({
                status: 'COMPLETED',
                completed_at: new Date().toISOString(),
                progress_percentage: 100,
              })
              .eq('id', enrollmentId)
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              enrollments: state.enrollments.map(e => e.id === enrollmentId ? updatedEnrollment : e),
              loading: false,
            }));
          } else {
            set(state => ({
              enrollments: state.enrollments.map(e => e.id === enrollmentId ? {
                ...e,
                status: 'COMPLETED',
                completed_at: new Date().toISOString().split('T')[0],
                progress_percentage: 100,
              } : e),
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error completing course:', error);
          set({ error: 'Eğitim tamamlanırken hata oluştu', loading: false });
          throw error;
        }
      },

      // Review operations
      fetchReviews: async (courseId: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data, error } = await supabase
              .from('course_reviews')
              .select(`
                *,
                user:users(*)
              `)
              .eq('course_id', courseId)
              .order('created_at', { ascending: false });

            if (error) throw error;
            set({ reviews: data || [], loading: false });
          } else {
            const courseReviews = mockReviews.filter(r => r.course_id === courseId);
            set({ reviews: courseReviews, loading: false });
          }
        } catch (error) {
          console.error('Error fetching reviews:', error);
          set({ error: 'Yorumlar yüklenirken hata oluştu', loading: false });
        }
      },

      createReview: async (data: Omit<CourseReview, 'id' | 'created_at' | 'updated_at'>) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data: review, error } = await supabase
              .from('course_reviews')
              .insert([{
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }])
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              reviews: [review, ...state.reviews],
              loading: false,
            }));
          } else {
            const newReview: CourseReview = {
              id: Date.now().toString(),
              ...data,
              created_at: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString().split('T')[0],
            };

            set(state => ({
              reviews: [newReview, ...state.reviews],
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error creating review:', error);
          set({ error: 'Yorum oluşturulurken hata oluştu', loading: false });
          throw error;
        }
      },
    }),
    {
      name: 'lms-store',
      partialize: (state) => ({
        courses: state.courses,
        lessons: state.lessons,
        enrollments: state.enrollments,
        reviews: state.reviews,
      }),
    }
  )
);
