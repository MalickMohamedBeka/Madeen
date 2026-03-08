import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const STORAGE_KEYS = {
  HABITS: '@madeen:habits',
  VERSES: '@madeen:verses',
  DHIKR: '@madeen:dhikr',
  DUAS: '@madeen:duas',
  SETTINGS: '@madeen:settings',
  USER_PROFILE: '@madeen:user_profile',
  PRAYER_TIMES: '@madeen:prayer_times',
  STATISTICS: '@madeen:statistics',
  ONBOARDING_COMPLETED: '@madeen:onboarding_completed',
  LAST_SYNC: '@madeen:last_sync',
} as const;

export const storage = {
  async get<T>(key: keyof typeof STORAGE_KEYS): Promise<T | null> {
    try {
      if (!key || !STORAGE_KEYS[key]) {
        console.error('[Storage] Invalid key:', key);
        return null;
      }
      
      const value = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      
      if (!value) {
        return null;
      }
      
      try {
        return JSON.parse(value);
      } catch (parseErr) {
        console.error(`[Storage] JSON parse error for ${key}:`, parseErr);
        return null;
      }
    } catch (error) {
      console.error(`[Storage] Error getting ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: keyof typeof STORAGE_KEYS, value: T): Promise<boolean> {
    try {
      if (!key || !STORAGE_KEYS[key]) {
        console.error('[Storage] Invalid key:', key);
        return false;
      }
      
      if (value === undefined) {
        console.error('[Storage] Cannot store undefined value for key:', key);
        return false;
      }
      
      const serialized = JSON.stringify(value);
      
      // Validation de la taille (AsyncStorage a une limite)
      if (serialized.length > 2 * 1024 * 1024) { // 2MB
        console.error(`[Storage] Value too large for ${key}: ${serialized.length} bytes`);
        return false;
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS[key], serialized);
      return true;
    } catch (error) {
      console.error(`[Storage] Error setting ${key}:`, error);
      return false;
    }
  },

  async remove(key: keyof typeof STORAGE_KEYS): Promise<boolean> {
    try {
      if (!key || !STORAGE_KEYS[key]) {
        console.error('[Storage] Invalid key:', key);
        return false;
      }
      
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
      return true;
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      logger.debug('[Storage] All data cleared');
      return true;
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
      return false;
    }
  },

  async multiGet(keys: (keyof typeof STORAGE_KEYS)[]): Promise<Record<string, any>> {
    try {
      if (!keys || keys.length === 0) {
        console.error('[Storage] No keys provided for multiGet');
        return {};
      }
      
      const storageKeys = keys
        .filter(key => key && STORAGE_KEYS[key])
        .map(key => STORAGE_KEYS[key]);
      
      if (storageKeys.length === 0) {
        console.error('[Storage] No valid keys for multiGet');
        return {};
      }
      
      const values = await AsyncStorage.multiGet(storageKeys);
      
      return values.reduce((acc, [key, value]) => {
        const originalKey = Object.keys(STORAGE_KEYS).find(
          k => STORAGE_KEYS[k as keyof typeof STORAGE_KEYS] === key
        );
        if (originalKey && value) {
          try {
            acc[originalKey] = JSON.parse(value);
          } catch (parseErr) {
            console.error(`[Storage] JSON parse error for ${originalKey}:`, parseErr);
          }
        }
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      console.error('[Storage] Error in multiGet:', error);
      return {};
    }
  },

  async multiSet(items: Partial<Record<keyof typeof STORAGE_KEYS, any>>): Promise<boolean> {
    try {
      if (!items || Object.keys(items).length === 0) {
        console.error('[Storage] No items provided for multiSet');
        return false;
      }
      
      const pairs = Object.entries(items)
        .filter(([key, value]) => key && STORAGE_KEYS[key as keyof typeof STORAGE_KEYS] && value !== undefined)
        .map(([key, value]) => {
          try {
            return [
              STORAGE_KEYS[key as keyof typeof STORAGE_KEYS],
              JSON.stringify(value),
            ];
          } catch (err) {
            console.error(`[Storage] JSON stringify error for ${key}:`, err);
            return null;
          }
        })
        .filter(pair => pair !== null) as [string, string][];
      
      if (pairs.length === 0) {
        console.error('[Storage] No valid items for multiSet');
        return false;
      }
      
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (error) {
      console.error('[Storage] Error in multiSet:', error);
      return false;
    }
  },
};

export default storage;
