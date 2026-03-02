import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const value = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: keyof typeof STORAGE_KEYS, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      return false;
    }
  },

  async remove(key: keyof typeof STORAGE_KEYS): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  async multiGet(keys: (keyof typeof STORAGE_KEYS)[]): Promise<Record<string, any>> {
    try {
      const storageKeys = keys.map(key => STORAGE_KEYS[key]);
      const values = await AsyncStorage.multiGet(storageKeys);
      
      return values.reduce((acc, [key, value]) => {
        const originalKey = Object.keys(STORAGE_KEYS).find(
          k => STORAGE_KEYS[k as keyof typeof STORAGE_KEYS] === key
        );
        if (originalKey && value) {
          acc[originalKey] = JSON.parse(value);
        }
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      console.error('Error in multiGet:', error);
      return {};
    }
  },

  async multiSet(items: Partial<Record<keyof typeof STORAGE_KEYS, any>>): Promise<boolean> {
    try {
      const pairs = Object.entries(items).map(([key, value]) => [
        STORAGE_KEYS[key as keyof typeof STORAGE_KEYS],
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(pairs as [string, string][]);
      return true;
    } catch (error) {
      console.error('Error in multiSet:', error);
      return false;
    }
  },
};

export default storage;
