/**
 * Consumer API Types
 *
 * Type definitions for Consumer App API responses and data models.
 */

// ==================== AUTH TYPES ====================

export interface SiweAuthRequest {
  message: string;
  signature: string;
  public_key: string;
}

export interface SiweAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  address: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_at: number;
}

export interface UserInfo {
  address: string;
  created_at: string;
}

// ==================== DASHBOARD TYPES ====================

export interface ConsumerStats {
  totalLocked: number;
  available: number;
  pendingUnlock: number;
  transactions: number;
}

export interface DashboardResponse {
  balance: string;
  locks: number;
  transactions: number;
}

// ==================== TRANSACTION TYPES ====================

export type TransactionType =
  | 'lock'
  | 'unlock'
  | 'unlocking'
  | 'normalUnlock'
  | 'emergencyUnlock'
  | 'unlockComplete';

export type TransactionStatus =
  | 'complete'
  | 'pending'
  | 'pending24h'
  | 'pending7d'
  | 'processing';

export interface Transaction {
  id: string;
  type: 'lock' | 'unlock' | 'unlocking';
  amount: string;
  timestamp: string;
  status: 'complete' | 'pending';
}

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

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

// ==================== LOCK TYPES ====================

export type LockStatus = 'locked' | 'pending' | 'unlocking';

export interface LockItem {
  id: string;
  number: number;
  amount: string;
  timestamp: string;
  status: LockStatus;
  remainingTime?: string;
}

export interface LocksResponse {
  locks: LockItem[];
  total: number;
}

export interface CreateLockRequest {
  amount: string;
  token: string;
}

export interface CreateLockResponse {
  lockId: string;
  txHash: string;
}

// ==================== UNLOCK TYPES ====================

export interface UnlockRequest {
  lockId: string;
}

export interface EmergencyUnlockRequest {
  lockId: string;
  bondAmount: string;
}

export interface UnlockResponse {
  unlockId: string;
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

// ==================== NOTIFICATION TYPES ====================

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

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ==================== SETTINGS TYPES ====================

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

export interface UserSettingsResponse {
  settings: UserSettings;
}

// ==================== KEY TYPES ====================

export interface KeyInfo {
  publicKey: string;
  secretKey: string;
  createdAt: string;
  lastBackup: string;
  algorithm: string;
}

export interface KeyInfoResponse {
  keyInfo: KeyInfo;
}

// ==================== PAGINATION TYPES ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
}
