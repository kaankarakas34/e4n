
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { api } from '../api/api';

export function CreatePassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Geçersiz bağlantı.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setLoading(true);
        try {
            await api.createPassword({ token, password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Şifre oluşturulurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-full max-w-md px-4">
                    <Card className="text-center p-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">Şifreniz Oluşturuldu</CardTitle>
                        <p className="text-gray-600 mb-6">
                            Şifreniz başarıyla oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            Giriş Yap
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-md px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold text-fuchsia-700">Şifre Oluştur</CardTitle>
                        <p className="text-center text-sm text-gray-500 mt-2">
                            Lütfen hesabınız için güvenli bir şifre belirleyin.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Yeni Şifre"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    disabled={!token}
                                />
                                <Input
                                    type="password"
                                    placeholder="Şifre Tekrar"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={!token}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700"
                                disabled={loading || !token}
                            >
                                {loading ? 'İşleniyor...' : 'Şifreyi Kaydet'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
