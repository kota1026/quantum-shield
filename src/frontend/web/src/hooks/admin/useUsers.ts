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

// API response types (snake_case from backend)
interface ApiUser {
  wallet_address: string;
  email: string | null;
  language: string;
  status: 'active' | 'inactive' | 'suspended';
  total_locks: number;
  total_locked: string;
  created_at: number;
  last_active: number | null;
  has_dilithium: boolean;
}

// API response for user detail (direct response, not wrapped)
interface ApiUserDetail {
  wallet_address: string;
  email: string | null;
  language: string | null;
  status: string;
  notification_email: boolean;
  notification_browser: boolean;
  two_factor_enabled: boolean;
  total_locks: number;
  total_unlocks: number;
  total_locked: string;
  created_at: number;
  last_active: number | null;
  has_dilithium: boolean;
}

interface ApiUsersListResponse {
  users: ApiUser[];
  total: number;
  page: number;
  per_page: number;
}

interface UsersListResponse {
  users: User[];
  total: number;
}

interface UserTransactionsResponse {
  transactions: UserTransaction[];
  total: number;
}

// API response types for user transactions
interface ApiLockItem {
  lockId: string;
  walletAddress: string;
  chainId: number;
  asset: string;
  amount: string;
  status: string;
  createdAt: number;
  confirmedAt: number | null;
  l1TxHash: string | null;
}

interface ApiUnlockItem {
  unlockId: string;
  lockId: string;
  walletAddress: string;
  amount: string;
  status: string;
  isEmergency: boolean;
  bondAmount: string | null;
  releaseTime: number | null;
  createdAt: number;
}

interface ApiUserLocksResponse {
  locks: ApiLockItem[];
  total: number;
  page: number;
  per_page: number;
}

interface ApiUserUnlocksResponse {
  unlocks: ApiUnlockItem[];
  total: number;
  page: number;
  per_page: number;
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
 * Format Wei to ETH with 4 decimal places
 */
function formatWeiToEth(weiString: string): string {
  const wei = BigInt(weiString || '0');
  const eth = Number(wei) / 1e18;
  return `${eth.toFixed(4)} ETH`;
}

/**
 * Format Unix timestamp to date string
 */
function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
}

/**
 * Map API user to frontend User type
 */
function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.wallet_address, // Use wallet_address as ID
    wallet: `${apiUser.wallet_address.slice(0, 6)}...${apiUser.wallet_address.slice(-4)}`,
    email: apiUser.email,
    joined: formatTimestamp(apiUser.created_at),
    lastActive: formatTimestamp(apiUser.last_active),
    locked: formatWeiToEth(apiUser.total_locked),
    transactions: apiUser.total_locks,
    status: apiUser.status,
  };
}

/**
 * Map API user detail to frontend UserDetailSimple type
 */
function mapApiUserDetailToUserDetail(apiUser: ApiUserDetail): UserDetailSimple {
  const lockedEth = formatWeiToEth(apiUser.total_locked);
  return {
    id: apiUser.wallet_address,
    wallet: apiUser.wallet_address, // Full address for detail view
    email: apiUser.email,
    joined: formatTimestamp(apiUser.created_at),
    lastActive: formatTimestamp(apiUser.last_active),
    locked: lockedEth,
    unlocked: `${apiUser.total_unlocks} unlocks`, // Format unlock count
    totalValue: lockedEth, // Use locked as total value
    transactions: apiUser.total_locks + apiUser.total_unlocks,
    status: apiUser.status as 'active' | 'inactive' | 'suspended',
  };
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

      const response = await adminApi.get<ApiUsersListResponse>('/api/admin/users', params);

      // Map API response to frontend types
      return {
        users: response.users.map(mapApiUserToUser),
        total: response.total,
      } as UsersListResponse;
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
      // API returns detail directly (not wrapped in 'user')
      const response = await adminApi.get<ApiUserDetail>(`/api/admin/users/${userId}`);
      return mapApiUserDetailToUserDetail(response);
    },
    staleTime: 30_000,
    enabled: !!userId,
  });
}

/**
 * Format Unix timestamp to datetime string
 */
function formatTimestampDateTime(timestamp: number | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Fetch user's transaction history (locks + unlocks combined)
 */
export function useUserTransactions(userId: string) {
  return useQuery({
    queryKey: usersKeys.transactions(userId),
    queryFn: async () => {
      // Fetch both locks and unlocks in parallel
      const [locksResponse, unlocksResponse] = await Promise.all([
        adminApi.get<ApiUserLocksResponse>(`/api/admin/users/${userId}/locks`),
        adminApi.get<ApiUserUnlocksResponse>(`/api/admin/users/${userId}/unlocks`),
      ]);

      // Convert locks to UserTransaction format
      const lockTransactions: UserTransaction[] = locksResponse.locks.map((lock) => ({
        id: lock.lockId,
        type: 'lock' as const,
        amount: formatWeiToEth(lock.amount),
        timestamp: formatTimestampDateTime(lock.createdAt),
        status: lock.status,
        txHash: lock.l1TxHash, // Use L1 transaction hash for Etherscan
      }));

      // Convert unlocks to UserTransaction format
      // Note: unlocks may not have l1TxHash until completed
      const unlockTransactions: UserTransaction[] = unlocksResponse.unlocks.map((unlock) => ({
        id: unlock.unlockId,
        type: 'unlock' as const,
        amount: formatWeiToEth(unlock.amount),
        timestamp: formatTimestampDateTime(unlock.createdAt),
        status: unlock.status,
        txHash: null, // Unlocks don't have L1 tx hash in current API response
      }));

      // Combine and sort by timestamp (newest first)
      const allTransactions = [...lockTransactions, ...unlockTransactions].sort(
        (a, b) => b.timestamp.localeCompare(a.timestamp)
      );

      return {
        transactions: allTransactions,
        total: locksResponse.total + unlocksResponse.total,
      } as UserTransactionsResponse;
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
