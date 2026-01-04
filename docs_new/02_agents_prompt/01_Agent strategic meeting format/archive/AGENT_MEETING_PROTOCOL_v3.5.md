# Agent Meeting Protocol v3.5

> **Document Version**: 3.5  
> **Last Updated**: 2025-12-22  
> **Purpose**: 11エージェントによる設計・実装会議の標準プロセス

---

## Overview

Agent Meeting Protocol は、11人のAIエージェントが協力して複雑な設計課題を解決するための構造化されたプロセスである。各エージェントは専門的な視点を持ち、提案、批評、投票を通じて最適な設計・実装に到達する。

### Key Features

- **強制懸念提出**: 各エージェントが最低1つの懸念を提出必須
- **機能別投票**: 全機能を個別に投票で確定
- **イテレーション**: 重大懸念は追加Roundで解決
- **外部レビュー統合**: ChatGPT/Gemini等の外部AIの批評を統合可能
- **実装フェーズ対応**: AIP (Agent Implementation Protocol) による品質保証
- **事後確認プロセス**: コード・テスト・ログの実物確認を必須化
- **🆕 ゲートキーピング**: PIR完了まで次ステップ進行禁止

### v3.5 新機能

| 機能 | 説明 |
|------|------|
| **PIR Gateway Rule** | 🆕 PIR完了前の次ステップ進行を禁止 |
| **Test Execution Requirement** | 🆕 テスト実行結果の確認を必須化 |
| **Workflow Gate** | 🆕 各Day/Task完了時にPIRゲートを設置 |

---

## ⭐ PIR Gateway Rule (v3.5 Critical Addition)

```
┌─────────────────────────────────────────────────────────────────┐
│  🚫 PIR GATEWAY RULE                                            │
│                                                                 │
│  「PIR完了まで次のステップに進んではならない」                  │
│                                                                 │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐                 │
│  │  Day N  │ ──── │   PIR   │ ──── │ Day N+1 │                 │
│  │ 実装完了 │      │ 必須通過 │      │  開始   │                 │
│  └─────────┘      └─────────┘      └─────────┘                 │
│       │                │                 │                      │
│       │    ❌ Skip     │                 │                      │
│       └────────────────X─────────────────┘                      │
│                                                                 │
│  PIR必須タイミング:                                             │
│  ├── 各Day/Task完了時                                          │
│  ├── Phase完了時                                               │
│  ├── 本番デプロイ前                                            │
│  └── CEOが特別に指示した時                                     │
│                                                                 │
│  PIR必須確認項目:                                               │
│  ├── 📝 Code: 実際の差分を確認                                 │
│  ├── 🧪 Tests: テスト実行結果を確認                            │
│  ├── 🔨 Build: ビルド成功を確認                                │
│  └── ✅ Verdict: PASS/CONDITIONAL PASSを取得                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### PIR Gateway Enforcement

**禁止事項**:
- ❌ PIRなしで次のDay/Taskを開始する
- ❌ テスト実行せずにPIRを完了する
- ❌ FAILのまま次のステップに進む
- ❌ エビデンスなしでPASS判定を出す

**許可事項**:
- ✅ PIR PASSで次のステップに進む
- ✅ PIR CONDITIONAL PASSで次のステップに進む（未解決事項を記録）
- ✅ PIR FAILで修正を行い、再PIRを実施

### Workflow with PIR Gates

```
┌─────────────────────────────────────────────────────────────────┐
│  標準ワークフロー (PIR Gate付き)                                │
│                                                                 │
│  ┌──────────┐                                                   │
│  │  AIP会議  │  ← 実装前承認                                    │
│  │ (設計確定) │                                                  │
│  └────┬─────┘                                                   │
│       ↓                                                         │
│  ┌──────────┐                                                   │
│  │ 実装作業  │  ← コード作成                                    │
│  │(Day N)   │                                                   │
│  └────┬─────┘                                                   │
│       ↓                                                         │
│  ┌──────────┐                                                   │
│  │テスト実行 │  ← ⭐ 必須                                       │
│  │(forge test)│                                                 │
│  └────┬─────┘                                                   │
│       ↓                                                         │
│  ╔══════════╗                                                   │
│  ║  PIR会議  ║  ← ⭐ GATE: ここを通過しないと進めない           │
│  ║(エビデンス║                                                   │
│  ║ 確認必須) ║                                                   │
│  ╚════┬═════╝                                                   │
│       │                                                         │
│  ┌────┴────┐                                                    │
│  │         │                                                    │
│  ↓         ↓                                                    │
│ ✅PASS    ❌FAIL                                                │
│  │         │                                                    │
│  ↓         ↓                                                    │
│ Day N+1   修正→再PIR                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Meeting Type Selection

