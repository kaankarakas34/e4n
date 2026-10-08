import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { connectionsApi, type ConnectionProfile } from '../api/connections';
import { api, profileFields, type ProfileSettings } from '../api/api';
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
    const { token } = useAuthStore();
    const scope = `${currentUser?.id ?? ''}:${token ?? ''}:${id ?? ''}`;
    const liveScope = useRef(scope); liveScope.current = scope;
    const generation = useRef(0);
    const lock = useRef(false);
    const [snapshot, setSnapshot] = useState<{ scope: string; data: ConnectionProfile } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [retry, setRetry] = useState(0);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [settings, setSettings] = useState<ProfileSettings | null>(null);
    const [notice, setNotice] = useState('');
    useEffect(() => {
        const epoch = ++generation.current;
        lock.current = false; setBusy(false); setSnapshot(null); setError(''); setLoading(true);
        setShowMeetingModal(false); setShowEditModal(false); setSettings(null); setNotice('');
        const owner = currentUser?.id;
        if (!owner || !id || !token) { setLoading(false); setError('Profili görmek için giriş yapın.'); return; }
        Promise.all([connectionsApi.profile(owner,id),owner===id?api.getProfileSettings(owner):Promise.resolve(null)]).then(([data,ownSettings]) => {
            if (epoch !== generation.current || liveScope.current !== scope) return;
            setSnapshot({ scope, data }); setEditForm(ownSettings ?? data.profile); setSettings(ownSettings);
        }).catch(() => { if (epoch === generation.current && liveScope.current === scope) setError('Profil yüklenemedi. Tekrar deneyin.'); })
          .finally(() => { if (epoch === generation.current && liveScope.current === scope) setLoading(false); });
        return () => { generation.current++; };
    }, [scope, retry]);
    const data = snapshot?.scope === scope ? snapshot.data : null;
    const run = async (operation: () => Promise<unknown>) => {
        if (lock.current || !data || !currentUser || !id) return;
        const epoch = generation.current;
        lock.current = true; setBusy(true); setError('');
        try {
            await operation();
            if (epoch !== generation.current || liveScope.current !== scope) return;
            // Reload the profile and permissions from the committed server state.
            setSnapshot(null); setLoading(true);
            const updated = await connectionsApi.profile(currentUser.id, id);
            if (epoch !== generation.current || liveScope.current !== scope) return;
            setSnapshot({ scope, data: updated }); setEditForm(updated.profile); setShowEditModal(false);
        } catch { if (epoch === generation.current && liveScope.current === scope) setError('İşlem veya güncel profil okunamadı. Durumu yenileyip tekrar deneyin.'); }
        finally { if (epoch === generation.current && liveScope.current === scope) { lock.current = false; setBusy(false); setLoading(false); } }
    };
    const handleSendRequest = () => run(() => connectionsApi.mutate(currentUser!.id, id!, 'create'));
    const handleAcceptRequest = () => run(() => connectionsApi.mutate(currentUser!.id, id!, 'accept'));
    const handleRejectRequest = () => run(() => connectionsApi.mutate(currentUser!.id, id!, 'reject'));
    const handleUpdateProfile = async () => {
        if(lock.current || !data || data.status!=='SELF' || !currentUser || !settings)return;
        const owner=currentUser.id,epoch=generation.current;
        const patch=Object.fromEntries(profileFields.map(k=>[k,editForm[k]??(k==='profession'?'':null)]));
        const current=()=>epoch===generation.current && liveScope.current===scope;
        lock.current=true;setBusy(true);setError('');setNotice('');
        const accept=(saved:ProfileSettings)=>{
            if(!current())return;
            setSettings(saved);setEditForm(saved);
            setSnapshot({scope,data:{...data,profile:{...data.profile,...Object.fromEntries(profileFields.map(k=>[k,saved[k]]))}}});
            useAuthStore.getState().updateUser({name:saved.name,profession:saved.profession,company:saved.company??undefined,phone:saved.phone??undefined,city:saved.city??undefined,tax_number:saved.tax_number??undefined,tax_office:saved.tax_office??undefined,billing_address:saved.billing_address??undefined});
            setShowEditModal(false);setNotice('Profil kaydedildi.');
        };
        try {accept(await api.updateMe(patch,owner,settings.revision));}
        catch(e:any) {
            if(!current())return;
            // A lost acknowledgement may follow a committed PUT. Reconcile by reading, never repeat the write here.
            if(![400,401,403,409].includes(e?.status)) {
                try {
                    const saved=await api.getProfileSettings(owner);
                    if(profileFields.every(k=>saved[k]===(typeof patch[k]==='string'?patch[k].trim()||(k==='profession'?'':null):k==='profession'?'':null))){accept(saved);return;}
                } catch { /* Keep the draft and report the uncertain result. */ }
            }
            if(current())setError(e?.status===409?'Profil başka bir işlemde değişti. Durumu yenileyip tekrar düzenleyin.':e?.status===400?'Alanları kontrol edin: ad zorunludur; site adresi http:// veya https:// ile başlamalıdır.':'Profil kaydı doğrulanamadı. Taslağınız korunuyor; durumu yenileyip kontrol edin.');
        } finally {if(current()){lock.current=false;setBusy(false);}}
    };
    const profileUser = data?.profile;
    const friendshipStatus = data?.status;
    const isSelf = friendshipStatus === 'SELF';
    const isFriend = friendshipStatus === 'FRIEND';
    const isAdmin = !!data?.billingVisible;
    const canSeeContactInfo = !!data?.contactVisible;
    if (!profileUser) return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p role={error ? 'alert' : 'status'}>{error || (loading ? 'Yükleniyor...' : 'Profil yüklenemedi.')}</p>
        {error && <Button onClick={() => setRetry(n => n + 1)}>Tekrar Dene</Button>}
    </div>;

    return (
        <div className="min-h-screen bg-gray-100">
            {notice && <p role="status" className="p-4 bg-green-50 text-green-800">{notice}</p>}
            {error && <div role="alert" className="p-4 bg-red-50 text-red-700">{error} <Button onClick={() => setRetry(n => n + 1)}>Durumu Yenile</Button></div>}
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

                                </div>

                                <h1 className="text-xl font-bold text-gray-900 mt-4">{profileUser.name}</h1>
                                <p className="text-indigo-600 font-medium">{profileUser.profession}</p>
                                <p className="text-xs text-gray-500 mt-1">{profileUser.company || 'Şirket Belirtilmemiş'}</p>

                                {/* Action Buttons */}
                                <div className="mt-6 flex flex-col gap-2">
                                    {friendshipStatus === 'NONE' && (
                                        <Button disabled={busy} onClick={handleSendRequest} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Bağlantı Kur
                                        </Button>
                                    )}
                                    {friendshipStatus === 'REJECTED' && <p className="text-sm text-gray-500">Bağlantı isteği reddedilmiş.</p>}
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
                                            <Button disabled={busy} onClick={handleAcceptRequest} className="flex-1 bg-green-600 text-white hover:bg-green-700">
                                                Kabul Et
                                            </Button>
                                            <Button disabled={busy} variant="outline" onClick={handleRejectRequest}>Reddet</Button>
                                        </div>
                                    )}
                                    {(isFriend || isSelf) && !isSelf && (
                                        <Button onClick={() => navigate(`/messages?recipient=${profileUser.id}`)} variant="outline" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50">
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
                                            {profileUser.website && /^https?:\/\//i.test(profileUser.website)
                                                ? <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="truncate text-indigo-600 hover:underline">{profileUser.website}</a>
                                                : <span>{profileUser.website || '-'}</span>}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                                            <span>{profileUser.city || 'Belirtilmemiş'}</span>
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
                        {/* Tabs Navigation */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                            <div className="flex border-b border-gray-100">
                                <h2 className="p-4 font-medium text-indigo-600">Hakkında</h2>
                            </div>

                            <div className="p-6">
                                {(
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Biyografi</h3>
                                            {data?.commonGroups.length ? <p className="text-sm text-indigo-600 mb-3">Ortak gruplar: {data.commonGroups.map(g => g.name).join(', ')}</p> : null}
                                            <p className="text-gray-600 leading-relaxed">
                                                {profileUser.bio || 'Bu kullanıcı henüz biyografi eklememiş.'}
                                            </p>
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
                                                        {data?.billingVisible && <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Vergi No</h4>
                                                            <p className="text-gray-900">{profileUser.tax_number || '---'}</p>
                                                        </div>}
                                                    </div>
                                                    {(isSelf || isAdmin) && (
                                                        <>
                                                            <div className="pt-2 border-t border-gray-100 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-gray-500">Vergi Dairesi</h4>
                                                                    <p className="text-gray-900 text-sm">{profileUser.tax_office || '---'}</p>
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

            {/* Edit Modal (Editable) */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animation-fade-in">
                    <div role="dialog" aria-modal="true" aria-labelledby="profile-edit-title" className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 id="profile-edit-title" className="text-xl font-bold text-gray-900">Profili Düzenle</h2>
                            <button aria-label="Düzenlemeyi kapat" disabled={busy} onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><Share2 className="h-5 w-5 rotate-45" /></button>
                        </div>

                        {error && <p role="alert" className="mb-4 text-red-700">{error} <Button disabled={busy} onClick={() => setRetry(n=>n+1)}>Durumu Yenile</Button></p>}
                        <fieldset disabled={busy} className="space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Kişisel Bilgiler</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                        <input id="profile-name" type="text" className="w-full border rounded-md p-2" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="profile-profession" className="block text-sm font-medium text-gray-700 mb-1">Meslek / Unvan</label>
                                        <input id="profile-profession" type="text" className="w-full border rounded-md p-2" value={editForm.profession || ''} onChange={e => setEditForm({ ...editForm, profession: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                        <input id="profile-phone" type="text" className="w-full border rounded-md p-2" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="profile-website" className="block text-sm font-medium text-gray-700 mb-1">Web Sitesi</label>
                                        <input id="profile-website" type="text" className="w-full border rounded-md p-2" value={editForm.website || ''} onChange={e => setEditForm({ ...editForm, website: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="profile-bio" className="block text-sm font-medium text-gray-700 mb-1">Biyografi</label>
                                        <textarea id="profile-bio" className="w-full border rounded-md p-2" rows={3} value={editForm.bio || ''} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="profile-city" className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                                    <input id="profile-city" className="w-full border rounded-md p-2" value={editForm.city||''} onChange={e=>setEditForm({...editForm,city:e.target.value})}/>
                                </div>
                                <div>
                                    <label htmlFor="profile-linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Adresi</label>
                                    <input id="profile-linkedin" className="w-full border rounded-md p-2" value={editForm.linkedin_profile||''} onChange={e=>setEditForm({...editForm,linkedin_profile:e.target.value})}/>
                                </div>
                            </div>
                            {/* Company Info */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                                        <Building className="h-4 w-4 mr-2" />
                                        Şirket Bilgileri
                                    </h3>

                                </div>
                                <p className="text-xs text-gray-500 mb-4">
                                    Şirket ve fatura bilgilerinizi güncelleyin.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="profile-company" className="block text-xs font-medium text-gray-500 mb-1">Şirket Ünvanı</label>
                                        <input id="profile-company"
                                            type="text"

                                            className="w-full border rounded-md p-2"
                                            value={editForm.company || ''}
                                            onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="profile-tax_number" className="block text-xs font-medium text-gray-500 mb-1">Vergi Numarası</label>
                                        <input id="profile-tax_number"
                                            type="text"

                                            className="w-full border rounded-md p-2"
                                            value={editForm.tax_number || ''}
                                            onChange={e => setEditForm({ ...editForm, tax_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="profile-tax_office" className="block text-xs font-medium text-gray-500 mb-1">Vergi Dairesi</label>
                                        <input id="profile-tax_office"
                                            type="text"

                                            className="w-full border rounded-md p-2"
                                            value={editForm.tax_office || ''}
                                            onChange={e => setEditForm({ ...editForm, tax_office: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="profile-billing_address" className="block text-xs font-medium text-gray-500 mb-1">Fatura Adresi</label>
                                        <textarea id="profile-billing_address"

                                            className="w-full border rounded-md p-2"
                                            rows={2}
                                            value={editForm.billing_address || ''}
                                            onChange={e => setEditForm({ ...editForm, billing_address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button variant="ghost" disabled={busy} onClick={() => setShowEditModal(false)}>İptal</Button>
                            <Button className="bg-indigo-600 text-white" disabled={busy} onClick={handleUpdateProfile}>Kaydet</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
