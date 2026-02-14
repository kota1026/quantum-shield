/**
 * Observer API Client
 */

import { getApiBaseUrl } from '@/lib/api/base-url';

const API_BASE = getApiBaseUrl();

export class ObserverApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ObserverApiError';
  }
}

// Auth types
export interface SiweAuthRequest {
  message: string;
  signature: string;
  public_key: string;
}

export interface SiweAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  address: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_at: number;
}

export interface ObserverUserInfo {
  address: string;
  observer_id?: string;
  status?: string;
  created_at: string;
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class ObserverApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setRefreshToken(token: string | null) {
    this.refreshToken = token;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

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

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, body, headers, ...rest } = config;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...rest,
      headers: this.buildHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ObserverApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async authenticateSiwe(data: SiweAuthRequest): Promise<SiweAuthResponse> {
    return this.request<SiweAuthResponse>('/v1/auth/siwe', {
      method: 'POST',
      body: data,
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return this.request<RefreshTokenResponse>('/v1/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  }

  async getCurrentUser(): Promise<ObserverUserInfo> {
    return this.request<ObserverUserInfo>('/v1/auth/me');
  }

  // Registration
  async register(data: { endpoint: string }) {
    return this.request<{ observerId: string }>('/v1/observer/register', {
      method: 'POST',
      body: data,
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request<{ status: string; challengesSubmitted: number; earnings: string }>('/v1/observer/dashboard');
  }

  // Alerts
  async getAlerts(params?: { page?: number; limit?: number }) {
    return this.request<{ alerts: unknown[]; total: number }>('/v1/observer/alerts', { params });
  }

  // Challenge
  async submitChallenge(data: { unlockId: string; evidence: string }) {
    return this.request<{ challengeId: string }>('/v1/observer/challenge', {
      method: 'POST',
      body: data,
    });
  }

  // List observers
  async list(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ data: unknown[]; total: number }>('/v1/observer/list', { params });
  }
}

export const observerApi = new ObserverApiClient(API_BASE);
