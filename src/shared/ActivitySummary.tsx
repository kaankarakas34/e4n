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

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';

export function ActivitySummary({refreshVersion=0}:{refreshVersion?:number}={}) {
  const { user } = useAuthStore();
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,setError]=useState<string|null>(null),[retry,setRetry]=useState(0),[loadedFor,setLoadedFor]=useState<string|null>(null);
  const context=`${user?.id}:${user?.role}`,current=useRef(context);current.current=context;

  useEffect(() => {
    if (!user) return;
    let active=true;const valid=()=>active&&current.current===context;

    const loadActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const [oneToOnes, referrals, visitors, education, attendance] = await Promise.all([
          api.getOneToOnes(user.id),
          api.getReferralsByUser(user.id),
          api.getVisitorsByUser(user.id),
          api.getEducationByUser(user.id),
          api.getUserAttendance(user.id)
        ]);
        if([oneToOnes,referrals,visitors,education,attendance].some(rows=>!Array.isArray(rows)||rows.some((row:any)=>!row||Array.isArray(row))))throw new Error('Invalid activity rows');

        const activities: any[] = [];

        // Map One-to-Ones
        oneToOnes.forEach((o: any) => {
          activities.push({
            type: 'one-to-one',
            title: 'Birebir Görüşme',
            description: `${(o.partner_id === user.id ? o.requester_name : o.partner_name) || 'İsim bilgisi yok'} ile görüşme yapıldı.`,
            date: new Date(o.meeting_date),
            status: 'success',
            icon: TrendingUp,
          });
        });

        // Map Referrals
        referrals.forEach((r: any) => {
          activities.push({
            type: r.giver_id === user.id ? 'referral-given' : 'referral-received',
            title: r.giver_id === user.id ? 'İş Yönlendirmesi Yaptınız' : 'İş Yönlendirmesi Aldınız',
            description: `${r.giver_id === user.id ? r.to_member_name : r.from_member_name} - ${r.subject}`,
            date: new Date(r.created_at),
            status: r.status === 'SUCCESSFUL' ? 'success' : 'pending',
            icon: Users,
          });
        });

        // Map Visitors
        visitors.forEach((v: any) => {
          activities.push({
            type: 'visitor',
            title: 'Ziyaretçi Getirme',
            description: `${v.name} adlı ziyaretçiyi davet ettiniz.`,
            date: new Date(v.visited_at || v.created_at),
            status: 'success',
            icon: Users,
          });
        });

        // Map Education
        education.forEach((e: any) => {
          activities.push({
            type: 'education',
            title: 'Eğitim Tamamlama',
            description: `${e.course_name} eğitimini tamamladınız.`,
            date: new Date(e.completed_at || e.completed_date),
            status: 'success',
            icon: BookOpen,
          });
        });

        // Map Attendance
        attendance.forEach((a: any) => {
          activities.push({
            type: 'attendance',
            title: 'Toplantı Katılımı',
            description: `Toplantıya ${a.status === 'PRESENT' ? 'katıldınız' : a.status === 'LATE' ? 'geç katıldınız' : 'katılamadınız'}.`,
            date: new Date(a.meeting_date || a.created_at),
            status: a.status === 'PRESENT' ? 'success' : a.status === 'ABSENT' ? 'error' : 'pending',
            icon: Calendar,
          });
        });

        // Sort by date descending
        activities.sort((a, b) => b.date.getTime() - a.date.getTime());

        if(activities.some(row=>!Number.isFinite(row.date.getTime())))throw new Error('Invalid activity date');
        if(valid())setRecentActivities(activities.slice(0, 10)); // Top 10
      } catch (error) {
        if(valid()){setRecentActivities([]);setError('Aktivite özeti yüklenemedi.');}
      } finally {
        if(valid()){setLoading(false);setLoadedFor(context);}
      }
    };

    loadActivities();
    return()=>{active=false;};
  }, [context,refreshVersion,retry]);

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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if(!user?.id)return <p>Aktiviteler için giriş yapın.</p>;
  if(error&&loadedFor===context&&!loading)return <div><p role="alert">{error}</p><button onClick={()=>setRetry(value=>value+1)}>Özeti tekrar yükle</button></div>;
  if (loading||loadedFor!==context) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Son Aktiviteler</CardTitle>
        <p className="text-sm text-gray-600">
          Son networking aktiviteleriniz
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => {
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
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 italic">
              Henüz bir aktivite kaydı bulunmuyor.
            </div>
          )}
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
