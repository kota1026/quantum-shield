# Current Plan

> **Generated**: 2025-12-25 12:00 JST
> **Phase**: 1 - Foundation Bootstrap
> **Day**: 12

---

## 対象チェックリスト

`docs/planning/checklists/phase1_day11-14_qa.md`

---

## 前回レビュー課題

> CURRENT_STATE.md「🚧 ブロッカー / 懸念事項」より

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 High | Dilithium Lean4形式検証なし | **今回優先対応** - lake build検証 + Rust整合性確認 |
| 2 | 🔴 High | SPHINCS+形式検証なし | Phase 2 (今回スコープ外) |
| 3 | 🟢 Low | Compiler Warnings (未使用変数) | Phase 2 |

### CEO判断による優先度変更

**背景**: Phase 1終了前に形式検証の基盤を確認すべきという判断。

> 「一般的なプロジェクトではコアな暗号部分の検証をシステム構築前に行う。
> Phase 1を終える前に、NTT/Montgomeryの形式検証を完了させるべき。」

**アクション**: Lean4形式検証をDay 12の**最優先タスク**として追加。

---

## 今回のスコープ

### 🔴 形式検証タスク（最優先 - Phase 1終了条件）

```
□ [FV-001] Lean4 lake build 実行・検証
□ [FV-002] NTT.lean 証明完全性確認（sorryなし確認済み ✅）
□ [FV-003] Rust実装（circuits/dilithium-stark/src/ntt.rs）との整合性確認
□ [FV-004] 定数一致確認（Q, ZETA, ZETAS[], MONT, QINV）
□ [FV-005] NIST KATテスト追加（dilithium-stark）
```

### 🟡 修正項目（レビュー課題より）

```
□ [FIX-010] 形式検証ステータスをCURRENT_STATEに反映
□ [FIX-011] PIRレポート作成（形式検証結果）
```

### 🟡 実装項目

```
□ [IMPL-012] KATテストハーネス作成
□ [IMPL-013] Rust-Lean4整合性検証スクリプト
```

### 🟡 テスト項目（Fuzz - 元のDay 12スコープ）

```
□ [FUZZ-001] Echidna設定ファイル作成
□ [FUZZ-002] 不変条件定義
□ [FUZZ-101] Lock金額境界（MIN/MAX）
□ [FUZZ-102] Time Lock期間操作
□ [FUZZ-103] Slashing計算（N=1〜5）
```

---

## 参照ドキュメント

| 種類 | パス |
|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| チェックリスト | `docs/planning/checklists/phase1_day11-14_qa.md` |
| Lean4証明 | `proofs/lean4/NTT.lean` |
| Rust NTT | `circuits/dilithium-stark/src/ntt.rs` |
| NIST KAT | `circuits/dilithium-stark/test-vectors/PQCsignKAT_Dilithium3.rsp` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `proofs/lean4/lake-manifest.json` | Lean4ビルド成功の証跡 |
| `docs/aegis/PIR-009_FORMAL_VERIFICATION.md` | 形式検証PIRレポート |
| `circuits/dilithium-stark/tests/kat_test.rs` | NIST KATテスト |
| `scripts/verify_lean_rust_consistency.sh` | 整合性検証スクリプト |
| `test/fuzz/L1VaultFuzz.sol` | Fuzzテスト（時間があれば） |

---

## 実行順序

### Phase A: 形式検証確認（最優先）

1. **[FV-001] Lean4 lake build**
   ```bash
   cd proofs/lean4
   lake update
   lake build
   ```
   - 成功: 次へ進む
   - 失敗: Mathlib依存関係またはsorry残存を修正

2. **[FV-002] 証明完全性確認**
   - `grep -r "sorry" proofs/lean4/` → 空であること ✅ 確認済み
   - 全ての定理がnative_decideまたは明示的証明で完了

3. **[FV-003/004] Rust-Lean4整合性確認**
   | 定数 | Lean4値 | Rust値 | 一致 |
   |------|---------|--------|------|
   | Q | 8380417 | 8380417 | ✅ |
   | ζ (ZETA) | 1753 | 1753 | ✅ |
   | N | 256 | 256 | ✅ |
   | R (MONT) | 2^32 | 4193792 mod Q | 要確認 |

4. **[FV-005] NIST KATテスト追加**
   - `test-vectors/PQCsignKAT_Dilithium3.rsp` を読み込むテスト作成
   - 最低10ベクターでPASS確認

### Phase B: PIRレポート作成

5. **[FIX-010/011] PIR-009作成**
   - 形式検証の結果をドキュメント化
   - Go/No-Go判定の証跡として

### Phase C: Fuzzテスト（時間があれば）

6. **[FUZZ-001〜103]**
   - Echidna設定
   - 基本的なFuzzシナリオ3-5件

---

## Core Principles確認

| # | 原則 | 本Plan | 確認 |
|---|------|--------|------|
| CP-1 | 完全量子耐性 | Lean4でNTT正当性を証明 | ✅ 準拠 |
| CP-2 | Self-Custody | 影響なし | ✅ 違反なし |
| CP-3 | Time Lock存在 | 影響なし | ✅ 違反なし |
| CP-4 | Slashing存在 | 影響なし | ✅ 違反なし |
| CP-5 | 透明性 | Lean4証明を公開 | ✅ 準拠 |

---

## リスク・懸念事項

| # | リスク | 影響度 | 対策 |
|---|--------|--------|------|
| 1 | Lean4 lake build失敗 | 🔴 High | Mathlib 4.14.0固定、CI環境確認 |
| 2 | Rust-Lean4不整合 | 🔴 High | 定数テーブル全比較 |
| 3 | KATテスト失敗 | 🔴 High | pq-crystals参照実装と比較 |
| 4 | Fuzz時間不足 | 🟡 Medium | Day 13に繰越可 |

---

## Phase 1終了条件への影響

**追加条件**（今回の議論より）:

| 条件 | 基準 | 現状 |
|------|------|------|
| Lean4 lake build | 成功 | ⬜ 未確認 |
| sorry残存 | 0件 | ✅ 確認済み |
| Rust整合性 | 100%一致 | ⬜ 未確認 |
| NIST KAT | 10+ベクターPASS | ⬜ 未実装 |

**これらがPASSしない限り、Phase 2への移行は不可。**

---

## 次のステップ

1. このPlanに基づき `02_spec.md` で詳細仕様を作成
2. `03_impl.md` で実装
3. `04_review.md` でPIRレビュー（PIR-009）

---

**END OF CURRENT PLAN**
