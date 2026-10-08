import { notificationTransport as webApi } from './api';
export interface Notification {id:string;title:string;message:string;type:string;read:boolean|null;created_at:string}
export interface NotificationSnapshot {notificationVersion:1;ownerId:string;notifications:Notification[];total:number;unreadCount:number;notification?:Notification}
const validRow=(v:any):v is Notification=>v&&typeof v.id==='string'&&['title','message','type'].every(k=>typeof v[k]==='string')&&(v.read===null||typeof v.read==='boolean')&&typeof v.created_at==='string'&&Number.isFinite(Date.parse(v.created_at));
function validated(v:any,owner:string):NotificationSnapshot {
  if(!v||v.notificationVersion!==1||v.ownerId!==owner||!Array.isArray(v.notifications)||v.notifications.length>50||!v.notifications.every(validRow)||new Set(v.notifications.map((n:Notification)=>n.id)).size!==v.notifications.length||![v.total,v.unreadCount].every(n=>Number.isSafeInteger(n)&&n>=0)||v.total<v.notifications.length||v.unreadCount>v.total||v.unreadCount<v.notifications.filter((n:Notification)=>!n.read).length||v.notification&&!validRow(v.notification))throw Error('Bildirim yanıtı doğrulanamadı.');
  return v;
}
export const notificationsApi={
  async read(owner:string){return validated(await webApi.get('/notifications/web',owner),owner);},
  async mark(owner:string,id?:string){const v=validated(await webApi.put(id?`/notifications/${encodeURIComponent(id)}/read`:'/notifications/read-all',{},owner),owner);if(id&&(v.notification?.id!==id||v.notification?.read!==true))throw Error('Okundu kaydı doğrulanamadı.');return v;}
};
