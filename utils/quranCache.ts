import { getDatabase } from './database';
import { logger } from '@/utils/logger';

// ==================== QURAN CACHE ====================

export interface CachedSurah {
  number: number;
  name: string;
  nameArabic: string;
  nameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
}

export interface CachedAyah {
  surahNumber: number;
  ayahNumber: number;
  textArabic: string;
  textTranslation: string;
  textTransliteration?: string;
  audioUrl?: string;
}

// Initialize Quran cache tables
export async function initQuranCache(): Promise<void> {
  try {
    const db = await getDatabase();
    
    // Surahs table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quran_surahs (
        number INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        name_arabic TEXT NOT NULL,
        name_translation TEXT NOT NULL,
        revelation_type TEXT NOT NULL,
        number_of_ayahs INTEGER NOT NULL,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ayahs table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quran_ayahs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surah_number INTEGER NOT NULL,
        ayah_number INTEGER NOT NULL,
        text_arabic TEXT NOT NULL,
        text_translation TEXT NOT NULL,
        text_transliteration TEXT,
        audio_url TEXT,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(surah_number, ayah_number)
      );
    `);

    // Indexes for performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_ayahs_surah ON quran_ayahs(surah_number);
      CREATE INDEX IF NOT EXISTS idx_ayahs_surah_ayah ON quran_ayahs(surah_number, ayah_number);
    `);

    logger.debug('[QuranCache] Tables initialized');
  } catch (error) {
    console.error('[QuranCache] Initialization error:', error);
    throw error;
  }
}

// ==================== SURAHS ====================

export async function cacheSurah(surah: CachedSurah): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO quran_surahs 
       (number, name, name_arabic, name_translation, revelation_type, number_of_ayahs, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [surah.number, surah.name, surah.nameArabic, surah.nameTranslation, 
       surah.revelationType, surah.numberOfAyahs]
    );
    
    return true;
  } catch (error) {
    console.error('[QuranCache] Error caching surah:', error);
    return false;
  }
}

export async function getCachedSurah(number: number): Promise<CachedSurah | null> {
  try {
    const db = await getDatabase();
    
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM quran_surahs WHERE number = ?',
      [number]
    );
    
    if (!result) return null;
    
    return {
      number: result.number,
      name: result.name,
      nameArabic: result.name_arabic,
      nameTranslation: result.name_translation,
      revelationType: result.revelation_type,
      numberOfAyahs: result.number_of_ayahs,
    };
  } catch (error) {
    console.error('[QuranCache] Error getting cached surah:', error);
    return null;
  }
}

export async function getAllCachedSurahs(): Promise<CachedSurah[]> {
  try {
    const db = await getDatabase();
    
    const results = await db.getAllAsync<any>(
      'SELECT * FROM quran_surahs ORDER BY number ASC'
    );
    
    return results.map(row => ({
      number: row.number,
      name: row.name,
      nameArabic: row.name_arabic,
      nameTranslation: row.name_translation,
      revelationType: row.revelation_type,
      numberOfAyahs: row.number_of_ayahs,
    }));
  } catch (error) {
    console.error('[QuranCache] Error getting all surahs:', error);
    return [];
  }
}

// ==================== AYAHS ====================

export async function cacheAyah(ayah: CachedAyah): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO quran_ayahs 
       (surah_number, ayah_number, text_arabic, text_translation, text_transliteration, audio_url, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [ayah.surahNumber, ayah.ayahNumber, ayah.textArabic, ayah.textTranslation,
       ayah.textTransliteration || null, ayah.audioUrl || null]
    );
    
    return true;
  } catch (error) {
    console.error('[QuranCache] Error caching ayah:', error);
    return false;
  }
}

export async function cacheMultipleAyahs(ayahs: CachedAyah[]): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    // Utiliser des insertions individuelles pour éviter les transactions imbriquées
    for (const ayah of ayahs) {
      await db.runAsync(
        `INSERT OR REPLACE INTO quran_ayahs 
         (surah_number, ayah_number, text_arabic, text_translation, text_transliteration, audio_url, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [ayah.surahNumber, ayah.ayahNumber, ayah.textArabic, ayah.textTranslation,
         ayah.textTransliteration || null, ayah.audioUrl || null]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[QuranCache] Error caching multiple ayahs:', error);
    return false;
  }
}

export async function getCachedAyah(surahNumber: number, ayahNumber: number): Promise<CachedAyah | null> {
  try {
    const db = await getDatabase();
    
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM quran_ayahs WHERE surah_number = ? AND ayah_number = ?',
      [surahNumber, ayahNumber]
    );
    
    if (!result) return null;
    
    return {
      surahNumber: result.surah_number,
      ayahNumber: result.ayah_number,
      textArabic: result.text_arabic,
      textTranslation: result.text_translation,
      textTransliteration: result.text_transliteration,
      audioUrl: result.audio_url,
    };
  } catch (error) {
    console.error('[QuranCache] Error getting cached ayah:', error);
    return null;
  }
}

export async function getCachedSurahAyahs(surahNumber: number): Promise<CachedAyah[]> {
  try {
    const db = await getDatabase();
    
    const results = await db.getAllAsync<any>(
      'SELECT * FROM quran_ayahs WHERE surah_number = ? ORDER BY ayah_number ASC',
      [surahNumber]
    );
    
    return results.map(row => ({
      surahNumber: row.surah_number,
      ayahNumber: row.ayah_number,
      textArabic: row.text_arabic,
      textTranslation: row.text_translation,
      textTransliteration: row.text_transliteration,
      audioUrl: row.audio_url,
    }));
  } catch (error) {
    console.error('[QuranCache] Error getting cached surah ayahs:', error);
    return [];
  }
}

// ==================== CACHE STATUS ====================

export async function isSurahCached(surahNumber: number): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM quran_ayahs WHERE surah_number = ?',
      [surahNumber]
    );
    
    if (!result) return false;
    
    // Check if we have all ayahs for this surah
    const surah = await getCachedSurah(surahNumber);
    if (!surah) return false;
    
    return result.count === surah.numberOfAyahs;
  } catch (error) {
    console.error('[QuranCache] Error checking if surah is cached:', error);
    return false;
  }
}

export async function getCacheStats(): Promise<{
  totalSurahs: number;
  cachedSurahs: number;
  totalAyahs: number;
  cachedAyahs: number;
  cachePercentage: number;
}> {
  try {
    const db = await getDatabase();
    
    const surahsResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM quran_surahs'
    );
    
    const ayahsResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM quran_ayahs'
    );
    
    const totalSurahs = 114;
    const totalAyahs = 6236;
    const cachedSurahs = surahsResult?.count || 0;
    const cachedAyahs = ayahsResult?.count || 0;
    
    const cachePercentage = Math.round((cachedAyahs / totalAyahs) * 100);
    
    return {
      totalSurahs,
      cachedSurahs,
      totalAyahs,
      cachedAyahs,
      cachePercentage,
    };
  } catch (error) {
    console.error('[QuranCache] Error getting cache stats:', error);
    return {
      totalSurahs: 114,
      cachedSurahs: 0,
      totalAyahs: 6236,
      cachedAyahs: 0,
      cachePercentage: 0,
    };
  }
}

// ==================== CLEAR CACHE ====================

export async function clearQuranCache(): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.execAsync('DELETE FROM quran_surahs');
    await db.execAsync('DELETE FROM quran_ayahs');
    
    logger.debug('[QuranCache] Cache cleared');
    return true;
  } catch (error) {
    console.error('[QuranCache] Error clearing cache:', error);
    return false;
  }
}
