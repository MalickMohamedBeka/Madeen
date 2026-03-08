/**
 * Tests for API Retry Logic
 */

import { fetchWithRetry, retryAsync } from '../apiRetry';

// Mock fetch
global.fetch = jest.fn();

describe('apiRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('fetchWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockData = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchWithRetry('https://api.example.com/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error', async () => {
      const mockData = { success: true };
      
      // First attempt fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Second attempt succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const promise = fetchWithRetry('https://api.example.com/test', {}, { maxRetries: 2 });

      // Fast-forward through delays
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx errors', async () => {
      const mockData = { success: true };
      
      // First attempt returns 500
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      
      // Second attempt succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const promise = fetchWithRetry('https://api.example.com/test', {}, { maxRetries: 2 });

      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const promise = fetchWithRetry('https://api.example.com/test', {}, { maxRetries: 2 });

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Network error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      // Mock setTimeout to capture delays
      global.setTimeout = jest.fn((callback: any, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const promise = fetchWithRetry('https://api.example.com/test', {}, {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
      });

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      // Check exponential backoff: 1s, 2s, 4s
      expect(delays).toContain(1000);
      expect(delays).toContain(2000);
      expect(delays).toContain(4000);

      global.setTimeout = originalSetTimeout;
    });

    it('should respect timeout', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 60000))
      );

      const promise = fetchWithRetry('https://api.example.com/test', {}, {
        timeout: 1000,
        maxRetries: 0,
      });

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('retryAsync', () => {
    it('should retry async function', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      const promise = retryAsync(fn, { maxRetries: 2 });

      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const fn = jest.fn(async () => {
        throw new Error('Permanent error');
      });

      const promise = retryAsync(fn, { maxRetries: 2 });

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Permanent error');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
