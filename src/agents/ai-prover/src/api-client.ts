/**
 * AI Prover Agent - API Client
 *
 * Quantum Shield Backend API との通信
 */

import type { Logger } from 'winston';

export interface QueueItem {
  queue_id: string;
  lock_id: string;
  unlock_type: 'normal' | 'emergency';
  user_address: string;
  amount: string;
  asset: string;
  sr_0: string;
  sr_1: string;
  created_at: number;
  deadline: number;
  priority: 'normal' | 'high' | 'critical';
  dilithium_verified: boolean;
}

export interface SigningQueueResponse {
  items: QueueItem[];
  total: number;
  pending_count: number;
}

export interface SubmitSignatureRequest {
  queue_id: string;
  sphincs_signature: string;
  hsm_attestation: string;
}

export interface SubmitSignatureResponse {
  queue_id: string;
  signature_accepted: boolean;
  total_signatures: number;
  required_signatures: number;
  tx_hash?: string;
}

export interface ProverRegistrationRequest {
  operator_addr: string;
  sphincs_pubkey: string;
  stake_amount: string;
  hsm_attestation: string;
  multisig_proof: string;
  endpoint: string;
}

export interface ProverRegistrationResponse {
  prover_id: string;
  status: string;
  stake_locked: string;
}

export class APIClient {
  private baseUrl: string;
  private proverId: string;
  private logger: Logger;
  private timeout: number;

  constructor(baseUrl: string, proverId: string, logger: Logger, timeout = 30000) {
    this.baseUrl = baseUrl;
    this.proverId = proverId;
    this.logger = logger;
    this.timeout = timeout;
  }

  /**
   * Prover IDを更新（登録後など）
   */
  setProverId(proverId: string): void {
    this.proverId = proverId;
  }

  /**
   * 署名キューを取得
   */
  async getSigningQueue(): Promise<SigningQueueResponse> {
    const url = `${this.baseUrl}/v1/prover/${this.proverId}/queue`;
    this.logger.debug(`Fetching signing queue: ${url}`);

    return this.fetch<SigningQueueResponse>(url);
  }

  /**
   * 署名を提出
   */
  async submitSignature(request: SubmitSignatureRequest): Promise<SubmitSignatureResponse> {
    const url = `${this.baseUrl}/v1/prover/${this.proverId}/sign`;
    this.logger.debug(`Submitting signature: ${url}`);

    return this.fetch<SubmitSignatureResponse>(url, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * バッチ署名を提出
   */
  async submitBatchSignatures(
    items: SubmitSignatureRequest[]
  ): Promise<{ success_count: number; failure_count: number }> {
    const url = `${this.baseUrl}/v1/prover/${this.proverId}/sign/batch`;
    this.logger.debug(`Submitting batch signatures: ${url} (${items.length} items)`);

    type BatchResp = {
      success_count?: number;
      failure_count?: number;
      successCount?: number;
      failureCount?: number;
    };
    const response = await this.fetch<BatchResp>(url, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });

    return {
      success_count: response.success_count ?? response.successCount ?? 0,
      failure_count: response.failure_count ?? response.failureCount ?? 0,
    };
  }

  /**
   * Prover登録
   */
  async registerProver(request: ProverRegistrationRequest): Promise<ProverRegistrationResponse> {
    const url = `${this.baseUrl}/v1/prover/register`;
    this.logger.info(`Registering prover: ${url}`);

    return this.fetch<ProverRegistrationResponse>(url, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Proverステータス確認
   */
  async getProverStatus(): Promise<{ status: string; prover_id: string }> {
    const url = `${this.baseUrl}/v1/prover/${this.proverId}/dashboard`;
    this.logger.debug(`Checking prover status: ${url}`);

    return this.fetch<{ status: string; prover_id: string }>(url);
  }

  /**
   * HTTP リクエスト実行
   */
  private async fetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`API error: ${response.status}`, { url, body: errorBody });
        throw new Error(`API error ${response.status}: ${errorBody}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
