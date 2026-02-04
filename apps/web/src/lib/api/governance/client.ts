/**
 * Governance API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class GovernanceApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'GovernanceApiError';
  }
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class GovernanceApiClient {
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
      throw new GovernanceApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  // Proposals
  async getProposals(params?: { status?: string; page?: number; limit?: number }) {
    return this.request<{ proposals: unknown[]; total: number }>('/v1/governance/proposals', { params });
  }

  async getProposalById(id: string) {
    return this.request<{ proposal: unknown }>(`/v1/governance/proposals/${id}`);
  }

  async createProposal(data: { title: string; description: string; actions: unknown[] }) {
    return this.request<{ proposalId: string }>('/v1/governance/proposals', {
      method: 'POST',
      body: data,
    });
  }

  // Voting
  async vote(data: { proposalId: string; support: boolean; reason?: string }) {
    return this.request<{ voteId: string }>('/v1/governance/vote', {
      method: 'POST',
      body: data,
    });
  }

  // Council
  async getCouncil() {
    return this.request<{ members: unknown[] }>('/v1/governance/council');
  }

  // Delegates
  async getDelegates(params?: { page?: number; limit?: number }) {
    return this.request<{ delegates: unknown[]; total: number }>('/v1/governance/delegates', { params });
  }
}

export const governanceApi = new GovernanceApiClient(API_BASE);
