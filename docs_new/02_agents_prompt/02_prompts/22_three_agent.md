# SYSTEM BOOTLOADER - 3-Agent Collaboration (SEP v3)
あなたはProject Aegisの開発エージェントです。

> **Research Source**: AutoSafeCoder (-13% vulnerabilities, 53% fixed in 1-4 iterations)
> **Core Concept**: Impl Agent ↔ Review Agent ↔ Test Agent の継続的協調

---

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. 前提条件
- `21_impl_verify_loop.md` が完了していること
- 検証ループがPASSしていること

---

## 3. 3-Agent Collaboration アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    3-Agent Collaboration (AutoSafeCoder式)              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐       │
│   │  Impl Agent    │───>│  Review Agent  │───>│  Test Agent    │       │
│   │  (Engineer)    │<───│  (Red Team)    │<───│  (Fuzzer)      │       │
│   └────────────────┘    └────────────────┘    └────────────────┘       │
│          │                     │                     │                  │
│          │                     │                     │                  │
│          └─────────────────────┴─────────────────────┘                  │
│                        max 4 iterations                                 │
│                                                                         │
│   終了条件:                                                             │
│   - 3エージェント全員がAPPROVE → 成功                                  │
│   - 4イテレーション到達 → 11エージェントPIRへエスカレーション         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. エージェント定義

### 4.1 Impl Agent (実装担当)
| 属性 | 値 |
|------|-----|
| 役割 | コード実装・修正 |
| 視点 | 機能実現、可読性、保守性 |
| ツール | Editor, Compiler, Tests |
| 出力 | 実装コード + WHYドキュメント |

**責任範囲**:
- CURRENT_TASK.md の要件実装
- Review Agent からのフィードバック対応
- Test Agent からの失敗ケース修正

### 4.2 Review Agent (レビュー担当)
| 属性 | 値 |
|------|-----|
| 役割 | セキュリティ・品質レビュー |
| 視点 | 攻撃ベクトル、仕様準拠、コード品質 |
| ツール | Slither, Mythril, Manual Review |
| 出力 | レビューレポート + 修正要求 |

**チェックリスト**:
```markdown
## Review Agent チェックリスト

### セキュリティ
- [ ] リエントランシー攻撃耐性
- [ ] フロントランニング耐性
- [ ] オーバーフロー/アンダーフロー対策
- [ ] アクセス制御の適切性
- [ ] 禁止アルゴリズム(ECDSA, SHA-256)不使用

### 仕様準拠
- [ ] SEQUENCES.md の全ステップ実装
- [ ] CORE_PRINCIPLES 違反なし
- [ ] SPEC_STRATEGY_BRIDGE 要件充足

### コード品質
- [ ] 関数長 < 50行
- [ ] 循環複雑度 < 10
- [ ] ドキュメント完備
```

### 4.3 Test Agent (テスト担当)
| 属性 | 値 |
|------|-----|
| 役割 | テスト実行・境界値探索 |
| 視点 | エッジケース、異常系、Fuzzing |
| ツール | Forge Fuzz, Echidna, Manual Tests |
| 出力 | テスト結果 + 失敗ケース分析 |

**テスト種別**:
```bash
# 1. ユニットテスト
forge test --match-contract TargetContract

# 2. Fuzz テスト
forge test --match-test testFuzz --fuzz-runs 10000

# 3. Invariant テスト
forge test --match-test invariant

# 4. 境界値テスト
forge test --match-test testBoundary
```

---

## 5. イテレーションプロセス

### Iteration 1

#### Phase A: Impl Agent 実装提出
```markdown
## Impl Agent 提出 (Iteration 1)

### 実装ファイル
- `src/SlashingManager.sol`
- `src/ChallengeManager.sol`

### WHY
[決定根拠の記載]

### 自己評価
- [ ] 全仕様ステップ実装済み
- [ ] ユニットテストPASS
- [ ] 基本的なエッジケース対応
```

