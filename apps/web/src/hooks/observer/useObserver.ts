/**
 * Observer Portal React Query Hooks
 *
 * Provides data fetching hooks for Observer Portal components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
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

// ==================== QUERY KEY FACTORY ====================

export const observerKeys = {
  all: ['observer'] as const,
  data: () => [...observerKeys.all, 'data'] as const,
  pendingUnlocks: () => [...observerKeys.all, 'pendingUnlocks'] as const,
  suspicious: () => [...observerKeys.all, 'suspicious'] as const,
  activeChallenges: () => [...observerKeys.all, 'activeChallenges'] as const,
  challengeHistory: () => [...observerKeys.all, 'challengeHistory'] as const,
  stats: () => [...observerKeys.all, 'stats'] as const,
  earnings: () => [...observerKeys.all, 'earnings'] as const,
  settings: () => [...observerKeys.all, 'settings'] as const,
  challengeStats: () => [...observerKeys.all, 'challengeStats'] as const,
  stake: () => [...observerKeys.all, 'stake'] as const,
};

// ==================== RESPONSE TYPES ====================

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

export function usePendingUnlocks() {
  return useQuery({
    queryKey: observerKeys.pendingUnlocks(),
    queryFn: async () => {
      return fetchApi<PendingUnlocksResponse>('/api/observer/pending-unlocks');
    },
    staleTime: 15_000, // Refresh frequently for real-time monitoring
  });
}

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

// ==================== MUTATION HOOKS ====================

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
