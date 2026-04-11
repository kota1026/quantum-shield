/**
 * AI Prover Agent - HSM Client
 *
 * Hardware Security Module との連携。
 *
 * - **Local mode** (HSM_ENDPOINT empty / localhost): real SLH-DSA-SHAKE-128s
 *   signing using @noble/post-quantum, with the prover's secret key loaded
 *   from PROVER_SPHINCS_SK env var. NO fake signatures.
 * - **Remote HSM mode**: forwards the pre-computed message hash to a real HSM
 *   (AWS CloudHSM / YubiHSM / Azure HSM) over HTTP. The HSM does the signing
 *   and returns a verifiable SLH-DSA signature.
 *
 * ## Signature Message Format (v2.0)
 *
 * The message to sign matches the L1 Vault contract's verification:
 * ```solidity
 * bytes32 message = SHA3_256.hashPair(lockId, expectedSR1);
 * ```
 *
 * Computed as: SHA3_256(lockId || SR_1)
 */

import type { Logger } from 'winston';
import {
  generateSphincsSignature,
  generateHsmAttestation,
  computeProverMessage,
  verifySphincsSignature,
} from './wallet.js';

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
 * Local mode: real SLH-DSA-SHAKE-128s signing with a key loaded from env.
 * Remote mode: forwards to an HSM HTTP service.
 */
export class HSMClient {
  private config: HSMConfig;
  private logger: Logger;
  private isLocalMode: boolean;
  private localSecretKey?: string;
  private localPublicKey?: string;

  constructor(config: HSMConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.isLocalMode = !config.endpoint || config.endpoint.includes('localhost');

    if (this.isLocalMode) {
      const sk = process.env.PROVER_SPHINCS_SK;
      const pk = process.env.PROVER_SPHINCS_PK;
      if (!sk || !pk) {
        this.logger.warn(
          'PROVER_SPHINCS_SK / PROVER_SPHINCS_PK not set — HSM client will reject all sign requests until provided'
        );
      } else {
        this.localSecretKey = sk;
        this.localPublicKey = pk;
        this.logger.info(
          `HSM client: local SLH-DSA-SHAKE-128s mode (pk=${pk.slice(0, 14)}..., sk redacted)`
        );
      }
    } else {
      this.logger.info(`HSM client: remote mode (endpoint=${config.endpoint})`);
    }
  }

  /**
   * Unlock リクエストに署名
   */
  async signUnlock(request: SignRequest): Promise<SignResponse> {
    if (this.isLocalMode) {
      return this.signUnlockLocal(request);
    } else {
      return this.signUnlockHSM(request);
    }
  }

  /**
   * Local mode: real SLH-DSA-SHAKE-128s signing with self-verify.
   *
   * v2.0: Message format matches L1 Vault contract verification:
   *   message = SHA3_256(lockId || SR_1)
   */
  private async signUnlockLocal(request: SignRequest): Promise<SignResponse> {
    if (!this.localSecretKey || !this.localPublicKey) {
      throw new Error(
        'Local SLH-DSA signing requested but PROVER_SPHINCS_SK/PROVER_SPHINCS_PK are not configured'
      );
    }

    const message = computeProverMessage(request.lock_id, request.sr_1);
    this.logger.debug(`Signing message ${message.substring(0, 20)}... locally`);

    const signature = generateSphincsSignature(message, this.localSecretKey);

    // Self-verify: never ship a sig that doesn't verify under our own pubkey.
    const ok = verifySphincsSignature(signature, message, this.localPublicKey);
    if (!ok) {
      throw new Error(
        'Self-verification of SLH-DSA-SHAKE-128s signature failed'
      );
    }

    const attestation = generateHsmAttestation(request.lock_id, this.localPublicKey);

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

      const data = (await response.json()) as {
        signature: string;
        attestation: string;
        timestamp?: number;
      };

      return {
        signature: data.signature,
        attestation: data.attestation,
        timestamp: data.timestamp ?? Date.now(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * HSMヘルスチェック
   */
  async healthCheck(): Promise<boolean> {
    if (this.isLocalMode) {
      // Local mode is healthy iff we have a usable secret key.
      return Boolean(this.localSecretKey && this.localPublicKey);
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
