/**
 * Governance React Query Hooks
 *
 * Provides data fetching hooks for QS Admin Governance module
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';

// ============= Types =============

export interface GovernanceStats {
  activeProposals: number;
  totalVotes: number;
  participation: string;
  passedProposals: number;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending' | 'executed';
  votes: number;
  forVotes: number;
  againstVotes: number;
  turnout: string;
  startDate: string;
  endDate: string;
}

export interface ProposalDetail extends GovernanceProposal {
  description: string;
  category: string;
  quorum: number;
  requiredVotes: number;
  daysRemaining: number;
  recentVotes: RecentVote[];
}

export interface RecentVote {
  voter: string;
  vote: 'for' | 'against';
  amount: string;
  timestamp: string;
}

export interface VotingStats {
  activeVotes: number;
  totalVoters: number;
  avgTurnout: string;
  endingSoon: number;
}

export interface ActiveVote {
  id: string;
  title: string;
  forVotes: number;
  againstVotes: number;
  totalVoters: number;
  turnout: string;
  endDate: string;
  daysLeft: number;
}

export interface ProposalFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

// ============= Query Keys =============

export const governanceKeys = {
  all: ['admin', 'governance'] as const,
  stats: () => [...governanceKeys.all, 'stats'] as const,
  proposals: (filters?: ProposalFilters) => [...governanceKeys.all, 'proposals', filters] as const,
  proposal: (id: string) => [...governanceKeys.all, 'proposal', id] as const,
  votingStats: () => [...governanceKeys.all, 'voting', 'stats'] as const,
  activeVotes: () => [...governanceKeys.all, 'voting', 'active'] as const,
  council: () => [...governanceKeys.all, 'council'] as const,
};

// ============= Response Types =============

interface StatsResponse {
  stats: GovernanceStats;
}

interface ProposalsResponse {
  proposals: GovernanceProposal[];
  total: number;
}

interface ProposalResponse {
  proposal: ProposalDetail;
}

interface VotingStatsResponse {
  stats: VotingStats;
}

interface ActiveVotesResponse {
  votes: ActiveVote[];
  total: number;
}

// ============= Hooks =============

/**
 * Fetch governance statistics
 */
export function useGovernanceStats() {
  return useQuery({
    queryKey: governanceKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<StatsResponse>('/api/admin/governance/stats');
      return response.stats;
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Fetch governance proposals with filtering
 */
export function useGovernanceProposals(filters?: ProposalFilters) {
  return useQuery({
    queryKey: governanceKeys.proposals(filters),
    queryFn: async () => {
      const response = await adminApi.get<ProposalsResponse>('/api/admin/governance/proposals', filters);
      return response;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch single proposal detail
 */
export function useProposalDetail(id: string) {
  return useQuery({
    queryKey: governanceKeys.proposal(id),
    queryFn: async () => {
      const response = await adminApi.get<ProposalResponse>(`/api/admin/governance/proposals/${id}`);
      return response.proposal;
    },
    staleTime: 30_000,
    enabled: !!id,
  });
}

/**
 * Fetch voting statistics
 */
export function useVotingStats() {
  return useQuery({
    queryKey: governanceKeys.votingStats(),
    queryFn: async () => {
      const response = await adminApi.get<VotingStatsResponse>('/api/admin/governance/voting/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch active votes
 */
export function useActiveVotes() {
  return useQuery({
    queryKey: governanceKeys.activeVotes(),
    queryFn: async () => {
      const response = await adminApi.get<ActiveVotesResponse>('/api/admin/governance/voting/active');
      return response;
    },
    staleTime: 30_000,
  });
}

// ============= Mutations =============

/**
 * Execute a passed proposal
 */
export function useExecuteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposalId: string) => {
      return adminApi.post(`/api/admin/governance/proposals/${proposalId}/execute`);
    },
    onSuccess: (_, proposalId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: governanceKeys.stats() });
      queryClient.invalidateQueries({ queryKey: governanceKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: governanceKeys.proposal(proposalId) });
    },
  });
}
