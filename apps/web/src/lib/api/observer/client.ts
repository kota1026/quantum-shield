/**
 * Observer API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ObserverApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ObserverApiError';
  }
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class ObserverApiClient {
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
      throw new ObserverApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
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
