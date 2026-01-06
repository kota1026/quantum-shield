export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: () => string | null;
  /** Rate limit: max requests per window (default: 100) */
  rateLimit?: number;
  /** Rate limit window in ms (default: 60000 = 1 minute) */
  rateLimitWindow?: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiErrorResponse {
  data?: never;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Simple token bucket rate limiter
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(maxRequests: number, windowMs: number) {
    this.maxTokens = maxRequests;
    this.tokens = maxRequests;
    this.lastRefill = Date.now();
    this.refillRate = maxRequests / windowMs;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  canMakeRequest(): boolean {
    this.refill();
    return this.tokens >= 1;
  }

  consumeToken(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  getRetryAfter(): number {
    this.refill();
    if (this.tokens >= 1) return 0;
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil(tokensNeeded / this.refillRate);
  }
}

class ApiClient {
  private config: ApiClientConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    rateLimit: 100,
    rateLimitWindow: 60000, // 1 minute
  };

  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit!,
      this.config.rateLimitWindow!
    );
  }

  configure(config: Partial<ApiClientConfig>) {
    this.config = { ...this.config, ...config };
    // Recreate rate limiter if limits changed
    if (config.rateLimit !== undefined || config.rateLimitWindow !== undefined) {
      this.rateLimiter = new RateLimiter(
        this.config.rateLimit!,
        this.config.rateLimitWindow!
      );
    }
  }

  /**
   * Get current configuration (for testing/debugging)
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  /**
   * Build URL with query parameters
   */
  buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    let url = `${this.config.baseUrl}${path}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  /**
   * Get headers for requests
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.config.getAuthToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Check if rate limit allows request
   */
  canMakeRequest(): boolean {
    return this.rateLimiter.canMakeRequest();
  }

  /**
   * Get time until next request is allowed (ms)
   */
  getRetryAfter(): number {
    return this.rateLimiter.getRetryAfter();
  }

  async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
    }
  ): Promise<T> {
    // Check rate limit
    if (!this.rateLimiter.consumeToken()) {
      const retryAfter = this.rateLimiter.getRetryAfter();
      throw new ApiError(
        'RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded. Retry after ${Math.ceil(retryAfter / 1000)} seconds.`,
        429,
        { retryAfterMs: retryAfter }
      );
    }

    const url = this.buildUrl(path, options?.params);

    const response = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'An unexpected error occurred',
        response.status,
        data.error?.details
      );
    }

    return data;
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const apiClient = new ApiClient();
