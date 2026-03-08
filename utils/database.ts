import * as SQLite from 'expo-sqlite';
import { runMigrations, getCurrentVersion } from './databaseMigrations';
import { logger } from '@/utils/logger';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// ✅ FIX: Thread-safe singleton pattern with Promise
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Return existing instance if already initialized
  if (db) {
    return db;
  }

  // Return existing initialization promise if in progress
  if (initPromise) {
    return initPromise;
  }

  // Create new initialization promise
  initPromise = (async () => {
    try {
      logger.debug('[Database] Opening database...');
      const database = await SQLite.openDatabaseAsync('madeen.db');
      
      logger.debug('[Database] Running migrations...');
      const migrationSuccess = await runMigrations(database);
      
      if (!migrationSuccess) {
        throw new Error('Database migration failed');
      }
      
      db = database;
      const version = await getCurrentVersion();
      logger.debug(`[Database] Database initialized successfully (version ${version})`);
      return database;
    } catch (error) {
      console.error('[Database] Initialization error:', error);
      // Reset promise on error to allow retry
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

// Get database instance
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return await initDatabase();
  }
  return db;
}

// Note: Table creation is now handled by the migration system
// See utils/databaseMigrations.ts for schema definitions

// Reset database (for testing or data clear)
export async function resetDatabase(): Promise<void> {
  try {
    const database = await getDatabase();
    
    logger.debug('[Database] Dropping all tables...');
    
    const tables = [
      'user_profile', 'habits', 'verses', 'dhikr_items', 'duas',
      'prophets', 'sahabas', 'quran_progress', 'streak_data',
      'settings', 'location_cache', 'weather_cache', 'prayer_times_cache',
      'daily_stats'
    ];

    for (const table of tables) {
      await database.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }

    logger.debug('[Database] Recreating tables...');
    // Tables will be recreated by running migrations again
    await runMigrations(database);
    
    logger.debug('[Database] Database reset complete');
  } catch (error) {
    console.error('[Database] Reset error:', error);
    throw error;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  try {
    if (db) {
      await db.closeAsync();
      db = null;
      logger.debug('[Database] Database closed');
    }
  } catch (error) {
    console.error('[Database] Error closing database:', error);
  }
}

// Execute raw SQL (for debugging)
export async function executeSQL(sql: string, params: any[] = []): Promise<any> {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(sql, params);
    return result;
  } catch (error) {
    console.error('[Database] SQL execution error:', error);
    throw error;
  }
}

// Get all rows from a query
export async function querySQL<T>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const database = await getDatabase();
    const result = await database.getAllAsync<T>(sql, params);
    return result;
  } catch (error) {
    console.error('[Database] Query error:', error);
    throw error;
  }
}

// Get single row from a query
export async function querySingleSQL<T>(sql: string, params: any[] = []): Promise<T | null> {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<T>(sql, params);
    return result || null;
  } catch (error) {
    console.error('[Database] Query single error:', error);
    throw error;
  }
}
