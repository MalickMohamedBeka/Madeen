import { InteractionManager } from 'react-native';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

export const runAfterInteractions = (callback: () => void) => {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as any;
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    
    // Limiter la taille du cache
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
};

export const batchUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
};

// Performance monitoring
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private measurements: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start(name: string): () => void {
    if (!env.enablePerformanceMonitoring) {
      return () => {}; // No-op en production
    }

    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      
      const measurements = this.measurements.get(name)!;
      measurements.push(duration);
      
      // Garder seulement les 50 dernières mesures
      if (measurements.length > 50) {
        measurements.shift();
      }

      // Log si trop lent (> 100ms)
      if (duration > 100) {
        logger.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    const avg = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }

  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {};
    
    for (const [name] of this.measurements) {
      stats[name] = this.getStats(name);
    }
    
    return stats;
  }

  clear() {
    this.measurements.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Helper pour mesurer les fonctions
export const measurePerformance = <T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T => {
  return ((...args: Parameters<T>) => {
    const end = performanceMonitor.start(name);
    try {
      const result = fn(...args);
      
      // Si c'est une Promise, attendre avant de mesurer
      if (result instanceof Promise) {
        return result.finally(end);
      }
      
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }) as T;
};

export const lazyLoad = async <T>(
  loader: () => Promise<T>,
  delay: number = 0
): Promise<T> => {
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return loader();
};

