import { create } from 'zustand';
import type { Profile } from '@ai-companions/shared';
import { authService } from '../services/auth.service';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: Profile) => void;
  updateBalance: (newBalance: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login({ email, password });
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (email, password, username, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register({
        email,
        password,
        username,
        display_name: displayName,
      });
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    try {
      const profile = await authService.getProfile();
      set({ user: profile, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
      const hasToken = await authService.hasToken();
      if (hasToken) {
        await get().loadProfile();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),
  updateBalance: (newBalance) => set((state) => ({
    user: state.user ? { ...state.user, coin_balance: newBalance } : null
  })),
}));
