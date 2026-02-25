// Explorer Mock Data Types and Constants

// ============ Types ============

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

export interface LockDetail {
  id: string;
  shortId: string;
  owner: string;
  ownerFull: string;
  amount: string;
  lockTime: string;
  lockTimeShort: string;
  status: 'active' | 'unlocking' | 'unlocked';
  l2Tx: string;
  l2TxFull: string;
  blockNumber: string;
  dilithiumKey: string;
}

export interface UnlockDetail {
  id: string;
  shortId: string;
  lockId: string;
  lockIdFull: string;
  type: 'normal' | 'emergency';
  status: 'pending' | 'complete' | 'challenged';
  timeLock: string;
  timeLockProgress: number;
  proverSigs: {
    signed: number;
    total: number;
  };
  requestTime: string;
  timeLockEnd: string;
  dilithiumSig: string;
  dilithiumVerified: boolean;
  provers: Array<{
    name: string;
    signed: boolean;
  }>;
}

export interface ChallengeDetail {
  id: string;
  targetUnlock: string;
  challenger: string;
  bond: string;
  amount: string;
  deadline: string;
  status: 'defense' | 'judgment' | 'resolved';
  createdAt: string;
  result?: 'challenger_won' | 'prover_won';
}

export interface ChallengeStats {
  totalChallenges: number;
  active: number;
  resolved: number;
  successRate: number;
}

export interface ProverSummary {
  id: string;
  name: string;
  address: string;
  stake: string;
  uptime: number;
  responseTime: string;
  signaturesCount: number;
  status: 'active' | 'inactive';
  lastActive: string;
}

export interface ProverStats {
  totalProvers: number;
  activeProvers: number;
  avgUptime: number;
  avgResponseTime: string;
  totalSignatures: number;
}

export interface TvlDataPoint {
  date: string;
  value: number;
}

export interface VolumeDataPoint {
  date: string;
  locks: number;
  unlocks: number;
}

export interface ProverPerformance {
  name: string;
  uptime: number;
  avgResponse: number;
}

