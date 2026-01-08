import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { api } from '../api/api';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X, PlusCircle } from 'lucide-react';

export function AdminExams() {
    const navigate = useNavigate();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [currentExam, setCurrentExam] = useState<any>({
        title: '',
        description: '',
        duration: 30,
        passingScore: 70,
        questions: []
    });

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        setLoading(true);
        try {
            const data = await api.lmsExams();
            setExams(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu sınavı silmek istediğinize emin misiniz?')) return;
        try {
            await api.lmsDeleteExam(id);
            loadExams();
        } catch (e) {
            alert('Silme işlemi başarısız.');
        }
    };

    const handleEdit = (exam: any) => {
        setCurrentExam(exam);
        setShowModal(true);
    };

    const handleCreate = () => {
        setCurrentExam({
            title: '',
            description: '',
            duration: 30,
            passingScore: 70,
            questions: []
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!currentExam.title) return alert('Sınav başlığı zorunludur.');
        try {
            await api.lmsSaveExam(currentExam);
            setShowModal(false);
            loadExams();
        } catch (e) {
            alert('Kaydetme başarısız.');
        }
    };

    const addQuestion = () => {
        setCurrentExam({
            ...currentExam,
            questions: [
                ...currentExam.questions,
                { id: Math.random().toString(), text: '', options: ['', '', '', ''], correct: '' }
            ]
        });
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQuestions = [...currentExam.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setCurrentExam({ ...currentExam, questions: newQuestions });
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...currentExam.questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex].options = newOptions;
        // If correct answer matches old option, update it too (optional intelligent behavior, but strictly checking by text value here)
        setCurrentExam({ ...currentExam, questions: newQuestions });
    };

    const setCorrectOption = (qIndex: number, value: string) => {
        const newQuestions = [...currentExam.questions];
        newQuestions[qIndex].correct = value;
        setCurrentExam({ ...currentExam, questions: newQuestions });
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...currentExam.questions];
        newQuestions.splice(index, 1);
        setCurrentExam({ ...currentExam, questions: newQuestions });
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    if (showModal) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" onClick={() => setShowModal(false)} className="flex items-center">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            İptal
                        </Button>
                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center">
                            <Save className="h-4 w-4 mr-2" />
                            Kaydet
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Sınav Bilgileri</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sınav Başlığı</label>
                                    <input
                                        type="text"
                                        value={currentExam.title}
                                        onChange={(e) => setCurrentExam({ ...currentExam, title: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                                    <textarea
                                        value={currentExam.description}
                                        onChange={(e) => setCurrentExam({ ...currentExam, description: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Süre (Dakika)</label>
                                        <input
                                            type="number"
                                            value={currentExam.duration}
                                            onChange={(e) => setCurrentExam({ ...currentExam, duration: parseInt(e.target.value) })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Geçme Notu (%)</label>
                                        <input
                                            type="number"
                                            value={currentExam.passingScore}
                                            onChange={(e) => setCurrentExam({ ...currentExam, passingScore: parseInt(e.target.value) })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Sorular ({currentExam.questions.length})</h2>
                            <Button onClick={addQuestion} variant="outline" className="flex items-center">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Soru Ekle
                            </Button>
                        </div>

                        {currentExam.questions.map((q: any, i: number) => (
                            <Card key={i} className="relative">
                                <button
                                    onClick={() => removeQuestion(i)}
                                    className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                                <CardContent className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Soru {i + 1}</label>
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                                            placeholder="Soru metnini giriniz..."
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt: string, optIndex: number) => (
                                            <div key={optIndex} className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    name={`q-${i}-correct`}
                                                    checked={q.correct === opt && opt !== ''}
                                                    onChange={() => setCorrectOption(i, opt)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                    disabled={opt === ''}
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateOption(i, optIndex, e.target.value)}
                                                    placeholder={`Seçenek ${optIndex + 1}`}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 italic mt-2">
                                        Doğru cevabı işaretlemeyi unutmayın.
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-2 pl-0 hover:bg-transparent">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Admin Panel
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-900">Sınav Yönetimi</h1>
                        <p className="text-gray-500 mt-1">Sınavlar oluşturun, düzenleyin ve sorular ekleyin.</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Sınav
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {exams.map((exam) => (
                        <Card key={exam.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{exam.title}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{exam.description}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span>{exam.duration} Dakika</span>
                                        <span>{exam.questions?.length || 0} Soru</span>
                                        <span>Geçme Notu: %{exam.passingScore}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(exam)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Düzenle
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleDelete(exam.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {exams.length === 0 && !loading && (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-500">Henüz hiç sınav oluşturulmamış.</p>
                            <Button variant="link" onClick={handleCreate}>İlk sınavı oluştur</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
