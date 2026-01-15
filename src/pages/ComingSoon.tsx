import React from 'react';
import { Card, CardContent } from '../shared/Card';
import { Rocket } from 'lucide-react';
import { Button } from '../shared/Button';
import { useNavigate } from 'react-router-dom';

export function ComingSoon() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-xl border-t-4 border-t-indigo-600">
                <CardContent className="pt-12 pb-12 px-8">
                    <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                        <Rocket className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Çok Yakında!</h1>
                    <p className="text-gray-500 mb-8">
                        Eğitim Yönetim Sistemi (LMS) üzerindeki çalışmalarımız tüm hızıyla devam ediyor.
                        Yakında sizlerle olacak.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')} className="w-full">
                        Ana Sayfaya Dön
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
