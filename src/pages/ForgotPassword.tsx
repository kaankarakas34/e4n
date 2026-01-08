import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';

export function ForgotPassword() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Şifre Sıfırlama</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <Input placeholder="E-posta" type="email" />
              <Button variant="primary" className="w-full">Sıfırlama Bağlantısı Gönder</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
