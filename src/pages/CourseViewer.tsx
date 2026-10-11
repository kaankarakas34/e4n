import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamRunner, ExamRunnerExam, ExamRunnerResult } from '../components/lms/ExamRunner';
import { api } from '../api/api';
import { Button } from '../shared/Button';
import { Card, CardContent } from '../shared/Card';
import { PlayCircle, ChevronLeft, FileText, Video, Award, RefreshCw } from 'lucide-react';

interface LmsMaterial { id: string; type: 'doc' | 'video'; title: string; url: string }
interface LmsLesson { id: string; title: string; order_index: number; materials: LmsMaterial[] }
interface LmsCourse { id: string; title: string; description?: string; is_enrolled?: number }
interface LmsExam extends ExamRunnerExam { duration_minutes?: number }

const safeUrl = (url: string) => /^https?:\/\//i.test(url) ? url : undefined;

export function CourseViewer() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<LmsCourse | null>(null);
    const [lessons, setLessons] = useState<LmsLesson[]>([]);
    const [exams, setExams] = useState<LmsExam[]>([]);
    const [enrolled, setEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [activeExamId, setActiveExamId] = useState<string | null>(null);

    const load = useCallback(async (signal: { stale: boolean }) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [detail, lessonRows, examRows, courseRows] = await Promise.all([
                api.lmsCourseDetail(id),
                api.lmsCourseLessons(id),
                api.lmsCourseExams(id),
                api.lmsCourses(),
            ]);
            if (signal.stale) return;
            setCourse(detail);
            setLessons(Array.isArray(lessonRows) ? lessonRows : []);
            setExams(Array.isArray(examRows) ? examRows : []);
            const listed = Array.isArray(courseRows) ? courseRows.find((c: LmsCourse) => c.id === id) : null;
            setEnrolled(Boolean(listed?.is_enrolled));
        } catch {
            if (!signal.stale) setError('Eğitim yüklenemedi.');
        } finally {
            if (!signal.stale) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const signal = { stale: false };
        void load(signal);
        return () => { signal.stale = true; };
    }, [load]);

    const handleEnroll = async () => {
        if (!id) return;
        try {
            await api.lmsEnrollCourse(id);
            setEnrolled(true);
        } catch {
            setError('Kayıt işlemi tamamlanamadı.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    if (error || !course) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-gray-700">{error || 'Eğitim bulunamadı.'}</p>
                <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={() => navigate('/lms')}>Eğitimlere Dön</Button>
                    <Button onClick={() => void load({ stale: false })}><RefreshCw className="h-4 w-4 mr-2" />Tekrar Dene</Button>
                </div>
            </div>
        );
    }

    const activeLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];
    const activeExam = exams.find(e => e.id === activeExamId) || null;

    const submitAttempt = async (answers: Record<string, string>): Promise<ExamRunnerResult> => {
        if (!activeExam) throw new Error('No active exam');
        const res = await api.lmsSubmitAttempt(activeExam.id, { answers });
        return { score: Number(res.score), passed: Boolean(res.passed), pass_score: Number(res.pass_score) };
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/lms')} className="mr-4">
                        <ChevronLeft className="h-5 w-5" />
                        Geri
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
                </div>
                {enrolled
                    ? <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">Kayıtlısınız</span>
                    : <Button size="sm" onClick={() => void handleEnroll()}>Eğitime Kaydol</Button>}
            </div>

            <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-6 gap-6">
                <div className="md:w-80 flex-shrink-0">
                    <Card>
                        <CardContent className="p-0">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Ders İçeriği</h3>
                            </div>
                            <div className="divide-y">
                                {lessons.length === 0 && <p className="p-4 text-sm text-gray-500">Henüz ders eklenmemiş.</p>}
                                {lessons.map((lesson, idx) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => { setActiveLessonId(lesson.id); setActiveExamId(null); }}
                                        className={`w-full text-left p-4 hover:bg-gray-50 flex items-center gap-3 transition-colors ${!activeExam && activeLesson?.id === lesson.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                                    >
                                        <PlayCircle className="h-5 w-5 text-gray-400" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{idx + 1}. {lesson.title}</p>
                                            <p className="text-xs text-gray-500">{lesson.materials?.length || 0} materyal</p>
                                        </div>
                                    </button>
                                ))}
                                {exams.map(exam => (
                                    <button
                                        key={exam.id}
                                        onClick={() => setActiveExamId(exam.id)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 flex items-center gap-3 transition-colors ${activeExam?.id === exam.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                                    >
                                        <Award className="h-5 w-5 text-indigo-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{exam.title}</p>
                                            <p className="text-xs text-gray-500">{exam.pass_score} Puan Gerekli</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex-1">
                    {activeExam ? (
                        <ExamRunner
                            key={activeExam.id}
                            exam={activeExam}
                            onSubmit={submitAttempt}
                            onCancel={() => setActiveExamId(null)}
                            onComplete={() => setActiveExamId(null)}
                        />
                    ) : activeLesson ? (
                        <Card className="min-h-[400px]">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeLesson.title}</h2>
                                {course.description && <p className="text-gray-500 mb-6">{course.description}</p>}
                                {(activeLesson.materials || []).length === 0 ? (
                                    <p className="text-gray-500">Bu derste henüz materyal yok.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {activeLesson.materials.map(m => {
                                            const href = safeUrl(m.url);
                                            return (
                                                <li key={m.id} className="flex items-center gap-3 p-4 border rounded-lg">
                                                    {m.type === 'video' ? <Video className="h-5 w-5 text-indigo-600" /> : <FileText className="h-5 w-5 text-indigo-600" />}
                                                    <span className="flex-1 text-gray-800">{m.title}</span>
                                                    {href
                                                        ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{m.type === 'video' ? 'İzle' : 'Aç'}</a>
                                                        : <span className="text-xs text-gray-400">Geçersiz bağlantı</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="min-h-[400px]">
                            <CardContent className="p-8 text-center text-gray-500">Bu eğitimde henüz içerik bulunmuyor.</CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
