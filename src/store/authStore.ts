import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signIn, signUp, signOut, type User } from '../lib/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, displayName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,
      signIn: async (username, password) => {
        try {
          set({ loading: true, error: null });
          const user = await signIn(username, password);
          set({ user, loading: false, error: null });
        } catch (error: any) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      signUp: async (username, displayName, password) => {
        try {
          set({ loading: true, error: null });
          const user = await signUp(username, displayName, password);
          set({ user, loading: false, error: null });
        } catch (error: any) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      signOut: async () => {
        try {
          set({ loading: true, error: null });
          await signOut();
          set({ user: null, loading: false, error: null });
        } catch (error: any) {
          set({ loading: false, error: error.message });
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);