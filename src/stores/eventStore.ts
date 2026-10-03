import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/api';
import { useAuthStore } from './authStore';

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
  is_online?: boolean;
  pinned?: boolean;
}

interface EventStore {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  readLoading: boolean;
  readError: string | null;
  loadedFor: string | null;
  fetchEvents: () => Promise<void>;
  createEvent: (payload: any) => Promise<void>;
  updateEvent: (id: string, payload: any) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const isEventRecord = (value: any): value is EventItem => value && typeof value === 'object' && !Array.isArray(value)
  && typeof value.id === 'string' && !!value.id.trim()
  && typeof value.title === 'string' && typeof value.start_at === 'string' && !!value.start_at
  && typeof value.is_public === 'boolean';
let readSequence = 0;
let writeSequence = 0;
const contextFor = (user: any) => `${user?.id}:${user?.role}`;

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],
      loading: false,
      error: null,
      readLoading: false,
      readError: null,
      loadedFor: null,

      fetchEvents: async () => {
        const user = useAuthStore.getState().user;
        const context = contextFor(user);
        const sequence = ++readSequence;
        const current = () => sequence === readSequence && contextFor(useAuthStore.getState().user) === context;
        set({ readLoading: true, readError: null, loadedFor: null });
        try {
          const data = user?.role === 'ADMIN' ? await api.getEvents() : await api.getPublicEvents();
          if (!Array.isArray(data) || !data.every(isEventRecord)) throw new Error('Invalid events list response');
          if (current()) set({ events: data, readLoading: false, loadedFor: context });
        } catch (e) {
          if (current()) set({ readError: 'Etkinlikler yüklenirken hata oluştu', readLoading: false });
        }
      },

      createEvent: async (payload) => {
        const context = contextFor(useAuthStore.getState().user);
        if (useAuthStore.getState().user?.role !== 'ADMIN') throw new Error('Admin event write required');
        const sequence = ++writeSequence;
        const current = () => sequence === writeSequence && contextFor(useAuthStore.getState().user) === context;
        set({ loading: true, error: null });
        try {
          const created = await api.createEvent(payload);
          if (!isEventRecord(created)) throw new Error('Invalid created event response');
          if (!current()) { if (sequence === writeSequence) set({ loading: false }); return; }
          set(state => ({ events: [created, ...state.events], loading: false }));
        } catch (e) {
          if (current()) set({ error: 'Etkinlik oluşturulurken hata oluştu', loading: false });
          else if (sequence === writeSequence) set({ loading: false });
          throw e;
        }
      },

      updateEvent: async (id, payload) => {
        const context = contextFor(useAuthStore.getState().user);
        if (useAuthStore.getState().user?.role !== 'ADMIN') throw new Error('Admin event write required');
        const sequence = ++writeSequence;
        const current = () => sequence === writeSequence && contextFor(useAuthStore.getState().user) === context;
        set({ loading: true, error: null });
        try {
          // @ts-ignore
          const updated = await api.updateEvent(id, payload);
          if (!isEventRecord(updated) || updated.id !== id) throw new Error('Invalid updated event response');
          if (!current()) { if (sequence === writeSequence) set({ loading: false }); return; }
          set(state => ({ events: state.events.map(e => e.id === id ? updated : e), loading: false }));
        } catch (e) {
          if (current()) set({ error: 'Etkinlik güncellenirken hata oluştu', loading: false });
          else if (sequence === writeSequence) set({ loading: false });
          throw e;
        }
      },

      deleteEvent: async (id: string) => {
        const context = contextFor(useAuthStore.getState().user);
        if (useAuthStore.getState().user?.role !== 'ADMIN') throw new Error('Admin event write required');
        const sequence = ++writeSequence;
        const current = () => sequence === writeSequence && contextFor(useAuthStore.getState().user) === context;
        set({ loading: true, error: null });
        try {
          const result = await api.deleteEvent(id);
          if (result?.success !== true) throw new Error('Invalid deleted event response');
          if (!current()) { if (sequence === writeSequence) set({ loading: false }); return; }
          set(state => ({ events: state.events.filter(e => e.id !== id), loading: false }));
        } catch (e) {
          if (current()) set({ error: 'Etkinlik silinirken hata oluştu', loading: false });
          else if (sequence === writeSequence) set({ loading: false });
          throw e;
        }
      },
    }),
    {
      name: 'event-store',
      partialize: (state) => ({ events: state.events }),
    }
  )
);
