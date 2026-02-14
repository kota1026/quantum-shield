/**
 * Observer Portal React Query Hooks
 *
 * Provides data fetching hooks for Observer Portal components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 *
 * API Endpoints (Backend: /v1/observer):
 * - POST /v1/observer/register - Register as observer
 * - GET /v1/observer/dashboard - Observer dashboard
 * - GET /v1/observer/pending-unlocks - Pending unlocks to monitor
 * - GET /v1/observer/suspicious-txs - Suspicious transactions
 * - GET /v1/observer/history - Challenge history
 * - POST /v1/observer/challenge - Submit challenge
 * - GET /v1/observer/challenge/:id - Challenge details
 * - GET /v1/observer/earnings - Earnings summary
 * - POST /v1/observer/claim-earnings - Claim earnings
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ==================== QUERY KEY FACTORY ====================

export const observerKeys = {
  all: ["observer"] as const,
  dashboard: () => [...observerKeys.all, "dashboard"] as const,
  pendingUnlocks: () => [...observerKeys.all, "pendingUnlocks"] as const,
  suspiciousTxs: () => [...observerKeys.all, "suspiciousTxs"] as const,
  history: () => [...observerKeys.all, "history"] as const,
  challenge: (challengeId: string) => [...observerKeys.all, "challenge", challengeId] as const,
  earnings: () => [...observerKeys.all, "earnings"] as const,
};

// ==================== API CONFIG ====================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api-proxy";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }

  return res.json();
}

// ==================== DASHBOARD HOOKS ====================

export function useObserverDashboard() {
  return useQuery({
    queryKey: observerKeys.dashboard(),
    queryFn: async () => {
      const response = await fetchApi<{
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
      }>("/v1/observer/dashboard");

      return {
        totalEarnings: response.totalEarnings,
        unclaimedEarnings: response.unclaimedEarnings,
        totalChallenges: response.totalChallenges,
        successfulChallenges: response.successfulChallenges,
        successRate: response.successRate,
        pendingUnlocksCount: response.pendingUnlocksCount,
        activeChallenges: response.activeChallenges,
        recentActivity: response.recentActivity,
        stats: response.stats,
      };
    },
    staleTime: 30_000,
  });
}

// ==================== PENDING UNLOCKS HOOKS ====================

// Helper functions
function formatTimeRemaining(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function suspicionLevelToScore(level: "low" | "medium" | "high" | "critical"): number {
  switch (level) {
    case 'low': return 25;
    case 'medium': return 50;
    case 'high': return 75;
    case 'critical': return 95;
  }
}

export function usePendingUnlocks(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...observerKeys.pendingUnlocks(), params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.pageSize) queryParams.set("page_size", params.pageSize.toString());

      const url = `/v1/observer/pending-unlocks${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
      const response = await fetchApi<{
        unlocks: Array<{
          lockId: string;
          owner: string;
          amount: string;
          token: string;
          unlockType: "normal" | "emergency";
          unlockRequestedAt: number;
          timeRemaining: number;
          suspicionLevel: "low" | "medium" | "high" | "critical";
          riskIndicators: string[];
          canChallenge: boolean;
        }>;
        total: number;
        page: number;
        pageSize: number;
      }>(url);

      // Transform to match component expectations
      return {
        items: response.unlocks.map(u => ({
          id: u.lockId,
          address: u.owner,
          amount: `${u.amount} ${u.token}`,
          type: u.unlockType,
          timeRemaining: formatTimeRemaining(u.timeRemaining),
          riskScore: suspicionLevelToScore(u.suspicionLevel),
          status: u.canChallenge ? 'monitoring' as const : 'pending' as const,
        })),
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
      };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ==================== SUSPICIOUS TXS HOOKS ====================

export function useSuspiciousTxs(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...observerKeys.suspiciousTxs(), params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.pageSize) queryParams.set("page_size", params.pageSize.toString());

      const url = `/v1/observer/suspicious-txs${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
      const response = await fetchApi<{
        transactions: Array<{
          lockId: string;
          owner: string;
          amount: string;
          suspicionLevel: "low" | "medium" | "high" | "critical";
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
      }>(url);

      return response;
    },
    staleTime: 30_000,
  });
}

// ==================== HISTORY HOOKS ====================

export function useObserverHistory(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...observerKeys.history(), params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.pageSize) queryParams.set("page_size", params.pageSize.toString());

      const url = `/v1/observer/history${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
      const response = await fetchApi<{
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
      }>(url);

      return response;
    },
    staleTime: 60_000,
  });
}

// ==================== CHALLENGE HOOKS ====================

export function useChallengeDetail(challengeId: string) {
  return useQuery({
    queryKey: observerKeys.challenge(challengeId),
    queryFn: async () => {
      const response = await fetchApi<{
        challengeId: string;
        lockId: string;
        challenger: string;
        fraudProofHash: string;
        bond: string;
        status: "pending" | "under_review" | "succeeded" | "failed" | "expired";
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
      }>(`/v1/observer/challenge/${challengeId}`);

      return response;
    },
    enabled: !!challengeId,
    staleTime: 30_000,
  });
}

export function useSubmitChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      lockId: string;
      challenger: string;
      fraudProof: string;
      bond: string;
      reason: string;
    }) => {
      return fetchApi<{
        challengeId: string;
        lockId: string;
        fraudProofHash: string;
        bond: string;
        defenseDeadline: number;
        status: string;
        estimatedReward: string;
      }>("/v1/observer/challenge", {
        method: "POST",
        body: JSON.stringify({
          lockId: data.lockId,
          challenger: data.challenger,
          fraudProof: data.fraudProof,
          bond: data.bond,
          reason: data.reason,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: observerKeys.pendingUnlocks() });
      queryClient.invalidateQueries({ queryKey: observerKeys.history() });
    },
  });
}

// ==================== EARNINGS HOOKS ====================

export function useObserverEarnings() {
  return useQuery({
    queryKey: observerKeys.earnings(),
    queryFn: async () => {
      const response = await fetchApi<{
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
      }>("/v1/observer/earnings");

      return response;
    },
    staleTime: 60_000,
  });
}

export function useClaimEarnings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      observer: string;
      earningIds?: string[];
    }) => {
      return fetchApi<{
        claimId: string;
        amountClaimed: string;
        earningsClaimed: number;
        txHash: string;
        status: string;
      }>("/v1/observer/claim-earnings", {
        method: "POST",
        body: JSON.stringify({
          observer: data.observer,
          earningIds: data.earningIds,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: observerKeys.earnings() });
    },
  });
}

// ==================== REGISTRATION HOOKS ====================

export function useRegisterObserver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      operatorAddr: string;
      stakeAmount: string;
    }) => {
      return fetchApi<{
        observer_id: string;
        status: string;
        operator_addr: string;
        registered_at: number;
      }>("/v1/observer/register", {
        method: "POST",
        body: JSON.stringify({
          operator_addr: data.operatorAddr,
          stake_amount: data.stakeAmount,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.all });
    },
  });
}

// ==================== ALIAS HOOKS (for component compatibility) ====================

/**
 * Alias for useObserverDashboard - provides observer registration data
 */
