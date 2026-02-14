'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  QSHubStats,
  QSHubProposal,
  QSHubRewards,
  QSHubDelegate,
  ProposalDetail,
  CouncilMember,
  StakeLockPosition,
  VoteRecord,
} from '@/lib/api/qs-hub/types';

// =============================================================================
// API Client
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api-proxy';

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

export const qsHubKeys = {
  all: ['qs-hub'] as const,
  stats: () => [...qsHubKeys.all, 'stats'] as const,
  proposals: () => [...qsHubKeys.all, 'proposals'] as const,
  proposalsList: () => [...qsHubKeys.all, 'proposals-list'] as const,
  proposal: (id: string) => [...qsHubKeys.all, 'proposal', id] as const,
  rewards: () => [...qsHubKeys.all, 'rewards'] as const,
  delegates: () => [...qsHubKeys.all, 'delegates'] as const,
  council: () => [...qsHubKeys.all, 'council'] as const,
  stakePositions: () => [...qsHubKeys.all, 'stake-positions'] as const,
  balance: () => [...qsHubKeys.all, 'balance'] as const,
  voteHistory: () => [...qsHubKeys.all, 'vote-history'] as const,
};

// =============================================================================
// Hooks - Dashboard
// =============================================================================

export function useQSHubStats() {
  return useQuery({
    queryKey: qsHubKeys.stats(),
    queryFn: async () => {
      return await fetchApi<QSHubStats>('/v1/qs-hub/dashboard/stats');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useQSHubProposals() {
  return useQuery({
    queryKey: qsHubKeys.proposals(),
    queryFn: async () => {
      return await fetchApi<QSHubProposal[]>('/v1/qs-hub/proposals/active');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useQSHubRewards() {
  return useQuery({
    queryKey: qsHubKeys.rewards(),
    queryFn: async () => {
      return await fetchApi<QSHubRewards>('/v1/qs-hub/rewards');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useQSHubDelegates() {
  return useQuery({
    queryKey: qsHubKeys.delegates(),
    queryFn: async () => {
      return await fetchApi<QSHubDelegate[]>('/v1/qs-hub/delegates');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Proposals
// =============================================================================

export function useProposalsList() {
  return useQuery({
    queryKey: qsHubKeys.proposalsList(),
    queryFn: async () => {
      return await fetchApi<ProposalDetail[]>('/v1/qs-hub/proposals');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useProposalDetail(proposalId: string) {
  return useQuery({
    queryKey: qsHubKeys.proposal(proposalId),
    queryFn: async () => {
      return await fetchApi<ProposalDetail>(`/v1/qs-hub/proposals/${proposalId}`);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Council
// =============================================================================

export function useCouncil() {
  return useQuery({
    queryKey: qsHubKeys.council(),
    queryFn: async () => {
      return await fetchApi<CouncilMember[]>('/v1/qs-hub/council');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Staking
// =============================================================================

export function useStakePositions() {
  return useQuery({
    queryKey: qsHubKeys.stakePositions(),
    queryFn: async () => {
      return await fetchApi<StakeLockPosition[]>('/v1/qs-hub/stakes');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useQSBalance() {
  return useQuery({
    queryKey: qsHubKeys.balance(),
    queryFn: async () => {
      const data = await fetchApi<{ balance: number }>('/v1/qs-hub/balance');
      return data.balance;
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Hooks - Vote History
// =============================================================================

export function useVoteHistory() {
  return useQuery({
    queryKey: qsHubKeys.voteHistory(),
    queryFn: async () => {
      return await fetchApi<VoteRecord[]>('/v1/qs-hub/votes/history');
    },
    staleTime: 30_000,
    retry: 2,
  });
}

// =============================================================================
// Mutations
// =============================================================================

interface CreateStakeParams {
  amount: number;
  duration: number;
}

export function useCreateStake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateStakeParams) => {
      return postApi<StakeLockPosition>('/v1/qs-hub/stakes', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qsHubKeys.stakePositions() });
      queryClient.invalidateQueries({ queryKey: qsHubKeys.stats() });
      queryClient.invalidateQueries({ queryKey: qsHubKeys.balance() });
    },
  });
}

interface ExtendStakeParams {
  stakeId: string;
  additionalDuration: number;
}

export function useExtendStake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ExtendStakeParams) => {
      return postApi<StakeLockPosition>(`/v1/qs-hub/stakes/${params.stakeId}/extend`, {
        additionalDuration: params.additionalDuration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qsHubKeys.stakePositions() });
      queryClient.invalidateQueries({ queryKey: qsHubKeys.stats() });
    },
  });
}

interface VoteParams {
  proposalId: string;
  vote: 'for' | 'against' | 'abstain';
}

export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VoteParams) => {
      return postApi<{ success: boolean }>(`/v1/qs-hub/proposals/${params.proposalId}/vote`, {
        vote: params.vote,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qsHubKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: qsHubKeys.proposalsList() });
      queryClient.invalidateQueries({ queryKey: qsHubKeys.voteHistory() });
    },
  });
}

export function useClaimRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return postApi<{ claimed: number }>('/v1/qs-hub/rewards/claim');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qsHubKeys.rewards() });
      queryClient.invalidateQueries({ queryKey: qsHubKeys.stats() });
    },
  });
}
