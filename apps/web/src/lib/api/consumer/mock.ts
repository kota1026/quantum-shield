/**
 * Consumer App Mock Data
 *
 * Provides mock data and types for Consumer App components.
 * Used as fallback when API is unavailable.
 */

// ==================== TYPES ====================

export interface ConsumerStats {
  totalLocked: number;
  available: number;
  pendingUnlock: number;
  transactions: number;
}

export interface Transaction {
  id: string;
  type: 'lock' | 'unlock' | 'unlocking';
  amount: string;
  timestamp: string;
  status: 'complete' | 'pending';
}

export type TransactionType =
  | 'lock'
  | 'normalUnlock'
  | 'emergencyUnlock'
  | 'unlockComplete';

export type TransactionStatus =
  | 'complete'
  | 'pending24h'
  | 'pending7d'
  | 'processing';

export interface HistoryTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  timestamp: string;
  txHash: string;
  blockConfirmed?: number;
  remainingTime?: string;
  bondAmount?: string;
}

export interface HistoryStatsData {
  totalLocked: string;
  totalLockedUnit: string;
  totalTransactions: number;
  inProgress: number;
}

export interface LockItem {
  id: string;
  number: number;
  amount: string;
  timestamp: string;
  status: 'locked' | 'pending' | 'unlocking';
  remainingTime?: string;
}

export type NotificationType =
  | 'lockComplete'
  | 'unlockStarted'
  | 'unlockComplete'
  | 'emergencyStarted'
  | 'emergencyComplete'
  | 'securityAlert'
  | 'systemUpdate';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface UserSettings {
  walletAddress: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  biometricAuth: boolean;
  currency: string;
  autoLockMinutes: number;
  locale: string;
}

export interface KeyInfo {
  publicKey: string;
  secretKey: string;
  createdAt: string;
  lastBackup: string;
  algorithm: string;
}

export interface EmergencyUnlockData {
  amount: string;
  symbol: string;
  waitDays: number;
}

export interface EmergencyResultData {
  amount: string;
  symbol: string;
  bond: string;
  waitDays: number;
  completionDate: string;
  txHash: string;
}

// ==================== MOCK DATA ====================

export const MOCK_CONSUMER_STATS: ConsumerStats = {
  totalLocked: 24.85,
  available: 12.5,
  pendingUnlock: 2,
  transactions: 47,
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'lock',
    amount: '5.00 ETH',
    timestamp: '2026-01-06 14:32',
    status: 'complete',
  },
  {
    id: '2',
    type: 'unlocking',
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    status: 'pending',
  },
  {
    id: '3',
    type: 'unlock',
    amount: '1.25 ETH',
    timestamp: '2026-01-03 18:45',
    status: 'complete',
  },
];

export const MOCK_HISTORY_STATS: HistoryStatsData = {
  totalLocked: '24.85',
  totalLockedUnit: 'ETH',
  totalTransactions: 15,
  inProgress: 2,
};

export const MOCK_HISTORY_TRANSACTIONS: HistoryTransaction[] = [
  {
    id: '1',
    type: 'lock',
    status: 'complete',
    amount: '5.00 ETH',
    timestamp: '2026-01-06 14:32',
    txHash: '0x7a3f...9c2d',
    blockConfirmed: 12,
  },
  {
    id: '2',
    type: 'normalUnlock',
    status: 'pending24h',
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    txHash: '0x8b4c...1e5f',
    remainingTime: '23:41:02',
  },
  {
    id: '3',
    type: 'emergencyUnlock',
    status: 'pending7d',
    amount: '0.75 ETH',
    timestamp: '2026-01-04 18:00',
    txHash: '0x2d7a...4f8b',
    bondAmount: '0.5 ETH',
  },
  {
    id: '4',
    type: 'unlockComplete',
    status: 'complete',
    amount: '1.25 ETH',
    timestamp: '2026-01-03 18:45',
    txHash: '0x5e9c...3a7d',
    blockConfirmed: 12,
  },
  {
    id: '5',
    type: 'lock',
    status: 'complete',
    amount: '10.00 ETH',
    timestamp: '2026-01-02 10:20',
    txHash: '0x1f4a...8c2e',
    blockConfirmed: 12,
  },
  {
    id: '6',
    type: 'lock',
    status: 'complete',
    amount: '5.35 ETH',
    timestamp: '2026-01-01 08:00',
    txHash: '0x9b3e...7d1a',
    blockConfirmed: 12,
  },
];

