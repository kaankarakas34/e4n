import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLMSStore } from '../stores/lmsStore';
import { ExamRunner } from '../components/lms/ExamRunner';
import { Button } from '../shared/Button';
import { Card, CardContent } from '../shared/Card';
import { PlayCircle, CheckCircle, Lock, ChevronLeft, FileText } from 'lucide-react';

export function CourseViewer() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { courses, fetchCourses } = useLMSStore();
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [showExam, setShowExam] = useState(false);

    useEffect(() => {
        if (courses.length === 0) fetchCourses();
    }, [fetchCourses, courses.length]);

    const course = courses.find(c => c.id === id);

    if (!course) {
        return <div className="p-8 text-center">Eğitim bulunamadı.</div>;
    }

    // Mock lessons if not present
    const lessons = course.lessons || [
        { id: 'l1', title: 'Giriş ve Temeller', duration: 10, content_type: 'VIDEO', is_preview: true },
        { id: 'l2', title: 'İleri Teknikler', duration: 15, content_type: 'TEXT', is_preview: false },
        { id: 'l3', title: 'Örnek Senaryolar', duration: 20, content_type: 'VIDEO', is_preview: false },
    ];

    // Mock Quiz
    const mockQuiz = {
        id: 'q1',
        lesson_id: 'final',
        title: 'Final Sınavı',
        passing_score: 70,
        max_attempts: 3,
        randomize_questions: true,
        show_correct_answers: false,
        created_at: '',
        updated_at: '',
        questions: [
            { id: '1', quiz_id: 'q1', points: 25, question_text: 'E4N açılımı nedir?', correct_answer: 'Event 4 Network', options: ['Event 4 Network', 'Event For Network', 'Elite 4 Network'], type: 'MULTIPLE_CHOICE', order_index: 0 },
            { id: '2', quiz_id: 'q1', points: 25, question_text: 'Toplantılar hangi gün yapılır?', correct_answer: 'Salı', options: ['Pazartesi', 'Salı', 'Cuma'], type: 'MULTIPLE_CHOICE', order_index: 1 },
            { id: '3', quiz_id: 'q1', points: 25, question_text: 'Dayanışma Prensibi ne demektir?', correct_answer: 'Birlikte Kazanma İlkesi', options: ['Al ve Kaç', 'Birlikte Kazanma İlkesi', 'Sadece Kazan'], type: 'MULTIPLE_CHOICE', order_index: 2 },
            { id: '4', quiz_id: 'q1', points: 25, question_text: 'Bir üye kaç toplantıya katılmazsa üyeliği tehlikeye girer?', correct_answer: '3', options: ['1', '3', '5'], type: 'MULTIPLE_CHOICE', order_index: 3 },
        ]
    };

    const handleLessonSelect = (lessonId: string) => {
        setActiveLessonId(lessonId);
        setShowExam(false);
    };

    const activeLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/lms')} className="mr-4">
                        <ChevronLeft className="h-5 w-5" />
                        Geri
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
                </div>
                <div className="text-sm text-gray-500">
                    %0 Tamamlandı
                </div>
            </div>

            <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
                {/* Sidebar */}
                <div className="w-80 flex-shrink-0">
                    <Card>
                        <CardContent className="p-0">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Ders İçeriği</h3>
                            </div>
                            <div className="divide-y">
                                {lessons.map((lesson, idx) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => handleLessonSelect(lesson.id)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 flex items-center gap-3 transition-colors ${activeLessonId === lesson.id && !showExam ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                            }`}
                                    >
                                        {idx === 0 ? <CheckCircle className="h-5 w-5 text-green-500" /> : <PlayCircle className="h-5 w-5 text-gray-400" />}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{idx + 1}. {lesson.title}</p>
                                            <p className="text-xs text-gray-500">{lesson.duration} dk</p>
                                        </div>
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowExam(true)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 flex items-center gap-3 transition-colors ${showExam ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                        }`}
                                >
                                    <FileText className="h-5 w-5 text-indigo-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Final Sınavı</p>
                                        <p className="text-xs text-gray-500">70 Puan Gerekli</p>
                                    </div>
                                    <LocksIcon />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {showExam ? (
                        // @ts-ignore - Mock data types slightly off, ignoring for demo
                        <ExamRunner
                            quiz={mockQuiz as any}
                            onCancel={() => setShowExam(false)}
                            onComplete={(score, passed) => {
                                console.log('Exam completed', score, passed);
                            }}
                        />
                    ) : (
                        <Card className="h-full min-h-[500px]">
                            <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center">
                                <div className="bg-gray-100 p-8 rounded-full mb-6">
                                    <PlayCircle className="h-16 w-16 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeLesson.title}</h2>
                                <p className="text-gray-500 max-w-md mb-8">
                                    Bu alanda ders videosu veya metin içeriği yer alacak.
                                    LMS tam entegrasyonu sağlandığında buraya video player gelecektir.
                                </p>
                                <Button onClick={() => setShowExam(true)}>
                                    Dersi Tamamla ve İlerle
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function LocksIcon() {
    return <Lock className="h-4 w-4 text-gray-300" />;
}