export interface AnalyticsStats {
  currentTvl: string;
  tvlChange: string;
  tvlTrend: 'up' | 'down';
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

// ============ Mock Data ============

export const MOCK_EXPLORER_STATS: ExplorerStats = {
  tvl: '$847.2M',
  tvlChange: 12.4,
  totalLocks: 24891,
  locksChange: 342,
  pendingUnlocks: 127,
  pendingInTimeLock: 12,
  activeProvers: 8,
  proverUptime: 100,
};

export const MOCK_RECENT_LOCKS: RecentLock[] = [
  { id: '0x7a3f...e821', amount: '125.5', status: 'active', time: '2 min ago' },
  { id: '0x9b2c...f412', amount: '50.0', status: 'active', time: '8 min ago' },
  { id: '0x4d8e...a923', amount: '200.0', status: 'unlocking', time: '15 min ago' },
  { id: '0x1f6a...c734', amount: '75.25', status: 'active', time: '23 min ago' },
  { id: '0x8c3d...b156', amount: '320.0', status: 'complete', time: '31 min ago' },
];

export const MOCK_RECENT_UNLOCKS: RecentUnlock[] = [
  { id: '0x2e7f...d934', type: 'normal', status: 'pending', timeLock: '23h 14m left' },
  { id: '0x5c9a...e127', type: 'emergency', status: 'pending', timeLock: '6d 18h left' },
  { id: '0x3b1d...f842', type: 'normal', status: 'complete', timeLock: 'Executed' },
  { id: '0x7d4e...a563', type: 'normal', status: 'challenged', timeLock: 'Defense: 47h' },
  { id: '0x9f2c...b718', type: 'normal', status: 'complete', timeLock: 'Executed' },
];

export const MOCK_ACTIVE_CHALLENGES: ActiveChallenge[] = [
  {
    id: '0xa4f2...c891',
    targetUnlock: '0x7d4e...a563',
    challenger: '0x8b3c...d412',
    bond: '0.15',
    deadline: '47h 23m left',
    status: 'open',
  },
];

export const MOCK_LOCKS: LockDetail[] = [
  {
    id: '0x7a3f8b2c4d5e6f...e821d4f9',
    shortId: '0x7a3f...e821',
    owner: '0x9b2c...f412',
    ownerFull: '0x9b2c4d5e6f7a8b9c...f412d3e4',
    amount: '125.5',
    lockTime: '2026-01-10 14:32:18 UTC',
    lockTimeShort: '2026-01-10 14:32',
    status: 'active',
    l2Tx: '0x4d8e...a923',
    l2TxFull: '0x4d8e9f0a1b2c3d4e5f6a7b8c...a923b4c5',
    blockNumber: '18,234,567',
    dilithiumKey: 'dil3_0x8f2a...verified',
  },
  {
    id: '0x9b2c4d5e6f7a8b...f412d3e4',
    shortId: '0x9b2c...f412',
    owner: '0x1f6a...c734',
    ownerFull: '0x1f6a7b8c9d0e1f2a...c734d5e6',
    amount: '50.0',
    lockTime: '2026-01-10 14:24:45 UTC',
    lockTimeShort: '2026-01-10 14:24',
    status: 'active',
    l2Tx: '0x8c3d...b156',
    l2TxFull: '0x8c3d4e5f6a7b8c9d0e1f...b156c2d3',
    blockNumber: '18,234,521',
    dilithiumKey: 'dil3_0x3c7f...verified',
  },
  {
    id: '0x4d8e9f0a1b2c3d...a923b4c5',
    shortId: '0x4d8e...a923',
    owner: '0x2e7f...d934',
    ownerFull: '0x2e7f3a4b5c6d7e8f...d934e5f6',
    amount: '200.0',
    lockTime: '2026-01-10 14:17:33 UTC',
    lockTimeShort: '2026-01-10 14:17',
    status: 'unlocking',
    l2Tx: '0x5c9a...e127',
    l2TxFull: '0x5c9a0b1c2d3e4f5a6b7c...e127f8a9',
    blockNumber: '18,234,489',
    dilithiumKey: 'dil3_0x9d2b...verified',
  },
  {
    id: '0x1f6a7b8c9d0e1f...c734d5e6',
    shortId: '0x1f6a...c734',
    owner: '0x3b1d...f842',
    ownerFull: '0x3b1d4c5e6f7a8b9c...f842a1b2',
    amount: '75.25',
    lockTime: '2026-01-10 14:09:12 UTC',
    lockTimeShort: '2026-01-10 14:09',
    status: 'active',
    l2Tx: '0x7d4e...a563',
    l2TxFull: '0x7d4e5f6a7b8c9d0e1f2a...a563b7c8',
    blockNumber: '18,234,456',
    dilithiumKey: 'dil3_0x5e8c...verified',
  },
  {
    id: '0x8c3d4e5f6a7b8c...b156c2d3',
    shortId: '0x8c3d...b156',
    owner: '0x9f2c...b718',
    ownerFull: '0x9f2c3d4e5f6a7b8c...b718c9d0',
    amount: '320.0',
    lockTime: '2026-01-10 14:01:58 UTC',
    lockTimeShort: '2026-01-10 14:01',
    status: 'unlocked',
    l2Tx: '0xa4f2...c891',
    l2TxFull: '0xa4f2b3c4d5e6f7a8b9c0...c891d0e1',
    blockNumber: '18,234,412',
    dilithiumKey: 'dil3_0x7a1d...verified',
  },
  {
    id: '0x2e7f3a4b5c6d7e...d934e5f6',
    shortId: '0x2e7f...d934',
    owner: '0x8b3c...d412',
    ownerFull: '0x8b3c4d5e6f7a8b9c...d412e3f4',
    amount: '88.0',
    lockTime: '2026-01-10 13:52:27 UTC',
    lockTimeShort: '2026-01-10 13:52',
    status: 'active',
    l2Tx: '0xb5e3...f924',
    l2TxFull: '0xb5e3c4d5e6f7a8b9c0d1...f924a1b2',
    blockNumber: '18,234,378',
    dilithiumKey: 'dil3_0x2f9e...verified',
  },
];

export const MOCK_UNLOCKS: UnlockDetail[] = [
  {
    id: '0x2e7f8d9a1b2c3d4e...d934a127',
    shortId: '0x2e7f...d934',
    lockId: '0x7a3f...e821',
    lockIdFull: '0x7a3f8b2c4d5e6f...e821d4f9',
    type: 'normal',
    status: 'pending',
    timeLock: '23h 14m',
    timeLockProgress: 3,
    proverSigs: { signed: 3, total: 5 },
    requestTime: '2026-01-10 14:46:22 UTC',
    timeLockEnd: '2026-01-11 14:46:22 UTC',
    dilithiumSig: 'dil3_sig_0x8f2a...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: false },
      { name: 'Prover Epsilon', signed: false },
    ],
  },
  {
    id: '0x5c9a0b1c2d3e4f5a...e127f8a9',
    shortId: '0x5c9a...e127',
    lockId: '0x4d8e...a923',
    lockIdFull: '0x4d8e9f0a1b2c3d...a923b4c5',
    type: 'emergency',
    status: 'pending',
    timeLock: '6d 18h',
    timeLockProgress: 5,
    proverSigs: { signed: 5, total: 5 },
    requestTime: '2026-01-09 08:22:15 UTC',
    timeLockEnd: '2026-01-16 08:22:15 UTC',
    dilithiumSig: 'dil3_sig_0x9d2b...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: true },
      { name: 'Prover Epsilon', signed: true },
    ],
  },
  {
    id: '0x3b1d4c5e6f7a8b9c...f842a1b2',
    shortId: '0x3b1d...f842',
    lockId: '0x1f6a...c734',
    lockIdFull: '0x1f6a7b8c9d0e1f...c734d5e6',
    type: 'normal',
    status: 'complete',
    timeLock: '-',
    timeLockProgress: 100,
    proverSigs: { signed: 5, total: 5 },
    requestTime: '2026-01-08 12:15:45 UTC',
    timeLockEnd: '2026-01-09 12:15:45 UTC',
    dilithiumSig: 'dil3_sig_0x7a1d...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: true },
      { name: 'Prover Epsilon', signed: true },
    ],
  },
  {
    id: '0x7d4e5f6a7b8c9d0e...a563b7c8',
    shortId: '0x7d4e...a563',
    lockId: '0x8c3d...b156',
    lockIdFull: '0x8c3d4e5f6a7b8c...b156c2d3',
    type: 'normal',
    status: 'challenged',
    timeLock: '47h',
    timeLockProgress: 60,
    proverSigs: { signed: 4, total: 5 },
    requestTime: '2026-01-07 09:32:18 UTC',
    timeLockEnd: '2026-01-08 09:32:18 UTC',
    dilithiumSig: 'dil3_sig_0x5e8c...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: true },
      { name: 'Prover Epsilon', signed: false },
    ],
  },
  {
    id: '0x9f2c3d4e5f6a7b8c...b718c9d0',
    shortId: '0x9f2c...b718',
    lockId: '0x2e7f...d934',
    lockIdFull: '0x2e7f3a4b5c6d7e...d934e5f6',
    type: 'normal',
    status: 'complete',
    timeLock: '-',
    timeLockProgress: 100,
    proverSigs: { signed: 5, total: 5 },
    requestTime: '2026-01-06 16:48:33 UTC',
    timeLockEnd: '2026-01-07 16:48:33 UTC',
    dilithiumSig: 'dil3_sig_0x2f9e...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: true },
      { name: 'Prover Epsilon', signed: true },
    ],
  },
];

