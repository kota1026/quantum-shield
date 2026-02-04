/**
 * Users Admin Hooks
 *
 * React Query hooks for Users management in QS Admin.
 * Provides typed data fetching with mock fallback support.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type {
  UsersStats,
  User,
  UserDetailSimple,
  UserTransaction,
  WalletsStats,
  UserWallet,
} from '@/lib/api/admin/types';

// ============================================================================
// Query Keys
// ============================================================================

export const usersKeys = {
  all: ['admin', 'users'] as const,
  stats: () => [...usersKeys.all, 'stats'] as const,
  list: (filters?: UserFilters) => [...usersKeys.all, 'list', filters] as const,
  detail: (id: string) => [...usersKeys.all, 'detail', id] as const,
  transactions: (userId: string) => [...usersKeys.all, 'transactions', userId] as const,
  wallets: () => [...usersKeys.all, 'wallets'] as const,
  walletsStats: () => [...usersKeys.all, 'wallets', 'stats'] as const,
  walletsList: (filters?: WalletFilters) => [...usersKeys.all, 'wallets', 'list', filters] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface UserFilters {
  status?: 'all' | 'active' | 'inactive' | 'suspended';
  search?: string;
  page?: number;
  limit?: number;
}

export interface WalletFilters {
  lockStatus?: 'all' | 'withLocks' | 'withUnlocking' | 'empty';
  search?: string;
  page?: number;
  limit?: number;
}

interface StatsResponse {
  stats: UsersStats;
}

interface UsersListResponse {
  users: User[];
  total: number;
}

interface UserDetailResponse {
  user: UserDetailSimple;
}

interface UserTransactionsResponse {
  transactions: UserTransaction[];
  total: number;
}

interface WalletsStatsResponse {
  stats: WalletsStats;
}

interface WalletsListResponse {
  wallets: UserWallet[];
  total: number;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch users statistics
 */
export function useUsersStats() {
  return useQuery({
    queryKey: usersKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<StatsResponse>('/api/admin/users/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch users list with optional filters
 */
export function useUsersList(filters?: UserFilters) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status && filters.status !== 'all') params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      return adminApi.get<UsersListResponse>('/api/admin/users', params);
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch single user detail
 */
export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: async () => {
      const response = await adminApi.get<UserDetailResponse>(`/api/admin/users/${userId}`);
      return response.user;
    },
    staleTime: 30_000,
    enabled: !!userId,
  });
}

/**
 * Fetch user's transaction history
 */
export function useUserTransactions(userId: string) {
  return useQuery({
    queryKey: usersKeys.transactions(userId),
    queryFn: async () => {
      return adminApi.get<UserTransactionsResponse>(`/api/admin/users/${userId}/transactions`);
    },
    staleTime: 30_000,
    enabled: !!userId,
  });
}

/**
 * Fetch wallets statistics
 */
export function useWalletsStats() {
  return useQuery({
    queryKey: usersKeys.walletsStats(),
    queryFn: async () => {
      const response = await adminApi.get<WalletsStatsResponse>('/api/admin/users/wallets/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch wallets list with optional filters
 */
export function useWalletsList(filters?: WalletFilters) {
  return useQuery({
    queryKey: usersKeys.walletsList(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.lockStatus && filters.lockStatus !== 'all') params.lockStatus = filters.lockStatus;
      if (filters?.search) params.search = filters.search;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      return adminApi.get<WalletsListResponse>('/api/admin/users/wallets', params);
    },
    staleTime: 30_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Suspend a user
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return adminApi.post(`/api/admin/users/${userId}/suspend`);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
    },
  });
}

/**
 * Activate a user
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return adminApi.post(`/api/admin/users/${userId}/activate`);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
    },
  });
}

/**
 * Suspend multiple users
 */
export function useSuspendUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      return adminApi.post('/api/admin/users/bulk/suspend', { userIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}
