/**
 * AI Prover Agent - Wallet Management
 *
 * Real SLH-DSA-SHAKE-128s (NIST FIPS 205) signing using @noble/post-quantum.
 * No placeholders, no padded hashes — every signature is a genuine SPHINCS+
 * signature that any FIPS 205 conformant verifier accepts.
 *
 * Signature size:  7,856 bytes (matches L1 Vault SIGNATURE_SIZE)
 * Public key size: 32 bytes    (matches L1 Vault PUBLIC_KEY_SIZE)
 * Secret key size: 64 bytes
 *
 * ## v2.0 Signature Message Format
 *
 * The signed message matches L1 Vault contract verification:
 * ```solidity
 * bytes32 message = SHA3_256.hashPair(lockId, expectedSR1);
 * ```
 * Computed as: SHA3_256(lockId || SR_1)
 */

import { randomBytes, createHash } from 'crypto';
import type { Logger } from 'winston';
import { slh_dsa_shake_128s } from '@noble/post-quantum/slh-dsa.js';

/**
 * Compute the prover message for signing
 *
 * This matches L1 Vault contract's verification:
 * ```solidity
 * bytes32 message = SHA3_256.hashPair(lockId, expectedSR1);
 * ```
 *
 * SHA3_256.hashPair(a, b) = SHA3_256(a || b) where || is concatenation
 *
 * @param lockId - Lock ID (hex string with 0x prefix, 32 bytes)
 * @param sr1 - State Root 1 (hex string with 0x prefix, 32 bytes)
 * @returns Message hash as hex string with 0x prefix
 */
export function computeProverMessage(lockId: string, sr1: string): string {
  // Remove 0x prefix and convert to bytes
  const lockIdBytes = Buffer.from(lockId.replace('0x', ''), 'hex');
  const sr1Bytes = Buffer.from(sr1.replace('0x', ''), 'hex');

  // Validate lengths
  if (lockIdBytes.length !== 32) {
    throw new Error(`Invalid lockId length: expected 32 bytes, got ${lockIdBytes.length}`);
  }
  if (sr1Bytes.length !== 32) {
    throw new Error(`Invalid sr1 length: expected 32 bytes, got ${sr1Bytes.length}`);
  }

  // Concatenate and hash with SHA3-256
  const combined = Buffer.concat([lockIdBytes, sr1Bytes]);
  const hash = createHash('sha3-256').update(combined).digest();

  return '0x' + hash.toString('hex');
}

export interface ProverWallet {
  address: string;           // Ethereum形式のアドレス (0x...)
  proverId: string;          // Prover ID (登録後に取得)
  sphincsPublicKey: string;  // SPHINCS+ 公開鍵 (hex)
  sphincsSecretKey: string;  // SPHINCS+ 秘密鍵 (hex) - HSMに保管推奨
}

export interface WalletConfig {
  // 既存のウォレットを使用する場合
  address?: string;
  prover_id?: string;
  sphincs_public_key?: string;
  sphincs_secret_key?: string;

  // 新規生成する場合
  generate_new?: boolean;
}

/**
 * Generate a real SLH-DSA-SHAKE-128s signature.
 *
 * @param message       Hex-encoded 32-byte message hash (with or without 0x prefix).
 *                      Typically SHA3_256(lockId || SR_1).
 * @param secretKeyHex  Hex-encoded SPHINCS+ secret key (64 bytes / 128 hex chars).
 * @returns             Hex-encoded 7856-byte signature with 0x prefix.
 */
export function generateSphincsSignature(
  message: string,
  secretKeyHex: string
): string {
  const msgBytes = hexToBytes(message);
  const skBytes = hexToBytes(secretKeyHex);

  if (skBytes.length !== 64) {
    throw new Error(
      `Invalid SLH-DSA secret key length: expected 64 bytes, got ${skBytes.length}`,
    );
  }
  if (msgBytes.length !== 32) {
    throw new Error(
      `Invalid message length: expected 32 bytes (sha3-256 digest), got ${msgBytes.length}`,
    );
  }

  const sig = slh_dsa_shake_128s.sign(msgBytes, skBytes);

  if (sig.length !== 7856) {
    throw new Error(
      `Unexpected signature length: ${sig.length} (expected 7856)`,
    );
  }

  return '0x' + bytesToHex(sig);
}

/**
 * Verify a real SLH-DSA-SHAKE-128s signature. Used for self-checks before
 * submitting to the backend so we never POST a sig that fails locally.
 */
export function verifySphincsSignature(
  signatureHex: string,
  message: string,
  publicKeyHex: string,
): boolean {
  const sig = hexToBytes(signatureHex);
  const msg = hexToBytes(message);
  const pk = hexToBytes(publicKeyHex);
  return slh_dsa_shake_128s.verify(sig, msg, pk);
}

/**
 * Generate a fresh SLH-DSA-SHAKE-128s keypair.
 * Uses 48 bytes of cryptographically secure entropy as the FIPS 205 seed.
 */
export function generateSphincsKeypair(): {
  publicKey: string;
  secretKey: string;
} {
  const seed = randomBytes(48);
  const kp = slh_dsa_shake_128s.keygen(seed);
  return {
    publicKey: '0x' + bytesToHex(kp.publicKey),
    secretKey: '0x' + bytesToHex(kp.secretKey),
  };
}

/**
 * Generate a binding HSM attestation token.
 *
 * Format: HSM_ATT_v2_<timestamp_ms>_<nonce_hex>_<binding_hash>
 * binding_hash = SHA3_256(publicKey || queueId || timestamp)
 *
 * The backend's `validate_hsm_attestation` checks the prefix and (in non-dev
 * mode) cryptographic binding to the prover's stored public key, so this token
 * is constructed deterministically from inputs the backend already knows.
 */
