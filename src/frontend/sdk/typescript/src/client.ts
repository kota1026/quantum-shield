/**
 * Quantum Shield Client
 *
 * Main SDK client for interacting with Quantum Shield bridge.
 *
 * @module client
 */

import type {
  Lock,
  LockRequest,
  LockResponse,
  UnlockRequestData,
  UnlockResponse,
  TimeLockRemaining,
  Network,
  LockStatus,
  ProverStatus,
} from './types';
import { SECURITY_CONSTANTS } from './types';
import { DilithiumCrypto, type DilithiumKeyPair } from './crypto';

/**
 * Quantum Shield client configuration
 */
export interface QuantumShieldConfig {
  /** API endpoint URL */
  apiUrl: string;
  /** Network to connect to */
  network: Network;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Custom headers for API requests */
  headers?: Record<string, string>;
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Quantum Shield Client
 *
 * Main entry point for interacting with the Quantum Shield bridge.
 *
 * @example
 * ```typescript
 * const client = new QuantumShieldClient({
 *   apiUrl: 'https://api.quantumshield.io',
 *   network: Network.Sepolia,
 * });
 *
 * await client.init();
 *
 * // Lock ETH
 * const lockResponse = await client.lock({
 *   amount: BigInt('1000000000000000000'), // 1 ETH
 *   tokenAddress: '0x0000000000000000000000000000000000000000',
 *   dilithiumPubKeyHash: keyPair.publicKeyHash,
 * });
 * ```
 */
export class QuantumShieldClient {
  private config: Required<QuantumShieldConfig>;
  private crypto: DilithiumCrypto;
  private initialized = false;

