# Current Plan

> **Generated**: 2025-12-25 22:30 JST
> **Phase**: 1 - Foundation Bootstrap
> **Day**: 14 (14日間修正計画 最終日)

---

## 対象チェックリスト

`docs/planning/checklists/phase1_day11-14_qa.md` - Day 14セクション

---

## 前回レビュー課題

> PIR-010 SPHINCS+-SHAKE移行 → ✅ PASS (2025-12-25)

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 High | SPHINCS+形式検証未実施 | Day 14で実施 |
| 2 | 🔴 High | SPHINCS+-SHAKE NIST KATテスト未実施 | Day 14で実施 |
| 3 | 🟡 Medium | SHAKE256 Gas最適化ベンチマーク | ベンチマーク実施 |

---

## 今回のスコープ

### 修正項目（レビュー課題より）

なし（PIR-010 PASS済み）

### 実装項目

- [ ] [IMPL-014-01] SPHINCS+ Lean4形式検証 (`proofs/lean4/SPHINCS.lean`)
  - WOTS+チェーン計算の正当性証明
  - FORSツリールート計算の正当性証明
  - Merkleツリー認証パス検証の正当性証明

- [ ] [IMPL-014-02] NIST KATテスト追加 (`contracts/test/SPHINCSVerifierKAT.t.sol`)
  - SPHINCS+-SHAKE-128s公式テストベクター取得
  - 10+ベクターのPASS確認

- [ ] [IMPL-014-03] Gas最適化ベンチマーク
  - SHAKE256実装のガス消費測定
  - SPHINCSVerifier検証のガス消費測定

### テスト項目

- [ ] [TEST-014-01] Lean4形式検証 - sorry 0件確認
- [ ] [TEST-014-02] NIST KATテスト - 10+ベクターPASS
- [ ] [TEST-014-03] 既存テスト全PASS確認 (42/42)

### 参照ドキュメント

- PIR-010: `docs/aegis/pir/PIR-010_SPHINCS_SHAKE.md`
- PIR-009: `docs/aegis/pir/PIR-009_FORMAL_VERIFICATION.md` (Dilithium形式検証の参考)
- SPHINCS+仕様: https://sphincs.org/data/sphincs+-r3.1-specification.pdf
- NIST KATベクター: NIST PQC submission files

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `proofs/lean4/SPHINCS.lean` | SPHINCS+ Lean4形式検証 |
| `contracts/test/SPHINCSVerifierKAT.t.sol` | NIST KATテスト |
| `docs/aegis/pir/PIR-011_FINAL_VERIFICATION.md` | 最終検証レポート |
| `docs/planning/archive/GAS_BENCHMARK_2025-12-26.md` | Gasベンチマーク結果 |

---

## 実行順序

### Step 1: 環境確認 (10分)

```bash
cd proofs/lean4
lake build  # Lean4環境確認
cd ../../contracts
forge test --match-path test/SPHINCS*.sol  # 既存テスト確認
```

### Step 2: SPHINCS+ Lean4形式検証 (2-3時間)

1. `proofs/lean4/SPHINCS.lean` 新規作成
2. WOTS+チェーン計算の数学的定義
3. FORSツリールート計算の正当性定理
4. Merkleツリー認証パス検証の正当性定理
5. `lake build` で sorry 0件確認

### Step 3: NIST KATテスト実装 (1時間)

1. SPHINCS+-SHAKE-128s公式KATベクター取得
2. `contracts/test/SPHINCSVerifierKAT.t.sol` 作成
3. 10+ベクターのテスト実装
4. `forge test --match-contract SPHINCSVerifierKAT` 実行

### Step 4: Gasベンチマーク (30分)

1. SHAKE256ガス消費測定
2. SPHINCSVerifier.verify()ガス消費測定
3. 結果をドキュメント化

### Step 5: Go/No-Go判定準備 (30分)

1. Phase 1終了条件の最終確認
2. PIR-011レポート作成
3. CURRENT_STATE.md更新

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし (SHAKE256/SHA3-256のみ使用)
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

---

## リスク・懸念事項

| # | 懸念 | 重要度 | 対策 |
|---|------|--------|------|
| 1 | Lean4 SPHINCS+証明の複雑性 | 🟡 Medium | Dilithium (NTT.lean) を参考に実装 |
| 2 | NIST KATベクター取得 | 🟢 Low | 公式submission filesから取得可能 |
| 3 | SHAKE256 Gas消費が高い可能性 | 🟡 Medium | Phase 2でprecompile検討 |

---

## Go/No-Go判定基準

Day 14完了時に以下をすべて満たすこと：

| 条件 | 基準 | 現状 |
|------|------|------|
| Dilithium Lean4形式検証 | sorry 0件 | ✅ 確認済み |
| **SPHINCS+ Lean4形式検証** | **sorry 0件** | 🔄 **Day 14対応** |
| Dilithium NIST KAT | 10+ベクターPASS | ✅ 100ベクターPASS |
| **SPHINCS+-SHAKE NIST KAT** | **10+ベクターPASS** | 🔄 **Day 14対応** |
| SHA3/keccak256排除 | 0件 | ✅ 完了 |
| 全テスト | 100% PASS | ✅ 42/42 PASS |
| Slither静的解析 | PASS | ✅ 確認済み |

---

## 次のステップ

Plan完了後、以下の順序で実行：

1. **02_spec.md** → 仕様詳細確認（必要に応じて）
2. **03_impl.md** → 実装実行
3. **04_review.md** → PIR-011レビュー

---

**END OF CURRENT PLAN**
