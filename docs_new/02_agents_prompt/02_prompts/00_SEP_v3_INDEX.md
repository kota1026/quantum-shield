# SEP v3: Spec-Execution-Proof Architecture

> **Version**: 3.0
> **Date**: 2026-01-11
> **Status**: Production Ready

---

## 1. 概要

SEP v3は、最先端の学術・産業研究を統合した開発プロセスフレームワークです。

### 1.1 リサーチ統合

| リサーチ | ソース | 成果 | 統合先 |
|---------|--------|------|--------|
| **Verifier-in-the-Loop** | DafnyPro, PREFACE | +21% 検証成功率 | `21_impl_verify_loop.md` |
| **3-Agent Collaboration** | AutoSafeCoder | -13% 脆弱性 | `22_three_agent.md` |
| **Multi-Candidate** | AlphaCode 2 | 上位15%品質 | `23_multi_candidate.md` |
| **CodeAct Execution** | OpenHands | 72% SWE-bench | `24_sandbox_execute.md` |
| **Event-sourced Design** | OpenHands SDK | 完全再現性 | `25_event_log.md` |
| **AGENTS.md Standard** | 60,000+ repos | 標準準拠 | `AGENTS.md` |

### 1.2 既存プロンプトとの関係

```
既存プロンプト (01-16)     SEP v3 新規 (20-25)
┌─────────────────────┐    ┌─────────────────────┐
│ 01_plan.md          │    │ 20_task_define.md   │ ← 形式化強化
│ 02_spec.md          │    │                     │
│ 03_impl.md          │───>│ 21_impl_verify_loop │ ← 自動検証ループ
│ 04_review.md        │───>│ 22_three_agent.md   │ ← 自動協調
│ 05_pir.md           │    │ 23_multi_candidate  │ ← 重要機能用
│ 06_update.md        │    │ 24_sandbox_execute  │ ← 実行保証
│ ...                 │    │ 25_event_log.md     │ ← 監査証跡
└─────────────────────┘    └─────────────────────┘
                                     │
                           ┌─────────▼─────────┐
                           │    AGENTS.md      │ ← 制約定義
                           └───────────────────┘
```

---

## 2. プロンプトフロー

### 2.1 標準フロー
```
┌──────────────────────────────────────────────────────────────────────┐
│                        SEP v3 Standard Flow                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐                                                     │
│  │ AGENTS.md   │ ← 常時参照（制約・許可アクション）                  │
│  └──────┬──────┘                                                     │
│         │                                                            │
│  ┌──────▼──────┐                                                     │
│  │ 20_task     │ タスク定義 + トレーサビリティ + 完了条件形式化      │
│  │ _define.md  │                                                     │
│  └──────┬──────┘                                                     │
│         │                                                            │
│  ┌──────▼──────┐                                                     │
│  │ 21_impl     │ 実装 + 検証ループ (max 5回)                        │
│  │ _verify     │ LLM → 検証器 → エラー解析 → 修正 → 再検証          │
│  │ _loop.md    │                                                     │
│  └──────┬──────┘                                                     │
│         │                                                            │
│  ┌──────▼──────┐                                                     │
│  │ 22_three    │ 3エージェント協調 (max 4イテレーション)            │
│  │ _agent.md   │ Impl ↔ Review ↔ Test                               │
│  └──────┬──────┘                                                     │
│         │                                                            │
│         ├─────────┐ (重要機能のみ)                                   │
│         │  ┌──────▼──────┐                                           │
│         │  │ 23_multi    │ 3候補生成 + テストフィルタ + スコアリング │
│         │  │ _candidate  │                                           │
│         │  └──────┬──────┘                                           │
│         │         │                                                  │
│         ├─────────┘                                                  │
│         │                                                            │
│  ┌──────▼──────┐                                                     │
│  │ 24_sandbox  │ サンドボックス実行 + 自動rollback                   │
│  │ _execute.md │                                                     │
│  └──────┬──────┘                                                     │
│         │                                                            │
│  ┌──────▼──────┐                                                     │
│  │ 25_event    │ イベントログ確認 + 監査証跡                        │
│  │ _log.md     │                                                     │
│  └──────┬──────┘                                                     │
│         │                                                            │
│  ┌──────▼──────┐                                                     │
│  │ 05_pir.md   │ 11エージェントPIR会議（既存）                      │
│  └─────────────┘                                                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 簡易フロー（単純タスク用）
```
20_task_define → 21_impl_verify_loop → 24_sandbox_execute → 05_pir
```

### 2.3 完全フロー（重要機能用）
```
20_task_define → 21_impl_verify_loop → 22_three_agent → 23_multi_candidate → 24_sandbox_execute → 25_event_log → 05_pir
```

---

## 3. プロンプト一覧

### 3.1 SEP v3 新規プロンプト

| # | ファイル | 目的 | リサーチ源 |
|---|----------|------|-----------|
| 20 | `20_task_define.md` | タスク形式化 | - |
| 21 | `21_impl_verify_loop.md` | 検証ループ | DafnyPro, PREFACE |
| 22 | `22_three_agent.md` | 3エージェント協調 | AutoSafeCoder |
| 23 | `23_multi_candidate.md` | 複数候補生成 | AlphaCode 2 |
| 24 | `24_sandbox_execute.md` | サンドボックス実行 | OpenHands CodeAct |
| 25 | `25_event_log.md` | イベントログ | OpenHands SDK |

### 3.2 既存プロンプト（継続使用）

| # | ファイル | 目的 |
|---|----------|------|
| 01 | `01_plan.md` | 計画作成 |
| 02 | `02_spec.md` | 仕様レビュー |
| 03 | `03_impl.md` | 実装（→ 21で強化） |
| 04 | `04_review.md` | レビュー（→ 22で強化） |
| 05 | `05_pir.md` | PIR会議 |
| 06 | `06_update.md` | 状態更新 |
| 07 | `07_gonogo.md` | Go/No-Go判断 |

---

## 4. AGENTS.md

プロジェクトルートの `AGENTS.md` は以下を定義：

| セクション | 内容 |
|-----------|------|
| **Allowed Actions** | 読み書き可能なファイル、実行可能コマンド |
| **Constraints** | Core Principles、禁止アルゴリズム、固定パラメータ |
| **Development Workflow** | 必須プロセス、検証要件 |
| **Documentation Structure** | 参照必須ドキュメント |

---

## 5. リサーチ統合の詳細

### 5.1 Verifier-in-the-Loop（21_impl_verify_loop.md）

```
┌─────────┐   ┌──────────────┐   ┌─────────┐
│ LLM生成 │──>│ 検証器群     │──>│エラー解析│──┐
└────▲────┘   │ forge build  │   └─────────┘  │
     │        │ forge test   │                │
     │        │ slither      │                │
     │        │ mythril      │                │
     │        └──────────────┘                │
     └──────────< max 5 loops >───────────────┘
