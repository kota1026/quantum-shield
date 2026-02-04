/**
 * Consumer App React Query Hooks
 *
 * Provides data fetching hooks for Consumer App components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 *
 * API Endpoints (Backend: /v1/user, /v1/lock, /v1/unlock):
 * - GET /v1/user/dashboard - User dashboard
 * - GET /v1/user/transactions - Transaction list
 * - GET /v1/user/transactions/:id - Transaction details
 * - GET /v1/user/settings - User settings
 * - POST /v1/user/settings - Update settings
 * - GET /v1/user/keys - Quantum keys info
 * - POST /v1/lock - Create lock
 * - POST /v1/unlock - Normal unlock
 * - POST /v1/unlock/emergency - Emergency unlock
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
} from '@/lib/api/consumer/types';

// ==================== API BASE ====================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// User address storage key - in production, this would come from wallet connection
const USER_ADDRESS_KEY = 'quantum_shield_user_address';

/**
 * Get the current user address from localStorage
 * In production, this should come from wallet connection (RainbowKit/wagmi)
 */
function getUserAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ADDRESS_KEY);
}

/**
 * Set the user address in localStorage
 * Called after successful wallet connection
 */
export function setUserAddress(address: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_ADDRESS_KEY, address);
  }
}

/**
 * Clear the user address from localStorage
 * Called on disconnect
 */
export function clearUserAddress(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ADDRESS_KEY);
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const userAddress = getUserAddress();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add user address header if available (temporary until JWT auth)
  if (userAddress) {
    headers['X-User-Address'] = userAddress;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
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
  // Dashboard
  dashboard: () => [...consumerKeys.all, 'dashboard'] as const,
  stats: () => [...consumerKeys.all, 'stats'] as const,
  // Transactions
  transactions: () => [...consumerKeys.all, 'transactions'] as const,
  transaction: (id: string) => [...consumerKeys.all, 'transaction', id] as const,
  // History (legacy)
  history: () => [...consumerKeys.all, 'history'] as const,
  historyItem: (id: string) => [...consumerKeys.all, 'history', id] as const,
  // Locks
  locks: () => [...consumerKeys.all, 'locks'] as const,
  lock: (id: string) => [...consumerKeys.all, 'lock', id] as const,
  // Notifications
  notifications: () => [...consumerKeys.all, 'notifications'] as const,
  // Settings & Keys
  settings: () => [...consumerKeys.all, 'settings'] as const,
  keyInfo: () => [...consumerKeys.all, 'keyInfo'] as const,
  // Emergency
  emergencyUnlock: (lockId: string) => [...consumerKeys.all, 'emergencyUnlock', lockId] as const,
  emergencyResult: (txId: string) => [...consumerKeys.all, 'emergencyResult', txId] as const,
};

// ==================== RESPONSE TYPES ====================

// Backend API response types (matching Rust backend /v1/user/*)
interface UserDashboardApiResponse {
  address: string;
  total_locked: string;
  total_locked_usd: string;
  active_locks: number;
  pending_unlocks: number;
  quantum_keys: {
    dilithium_registered: boolean;
    dilithium_fingerprint?: string;
    registered_at?: number;
  };
  recent_activity: Array<{
    activity_type: string;
    reference_id: string;
    amount: string;
    asset: string;
    timestamp: number;
  }>;
}

interface UserTransactionsApiResponse {
  transactions: Array<{
    id: string;
    tx_type: 'lock' | 'normal_unlock' | 'emergency_unlock';
    asset: string;
    amount: string;
    status: 'pending' | 'processing' | 'confirmed' | 'completed' | 'challenged' | 'failed';
    chain_id: number;
    created_at: number;
    updated_at?: number;
    release_time?: number;
    l1_tx_hash?: string;
  }>;
  total: number;
  page: number;
  per_page: number;
}

