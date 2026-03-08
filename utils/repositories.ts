import { getDatabase } from './database';
import { Habit, Verse, DhikrItem, Dua, Prophet, Sahaba, QuranProgress, StreakData, UserLocation, Weather } from '@/types';
import { PrayerTimeEntry } from './prayerTimes';

// ==================== USER PROFILE ====================

export async function getUserProfile(): Promise<{ name: string; nameArabic: string } | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ name: string; name_arabic: string }>(
      'SELECT name, name_arabic FROM user_profile WHERE id = 1'
    );
    
    if (!result) return null;
    
    return {
      name: result.name,
      nameArabic: result.name_arabic || '',
    };
  } catch (error) {
    console.error('[Repository] getUserProfile error:', error);
    return null;
  }
}

export async function saveUserProfile(name: string, nameArabic: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    const existing = await db.getFirstAsync('SELECT id FROM user_profile WHERE id = 1');
    
    if (existing) {
      await db.runAsync(
        'UPDATE user_profile SET name = ?, name_arabic = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [name, nameArabic]
      );
    } else {
      await db.runAsync(
        'INSERT INTO user_profile (id, name, name_arabic) VALUES (1, ?, ?)',
        [name, nameArabic]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveUserProfile error:', error);
    return false;
  }
}

// ==================== HABITS ====================

export async function getAllHabits(): Promise<Habit[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM habits ORDER BY created_at ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      icon: row.icon,
      category: row.category,
      completed: row.completed === 1,
      isCustom: row.is_custom === 1,
    }));
  } catch (error) {
    console.error('[Repository] getAllHabits error:', error);
    return [];
  }
}

export async function saveHabit(habit: Habit): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO habits (id, title, icon, category, completed, is_custom, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [habit.id, habit.title, habit.icon, habit.category, habit.completed ? 1 : 0, habit.isCustom ? 1 : 0]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] saveHabit error:', error);
    return false;
  }
}

export async function saveAllHabits(habits: Habit[]): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    // Utiliser des insertions individuelles pour éviter les transactions imbriquées
    for (const habit of habits) {
      await db.runAsync(
        `INSERT OR REPLACE INTO habits (id, title, icon, category, completed, is_custom, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [habit.id, habit.title, habit.icon, habit.category, habit.completed ? 1 : 0, habit.isCustom ? 1 : 0]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveAllHabits error:', error);
    return false;
  }
}

export async function deleteHabit(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('[Repository] deleteHabit error:', error);
    return false;
  }
}

// ==================== VERSES ====================

export async function getAllVerses(): Promise<Verse[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM verses ORDER BY created_at DESC'
    );
    
    return rows.map(row => ({
      id: row.id,
      arabic: row.text,
      french: row.translation || '',
      transliteration: '',
      reference: row.reference,
      isFavorite: row.is_favorite === 1,
      isRead: row.is_read === 1,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('[Repository] getAllVerses error:', error);
    return [];
  }
}

export async function saveVerse(verse: Verse): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO verses (id, text, translation, reference, is_favorite, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [verse.id, verse.arabic, verse.french || null, verse.reference, 
       verse.isFavorite ? 1 : 0, verse.isRead ? 1 : 0, verse.createdAt]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] saveVerse error:', error);
    return false;
  }
}

export async function saveAllVerses(verses: Verse[]): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    // Utiliser des insertions individuelles pour éviter les transactions imbriquées
    for (const verse of verses) {
      await db.runAsync(
        `INSERT OR REPLACE INTO verses (id, text, translation, reference, is_favorite, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [verse.id, verse.arabic, verse.french || null, verse.reference,
         verse.isFavorite ? 1 : 0, verse.isRead ? 1 : 0, verse.createdAt]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveAllVerses error:', error);
    return false;
  }
}

export async function deleteVerse(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM verses WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('[Repository] deleteVerse error:', error);
    return false;
  }
}

// ==================== DHIKR ====================

export async function getAllDhikr(): Promise<DhikrItem[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM dhikr_items ORDER BY created_at ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      arabic: row.arabic,
      transliteration: row.transliteration || '',
      french: row.french,
      target: row.target,
      count: row.count,
      category: 'dhikr' as const,
      isCustom: row.is_custom === 1,
    }));
  } catch (error) {
    console.error('[Repository] getAllDhikr error:', error);
    return [];
  }
}

