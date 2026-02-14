/**
 * QS Admin API Client
 *
 * Base API client with authentication support and mock fallback
 */

import type { ApiError } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';

export class AdminApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'AdminApiError';
  }
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class AdminApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /**
   * Set refresh token for token refresh
   */
  setRefreshToken(token: string | null) {
    this.refreshToken = token;
  }

  /**
   * Set callback for unauthorized (401) responses
   */
  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(`${this.baseUrl}${endpoint}`, base);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.onUnauthorized?.();
      }

      // Parse error response
      const errorBody = await response.json().catch(() => ({
        code: response.status,
        message: response.statusText || 'Unknown error',
      })) as ApiError;

      throw new AdminApiError(
        errorBody.code || response.status,
        errorBody.message || response.statusText
      );
    }

    // Handle empty response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, body, headers: customHeaders, ...fetchConfig } = config;

    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(customHeaders);

    const requestConfig: RequestInit = {
      ...fetchConfig,
      headers,
    };

    if (body !== undefined) {
      requestConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestConfig);

      // If service unavailable (503) and mock is enabled, try mock fallback
      if (ENABLE_MOCK && response.status === 503) {
        console.warn(`[AdminAPI] Service unavailable, attempting mock fallback for ${endpoint}`);
        return this.getMockData<T>(endpoint);
      }

      return await this.handleResponse<T>(response);
    } catch (error) {
      // If network error and mock is enabled, try mock fallback
      if (ENABLE_MOCK && error instanceof TypeError) {
        console.warn(`[AdminAPI] Network error, attempting mock fallback for ${endpoint}`);
        return this.getMockData<T>(endpoint);
      }
      throw error;
    }
  }

  /**
   * Get mock data for endpoint (fallback when API unavailable)
   */
  private async getMockData<T>(endpoint: string): Promise<T> {
    // Dynamic import to avoid bundling mock data in production
    const { getMockResponse } = await import('./mock');
    const mockData = getMockResponse(endpoint);
    if (mockData) {
      console.info(`[AdminAPI] Using mock data for ${endpoint}`);
      return mockData as T;
    }
    throw new AdminApiError(503, `API unavailable and no mock data for ${endpoint}`);
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient(API_BASE);

// Export class for testing
export { AdminApiClient };
