/**
 * AI Prover Agent - Escalation Service
 *
 * エスカレーション通知（Slack、メール等）
 */

import type { Logger } from 'winston';

export interface EscalationConfig {
  slack_webhook?: string;
  email?: string;
}

export interface EscalationNotification {
  type: 'escalation' | 'security_alert';
  queue_id: string;
  lock_id: string;
  amount: string;
  asset: string;
  confidence: number;
  reason: string;
  anomalies: string[];
  deadline: number;
}

export class EscalationService {
  private config: EscalationConfig;
  private logger: Logger;

  constructor(config: EscalationConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * 通知を送信
   */
  async notify(notification: EscalationNotification): Promise<void> {
    const promises: Promise<void>[] = [];

    // Slack通知
    if (this.config.slack_webhook) {
      promises.push(this.sendSlackNotification(notification));
    }

    // メール通知
    if (this.config.email) {
      promises.push(this.sendEmailNotification(notification));
    }

    // ログにも記録
    this.logger.warn('ESCALATION', {
      type: notification.type,
      queue_id: notification.queue_id,
      lock_id: notification.lock_id,
      confidence: notification.confidence,
      reason: notification.reason,
    });

    await Promise.allSettled(promises);
  }

  /**
   * Slack通知
   */
  private async sendSlackNotification(notification: EscalationNotification): Promise<void> {
    if (!this.config.slack_webhook) return;

    const emoji = notification.type === 'security_alert' ? ':rotating_light:' : ':warning:';
    const color = notification.type === 'security_alert' ? '#FF0000' : '#FFA500';
    const amountEth = (Number(BigInt(notification.amount)) / 1e18).toFixed(4);

    const payload = {
      attachments: [
        {
          color,
          title: `${emoji} AI Prover ${notification.type === 'security_alert' ? 'Security Alert' : 'Escalation'}`,
          fields: [
            {
              title: 'Queue ID',
              value: notification.queue_id.slice(0, 18) + '...',
              short: true,
            },
            {
              title: 'Lock ID',
              value: notification.lock_id.slice(0, 18) + '...',
              short: true,
            },
            {
              title: 'Amount',
              value: `${amountEth} ${notification.asset}`,
              short: true,
            },
            {
              title: 'Confidence',
              value: `${(notification.confidence * 100).toFixed(1)}%`,
              short: true,
            },
            {
              title: 'Reason',
              value: notification.reason,
              short: false,
            },
            {
              title: 'Anomalies',
              value: notification.anomalies.length > 0
                ? notification.anomalies.join(', ')
                : 'None detected',
              short: false,
            },
            {
              title: 'Deadline',
              value: new Date(notification.deadline * 1000).toISOString(),
              short: true,
            },
          ],
          footer: 'Quantum Shield AI Prover Agent',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(this.config.slack_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.error('Slack notification failed', { status: response.status });
      } else {
        this.logger.debug('Slack notification sent');
      }
    } catch (error) {
      this.logger.error('Slack notification error', { error });
    }
  }

  /**
   * メール通知（プレースホルダー）
   */
  private async sendEmailNotification(notification: EscalationNotification): Promise<void> {
    // 本番環境では SendGrid、SES などを使用
    this.logger.info('Email notification would be sent to:', {
      to: this.config.email,
      subject: `AI Prover ${notification.type}: ${notification.queue_id}`,
    });
  }
}