  constructor(config: QuantumShieldConfig) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 30000,
      headers: config.headers ?? {},
    };
    this.crypto = new DilithiumCrypto();
  }

  /**
   * Initialize the client and WASM module
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.crypto.init();
    this.initialized = true;
  }

  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('QuantumShieldClient not initialized. Call init() first.');
    }
  }

  /**
   * Make API request
   */
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    this.ensureInitialized();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.apiUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const json = (await response.json()) as ApiResponse<T>;

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message ?? `API error: ${response.status}`);
      }

      return json.data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get crypto module for key generation and signing
   */
  getCrypto(): DilithiumCrypto {
    this.ensureInitialized();
    return this.crypto;
  }

  /**
   * Generate a new Dilithium key pair
   *
   * Convenience method wrapping crypto.generateKeyPair()
   */
  generateKeyPair(): DilithiumKeyPair {
    this.ensureInitialized();
    return this.crypto.generateKeyPair();
  }

  /**
   * Lock ETH or tokens
   *
   * @param request - Lock request data
   * @returns Lock response with transaction hash and lock details
   */
  async lock(request: LockRequest): Promise<LockResponse> {
    return this.request<LockResponse>('POST', '/api/v1/lock', {
      amount: request.amount.toString(),
      tokenAddress: request.tokenAddress,
      dilithiumPubKeyHash: request.dilithiumPubKeyHash,
    });
  }

  /**
   * Initiate unlock
   *
   * @param request - Unlock request data with Dilithium signature
   * @returns Unlock response with transaction hash and updated status
   */
  async unlock(request: UnlockRequestData): Promise<UnlockResponse> {
    return this.request<UnlockResponse>('POST', '/api/v1/unlock', request);
  }

  /**
   * Get lock status
   *
   * @param lockId - Lock identifier
   * @returns Lock details
   */
  async getStatus(lockId: string): Promise<Lock> {
    return this.request<Lock>('GET', `/api/v1/locks/${lockId}`);
  }

  /**
   * Get all locks for an address
   *
   * @param address - Ethereum address
   * @returns Array of locks
   */
  async getLocksByAddress(address: string): Promise<Lock[]> {
    return this.request<Lock[]>('GET', `/api/v1/locks?owner=${address}`);
  }

  /**
   * Calculate time lock remaining
   *
   * @param lockId - Lock identifier
   * @returns Time remaining breakdown
   */
  async getTimeLockRemaining(lockId: string): Promise<TimeLockRemaining> {
    const lock = await this.getStatus(lockId);

    if (!lock.unlockRequest) {
      return {
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true,
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = Math.max(0, lock.unlockRequest.timelockExpiry - now);

    return this.formatTimeRemaining(remaining);
  }

  /**
   * Format seconds into time breakdown
   */
  formatTimeRemaining(totalSeconds: number): TimeLockRemaining {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      expired: totalSeconds === 0,
    };
  }

  /**
   * Calculate emergency bond amount
   *
   * Formula: MAX(0.5 ETH, amount × 5%)
   *
   * @param amount - Lock amount in wei
   * @returns Bond amount in wei
   */
  calculateEmergencyBond(amount: bigint): bigint {
    const percentageBond = (amount * BigInt(SECURITY_CONSTANTS.EMERGENCY_BOND_PERCENTAGE)) / BigInt(100);
    return percentageBond > SECURITY_CONSTANTS.MIN_EMERGENCY_BOND
      ? percentageBond
      : SECURITY_CONSTANTS.MIN_EMERGENCY_BOND;
  }

  /**
   * Calculate challenge bond amount
   *
   * Formula: MAX(0.1 ETH, amount × 1%)
   *
   * @param amount - Lock amount in wei
   * @returns Bond amount in wei
   */
  calculateChallengeBond(amount: bigint): bigint {
    const percentageBond = (amount * BigInt(SECURITY_CONSTANTS.CHALLENGE_BOND_PERCENTAGE)) / BigInt(100);
    return percentageBond > SECURITY_CONSTANTS.MIN_CHALLENGE_BOND
      ? percentageBond
      : SECURITY_CONSTANTS.MIN_CHALLENGE_BOND;
  }

  /**
   * Get normal timelock duration
   *
   * @returns 24 hours in seconds
   */
  getNormalTimelockDuration(): number {
    return SECURITY_CONSTANTS.NORMAL_TIMELOCK;
  }

  /**
   * Get emergency timelock duration
   *
   * @returns 7 days in seconds
   */
  getEmergencyTimelockDuration(): number {
    return SECURITY_CONSTANTS.EMERGENCY_TIMELOCK;
  }

  /**
   * Get emergency timeout duration
   *
   * @returns 72 hours in seconds
   */
  getEmergencyTimeout(): number {
    return SECURITY_CONSTANTS.EMERGENCY_TIMEOUT;
  }

  /**
   * Get maximum pause duration
   *
   * @returns 72 hours in seconds
   */
  getMaxPauseDuration(): number {
    return SECURITY_CONSTANTS.MAX_PAUSE_DURATION;
  }

  /**
   * Get prover status (for operators)
   *
   * @param address - Prover address
   * @returns Prover status including slashing info
   */
  async getProverStatus(address: string): Promise<ProverStatus> {
    return this.request<ProverStatus>('GET', `/api/v1/provers/${address}`);
  }

  /**
   * Calculate quadratic slashing rate
   *
   * Formula: N² × 10%
   *
   * @param consecutiveFailures - Number of consecutive failures
   * @returns Slashing rate as percentage (0-100)
   */
  calculateSlashingRate(consecutiveFailures: number): number {
    const rate = consecutiveFailures * consecutiveFailures * 10;
    return Math.min(rate, 100); // Cap at 100%
  }

  /**
   * Get security constants
   */
  getSecurityConstants(): typeof SECURITY_CONSTANTS {
    return SECURITY_CONSTANTS;
  }

  /**
   * Sign an unlock message with Dilithium
   *
   * @param secretKey - Dilithium secret key (hex)
   * @param lockId - Lock to unlock
   * @param recipient - Recipient address
   * @param nonce - Unique nonce for replay protection
   * @returns Hex-encoded signature
   */
  signUnlockMessage(secretKey: string, lockId: string, recipient: string, nonce: number): string {
    this.ensureInitialized();

    // Create message hash: SHA3(lockId || recipient || nonce)
    const messageData = `${lockId}${recipient}${nonce.toString(16).padStart(16, '0')}`;
    const messageHex = DilithiumCrypto.stringToHex(messageData);
    const messageHash = this.crypto.sha3Hash(messageHex);

    // Sign the hash
    return this.crypto.sign(secretKey, messageHash);
  }

  /**
   * Verify an unlock signature
   *
   * @param publicKey - Dilithium public key (hex)
   * @param lockId - Lock ID
   * @param recipient - Recipient address
   * @param nonce - Nonce used in signature
   * @param signature - Signature to verify
   * @returns Whether signature is valid
   */
  verifyUnlockSignature(
    publicKey: string,
    lockId: string,
    recipient: string,
    nonce: number,
    signature: string
  ): boolean {
    this.ensureInitialized();

    // Recreate message hash
    const messageData = `${lockId}${recipient}${nonce.toString(16).padStart(16, '0')}`;
    const messageHex = DilithiumCrypto.stringToHex(messageData);
    const messageHash = this.crypto.sha3Hash(messageHex);

    // Verify
    const result = this.crypto.verify(publicKey, messageHash, signature);
    return result.valid;
  }
}
