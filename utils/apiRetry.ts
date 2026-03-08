import { logger } from '@/utils/logger';

/**
 * API Retry Logic with Exponential Backoff
 * Handles automatic retries for failed API requests
 */

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  timeout?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1s
  maxDelay: 10000, // 10s
  backoffMultiplier: 2,
  timeout: 30000, // 30s
  shouldRetry: (error: Error, attempt: number) => {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.name === 'AbortError') return true;
    if (error.message.includes('timeout')) return true;
    if (error.message.includes('5')) return true; // 5xx errors
    if (error.message.includes('Network')) return true;
    return attempt < 3;
  },
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a fetch request with exponential backoff
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Create abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

      // Merge abort signal
      const signal = options.signal
        ? combineSignals([options.signal, controller.signal])
        : controller.signal;

      logger.debug(`[API Retry] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} for ${url}`);

      const response = await fetch(url, {
        ...options,
        signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.debug(`[API Retry] Success on attempt ${attempt + 1}`);
      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[API Retry] Attempt ${attempt + 1} failed:`, lastError.message);

      // Check if we should retry
      if (attempt < finalConfig.maxRetries && finalConfig.shouldRetry(lastError, attempt)) {
        const delay = calculateDelay(attempt, finalConfig);
        logger.debug(`[API Retry] Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

/**
 * Combine multiple abort signals
 */
function combineSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort());
  }

  return controller.signal;
}

/**
 * Retry a generic async function
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      logger.debug(`[Retry] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1}`);
      const result = await fn();
      logger.debug(`[Retry] Success on attempt ${attempt + 1}`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Retry] Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < finalConfig.maxRetries && finalConfig.shouldRetry(lastError, attempt)) {
        const delay = calculateDelay(attempt, finalConfig);
        logger.debug(`[Retry] Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('Operation failed after all retries');
}
