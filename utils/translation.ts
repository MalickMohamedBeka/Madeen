import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const TRANSLATION_CACHE_KEY = 'translation_cache';
const PENDING_TRANSLATIONS_KEY = 'pending_translations';

export interface TranslationResult {
  arabic: string;
  transliteration: string;
  fromCache: boolean;
}

interface CachedTranslation {
  french: string;
  arabic: string;
  transliteration: string;
  timestamp: number;
}

interface PendingTranslation {
  id: string;
  french: string;
  timestamp: number;
}

// Simple transliteration mapping for common Islamic terms
const commonIslamicTerms: Record<string, { arabic: string; translit: string }> = {
  'allah': { arabic: 'الله', translit: 'Allah' },
  'bismillah': { arabic: 'بسم الله', translit: 'Bismillah' },
  'alhamdulillah': { arabic: 'الحمد لله', translit: 'Alhamdulillah' },
  'subhanallah': { arabic: 'سبحان الله', translit: 'SubhanAllah' },
  'inshallah': { arabic: 'إن شاء الله', translit: 'InshAllah' },
  'mashallah': { arabic: 'ما شاء الله', translit: 'MashAllah' },
  'astaghfirullah': { arabic: 'أستغفر الله', translit: 'Astaghfirullah' },
  'allahu akbar': { arabic: 'الله أكبر', translit: 'Allahu Akbar' },
  'la ilaha illallah': { arabic: 'لا إله إلا الله', translit: 'La ilaha illallah' },
  'muhammad': { arabic: 'محمد', translit: 'Muhammad' },
  'prophète': { arabic: 'نبي', translit: 'Nabi' },
  'coran': { arabic: 'قرآن', translit: 'Quran' },
  'ramadan': { arabic: 'رمضان', translit: 'Ramadan' },
  'prière': { arabic: 'صلاة', translit: 'Salah' },
  'dua': { arabic: 'دعاء', translit: 'Dua' },
  'dhikr': { arabic: 'ذكر', translit: 'Dhikr' },
};

// Get cached translations
async function getTranslationCache(): Promise<Record<string, CachedTranslation>> {
  try {
    const cache = await AsyncStorage.getItem(TRANSLATION_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (err) {
    logger.debug('[Translation] Cache read error', 'Translation', err);
    return {};
  }
}

// Save to cache
async function saveToCache(french: string, arabic: string, transliteration: string): Promise<void> {
  try {
    const cache = await getTranslationCache();
    cache[french.toLowerCase()] = {
      french,
      arabic,
      transliteration,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    logger.debug('[Translation] Cache save error', 'Translation', err);
  }
}

// Check common Islamic terms first
function checkCommonTerms(text: string): TranslationResult | null {
  const normalized = text.toLowerCase().trim();
  if (commonIslamicTerms[normalized]) {
    return {
      arabic: commonIslamicTerms[normalized].arabic,
      transliteration: commonIslamicTerms[normalized].translit,
      fromCache: true,
    };
  }
  return null;
}

// Translate using LibreTranslate (free, no API key needed)
async function translateOnline(text: string): Promise<TranslationResult> {
  try {
    logger.debug('[Translation] Translating online:', text);
    
    // Translate to Arabic
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'fr',
        target: 'ar',
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error('Translation API failed');
    }

    const data = await response.json();
    const arabic = data.translatedText || text;
    
    // Generate simple transliteration (basic romanization)
    const transliteration = generateTransliteration(text);
    
    // Save to cache
    await saveToCache(text, arabic, transliteration);
    
    logger.debug('[Translation] Success', 'Translation', { arabic, transliteration });
    
    return {
      arabic,
      transliteration,
      fromCache: false,
    };
  } catch (err) {
    logger.debug('[Translation] Online translation error', 'Translation', err);
    throw err;
  }
}

// Generate basic transliteration from French text
function generateTransliteration(text: string): string {
  // Simple capitalization and cleanup for transliteration
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Add to pending queue for later sync
async function addToPendingQueue(french: string): Promise<void> {
  try {
    const pending = await AsyncStorage.getItem(PENDING_TRANSLATIONS_KEY);
    const queue: PendingTranslation[] = pending ? JSON.parse(pending) : [];
    
    // Check if already in queue
    if (!queue.find(p => p.french.toLowerCase() === french.toLowerCase())) {
      queue.push({
        id: Date.now().toString(),
        french,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(PENDING_TRANSLATIONS_KEY, JSON.stringify(queue));
      logger.debug('[Translation] Added to pending queue:', french);
    }
  } catch (err) {
    logger.debug('[Translation] Pending queue error', 'Translation', err);
  }
}

// Main translation function
export async function translateToArabic(text: string): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return {
      arabic: '',
      transliteration: '',
      fromCache: false,
    };
  }

  // 1. Check common Islamic terms
  const commonTerm = checkCommonTerms(text);
  if (commonTerm) {
    logger.debug('[Translation] Found in common terms:', text);
    return commonTerm;
  }

  // 2. Check cache
  const cache = await getTranslationCache();
  const cached = cache[text.toLowerCase()];
  if (cached) {
    logger.debug('[Translation] Found in cache:', text);
    return {
      arabic: cached.arabic,
      transliteration: cached.transliteration,
      fromCache: true,
    };
  }

  // 3. Try online translation
  try {
    return await translateOnline(text);
  } catch (err) {
    // 4. If offline, add to pending queue and return placeholder
    logger.debug('[Translation] Offline, adding to queue:', text);
    await addToPendingQueue(text);
    
    return {
      arabic: text, // Fallback to original text
      transliteration: generateTransliteration(text),
      fromCache: false,
    };
  }
}

// Sync pending translations when online
export async function syncPendingTranslations(): Promise<number> {
  try {
    const pending = await AsyncStorage.getItem(PENDING_TRANSLATIONS_KEY);
    if (!pending) return 0;

    const queue: PendingTranslation[] = JSON.parse(pending);
    if (queue.length === 0) return 0;

    logger.debug(`[Translation] Syncing ${queue.length} pending translations`);
    
    let synced = 0;
    const remaining: PendingTranslation[] = [];

    for (const item of queue) {
      try {
        await translateOnline(item.french);
        synced++;
      } catch (err) {
        // Keep in queue if still failing
        remaining.push(item);
      }
    }

    // Update queue with remaining items
    await AsyncStorage.setItem(PENDING_TRANSLATIONS_KEY, JSON.stringify(remaining));
    
    logger.debug(`[Translation] Synced ${synced} translations, ${remaining.length} remaining`);
    return synced;
  } catch (err) {
    logger.debug('[Translation] Sync error', 'Translation', err);
    return 0;
  }
}

// Get pending count
export async function getPendingTranslationsCount(): Promise<number> {
  try {
    const pending = await AsyncStorage.getItem(PENDING_TRANSLATIONS_KEY);
    if (!pending) return 0;
    const queue: PendingTranslation[] = JSON.parse(pending);
    return queue.length;
  } catch (err) {
    return 0;
  }
}