export async function saveDhikr(dhikr: DhikrItem): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO dhikr_items (id, arabic, transliteration, french, target, count, is_custom, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [dhikr.id, dhikr.arabic, dhikr.transliteration || null, dhikr.french, 
       dhikr.target, dhikr.count, dhikr.isCustom ? 1 : 0]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] saveDhikr error:', error);
    return false;
  }
}

export async function saveAllDhikr(dhikrItems: DhikrItem[]): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    // Utiliser des insertions individuelles pour éviter les transactions imbriquées
    for (const dhikr of dhikrItems) {
      await db.runAsync(
        `INSERT OR REPLACE INTO dhikr_items (id, arabic, transliteration, french, target, count, is_custom, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [dhikr.id, dhikr.arabic, dhikr.transliteration || null, dhikr.french,
         dhikr.target, dhikr.count, dhikr.isCustom ? 1 : 0]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveAllDhikr error:', error);
    return false;
  }
}

export async function deleteDhikr(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM dhikr_items WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('[Repository] deleteDhikr error:', error);
    return false;
  }
}

// ==================== DUAS ====================

export async function getAllDuas(): Promise<Dua[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM duas ORDER BY created_at ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      title: row.title || (row.french.substring(0, 30) + '...'), // Use stored title or generate from french
      arabic: row.arabic,
      transliteration: row.transliteration || '',
      french: row.french,
      category: (row.category || 'general') as any,
      isFavorite: row.is_favorite === 1,
      isCustom: row.is_custom === 1,
    }));
  } catch (error) {
    console.error('[Repository] getAllDuas error:', error);
    return [];
  }
}

export async function saveDua(dua: Dua): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO duas (id, title, arabic, transliteration, french, category, is_favorite, is_custom)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dua.id, dua.title, dua.arabic, dua.transliteration || null, dua.french,
       dua.category || null, dua.isFavorite ? 1 : 0, dua.isCustom ? 1 : 0]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] saveDua error:', error);
    return false;
  }
}

export async function saveAllDuas(duas: Dua[]): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    // Utiliser des insertions individuelles pour éviter les transactions imbriquées
    for (const dua of duas) {
      await db.runAsync(
        `INSERT OR REPLACE INTO duas (id, arabic, transliteration, french, category, is_favorite, is_custom)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dua.id, dua.arabic, dua.transliteration || null, dua.french,
         dua.category || null, dua.isFavorite ? 1 : 0, dua.isCustom ? 1 : 0]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveAllDuas error:', error);
    return false;
  }
}

export async function deleteDua(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM duas WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('[Repository] deleteDua error:', error);
    return false;
  }
}

// ==================== QURAN PROGRESS ====================

export async function getQuranProgress(): Promise<QuranProgress | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM quran_progress WHERE id = 1'
    );
    
    if (!result) return null;
    
    return {
      currentPage: result.current_page,
      currentJuz: result.current_juz,
      totalPagesRead: result.total_pages_read,
      pagesReadToday: result.pages_read_today,
      dailyGoal: result.daily_goal,
    };
  } catch (error) {
    console.error('[Repository] getQuranProgress error:', error);
    return null;
  }
}

export async function saveQuranProgress(progress: QuranProgress): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    const existing = await db.getFirstAsync('SELECT id FROM quran_progress WHERE id = 1');
    
    if (existing) {
      await db.runAsync(
        `UPDATE quran_progress SET 
         current_page = ?, current_juz = ?, total_pages_read = ?, 
         pages_read_today = ?, daily_goal = ?,
         updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [progress.currentPage, progress.currentJuz, progress.totalPagesRead,
         progress.pagesReadToday, progress.dailyGoal]
      );
    } else {
      await db.runAsync(
        `INSERT INTO quran_progress (id, current_page, current_juz, total_pages_read, 
         pages_read_today, daily_goal)
         VALUES (1, ?, ?, ?, ?, ?)`,
        [progress.currentPage, progress.currentJuz, progress.totalPagesRead,
         progress.pagesReadToday, progress.dailyGoal]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveQuranProgress error:', error);
    return false;
  }
}

// ==================== STREAK ====================

export async function getStreakData(): Promise<StreakData | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM streak_data WHERE id = 1'
    );
    
    if (!result) return null;
    
    return {
      currentStreak: result.current_streak,
      bestStreak: result.best_streak,
      lastStreakDate: result.last_streak_date || '',
    };
  } catch (error) {
    console.error('[Repository] getStreakData error:', error);
    return null;
  }
}

export async function saveStreakData(streak: StreakData): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    const existing = await db.getFirstAsync('SELECT id FROM streak_data WHERE id = 1');
    
    if (existing) {
      await db.runAsync(
        `UPDATE streak_data SET 
         current_streak = ?, best_streak = ?, last_streak_date = ?,
         updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [streak.currentStreak, streak.bestStreak, streak.lastStreakDate]
      );
    } else {
      await db.runAsync(
        `INSERT INTO streak_data (id, current_streak, best_streak, last_streak_date)
         VALUES (1, ?, ?, ?)`,
        [streak.currentStreak, streak.bestStreak, streak.lastStreakDate]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveStreakData error:', error);
    return false;
  }
}