```
┌─────────────────────────────────────────────────────────────────┐
│  会議タイプ選択フロー                                           │
│                                                                 │
│  タスク種別を判定                                               │
│      │                                                          │
│      ├── 設計・アーキテクチャ決定                               │
│      │   └── Design Meeting (Phase 1-10)                       │
│      │                                                          │
│      ├── 機能実装・コード作成（実装前）                         │
│      │   └── Implementation Meeting (AIP Phase 1-6)            │
│      │                                                          │
│      ├── 実装完了後の確認 ⭐ 必須                               │
│      │   └── Post-Implementation Review (AIP-PIR Phase 1-5)    │
│      │                                                          │
│      └── 緊急修正・バグ対応                                     │
│          └── Emergency Meeting (簡略版)                         │
│                                                                 │
│  ⚠️ 注意: 実装完了後は必ずPIRを実施してから次へ進む            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Roster

### Strategic Layer（戦略層）

| Agent | Role | Design Focus | Implementation Focus |
|-------|------|-------------|---------------------|
| 🛡️ Purpose Guardian | 理念の守護者 | Core Principlesとの整合性 | **[Gatekeeper]** 実装でも原則遵守確認 |
| 🔧 CTO | 技術統括 | アーキテクチャ、実装可能性 | 技術的負債監視、コード品質基準 |
| 🔐 CSO | セキュリティ統括 | 攻撃ベクトル、リスク評価 | 脆弱性チェック、依存関係リスク |

### Business Layer（ビジネス層）

| Agent | Role | Design Focus | Implementation Focus |
|-------|------|-------------|---------------------|
| 💰 CFO | 財務統括 | 経済モデル、収益性 | コスト対効果確認 |
| 📈 CBO | 事業開発 | 市場、競合、パートナーシップ | UXへの影響確認 |
| 💵 Cost Guardian | コスト監視 | Gas代、運営コスト、効率性 | Gas最適化、計算量O()監査 |

### Execution Layer（実行層）

| Agent | Role | Design Focus | Implementation Focus |
|-------|------|-------------|---------------------|
| 👨‍💻 Engineer | 実装担当 | コード、インフラ、技術詳細 | **[主担当]** 実装詳細、ライブラリ選定 |
| 🧮 Chief Cryptographer | 暗号専門家 | 暗号アルゴリズム、数学的安全性 | パラメータ正確性、サイドチャネル対策 |
| 📋 Researcher | 研究者 | 学術的根拠、ゲーム理論、形式検証 | 最新攻撃論文との照合 |
| ⚖️ Legal | 法務担当 | 規制、コンプライアンス、契約 | ライセンス互換性確認 |
| 🔴 Red Team | 攻撃者視点 | 攻撃シナリオ、脆弱性発見 | **[最重要]** テストシナリオ作成 |

---

# Part 1: Design Meeting Protocol (v3.2準拠)

[Design Meeting Protocol内容は維持 - 省略]

---

# Part 2: Agent Implementation Protocol (AIP) v1.0

[Pre-Implementation Meeting内容は維持 - 省略]

---

# Part 3: Post-Implementation Review (AIP-PIR) v1.1

> **Purpose**: 実装完了後の事後確認プロセス  
> **Focus**: 実際のコード・テスト・ログを確認して品質を保証  
> **Duration**: 45分上限  
> **Trigger**: 実装タスク完了時、またはDay単位のマイルストーン完了時  
> **🆕 Gate**: 次ステップへの進行はPIR完了が必須

## PIR Overview

Post-Implementation Review（事後確認）は、**実際の成果物を確認**することで品質を保証するプロセスです。ドキュメントや計画だけでなく、**コード差分、テスト結果、ビルドログ**を実際に確認することが必須です。

### Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│  ⭐ PIR Core Principle                                          │
│                                                                 │
│  「実物を見ずに完了とは言わない」                               │
│  「PIRを通過せずに次へ進まない」 🆕                             │
│                                                                 │
│  必須確認項目:                                                  │
│  ├── 📝 Code: 実際の差分（git diff）を確認                     │
│  ├── 🧪 Tests: テストコードと実行結果を確認                    │
│  ├── 🔨 Build: コンパイル/ビルドログを確認                     │
│  └── 📊 Metrics: Gas消費、カバレッジ等の数値を確認             │
│                                                                 │
│  🆕 テスト実行の必須化:                                         │
│  ├── ローカル: forge test -vvv                                 │
│  ├── CI: GitHub Actions workflow                               │
│  └── 結果: ログをPIRエビデンスとして記録                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🆕 Test Execution Requirement

### テスト実行方法

**Foundry (Solidity)**:
```bash
cd contracts

