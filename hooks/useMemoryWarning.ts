import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { logger } from '@/utils/logger';

interface MemoryWarningOptions {
  onWarning?: () => void;
  onCritical?: () => void;
}

export function useMemoryWarning(options: MemoryWarningOptions = {}) {
  const handleMemoryWarning = useCallback(() => {
    logger.warn('Memory warning received', 'Performance');
    options.onWarning?.();
    
    // Nettoyer les caches si possible
    if (global.gc) {
      global.gc();
    }
  }, [options]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      // Nettoyer quand l'app passe en background
      logger.debug('App moved to background, cleaning up', 'Performance');
      options.onWarning?.();
    }
  }, [options]);

  useEffect(() => {
    // Écouter les changements d'état de l'app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  return {
    triggerCleanup: handleMemoryWarning,
  };
}
