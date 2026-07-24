import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { api } from '../api/api';

export function VisitorInviteWidget() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            await api.sendVisitorInvite({
                email: email.trim(),
                origin: window.location.origin
            });
            setStatus('success');
            setEmail('');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setErrorMessage(error.message || 'Davetiye gönderilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5 text-red-600" />
                    Ziyaretçi Davet Et
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                    İş ortaklarınıza 6 saat geçerli ücretsiz toplantı katılım davetiyesi gönderin.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleInvite} className="space-y-3">
                    <div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-posta adresi"
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                        />
                    </div>

                    {status === 'success' && (
                        <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs text-green-700">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>Davetiye başarıyla gönderildi!</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full text-xs py-2 bg-red-600 hover:bg-red-700"
                        isLoading={loading}
                        disabled={!email.trim()}
                    >
                        Davetiye Gönder
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
