import { useState, useEffect, useCallback } from 'react';
import storage from '@/utils/storage';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  refreshOnMount?: boolean;
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, refreshOnMount = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!forceRefresh) {
        const cached = await storage.get<{ data: T; timestamp: number }>(key as any);
        if (cached && Date.now() - cached.timestamp < ttl) {
          setData(cached.data);
          setLoading(false);
          return cached.data;
        }
      }

      const freshData = await fetcher();
      await storage.set(key as any, {
        data: freshData,
        timestamp: Date.now(),
      });
      
      setData(freshData);
      return freshData;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    fetchData(refreshOnMount);
  }, []);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  const invalidate = useCallback(async () => {
    await storage.remove(key as any);
    await fetchData(true);
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
  };
}
