import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number; // Taille estimée en bytes
}

interface CacheOptions {
  maxSize?: number; // Taille max en bytes (défaut: 10MB)
  maxAge?: number; // Durée de vie en ms (défaut: 1 heure)
  onEvict?: (key: string, data: any) => void;
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private currentSize: number = 0;
  private maxSize: number;
  private maxAge: number;
  private onEvict?: (key: string, data: any) => void;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB par défaut
    this.maxAge = options.maxAge || 60 * 60 * 1000; // 1 heure par défaut
    this.onEvict = options.onEvict;
  }

  private estimateSize(data: T): number {
    try {
      // Estimation simple basée sur JSON.stringify
      const json = JSON.stringify(data);
      return json.length * 2; // UTF-16 = 2 bytes par caractère
    } catch {
      // Si on ne peut pas stringify, estimer à 1KB
      return 1024;
    }
  }

  private evictOldest() {
    if (this.cache.size === 0) return;

    // Trouver l'entrée la plus ancienne
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private evictExpired() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  set(key: string, data: T): void {
    // Nettoyer les entrées expirées
    this.evictExpired();

    const size = this.estimateSize(data);

    // Si la donnée est trop grande pour le cache, ne pas la stocker
    if (size > this.maxSize) {
      logger.warn(`Data too large for cache: ${key} (${size} bytes)`, 'CacheManager');
      return;
    }

    // Supprimer l'ancienne entrée si elle existe
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentSize -= oldEntry.size;
    }

    // Éviction si nécessaire
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    // Ajouter la nouvelle entrée
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
    });

    this.currentSize += size;
  }

  get(key: string): T | null {
    // Nettoyer les entrées expirées
    this.evictExpired();

    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    this.currentSize -= entry.size;
    this.cache.delete(key);

    if (this.onEvict) {
      this.onEvict(key, entry.data);
    }

    return true;
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache.entries()) {
        this.onEvict(key, entry.data);
      }
    }

    this.cache.clear();
    this.currentSize = 0;
  }

  getStats(): {
    size: number;
    maxSize: number;
    count: number;
    utilization: number;
  } {
    return {
      size: this.currentSize,
      maxSize: this.maxSize,
      count: this.cache.size,
      utilization: (this.currentSize / this.maxSize) * 100,
    };
  }

  // Nettoyer les entrées expirées manuellement
  cleanup(): number {
    const sizeBefore = this.cache.size;
    this.evictExpired();
    return sizeBefore - this.cache.size;
  }
}

// Instances globales pour différents types de cache
export const imageCache = new CacheManager({
  maxSize: 20 * 1024 * 1024, // 20MB pour les images
  maxAge: 24 * 60 * 60 * 1000, // 24 heures
});

export const dataCache = new CacheManager({
  maxSize: 5 * 1024 * 1024, // 5MB pour les données
  maxAge: 60 * 60 * 1000, // 1 heure
});

export const apiCache = new CacheManager({
  maxSize: 2 * 1024 * 1024, // 2MB pour les réponses API
  maxAge: 30 * 60 * 1000, // 30 minutes
});

// Nettoyer tous les caches périodiquement
setInterval(() => {
  const cleaned = imageCache.cleanup() + dataCache.cleanup() + apiCache.cleanup();
  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} expired cache entries`, 'CacheManager');
  }
}, 5 * 60 * 1000); // Toutes les 5 minutes
