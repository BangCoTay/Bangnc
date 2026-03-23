import { create } from 'zustand';

interface UIState {
  isGlobalLoading: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';

  setGlobalLoading: (loading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  toastMessage: null,
  toastType: 'info',

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },
  hideToast: () => set({ toastMessage: null }),
}));
