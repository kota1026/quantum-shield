/**
 * QS Hub App Type Definitions
 *
 * These types are used throughout the QS Hub app for API responses and data structures.
 * Extracted from mock.ts for proper type management.
 */

// =============================================================================
// Dashboard / Stats Types
// =============================================================================

export interface QSHubStats {
  qsBalance: number;
  lockedQS: number;
  veQSBalance: number;
  votingPower: number;
  lockEndDate: string;
  lockDuration: string;
  timeRemaining: string;
  multiplier: number;
  activeProposals: number;
  totalProposals: number;
  delegatedVotes: number;
  councilMembers: number;
}

// =============================================================================
// Proposal Types
// =============================================================================

export type QSHubProposalStatus = 'active' | 'pending' | 'passed' | 'rejected' | 'executed';

export interface QSHubProposal {
  id: string;
  title: string;
  status: QSHubProposalStatus;
  endTime: string;
  votes: {
    for: number;
    against: number;
  };
}

export interface ProposalDetail {
  id: string;
  title: string;
  description: string;
  status: QSHubProposalStatus;
  proposer: string;
  createdAt: string;
  endTime: string;
  votes: {
    for: number;
    against: number;
    quorum: number;
  };
}

// =============================================================================
// Rewards Types
// =============================================================================

export interface QSHubRewards {
  claimable: number;
  usdValue: number;
  epochProgress: number;
  nextEpoch: string;
}

// =============================================================================
// Delegate Types
// =============================================================================

export interface QSHubDelegate {
  id: string;
  name: string;
  initial: string;
  totalPower: string;
  delegatedAmount: number;
}

// =============================================================================
// Council Types
// =============================================================================

export type CouncilMemberStatus = 'active' | 'inactive';

export interface CouncilMember {
  id: string;
  name: string;
  initial: string;
  role: string;
  veQS: string;
  status: CouncilMemberStatus;
}

// =============================================================================
// Stake Lock Types
// =============================================================================

export interface StakeLockPosition {
  id: string;
  amount: number;
  veQSAmount: number;
  lockDuration: string;
  lockEndDate: string;
  multiplier: number;
}

// =============================================================================
// Vote History Types
// =============================================================================

export type VoteChoice = 'for' | 'against' | 'abstain';

export interface VoteRecord {
  id: string;
  proposalId: string;
  proposalTitle: string;
  vote: VoteChoice;
  votePower: number;
  timestamp: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface QSHubDashboardResponse {
  stats: QSHubStats;
  proposals: QSHubProposal[];
  rewards: QSHubRewards;
  delegates: QSHubDelegate[];
}

export interface ProposalsListResponse {
  proposals: ProposalDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CouncilListResponse {
  members: CouncilMember[];
  total: number;
}

export interface StakePositionsResponse {
  positions: StakeLockPosition[];
  balance: number;
  total: number;
}

export interface VoteHistoryResponse {
  votes: VoteRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VoteRequest {
  proposalId: string;
  vote: VoteChoice;
}

export interface VoteResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface StakeLockRequest {
  amount: number;
  durationMonths: number;
}

export interface StakeLockResponse {
  success: boolean;
  txHash?: string;
  positionId: string;
  veQSAmount: number;
  error?: string;
}

export interface ClaimRewardsResponse {
  success: boolean;
  txHash?: string;
  amount: number;
  error?: string;
}
