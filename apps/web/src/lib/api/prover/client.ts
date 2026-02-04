/**
 * Prover API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

  // Registration
  async register(data: { stakeAmount: string; endpoint: string }) {
    return this.request<{ proverId: string }>('/v1/prover/register', {
      method: 'POST',
      body: data,
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request<{ status: string; staked: string; earnings: string }>('/v1/prover/dashboard');
  }

  // Requests
  async getRequests(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ requests: unknown[]; total: number }>('/v1/prover/requests', { params });
  }

  // Sign
  async sign(data: { requestId: string }) {
    return this.request<{ signature: string }>('/v1/prover/sign', {
      method: 'POST',
      body: data,
    });
  }

  // Metrics
  async getMetrics() {
    return this.request<{ totalSigned: number; successRate: number }>('/v1/prover/metrics');
  }

  // List provers
  async list(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ data: unknown[]; total: number }>('/v1/prover/list', { params });
  }
}

export const proverApi = new ProverApiClient(API_BASE);
