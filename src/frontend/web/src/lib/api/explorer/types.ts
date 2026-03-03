/**
 * Explorer App Type Definitions
 *
 * These types are used throughout the Explorer app for API responses and data structures.
 * Extracted from mock.ts for proper type management.
 */

// =============================================================================
// Dashboard / Overview Types
// =============================================================================

export interface ExplorerStats {
  tvl: string;
  tvlChange: number;
  totalLocks: number;
  locksChange: number;
  pendingUnlocks: number;
  pendingInTimeLock: number;
  activeProvers: number;
  proverUptime: number;
}

export interface RecentLock {
  id: string;
  amount: string;
  status: 'active' | 'unlocking' | 'complete';
  time: string;
}

export interface RecentUnlock {
  id: string;
  type: 'normal' | 'emergency';
  status: 'pending' | 'complete' | 'challenged';
  timeLock: string;
}

export interface ActiveChallenge {
  id: string;
  targetUnlock: string;
  challenger: string;
  bond: string;
  deadline: string;
  status: 'open' | 'defense' | 'judgment' | 'resolved';
}

// =============================================================================
// Lock Types
// =============================================================================

export type LockStatus = 'active' | 'unlocking' | 'unlocked';

export interface LockDetail {
  id: string;
  shortId: string;
  owner: string;
  ownerFull: string;
  amount: string;
  lockTime: string;
  lockTimeShort: string;
  status: LockStatus;
  l2Tx: string;
  l2TxFull: string;
  blockNumber: string;
  dilithiumKey: string;
}

// =============================================================================
// Unlock Types
// =============================================================================

export type UnlockType = 'normal' | 'emergency';
export type UnlockStatus = 'pending' | 'complete' | 'challenged';

export interface ProverSignature {
  name: string;
  signed: boolean;
  signedAt?: string;
}

export interface TimelineEvent {
  event: 'requested' | 'timeLockStart' | 'proverApproval' | 'timeLockEnd' | 'executed' | 'challenged';
  time: string;
  completed: boolean;
}

export interface ChallengeInfo {
  id: string;
  shortId: string;
  challenger: string;
  challengerFull: string;
  bond: string;
  defenseDeadline: string;
}

export interface UnlockDetail {
  id: string;
  shortId: string;
  lockId: string;
  lockIdFull: string;
  type: UnlockType;
  status: UnlockStatus;
  amount?: string;
  timeLock: string;
  timeLockProgress: number;
  timeLockRemaining?: string;
  proverSigs: {
    signed: number;
    total: number;
  };
  requestTime: string;
  timeLockEnd: string;
  dilithiumSig: string;
  dilithiumVerified: boolean;
  l2TxHash?: string;
  l2TxHashFull?: string;
  provers: ProverSignature[];
  challenge?: ChallengeInfo;
  timeline?: TimelineEvent[];
}

// =============================================================================
// Challenge Types
// =============================================================================

export type ChallengeStatus = 'open' | 'defense' | 'judgment' | 'resolved';
export type ChallengeResult = 'challenger_won' | 'prover_won';

export interface ChallengeDetail {
  id: string;
  targetUnlock: string;
  challenger: string;
  bond: string;
  amount: string;
  deadline: string;
  status: ChallengeStatus;
  createdAt: string;
  result?: ChallengeResult;
}

export interface ChallengeStats {
  totalChallenges: number;
  active: number;
  resolved: number;
  successRate: number;
}

// =============================================================================
// Prover Types
// =============================================================================

export type ProverStatus = 'active' | 'inactive';

export interface ProverSummary {
  id: string;
  name: string;
  address: string;
  stake: string;
  uptime: number;
  responseTime: string;
  signaturesCount: number;
  status: ProverStatus;
  lastActive: string;
}

export interface ProverStats {
  totalProvers: number;
  activeProvers: number;
  avgUptime: number;
  avgResponseTime: string;
  totalSignatures: number;
}

export interface ProverPerformance {
  name: string;
  uptime: number;
  avgResponse: number;
}

// =============================================================================
// Analytics Types
// =============================================================================

export interface TvlDataPoint {
  date: string;
  value: number;
}

export interface VolumeDataPoint {
  date: string;
  locks: number;
  unlocks: number;
}

export type TvlTrend = 'up' | 'down';

export interface AnalyticsStats {
  currentTvl: string;
  tvlChange: string;
  tvlTrend: TvlTrend;
  totalLocks: string;
  totalUnlocks: string;
  avgLockAmount: string;
  avgLockDuration: string;
  successRate: string;
  challengeRate: string;
  resolvedChallenges: number;
  pendingChallenges: number;
}

export interface LockStatusDistribution {
  active: number;
  unlocking: number;
  unlocked: number;
}

export interface UnlockTypeDistribution {
  normal: number;
  emergency: number;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ExplorerDashboardResponse {
  stats: ExplorerStats;
  recentLocks: RecentLock[];
  recentUnlocks: RecentUnlock[];
  activeChallenges: ActiveChallenge[];
}

export interface LocksListResponse {
  locks: LockDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UnlocksListResponse {
  unlocks: UnlockDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChallengesListResponse {
  challenges: ChallengeDetail[];
  stats: ChallengeStats;
  total: number;
  page: number;
  pageSize: number;
}

export interface ProversListResponse {
  provers: ProverSummary[];
  stats: ProverStats;
  total: number;
  page: number;
  pageSize: number;
}

export interface AnalyticsResponse {
  stats: AnalyticsStats;
  tvlHistory: TvlDataPoint[];
  volumeHistory: VolumeDataPoint[];
  proverPerformance: ProverPerformance[];
  lockDistribution: LockStatusDistribution;
  unlockDistribution: UnlockTypeDistribution;
}
