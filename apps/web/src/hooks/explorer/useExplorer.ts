import { useQuery } from '@tanstack/react-query';
import type {
  ExplorerStats,
  RecentLock,
  RecentUnlock,
  ActiveChallenge,
  LockDetail,
  UnlockDetail,
  ChallengeDetail,
  ChallengeStats,
  ProverSummary,
  ProverStats,
  TvlDataPoint,
  VolumeDataPoint,
  ProverPerformance,
  AnalyticsStats,
  LockStatusDistribution,
  UnlockTypeDistribution,
} from '@/lib/api/explorer/types';

// API Base
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api-proxy';

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

// Query key factory
export const explorerKeys = {
  all: ['explorer'] as const,
  stats: () => [...explorerKeys.all, 'stats'] as const,
  recentLocks: () => [...explorerKeys.all, 'recentLocks'] as const,
  recentUnlocks: () => [...explorerKeys.all, 'recentUnlocks'] as const,
  activeChallenges: () => [...explorerKeys.all, 'activeChallenges'] as const,
  locks: () => [...explorerKeys.all, 'locks'] as const,
  lock: (id: string) => [...explorerKeys.locks(), id] as const,
  unlocks: () => [...explorerKeys.all, 'unlocks'] as const,
  unlock: (id: string) => [...explorerKeys.unlocks(), id] as const,
  challenges: () => [...explorerKeys.all, 'challenges'] as const,
  challenge: (id: string) => [...explorerKeys.challenges(), id] as const,
  challengeStats: () => [...explorerKeys.all, 'challengeStats'] as const,
  provers: () => [...explorerKeys.all, 'provers'] as const,
  prover: (id: string) => [...explorerKeys.provers(), id] as const,
  proverStats: () => [...explorerKeys.all, 'proverStats'] as const,
  analytics: () => [...explorerKeys.all, 'analytics'] as const,
  tvlData: (range: string) => [...explorerKeys.analytics(), 'tvl', range] as const,
  volumeData: (range: string) => [...explorerKeys.analytics(), 'volume', range] as const,
  proverPerformance: () => [...explorerKeys.analytics(), 'proverPerformance'] as const,
  analyticsStats: () => [...explorerKeys.analytics(), 'stats'] as const,
  lockDistribution: () => [...explorerKeys.analytics(), 'lockDistribution'] as const,
  unlockDistribution: () => [...explorerKeys.analytics(), 'unlockDistribution'] as const,
};

// ============ Overview Hooks ============

export function useExplorerStats() {
  return useQuery({
    queryKey: explorerKeys.stats(),
    queryFn: async () => {
      return fetchApi<ExplorerStats>('/v1/explorer/overview');
    },
    staleTime: 30_000,
  });
}

export function useRecentLocks() {
  return useQuery({
    queryKey: explorerKeys.recentLocks(),
    queryFn: async () => {
      return fetchApi<RecentLock[]>('/v1/explorer/locks/recent');
    },
    staleTime: 15_000,
  });
}

export function useRecentUnlocks() {
  return useQuery({
    queryKey: explorerKeys.recentUnlocks(),
    queryFn: async () => {
      return fetchApi<RecentUnlock[]>('/v1/explorer/unlocks/recent');
    },
    staleTime: 15_000,
  });
}

export function useActiveChallenges() {
  return useQuery({
    queryKey: explorerKeys.activeChallenges(),
    queryFn: async () => {
      return fetchApi<ActiveChallenge[]>('/v1/explorer/challenges/active');
    },
    staleTime: 15_000,
  });
}

// ============ Locks Hooks ============

export function useLocks(params?: {
  status?: string;
  sort?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...explorerKeys.locks(), params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== 'all') {
        searchParams.set('status', params.status);
      }
      if (params?.sort) {
        searchParams.set('sort', params.sort);
      }
      if (params?.search) {
        searchParams.set('search', params.search);
      }
      if (params?.page) {
        searchParams.set('page', params.page.toString());
      }
      if (params?.limit) {
        searchParams.set('limit', params.limit.toString());
      }
      const query = searchParams.toString();
      return fetchApi<{ locks: LockDetail[]; total: number }>(
        `/v1/explorer/locks${query ? `?${query}` : ''}`
      );
    },
    staleTime: 30_000,
  });
}

