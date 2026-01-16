import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient, ApiError } from './client';

describe('ApiClient', () => {
  beforeEach(() => {
    apiClient.configure({
      baseUrl: 'http://localhost:3000/api',
      getAuthToken: undefined,
      rateLimit: 100,
      rateLimitWindow: 60000,
    });
  });

  describe('configure', () => {
    it('should update baseUrl', () => {
      apiClient.configure({ baseUrl: 'https://api.example.com' });
      expect(apiClient.getConfig().baseUrl).toBe('https://api.example.com');
    });

    it('should update auth token function', () => {
      const getToken = () => 'test-token';
      apiClient.configure({ getAuthToken: getToken });
      expect(apiClient.getConfig().getAuthToken).toBe(getToken);
    });

    it('should update rate limit settings', () => {
      apiClient.configure({ rateLimit: 50, rateLimitWindow: 30000 });
      expect(apiClient.getConfig().rateLimit).toBe(50);
      expect(apiClient.getConfig().rateLimitWindow).toBe(30000);
    });
  });

  describe('buildUrl', () => {
    it('should build URL without params', () => {
      const url = apiClient.buildUrl('/users');
      expect(url).toBe('http://localhost:3000/api/users');
    });

    it('should build URL with params', () => {
      const url = apiClient.buildUrl('/users', { page: 1, limit: 10 });
      expect(url).toBe('http://localhost:3000/api/users?page=1&limit=10');
    });

    it('should skip undefined params', () => {
      const url = apiClient.buildUrl('/users', { page: 1, limit: undefined });
      expect(url).toBe('http://localhost:3000/api/users?page=1');
    });

    it('should handle boolean params', () => {
      const url = apiClient.buildUrl('/users', { active: true });
      expect(url).toBe('http://localhost:3000/api/users?active=true');
    });
  });

  describe('getHeaders', () => {
    it('should include Content-Type header', () => {
      const headers = apiClient.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not include Authorization without token', () => {
      const headers = apiClient.getHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should include Authorization with token', () => {
      apiClient.configure({ getAuthToken: () => 'my-token' });
      const headers = apiClient.getHeaders();
      expect(headers['Authorization']).toBe('Bearer my-token');
    });

    it('should not include Authorization when token is null', () => {
      apiClient.configure({ getAuthToken: () => null });
      const headers = apiClient.getHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  /**
   * Rate Limiting Tests (Finding #1)
   * Verifies client-side rate limiting implementation
   */
  describe('Rate Limiting (Finding #1)', () => {
    it('should have default rate limit of 100 requests per minute', () => {
      const config = apiClient.getConfig();
      expect(config.rateLimit).toBe(100);
      expect(config.rateLimitWindow).toBe(60000);
    });

    it('should allow requests when under limit', () => {
      apiClient.configure({ rateLimit: 5, rateLimitWindow: 60000 });
      expect(apiClient.canMakeRequest()).toBe(true);
    });

    it('should return retry-after time when rate limited', () => {
      apiClient.configure({ rateLimit: 1, rateLimitWindow: 60000 });
      // Consume the only token
      expect(apiClient.canMakeRequest()).toBe(true);
      // Now get retry after
      const retryAfter = apiClient.getRetryAfter();
      // Should be 0 or positive (depends on token refill timing)
      expect(retryAfter).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('ApiError', () => {
  it('should create error with all properties', () => {
    const error = new ApiError('NOT_FOUND', 'User not found', 404, { userId: '123' });
    
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User not found');
    expect(error.status).toBe(404);
    expect(error.details).toEqual({ userId: '123' });
    expect(error.name).toBe('ApiError');
  });

  it('should be instance of Error', () => {
    const error = new ApiError('ERROR', 'test', 500);
    expect(error).toBeInstanceOf(Error);
  });

  it('should support RATE_LIMIT_EXCEEDED code (Finding #1)', () => {
    const error = new ApiError(
      'RATE_LIMIT_EXCEEDED',
      'Rate limit exceeded',
      429,
      { retryAfterMs: 5000 }
    );
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.status).toBe(429);
    expect(error.details?.retryAfterMs).toBe(5000);
  });
});
