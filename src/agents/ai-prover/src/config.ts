/**
 * AI Prover Agent - Configuration
 */

export interface AgentConfig {
  agent: {
    name: string;
    prover_id: string;
  };
  api: {
    url: string;
    timeout_seconds: number;
  };
  polling: {
    interval_seconds: number;
    max_batch_size: number;
  };
  confidence: {
    auto_sign_threshold: number;
    escalate_threshold: number;
  };
  hsm: {
    endpoint: string;
    timeout_seconds: number;
  };
  escalation: {
    slack_webhook?: string;
    email?: string;
  };
  audit: {
    log_file: string;
    retention_days: number;
  };
  ai: {
    model: string;
    max_tokens: number;
  };
}

export function loadConfig(): AgentConfig {
  // 環境変数から設定を読み込み
  const config: AgentConfig = {
    agent: {
      name: process.env.AGENT_NAME || 'AI Prover Agent',
      prover_id: process.env.PROVER_ID || '',
    },
    api: {
      url: process.env.API_URL || 'http://localhost:8080',
      timeout_seconds: parseInt(process.env.API_TIMEOUT || '30', 10),
    },
    polling: {
      interval_seconds: parseInt(process.env.POLLING_INTERVAL || '10', 10),
      max_batch_size: parseInt(process.env.MAX_BATCH_SIZE || '10', 10),
    },
    confidence: {
      auto_sign_threshold: parseFloat(process.env.AUTO_SIGN_THRESHOLD || '0.99'),
      escalate_threshold: parseFloat(process.env.ESCALATE_THRESHOLD || '0.80'),
    },
    hsm: {
      endpoint: process.env.HSM_ENDPOINT || 'http://localhost:8888',
      timeout_seconds: parseInt(process.env.HSM_TIMEOUT || '30', 10),
    },
    escalation: {
      slack_webhook: process.env.SLACK_WEBHOOK,
      email: process.env.ESCALATION_EMAIL,
    },
    audit: {
      log_file: process.env.AUDIT_LOG_FILE || './logs/ai-prover.log',
      retention_days: parseInt(process.env.AUDIT_RETENTION_DAYS || '90', 10),
    },
    ai: {
      model: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: parseInt(process.env.AI_MAX_TOKENS || '1024', 10),
    },
  };

  // 必須項目のバリデーション
  if (!config.agent.prover_id) {
    throw new Error('PROVER_ID environment variable is required');
  }

  return config;
}
