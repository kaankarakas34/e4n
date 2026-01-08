import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { BookOpen } from 'lucide-react';

export function Education() {
  const { user } = useAuthStore();
  const [trainings, setTrainings] = useState<Array<{ id: string; title: string; start_at: string; location?: string }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    api.getCalendar(user.id)
      .then(rows => {
        const list = (rows || []).filter((e: any) => e.type === 'education').map((e: any) => ({ id: e.id, title: e.title || 'Eğitim', start_at: e.start_at, location: e.location }));
        setTrainings(list);
      })
      .catch(() => setTrainings([]));
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Eğitim</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
              Eğitimleriniz
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainings.length === 0 ? (
              <p className="text-gray-500">Kayıtlı eğitim bulunmuyor.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {trainings.map(t => (
                  <li key={t.id} className="py-3">
                    <p className="font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">{new Date(t.start_at).toLocaleString()} {t.location ? `• ${t.location}` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