export function useObserverData() {
  return useQuery({
    queryKey: [...observerKeys.all, "data"],
    queryFn: async () => {
      const response = await fetchApi<{
        observerId: string;
        registrationDate: string;
        practicePeriodMonths: number;
        status: string;
        stakeAmount: string;
      }>("/v1/observer/profile");

      return {
        observerId: response.observerId,
        registrationDate: response.registrationDate,
        practicePeriodMonths: response.practicePeriodMonths,
        status: response.status,
        stakeAmount: response.stakeAmount,
      };
    },
    staleTime: 60_000,
  });
}

/**
 * Alias for useSuspiciousTxs - transforms to match component expectations
 */
export function useSuspiciousTransactions(params?: { page?: number; pageSize?: number }) {
  const result = useSuspiciousTxs(params);
  return {
    ...result,
    data: result.data ? result.data.transactions.map(tx => ({
      id: tx.lockId,
      address: tx.owner,
      amount: tx.amount,
      type: 'emergency' as const, // Default to emergency for suspicious
      riskLevel: tx.suspicionLevel === 'critical' ? 'high' as const : tx.suspicionLevel as 'high' | 'medium' | 'low',
      score: tx.riskAnalysis.score,
      reason: tx.riskAnalysis.summary,
    })) : undefined,
  };
}

