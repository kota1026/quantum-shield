# Quantum Shield — 自律的改善システム設計

## コンセプト

Kota は **重大な意思決定** に集中し、日々のサービス改善・競合動向・業界リサーチは
自動化する。Claude Code の hooks/agents/skills を組み合わせて実現。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│  Kota (意思決定者)                                           │
│  - Grant 申請の最終判断                                       │
│  - 技術方針の承認                                             │
│  - リリース Go/No-Go                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │ 提案・レポート
┌─────────────────▼───────────────────────────────────────────┐
│  Claude Code Session (対話型)                                │
│  - コード修正・レビュー・デプロイ                               │
│  - E2E テスト自動実行                                         │
│  - Grant ドラフト更新                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │ 自動実行
┌─────────────────▼───────────────────────────────────────────┐
│  自動化レイヤー                                               │
│                                                               │
│  1. SessionStart Hook (セッション開始時に自動実行)             │
│     - PQC 業界ニュース収集                                     │
│     - 競合プロジェクト更新チェック                               │
│     - NIST/EF/EIP 最新動向                                     │
│     - Dependabot アラート確認                                   │
│     - デプロイ状態・サイトヘルスチェック                         │
│                                                               │
│  2. GitHub Actions (定期実行)                                  │
│     - 毎日: E2E テスト自動実行                                  │
│     - 毎週: 依存関係アップデート                                │
│     - 毎月: セキュリティ監査スキャン                            │
│                                                               │
│  3. Claude Code Skills (オンデマンド)                          │
│     - /research-pqc — PQC 分野の最新動向リサーチ              │
│     - /competitive-intel — 競合分析レポート                    │
│     - /verify-all — 全シーケンス E2E テスト                   │
│     - /grant-update — Grant ドラフト更新                      │
│     - /security-scan — セキュリティ脆弱性チェック             │
│                                                               │
│  4. Monitoring (継続的)                                        │
│     - Vercel デプロイ状態監視                                   │
│     - Railway バックエンド ヘルスチェック                       │
│     - L1 コントラクト イベント監視                              │
│     - DNS 状態監視                                             │
└─────────────────────────────────────────────────────────────┘
```

## 実装計画

### Phase 1: SessionStart Hook (即日実装可能)

```json
// .claude/settings.json
{
  "hooks": {
    "SessionStart": [{
      "command": "bash .claude/hooks/session-start.sh",
      "description": "Auto-check project state on session start"
    }]
  }
}
```

session-start.sh が実行する内容:
- `curl -s https://quantum-shield.xyz` → サイト稼働確認
- `curl -s https://quantum-shield-production-8f2b.up.railway.app/v1/health` → API 稼働確認
- `git log --oneline -5` → 直近の変更
- 競合・業界ニュースの要約を CLAUDE.md に追記

### Phase 2: カスタム Skills

```
.claude/skills/
  research-pqc/SKILL.md     — PQC 動向リサーチ
  competitive-intel/SKILL.md — 競合分析
  verify-all/SKILL.md        — 全フロー E2E テスト
  grant-update/SKILL.md      — Grant ドラフト更新
```

### Phase 3: GitHub Actions CI/CD

```yaml
# .github/workflows/daily-check.yml
name: Daily Health Check
on:
  schedule:
    - cron: '0 9 * * *'  # 毎日 9:00 UTC
jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: E2E smoke test
        run: |
          docker-compose up -d postgres redis
          cargo run --release &
          cd src/frontend/web && pnpm install && pnpm dev &
          npx playwright test e2e/smoke-test.spec.ts
      - name: Notify on failure
        if: failure()
        run: # Slack/Discord notification
```

### Phase 4: 競合・業界モニタリング

定期的に以下をチェック:
- ethresear.ch の PQC 関連投稿
- NIST PQC プロジェクトページ
- QRL, PQShield, StarkNet の更新
- arXiv の量子計算・PQC 論文
- Ethereum EIP の PQC 関連提案

結果を `docs/intelligence/` に蓄積し、Grant 更新や技術方針に活用。

## 優先度

1. 🔴 E2E テスト自動化 (今日中)
2. 🟡 SessionStart Hook (今週中)
3. 🟡 カスタム Skills (今週中)
4. 🟢 GitHub Actions CI/CD (来週)
5. 🟢 競合モニタリング自動化 (来月)
