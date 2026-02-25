/**
 * Observer Portal Mock Data
 *
 * Provides mock data and types for Observer Portal components.
 * Used as fallback when API is unavailable.
 */

// ==================== TYPES ====================

export interface ObserverData {
  registrationDate: string;
  practicePeriodMonths: number;
}

export interface PendingUnlock {
  id: string;
  address: string;
  fullAddress?: string;
  amount: string;
  type: 'normal' | 'emergency';
  timeRemaining: string;
  riskScore?: number;
  status: 'pending' | 'monitoring' | 'review' | 'lowRisk';
  startedAt?: string;
  bondPaid?: string;
  txHash?: string;
  accountAge?: number;
  previousUnlocks?: number;
  riskFactors?: string[];
}

export interface SuspiciousTransaction {
  id: string;
  address: string;
  amount: string;
  type: 'normal' | 'emergency';
  riskLevel: 'high' | 'medium' | 'low';
  score: number;
  reason: string;
}

export interface ActiveChallenge {
  id: string;
  challengeId: string;
  targetAddress: string;
  amount: string;
  countdown: string;
  progress: number;
  status: 'defense' | 'judgment' | 'pending';
}

export interface ChallengeHistoryItem {
  id: string;
  targetAddress: string;
  amount: string;
  date: string;
  result: 'inProgress' | 'won' | 'lost';
  rewardPenalty: string | null;
}

export interface ObserverStats {
  activeChallenges: number;
  totalEarnings: string;
  winRate: number;
  stakedAmount: string;
}

export interface ObserverEarnings {
  claimable: string;
  pending: string;
  thisMonth: string;
  allTime: string;
}

export interface ObserverSettings {
  profile: {
    observerId: string;
    walletAddress: string;
    email: string;
    joinedDate: string;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    suspiciousAlert: boolean;
    challengeUpdate: boolean;
    earningsAlert: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    lastLogin: string;
    loginHistory: number;
  };
}

export interface ChallengeStats {
  total: number;
  won: number;
  lost: number;
  winRate: number;
  totalRewards: string;
}

export interface ObserverStake {
  amount: string;
  usdValue: number;
  lockPeriod: string;
  unlockDate: string;
}

// ==================== MOCK DATA ====================

export const MOCK_OBSERVER_DATA: ObserverData = {
  registrationDate: '2026-01-01',
  practicePeriodMonths: 3,
};

export const MOCK_PENDING_UNLOCKS: PendingUnlock[] = [
  {
    id: '1',
    address: '0x4b7c...9e1f',
    fullAddress: '0x4b7c8a2e1f9d3c6b5a4e7f8d9c1b2a3e4f5d6c7b8a9e1f',
    amount: '45.00 ETH',
    type: 'emergency',
    timeRemaining: '6d 14:22:18',
    riskScore: 87,
    status: 'monitoring',
    startedAt: '2026-01-04 09:15:42 UTC',
    bondPaid: '2.25 ETH (5%)',
    txHash: '0x7a8b...3c4d',
    accountAge: 12,
    riskFactors: [
      'First-time emergency unlock',
      'Large amount (top 5% of unlocks)',
      'Account age: 12 days',
    ],
  },
  {
    id: '2',
    address: '0x8f2a...3d4e',
    fullAddress: '0x8f2a3d4e5c6b7a8f9d0e1c2b3a4d5e6f7c8b9a0d1e2f',
    amount: '12.50 ETH',
    type: 'normal',
    timeRemaining: '23:41:02',
    riskScore: 24,
    status: 'pending',
    startedAt: '2026-01-09 10:18:58 UTC',
    txHash: '0x9c2d...5e6f',
    accountAge: 287,
    previousUnlocks: 4,
  },
  {
    id: '3',
    address: '0x1a9d...7b2c',
    fullAddress: '0x1a9d7b2c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    amount: '8.75 ETH',
    type: 'normal',
    timeRemaining: '18:05:33',
    riskScore: 15,
    status: 'pending',
    startedAt: '2026-01-09 15:42:11 UTC',
    txHash: '0x3e4f...7a8b',
    accountAge: 156,
    previousUnlocks: 2,
  },
  {
    id: '4',
    address: '0x2e5f...8a1b',
    fullAddress: '0x2e5f8a1b9c0d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    amount: '25.00 ETH',
    type: 'normal',
    timeRemaining: '21:33:47',
    riskScore: 62,
    status: 'review',
    startedAt: '2026-01-09 08:22:33 UTC',
    txHash: '0x5c6d...9e0f',
    accountAge: 45,
    riskFactors: ['Unusual unlock pattern detected'],
  },
  {
    id: '5',
    address: '0x5c3e...2d9a',
    fullAddress: '0x5c3e2d9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a',
    amount: '3.25 ETH',
    type: 'normal',
    timeRemaining: '15:22:11',
    riskScore: 8,
    status: 'lowRisk',
    startedAt: '2026-01-09 18:05:22 UTC',
    txHash: '0x7a8b...1c2d',
    accountAge: 542,
    previousUnlocks: 12,
  },
];