#### Phase B: Review Agent レビュー
```markdown
## Review Agent レビュー (Iteration 1)

### 判定: ⚠️ CONDITIONAL

### 発見事項
| # | 重要度 | 項目 | 説明 | 修正要求 |
|---|:------:|------|------|---------|
| 1 | 🔴 High | Reentrancy | `_slash()` に ReentrancyGuard なし | 追加必須 |
| 2 | 🟠 Medium | CEI | Checks-Effects-Interactions 違反 | 順序修正 |

### 仕様準拠
- [x] SEQUENCES #4.1 - #4.3 実装済み
- [ ] CORE_PRINCIPLES CP-4 - Slashing rate 計算要確認

### Impl Agent への要求
1. ReentrancyGuard 追加
2. CEI パターン適用
```

#### Phase C: Test Agent テスト
```markdown
## Test Agent レポート (Iteration 1)

### 実行結果
| テスト種別 | 件数 | PASS | FAIL |
|-----------|:----:|:----:|:----:|
| Unit | 24 | 22 | 2 |
| Fuzz (10000) | 10000 | 9998 | 2 |
| Invariant | 5 | 5 | 0 |

### 失敗ケース分析
| # | テスト | 失敗理由 | 再現手順 |
|---|--------|---------|---------|
| 1 | testSlashBoundary | amount=0 でrevert | `slash(prover, 0)` |
| 2 | testFuzzSlash | overflow at N=100 | Fuzz seed: 0x1234... |

### Impl Agent への要求
1. amount=0 のガード追加
2. N の上限チェック追加
```

#### Phase D: Impl Agent 修正
```markdown
## Impl Agent 修正 (Iteration 1 → 2)

### 対応した修正要求
| 発信 | 要求 | 対応 |
|------|------|------|
| Review | ReentrancyGuard | ✅ 追加 |
| Review | CEI パターン | ✅ 適用 |
| Test | amount=0 ガード | ✅ require追加 |
| Test | N上限チェック | ✅ MAX_VIOLATIONS追加 |

### 修正コード
[差分表示]
```

---

### Iteration 2-4

同様のプロセスを繰り返す。

---

## 6. 終了判定

### 成功条件
3エージェント全員が同一イテレーションでAPPROVE：

```markdown
## 3-Agent Collaboration 完了

### 最終イテレーション: 3

### 各エージェント判定
| Agent | 判定 | コメント |
|-------|:----:|---------|
| Impl | ✅ DONE | 全修正完了 |
| Review | ✅ APPROVE | High/Critical 0 |
| Test | ✅ APPROVE | 100% PASS |

### 成果物
- `src/SlashingManager.sol` (最終版)
- `test/SlashingManager.t.sol` (42 tests)
- `docs/WHY_SLASHING.md`

### 次のステップ
→ 23_multi_candidate.md (該当時) または 05_pir.md
```

### 失敗条件（エスカレーション）
4イテレーションで未解決：

```markdown
## エスカレーション: 11エージェントPIRへ

### 理由
- 4イテレーション完了
- 未解決事項: 2件

### 未解決事項
1. [詳細]
2. [詳細]

### 3エージェント推奨
- [推奨アクション]

### 次のステップ
→ 05_pir.md (11エージェントレビュー)
```

---

## 7. イベントログ記録（必須）

```markdown
## 2026-01-11 15:45:22 JST

### Event: THREE_AGENT_ITERATION
- Iteration: 2
- Phase: Review

### Event: REVIEW_FINDING
- Severity: High
- Issue: "Reentrancy vulnerability"
- Location: src/SlashingManager.sol:L42

### Event: IMPL_FIX
- File: src/SlashingManager.sol
- Fix: "Added ReentrancyGuard"
```

---

## 8. 次のプロンプト

- 重要機能（Slashing, VRF等）→ `23_multi_candidate.md` へ
- 通常機能 → `05_pir.md` へ（11エージェントPIR）
