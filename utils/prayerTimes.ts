import { logger } from '@/utils/logger';

export interface PrayerTimeEntry {
  name: string;
  nameAr: string;
  time: string;
  icon: 'sunrise' | 'sun' | 'cloud-sun' | 'sunset' | 'moon' | 'star';
}

function toHHMM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function calculatePrayerTimes(date: Date, lat: number, lng: number, timezoneOffset: number = 1): PrayerTimeEntry[] {
  try {
    // Validation des entrées
    if (!date || isNaN(date.getTime())) {
      console.error('[PrayerTimes] Invalid date');
      date = new Date();
    }
    
    if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.error('[PrayerTimes] Invalid coordinates:', { lat, lng });
      // Fallback to Casablanca
      lat = 33.5731;
      lng = -7.5898;
    }
    
    if (Math.abs(timezoneOffset) > 14) {
      console.error('[PrayerTimes] Invalid timezone offset:', timezoneOffset);
      timezoneOffset = 1;
    }
    
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    const decl = -23.45 * Math.cos(toRadians((360 / 365) * (dayOfYear + 10)));
    const declRad = toRadians(decl);
    const latRad = toRadians(lat);

    const eqTime = -7.655 * Math.sin(toRadians((360 / 365) * (dayOfYear - 2))) +
      9.873 * Math.sin(toRadians((360 / 365) * (dayOfYear - 166 + 2 * (360 / 365) * (dayOfYear - 2))));

    const solarNoon = 12 - lng / 15 - eqTime / 60 + timezoneOffset;

    const cosHA = (Math.sin(toRadians(-0.833)) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad));
    const HA = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosHA))));
    const sunriseTime = solarNoon - HA / 15;
    const sunsetTime = solarNoon + HA / 15;

    const fajrAngle = 18;
    const cosHAFajr = (Math.sin(toRadians(-fajrAngle)) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad));
    const HAFajr = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosHAFajr))));
    const fajrTime = solarNoon - HAFajr / 15;

    const ishaAngle = 17;
    const cosHAIsha = (Math.sin(toRadians(-ishaAngle)) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad));
    const HAIsha = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosHAIsha))));
    const ishaTime = solarNoon + HAIsha / 15;

    const tanDiff = Math.abs(Math.tan(latRad) - Math.tan(declRad));
    const asrShadow = Math.atan(1 / (1 + tanDiff));
    const cosHAAsr = (Math.sin(asrShadow) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad));
    const HAAsr = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosHAAsr))));
    const asrTime = solarNoon + HAAsr / 15;

    return [
      { name: 'Fajr', nameAr: 'الفجر', time: toHHMM(fajrTime), icon: 'star' },
      { name: 'Chourouk', nameAr: 'الشروق', time: toHHMM(sunriseTime), icon: 'sunrise' },
      { name: 'Dhuhr', nameAr: 'الظهر', time: toHHMM(solarNoon), icon: 'sun' },
      { name: 'Asr', nameAr: 'العصر', time: toHHMM(asrTime), icon: 'cloud-sun' },
      { name: 'Maghrib', nameAr: 'المغرب', time: toHHMM(sunsetTime), icon: 'sunset' },
      { name: 'Isha', nameAr: 'العشاء', time: toHHMM(ishaTime), icon: 'moon' },
    ];
  } catch (err) {
    console.error('[PrayerTimes] Calculation error:', err);
    // Return default times for Casablanca as fallback
    return [
      { name: 'Fajr', nameAr: 'الفجر', time: '05:30', icon: 'star' },
      { name: 'Chourouk', nameAr: 'الشروق', time: '07:00', icon: 'sunrise' },
      { name: 'Dhuhr', nameAr: 'الظهر', time: '13:30', icon: 'sun' },
      { name: 'Asr', nameAr: 'العصر', time: '16:30', icon: 'cloud-sun' },
      { name: 'Maghrib', nameAr: 'المغرب', time: '19:00', icon: 'sunset' },
      { name: 'Isha', nameAr: 'العشاء', time: '20:30', icon: 'moon' },
    ];
  }
}

export function getPrayerTimesForLocation(date: Date, lat: number, lng: number): PrayerTimeEntry[] {
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  return calculatePrayerTimes(date, lat, lng, timezoneOffset);
}

export function getMoroccoPrayerTimes(date: Date = new Date()): PrayerTimeEntry[] {
  const CASABLANCA_LAT = 33.5731;
  const CASABLANCA_LNG = -7.5898;
  return calculatePrayerTimes(date, CASABLANCA_LAT, CASABLANCA_LNG);
}