# 全テスト実行
forge test -vvv

# 特定テスト実行
forge test --match-test test_SHA3

# Gas レポート付き
forge test --gas-report

# カバレッジ
forge coverage
```

**Cargo (Rust)**:
```bash
cd circuits/dilithium-stark

# 全テスト
cargo test

# 詳細出力
cargo test -- --nocapture

# カバレッジ
cargo tarpaulin
```

### GitHub Actions経由

```bash
# PIRテストワークフローを手動トリガー
gh workflow run pir-test.yml -f pir_id=PIR-003

# または GitHub UI から Actions > PIR Test Execution > Run workflow
```

---

## PIR Protocol Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  POST-IMPLEMENTATION REVIEW (AIP-PIR) v1.1                  │
│                            Total Duration: 45min                            │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│  PHASE 0: Test Execution (NEW - Before PIR) ⭐                              │
│  └── PIR会議開始前にテストを実行                                            │
│      ├── forge test -vvv (Solidity)                                         │
│      ├── cargo test (Rust)                                                  │
│      └── ログを保存（PIRエビデンスとして使用）                              │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│  PHASE 1: Evidence Collection (10min) ⭐ 必須                               │
│  └── 実際の成果物を収集・確認                                               │
│      ├── 1.1 コード差分の取得（git diff / GitHub PR）                       │
│      ├── 1.2 テストコードの確認                                             │
│      ├── 1.3 テスト実行結果の取得 ← Phase 0の結果を使用                     │
│      ├── 1.4 ビルド/コンパイルログの取得                                    │
│      └── 1.5 ベンチマーク結果の取得（該当する場合）                         │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│  PHASE 2: Code Review (15min)                                               │
│  └── 収集したコード差分を実際に確認                                         │
│      ├── 2.1 変更内容が仕様と一致しているか                                 │
│      ├── 2.2 セキュリティ上の問題がないか                                   │
│      ├── 2.3 コーディング規約に準拠しているか                               │
│      └── 2.4 不要なコードや残骸がないか                                     │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│  PHASE 3: Test Verification (10min)                                         │
│  └── テストコードと実行結果を確認                                           │
│      ├── 3.1 テストが実際に存在するか                                       │
│      ├── 3.2 テストが全てパスしているか                                     │
│      ├── 3.3 カバレッジは十分か                                             │
│      └── 3.4 エッジケースがテストされているか                               │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│  PHASE 4: Specification Compliance (5min)                                   │
│  └── 正規仕様書との照合                                                     │
│      ├── 4.1 QUANTUM_SHIELD_*ドキュメントとの整合性                         │
│      ├── 4.2 定数値の正確性                                                 │
│      └── 4.3 Core Principlesの遵守                                          │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│  PHASE 5: Final Verdict (5min)                                              │
│  └── 最終判定                                                               │
│      ├── ✅ PASS: 全項目クリア → 次ステップ進行可                           │
│      ├── ⚠️ CONDITIONAL PASS: 軽微な問題あり → 次ステップ進行可（記録付き）│
│      └── ❌ FAIL: 重大な問題あり → 修正必須、次ステップ進行不可            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PIR Phase Details

### PHASE 0: Test Execution (NEW) ⭐

**目的**: PIR会議開始前にテストを実行し、結果を取得

**実行手順**:

1. ローカル環境またはCIでテスト実行
2. 実行ログを保存
3. 結果をPIR会議で使用

**必須出力**:
- テスト実行ログ（成功/失敗の詳細）
- ビルドログ
- Gas レポート（該当する場合）

### PHASE 1: Evidence Collection ⭐ 最重要

**目的**: レビューに必要な実際の成果物を収集

**必須収集項目**:

| # | 項目 | 収集方法 | 必須/任意 |
|---|------|---------|----------|
| 1.1 | コード差分 | `git diff`, GitHub PR, ファイル内容取得 | **必須** |
| 1.2 | テストコード | テストファイルの内容確認 | **必須** |
| 1.3 | テスト実行結果 | Phase 0で取得したログ | **必須** |
| 1.4 | ビルドログ | `forge build`, `cargo build`等のログ | **必須** |
| 1.5 | ベンチマーク | Gas消費、実行時間等 | 該当時必須 |
| 1.6 | 静的解析 | `slither`, `cargo clippy`等 | 推奨 |

**収集できない場合**:
- テストが存在しない → ❌ FAIL（テスト作成を要求）
- ビルドが失敗する → ❌ FAIL（修正を要求）
- テスト実行結果がない → ❌ FAIL（Phase 0を実行）
- エビデンスなしで「完了」は禁止

### PHASE 2-4: [v3.4と同様]

### PHASE 5: Final Verdict

**判定基準**:

| 判定 | 条件 | 次のアクション |
|------|------|---------------|
| ✅ PASS | 全項目クリア、重大な問題なし | **次のタスクへ進行可** |
| ⚠️ CONDITIONAL PASS | 軽微な問題あり（Minor）| **次のタスクへ進行可**（問題を記録） |
| ❌ FAIL | 重大な問題あり（Critical/Major）| **進行不可** - 修正してから再PIR |

**FAIL条件（1つでも該当で不合格・進行不可）**:
1. テストが存在しない
2. テストが失敗している
3. ビルドが失敗している
4. Core Principles違反
5. 仕様書との重大な乖離
6. セキュリティ上の脆弱性
7. 🆕 テスト実行結果がない（Phase 0未実施）

---

## PIR記録テンプレート

```markdown
# [PIR-XXX] Post-Implementation Review: [Task Name]

