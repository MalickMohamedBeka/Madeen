import { useState, useEffect, useCallback } from 'react';
import { PrayerTimeEntry } from '@/utils/prayerTimes';
import { prayerTimesService } from '@/services';

export function usePrayerTimes(latitude?: number, longitude?: number) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrayerTimes = useCallback(async (forceRefresh: boolean = false) => {
    if (!latitude || !longitude) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const times = await prayerTimesService.getPrayerTimes(latitude, longitude, forceRefresh);
      setPrayerTimes(times);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get prayer times');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  const refreshPrayerTimes = useCallback(() => {
    return loadPrayerTimes(true);
  }, [loadPrayerTimes]);

  const getNextPrayer = useCallback(() => {
    if (!prayerTimes) return null;
    return prayerTimesService.getNextPrayer(prayerTimes);
  }, [prayerTimes]);

  return {
    prayerTimes,
    isLoading,
    error,
    refreshPrayerTimes,
    getNextPrayer,
  };
}