/**
 * Get active/ongoing challenges - transforms to match component expectations
 */
export function useActiveChallenges() {
  return useQuery({
    queryKey: [...observerKeys.all, "activeChallenges"],
    queryFn: async () => {
      const response = await fetchApi<{
        challenges: Array<{
          challengeId: string;
          lockId: string;
          targetAddress: string;
          amount: string;
          status: "pending" | "defense" | "review";
          countdown: string;
          progress: number;
          submittedAt: number;
        }>;
        total: number;
      }>("/v1/observer/challenges/active");

      // Transform to match component expectations
      // Note: 'review' maps to 'judgment' for component compatibility
      return response.challenges.map(c => ({
        id: c.challengeId,
        challengeId: c.challengeId,
        targetAddress: c.targetAddress,
        amount: c.amount,
        status: (c.status === 'review' ? 'judgment' : c.status) as 'pending' | 'defense' | 'judgment',
        countdown: c.countdown,
        progress: c.progress,
      }));
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Alias for useObserverHistory - challenge history
 * Transforms to return array directly for component compatibility
 */
export function useChallengeHistory(params?: { page?: number; pageSize?: number }) {
  const result = useObserverHistory(params);
  return {
    ...result,
    data: result.data ? result.data.history.map(h => ({
      id: h.id,
      type: h.type,
      targetAddress: h.lockId, // Use lockId as targetAddress
      amount: h.amount,
      date: new Date(h.timestamp * 1000).toLocaleDateString('ja-JP'),
      result: h.status as 'inProgress' | 'won' | 'lost',
      rewardPenalty: null,
    })) : undefined,
  };
}

/**
 * Observer settings hook - returns all settings including profile and security
 */
export function useObserverSettings() {
  return useQuery({
    queryKey: [...observerKeys.all, "settings"],
    queryFn: async () => {
      const response = await fetchApi<{
        profile: {
          observerId: string;
          walletAddress: string;
          email: string;
          joinedDate: string;
          totalChallenges: number;
        };
        notifications: {
          email: boolean;
          push: boolean;
          suspiciousAlerts: boolean;
          challengeUpdates: boolean;
        };
        autoChallenge: {
          enabled: boolean;
          minRiskScore: number;
          maxBondAmount: string;
        };
        displayPreferences: {
          theme: "light" | "dark" | "system";
          language: string;
          timezone: string;
        };
        security: {
          lastLogin: string;
          loginHistory: number;
        };
      }>("/v1/observer/settings");

      return response;
    },
    staleTime: 300_000,
  });
}

/**
 * Update observer settings
 */
export function useUpdateObserverSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      notifications?: {
        email?: boolean;
        push?: boolean;
        suspiciousAlerts?: boolean;
        challengeUpdates?: boolean;
      };
      autoChallenge?: {
        enabled?: boolean;
        minRiskScore?: number;
        maxBondAmount?: string;
      };
      displayPreferences?: {
        theme?: "light" | "dark" | "system";
        language?: string;
        timezone?: string;
      };
    }) => {
      return fetchApi<{ success: boolean }>("/v1/observer/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...observerKeys.all, "settings"] });
    },
  });
}

