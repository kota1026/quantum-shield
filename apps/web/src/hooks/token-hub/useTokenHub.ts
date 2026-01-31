'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TokenHubStats,
  Delegation,
  DashboardRewards,
  RewardsSummary,
  RewardsHistory,
  RewardsBreakdown,
  EpochInfo,
  Lock,
  LockedPosition,
  UserDelegation,
  DelegateInfo,
  ClaimableRewards,
  ExtendedRewardsHistory,
} from '@/lib/api/token-hub/mock';
import {
  MOCK_STATS,
  MOCK_DELEGATIONS,
  MOCK_DASHBOARD_REWARDS,
  MOCK_REWARDS_SUMMARY,
  MOCK_REWARDS_HISTORY,
  MOCK_REWARDS_BREAKDOWN,
  MOCK_EPOCH,
  MOCK_LOCKS,
  MOCK_BALANCE,
  MOCK_LOCKED_POSITIONS,
  MOCK_USER_DELEGATION,
  MOCK_DELEGATES,
  MOCK_CLAIMABLE,
  MOCK_EXTENDED_HISTORY,
} from '@/lib/api/token-hub/mock';

// =============================================================================
// API Client
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

async function postApi<T>(endpoint: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

// =============================================================================
// Query Keys
// =============================================================================

export const tokenHubKeys = {
  all: ['token-hub'] as const,
  stats: () => [...tokenHubKeys.all, 'stats'] as const,
  delegations: () => [...tokenHubKeys.all, 'delegations'] as const,
  dashboardRewards: () => [...tokenHubKeys.all, 'dashboard-rewards'] as const,
  rewardsSummary: () => [...tokenHubKeys.all, 'rewards-summary'] as const,
  rewardsHistory: () => [...tokenHubKeys.all, 'rewards-history'] as const,
  rewardsBreakdown: () => [...tokenHubKeys.all, 'rewards-breakdown'] as const,
  epoch: () => [...tokenHubKeys.all, 'epoch'] as const,
  locks: () => [...tokenHubKeys.all, 'locks'] as const,
  balance: () => [...tokenHubKeys.all, 'balance'] as const,
  lockedPositions: () => [...tokenHubKeys.all, 'locked-positions'] as const,
  userDelegation: () => [...tokenHubKeys.all, 'user-delegation'] as const,
  delegates: () => [...tokenHubKeys.all, 'delegates'] as const,
  claimable: () => [...tokenHubKeys.all, 'claimable'] as const,
  extendedHistory: () => [...tokenHubKeys.all, 'extended-history'] as const,
};

// =============================================================================
// Hooks - Dashboard
// =============================================================================

export function useTokenHubStats() {
  return useQuery({
    queryKey: tokenHubKeys.stats(),
    queryFn: async () => {
      try {
        return await fetchApi<TokenHubStats>('/api/token-hub/dashboard');
      } catch {
        // Fallback to mock data in development
        return MOCK_STATS;
      }
    },
    staleTime: 30_000,
  });
}

export function useDelegations() {
  return useQuery({
    queryKey: tokenHubKeys.delegations(),
    queryFn: async () => {
      try {
        return await fetchApi<Delegation[]>('/api/token-hub/my-delegations');
      } catch {
        return MOCK_DELEGATIONS;
      }
    },
    staleTime: 30_000,
  });
}

export function useDashboardRewards() {
  return useQuery({
    queryKey: tokenHubKeys.dashboardRewards(),
    queryFn: async () => {
      try {
        return await fetchApi<DashboardRewards>('/api/token-hub/rewards/summary');
      } catch {
        return MOCK_DASHBOARD_REWARDS;
      }
    },
    staleTime: 30_000,
  });
}

// =============================================================================
// Hooks - Rewards Page
// =============================================================================

export function useRewardsSummary() {
  return useQuery({
    queryKey: tokenHubKeys.rewardsSummary(),
    queryFn: async () => {
      try {
        return await fetchApi<RewardsSummary>('/api/token-hub/rewards');
      } catch {
        return MOCK_REWARDS_SUMMARY;
      }
    },
    staleTime: 30_000,
  });
}

export function useRewardsHistory() {
  return useQuery({
    queryKey: tokenHubKeys.rewardsHistory(),
    queryFn: async () => {
      try {
        return await fetchApi<RewardsHistory[]>('/api/token-hub/rewards/history');
      } catch {
        return MOCK_REWARDS_HISTORY;
      }
    },
    staleTime: 30_000,
  });
}

export function useRewardsBreakdown() {
  return useQuery({
    queryKey: tokenHubKeys.rewardsBreakdown(),
    queryFn: async () => {
      try {
        return await fetchApi<RewardsBreakdown>('/api/token-hub/rewards/breakdown');
      } catch {
        return MOCK_REWARDS_BREAKDOWN;
      }
    },
    staleTime: 30_000,
  });
}

export function useEpoch() {
  return useQuery({
    queryKey: tokenHubKeys.epoch(),
    queryFn: async () => {
      try {
        return await fetchApi<EpochInfo>('/api/token-hub/epoch');
      } catch {
        return MOCK_EPOCH;
      }
    },
    staleTime: 30_000,
  });
}

// =============================================================================
// Hooks - Locks
// =============================================================================

export function useLocks() {
  return useQuery({
    queryKey: tokenHubKeys.locks(),
    queryFn: async () => {
      try {
        return await fetchApi<Lock[]>('/api/token-hub/locks');
      } catch {
        return MOCK_LOCKS;
      }
    },
    staleTime: 30_000,
  });
}

// =============================================================================
// Hooks - Lock Page
// =============================================================================

export function useBalance() {
  return useQuery({
    queryKey: tokenHubKeys.balance(),
    queryFn: async () => {
      try {
        const data = await fetchApi<{ balance: number }>('/api/token-hub/balance');
        return data.balance;
      } catch {
        return MOCK_BALANCE;
      }
    },
    staleTime: 30_000,
  });
}

// =============================================================================
// Hooks - Unlock Page
// =============================================================================

export function useLockedPositions() {
  return useQuery({
    queryKey: tokenHubKeys.lockedPositions(),
    queryFn: async () => {
      try {
        return await fetchApi<LockedPosition[]>('/api/token-hub/locked-positions');
      } catch {
        return MOCK_LOCKED_POSITIONS;
      }
    },
    staleTime: 30_000,
  });
}

// =============================================================================
// Hooks - Delegate Page
// =============================================================================

export function useUserDelegation() {
  return useQuery({
    queryKey: tokenHubKeys.userDelegation(),
    queryFn: async () => {
      try {
        return await fetchApi<UserDelegation>('/api/token-hub/user-delegation');
      } catch {
        return MOCK_USER_DELEGATION;
      }
    },
    staleTime: 30_000,
  });
}

export function useDelegateList() {
  return useQuery({
    queryKey: tokenHubKeys.delegates(),
    queryFn: async () => {
      try {
        return await fetchApi<DelegateInfo[]>('/api/token-hub/delegates');
      } catch {
        return MOCK_DELEGATES;
      }
    },
    staleTime: 30_000,
  });
}

// =============================================================================
// Hooks - Rewards Claim Page
// =============================================================================

export function useClaimableRewards() {
  return useQuery({
    queryKey: tokenHubKeys.claimable(),
    queryFn: async () => {
      try {
        return await fetchApi<ClaimableRewards>('/api/token-hub/rewards/claimable');
      } catch {
        return MOCK_CLAIMABLE;
      }
    },
    staleTime: 30_000,
  });
}

export function useExtendedRewardsHistory() {
  return useQuery({
    queryKey: tokenHubKeys.extendedHistory(),
    queryFn: async () => {
      try {
        return await fetchApi<ExtendedRewardsHistory[]>('/api/token-hub/rewards/history/extended');
      } catch {
        return MOCK_EXTENDED_HISTORY;
      }
    },
    staleTime: 30_000,
  });
}

// =============================================================================
// Mutations
// =============================================================================

interface CreateLockParams {
  amount: number;
  duration: number; // months
}

export function useCreateLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateLockParams) => {
      return postApi<Lock>('/api/token-hub/locks', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.locks() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.stats() });
    },
  });
}

interface ExtendLockParams {
  lockId: string;
  additionalDuration: number; // months
}

export function useExtendLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ExtendLockParams) => {
      return postApi<Lock>(`/api/token-hub/locks/${params.lockId}/extend`, {
        additionalDuration: params.additionalDuration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.locks() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.stats() });
    },
  });
}

interface DelegatePowerParams {
  delegateId: string;
  amount: number;
}

export function useDelegatePower() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DelegatePowerParams) => {
      return postApi<Delegation>('/api/token-hub/delegate', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.delegations() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.stats() });
    },
  });
}

export function useClaimRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return postApi<{ claimed: number }>('/api/token-hub/rewards/claim');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.rewardsSummary() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.dashboardRewards() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.rewardsHistory() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.stats() });
    },
  });
}
