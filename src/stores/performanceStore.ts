import { create } from 'zustand';
import type { PerformanceReport } from '../types';
import { PerformanceService } from '../utils/services/performanceService';
import { api } from '../api/api';
import {useAuthStore} from './authStore';

let generation=0;
export const performanceContext=()=>{const {user,token}=useAuthStore.getState();return `${user?.id}:${user?.role}:${token}`;};

interface PerformanceState {
  performance: PerformanceReport | null;
  isLoading: boolean;
  error: string | null;
  scope:string|null;

  fetchPerformance: (userId: string) => Promise<void>;
  refreshPerformance: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  performance: null,
  isLoading: false,
  error: null,
  scope:null,

  fetchPerformance: async (userId: string) => {
    const epoch=++generation,scope=performanceContext();
    const owner=useAuthStore.getState();
    const current=()=>generation===epoch&&performanceContext()===scope;
    set({ performance:null,isLoading: true, error: null,scope });

    try {
      if(!owner.token||owner.user?.id!==userId)throw new Error('Performans için güncel üye oturumu gerekli.');
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
      if(!current())return;

      const calculated = await PerformanceService.calculateScore(
        userId,
        referrals || [],
        oneToOnes || [],
        visitors || [],
        education || [],
        attendances || []
      );
      if(!current())return;

      // Override with server-side authoritative score if available
      if (userProfile && (userProfile.performance_score !== undefined)) {
        calculated.score = userProfile.performance_score;
        calculated.color = userProfile.performance_color || calculated.color;
      }

      set({ performance: calculated, isLoading: false });
    } catch (error) {
      if(!current())return;
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

useAuthStore.subscribe((state,previous)=>{
  if(state.user?.id!==previous.user?.id||state.user?.role!==previous.user?.role||state.token!==previous.token){
    generation++;
    usePerformanceStore.setState({performance:null,isLoading:false,error:null,scope:null});
  }
});
