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
} from '@/lib/api/token-hub/types';

// =============================================================================
// API Client
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

// User address storage key - shared with consumer hooks
const USER_ADDRESS_KEY = 'quantum_shield_user_address';

function getUserAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ADDRESS_KEY);
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const userAddress = getUserAddress();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userAddress) {
    headers['X-User-Address'] = userAddress;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { headers });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

async function postApi<T>(endpoint: string, body?: unknown): Promise<T> {
  const userAddress = getUserAddress();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userAddress) {
    headers['X-User-Address'] = userAddress;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
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
      const address = getUserAddress();
      const url = address
        ? `/v1/token-hub/dashboard?address=${address}`
        : '/v1/token-hub/dashboard';
      return await fetchApi<TokenHubStats>(url);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useDelegations() {
  return useQuery({
    queryKey: tokenHubKeys.delegations(),
    queryFn: async () => {
      const address = getUserAddress();
      const url = address
        ? `/v1/token-hub/my-delegations?address=${address}`
        : '/v1/token-hub/my-delegations';
      return await fetchApi<Delegation[]>(url);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useDashboardRewards() {
  return useQuery({
    queryKey: tokenHubKeys.dashboardRewards(),
    queryFn: async () => {
      return await fetchApi<DashboardRewards>('/v1/token-hub/rewards/summary');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Rewards Page
// =============================================================================

export function useRewardsSummary() {
  return useQuery({
    queryKey: tokenHubKeys.rewardsSummary(),
    queryFn: async () => {
      const address = getUserAddress();
      const url = address
        ? `/v1/token-hub/rewards?address=${address}`
        : '/v1/token-hub/rewards';
      return await fetchApi<RewardsSummary>(url);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useRewardsHistory() {
  return useQuery({
    queryKey: tokenHubKeys.rewardsHistory(),
    queryFn: async () => {
      const address = getUserAddress();
      const url = address
        ? `/v1/token-hub/rewards/history?address=${address}`
        : '/v1/token-hub/rewards/history';
      return await fetchApi<RewardsHistory[]>(url);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useRewardsBreakdown() {
  return useQuery({
    queryKey: tokenHubKeys.rewardsBreakdown(),
    queryFn: async () => {
      return await fetchApi<RewardsBreakdown>('/v1/token-hub/rewards/breakdown');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useEpoch() {
  return useQuery({
    queryKey: tokenHubKeys.epoch(),
    queryFn: async () => {
      return await fetchApi<EpochInfo>('/v1/token-hub/epoch');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Locks
// =============================================================================

export function useLocks() {
  return useQuery({
    queryKey: tokenHubKeys.locks(),
    queryFn: async () => {
      const address = getUserAddress();
      const url = address
        ? `/v1/token-hub/locks?address=${address}`
        : '/v1/token-hub/locks';
      return await fetchApi<Lock[]>(url);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Lock Page
// =============================================================================

export function useBalance() {
  return useQuery({
    queryKey: tokenHubKeys.balance(),
    queryFn: async () => {
      const data = await fetchApi<{ balance: number }>('/v1/token-hub/balance');
      return data.balance;
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Unlock Page
// =============================================================================

export function useLockedPositions() {
  return useQuery({
    queryKey: tokenHubKeys.lockedPositions(),
    queryFn: async () => {
      const address = getUserAddress();
      const url = address
        ? `/v1/token-hub/locked-positions?address=${address}`
        : '/v1/token-hub/locked-positions';
      return await fetchApi<LockedPosition[]>(url);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Delegate Page
// =============================================================================

export function useUserDelegation() {
  return useQuery({
    queryKey: tokenHubKeys.userDelegation(),
    queryFn: async () => {
      return await fetchApi<UserDelegation>('/v1/token-hub/user-delegation');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useDelegateList() {
  return useQuery({
    queryKey: tokenHubKeys.delegates(),
    queryFn: async () => {
      return await fetchApi<DelegateInfo[]>('/v1/token-hub/delegates');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Rewards Claim Page
// =============================================================================

export function useClaimableRewards() {
  return useQuery({
    queryKey: tokenHubKeys.claimable(),
    queryFn: async () => {
      const address = getUserAddress();
      const url = address
        ? `/v1/token-hub/rewards/claimable?address=${address}`
        : '/v1/token-hub/rewards/claimable';
      return await fetchApi<ClaimableRewards>(url);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useExtendedRewardsHistory() {
  return useQuery({
    queryKey: tokenHubKeys.extendedHistory(),
    queryFn: async () => {
      return await fetchApi<ExtendedRewardsHistory[]>('/v1/token-hub/rewards/history/extended');
    },
    staleTime: 30_000,
    retry: 2,
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
      return postApi<Lock>('/v1/token-hub/locks', params);
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
      return postApi<Lock>(`/v1/token-hub/locks/${params.lockId}/extend`, {
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
      return postApi<Delegation>('/v1/token-hub/delegate', params);
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
      return postApi<{ claimed: number }>('/v1/token-hub/rewards/claim');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.rewardsSummary() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.dashboardRewards() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.rewardsHistory() });
      queryClient.invalidateQueries({ queryKey: tokenHubKeys.stats() });
    },
  });
}
