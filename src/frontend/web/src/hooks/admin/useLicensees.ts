/**
 * Licensees Admin Hooks
 *
 * React Query hooks for Licensee management in QS Admin.
 * Provides typed data fetching with caching and automatic refetch.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type {
  LicenseeListItem,
  LicenseeDetail,
  LicenseeStats,
  LicenseeSupportTicket,
  LicenseeSupportMessage,
} from '@/lib/api/admin/types';

// ============================================================================
// Query Keys
// ============================================================================

export const licenseeKeys = {
  all: ['admin', 'licensees'] as const,
  stats: () => [...licenseeKeys.all, 'stats'] as const,
  list: (filters?: LicenseeFilters) => [...licenseeKeys.all, 'list', filters] as const,
  detail: (id: string) => [...licenseeKeys.all, 'detail', id] as const,
  supportTickets: (licenseeId: string) => [...licenseeKeys.all, 'support', 'tickets', licenseeId] as const,
  supportMessages: (licenseeId: string, ticketId: string) =>
    [...licenseeKeys.all, 'support', 'messages', licenseeId, ticketId] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface LicenseeFilters {
  status?: 'all' | 'active' | 'suspended' | 'pending' | 'expired';
  search?: string;
  page?: number;
  limit?: number;
}

interface LicenseesListResponse {
  licensees: LicenseeListItem[];
  total: number;
}

interface LicenseeStatsResponse {
  stats: LicenseeStats;
}

interface LicenseeDetailResponse {
  licensee: LicenseeDetail;
}

interface LicenseeSupportTicketsResponse {
  tickets: LicenseeSupportTicket[];
  total: number;
}

interface LicenseeSupportMessagesResponse {
  messages: LicenseeSupportMessage[];
  total: number;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch licensee statistics
 */
export function useLicenseeStats() {
  return useQuery({
    queryKey: licenseeKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<LicenseeStatsResponse>('/api/admin/licensees/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch licensees list with optional filters
 */
export function useLicenseesList(filters?: LicenseeFilters) {
  return useQuery({
    queryKey: licenseeKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status && filters.status !== 'all') params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      return adminApi.get<LicenseesListResponse>('/api/admin/licensees', params);
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch single licensee detail
 */
export function useLicenseeDetail(licenseeId: string) {
  return useQuery({
    queryKey: licenseeKeys.detail(licenseeId),
    queryFn: async () => {
      const response = await adminApi.get<LicenseeDetailResponse>(
        `/api/admin/licensees/${licenseeId}`
      );
      return response.licensee;
    },
    staleTime: 30_000,
    enabled: !!licenseeId,
  });
}

/**
 * Fetch support tickets for a specific licensee
 */
export function useLicenseeSupportTickets(licenseeId: string) {
  return useQuery({
    queryKey: licenseeKeys.supportTickets(licenseeId),
    queryFn: async () => {
      return adminApi.get<LicenseeSupportTicketsResponse>(
        `/api/admin/licensees/${licenseeId}/support/tickets`
      );
    },
    staleTime: 30_000,
    enabled: !!licenseeId,
  });
}

/**
 * Fetch messages for a specific support ticket
 */
export function useLicenseeSupportMessages(licenseeId: string, ticketId: string) {
  return useQuery({
    queryKey: licenseeKeys.supportMessages(licenseeId, ticketId),
    queryFn: async () => {
      return adminApi.get<LicenseeSupportMessagesResponse>(
        `/api/admin/licensees/${licenseeId}/support/tickets/${ticketId}/messages`
      );
    },
    staleTime: 30_000,
    enabled: !!licenseeId && !!ticketId,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Suspend a licensee
 */
export function useSuspendLicensee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (licenseeId: string) => {
      return adminApi.post(`/api/admin/licensees/${licenseeId}/suspend`);
    },
    onSuccess: (_, licenseeId) => {
      queryClient.invalidateQueries({ queryKey: licenseeKeys.stats() });
      queryClient.invalidateQueries({ queryKey: licenseeKeys.list() });
      queryClient.invalidateQueries({ queryKey: licenseeKeys.detail(licenseeId) });
    },
  });
}

/**
 * Reactivate a licensee
 */
export function useReactivateLicensee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (licenseeId: string) => {
      return adminApi.post(`/api/admin/licensees/${licenseeId}/reactivate`);
    },
    onSuccess: (_, licenseeId) => {
      queryClient.invalidateQueries({ queryKey: licenseeKeys.stats() });
      queryClient.invalidateQueries({ queryKey: licenseeKeys.list() });
      queryClient.invalidateQueries({ queryKey: licenseeKeys.detail(licenseeId) });
    },
  });
}

/**
 * Reply to a support ticket
 */
export function useReplyToLicenseeTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      licenseeId,
      ticketId,
      message,
    }: {
      licenseeId: string;
      ticketId: string;
      message: string;
    }) => {
      return adminApi.post(
        `/api/admin/licensees/${licenseeId}/support/tickets/${ticketId}/reply`,
        { message }
      );
    },
    onSuccess: (_, { licenseeId, ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: licenseeKeys.supportMessages(licenseeId, ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: licenseeKeys.supportTickets(licenseeId),
      });
    },
  });
}
