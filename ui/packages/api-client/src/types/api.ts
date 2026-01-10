// Common types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth types
export interface NonceResponse {
  nonce: string;
}

export interface VerifyRequest {
  message: string;
  signature: string;
}

export interface AuthSession {
  address: string;
  chainId: number;
  expiresAt: string;
  token: string;
}

// User types
export interface User {
  address: string;
  dilithiumPublicKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLock {
  lockId: string;
  amount: string;
  dilithiumPublicKey: string;
  lockedAt: string;
  status: 'active' | 'unlocking' | 'unlocked';
}

export interface UserUnlock {
  unlockId: string;
  lockId: string;
  amount: string;
  requestedAt: string;
  unlockTime: string;
  isEmergency: boolean;
  status: 'pending' | 'ready' | 'completed' | 'challenged' | 'cancelled';
}

// Lock types
export interface LockRequest {
  amount: string;
  dilithiumPublicKey: string;
  userSignature: string;
}

export interface LockResponse {
  lockId: string;
  txHash: string;
}

export interface UnlockRequest {
  lockId: string;
  amount: string;
  dilithiumSignature: string;
}

export interface EmergencyUnlockRequest {
  lockId: string;
  amount: string;
  bondAmount: string;
}

export interface UnlockResponse {
  unlockId: string;
  txHash: string;
  unlockTime: string;
}

// Prover types
export interface Prover {
  address: string;
  name: string;
  sphincsPublicKey: string;
  stakeAmount: string;
  status: 'pending' | 'active' | 'suspended' | 'exiting';
  performance: {
    signaturesProcessed: number;
    averageResponseTime: number;
    uptime: number;
  };
  createdAt: string;
}

export interface ProverApplication {
  id: string;
  address: string;
  companyName: string;
  contactEmail: string;
  technicalSpecs: {
    hsmType: string;
    infrastructure: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface SignatureRequest {
  id: string;
  lockId: string;
  unlockId: string;
  messageHash: string;
  createdAt: string;
  status: 'pending' | 'signed' | 'expired';
}

// Explorer types
export interface ExplorerStats {
  totalValueLocked: string;
  totalLocks: number;
  totalUnlocks: number;
  activeLocks: number;
  pendingUnlocks: number;
  activeProvers: number;
}

export interface ExplorerLock {
  lockId: string;
  owner: string;
  amount: string;
  lockedAt: string;
  txHash: string;
}

export interface ExplorerUnlock {
  unlockId: string;
  lockId: string;
  amount: string;
  requestedAt: string;
  unlockTime: string;
  isEmergency: boolean;
  status: string;
  txHash: string;
}
