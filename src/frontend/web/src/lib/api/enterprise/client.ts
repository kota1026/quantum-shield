/**
 * Enterprise API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class EnterpriseApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'EnterpriseApiError';
  }
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class EnterpriseApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
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
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new EnterpriseApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  // Dashboard
  async getDashboard() {
    return this.request<{ tvl: string; volume24h: string; provers: number }>('/v1/enterprise/dashboard');
  }

  // TVL
  async getTvl(params?: { period?: string }) {
    return this.request<{ current: string; history: unknown[] }>('/v1/enterprise/tvl', { params });
  }

  // Volume
  async getVolume(params?: { period?: string }) {
    return this.request<{ total: string; history: unknown[] }>('/v1/enterprise/volume', { params });
  }

  // Provers
  async getProvers(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ provers: unknown[]; total: number }>('/v1/enterprise/provers', { params });
  }

  async getProverById(id: string) {
    return this.request<{ prover: unknown }>(`/v1/enterprise/provers/${id}`);
  }

  // Observers
  async getObservers(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ observers: unknown[]; total: number }>('/v1/enterprise/observers', { params });
  }

  // Transactions
  async getTransactions(params?: { type?: string; page?: number; limit?: number }) {
    return this.request<{ transactions: unknown[]; total: number }>('/v1/enterprise/transactions', { params });
  }

  async getTransactionById(id: string) {
    return this.request<{ transaction: unknown }>(`/v1/enterprise/transactions/${id}`);
  }

  // Monitoring
  async getMonitoring() {
    return this.request<{ alerts: unknown[]; metrics: unknown }>('/v1/enterprise/monitoring');
  }

  // Status
  async getStatus() {
    return this.request<{ l1: string; l3: string; api: string }>('/v1/enterprise/status');
  }

  // Emergency
  async getEmergencyRequests(params?: { page?: number; limit?: number }) {
    return this.request<{ requests: unknown[]; total: number }>('/v1/enterprise/emergency', { params });
  }

  // Support Tickets
  async getSupportTickets(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ tickets: unknown[]; total: number }>('/v1/enterprise/support', { params });
  }
}

export const enterpriseApi = new EnterpriseApiClient(API_BASE);
