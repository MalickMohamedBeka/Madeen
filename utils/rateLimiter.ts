import { logger } from '@/utils/logger';

/**
 * Rate Limiter for API calls
 * Prevents excessive API requests and implements exponential backoff
 */

interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
  minInterval: number; // Minimum interval between requests in ms
}

interface RequestRecord {
  count: number;
  resetTime: number;
  lastRequestTime: number;
  backoffUntil?: number;
}

class RateLimiter {
  private records: Map<string, RequestRecord> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Register a rate limit configuration for an endpoint
   */
  register(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, config);
  }

  /**
   * Check if a request is allowed
   * @returns true if allowed, false if rate limited
   */
  async checkLimit(endpoint: string): Promise<{ allowed: boolean; retryAfter?: number; reason?: string }> {
    const config = this.configs.get(endpoint);
    
    if (!config) {
      logger.warn(`[RateLimiter] No config for endpoint: ${endpoint}`);
      return { allowed: true };
    }

    const now = Date.now();
    let record = this.records.get(endpoint);

    // Initialize record if not exists
    if (!record) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
        lastRequestTime: 0,
      };
      this.records.set(endpoint, record);
    }

    // Check if in backoff period
    if (record.backoffUntil && now < record.backoffUntil) {
      const retryAfter = Math.ceil((record.backoffUntil - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        reason: `Backoff period active. Retry after ${retryAfter}s`,
      };
    }

    // Reset window if expired
    if (now >= record.resetTime) {
      record.count = 0;
      record.resetTime = now + config.windowMs;
      record.backoffUntil = undefined;
    }

    // Check minimum interval between requests
    const timeSinceLastRequest = now - record.lastRequestTime;
    if (timeSinceLastRequest < config.minInterval) {
      const retryAfter = Math.ceil((config.minInterval - timeSinceLastRequest) / 1000);
      return {
        allowed: false,
        retryAfter,
        reason: `Too frequent. Wait ${retryAfter}s between requests`,
      };
    }

    // Check max requests per window
    if (record.count >= config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      // Apply exponential backoff
      const backoffMs = Math.min(config.windowMs * 2, 300000); // Max 5 minutes
      record.backoffUntil = now + backoffMs;
      
      return {
        allowed: false,
        retryAfter,
        reason: `Rate limit exceeded. ${record.count}/${config.maxRequests} requests used`,
      };
    }

    // Allow request
    record.count++;
    record.lastRequestTime = now;
    this.records.set(endpoint, record);

    return { allowed: true };
  }

  /**
   * Reset rate limit for an endpoint (for testing or manual reset)
   */
  reset(endpoint: string): void {
    this.records.delete(endpoint);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.records.clear();
  }

  /**
   * Get current status for an endpoint
   */
  getStatus(endpoint: string): { count: number; limit: number; resetIn: number } | null {
    const config = this.configs.get(endpoint);
    const record = this.records.get(endpoint);

    if (!config || !record) {
      return null;
    }

    const now = Date.now();
    const resetIn = Math.max(0, Math.ceil((record.resetTime - now) / 1000));

    return {
      count: record.count,
      limit: config.maxRequests,
      resetIn,
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// ==================== PREDEFINED CONFIGURATIONS ====================

// Prayer Times API (Aladhan) - Conservative limits
rateLimiter.register('aladhan-prayer-times', {
  maxRequests: 10, // 10 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  minInterval: 60 * 1000, // 1 minute between requests
});

rateLimiter.register('aladhan-hijri-date', {
  maxRequests: 20, // 20 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  minInterval: 30 * 1000, // 30 seconds between requests
});

rateLimiter.register('aladhan-qibla', {
  maxRequests: 10, // 10 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  minInterval: 60 * 1000, // 1 minute between requests
});

// Weather API (Open-Meteo) - More generous limits
rateLimiter.register('open-meteo-weather', {
  maxRequests: 30, // 30 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  minInterval: 30 * 1000, // 30 seconds between requests
});

// Quran API (Quran.com) - Moderate limits
rateLimiter.register('quran-api-ayah', {
  maxRequests: 50, // 50 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  minInterval: 10 * 1000, // 10 seconds between requests
});

rateLimiter.register('quran-api-surah', {
  maxRequests: 20, // 20 requests per hour (full surahs are larger)
  windowMs: 60 * 60 * 1000, // 1 hour
  minInterval: 30 * 1000, // 30 seconds between requests
});

// Translation API (MyMemory) - Strict limits (free tier)
rateLimiter.register('mymemory-translate', {
  maxRequests: 50, // 50 requests per day (free tier limit is 1000/day)
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  minInterval: 5 * 1000, // 5 seconds between requests
});

// Geocoding API (Nominatim) - Very strict (requires courtesy)
rateLimiter.register('nominatim-geocode', {
  maxRequests: 10, // 10 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  minInterval: 60 * 1000, // 1 minute between requests (Nominatim policy)
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Wrapper for API calls with rate limiting
 */
export async function rateLimitedFetch<T>(
  endpoint: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const check = await rateLimiter.checkLimit(endpoint);

  if (!check.allowed) {
    const error = new Error(check.reason || 'Rate limit exceeded');
    (error as any).retryAfter = check.retryAfter;
    (error as any).rateLimited = true;
    throw error;
  }

  try {
    return await fetchFn();
  } catch (error) {
    // If API returns 429 (Too Many Requests), apply backoff
    if (error instanceof Error && (error as any).status === 429) {
      logger.warn(`[RateLimiter] API returned 429 for ${endpoint}`);
      // Force backoff
      const record = (rateLimiter as any).records.get(endpoint);
      if (record) {
        record.backoffUntil = Date.now() + 300000; // 5 minutes
      }
    }
    throw error;
  }
}

/**
 * Get rate limit status for all endpoints
 */
export function getAllRateLimitStatus(): Record<string, any> {
  const endpoints = [
    'aladhan-prayer-times',
    'aladhan-hijri-date',
    'aladhan-qibla',
    'open-meteo-weather',
    'quran-api-ayah',
    'quran-api-surah',
    'mymemory-translate',
    'nominatim-geocode',
  ];

  const status: Record<string, any> = {};
  
  for (const endpoint of endpoints) {
    status[endpoint] = rateLimiter.getStatus(endpoint);
  }

  return status;
}

export default rateLimiter;
