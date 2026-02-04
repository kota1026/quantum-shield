/**
 * Token Hub App Type Definitions
 *
 * These types are used throughout the Token Hub app for API responses and data structures.
 * Extracted from mock.ts for proper type management.
 */

// =============================================================================
// Dashboard / Stats Types
// =============================================================================

export interface TokenHubStats {
  qsBalance: number;
  lockedQS: number;
  veQSBalance: number;
  votingPower: number;
  lockEndDate: string;
  lockDuration: string;
  timeRemaining: string;
  multiplier: number;
}

// =============================================================================
// Delegation Types
// =============================================================================

export interface Delegation {
  id: string;
  name: string;
  initial: string;
  totalPower: string;
  amount: number;
  percent: number;
}

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

// =============================================================================
// Rewards Types
// =============================================================================

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

export type RewardsHistoryType = 'weekly_reward' | 'claim' | 'bonus';
export type RewardsHistoryStatus = 'complete' | 'pending';

export interface RewardsHistory {
  id: string;
  type: RewardsHistoryType;
  date: string;
  amount: number;
  status: RewardsHistoryStatus;
}

export interface RewardsBreakdown {
  veqsHolding: number;
  votingParticipation: number;
  delegationBonus: number;
}

export interface ClaimableRewards {
  total: number;
  usdValue: number;
  breakdown: {
    veqsHolding: number;
    votingParticipation: number;
    delegationBonus: number;
  };
}

export interface ExtendedRewardsHistory {
  id: string;
  type: RewardsHistoryType;
  date: string;
  amount: number;
  epoch: number;
  status: RewardsHistoryStatus;
  breakdown: {
    holding: number;
    voting: number;
    delegation: number;
  };
}

// =============================================================================
// Epoch Types
// =============================================================================

export interface EpochInfo {
  number: number;
  progress: number;
  remaining: string;
}

// =============================================================================
// Lock Types
// =============================================================================

export interface Lock {
  id: string;
  amount: number;
  lockDuration: string;
  lockEndDate: string;
  veQSBalance: number;
  multiplier: number;
  createdAt: string;
}

export interface LockedPosition {
  id: string;
  lockedAmount: number;
  veQSAmount: number;
  lockDate: Date;
  unlockDate: Date;
  durationMonths: number;
  multiplier: number;
}

// =============================================================================
// Settings Types
// =============================================================================

export interface TokenHubSettings {
  autoCompound: boolean;
  notificationsEnabled: boolean;
  preferredLanguage: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface TokenHubDashboardResponse {
  stats: TokenHubStats;
  delegations: Delegation[];
  rewards: DashboardRewards;
}

export interface RewardsPageResponse {
  summary: RewardsSummary;
  history: RewardsHistory[];
  breakdown: RewardsBreakdown;
  epoch: EpochInfo;
}

export interface DelegateListResponse {
  delegates: DelegateInfo[];
  userDelegation: UserDelegation;
  total: number;
  page: number;
  pageSize: number;
}

export interface LocksResponse {
  locks: Lock[];
  total: number;
}

export interface LockedPositionsResponse {
  positions: LockedPosition[];
  total: number;
}

export interface ClaimRewardsRequest {
  amount: number;
}

export interface ClaimRewardsResponse {
  success: boolean;
  txHash?: string;
  amount: number;
  error?: string;
}

export interface LockRequest {
  amount: number;
  durationMonths: number;
}

export interface LockResponse {
  success: boolean;
  txHash?: string;
  lockId: string;
  veQSAmount: number;
  error?: string;
}

export interface DelegateRequest {
  delegateId: string;
  amount: number;
}

export interface DelegateResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}
