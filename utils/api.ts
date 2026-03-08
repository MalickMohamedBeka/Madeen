import { PrayerTimeEntry } from './prayerTimes';
import { fetchWithRetry } from './apiRetry';
import { apiQueue } from './apiQueue';
import { apiMonitoring } from './apiMonitoring';
import { logger } from '@/utils/logger';

// User-Agent for external APIs
const USER_AGENT = 'MadeenApp/1.0.0 (contact@madeen.app)';

// Increased timeouts for slow networks (3G)
const DEFAULT_TIMEOUT = 30000; // 30s
// const QURAN_TIMEOUT = 45000; // 45s for large Quran requests

// ==================== PRAYER TIMES API (Aladhan) ====================

export interface PrayerTimesResponse {
  times: PrayerTimeEntry[];
  date: string;
}

export async function fetchPrayerTimesAPI(
  lat: number,
  lng: number,
  date: Date = new Date()
): Promise<PrayerTimesResponse | null> {
  const startTime = Date.now();
  const endpoint = 'aladhan/prayer-times';

  try {
    // Validation
    if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.error('[API] Invalid coordinates:', { lat, lng });
      return null;
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=3`;
    logger.debug('[API] Fetching prayer times from:', url);

    // Use retry logic with exponential backoff
    const data = await fetchWithRetry<any>(
      url,
      {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': USER_AGENT,
        },
      },
      {
        maxRetries: 3,
        timeout: DEFAULT_TIMEOUT,
      }
    );

    if (!data.data || !data.data.timings) {
      throw new Error('Invalid response structure');
    }

    const timings = data.data.timings;

    const times: PrayerTimeEntry[] = [
      { name: 'Fajr', nameAr: 'الفجر', time: timings.Fajr.substring(0, 5), icon: 'star' },
      { name: 'Chourouk', nameAr: 'الشروق', time: timings.Sunrise.substring(0, 5), icon: 'sunrise' },
      { name: 'Dhuhr', nameAr: 'الظهر', time: timings.Dhuhr.substring(0, 5), icon: 'sun' },
      { name: 'Asr', nameAr: 'العصر', time: timings.Asr.substring(0, 5), icon: 'cloud-sun' },
      { name: 'Maghrib', nameAr: 'المغرب', time: timings.Maghrib.substring(0, 5), icon: 'sunset' },
      { name: 'Isha', nameAr: 'العشاء', time: timings.Isha.substring(0, 5), icon: 'moon' },
    ];

    const responseTime = Date.now() - startTime;
    await apiMonitoring.trackRequest(endpoint, true, responseTime);

    return {
      times,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    
    await apiMonitoring.trackRequest(endpoint, false, responseTime, err);
    
    // Queue for retry if network error
    if (err.name === 'AbortError' || err.message.includes('Network')) {
      const url = `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=3`;
      await apiQueue.enqueue(url, { headers: { 'Accept': 'application/json' } }, 'high');
    }

    console.error('[API] Prayer times error:', err.message);
    return null;
  }
}

// ==================== HIJRI DATE API (Aladhan) ====================

export interface HijriDateResponse {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
  weekdayName: string;
  weekdayNameAr: string;
}

export async function fetchHijriDateAPI(date: Date = new Date()): Promise<HijriDateResponse | null> {
  try {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const url = `https://api.aladhan.com/v1/gToH/${day}-${month}-${year}`;
    logger.debug('[API] Fetching Hijri date from:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Hijri API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.hijri) {
      throw new Error('Invalid response structure');
    }

    const hijri = data.data.hijri;

    return {
      day: parseInt(hijri.day, 10),
      month: parseInt(hijri.month.number, 10),
      year: parseInt(hijri.year, 10),
      monthName: hijri.month.en,
      monthNameAr: hijri.month.ar,
      weekdayName: hijri.weekday.en,
      weekdayNameAr: hijri.weekday.ar,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[API] Hijri date request timeout');
      } else {
        console.error('[API] Hijri date error:', error.message);
      }
    }
    return null;
  }
}

// ==================== WEATHER API (Open-Meteo) ====================

export interface WeatherResponse {
  temperature: number;
  condition: 'clear' | 'cloudy' | 'rainy' | 'snowy';
  icon: string;
  windSpeed?: number;
  humidity?: number;
}

