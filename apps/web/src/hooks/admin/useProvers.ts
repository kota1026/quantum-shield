/**
 * QS Admin Prover Hooks
 *
 * React Query hooks for prover data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type { ProverListItem, ProverDetail, ProverApplication } from '@/lib/api/admin/types';
import type { ProverStats, ProverRequestStats } from '@/lib/api/admin/mock';

// Query keys factory
export const proverKeys = {
  all: ['admin', 'provers'] as const,
  stats: () => [...proverKeys.all, 'stats'] as const,
  list: (filters?: ProverFilters) => [...proverKeys.all, 'list', filters] as const,
  detail: (id: string) => [...proverKeys.all, 'detail', id] as const,
  requests: (filters?: ProverFilters) => [...proverKeys.all, 'requests', filters] as const,
  requestStats: () => [...proverKeys.all, 'requests', 'stats'] as const,
  requestDetail: (id: string) => [...proverKeys.all, 'request', id] as const,
};

// Filter types
export interface ProverFilters {
  page?: number;
  limit?: number;
  status?: string;
  tier?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

// Response types
interface StatsResponse {
  stats: ProverStats;
}

interface ProversResponse {
  provers: ProverListItem[];
  total: number;
}

interface ApplicationsResponse {
  applications: ProverApplication[];
  total: number;
}

interface RequestStatsResponse {
  stats: ProverRequestStats;
}

/**
 * Fetch prover statistics
 */
export function useProverStats() {
  return useQuery({
    queryKey: proverKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<StatsResponse>('/api/admin/provers/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch prover list
 */
export function useProverList(filters?: ProverFilters) {
  return useQuery({
    queryKey: proverKeys.list(filters),
    queryFn: async () => {
      const response = await adminApi.get<ProversResponse>('/api/admin/provers', filters);
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch single prover detail
 */
export function useProverDetail(id: string) {
  return useQuery({
    queryKey: proverKeys.detail(id),
    queryFn: async () => {
      const response = await adminApi.get<ProverDetail>(`/api/admin/provers/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch prover request statistics
 */
export function useProverRequestStats() {
  return useQuery({
    queryKey: proverKeys.requestStats(),
    queryFn: async () => {
      const response = await adminApi.get<RequestStatsResponse>('/api/admin/provers/requests/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch prover applications/requests
 */
export function useProverRequests(filters?: ProverFilters) {
  return useQuery({
    queryKey: proverKeys.requests(filters),
    queryFn: async () => {
      const response = await adminApi.get<ApplicationsResponse>('/api/admin/provers/requests', filters);
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch single prover application detail
 */
export function useProverRequestDetail(id: string) {
  return useQuery({
    queryKey: proverKeys.requestDetail(id),
    queryFn: async () => {
      const response = await adminApi.get<ProverApplication>(`/api/admin/provers/requests/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Combined prover data hook
 * Fetches stats and prover list in parallel
 */
export function useProverData(filters?: ProverFilters) {
  const stats = useProverStats();
  const provers = useProverList(filters);

  return {
    stats: stats.data,
    provers: provers.data?.provers,
    total: provers.data?.total,
    isLoading: stats.isLoading || provers.isLoading,
    isError: stats.isError || provers.isError,
    error: stats.error || provers.error,
    refetch: () => {
      stats.refetch();
      provers.refetch();
    },
  };
}
