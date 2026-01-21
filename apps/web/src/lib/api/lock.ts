/**
 * Lock API Client
 *
 * Client functions for interacting with the Lock API endpoints.
 * Supports both mock (development) and real API (production) modes.
 */

export interface LockRequest {
  amount: string;
  periodYears: number;
  dilithiumPubkey?: string;
}

export interface LockResponse {
  lockId: string;
  status: 'pending';
  amount: string;
  periodYears: number;
  unlockDate: string;
  txHash: string;
  createdAt: string;
}

export interface LockStatusResponse {
  lockId: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  amount: string;
  periodYears: number;
  unlockDate: string;
  txHash: string;
  confirmations: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  code: string;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Create a new lock
 */
export async function createLock(request: LockRequest): Promise<LockResponse> {
  const response = await fetch(`${API_BASE_URL}/api/lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: request.amount,
      period_years: request.periodYears,
      dilithium_pubkey: request.dilithiumPubkey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create lock');
  }

  const data = await response.json();

  return {
    lockId: data.lock_id,
    status: data.status,
    amount: data.amount,
    periodYears: data.period_years,
    unlockDate: data.unlock_date,
    txHash: data.tx_hash,
    createdAt: data.created_at,
  };
}

/**
 * Get lock status
 */
export async function getLockStatus(lockId: string): Promise<LockStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/lock/status/${lockId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get lock status');
  }

  const data = await response.json();

  return {
    lockId: data.lock_id,
    status: data.status,
    amount: data.amount,
    periodYears: data.period_years,
    unlockDate: data.unlock_date,
    txHash: data.tx_hash,
    confirmations: data.confirmations,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Poll for lock confirmation
 */
export async function waitForLockConfirmation(
  lockId: string,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (status: LockStatusResponse) => void;
  } = {}
): Promise<LockStatusResponse> {
  const { maxAttempts = 30, intervalMs = 2000, onProgress } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getLockStatus(lockId);

    if (onProgress) {
      onProgress(status);
    }

    if (status.status === 'confirmed') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error('Lock transaction failed');
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Lock confirmation timed out');
}
