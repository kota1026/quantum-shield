/**
 * Unlock API Client
 *
 * Client functions for interacting with the Unlock API endpoints (L3 Aegis).
 * Implements SEQUENCES.md Sequence #2 (Normal) and #3 (Emergency)
 *
 * ## Flow (SEQUENCES.md compliant - Normal Unlock)
 * 1. User selects lock to unlock
 * 2. User signs unlock request with Dilithium (ML-DSA-65)
 * 3. User → L3 Aegis: UnlockRequest with signature
 * 4. L3 validates ML-DSA-65 signature (NIST FIPS 204)
 * 5. L3 computes SR_1 using SHA3-256
 * 6. L3 initiates VRF prover selection
 * 7. L3 returns {unlock_id, sr_1, release_time, selected_provers}
 * 8. 24h waiting period begins
 *
 * ## Flow (Emergency Unlock)
 * 1. User selects lock for emergency unlock
 * 2. User signs request + provides bond
 * 3. L3 validates and starts 7-day waiting period
 */

/**
 * Unlock request to L3 Aegis
 * Matches services/api/src/types.rs UnlockRequest
 */
export interface UnlockRequest {
  /** Lock ID to unlock */
  lock_id: string;
  /** Destination address for unlocked funds */
  dest_addr: string;
  /** Amount to unlock in wei as string */
  amount: string;
  /** ML-DSA-65 signature of unlock message, hex encoded with 0x prefix */
  sig_dilithium: string;
}

/**
 * Unlock response from L3 Aegis (Normal path)
 * Matches services/api/src/types.rs UnlockResponse
 */
export interface UnlockResponse {
  /** Unique unlock identifier */
  unlock_id: string;
  /** State Root 1: SHA3-256(sr_0 + unlock params) */
  sr_1: string;
  /** When funds can be claimed (Unix timestamp) */
  release_time: number;
  /** Time lock duration in hours (24 for normal) */
  time_lock_hours: number;
  /** Number of prover signatures required */
  prover_signatures_required: number;
  /** Number of prover signatures collected */
  prover_signatures_collected: number;
  /** Current unlock status */
  status: UnlockStatus;
  /** VRF request ID */
  vrf_request_id?: string;
  /** Selected provers for signature collection */
  selected_provers: string[];
  /** VRF status */
  vrf_status: VRFStatus;
}

/**
 * Emergency unlock response
 */
export interface EmergencyUnlockResponse {
  /** Unique unlock identifier */
  unlock_id: string;
  /** State Root 1 */
  sr_1: string;
  /** When funds can be claimed (Unix timestamp, 7 days from now) */
  release_time: number;
  /** Time lock duration in days (7 for emergency) */
  time_lock_days: number;
  /** Bond amount required */
  bond_required: string;
  /** Bond calculation explanation */
  bond_calculation: string;
  /** Current status */
  status: UnlockStatus;
}

/**
 * Unlock status enum
 */
export type UnlockStatus =
  | 'pending_signatures'
  | 'signatures_complete'
  | 'waiting_timelock'
  | 'claimable'
  | 'claimed'
  | 'emergency_pending'
  | 'challenged'
  | 'cancelled';

/**
 * VRF status enum
 */
export type VRFStatus =
  | 'pending'
  | 'fulfilled'
  | 'fallback'
  | 'failed';

/**
 * Unlock status response from L3 Aegis
 */
export interface UnlockStatusResponse {
  unlock_id: string;
  lock_id: string;
  status: UnlockStatus;
  sr_1: string;
  release_time: number;
  time_lock_remaining: number | null;
  prover_signatures_required: number;
  prover_signatures_collected: number;
  selected_provers: string[];
  vrf_status: VRFStatus;
  is_emergency: boolean;
  bond_amount?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Request normal unlock via L3 Aegis (24h timelock)
 *
 * SEQUENCES.md Sequence #2:
 * 1. Validates ML-DSA-65 signature
 * 2. Computes SR_1
 * 3. Initiates VRF prover selection
 * 4. Returns unlock_id, sr_1, release_time
 */
export async function requestUnlock(request: UnlockRequest): Promise<UnlockResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.message || 'Failed to request unlock');
  }

  const data = await response.json();
  return data as UnlockResponse;
}

/**
 * Request emergency unlock via L3 Aegis (7-day timelock + bond)
 *
 * SEQUENCES.md Sequence #3:
 * - Requires emergency bond: MAX(0.5 ETH, amount × 5%)
 * - 7-day timelock instead of 24h
 * - No prover signatures required
 */
export async function requestEmergencyUnlock(request: UnlockRequest): Promise<EmergencyUnlockResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/unlock/emergency`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.message || 'Failed to request emergency unlock');
  }

  const data = await response.json();
  return data as EmergencyUnlockResponse;
}

/**
 * Get unlock status from L3 Aegis
 */
export async function getUnlockStatus(unlockId: string): Promise<UnlockStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/unlock/status/${unlockId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.message || 'Failed to get unlock status');
  }

  const data = await response.json();
  return data as UnlockStatusResponse;
}

/**
 * Poll for unlock progress
 */
export async function waitForUnlockProgress(
  unlockId: string,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (status: UnlockStatusResponse) => void;
  } = {}
): Promise<UnlockStatusResponse> {
  const { maxAttempts = 60, intervalMs = 2000, onProgress } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getUnlockStatus(unlockId);

    if (onProgress) {
      onProgress(status);
    }

    // Check for completion states
    if (status.status === 'waiting_timelock' || status.status === 'claimable') {
      return status;
    }

    // Check for error states
    if (status.status === 'challenged' || status.status === 'cancelled') {
      throw new Error(`Unlock ${status.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Unlock progress timed out');
}

/**
 * Construct the unlock message for Dilithium signing
 *
 * Message format (matches services/api/src/routes/unlock.rs):
 * "QS_UNLOCK_V1" || lock_id || dest_addr || amount
 */
export function constructUnlockMessage(params: {
  lockId: string;
  destAddr: string;
  amount: string;
}): Uint8Array {
  const encoder = new TextEncoder();

  // Prefix
  const prefix = encoder.encode('QS_UNLOCK_V1');

  // Lock ID, dest addr, amount as UTF-8 bytes
  const lockIdBytes = encoder.encode(params.lockId);
  const destAddrBytes = encoder.encode(params.destAddr);
  const amountBytes = encoder.encode(params.amount);

  // Concatenate all parts
  const totalLength =
    prefix.length +
    lockIdBytes.length +
    destAddrBytes.length +
    amountBytes.length;

  const message = new Uint8Array(totalLength);
  let offset = 0;

  message.set(prefix, offset);
  offset += prefix.length;
  message.set(lockIdBytes, offset);
  offset += lockIdBytes.length;
  message.set(destAddrBytes, offset);
  offset += destAddrBytes.length;
  message.set(amountBytes, offset);

  return message;
}

/**
 * Calculate emergency bond amount
 * Formula: MAX(0.5 ETH, amount × 5%)
 *
 * @param amountWei Lock amount in wei
 * @returns Bond amount in wei as string
 */
export function calculateEmergencyBond(amountWei: string): string {
  const MIN_BOND_WEI = BigInt('500000000000000000'); // 0.5 ETH
  const amount = BigInt(amountWei);
  const percentageBond = (amount * BigInt(500)) / BigInt(10000); // 5%

  const bond = percentageBond > MIN_BOND_WEI ? percentageBond : MIN_BOND_WEI;
  return bond.toString();
}
