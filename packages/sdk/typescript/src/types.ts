/**
 * Core type definitions for Quantum Shield SDK
 *
 * @module types
 */

/**
 * Lock operation types
 */
export enum UnlockType {
  /** Normal unlock with 24h timelock */
  Normal = 'normal',
  /** Emergency unlock with 7d timelock + bond */
  Emergency = 'emergency',
}

/**
 * Lock status values
 */
export enum LockStatus {
  /** Lock is active and can be unlocked */
  Active = 'active',
  /** Unlock has been initiated, waiting for timelock */
  Pending = 'pending',
  /** Funds have been released */
  Released = 'released',
  /** Lock has been challenged */
  Challenged = 'challenged',
  /** Lock was slashed */
  Slashed = 'slashed',
}

/**
 * Supported networks
 */
export enum Network {
  /** Ethereum Mainnet */
  Mainnet = 'mainnet',
  /** Sepolia Testnet */
  Sepolia = 'sepolia',
  /** Local Development */
  Local = 'local',
}

/**
 * Lock data structure
 */
export interface Lock {
  /** Unique lock identifier */
  id: string;
  /** Owner's Ethereum address */
  owner: string;
  /** Locked amount in wei */
  amount: bigint;
  /** Token address (0x0 for ETH) */
  tokenAddress: string;
  /** SHA3-256 hash of Dilithium public key */
  dilithiumPubKeyHash: string;
  /** Lock creation timestamp */
  createdAt: number;
  /** Current lock status */
  status: LockStatus;
  /** Unlock request details (if pending) */
  unlockRequest?: UnlockRequest;
}

/**
 * Unlock request data
 */
export interface UnlockRequest {
  /** Type of unlock (normal/emergency) */
  type: UnlockType;
  /** Recipient address */
  recipient: string;
  /** Request timestamp */
  requestedAt: number;
  /** Timelock expiry timestamp */
  timelockExpiry: number;
  /** Bond amount (for emergency unlock) */
  bondAmount?: bigint;
}

/**
 * Lock operation request
 */
export interface LockRequest {
  /** Amount to lock in wei */
  amount: bigint;
  /** Token address (0x0 for ETH) */
  tokenAddress: string;
  /** SHA3-256 hash of Dilithium public key */
  dilithiumPubKeyHash: string;
}

/**
 * Unlock operation request
 */
export interface UnlockRequestData {
  /** Lock ID to unlock */
  lockId: string;
  /** Type of unlock */
  type: UnlockType;
  /** Recipient address */
  recipient: string;
  /** Dilithium signature (hex) */
  signature: string;
}

/**
 * Lock operation response
 */
export interface LockResponse {
  /** Transaction hash */
  txHash: string;
  /** Created lock ID */
  lockId: string;
  /** Lock details */
  lock: Lock;
}

/**
 * Unlock operation response
 */
export interface UnlockResponse {
  /** Transaction hash */
  txHash: string;
  /** Lock ID */
  lockId: string;
  /** Updated lock status */
  status: LockStatus;
  /** Timelock expiry (for normal/emergency unlock) */
  timelockExpiry?: number;
}

/**
 * Time remaining for timelock
 */
export interface TimeLockRemaining {
  /** Total seconds remaining */
  totalSeconds: number;
  /** Days remaining */
  days: number;
  /** Hours remaining */
  hours: number;
  /** Minutes remaining */
  minutes: number;
  /** Seconds remaining */
  seconds: number;
  /** Whether timelock has expired */
  expired: boolean;
}

/**
 * API error response
 */
export interface ApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Prover status (for operators)
 */
export interface ProverStatus {
  /** Prover address */
  address: string;
  /** Whether prover is registered */
  registered: boolean;
  /** Staked amount */
  stakedAmount: bigint;
  /** Number of successful proofs */
  successfulProofs: number;
  /** Number of slashed proofs */
  slashedProofs: number;
  /** Current slashing rate (N² × 10%) */
  currentSlashingRate: number;
}

/**
 * Constants from SPEC_STRATEGY_BRIDGE §5
 */
export const SECURITY_CONSTANTS = {
  /** Normal timelock duration (24 hours) */
  NORMAL_TIMELOCK: 24 * 60 * 60,
  /** Emergency timelock duration (7 days) */
  EMERGENCY_TIMELOCK: 7 * 24 * 60 * 60,
  /** Emergency timeout (72 hours) */
  EMERGENCY_TIMEOUT: 72 * 60 * 60,
  /** Maximum pause duration (72 hours) */
  MAX_PAUSE_DURATION: 72 * 60 * 60,
  /** Defense period (48 hours) */
  DEFENSE_PERIOD: 48 * 60 * 60,
  /** Minimum emergency bond (0.5 ETH) */
  MIN_EMERGENCY_BOND: BigInt('500000000000000000'),
  /** Emergency bond percentage (5%) */
  EMERGENCY_BOND_PERCENTAGE: 5,
  /** Challenge bond percentage (1%) */
  CHALLENGE_BOND_PERCENTAGE: 1,
  /** Minimum challenge bond (0.1 ETH) */
  MIN_CHALLENGE_BOND: BigInt('100000000000000000'),
} as const;
