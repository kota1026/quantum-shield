/**
 * AI Prover Agent - AI Verification Logic
 *
 * Claude API を使用してUnlockリクエストの正当性を検証
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'winston';
import type { QueueItem } from './api-client.js';

export enum VerificationDecision {
  AUTO_SIGN = 'AUTO_SIGN',
  ESCALATE = 'ESCALATE',
  REJECT = 'REJECT',
}

export interface VerificationResult {
  decision: VerificationDecision;
  confidence: number;
  reason: string;
  anomalies: string[];
  analysis: {
    amount_check: 'pass' | 'warning' | 'fail';
    timing_check: 'pass' | 'warning' | 'fail';
    signature_check: 'pass' | 'warning' | 'fail';
    pattern_check: 'pass' | 'warning' | 'fail';
  };
}

interface AIConfig {
  model: string;
  max_tokens: number;
}

interface ConfidenceConfig {
  auto_sign_threshold: number;
  escalate_threshold: number;
}

export class AIVerifier {
  private client: Anthropic;
  private config: AIConfig;
  private confidenceConfig: ConfidenceConfig;
  private logger: Logger;

  constructor(
    aiConfig: AIConfig,
    logger: Logger,
    confidenceConfig?: ConfidenceConfig
  ) {
    this.client = new Anthropic();
    this.config = aiConfig;
    this.confidenceConfig = confidenceConfig || {
      auto_sign_threshold: 0.99,
      escalate_threshold: 0.80,
    };
    this.logger = logger;
  }

  async verify(item: QueueItem): Promise<VerificationResult> {
    const startTime = Date.now();

    try {
      // Step 1: 基本的な検証チェック
      const basicChecks = this.performBasicChecks(item);

      // Step 2: AI による高度な分析
      const aiAnalysis = await this.performAIAnalysis(item, basicChecks);

      // Step 3: 最終判断
      const decision = this.makeDecision(aiAnalysis.confidence);

      const elapsed = Date.now() - startTime;
      this.logger.debug(`Verification completed in ${elapsed}ms`);

      return {
        decision,
        confidence: aiAnalysis.confidence,
        reason: aiAnalysis.reason,
        anomalies: aiAnalysis.anomalies,
        analysis: basicChecks,
      };
    } catch (error) {
      this.logger.error('AI verification failed', { error, queueId: item.queue_id });

      // エラー時は安全側に倒してエスカレーション
      return {
        decision: VerificationDecision.ESCALATE,
        confidence: 0.5,
        reason: `AI verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        anomalies: ['AI_VERIFICATION_ERROR'],
        analysis: {
          amount_check: 'warning',
          timing_check: 'warning',
          signature_check: 'warning',
          pattern_check: 'warning',
        },
      };
    }
  }

  private performBasicChecks(item: QueueItem): VerificationResult['analysis'] {
    const checks: VerificationResult['analysis'] = {
      amount_check: 'pass',
      timing_check: 'pass',
      signature_check: 'pass',
      pattern_check: 'pass',
    };

    // 金額チェック
    const amountWei = BigInt(item.amount);
    const maxSafeAmount = BigInt('100000000000000000000'); // 100 ETH
    if (amountWei > maxSafeAmount) {
      checks.amount_check = 'warning';
    }

    // タイミングチェック（期限切れ間近）
    const now = Math.floor(Date.now() / 1000);
    const timeToDeadline = item.deadline - now;
    if (timeToDeadline < 300) {
      // 5分未満
      checks.timing_check = 'warning';
    } else if (timeToDeadline < 0) {
      checks.timing_check = 'fail';
    }

    // 署名チェック
    if (!item.dilithium_verified) {
      checks.signature_check = 'fail';
    }

    // パターンチェック（緊急アンロックは注意）
    if (item.unlock_type === 'emergency') {
      checks.pattern_check = 'warning';
    }

    return checks;
  }

  private async performAIAnalysis(
    item: QueueItem,
    basicChecks: VerificationResult['analysis']
  ): Promise<{ confidence: number; reason: string; anomalies: string[] }> {
    const prompt = this.buildAnalysisPrompt(item, basicChecks);

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.max_tokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: `あなたはQuantum Shieldのセキュリティ検証AIです。
Unlockリクエストを分析し、署名すべきかどうかを判断してください。

判断基準:
- Dilithium署名が検証済みであること（必須）
- 金額が異常に大きくないこと
- タイミングが適切であること（期限内）
- 不正パターンに該当しないこと

応答は必ず以下のJSON形式で返してください:
{
  "confidence": 0.0-1.0,
  "reason": "判断理由を簡潔に",
  "anomalies": ["検出した異常のリスト"]
}`,
    });

    // レスポンスをパース
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      // JSON部分を抽出
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);
      return {
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        reason: result.reason || 'No reason provided',
        anomalies: Array.isArray(result.anomalies) ? result.anomalies : [],
      };
    } catch (parseError) {
      this.logger.warn('Failed to parse AI response', { content: content.text });
      // パース失敗時はbasicChecksの結果から推定
      const failCount = Object.values(basicChecks).filter((v) => v === 'fail').length;
      const warnCount = Object.values(basicChecks).filter((v) => v === 'warning').length;

      return {
        confidence: failCount > 0 ? 0.3 : warnCount > 0 ? 0.7 : 0.95,
        reason: 'AI response parse failed, using basic checks',
        anomalies: failCount > 0 ? ['BASIC_CHECK_FAILED'] : [],
      };
    }
  }

  private buildAnalysisPrompt(
    item: QueueItem,
    basicChecks: VerificationResult['analysis']
  ): string {
    const amountEth = Number(BigInt(item.amount)) / 1e18;

    return `以下のUnlockリクエストを検証してください:

## リクエスト情報
- Queue ID: ${item.queue_id}
- Lock ID: ${item.lock_id}
- Unlock Type: ${item.unlock_type}
- User Address: ${item.user_address}
- Amount: ${amountEth.toFixed(4)} ETH (${item.amount} wei)
- Asset: ${item.asset}
- Priority: ${item.priority}
- Deadline: ${new Date(item.deadline * 1000).toISOString()}
- Dilithium Verified: ${item.dilithium_verified}

## SR Values
- SR_0: ${item.sr_0.slice(0, 20)}...
- SR_1: ${item.sr_1.slice(0, 20)}...

## 基本チェック結果
- 金額チェック: ${basicChecks.amount_check}
- タイミングチェック: ${basicChecks.timing_check}
- 署名チェック: ${basicChecks.signature_check}
- パターンチェック: ${basicChecks.pattern_check}

このリクエストに署名すべきですか？
信頼度(0.0-1.0)と理由、検出した異常を教えてください。`;
  }

  private makeDecision(confidence: number): VerificationDecision {
    if (confidence >= this.confidenceConfig.auto_sign_threshold) {
      return VerificationDecision.AUTO_SIGN;
    } else if (confidence >= this.confidenceConfig.escalate_threshold) {
      return VerificationDecision.ESCALATE;
    } else {
      return VerificationDecision.REJECT;
    }
  }
}
