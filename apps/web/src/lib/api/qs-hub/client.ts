/**
 * QS Hub API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class QSHubApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'QSHubApiError';
  }
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class QSHubApiClient {
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
      throw new QSHubApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<{ totalStaked: string; votingPower: string; rewards: string }>('/v1/qs-hub/dashboard/stats');
  }

  // Proposals
  async getActiveProposals() {
    return this.request<{ proposals: unknown[] }>('/v1/qs-hub/proposals/active');
  }

  async getProposals(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ proposals: unknown[]; total: number }>('/v1/qs-hub/proposals', { params });
  }

  async getProposalById(id: string) {
    return this.request<{ proposal: unknown }>(`/v1/qs-hub/proposals/${id}`);
  }

  async vote(proposalId: string, data: { support: boolean; reason?: string }) {
    return this.request<{ voteId: string }>(`/v1/qs-hub/proposals/${proposalId}/vote`, {
      method: 'POST',
      body: data,
    });
  }

  // Council
  async getCouncil() {
    return this.request<{ members: unknown[] }>('/v1/qs-hub/council');
  }

  // Stakes
  async getStakes(params?: { page?: number; limit?: number }) {
    return this.request<{ stakes: unknown[]; total: number }>('/v1/qs-hub/stakes', { params });
  }

  async createStake(data: { amount: string; duration: number }) {
    return this.request<{ stakeId: string }>('/v1/qs-hub/stakes', {
      method: 'POST',
      body: data,
    });
  }

  async extendStake(stakeId: string, data: { additionalDuration: number }) {
    return this.request<{ success: boolean }>(`/v1/qs-hub/stakes/${stakeId}/extend`, {
      method: 'POST',
      body: data,
    });
  }

  // Balance
  async getBalance() {
    return this.request<{ balance: string; locked: string }>('/v1/qs-hub/balance');
  }

  // Delegates
  async getDelegates(params?: { page?: number; limit?: number }) {
    return this.request<{ delegates: unknown[]; total: number }>('/v1/qs-hub/delegates', { params });
  }

  // Vote History
  async getVoteHistory(params?: { page?: number; limit?: number }) {
    return this.request<{ votes: unknown[]; total: number }>('/v1/qs-hub/votes/history', { params });
  }

  // Rewards
  async getRewards() {
    return this.request<{ pending: string; claimed: string }>('/v1/qs-hub/rewards');
  }

  async claimRewards() {
    return this.request<{ txHash: string }>('/v1/qs-hub/rewards/claim', {
      method: 'POST',
    });
  }
}

export const qsHubApi = new QSHubApiClient(API_BASE);
