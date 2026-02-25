/**
 * QS Hub Mock Data
 *
 * These types and mock data are used for development and fallback when API is unavailable.
 * In production, data will come from the backend API.
 */

// =============================================================================
// Dashboard Types and Mock Data
// =============================================================================

export interface QSHubStats {
  qsBalance: number;
  lockedQS: number;
  veQSBalance: number;
  votingPower: number;
  lockEndDate: string;
  lockDuration: string;
  timeRemaining: string;
  ratio: number; // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
  activeProposals: number;
  totalProposals: number;
  delegatedVotes: number;
  councilMembers: number;
}

export interface QSHubProposal {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'passed' | 'rejected' | 'executed';
  endTime: string;
  votes: {
    for: number;
    against: number;
  };
}

export interface QSHubRewards {
  claimable: number;
  usdValue: number;
  epochProgress: number;
  nextEpoch: string;
}

export interface QSHubDelegate {
  id: string;
  name: string;
  initial: string;
  totalPower: string;
  delegatedAmount: number;
}

export const MOCK_STATS: QSHubStats = {
  qsBalance: 12450,
  lockedQS: 8500,
  veQSBalance: 6225,
  votingPower: 0.12,
  lockEndDate: '2028-01-15',
  lockDuration: '3 Years',
  timeRemaining: '2Y 3M 7D',
  ratio: 0.73, // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
  activeProposals: 3,
  totalProposals: 47,
  delegatedVotes: 5225,
  councilMembers: 7,
};

export const MOCK_PROPOSALS: QSHubProposal[] = [
  {
    id: 'QIP-047',
    title: 'Increase Observer Rewards by 15%',
    status: 'active',
    endTime: '2d 14h',
    votes: { for: 67, against: 23 },
  },
  {
    id: 'QIP-046',
    title: 'Add Support for Polygon zkEVM',
    status: 'active',
    endTime: '5d 8h',
    votes: { for: 82, against: 12 },
  },
  {
    id: 'QIP-045',
    title: 'Treasury Diversification Strategy',
    status: 'pending',
    endTime: '7d 0h',
    votes: { for: 0, against: 0 },
  },
];

export const MOCK_REWARDS: QSHubRewards = {
  claimable: 847,
  usdValue: 4235,
  epochProgress: 65,
  nextEpoch: '3d 12h',
};

export const MOCK_DELEGATES: QSHubDelegate[] = [
  {
    id: '1',
    name: 'Watanabe Delegate',
    initial: 'W',
    totalPower: '285K veQS',
    delegatedAmount: 3000,
  },
  {
    id: '2',
    name: 'Sato Crypto',
    initial: 'S',
    totalPower: '198K veQS',
    delegatedAmount: 2000,
  },
];

// =============================================================================
// Proposals List Types and Mock Data
// =============================================================================

export interface ProposalDetail {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'pending' | 'passed' | 'rejected' | 'executed';
  proposer: string;
  createdAt: string;
  endTime: string;
  votes: {
    for: number;
    against: number;
    quorum: number;
  };
}

export const MOCK_PROPOSALS_LIST: ProposalDetail[] = [
  {
    id: 'QIP-047',
    title: 'Increase Observer Rewards by 15%',
    description: 'Proposal to increase rewards for Observers to incentivize network security.',
    status: 'active',
    proposer: '0x1a2b...3c4d',
    createdAt: '2026-01-25',
    endTime: '2d 14h',
    votes: { for: 67, against: 23, quorum: 50 },
  },
  {
    id: 'QIP-046',
    title: 'Add Support for Polygon zkEVM',
    description: 'Integrate Polygon zkEVM as supported network.',
    status: 'active',
    proposer: '0x5e6f...7g8h',
    createdAt: '2026-01-20',
    endTime: '5d 8h',
    votes: { for: 82, against: 12, quorum: 50 },
  },
  {
    id: 'QIP-045',
    title: 'Treasury Diversification Strategy',
    description: 'Diversify treasury holdings across multiple assets.',
    status: 'pending',
    proposer: '0x9i0j...1k2l',
    createdAt: '2026-01-18',
    endTime: '7d 0h',
    votes: { for: 0, against: 0, quorum: 50 },
  },
];

// =============================================================================
// Council Types and Mock Data
// =============================================================================

export interface CouncilMember {
  id: string;
  name: string;
  initial: string;
  role: string;
  veQS: string;
  status: 'active' | 'inactive';
}

export const MOCK_COUNCIL: CouncilMember[] = [
  {
    id: '1',
    name: 'Watanabe',
    initial: 'W',
    role: 'Security Council Lead',
    veQS: '285K',
    status: 'active',
  },
  {
    id: '2',
    name: 'Sato',
    initial: 'S',
    role: 'Technical Advisor',
    veQS: '198K',
    status: 'active',
  },
  {
    id: '3',
    name: 'Tanaka',
    initial: 'T',
    role: 'DeFi Expert',
    veQS: '156K',
    status: 'active',
  },
];

// =============================================================================
// Stake Lock Types and Mock Data
// =============================================================================

export interface StakeLockPosition {
  id: string;
  amount: number;
  veQSAmount: number;
  lockDuration: string;
  lockEndDate: string;
  ratio: number; // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
}

export const MOCK_STAKE_POSITIONS: StakeLockPosition[] = [
  {
    id: '1',
    amount: 8500,
    veQSAmount: 6225,
    lockDuration: '3 Years',
    lockEndDate: '2028-01-15',
    ratio: 0.73, // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
  },
];

export const MOCK_BALANCE = 12450;

// =============================================================================
// Vote History Types and Mock Data
// =============================================================================

export interface VoteRecord {
  id: string;
  proposalId: string;
  proposalTitle: string;
  vote: 'for' | 'against' | 'abstain';
  votePower: number;
  timestamp: string;
}

export const MOCK_VOTE_HISTORY: VoteRecord[] = [
  {
    id: '1',
    proposalId: 'QIP-044',
    proposalTitle: 'Increase Prover Bond Requirements',
    vote: 'for',
    votePower: 6225,
    timestamp: '2026-01-20 14:32',
  },
  {
    id: '2',
    proposalId: 'QIP-043',
    proposalTitle: 'Add ETH Staking Rewards',
    vote: 'for',
    votePower: 6225,
    timestamp: '2026-01-15 10:15',
  },
  {
    id: '3',
    proposalId: 'QIP-042',
    proposalTitle: 'Treasury Allocation Update',
    vote: 'against',
    votePower: 6225,
    timestamp: '2026-01-10 09:42',
  },
];
