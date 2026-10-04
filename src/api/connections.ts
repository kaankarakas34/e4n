import { referralTransport } from './api';
export type ConnectionState = 'NONE' | 'SELF' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIEND' | 'REJECTED';
export interface ConnectionProfile {
  version: 1; ownerId: string; targetId: string; status: ConnectionState; contactVisible: boolean; billingVisible: boolean;
  profile: { id: string; name: string; profession: string | null; company: string | null; bio: string | null; profile_image: string | null;
    email?: string | null; phone?: string | null; city?: string | null; website?: string | null; linkedin_profile?: string | null;
    tax_number?: string | null; tax_office?: string | null; billing_address?: string | null };
  commonGroups: { id: string; name: string }[];
}
export interface ConnectionRequest { id: string; sender_id: string; receiver_id: string; status: 'PENDING'; sender_name: string; sender_profession: string | null }
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const states: ConnectionState[] = ['NONE', 'SELF', 'PENDING_SENT', 'PENDING_RECEIVED', 'FRIEND', 'REJECTED'];
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const invalid = () => new Error('Bağlantı yanıtı doğrulanamadı. Tekrar deneyin.');
const profileKeys = ['id', 'name', 'profession', 'company', 'bio', 'profile_image', 'email', 'phone', 'city', 'website', 'linkedin_profile', 'tax_number', 'tax_office', 'billing_address'];
export const connectionsApi = {
  async profile(owner: string, target: string): Promise<ConnectionProfile> {
    if (!uuid(owner) || !uuid(target)) throw invalid();
    const r = await referralTransport.get<ConnectionProfile>(`/user/profiles/${target}`);
    if (!r || r.version !== 1 || !uuid(r.ownerId) || !same(r.ownerId, owner) || !uuid(r.targetId) || !same(r.targetId, target)
      || !states.includes(r.status) || (r.status === 'SELF') !== same(owner, target) || typeof r.contactVisible !== 'boolean' || typeof r.billingVisible !== 'boolean'
      || !r.profile || r.profile.id !== r.targetId || typeof r.profile.name !== 'string'
      || Object.entries(r.profile).some(([key, value]) => !profileKeys.includes(key) || value !== null && typeof value !== 'string')
      || r.billingVisible && !r.contactVisible || r.status === 'SELF' && (!r.contactVisible || !r.billingVisible) || r.status === 'FRIEND' && !r.contactVisible
      || !Array.isArray(r.commonGroups) || r.commonGroups.some(g => !uuid(g.id) || typeof g.name !== 'string')
      || new Set(r.commonGroups.map(g => g.id)).size !== r.commonGroups.length
      || (!r.contactVisible && ['email', 'phone', 'city', 'website', 'linkedin_profile'].some(k => k in r.profile))
      || (!r.billingVisible && ['tax_number', 'tax_office', 'billing_address'].some(k => k in r.profile))) throw invalid();
    return r;
  },
  async incoming(owner: string): Promise<ConnectionRequest[]> {
    if (!uuid(owner)) throw invalid();
    const rows = await referralTransport.get<ConnectionRequest[]>('/user/friends/requests?type=incoming');
    if (!Array.isArray(rows) || rows.some(r => !uuid(r.id) || !uuid(r.sender_id) || !uuid(r.receiver_id) || !same(r.receiver_id, owner)
      || same(r.sender_id, owner) || r.status !== 'PENDING' || typeof r.sender_name !== 'string'
      || r.sender_profession !== null && typeof r.sender_profession !== 'string')
      || new Set(rows.map(r => r.id)).size !== rows.length) throw invalid();
    return rows;
  },
  async mutate(owner: string, target: string, action: 'create' | 'accept' | 'reject'): Promise<void> {
    if (!uuid(owner) || !uuid(target) || same(owner, target) || !['create', 'accept', 'reject'].includes(action)) throw invalid();
    const r = await referralTransport.post<{ success: boolean; ownerId: string; targetId: string; requestId: string; status: ConnectionState; replay: boolean }>(
      action === 'create' ? '/user/friends/request' : `/user/friends/request/${target}/${action}`, action === 'create' ? { targetId: target } : {});
    if (!r || r.success !== true || !uuid(r.ownerId) || !same(r.ownerId, owner) || !uuid(r.targetId) || !same(r.targetId, target)
      || !uuid(r.requestId) || typeof r.replay !== 'boolean' || r.status !== ({ create: 'PENDING_SENT', accept: 'FRIEND', reject: 'REJECTED' }[action])) throw invalid();
  },
};
