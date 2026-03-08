import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from './database';
import {
  saveUserProfile,
  saveAllHabits,
  saveAllVerses,
  saveAllDhikr,
  saveAllDuas,
  saveQuranProgress,
  saveStreakData,
  saveSettings,
  saveLocationCache,
  saveWeatherCache,
  savePrayerTimesCache,
} from './repositories';
import { Habit, Verse, DhikrItem, Dua, QuranProgress, StreakData, UserLocation, Weather } from '@/types';
import { PrayerTimeEntry } from './prayerTimes';
import { logger } from '@/utils/logger';

const MIGRATION_KEY = '@madeen:migration_completed';
const MIGRATION_VERSION = '1.0.0';

// Check if migration is needed
export async function needsMigration(): Promise<boolean> {
  try {
    const migrationStatus = await AsyncStorage.getItem(MIGRATION_KEY);
    
    if (!migrationStatus) {
      logger.debug('[Migration] No migration status found, checking for old data...');
      
      // Check if there's any old data in AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const hasOldData = keys.some(key => 
        key.startsWith('@app_') || key.startsWith('app_')
      );
      
      return hasOldData;
    }
    
    const status = JSON.parse(migrationStatus);
    return status.version !== MIGRATION_VERSION;
  } catch (error) {
    console.error('[Migration] Error checking migration status:', error);
    return false;
  }
}

// Perform migration from AsyncStorage to SQLite
export async function migrateToSQLite(): Promise<boolean> {
  try {
    logger.debug('[Migration] Starting migration to SQLite...');
    
    // Initialize database
    await initDatabase();
    
    // Migrate user profile
    await migrateUserProfile();
    
    // Migrate habits
    await migrateHabits();
    
    // Migrate verses
    await migrateVerses();
    
    // Migrate dhikr
    await migrateDhikr();
    
    // Migrate duas
    await migrateDuas();
    
    // Migrate quran progress
    await migrateQuranProgress();
    
    // Migrate streak data
    await migrateStreakData();
    
    // Migrate settings
    await migrateSettings();
    
    // Migrate location cache
    await migrateLocationCache();
    
    // Migrate weather cache
    await migrateWeatherCache();
    
    // Migrate prayer times cache
    await migratePrayerTimesCache();
    
    // Mark migration as complete
    await AsyncStorage.setItem(MIGRATION_KEY, JSON.stringify({
      version: MIGRATION_VERSION,
      completedAt: new Date().toISOString(),
    }));
    
    logger.debug('[Migration] Migration completed successfully');
    return true;
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return false;
  }
}

// Migrate user profile
async function migrateUserProfile(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_profile');
    if (!data) {
      logger.debug('[Migration] No user profile to migrate');
      return;
    }
    
    const profile = JSON.parse(data);
    await saveUserProfile(profile.name || 'User', profile.nameArabic || '');
    logger.debug('[Migration] User profile migrated');
  } catch (error) {
    console.error('[Migration] Error migrating user profile:', error);
  }
}

// Migrate habits
async function migrateHabits(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_habits');
    if (!data) {
      logger.debug('[Migration] No habits to migrate');
      return;
    }
    
    const habits: Habit[] = JSON.parse(data);
    await saveAllHabits(habits);
    logger.debug(`[Migration] Habits migrated: ${habits.length}`);
  } catch (error) {
    console.error('[Migration] Error migrating habits:', error);
  }
}

// Migrate verses
async function migrateVerses(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_verses');
    if (!data) {
      logger.debug('[Migration] No verses to migrate');
      return;
    }
    
    const verses: Verse[] = JSON.parse(data);
    await saveAllVerses(verses);
    logger.debug(`[Migration] Verses migrated: ${verses.length}`);
  } catch (error) {
    console.error('[Migration] Error migrating verses:', error);
  }
}

// Migrate dhikr
async function migrateDhikr(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_dhikr');
    if (!data) {
      logger.debug('[Migration] No dhikr to migrate');
      return;
    }
    
    const dhikrItems: DhikrItem[] = JSON.parse(data);
    await saveAllDhikr(dhikrItems);
    logger.debug(`[Migration] Dhikr migrated: ${dhikrItems.length}`);
  } catch (error) {
    console.error('[Migration] Error migrating dhikr:', error);
  }
}

