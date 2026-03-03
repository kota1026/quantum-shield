/**
 * Slashing Admin Hooks
 *
 * React Query hooks for Slashing management in QS Admin.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type {
  SlashingEvent,
  SlashingStats,
  SlashingConfig,
  SlashingListResponse,
} from '@/lib/api/admin/types';

// ============================================================================
// Query Keys
// ============================================================================

export const slashingKeys = {
  all: ['admin', 'slashings'] as const,
  list: (filters?: SlashingFilters) => [...slashingKeys.all, 'list', filters] as const,
  stats: () => [...slashingKeys.all, 'stats'] as const,
  config: () => [...slashingKeys.all, 'config'] as const,
  detail: (id: string) => [...slashingKeys.all, 'detail', id] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface SlashingFilters {
  status?: 'all' | 'pending' | 'reviewing' | 'executed' | 'appealed' | 'rejected';
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch slashing events list with optional filters
 */
export function useSlashings(filters?: SlashingFilters) {
  return useQuery({
    queryKey: slashingKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {};
      if (filters?.status && filters.status !== 'all') params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.page) params.page = filters.page;
      params.limit = filters?.limit || 20;

      return adminApi.get<SlashingListResponse>('/api/admin/slashings', params);
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch slashing statistics
 */
export function useSlashingStats() {
  return useQuery({
    queryKey: slashingKeys.stats(),
    queryFn: () => adminApi.get<SlashingStats>('/api/admin/slashings/stats'),
    staleTime: 30_000,
  });
}

/**
 * Fetch slashing configuration parameters
 */
export function useSlashingConfig() {
  return useQuery({
    queryKey: slashingKeys.config(),
    queryFn: () => adminApi.get<SlashingConfig>('/api/admin/slashings/config'),
    staleTime: 60_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Execute a pending slashing event
 */
export function useExecuteSlashing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slashingId: string) => {
      return adminApi.post<{ success: boolean }>(`/api/admin/slashings/${slashingId}/execute`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slashingKeys.all });
    },
  });
}

/**
 * Reject a pending slashing event
 */
export function useRejectSlashing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slashingId: string) => {
      return adminApi.post<{ success: boolean }>(`/api/admin/slashings/${slashingId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slashingKeys.all });
    },
  });
}
