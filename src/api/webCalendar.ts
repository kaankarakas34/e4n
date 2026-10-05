import { webCalendarTransport } from './api';

export interface WebCalendarItem { id: string; type: 'meeting' | 'one_to_one' | 'visitor'; title: string; start_at: string; location: string | null }
export const webCalendarApi = {
  async read(ownerId: string, from: string, to: string): Promise<WebCalendarItem[]> {
    const data = await webCalendarTransport.read(from, to);
    if (!data || data.ownerId !== ownerId || data.from !== from || data.to !== to || !Array.isArray(data.items)
      || data.items.length > 1000) throw new Error('Invalid calendar response');
    const seen = new Set<string>();
    for (const row of data.items) {
      const key = `${row?.type}:${row?.id}`;
      if (!row || typeof row.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id)
        || !['meeting', 'one_to_one', 'visitor'].includes(row.type) || typeof row.title !== 'string'
        || typeof row.start_at !== 'string' || !Number.isFinite(Date.parse(row.start_at))
        || Date.parse(row.start_at) < Date.parse(from) || Date.parse(row.start_at) >= Date.parse(to)
        || (row.location !== null && typeof row.location !== 'string') || seen.has(key)) throw new Error('Invalid calendar item');
      seen.add(key);
    }
    return data.items;
  },
};
