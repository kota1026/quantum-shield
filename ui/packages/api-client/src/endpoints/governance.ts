import { apiClient } from '../client';
import type {
  GovernanceDashboardResponse,
  ProposalsListResponse,
  ProposalDetailResponse,
  CreateProposalRequest,
  CreateProposalResponse,
  VoteRequest,
  VoteResponse,
  VoteDetailResponse,
  ActivityResponse,
  CouncilResponse,
} from '../types/api';

/**
 * Governance API - proposals, voting, and council
 * TASK-P5-023: 8 endpoints
 */
export const governanceApi = {
  /**
   * GET /v1/governance/dashboard
   * Get governance dashboard overview
   */
  getDashboard: () =>
    apiClient.get<GovernanceDashboardResponse>('/v1/governance/dashboard'),

  /**
   * GET /v1/governance/proposals
   * Get paginated list of governance proposals
   */
  listProposals: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
  }) =>
    apiClient.get<ProposalsListResponse>('/v1/governance/proposals', params),

  /**
   * GET /v1/governance/proposals/:id
   * Get detailed information about a specific proposal
   */
  getProposal: (proposalId: string) =>
    apiClient.get<ProposalDetailResponse>(`/v1/governance/proposals/${proposalId}`),

  /**
   * POST /v1/governance/proposals
   * Create a new governance proposal
   */
  createProposal: (data: CreateProposalRequest) =>
    apiClient.post<CreateProposalResponse>('/v1/governance/proposals', data),

  /**
   * POST /v1/governance/vote
   * Submit a vote on a proposal
   */
  submitVote: (data: VoteRequest) =>
    apiClient.post<VoteResponse>('/v1/governance/vote', data),

  /**
   * GET /v1/governance/votes/:id
   * Get details of a specific vote
   */
  getVote: (voteId: string) =>
    apiClient.get<VoteDetailResponse>(`/v1/governance/votes/${voteId}`),

  /**
   * GET /v1/governance/activity
   * Get user's governance activity (votes, proposals, delegations)
   */
  getActivity: () =>
    apiClient.get<ActivityResponse>('/v1/governance/activity'),

  /**
   * GET /v1/governance/council
   * Get Security Council information and history
   */
  getCouncil: () =>
    apiClient.get<CouncilResponse>('/v1/governance/council'),
};
