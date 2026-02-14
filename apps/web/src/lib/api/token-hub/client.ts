/**
 * Token Hub API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

export class TokenHubApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'TokenHubApiError';
  }
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class TokenHubApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
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
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new TokenHubApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  // Dashboard
  async getDashboard() {
    return this.request<{ balance: string; staked: string; rewards: string }>('/v1/token-hub/dashboard');
  }

  // Locks (veQS)
  async getLocks(params?: { page?: number; limit?: number }) {
    return this.request<{ locks: unknown[]; total: number }>('/v1/token-hub/locks', { params });
  }

  async createLock(data: { amount: string; duration: number }) {
    return this.request<{ lockId: string }>('/v1/token-hub/lock', {
      method: 'POST',
      body: data,
    });
  }

  async extendLock(data: { lockId: string; additionalDuration: number }) {
    return this.request<{ success: boolean }>('/v1/token-hub/extend', {
      method: 'POST',
      body: data,
    });
  }

  // Delegates
  async getDelegates(params?: { page?: number; limit?: number }) {
    return this.request<{ delegates: unknown[]; total: number }>('/v1/token-hub/delegates', { params });
  }

  async delegate(data: { delegateAddress: string }) {
    return this.request<{ success: boolean }>('/v1/token-hub/delegate', {
      method: 'POST',
      body: data,
    });
  }

  async getMyDelegations() {
    return this.request<{ delegations: unknown[] }>('/v1/token-hub/delegations/my');
  }

  // Rewards
  async getRewards() {
    return this.request<{ pending: string; claimed: string; history: unknown[] }>('/v1/token-hub/rewards');
  }

  async claimRewards() {
    return this.request<{ txHash: string }>('/v1/token-hub/claim', {
      method: 'POST',
    });
  }
}

export const tokenHubApi = new TokenHubApiClient(API_BASE);
