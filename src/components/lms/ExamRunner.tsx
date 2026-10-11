import { useState } from 'react';
import { Card, CardContent } from '../../shared/Card';
import { Button } from '../../shared/Button';
import { CheckCircle, XCircle } from 'lucide-react';

export interface ExamRunnerQuestion {
    id: string;
    question_text: string;
    options: string[];
}

export interface ExamRunnerExam {
    id: string;
    title: string;
    pass_score: number;
    questions: ExamRunnerQuestion[];
}

export interface ExamRunnerResult {
    score: number;
    passed: boolean;
    pass_score: number;
}

interface ExamRunnerProps {
    exam: ExamRunnerExam;
    /** Sends answers to the server; the returned result is the only score shown. */
    onSubmit: (answers: Record<string, string>) => Promise<ExamRunnerResult>;
    onComplete: (result: ExamRunnerResult) => void;
    onCancel: () => void;
}

export function ExamRunner({ exam, onSubmit, onComplete, onCancel }: ExamRunnerProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<ExamRunnerResult | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const questions = exam.questions || [];
    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionSelect = (option: string) => {
        if (!currentQuestion || submitting) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    };

    const finishExam = async () => {
        if (submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            setResult(await onSubmit(answers));
        } catch {
            setError('Sınav sonucu kaydedilemedi. Cevaplarınız korunuyor; tekrar gönderebilirsiniz.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(prev => prev + 1);
        else void finishExam();
    };

    if (result) {
        return (
            <Card className="max-w-2xl mx-auto mt-8">
                <CardContent className="p-8 text-center">
                    {result.passed
                        ? <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        : <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {result.passed ? 'Tebrikler! Sınavı Geçtiniz.' : 'Üzgünüz, Sınavdan Kaldınız.'}
                    </h2>
                    <div className="text-4xl font-bold bg-gray-100 p-4 rounded-lg inline-block my-4">
                        {result.score} Puan
                    </div>
                    <p className="text-gray-600 mb-6">Geçme Notu: {result.pass_score}</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => onComplete(result)} variant={result.passed ? 'default' : 'outline'}>
                            {result.passed ? 'Tamamla' : 'Kapat'}
                        </Button>
                        {!result.passed && (
                            <Button onClick={() => { setResult(null); setCurrentQuestionIndex(0); setAnswers({}); }}>
                                Tekrar Dene
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!currentQuestion) {
        return <div className="p-8 text-center text-gray-500">Bu sınavda henüz soru bulunmuyor.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{exam.title}</h2>
                <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                    Soru {currentQuestionIndex + 1} / {questions.length}
                </span>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">{currentQuestion.question_text}</h3>

                    <div className="space-y-3" role="radiogroup">
                        {currentQuestion.options?.map((opt, idx) => {
                            const selected = answers[currentQuestion.id] === opt;
                            return (
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    key={idx}
                                    onClick={() => handleOptionSelect(opt)}
                                    className={`w-full text-left p-4 border rounded-lg transition-all ${selected
                                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                        : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <span className="flex items-center">
                                        <span className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${selected ? 'border-indigo-600' : 'border-gray-400'}`}>
                                            {selected && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                                        </span>
                                        <span className="text-gray-700">{opt}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

                    <div className="mt-8 flex justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1); }}
                            disabled={currentQuestionIndex === 0 || submitting}
                        >
                            Önceki
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={onCancel} disabled={submitting}>İptal</Button>
                            <Button
                                onClick={handleNext}
                                disabled={!answers[currentQuestion.id] || submitting}
                                className="bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                {submitting ? 'Gönderiliyor...' : currentQuestionIndex === questions.length - 1 ? 'Sınavı Bitir' : 'Sonraki'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
