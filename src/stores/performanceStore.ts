import { create } from 'zustand';
import type { PerformanceReport } from '../types';
import { PerformanceService } from '../utils/services/performanceService';
import { api } from '../api/api';

interface PerformanceState {
  performance: PerformanceReport | null;
  isLoading: boolean;
  error: string | null;

  fetchPerformance: (userId: string) => Promise<void>;
  refreshPerformance: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  performance: null,
  isLoading: false,
  error: null,

  fetchPerformance: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      /*
      if (!import.meta.env.VITE_SUPABASE_URL) {
        const mockPerformance: PerformanceReport = {
          score: 75,
          color: 'YELLOW',
          breakdown: {
            referrals: 80,
            one_to_ones: 60,
            visitors: 70,
            education: 90,
            attendances: 75,
          },
          recommendations: [
            '📈 İyi yoldasınız, biraz daha fazla çaba gerekiyor.',
            '🤝 Daha fazla iş yönlendirmesi yapın. Hedef: Ayda 8 yönlendirme.',
            '☕ Daha fazla birebir görüşmesi planlayın. Hedef: Ayda 4 görüşme.',
          ],
        };

        set({ performance: mockPerformance, isLoading: false });
        return;
      }
      */

      const [
        userProfile,
        referrals,
        oneToOnes,
        visitors,
        education,
        attendances,
      ] = await Promise.all([
        api.getUserById(userId),
        api.getReferralsByUser(userId),
        api.getOneToOnes(userId),
        api.getVisitorsByUser(userId),
        api.getEducationByUser(userId),
        api.getUserAttendance(userId),
      ]);

      const calculated = await PerformanceService.calculateScore(
        userId,
        referrals || [],
        oneToOnes || [],
        visitors || [],
        education || [],
        attendances || []
      );

      // Override with server-side authoritative score if available
      if (userProfile && (userProfile.performance_score !== undefined)) {
        calculated.score = userProfile.performance_score;
        calculated.color = userProfile.performance_color || calculated.color;
      }

      set({ performance: calculated, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Performans verileri çekilirken hata oluştu',
        isLoading: false,
      });
    }
  },

  refreshPerformance: async (userId: string) => {
    await usePerformanceStore.getState().fetchPerformance(userId);
  },

  clearError: () => set({ error: null }),
}));
