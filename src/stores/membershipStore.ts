import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Membership, MembershipPlan, MembershipStatus } from '../types';
import { api } from '../api/api';

interface MembershipStore {
  items: Membership[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  create: (payload: Omit<Membership, 'id' | 'status' | 'end_date' | 'last_renewal_date'> & { status?: MembershipStatus; end_date?: string }) => Promise<void>;
  update: (id: string, data: Partial<Membership>) => Promise<void>;
  renew: (id: string, plan?: MembershipPlan) => Promise<void>;
  expire: (id: string) => Promise<void>;
}

export const useMembershipStore = create<MembershipStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      fetchAll: async () => {
        set({ loading: true, error: null });
        try {
          const data = await api.getMemberships();
          // Auto-calculate expirations
          const now = new Date();
          const items = (data || []).map(item => {
            if (item.status === 'ACTIVE' && new Date(item.end_date) < now) {
              return { ...item, status: 'EXPIRED' as MembershipStatus };
            }
            return item;
          });
          set({ items, loading: false });
        } catch (e) {
          set({ error: 'Abonelikler yüklenirken hata oluştu', loading: false });
        }
      },

      create: async (payload) => {
        set({ loading: true, error: null });
        try {
          const created = await api.createMembership(payload);
          set(state => ({ items: [created, ...state.items], loading: false }));
        } catch (e) {
          set({ error: 'Abonelik oluşturulurken hata oluştu', loading: false });
        }
      },

      update: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updated = await api.updateMembership(id, data);
          set(state => ({ items: state.items.map(i => i.id === id ? updated : i), loading: false }));
        } catch (e) {
          set({ error: 'Abonelik güncellenirken hata oluştu', loading: false });
        }
      },

      renew: async (id, plan) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;

        const nextPlan = plan || item.plan;
        const now = new Date();
        const currentEnd = new Date(item.end_date);

        // If effective end date is in future, extend from there. Otherwise from now.
        const effectiveStart = (item.status === 'ACTIVE' && currentEnd > now && !isNaN(currentEnd.getTime()))
          ? currentEnd
          : now;

        const newEnd = new Date(effectiveStart);

        if (nextPlan === '4_MONTHS') newEnd.setMonth(newEnd.getMonth() + 4);
        else if (nextPlan === '8_MONTHS') newEnd.setMonth(newEnd.getMonth() + 8);
        else newEnd.setMonth(newEnd.getMonth() + 12); // 12 Months

        await get().update(id, {
          plan: nextPlan,
          status: 'ACTIVE',
          // If it was expired, start_date becomes now. If active and extending, maybe keep original or update?
          // Let's update start_date only if it was expired or new period is distinct.
          // For simplicity, let's effectively "extend" by setting end_date.
          // We update start_date to effectiveStart if it was expired, otherwise keep it? 
          // Actually, updating start_date to now if expired makes sense.
          start_date: (item.status !== 'ACTIVE' || effectiveStart === now) ? now.toISOString() : item.start_date,
          end_date: newEnd.toISOString(),
          last_renewal_date: now.toISOString(),
        });
      },

      expire: async (id) => {
        await get().update(id, { status: 'EXPIRED' });
      },
    }),
    {
      name: 'membership-store',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

