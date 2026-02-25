# AI Prover Agent

Quantum Shield の署名検証を自動化する AI Agent プロトタイプ。

## 概要

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI PROVER AGENT                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │   Queue     │    │     AI       │    │   HSM Interface     │   │
│  │   Monitor   │───▶│   Verifier   │───▶│   (SPHINCS+ Sign)   │   │
│  └─────────────┘    └──────────────┘    └─────────────────────┘   │
│         │                  │                       │               │
│         ▼                  ▼                       ▼               │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │  API Client │    │  Confidence  │    │   Audit Logger      │   │
│  │             │    │   Threshold  │    │                     │   │
│  └─────────────┘    └──────────────┘    └─────────────────────┘   │
│                                                                     │
│  Decision Flow:                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  confidence >= 0.99  →  AUTO_SIGN (自動署名)                        │
│  confidence >= 0.80  →  ESCALATE  (人間にエスカレーション)           │
│  confidence <  0.80  →  REJECT    (拒否 + セキュリティアラート)       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 機能

1. **キュー監視** - 署名キューを定期的にポーリング
2. **AI検証** - Unlock リクエストの正当性を AI で判断
3. **自動署名** - 高確信度のリクエストを自動署名
4. **エスカレーション** - 中確信度のリクエストは人間に通知
5. **拒否・アラート** - 低確信度のリクエストを拒否しセキュリティチームに通知
6. **監査ログ** - 全判断を記録し透明性を確保

## 使用方法

```bash
# 環境変数設定
export PROVER_ID="0xf7b02e1760e94c139396378bfe7bb985b950d85ecad180c19af27602e5b53c95"
export API_URL="http://localhost:8080"
export HSM_ENDPOINT="http://localhost:8888"
export ANTHROPIC_API_KEY="your-api-key"

# 実行
cd src/agents/ai-prover
pnpm install
pnpm start
```

## 設定

`config.yaml`:

```yaml
agent:
  name: "AI Prover Agent"
  prover_id: "${PROVER_ID}"

polling:
  interval_seconds: 10
  max_batch_size: 10

confidence:
  auto_sign_threshold: 0.99
  escalate_threshold: 0.80

hsm:
  endpoint: "${HSM_ENDPOINT}"
  timeout_seconds: 30

escalation:
  slack_webhook: "${SLACK_WEBHOOK}"
  email: "security@example.com"

audit:
  log_file: "./logs/ai-prover.log"
  retention_days: 90
```

## アーキテクチャ

```
src/agents/ai-prover/
├── README.md
├── package.json
├── config.yaml
├── src/
│   ├── index.ts          # エントリーポイント
│   ├── agent.ts          # メインエージェントクラス
│   ├── verifier.ts       # AI検証ロジック
│   ├── hsm-client.ts     # HSM署名インターフェース
│   ├── api-client.ts     # Backend API クライアント
│   ├── escalation.ts     # エスカレーション通知
│   └── audit-logger.ts   # 監査ログ
└── tests/
    └── verifier.test.ts
```

## セキュリティ考慮事項

1. **HSM分離** - 秘密鍵はHSMに保管、Agentはアクセス不可
2. **監査証跡** - 全判断を改ざん不可能な形式で記録
3. **Rate Limiting** - 異常な署名頻度を検出・ブロック
4. **プロンプトインジェクション対策** - 入力サニタイズ
5. **人間監視** - 重要な判断は人間の承認を要求
