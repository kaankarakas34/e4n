import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { useMembershipStore } from '../stores/membershipStore';
import { api } from '../api/api';
import type { User, MembershipPlan } from '../types';
import { Badge } from '../shared/Badge';
import { Calendar, Award } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { mailService, MAIL_TEMPLATES } from '../services/mailService';

export function MemberProfile() {
  const { id } = useParams();
  const { items, fetchAll, renew, expire, create } = useMembershipStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: currentUser } = useAuthStore();
  const isMe = currentUser?.id === user?.id;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isFriend = user?.friends?.includes(currentUser?.id || '') || false;
  // Mock manager role for now, in real app check currentUser permissions
  const isManager = true;

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        if (id) {
          const u = await api.getUserById(id);
          setUser(u);
        }
        await fetchAll();
      } catch (e) {
        setError('Üye bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, fetchAll]);

  const membership = items.find(m => m.user_id === id);

  const ensureMembership = async (plan: string) => {
    let validPlan: MembershipPlan = '4_MONTHS';
    if (plan === 'YEARLY') validPlan = '12_MONTHS';
    if (plan === 'QUARTERLY') validPlan = '4_MONTHS';
    if (!id || !user) return;
    if (!membership) {
      await create({ user_id: id, plan: validPlan, start_date: new Date().toISOString(), status: 'PENDING' });
    }
    await renew(membership ? membership.id : items.find(m => m.user_id === id)?.id || '', validPlan);
  };

  const handleConnect = async (targetId: string) => {
    if (!currentUser) return;
    try {
      await api.requestFriendship(currentUser.id, targetId);
      if (user?.email) {
        await mailService.sendMail(user.email, MAIL_TEMPLATES.FRIEND_REQUEST, { requesterName: currentUser.name });
      }
      alert('Bağlantı isteği gönderildi!');
    } catch (e) {
      alert('İstek gönderilemedi.');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-indigo-600">{error}</p></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Üye bulunamadı</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
          <Calendar className="h-4 w-4 mr-2" /> Geri Dön
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>{user.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-6 space-y-2">
                <p className="text-gray-700"><strong>Meslek:</strong> {user.profession}</p>
                {/* Fallback group name since user object might not have it populated fully in mock */}
                <p className="text-gray-700"><strong>Grup:</strong> {'Liderler Global'}</p>
                <p className="text-gray-700"><strong>Şirket:</strong> {'Belirtilmemiş'}</p>

                {(isFriend || isMe || isAdmin) ? (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-green-700 text-sm font-semibold mb-2 flex items-center">
                      <span className="bg-green-100 p-1 rounded mr-2">✓</span>
                      İletişim Bilgileri (Görünür)
                    </p>
                    <p className="text-gray-700"><strong>E-posta:</strong> {user.email}</p>
                    <p className="text-gray-700"><strong>Telefon:</strong> {user.phone || '555-000-0000'}</p>
                  </div>
                ) : (
                  <div className="pt-2 border-t mt-2 bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-gray-500 text-sm flex items-center">
                      <span className="mr-2">🔒</span>
                      İletişim bilgilerini görmek için bağlantı kurmalısınız.
                    </p>
                  </div>
                )}

                {!isMe && (
                  <div className="mt-4">
                    {isFriend ? (
                      <Button variant="outline" className="w-full text-green-600 border-green-200 bg-green-50 pointer-events-none">
                        Arkadaşsınız
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => handleConnect(user.id)}
                      >
                        Arkadaş Ekle / Bağlantı Kur
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Achievements */}
              {user.achievements && user.achievements.length > 0 && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-yellow-600" />
                    Rozetler ve Başarılar
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {user.achievements.map((achievement: any) => (
                      <div key={achievement.id} className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100 flex-1 min-w-[200px] max-w-[300px]" title={achievement.description}>
                        <div className="p-2 bg-white rounded-full mr-3 text-yellow-500 shadow-sm border border-yellow-100">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{achievement.title}</p>
                          <p className="text-xs text-gray-500">{new Date(achievement.earned_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isManager && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-indigo-600" />
                    Performans Karnesi
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium uppercase">Yönlendirme</p>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-xs text-green-600 font-medium uppercase">Ciro Katkısı</p>
                      <p className="text-2xl font-bold text-gray-900">₺450K</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-xs text-purple-600 font-medium uppercase">Ziyaretçi</p>
                      <p className="text-2xl font-bold text-gray-900">3</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-xs text-orange-600 font-medium uppercase">1'e 1</p>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Son 1'e 1 Görüşmeler</h4>
                      <ul className="bg-white border rounded-md divide-y">
                        <li className="p-3 text-sm flex justify-between">
                          <span>Ayşe Kaya ile İş Birliği</span>
                          <span className="text-gray-500">25 Kas</span>
                        </li>
                        <li className="p-3 text-sm flex justify-between">
                          <span>Fatma Demir ile Proje</span>
                          <span className="text-gray-500">20 Kas</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Abonelik Durumu</CardTitle></CardHeader>
            <CardContent>
              {membership ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Durum</span>
                    <Badge className={membership.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {membership.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Plan</span>
                    <span className="font-medium">{membership.plan}</span>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <Button className="w-full" size="sm" onClick={() => ensureMembership('MONTHLY')}>Yenile</Button>
                    <Button variant="outline" className="w-full" size="sm" onClick={() => expire(membership.id)}>İptal Et</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">Aktif abonelik yok</p>
                  <Button className="w-full" onClick={() => ensureMembership('MONTHLY')}>Abonelik Başlat</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  );
}