export async function fetchWeatherAPI(lat: number, lng: number): Promise<WeatherResponse | null> {
  const startTime = Date.now();
  const endpoint = 'open-meteo/weather';

  try {
    // Validation
    if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.error('[API] Invalid coordinates:', { lat, lng });
      return null;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relative_humidity_2m`;
    logger.debug('[API] Fetching weather from:', url);

    // Use retry logic
    const data = await fetchWithRetry<any>(
      url,
      {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': USER_AGENT,
        },
      },
      {
        maxRetries: 3,
        timeout: DEFAULT_TIMEOUT,
      }
    );

    if (!data.current_weather) {
      throw new Error('Invalid response structure');
    }

    const weatherCode = data.current_weather.weathercode;
    let condition: 'clear' | 'cloudy' | 'rainy' | 'snowy' = 'clear';
    let icon = '☀️';

    // Weather code mapping (WMO codes)
    if (weatherCode === 0) {
      condition = 'clear';
      icon = '☀️';
    } else if (weatherCode <= 3) {
      condition = 'cloudy';
      icon = '☁️';
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      condition = 'rainy';
      icon = '🌧️';
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      condition = 'snowy';
      icon = '❄️';
    } else if (weatherCode >= 80) {
      condition = 'rainy';
      icon = '⛈️';
    }

    const responseTime = Date.now() - startTime;
    await apiMonitoring.trackRequest(endpoint, true, responseTime);

    return {
      temperature: Math.round(data.current_weather.temperature),
      condition,
      icon,
      windSpeed: data.current_weather.windspeed,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    
    await apiMonitoring.trackRequest(endpoint, false, responseTime, err);
    
    console.error('[API] Weather error:', err.message);
    return null;
  }
}

// ==================== QURAN API (Quran.com) ====================

export interface QuranSurahInfo {
  number: number;
  name: string;
  nameArabic: string;
  nameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
}

export interface QuranAyahResponse {
  surahNumber: number;
  ayahNumber: number;
  textArabic: string;
  textTranslation: string;
  textTransliteration?: string;
  audioUrl?: string;
  surahName: string;
  surahNameArabic: string;
}

export interface QuranSurahResponse {
  surahInfo: QuranSurahInfo;
  ayahs: QuranAyahResponse[];
}

/**
 * Fetch all surahs info from Quran.com API
 */
export async function fetchAllSurahsAPI(): Promise<QuranSurahInfo[]> {
  try {
    const url = 'https://api.quran.com/api/v4/chapters?language=fr';
    logger.debug('[Quran API] Fetching all surahs');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Quran API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.chapters || !Array.isArray(data.chapters)) {
      throw new Error('Invalid response structure');
    }

    return data.chapters.map((chapter: any) => ({
      number: chapter.id,
      name: chapter.name_simple,
      nameArabic: chapter.name_arabic,
      nameTranslation: chapter.translated_name?.name || chapter.name_simple,
      revelationType: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
      numberOfAyahs: chapter.verses_count,
    }));
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Quran API] Request timeout');
      } else {
        console.error('[Quran API] Error fetching surahs:', error.message);
      }
    }
    return [];
  }
}

/**
 * Fetch a single ayah from Quran.com API
 */
export async function fetchQuranAyahAPI(surah: number, ayah: number): Promise<QuranAyahResponse | null> {
  try {
    // Validation
    if (surah < 1 || surah > 114 || ayah < 1) {
      console.error('[Quran API] Invalid surah/ayah:', { surah, ayah });
      return null;
    }

    // Translation 131 = French (Hamidullah)
    const url = `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?translations=131&fields=text_uthmani`;
    logger.debug(`[Quran API] Fetching ayah: ${surah}:${ayah}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Quran API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.verse) {
      throw new Error('Invalid response structure');
    }

    const verse = data.verse;
    const translation = verse.translations?.[0];

    return {
      surahNumber: surah,
      ayahNumber: ayah,
      textArabic: verse.text_uthmani || verse.text_imlaei,
      textTranslation: translation?.text || '',
      surahName: verse.chapter_name || '',
      surahNameArabic: verse.chapter_name_arabic || '',
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Quran API] Request timeout');
      } else {
        console.error('[Quran API] Error fetching ayah:', error.message);
      }
    }
    return null;
  }
}

