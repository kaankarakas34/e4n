import { webGroupsTransport } from './api';
export interface WebGroupMember { id: string; name: string; profession: string | null }
export interface WebGroup { id: string; name: string; meeting_dates: string[]; meeting_time: string | null; is_online: boolean; members: WebGroupMember[] }
const uuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const webGroupsApi = {
  async read(ownerId: string): Promise<WebGroup[]> {
    const data = await webGroupsTransport.read();
    if (!data || data.ownerId !== ownerId || !Array.isArray(data.groups) || data.groups.length > 100) throw new Error('Invalid group snapshot');
    const groups = new Set<string>(); let count = 0;
    for (const g of data.groups) {
      if (!g || !uuid(g.id) || groups.has(g.id) || typeof g.name !== 'string' || typeof g.is_online !== 'boolean'
        || (g.meeting_time !== null && typeof g.meeting_time !== 'string') || !Array.isArray(g.meeting_dates)
        || g.meeting_dates.some((d: unknown) => typeof d !== 'string' || !Number.isFinite(Date.parse(d))) || !Array.isArray(g.members)) throw new Error('Invalid group');
      groups.add(g.id); const members = new Set<string>(); count += g.members.length;
      for (const m of g.members) {
        if (!m || !uuid(m.id) || members.has(m.id) || typeof m.name !== 'string'
          || (m.profession !== null && typeof m.profession !== 'string')) throw new Error('Invalid member');
        members.add(m.id);
      }
    }
    if (count > 5000) throw new Error('Invalid group size');
    return data.groups;
  },
};
