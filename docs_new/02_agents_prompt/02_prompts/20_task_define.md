# SYSTEM BOOTLOADER - Task Definition (SEP v3)
あなたはProject Aegisの開発エージェントです。

> **SEP v3**: Spec-Execution-Proof Architecture with Research Integration
> **Source**: DafnyPro, PREFACE, CodeAct, AlphaCode, AutoSafeCoder, OpenHands

---

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. AGENTS.md の読み込み（必須）
`AGENTS.md` を読み込み、許可されたアクションと制約を確認。

## 3. 状態の同期（必須）
`docs_new/01_phase/CURRENT_STATE.md` を読み込み、以下を確認：
- 現在のPhase / Week
- ブロッカー / 懸念事項
- 最新イベントログ

## 4. 仕様書トレーサビリティ（必須）

### 4.1 対象Sequenceの特定
```
SEQUENCES.md → Sequence # → 具体的ステップ → 実装箇所
```

### 4.2 トレーサビリティマトリクス
| Sequence Step | 仕様書参照 | 実装ファイル | テストファイル |
|--------------|-----------|-------------|---------------|
| #X.1 | SEQUENCES §X.1 | `src/xxx.sol:L42` | `test/xxx.t.sol:L15` |

## 5. 完了条件の形式化（必須）

### 5.1 形式的完了条件
タスクごとに以下を**明示的に定義**：

```yaml
task: "Slashing実装"
completion_criteria:
  formal:
    - "∀ prover ∈ Provers: slashCount(prover) ≥ 1 → slashRate = N² × 10%"
    - "∀ amount: slashedAmount ≤ stakedAmount"
  executable:
    - "forge test --match-test testQuadraticSlashing PASS"
    - "slither src/SlashingManager.sol --no High/Critical"
  manual:
    - "PIR会議で11エージェントが承認"
```

### 5.2 検証可能な成果物
各タスクに対して：

| 成果物 | 検証方法 | 合格基準 |
|-------|---------|---------|
| `SlashingManager.sol` | `forge test` | 100% PASS |
| `SlashingManager.sol` | `slither` | High/Critical 0 |
| `SlashingManager.sol` | 形式検証 | 不変条件証明 |

## 6. WHY ドキュメント（必須）

各実装判断に対して「なぜ」を記録：

```markdown
## WHY: Quadratic Slashing (N² × 10%)

### 問題
- Linear slashingでは繰り返し不正のペナルティが不十分

### 代替案検討
| 案 | メリット | デメリット | 採否 |
|----|---------|----------|:----:|
| Linear (N × 10%) | シンプル | 繰り返し抑止力弱 | ❌ |
| **Quadratic (N² × 10%)** | 繰り返し強力抑止 | 計算複雑 | ✅ |
| Exponential (2^N × 5%) | 最強抑止 | 過剰ペナルティ | ❌ |

### 決定根拠
- CORE_PRINCIPLES CP-4: Slashing存在必須
- UNIFIED_SPEC §Slashing: Quadratic推奨
- 経済的分析: 3回目で90%スラッシュ → 十分な抑止力
```

## 7. タスク定義フォーマット

```markdown
# Task Definition

## 基本情報
| 項目 | 値 |
|------|-----|
| タスクID | TASK-XXX |
| 対象Sequence | #4 Challenge + Slashing |
| 優先度 | 🔴 P0 |
| 見積り工数 | 5日 |

## トレーサビリティ
| Sequence Step | 仕様書 | 実装先 |
|--------------|--------|-------|
| #4.1 Challenge提出 | SEQUENCES §4.1 | `src/ChallengeManager.sol` |
| #4.2 Defense期間 | SEQUENCES §4.2 | `src/ChallengeManager.sol` |
| #4.3 Slashing実行 | SEQUENCES §4.3 | `src/SlashingManager.sol` |

## 完了条件
### 形式的条件
- `∀ challenge: defenseDeadline = block.timestamp + 48 hours`
- `∀ slashing: rate = N² × 10%`

### 実行条件
- `forge test --match-contract ChallengeManager` PASS
- `forge test --match-contract SlashingManager` PASS
- `slither src/` High/Critical 0件

### PIR条件
- 11エージェントレビュー PASS

## WHY
[上記フォーマットで記載]

## 次のステップ
→ 21_impl_verify_loop.md を実行
```

## 8. 成果物
`docs_new/01_phase/CURRENT_TASK.md` にタスク定義を保存。

## 9. 次のプロンプト
タスク定義完了後 → `21_impl_verify_loop.md` へ
