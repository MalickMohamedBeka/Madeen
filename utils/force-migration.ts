import { getDatabase } from './database';
import { logger } from '@/utils/logger';

/**
 * Force migration of database schema
 * Run this once to update existing databases
 */
export async function forceMigration() {
  try {
    logger.debug('[ForceMigration] Starting forced migration...');
    const db = await getDatabase();
    
    // Drop and recreate prophets table
    logger.debug('[ForceMigration] Migrating prophets table...');
    await db.execAsync('DROP TABLE IF EXISTS prophets;');
    await db.execAsync(`
      CREATE TABLE prophets (
        id TEXT PRIMARY KEY,
        name_french TEXT NOT NULL,
        name_arabic TEXT,
        name_translit TEXT,
        description TEXT,
        key_event TEXT,
        quranic_mention TEXT,
        "order" INTEGER DEFAULT 0,
        is_custom INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Drop and recreate sahabas table
    logger.debug('[ForceMigration] Migrating sahabas table...');
    await db.execAsync('DROP TABLE IF EXISTS sahabas;');
    await db.execAsync(`
      CREATE TABLE sahabas (
        id TEXT PRIMARY KEY,
        name_french TEXT NOT NULL,
        name_arabic TEXT,
        name_translit TEXT,
        title TEXT,
        description TEXT,
        key_contribution TEXT,
        birth_year TEXT,
        death_year TEXT,
        category TEXT DEFAULT 'sahaba',
        is_custom INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Drop and recreate habits table to force reload of new habits
    logger.debug('[ForceMigration] Resetting habits table...');
    await db.execAsync('DROP TABLE IF EXISTS habits;');
    await db.execAsync(`
      CREATE TABLE habits (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        icon TEXT NOT NULL,
        category TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        is_custom INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    logger.debug('[ForceMigration] Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('[ForceMigration] Migration failed:', error);
    return false;
  }
}
