/**
 * AI Prover Agent - Main Agent Class
 *
 * 署名キューを監視し、AI判断に基づいて自動署名を行う
 */

import type { Logger } from 'winston';
import type { AgentConfig } from './config.js';
import { APIClient, type QueueItem } from './api-client.js';
import { AIVerifier, type VerificationResult, VerificationDecision } from './verifier.js';
import { HSMClient } from './hsm-client.js';
import { EscalationService } from './escalation.js';

interface ProcessingStats {
  total_processed: number;
  auto_signed: number;
  escalated: number;
  rejected: number;
  errors: number;
}

export class AIProverAgent {
  private config: AgentConfig;
  private logger: Logger;
  private apiClient: APIClient;
  private verifier: AIVerifier;
  private hsmClient: HSMClient;
  private escalation: EscalationService;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private stats: ProcessingStats;

  constructor(config: AgentConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.apiClient = new APIClient(config.api.url, config.agent.prover_id, logger);
    this.verifier = new AIVerifier(config.ai, logger, config.confidence);
    this.hsmClient = new HSMClient(config.hsm, logger);
    this.escalation = new EscalationService(config.escalation, logger);
    this.stats = {
      total_processed: 0,
      auto_signed: 0,
      escalated: 0,
      rejected: 0,
      errors: 0,
    };
  }

  async start(): Promise<void> {
    this.logger.info('Starting AI Prover Agent...');
    this.isRunning = true;

    // 初回処理
    await this.processQueue();

    // ポーリング開始
    this.pollInterval = setInterval(
      () => this.processQueue(),
      this.config.polling.interval_seconds * 1000
    );

    this.logger.info(`Polling started (every ${this.config.polling.interval_seconds}s)`);
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping AI Prover Agent...');
    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.logger.info('AI Prover Agent stopped');
    this.logger.info('Final Stats:', this.stats);
  }

  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // キュー取得
      const queue = await this.apiClient.getSigningQueue();

      if (queue.items.length === 0) {
        this.logger.debug('No pending items in queue');
        return;
      }

      this.logger.info(`Processing ${queue.items.length} queue items...`);

      // バッチサイズ制限
      const itemsToProcess = queue.items.slice(0, this.config.polling.max_batch_size);

      // 各アイテムを処理
      for (const item of itemsToProcess) {
        await this.processQueueItem(item);
      }

    } catch (error) {
      this.logger.error('Error processing queue', { error });
      this.stats.errors++;
    }
  }

  private async processQueueItem(item: QueueItem): Promise<void> {
    const startTime = Date.now();

    this.logger.info('─'.repeat(50));
    this.logger.info(`Processing: ${item.queue_id}`);
    this.logger.info(`  Lock ID: ${item.lock_id}`);
    this.logger.info(`  Amount: ${item.amount} ${item.asset}`);
    this.logger.info(`  Type: ${item.unlock_type}`);
    this.logger.info(`  Priority: ${item.priority}`);

    try {
      // Step 1: AI検証
      const verification = await this.verifier.verify(item);

      this.logger.info(`  AI Decision: ${verification.decision}`);
      this.logger.info(`  Confidence: ${(verification.confidence * 100).toFixed(1)}%`);
      this.logger.info(`  Reason: ${verification.reason}`);

      // Step 2: 判断に基づいて処理
      switch (verification.decision) {
        case VerificationDecision.AUTO_SIGN:
          await this.handleAutoSign(item, verification);
          this.stats.auto_signed++;
          break;

        case VerificationDecision.ESCALATE:
          await this.handleEscalate(item, verification);
          this.stats.escalated++;
          break;

        case VerificationDecision.REJECT:
          await this.handleReject(item, verification);
          this.stats.rejected++;
          break;
      }

      this.stats.total_processed++;

      const elapsed = Date.now() - startTime;
      this.logger.info(`  Processed in ${elapsed}ms`);

    } catch (error) {
      this.logger.error(`Error processing item ${item.queue_id}`, { error });
      this.stats.errors++;
    }
  }

  private async handleAutoSign(item: QueueItem, verification: VerificationResult): Promise<void> {
    this.logger.info('  Action: AUTO_SIGN');

    // HSM経由で署名
    const signature = await this.hsmClient.signUnlock({
      lock_id: item.lock_id,
      sr_0: item.sr_0,
      sr_1: item.sr_1,
      amount: item.amount,
    });

    // 署名をAPIに提出
    const result = await this.apiClient.submitSignature({
      queue_id: item.queue_id,
      sphincs_signature: signature.signature,
      hsm_attestation: signature.attestation,
    });

    this.logger.info(`  Signature submitted: ${result.total_signatures}/${result.required_signatures}`);

    // 監査ログ
    this.logger.info('AUDIT', {
      action: 'AUTO_SIGN',
      queue_id: item.queue_id,
      lock_id: item.lock_id,
      confidence: verification.confidence,
      reason: verification.reason,
      signature_hash: signature.signature.slice(0, 32) + '...',
    });
  }

  private async handleEscalate(item: QueueItem, verification: VerificationResult): Promise<void> {
    this.logger.info('  Action: ESCALATE');

    // エスカレーション通知
    await this.escalation.notify({
      type: 'escalation',
      queue_id: item.queue_id,
      lock_id: item.lock_id,
      amount: item.amount,
      asset: item.asset,
      confidence: verification.confidence,
      reason: verification.reason,
      anomalies: verification.anomalies,
      deadline: item.deadline,
    });

    this.logger.info('  Escalation sent to human operator');

    // 監査ログ
    this.logger.info('AUDIT', {
      action: 'ESCALATE',
      queue_id: item.queue_id,
      lock_id: item.lock_id,
      confidence: verification.confidence,
      reason: verification.reason,
      anomalies: verification.anomalies,
    });
  }

  private async handleReject(item: QueueItem, verification: VerificationResult): Promise<void> {
    this.logger.info('  Action: REJECT');

    // セキュリティアラート
    await this.escalation.notify({
      type: 'security_alert',
      queue_id: item.queue_id,
      lock_id: item.lock_id,
      amount: item.amount,
      asset: item.asset,
      confidence: verification.confidence,
      reason: verification.reason,
      anomalies: verification.anomalies,
      deadline: item.deadline,
    });

    this.logger.warn('  Security alert sent');

    // 監査ログ
    this.logger.info('AUDIT', {
      action: 'REJECT',
      queue_id: item.queue_id,
      lock_id: item.lock_id,
      confidence: verification.confidence,
      reason: verification.reason,
      anomalies: verification.anomalies,
    });
  }

  getStats(): ProcessingStats {
    return { ...this.stats };
  }
}
