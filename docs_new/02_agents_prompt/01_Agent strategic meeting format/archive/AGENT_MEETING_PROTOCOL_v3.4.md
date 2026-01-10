# Agent Meeting Protocol v3.4

> **Document Version**: 3.4  
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
- **🆕 事後確認プロセス**: コード・テスト・ログの実物確認を必須化

### v3.4 新機能

| 機能 | 説明 |
|------|------|
| Post-Implementation Review | 実装後の事後確認プロセスを追加 |
| Evidence Collection | コード差分、テスト結果、ビルドログの収集を必須化 |
| Artifact Verification | 実際の成果物を確認してからレビュー完了 |

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
│      ├── 🆕 実装完了後の確認                                    │
│      │   └── Post-Implementation Review (AIP-PIR Phase 1-5)    │
│      │                                                          │
│      └── 緊急修正・バグ対応                                     │
│          └── Emergency Meeting (簡略版)                         │
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

# Part 3: Post-Implementation Review (AIP-PIR) v1.0 🆕

> **Purpose**: 実装完了後の事後確認プロセス  
> **Focus**: 実際のコード・テスト・ログを確認して品質を保証  
> **Duration**: 45分上限  
> **Trigger**: 実装タスク完了時、またはDay単位のマイルストーン完了時

## PIR Overview

Post-Implementation Review（事後確認）は、**実際の成果物を確認**することで品質を保証するプロセスです。ドキュメントや計画だけでなく、**コード差分、テスト結果、ビルドログ**を実際に確認することが必須です。

### Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│  ⭐ PIR Core Principle                                          │
│                                                                 │
│  「実物を見ずに完了とは言わない」                               │
│                                                                 │
│  必須確認項目:                                                  │
│  ├── 📝 Code: 実際の差分（git diff）を確認                     │
│  ├── 🧪 Tests: テストコードと実行結果を確認                    │
│  ├── 🔨 Build: コンパイル/ビルドログを確認                     │
│  └── 📊 Metrics: Gas消費、カバレッジ等の数値を確認             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PIR Protocol Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  POST-IMPLEMENTATION REVIEW (AIP-PIR) v1.0                  │
│                            Total Duration: 45min                            │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│  PHASE 1: Evidence Collection (10min) ⭐ 必須                               │
│  └── 実際の成果物を収集・確認                                               │
│      ├── 1.1 コード差分の取得（git diff / GitHub PR）                       │
│      ├── 1.2 テストコードの確認                                             │
│      ├── 1.3 テスト実行結果の取得                                           │
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
│      ├── ✅ PASS: 全項目クリア                                              │
│      ├── ⚠️ CONDITIONAL PASS: 軽微な問題あり（次タスクで対応）              │
│      └── ❌ FAIL: 重大な問題あり（修正必須）                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PIR Phase Details

### PHASE 1: Evidence Collection ⭐ 最重要

**目的**: レビューに必要な実際の成果物を収集

**必須収集項目**:

| # | 項目 | 収集方法 | 必須/任意 |
|---|------|---------|----------|
| 1.1 | コード差分 | `git diff`, GitHub PR, ファイル内容取得 | **必須** |
| 1.2 | テストコード | テストファイルの内容確認 | **必須** |
| 1.3 | テスト実行結果 | `forge test`, `npm test`等のログ | **必須** |
| 1.4 | ビルドログ | `forge build`, `cargo build`等のログ | **必須** |
| 1.5 | ベンチマーク | Gas消費、実行時間等 | 該当時必須 |
| 1.6 | 静的解析 | `slither`, `cargo clippy`等 | 推奨 |

