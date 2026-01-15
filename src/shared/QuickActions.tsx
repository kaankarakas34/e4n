import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import {
  Users,
  UserPlus,
  Coffee,
  FileText,
  TrendingUp,
  Calendar,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';

export function QuickActions() {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<'PRESENT' | 'ABSENT' | 'SUBSTITUTE'>('PRESENT');
  const [substituteName, setSubstituteName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handleAttendanceClick = async () => {
    setShowAttendanceModal(true);
    // Fetch upcoming meetings - for now, using events logic or mock
    const events = await api.getEvents();
    // Filter for meetings in the future or recent past
    const now = new Date();
    const upcoming = events.filter((e: any) => new Date(e.start_at) > new Date(now.getTime() - 86400000 * 7)); // Show last week + future
    setMeetings(upcoming);
  };

  const submitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMeeting) return;

    setLoading(true);
    try {
      await api.submitAttendance({
        userId: user.id,
        meetingId: selectedMeeting,
        status: attendanceStatus,
        substituteName: attendanceStatus === 'SUBSTITUTE' ? substituteName : undefined
      });
      alert('Yoklama bildiriminiz işleme alındı.');
      setShowAttendanceModal(false);
      setSubstituteName('');
      setAttendanceStatus('PRESENT');
    } catch (error) {
      console.error(error);
      alert('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      title: 'İş Yönlendirmesi',
      description: 'Yeni bir iş yönlendirmesi oluştur',
      icon: Users,
      href: '/referrals',
      color: 'blue',
      variant: 'primary' as const,
    },
    {
      title: 'Birebir Görüşme',
      description: 'Görüşme detaylarını kaydedin',
      icon: Coffee,
      href: '/activities',
      color: 'purple',
      variant: 'outline' as const,
    },
    {
      title: 'Elde Edilen Ciro',
      description: 'Kapanan iş bildirimi yapın',
      icon: TrendingUp,
      href: '/revenue-entry',
      color: 'orange',
      variant: 'outline' as const,
    },

    { // This is the new button, triggered by state instead of link
      title: 'Yoklama Bildir',
      description: 'Toplantı katılım durumunuzu bildirin',
      icon: CheckSquare,
      onClick: handleAttendanceClick,
      color: 'cyan',
      variant: 'outline' as const,
    },
    {
      title: 'Destek',
      description: 'Sorun bildirin veya yardım alın',
      icon: MessageSquare,
      href: '/support',
      color: 'rose',
      variant: 'outline' as const,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      rose: 'text-rose-600 bg-rose-50 border-rose-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
          <p className="text-sm text-gray-600">
            En sık kullanılan işlemlerinize hızlı erişim
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = getColorClasses(action.color);

              if (action.onClick) {
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`block w-full text-left p-3 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg bg-white border mr-3`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{action.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </button>
                );
              }

              return (
                <Link
                  key={index}
                  to={action.href!}
                  className={`block p-3 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg bg-white border mr-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </CardContent>
      </Card>

      <Modal
        open={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        title="Yoklama Bildirimi"
      >
        <form onSubmit={submitAttendance} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Toplantı Seçin
            </label>
            <select
              required
              className="block w-full border-gray-300 rounded-md shadow-sm p-2 border"
              value={selectedMeeting}
              onChange={(e) => setSelectedMeeting(e.target.value)}
            >
              <option value="">Seçiniz...</option>
              {meetings.map(m => (
                <option key={m.id} value={m.id}>
                  {new Date(m.start_at).toLocaleDateString()} - {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Katılım Durumu
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                className={`p-3 border rounded-lg text-center text-sm font-medium transition-colors ${attendanceStatus === 'PRESENT' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setAttendanceStatus('PRESENT')}
              >
                Katılacağım
              </button>
              <button
                type="button"
                className={`p-3 border rounded-lg text-center text-sm font-medium transition-colors ${attendanceStatus === 'SUBSTITUTE' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setAttendanceStatus('SUBSTITUTE')}
              >
                Yerime Biri Gelecek
              </button>
              <button
                type="button"
                className={`p-3 border rounded-lg text-center text-sm font-medium transition-colors ${attendanceStatus === 'ABSENT' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setAttendanceStatus('ABSENT')}
              >
                Katılamayacağım
              </button>
            </div>
          </div>

          {attendanceStatus === 'SUBSTITUTE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vekil İsmi (Ad Soyad)
              </label>
              <input
                type="text"
                required
                className="block w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                value={substituteName}
                onChange={(e) => setSubstituteName(e.target.value)}
                placeholder="Vekilin adını ve soyadını giriniz"
              />
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" type="button" onClick={() => setShowAttendanceModal(false)} className="mr-2">
              İptal
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Bildir
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
