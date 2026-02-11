/**
 * Token Hub Mock Data
 *
 * These types and mock data are used for development and fallback when API is unavailable.
 * In production, data will come from the backend API.
 */

// =============================================================================
// Types
// =============================================================================

export interface TokenHubStats {
  qsBalance: number;
  lockedQS: number;
  veQSBalance: number;
  votingPower: number;
  lockEndDate: string;
  lockDuration: string;
  timeRemaining: string;
  ratio: number; // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
}

export interface Delegation {
  id: string;
  name: string;
  initial: string;
  totalPower: string;
  amount: number;
  percent: number;
}

export interface DashboardRewards {
  claimable: number;
  usdValue: number;
  epochProgress: number;
}

export interface RewardsSummary {
  claimable: number;
  claimableUsd: number;
  totalEarned: number;
  totalEarnedChange: number;
  weeklyAverage: number;
  currentApy: number;
  nextReward: number;
}

export interface RewardsHistory {
  id: string;
  type: 'weekly_reward' | 'claim' | 'bonus';
  date: string;
  amount: number;
  status: 'complete' | 'pending';
}

export interface RewardsBreakdown {
  veqsHolding: number;
  votingParticipation: number;
  delegationBonus: number;
}

export interface EpochInfo {
  number: number;
  progress: number;
  remaining: string;
}

export interface Lock {
  id: string;
  amount: number;
  lockDuration: string;
  lockEndDate: string;
  veQSBalance: number;
  ratio: number; // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
  createdAt: string;
}

// =============================================================================
// Mock Data
// =============================================================================

export const MOCK_STATS: TokenHubStats = {
  qsBalance: 12450,
  lockedQS: 8500,
  veQSBalance: 6225,
  votingPower: 0.12,
  lockEndDate: '2028-01-15',
  lockDuration: '3 Years',
  timeRemaining: '2Y 3M 7D',
  ratio: 0.73, // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
};

export const MOCK_DELEGATIONS: Delegation[] = [
  {
    id: '1',
    name: 'Watanabe Delegate',
    initial: 'W',
    totalPower: '285K veQS',
    amount: 3000,
    percent: 48,
  },
  {
    id: '2',
    name: 'Sato Crypto',
    initial: 'S',
    totalPower: '198K veQS',
    amount: 2000,
    percent: 32,
  },
  {
    id: '3',
    name: 'Tanaka DeFi',
    initial: 'T',
    totalPower: '156K veQS',
    amount: 1225,
    percent: 20,
  },
];

export const MOCK_DASHBOARD_REWARDS: DashboardRewards = {
  claimable: 847,
  usdValue: 4235,
  epochProgress: 65,
};

export const MOCK_REWARDS_SUMMARY: RewardsSummary = {
  claimable: 847,
  claimableUsd: 4235,
  totalEarned: 12450,
  totalEarnedChange: 1234,
  weeklyAverage: 156,
  currentApy: 12.5,
  nextReward: 42,
};

export const MOCK_REWARDS_HISTORY: RewardsHistory[] = [
  {
    id: '1',
    type: 'weekly_reward',
    date: '2026-01-06 14:32',
    amount: 156,
    status: 'complete',
  },
  {
    id: '2',
    type: 'weekly_reward',
    date: '2025-12-30 10:15',
    amount: 148,
    status: 'complete',
  },
  {
    id: '3',
    type: 'weekly_reward',
    date: '2025-12-23 09:42',
    amount: 162,
    status: 'complete',
  },
];

export const MOCK_REWARDS_BREAKDOWN: RewardsBreakdown = {
  veqsHolding: 620,
  votingParticipation: 127,
  delegationBonus: 100,
};

export const MOCK_EPOCH: EpochInfo = {
  number: 42,
  progress: 65,
  remaining: '2d 14h',
};

export const MOCK_LOCKS: Lock[] = [
  {
    id: '1',
    amount: 8500,
    lockDuration: '3 Years',
    lockEndDate: '2028-01-15',
    veQSBalance: 6225,
    ratio: 0.73, // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
    createdAt: '2025-01-15',
  },
];

// =============================================================================
// Lock Page Types and Mock Data
// =============================================================================

export const MOCK_BALANCE = 12450;

// =============================================================================
// Unlock Page Types and Mock Data
// =============================================================================

export interface LockedPosition {
  id: string;
  lockedAmount: number;
  veQSAmount: number;
  lockDate: Date;
  unlockDate: Date;
  durationMonths: number;
  ratio: number; // veQS lock ratio: duration / MAX_LOCK_TIME (linear time-decay)
}

export const MOCK_LOCKED_POSITIONS: LockedPosition[] = [
  {
    id: '1',
    lockedAmount: 5000,
    veQSAmount: 2500,
    lockDate: new Date('2025-01-15'),
    unlockDate: new Date('2027-01-15'),
    durationMonths: 24,
    ratio: 0.5, // 24 months / 48 months
  },
  {
    id: '2',
    lockedAmount: 3000,
    veQSAmount: 750,
    lockDate: new Date('2025-06-01'),
    unlockDate: new Date('2026-01-01'),
    durationMonths: 6,
    ratio: 0.125, // 6 months / 48 months
  },
  {
    id: '3',
    lockedAmount: 2000,
    veQSAmount: 500,
    lockDate: new Date('2024-06-16'),
    unlockDate: new Date('2025-12-16'),
    durationMonths: 18,
    ratio: 0.375, // 18 months / 48 months
  },
];