export const MOCK_CHALLENGE_STATS: ChallengeStats = {
  totalChallenges: 156,
  active: 3,
  resolved: 153,
  successRate: 78.5,
};

export const MOCK_CHALLENGES: ChallengeDetail[] = [
  {
    id: 'CHG-0x4f2c...891',
    targetUnlock: '0x7d4e...a563',
    challenger: '0x8b3c...d412',
    bond: '0.15',
    amount: '45.00',
    deadline: '47h 23m',
    status: 'defense',
    createdAt: '2026-01-17 14:32',
  },
  {
    id: 'CHG-0x9a1e...f23',
    targetUnlock: '0x2e7f...d934',
    challenger: '0x1c4d...e891',
    bond: '0.25',
    amount: '120.50',
    deadline: '23h 41m',
    status: 'judgment',
    createdAt: '2026-01-16 09:15',
  },
  {
    id: 'CHG-0x7b3f...a45',
    targetUnlock: '0x5c9a...e127',
    challenger: '0x9f2a...c734',
    bond: '0.50',
    amount: '250.00',
    deadline: '-',
    status: 'resolved',
    createdAt: '2026-01-15 18:42',
    result: 'challenger_won',
  },
  {
    id: 'CHG-0x3d8c...b67',
    targetUnlock: '0x8a4e...f912',
    challenger: '0x2b5f...d823',
    bond: '0.10',
    amount: '30.00',
    deadline: '-',
    status: 'resolved',
    createdAt: '2026-01-14 11:28',
    result: 'prover_won',
  },
  {
    id: 'CHG-0x1e9a...c89',
    targetUnlock: '0x6f3b...a456',
    challenger: '0x4c7d...e234',
    bond: '0.35',
    amount: '180.75',
    deadline: '-',
    status: 'resolved',
    createdAt: '2026-01-13 22:05',
    result: 'challenger_won',
  },
];

export const MOCK_PROVER_STATS: ProverStats = {
  totalProvers: 8,
  activeProvers: 8,
  avgUptime: 99.87,
  avgResponseTime: '1.2s',
  totalSignatures: 45892,
};

