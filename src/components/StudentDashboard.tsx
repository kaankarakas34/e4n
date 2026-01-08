import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLMSStore } from '../stores/lmsStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { ProgressBar } from '../shared/ProgressBar';
import { Course, Enrollment, Lesson } from '../types';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp,
  Calendar,
  CheckCircle,
  PlayCircle,
  ChevronRight,
  Star
} from 'lucide-react';

interface StudentDashboardProps {
  onCourseSelect: (course: Course) => void;
}

export function StudentDashboard({ onCourseSelect }: StudentDashboardProps) {
  const { user } = useAuthStore();
  const { 
    courses, 
    enrollments, 
    lessons,
    fetchCourses,
    fetchEnrollments,
    fetchLessons,
    loading 
  } = useLMSStore();

  const [selectedTab, setSelectedTab] = useState<'current' | 'completed' | 'all'>('current');

  useEffect(() => {
    if (user) {
      fetchEnrollments(user.id);
      fetchCourses();
    }
  }, [fetchEnrollments, fetchCourses, user]);

  const userEnrollments = enrollments.filter(e => e.user_id === user?.id);
  const enrolledCourses = courses.filter(course => 
    userEnrollments.some(e => e.course_id === course.id)
  );

  const currentCourses = enrolledCourses.filter(course => {
    const enrollment = userEnrollments.find(e => e.course_id === course.id);
    return enrollment && enrollment.progress_percentage < 100;
  });

  const completedCourses = enrolledCourses.filter(course => {
    const enrollment = userEnrollments.find(e => e.course_id === course.id);
    return enrollment && enrollment.progress_percentage >= 100;
  });

  const getCourseProgress = (courseId: string) => {
    const enrollment = userEnrollments.find(e => e.course_id === courseId);
    return enrollment?.progress_percentage || 0;
  };

  const getCourseLessons = (courseId: string) => {
    return lessons.filter(lesson => lesson.course_id === courseId);
  };

  const getNextLesson = (courseId: string) => {
    const courseLessons = getCourseLessons(courseId);
    const completedCount = Math.floor((getCourseProgress(courseId) / 100) * courseLessons.length);
    return courseLessons[completedCount] || courseLessons[0];
  };

  const getDisplayCourses = () => {
    switch (selectedTab) {
      case 'current':
        return currentCourses;
      case 'completed':
        return completedCourses;
      case 'all':
        return enrolledCourses;
      default:
        return currentCourses;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} dk`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}sa ${remainingMinutes}dk` : `${hours}sa`;
  };

  const getCategoryColor = (category: Course['category']) => {
    const colors = {
      NETWORKING: 'bg-blue-100 text-blue-800',
      SALES: 'bg-green-100 text-green-800',
      LEADERSHIP: 'bg-purple-100 text-purple-800',
      COMMUNICATION: 'bg-yellow-100 text-yellow-800',
      TECHNOLOGY: 'bg-indigo-100 text-indigo-800',
      OTHER: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level: Course['level']) => {
    const colors = {
      BEGINNER: 'bg-green-100 text-green-800',
      INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
      ADVANCED: 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Henüz Eğitime Kayıtlı Değilsiniz
        </h3>
        <p className="text-gray-600 mb-4">
          Profesyonel gelişiminiz için bir eğitime kaydolun
        </p>
        <Button
          onClick={() => window.location.href = '/lms'}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Eğitimleri Keşfet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Toplam Eğitim</p>
                <p className="text-2xl font-bold text-blue-900">{enrolledCourses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Tamamlanan</p>
                <p className="text-2xl font-bold text-green-900">{completedCourses.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Devam Eden</p>
                <p className="text-2xl font-bold text-yellow-900">{currentCourses.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Sertifika</p>
                <p className="text-2xl font-bold text-purple-900">
                  {completedCourses.filter(c => c.certificate_enabled).length}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'current', label: 'Devam Eden', count: currentCourses.length },
            { key: 'completed', label: 'Tamamlanan', count: completedCourses.length },
            { key: 'all', label: 'Tümü', count: enrolledCourses.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${selectedTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                transition-colors duration-200
              `}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getDisplayCourses().map((course) => {
          const progress = getCourseProgress(course.id);
          const courseLessons = getCourseLessons(course.id);
          const nextLesson = getNextLesson(course.id);
          const enrollment = userEnrollments.find(e => e.course_id === course.id);

          return (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getCategoryColor(course.category)}>
                        {course.category}
                      </Badge>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level}
                      </Badge>
                    </div>
                    {course.average_rating && (
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(course.average_rating!)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-1 text-xs text-gray-600">
                          {course.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-16 h-16 object-cover rounded-md ml-3 flex-shrink-0"
                    />
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        İlerleme
                      </span>
                      <span className="text-sm text-gray-500">
                        {progress}%
                      </span>
                    </div>
                    <ProgressBar 
                      progress={progress} 
                      size="sm"
                      color={progress >= 100 ? 'green' : 'blue'}
                    />
                  </div>

                  {/* Course Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDuration(course.duration)}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {courseLessons.length} ders
                    </div>
                  </div>

                  {/* Next Lesson */}
                  {nextLesson && progress < 100 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Sonraki Ders
                          </p>
                          <p className="text-sm text-gray-900 truncate">
                            {nextLesson.title}
                          </p>
                        </div>
                        <PlayCircle className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  )}

                  {/* Certificate */}
                  {course.certificate_enabled && progress >= 100 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          Sertifika Kazanıldı
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Enrollment Info */}
                  {enrollment && (
                    <div className="text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Kayıt: {new Date(enrollment.enrolled_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => onCourseSelect(course)}
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    {progress >= 100 ? 'İncele' : progress > 0 ? 'Devam Et' : 'Başla'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {getDisplayCourses().length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedTab === 'current' ? 'Devam eden eğitim bulunmuyor' :
             selectedTab === 'completed' ? 'Henüz tamamlanmış eğitim yok' :
             'Henüz eğitime kayıtlı değilsiniz'}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedTab === 'current' ? 'Yeni bir eğitime kaydolun ve öğrenmeye başlayın!' :
             selectedTab === 'completed' ? 'Eğitimleri tamamlayarak sertifikalar kazanın!' :
             'Profesyonel gelişiminiz için bir eğitime kaydolun'}
          </p>
          <Button
            onClick={() => window.location.href = '/lms'}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Eğitimleri Keşfet
          </Button>
        </div>
      )}
    </div>
  );
}
