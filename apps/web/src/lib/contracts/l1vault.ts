/**
 * L1Vault Contract Configuration
 *
 * Deployed on Sepolia testnet (Chain ID: 11155111)
 * See: docs/DEPLOYED_CONTRACTS.md
 *
 * ## SEQUENCES.md Compliant Flow
 * 1. User → L3 Aegis: LockRequest with Dilithium signature
 * 2. L3 computes SR_0 and lock_id (SHA3-256)
 * 3. L3 → User: {lock_id, sr_0, smt_proof}
 * 4. User → L1 Vault: lockWithSR0(lock_id, sr_0, recipient, expiry) + ETH
 */

// L1Vault contract address on Sepolia
// Deployed: 2026-02-05 with lockWithSR0 function (SEQUENCES.md compliant)
export const L1_VAULT_ADDRESS = '0x78f649d20d02E7064EDD14F2E0bf64EBc0392a14' as const;

// Sepolia chain ID
export const SEPOLIA_CHAIN_ID = 11155111;

// L1Vault ABI (SEQUENCES.md compliant functions)
export const L1_VAULT_ABI = [
  // SEQUENCES.md compliant lock function (RECOMMENDED)
  {
    type: 'function',
    name: 'lockWithSR0',
    inputs: [
      { name: 'lockId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'sr0', type: 'bytes32', internalType: 'bytes32' },
      { name: 'recipient', type: 'address', internalType: 'address' },
      { name: 'expiry', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  // Legacy lock function (DEPRECATED - high gas cost)
  {
    type: 'function',
    name: 'lock',
    inputs: [
      { name: 'recipient', type: 'address', internalType: 'address' },
      { name: 'dilithiumPubKey', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: 'lockId', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'payable',
  },
  // Legacy lockWithExpiry (DEPRECATED - high gas cost)
  {
    type: 'function',
    name: 'lockWithExpiry',
    inputs: [
      { name: 'recipient', type: 'address', internalType: 'address' },
      { name: 'dilithiumPubKey', type: 'bytes', internalType: 'bytes' },
      { name: 'expiry', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'lockId', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'payable',
  },
  // View functions
  {
    type: 'function',
    name: 'getLock',
    inputs: [{ name: 'lockId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct L1Vault.Lock',
        components: [
          { name: 'sender', type: 'address', internalType: 'address' },
          { name: 'recipient', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'dilithiumPubKeyHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'lockedAt', type: 'uint256', internalType: 'uint256' },
          { name: 'status', type: 'uint8', internalType: 'enum L1Vault.LockStatus' },
          { name: 'stateRoot', type: 'bytes32', internalType: 'bytes32' },
          { name: 'expiry', type: 'uint256', internalType: 'uint256' },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalLocked',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MIN_LOCK_AMOUNT',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'TVL_CAP',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  // User balance functions
  {
    type: 'function',
    name: 'lockedBalanceOf',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserLockIds',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'lockIds', type: 'bytes32[]', internalType: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'userLockedBalance',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'Locked',
    inputs: [
      { name: 'lockId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'recipient', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'dilithiumPubKeyHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'stateRoot', type: 'bytes32', indexed: false, internalType: 'bytes32' },
    ],
    anonymous: false,
  },
] as const;

/**
 * Parameters for SEQUENCES.md compliant lock (RECOMMENDED)
 * Use this with lockWithSR0 function
 */
export interface LockWithSR0Params {
  /** Lock ID from L3 Aegis (SHA3-256 hash) */
  lockId: `0x${string}`;
  /** State Root 0 from L3 Aegis (SHA3-256 hash) */
  sr0: `0x${string}`;
  /** Recipient address for unlock */
  recipient: `0x${string}`;
  /** Expiry timestamp (Unix seconds) */
  expiry: bigint;
  /** ETH amount in wei */
  value: bigint;
}

/**
 * @deprecated Use LockWithSR0Params instead
 * Legacy lock parameters (high gas cost - ~15.5M for SHA3-256)
 */
export interface LockParams {
  recipient: `0x${string}`;
  dilithiumPubKey: `0x${string}`;
  value: bigint;
}

/**
 * @deprecated Use LockWithSR0Params instead
 * Legacy lockWithExpiry parameters (high gas cost - ~15.5M for SHA3-256)
 */
export interface LockWithExpiryParams extends LockParams {
  expiry: bigint;
}
