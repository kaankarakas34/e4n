import { emailService } from '../services/emailService';
const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';


async function request(path: string, options?: RequestInit) {
  // Get token from localStorage (zustand persist stores it there)
  const authStorage = localStorage.getItem('auth-storage');
  let token = null;
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      token = parsed?.state?.token;
    } catch (e) {
      // Ignore parsing errors
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Auth mocks (extend later)
  // Auth
  async login(email: string, password: string) {
    return await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },

  async getPaymentToken(payload: any) {
    return await request('/payment/get-token', { method: 'POST', body: JSON.stringify(payload) });
  },

  async requestRegistration(payload: any) {
    return await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getMe(token?: string) {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return await request('/users/me', { headers });
  },

  async updateMe(data: any) {
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed?.state?.token;
    }
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return await request('/users/me', { method: 'PUT', headers, body: JSON.stringify(data) });
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
    try {
      return await request(`/referrals?userId=${encodeURIComponent(userId)}`);
    } catch {
      return [];
    }
  },
  async _legacy_createReferral(payload: any) {
    return await request('/referrals', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Shuffle & Admin
  async saveShuffle(assignments: Record<string, string[]>) {
    return await request('/shuffle/save', { method: 'POST', body: JSON.stringify({ assignments }) });
  },
  async moveMember(userId: string, groupId: string) {
    return await request('/admin/move-member', { method: 'POST', body: JSON.stringify({ userId, groupId }) });
  },
  async assignRole(userId: string, role: string, groupTitle?: string) {
    return await request('/admin/assign-role', { method: 'POST', body: JSON.stringify({ userId, role, groupTitle }) });
  },

  // Admin Reports
  async getAdminStats() {
    try { return await request('/reports/stats'); } catch {
      return { totalRevenue: 5425000, internalRevenue: 3255000, externalRevenue: 2170000, totalMembers: 1250, lostMembers: 12, totalGroups: 42, totalPowerTeams: 156, totalEvents: 145, totalVisitors: 320, visitorConversionRate: 18, totalOneToOnes: 854 };
    }
  },
  async getAdminCharts() {
    try { return await request('/reports/charts'); } catch {
      return { revenue: [], growth: [] };
    }
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

  async getTickets() {
    return await request('/tickets');
  },
  async createTicket(payload: { subject: string, message: string }) {
    return await request('/tickets', { method: 'POST', body: JSON.stringify(payload) });
  },
  async getTicketDetails(id: string) {
    return await request(`/tickets/${id}`);
  },
  async replyTicket(id: string, message: string) {
    return await request(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
  },
  async updateTicketStatus(id: string, status: 'OPEN' | 'CLOSED') {
    return await request(`/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
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
  async getEvents() {
    return await request('/events');
  },
  async getEvent(id: string) {
    // In real app: return await request(`/events/${id}`);
    const events = await this.getEvents();
    return events.find((e: any) => e.id === id);
  },
  async createEvent(payload: any) {
    return await request('/events', { method: 'POST', body: JSON.stringify(payload) });
  },
  async deleteEvent(id: string) {
    await request(`/events/${id}`, { method: 'DELETE' });
  },
  async registerForEvent(eventId: string) {
    return await request(`/events/${eventId}/register`, { method: 'POST' });
  },
  async getGroups() {
    return await request('/groups');
  },
  async createGroup(payload: any) {
    return await request('/groups', { method: 'POST', body: JSON.stringify(payload) });
  },
  async deleteGroup(id: string) {
    return await request(`/groups/${id}`, { method: 'DELETE' });
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
  async getPowerTeams() {
    return await request('/power-teams');
  },
  async createPowerTeam(payload: any) {
    return await request('/power-teams', { method: 'POST', body: JSON.stringify(payload) });
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
    await new Promise(resolve => setTimeout(resolve, 300));
    // Enrich mock meetings with report data just for demo
    return this._mockMeetings.filter(m => m.group_id === groupId).map(m => ({
      ...m,
      report: {
        notes: 'Verimli bir toplantıydı. Gelecek hafta misafir günü yapılacak.',
        best_networker: 'Fatma Demir',
        rating: 9
      }
    }));
  },

  async getGroupActivities(groupId: string) {
    try {
      return await request(`/groups/${groupId}/activities`);
    } catch {
      return [];
    }
  },

  async getMeetingAttendance(meetingId: string) {
    try { return await request(`/events/${meetingId}/attendance`); } catch { return []; }
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

    return await request(`/groups/${groupId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ status }), headers });
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
    return await request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
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
  async getUserById(id: string) {
    return await request(`/users/${id}`);
  },
  async getOneToOnes(userId: string) {
    return await request(`/one-to-ones?userId=${encodeURIComponent(userId)}`);
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

  async getTrafficLightReport() {
    return await request('/reports/traffic-lights');
  },
  async getAttendanceReport() {
    return await request('/reports/attendance-stats');
  },

  // Meeting Requests (One-to-Ones)
  async getMyMeetingRequests(userId: string) {
    try {
      const rows = await request('/one-to-ones');
      return rows.map((r: any) => ({
        id: r.id,
        topic: r.notes || 'Birebir Görüşme',
        proposedTime: r.meeting_date,
        status: r.status || 'PENDING',
        senderName: r.direction === 'INCOMING' ? r.requester_name : r.partner_name,
        receiverId: r.partner_id,
        senderId: r.requester_id
      }));
    } catch (e) {
      console.error("getMyMeetingRequests FAILED:", e);
      return [];
    }
  },

  async updateMeetingStatus(id: string, status: string) {
    try {
      const res = await request(`/one-to-ones/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      // Mock email sending logic can remain here or move to backend
      if (status === 'ACCEPTED') {
        // ... email logic ...
        // For now, let's trust the backend or frontend notification
      }
      return { success: true, data: res };
    } catch (e) {
      console.error("updateMeetingStatus failed:", e);
      throw e;
    }
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
  async getPublicVisitors() {
    return await request('/admin/public-visitors');
  },
  async updatePublicVisitorStatus(id: string, status: string) {
    return await request(`/admin/public-visitors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
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
    return await request('/one-to-ones/request', { method: 'POST', body: JSON.stringify(payload) });
  },
  async createReferral(payload: any) {
    return await request('/referrals', { method: 'POST', body: JSON.stringify(payload) });
  },
};

export default api;
