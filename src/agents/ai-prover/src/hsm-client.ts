/**
 * AI Prover Agent - HSM Client
 *
 * Hardware Security Module との連携
 * 本番環境ではAWS CloudHSM、Azure HSM、YubiHSMなどと連携
 *
 * ## Signature Message Format (v2.0)
 *
 * The message to sign matches the L1 Vault contract's verification:
 * ```solidity
 * bytes32 message = SHA3_256.hashPair(lockId, expectedSR1);
 * ```
 *
 * This is computed as: SHA3_256(lockId || SR_1)
 */

import type { Logger } from 'winston';
import { generateSphincsSignature, generateHsmAttestation, computeProverMessage } from './wallet.js';

export interface HSMConfig {
  endpoint: string;
  timeout_seconds: number;
}

export interface SignRequest {
  lock_id: string;
  sr_0: string;
  sr_1: string;
  amount: string;
}

export interface SignResponse {
  signature: string;
  attestation: string;
  timestamp: number;
}

/**
 * HSM Client
 *
 * 開発環境ではローカルで署名を生成
 * 本番環境ではHSM APIを呼び出す
 */
export class HSMClient {
  private config: HSMConfig;
  private logger: Logger;
  private isDevMode: boolean;

  constructor(config: HSMConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.isDevMode = config.endpoint.includes('localhost') || !config.endpoint;
  }

  /**
   * Unlock リクエストに署名
   */
  async signUnlock(request: SignRequest): Promise<SignResponse> {
    if (this.isDevMode) {
      return this.signUnlockDev(request);
    } else {
      return this.signUnlockHSM(request);
    }
  }

  /**
   * 開発モード: ローカルで署名生成
   *
   * v2.0: Message format matches L1 Vault contract verification:
   * message = SHA3_256(lockId || SR_1)
   */
  private async signUnlockDev(request: SignRequest): Promise<SignResponse> {
    this.logger.debug('DEV MODE: Generating signature locally');

    // v2.0: 署名対象メッセージをL1コントラクトと同一形式で構築
    // SHA3_256.hashPair(lockId, expectedSR1) と一致させる
    const message = computeProverMessage(request.lock_id, request.sr_1);

    this.logger.debug(`Signing message: ${message.substring(0, 20)}...`);

    // ローカルで署名生成（デモ用）
    const signature = generateSphincsSignature(message, 'dev-secret-key');
    const attestation = generateHsmAttestation(request.lock_id);

    return {
      signature,
      attestation,
      timestamp: Date.now(),
    };
  }

  /**
   * 本番モード: HSM APIを呼び出し
   *
   * v2.0: Message format matches L1 Vault contract verification
   */
  private async signUnlockHSM(request: SignRequest): Promise<SignResponse> {
    this.logger.debug(`Calling HSM at ${this.config.endpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout_seconds * 1000
    );

    // v2.0: Compute the prover message (SHA3_256(lockId || SR_1))
    const proverMessage = computeProverMessage(request.lock_id, request.sr_1);

    try {
      const response = await fetch(`${this.config.endpoint}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key_id: 'sphincs-prover-key',
          algorithm: 'SPHINCS+-128s',
          // v2.0: Send the pre-computed message hash
          message_hash: proverMessage,
          // Keep original fields for audit/logging
          metadata: {
            lock_id: request.lock_id,
            sr_0: request.sr_0,
            sr_1: request.sr_1,
            amount: request.amount,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HSM error: ${response.status}`);
      }

      const data = await response.json();

      return {
        signature: data.signature,
        attestation: data.attestation,
        timestamp: data.timestamp || Date.now(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * HSMヘルスチェック
   */
  async healthCheck(): Promise<boolean> {
    if (this.isDevMode) {
      this.logger.debug('DEV MODE: HSM health check skipped');
      return true;
    }

    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      this.logger.error('HSM health check failed', { error });
      return false;
    }
  }
}