// Fetch prayer times from Aladhan API (more accurate)
export async function fetchPrayerTimesFromAPI(lat: number, lng: number, date: Date = new Date()): Promise<PrayerTimeEntry[] | null> {
  try {
    // Validation des coordonnées
    if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.error('[PrayerTimes API] Invalid coordinates:', { lat, lng });
      return null;
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Validation de la date
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      console.error('[PrayerTimes API] Invalid date:', { year, month, day });
      return null;
    }
    
    // Using Aladhan API - free and accurate for Islamic prayer times
    // Method 3 = Muslim World League (widely used)
    const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=3`;
    logger.debug('[PrayerTimes API] Fetching from:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Aladhan API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.timings) {
      throw new Error('Invalid response structure from Aladhan API');
    }
    
    const timings = data.data.timings;
    
    // Validation des horaires reçus
    const requiredTimings = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const timing of requiredTimings) {
      if (!timings[timing]) {
        throw new Error(`Missing timing: ${timing}`);
      }
    }
    
    return [
      { name: 'Fajr', nameAr: 'الفجر', time: timings.Fajr.substring(0, 5), icon: 'star' },
      { name: 'Chourouk', nameAr: 'الشروق', time: timings.Sunrise.substring(0, 5), icon: 'sunrise' },
      { name: 'Dhuhr', nameAr: 'الظهر', time: timings.Dhuhr.substring(0, 5), icon: 'sun' },
      { name: 'Asr', nameAr: 'العصر', time: timings.Asr.substring(0, 5), icon: 'cloud-sun' },
      { name: 'Maghrib', nameAr: 'المغرب', time: timings.Maghrib.substring(0, 5), icon: 'sunset' },
      { name: 'Isha', nameAr: 'العشاء', time: timings.Isha.substring(0, 5), icon: 'moon' },
    ];
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        console.error('[PrayerTimes API] Request timeout');
      } else {
        console.error('[PrayerTimes API] Fetch error:', err.message);
      }
    } else {
      console.error('[PrayerTimes API] Unknown error:', err);
    }
    return null;
  }
}

export function getNextPrayer(prayers: PrayerTimeEntry[]): { prayer: PrayerTimeEntry; index: number } | null {
  try {
    if (!prayers || prayers.length === 0) {
      console.error('[PrayerTimes] No prayers provided');
      return null;
    }
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < prayers.length; i++) {
      if (!prayers[i] || !prayers[i].time) {
        console.error('[PrayerTimes] Invalid prayer at index', i);
        continue;
      }
      
      const timeParts = prayers[i].time.split(':');
      if (timeParts.length !== 2) {
        console.error('[PrayerTimes] Invalid time format:', prayers[i].time);
        continue;
      }
      
      const h = parseInt(timeParts[0], 10);
      const m = parseInt(timeParts[1], 10);
      
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        console.error('[PrayerTimes] Invalid time values:', prayers[i].time);
        continue;
      }
      
      const prayerMinutes = h * 60 + m;
      if (prayerMinutes > currentMinutes) {
        return { prayer: prayers[i], index: i };
      }
    }
    
    // If no prayer found, return first prayer (next day)
    return prayers[0] ? { prayer: prayers[0], index: 0 } : null;
  } catch (err) {
    console.error('[PrayerTimes] getNextPrayer error:', err);
    return null;
  }
}

export function getTimeUntilPrayer(prayerTime: string): string {
  try {
    if (!prayerTime || typeof prayerTime !== 'string') {
      console.error('[PrayerTimes] Invalid prayer time:', prayerTime);
      return '0min';
    }
    
    const timeParts = prayerTime.split(':');
    if (timeParts.length !== 2) {
      console.error('[PrayerTimes] Invalid time format:', prayerTime);
      return '0min';
    }
    
    const h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1], 10);
    
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      console.error('[PrayerTimes] Invalid time values:', prayerTime);
      return '0min';
    }
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let prayerMinutes = h * 60 + m;

    if (prayerMinutes <= currentMinutes) {
      prayerMinutes += 24 * 60;
    }

    const diff = prayerMinutes - currentMinutes;
    
    if (diff < 0) {
      return '0min';
    }
    
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  } catch (err) {
    console.error('[PrayerTimes] getTimeUntilPrayer error:', err);
    return '0min';
  }
}
