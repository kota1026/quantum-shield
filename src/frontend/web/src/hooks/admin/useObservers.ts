/**
 * QS Admin Observer Hooks
 *
 * React Query hooks for observer data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type { ObserverListItem, ObserverDetail, ObserverStats } from '@/lib/api/admin/types';

// Query keys factory
export const observerKeys = {
  all: ['admin', 'observers'] as const,
  stats: () => [...observerKeys.all, 'stats'] as const,
  list: (filters?: ObserverFilters) => [...observerKeys.all, 'list', filters] as const,
  detail: (id: string) => [...observerKeys.all, 'detail', id] as const,
  challenges: (id: string) => [...observerKeys.all, 'challenges', id] as const,
};

// Filter types
export interface ObserverFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

// Response types
interface StatsResponse {
  stats: ObserverStats;
}

interface ObserversResponse {
  observers: ObserverListItem[];
  total: number;
}

/**
 * Fetch observer statistics
 */
export function useObserverStats() {
  return useQuery({
    queryKey: observerKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<StatsResponse>('/api/admin/observers/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch observer list
 */
export function useObserverList(filters?: ObserverFilters) {
  return useQuery({
    queryKey: observerKeys.list(filters),
    queryFn: async () => {
      const response = await adminApi.get<ObserversResponse>('/api/admin/observers', filters);
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch single observer detail
 */
export function useObserverDetail(id: string) {
  return useQuery({
    queryKey: observerKeys.detail(id),
    queryFn: async () => {
      const response = await adminApi.get<ObserverDetail>(`/api/admin/observers/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch observer challenges
 */
export function useObserverChallenges(id: string) {
  return useQuery({
    queryKey: observerKeys.challenges(id),
    queryFn: async () => {
      const response = await adminApi.get<{ challenges: unknown[]; total: number }>(
        `/api/admin/observers/${id}/challenges`
      );
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Combined observer data hook
 * Fetches stats and observer list in parallel
 */
export function useObserverData(filters?: ObserverFilters) {
  const stats = useObserverStats();
  const observers = useObserverList(filters);

  return {
    stats: stats.data,
    observers: observers.data?.observers,
    total: observers.data?.total,
    isLoading: stats.isLoading || observers.isLoading,
    isError: stats.isError || observers.isError,
    error: stats.error || observers.error,
    refetch: () => {
      stats.refetch();
      observers.refetch();
    },
  };
}
