import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLMSStore } from '../stores/lmsStore';
import { Course } from '../types';
import { api } from '../api/api';
import { Search, Filter, BookOpen, Clock, Users, Star, ChevronRight, Lock, Award, CheckCircle, FileText, Play, X } from 'lucide-react';
import { DocumentsPage } from './DocumentsPage';
import { Card, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';

const LMS: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { courses, loading, error, fetchCourses } = useLMSStore();
  const [activeTab, setActiveTab] = useState<'courses' | 'documents' | 'exams'>('courses');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  // Exam States
  const [showExamModal, setShowExamModal] = useState(false);
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [examStep, setExamStep] = useState(0); // 0: Start, 1: Questions, 2: Result
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean } | null>(null);

  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    fetchCourses();
    api.lmsExams().then(setExams).catch(console.error);
  }, []);




  const handleStartExam = (exam: any) => {
    setCurrentExam(exam);
    setExamStep(0);
    setExamAnswers({});
    setShowExamModal(true);
  };

  const submitExam = () => {
    if (!currentExam) return;
    let correctCount = 0;
    currentExam.questions.forEach((q: any) => {
      if (examAnswers[q.id] === q.correct) correctCount++;
    });
    const score = (correctCount / currentExam.questions.length) * 100;
    const passed = score >= currentExam.passingScore;

    setExamResult({ score, passed });
    setExamStep(2);

    if (passed && user) {
      const newAchievement = {
        id: Math.random().toString(),
        title: `${currentExam.title} Başarısı`,
        description: 'Sınavı başarıyla tamamladınız.',
        icon: 'Award',
        earned_at: new Date().toISOString(),
        type: 'QUIZ_PASS' as const
      };
      const currentAchievements = user.achievements || [];
      if (!currentAchievements.some(a => a.title === newAchievement.title)) {
        updateUser({ achievements: [...currentAchievements, newAchievement] });
      }
    }
  };

  const categories = [
    { value: 'ALL', label: 'Tüm Kategoriler' },
    { value: 'NETWORKING', label: 'Network' },
    { value: 'SALES', label: 'Satış' },
    { value: 'LEADERSHIP', label: 'Liderlik' },
    { value: 'COMMUNICATION', label: 'İletişim' },
    { value: 'TECHNOLOGY', label: 'Teknoloji' },
    { value: 'OTHER', label: 'Diğer' }
  ];

  const levels = [
    { value: 'ALL', label: 'Tüm Seviyeler' },
    { value: 'BEGINNER', label: 'Başlangıç' },
    { value: 'INTERMEDIATE', label: 'Orta' },
    { value: 'ADVANCED', label: 'İleri' }
  ];

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    if (selectedLevel !== 'ALL') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    // Role Visibility Filter
    if (user) {
      filtered = filtered.filter(course => {
        // If no restrictions, everyone sees it
        if (!course.allowed_roles || course.allowed_roles.length === 0) return true;
        // Otherwise check if user has allowed role
        return course.allowed_roles.includes(user.role);
      });
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, selectedCategory, selectedLevel, user]);

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getLevelLabel = (level: string) => {
    const lvl = levels.find(l => l.value === level);
    return lvl ? lvl.label : level;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Bir hata oluştu</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Eğitim Portalı</h1>
              <p className="mt-2 text-gray-600">Profesyonel gelişiminizi destekleyecek kurslar ve kaynaklar</p>
            </div>
            {/* Buttons removed as per request */}
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mt-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Eğitimler (Kurslar)
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Döküman Merkezi
              </div>
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Sınavlar & Başarım
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* COURSES TAB CONTENT */}
        {activeTab === 'courses' && (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Kurs ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {levels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Course Thumbnail */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-80" />
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                        {getCategoryLabel(course.category)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getLevelLabel(course.level)}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{course.duration} dk</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{course.enrolled_students || 0} öğrenci</span>
                      </div>
                    </div>

                    {course.average_rating && (
                      <div className="flex items-center mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(course.average_rating!)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {course.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-4">
                      <Link to={`/lms/course/${course.id}`} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <span>Eğitime Git</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Eğitim Bulunamadı
                </h3>
                <p className="text-gray-600">
                  Seçtiğiniz kriterlere uygun eğitim bulunmuyor.
                </p>
              </div>
            )}
          </>
        )}

        {/* DOCUMENTS TAB CONTENT */}
        {activeTab === 'documents' && (
          <DocumentsPage embedded={true} />
        )}

        {/* EXAMS TAB CONTENT */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sınavlar</h2>
                <p className="text-gray-500">Bilgilerinizi test edin ve rozetler kazanın.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <Award className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          {exam.duration} Dk
                        </span>
                      </div>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-gray-900">{exam.title}</h3>
                    <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                      {exam.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                      <span>Geçme Notu: %{exam.passingScore}</span>
                      <span>{exam.questions.length} Soru</span>
                    </div>
                    <div className="mt-6">
                      <Button onClick={() => handleStartExam(exam)} className="w-full justify-center">
                        <Play className="h-4 w-4 mr-2" />
                        Sınava Başla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* EXAM MODAL */}
      {
        showExamModal && currentExam && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowExamModal(false)} aria-hidden="true"></div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
                {/* Header */}
                <div className="bg-indigo-600 px-4 py-3 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                    {currentExam.title}
                  </h3>
                  <button onClick={() => setShowExamModal(false)} className="text-indigo-200 hover:text-white">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  {examStep === 0 && (
                    <div className="text-center py-6">
                      <Award className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Hazır mısınız?</h4>
                      <p className="text-gray-500 mb-6">
                        Bu sınavda {currentExam.questions.length} soru bulunmaktadır.
                        Toplam süreniz {currentExam.duration} dakikadır.
                        Başarılar dileriz!
                      </p>
                      <Button onClick={() => setExamStep(1)} size="lg" className="w-full sm:w-auto">
                        Başla
                      </Button>
                    </div>
                  )}

                  {examStep === 1 && (
                    <div className="space-y-8">
                      {currentExam.questions.map((q: any, index: number) => (
                        <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                          <p className="font-medium text-gray-900 mb-3">
                            {index + 1}. {q.text}
                          </p>
                          <div className="space-y-2">
                            {q.options.map((option: string) => (
                              <label key={option} className={`flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${examAnswers[q.id] === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={option}
                                  checked={examAnswers[q.id] === option}
                                  onChange={() => setExamAnswers({ ...examAnswers, [q.id]: option })}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <span className="ml-3 text-sm text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {examStep === 2 && examResult && (
                    <div className="text-center py-6">
                      {examResult.passed ? (
                        <div className="mb-4">
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                          </div>
                          <h4 className="text-2xl font-bold text-gray-900 mb-2">Tebrikler!</h4>
                          <p className="text-green-600 font-medium text-lg">
                            Sınavı Başarıyla Tamamladınız
                          </p>
                          <p className="text-gray-500 mt-2">
                            Puanınız: <span className="font-bold text-gray-900">{examResult.score.toFixed(0)}</span>
                          </p>
                          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 inline-block">
                            <div className="flex items-center text-yellow-800">
                              <Award className="h-5 w-5 mr-2" />
                              <span>Profilinize yeni bir rozet eklendi!</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                            <X className="h-10 w-10 text-red-600" />
                          </div>
                          <h4 className="text-2xl font-bold text-gray-900 mb-2">Başarısız Oldunuz</h4>
                          <p className="text-red-600 font-medium text-lg">
                            Maalesef geçer not alamadınız.
                          </p>
                          <p className="text-gray-500 mt-2">
                            Puanınız: <span className="font-bold text-gray-900">{examResult.score.toFixed(0)}</span>
                            <br />
                            Gerekli Puan: {currentExam.passingScore}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3">
                  {examStep === 1 && (
                    <Button onClick={submitExam} disabled={Object.keys(examAnswers).length !== currentExam.questions.length}>
                      Sınavı Tamamla
                    </Button>
                  )}
                  {examStep === 2 && (
                    <Button onClick={() => setShowExamModal(false)}>
                      Kapat
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default LMS;
