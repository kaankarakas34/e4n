import { useNavigate } from 'react-router-dom';
import { Card, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { useAuthStore } from '../stores/authStore';

export function PendingApproval() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-md px-4 py-8">
                <Card className="text-center p-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">Başvurunuz İnceleniyor</CardTitle>
                    <p className="text-gray-600 mb-6">
                        Üyelik başvurunuz başarıyla alınmıştır ve şu anda yönetici onayı beklemektedir.
                        Bilgileriniz incelendikten sonra üyeliğiniz aktif hale getirilecek ve e-posta ile bilgilendirileceksiniz.
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => window.location.reload()} variant="primary" className="w-full">
                            Durumu Kontrol Et
                        </Button>
                        <Button onClick={handleLogout} variant="outline" className="w-full">
                            Çıkış Yap
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
