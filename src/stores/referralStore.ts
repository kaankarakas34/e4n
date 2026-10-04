import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Referral, CreateReferralFormData } from '../types';
import { api } from '../api/api';
import { supabase } from '../api/supabase';
import { validReferral } from '../api/referrals';

let readSequence = 0;
let currentOwner: string | null = null;

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
        const sequence = ++readSequence;
        currentOwner = userId;
        set({ referrals: [] });
        set({ loading: true, error: null });
        try {
          const data = await api.getReferralsByUser(userId);
          if (!Array.isArray(data) || !data.every(row => validReferral(row) && (row.giver_id === userId || row.receiver_id === userId))) throw new Error('Referans listesi doğrulanamadı.');
          if (sequence !== readSequence || currentOwner !== userId) return;
          set({ referrals: (data as Referral[]) || [], loading: false });
        } catch (error) {
          if (sequence !== readSequence || currentOwner !== userId) return;
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
        const original = get().referrals.find(row => row.id === id);
        if (!original) throw new Error('Referans önce yeniden yüklenmelidir.');
        const owner = currentOwner;
        set({ loading: true, error: null });
        try {
          const referral = await api.updateReferral(id, { status: data.status, amount: data.amount });
          if (!validReferral(referral) || referral.giver_id !== original.giver_id || referral.receiver_id !== original.receiver_id) throw new Error('Referans sonucu doğrulanamadı.');
          if (currentOwner !== owner) return;
          const cached: Referral = { ...original, ...referral, amount: referral.amount == null ? undefined : Number(referral.amount) };
          set(state => ({ referrals: state.referrals.map(r => r.id === id ? cached : r), loading: false }));
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
      version: 2,
      // Older caches can contain demo rows or failed requests reported as saved.
      // Refill the cache from the API instead of treating those rows as records.
      migrate: () => ({ referrals: [] }),
      partialize: (state) => ({
        referrals: []
      }),
    }
  )
);
