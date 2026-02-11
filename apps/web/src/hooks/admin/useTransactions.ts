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
      try {
        const response = await adminApi.get<LockStatsResponse>('/api/admin/transactions/locks/stats');
        return response.stats;
      } catch (error) {
        console.warn('Lock stats API failed, using fallback:', error);
        // Return fallback data on error
        return {
          totalLocks: 0,
          lockVolume: '0 ETH',
          avgLockAmount: '0 ETH',
          avgLockDuration: '0 days',
        };
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// Backend response type for admin locks
interface AdminLockItem {
  lockId: string;
  walletAddress: string;
  chainId: number;
  asset: string;
  amount: string;
  status: string;
  createdAt: number;
  confirmedAt?: number;
  l1TxHash?: string;
}

interface AdminLocksResponse {
  locks: AdminLockItem[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * Fetch lock transactions
 */
export function useLockTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.locks(filters),
    queryFn: async () => {
      try {
        const response = await adminApi.get<AdminLocksResponse>('/api/admin/transactions/locks', filters);
        // Transform backend response to frontend format
        const transactions: LockTransaction[] = response.locks.map((lock) => {
          // Convert wei to ETH
          const weiAmount = BigInt(lock.amount || '0');
          const ethAmount = Number(weiAmount) / 1e18;
          const formattedAmount = ethAmount >= 1
            ? `${ethAmount.toFixed(2)} ETH`
            : `${ethAmount.toFixed(4)} ETH`;

          return {
            id: lock.lockId,
            userAddress: `${lock.walletAddress.slice(0, 6)}...${lock.walletAddress.slice(-4)}`,
            amount: formattedAmount,
            currency: 'ETH',
            status: lock.status as LockTransaction['status'],
            l1TxHash: lock.l1TxHash,
            createdAt: lock.createdAt * 1000, // Convert to milliseconds
            confirmedAt: lock.confirmedAt ? lock.confirmedAt * 1000 : undefined,
          };
        });
        return { transactions, total: response.total };
      } catch (error) {
        console.warn('Lock transactions API failed:', error);
        return { transactions: [], total: 0 };
      }
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

// Backend response type for lock detail
interface AdminLockDetailResponse {
  lockId: string;
  walletAddress: string;
  chainId: number;
  asset: string;
  amount: string;
  expiry: string;
  nonce: string;
  sr0: string | null;
  status: string;
  l1TxHash: string | null;
  createdAt: number;
  confirmedAt: number | null;
}

/**
 * Fetch single lock transaction detail
 */
export function useLockDetail(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail('lock', id),
    queryFn: async () => {
      try {
        const response = await adminApi.get<AdminLockDetailResponse>(`/api/admin/transactions/locks/${id}`);
        return response;
      } catch (error) {
        console.warn('Lock detail API failed:', error);
        return null;
      }
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
