import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Button } from '../shared/Button';
import {
    User,
    Briefcase,
    Mail,
    Phone,
    Linkedin,
    Globe,
    MessageSquare,
    UserPlus,
    UserCheck,
    Clock,
    Users,
    ArrowLeft,
    Award,
    Star,
    Calendar,
    Share2,
    MapPin,
    Building
} from 'lucide-react';

import { MeetingRequestModal } from '../components/MeetingRequestModal';

export function PublicProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [profileUser, setProfileUser] = useState<any>(null);
    const [friendshipStatus, setFriendshipStatus] = useState<'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIEND' | 'SELF'>('NONE');
    const [loading, setLoading] = useState(true);
    const [commonGroups, setCommonGroups] = useState<string[]>([]);
    const [connectNote, setConnectNote] = useState('');
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'ABOUT' | 'STATS' | 'BADGES'>('ABOUT');

    useEffect(() => {
        const loadProfile = async () => {
            if (!id || !currentUser) return;
            setLoading(true);
            try {
                if (id === currentUser.id) {
                    setFriendshipStatus('SELF');
                    setProfileUser(currentUser);
                    setLoading(false);
                    return;
                }

                const u = await api.getUserById(id);
                setProfileUser(u);

                const status = await api.checkFriendship(currentUser.id, id);
                setFriendshipStatus(status as any);

                const myGroups = await api.getUserGroups(currentUser.id);
                const targetGroups = await api.getUserGroups(id);
                const common = myGroups.filter(g => targetGroups.some(tg => tg.id === g.id)).map(g => g.name);
                setCommonGroups(common);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [id, currentUser]);

    const handleSendRequest = async () => {
        if (!currentUser || !profileUser) return;
        try {
            await api.requestFriendship(currentUser.id, profileUser.id, connectNote);
            setFriendshipStatus('PENDING_SENT');
            setShowConnectModal(false);
        } catch (error) {
            alert('İstek gönderilemedi.');
        }
    };

    const handleAcceptRequest = async () => {
        if (!currentUser || !profileUser) return;
        try {
            await api.acceptFriendship(currentUser.id, profileUser.id);
            setFriendshipStatus('FRIEND');
        } catch (error) {
            alert('İşlem başarısız.');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-500">Yükleniyor...</div></div>;
    if (!profileUser) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-500">Kullanıcı bulunamadı.</div></div>;

    const isFriend = friendshipStatus === 'FRIEND';
    const isSelf = friendshipStatus === 'SELF';
    const isAdmin = currentUser?.role === 'ADMIN';
    const canSeeContactInfo = isFriend || isSelf || isAdmin;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Cover Image */}
            <div className="h-64 w-full bg-gradient-to-r from-indigo-800 to-blue-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-white/80 hover:text-white hover:bg-white/10 absolute top-6 left-4"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" /> Geri Dön
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative pb-12">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Column: Profile Card */}
                    <div className="w-full md:w-1/3 lg:w-1/4">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-6">
                            <div className="p-6 text-center border-b border-gray-100">
                                <div className="relative inline-block">
                                    <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg bg-gray-200 mx-auto flex items-center justify-center overflow-hidden">
                                        {profileUser.profile_image ? (
                                            <img src={profileUser.profile_image} alt={profileUser.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-16 w-16 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="absolute bottom-1 right-1 h-6 w-6 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
                                </div>

                                <h1 className="text-xl font-bold text-gray-900 mt-4">{profileUser.name}</h1>
                                <p className="text-indigo-600 font-medium">{profileUser.profession}</p>
                                <p className="text-xs text-gray-500 mt-1">{profileUser.company || 'Şirket Belirtilmemiş'}</p>

                                {/* Action Buttons */}
                                <div className="mt-6 flex flex-col gap-2">
                                    {friendshipStatus === 'NONE' && (
                                        <Button onClick={() => setShowConnectModal(true)} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Bağlantı Kur
                                        </Button>
                                    )}
                                    {/* 1-on-1 Meeting Button */}
                                    {(!isSelf) && (
                                        <Button onClick={() => setShowMeetingModal(true)} variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            1-e-1 Toplantı Planla
                                        </Button>
                                    )}
                                    {friendshipStatus === 'PENDING_SENT' && (
                                        <Button variant="outline" disabled className="w-full text-gray-500 bg-gray-50">
                                            <Clock className="h-4 w-4 mr-2" />
                                            İstek Gönderildi
                                        </Button>
                                    )}
                                    {friendshipStatus === 'PENDING_RECEIVED' && (
                                        <div className="flex gap-2">
                                            <Button onClick={handleAcceptRequest} className="flex-1 bg-green-600 text-white hover:bg-green-700">
                                                Kabul Et
                                            </Button>
                                        </div>
                                    )}
                                    {(isFriend || isSelf) && !isSelf && (
                                        <Button onClick={() => navigate('/messages')} variant="outline" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Mesaj Gönder
                                        </Button>
                                    )}
                                    {isSelf && (
                                        <Button variant="outline" onClick={() => setShowEditModal(true)} className="w-full">
                                            Profili Düzenle
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Contact Mini Grid */}
                            <div className="p-4 bg-gray-50">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">İletişim</h3>
                                {canSeeContactInfo ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center text-sm text-gray-700">
                                            <Mail className="h-4 w-4 text-gray-400 mr-3" />
                                            <span className="truncate">{profileUser.email}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <Phone className="h-4 w-4 text-gray-400 mr-3" />
                                            <span>{profileUser.phone || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <Globe className="h-4 w-4 text-gray-400 mr-3" />
                                            <span className="truncate text-indigo-600 hover:underline cursor-pointer">{profileUser.website || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                                            <span>İstanbul, TR</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-2">
                                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <UserCheck className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <p className="text-xs text-gray-500">İletişim bilgilerini görmek için bağlantı kurmalısınız.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="flex-1 mt-6 md:mt-0">
                        {/* Common History Banner */}
                        {!isSelf && commonGroups.length > 0 && (
                            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center shadow-sm">
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600 mr-4">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Ortak Geçmiş Tespit Edildi!</h4>
                                    <p className="text-sm text-gray-600">
                                        Siz ve {profileUser.name?.split(' ')[0] || 'bu kullanıcı'} <strong>{commonGroups.join(', ')}</strong> grubunda birlikte bulundunuz. Bağlantı kurmak için harika bir neden!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tabs Navigation */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                            <div className="flex border-b border-gray-100">
                                <button
                                    onClick={() => setActiveTab('ABOUT')}
                                    className={`flex-1 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === 'ABOUT' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Hakkında
                                    {activeTab === 'ABOUT' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('STATS')}
                                    className={`flex-1 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === 'STATS' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    İstatistikler
                                    {activeTab === 'STATS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('BADGES')}
                                    className={`flex-1 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === 'BADGES' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Rozetler & Başarılar
                                    {activeTab === 'BADGES' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                                </button>
                            </div>

                            <div className="p-6">
                                {activeTab === 'ABOUT' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Biyografi</h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                {profileUser.bio || 'Bu kullanıcı henüz biyografi eklememiş. Ancak profesyonel ağını genişletmek ve değer yaratmak için burada!'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-semibold text-gray-900 mb-2">Uzmanlık Alanları</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Strateji', 'Yönetim', 'Pazarlama', 'Networking'].map(tag => (
                                                        <span key={tag} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-semibold text-gray-900 mb-2">Hedefler</h4>
                                                <p className="text-sm text-gray-600">Yeni işbirlikleri geliştirmek ve global pazara açılmak.</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                                <Building className="h-5 w-5 mr-2 text-indigo-600" />
                                                Şirket Bilgileri
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-4 col-span-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Şirket Adı</h4>
                                                            <p className="text-gray-900 font-medium">{profileUser.company || 'Belirtilmemiş'}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Sektör</h4>
                                                            <p className="text-gray-900">{profileUser.profession}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Konum</h4>
                                                            <p className="text-gray-900">İstanbul, Türkiye</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Kuruluş Yılı</h4>
                                                            <p className="text-gray-900">2018</p>
                                                        </div>
                                                    </div>
                                                    {(isSelf || isAdmin) && (
                                                        <>
                                                            <div className="pt-2 border-t border-gray-100 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-gray-500">Vergi No</h4>
                                                                    <p className="text-gray-900 font-mono text-sm">{profileUser.tax_id || '---'}</p>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-gray-500">Fatura Adresi</h4>
                                                                    <p className="text-gray-900 text-sm">{profileUser.billing_address || '---'}</p>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'STATS' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-indigo-50 p-4 rounded-xl text-center">
                                            <div className="text-3xl font-bold text-indigo-600 mb-1">{profileUser.performance_score || 0}</div>
                                            <div className="text-xs text-indigo-800 font-medium">Performans Puanı</div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl text-center">
                                            <div className="text-3xl font-bold text-green-600 mb-1">12</div>
                                            <div className="text-xs text-green-800 font-medium">Verilen Referans</div>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                                            <div className="text-3xl font-bold text-blue-600 mb-1">98%</div>
                                            <div className="text-xs text-blue-800 font-medium">Toplantı Katılımı</div>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-xl text-center">
                                            <div className="text-3xl font-bold text-purple-600 mb-1">5</div>
                                            <div className="text-xs text-purple-800 font-medium">Ziyaretçi Daveti</div>
                                        </div>

                                        <div className="col-span-2 md:col-span-4 mt-4 bg-gray-50 p-4 rounded-xl">
                                            <h4 className="font-semibold text-gray-900 mb-4 text-center">Son 6 Aylık Performans Grafiği</h4>
                                            {/* Mock Graph Visual */}
                                            <div className="h-32 flex items-end justify-center gap-2">
                                                {[40, 60, 45, 70, 85, profileUser.performance_score || 50].map((h, i) => (
                                                    <div key={i} className="w-8 bg-indigo-200 rounded-t-md relative group hover:bg-indigo-400 transition-colors" style={{ height: `${h}%` }}>
                                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {h}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between px-8 mt-2 text-xs text-gray-400">
                                                <span>Haz</span><span>Tem</span><span>Ağu</span><span>Eyl</span><span>Eki</span><span>Kas</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'BADGES' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                            <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mr-4">
                                                <Award className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Gold Networker</h4>
                                                <p className="text-xs text-gray-500">10,000+ TL İş Hacmi Yarattı</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4">
                                                <UserPlus className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Topluluk Oluşturucu</h4>
                                                <p className="text-xs text-gray-500">5+ Yeni Üye Kazandırdı</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-4">
                                                <Star className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Sadık Üye</h4>
                                                <p className="text-xs text-gray-500">1 Yıldır Aralıksız Üye</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meeting Modal */}
            {showMeetingModal && profileUser && (
                <MeetingRequestModal
                    targetUser={profileUser}
                    onClose={() => setShowMeetingModal(false)}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animation-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Profili Düzenle</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><Share2 className="h-5 w-5 rotate-45" /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Kişisel Bilgiler</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                        <input type="text" className="w-full border rounded-md p-2" defaultValue={profileUser.name} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Meslek / Unvan</label>
                                        <input type="text" className="w-full border rounded-md p-2" defaultValue={profileUser.profession} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                        <input type="text" className="w-full border rounded-md p-2" defaultValue={profileUser.phone} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Web Sitesi</label>
                                        <input type="text" className="w-full border rounded-md p-2" defaultValue={profileUser.website} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Biyografi</label>
                                        <textarea className="w-full border rounded-md p-2" rows={3} defaultValue={profileUser.bio} />
                                    </div>
                                </div>
                            </div>

                            {/* Company Info - Read Only */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                                        <Building className="h-4 w-4 mr-2" />
                                        Şirket Bilgileri
                                    </h3>
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                        Değiştirilemez
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">
                                    Bu bilgiler yasal zorunluluklar ve faturalandırma süreçleri nedeniyle sadece yönetim tarafından değiştirilebilir. Değişiklik talebi için lütfen destek ile iletişime geçin.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Şirket Ünvanı</label>
                                        <input type="text" disabled className="w-full bg-gray-100 border-gray-300 border rounded-md p-2 text-gray-600 cursor-not-allowed" value={profileUser.company} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Vergi Numarası</label>
                                        <input type="text" disabled className="w-full bg-gray-100 border-gray-300 border rounded-md p-2 text-gray-600 cursor-not-allowed" value={profileUser.tax_id} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Fatura Adresi</label>
                                        <input type="text" disabled className="w-full bg-gray-100 border-gray-300 border rounded-md p-2 text-gray-600 cursor-not-allowed" value={profileUser.billing_address} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowEditModal(false)}>İptal</Button>
                            <Button className="bg-indigo-600 text-white" onClick={() => { setShowEditModal(false); alert('Değişiklikler kaydedildi (Mock)'); }}>Kaydet</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
