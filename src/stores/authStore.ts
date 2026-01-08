import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { auth, db } from '../api/supabase';
import { api } from '../api/api';

interface AuthState {
  user: User | null;
  token: string | null;
  chapterId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      chapterId: null,
      isLoading: false,
      error: null,

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const params = await api.login(email, password);
          // params contains { token, user, chapterId }

          // Fetch full user profile to ensure we have all fields (profession, performance, etc)
          const fullUser = await api.getMe(params.token);

          set({
            user: { ...fullUser, role: params.user.role }, // Ensure role is preserved or updated
            token: params.token,
            chapterId: params.chapterId,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          set({
            user: null,
            token: null,
            chapterId: null,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { token } = get();

          if (!token) {
            set({ isLoading: false });
            return;
          }

          // Verify token and refresh user data
          try {
            const user = await api.getMe(token);
            set({ user, isLoading: false });
          } catch (e) {
            // Token likely invalid/expired
            console.warn('Session expired or invalid:', e);
            set({ user: null, token: null, chapterId: null, isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Authentication check failed',
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        chapterId: state.chapterId,
      }),
    }
  )
);
