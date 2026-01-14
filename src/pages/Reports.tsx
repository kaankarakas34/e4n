import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEventStore } from '../stores/eventStore';
import { useLMSStore } from '../stores/lmsStore';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import AdminReports from './AdminReports'; // Import the new component
import {
  BarChart3,
  Users,
  Calendar,
  BookOpen,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Download,
  Filter,
  Calendar as CalendarIcon,
  BarChart2,
  PieChart,
  Eye,
  Coffee,
  UserPlus,
  Award
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Admin Report Data Interface
interface AdminReportData {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalEvents: number;
  upcomingEvents: number;
  completedEventsThisMonth: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  completedCourses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptionRevenue: number;
  courseRevenue: number;
  eventRevenue: number;
  memberGrowth: number[];
  eventAttendance: number[];
  courseCompletion: number[];
  revenueByMonth: number[];
}

// Member Report Data Interface
interface MemberReportData {
  referralsGiven: number;
  referralsReceived: number;
  visitorsHosted: number;
  oneToOnesCompleted: number;
  revenueGiven: number; // Revenue given
  revenueReceived: number; // Business closed
  ceuCredits: number;
  performanceScore: number;
  performanceColor: string;
  monthlyActivity: { name: string; referrals: number; visitors: number; oneToOnes: number }[];
}

export function Reports() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events } = useEventStore();
  const { courses, enrollments } = useLMSStore();

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // State for Member Data
  const [memberData, setMemberData] = useState<MemberReportData | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role !== 'ADMIN') {
        fetchMemberData();
      } else {
        setLoading(false); // Admin loads in sub-component
      }
    }
  }, [user, dateRange]);

  const fetchMemberData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [referrals, visitors, oneToOnes, userData] = await Promise.all([
        api.getReferralsByUser(user.id),
        api.getVisitorsByUser(user.id),
        api.getOneToOnes(user.id),
        api.getUserById(user.id)
      ]);

      const referralsGiven = referrals.filter((r: any) => r.giver_id === user.id).length;
      const referralsReceived = referrals.filter((r: any) => r.receiver_id === user.id).length;

      const revenueReceived = referrals
        .filter((r: any) => r.receiver_id === user.id && r.status === 'SUCCESSFUL')
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

      const revenueGiven = referrals
        .filter((r: any) => r.giver_id === user.id && r.status === 'SUCCESSFUL')
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

      const memberStats: MemberReportData = {
        referralsGiven,
        referralsReceived,
        visitorsHosted: visitors.length,
        oneToOnesCompleted: oneToOnes.length,
        revenueGiven,
        revenueReceived,
        ceuCredits: 12, // Mock for now
        performanceScore: userData?.performance_score || 0,
        performanceColor: userData?.performance_color || 'GREY',
        monthlyActivity: [
          { name: 'Oca', referrals: 4, visitors: 1, oneToOnes: 2 },
          { name: 'Şub', referrals: 3, visitors: 0, oneToOnes: 4 },
          { name: 'Mar', referrals: 5, visitors: 2, oneToOnes: 3 },
          { name: 'Nis', referrals: 2, visitors: 1, oneToOnes: 2 },
          { name: 'May', referrals: 6, visitors: 1, oneToOnes: 5 },
          { name: 'Haz', referrals: 4, visitors: 0, oneToOnes: 3 },
        ]
      };

      setMemberData(memberStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    alert('Rapor indiriliyor...');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Use the new Admin Reports component
  if (user?.role === 'ADMIN') {
    return <AdminReports />;
  }

  // --- MEMBER VIEW ---
  if (memberData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kişisel Performans Raporu</h1>
              <p className="text-gray-500 mt-1">Son 6 aylık aktivite özetiniz</p>
            </div>
            <Button onClick={exportReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              PDF İndir
            </Button>
          </div>

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-blue-600">İş Yönlendirmeleri</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{memberData.referralsGiven}</h3>
                    <p className="text-xs text-gray-500 mt-1">Verilen Referanslar</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-green-600">Ciro Katkısı</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">₺{memberData.revenueGiven.toLocaleString()}</h3>
                    <p className="text-xs text-gray-500 mt-1">Sağlanan İş Hacmi</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Ziyaretçiler</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{memberData.visitorsHosted}</h3>
                    <p className="text-xs text-gray-500 mt-1">Getirilen Misafir</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Birebir Görüşmeler</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{memberData.oneToOnesCompleted}</h3>
                    <p className="text-xs text-gray-500 mt-1">Tamamlanan Görüşme</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Coffee className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Aktivite Grafiği</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={memberData.monthlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="referrals" stroke="#2563eb" name="Referans" strokeWidth={2} />
                      <Line type="monotone" dataKey="visitors" stroke="#9333ea" name="Ziyaretçi" strokeWidth={2} />
                      <Line type="monotone" dataKey="oneToOnes" stroke="#f97316" name="Birebir" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score & Badges */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trafik Işığı Puanı</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center mb-4
                    ${memberData.performanceColor === 'GREEN' ? 'border-green-500 text-green-600 bg-green-50' :
                      memberData.performanceColor === 'YELLOW' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                        memberData.performanceColor === 'RED' ? 'border-red-500 text-red-600 bg-red-50' : 'border-gray-300 text-gray-400'}`}
                  >
                    <span className="text-4xl font-bold">{memberData.performanceScore}</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    {memberData.performanceColor === 'GREEN' ? 'Mükemmel!' :
                      memberData.performanceColor === 'YELLOW' ? 'Geliştirilmeli' : 'Kritik Seviye'}
                  </p>
                  <p className="text-sm text-center text-gray-500 mt-2 px-4">
                    Son 6 aylık performans ortalamanıza göre hesaplanmıştır.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Başarı Rozetleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg opacity-50">
                      <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <span className="text-xs font-semibold block">Yılın Üyesi</span>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <span className="text-xs font-semibold block">Network Ustası</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}