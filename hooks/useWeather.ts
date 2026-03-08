import { useState, useEffect, useCallback } from 'react';
import { Weather } from '@/types';
import { weatherService } from '@/services';

export function useWeather(latitude?: number, longitude?: number) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async (forceRefresh: boolean = false) => {
    if (!latitude || !longitude) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const w = await weatherService.getWeather(latitude, longitude, forceRefresh);
      setWeather(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get weather');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const refreshWeather = useCallback(() => {
    return loadWeather(true);
  }, [loadWeather]);

  return {
    weather,
    isLoading,
    error,
    refreshWeather,
  };
}
