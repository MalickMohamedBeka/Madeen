/**
 * API Monitoring & Error Tracking
 * Tracks API errors, performance, and quota usage
 * Ready for Sentry integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const METRICS_KEY = '@madeen_api_metrics';
const ERROR_LOG_KEY = '@madeen_api_errors';
const MAX_ERROR_LOGS = 100;

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastResetDate: string;
  byEndpoint: Record<string, {
    requests: number;
    failures: number;
    avgResponseTime: number;
  }>;
}

export interface APIError {
  id: string;
  endpoint: string;
  error: string;
  statusCode?: number;
  timestamp: number;
  retryCount: number;
}

class APIMonitoring {
  private metrics: APIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastResetDate: new Date().toISOString(),
    byEndpoint: {},
  };

  private errorLog: APIError[] = [];
  private quotaUsage: Record<string, { count: number; resetDate: string }> = {};

  constructor() {
    this.loadMetrics();
    this.loadErrorLog();
  }

  /**
   * Load metrics from storage
   */
  private async loadMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(METRICS_KEY);
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[API Monitoring] Failed to load metrics:', error);
    }
  }

  /**
   * Save metrics to storage
   */
  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(METRICS_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('[API Monitoring] Failed to save metrics:', error);
    }
  }

  /**
   * Load error log from storage
   */
  private async loadErrorLog(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ERROR_LOG_KEY);
      if (stored) {
        this.errorLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[API Monitoring] Failed to load error log:', error);
    }
  }

  /**
   * Save error log to storage
   */
  private async saveErrorLog(): Promise<void> {
    try {
      // Keep only last MAX_ERROR_LOGS errors
      if (this.errorLog.length > MAX_ERROR_LOGS) {
        this.errorLog = this.errorLog.slice(-MAX_ERROR_LOGS);
      }
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(this.errorLog));
    } catch (error) {
      console.error('[API Monitoring] Failed to save error log:', error);
    }
  }

  /**
   * Track API request
   */
  async trackRequest(
    endpoint: string,
    success: boolean,
    responseTime: number,
    error?: Error,
    statusCode?: number
  ): Promise<void> {
    // Update global metrics
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.totalRequests;

    // Update endpoint-specific metrics
    if (!this.metrics.byEndpoint[endpoint]) {
      this.metrics.byEndpoint[endpoint] = {
        requests: 0,
        failures: 0,
        avgResponseTime: 0,
      };
    }

    const endpointMetrics = this.metrics.byEndpoint[endpoint];
    endpointMetrics.requests++;
    if (!success) {
      endpointMetrics.failures++;
    }

    const endpointTotalTime = endpointMetrics.avgResponseTime * (endpointMetrics.requests - 1);
    endpointMetrics.avgResponseTime = (endpointTotalTime + responseTime) / endpointMetrics.requests;

    await this.saveMetrics();

    // Log error if failed
    if (!success && error) {
      await this.logError(endpoint, error, statusCode);
    }

    // Log to console for debugging
    logger.debug(`[API Monitoring] ${endpoint}: ${success ? 'SUCCESS' : 'FAILED'} (${responseTime}ms)`);
  }

  /**
   * Log API error
   */
  async logError(endpoint: string, error: Error, statusCode?: number, retryCount: number = 0): Promise<void> {
    const errorEntry: APIError = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      error: error.message,
      statusCode,
      timestamp: Date.now(),
      retryCount,
    };

    this.errorLog.push(errorEntry);
    await this.saveErrorLog();

    // TODO: Send to Sentry in production
    // if (__DEV__ === false) {
    //   Sentry.captureException(error, {
    //     tags: { endpoint, statusCode },
    //     extra: { retryCount },
    //   });
    // }

    console.error(`[API Monitoring] Error logged:`, errorEntry);
  }

  /**
   * Track quota usage (e.g., MyMemory API)
   */
  async trackQuota(service: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    if (!this.quotaUsage[service] || this.quotaUsage[service].resetDate !== today) {
      this.quotaUsage[service] = { count: 0, resetDate: today };
    }

    this.quotaUsage[service].count++;

    // Check limits
    const limits: Record<string, number> = {
      'mymemory': 1000, // 1000 requests/day
      'nominatim': 100, // Conservative limit for OSM
    };

    const limit = limits[service] || Infinity;
    const remaining = limit - this.quotaUsage[service].count;

    logger.debug(`[API Monitoring] ${service} quota: ${this.quotaUsage[service].count}/${limit} (${remaining} remaining)`);

    if (remaining <= 0) {
      logger.warn(`[API Monitoring] ${service} quota exceeded!`);
      return false;
    }

    if (remaining <= 10) {
      logger.warn(`[API Monitoring] ${service} quota low: ${remaining} remaining`);
    }

    return true;
  }

  /**
   * Get current metrics
   */
  getMetrics(): APIMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 20): APIError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Get quota status
   */
  getQuotaStatus(): Record<string, { used: number; remaining: number; resetDate: string }> {
    const limits: Record<string, number> = {
      'mymemory': 1000,
      'nominatim': 100,
    };

    const status: Record<string, { used: number; remaining: number; resetDate: string }> = {};

    for (const [service, limit] of Object.entries(limits)) {
      const usage = this.quotaUsage[service];
      status[service] = {
        used: usage?.count || 0,
        remaining: limit - (usage?.count || 0),
        resetDate: usage?.resetDate || new Date().toISOString().split('T')[0],
      };
    }

    return status;
  }

  /**
   * Reset metrics (for testing or manual reset)
   */
  async resetMetrics(): Promise<void> {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastResetDate: new Date().toISOString(),
      byEndpoint: {},
    };
    await this.saveMetrics();
    logger.debug('[API Monitoring] Metrics reset');
  }

  /**
   * Clear error log
   */
  async clearErrorLog(): Promise<void> {
    this.errorLog = [];
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
    logger.debug('[API Monitoring] Error log cleared');
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    successRate: number;
    avgResponseTime: number;
    recentErrors: number;
  } {
    const successRate = this.metrics.totalRequests > 0
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
      : 100;

    const recentErrors = this.errorLog.filter(
      e => Date.now() - e.timestamp < 3600000 // Last hour
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (successRate < 50 || recentErrors > 20) {
      status = 'unhealthy';
    } else if (successRate < 80 || recentErrors > 10) {
      status = 'degraded';
    }

    return {
      status,
      successRate: Math.round(successRate * 10) / 10,
      avgResponseTime: Math.round(this.metrics.averageResponseTime),
      recentErrors,
    };
  }
}

// Singleton instance
export const apiMonitoring = new APIMonitoring();

/**
 * Start health monitoring (only in production)
 * Checks API health every 5 minutes and sends alerts to Sentry
 */
export function startHealthMonitoring() {
  if (__DEV__) return; // Only in production

  setInterval(() => {
    const health = apiMonitoring.getHealthStatus();
    
    // Dynamic import to avoid issues if Sentry is not configured
    import('@sentry/react-native').then(Sentry => {
      if (health.status === 'unhealthy') {
        Sentry.captureMessage('API Health Critical', {
          level: 'error',
          tags: { health_status: 'unhealthy' },
          extra: {
            successRate: health.successRate,
            avgResponseTime: health.avgResponseTime,
            recentErrors: health.recentErrors,
          },
        });
      } else if (health.status === 'degraded') {
        Sentry.captureMessage('API Health Degraded', {
          level: 'warning',
          tags: { health_status: 'degraded' },
          extra: {
            successRate: health.successRate,
            avgResponseTime: health.avgResponseTime,
            recentErrors: health.recentErrors,
          },
        });
      }
    }).catch(() => {
      // Sentry not available, ignore
    });
  }, 300000); // Every 5 minutes
}
