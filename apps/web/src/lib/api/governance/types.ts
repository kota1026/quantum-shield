/**
 * Governance App Type Definitions
 *
 * These types are used throughout the Governance app for API responses and data structures.
 * Extracted from mock.ts for proper type management.
 */

// =============================================================================
// Dashboard / Overview Types
// =============================================================================

export interface GovernanceStats {
  activeProposals: number;
  votingPower: number;
  participationRate: number;
  totalProposals: number;
}

export interface VotingPowerBreakdown {
  myVeqs: number;
  delegatedToMe: number;
  iDelegated: number;
  delegators: number;
  lockExpiry: string;
}

// =============================================================================
// Proposal Types
// =============================================================================

export type ProposalStatus = 'active' | 'pending' | 'passed' | 'executed' | 'defeated' | 'vetoed';
export type ProposalType = 'parameter' | 'upgrade' | 'treasury' | 'signal' | 'emergency';
export type UserVote = 'for' | 'against' | null;

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: ProposalStatus;
  type: ProposalType;
  proposer: string;
  createdAt: string;
  executedAt?: string;
  endedAt?: string;
  timeLeft?: string;
  timeLock?: string;
  forPercentage: number;
  againstPercentage: number;
  quorumPercentage?: number;
  quorumRequired?: number;
  quorumReached?: boolean;
  commentsCount: number;
  userVote: UserVote;
}

export interface ProposalSummary {
  id: string;
  title: string;
  status: 'active' | 'pending';
  timeLeft?: string;
  forPercentage: number;
}

// =============================================================================
// Council Types
// =============================================================================

export type CouncilRole = 'lead' | 'member' | 'chair';

export interface CouncilMember {
  id: string;
  name: string;
  role: CouncilRole;
  active: boolean;
}

// =============================================================================
// Veto Types
// =============================================================================

export interface VetoRecord {
  id: string;
  title: string;
  vetoedBy: string;
  approvalCount: string;
  reason: string;
  date: string;
  onchainRef: string;
  reasonText: string;
}

// =============================================================================
// System Status Types
// =============================================================================

export interface SystemStatus {
  lockContract: boolean;
  starkVerifier: boolean;
  governance: boolean;
  lastCheck: string;
}

// =============================================================================
// Council Data Aggregate Type
// =============================================================================

export interface CouncilData {
  securityCouncil: CouncilMember[];
  purposeCommittee: CouncilMember[];
  vetoHistory: VetoRecord[];
  systemStatus: SystemStatus;
}

// =============================================================================
// Activity Types
// =============================================================================

export type ActivityType = 'vote' | 'delegation' | 'proposal';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  proposalId?: string;
  timestamp: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface GovernanceDashboardResponse {
  stats: GovernanceStats;
  votingPower: VotingPowerBreakdown;
  proposals: ProposalSummary[];
  recentActivity: ActivityItem[];
}

export interface ProposalsListResponse {
  proposals: Proposal[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProposalDetailResponse {
  proposal: Proposal;
  activity: ActivityItem[];
}

export interface CouncilResponse {
  data: CouncilData;
}

export interface VoteRequest {
  proposalId: string;
  vote: 'for' | 'against';
}

export interface VoteResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}
