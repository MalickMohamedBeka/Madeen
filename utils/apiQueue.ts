/**
 * API Request Queue with AsyncStorage
 * Queues failed requests for retry when network is available
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const QUEUE_KEY = '@madeen_api_queue';
const MAX_QUEUE_SIZE = 50;
const QUEUE_RETRY_INTERVAL = 60000; // 1 minute

export interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
}

class APIQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private retryTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadQueue();
    this.startRetryTimer();
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.debug(`[API Queue] Loaded ${this.queue.length} queued requests`);
      }
    } catch (error) {
      console.error('[API Queue] Failed to load queue:', error);
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[API Queue] Failed to save queue:', error);
    }
  }

  /**
   * Add request to queue
   */
  async enqueue(
    url: string,
    options: RequestInit = {},
    priority: 'high' | 'normal' | 'low' = 'normal',
    maxRetries: number = 3
  ): Promise<string> {
    // Check queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest low-priority items
      this.queue = this.queue
        .filter(req => req.priority !== 'low')
        .slice(-MAX_QUEUE_SIZE + 1);
    }

    const request: QueuedRequest = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      options,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      priority,
    };

    this.queue.push(request);
    await this.saveQueue();

    logger.debug(`[API Queue] Enqueued request: ${url} (priority: ${priority})`);

    // Try to process immediately
    this.processQueue();

    return request.id;
  }

  /**
   * Process queued requests
   */
  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    logger.debug(`[API Queue] Processing ${this.queue.length} queued requests`);

    // Sort by priority (high > normal > low) and timestamp
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    const toProcess = [...this.queue];
    const failed: QueuedRequest[] = [];

    for (const request of toProcess) {
      try {
        logger.debug(`[API Queue] Processing: ${request.url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(request.url, {
          ...request.options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          logger.debug(`[API Queue] Success: ${request.url}`);
          // Remove from queue
          this.queue = this.queue.filter(r => r.id !== request.id);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`[API Queue] Failed: ${request.url}`, error);
        request.retryCount++;

        if (request.retryCount < request.maxRetries) {
          failed.push(request);
        } else {
          logger.debug(`[API Queue] Max retries reached for: ${request.url}`);
        }
      }
    }

    this.queue = failed;
    await this.saveQueue();

    this.processing = false;
    logger.debug(`[API Queue] Processing complete. ${this.queue.length} requests remaining`);
  }

  /**
   * Start automatic retry timer
   */
  private startRetryTimer(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }

    this.retryTimer = setInterval(() => {
      if (this.queue.length > 0) {
        logger.debug('[API Queue] Auto-retry triggered');
        this.processQueue();
      }
    }, QUEUE_RETRY_INTERVAL) as unknown as NodeJS.Timeout;
  }

  /**
   * Get queue status
   */
  getStatus(): { total: number; byPriority: Record<string, number> } {
    const byPriority = this.queue.reduce((acc, req) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.queue.length,
      byPriority,
    };
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_KEY);
    logger.debug('[API Queue] Queue cleared');
  }

  /**
   * Remove specific request
   */
  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter(r => r.id !== id);
    await this.saveQueue();
  }
}

// Singleton instance
export const apiQueue = new APIQueue();
