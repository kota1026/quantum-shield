/**
 * Prover API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api-proxy';

export class ProverApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ProverApiError';
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

export interface ProverUserInfo {
  address: string;
  prover_id?: string;
  status?: string;
  created_at: string;
}

export interface ProverStatusByWalletResponse {
  registered: boolean;
  prover_id: string | null;
  status: string | null;
  can_access: boolean;
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class ProverApiClient {
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
      throw new ProverApiError(response.status, error.message || 'Request failed');
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

  async getCurrentUser(): Promise<ProverUserInfo> {
    return this.request<ProverUserInfo>('/v1/auth/me');
  }

  // Check prover status by wallet address
  async getProverStatusByWallet(walletAddress: string): Promise<ProverStatusByWalletResponse> {
    return this.request<ProverStatusByWalletResponse>(`/v1/prover/status/by-wallet/${walletAddress}`);
  }

  // Registration
  async register(data: { stakeAmount: string; endpoint: string }) {
    return this.request<{ proverId: string }>('/v1/prover/register', {
      method: 'POST',
      body: data,
    });
  }

  // Dashboard - requires prover_id
  async getDashboard(proverId: string) {
    return this.request<{ status: string; staked: string; earnings: string }>(`/v1/prover/${proverId}/dashboard`);
  }

  // Queue - signing queue for prover
  async getQueue(proverId: string, params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ items: unknown[]; total: number; pending_count: number }>(`/v1/prover/${proverId}/queue`, { params });
  }

  // Queue item detail
  async getQueueItem(proverId: string, queueId: string) {
    return this.request<unknown>(`/v1/prover/${proverId}/queue/${queueId}`);
  }

  // Sign - submit signature for unlock request
  async sign(proverId: string, data: { unlock_id: string; signature: string }) {
    return this.request<{ success: boolean; tx_hash?: string }>(`/v1/prover/${proverId}/sign`, {
      method: 'POST',
      body: data,
    });
  }

  // Metrics - prover-specific metrics
  async getMetrics(proverId: string) {
    return this.request<{ totalSigned: number; successRate: number }>(`/v1/prover/${proverId}/metrics`);
  }

  // List provers (admin endpoint)
  async list(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ data: unknown[]; total: number }>('/v1/provers', { params });
  }
}

export const proverApi = new ProverApiClient(API_BASE);
