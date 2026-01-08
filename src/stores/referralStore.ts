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

const mockReferrals: Referral[] = [
  {
    id: '1',
    giver_id: 'user1',
    receiver_id: 'user2',
    type: 'INTERNAL',
    temperature: 'HOT',
    status: 'SUCCESSFUL',
    description: 'Vergi danışmanlığı hizmeti yönlendirmesi',
    amount: 5000,
    created_at: '2024-11-28',
    updated_at: '2024-11-28',
    receiver_name: 'Ahmet Yılmaz',
    profession: 'Mali Müşavir',
  },
  {
    id: '2',
    giver_id: 'user1',
    receiver_id: 'user3',
    type: 'EXTERNAL',
    temperature: 'WARM',
    status: 'PENDING',
    description: 'Logo tasarımı projesi',
    amount: 2500,
    created_at: '2024-11-27',
    updated_at: '2024-11-27',
    receiver_name: 'Ayşe Kaya',
    profession: 'Grafik Tasarımcı',
  },
  {
    id: '3',
    giver_id: 'user1',
    receiver_id: 'user4',
    type: 'INTERNAL',
    temperature: 'COLD',
    status: 'UNSUCCESSFUL',
    description: 'Bina projesi danışmanlığı',
    amount: 0,
    created_at: '2024-11-26',
    updated_at: '2024-11-26',
    receiver_name: 'Mehmet Öz',
    profession: 'İnşaat Mühendisi',
  },
  {
    id: '4',
    giver_id: 'user2',
    receiver_id: 'user1',
    type: 'INTERNAL',
    temperature: 'WARM',
    status: 'PENDING',
    description: 'Web sitesi yenileme projesi için destek',
    amount: 15000,
    created_at: '2024-11-25',
    updated_at: '2024-11-25',
    receiver_name: 'Murat (Ben)',
    profession: 'Yazılım',
  },
];

export const useReferralStore = create<ReferralStore>()(
  persist(
    (set, get) => ({
      referrals: mockReferrals,
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
          // Fallback to mock when API fails
          const newReferral: Referral = {
            id: Date.now().toString(),
            giver_id: userId,
            receiver_id: data.receiverId || '',
            type: data.type,
            temperature: data.temperature,
            status: 'PENDING',
            description: data.description,
            amount: data.amount,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            receiver_name: data.receiver,
            profession: data.profession,
          };
          set(state => ({ referrals: [newReferral, ...state.referrals], loading: false }));
          return newReferral;
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
      partialize: (state) => ({
        referrals: state.referrals
      }),
    }
  )
);