```

**効果**: DafnyPro +86% 証明成功率、PREFACE +21%成功率

### 5.2 3-Agent Collaboration（22_three_agent.md）

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│Impl Agent  │───>│Review Agent│───>│Test Agent  │
│(実装)      │<───│(セキュリティ)│<───│(Fuzzing)   │
└────────────┘    └────────────┘    └────────────┘
          max 4 iterations
```

**効果**: AutoSafeCoder -13%脆弱性、53%が1-4回で修正

### 5.3 Multi-Candidate（23_multi_candidate.md）

```
3候補生成 → テストフィルタ → スコアリング → 最良選出
   A          PASS/FAIL      Gas×Security    Winner
   B
   C
```

**効果**: AlphaCode 競技プログラミング上位15%

### 5.4 CodeAct Sandbox（24_sandbox_execute.md）

```python
result = run_test("SlashingManager")
if not result.success:
    rollback()
    result = try_alternative()
```

**効果**: OpenHands 72% SWE-Bench Verified

### 5.5 Event-sourced（25_event_log.md）

```json
{"event": "CODE_EDIT", "file": "...", "before": "...", "after": "..."}
{"event": "TEST_RESULT", "passed": 42, "failed": 0}
```

**効果**: 完全再現性、監査証跡、デバッグ容易化

---

## 6. 使用例：Slashing実装

### Step 1: タスク定義（20_task_define.md）
```markdown
task: "Slashing実装"
completion_criteria:
  formal:
    - "slashRate = N² × 10%"
  executable:
    - "forge test PASS"
    - "slither High/Critical 0"
spec_refs:
  - SEQUENCES §4.3
  - CORE_PRINCIPLES CP-4
```

### Step 2: 検証ループ（21_impl_verify_loop.md）
```
Loop 1: BUILD ✅ → TEST ❌ (N² 計算誤り) → 修正
Loop 2: BUILD ✅ → TEST ❌ (境界値) → 修正
Loop 3: BUILD ✅ → TEST ✅ → SLITHER ✅ → PASS
```

### Step 3: 3エージェント（22_three_agent.md）
```
Iteration 1: Impl✅ Review⚠️(Reentrancy) Test❌ → 修正
Iteration 2: Impl✅ Review✅ Test✅ → PASS
```

### Step 4: 複数候補（23_multi_candidate.md）
```
Approach A (保守的): Score 85.5 → 選出
Approach B (中庸): Fuzz失敗 → 除外
Approach C (革新的): High警告 → 除外
```

### Step 5: サンドボックス（24_sandbox_execute.md）
```
build ✅ → test ✅ → fuzz ✅ → slither ✅ → deploy ✅ → verify ✅
```

### Step 6: イベントログ（25_event_log.md）
```
156イベント記録完了、ログ整合性 ✅
```

### Step 7: PIR（05_pir.md）
```
11エージェント APPROVE → PASS
```

---

## 7. 次のステップ

SEP v3を使用してPhase 5を開始：

1. **CP-4 Slashing実装**（最優先 - CP違反解消）
2. **Chainlink VRF統合**（仕様書必須）
3. **STARK Prover移行**（Archive活用）

各タスクで `20_task_define.md` から開始してください。

---

**END OF SEP v3 INDEX**