/**
 * Fetch entire surah with all ayahs from Quran.com API
 */
export async function fetchQuranSurahAPI(surahNumber: number): Promise<QuranSurahResponse | null> {
  try {
    // Validation
    if (surahNumber < 1 || surahNumber > 114) {
      console.error('[Quran API] Invalid surah number:', surahNumber);
      return null;
    }

    // Translation 131 = French (Hamidullah)
    // Translation 20 = English transliteration
    const url = `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahNumber}`;
    const translationUrl = `https://api.quran.com/api/v4/quran/translations/131?chapter_number=${surahNumber}`;
    const transliterationUrl = `https://api.quran.com/api/v4/quran/translations/20?chapter_number=${surahNumber}`;
    const chapterUrl = `https://api.quran.com/api/v4/chapters/${surahNumber}?language=fr`;

    logger.debug(`[Quran API] Fetching surah: ${surahNumber}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for full surah

    // Fetch all data in parallel
    const [versesResponse, translationsResponse, transliterationResponse, chapterResponse] = await Promise.all([
      fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } }),
      fetch(translationUrl, { signal: controller.signal, headers: { 'Accept': 'application/json' } }),
      fetch(transliterationUrl, { signal: controller.signal, headers: { 'Accept': 'application/json' } }),
      fetch(chapterUrl, { signal: controller.signal, headers: { 'Accept': 'application/json' } }),
    ]);

    clearTimeout(timeoutId);

    if (!versesResponse.ok || !translationsResponse.ok || !chapterResponse.ok) {
      throw new Error('One or more API requests failed');
    }

    const versesData = await versesResponse.json();
    const translationsData = await translationsResponse.json();
    const transliterationData = transliterationResponse.ok ? await transliterationResponse.json() : null;
    const chapterData = await chapterResponse.json();

    if (!versesData.verses || !translationsData.translations || !chapterData.chapter) {
      throw new Error('Invalid response structure');
    }

    const chapter = chapterData.chapter;
    const surahInfo: QuranSurahInfo = {
      number: chapter.id,
      name: chapter.name_simple,
      nameArabic: chapter.name_arabic,
      nameTranslation: chapter.translated_name?.name || chapter.name_simple,
      revelationType: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
      numberOfAyahs: chapter.verses_count,
    };

    const ayahs: QuranAyahResponse[] = versesData.verses.map((verse: any, index: number) => {
      const translation = translationsData.translations[index];
      const transliteration = transliterationData?.translations?.[index];
      
      // Nettoyer le HTML de la translitération
      const cleanTransliteration = transliteration?.text 
        ? transliteration.text.replace(/<[^>]*>/g, '').trim()
        : undefined;
      
      // Nettoyer le HTML de la traduction
      const cleanTranslation = translation?.text 
        ? translation.text.replace(/<[^>]*>/g, '').trim()
        : '';
      
      // Debug: Log si la traduction est vide
      if (!cleanTranslation && index < 3) {
        logger.debug(`[Quran API] Missing translation for verse ${verse.verse_number} - Raw: ${translation}`);
      }
      
      return {
        surahNumber,
        ayahNumber: verse.verse_number,
        textArabic: verse.text_uthmani,
        textTranslation: cleanTranslation,
        textTransliteration: cleanTransliteration,
        surahName: chapter.name_simple,
        surahNameArabic: chapter.name_arabic,
      };
    });

    logger.debug(`[Quran API] Fetched surah with ${ayahs.length} ayahs`);
    logger.debug('[Quran API] Sample translation:', ayahs[0]?.textTranslation?.substring(0, 50));

    return {
      surahInfo,
      ayahs,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Quran API] Request timeout');
      } else {
        console.error('[Quran API] Error fetching surah:', error.message);
      }
    }
    return null;
  }
}

/**
 * Fetch audio URL for an ayah
 */
export async function fetchQuranAudioAPI(surah: number, ayah: number, reciter: string = 'ar.alafasy'): Promise<string | null> {
  try {
    // Validation
    if (surah < 1 || surah > 114 || ayah < 1) {
      console.error('[Quran API] Invalid surah/ayah:', { surah, ayah });
      return null;
    }

    // Format: https://verses.quran.com/[reciter]/[surah]_[ayah].mp3
    // Popular reciters: ar.alafasy, ar.abdulbasitmurattal, ar.minshawi
    const paddedSurah = String(surah).padStart(3, '0');
    const paddedAyah = String(ayah).padStart(3, '0');
    const audioUrl = `https://verses.quran.com/${reciter}/${paddedSurah}${paddedAyah}.mp3`;

    logger.debug('[Quran API] Audio URL:', audioUrl);
    return audioUrl;
  } catch (error) {
    console.error('[Quran API] Error generating audio URL:', error);
    return null;
  }
}

// ==================== TRANSLATION API (MyMemory) ====================
// NOTE: Utilise MyMemory API SANS clé - 1000 requêtes/jour gratuit (suffisant pour l'app)
// Pas besoin de clé API, l'API est publique et gratuite

export interface TranslationResponse {
  arabic: string;
  transliteration: string;
}

export async function translateToArabicAPI(text: string): Promise<TranslationResponse | null> {
  const startTime = Date.now();
  const endpoint = 'mymemory/translation';

  try {
    if (!text || text.trim() === '') {
      console.error('[API] Empty text for translation');
      return null;
    }

    // Limit text length
    if (text.length > 500) {
      console.error('[API] Text too long for translation:', text.length);
      return null;
    }

    // Check quota before making request
    const hasQuota = await apiMonitoring.trackQuota('mymemory');
    if (!hasQuota) {
      logger.warn('[API] MyMemory quota exceeded, using fallback');
      // Fallback: return original text
      return {
        arabic: text,
        transliteration: romanizeArabic(text),
      };
    }

    // MyMemory API - FREE without key (1000 requests/day)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|ar`;
    logger.debug('[API] Translating text (free tier - 1000 req/day):', text.substring(0, 50));

    // Use retry logic
    const data = await fetchWithRetry<any>(
      url,
      {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': USER_AGENT,
        },
      },
      {
        maxRetries: 2, // Less retries for translation
        timeout: DEFAULT_TIMEOUT,
      }
    );

    if (!data.responseData || !data.responseData.translatedText) {
      throw new Error('Invalid response structure');
    }

    const arabic = data.responseData.translatedText;

    // Simple transliteration approximation
    const transliteration = romanizeArabic(arabic);

    const responseTime = Date.now() - startTime;
    await apiMonitoring.trackRequest(endpoint, true, responseTime);

    logger.debug('[API] Translation successful', 'API', { original: text.substring(0, 30), arabic: arabic.substring(0, 30) });

    return {
      arabic,
      transliteration,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    
    await apiMonitoring.trackRequest(endpoint, false, responseTime, err);
    
    console.error('[API] Translation error:', err.message);
    
    // Fallback: return original text
    return {
      arabic: text,
      transliteration: romanizeArabic(text),
    };
  }
}

// Simple Arabic to Latin transliteration (basic approximation)
function romanizeArabic(arabic: string): string {
  const map: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': "'", 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ى': 'a', 'ة': 'h',
    'َ': 'a', 'ُ': 'u', 'ِ': 'i',
    'ّ': '', 'ْ': '', 'ٌ': 'un', 'ً': 'an', 'ٍ': 'in',
  };

  let result = '';
  for (const char of arabic) {
    result += map[char] || char;
  }

  return result;
}