export const MOCK_PROVERS: ProverSummary[] = [
  {
    id: 'prover-1',
    name: 'Prover Alpha',
    address: '0x1a2b...3c4d',
    stake: '100.00',
    uptime: 99.99,
    responseTime: '0.8s',
    signaturesCount: 8234,
    status: 'active',
    lastActive: '2m ago',
  },
  {
    id: 'prover-2',
    name: 'Prover Beta',
    address: '0x5e6f...7g8h',
    stake: '100.00',
    uptime: 99.95,
    responseTime: '1.1s',
    signaturesCount: 7892,
    status: 'active',
    lastActive: '1m ago',
  },
  {
    id: 'prover-3',
    name: 'Prover Gamma',
    address: '0x9i0j...1k2l',
    stake: '100.00',
    uptime: 99.92,
    responseTime: '1.3s',
    signaturesCount: 6543,
    status: 'active',
    lastActive: '5m ago',
  },
  {
    id: 'prover-4',
    name: 'Prover Delta',
    address: '0x3m4n...5o6p',
    stake: '100.00',
    uptime: 99.88,
    responseTime: '1.5s',
    signaturesCount: 5421,
    status: 'active',
    lastActive: '3m ago',
  },
  {
    id: 'prover-5',
    name: 'Prover Epsilon',
    address: '0x7q8r...9s0t',
    stake: '100.00',
    uptime: 99.85,
    responseTime: '1.2s',
    signaturesCount: 6234,
    status: 'active',
    lastActive: '8m ago',
  },
  {
    id: 'prover-6',
    name: 'Prover Zeta',
    address: '0x1u2v...3w4x',
    stake: '100.00',
    uptime: 99.78,
    responseTime: '1.8s',
    signaturesCount: 4123,
    status: 'active',
    lastActive: '12m ago',
  },
  {
    id: 'prover-7',
    name: 'Prover Eta',
    address: '0x5y6z...7a8b',
    stake: '100.00',
    uptime: 99.72,
    responseTime: '2.1s',
    signaturesCount: 3892,
    status: 'active',
    lastActive: '15m ago',
  },
  {
    id: 'prover-8',
    name: 'Prover Theta',
    address: '0x9c0d...1e2f',
    stake: '100.00',
    uptime: 99.65,
    responseTime: '1.9s',
    signaturesCount: 3553,
    status: 'active',
    lastActive: '20m ago',
  },
];

export const MOCK_TVL_DATA: TvlDataPoint[] = [
  { date: '01/01', value: 12500 },
  { date: '01/02', value: 12800 },
  { date: '01/03', value: 13200 },
  { date: '01/04', value: 12900 },
  { date: '01/05', value: 13500 },
  { date: '01/06', value: 14200 },
  { date: '01/07', value: 14800 },
  { date: '01/08', value: 15200 },
  { date: '01/09', value: 15600 },
  { date: '01/10', value: 15234 },
];

export const MOCK_VOLUME_DATA: VolumeDataPoint[] = [
  { date: '01/01', locks: 45, unlocks: 32 },
  { date: '01/02', locks: 52, unlocks: 38 },
  { date: '01/03', locks: 48, unlocks: 42 },
  { date: '01/04', locks: 61, unlocks: 35 },
  { date: '01/05', locks: 55, unlocks: 48 },
  { date: '01/06', locks: 72, unlocks: 52 },
  { date: '01/07', locks: 68, unlocks: 58 },
];

export const MOCK_PROVER_PERFORMANCE: ProverPerformance[] = [
  { name: 'Prover Alpha', uptime: 99.9, avgResponse: 1.2 },
  { name: 'Prover Beta', uptime: 99.7, avgResponse: 1.4 },
  { name: 'Prover Gamma', uptime: 99.5, avgResponse: 1.8 },
  { name: 'Prover Delta', uptime: 99.8, avgResponse: 1.3 },
  { name: 'Prover Epsilon', uptime: 99.6, avgResponse: 1.5 },
];

export const MOCK_ANALYTICS_STATS: AnalyticsStats = {
  currentTvl: '15,234.5',
  tvlChange: '+2.8%',
  tvlTrend: 'up',
  totalLocks: '8,234',
  totalUnlocks: '7,891',
  avgLockAmount: '45.2',
  avgLockDuration: '18.5',
  successRate: '98.2%',
  challengeRate: '1.8%',
  resolvedChallenges: 142,
  pendingChallenges: 3,
};

export const MOCK_LOCK_STATUS_DISTRIBUTION: LockStatusDistribution = {
  active: 2847,
  unlocking: 127,
  unlocked: 5260,
};

export const MOCK_UNLOCK_TYPE_DISTRIBUTION: UnlockTypeDistribution = {
  normal: 7623,
  emergency: 268,
};
