import { PrayerTimeEntry } from '@/utils/prayerTimes';
import { getPrayerTimesCache, savePrayerTimesCache } from '@/utils/repositories';
import { fetchPrayerTimesAPI } from '@/utils/api';
import { calculatePrayerTimes } from '@/utils/prayerTimes';

export class PrayerTimesService {
  private static instance: PrayerTimesService;
  private cachedTimes: PrayerTimeEntry[] | null = null;
  private cacheDate: string = '';

  private constructor() {}

  static getInstance(): PrayerTimesService {
    if (!PrayerTimesService.instance) {
      PrayerTimesService.instance = new PrayerTimesService();
    }
    return PrayerTimesService.instance;
  }

  async getPrayerTimes(
    latitude: number,
    longitude: number,
    forceRefresh: boolean = false
  ): Promise<PrayerTimeEntry[] | null> {
    const today = new Date().toISOString().split('T')[0];

    // Vérifier le cache mémoire
    if (!forceRefresh && this.cachedTimes && this.cacheDate === today) {
      return this.cachedTimes;
    }

    // Vérifier le cache DB
    if (!forceRefresh) {
      const cached = await getPrayerTimesCache();
      if (cached && cached.date === today) {
        this.cachedTimes = cached.times;
        this.cacheDate = today;
        return cached.times;
      }
    }

    try {
      // Essayer l'API d'abord
      const apiResult = await fetchPrayerTimesAPI(latitude, longitude);
      
      if (apiResult) {
        this.cachedTimes = apiResult.times;
        this.cacheDate = today;
        await savePrayerTimesCache(apiResult.times, today);
        return apiResult.times;
      }

      // Fallback: calcul local
      const calculatedTimes = calculatePrayerTimes(new Date(), latitude, longitude);
      this.cachedTimes = calculatedTimes;
      this.cacheDate = today;
      await savePrayerTimesCache(calculatedTimes, today);
      return calculatedTimes;
    } catch (error) {
      // En cas d'erreur, utiliser le calcul local
      const calculatedTimes = calculatePrayerTimes(new Date(), latitude, longitude);
      this.cachedTimes = calculatedTimes;
      this.cacheDate = today;
      return calculatedTimes;
    }
  }

  getNextPrayer(times: PrayerTimeEntry[]): { prayer: PrayerTimeEntry; minutesUntil: number } | null {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const prayer of times) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > currentMinutes) {
        return {
          prayer,
          minutesUntil: prayerMinutes - currentMinutes,
        };
      }
    }

    // Si aucune prière restante aujourd'hui, retourner Fajr du lendemain
    if (times.length > 0) {
      const fajr = times[0];
      const [hours, minutes] = fajr.time.split(':').map(Number);
      const fajrMinutes = hours * 60 + minutes;
      const minutesUntilMidnight = 24 * 60 - currentMinutes;
      
      return {
        prayer: fajr,
        minutesUntil: minutesUntilMidnight + fajrMinutes,
      };
    }

    return null;
  }

  clearCache(): void {
    this.cachedTimes = null;
    this.cacheDate = '';
  }
}

export const prayerTimesService = PrayerTimesService.getInstance();
