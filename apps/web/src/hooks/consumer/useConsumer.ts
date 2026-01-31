/**
 * Consumer App React Query Hooks
 *
 * Provides data fetching hooks for Consumer App components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ConsumerStats,
  Transaction,
  HistoryTransaction,
  HistoryStatsData,
  LockItem,
  Notification,
  UserSettings,
  KeyInfo,
  EmergencyUnlockData,
  EmergencyResultData,
} from '@/lib/api/consumer/mock';

// ==================== API BASE ====================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }

  return res.json();
}

// ==================== QUERY KEY FACTORY ====================

export const consumerKeys = {
  all: ['consumer'] as const,
  stats: () => [...consumerKeys.all, 'stats'] as const,
  transactions: () => [...consumerKeys.all, 'transactions'] as const,
  transaction: (id: string) => [...consumerKeys.all, 'transaction', id] as const,
  history: () => [...consumerKeys.all, 'history'] as const,
  historyItem: (id: string) => [...consumerKeys.all, 'history', id] as const,
  locks: () => [...consumerKeys.all, 'locks'] as const,
  lock: (id: string) => [...consumerKeys.all, 'lock', id] as const,
  notifications: () => [...consumerKeys.all, 'notifications'] as const,
  settings: () => [...consumerKeys.all, 'settings'] as const,
  keyInfo: () => [...consumerKeys.all, 'keyInfo'] as const,
  emergencyUnlock: (lockId: string) => [...consumerKeys.all, 'emergencyUnlock', lockId] as const,
  emergencyResult: (txId: string) => [...consumerKeys.all, 'emergencyResult', txId] as const,
};

// ==================== RESPONSE TYPES ====================

interface StatsResponse {
  stats: ConsumerStats;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

interface HistoryResponse {
  stats: HistoryStatsData;
  transactions: HistoryTransaction[];
  total: number;
}

interface HistoryItemResponse {
  transaction: HistoryTransaction;
}

interface LocksResponse {
  locks: LockItem[];
  total: number;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

interface SettingsResponse {
  settings: UserSettings;
}

interface KeyInfoResponse {
  keyInfo: KeyInfo;
}

// ==================== STATS HOOKS ====================

export function useConsumerStats() {
  return useQuery({
    queryKey: consumerKeys.stats(),
    queryFn: async () => {
      const response = await fetchApi<StatsResponse>('/api/consumer/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

// ==================== TRANSACTIONS HOOKS ====================

export function useRecentTransactions() {
  return useQuery({
    queryKey: consumerKeys.transactions(),
    queryFn: async () => {
      return fetchApi<TransactionsResponse>('/api/consumer/transactions');
    },
    staleTime: 30_000,
  });
}

// ==================== HISTORY HOOKS ====================

export function useHistory() {
  return useQuery({
    queryKey: consumerKeys.history(),
    queryFn: async () => {
      return fetchApi<HistoryResponse>('/api/consumer/history');
    },
    staleTime: 30_000,
  });
}

export function useHistoryItem(id: string) {
  return useQuery({
    queryKey: consumerKeys.historyItem(id),
    queryFn: async () => {
      const response = await fetchApi<HistoryItemResponse>(
        `/api/consumer/history/${id}`
      );
      return response.transaction;
    },
    staleTime: 60_000,
    enabled: !!id,
  });
}

// ==================== LOCKS HOOKS ====================

export function useLocks() {
  return useQuery({
    queryKey: consumerKeys.locks(),
    queryFn: async () => {
      return fetchApi<LocksResponse>('/api/consumer/locks');
    },
    staleTime: 30_000,
  });
}

export function useLock(id: string) {
  return useQuery({
    queryKey: consumerKeys.lock(id),
    queryFn: async () => {
      const response = await fetchApi<{ lock: LockItem }>(
        `/api/consumer/locks/${id}`
      );
      return response.lock;
    },
    staleTime: 60_000,
    enabled: !!id,
  });
}

// ==================== LOCK/UNLOCK MUTATIONS ====================

interface LockAssetInput {
  amount: number;
  duration?: number;
}

export function useLockAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LockAssetInput) => {
      return fetchApi('/api/consumer/lock', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.locks() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.transactions() });
    },
  });
}

interface UnlockAssetInput {
  lockId: string;
  method: 'normal' | 'emergency';
}

export function useUnlockAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UnlockAssetInput) => {
      return fetchApi('/api/consumer/unlock', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.locks() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.history() });
    },
  });
}

// ==================== NOTIFICATIONS HOOKS ====================

export function useNotifications() {
  return useQuery({
    queryKey: consumerKeys.notifications(),
    queryFn: async () => {
      return fetchApi<NotificationsResponse>('/api/consumer/notifications');
    },
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return fetchApi(`/api/consumer/notifications/${notificationId}/read`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.notifications() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return fetchApi('/api/consumer/notifications/read-all', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.notifications() });
    },
  });
}

// ==================== SETTINGS HOOKS ====================

export function useUserSettings() {
  return useQuery({
    queryKey: consumerKeys.settings(),
    queryFn: async () => {
      const response = await fetchApi<SettingsResponse>('/api/consumer/settings');
      return response.settings;
    },
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      return fetchApi('/api/consumer/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.settings() });
    },
  });
}

// ==================== KEY MANAGEMENT HOOKS ====================

export function useKeyInfo() {
  return useQuery({
    queryKey: consumerKeys.keyInfo(),
    queryFn: async () => {
      const response = await fetchApi<KeyInfoResponse>('/api/consumer/key-info');
      return response.keyInfo;
    },
    staleTime: 60_000,
  });
}

export function useRegenerateKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return fetchApi('/api/consumer/key/regenerate', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.keyInfo() });
    },
  });
}

export function useExportKey() {
  return useMutation({
    mutationFn: async () => {
      return fetchApi<{ exportData: string }>('/api/consumer/key/export', {
        method: 'POST',
      });
    },
  });
}

export function useBackupKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return fetchApi('/api/consumer/key/backup', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.keyInfo() });
    },
  });
}

// ==================== EMERGENCY UNLOCK HOOKS ====================

interface EmergencyUnlockResponse {
  data: EmergencyUnlockData;
}

interface EmergencyResultResponse {
  data: EmergencyResultData;
}

export function useEmergencyUnlockData(lockId: string) {
  return useQuery({
    queryKey: consumerKeys.emergencyUnlock(lockId),
    queryFn: async () => {
      const response = await fetchApi<EmergencyUnlockResponse>(
        `/api/consumer/emergency-unlock/${lockId}`
      );
      return response.data;
    },
    staleTime: 30_000,
    enabled: !!lockId,
  });
}

export function useEmergencyResult(txId: string) {
  return useQuery({
    queryKey: consumerKeys.emergencyResult(txId),
    queryFn: async () => {
      const response = await fetchApi<EmergencyResultResponse>(
        `/api/consumer/emergency-result/${txId}`
      );
      return response.data;
    },
    staleTime: 30_000,
    enabled: !!txId,
  });
}

interface SubmitEmergencyUnlockInput {
  lockId: string;
  bondAmount: number;
}

export function useSubmitEmergencyUnlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitEmergencyUnlockInput) => {
      return fetchApi('/api/consumer/emergency-unlock', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.locks() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.history() });
    },
  });
}
