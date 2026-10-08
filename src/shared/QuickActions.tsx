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

export function QuickActions() {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const handleAttendanceClick = () => setShowAttendanceModal(true);

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
        <div className="space-y-4">
          <p>Etkinlik kaydı için etkinlikler sayfasını kullanın. Gerçekleşen katılım yönetici yoklamasıyla doğrulanır.</p>
          <p>Vekil ve mazeret bildirimi bu ekranda henüz kullanıma açık değil.</p>
          <Link to="/events" className="inline-block text-indigo-600 underline" onClick={()=>setShowAttendanceModal(false)}>Etkinliklere git</Link>
          <Button variant="outline" onClick={()=>setShowAttendanceModal(false)}>Kapat</Button>
        </div>
      </Modal>
    </>
  );
}
