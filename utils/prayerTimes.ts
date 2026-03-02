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
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Using Aladhan API - free and accurate for Islamic prayer times
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=3`
    );
    
    if (!response.ok) {
      throw new Error('Aladhan API failed');
    }
    
    const data = await response.json();
    const timings = data.data.timings;
    
    return [
      { name: 'Fajr', nameAr: 'الفجر', time: timings.Fajr, icon: 'star' },
      { name: 'Chourouk', nameAr: 'الشروق', time: timings.Sunrise, icon: 'sunrise' },
      { name: 'Dhuhr', nameAr: 'الظهر', time: timings.Dhuhr, icon: 'sun' },
      { name: 'Asr', nameAr: 'العصر', time: timings.Asr, icon: 'cloud-sun' },
      { name: 'Maghrib', nameAr: 'المغرب', time: timings.Maghrib, icon: 'sunset' },
      { name: 'Isha', nameAr: 'العشاء', time: timings.Isha, icon: 'moon' },
    ];
  } catch (err) {
    console.log('[PrayerTimes] API fetch error:', err);
    return null;
  }
}

export function getNextPrayer(prayers: PrayerTimeEntry[]): { prayer: PrayerTimeEntry; index: number } | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < prayers.length; i++) {
    const [h, m] = prayers[i].time.split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentMinutes) {
      return { prayer: prayers[i], index: i };
    }
  }
  return { prayer: prayers[0], index: 0 };
}

export function getTimeUntilPrayer(prayerTime: string): string {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = prayerTime.split(':').map(Number);
  let prayerMinutes = h * 60 + m;

  if (prayerMinutes <= currentMinutes) {
    prayerMinutes += 24 * 60;
  }

  const diff = prayerMinutes - currentMinutes;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
}
