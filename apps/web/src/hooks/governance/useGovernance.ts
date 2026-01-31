import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  GovernanceStats,
  VotingPowerBreakdown,
  Proposal,
  ProposalSummary,
  CouncilData,
  ActivityItem,
} from '@/lib/api/governance/mock';

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
  proposal: (id: number) => [...governanceKeys.proposals(), id] as const,
  dashboardProposals: () => [...governanceKeys.proposals(), 'dashboard'] as const,
  council: () => [...governanceKeys.all, 'council'] as const,
  activity: () => [...governanceKeys.all, 'activity'] as const,
  userVote: (proposalId: number) => [...governanceKeys.all, 'vote', proposalId] as const,
};

// ============ Dashboard Hooks ============

export function useGovernanceStats() {
  return useQuery({
    queryKey: governanceKeys.stats(),
    queryFn: async () => {
      return fetchApi<GovernanceStats>('/api/governance/dashboard');
    },
    staleTime: 30_000,
  });
}

export function useVotingPower() {
  return useQuery({
    queryKey: governanceKeys.votingPower(),
    queryFn: async () => {
      return fetchApi<VotingPowerBreakdown>('/api/governance/voting-power');
    },
    staleTime: 60_000,
  });
}

export function useDashboardProposals() {
  return useQuery({
    queryKey: governanceKeys.dashboardProposals(),
    queryFn: async () => {
      return fetchApi<ProposalSummary[]>('/api/governance/proposals?limit=3&status=active');
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
        `/api/governance/proposals${query ? `?${query}` : ''}`
      );
    },
    staleTime: 30_000,
  });
}

export function useProposal(id: number) {
  return useQuery({
    queryKey: governanceKeys.proposal(id),
    queryFn: async () => {
      return fetchApi<Proposal>(`/api/governance/proposals/${id}`);
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
      return fetchApi<CouncilData>('/api/governance/council');
    },
    staleTime: 120_000, // 2 minutes
  });
}

// ============ Activity Hooks ============

export function useGovernanceActivity() {
  return useQuery({
    queryKey: governanceKeys.activity(),
    queryFn: async () => {
      return fetchApi<ActivityItem[]>('/api/governance/activity');
    },
    staleTime: 30_000,
  });
}

// ============ Voting Hooks ============

export function useUserVote(proposalId: number) {
  return useQuery({
    queryKey: governanceKeys.userVote(proposalId),
    queryFn: async () => {
      return fetchApi<{ vote: 'for' | 'against' | null }>(`/api/governance/proposals/${proposalId}/vote`);
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
      proposalId: number;
      vote: 'for' | 'against';
    }) => {
      return fetchApi<{ success: boolean }>(`/api/governance/proposals/${proposalId}/vote`, {
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
      type: 'parameter' | 'upgrade' | 'council';
    }) => {
      return fetchApi<{ id: number; success: boolean }>('/api/governance/proposals', {
        method: 'POST',
        body: JSON.stringify(proposal),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: governanceKeys.stats() });
    },
  });
}
