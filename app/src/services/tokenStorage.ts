import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStore = new Map<string, string>();

function getLocalStorage(): Storage | null {
  try {
    const maybeStorage = (globalThis as any)?.localStorage;
    return maybeStorage ?? null;
  } catch {
    return null;
  }
}

function canUseLocalStorage(): boolean {
  try {
    return !!getLocalStorage();
  } catch {
    return false;
  }
}

export const tokenStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (canUseLocalStorage()) {
        const storage = getLocalStorage();
        try {
          return storage?.getItem(key) ?? null;
        } catch {
          return memoryStore.get(key) ?? null;
        }
      }
      return memoryStore.get(key) ?? null;
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (canUseLocalStorage()) {
        const storage = getLocalStorage();
        try {
          storage?.setItem(key, value);
          return;
        } catch {
          memoryStore.set(key, value);
          return;
        }
      }
      memoryStore.set(key, value);
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (canUseLocalStorage()) {
        const storage = getLocalStorage();
        try {
          storage?.removeItem(key);
        } catch {}
      }
      memoryStore.delete(key);
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};
