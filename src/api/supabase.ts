
import { createClient } from '@supabase/supabase-js';
import { api } from './api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
  async signIn(email: string, password: string) {
    return api.login(email, password);
  },
  async signOut() { },
  async getCurrentUser() { return null; },
  onAuthStateChange(_cb: (event: string, session: any) => void) { return { data: { subscription: { unsubscribe: () => { } } } }; },
};

export const db = {
  async getUserById(id: string) { return null; },
  async getUsersByChapter(chapterId: string) { return []; },
  async createReferral(referral: any) { return api.createReferral(referral); },
  async getReferralsByUser(userId: string) { return api.getReferralsByUser(userId); },
  async getCurrentMeeting(chapterId: string) { return null; },
  async getAttendanceByMeeting(meetingId: string) { return []; },
  async createOneToOne(oneToOne: any) { return null; },
  async getOneToOnesByUser(userId: string) { return []; },
  async createVisitor(visitor: any) { return null; },
  async getVisitorsByChapter(chapterId: string) { return []; },
  async createCEU(ceu: any) { return null; },
  async getCEUsByUser(userId: string) { return []; },
  async createTYFCB(tyfcb: any) { return null; },
  async getTYFCBByChapter(chapterId: string) { return []; },
};

export default supabase;
