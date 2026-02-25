/**
 * Lock API Client
 *
 * Client functions for interacting with the Lock API endpoints (L3 Aegis).
 * Implements SEQUENCES.md Sequence #1: Lock
 *
 * ## Flow (SEQUENCES.md compliant)
 * 1. User → L3 Aegis: LockRequest with Dilithium signature
 * 2. L3 validates ML-DSA-65 signature (NIST FIPS 204)
 * 3. L3 computes SR_0 using SHA3-256
 * 4. L3 returns {lock_id, sr_0, smt_proof}
 * 5. User → L1 Vault: {lock_id, sr_0, amount} (NOT the full public key)
 */

/**
 * Lock request to L3 Aegis
 * Matches services/api/src/types.rs LockRequest
 */
export interface LockRequest {
  /** Target chain ID (e.g., 11155111 for Sepolia) */
  chain_id: number;
  /** Asset address (0x000...000 for native ETH) */
  asset: string;
  /** Amount in wei as string for precision */
  amount: string;
  /** Destination address on L1 */
  dest_addr: string;
  /** Request expiry timestamp (Unix seconds) */
  expiry: number;
  /** Replay protection nonce */
  nonce: number;
  /** ML-DSA-65 (Dilithium-III) public key, hex encoded with 0x prefix */
  pk_dilithium: string;
  /** ML-DSA-65 signature of lock message, hex encoded with 0x prefix */
  sig_dilithium: string;
}

/**
 * Lock response from L3 Aegis
 * Matches services/api/src/types.rs LockResponse
 */
export interface LockResponse {
  /** Unique lock identifier, SHA3-256 hash */
  lock_id: string;
  /** State Root 0: SHA3-256(lock params + pk_dilithium) */
  sr_0: string;
  /** SMT proof for L3 state verification */
  smt_proof: string;
  /** Lock status */
  status: LockStatus;
  /** L1 transaction hash for the lockWithSR0 call (undefined if L1 not configured) */
  l1_tx_hash?: string;
}

/**
 * Lock status enum
 * Matches services/api/src/types.rs LockStatus
 */
export type LockStatus =
  | 'pending'
  | 'confirmed'
  | 'locked'
  | 'unlock_pending'
  | 'released'
  | 'emergency_pending'
  | 'challenged'
  | 'slashed';

/**
 * Lock status response from L3 Aegis
 * Matches services/api/src/types.rs StatusResponse
 */
export interface LockStatusResponse {
  lock_id: string;
  status: LockStatus;
  amount: string;
  asset: string;
  owner: string;
  created_at: number;
  time_lock_remaining: number | null;
  release_time: number | null;
  is_emergency: boolean;
}

export interface ApiError {
  code: string;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Create a new lock via L3 Aegis
 *
 * SEQUENCES.md Sequence #1, Steps 1-4:
 * 1. Receives LockRequest with Dilithium signature
 * 2. Validates ML-DSA-65 signature (NIST FIPS 204)
 * 3. Computes SR_0 = SHA3-256(lock_params + pk_dilithium)
 * 4. Returns {lock_id, sr_0, smt_proof}
 *
 * After this, caller should send {lock_id, sr_0, amount} to L1 Vault.
 */
export async function createLock(request: LockRequest): Promise<LockResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.message || 'Failed to create lock');
  }

  const data = await response.json();
  return data as LockResponse;
}

/**
 * Get lock status from L3 Aegis
 */
export async function getLockStatus(lockId: string): Promise<LockStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/lock/status/${lockId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.message || 'Failed to get lock status');
  }

  const data = await response.json();
  return data as LockStatusResponse;
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

    if (status.status === 'confirmed' || status.status === 'locked') {
      return status;
    }

    if (status.status === 'challenged' || status.status === 'slashed') {
      throw new Error('Lock was challenged or slashed');
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Lock confirmation timed out');
}

/**
 * Construct the lock message for Dilithium signing
 *
 * Message format (matches services/api/src/routes/lock.rs):
 * "QS_LOCK_V1" || chain_id (8 bytes BE) || asset || amount || dest_addr || expiry (8 bytes BE) || nonce (8 bytes BE)
 */
export function constructLockMessage(params: {
  chainId: number;
  asset: string;
  amount: string;
  destAddr: string;
  expiry: number;
  nonce: number;
}): Uint8Array {
  const encoder = new TextEncoder();

  // Prefix
  const prefix = encoder.encode('QS_LOCK_V1');

  // Chain ID as 8-byte big-endian
  const chainIdBytes = new Uint8Array(8);
  const chainIdView = new DataView(chainIdBytes.buffer);
  chainIdView.setBigUint64(0, BigInt(params.chainId), false);

  // Asset, amount, destAddr as UTF-8 bytes
  const assetBytes = encoder.encode(params.asset);
  const amountBytes = encoder.encode(params.amount);
  const destAddrBytes = encoder.encode(params.destAddr);

  // Expiry as 8-byte big-endian
  const expiryBytes = new Uint8Array(8);
  const expiryView = new DataView(expiryBytes.buffer);
  expiryView.setBigUint64(0, BigInt(params.expiry), false);

  // Nonce as 8-byte big-endian
  const nonceBytes = new Uint8Array(8);
  const nonceView = new DataView(nonceBytes.buffer);
  nonceView.setBigUint64(0, BigInt(params.nonce), false);

  // Concatenate all parts
  const totalLength =
    prefix.length +
    chainIdBytes.length +
    assetBytes.length +
    amountBytes.length +
    destAddrBytes.length +
    expiryBytes.length +
    nonceBytes.length;

  const message = new Uint8Array(totalLength);
  let offset = 0;

  message.set(prefix, offset);
  offset += prefix.length;
  message.set(chainIdBytes, offset);
  offset += chainIdBytes.length;
  message.set(assetBytes, offset);
  offset += assetBytes.length;
  message.set(amountBytes, offset);
  offset += amountBytes.length;
  message.set(destAddrBytes, offset);
  offset += destAddrBytes.length;
  message.set(expiryBytes, offset);
  offset += expiryBytes.length;
  message.set(nonceBytes, offset);

  return message;
}
