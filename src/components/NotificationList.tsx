import {useNotificationStore} from '../stores/notificationStore';
import {useAuthStore} from '../stores/authStore';
import {Link} from 'react-router-dom';
export function NotificationList(){
 const {notifications,total,unreadCount,isLoading,isSaving,error,fetchNotifications,markAsRead,markAllAsRead}=useNotificationStore();const owner=useAuthStore(s=>s.user?.id);
 return <section aria-label="Bildirim listesi" className="p-3 text-sm">
  <div className="flex justify-between gap-2 mb-2"><span>{error?'Sayı doğrulanamadı':isLoading?'Sayı yükleniyor…':`${unreadCount} okunmamış`}</span><button disabled={isLoading||isSaving||!owner} onClick={()=>owner&&fetchNotifications(owner)}>Yenile</button></div>
  {error&&<p role="alert" className="text-red-700 mb-2">{error}</p>}
  {isLoading?<p role="status">Bildirimler yükleniyor…</p>:!error&&!notifications.length?<p>Bildiriminiz yok.</p>:null}
  {unreadCount>0&&<button disabled={isLoading||isSaving} className="mb-3 underline" onClick={()=>markAllAsRead()}>Tümünü okundu işaretle</button>}
  <div className="max-h-80 overflow-auto">{!isLoading&&notifications.map(n=><article key={n.id} className={`p-3 border-b ${n.read?'bg-white':'bg-blue-50'}`}><h3 className="font-semibold">{n.title}</h3><p className="whitespace-pre-wrap break-words">{n.message}</p><time dateTime={n.created_at} className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('tr-TR')}</time>{!n.read&&<button disabled={isSaving} onClick={()=>markAsRead(n.id)} className="block underline">Okundu işaretle</button>}{n.action_url?.startsWith('/group-management?tab=applications&group=')&&<Link to={n.action_url} className="block underline">Gelen grup başvurularını aç</Link>}{n.action_url==='/chapter-management'&&<Link to={n.action_url} className="block underline">Başvurularımı aç</Link>}{n.type==='MESSAGE'&&<Link to="/messages" className="block underline">Mesajları aç</Link>}</article>)}</div>
  {!isLoading&&total>notifications.length&&<p className="text-xs mt-2">{total} bildirimin son {notifications.length} kaydı gösteriliyor.</p>}
 </section>;
}
