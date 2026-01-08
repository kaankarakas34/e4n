import { useState } from 'react';
import { Card, CardContent } from '../../shared/Card';
import { Button } from '../../shared/Button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Quiz } from '../../types';

interface ExamRunnerProps {
    quiz: Quiz;
    onComplete: (score: number, passed: boolean) => void;
    onCancel: () => void;
}

export function ExamRunner({ quiz, onComplete, onCancel }: ExamRunnerProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [finished, setFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [passed, setPassed] = useState(false);

    const questions = quiz.questions || [];
    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionSelect = (option: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: option
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishExam();
        }
    };

    const finishExam = () => {
        let correctCount = 0;
        let totalPoints = 0;
        let earnedPoints = 0;

        questions.forEach(q => {
            totalPoints += q.points;
            if (answers[q.id] === q.correct_answer) {
                correctCount++;
                earnedPoints += q.points;
            }
        });

        // If totalPoints is 0 (bad data), avoid NaN
        const finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

        // Explicit 70 passing score requirement
        const isPassed = finalScore >= (quiz.passing_score || 70);

        setScore(finalScore);
        setPassed(isPassed);
        setFinished(true);
    };

    if (finished) {
        return (
            <Card className="max-w-2xl mx-auto mt-8">
                <CardContent className="p-8 text-center">
                    {passed ? (
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    ) : (
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    )}

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {passed ? 'Tebrikler! Sınavı Geçtiniz.' : 'Üzgünüz, Sınavdan Kaldınız.'}
                    </h2>

                    <div className="text-4xl font-bold bg-gray-100 dark:bg-gray-800 p-4 rounded-lg inline-block my-4">
                        {score.toFixed(0)} Puan
                    </div>

                    <p className="text-gray-600 mb-6">
                        Geçme Notu: {quiz.passing_score || 70}
                    </p>

                    <div className="flex justify-center gap-4">
                        <Button onClick={() => onComplete(score, passed)} variant={passed ? 'default' : 'outline'}>
                            {passed ? 'Tamamla' : 'Kapat'}
                        </Button>
                        {!passed && (
                            <Button onClick={() => {
                                setFinished(false);
                                setCurrentQuestionIndex(0);
                                setAnswers({});
                            }}>
                                Tekrar Dene
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!currentQuestion) {
        return <div>Soru bulunamadı.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{quiz.title}</h2>
                <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                    Soru {currentQuestionIndex + 1} / {questions.length}
                </span>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">
                        {currentQuestion.question_text}
                    </h3>

                    <div className="space-y-3">
                        {currentQuestion.options?.map((opt, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleOptionSelect(opt)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${answers[currentQuestion.id] === opt
                                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                    : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${answers[currentQuestion.id] === opt ? 'border-indigo-600' : 'border-gray-400'
                                        }`}>
                                        {answers[currentQuestion.id] === opt && (
                                            <div className="h-2 w-2 rounded-full bg-indigo-600" />
                                        )}
                                    </div>
                                    <span className="text-gray-700">{opt}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
                            }}
                            disabled={currentQuestionIndex === 0}
                        >
                            Önceki
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={onCancel}>İptal</Button>
                            <Button
                                onClick={handleNext}
                                disabled={!answers[currentQuestion.id]}
                                className="bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                {currentQuestionIndex === questions.length - 1 ? 'Sınavı Bitir' : 'Sonraki'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