interface UserTransactionDetailApiResponse {
  transaction: {
    id: string;
    tx_type: 'lock' | 'normal_unlock' | 'emergency_unlock';
    asset: string;
    amount: string;
    status: 'pending' | 'processing' | 'confirmed' | 'completed' | 'challenged' | 'failed';
    chain_id: number;
    created_at: number;
    updated_at?: number;
    release_time?: number;
    l1_tx_hash?: string;
  };
  sr_0: string;
  sr_1?: string;
  prover_signatures: number;
  required_signatures: number;
  time_lock_remaining?: number;
  challenge_info?: {
    challenger: string;
    bond: string;
    challenged_at: number;
    defense_deadline: number;
  };
  timeline: Array<{
    event: string;
    timestamp: number;
    description: string;
  }>;
}

interface UserSettingsApiResponse {
  address: string;
  notifications: {
    email_enabled: boolean;
    email?: string;
    on_lock_confirmed: boolean;
    on_unlock_ready: boolean;
    on_challenge: boolean;
  };
  default_time_lock_hours: number;
  language: string;
  two_factor_enabled: boolean;
}

interface UserKeysApiResponse {
  address: string;
  dilithium_public_key?: string;
  dilithium_fingerprint?: string;
  registered_at?: number;
  algorithm: {
    name: string;
    standard: string;
    security_level: string;
    public_key_size: number;
    signature_size: number;
  };
}

interface LockApiRequest {
  chain_id: number;
  asset: string;
  amount: string;
  dest_addr: string;
  pk_dilithium: string;
  sig_dilithium: string;
  expiry: number;
  nonce: number;
}

interface LockApiResponse {
  lock_id: string;
  sr_0: string;
  smt_proof: string;
  status: string;
}

interface UnlockApiRequest {
  lock_id: string;
  pk_dilithium: string;
  sig_dilithium: string;
  nonce: number;
}

interface UnlockApiResponse {
  unlock_id: string;
  sr_1: string;
  release_time: number;
  status: string;
}

interface EmergencyUnlockApiRequest {
  lock_id: string;
  bond: string;
  pk_dilithium: string;
  sig_dilithium: string;
}

interface EmergencyUnlockApiResponse {
  emergency_id: string;
  lock_id: string;
  bond: string;
  challenge_deadline: number;
  release_time: number;
  status: string;
}

// Legacy response types (for backward compatibility during migration)
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

// ==================== DASHBOARD HOOKS ====================

/**
 * Get user dashboard from backend
 * Endpoint: GET /v1/user/dashboard
 */
