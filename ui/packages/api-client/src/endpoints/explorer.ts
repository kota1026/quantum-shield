import { apiClient } from '../client';
import type {
  ExplorerStats,
  ExplorerLock,
  ExplorerUnlock,
  Prover,
  PaginatedResponse,
} from '../types/api';

export const explorerApi = {
  /**
   * Get overall system statistics
   */
  getStats: () => apiClient.get<ExplorerStats>('/explorer/stats'),

  /**
   * Get list of locks
   */
  getLocks: (params?: {
    page?: number;
    pageSize?: number;
    owner?: string;
    minAmount?: string;
    maxAmount?: string;
  }) => apiClient.get<PaginatedResponse<ExplorerLock>>('/explorer/locks', params),

  /**
   * Get lock details
   */
  getLock: (lockId: string) => apiClient.get<ExplorerLock>(`/explorer/locks/${lockId}`),

  /**
   * Get list of unlocks
   */
  getUnlocks: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    isEmergency?: boolean;
  }) => apiClient.get<PaginatedResponse<ExplorerUnlock>>('/explorer/unlocks', params),

  /**
   * Get unlock details
   */
  getUnlock: (unlockId: string) =>
    apiClient.get<ExplorerUnlock>(`/explorer/unlocks/${unlockId}`),

  /**
   * Get list of provers
   */
  getProvers: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResponse<Prover>>('/explorer/provers', params),

  /**
   * Get prover details
   */
  getProver: (address: string) => apiClient.get<Prover>(`/explorer/provers/${address}`),

  /**
   * Get address details (locks, unlocks, transactions)
   */
  getAddress: (address: string) =>
    apiClient.get<{
      address: string;
      locks: ExplorerLock[];
      unlocks: ExplorerUnlock[];
      totalValueLocked: string;
    }>(`/explorer/addresses/${address}`),

  /**
   * Get TVL chart data
   */
  getTVLChart: (params?: { period?: '7d' | '30d' | '90d' | '1y' }) =>
    apiClient.get<{ data: Array<{ timestamp: string; value: string }> }>(
      '/explorer/charts/tvl',
      params
    ),

  /**
   * Get volume chart data
   */
  getVolumeChart: (params?: { period?: '7d' | '30d' | '90d' | '1y' }) =>
    apiClient.get<{ data: Array<{ timestamp: string; value: string }> }>(
      '/explorer/charts/volume',
      params
    ),

  /**
   * Search locks, unlocks, addresses
   */
  search: (query: string) =>
    apiClient.get<{
      locks: ExplorerLock[];
      unlocks: ExplorerUnlock[];
      addresses: string[];
    }>('/explorer/search', { q: query }),
};
