import { webActivitiesTransport } from './api';
export interface WebActivity { id: string; type: 'one_to_one' | 'referral' | 'visitor' | 'attendance'; created_at: string; status: string | null; title: string | null; scheduled_at: string | null; event_id: string | null; direction: 'given' | 'received' | null }
const uuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const webActivitiesApi = {
  async read(ownerId: string): Promise<WebActivity[]> {
    const data = await webActivitiesTransport.read();
    if (!data || data.ownerId !== ownerId || !Array.isArray(data.items) || data.items.length > 10) throw new Error('Invalid activity snapshot');
    const seen = new Set<string>(); let last = Infinity;
    for (const row of data.items) {
      const key = `${row?.type}:${row?.id}`, instant = Date.parse(row?.created_at);
      if (!row || !uuid(row.id) || seen.has(key) || !['one_to_one','referral','visitor','attendance'].includes(row.type)
        || typeof row.created_at !== 'string' || !Number.isFinite(instant) || instant > last
        || (row.status !== null && typeof row.status !== 'string') || (row.title !== null && typeof row.title !== 'string')
        || (row.scheduled_at !== null && (typeof row.scheduled_at !== 'string' || !Number.isFinite(Date.parse(row.scheduled_at))))
        || (row.type === 'attendance' ? !uuid(row.event_id) : row.event_id !== null)
        || (row.type === 'referral' ? !['given','received'].includes(row.direction) : row.direction !== null)) throw new Error('Invalid activity');
      seen.add(key); last = instant;
    }
    return data.items;
  },
};
