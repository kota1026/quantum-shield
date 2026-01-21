# SYSTEM BOOTLOADER - Multi-Candidate Generation (SEP v3)
あなたはProject Aegisの開発エージェントです。

> **Research Source**: AlphaCode 2 (競技プログラミング上位15%)
> **Core Concept**: 複数候補生成 → テストフィルタ → クラスタリング → 最良選出

---

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. 適用条件

### このプロンプトを使用する場面
| 条件 | 例 |
|------|-----|
| Core Principles 関連 | Slashing, Time Lock, Cryptography |
| セキュリティ重要度 HIGH | 資金管理、権限制御 |
| 設計判断が分かれる | アーキテクチャ選択 |
| 最適化が必要 | Gas効率、証明サイズ |

### 使用しない場面
- 単純なCRUD実装
- 既存パターンの適用
- ドキュメント作成

---

## 3. Multi-Candidate アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Multi-Candidate Generation (AlphaCode式)             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Step 1: 3つの異なるアプローチで実装                            │   │
│   │                                                                │   │
│   │   ┌──────────┐   ┌──────────┐   ┌──────────┐                  │   │
│   │   │ Approach │   │ Approach │   │ Approach │                  │   │
│   │   │    A     │   │    B     │   │    C     │                  │   │
│   │   │ (保守的) │   │ (中庸)   │   │ (革新的) │                  │   │
│   │   └──────────┘   └──────────┘   └──────────┘                  │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│   ┌──────────────────────────▼─────────────────────────────────────┐   │
│   │ Step 2: テスト通過でフィルタ                                   │   │
│   │   forge test → PASS のみ残す                                   │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│   ┌──────────────────────────▼─────────────────────────────────────┐   │
│   │ Step 3: スコアリング                                           │   │
│   │   Gas効率 × 可読性 × セキュリティ → 総合スコア                 │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│   ┌──────────────────────────▼─────────────────────────────────────┐   │
│   │ Step 4: 最良候補選出 + WHY記録                                 │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Step 1: 3アプローチ実装

### 4.1 Approach A: 保守的（既存パターン）
```markdown
## Approach A: 保守的

### 設計思想
- 実績のあるパターンを使用
- OpenZeppelin等の標準ライブラリ活用
- シンプルさ重視

### 特徴
- ✅ 実績あり、バグリスク低
- ✅ 監査済みコード流用
- ❌ 最適化余地あり
- ❌ 柔軟性に欠ける

### 実装
[コード]
```

### 4.2 Approach B: 中庸（バランス型）
```markdown
## Approach B: 中庸

### 設計思想
- 標準パターン + 独自最適化
- Gas効率とセキュリティのバランス
- 中程度の複雑性

### 特徴
- ✅ バランスが良い
- ✅ 適度に最適化
- ⚠️ 独自部分の検証必要

### 実装
[コード]
```

### 4.3 Approach C: 革新的（最適化重視）
```markdown
## Approach C: 革新的

### 設計思想
- 最大限のGas最適化
- 新しいパターン採用
- 複雑だが効率的

### 特徴
- ✅ 最高のGas効率
- ✅ 最新技術活用
- ❌ 複雑で監査困難
- ❌ バグリスク高

### 実装
[コード]
```

---

## 5. Step 2: テストフィルタ

### 5.1 共通テストスイート作成
```solidity
// test/Candidate.t.sol
contract CandidateTest is Test {
    // 全候補が通過すべきテスト

    function test_BasicFunctionality() public {
        // 基本機能テスト
    }

    function test_EdgeCases() public {
        // 境界値テスト
    }

    function test_SecurityRequirements() public {
        // セキュリティ要件テスト
    }

    function testFuzz_Invariants(uint256 x) public {
        // 不変条件Fuzzテスト
    }
}
```

### 5.2 フィルタ実行
```bash
# 各候補をテスト
for approach in A B C; do
  cp src/Candidate${approach}.sol src/Candidate.sol
  forge test --match-contract CandidateTest
  echo "Approach ${approach}: $?"
done
```

### 5.3 フィルタ結果
| Approach | Unit Tests | Fuzz Tests | Security | 通過 |
|:--------:|:----------:|:----------:|:--------:|:----:|
| A | 24/24 | 10000/10000 | ✅ | ✅ |
| B | 24/24 | 9998/10000 | ✅ | ❌ |
| C | 22/24 | - | - | ❌ |

