/**
 * Consumer API Client
 */

import { getApiBaseUrl } from '@/lib/api/base-url';

const API_BASE = getApiBaseUrl();

export class ConsumerApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ConsumerApiError';
  }
}

// Auth types
export interface SiweAuthRequest {
  message: string;
  signature: string;
  /** Optional: Dilithium public key for future Lock operations */
  public_key?: string;
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

export interface UserInfo {
  address: string;
  created_at: string;
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class ConsumerApiClient {
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
      throw new ConsumerApiError(response.status, error.message || 'Request failed');
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

  async getCurrentUser(): Promise<UserInfo> {
    return this.request<UserInfo>('/v1/auth/me');
  }

  // Dashboard
  async getDashboard() {
    return this.request<{ balance: string; locks: number; transactions: number }>('/v1/user/dashboard');
  }

  // Locks
  async getUserLocks(params?: { page?: number; limit?: number }) {
    return this.request<{ locks: unknown[]; total: number }>('/v1/user/locks', { params });
  }

  async createLock(data: { amount: string; token: string }) {
    return this.request<{ lockId: string; txHash: string }>('/v1/lock', {
      method: 'POST',
      body: data,
    });
  }

  // Unlock
  async requestUnlock(data: { lockId: string }) {
    return this.request<{ unlockId: string }>('/v1/unlock', {
      method: 'POST',
      body: data,
    });
  }

  async requestEmergencyUnlock(data: { lockId: string; bondAmount: string }) {
    return this.request<{ unlockId: string }>('/v1/unlock/emergency', {
      method: 'POST',
      body: data,
    });
  }

  // Transactions
  async getTransactions(params?: { page?: number; limit?: number }) {
    return this.request<{ transactions: unknown[]; total: number }>('/v1/user/transactions', { params });
  }
}

export const consumerApi = new ConsumerApiClient(API_BASE);