**Evidence Collectionテンプレート**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Evidence Collection Report                                     │
│                                                                 │
│  Task: [タスク名]                                               │
│  Date: [日付]                                                   │
│  Commit: [SHA]                                                  │
│                                                                 │
│  📝 Code Changes:                                               │
│  ├── Files Modified: [数]                                      │
│  ├── Lines Added: [数]                                         │
│  ├── Lines Removed: [数]                                       │
│  └── Key Changes:                                              │
│      ├── [ファイル1]: [変更概要]                               │
│      └── [ファイル2]: [変更概要]                               │
│                                                                 │
│  🧪 Test Results:                                               │
│  ├── Total Tests: [数]                                         │
│  ├── Passed: [数]                                              │
│  ├── Failed: [数]                                              │
│  ├── Skipped: [数]                                             │
│  └── Coverage: [%]                                             │
│                                                                 │
│  🔨 Build Status:                                               │
│  ├── Compiler: [バージョン]                                    │
│  ├── Warnings: [数]                                            │
│  ├── Errors: [数]                                              │
│  └── Artifacts: [生成物]                                       │
│                                                                 │
│  📊 Benchmarks:                                                 │
│  ├── Gas (Function1): [数値]                                   │
│  ├── Gas (Function2): [数値]                                   │
│  └── Memory: [数値]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**収集できない場合**:
- テストが存在しない → ❌ FAIL（テスト作成を要求）
- ビルドが失敗する → ❌ FAIL（修正を要求）
- エビデンスなしで「完了」は禁止

### PHASE 2: Code Review

**目的**: 実際のコード差分を確認

**確認項目**:

| # | 項目 | 確認方法 | 判定基準 |
|---|------|---------|---------|
| 2.1 | 仕様一致 | 差分を仕様書と照合 | 全変更が仕様に基づく |
| 2.2 | セキュリティ | コードパターン確認 | 脆弱性パターンなし |
| 2.3 | 規約準拠 | コーディング規約確認 | 規約違反なし |
| 2.4 | 残骸確認 | TODO/FIXME/console.log等 | 不要コードなし |

**コードレビューチェックリスト**:

```
□ 全ての変更が意図したものか？（予期しない変更なし）
□ 新しいpublic関数にアクセス制御があるか？
□ 外部入力は全て検証されているか？
□ エラーハンドリングは適切か？
□ マジックナンバーは定数化されているか？
□ コメントは正確か？（古いコメントが残っていないか）
□ ガス最適化の余地はないか？
```

### PHASE 3: Test Verification

**目的**: テストの存在と品質を確認

**確認項目**:

| # | 項目 | 期待値 | 不合格条件 |
|---|------|-------|-----------|
| 3.1 | テスト存在 | 変更に対応するテストあり | テストなし |
| 3.2 | テスト結果 | 全パス | 1件でも失敗 |
| 3.3 | カバレッジ | 80%以上（目標） | 50%未満 |
| 3.4 | エッジケース | 境界値テストあり | 正常系のみ |

**テスト結果の確認方法**:

```bash
# Foundry (Solidity)
forge test -vvv
forge coverage

# Cargo (Rust)
cargo test -- --nocapture
cargo tarpaulin

# Node.js
npm test
npx jest --coverage
```

### PHASE 4: Specification Compliance

**目的**: 正規仕様書との整合性確認

**照合対象**:
- QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md
- QUANTUM_SHIELD_SEQUENCES_v2.0.md
- その他関連ドキュメント

**確認項目**:

| # | 項目 | 確認方法 |
|---|------|---------|
| 4.1 | 定数値 | コード内定数と仕様書の値を比較 |
| 4.2 | ロジック | フロー図/シーケンスと実装を比較 |
| 4.3 | Core Principles | 5原則への準拠確認 |

**Core Principles確認**:

```
□ 量子耐性: NIST準拠アルゴリズムのみ使用
□ Self-Custody: ユーザーが秘密鍵を管理
□ Time Lock: ゼロ不可のTime Lockが存在
□ Slashing: 削除不可能なSlashingが存在
□ 透明性: 全てオンチェーン検証可能
```

### PHASE 5: Final Verdict

**判定基準**:

| 判定 | 条件 | 次のアクション |
|------|------|---------------|
| ✅ PASS | 全項目クリア、重大な問題なし | 次のタスクへ進む |
| ⚠️ CONDITIONAL PASS | 軽微な問題あり（Minor）| 問題を記録し、次タスクで対応 |
| ❌ FAIL | 重大な問題あり（Critical/Major）| 修正してから再レビュー |