// =============================================================================
// Delegate Page Types and Mock Data
// =============================================================================

export interface UserDelegation {
  totalDelegated: number;
  delegateCount: number;
}

export interface DelegateInfo {
  id: string;
  name: string;
  initial: string;
  address: string;
  rank: number;
  veQS: string;
  delegators: number;
  participation: number;
  tags: string[];
  bio: string;
  lastVote: string;
}

export const MOCK_USER_DELEGATION: UserDelegation = {
  totalDelegated: 6225,
  delegateCount: 3,
};

export const MOCK_DELEGATES: DelegateInfo[] = [
  {
    id: '1',
    name: 'list.watanabe',
    initial: 'W',
    address: '0x1a2b...3c4d',
    rank: 1,
    veQS: '285K',
    delegators: 1247,
    participation: 98,
    tags: ['securityCouncil', 'defiExpert', 'longTermHolder'],
    bio: 'list.watanabeBio',
    lastVote: '2',
  },
  {
    id: '2',
    name: 'list.sato',
    initial: 'S',
    address: '0x5e6f...7g8h',
    rank: 2,
    veQS: '198K',
    delegators: 892,
    participation: 95,
    tags: ['research', 'governance'],
    bio: 'list.satoBio',
    lastVote: '5',
  },
  {
    id: '3',
    name: 'list.tanaka',
    initial: 'T',
    address: '0x9i0j...1k2l',
    rank: 3,
    veQS: '156K',
    delegators: 634,
    participation: 92,
    tags: ['defi', 'yieldStrategy'],
    bio: 'list.tanakaBio',
    lastVote: '7',
  },
  {
    id: '4',
    name: 'list.yamamoto',
    initial: 'Y',
    address: '0x3m4n...5o6p',
    rank: 4,
    veQS: '124K',
    delegators: 412,
    participation: 89,
    tags: ['infrastructure', 'prover'],
    bio: 'list.yamamotoBio',
    lastVote: '3',
  },
  {
    id: '5',
    name: 'list.suzuki',
    initial: 'K',
    address: '0x7q8r...9s0t',
    rank: 5,
    veQS: '98K',
    delegators: 287,
    participation: 100,
    tags: ['purposeCommittee', 'cryptography'],
    bio: 'list.suzukiBio',
    lastVote: '1',
  },
  {
    id: '6',
    name: 'list.matsumoto',
    initial: 'M',
    address: '0x1u2v...3w4x',
    rank: 6,
    veQS: '76K',
    delegators: 198,
    participation: 94,
    tags: ['daoGovernance', 'community'],
    bio: 'list.matsumotoBio',
    lastVote: '4',
  },
];

// =============================================================================
// Settings Page Types and Mock Data
// =============================================================================

export interface TokenHubSettings {
  autoCompound: boolean;
  notificationsEnabled: boolean;
  preferredLanguage: string;
}

export const MOCK_SETTINGS: TokenHubSettings = {
  autoCompound: false,
  notificationsEnabled: true,
  preferredLanguage: 'ja',
};

// =============================================================================
// Rewards Claim Types and Mock Data
// =============================================================================

export interface ClaimableRewards {
  total: number;
  usdValue: number;
  breakdown: {
    veqsHolding: number;
    votingParticipation: number;
    delegationBonus: number;
  };
}

export const MOCK_CLAIMABLE: ClaimableRewards = {
  total: 847,
  usdValue: 4235,
  breakdown: {
    veqsHolding: 620,
    votingParticipation: 127,
    delegationBonus: 100,
  },
};

// =============================================================================
// Extended Rewards History Types and Mock Data
// =============================================================================

export interface ExtendedRewardsHistory {
  id: string;
  type: 'weekly_reward' | 'claim' | 'bonus';
  date: string;
  amount: number;
  epoch: number;
  status: 'complete' | 'pending';
  breakdown: {
    holding: number;
    voting: number;
    delegation: number;
  };
}

export const MOCK_EXTENDED_HISTORY: ExtendedRewardsHistory[] = [
  {
    id: '1',
    type: 'weekly_reward',
    date: '2026-01-06 14:32',
    amount: 156,
    epoch: 42,
    status: 'complete',
    breakdown: { holding: 112, voting: 24, delegation: 20 },
  },
  {
    id: '2',
    type: 'weekly_reward',
    date: '2025-12-30 10:15',
    amount: 148,
    epoch: 41,
    status: 'complete',
    breakdown: { holding: 108, voting: 22, delegation: 18 },
  },
  {
    id: '3',
    type: 'weekly_reward',
    date: '2025-12-23 09:42',
    amount: 162,
    epoch: 40,
    status: 'complete',
    breakdown: { holding: 118, voting: 26, delegation: 18 },
  },
  {
    id: '4',
    type: 'weekly_reward',
    date: '2025-12-16 11:20',
    amount: 145,
    epoch: 39,
    status: 'complete',
    breakdown: { holding: 105, voting: 22, delegation: 18 },
  },
  {
    id: '5',
    type: 'weekly_reward',
    date: '2025-12-09 15:45',
    amount: 138,
    epoch: 38,
    status: 'complete',
    breakdown: { holding: 100, voting: 20, delegation: 18 },
  },
];
