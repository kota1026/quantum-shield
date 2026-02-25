/**
 * AI Prover Agent - Entry Point
 *
 * Quantum Shield の署名検証を自動化する AI Agent
 */

// Load .env file FIRST before any other imports
import 'dotenv/config';

import { AIProverAgent } from './agent.js';
import { loadConfig } from './config.js';
import { createLogger } from './audit-logger.js';

async function main() {
  const logger = createLogger();

  logger.info('='.repeat(60));
  logger.info('AI Prover Agent Starting...');
  logger.info('='.repeat(60));

  try {
    // 設定読み込み
    const config = loadConfig();
    logger.info(`Prover ID: ${config.agent.prover_id}`);
    logger.info(`API URL: ${config.api.url}`);
    logger.info(`Polling Interval: ${config.polling.interval_seconds}s`);
    logger.info(`Auto-sign Threshold: ${config.confidence.auto_sign_threshold}`);
    logger.info(`Escalate Threshold: ${config.confidence.escalate_threshold}`);

    // Agent 起動
    const agent = new AIProverAgent(config, logger);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await agent.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await agent.stop();
      process.exit(0);
    });

    // 開始
    await agent.start();

  } catch (error) {
    logger.error('Failed to start AI Prover Agent', { error });
    process.exit(1);
  }
}

main();
