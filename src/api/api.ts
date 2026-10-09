import { emailService } from '../services/emailService';
import type {UserDetailSnapshot} from './userDetail';
export const profileFields = ['name','profession','phone','city','website','bio','linkedin_profile','company','tax_number','tax_office','billing_address'] as const;
export type ProfilePatch = Partial<Record<typeof profileFields[number],string|null>>;
export type ProfileSettings = Record<typeof profileFields[number],string|null> & {id:string;name:string;profession:string;ownerId:string;profileSettingsVersion:1;revision:string};
export function validProfileSettings(v:any,owner:string):v is ProfileSettings {
  return !!v && uuid(owner) && v.profileSettingsVersion===1 && v.id===owner.toLowerCase() && v.ownerId===v.id
    && typeof v.name==='string' && !!v.name.trim() && typeof v.profession==='string'
    && typeof v.revision==='string' && /^[0-9a-f]{64}$/.test(v.revision)
    && profileFields.every(k=>v[k]===null||typeof v[k]==='string')
    && Object.keys(v).every(k=>[...profileFields,'id','ownerId','profileSettingsVersion','revision'].includes(k));
}
const profileOwner = (owner?:string) => {
  if(owner)return owner;
  try{return JSON.parse(localStorage.getItem('auth-storage')||'{}')?.state?.user?.id as string;}catch{return '';}
};
const profileError = () => new Error('Profil kayıt yanıtı doğrulanamadı. Güncel durumu kontrol edin.');
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const nullableText=(v:unknown)=>v===null||typeof v==='string';
export function validUserDetail(v:any,owner:string,target:string):v is UserDetailSnapshot {
  return !!v&&v.profileVersion===1&&uuid(owner)&&uuid(target)&&v.ownerId===owner.toLowerCase()&&v.id===target.toLowerCase()
    &&['GREEN','YELLOW','RED','GREY'].includes(v.performance_color)&&v.metricScope==='ALL_HISTORY'&&['name','full_name','email','role','performance_color'].every(k=>typeof v[k]==='string')
    &&['profession','phone','city','company','tax_number','tax_office','billing_address','account_status','subscription_plan','group_name'].every(k=>nullableText(v[k]))
    &&(v.subscription_end_date===null||typeof v.subscription_end_date==='string'&&Number.isFinite(Date.parse(v.subscription_end_date)))
    &&['metric_referrals','metric_visitors','metric_one_to_ones'].every(k=>Number.isSafeInteger(v[k])&&v[k]>=0)
    &&['metric_revenue','performance_score'].every(k=>typeof v[k]==='number'&&Number.isFinite(v[k]))
    &&!('password_hash' in v)&&!('token' in v)
    &&Array.isArray(v.groups)&&v.groups.every((g:any)=>uuid(g.id)&&typeof g.name==='string')&&new Set(v.groups.map((g:any)=>g.id)).size===v.groups.length
    &&v.group_name===(v.groups.length===1?v.groups[0].name:null)
    &&Array.isArray(v.last_meetings)&&v.last_meetings.length<=3&&v.last_meetings.length<=v.metric_one_to_ones
    &&v.last_meetings.every((m:any)=>uuid(m.id)&&typeof m.meeting_date==='string'&&Number.isFinite(Date.parse(m.meeting_date))&&typeof m.status==='string'&&nullableText(m.partner_name))
    &&new Set(v.last_meetings.map((m:any)=>m.id)).size===v.last_meetings.length;
}

const validMeetingRow = (row: any) => row && typeof row === 'object' && !Array.isArray(row)
  && ['id','requester_id','partner_id'].every(key => typeof row[key] === 'string' && !!row[key].trim())
  && typeof row.status === 'string' && !!row.status.trim()
  && ['meeting_date','created_at'].every(key => typeof row[key] === 'string' && Number.isFinite(Date.parse(row[key])))
  && ['notes','requester_name','partner_name'].every(key => row[key] == null || typeof row[key] === 'string');

const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';


async function request(path: string, options?: RequestInit, binary = false, expectedOwner?:string) {
  // Get token from localStorage (zustand persist stores it there)
  const authStorage = localStorage.getItem('auth-storage');
  let token = null;
  let storedOwner = '';
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      token = parsed?.state?.token;
      storedOwner = parsed?.state?.user?.id ?? '';
    } catch (e) {
      // Ignore parsing errors
    }
  }

  if(expectedOwner && (!uuid(storedOwner) || storedOwner.toLowerCase()!==expectedOwner.toLowerCase()))throw profileError();

  const headers: Record<string, string> = {
    ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers as Record<string, string> || {}),
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    cache: 'no-store',
    ...options,
    headers,
  });
  if (!res.ok) {
    const responseBody = await res.text();
    throw Object.assign(new Error(responseBody), { status: res.status, responseBody });
  }
  return binary ? res.blob() : res.json();
}

