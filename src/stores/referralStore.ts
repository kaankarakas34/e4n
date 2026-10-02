import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Referral, CreateReferralFormData } from '../types';
import { api } from '../api/api';
import { supabase } from '../api/supabase';

interface ReferralStore {
  referrals: Referral[];
  loading: boolean;
  error: string | null;
  fetchReferrals: (userId: string) => Promise<void>;
  createReferral: (data: CreateReferralFormData, userId: string) => Promise<Referral>;
  updateReferral: (id: string, data: Partial<Referral>) => Promise<void>;
  deleteReferral: (id: string) => Promise<void>;
}

export const useReferralStore = create<ReferralStore>()(
  persist(
    (set, get) => ({
      referrals: [],
      loading: false,
      error: null,

      fetchReferrals: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const data = await api.getReferralsByUser(userId);
          set({ referrals: (data as Referral[]) || [], loading: false });
        } catch (error) {
          console.error('Error fetching referrals:', error);
          set({ error: 'Yönlendirmeler yüklenirken hata oluştu', loading: false });
        }
      },

      createReferral: async (data: CreateReferralFormData, userId: string): Promise<Referral> => {
        set({ loading: true, error: null });
        try {
          // @ts-ignore
          const referral = await api.createReferral({
            giverId: userId,
            receiverId: data.receiverId,
            type: data.type,
            temperature: data.temperature,
            description: data.description,
            amount: data.amount,
          });

          set(state => ({
            referrals: [referral as Referral, ...state.referrals],
            loading: false,
          }));
          return referral as Referral;
        } catch (error) {
          set({ error: 'Yönlendirme kaydedilemedi. Lütfen tekrar deneyin.', loading: false });
          throw error;
        }
      },

      updateReferral: async (id: string, data: Partial<Referral>) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { data: referral, error } = await supabase
              .from('referrals')
              .update(data)
              .eq('id', id)
              .select()
              .single();

            if (error) throw error;

            set(state => ({
              referrals: state.referrals.map(r => r.id === id ? referral : r),
              loading: false,
            }));
          } else {
            set(state => ({
              referrals: state.referrals.map(r => r.id === id ? { ...r, ...data } : r),
              loading: false,
            }));
          }
        } catch (error) {
          console.error('Error updating referral:', error);
          set({ error: 'Yönlendirme güncellenirken hata oluştu', loading: false });
          throw error;
        }
      },

      deleteReferral: async (id: string) => {
        set({ loading: true, error: null });
        try {
          if (supabase) {
            const { error } = await supabase
              .from('referrals')
              .delete()
              .eq('id', id);

            if (error) throw error;
          }

          set(state => ({
            referrals: state.referrals.filter(r => r.id !== id),
            loading: false,
          }));
        } catch (error) {
          console.error('Error deleting referral:', error);
          set({ error: 'Yönlendirme silinirken hata oluştu', loading: false });
          throw error;
        }
      },
    }),
    {
      name: 'referral-store',
      version: 1,
      // Older caches can contain demo rows or failed requests reported as saved.
      // Refill the cache from the API instead of treating those rows as records.
      migrate: () => ({ referrals: [] }),
      partialize: (state) => ({
        referrals: state.referrals
      }),
    }
  )
);
