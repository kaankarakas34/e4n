import { emailService } from '../services/emailService';
const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4005/api';
import { mockMembers, mockGroups, mockPowerTeams } from './mockData';

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
    try {
      return await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    } catch {
      // Mock successful login for demo
      if (email === 'admin@demo.com') {
        return {
          user: { id: 'admin-id', email, name: 'Admin Demo', role: 'ADMIN', profession: 'System Admin', full_name: 'Admin Demo' },
          token: 'mock-admin-token'
        };
      }
      // Allow other demo users
      if (email.endsWith('@demo.com')) {
        let realId = 'user-' + email;
        let role = 'MEMBER';

        // Use REAL DB IDs for known demo users to ensure data visibility
        if (email === 'member@demo.com') {
          realId = '8fe43177-583a-4a7b-a759-3ecd951f22d7';
        } else if (email === 'user@demo.com') {
          realId = 'e966baaf-1cbc-4e34-a8a8-0f752c69ff22';
        } else if (email === 'grupbaskani@demo.com') {
          realId = '3fd66bdf-5835-4f5f-a70e-e850d365ae41';
          role = 'PRESIDENT';
        }

        return {
          user: {
            id: realId,
            email,
            name: email === 'grupbaskani@demo.com' ? 'Grup Başkanı' : 'Demo User',
            role,
            profession: email === 'grupbaskani@demo.com' ? 'İşletme Danışmanı' : 'Demo Meslek',
            full_name: email === 'grupbaskani@demo.com' ? 'Grup Başkanı' : 'Demo Üye',
            friends: ['receiver@demo.com'] // Mock friend for meetings
          },
          token: email === 'grupbaskani@demo.com' ? 'mock-president-token' : 'mock-user-token'
        };
      }
      throw new Error('Login failed. Use any @demo.com email.');
    }
  },

  async getPaymentToken(payload: any) {
    try {
      return await request('/payment/get-token', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      // Mock for safety if backend not ready
      console.warn('Backend payment endpoint missing, returning null');
      return { token: null };
    }
  },

  async requestRegistration(payload: any) {
    return await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getMe(token?: string) {
    if (token === 'mock-admin-token') {
      return { id: 'admin-id', email: 'admin@demo.com', name: 'Admin Demo', role: 'ADMIN', profession: 'System Admin', full_name: 'Admin Demo' };
    }
    if (token === 'mock-user-token') {
      // Let it hit the backend to get the REAL DB user object (with correct UUID)
      // This ensures frontend user.id matches backend records
    }

    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return await request('/users/me', { headers });
  },

  async updateMe(data: any) {
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        token = parsed?.state?.token;
      } catch (e) { }
    }
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return await request('/users/me', { method: 'PUT', headers, body: JSON.stringify(data) });
  },

  async updateUser(id: string, data: any) {
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        token = parsed?.state?.token;
      } catch (e) { }
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
    try { return await request('/groups'); } catch { return []; }
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
    try {
      return await request('/events');
    } catch (e) {
      console.error('API getEvents failed:', e);
      // Return empty instead of mock to prove real data connection or lack thereof
      return [];

    }
  },
  async getEvent(id: string) {
    // In real app: return await request(`/events/${id}`);
    const events = await this.getEvents();
    return events.find((e: any) => e.id === id);
  },
  async createEvent(payload: any) {
    try { return await request('/events', { method: 'POST', body: JSON.stringify(payload) }); } catch { return { id: 'mock', ...payload }; }
  },
  async deleteEvent(id: string) {
    try { await request(`/events/${id}`, { method: 'DELETE' }); } catch { /* noop */ }
  },
  async registerForEvent(eventId: string) {
    return await request(`/events/${eventId}/register`, { method: 'POST' });
  },
  async getGroups() {
    try {
      return await request('/groups');
    } catch {
      return mockGroups.map(g => ({
        ...g,
        member_count: this._mockMembers.filter((m: any) => m.groupId === g.id).length
      }));
    }
  },
  async createGroup(payload: any) {
    try { return await request('/groups', { method: 'POST', body: JSON.stringify(payload) }); } catch { return { id: 'mock', status: 'DRAFT', ...payload }; }
  },
  async getGroupMembers(groupId: string) {
    try { return await request(`/groups/${groupId}/members`); } catch { return this._mockMembers.filter((m: any) => m.groupId === groupId); }
  },
  async getCalendar(userId: string) {
    try { return await request(`/calendar?userId=${encodeURIComponent(userId)}`); } catch { return []; }
  },
  async getUserByEmail(email: string) {
    try {
      const rows = await request(`/users/by-email?email=${encodeURIComponent(email)}`);
      return Array.isArray(rows) ? rows[0] : null;
    } catch {
      if (email === 'admin@demo.com') return { id: '00000000-0000-0000-0000-000000000001', email, name: 'Admin Demo', role: 'ADMIN' };
      if (email === 'president@demo.com') return { id: '00000000-0000-0000-0000-000000000003', email, name: 'Başkan Demo', role: 'PRESIDENT' };
      if (email === 'manager@demo.com') return { id: '00000000-0000-0000-0000-000000000004', email, name: 'Grup Yöneticisi', role: 'PRESIDENT' };
      if (email === 'member@demo.com') return { id: '00000000-0000-0000-0000-000000000002', email, name: 'Üye Demo', role: 'MEMBER' };
      return null;
    }
  },
  async getUserPowerTeams(userId: string) {
    try { return await request(`/user/power-teams?userId=${encodeURIComponent(userId)}`); } catch {
      const member = this._mockMembers.find(m => m.id === userId);
      if (member && member.powerTeamId) {
        const team = mockPowerTeams.find(t => t.id === member.powerTeamId);
        return team ? [team] : [];
      }
      return [];
    }
  },
  async getPowerTeams() {
    try {
      return await request('/power-teams');
    } catch {
      return mockPowerTeams.map(t => ({
        ...t,
        member_count: this._mockMembers.filter((m: any) => m.powerTeamId === t.id).length
      }));
    }
  },
  async createPowerTeam(payload: any) {
    try { return await request('/power-teams', { method: 'POST', body: JSON.stringify(payload) }); } catch { return { id: 'mock', status: 'DRAFT', ...payload }; }
  },
  async getPowerTeamMembers(powerTeamId: string) {
    try { return await request(`/power-teams/${powerTeamId}/members`); } catch { return this._mockMembers.filter((m: any) => m.powerTeamId === powerTeamId); }
  },

  async getNetwork() {
    try {
      // READ DATA FROM LOCAL STORAGE
      let token = null;
      try {
        const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        token = storage.state?.token;
      } catch (e) { }

      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      return await request('/user/friends', { headers });
    } catch { return []; }
  },
  // Members management (mock state)
  _mockMembers: mockMembers,



  async getMembers() {
    try {
      return await request('/admin/members');
    } catch {
      return this._mockMembers;
    }
  },

  _mockPayments: [
    { id: '1', member_id: '1', year: 2024, month: 1, status: 'PAID', amount: 1000, paid_at: '2024-01-05' },
    { id: '2', member_id: '1', year: 2024, month: 2, status: 'PAID', amount: 1000, paid_at: '2024-02-05' },
    { id: '3', member_id: '1', year: 2024, month: 3, status: 'PAID', amount: 1000, paid_at: '2024-03-05' },
    { id: '4', member_id: '1', year: 2024, month: 4, status: 'PENDING', amount: 1000 },
    { id: '5', member_id: '2', year: 2024, month: 1, status: 'PAID', amount: 1000, paid_at: '2024-01-10' },
    { id: '6', member_id: '2', year: 2024, month: 2, status: 'UNPAID', amount: 1000 },
  ] as any[],

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
    try {
      // Pass token in headers if needed, but request() helper doesn't do it automatically unless we wrap it or assume global token (which we don't fully have here).
      // Ideally we read from local storage or auth store. For now let's hope auth header is handled or we read it.
      // The `getNetwork` method reads from localStorage. Let's replicate that quick fix or better yet, assume the caller handles it?
      // No, let's use the quick fix to get token.
      let token = null;
      try {
        const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        token = storage.state?.token;
      } catch (e) { }
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      return await request(`/groups/${groupId}/join`, { method: 'POST', headers });
    } catch { return { success: false }; }
  },

  async requestJoinPowerTeam(userId: string, ptId: string) {
    let token = null;
    try {
      const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      token = storage.state?.token;
    } catch (e) { }
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try { return await request(`/power-teams/${ptId}/join`, { method: 'POST', headers }); } catch { return { success: false }; }
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
    this._mockMembers = this._mockMembers.filter(m => m.id !== id);
    return { success: true };
  },

  async deleteGroupMember(groupId: string, userId: string) {
    return await request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
  },

  async deletePowerTeamMember(ptId: string, userId: string) {
    return await request(`/power-teams/${ptId}/members/${userId}`, { method: 'DELETE' });
  },

  async getUserGroups(userId: string) {
    try {
      return await request(`/user/groups?userId=${encodeURIComponent(userId)}`);
    } catch {
      const member = this._mockMembers.find(m => m.id === userId);
      if (member && member.groupId) {
        const group = mockGroups.find(g => g.id === member.groupId);
        return group ? [group] : [];
      }
      // Mock data for demo users
      if (userId === '00000000-0000-0000-0000-000000000001' || userId === '00000000-0000-0000-0000-000000000003' || userId === '00000000-0000-0000-0000-000000000002' || userId === '00000000-0000-0000-0000-000000000004') { // Admin, President, Member, or Manager
        return [{ id: '1', name: 'Liderler Global' }];
      }
      return [];
    }
  },
  async getUserGroupRequests(userId: string) {
    try { return await request(`/user/group-requests`); } catch { return []; }
  },
  async getUserPowerTeamRequests(userId: string) {
    try { return await request(`/user/power-team-requests`); } catch { return []; }
  },
  async getGroupReferrals(groupId: string) {
    try { return await request(`/groups/${groupId}/referrals`); } catch { return []; }
  },
  async getGroupEvents(groupId: string) {
    try { return await request(`/groups/${groupId}/events`); } catch { return []; }
  },
  async getPowerTeamReferrals(teamId: string) {
    try { return await request(`/power-teams/${teamId}/referrals`); } catch { return []; }
  },
  async getPowerTeamEvents(teamId: string) {
    try { return await request(`/power-teams/${teamId}/events`); } catch { return []; }
  },
  // LMS APIs
  async lmsCourses() { try { return await request('/lms/courses'); } catch { return []; } },
  async lmsCourseLessons(courseId: string) { try { return await request(`/lms/courses/${courseId}/lessons`); } catch { return []; } },
  async lmsLessonMaterials(lessonId: string) { try { return await request(`/lms/lessons/${lessonId}/materials`); } catch { return []; } },



  // Exams
  _mockExams: [
    {
      id: 'exam1',
      title: 'Networking Temelleri Sınavı',
      description: 'Temel networking kavramları ve kuralları üzerine yeterlilik testi.',
      duration: 15,
      questions: [
        { id: 'q1', text: 'Networking\'in temel amacı nedir?', options: ['Satış yapmak', 'İlişki kurmak', 'Kartvizit toplamak'], correct: 'İlişki kurmak' },
        { id: 'q2', text: 'Bir toplantıda ilk yapılması gereken nedir?', options: ['Hemen ürün satmak', 'Kendini tanıtmak ve dinlemek', 'Sadece yemek yemek'], correct: 'Kendini tanıtmak ve dinlemek' }
      ],
      passingScore: 70
    },
    {
      id: 'exam2',
      title: 'Liderlik Yetkinlik Testi',
      description: 'Grup yönetimi ve liderlik becerilerinizi ölçün.',
      duration: 30,
      questions: [
        { id: 'q1', text: 'İyi bir liderin en önemli özelliği nedir?', options: ['Otoriter olmak', 'İletişim ve empati', 'Her şeyi tek başına yapmak'], correct: 'İletişim ve empati' },
      ],
      passingScore: 80
    }
  ] as any[],

  async lmsExams() {
    return this._mockExams;
  },

  async lmsSaveExam(exam: any) {
    if (exam.id) {
      this._mockExams = this._mockExams.map(e => e.id === exam.id ? exam : e);
      return exam;
    } else {
      const newExam = { ...exam, id: Math.random().toString(36).substr(2, 9) };
      this._mockExams.push(newExam);
      return newExam;
    }
  },

  async lmsDeleteExam(id: string) {
    this._mockExams = this._mockExams.filter(e => e.id !== id);
    return { success: true };
  },

  async lmsCourseExams(courseId: string) { try { return await request(`/lms/courses/${courseId}/exams`); } catch { return []; } },
  async lmsExamQuestions(examId: string) { try { return await request(`/lms/exams/${examId}/questions`); } catch { return []; } },
  async lmsSubmitAttempt(examId: string, payload: any) { try { return await request(`/lms/exams/${examId}/attempts`, { method: 'POST', body: JSON.stringify(payload) }); } catch { return { score: 0, passed: false }; } },
  async lmsGetCourses() { try { return await request('/lms/courses'); } catch { return []; } },

  // Memberships
  async getMemberships() { try { return await request('/memberships'); } catch { return []; } },
  async extendMembership(userId: string, months?: number, endDate?: string, planName?: string) {
    return await request('/memberships/extend', { method: 'POST', body: JSON.stringify({ userId, months, endDate, planName }) });
  },
  async createMembership(payload: any) { try { return await request('/memberships', { method: 'POST', body: JSON.stringify(payload) }); } catch { return { id: 'mock', ...payload }; } },
  async updateMembership(id: string, payload: any) { try { return await request(`/memberships/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); } catch { return { id, ...payload }; } },

  // Documents (LMS)
  _mockDocuments: [
    { id: '1', title: 'E4N El Kitabı', category: 'GENERAL', url: '#', file_type: 'PDF', uploaded_by: '00000000-0000-0000-0000-000000000001', created_at: '2023-01-01', description: 'Temel kurallar ve işleyiş.' },
    { id: '2', title: 'Lonca Stratejileri', category: 'EDUCATION', url: '#', file_type: 'PDF', uploaded_by: '00000000-0000-0000-0000-000000000001', created_at: '2023-02-15' },
  ] as any[],

  async getDocuments() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this._mockDocuments;
  },

  async uploadDocument(payload: any) {
    const newDoc = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      ...payload
    };
    this._mockDocuments.unshift(newDoc);
    return newDoc;
  },

  async deleteDocument(id: string) {
    this._mockDocuments = this._mockDocuments.filter(d => d.id !== id);
    return { success: true };
  },

  // Mock Visitors
  _mockVisitors: [
    { id: '1', group_id: '1', name: 'Caner Erkin', profession: 'Mimar', phone: '555-111-2233', inviter_id: '1', status: 'VISITED', visited_at: '2023-11-20' },
    { id: '2', group_id: '1', name: 'Selin Şekerci', profession: 'Grafik Tasarım', phone: '555-444-5566', inviter_id: '4', status: 'CONVERTED', visited_at: '2023-10-15' },
    { id: '3', group_id: '1', name: 'Burak Yılmaz', profession: 'E-Ticaret Danışmanı', phone: '555-777-8899', inviter_id: '2', status: 'VISITED', visited_at: '2023-11-13' },
  ] as any[],

  async getGroupVisitors(groupId: string) {
    try { return await request(`/groups/${groupId}/visitors`); } catch { return []; }
  },

  async getChampions() {
    try { return await request('/champions'); } catch { return []; }
  },

  async getVisitorsByUser(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this._mockVisitors.filter(v => v.inviter_id === userId);
  },

  async createVisitor(payload: any) {
    const newVisitor = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'VISITED',
      visited_at: new Date().toISOString(),
      ...payload
    };
    this._mockVisitors.unshift(newVisitor);

    // Update Inviter's Performance Score
    const inviter = this._mockMembers.find(m => m.id === payload.inviter_id);
    if (inviter) {
      inviter.performance_score = Math.min((inviter.performance_score || 0) + 5, 100); // +5 points for visitor
      // Update color based on new score
      if (inviter.performance_score >= 80) inviter.performance_color = 'GREEN';
      else if (inviter.performance_score >= 50) inviter.performance_color = 'YELLOW';
      else inviter.performance_color = 'RED';
    }

    return newVisitor;
  },

  async createMember(payload: any) {
    // Mock API call
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Member created successfully',
          data: { id: 'new-mem-' + Date.now(), ...payload }
        });
      }, 1000);
    });
  },

  async convertVisitorToMember(visitorId: string) {
    const visitor = this._mockVisitors.find(v => v.id === visitorId);
    if (visitor) {
      visitor.status = 'CONVERTED';
      // Auto-add to members list as PENDING
      await this.requestRegistration({
        email: `${visitor.name.toLowerCase().replace(/\s/g, '.')}@example.com`,
        name: visitor.name,
        profession: visitor.profession,
        phone: visitor.phone,
        company: 'Visitor Co.'
      });
      return { success: true };
    }
    return { success: false };
  },
  async getPowerTeamSynergy(teamId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock matrix: [Giver Name, Receiver Name, Count]
    return [
      { from: 'Ahmet Yılmaz', to: 'Ali Can', count: 12 },
      { from: 'Ali Can', to: 'Ahmet Yılmaz', count: 8 },
      { from: 'Fatma Demir', to: 'Ali Can', count: 5 },
      { from: 'Zeynep Çelik', to: 'Ayşe Kaya', count: 15 },
      { from: 'Ayşe Kaya', to: 'Zeynep Çelik', count: 10 },
    ];
  },
  async getUserById(id: string) {
    try {
      return await request(`/users/${id}`);
    } catch {
      return null;
    }
  },

  // Mock One-to-Ones
  _mockOneToOnes: [
    { id: '1', meeting_date: '2023-11-25', member_id_1: '1', member_id_2: '2', with_person: 'Ayşe Kaya', notes: 'İş birliği görüşmesi', status: 'COMPLETED' },
    { id: '2', meeting_date: '2023-11-20', member_id_1: '1', member_id_2: '4', with_person: 'Fatma Demir', notes: 'Proje detayları', status: 'COMPLETED' },
  ] as any[],

  async getOneToOnes(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this._mockOneToOnes.filter(m => m.member_id_1 === userId || m.member_id_2 === userId);
  },

  async getEducationByUser(userId: string) {
    // Mocking for now as we don't have a full Education/LMS tracking endpoint in this file yet specific to user history
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      { id: '1', title: 'Network Eğitimi 101', completed_date: '2023-11-01', hours: 1, member_id: userId, type: 'COURSE' as const, created_at: '2023-11-01' },
      { id: '2', title: 'Lonca Sinerjisi', completed_date: '2023-11-15', hours: 1, member_id: userId, type: 'SEMINAR' as const, created_at: '2023-11-15' }
    ];
  },


  async getUserAttendance(userId: string) {
    // Return attendance history
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock data based on _mockMeetings
    return this._mockMeetings.map(m => ({
      meeting_id: m.id,
      date: m.date,
      topic: m.topic,
      status: Math.random() > 0.1 ? 'PRESENT' : 'ABSENT' // 90% attendance
    }));
  },

  async requestFriendship(requesterId: string, targetId: string, note?: string) {
    console.log(`Friend request from ${requesterId} to ${targetId}`);
    // Check if duplicate
    const existing = this._mockFriendRequests.find(r => r.sender_id === requesterId && r.receiver_id === targetId);
    if (existing) return { success: false, message: 'Already pending' };

    this._mockFriendRequests.push({
      id: Math.random().toString(),
      sender_id: requesterId,
      receiver_id: targetId,
      note,
      status: 'PENDING',
      created_at: new Date().toISOString()
    });

    // Add notification
    const sender = this._mockMembers.find(m => m.id === requesterId);
    this._mockNotifications.push({
      id: Math.random().toString(),
      user_id: targetId,
      type: 'FRIEND_REQUEST',
      content: `${sender?.full_name || 'Birisi'} sana arkadaşlık isteği gönderdi.`,
      is_read: false,
      created_at: new Date().toISOString()
    });

    return { success: true, status: 'PENDING' };
  },

  async acceptFriendship(userId: string, senderId: string) { // userId is current user (receiver)
    console.log(`User ${userId} accepted ${senderId}`);

    // Change request status
    const req = this._mockFriendRequests.find(r => r.sender_id === senderId && r.receiver_id === userId);
    if (req) req.status = 'ACCEPTED';

    // Find users and add to friends array
    const user = this._mockMembers.find(m => m.id === userId);
    const target = this._mockMembers.find(m => m.id === senderId); // The original sender

    if (user && target) {
      if (!user.friends) user.friends = [];
      if (!target.friends) target.friends = [];
      if (!user.friends.includes(senderId)) user.friends.push(senderId);
      if (!target.friends.includes(userId)) target.friends.push(userId);
    }

    // Notify original sender
    this._mockNotifications.push({
      id: Math.random().toString(),
      user_id: senderId,
      type: 'FRIEND_ACCEPTED',
      content: `${user?.full_name} arkadaşlık isteğini kabul etti!`,
      is_read: false,
      created_at: new Date().toISOString()
    });

    return { success: true, status: 'ACCEPTED' };
  },

  async rejectFriendship(userId: string, senderId: string) {
    const req = this._mockFriendRequests.find(r => r.sender_id === senderId && r.receiver_id === userId);
    if (req) req.status = 'REJECTED';
    return { success: true, status: 'REJECTED' };
  },

  async submitMeetingReport(payload: any) {
    console.log('Meeting Report Submitted:', payload);
    return { success: true };
  },

  // Mock Notifications
  _mockNotifications: [
    { id: '1', user_id: '1', type: 'FRIEND_REQUEST', content: 'Ayşe Kaya sana arkadaşlık isteği gönderdi.', is_read: false, created_at: new Date().toISOString() },
    { id: '2', user_id: '1', type: 'MESSAGE', content: 'Ahmet Yılmaz sana yeni bir mesaj gönderdi.', is_read: true, created_at: new Date().toISOString() }
  ] as any[],

  async getNotifications(userId: string) {
    try {
      return await request('/notifications');
    } catch {
      return this._mockNotifications.filter(n => n.user_id === userId);
    }
  },

  async markNotificationRead(id: string) {
    try {
      await request(`/notifications/${id}/read`, { method: 'PUT' });
      return { success: true };
    } catch {
      const notif = this._mockNotifications.find(n => n.id === id);
      if (notif) notif.is_read = true;
      return { success: true };
    }
  },

  async getTrafficLightReport() {
    try { return await request('/reports/traffic-lights'); } catch { return []; }
  },

  async getPALMSReport() {
    try { return await request('/reports/palms'); } catch { return []; }
  },

  // Meeting Requests (One-to-Ones)
  async getMyMeetingRequests(userId: string) {
    try {
      // Fetch one-to-ones where the user is involved
      const rows = await request('/one-to-ones');
      // Map to MeetingRequest format expected by frontend
      return rows.map((r: any) => {
        // If direction is INCOMING (I am partner), Sender is Requester.
        // If direction is OUTGOING (I am requester), Sender is Me? No, usually in a list we want to see the "Other Person".
        // MeetingRequestsList expects 'senderName' to be the person who sent the request (if incoming) or...
        // If I sent it, maybe I want to see "To: Partner Name".
        // The UI says: {isIncoming ? req.senderName : 'Alıcı: ' + req.receiverId}
        // So if outgoing, it shows receiverId. Ideally should show receiverName.

        let senderName = 'Bilinmeyen';
        if (r.direction === 'INCOMING') {
          senderName = r.requester_name;
        } else {
          senderName = r.partner_name; // For display purposes as "Partner" even if label says sender
        }

        return {
          id: r.id,
          topic: r.notes || 'Birebir Görüşme',
          proposedTime: r.meeting_date,
          status: r.status || 'PENDING',
          senderName: senderName,
          receiverId: r.partner_id, // The 'Target' of the meeting
          senderId: r.requester_id
        };
      });
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

  // Mock Messages
  _mockMessages: [
    { id: '1', sender_id: '1', receiver_id: '4', content: 'Merhaba, proje ne durumda?', created_at: new Date(Date.now() - 3600000).toISOString(), is_read: true },
    { id: '2', sender_id: '4', receiver_id: '1', content: 'Selam, neredeyse bitti!', created_at: new Date(Date.now() - 1800000).toISOString(), is_read: false },
  ] as any[],

  async getMessages(userId: string, friendId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this._mockMessages
      .filter(m => (m.sender_id === userId && m.receiver_id === friendId) || (m.sender_id === friendId && m.receiver_id === userId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async getConversations(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Group last messages
    const conversationMap = new Map();
    this._mockMessages.forEach(m => {
      if (m.sender_id === userId || m.receiver_id === userId) {
        const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
        // Keep the latest
        if (!conversationMap.has(otherId) || new Date(m.created_at) > new Date(conversationMap.get(otherId).created_at)) {
          conversationMap.set(otherId, m);
        }
      }
    });
    // Convert to array and populate friend info
    return Promise.all(Array.from(conversationMap.keys()).map(async (friendId) => {
      const friend = await this.getUserById(friendId);
      const lastMsg = conversationMap.get(friendId);
      return {
        friend,
        lastMessage: lastMsg
      };
    }));
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const newMsg = {
      id: Math.random().toString(),
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      created_at: new Date().toISOString(),
      is_read: false
    };
    this._mockMessages.push(newMsg);
    // Create notification
    this._mockNotifications.push({
      id: Math.random().toString(),
      user_id: receiverId,
      type: 'MESSAGE',
      content: 'Yeni bir mesajın var!',
      is_read: false,
      created_at: new Date().toISOString()
    });
    return newMsg;
  },

  // Friend Requests
  _mockFriendRequests: [
    {
      id: 'mock-req-1',
      sender_id: '2',
      receiver_id: '1',
      status: 'PENDING',
      note: 'Merhaba Ali, geçen toplantıda bahsettiğin proje hakkında konuşmak isterim. Ekler misin?',
      created_at: new Date().toISOString()
    }
  ] as any[],

  // Public Visitor Applications (Leads)
  _mockPublicVisitors: [
    {
      id: 'pv1',
      name: 'Deniz Aksoy',
      email: 'deniz@example.com',
      phone: '555-123-4567',
      company: 'Aksoy Mimarlık',
      profession: 'Mimar',
      created_at: '2023-12-25T10:00:00Z',
      status: 'PENDING'
    },
    {
      id: 'pv2',
      name: 'Barış Demir',
      email: 'baris@example.com',
      phone: '555-987-6543',
      company: 'Demir Lojistik',
      profession: 'Lojistik Uzmanı',
      created_at: '2023-12-24T14:30:00Z',
      status: 'CONTACTED'
    }
  ] as any[],

  async submitPublicVisitorApplication(payload: any) {
    // 1. Save to Real DB
    const res = await request('/visitors/apply', { method: 'POST', body: JSON.stringify(payload) });

    // 2. Trigger Email Service
    try {
      // 1. Send confirmation to Visitor
      // Parse name if needed or use payload.name
      await emailService.sendEmail('VISITOR_WELCOME', payload.email, {
        name: payload.name
      });

      // 2. Send notification to Admin
      await emailService.sendEmail('VISITOR_ADMIN_ALERT', 'baskan@demo.com', {
        name: payload.name,
        company: payload.company || 'Belirtilmedi',
        profession: payload.profession || 'Belirtilmedi',
        email: payload.email,
        phone: payload.phone
      });
    } catch (e) {
      console.error('Email service trigger failed:', e);
    }

    return { success: true, data: res };
  },

  async getPublicVisitors() {
    return await request('/admin/public-visitors');
  },

  async updatePublicVisitorStatus(id: string, status: string) {
    return await request(`/admin/public-visitors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },

  async getFriendRequests(userId: string) { // Incoming
    return this._mockFriendRequests.filter(r => r.receiver_id === userId && r.status === 'PENDING').map(r => {
      const sender = this._mockMembers.find(m => m.id === r.sender_id);
      return { ...r, sender };
    });
  },

  async checkFriendship(userId: string, targetId: string) {
    // 1. Automatic Friendship via Common Groups
    try {
      const [myGroups, targetGroups] = await Promise.all([
        this.getUserGroups(userId),
        this.getUserGroups(targetId)
      ]);
      const hasCommonGroup = myGroups.some((mg: any) => targetGroups.some((tg: any) => tg.id === mg.id));
      if (hasCommonGroup) return 'FRIEND';
    } catch (e) {
      console.warn('Common group check error:', e);
    }

    // 2. Explicit Friendship (Mock/Database)
    const user = await this.getUserById(userId);
    // Note: user.friends is not currently returned by backend, so this is mostly for mock compatibility
    if (user?.friends?.includes(targetId)) return 'FRIEND';

    const pending = this._mockFriendRequests.find(r =>
      (r.sender_id === userId && r.receiver_id === targetId && r.status === 'PENDING')
    );
    if (pending) return 'PENDING_SENT';

    const incoming = this._mockFriendRequests.find(r =>
      (r.receiver_id === userId && r.sender_id === targetId && r.status === 'PENDING')
    );
    if (incoming) return 'PENDING_RECEIVED';

    return 'NONE';
  },

  // Mock Attendance Logic
  _mockAttendanceRequests: [] as any[],

  async submitAttendance(payload: any) {
    this._mockAttendanceRequests.push({
      id: Math.random().toString(),
      created_at: new Date().toISOString(),
      ...payload
    });
    return { success: true };
  },

  async getAttendanceSubstitutes(groupId: string) {
    try {
      return await request(`/groups/${groupId}/substitutes`);
    } catch {
      return [];
    }
  },

  async notifyMembersOfShuffle(items: Record<string, string[]>) {
    const groups = await this.getGroups();
    const members = await this.getMembers();

    // Iterate over groups and their members
    for (const groupId in items) {
      const group = groups.find((g: any) => g.id === groupId);
      if (!group) continue;

      const memberIds = items[groupId];
      for (const memberId of memberIds) {
        const member = members.find((m: any) => m.id === memberId);
        if (member && member.email) {
          // Send email
          // In a real scenario, this would be a single batch call to backend
          // For now we loop and call our service
          try {
            await emailService.sendEmail('SHUFFLE_NOTIFICATION', member.email, {
              name: member.full_name,
              groupName: group.name
            });

            // Create in-app notification
            this._mockNotifications.unshift({
              id: Math.random().toString(),
              user_id: member.id,
              type: 'SYSTEM',
              content: `Grup değişikliği tamamlandı. Yeni grubunuz: ${group.name}`,
              is_read: false,
              created_at: new Date().toISOString()
            });
          } catch (e) {
            console.error(`Failed to email shuffle notification to ${member.email}`, e);
          }
        }
      }
    }
    return { success: true };
  },

  // Admin Reports

  // 1-to-1 Meetings
  _mockMeetingRequests: [] as any[],

  async requestMeeting(payload: any) {
    const meeting = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'PENDING', // PENDING, ACCEPTED, REJECTED, CANCELLED
      created_at: new Date().toISOString(),
      ...payload
    };
    this._mockMeetingRequests.unshift(meeting);

    // Send email to receiver
    try {
      await emailService.sendEmail('MEETING_REQUEST', 'receiver@demo.com', { // In real app, look up receiver email
        sender: payload.senderName || 'Bir üye',
        date: new Date(payload.proposedTime).toLocaleString(),
        topic: payload.topic
      });
    } catch (e) { }

    return { success: true, data: meeting };
  },



  async createReferral(payload: any) {
    const referral = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      status: 'PENDING',
      ...payload
    };

    const receiverId = payload.receiverId;
    const giverId = payload.giverId;

    // @ts-ignore
    const receiver = this._mockMembers.find(m => m.id === receiverId);
    // @ts-ignore
    const giver = this._mockMembers.find(m => m.id === giverId);

    if (receiver) {
      // @ts-ignore
      this._mockNotifications.unshift({
        id: Math.random().toString(),
        user_id: receiverId,
        type: 'SYSTEM',
        content: `${giver?.full_name || 'Bir üye'} sana bir iş yönlendirdi!`,
        is_read: false,
        created_at: new Date().toISOString()
      });

      try {
        if (receiver.email) {
          await emailService.sendEmail('REFERRAL_RECEIVED', receiver.email, {
            name: receiver.full_name || receiver.name || 'Üye',
            sender: giver?.full_name || 'Bir üye',
            type: payload.type === 'INTERNAL' ? 'İç Yönlendirme' : 'Dış Yönlendirme',
            temperature: payload.temperature,
            description: payload.description || 'Detay yok'
          });
        }
      } catch (e) { }
    }

    return referral;
  },
};

export default api;