**FAIL条件（1つでも該当で不合格）**:
1. テストが存在しない
2. テストが失敗している
3. ビルドが失敗している
4. Core Principles違反
5. 仕様書との重大な乖離
6. セキュリティ上の脆弱性

---

## PIR Output Template

```markdown
# [PIR-XXX] Post-Implementation Review: [Task Name]

**Date**: YYYY-MM-DD
**Commit**: [SHA]
**Reviewer**: 11 Agents
**Verdict**: ✅ PASS / ⚠️ CONDITIONAL PASS / ❌ FAIL

## 1. Evidence Collection

### 1.1 Code Changes
| File | Changes | Summary |
|------|---------|---------|
| [file1] | +XX/-YY | [概要] |
| [file2] | +XX/-YY | [概要] |

**Key Code Snippets**:
```solidity
// 変更されたコードの重要部分を引用
```

### 1.2 Test Results
```
[テスト実行ログを貼り付け]
```

**Summary**:
- Total: XX tests
- Passed: XX
- Failed: XX
- Coverage: XX%

### 1.3 Build Log
```
[ビルドログを貼り付け]
```

**Status**: ✅ Success / ❌ Failed

### 1.4 Benchmarks
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Gas (func1) | XXX | XXX | +X% |
| Gas (func2) | XXX | XXX | -X% |

## 2. Code Review Findings

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | [問題] | 🟡 Minor | ✅ Acceptable |
| 2 | [問題] | 🟠 Major | ❌ Fix Required |

## 3. Specification Compliance

| Item | Spec Value | Impl Value | Match |
|------|-----------|-----------|-------|
| [定数1] | XXX | XXX | ✅ |
| [定数2] | XXX | XXX | ✅ |

### Core Principles
- [x] 量子耐性: ✅
- [x] Self-Custody: ✅
- [x] Time Lock: ✅
- [x] Slashing: ✅
- [x] 透明性: ✅

## 4. Final Verdict

**Status**: [✅ PASS / ⚠️ CONDITIONAL PASS / ❌ FAIL]

**Reason**: [判定理由]

**Action Items** (if any):
1. [対応事項1]
2. [対応事項2]
```

---

## PIR vs AIP Comparison

| 項目 | AIP (Pre-Implementation) | PIR (Post-Implementation) |
|------|-------------------------|---------------------------|
| タイミング | 実装前 | 実装後 |
| 目的 | 計画の承認 | 成果物の確認 |
| 主な確認対象 | 設計、擬似コード | 実際のコード、テスト結果 |
| エビデンス | 不要 | **必須** |
| 判定 | Go/No-Go | PASS/CONDITIONAL/FAIL |

---

# Part 4: Design Meeting Protocol Details

[v3.2の内容を維持 - 省略]

---

## Best Practices

### 効果的な会議のために

1. **会議タイプを正しく選択**: Design / Implementation / Post-Review
2. **課題を明確に**: Phase 1で曖昧さを排除
3. **多様な視点を尊重**: 全エージェントの意見を聞く
4. **強制懸念を活用**: 見落としを防ぐ最重要ルール
5. **投票で決着**: 議論が平行線の場合は投票へ
6. **イテレーションを恐れない**: 2回までは許容
7. **外部レビューを活用**: 異なる視点を取り入れる
8. **テスト計画を先に**: 実装前にテスト戦略を確定
9. **🆕 実物を確認**: コード、テスト、ログを必ず確認

### アンチパターン

| パターン | 問題 | 対策 |
|---------|------|------|
| 全員一致症候群 | 見落としが増える | 強制懸念ルール |
| 無限イテレーション | 進捗しない | 最大2回制限 |
| 投票スキップ | 決定が曖昧 | Phase 8必須 |
| 外部レビュー無視 | 盲点が残る | 統合プロセス |
| テストなし実装 | 品質低下 | AIP Phase 4必須 |
| 🆕 エビデンスなし承認 | 問題見落とし | PIR Phase 1必須 |

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

---

**END OF DOCUMENT**
