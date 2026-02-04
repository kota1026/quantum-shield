/**
 * QS Admin Transactions Hooks
 *
 * React Query hooks for transaction data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type {
  LockTransaction,
  UnlockTransaction,
  EmergencyUnlock,
  ChallengeTransaction,
  TransactionStats,
  LockStats,
  UnlockStats,
  EmergencyStats,
  ChallengeStats,
} from '@/lib/api/admin/types';

// Query keys factory
export const transactionKeys = {
  all: ['admin', 'transactions'] as const,
  stats: () => [...transactionKeys.all, 'stats'] as const,
  list: (filters?: TransactionFilters) => [...transactionKeys.all, 'list', filters] as const,
  locks: (filters?: TransactionFilters) => [...transactionKeys.all, 'locks', filters] as const,
  unlocks: (filters?: TransactionFilters) => [...transactionKeys.all, 'unlocks', filters] as const,
  emergency: (filters?: TransactionFilters) => [...transactionKeys.all, 'emergency', filters] as const,
  challenges: (filters?: TransactionFilters) => [...transactionKeys.all, 'challenges', filters] as const,
  detail: (type: string, id: string) => [...transactionKeys.all, type, 'detail', id] as const,
};

// Filter types
export interface TransactionFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}

// Response types
interface StatsResponse {
  stats: TransactionStats;
}

interface LockStatsResponse {
  stats: LockStats;
}

interface UnlockStatsResponse {
  stats: UnlockStats;
}

interface EmergencyStatsResponse {
  stats: EmergencyStats;
}

interface ChallengeStatsResponse {
  stats: ChallengeStats;
}

interface TransactionsResponse<T> {
  transactions: T[];
  total: number;
}

// Combined transaction type for list display
export interface CombinedTransaction {
  id: string;
  type: 'lock' | 'unlock' | 'emergency' | 'challenge';
  userAddress?: string;
  challengerAddress?: string;
  amount?: string;
  status: string;
  createdAt: number;
}

/**
 * Fetch transaction statistics
 */
export function useTransactionStats() {
  return useQuery({
    queryKey: transactionKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<StatsResponse>('/api/admin/transactions/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch all transactions (combined)
 */
export function useAllTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const response = await adminApi.get<TransactionsResponse<CombinedTransaction>>('/api/admin/transactions', filters);
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch lock statistics
 */
export function useLockStats() {
  return useQuery({
    queryKey: [...transactionKeys.locks(), 'stats'] as const,
    queryFn: async () => {
      const response = await adminApi.get<LockStatsResponse>('/api/admin/transactions/locks/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch lock transactions
 */
export function useLockTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.locks(filters),
    queryFn: async () => {
      const response = await adminApi.get<TransactionsResponse<LockTransaction>>('/api/admin/transactions/locks', filters);
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch unlock statistics
 */
export function useUnlockStats() {
  return useQuery({
    queryKey: [...transactionKeys.unlocks(), 'stats'] as const,
    queryFn: async () => {
      const response = await adminApi.get<UnlockStatsResponse>('/api/admin/transactions/unlocks/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch unlock transactions
 */
export function useUnlockTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.unlocks(filters),
    queryFn: async () => {
      const response = await adminApi.get<TransactionsResponse<UnlockTransaction>>('/api/admin/transactions/unlocks', filters);
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch emergency statistics
 */
export function useEmergencyStats() {
  return useQuery({
    queryKey: [...transactionKeys.emergency(), 'stats'] as const,
    queryFn: async () => {
      const response = await adminApi.get<EmergencyStatsResponse>('/api/admin/transactions/emergency/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch emergency unlock transactions
 */
export function useEmergencyTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.emergency(filters),
    queryFn: async () => {
      const response = await adminApi.get<TransactionsResponse<EmergencyUnlock>>('/api/admin/transactions/emergency', filters);
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch challenge statistics
 */
export function useChallengeStats() {
  return useQuery({
    queryKey: [...transactionKeys.challenges(), 'stats'] as const,
    queryFn: async () => {
      const response = await adminApi.get<ChallengeStatsResponse>('/api/admin/transactions/challenges/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch challenge transactions
 */
export function useChallengeTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.challenges(filters),
    queryFn: async () => {
      const response = await adminApi.get<TransactionsResponse<ChallengeTransaction>>('/api/admin/transactions/challenges', filters);
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch single lock transaction detail
 */
export function useLockDetail(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail('lock', id),
    queryFn: async () => {
      const response = await adminApi.get<LockTransaction>(`/api/admin/transactions/locks/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch single unlock transaction detail
 */
export function useUnlockDetail(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail('unlock', id),
    queryFn: async () => {
      const response = await adminApi.get<UnlockTransaction>(`/api/admin/transactions/unlocks/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Combined transactions data hook
 * Fetches stats and recent transactions in parallel
 */
export function useTransactionsData(filters?: TransactionFilters) {
  const stats = useTransactionStats();
  const transactions = useAllTransactions(filters);

  return {
    stats: stats.data,
    transactions: transactions.data?.transactions,
    total: transactions.data?.total,
    isLoading: stats.isLoading || transactions.isLoading,
    isError: stats.isError || transactions.isError,
    error: stats.error || transactions.error,
    refetch: () => {
      stats.refetch();
      transactions.refetch();
    },
  };
}
