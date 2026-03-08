import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

/**
 * Database Migration System
 * Versioned migrations with rollback support
 */

const MIGRATION_KEY = '@madeen:db_migration_version';
const CURRENT_VERSION = 5; // ✅ Includes migration 5 (reset quran progress to 0)

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
  down: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

// ==================== MIGRATIONS ====================

const migrations: Migration[] = [
  // Migration 1: Initial schema
  {
    version: 1,
    name: 'initial_schema',
    up: async (db) => {
      logger.debug('[Migration 1] Creating initial schema...');
      
      // User profile
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          name TEXT NOT NULL,
          name_arabic TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Habits
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS habits (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          icon TEXT NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('prayer', 'quran', 'dhikr', 'charity', 'knowledge', 'other')),
          completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
          is_custom INTEGER DEFAULT 0 CHECK (is_custom IN (0, 1)),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category);
        CREATE INDEX IF NOT EXISTS idx_habits_completed ON habits(completed);
      `);

      // Verses
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS verses (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          translation TEXT,
          reference TEXT NOT NULL,
          is_favorite INTEGER DEFAULT 0 CHECK (is_favorite IN (0, 1)),
          is_read INTEGER DEFAULT 0 CHECK (is_read IN (0, 1)),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_verses_favorite ON verses(is_favorite);
        CREATE INDEX IF NOT EXISTS idx_verses_read ON verses(is_read);
      `);

      // Dhikr items
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS dhikr_items (
          id TEXT PRIMARY KEY,
          arabic TEXT NOT NULL,
          transliteration TEXT,
          french TEXT NOT NULL,
          target INTEGER NOT NULL CHECK (target > 0),
          count INTEGER DEFAULT 0 CHECK (count >= 0),
          is_custom INTEGER DEFAULT 0 CHECK (is_custom IN (0, 1)),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Duas
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS duas (
          id TEXT PRIMARY KEY,
          title TEXT,
          arabic TEXT NOT NULL,
          transliteration TEXT,
          french TEXT NOT NULL,
          category TEXT CHECK (category IN ('morning', 'evening', 'prayer', 'food', 'travel', 'general')),
          is_favorite INTEGER DEFAULT 0 CHECK (is_favorite IN (0, 1)),
          is_custom INTEGER DEFAULT 0 CHECK (is_custom IN (0, 1)),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_duas_favorite ON duas(is_favorite);
        CREATE INDEX IF NOT EXISTS idx_duas_category ON duas(category);
      `);

      // Prophets
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS prophets (
          id TEXT PRIMARY KEY,
          name_french TEXT NOT NULL,
          name_arabic TEXT,
          name_translit TEXT,
          description TEXT,
          key_event TEXT,
          quranic_mention TEXT,
          "order" INTEGER DEFAULT 0,
          is_custom INTEGER DEFAULT 0 CHECK (is_custom IN (0, 1)),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_prophets_order ON prophets("order");
      `);

      // Sahabas
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sahabas (
          id TEXT PRIMARY KEY,
          name_french TEXT NOT NULL,
          name_arabic TEXT,
          name_translit TEXT,
          title TEXT,
          description TEXT,
          key_contribution TEXT,
          birth_year TEXT,
          death_year TEXT,
          category TEXT DEFAULT 'sahaba' CHECK (category IN ('sahaba', 'sahabi', 'companion')),
          is_custom INTEGER DEFAULT 0 CHECK (is_custom IN (0, 1)),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Quran progress
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS quran_progress (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          current_page INTEGER DEFAULT 1 CHECK (current_page >= 1 AND current_page <= 604),
          current_juz INTEGER DEFAULT 1 CHECK (current_juz >= 1 AND current_juz <= 30),
          total_pages_read INTEGER DEFAULT 0 CHECK (total_pages_read >= 0),
          pages_read_today INTEGER DEFAULT 0 CHECK (pages_read_today >= 0),
          daily_goal INTEGER DEFAULT 2 CHECK (daily_goal >= 1),
          last_read_date TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Streak data
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS streak_data (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
          best_streak INTEGER DEFAULT 0 CHECK (best_streak >= 0),
          last_streak_date TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Settings
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          sound_enabled INTEGER DEFAULT 1 CHECK (sound_enabled IN (0, 1)),
          haptics_enabled INTEGER DEFAULT 1 CHECK (haptics_enabled IN (0, 1)),
          notifications_enabled INTEGER DEFAULT 1 CHECK (notifications_enabled IN (0, 1)),
          dark_mode INTEGER DEFAULT 0 CHECK (dark_mode IN (0, 1)),
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Cache tables
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS location_cache (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
          longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
          city TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS weather_cache (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          temperature INTEGER,
          condition TEXT CHECK (condition IN ('clear', 'cloudy', 'rainy', 'snowy')),
          icon TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS prayer_times_cache (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          fajr TEXT NOT NULL,
          sunrise TEXT NOT NULL,
          dhuhr TEXT NOT NULL,
          asr TEXT NOT NULL,
          maghrib TEXT NOT NULL,
          isha TEXT NOT NULL,
          date TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Daily stats
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          date TEXT PRIMARY KEY,
          habits_completed INTEGER DEFAULT 0 CHECK (habits_completed >= 0),
          prayers_on_time INTEGER DEFAULT 0 CHECK (prayers_on_time >= 0 AND prayers_on_time <= 5),
          quran_pages INTEGER DEFAULT 0 CHECK (quran_pages >= 0),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
      `);

      // App state
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          last_reset_date TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      logger.debug('[Migration 1] Initial schema created');
    },
    down: async (db) => {
      logger.debug('[Migration 1] Rolling back initial schema...');
      
      const tables = [
        'user_profile', 'habits', 'verses', 'dhikr_items', 'duas',
        'prophets', 'sahabas', 'quran_progress', 'streak_data',
        'settings', 'location_cache', 'weather_cache', 'prayer_times_cache',
        'daily_stats', 'app_state'
      ];

      for (const table of tables) {
        await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
      }

      logger.debug('[Migration 1] Rollback complete');
    },
  },

  // Migration 2: Add UNIQUE constraints
  {
    version: 2,
    name: 'add_unique_constraints',
    up: async (db) => {
      logger.debug('[Migration 2] Adding UNIQUE constraints...');
      
      // Add UNIQUE constraint on habit title for custom habits
      // Note: SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we need to recreate
      await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_habits_title_unique 
        ON habits(title) WHERE is_custom = 1;
      `);

      // Add UNIQUE constraint on verse reference
      await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_verses_reference_unique 
        ON verses(reference);
      `);

      logger.debug('[Migration 2] UNIQUE constraints added');
    },
    down: async (db) => {
      logger.debug('[Migration 2] Removing UNIQUE constraints...');
      
      await db.execAsync(`DROP INDEX IF EXISTS idx_habits_title_unique;`);
      await db.execAsync(`DROP INDEX IF EXISTS idx_verses_reference_unique;`);

      logger.debug('[Migration 2] Rollback complete');
    },
  },

  // Migration 3: Add migration tracking table
  {
    version: 3,
    name: 'add_migration_tracking',
    up: async (db) => {
      logger.debug('[Migration 3] Adding migration tracking...');
      
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      logger.debug('[Migration 3] Migration tracking added');
    },
    down: async (db) => {
      logger.debug('[Migration 3] Removing migration tracking...');
      
      await db.execAsync(`DROP TABLE IF EXISTS schema_migrations;`);

      logger.debug('[Migration 3] Rollback complete');
    },
  },
  
  // Migration 3.5: Add missing category column to dhikr_items
  {
    version: 3.5,
    name: 'add_missing_category_column',
    up: async (db) => {
      logger.debug('[Migration 3.5] Adding missing category column...');
      
      // Check if column exists first
      const dhikrSchema = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(dhikr_items)`);
      const hasCategory = dhikrSchema.some(col => col.name === 'category');
      
      if (!hasCategory) {
        logger.debug('[Migration 3.5] Adding category column to dhikr_items...');
        await db.execAsync(`
          ALTER TABLE dhikr_items ADD COLUMN category TEXT DEFAULT 'dhikr';
        `);
        logger.debug('[Migration 3.5] Category column added successfully');
      } else {
        logger.debug('[Migration 3.5] Category column already exists, skipping');
      }
      
      logger.debug('[Migration 3.5] Migration complete');
    },
    down: async (_db) => {
      logger.debug('[Migration 3.5] Rollback - SQLite does not support DROP COLUMN');
      // SQLite ne supporte pas DROP COLUMN facilement
      // On laisse la colonne en place
    },
  },
  
  // Migration 4: Add performance indexes
  {
    version: 4,
    name: 'add_performance_indexes',
    up: async (db) => {
      logger.debug('[Migration 4] Adding performance indexes...');
      
      // Helper function to safely create index
      const createIndexSafe = async (sql: string, indexName: string) => {
        try {
          await db.execAsync(sql);
          logger.debug(`[Migration 4] Created ${indexName}`);
        } catch (error) {
          logger.warn(`[Migration 4] Skipped ${indexName}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      };
      
      // Habits indexes (colonnes garanties)
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category);
      `, 'habits indexes');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_habits_completed ON habits(completed);
      `, 'habits completed index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_habits_custom ON habits(is_custom);
      `, 'habits custom index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_habits_category_completed ON habits(category, completed);
      `, 'habits composite index');
      
      // Verses indexes
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_verses_favorite ON verses(is_favorite);
      `, 'verses favorite index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_verses_read ON verses(is_read);
      `, 'verses read index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_verses_created ON verses(created_at);
      `, 'verses created index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_verses_favorite_read ON verses(is_favorite, is_read);
      `, 'verses composite index');
      
      // Dhikr indexes
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_dhikr_category ON dhikr_items(category);
      `, 'dhikr category index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_dhikr_custom ON dhikr_items(is_custom);
      `, 'dhikr custom index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_dhikr_count ON dhikr_items(count);
      `, 'dhikr count index');
      
      // Duas indexes
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_duas_category ON duas(category);
      `, 'duas category index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_duas_favorite ON duas(is_favorite);
      `, 'duas favorite index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_duas_custom ON duas(is_custom);
      `, 'duas custom index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_duas_category_favorite ON duas(category, is_favorite);
      `, 'duas composite index');
      
      // Prophets indexes
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_prophets_order ON prophets("order");
      `, 'prophets order index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_prophets_custom ON prophets(is_custom);
      `, 'prophets custom index');
      
      // Sahabas indexes
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_sahabas_category ON sahabas(category);
      `, 'sahabas category index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_sahabas_custom ON sahabas(is_custom);
      `, 'sahabas custom index');
      
      // Cache indexes (peuvent ne pas exister)
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_location_updated ON location_cache(last_updated);
      `, 'location cache index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_weather_updated ON weather_cache(last_updated);
      `, 'weather cache index');
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_prayer_date ON prayer_times_cache(date);
      `, 'prayer times cache index');
      
      // Settings index
      await createIndexSafe(`
        CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
      `, 'settings index');
      
      logger.debug('[Migration 4] Performance indexes migration complete');
    },
    down: async (db) => {
      logger.debug('[Migration 4] Removing performance indexes...');
      
      const indexes = [
        'idx_habits_category', 'idx_habits_completed', 'idx_habits_custom', 'idx_habits_category_completed',
        'idx_verses_favorite', 'idx_verses_read', 'idx_verses_created', 'idx_verses_favorite_read',
        'idx_dhikr_category', 'idx_dhikr_custom', 'idx_dhikr_count',
        'idx_duas_category', 'idx_duas_favorite', 'idx_duas_custom', 'idx_duas_category_favorite',
        'idx_prophets_order', 'idx_prophets_custom',
        'idx_sahabas_category', 'idx_sahabas_custom',
        'idx_location_updated', 'idx_weather_updated', 'idx_prayer_date',
        'idx_settings_key',
      ];
      
      for (const index of indexes) {
        await db.execAsync(`DROP INDEX IF EXISTS ${index};`);
      }
      
      logger.debug('[Migration 4] Performance indexes removed');
    },
  },

  // Migration 5: Reset Quran progress to 0/604
  {
    version: 5,
    name: 'reset_quran_progress_to_zero',
    up: async (db) => {
      logger.debug('[Migration 5] Resetting Quran progress to 0/604...');
      
      try {
        // Update existing quran_progress to start at 0
        await db.execAsync(`
          UPDATE quran_progress 
          SET current_page = 0,
              current_juz = 1,
              total_pages_read = 0,
              pages_read_today = 0,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = 1;
        `);
        
        logger.debug('[Migration 5] Quran progress reset to 0/604 successfully');
      } catch (error) {
        logger.warn('[Migration 5] No existing quran_progress to update', 'Migration', error);
      }
      
      logger.debug('[Migration 5] Migration complete');
    },
    down: async (_db) => {
      logger.debug('[Migration 5] Rollback - Cannot restore previous quran progress');
      // Cannot rollback as we don't know the previous values
    },
  },
];

// ==================== MIGRATION FUNCTIONS ====================

/**
 * Get current database version
 */
export async function getCurrentVersion(): Promise<number> {
  try {
    const version = await AsyncStorage.getItem(MIGRATION_KEY);
    return version ? parseInt(version, 10) : 0;
  } catch (error) {
    console.error('[Migration] Error getting current version:', error);
    return 0;
  }
}

/**
 * Set database version
 */
async function setVersion(version: number): Promise<void> {
  await AsyncStorage.setItem(MIGRATION_KEY, version.toString());
}

/**
 * Run pending migrations
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    const currentVersion = await getCurrentVersion();
    logger.debug(`[Migration] Current version: ${currentVersion}, Target version: ${CURRENT_VERSION}`);

    if (currentVersion === CURRENT_VERSION) {
      logger.debug('[Migration] Database is up to date');
      return true;
    }

    if (currentVersion > CURRENT_VERSION) {
      console.error('[Migration] Database version is newer than app version!');
      return false;
    }

    // Run migrations in order
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        logger.debug(`[Migration] Running migration ${migration.version}: ${migration.name}`);
        
        try {
          await migration.up(db);
          await setVersion(migration.version);
          
          // Track migration in database (if table exists)
          try {
            await db.runAsync(
              'INSERT OR REPLACE INTO schema_migrations (version, name) VALUES (?, ?)',
              [migration.version, migration.name]
            );
          } catch {
            // Table might not exist yet
          }
          
          logger.debug(`[Migration] Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`[Migration] Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
    }

    logger.debug('[Migration] All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('[Migration] Migration process failed:', error);
    return false;
  }
}

/**
 * Rollback to a specific version
 */
export async function rollbackTo(db: SQLite.SQLiteDatabase, targetVersion: number): Promise<boolean> {
  try {
    const currentVersion = await getCurrentVersion();
    logger.debug(`[Migration] Rolling back from ${currentVersion} to ${targetVersion}`);

    if (targetVersion >= currentVersion) {
      console.error('[Migration] Target version must be lower than current version');
      return false;
    }

    // Run down migrations in reverse order
    for (let i = migrations.length - 1; i >= 0; i--) {
      const migration = migrations[i];
      
      if (migration.version > targetVersion && migration.version <= currentVersion) {
        logger.debug(`[Migration] Rolling back migration ${migration.version}: ${migration.name}`);
        
        try {
          await migration.down(db);
          await setVersion(migration.version - 1);
          
          // Remove from tracking table
          try {
            await db.runAsync(
              'DELETE FROM schema_migrations WHERE version = ?',
              [migration.version]
            );
          } catch {
            // Table might not exist
          }
          
          logger.debug(`[Migration] Rollback ${migration.version} completed`);
        } catch (error) {
          console.error(`[Migration] Rollback ${migration.version} failed:`, error);
          throw error;
        }
      }
    }

    logger.debug('[Migration] Rollback completed successfully');
    return true;
  } catch (error) {
    console.error('[Migration] Rollback process failed:', error);
    return false;
  }
}

/**
 * Get migration history
 */
export async function getMigrationHistory(db: SQLite.SQLiteDatabase): Promise<any[]> {
  try {
    const result = await db.getAllAsync<any>(
      'SELECT * FROM schema_migrations ORDER BY version ASC'
    );
    return result;
  } catch (error) {
    console.error('[Migration] Error getting migration history:', error);
    return [];
  }
}

/**
 * Reset database (for testing)
 */
export async function resetDatabase(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    logger.debug('[Migration] Resetting database...');
    
    // Get all tables
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    // Drop all tables
    for (const table of tables) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table.name};`);
    }

    // Reset version
    await setVersion(0);

    logger.debug('[Migration] Database reset complete');
    return true;
  } catch (error) {
    console.error('[Migration] Database reset failed:', error);
    return false;
  }
}