export function useLockDetail(id: string) {
  return useQuery({
    queryKey: explorerKeys.lock(id),
    queryFn: async () => {
      return fetchApi<LockDetail>(`/v1/explorer/locks/${id}`);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ============ Unlocks Hooks ============

export function useUnlocks(params?: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...explorerKeys.unlocks(), params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== 'all') {
        searchParams.set('status', params.status);
      }
      if (params?.type && params.type !== 'all') {
        searchParams.set('type', params.type);
      }
      if (params?.page) {
        searchParams.set('page', params.page.toString());
      }
      if (params?.limit) {
        searchParams.set('limit', params.limit.toString());
      }
      const query = searchParams.toString();
      return fetchApi<{ unlocks: UnlockDetail[]; total: number; pending: number; completed: number }>(
        `/v1/explorer/unlocks${query ? `?${query}` : ''}`
      );
    },
    staleTime: 30_000,
  });
}

export function useUnlockDetail(id: string) {
  return useQuery({
    queryKey: explorerKeys.unlock(id),
    queryFn: async () => {
      return fetchApi<UnlockDetail>(`/v1/explorer/unlocks/${id}`);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ============ Challenges Hooks ============

export function useChallengeStats() {
  return useQuery({
    queryKey: explorerKeys.challengeStats(),
    queryFn: async () => {
      return fetchApi<ChallengeStats>('/v1/explorer/challenges/stats');
    },
    staleTime: 30_000,
  });
}

export function useChallenges(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...explorerKeys.challenges(), params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== 'all') {
        searchParams.set('status', params.status);
      }
      if (params?.page) {
        searchParams.set('page', params.page.toString());
      }
      if (params?.limit) {
        searchParams.set('limit', params.limit.toString());
      }
      const query = searchParams.toString();
      return fetchApi<{ challenges: ChallengeDetail[]; total: number }>(
        `/v1/explorer/challenges${query ? `?${query}` : ''}`
      );
    },
    staleTime: 30_000,
  });
}

export function useChallengeDetail(id: string) {
  return useQuery({
    queryKey: explorerKeys.challenge(id),
    queryFn: async () => {
      return fetchApi<ChallengeDetail>(`/v1/explorer/challenges/${id}`);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ============ Provers Hooks ============

export function useProverStats() {
  return useQuery({
    queryKey: explorerKeys.proverStats(),
    queryFn: async () => {
      return fetchApi<ProverStats>('/v1/explorer/provers/stats');
    },
    staleTime: 30_000,
  });
}

export function useProvers() {
  return useQuery({
    queryKey: explorerKeys.provers(),
    queryFn: async () => {
      return fetchApi<ProverSummary[]>('/v1/explorer/provers');
    },
    staleTime: 30_000,
  });
}

export function useProverDetail(id: string) {
  return useQuery({
    queryKey: explorerKeys.prover(id),
    queryFn: async () => {
      return fetchApi<ProverSummary>(`/v1/explorer/provers/${id}`);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ============ Analytics Hooks ============

export function useAnalyticsStats() {
  return useQuery({
    queryKey: explorerKeys.analyticsStats(),
    queryFn: async () => {
      return fetchApi<AnalyticsStats>('/v1/explorer/analytics/stats');
    },
    staleTime: 60_000,
  });
}

export function useTvlData(range: string = '7d') {
  return useQuery({
    queryKey: explorerKeys.tvlData(range),
    queryFn: async () => {
      return fetchApi<TvlDataPoint[]>(`/v1/explorer/analytics/tvl?range=${range}`);
    },
    staleTime: 60_000,
  });
}

export function useVolumeData(range: string = '7d') {
  return useQuery({
    queryKey: explorerKeys.volumeData(range),
    queryFn: async () => {
      return fetchApi<VolumeDataPoint[]>(`/v1/explorer/analytics/volume?range=${range}`);
    },
    staleTime: 60_000,
  });
}

export function useProverPerformance() {
  return useQuery({
    queryKey: explorerKeys.proverPerformance(),
    queryFn: async () => {
      return fetchApi<ProverPerformance[]>('/v1/explorer/analytics/provers');
    },
    staleTime: 60_000,
  });
}

export function useLockDistribution() {
  return useQuery({
    queryKey: explorerKeys.lockDistribution(),
    queryFn: async () => {
      return fetchApi<LockStatusDistribution>('/v1/explorer/analytics/locks/distribution');
    },
    staleTime: 60_000,
  });
}

export function useUnlockDistribution() {
  return useQuery({
    queryKey: explorerKeys.unlockDistribution(),
    queryFn: async () => {
      return fetchApi<UnlockTypeDistribution>('/v1/explorer/analytics/unlocks/distribution');
    },
    staleTime: 60_000,
  });
}