export const MOCK_SUSPICIOUS_TRANSACTIONS: SuspiciousTransaction[] = [
  {
    id: '1',
    address: '0x4b7c...9e1f',
    amount: '45.00 ETH',
    type: 'emergency',
    riskLevel: 'high',
    score: 87,
    reason: 'First-time emergency unlock with large amount',
  },
  {
    id: '2',
    address: '0x2e5f...8a1b',
    amount: '25.00 ETH',
    type: 'normal',
    riskLevel: 'medium',
    score: 62,
    reason: 'Unusual unlock pattern detected',
  },
];

export const MOCK_ACTIVE_CHALLENGES: ActiveChallenge[] = [
  {
    id: '1',
    challengeId: '#CHG-2847',
    targetAddress: '0x4b7c...9e1f',
    amount: '45.00 ETH',
    countdown: '47:22:15',
    progress: 35,
    status: 'defense',
  },
  {
    id: '2',
    challengeId: '#CHG-2843',
    targetAddress: '0x9a2e...1f3c',
    amount: '18.25 ETH',
    countdown: '12:08:44',
    progress: 83,
    status: 'judgment',
  },
];

export const MOCK_CHALLENGE_HISTORY: ChallengeHistoryItem[] = [
  {
    id: '#CHG-2843',
    targetAddress: '0x9a2e...1f3c',
    amount: '18.25 ETH',
    date: '2026-01-08',
    result: 'inProgress',
    rewardPenalty: null,
  },
  {
    id: '#CHG-2847',
    targetAddress: '0x4b7c...9e1f',
    amount: '45.00 ETH',
    date: '2026-01-08',
    result: 'inProgress',
    rewardPenalty: null,
  },
  {
    id: '#CHG-2831',
    targetAddress: '0x7d3f...8c2a',
    amount: '32.50 ETH',
    date: '2026-01-05',
    result: 'won',
    rewardPenalty: '+0.65 ETH',
  },
  {
    id: '#CHG-2824',
    targetAddress: '0x2e4f...9a1b',
    amount: '12.00 ETH',
    date: '2026-01-03',
    result: 'won',
    rewardPenalty: '+0.24 ETH',
  },
  {
    id: '#CHG-2819',
    targetAddress: '0x5c8d...3e7f',
    amount: '8.75 ETH',
    date: '2026-01-01',
    result: 'lost',
    rewardPenalty: '-0.10 ETH',
  },
  {
    id: '#CHG-2812',
    targetAddress: '0x1a9b...4c2d',
    amount: '55.00 ETH',
    date: '2025-12-28',
    result: 'won',
    rewardPenalty: '+1.10 ETH',
  },
  {
    id: '#CHG-2805',
    targetAddress: '0x8f3e...7d1a',
    amount: '22.25 ETH',
    date: '2025-12-25',
    result: 'won',
    rewardPenalty: '+0.45 ETH',
  },
];

export const MOCK_OBSERVER_STATS: ObserverStats = {
  activeChallenges: 2,
  totalEarnings: '2.34 ETH',
  winRate: 87,
  stakedAmount: '5.00 ETH',
};

export const MOCK_OBSERVER_EARNINGS: ObserverEarnings = {
  claimable: '1.89 ETH',
  pending: '0.45 ETH',
  thisMonth: '0.89 ETH',
  allTime: '2.34 ETH',
};

export const MOCK_OBSERVER_SETTINGS: ObserverSettings = {
  profile: {
    observerId: 'OBS-089',
    walletAddress: '0x7a3f9c2d8e1b4f6a...',
    email: 'observer@example.io',
    joinedDate: '2025/11/15',
  },
  notifications: {
    email: true,
    browser: true,
    suspiciousAlert: true,
    challengeUpdate: true,
    earningsAlert: true,
  },
  security: {
    twoFactorEnabled: true,
    lastLogin: '2026/01/17 14:32',
    loginHistory: 12,
  },
};

export const MOCK_CHALLENGE_STATS: ChallengeStats = {
  total: 14,
  won: 12,
  lost: 2,
  winRate: 85.7,
  totalRewards: '+2.34 ETH',
};

export const MOCK_OBSERVER_STAKE: ObserverStake = {
  amount: '5.00 ETH',
  usdValue: 13750,
  lockPeriod: '90 days',
  unlockDate: '2026/04/15',
};

// ==================== MOCK ENDPOINTS ====================

export const OBSERVER_MOCK_ENDPOINTS: Record<string, unknown> = {
  '/api/observer/data': { data: MOCK_OBSERVER_DATA },
  '/api/observer/pending-unlocks': { items: MOCK_PENDING_UNLOCKS, total: MOCK_PENDING_UNLOCKS.length },
  '/api/observer/suspicious': { items: MOCK_SUSPICIOUS_TRANSACTIONS },
  '/api/observer/active-challenges': { items: MOCK_ACTIVE_CHALLENGES },
  '/api/observer/challenge-history': { items: MOCK_CHALLENGE_HISTORY },
  '/api/observer/stats': { stats: MOCK_OBSERVER_STATS },
  '/api/observer/earnings': { earnings: MOCK_OBSERVER_EARNINGS },
  '/api/observer/settings': { settings: MOCK_OBSERVER_SETTINGS },
  '/api/observer/challenge-stats': { stats: MOCK_CHALLENGE_STATS },
  '/api/observer/stake': { stake: MOCK_OBSERVER_STAKE },
};