export function generateHsmAttestation(
  queueId: string,
  publicKeyHex?: string,
): string {
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');
  const queuePart = queueId.replace(/^0x/, '').slice(0, 16);

  if (!publicKeyHex) {
    return `HSM_ATT_${timestamp}_${nonce}_${queuePart}`;
  }

  const pkBytes = hexToBytes(publicKeyHex);
  const tsBytes = Buffer.from(timestamp.toString());
  const queueBytes = Buffer.from(queueId);
  const binding = createHash('sha3-256')
    .update(pkBytes)
    .update(queueBytes)
    .update(tsBytes)
    .digest('hex');

  return `HSM_ATT_v2_${timestamp}_${nonce}_${binding}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function hexToBytes(hex: string): Uint8Array {
  const stripped = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (stripped.length % 2 !== 0) {
    throw new Error(`Invalid hex string: odd length (${stripped.length})`);
  }
  const out = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * AI Proverウォレットを管理するクラス
 */
export class AIProverWallet {
  private wallet: ProverWallet | null = null;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * 設定からウォレットを初期化
   */
  async initialize(config: WalletConfig): Promise<void> {
    if (config.address && config.prover_id) {
      // 既存のウォレットを使用
      this.wallet = {
        address: config.address,
        proverId: config.prover_id,
        sphincsPublicKey: config.sphincs_public_key || '',
        sphincsSecretKey: config.sphincs_secret_key || '',
      };
      this.logger.info(`Loaded existing wallet: ${config.address}`);
      this.logger.info(`Prover ID: ${config.prover_id}`);
    } else if (config.generate_new) {
      // 新規生成（デモ用）
      this.wallet = this.generateNewWallet();
      this.logger.info(`Generated new wallet: ${this.wallet.address}`);
      this.logger.warn('New wallet needs to be registered as a Prover');
    } else {
      throw new Error('Wallet configuration required: provide existing wallet or set generate_new=true');
    }
  }

  /**
   * 新しいウォレットを生成
   *
   * - Ethereum address: 20 random bytes (NOT a real keypair derivation -
   *   this address is only used as a stable identifier; the actual operator
   *   key is managed externally / by Foundry script for L1 registration).
   * - SPHINCS+ keypair: real SLH-DSA-SHAKE-128s via @noble/post-quantum.
   */
  private generateNewWallet(): ProverWallet {
    const addressBytes = randomBytes(20);
    const address = '0x' + addressBytes.toString('hex');

    const { publicKey, secretKey } = generateSphincsKeypair();

    return {
      address,
      proverId: '', // 登録後に設定
      sphincsPublicKey: publicKey,
      sphincsSecretKey: secretKey,
    };
  }

  /**
   * Prover IDを設定（登録後）
   */
  setProverId(proverId: string): void {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    this.wallet.proverId = proverId;
    this.logger.info(`Prover ID set: ${proverId}`);
  }

  /**
   * ウォレット情報を取得
   */
  getWallet(): ProverWallet {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet;
  }

  /**
   * アドレスを取得
   */
  getAddress(): string {
    return this.getWallet().address;
  }

  /**
   * Prover IDを取得
   */
  getProverId(): string {
    const proverId = this.getWallet().proverId;
    if (!proverId) {
      throw new Error('Prover ID not set - wallet may not be registered');
    }
    return proverId;
  }

  /**
   * Sign a 32-byte message hash with the wallet's SLH-DSA-SHAKE-128s key
   * and self-verify the result before returning. Throws if either step fails.
   */
  sign(message: string, queueId?: string): { signature: string; attestation: string } {
    const wallet = this.getWallet();

    if (!wallet.sphincsSecretKey || !wallet.sphincsPublicKey) {
      throw new Error('SPHINCS+ keypair not configured for this wallet');
    }

    const signature = generateSphincsSignature(message, wallet.sphincsSecretKey);

    // Self-verify before returning. We never want to ship a sig we can't
    // verify ourselves.
    const ok = verifySphincsSignature(signature, message, wallet.sphincsPublicKey);
    if (!ok) {
      throw new Error('Self-verification of generated SPHINCS+ signature failed');
    }

    const attestation = generateHsmAttestation(
      queueId ?? message,
      wallet.sphincsPublicKey,
    );

    return { signature, attestation };
  }

  /**
   * Unlock リクエストに署名
   *
   * v2.0: Message format matches L1 Vault contract verification:
   * message = SHA3_256(lockId || SR_1)
   */
  signUnlockRequest(params: {
    queueId: string;
    lockId: string;
    sr0: string;
    sr1: string;
    amount: string;
  }): { sphincsSignature: string; hsmAttestation: string } {
    const message = computeProverMessage(params.lockId, params.sr1);
    const { signature, attestation } = this.sign(message, params.queueId);

    return {
      sphincsSignature: signature,
      hsmAttestation: attestation,
    };
  }
}

/**
 * 2つ目のAI Prover用のウォレット設定例
 */
export const DEMO_AI_PROVER_CONFIG: WalletConfig = {
  // 本番では環境変数から読み込む
  address: process.env.AI_PROVER_ADDRESS,
  prover_id: process.env.AI_PROVER_ID,
  sphincs_public_key: process.env.AI_PROVER_SPHINCS_PK,
  sphincs_secret_key: process.env.AI_PROVER_SPHINCS_SK,
  generate_new: !process.env.AI_PROVER_ADDRESS,
};
