/**
 * Observer Portal React Query Hooks
 *
 * Provides data fetching hooks for Observer Portal components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 *
 * API Endpoints (Backend: /v1/observer):
 * - GET /v1/observer/dashboard - Observer dashboard
 * - GET /v1/observer/pending-unlocks - Pending unlocks to monitor
 * - GET /v1/observer/suspicious-txs - Suspicious transactions
 * - GET /v1/observer/history - Challenge history
 * - GET /v1/observer/earnings - Earnings summary
 * - GET /v1/observer/challenge/:id - Challenge details
 * - POST /v1/observer/challenge - Submit challenge
 * - POST /v1/observer/claim-earnings - Claim earnings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ObserverData,
  PendingUnlock,
  SuspiciousTransaction,
  ActiveChallenge,
  ChallengeHistoryItem,
  ObserverStats,
  ObserverEarnings,
  ObserverSettings,
  ChallengeStats,
  ObserverStake,
} from '@/lib/api/observer/mock';

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

// ==================== LOCAL STORAGE HELPERS ====================

const OBSERVER_ID_KEY = 'quantum_shield_observer_id';

/**
 * Get stored observer ID from localStorage
 */
export function getObserverId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(OBSERVER_ID_KEY);
}

/**
 * Set observer ID in localStorage
 */
export function setObserverId(observerId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OBSERVER_ID_KEY, observerId);
}

/**
 * Clear observer ID from localStorage
 */
export function clearObserverId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OBSERVER_ID_KEY);
}

// ==================== QUERY KEY FACTORY ====================

export const observerKeys = {
  all: ['observer'] as const,
  // Registration
  registration: (observerId: string) => [...observerKeys.all, 'registration', observerId] as const,
  // Dashboard
  dashboard: () => [...observerKeys.all, 'dashboard'] as const,
  data: () => [...observerKeys.all, 'data'] as const,
  // Monitoring
  pendingUnlocks: () => [...observerKeys.all, 'pendingUnlocks'] as const,
  suspicious: () => [...observerKeys.all, 'suspicious'] as const,
  // Challenges
  activeChallenges: () => [...observerKeys.all, 'activeChallenges'] as const,
  challengeHistory: () => [...observerKeys.all, 'challengeHistory'] as const,
  challenge: (id: string) => [...observerKeys.all, 'challenge', id] as const,
  challengeStats: () => [...observerKeys.all, 'challengeStats'] as const,
  // Stats & Earnings
  stats: () => [...observerKeys.all, 'stats'] as const,
  earnings: () => [...observerKeys.all, 'earnings'] as const,
  // Settings & Stake
  settings: () => [...observerKeys.all, 'settings'] as const,
  stake: () => [...observerKeys.all, 'stake'] as const,
};

// ==================== RESPONSE TYPES ====================

// Backend API response types (matching Rust backend /v1/observer/*)
interface ObserverDashboardApiResponse {
  totalEarnings: string;
  unclaimedEarnings: string;
  totalChallenges: number;
  successfulChallenges: number;
  successRate: number;
  pendingUnlocksCount: number;
  activeChallenges: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: number;
    amount?: string;
  }>;
  stats: {
    totalValueLocked: string;
    networkPendingUnlocks: number;
    networkChallenges: number;
    networkSuccessRate: number;
  };
}

