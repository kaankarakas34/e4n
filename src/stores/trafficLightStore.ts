import { create } from 'zustand';
import type { TrafficLightResponse } from '../types';
import { TrafficLightService } from '../utils/services/trafficLightService';
import { db } from '../api/supabase';

interface TrafficLightState {
  trafficLight: TrafficLightResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTrafficLight: (userId: string) => Promise<void>;
  refreshTrafficLight: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useTrafficLightStore = create<TrafficLightState>((set) => ({
  trafficLight: null,
  isLoading: false,
  error: null,

  fetchTrafficLight: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Mock data for development
      if (!import.meta.env.VITE_SUPABASE_URL) {
        const mockTrafficLight: TrafficLightResponse = {
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
            '☕ Daha fazla 1-to-1 görüşmesi planlayın. Hedef: Ayda 4 görüşme.',
          ],
        };

        set({
          trafficLight: mockTrafficLight,
          isLoading: false,
        });
        return;
      }

      // Fetch real data from Supabase
      const [
        referrals,
        oneToOnes,
        visitors,
        ceus,
        attendances,
      ] = await Promise.all([
        db.getReferralsByUser(userId),
        db.getOneToOnesByUser(userId),
        db.getVisitorsByChapter('1'), // This should be filtered by user
        db.getCEUsByUser(userId),
        db.getAttendanceByMeeting('1'), // This should be filtered by user
      ]);

      const trafficLight = await TrafficLightService.calculateScore(
        userId,
        referrals || [],
        oneToOnes || [],
        visitors || [],
        ceus || [],
        attendances || []
      );

      set({
        trafficLight,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch traffic light data',
        isLoading: false,
      });
    }
  },

  refreshTrafficLight: async (userId: string) => {
    // Same as fetchTrafficLight but with fresh data
    await useTrafficLightStore.getState().fetchTrafficLight(userId);
  },

  clearError: () => {
    set({ error: null });
  },
}));