export const webCalendarTransport = {
  read: (from: string, to: string) => request(`/calendar/web?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
};

export const invoiceTransport = {
 upload:(type:string,id:string,body:FormData)=>request(`/admin/accounting/${type}/${id}/upload-invoice`,{method:'POST',body}),
 download:(id:string):Promise<Blob>=>request(`/invoices/${id}`,undefined,true),
};

export const documentTransport = {
 get: (path:string) => request(path),
 upload: (body:FormData) => request('/documents',{method:'POST',body}),
 archive: (id:string) => request(`/documents/${id}`,{method:'DELETE'}),
 download: (id:string):Promise<Blob> => request(`/documents/${id}/download`,undefined,true),
};

export const referralTransport = {
  get: <T>(path: string): Promise<T> => request(path),
  post: <T>(path: string, body: unknown): Promise<T> => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown): Promise<T> => request(path, { method: 'PUT', body: JSON.stringify(body) }),
};

export const notificationTransport = {
 get:(path:string,owner:string)=>request(path,undefined,false,owner),
 put:(path:string,body:unknown,owner:string)=>request(path,{method:'PUT',body:JSON.stringify(body)},false,owner),
};

const savedGroup = (value: any, expectedId?: string) => {
  if (!value || typeof value.id !== 'string' || (expectedId && value.id !== expectedId) || typeof value.name !== 'string'
    || !Array.isArray(value.meeting_dates) || value.meeting_dates.some((d: any) => typeof d !== 'string' || !Number.isFinite(Date.parse(d)))) throw new Error('Grup kayıt yanıtı geçersiz. Sonucu kontrol edip tekrar deneyin.');
  return value;
};

export interface PowerTeamSettings {
  id:string; name:string; description:string|null; status:string|null;
  visitor_email_subject:string|null; visitor_email_template:string|null; created_at:string;
}
const validPowerTeam = (row:any):row is PowerTeamSettings => !!row && !Array.isArray(row) && uuid(row.id)
  && typeof row.name==='string' && !!row.name.trim() && ['description','status','visitor_email_subject','visitor_email_template'].every(k=>nullableText(row[k]))
  && typeof row.created_at==='string' && Number.isFinite(Date.parse(row.created_at));
const savedPowerTeam = (row:any,owner?:string,id?:string) => {
  if (!row || row.settingsVersion!==1 || !uuid(row.ownerId) || owner && row.ownerId!==owner.toLowerCase()
    || !validPowerTeam(row) || id && row.id!==id.toLowerCase()) throw new Error('Lonca kayıt yanıtı doğrulanamadı. Aynı işlemi tekrar kontrol edin.');
  return row as PowerTeamSettings;
};
const confirmedPowerTeam = (row:any,payload:Partial<PowerTeamSettings>,owner?:string,id?:string) => {
  const saved=savedPowerTeam(row,owner,id);
  for(const key of ['name','description','status','visitor_email_subject','visitor_email_template'] as const) {
    if(payload[key]===undefined)continue;
    const expected=typeof payload[key]==='string' ? payload[key]!.trim() || null : payload[key];
    if(saved[key]!==expected)throw new Error('Kaydedilen lonca alanları gönderilen işlemle eşleşmiyor. Sonucu tekrar kontrol edin.');
  }
  return saved;
};

export const api = {
  // Auth mocks (extend later)
  // Auth
  async login(email: string, password: string) {
    return await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },

  async getPaymentToken(payload: any) {
    return await request('/payment/get-token', { method: 'POST', body: JSON.stringify(payload) });
  },

  async payWithSipay(payload: any) {
    const result = await request('/payment/pay', { method: 'POST', body: JSON.stringify(payload) });
    if (result?.success !== true || !(result.is3D === true && typeof result.html === 'string' && !!result.html.trim()
        || result.is3D === false && result.recoveryOnly === true)
      || typeof result.invoiceId !== 'string' || !result.invoiceId || typeof result.receiptToken !== 'string' || !result.receiptToken) throw new Error('Ödeme başlatma sonucu doğrulanamadı.');
    return result;
  },
  async resumePayment(requestKey: string) {
    const result = await request('/payment/resume',{method:'POST',body:JSON.stringify({requestKey})});
    if (result?.success !== true || result.recoveryOnly !== true || result.is3D !== false
      || typeof result.invoiceId !== 'string' || !result.invoiceId || typeof result.receiptToken !== 'string' || !result.receiptToken) throw new Error('Ödeme işlem bilgisi doğrulanamadı.');
    return result;
  },
  async getPaymentStatus(invoiceId: string, receiptToken: string) {
    const result = await request('/payment/status', {method:'POST',body:JSON.stringify({invoiceId,receiptToken})});
    if (result?.invoice_id !== invoiceId || !['PENDING','FAILED','SUCCESS','PAID'].includes(result.status)
      || !Number.isFinite(result.amount) || result.amount <= 0
      || !['membership','event_registration','visitor_registration'].includes(result.action_type)) throw new Error('Ödeme sonucu doğrulanamadı.');
    return result;
  },

  async requestRegistration(payload: any) {
    return await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getMe(token?: string) {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return await request('/users/me', { headers });
  },

  async getProfileSettings(owner:string):Promise<ProfileSettings> {
    if(!uuid(owner))throw profileError();
    const saved=await request('/user/profile-settings',undefined,false,owner);
    if(!validProfileSettings(saved,owner))throw profileError();
    return saved;
  },
  async updateMe(data: ProfilePatch, owner?:string, expectedRevision?:string):Promise<ProfileSettings> {
    const actor=profileOwner(owner);
    if(!uuid(actor))throw profileError();
    // Existing screens may hold a full read DTO. Never send role, email or unrelated read fields.
    const body=Object.fromEntries(profileFields.filter(k=>data[k]!==undefined).map(k=>[k,data[k]]));
    const saved=await request('/users/me', {method:'PUT',body:JSON.stringify({...body,...(expectedRevision?{expectedRevision}:{})})},false,actor);
    if(!validProfileSettings(saved,actor)||Object.entries(body).some(([k,v])=>saved[k as keyof ProfileSettings] !== (typeof v==='string'?v.trim()||(k==='profession'?'':null):k==='profession'?'':null)))throw profileError();
    return saved;
  },

  async updateUser(id: string, data: any) {
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed?.state?.token;
    }
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return await request(`/users/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
  },

  // Referrals
  async getReferralsByUser(userId: string) {
    return await request(`/referrals?userId=${encodeURIComponent(userId)}`);
  },
  async _legacy_createReferral(payload: any) {
    return await request('/referrals', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Shuffle & Admin
  async saveShuffle(assignments: Record<string, string[]>, expectedRevision?: string) {
    const result=await request('/shuffle/save', { method: 'POST', body: JSON.stringify({ assignments,expectedRevision }) });
    if(result?.success!==true)throw new Error('Dağıtım kaydı doğrulanamadı. Güncel kayıtları kontrol edin.');
    return result;
  },
  async moveMember(userId: string, groupId: string) {
    const result=await request('/admin/move-member', { method: 'POST', body: JSON.stringify({ userId, groupId }) });
    if(result?.success!==true)throw new Error('Taşıma sonucu doğrulanamadı.');
    return result;
  },
  async assignRole(userId: string, role: string, groupTitle?: string, contextId?: string, type?: 'GROUP' | 'POWER_TEAM') {
    return await request('/admin/assign-role', { method: 'POST', body: JSON.stringify({ userId, role, groupTitle, contextId, type }) });
  },

  // Admin Reports
  async getAdminStats() {
    return await request('/reports/stats');
  },
  async getAdminCharts() {
    return await request('/reports/charts');
  },

  // Professions
  async getProfessions(query?: string) {
    return await request(`/professions?q=${query || ''}`);
  },
  async createProfession(payload: { name: string, category: string, status?: string }) {
    return await request('/professions', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateProfession(id: string, payload: { name: string, category: string, status?: string }) {
    return await request(`/professions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteProfession(id: string) {
    return await request(`/professions/${id}`, { method: 'DELETE' });
  },
  async getAdminGroupStats() {
    return await request('/groups');
  },

  async getTicketStats() {
    return await request('/tickets/stats');
  },

  // Public Endpoints
  async searchPublicMembers(query: string) {
    try {
      return await request(`/public/members/search?q=${encodeURIComponent(query)}`);
    } catch {
      return [];
    }
  },
  async getPublicMember(id: string) {
    try {
      return await request(`/public/members/${id}`);
    } catch {
      return null;
    }
  },

  async getTickets() {
    return await request('/tickets');
  },
  async createTicket(payload: { subject: string, message: string, requestKey?: string }) {
    return await request('/tickets', { method: 'POST', body: JSON.stringify(payload) });
  },
  async getTicketDetails(id: string) {
    return await request(`/tickets/${id}`);
  },
  async replyTicket(id: string, message: string, requestKey?: string) {
    const result = await request(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ message, requestKey }) });
    if (result?.success !== true || result.ticket_id !== id || typeof result.message_id !== 'string' || !result.message_id
      || !['OPEN','ANSWERED'].includes(result.status)) throw new Error('Destek yanıtı doğrulanamadı.');
    return result;
  },
  async updateTicketStatus(id: string, status: 'OPEN' | 'CLOSED', requestKey?: string) {
    const result = await request(`/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, requestKey }) });
    if (result?.success !== true || result.ticket_id !== id || result.status !== status) throw new Error('Talep durumu doğrulanamadı.');
    return result;
  },

  async getAdminGeoStats() {
    // Basic aggregation on client side or mock for now as we don't have a dedicated Geo endpoint yet
    // Could use a new endpoint /reports/geo
    return [
      { name: 'İstanbul', value: 45 },
      { name: 'Ankara', value: 25 },
      { name: 'İzmir', value: 15 },
      { name: 'Bursa', value: 10 },
      { name: 'Antalya', value: 5 },
    ];
  },

  // Events (admin-only)
  async getPublicEvents() {
    return await request('/events');
  },
  async getEvents() {
    return await request('/events?mode=admin');
  },
  async getEvent(id: string) {
    return await request(`/events/${id}`);
  },
  async createEvent(payload: any) {
    return await request('/events', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateEvent(id: string, payload: any) {
    return await request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteEvent(id: string) {
    return await request(`/events/${id}`, { method: 'DELETE' });
  },
  async registerForEvent(eventId: string, payload?: any) {
    const saved = await request(`/events/${eventId}/register`, {
      method: 'POST', body: JSON.stringify(payload ?? {})
    });
    if (!saved || saved.version !== 1 || saved.success !== true || saved.eventId !== eventId
      || typeof saved.ownerId !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(saved.ownerId)
      || typeof saved.replayed !== 'boolean' || typeof saved.ticket_needed !== 'boolean'
      || saved.price == null || !['string','number'].includes(typeof saved.price) || !Number.isFinite(Number(saved.price)) || Number(saved.price) < 0
      || !(saved.ticket_payment_status === null || typeof saved.ticket_payment_status === 'string')) throw new Error('Etkinlik kayıt yanıtı geçersiz. Mevcut kaydınızı kontrol edin.');
    return saved;
  },
  async getGroups() {
    return await request('/groups');
  },
  async getGroup(id: string) {
    return await request(`/groups/${id}`);
  },
  async getPowerTeams() {
    return await request('/power-teams');
  },
  async createGroup(payload: any) {
    return savedGroup(await request('/groups', { method: 'POST', body: JSON.stringify(payload) }), payload.id);
  },
  async deleteGroup(id: string) {
    return await request(`/groups/${id}`, { method: 'DELETE' });
  },
  async updateGroup(id: string, payload: any) {
    return savedGroup(await request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(payload) }), id);
  },
  async getGroupMembers(groupId: string) {
    return await request(`/groups/${groupId}/members`);
  },
  async getCalendar(userId: string) {
    return await request(`/calendar?userId=${encodeURIComponent(userId)}`);
  },
  async getUserByEmail(email: string) {
    const rows = await request(`/users/by-email?email=${encodeURIComponent(email)}`);
    return Array.isArray(rows) ? rows[0] : null;
  },
  async getUserPowerTeams(userId: string) {
    return await request(`/user/power-teams?userId=${encodeURIComponent(userId)}`);
  },


  async getPowerTeamMembers(powerTeamId: string) {
    return await request(`/power-teams/${powerTeamId}/members`);
  },

  async getNetwork() {
    let token = null;
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed?.state?.token;
    }

    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return await request('/user/friends', { headers });
  },




  async getMembers() {
    return await request('/admin/members');
  },
  async sendInviteLink(email: string) {
    return await request('/admin/invite', { method: 'POST', body: JSON.stringify({ email }) });
  },



  async getPayments(year: number) {
    try {
      return this._mockPayments.filter(p => p.year === year);
    } catch { return []; }
  },

  async updatePayment(id: string, payload: any) {
    const existingIndex = this._mockPayments.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
      this._mockPayments[existingIndex] = { ...this._mockPayments[existingIndex], ...payload };
      return this._mockPayments[existingIndex];
    } else {
      const newPayment = { id, ...payload };
      this._mockPayments.push(newPayment);
      return newPayment;
    }
  },

  // Mock Meetings
  _mockMeetings: [
    { id: '1', group_id: '1', date: '2023-11-20', topic: 'Haftalık Toplantı', attendees_count: 18, total_members: 20 },
    { id: '2', group_id: '1', date: '2023-11-13', topic: 'Misafir Günü', attendees_count: 19, total_members: 20 },
    { id: '3', group_id: '1', date: '2023-11-06', topic: 'Networking Eğitimi', attendees_count: 15, total_members: 19 },
    { id: '4', group_id: '1', date: '2023-10-30', topic: 'Haftalık Toplantı', attendees_count: 17, total_members: 19 },
  ] as any[],

  async getGroupMeetings(groupId: string) {
    const events = await request(`/groups/${groupId}/events`);
    if (!Array.isArray(events) || events.some(e => !e || typeof e !== 'object' || Array.isArray(e))) {
      throw new Error('Invalid group meetings response');
    }
    const count = (value: unknown): number | null => {
      if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return null;
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
    };
    return events.map((e: any) => ({
      ...e,
      topic: e.title,
      date: e.start_at,
      attendees_count: count(e.attendees_count),
      total_members: count(e.total_members)
    }));
  },

  async getGroupActivities(groupId: string) {
    return await request(`/groups/${groupId}/activities`);
  },

  async getMeetingAttendance(meetingId: string) {
    const rows = await request(`/events/${meetingId}/attendance`);
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id || row.event_id !== meetingId)) {
      throw new Error('Invalid meeting attendance response');
    }
    return rows;
  },

  async removeEventParticipant(eventId: string, userId: string) {
    return await request(`/admin/events/${eventId}/attendance/${userId}`, { method: 'DELETE' });
  },

  async updateMember(id: string, payload: any) {
    return await request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async createPassword(payload: any) {
    return await request('/auth/create-password', { method: 'POST', body: JSON.stringify(payload) });
  },

  async searchMembers(filters: { name?: string; profession?: string; city?: string }) {
    const params = new URLSearchParams();
    if (filters.name) params.append('name', filters.name);
    if (filters.profession) params.append('profession', filters.profession);
    if (filters.city) params.append('city', filters.city);

    return await request(`/users?${params.toString()}`);
  },

  async requestJoinGroup(userId: string, groupId: string) {
    return await request(`/groups/${groupId}/join`, { method: 'POST' });
  },

  async requestJoinPowerTeam(userId: string, ptId: string) {
    return await request(`/power-teams/${ptId}/join`, { method: 'POST' });
  },

  async updateGroupMemberStatus(groupId: string, userId: string, status: string) {
    let token = null;
    try {
      const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      token = storage.state?.token;
    } catch (e) { }
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const result=await request(`/groups/${groupId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ status }), headers });
    if(result?.group_id!==groupId||result?.user_id!==userId||result?.status!==status)throw new Error('Grup üye sonucu doğrulanamadı.');
    return result;
  },

  async updatePowerTeamMemberStatus(ptId: string, userId: string, status: string) {
    let token = null;
    try {
      const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      token = storage.state?.token;
    } catch (e) { }
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return await request(`/power-teams/${ptId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ status }), headers });
  },

  async deleteMember(id: string) {
    return await request(`/admin/members/${id}`, { method: 'DELETE' });
  },

  async deleteGroupMember(groupId: string, userId: string) {
    const result=await request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
    if(result?.success!==true||result?.removed!==true||result?.groupId!==groupId||result?.userId!==userId)throw new Error('Grup üye sonucu doğrulanamadı. Listeyi yenileyip sonucu kontrol edin.');
    return result;
  },

  async deletePowerTeamMember(ptId: string, userId: string) {
    return await request(`/power-teams/${ptId}/members/${userId}`, { method: 'DELETE' });
  },

  async getUserGroups(userId: string) {
    return await request(`/user/groups?userId=${encodeURIComponent(userId)}`);
  },
  async getUserGroupRequests(userId: string) {
    return await request(`/user/group-requests`);
  },
  async getUserPowerTeamRequests(userId: string) {
    return await request(`/user/power-team-requests`);
  },
  async getGroupReferrals(groupId: string) {
    return await request(`/groups/${groupId}/referrals`);
  },
  async getGroupEvents(groupId: string) {
    return await request(`/groups/${groupId}/events`);
  },
  async getPowerTeamReferrals(teamId: string) {
    return await request(`/power-teams/${teamId}/referrals`);
  },
  async getPowerTeamEvents(teamId: string) {
    return await request(`/power-teams/${teamId}/events`);
  },
  // LMS APIs
  async lmsCourses() { return await request('/lms/courses'); },
  async lmsCourseLessons(courseId: string) { return await request(`/lms/courses/${courseId}/lessons`); },
  async lmsLessonMaterials(lessonId: string) { return await request(`/lms/lessons/${lessonId}/materials`); },
  async lmsExams() { return await request('/lms/exams'); },
  async lmsSaveExam(exam: any) { return await request('/lms/exams', { method: 'POST', body: JSON.stringify(exam) }); },
  async lmsDeleteExam(id: string) { return await request(`/lms/exams/${id}`, { method: 'DELETE' }); },
  async lmsCourseExams(courseId: string) { return await request(`/lms/courses/${courseId}/exams`); },
  async lmsExamQuestions(examId: string) { return await request(`/lms/exams/${examId}/questions`); },
  async lmsSubmitAttempt(examId: string, payload: any) { return await request(`/lms/exams/${examId}/attempts`, { method: 'POST', body: JSON.stringify(payload) }); },
  async lmsGetCourses() { return await request('/lms/courses'); },

  // Memberships
  async getMemberships() { return await request('/memberships'); },
  async extendMembership(userId: string, months?: number, endDate?: string, planName?: string) {
    return await request('/memberships/extend', { method: 'POST', body: JSON.stringify({ userId, months, endDate, planName }) });
  },
  async remindMembership(userId: string) {
    return await request(`/memberships/${userId}/remind`, { method: 'POST' });
  },
  async createMembership(payload: any) { return await request('/memberships', { method: 'POST', body: JSON.stringify(payload) }); },
  async updateMembership(id: string, payload: any) { return await request(`/memberships/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },

  // Documents
  async getDocuments() {
    return await request('/documents');
  },
  async uploadDocument(payload: any) {
    return await request('/documents', { method: 'POST', body: JSON.stringify(payload) });
  },
  async deleteDocument(id: string) {
    return await request(`/documents/${id}`, { method: 'DELETE' });
  },

  // Visitors
  async getGroupVisitors(groupId: string) {
    return await request(`/groups/${groupId}/visitors`);
  },
  async getChampions() {
    return await request('/champions');
  },
  async getVisitorsByUser(userId: string) {
    return await request(`/user/visitors?userId=${encodeURIComponent(userId)}`);
  },
  async createVisitor(payload: any) {
    return await request('/visitors', { method: 'POST', body: JSON.stringify(payload) });
  },
  async createMember(payload: any) {
    return await request('/admin/members', { method: 'POST', body: JSON.stringify(payload) });
  },
  async convertVisitorToMember(visitorId: string) {
    return await request(`/visitors/${visitorId}/convert`, { method: 'POST' });
  },
  async getPowerTeamSynergy(teamId: string) {
    return await request(`/power-teams/${teamId}/synergy`);
  },
  async getUserById(id: string):Promise<UserDetailSnapshot> {
    const owner=JSON.parse(localStorage.getItem('auth-storage')||'null')?.state?.user?.id;
    if(typeof owner!=='string'||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))throw new Error('Geçersiz profil bağlamı');
    const data=await request(`/users/${id}`);
    if(!validUserDetail(data,owner,id))throw new Error('Profil yanıtı doğrulanamadı. Tekrar deneyin.');
    return data;
  },
  async getOneToOnes(userId: string) {
    if(!userId?.trim()) throw new Error('Missing activity user');
    const rows = await request('/one-to-ones');
    if (!Array.isArray(rows) || rows.some((row: any)=>!validMeetingRow(row) || (row.requester_id!==userId && row.partner_id!==userId))) throw new Error('Invalid activity list');
    // Requests are scheduling intent, not completed performance/report activities.
    return rows.filter((row: any)=>row.record_kind==='ACTIVITY' && row.status==='COMPLETED');
  },
  async logCompletedMeeting(payload: {requestId:string;senderId:string;partnerId:string;meetingDate:string;notes:string}) {
    const {senderId,...body}=payload;
    const row=await request('/one-to-ones',{method:'POST',body:JSON.stringify(body)});
    if(!validMeetingRow(row) || row.id!==payload.requestId || row.requester_id!==senderId || row.partner_id!==payload.partnerId
        || row.status!=='COMPLETED' || row.notes!==payload.notes.trim() || Date.parse(row.meeting_date)!==Date.parse(payload.meetingDate)) throw new Error('Unconfirmed completed activity');
    return row;
  },
  async getEducationByUser(userId: string) {
    return await request(`/users/${userId}/education`);
  },
  async getUserAttendance(userId: string) {
    return await request(`/users/${userId}/attendance`);
  },

  async requestFriendship(requesterId: string, targetId: string, note?: string) {
    return await request('/user/friends/request', { method: 'POST', body: JSON.stringify({ targetId, note }) });
  },
  async acceptFriendship(userId: string, senderId: string) {
    return await request(`/user/friends/request/${senderId}/accept`, { method: 'POST' });
  },
  async rejectFriendship(userId: string, senderId: string) {
    return await request(`/user/friends/request/${senderId}/reject`, { method: 'POST' });
  },
  async getAdminPowerTeamSettings(owner:string):Promise<PowerTeamSettings[]> {
    const row=await request('/admin/power-team-settings');
    if (!row || row.settingsVersion!==1 || row.ownerId!==owner.toLowerCase() || !Array.isArray(row.teams) || row.teams.length>1000
      || !row.teams.every(validPowerTeam) || new Set(row.teams.map((t:PowerTeamSettings)=>t.id)).size!==row.teams.length) throw new Error('Lonca listesi doğrulanamadı.');
    return row.teams;
  },
  async createPowerTeam(payload: { id?:string,name: string, description?: string },owner?:string) {
    return confirmedPowerTeam(await request('/power-teams', { method: 'POST', body: JSON.stringify(payload) }),payload,owner,payload.id);
  },
  async updatePowerTeam(id: string, payload: Partial<PowerTeamSettings>,owner?:string) {
    return confirmedPowerTeam(await request(`/power-teams/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),payload,owner,id);
  },
  async deletePowerTeam(id: string) {
    return await request(`/power-teams/${id}`, { method: 'DELETE' });
  },

  async submitMeetingReport(payload: any) {
    return await request('/events/report', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getNotifications(userId: string) {
    return await request('/notifications');
  },
  async markNotificationRead(id: string) {
    await request(`/notifications/${id}/read`, { method: 'PUT' });
    return { success: true };
  },


  // Email Configuration
  async getEmailConfigs() {
    return await request('/admin/email-config');
  },
  async createEmailConfig(payload: any) {
    return await request('/admin/email-config', { method: 'POST', body: JSON.stringify(payload) });
  },
  async activateEmailConfig(id: string) {
    return await request(`/admin/email-config/${id}/activate`, { method: 'PUT' });
  },
  async deleteEmailConfig(id: string) {
    return await request(`/admin/email-config/${id}`, { method: 'DELETE' });
  },
  async testEmailConfig(email: string) {
    return await request('/admin/email-config/test', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async getTrafficLightReport() {
    return await request('/reports/traffic-lights');
  },
  async getAttendanceReport() {
    return await request('/reports/attendance-stats');
  },

  // Meeting Requests (One-to-Ones)
  async getMyMeetingRequests(userId: string) {
    if (!userId?.trim()) throw new Error('Missing meeting user');
    const rows = await request('/one-to-ones');
    if (!Array.isArray(rows) || rows.some((r: any) => !validMeetingRow(r)
        || (r.requester_id !== userId && r.partner_id !== userId))) throw new Error('Invalid meeting list');
    return rows.map((r: any) => ({
      id: r.id, topic: r.notes || 'Birebir Görüşme', proposedTime: r.meeting_date,
      created_at: r.created_at, status: r.status,
      senderName: r.requester_name, receiverName: r.partner_name,
      receiverId: r.partner_id, senderId: r.requester_id,
      recordKind: r.record_kind ?? 'ACTIVITY'
    }));
  },
  async updateMeetingStatus(id: string, status: string) {
    if (!id?.trim() || !['ACCEPTED','REJECTED'].includes(status)) throw new Error('Invalid meeting action');
    const row = await request(`/one-to-ones/${encodeURIComponent(id)}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (!validMeetingRow(row) || row.id !== id || row.status !== status) throw new Error('Unconfirmed meeting status');
    return { success: true, data: row };
  },

  async getMessages(userId: string, friendId: string) {
    return await request(`/messages/${friendId}`);
  },
  async getConversations(userId: string) {
    return await request(`/messages/conversations`);
  },
  async sendMessage(senderId: string, receiverId: string, content: string) {
    return await request(`/messages/${receiverId}`, { method: 'POST', body: JSON.stringify({ content }) });
  },

  async submitPublicVisitorApplication(payload: any) {
    return await request('/visitors/apply', { method: 'POST', body: JSON.stringify(payload) });
  },
  async sendVisitorInvite(payload: { email: string, origin: string }) {
    return await request('/visitor-invite', { method: 'POST', body: JSON.stringify(payload) });
  },
  async verifyVisitorInvite(token: string) {
    try {
      return await request(`/visitor-invite/verify?token=${encodeURIComponent(token)}`);
    } catch (error: any) {
      if (error?.status === 400 && typeof error.responseBody === 'string') {
        let body;
        try { body = JSON.parse(error.responseBody); } catch { /* Reject malformed error responses. */ }
        if (body?.code === 'INVALID_INVITE' && body.valid === false && typeof body.error === 'string') return body;
      }
      throw error;
    }
  },
  async getPublicVisitors() {
    return await request('/admin/public-visitors');
  },
  async updatePublicVisitorStatus(id: string, status: string, groupId?: string, formData?: any) {
    return await request(`/admin/public-visitors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, group_id: groupId, form_data: formData }) });
  },
  async deletePublicVisitor(id: string) {
    return await request(`/admin/public-visitors/${id}`, { method: 'DELETE' });
  },
  async getFriendRequests(userId: string) { // Incoming
    return await request('/user/friends/requests?type=incoming');
  },
  async checkFriendship(userId: string, targetId: string) {
    const res = await request(`/user/friends/check/${targetId}`);
    return res.status; // FRIEND, PENDING_SENT, PENDING_RECEIVED, NONE
  },
  async submitAttendance(payload: any) {
    return await request('/events/attendance', { method: 'POST', body: JSON.stringify(payload) });
  },
  async getAttendanceSubstitutes(groupId: string) {
    return await request(`/groups/${groupId}/substitutes`);
  },
  async notifyMembersOfShuffle(items: Record<string, string[]>) {
    // TODO: Move logic to backend
    return await request('/shuffle/notify', { method: 'POST', body: JSON.stringify({ items }) });
  },
  async requestMeeting(payload: any) {
    const row = await request('/one-to-ones/request', { method: 'POST', body: JSON.stringify(payload) });
    if (!validMeetingRow(row) || !['PENDING', 'ACCEPTED', 'REJECTED'].includes(row.status)
        || row.id !== payload.requestId || row.partner_id !== payload.receiverId
        || row.requester_id !== payload.senderId || row.notes !== payload.topic.trim()
        || Date.parse(row.meeting_date) !== Date.parse(payload.proposedTime)) throw new Error('Unconfirmed meeting request');
    return row;
  },
  async createReferral(payload: any) {
    return await request('/referrals', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateReferral(id: string, payload: { status?: string; amount?: number }) {
    const row = await request(`/referrals/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (!row || row.id !== id || row.status !== payload.status || typeof row.receiver_id !== 'string'
        || payload.amount !== undefined && Number(row.amount) !== payload.amount) throw new Error('Referans sonucu doğrulanamadı.');
    return row;
  },
  // System Settings
  async getSystemSettings() {
    return await request('/admin/system-settings');
  },
  async updateSystemSetting(key: string, value: string) {
    return await request('/admin/system-settings', { method: 'POST', body: JSON.stringify({ key, value }) });
  },
  async sendMembershipInvite(visitorId: string) {
    return await request(`/admin/visitors/${visitorId}/send-membership-invite`, { method: 'POST' });
  },
  async deleteVisitorGroup(id: string) {
    return await request(`/admin/visitors/${id}`, { method: 'DELETE' });
  },
  async getAccountingPayments() {
    return await request('/admin/accounting/payments');
  },
  async deleteAccountingPayment(type: 'VISITOR' | 'MEMBER', id: string) {
    return await request(`/admin/accounting/payments/${type}/${id}`, { method: 'DELETE' });
  },
  async uploadAccountingInvoice(type: 'VISITOR' | 'MEMBER', id: string, file: File) {
    const formData = new FormData();
    formData.append('invoice', file);
    return await request(`/admin/accounting/${type}/${id}/upload-invoice`, {
      method: 'POST',
      body: formData
    });
  }
};


export default api;

export const webGroupsTransport = { read: () => request('/me/web-groups') };

export const webActivitiesTransport = { read: () => request('/me/web-activities') };
