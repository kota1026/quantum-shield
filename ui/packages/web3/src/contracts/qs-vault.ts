// Quantum Shield Vault contract ABI and addresses
// Generated from contracts/src/QuantumShieldVault.sol

export const QS_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_QS_VAULT_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

// =============================================================================
// Type Definitions for L1Vault Contract Returns
// =============================================================================

/**
 * Lock status enum matching L1Vault.sol
 */
export enum LockStatus {
  Active = 0,
  UnlockRequested = 1,
  Unlocked = 2,
  Slashed = 3,
}

/**
 * Unlock status enum matching L1Vault.sol
 */
export enum UnlockStatus {
  Pending = 0,
  Ready = 1,
  Executed = 2,
  Cancelled = 3,
  Challenged = 4,
}

/**
 * Lock struct returned by getLock()
 */
export interface QSLock {
  owner: `0x${string}`;
  amount: bigint;
  dilithiumPublicKey: `0x${string}`;
  lockedAt: bigint;
  status: LockStatus;
}

/**
 * UnlockRequest struct returned by getUnlockRequest()
 */
export interface QSUnlockRequest {
  lockId: bigint;
  amount: bigint;
  requestedAt: bigint;
  unlockTime: bigint;
  isEmergency: boolean;
  status: UnlockStatus;
}

/**
 * Type guard to check if data is a valid QSLock
 */
export function isQSLock(data: unknown): data is QSLock {
  if (!data || typeof data !== 'object') return false;
  const lock = data as Record<string, unknown>;
  return (
    typeof lock.owner === 'string' &&
    typeof lock.amount === 'bigint' &&
    typeof lock.dilithiumPublicKey === 'string' &&
    typeof lock.lockedAt === 'bigint' &&
    typeof lock.status === 'number'
  );
}

/**
 * Type guard to check if data is a valid QSUnlockRequest
 */
export function isQSUnlockRequest(data: unknown): data is QSUnlockRequest {
  if (!data || typeof data !== 'object') return false;
  const req = data as Record<string, unknown>;
  return (
    typeof req.lockId === 'bigint' &&
    typeof req.amount === 'bigint' &&
    typeof req.requestedAt === 'bigint' &&
    typeof req.unlockTime === 'bigint' &&
    typeof req.isEmergency === 'boolean' &&
    typeof req.status === 'number'
  );
}

/**
 * Helper to safely parse lock data from contract
 */
export function parseLockData(data: unknown): QSLock | null {
  if (!data) return null;
  
  // Handle tuple array format from wagmi
  if (Array.isArray(data) && data.length >= 5) {
    return {
      owner: data[0] as `0x${string}`,
      amount: BigInt(data[1]),
      dilithiumPublicKey: data[2] as `0x${string}`,
      lockedAt: BigInt(data[3]),
      status: Number(data[4]) as LockStatus,
    };
  }
  
  // Handle object format
  if (isQSLock(data)) {
    return data;
  }
  
  // Handle partial object with type coercion
  const obj = data as Record<string, unknown>;
  if (obj.owner !== undefined) {
    return {
      owner: String(obj.owner) as `0x${string}`,
      amount: BigInt(obj.amount ?? 0),
      dilithiumPublicKey: String(obj.dilithiumPublicKey ?? '0x') as `0x${string}`,
      lockedAt: BigInt(obj.lockedAt ?? 0),
      status: Number(obj.status ?? 0) as LockStatus,
    };
  }
  
  return null;
}

/**
 * Helper to safely parse unlock request data from contract
 */
export function parseUnlockRequestData(data: unknown): QSUnlockRequest | null {
  if (!data) return null;
  
  // Handle tuple array format from wagmi
  if (Array.isArray(data) && data.length >= 6) {
    return {
      lockId: BigInt(data[0]),
      amount: BigInt(data[1]),
      requestedAt: BigInt(data[2]),
      unlockTime: BigInt(data[3]),
      isEmergency: Boolean(data[4]),
      status: Number(data[5]) as UnlockStatus,
    };
  }
  
  // Handle object format
  if (isQSUnlockRequest(data)) {
    return data;
  }
  
  // Handle partial object with type coercion
  const obj = data as Record<string, unknown>;
  if (obj.lockId !== undefined) {
    return {
      lockId: BigInt(obj.lockId ?? 0),
      amount: BigInt(obj.amount ?? 0),
      requestedAt: BigInt(obj.requestedAt ?? 0),
      unlockTime: BigInt(obj.unlockTime ?? 0),
      isEmergency: Boolean(obj.isEmergency ?? false),
      status: Number(obj.status ?? 0) as UnlockStatus,
    };
  }
  
  return null;
}

// =============================================================================
// Contract ABI
// =============================================================================

export const QS_VAULT_ABI = [
  {
    type: 'function',
    name: 'lock',
    inputs: [
      { name: 'dilithiumPublicKey', type: 'bytes', internalType: 'bytes' },
      { name: 'userSignature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: 'lockId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'requestUnlock',
    inputs: [
      { name: 'lockId', type: 'uint256', internalType: 'uint256' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'dilithiumSignature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: 'unlockId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'executeUnlock',
    inputs: [{ name: 'unlockId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'requestEmergencyUnlock',
    inputs: [
      { name: 'lockId', type: 'uint256', internalType: 'uint256' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'unlockId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getLock',
    inputs: [{ name: 'lockId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IQSVault.Lock',
        components: [
          { name: 'owner', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'dilithiumPublicKey', type: 'bytes', internalType: 'bytes' },
          { name: 'lockedAt', type: 'uint256', internalType: 'uint256' },
          { name: 'status', type: 'uint8', internalType: 'enum IQSVault.LockStatus' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUnlockRequest',
    inputs: [{ name: 'unlockId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IQSVault.UnlockRequest',
        components: [
          { name: 'lockId', type: 'uint256', internalType: 'uint256' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'requestedAt', type: 'uint256', internalType: 'uint256' },
          { name: 'unlockTime', type: 'uint256', internalType: 'uint256' },
          { name: 'isEmergency', type: 'bool', internalType: 'bool' },
          { name: 'status', type: 'uint8', internalType: 'enum IQSVault.UnlockStatus' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserLocks',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Locked',
    inputs: [
      { name: 'lockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'UnlockRequested',
    inputs: [
      { name: 'unlockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'lockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'unlockTime', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Unlocked',
    inputs: [
      { name: 'unlockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'lockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;