// ==================== SETTINGS ====================

export async function getSettings(): Promise<any | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM settings WHERE id = 1'
    );
    
    if (!result) return null;
    
    return {
      soundEnabled: result.sound_enabled === 1,
      hapticsEnabled: result.haptics_enabled === 1,
    };
  } catch (error) {
    console.error('[Repository] getSettings error:', error);
    return null;
  }
}

export async function saveSettings(settings: any): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    const existing = await db.getFirstAsync('SELECT id FROM settings WHERE id = 1');
    
    if (existing) {
      await db.runAsync(
        `UPDATE settings SET 
         sound_enabled = ?, haptics_enabled = ?,
         updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [settings.soundEnabled ? 1 : 0, settings.hapticsEnabled ? 1 : 0]
      );
    } else {
      await db.runAsync(
        `INSERT INTO settings (id, sound_enabled, haptics_enabled)
         VALUES (1, ?, ?)`,
        [settings.soundEnabled ? 1 : 0, settings.hapticsEnabled ? 1 : 0]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveSettings error:', error);
    return false;
  }
}

// ==================== CACHE ====================

export async function getLocationCache(): Promise<UserLocation | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM location_cache WHERE id = 1'
    );
    
    if (!result) return null;
    
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.city || '',
    };
  } catch (error) {
    console.error('[Repository] getLocationCache error:', error);
    return null;
  }
}

export async function saveLocationCache(location: UserLocation): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO location_cache (id, latitude, longitude, city, updated_at)
       VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [location.latitude, location.longitude, location.city || null]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] saveLocationCache error:', error);
    return false;
  }
}

export async function getWeatherCache(): Promise<Weather | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM weather_cache WHERE id = 1'
    );
    
    if (!result) return null;
    
    // Check if cache is less than 30 minutes old
    const cacheAge = Date.now() - new Date(result.updated_at).getTime();
    if (cacheAge > 1800000) { // 30 minutes
      return null;
    }
    
    return {
      temperature: result.temperature,
      condition: result.condition,
      icon: result.icon,
      lastUpdated: result.updated_at,
    };
  } catch (error) {
    console.error('[Repository] getWeatherCache error:', error);
    return null;
  }
}

export async function saveWeatherCache(weather: Weather): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO weather_cache (id, temperature, condition, icon, updated_at)
       VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [weather.temperature, weather.condition, weather.icon]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] saveWeatherCache error:', error);
    return false;
  }
}

export async function getPrayerTimesCache(): Promise<{ times: PrayerTimeEntry[]; date: string } | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM prayer_times_cache WHERE id = 1'
    );
    
    if (!result) return null;
    
    const times: PrayerTimeEntry[] = [
      { name: 'Fajr', nameAr: 'الفجر', time: result.fajr, icon: 'star' },
      { name: 'Chourouk', nameAr: 'الشروق', time: result.sunrise, icon: 'sunrise' },
      { name: 'Dhuhr', nameAr: 'الظهر', time: result.dhuhr, icon: 'sun' },
      { name: 'Asr', nameAr: 'العصر', time: result.asr, icon: 'cloud-sun' },
      { name: 'Maghrib', nameAr: 'المغرب', time: result.maghrib, icon: 'sunset' },
      { name: 'Isha', nameAr: 'العشاء', time: result.isha, icon: 'moon' },
    ];
    
    return { times, date: result.date };
  } catch (error) {
    console.error('[Repository] getPrayerTimesCache error:', error);
    return null;
  }
}

export async function savePrayerTimesCache(times: PrayerTimeEntry[], date: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO prayer_times_cache 
       (id, fajr, sunrise, dhuhr, asr, maghrib, isha, date, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [times[0].time, times[1].time, times[2].time, times[3].time, times[4].time, times[5].time, date]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] savePrayerTimesCache error:', error);
    return false;
  }
}


// ==================== APP STATE ====================

export async function getLastResetDate(): Promise<string | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ last_reset_date: string }>(
      'SELECT last_reset_date FROM app_state WHERE id = 1'
    );
    
    return result?.last_reset_date || null;
  } catch (error) {
    console.error('[Repository] getLastResetDate error:', error);
    return null;
  }
}

export async function saveLastResetDate(date: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    const existing = await db.getFirstAsync('SELECT id FROM app_state WHERE id = 1');
    
    if (existing) {
      await db.runAsync(
        'UPDATE app_state SET last_reset_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [date]
      );
    } else {
      await db.runAsync(
        'INSERT INTO app_state (id, last_reset_date) VALUES (1, ?)',
        [date]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveLastResetDate error:', error);
    return false;
  }
}

// ==================== PROPHETS ====================

export async function getAllProphets(): Promise<Prophet[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM prophets ORDER BY "order" ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      nameArabic: row.name_arabic,
      nameFrench: row.name_french,
      nameTranslit: row.name_translit,
      description: row.description,
      keyEvent: row.key_event,
      quranicMention: row.quranic_mention,
      order: row.order,
      isCustom: row.is_custom === 1,
    }));
  } catch (error) {
    console.error('[Repository] getAllProphets error:', error);
    return [];
  }
}

export async function saveProphet(prophet: Prophet): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO prophets (id, name_arabic, name_french, name_translit, description, key_event, quranic_mention, "order", is_custom, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [prophet.id, prophet.nameArabic, prophet.nameFrench, prophet.nameTranslit, prophet.description, prophet.keyEvent, prophet.quranicMention, prophet.order, prophet.isCustom ? 1 : 0]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] saveProphet error:', error);
    return false;
  }
}

export async function saveAllProphets(prophets: Prophet[]): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    // Utiliser des insertions individuelles pour éviter les transactions imbriquées
    for (const prophet of prophets) {
      await db.runAsync(
        `INSERT OR REPLACE INTO prophets (id, name_arabic, name_french, name_translit, description, key_event, quranic_mention, "order", is_custom, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [prophet.id, prophet.nameArabic, prophet.nameFrench, prophet.nameTranslit, prophet.description, prophet.keyEvent, prophet.quranicMention, prophet.order, prophet.isCustom ? 1 : 0]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveAllProphets error:', error);
    return false;
  }
}

export async function deleteProphet(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM prophets WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('[Repository] deleteProphet error:', error);
    return false;
  }
}