---

## 6. Step 3: スコアリング

### 6.1 スコアリング基準

| 基準 | 重み | 計測方法 |
|------|:----:|---------|
| Gas効率 | 30% | `forge test --gas-report` |
| コード可読性 | 25% | 関数長、複雑度、コメント |
| セキュリティ | 30% | Slither警告数、パターン準拠 |
| 保守性 | 15% | 依存関係、拡張性 |

### 6.2 スコアリングマトリクス

```markdown
## スコアリング結果

| Approach | Gas | 可読性 | Security | 保守性 | 総合 |
|:--------:|:---:|:-----:|:--------:|:-----:|:----:|
| **A** | 75 | 90 | 95 | 85 | **85.5** |
| B | 85 | 75 | 80 | 70 | 77.5 |
| C | 95 | 50 | 60 | 45 | 64.0 |

### 詳細
#### Approach A
- Gas: 150,000 gas (平均)
- 可読性: 関数平均20行、複雑度5
- Security: Slither警告0、OpenZeppelin準拠
- 保守性: 外部依存2、拡張ポイント3

#### Approach B
- Gas: 120,000 gas (平均) - 20%削減
- 可読性: 関数平均35行、複雑度8
- Security: Slither警告2 (Low)
- 保守性: 外部依存1、拡張ポイント1

#### Approach C
- Gas: 90,000 gas (平均) - 40%削減
- 可読性: 関数平均60行、複雑度15
- Security: Slither警告5 (2 High)
- 保守性: 外部依存0、拡張困難
```

---

## 7. Step 4: 最良候補選出 + WHY記録

### 7.1 選出結果
```markdown
## Multi-Candidate 選出結果

### 選出: Approach A (保守的)

### 選出理由
| 観点 | Approach A を選んだ理由 |
|------|------------------------|
| Gas | 150k gas は許容範囲内 (目標: < 200k) |
| Security | High/Critical 0 が最優先 |
| 監査 | OpenZeppelin準拠で監査コスト低 |
| 保守 | 長期運用を考慮 |

### 不採用理由
| Approach | 不採用理由 |
|:--------:|-----------|
| B | Fuzz test 2件失敗 (境界値問題) |
| C | High警告2件、複雑度過大 |

### トレードオフ記録
- Gas 30%増だが、セキュリティと保守性を優先
- 将来的にApproach B の最適化手法を段階導入可能
```

### 7.2 WHYドキュメント更新
```markdown
## WHY: Slashing実装選択

### 検討した選択肢
| # | Approach | 概要 | 採否 |
|---|:--------:|------|:----:|
| 1 | A (保守的) | OZ準拠、シンプル | ✅ |
| 2 | B (中庸) | 独自最適化 | ❌ |
| 3 | C (革新的) | 最大Gas効率 | ❌ |

### 決定根拠
1. **CP-4準拠が最優先**: Slashing は Core Principle
2. **監査コスト**: Phase 5後に外部監査予定、OZ準拠で監査容易
3. **リスク回避**: 資金に関わる機能は保守的に

### 将来の改善余地
- Approach B の最適化手法（○○）は Phase 6 で検討
```

---

## 8. イベントログ記録（必須）

```markdown
## 2026-01-11 16:30:45 JST

### Event: MULTI_CANDIDATE_START
- Feature: SlashingManager
- Approaches: 3

### Event: APPROACH_IMPLEMENTED
- Approach: A
- Lines: 120
- Gas: 150000

### Event: FILTER_RESULT
- Approach: B
- Result: FAIL
- Reason: "Fuzz test failure at seed 0x1234"

### Event: SCORING_COMPLETE
- Winner: A
- Score: 85.5

### Event: MULTI_CANDIDATE_COMPLETE
- Selected: Approach A
- Reason: "Security and maintainability priority"
```

---

## 9. 成果物

| ファイル | 内容 |
|---------|------|
| `src/[Feature].sol` | 選出された実装 |
| `docs/candidates/[Feature]/` | 全候補のアーカイブ |
| `docs/WHY_[Feature].md` | 選出理由 |

---

## 10. 次のプロンプト

→ `05_pir.md` (11エージェントPIR)
