# Agent Meeting Protocol v3.2

> **Version**: 3.2  
> **Last Updated**: 2025-12-21

---

## 1. Overview

本プロトコルは、Quantum Shield L3プロジェクトにおける11エージェントシステムの会議・意思決定プロセスを定義する。

---

## 2. Agent Roles

### 2.1 Strategic Layer

| Agent | Role | Responsibility |
|-------|------|---------------|
| Purpose Guardian | 理念保護者 | Core Principlesの遵守監視 |
| CTO | 最高技術責任者 | 技術アーキテクチャ決定 |
| CSO | 最高セキュリティ責任者 | セキュリティ監視・リスク管理 |

### 2.2 Business Layer

| Agent | Role | Responsibility |
|-------|------|---------------|
| CFO | 最高財務責任者 | 予算・資金調達・Token設計 |
| CBO | 最高ビジネス責任者 | パートナーシップ・マーケティング |
| CMO | 最高マーケティング責任者 | ブランディング・コミュニティ |

### 2.3 Execution Layer

| Agent | Role | Responsibility |
|-------|------|---------------|
| Engineer | エンジニア | 実装・コード作成 |
| Crypto Auditor | 暗号監査人 | 暗号実装の正確性検証 |
| QA | 品質保証 | テスト・品質管理 |
| DevOps | インフラ担当 | デプロイ・運用 |
| Researcher | 研究者 | 技術調査・最適化研究 |

---

## 3. Meeting Types

### 3.1 Design Meeting

| 項目 | 内容 |
|------|------|
| 目的 | 仕様策定・技術決定 |
| 参加者 | 全11エージェント |
| 頻度 | 週1回 or 必要時 |
| 出力 | 投票結果・決定事項 |

### 3.2 Progress Meeting

| 項目 | 内容 |
|------|------|
| 目的 | 進捗確認・ブロッカー解消 |
| 参加者 | 関連エージェント |
| 頻度 | 90分サイクル |
| 出力 | ステータスレポート |

### 3.3 Go/No-Go Meeting

| 項目 | 内容 |
|------|------|
| 目的 | フェーズ移行判定 |
| 参加者 | 全11エージェント |
| 頻度 | フェーズ終了時 |
| 出力 | GO/NO-GO決定 |

---

## 4. Voting Protocol

### 4.1 投票ルール

| 項目 | 設定 |
|------|------|
| 有効投票 | 11エージェント全員 |
| 承認基準 | 単純過半数（6/11） |
| 重要決定 | 2/3以上（8/11） |
| 拒否権 | Purpose Guardianのみ（理念違反時） |

### 4.2 投票カテゴリ

| カテゴリ | 基準 | 例 |
|---------|------|-----|
| Architecture | 2/3 | コンセンサス変更 |
| Security | 2/3 | 暗号アルゴリズム変更 |
| Economics | 過半数 | 手数料率調整 |
| Governance | 2/3 | Council構成変更 |
| Operational | 過半数 | ツール選定 |

---

## 5. Escalation Protocol

### 5.1 エスカレーション条件

| レベル | 条件 | 対応 |
|--------|------|------|
| L1 | 意見分岐 | CTO/CSO調停 |
| L2 | 調停失敗 | 全体投票 |
| L3 | 理念関連 | Purpose Guardian判断 |
| L4 | 緊急 | Kota（CEO）エスカレーション |

### 5.2 Trust Level

| Level | 自動化度 | 承認 |
|-------|---------|------|
| 1 | 報告のみ | 不要 |
| 2 | 提案+承認 | Kota承認必須 |
| 3 | 自動実行+事後報告 | 条件付き自動 |
| 4 | 完全自動 | 自動 |

---

## 6. Output Format

### 6.1 議事録テンプレート

```markdown
# Meeting Minutes: [Meeting Type]

**Date**: YYYY-MM-DD  
**Attendees**: [Agent list]

## Agenda
1. Item 1
2. Item 2

## Discussions
### Item 1
- Point A
- Point B

## Votes
| Item | For | Against | Result |
|------|-----|---------|--------|
| X | 9 | 2 | ✅ Approved |

## Action Items
| Task | Owner | Deadline |
|------|-------|----------|
| Task 1 | Agent | Date |

## Next Steps
- Step 1
- Step 2
```

---

## 7. Communication Channels

| Channel | 用途 |
|---------|------|
| Slack | リアルタイム通知・タスク依頼 |
| GitHub Issues | タスク管理・追跡 |
| GitHub PR | コードレビュー・承認 |
| Meeting Minutes | 意思決定記録 |

---

## 8. Principle-Based Auditing

### 8.1 Purpose Guardian チェックリスト

| チェック項目 | 説明 |
|-------------|------|
| 量子耐性 | NIST準拠アルゴリズムのみか |
| Self-Custody | ユーザー鍵管理が維持されるか |
| Time Lock | Time Lock削除提案でないか |
| Slashing | Slashing無効化提案でないか |
| 透明性 | オンチェーン検証可能か |

### 8.2 理念違反時の対応

1. Purpose Guardianが警告
2. 修正案の提示
3. 修正不可の場合、拒否権発動
4. 異議がある場合、全体投票（2/3必要）

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-20 | Initial protocol |
| 2.0 | 2025-12-20 | Added escalation |
| 3.0 | 2025-12-21 | Added Trust Levels |
| 3.2 | 2025-12-21 | Added principle auditing |

---

**END OF DOCUMENT**
