/**
 * Consumer API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';
const STRICT_API = process.env.NEXT_PUBLIC_STRICT_API === 'true';

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
    const url = new URL(`${this.baseUrl}${endpoint}`);
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
    const method = (rest.method || 'GET').toUpperCase();

    if (STRICT_API) {
      console.info(`[ConsumerAPI] ${method} ${url}`);
    }

    try {
      const response = await fetch(url, {
        ...rest,
        headers: this.buildHeaders(headers),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (STRICT_API) {
        console.info(`[ConsumerAPI] ${method} ${endpoint} → ${response.status}`);
      }

      // If service unavailable (503) and mock is enabled, try mock fallback
      if (ENABLE_MOCK && response.status === 503) {
        console.warn(`[ConsumerAPI] Service unavailable, attempting mock fallback for ${endpoint}`);
        return this.getMockData<T>(endpoint);
      }

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        if (STRICT_API) {
          console.error(`[ConsumerAPI] ${method} ${endpoint} FAILED: ${response.status} ${error.message || 'Request failed'}`);
        }
        throw new ConsumerApiError(response.status, error.message || 'Request failed');
      }

      return response.json();
    } catch (error) {
      // If network error and mock is enabled, try mock fallback
      if (ENABLE_MOCK && error instanceof TypeError) {
        console.warn(`[ConsumerAPI] Network error, attempting mock fallback for ${endpoint}`);
        return this.getMockData<T>(endpoint);
      }
      if (STRICT_API && error instanceof TypeError) {
        console.error(`[ConsumerAPI] ${method} ${endpoint} NETWORK ERROR: ${error.message} (backend may not be running at ${API_BASE})`);
      }
      throw error;
    }
  }

  private async getMockData<T>(endpoint: string): Promise<T> {
    const { getMockResponse } = await import('./mock');
    const mockData = getMockResponse(endpoint);
    if (mockData) {
      console.info(`[ConsumerAPI] Using mock data for ${endpoint}`);
      return mockData as T;
    }
    throw new ConsumerApiError(503, `API unavailable and no mock data for ${endpoint}`);
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

  async createLock(data: {
    chain_id: number;
    asset: string;
    amount: string;
    dest_addr: string;
    pk_dilithium: string;
    sig_dilithium: string;
    expiry: number;
    nonce: number;
  }) {
    return this.request<{
      lock_id: string;
      sr_0: string;
      smt_proof: string;
      status: string;
      l1_tx_hash?: string;
    }>('/v1/lock', {
      method: 'POST',
      body: data,
    });
  }

  // Unlock
  async requestUnlock(data: {
    lock_id: string;
    dest_addr: string;
    amount: string;
    sig_dilithium: string;
  }) {
    return this.request<{
      unlock_id: string;
      sr_1: string;
      release_time: number;
      time_lock_hours: number;
      status: string;
    }>('/v1/unlock', {
      method: 'POST',
      body: data,
    });
  }

  async requestEmergencyUnlock(data: {
    lock_id: string;
    dest_addr: string;
    amount: string;
    sig_dilithium: string;
  }) {
    return this.request<{
      unlock_id: string;
      sr_1: string;
      release_time: number;
      bond_required: string;
      status: string;
    }>('/v1/unlock/emergency', {
      method: 'POST',
      body: data,
    });
  }

  async claimUnlock(data: { lock_id: string }) {
    return this.request<{
      lock_id: string;
      status: string;
      l1_tx_hash?: string;
    }>('/v1/unlock/claim', {
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
