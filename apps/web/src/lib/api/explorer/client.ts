/**
 * Explorer API Client
 */

import { getApiBaseUrl } from '@/lib/api/base-url';

const API_BASE = getApiBaseUrl();

export class ExplorerApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ExplorerApiError';
  }
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

class ExplorerApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, body, headers, ...rest } = config;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...rest,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ExplorerApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  // Overview
  async getOverview() {
    return this.request<{ network: unknown; recentActivity: unknown; topProvers: unknown[] }>('/v1/explorer/overview');
  }

  // Search
  async search(query: string) {
    return this.request<{ results: unknown[] }>('/v1/explorer/search', { params: { q: query } });
  }

  // Locks
  async getLocks(params?: { page?: number; limit?: number; status?: string }) {
    return this.request<{ locks: unknown[]; total: number }>('/v1/explorer/locks', { params });
  }

  async getLockById(id: string) {
    return this.request<{ lock: unknown }>(`/v1/explorer/locks/${id}`);
  }

  // Unlocks
  async getUnlocks(params?: { page?: number; limit?: number; status?: string }) {
    return this.request<{ unlocks: unknown[]; total: number }>('/v1/explorer/unlocks', { params });
  }

  async getUnlockById(id: string) {
    return this.request<{ unlock: unknown }>(`/v1/explorer/unlocks/${id}`);
  }

  // Provers
  async getProvers(params?: { page?: number; limit?: number; status?: string }) {
    return this.request<{ provers: unknown[]; total: number }>('/v1/explorer/provers', { params });
  }

  async getProverById(id: string) {
    return this.request<{ prover: unknown }>(`/v1/explorer/provers/${id}`);
  }

  // Challenges
  async getChallenges(params?: { page?: number; limit?: number }) {
    return this.request<{ challenges: unknown[]; total: number }>('/v1/explorer/challenges', { params });
  }

  async getChallengeById(id: string) {
    return this.request<{ challenge: unknown }>(`/v1/explorer/challenges/${id}`);
  }

  // Address
  async getAddressInfo(address: string) {
    return this.request<{ address: unknown }>(`/v1/explorer/address/${address}`);
  }

  // Analytics
  async getAnalytics(params?: { period?: string }) {
    return this.request<{ analytics: unknown }>('/v1/explorer/analytics', { params });
  }
}

export const explorerApi = new ExplorerApiClient(API_BASE);