**Date**: YYYY-MM-DD HH:MM JST
**Commit**: [SHA]
**Reviewer**: 11 Agents
**Verdict**: ✅ PASS / ⚠️ CONDITIONAL PASS / ❌ FAIL

## Phase 0: Test Execution

**Command**: `forge test -vvv`
**Environment**: [Local / GitHub Actions]

### Test Output
```
[テスト実行ログを貼り付け]
```

### Summary
- Total: XX tests
- Passed: XX
- Failed: XX
- Skipped: XX

## Phase 1: Evidence Collection

[以下v3.4と同様]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-21 | Initial version |
| 2.0 | 2025-12-21 | + Phase 6 (全体レビュー), Phase 7 (課題再発見) |
| 3.0 | 2025-12-21 | + 強制懸念ルール, イテレーション制限 |
| 3.1 | 2025-12-21 | + 外部AIレビュー統合 |
| 3.2 | 2025-12-21 | + Phase 8 (機能別投票), Phase 9 (最終シーケンス) |
| 3.3 | 2025-12-22 | + AIP (Agent Implementation Protocol) v1.0統合 |
| 3.4 | 2025-12-22 | + AIP-PIR (Post-Implementation Review) v1.0追加 |
| 3.5 | 2025-12-22 | + PIR Gateway Rule: 次ステップ進行前にPIR必須 |

---

**END OF DOCUMENT**
