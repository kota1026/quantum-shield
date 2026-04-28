/**
 * AI Prover Agent - Main Agent Class
 *
 * 署名キューを監視し、AI に分析させて ESCALATE / REJECT に振り分ける。
 * AI は advisory のみ; 署名は escalation 経路の先で人間/HSM が行う。
 * See docs/governance/AI_ADVISORY_ROLE.md.
 */

import type { Logger } from 'winston';
import type { AgentConfig } from './config.js';
import { APIClient, type QueueItem } from './api-client.js';
import { AIVerifier, type VerificationResult, VerificationDecision } from './verifier.js';
import { EscalationService } from './escalation.js';

interface ProcessingStats {
  total_processed: number;
  // ai_recommended_sign: AI が "sign" を推奨した件数 (実際の署名は ESCALATE 経由で人間/HSMが行う)
  ai_recommended_sign: number;
  escalated: number;
  rejected: number;
  errors: number;
}

export class AIProverAgent {
  private config: AgentConfig;
  private logger: Logger;
  private apiClient: APIClient;
  private verifier: AIVerifier;
  private escalation: EscalationService;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private stats: ProcessingStats;

  constructor(config: AgentConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.apiClient = new APIClient(config.api.url, config.agent.prover_id, logger);
    this.verifier = new AIVerifier(config.ai, logger, config.confidence);
    this.escalation = new EscalationService(config.escalation, logger);
    this.stats = {
      total_processed: 0,
      ai_recommended_sign: 0,
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

      // AI は advisory: 全ての ESCALATE は人間/HSM 経路へ。AI が "sign" を推奨した件数は
      // 別途カウントして audit 可能にしておく (docs/governance/AI_ADVISORY_ROLE.md)。
      switch (verification.decision) {
        case VerificationDecision.ESCALATE:
          if (verification.aiRecommendation === 'sign') {
            this.stats.ai_recommended_sign++;
          }
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

    this.logger.info('AUDIT', {
      action: 'ESCALATE',
      ai_recommendation: verification.aiRecommendation,
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
