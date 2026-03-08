import { useState, useEffect, useCallback } from 'react';
import { UserLocation } from '@/types';
import { locationService } from '@/services';

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocation = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loc = await locationService.getCurrentLocation(forceRefresh);
      setLocation(loc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const refreshLocation = useCallback(() => {
    return loadLocation(true);
  }, [loadLocation]);

  return {
    location,
    isLoading,
    error,
    refreshLocation,
  };
}