interface PendingUnlocksApiResponse {
  unlocks: Array<{
    lockId: string;
    owner: string;
    amount: string;
    token: string;
    unlockType: 'normal' | 'emergency';
    unlockRequestedAt: number;
    timeRemaining: number;
    suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
    riskIndicators: string[];
    canChallenge: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

interface SuspiciousTxsApiResponse {
  transactions: Array<{
    lockId: string;
    owner: string;
    amount: string;
    suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
    riskAnalysis: {
      score: number;
      factors: Array<{
        name: string;
        description: string;
        severity: string;
        weight: number;
      }>;
      summary: string;
    };
    recommendedAction: string;
    challengeBond: string;
    detectedAt: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

interface ObserverHistoryApiResponse {
  history: Array<{
    id: string;
    type: string;
    lockId: string;
    amount: string;
    status: string;
    timestamp: number;
    txHash?: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

interface EarningsApiResponse {
  totalEarnings: string;
  claimedEarnings: string;
  unclaimedEarnings: string;
  breakdown: {
    fromChallenges: string;
    winningChallenges: number;
  };
  history: Array<{
    id: string;
    challengeId: string;
    amount: string;
    timestamp: number;
    claimed: boolean;
    txHash?: string;
  }>;
}

interface SubmitChallengeApiRequest {
  lockId: string;
  challenger: string;
  fraudProof: string;
  bond: string;
  reason: string;
}

interface SubmitChallengeApiResponse {
  challengeId: string;
  lockId: string;
  fraudProofHash: string;
  bond: string;
  defenseDeadline: number;
  status: 'pending' | 'under_review' | 'succeeded' | 'failed' | 'expired';
  estimatedReward: string;
}

interface ChallengeDetailApiResponse {
  challengeId: string;
  lockId: string;
  challenger: string;
  fraudProofHash: string;
  bond: string;
  status: 'pending' | 'under_review' | 'succeeded' | 'failed' | 'expired';
  submittedAt: number;
  defenseDeadline: number;
  defense?: {
    defender: string;
    defenseProofHash: string;
    submittedAt: number;
  };
  resolution?: {
    winner: string;
    resolvedAt: number;
    slashedAmount?: string;
    rewardAmount?: string;
  };
  timeline: Array<{
    type: string;
    description: string;
    timestamp: number;
    txHash?: string;
  }>;
}

interface ClaimEarningsApiRequest {
  observer: string;
  earningIds?: string[];
}

interface ClaimEarningsApiResponse {
  claimId: string;
  amountClaimed: string;
  earningsClaimed: number;
  txHash: string;
  status: string;
}

// Observer Registration types
interface ObserverRegisterApiRequest {
  operator_addr: string;
  stake_amount?: string;
}

interface ObserverRegisterApiResponse {
  observer_id: string;
  status: 'pending_approval' | 'active' | 'inactive' | 'suspended';
  operator_addr: string;
  registered_at: number;
}

interface ObserverInfoApiResponse {
  observer_id: string;
  operator_addr: string;
  status: 'pending_approval' | 'active' | 'inactive' | 'suspended';
  stake_amount?: string;
  registered_at: number;
  total_challenges: number;
  successful_challenges: number;
  total_earnings: string;
}

// Legacy response types (for backward compatibility during migration)
interface ObserverDataResponse {
  data: ObserverData;
}

interface PendingUnlocksResponse {
  items: PendingUnlock[];
  total: number;
}

interface SuspiciousResponse {
  items: SuspiciousTransaction[];
}

interface ActiveChallengesResponse {
  items: ActiveChallenge[];
}

interface ChallengeHistoryResponse {
  items: ChallengeHistoryItem[];
}

interface ObserverStatsResponse {
  stats: ObserverStats;
}

interface ObserverEarningsResponse {
  earnings: ObserverEarnings;
}

interface ObserverSettingsResponse {
  settings: ObserverSettings;
}

interface ChallengeStatsResponse {
  stats: ChallengeStats;
}

interface ObserverStakeResponse {
  stake: ObserverStake;
}

// ==================== DATA HOOKS ====================

/**
 * Get observer dashboard from backend
 * Endpoint: GET /v1/observer/dashboard
 */
export function useObserverDashboard() {
  return useQuery({
    queryKey: observerKeys.dashboard(),
    queryFn: async () => {
      const response = await fetchApi<ObserverDashboardApiResponse>(
        '/v1/observer/dashboard'
      );
      // Transform to frontend format
      return {
        totalEarnings: response.totalEarnings,
        unclaimedEarnings: response.unclaimedEarnings,
        totalChallenges: response.totalChallenges,
        successfulChallenges: response.successfulChallenges,
        successRate: response.successRate,
        pendingUnlocksCount: response.pendingUnlocksCount,
        activeChallenges: response.activeChallenges,
        recentActivity: response.recentActivity,
        networkStats: {
          totalValueLocked: response.stats.totalValueLocked,
          networkPendingUnlocks: response.stats.networkPendingUnlocks,
          networkChallenges: response.stats.networkChallenges,
          networkSuccessRate: response.stats.networkSuccessRate,
        },
      };
    },
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useObserverDashboard instead
 */
export function useObserverData() {
  return useQuery({
    queryKey: observerKeys.data(),
    queryFn: async () => {
      const response = await fetchApi<ObserverDataResponse>('/api/observer/data');
      return response.data;
    },
    staleTime: 300_000, // 5 minutes
  });
}

/**
 * Get pending unlocks from backend
 * Endpoint: GET /v1/observer/pending-unlocks
 */
export function useObserverPendingUnlocks() {
  return useQuery({
    queryKey: observerKeys.pendingUnlocks(),
    queryFn: async () => {
      const response = await fetchApi<PendingUnlocksApiResponse>(
        '/v1/observer/pending-unlocks'
      );
      // Transform to frontend format
      return {
        unlocks: response.unlocks.map(u => ({
          lockId: u.lockId,
          owner: u.owner,
          amount: u.amount,
          token: u.token,
          unlockType: u.unlockType,
          unlockRequestedAt: u.unlockRequestedAt,
          timeRemaining: u.timeRemaining,
          suspicionLevel: u.suspicionLevel,
          riskIndicators: u.riskIndicators,
          canChallenge: u.canChallenge,
        })),
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
      };
    },
    staleTime: 15_000, // Refresh frequently for real-time monitoring
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useObserverPendingUnlocks instead
 */
export function usePendingUnlocks() {
  return useQuery({
    queryKey: observerKeys.pendingUnlocks(),
    queryFn: async () => {
      return fetchApi<PendingUnlocksResponse>('/api/observer/pending-unlocks');
    },
    staleTime: 15_000,
  });
}

/**
 * Get suspicious transactions from backend
 * Endpoint: GET /v1/observer/suspicious-txs
 */
export function useObserverSuspiciousTxs() {
  return useQuery({
    queryKey: observerKeys.suspicious(),
    queryFn: async () => {
      const response = await fetchApi<SuspiciousTxsApiResponse>(
        '/v1/observer/suspicious-txs'
      );
      // Transform to frontend format
      return {
        transactions: response.transactions.map(tx => ({
          lockId: tx.lockId,
          owner: tx.owner,
          amount: tx.amount,
          suspicionLevel: tx.suspicionLevel,
          riskScore: tx.riskAnalysis.score,
          riskFactors: tx.riskAnalysis.factors,
          riskSummary: tx.riskAnalysis.summary,
          recommendedAction: tx.recommendedAction,
          challengeBond: tx.challengeBond,
          detectedAt: tx.detectedAt,
        })),
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
      };
    },
    staleTime: 15_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useObserverSuspiciousTxs instead
 */
export function useSuspiciousTransactions() {
  return useQuery({
    queryKey: observerKeys.suspicious(),
    queryFn: async () => {
      const response = await fetchApi<SuspiciousResponse>('/api/observer/suspicious');
      return response.items;
    },
    staleTime: 15_000,
  });
}

/**
 * Get observer history from backend
 * Endpoint: GET /v1/observer/history
 */
export function useObserverHistory() {
  return useQuery({
    queryKey: observerKeys.challengeHistory(),
    queryFn: async () => {
      const response = await fetchApi<ObserverHistoryApiResponse>(
        '/v1/observer/history'
      );
      // Transform to frontend format
      return {
        history: response.history.map(h => ({
          id: h.id,
          type: h.type,
          lockId: h.lockId,
          amount: h.amount,
          status: h.status,
          timestamp: h.timestamp,
          txHash: h.txHash,
        })),
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
      };
    },
    staleTime: 60_000,
  });
}

export function useActiveChallenges() {
  return useQuery({
    queryKey: observerKeys.activeChallenges(),
    queryFn: async () => {
      const response = await fetchApi<ActiveChallengesResponse>('/api/observer/active-challenges');
      return response.items;
    },
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useObserverHistory instead
 */
export function useChallengeHistory() {
  return useQuery({
    queryKey: observerKeys.challengeHistory(),
    queryFn: async () => {
      const response = await fetchApi<ChallengeHistoryResponse>('/api/observer/challenge-history');
      return response.items;
    },
    staleTime: 60_000,
  });
}

export function useObserverStats() {
  return useQuery({
    queryKey: observerKeys.stats(),
    queryFn: async () => {
      const response = await fetchApi<ObserverStatsResponse>('/api/observer/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

/**
 * Get observer earnings from backend
 * Endpoint: GET /v1/observer/earnings
 */
export function useObserverEarningsV2() {
  return useQuery({
    queryKey: observerKeys.earnings(),
    queryFn: async () => {
      const response = await fetchApi<EarningsApiResponse>(
        '/v1/observer/earnings'
      );
      // Transform to frontend format
      return {
        totalEarnings: response.totalEarnings,
        claimedEarnings: response.claimedEarnings,
        unclaimedEarnings: response.unclaimedEarnings,
        fromChallenges: response.breakdown.fromChallenges,
        winningChallenges: response.breakdown.winningChallenges,
        earningsHistory: response.history.map(e => ({
          id: e.id,
          challengeId: e.challengeId,
          amount: e.amount,
          timestamp: e.timestamp,
          claimed: e.claimed,
          txHash: e.txHash,
        })),
      };
    },
    staleTime: 60_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useObserverEarningsV2 instead
 */
export function useObserverEarnings() {
  return useQuery({
    queryKey: observerKeys.earnings(),
    queryFn: async () => {
      const response = await fetchApi<ObserverEarningsResponse>('/api/observer/earnings');
      return response.earnings;
    },
    staleTime: 60_000,
  });
}

export function useObserverSettings() {
  return useQuery({
    queryKey: observerKeys.settings(),
    queryFn: async () => {
      const response = await fetchApi<ObserverSettingsResponse>('/api/observer/settings');
      return response.settings;
    },
    staleTime: 300_000,
  });
}

export function useChallengeStats() {
  return useQuery({
    queryKey: observerKeys.challengeStats(),
    queryFn: async () => {
      const response = await fetchApi<ChallengeStatsResponse>('/api/observer/challenge-stats');
      return response.stats;
    },
    staleTime: 60_000,
  });
}

export function useObserverStake() {
  return useQuery({
    queryKey: observerKeys.stake(),
    queryFn: async () => {
      const response = await fetchApi<ObserverStakeResponse>('/api/observer/stake');
      return response.stake;
    },
    staleTime: 60_000,
  });
}

/**
 * Get challenge details from backend
 * Endpoint: GET /v1/observer/challenge/:id
 */
export function useChallengeDetail(challengeId: string) {
  return useQuery({
    queryKey: observerKeys.challenge(challengeId),
    queryFn: async () => {
      const response = await fetchApi<ChallengeDetailApiResponse>(
        `/v1/observer/challenge/${challengeId}`
      );
      // Transform to frontend format
      return {
        challengeId: response.challengeId,
        lockId: response.lockId,
        challenger: response.challenger,
        fraudProofHash: response.fraudProofHash,
        bond: response.bond,
        status: response.status,
        submittedAt: response.submittedAt,
        defenseDeadline: response.defenseDeadline,
        defense: response.defense,
        resolution: response.resolution,
        timeline: response.timeline,
      };
    },
    enabled: !!challengeId,
    staleTime: 30_000,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Submit a challenge against a pending unlock
 * Endpoint: POST /v1/observer/challenge
 *
 * Requirements (from backend):
 * - Bond required: MAX(0.1 ETH, amount × 1%)
 * - Defense period: 48 hours
 */
export function useSubmitChallengeV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      lockId: string;
      challenger: string;
      fraudProof: string;
      bond: string;
      reason: string;
    }) => {
      const response = await fetchApi<SubmitChallengeApiResponse>(
        '/v1/observer/challenge',
        {
          method: 'POST',
          body: JSON.stringify({
            lockId: data.lockId,
            challenger: data.challenger,
            fraudProof: data.fraudProof,
            bond: data.bond,
            reason: data.reason,
          } as SubmitChallengeApiRequest),
        }
      );
      return {
        challengeId: response.challengeId,
        lockId: response.lockId,
        fraudProofHash: response.fraudProofHash,
        bond: response.bond,
        defenseDeadline: response.defenseDeadline,
        status: response.status,
        estimatedReward: response.estimatedReward,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.activeChallenges() });
      queryClient.invalidateQueries({ queryKey: observerKeys.pendingUnlocks() });
      queryClient.invalidateQueries({ queryKey: observerKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: observerKeys.stats() });
    },
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useSubmitChallengeV2 instead
 */
export function useSubmitChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { unlockId: string; reason: string; bondAmount: number }) => {
      return fetchApi<{ challengeId: string }>('/api/observer/challenges', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.activeChallenges() });
      queryClient.invalidateQueries({ queryKey: observerKeys.pendingUnlocks() });
      queryClient.invalidateQueries({ queryKey: observerKeys.stats() });
    },
  });
}

/**
 * Claim accumulated earnings from successful challenges
 * Endpoint: POST /v1/observer/claim-earnings
 */
export function useClaimObserverEarnings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      observer: string;
      earningIds?: string[];
    }) => {
      const response = await fetchApi<ClaimEarningsApiResponse>(
        '/v1/observer/claim-earnings',
        {
          method: 'POST',
          body: JSON.stringify({
            observer: data.observer,
            earningIds: data.earningIds,
          } as ClaimEarningsApiRequest),
        }
      );
      return {
        claimId: response.claimId,
        amountClaimed: response.amountClaimed,
        earningsClaimed: response.earningsClaimed,
        txHash: response.txHash,
        status: response.status,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.earnings() });
      queryClient.invalidateQueries({ queryKey: observerKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: observerKeys.stats() });
    },
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useClaimObserverEarnings instead
 */
export function useClaimEarnings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: string) => {
      return fetchApi('/api/observer/earnings/claim', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.earnings() });
      queryClient.invalidateQueries({ queryKey: observerKeys.stats() });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<ObserverSettings>) => {
      return fetchApi('/api/observer/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.settings() });
    },
  });
}

// ==================== REGISTRATION HOOKS ====================

/**
 * Register a new observer
 * Endpoint: POST /v1/observer/register
 *
 * Observers monitor pending unlocks and can submit fraud challenges.
 * Registration requires admin approval before the observer becomes active.
 */
export function useObserverRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      operatorAddr: string;
      stakeAmount?: string;
    }) => {
      const response = await fetchApi<ObserverRegisterApiResponse>(
        '/v1/observer/register',
        {
          method: 'POST',
          body: JSON.stringify({
            operator_addr: data.operatorAddr,
            stake_amount: data.stakeAmount,
          } as ObserverRegisterApiRequest),
        }
      );

      // Store observer ID in localStorage for future requests
      setObserverId(response.observer_id);

      return {
        observerId: response.observer_id,
        status: response.status,
        operatorAddr: response.operator_addr,
        registeredAt: response.registered_at,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.all });
    },
  });
}

/**
 * Get observer registration status
 * Uses locally stored observer ID
 *
 * Note: This is a derived hook that checks registration status
 * based on the dashboard endpoint or a dedicated status endpoint
 */
export function useObserverRegistrationStatus() {
  const observerId = getObserverId();

  return useQuery({
    queryKey: observerKeys.registration(observerId || ''),
    queryFn: async () => {
      if (!observerId) {
        return { isRegistered: false, status: null };
      }

      try {
        // Try to fetch dashboard - if successful, observer is registered
        const response = await fetchApi<ObserverDashboardApiResponse>(
          '/v1/observer/dashboard'
        );
        return {
          isRegistered: true,
          status: 'active' as const,
          data: response,
        };
      } catch {
        // If dashboard fails, observer might be pending or not registered
        return {
          isRegistered: true,
          status: 'pending_approval' as const,
          data: null,
        };
      }
    },
    enabled: !!observerId,
    staleTime: 60_000,
  });
}

/**
 * Check if user has an existing observer registration
 */
export function useIsObserverRegistered() {
  return {
    isRegistered: !!getObserverId(),
    observerId: getObserverId(),
  };
}