// ==================== GEOCODING API (Nominatim) ====================

export interface GeocodingResponse {
  city: string;
  country: string;
  displayName: string;
}

export async function reverseGeocodeAPI(lat: number, lng: number): Promise<GeocodingResponse | null> {
  const startTime = Date.now();
  const endpoint = 'nominatim/geocoding';

  try {
    // Validation
    if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.error('[API] Invalid coordinates:', { lat, lng });
      return null;
    }

    // Check quota before making request
    const hasQuota = await apiMonitoring.trackQuota('nominatim');
    if (!hasQuota) {
      logger.warn('[API] Nominatim quota exceeded, using fallback');
      return {
        city: 'Unknown',
        country: '',
        displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`;
    logger.debug('[API] Reverse geocoding', 'API', { lat, lng });

    // Use retry logic
    const data = await fetchWithRetry<any>(
      url,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': USER_AGENT, // Required by Nominatim
        },
      },
      {
        maxRetries: 2,
        timeout: DEFAULT_TIMEOUT,
      }
    );

    if (!data.address) {
      throw new Error('Invalid response structure');
    }

    const responseTime = Date.now() - startTime;
    await apiMonitoring.trackRequest(endpoint, true, responseTime);

    return {
      city: data.address.city || data.address.town || data.address.village || 'Unknown',
      country: data.address.country || '',
      displayName: data.display_name || '',
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    
    await apiMonitoring.trackRequest(endpoint, false, responseTime, err);
    
    console.error('[API] Geocoding error:', err.message);
    return null;
  }
}

// ==================== QIBLA CALCULATION (Local) ====================

export interface QiblaResponse {
  direction: number; // Degrees from North (0-360)
  distance: number; // Distance to Kaaba in kilometers
  cardinalDirection: string; // N, NE, E, SE, S, SW, W, NW
}

/**
 * Calculate Qibla direction using Great Circle formula (most accurate)
 * This is the same method used by professional Islamic apps
 * 
 * @param lat User latitude (-90 to 90)
 * @param lng User longitude (-180 to 180)
 * @returns Qibla direction in degrees from North, distance in km, and cardinal direction
 */
export function calculateQiblaDirection(lat: number, lng: number): QiblaResponse | null {
  try {
    // Validation
    if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.error('[Qibla] Invalid coordinates:', { lat, lng });
      return null;
    }

    // Kaaba coordinates (verified from multiple sources)
    // These are the official coordinates of the Kaaba in Mecca
    const KAABA_LAT = 21.422487;
    const KAABA_LNG = 39.826206;

    // Convert to radians
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const lat1 = toRad(lat);
    const lng1 = toRad(lng);
    const lat2 = toRad(KAABA_LAT);
    const lng2 = toRad(KAABA_LNG);

    // Calculate bearing using Great Circle formula
    // This is more accurate than simple Haversine for long distances
    const dLng = lng2 - lng1;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - 
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let bearing = Math.atan2(y, x);

    // Convert to degrees
    bearing = toDeg(bearing);

    // Normalize to 0-360 (North = 0°, East = 90°, South = 180°, West = 270°)
    bearing = (bearing + 360) % 360;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = lat2 - lat1;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Determine cardinal direction
    const cardinalDirection = getCardinalDirection(bearing);

    logger.debug('[Qibla] Calculated', 'Qibla', {
      direction: bearing.toFixed(2) + '°',
      distance: distance.toFixed(0) + ' km',
      cardinal: cardinalDirection,
    });

    return {
      direction: Math.round(bearing * 10) / 10, // Round to 1 decimal for precision
      distance: Math.round(distance),
      cardinalDirection,
    };
  } catch (error) {
    console.error('[Qibla] Calculation error:', error);
    return null;
  }
}

/**
 * Convert bearing degrees to cardinal direction
 */
function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Get Qibla direction from Aladhan API (alternative method for verification)
 * This can be used to cross-check the local calculation
 */
export async function fetchQiblaFromAPI(lat: number, lng: number): Promise<QiblaResponse | null> {
  try {
    // Validation
    if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.error('[Qibla API] Invalid coordinates:', { lat, lng });
      return null;
    }

    const url = `https://api.aladhan.com/v1/qibla/${lat}/${lng}`;
    logger.debug('[Qibla API] Fetching from:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Qibla API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || typeof data.data.direction !== 'number') {
      throw new Error('Invalid response structure');
    }

    // Calculate distance locally (API doesn't provide it)
    const localCalc = calculateQiblaDirection(lat, lng);
    const distance = localCalc?.distance || 0;

    return {
      direction: Math.round(data.data.direction * 10) / 10,
      distance,
      cardinalDirection: getCardinalDirection(data.data.direction),
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Qibla API] Request timeout');
      } else {
        console.error('[Qibla API] Error:', error.message);
      }
    }
    // Fallback to local calculation
    return calculateQiblaDirection(lat, lng);
  }
}