export function useUserDashboard() {
  return useQuery({
    queryKey: consumerKeys.dashboard(),
    queryFn: async () => {
      const response = await fetchApi<UserDashboardApiResponse>(
        '/v1/user/dashboard'
      );
      // Transform to frontend format
      return {
        address: response.address,
        totalLocked: response.total_locked,
        totalLockedUsd: response.total_locked_usd,
        activeLocks: response.active_locks,
        pendingUnlocks: response.pending_unlocks,
        quantumKeys: {
          dilithiumRegistered: response.quantum_keys.dilithium_registered,
          dilithiumFingerprint: response.quantum_keys.dilithium_fingerprint,
          registeredAt: response.quantum_keys.registered_at,
        },
        recentActivity: response.recent_activity.map(a => ({
          activityType: a.activity_type,
          referenceId: a.reference_id,
          amount: a.amount,
          asset: a.asset,
          timestamp: a.timestamp,
        })),
      };
    },
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useUserDashboard instead
 */
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

/**
 * Get user transactions from backend
 * Endpoint: GET /v1/user/transactions
 */
export function useUserTransactions(params?: { txType?: string; status?: string; page?: number; perPage?: number }) {
  return useQuery({
    queryKey: [...consumerKeys.transactions(), params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.txType) queryParams.set('tx_type', params.txType);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.perPage) queryParams.set('per_page', params.perPage.toString());

      const url = `/v1/user/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetchApi<UserTransactionsApiResponse>(url);

      // Transform to frontend format
      return {
        transactions: response.transactions.map(tx => ({
          id: tx.id,
          txType: tx.tx_type,
          asset: tx.asset,
          amount: tx.amount,
          status: tx.status,
          chainId: tx.chain_id,
          createdAt: tx.created_at,
          updatedAt: tx.updated_at,
          releaseTime: tx.release_time,
          l1TxHash: tx.l1_tx_hash,
        })),
        total: response.total,
        page: response.page,
        perPage: response.per_page,
      };
    },
    staleTime: 30_000,
  });
}

/**
 * Get transaction details from backend
 * Endpoint: GET /v1/user/transactions/:id
 */
export function useTransactionDetail(txId: string) {
  return useQuery({
    queryKey: consumerKeys.transaction(txId),
    queryFn: async () => {
      const response = await fetchApi<UserTransactionDetailApiResponse>(
        `/v1/user/transactions/${txId}`
      );
      // Transform to frontend format
      return {
        transaction: {
          id: response.transaction.id,
          txType: response.transaction.tx_type,
          asset: response.transaction.asset,
          amount: response.transaction.amount,
          status: response.transaction.status,
          chainId: response.transaction.chain_id,
          createdAt: response.transaction.created_at,
          updatedAt: response.transaction.updated_at,
          releaseTime: response.transaction.release_time,
          l1TxHash: response.transaction.l1_tx_hash,
        },
        sr0: response.sr_0,
        sr1: response.sr_1,
        proverSignatures: response.prover_signatures,
        requiredSignatures: response.required_signatures,
        timeLockRemaining: response.time_lock_remaining,
        challengeInfo: response.challenge_info ? {
          challenger: response.challenge_info.challenger,
          bond: response.challenge_info.bond,
          challengedAt: response.challenge_info.challenged_at,
          defenseDeadline: response.challenge_info.defense_deadline,
        } : undefined,
        timeline: response.timeline.map(e => ({
          event: e.event,
          timestamp: e.timestamp,
          description: e.description,
        })),
      };
    },
    enabled: !!txId,
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useUserTransactions instead
 */
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

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useUserTransactions instead
 */
export function useHistory() {
  return useQuery({
    queryKey: consumerKeys.history(),
    queryFn: async () => {
      return fetchApi<HistoryResponse>('/api/consumer/history');
    },
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useTransactionDetail instead
 */
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

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useUserTransactions with txType filter instead
 */
export function useLocks() {
  return useQuery({
    queryKey: consumerKeys.locks(),
    queryFn: async () => {
      return fetchApi<LocksResponse>('/api/consumer/locks');
    },
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useTransactionDetail instead
 */
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

/**
 * Create a new lock
 * Endpoint: POST /v1/lock
 *
 * Requirements:
 * - ML-DSA-65 (NIST FIPS 204) signature required
 * - SHA3-256 for SR_0 computation
 */
export function useCreateLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      chainId: number;
      asset: string;
      amount: string;
      destAddr: string;
      pkDilithium: string;
      sigDilithium: string;
      expiry: number;
      nonce: number;
    }) => {
      const response = await fetchApi<LockApiResponse>('/v1/lock', {
        method: 'POST',
        body: JSON.stringify({
          chain_id: data.chainId,
          asset: data.asset,
          amount: data.amount,
          dest_addr: data.destAddr,
          pk_dilithium: data.pkDilithium,
          sig_dilithium: data.sigDilithium,
          expiry: data.expiry,
          nonce: data.nonce,
        } as LockApiRequest),
      });
      return {
        lockId: response.lock_id,
        sr0: response.sr_0,
        smtProof: response.smt_proof,
        status: response.status,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.locks() });
    },
  });
}

/**
 * Request normal unlock (24h timelock)
 * Endpoint: POST /v1/unlock
 */
export function useRequestUnlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      lockId: string;
      pkDilithium: string;
      sigDilithium: string;
      nonce: number;
    }) => {
      const response = await fetchApi<UnlockApiResponse>('/v1/unlock', {
        method: 'POST',
        body: JSON.stringify({
          lock_id: data.lockId,
          pk_dilithium: data.pkDilithium,
          sig_dilithium: data.sigDilithium,
          nonce: data.nonce,
        } as UnlockApiRequest),
      });
      return {
        unlockId: response.unlock_id,
        sr1: response.sr_1,
        releaseTime: response.release_time,
        status: response.status,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.locks() });
    },
  });
}

/**
 * Request emergency unlock (7d + bond)
 * Endpoint: POST /v1/unlock/emergency
 */
export function useRequestEmergencyUnlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      lockId: string;
      bond: string;
      pkDilithium: string;
      sigDilithium: string;
    }) => {
      const response = await fetchApi<EmergencyUnlockApiResponse>('/v1/unlock/emergency', {
        method: 'POST',
        body: JSON.stringify({
          lock_id: data.lockId,
          bond: data.bond,
          pk_dilithium: data.pkDilithium,
          sig_dilithium: data.sigDilithium,
        } as EmergencyUnlockApiRequest),
      });
      return {
        emergencyId: response.emergency_id,
        lockId: response.lock_id,
        bond: response.bond,
        challengeDeadline: response.challenge_deadline,
        releaseTime: response.release_time,
        status: response.status,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.locks() });
      queryClient.invalidateQueries({ queryKey: consumerKeys.history() });
    },
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useCreateLock instead
 */
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

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useRequestUnlock or useRequestEmergencyUnlock instead
 */
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

/**
 * Get user settings from backend
 * Endpoint: GET /v1/user/settings
 */
export function useUserSettingsV2() {
  return useQuery({
    queryKey: consumerKeys.settings(),
    queryFn: async () => {
      const response = await fetchApi<UserSettingsApiResponse>(
        '/v1/user/settings'
      );
      // Transform to frontend format
      return {
        address: response.address,
        notifications: {
          emailEnabled: response.notifications.email_enabled,
          email: response.notifications.email,
          onLockConfirmed: response.notifications.on_lock_confirmed,
          onUnlockReady: response.notifications.on_unlock_ready,
          onChallenge: response.notifications.on_challenge,
        },
        defaultTimeLockHours: response.default_time_lock_hours,
        language: response.language,
        twoFactorEnabled: response.two_factor_enabled,
      };
    },
    staleTime: 60_000,
  });
}

/**
 * Update user settings
 * Endpoint: POST /v1/user/settings
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: {
      notifications?: {
        emailEnabled?: boolean;
        email?: string;
        onLockConfirmed?: boolean;
        onUnlockReady?: boolean;
        onChallenge?: boolean;
      };
      defaultTimeLockHours?: number;
      language?: string;
    }) => {
      const response = await fetchApi<UserSettingsApiResponse>(
        '/v1/user/settings',
        {
          method: 'POST',
          body: JSON.stringify({
            notifications: settings.notifications ? {
              email_enabled: settings.notifications.emailEnabled,
              email: settings.notifications.email,
              on_lock_confirmed: settings.notifications.onLockConfirmed,
              on_unlock_ready: settings.notifications.onUnlockReady,
              on_challenge: settings.notifications.onChallenge,
            } : undefined,
            default_time_lock_hours: settings.defaultTimeLockHours,
            language: settings.language,
          }),
        }
      );
      return {
        address: response.address,
        notifications: {
          emailEnabled: response.notifications.email_enabled,
          email: response.notifications.email,
          onLockConfirmed: response.notifications.on_lock_confirmed,
          onUnlockReady: response.notifications.on_unlock_ready,
          onChallenge: response.notifications.on_challenge,
        },
        defaultTimeLockHours: response.default_time_lock_hours,
        language: response.language,
        twoFactorEnabled: response.two_factor_enabled,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumerKeys.settings() });
    },
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useUserSettingsV2 instead
 */
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

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useUpdateUserSettings instead
 */
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

/**
 * Get user's quantum keys info from backend
 * Endpoint: GET /v1/user/keys
 */
export function useUserKeys() {
  return useQuery({
    queryKey: consumerKeys.keyInfo(),
    queryFn: async () => {
      const response = await fetchApi<UserKeysApiResponse>(
        '/v1/user/keys'
      );
      // Transform to frontend format
      return {
        address: response.address,
        dilithiumPublicKey: response.dilithium_public_key,
        dilithiumFingerprint: response.dilithium_fingerprint,
        registeredAt: response.registered_at,
        algorithm: {
          name: response.algorithm.name,
          standard: response.algorithm.standard,
          securityLevel: response.algorithm.security_level,
          publicKeySize: response.algorithm.public_key_size,
          signatureSize: response.algorithm.signature_size,
        },
      };
    },
    staleTime: 60_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useUserKeys instead
 */
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