// Migrate duas
async function migrateDuas(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_duas');
    if (!data) {
      logger.debug('[Migration] No duas to migrate');
      return;
    }
    
    const duas: Dua[] = JSON.parse(data);
    await saveAllDuas(duas);
    logger.debug(`[Migration] Duas migrated: ${duas.length}`);
  } catch (error) {
    console.error('[Migration] Error migrating duas:', error);
  }
}

// Migrate quran progress
async function migrateQuranProgress(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_quran');
    if (!data) {
      logger.debug('[Migration] No quran progress to migrate');
      return;
    }
    
    const progress: QuranProgress = JSON.parse(data);
    await saveQuranProgress(progress);
    logger.debug('[Migration] Quran progress migrated');
  } catch (error) {
    console.error('[Migration] Error migrating quran progress:', error);
  }
}

// Migrate streak data
async function migrateStreakData(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_streak');
    if (!data) {
      logger.debug('[Migration] No streak data to migrate');
      return;
    }
    
    const streak: StreakData = JSON.parse(data);
    await saveStreakData(streak);
    logger.debug('[Migration] Streak data migrated');
  } catch (error) {
    console.error('[Migration] Error migrating streak data:', error);
  }
}

// Migrate settings
async function migrateSettings(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('@madeen:settings');
    if (!data) {
      logger.debug('[Migration] No settings to migrate');
      return;
    }
    
    const settings = JSON.parse(data);
    await saveSettings(settings);
    logger.debug('[Migration] Settings migrated');
  } catch (error) {
    console.error('[Migration] Error migrating settings:', error);
  }
}

// Migrate location cache
async function migrateLocationCache(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_location');
    if (!data) {
      logger.debug('[Migration] No location cache to migrate');
      return;
    }
    
    const location: UserLocation = JSON.parse(data);
    await saveLocationCache(location);
    logger.debug('[Migration] Location cache migrated');
  } catch (error) {
    console.error('[Migration] Error migrating location cache:', error);
  }
}

// Migrate weather cache
async function migrateWeatherCache(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_weather');
    if (!data) {
      logger.debug('[Migration] No weather cache to migrate');
      return;
    }
    
    const weather: Weather = JSON.parse(data);
    await saveWeatherCache(weather);
    logger.debug('[Migration] Weather cache migrated');
  } catch (error) {
    console.error('[Migration] Error migrating weather cache:', error);
  }
}

// Migrate prayer times cache
async function migratePrayerTimesCache(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('app_prayer_times');
    if (!data) {
      logger.debug('[Migration] No prayer times cache to migrate');
      return;
    }
    
    const cache: { times: PrayerTimeEntry[]; date: string } = JSON.parse(data);
    await savePrayerTimesCache(cache.times, cache.date);
    logger.debug('[Migration] Prayer times cache migrated');
  } catch (error) {
    console.error('[Migration] Error migrating prayer times cache:', error);
  }
}

// Clean up old AsyncStorage data after successful migration
export async function cleanupOldData(): Promise<void> {
  try {
    logger.debug('[Migration] Cleaning up old AsyncStorage data...');
    
    const keysToRemove = [
      'app_habits',
      'app_verses',
      'app_profile',
      'app_dhikr',
      'app_duas',
      'app_prophets',
      'app_sahabas',
      'app_quran',
      'app_streak',
      'app_last_reset',
      'app_location',
      'app_weather',
      'app_prayer_times',
      '@madeen:settings',
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    logger.debug('[Migration] Old data cleaned up');
  } catch (error) {
    console.error('[Migration] Error cleaning up old data:', error);
  }
}

// Get migration status
export async function getMigrationStatus(): Promise<{ completed: boolean; version?: string; completedAt?: string }> {
  try {
    const data = await AsyncStorage.getItem(MIGRATION_KEY);
    if (!data) {
      return { completed: false };
    }
    
    const status = JSON.parse(data);
    return {
      completed: true,
      version: status.version,
      completedAt: status.completedAt,
    };
  } catch (error) {
    console.error('[Migration] Error getting migration status:', error);
    return { completed: false };
  }
}

// Force re-migration (for testing)
export async function resetMigration(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MIGRATION_KEY);
    logger.debug('[Migration] Migration status reset');
  } catch (error) {
    console.error('[Migration] Error resetting migration:', error);
  }
}
