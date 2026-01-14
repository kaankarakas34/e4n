import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { useMembershipStore } from '../stores/membershipStore';
import { api } from '../api/api';
import type { User, MembershipPlan } from '../types';
import { Badge } from '../shared/Badge';
import { Calendar, Award, Pencil, Building } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { mailService, MAIL_TEMPLATES } from '../services/mailService';

export function MemberProfile() {
  const { id } = useParams();
  const { items, fetchAll, renew, expire, create } = useMembershipStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: currentUser } = useAuthStore();
  const isMe = currentUser?.id === user?.id;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isFriend = user?.friends?.includes(currentUser?.id || '') || false;
  // Mock manager role for now, in real app check currentUser permissions
  const isManager = true;

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Subscription Modal State
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>('4_MONTHS');

  useEffect(() => {
    loadUser();
  }, [id, fetchAll]);

  const loadUser = async () => {
    setLoading(true); setError(null);
    try {
      if (id) {
        const u = await api.getUserById(id);
        setUser(u);
        setEditForm(u);
      }
      await fetchAll();
    } catch (e) {
      setError('Üye bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const membership = items.find(m => m.user_id === id);

  const ensureMembership = async (plan: string) => {
    let validPlan: MembershipPlan = '4_MONTHS';
    if (plan === 'YEARLY' || plan === '12_MONTHS') validPlan = '12_MONTHS';
    if (plan === 'QUARTERLY' || plan === '4_MONTHS') validPlan = '4_MONTHS';
    if (plan === '8_MONTHS') validPlan = '8_MONTHS';
    if (plan === '1_MONTH') validPlan = '1_MONTH';

    if (!id || !user) return;
    try {
      if (!membership) {
        await create({ user_id: id, plan: validPlan, start_date: new Date().toISOString(), status: 'PENDING' });
      } else {
        await renew(membership.id, validPlan);
      }
      alert('Abonelik işlemi başarıyla tamamlandı.');
    } catch (e) {
      alert('Hata oluştu.');
    } finally {
      setShowSubscriptionModal(false);
      // Refresh user data to show new subscription details
      loadUser();
    }
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

  const handleSave = async () => {
    if (!id) return;
    try {
      const updated = await api.updateUser(id, editForm);
      setUser(updated);
      setShowEditModal(false);
      alert('Profil güncellendi.');
    } catch (e) {
      console.error(e);
      alert('Güncelleme sırasında bir hata oluştu.');
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
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profili Düzenle (Admin)</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <input type="text" className="w-full border rounded-md p-2" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input type="email" className="w-full border rounded-md p-2" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input type="text" className="w-full border rounded-md p-2" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meslek</label>
                  <input type="text" className="w-full border rounded-md p-2" value={editForm.profession || ''} onChange={e => setEditForm({ ...editForm, profession: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İl</label>
                  <input type="text" className="w-full border rounded-md p-2" value={editForm.city || ''} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                  <Building className="h-4 w-4 mr-2" /> Şirket & Fatura Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şirket Adı</label>
                    <input type="text" className="w-full border rounded-md p-2" value={editForm.company || ''} onChange={e => setEditForm({ ...editForm, company: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi No</label>
                    <input type="text" className="w-full border rounded-md p-2" value={editForm.tax_number || ''} onChange={e => setEditForm({ ...editForm, tax_number: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                    <input type="text" className="w-full border rounded-md p-2" value={editForm.tax_office || ''} onChange={e => setEditForm({ ...editForm, tax_office: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fatura Adresi</label>
                    <textarea className="w-full border rounded-md p-2" rows={3} value={editForm.billing_address || ''} onChange={e => setEditForm({ ...editForm, billing_address: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>İptal</Button>
              <Button className="bg-indigo-600 text-white" onClick={handleSave}>Değişiklikleri Kaydet</Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <Calendar className="h-4 w-4 mr-2" /> Geri Dön
          </Button>
          {isAdmin && (
            <Button onClick={() => setShowEditModal(true)} className="bg-indigo-600 text-white">
              <Pencil className="h-4 w-4 mr-2" /> Profili Düzenle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>{user.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-6 space-y-2">
                <p className="text-gray-700"><strong>Meslek:</strong> {user.profession}</p>
                <p className="text-gray-700"><strong>Grup:</strong> {'Liderler Global'}</p>
                <p className="text-gray-700"><strong>Şirket:</strong> {user.company || 'Belirtilmemiş'}</p>
                <p className="text-gray-700"><strong>İl:</strong> {user.city || 'Belirtilmemiş'}</p>

                <div className="pt-2 border-t mt-2">
                  <h4 className="font-semibold text-gray-900 mb-2">Fatura Bilgileri</h4>
                  <p className="text-gray-700 text-sm"><strong>Vergi No:</strong> {user.tax_number || '-'}</p>
                  <p className="text-gray-700 text-sm"><strong>Vergi Dairesi:</strong> {user.tax_office || '-'}</p>
                  <p className="text-gray-700 text-sm"><strong>Adres:</strong> {user.billing_address || '-'}</p>
                </div>

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
                      <p className="text-2xl font-bold text-gray-900">{user.metric_referrals || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-xs text-green-600 font-medium uppercase">Ciro Katkısı</p>
                      <p className="text-2xl font-bold text-gray-900">₺{(user.metric_revenue || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-xs text-purple-600 font-medium uppercase">Ziyaretçi</p>
                      <p className="text-2xl font-bold text-gray-900">{user.metric_visitors || 0}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-xs text-orange-600 font-medium uppercase">1'e 1</p>
                      <p className="text-2xl font-bold text-gray-900">{user.metric_one_to_ones || 0}</p>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Bitiş</span>
                    <span className="font-medium">{membership.end_date ? new Date(membership.end_date).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <Button className="w-full" size="sm" onClick={() => setShowSubscriptionModal(true)}>Yenile / Uzat</Button>
                    <Button variant="outline" className="w-full" size="sm" onClick={() => expire(membership.id)}>İptal Et</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">Aktif abonelik yok</p>
                  <Button className="w-full" onClick={() => setShowSubscriptionModal(true)}>Abonelik Başlat</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Subscription Selection Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Abonelik Süresi Seçin</h3>
            <p className="text-gray-500 mb-6">Lütfen üyelik için tanımlamak istediğiniz süreyi seçiniz.</p>

            <div className="space-y-3">
              {[
                { id: '1_MONTH', label: '1 Ay', desc: 'Aylık Üyelik' },
                { id: '4_MONTHS', label: '4 Ay', desc: 'Standart Dönem' },
                { id: '8_MONTHS', label: '8 Ay', desc: 'İki Dönem' },
                { id: '12_MONTHS', label: '12 Ay', desc: 'Yıllık Üyelik' },
              ].map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id as MembershipPlan)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex justify-between items-center ${selectedPlan === plan.id
                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div>
                    <p className={`font-semibold ${selectedPlan === plan.id ? 'text-indigo-900' : 'text-gray-900'}`}>{plan.label}</p>
                    <p className="text-sm text-gray-500">{plan.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPlan === plan.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                    }`}>
                    {selectedPlan === plan.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowSubscriptionModal(false)}>İptal</Button>
              <Button
                className="bg-indigo-600 text-white"
                onClick={() => ensureMembership(selectedPlan)}
              >
                Onayla ve Başlat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
