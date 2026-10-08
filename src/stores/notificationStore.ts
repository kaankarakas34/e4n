import {create} from 'zustand';
import {notificationsApi,type NotificationSnapshot,type Notification} from '../api/notifications';
import {useAuthStore} from './authStore';
export type {Notification};
interface State {notifications:Notification[];unreadCount:number;total:number;isLoading:boolean;isSaving:boolean;error:string|null;fetchNotifications:(owner:string)=>Promise<void>;markAsRead:(id:string)=>Promise<void>;markAllAsRead:()=>Promise<void>}
let epoch=0;
const scope=()=>{const s=useAuthStore.getState();return s.user?.id&&s.token?s.user.id+'|'+s.token:'';};
const empty={notifications:[],unreadCount:0,total:0,isLoading:false,isSaving:false,error:null};
export const useNotificationStore=create<State>((set,get)=>{
 const publish=(v:NotificationSnapshot)=>set({notifications:v.notifications,unreadCount:v.unreadCount,total:v.total,error:null});
 const mark=async(id?:string)=>{
  const owner=useAuthStore.getState().user?.id,context=scope();if(!owner||!context||get().isSaving)return;
  ++epoch;set({isSaving:true,isLoading:false,error:null});
  try{const v=await notificationsApi.mark(owner,id);if(scope()===context)publish(v);}
  catch{if(scope()===context){try{const v=await notificationsApi.read(owner);if(scope()===context){publish(v);if(id?!v.notifications.some(n=>n.id===id&&n.read):v.unreadCount>0)set({error:'Okundu işlemi doğrulanamadı. Durumu kontrol ederek tekrar deneyin.'});}}catch{if(scope()===context)set({error:'Bildirim işlemi doğrulanamadı. Yenileyip durumu kontrol edin.'});}}}
  finally{if(scope()===context)set({isSaving:false});}
 };
 return {...empty,fetchNotifications:async(owner)=>{const context=scope();if(!context||useAuthStore.getState().user?.id!==owner||get().isSaving)return;const seq=++epoch;set({isLoading:true,error:null});try{const v=await notificationsApi.read(owner);if(seq===epoch&&scope()===context)publish(v);}catch{if(seq===epoch&&scope()===context)set({notifications:[],unreadCount:0,total:0,error:'Bildirimler yüklenemedi. Tekrar deneyin.'});}finally{if(seq===epoch&&scope()===context)set({isLoading:false});}},markAsRead:mark,markAllAsRead:()=>mark()};
});
let previousScope=scope();
useAuthStore.subscribe(()=>{const next=scope();if(next!==previousScope){previousScope=next;++epoch;useNotificationStore.setState({...empty});}});
