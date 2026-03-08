import { useMemo } from 'react';
import { getHijriDate } from '@/utils/hijri';

// Cache pour éviter les recalculs inutiles
const dateCache = new Map<string, ReturnType<typeof getHijriDate>>();

export function useHijriDate(date: Date = new Date()) {
  return useMemo(() => {
    // Créer une clé de cache basée sur la date (jour uniquement)
    const cacheKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    
    // Vérifier le cache
    if (dateCache.has(cacheKey)) {
      return dateCache.get(cacheKey)!;
    }
    
    // Calculer et mettre en cache
    const hijriDate = getHijriDate(date);
    dateCache.set(cacheKey, hijriDate);
    
    // Nettoyer le cache si trop grand (garder seulement les 7 derniers jours)
    if (dateCache.size > 7) {
      const firstKey = dateCache.keys().next().value;
      if (firstKey) dateCache.delete(firstKey);
    }
    
    return hijriDate;
  }, [date.getFullYear(), date.getMonth(), date.getDate()]);
}
