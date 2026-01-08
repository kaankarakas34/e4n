import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/api';

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_at: string;
  end_at?: string;
  is_public: boolean;
  status?: string;
  event_type?: string;
  max_attendees?: number;
  price?: number;
  currency?: string;
  chapter_id?: string;
  attendees?: any[];
  has_equal_opportunity_badge?: boolean;
  city?: string;
  district?: string;
}

interface EventStore {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  createEvent: (payload: any) => Promise<void>;
  updateEvent: (id: string, payload: any) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],
      loading: false,
      error: null,

      fetchEvents: async () => {
        set({ loading: true, error: null });
        try {
          const data = await api.getEvents();
          set({ events: data || [], loading: false });
        } catch (e) {
          set({ error: 'Etkinlikler yüklenirken hata oluştu', loading: false });
        }
      },

      createEvent: async (payload) => {
        set({ loading: true, error: null });
        try {
          const created = await api.createEvent(payload);
          set(state => ({ events: [created, ...state.events], loading: false }));
        } catch (e) {
          set({ error: 'Etkinlik oluşturulurken hata oluştu', loading: false });
        }
      },

      updateEvent: async (id, payload) => {
        set({ loading: true, error: null });
        try {
          // @ts-ignore
          const updated = await api.updateEvent(id, payload);
          set(state => ({ events: state.events.map(e => e.id === id ? updated : e), loading: false }));
        } catch (e) {
          set({ error: 'Etkinlik güncellenirken hata oluştu', loading: false });
        }
      },

      deleteEvent: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await api.deleteEvent(id);
          set(state => ({ events: state.events.filter(e => e.id !== id), loading: false }));
        } catch (e) {
          set({ error: 'Etkinlik silinirken hata oluştu', loading: false });
        }
      },
    }),
    {
      name: 'event-store',
      partialize: (state) => ({ events: state.events }),
    }
  )
);
