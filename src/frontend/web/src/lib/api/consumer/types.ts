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

/** Matches backend LockStatus enum (serde rename_all = "snake_case") */
export type LockStatus =
  | 'pending'
  | 'confirmed'
  | 'locked'
  | 'unlock_pending'
  | 'released'
  | 'emergency_pending'
  | 'challenged'
  | 'slashed';

export interface LockItem {
  id: string;
  lockId: string;
  amount: string;
  asset: string;
  chainId: number;
  destAddr: string;
  status: LockStatus;
  sr0: string;
  createdAt: string;
  releaseTime?: number;
  remainingTime?: string;
}

export interface LocksResponse {
  locks: LockItem[];
  total: number;
}

/** Matches backend LockRequest (POST /v1/lock) */
export interface CreateLockRequest {
  chain_id: number;
  asset: string;
  amount: string;
  dest_addr: string;
  pk_dilithium: string;
  sig_dilithium: string;
  expiry: number;
  nonce: number;
}

/** Matches backend LockResponse */
export interface CreateLockResponse {
  lock_id: string;
  sr_0: string;
  smt_proof: string;
  status: LockStatus;
  l1_tx_hash?: string;
}

// ==================== UNLOCK TYPES ====================

/** Matches backend UnlockRequest (POST /v1/unlock) */
export interface UnlockRequest {
  lock_id: string;
  dest_addr: string;
  amount: string;
  sig_dilithium: string;
}

export interface EmergencyUnlockRequest {
  lock_id: string;
  dest_addr: string;
  amount: string;
  sig_dilithium: string;
}

/** Matches backend UnlockResponse */
export interface UnlockResponse {
  unlock_id: string;
  sr_1: string;
  release_time: number;
  time_lock_hours: number;
  prover_signatures_required: number;
  prover_signatures_collected: number;
  status: string;
  vrf_request_id?: string;
  selected_provers: string[];
  vrf_status: string;
}

/** Matches backend UnlockStatus enum */
export type UnlockStatus = 'pending_signatures' | 'submitted' | 'emergency_pending';

/** Matches backend ClaimUnlockRequest (POST /v1/unlock/claim) */
export interface ClaimUnlockRequest {
  lock_id: string;
}

/** Matches backend ClaimUnlockResponse */
export interface ClaimUnlockResponse {
  lock_id: string;
  status: LockStatus;
  l1_tx_hash?: string;
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
