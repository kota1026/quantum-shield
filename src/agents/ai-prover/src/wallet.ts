/**
 * AI Prover Agent - Wallet Management
 *
 * AIエージェント用のProverウォレット管理
 * - SPHINCS+ 鍵ペア管理
 * - Ethereumアドレス管理
 * - 署名生成
 *
 * ## v2.0 Signature Message Format
 *
 * The prover message format now matches L1 Vault contract verification:
 * ```solidity
 * bytes32 message = SHA3_256.hashPair(lockId, expectedSR1);
 * ```
 * This is computed as: SHA3_256(lockId || SR_1)
 */

import { randomBytes, createHash } from 'crypto';
import type { Logger } from 'winston';

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
 * SPHINCS+ 署名を生成（デモ用 - 本番ではHSM経由）
 *
 * 注意: 実際のSPHINCS+実装ではなく、デモ用のダミー実装
 * 本番環境ではHSMまたは専用の暗号ライブラリを使用すること
 */
export function generateSphincsSignature(
  message: string,
  _secretKey: string
): string {
  // デモ用: SHA3-256ハッシュベースの疑似署名
  // 本番ではSPHINCS+-128s (7856 bytes) を使用
  const hash = createHash('sha3-256')
    .update(message)
    .update(Date.now().toString())
    .digest('hex');

  // SPHINCS+署名のサイズをシミュレート (7856 bytes = 15712 hex chars)
  const paddedSignature = hash.repeat(Math.ceil(15712 / hash.length)).slice(0, 15712);
  return '0x' + paddedSignature;
}

/**
 * HSM Attestation を生成（デモ用）
 */
export function generateHsmAttestation(queueId: string): string {
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');
  return `HSM_ATT_${timestamp}_${nonce}_${queueId.slice(0, 16)}`;
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
   * 新しいウォレットを生成（デモ用）
   */
  private generateNewWallet(): ProverWallet {
    // Ethereumアドレス風のアドレスを生成
    const addressBytes = randomBytes(20);
    const address = '0x' + addressBytes.toString('hex');

    // SPHINCS+鍵ペアをシミュレート
    const sphincsPublicKey = '0x' + randomBytes(32).toString('hex');
    const sphincsSecretKey = '0x' + randomBytes(64).toString('hex');

    return {
      address,
      proverId: '', // 登録後に設定
      sphincsPublicKey,
      sphincsSecretKey,
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
   * メッセージに署名
   */
  sign(message: string): { signature: string; attestation: string } {
    const wallet = this.getWallet();

    const signature = generateSphincsSignature(message, wallet.sphincsSecretKey);
    const attestation = generateHsmAttestation(message);

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
    // v2.0: 署名対象メッセージをL1コントラクトと同一形式で構築
    const message = computeProverMessage(params.lockId, params.sr1);

    const { signature, attestation } = this.sign(message);

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
