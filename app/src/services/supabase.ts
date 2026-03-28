import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { tokenStorage } from './tokenStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return tokenStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await tokenStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await tokenStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
