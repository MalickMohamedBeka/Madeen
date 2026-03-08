import { useState, useEffect, useCallback, useRef } from 'react';
import { dataCache } from '@/utils/cacheManager';

interface FastCacheOptions {
  ttl?: number; // Time to live en millisecondes (ignoré, géré par CacheManager)
  refreshOnMount?: boolean;
  staleWhileRevalidate?: boolean; // Retourner les données stale pendant le refresh
}

/**
 * Hook de cache optimisé utilisant CacheManager
 * Plus performant que useCache car utilise un cache en mémoire avec gestion de taille
 */
export function useFastCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: FastCacheOptions = {}
) {
  const { refreshOnMount = false, staleWhileRevalidate = true } = options;
  
  const [data, setData] = useState<T | null>(() => dataCache.get(key));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Éviter les fetches multiples simultanés
    if (fetchingRef.current) return;
    
    // Vérifier le cache d'abord si pas de refresh forcé
    if (!forceRefresh) {
      const cached = dataCache.get(key);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    fetchingRef.current = true;
    
    // Si staleWhileRevalidate, ne pas montrer loading si on a des données
    if (!staleWhileRevalidate || !data) {
      setLoading(true);
    }
    
    setError(null);

    try {
      const result = await fetcher();
      
      if (isMountedRef.current) {
        setData(result);
        dataCache.set(key, result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [key, fetcher, data, staleWhileRevalidate]);

  useEffect(() => {
    isMountedRef.current = true;

    if (refreshOnMount || !data) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, refreshOnMount, data]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    dataCache.delete(key);
    return fetchData(true);
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    isStale: loading && data !== null, // Indique si on affiche des données stale
  };
}