export const MOCK_LOCKS: LockItem[] = [
  {
    id: '1',
    number: 1,
    amount: '10.00 ETH',
    timestamp: '2026-01-01 10:00',
    status: 'locked',
  },
  {
    id: '2',
    number: 2,
    amount: '5.00 ETH',
    timestamp: '2026-01-03 14:30',
    status: 'locked',
  },
  {
    id: '3',
    number: 3,
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    status: 'pending',
    remainingTime: '23:41:02',
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'lockComplete',
    title: 'Lock完了',
    message: '5.00 ETHのロックが完了しました',
    timestamp: '2026-01-16 14:32',
    read: false,
    link: '/consumer/history/1',
  },
  {
    id: '2',
    type: 'unlockStarted',
    title: 'Unlock開始',
    message: '2.50 ETHのアンロックを開始しました。24時間後に完了します。',
    timestamp: '2026-01-15 09:15',
    read: false,
    link: '/consumer/history/2',
  },
  {
    id: '3',
    type: 'securityAlert',
    title: 'セキュリティアラート',
    message: '新しいデバイスからのアクセスを検出しました',
    timestamp: '2026-01-14 22:00',
    read: true,
  },
  {
    id: '4',
    type: 'unlockComplete',
    title: 'Unlock完了',
    message: '1.25 ETHがウォレットに送金されました',
    timestamp: '2026-01-13 18:45',
    read: true,
    link: '/consumer/history/4',
  },
  {
    id: '5',
    type: 'systemUpdate',
    title: 'システム更新',
    message: '新機能が追加されました。詳細を確認してください。',
    timestamp: '2026-01-12 10:00',
    read: true,
  },
];

export const MOCK_USER_SETTINGS: UserSettings = {
  walletAddress: '0x7a3f9c2d8e1b4f6a0c5d7e9f2b4a6c8d',
  pushNotifications: true,
  emailNotifications: false,
  darkMode: true,
  biometricAuth: true,
  currency: 'JPY (¥)',
  autoLockMinutes: 5,
  locale: 'ja',
};

export const MOCK_KEY_INFO: KeyInfo = {
  publicKey: '0x7a3f9c2d8e1b4f6a0c5d7e9f2b4a6c8d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a0b...',
  secretKey: '5f8c2a3b7d9e1f4a6c0b8d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4...',
  createdAt: '2026-01-01 10:00:00',
  lastBackup: '2026-01-01 10:05:32',
  algorithm: 'ML-DSA-65 (Dilithium)',
};

export const MOCK_EMERGENCY_UNLOCK_DATA: EmergencyUnlockData = {
  amount: '10.00',
  symbol: 'ETH',
  waitDays: 7,
};

export const MOCK_EMERGENCY_RESULT: EmergencyResultData = {
  amount: '10.00',
  symbol: 'ETH',
  bond: '0.50',
  waitDays: 7,
  completionDate: '2026-01-21 14:35:00',
  txHash: '0x9c5h2e4f8a3b7d1c6e9f0a2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d',
};

// ==================== MOCK ENDPOINTS ====================

export const CONSUMER_MOCK_ENDPOINTS: Record<string, unknown> = {
  '/api/consumer/stats': { stats: MOCK_CONSUMER_STATS },
  '/api/consumer/transactions': {
    transactions: MOCK_TRANSACTIONS,
    total: MOCK_TRANSACTIONS.length,
  },
  '/api/consumer/history': {
    stats: MOCK_HISTORY_STATS,
    transactions: MOCK_HISTORY_TRANSACTIONS,
    total: MOCK_HISTORY_TRANSACTIONS.length,
  },
  '/api/consumer/locks': { locks: MOCK_LOCKS, total: MOCK_LOCKS.length },
  '/api/consumer/notifications': {
    notifications: MOCK_NOTIFICATIONS,
    unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
  },
  '/api/consumer/settings': { settings: MOCK_USER_SETTINGS },
  '/api/consumer/key-info': { keyInfo: MOCK_KEY_INFO },
  '/api/consumer/emergency-unlock': { data: MOCK_EMERGENCY_UNLOCK_DATA },
  '/api/consumer/emergency-result': { data: MOCK_EMERGENCY_RESULT },
};