// ==================== SAHABAS ====================

export async function getAllSahabas(): Promise<Sahaba[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM sahabas ORDER BY created_at ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      nameArabic: row.name_arabic,
      nameFrench: row.name_french,
      nameTranslit: row.name_translit,
      title: row.title,
      description: row.description,
      keyContribution: row.key_contribution,
      birthYear: row.birth_year || undefined,
      deathYear: row.death_year || undefined,
      category: row.category,
      isCustom: row.is_custom === 1,
    }));
  } catch (error) {
    console.error('[Repository] getAllSahabas error:', error);
    return [];
  }
}

export async function saveSahaba(sahaba: Sahaba): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO sahabas (id, name_arabic, name_french, name_translit, title, description, key_contribution, birth_year, death_year, category, is_custom, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [sahaba.id, sahaba.nameArabic, sahaba.nameFrench, sahaba.nameTranslit, sahaba.title, sahaba.description, sahaba.keyContribution, sahaba.birthYear || null, sahaba.deathYear || null, sahaba.category, sahaba.isCustom ? 1 : 0]
    );
    
    return true;
  } catch (error) {
    console.error('[Repository] saveSahaba error:', error);
    return false;
  }
}

export async function saveAllSahabas(sahabas: Sahaba[]): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    // Utiliser des insertions individuelles pour éviter les transactions imbriquées
    for (const sahaba of sahabas) {
      await db.runAsync(
        `INSERT OR REPLACE INTO sahabas (id, name_arabic, name_french, name_translit, title, description, key_contribution, birth_year, death_year, category, is_custom, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [sahaba.id, sahaba.nameArabic, sahaba.nameFrench, sahaba.nameTranslit, sahaba.title, sahaba.description, sahaba.keyContribution, sahaba.birthYear || null, sahaba.deathYear || null, sahaba.category, sahaba.isCustom ? 1 : 0]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[Repository] saveAllSahabas error:', error);
    return false;
  }
}

export async function deleteSahaba(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM sahabas WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('[Repository] deleteSahaba error:', error);
    return false;
  }
}
