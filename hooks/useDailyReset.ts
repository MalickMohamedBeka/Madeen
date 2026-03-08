import { useEffect, useCallback } from 'react';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useDhikrStore } from '@/store/useDhikrStore';
import { useQuranStore } from '@/store/useQuranStore';
import { getLastResetDate, saveLastResetDate } from '@/utils/repositories';

export function useDailyReset() {
  const resetDailyHabits = useHabitsStore(state => state.resetDailyHabits);
  const resetAllDhikr = useDhikrStore(state => state.resetAllDhikr);
  const updateQuranProgress = useQuranStore(state => state.updateQuranProgress);

  const checkAndResetDaily = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = await getLastResetDate();

    if (lastReset !== today) {
      // Réinitialiser les habitudes
      await resetDailyHabits();
      
      // Réinitialiser les compteurs dhikr
      await resetAllDhikr();
      
      // Réinitialiser les pages lues aujourd'hui
      await updateQuranProgress({ pagesReadToday: 0 });
      
      // Sauvegarder la date de reset
      await saveLastResetDate(today);
    }
  }, [resetDailyHabits, resetAllDhikr, updateQuranProgress]);

  useEffect(() => {
    checkAndResetDaily();

    // Vérifier toutes les heures
    const interval = setInterval(checkAndResetDaily, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAndResetDaily]);

  return { checkAndResetDaily };
}
