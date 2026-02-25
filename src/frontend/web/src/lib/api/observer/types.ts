/**
 * Observer API Types
 *
 * Type definitions for Observer Portal API responses and data models.
 */

// ==================== BASIC TYPES ====================

export type UnlockType = 'normal' | 'emergency';

export type RiskLevel = 'high' | 'medium' | 'low';

export type UnlockStatus = 'pending' | 'monitoring' | 'review' | 'lowRisk';

export type ChallengeStatus = 'defense' | 'judgment' | 'pending';

export type ChallengeResult = 'inProgress' | 'won' | 'lost';

// ==================== DASHBOARD TYPES ====================

export interface ObserverData {
  registrationDate: string;
  practicePeriodMonths: number;
}

export interface ObserverStats {
  activeChallenges: number;
  totalEarnings: string;
  winRate: number;
  stakedAmount: string;
}

export interface ObserverDashboardResponse {
  data: ObserverData;
  stats: ObserverStats;
  earnings: ObserverEarnings;
  stake: ObserverStake;
}

// ==================== UNLOCK MONITORING TYPES ====================

export interface PendingUnlock {
  id: string;
  address: string;
  fullAddress?: string;
  amount: string;
  type: UnlockType;
  timeRemaining: string;
  riskScore?: number;
  status: UnlockStatus;
  startedAt?: string;
  bondPaid?: string;
  txHash?: string;
  accountAge?: number;
  previousUnlocks?: number;
  riskFactors?: string[];
}

export interface PendingUnlocksResponse {
  unlocks: PendingUnlock[];
  total: number;
}

export interface SuspiciousTransaction {
  id: string;
  address: string;
  amount: string;
  type: UnlockType;
  riskLevel: RiskLevel;
  score: number;
  reason: string;
}

export interface SuspiciousTransactionsResponse {
  transactions: SuspiciousTransaction[];
  total: number;
}

// ==================== CHALLENGE TYPES ====================

export interface ActiveChallenge {
  id: string;
  challengeId: string;
  targetAddress: string;
  amount: string;
  countdown: string;
  progress: number;
  status: ChallengeStatus;
}

export interface ActiveChallengesResponse {
  challenges: ActiveChallenge[];
  total: number;
}

export interface ChallengeHistoryItem {
  id: string;
  targetAddress: string;
  amount: string;
  date: string;
  result: ChallengeResult;
  rewardPenalty: string | null;
}

export interface ChallengeHistoryResponse {
  history: ChallengeHistoryItem[];
  total: number;
}

export interface ChallengeStats {
  total: number;
  won: number;
  lost: number;
  winRate: number;
  totalRewards: string;
}

export interface SubmitChallengeRequest {
  unlockId: string;
  reason: string;
  evidence?: string;
}

export interface SubmitChallengeResponse {
  challengeId: string;
  success: boolean;
}

// ==================== EARNINGS TYPES ====================

export interface ObserverEarnings {
  claimable: string;
  pending: string;
  thisMonth: string;
  allTime: string;
}

export interface ClaimEarningsRequest {
  earningIds?: string[];
}

export interface ClaimEarningsResponse {
  success: boolean;
  txHash?: string;
  amount: string;
}

// ==================== STAKE TYPES ====================

export interface ObserverStake {
  amount: string;
  usdValue: number;
  lockPeriod: string;
  unlockDate: string;
}

// ==================== SETTINGS TYPES ====================

export interface ObserverProfile {
  observerId: string;
  walletAddress: string;
  email: string;
  joinedDate: string;
}

export interface ObserverNotificationSettings {
  email: boolean;
  browser: boolean;
  suspiciousAlert: boolean;
  challengeUpdate: boolean;
  earningsAlert: boolean;
}

export interface ObserverSecuritySettings {
  twoFactorEnabled: boolean;
  lastLogin: string;
  loginHistory: number;
}

export interface ObserverSettings {
  profile: ObserverProfile;
  notifications: ObserverNotificationSettings;
  security: ObserverSecuritySettings;
}

// ==================== REGISTRATION TYPES ====================

export interface ObserverRegistrationRequest {
  walletAddress: string;
  email?: string;
  stakeAmount: string;
}

export interface ObserverRegistrationResponse {
  observerId: string;
  success: boolean;
}
