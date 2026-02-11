import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  GovernanceStats,
  VotingPowerBreakdown,
  Proposal,
  ProposalSummary,
  CouncilData,
  ActivityItem,
} from '@/lib/api/governance/types';

// API Base
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

// Query key factory
export const governanceKeys = {
  all: ['governance'] as const,
  stats: () => [...governanceKeys.all, 'stats'] as const,
  votingPower: () => [...governanceKeys.all, 'votingPower'] as const,
  proposals: () => [...governanceKeys.all, 'proposals'] as const,
  proposalsList: (filters?: { status?: string; search?: string }) =>
    [...governanceKeys.proposals(), 'list', filters] as const,
  proposal: (id: string) => [...governanceKeys.proposals(), id] as const,
  dashboardProposals: () => [...governanceKeys.proposals(), 'dashboard'] as const,
  council: () => [...governanceKeys.all, 'council'] as const,
  activity: () => [...governanceKeys.all, 'activity'] as const,
  userVote: (proposalId: string) => [...governanceKeys.all, 'vote', proposalId] as const,
};

// ============ Dashboard Hooks ============

export function useGovernanceStats() {
  return useQuery({
    queryKey: governanceKeys.stats(),
    queryFn: async () => {
      return fetchApi<GovernanceStats>('/v1/governance/dashboard');
    },
    staleTime: 30_000,
  });
}

export function useVotingPower() {
  return useQuery({
    queryKey: governanceKeys.votingPower(),
    queryFn: async () => {
      return fetchApi<VotingPowerBreakdown>('/v1/governance/voting-power');
    },
    staleTime: 60_000,
  });
}

export function useDashboardProposals() {
  return useQuery({
    queryKey: governanceKeys.dashboardProposals(),
    queryFn: async () => {
      return fetchApi<ProposalSummary[]>('/v1/governance/proposals?limit=3&status=active');
    },
    staleTime: 30_000,
  });
}

// ============ Proposals Hooks ============

export function useProposals(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: governanceKeys.proposalsList(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== 'all') {
        searchParams.set('status', params.status);
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
      return fetchApi<{ proposals: Proposal[]; total: number }>(
        `/v1/governance/proposals${query ? `?${query}` : ''}`
      );
    },
    staleTime: 30_000,
  });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: governanceKeys.proposal(id),
    queryFn: async () => {
      return fetchApi<Proposal>(`/v1/governance/proposals/${id}`);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ============ Council Hooks ============

export function useCouncil() {
  return useQuery({
    queryKey: governanceKeys.council(),
    queryFn: async () => {
      return fetchApi<CouncilData>('/v1/governance/council');
    },
    staleTime: 120_000, // 2 minutes
  });
}

// ============ Activity Hooks ============

export function useGovernanceActivity() {
  return useQuery({
    queryKey: governanceKeys.activity(),
    queryFn: async () => {
      return fetchApi<ActivityItem[]>('/v1/governance/activity');
    },
    staleTime: 30_000,
  });
}

// ============ Voting Hooks ============

export function useUserVote(proposalId: string) {
  return useQuery({
    queryKey: governanceKeys.userVote(proposalId),
    queryFn: async () => {
      return fetchApi<{ vote: 'for' | 'against' | null }>(`/v1/governance/proposals/${proposalId}/vote`);
    },
    enabled: !!proposalId,
    staleTime: 60_000,
  });
}

export function useSubmitVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proposalId,
      vote,
    }: {
      proposalId: string;
      vote: 'for' | 'against';
    }) => {
      return fetchApi<{ success: boolean }>(`/v1/governance/proposals/${proposalId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote }),
      });
    },
    onSuccess: (_, { proposalId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: governanceKeys.proposal(proposalId) });
      queryClient.invalidateQueries({ queryKey: governanceKeys.userVote(proposalId) });
      queryClient.invalidateQueries({ queryKey: governanceKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: governanceKeys.activity() });
    },
  });
}

// ============ Create Proposal Hooks ============

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposal: {
      title: string;
      description: string;
      fullDescription: string;
      type: 'parameter' | 'treasury' | 'upgrade' | 'signal' | 'emergency';
      signature: string;
      votingDuration?: number;
      executionParams?: Record<string, unknown>;
    }) => {
      return fetchApi<{ proposalId: string; status: string; startTime: number; endTime: number; message: string }>('/v1/governance/proposals', {
        method: 'POST',
        body: JSON.stringify({
          title: proposal.title,
          description: proposal.description,
          fullDescription: proposal.fullDescription,
          type: proposal.type,
          signature: proposal.signature,
          votingDuration: proposal.votingDuration,
          executionParams: proposal.executionParams,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: governanceKeys.stats() });
    },
  });
}
