import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function ActivitySummary() {
  const recentActivities = [
    {
      type: 'referral',
      title: 'Yeni İş Yönlendirmesi',
      description: 'Ahmet Yılmaz\'a yazılım projesi yönlendirdiniz',
      date: '2 gün önce',
      status: 'success',
      icon: Users,
    },
    {
      type: 'one-to-one',
      title: 'Birebir Görüşme',
      description: 'Ayşe Kaya ile kahve görüşmesi yaptınız',
      date: '3 gün önce',
      status: 'success',
      icon: TrendingUp,
    },
    {
      type: 'visitor',
      title: 'Ziyaretçi Getirme',
      description: 'Mehmet Öz adlı ziyaretçi getirdiniz',
      date: '1 hafta önce',
      status: 'pending',
      icon: Users,
    },
    {
      type: 'education',
      title: 'Eğitim Tamamlama',
      description: 'Dijital Pazarlama webinarına katıldınız',
      date: '1 hafta önce',
      status: 'success',
      icon: BookOpen,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Son Aktiviteler</CardTitle>
        <p className="text-sm text-gray-600">
          Son 30 gündeki networking aktiviteleriniz
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => {
            const Icon = activity.icon;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getStatusColor(activity.status)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </h4>
                      {getStatusIcon(activity.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {activity.date}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 text-center">
          <button className="text-sm text-red-600 hover:text-red-700 font-medium">
            Tüm Aktiviteleri Gör →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
