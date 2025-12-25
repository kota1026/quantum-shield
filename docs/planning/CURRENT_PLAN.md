# Current Plan

> **Generated**: 2025-12-26 00:30 JST
> **Phase**: 2 - Security Council + Token
> **Week**: 6 (SEC-003開始)

---

## 🎯 対象タスク

**SEC-003: QuantumShield.sol keccak256移行**

CP-1（完全量子耐性）違反を解消するため、QuantumShield.solで使用されているkeccak256をSHA3_256.hash()に移行する。

---

## 📋 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md`

---

## ✅ 前回完了タスク (Week 5)

| # | タスク | 判定 | 日付 |
|---|--------|------|------|
| 1 | SEC-001 リエントランシー修正 | ✅ COMPLETE | 2025-12-25 |
| 2 | SEC-002 Events/ZeroCheck修正 | ✅ COMPLETE | 2025-12-25 |
| 3 | セキュリティレビュー 04_review.md | ✅ PASS | 2025-12-25 |
| 4 | PIR会議 05_pir.md | ✅ PIR-SEC-001 PASS | 2025-12-26 |
| 5 | Slither検証 | ✅ HIGH 0 / MEDIUM 0 | 2025-12-25 |
| 6 | 全テスト | ✅ 557/557 PASS | 2025-12-25 |

---

## 🔄 今回のスコープ (SEC-003)

### 影響範囲

| ファイル | 関数 | 問題 | 修正方針 |
|---------|------|------|----------|
| QuantumShield.sol | `lock()` | keccak256使用 | SHA3_256.hash() |
| QuantumShield.sol | `_hashPublicInputs()` | keccak256使用 | SHA3_256.hash() |
| QuantumShield.sol | `_verifyStarkProofInternal()` | keccak256使用 | SHA3_256.hash() |

### 実装項目

- [ ] [IMPL-SEC-003-1] SHA3_256ライブラリのインポート追加
- [ ] [IMPL-SEC-003-2] `lock()` keccak256 → SHA3_256.hash()
- [ ] [IMPL-SEC-003-3] `_hashPublicInputs()` keccak256 → SHA3_256.hash()
- [ ] [IMPL-SEC-003-4] `_verifyStarkProofInternal()` keccak256 → SHA3_256.hash()

### テスト項目

- [ ] [TEST-SEC-003-1] 既存QuantumShieldテスト全PASS確認
- [ ] [TEST-SEC-003-2] lock() ハッシュ検証テスト
- [ ] [TEST-SEC-003-3] publicInputs ハッシュ整合性テスト
- [ ] [TEST-SEC-003-4] STARK proof検証のSHA3対応テスト
- [ ] [TEST-REGRESSION] 全557テスト + 新規テストの回帰テスト

### セキュリティレビュー

- [ ] [REVIEW-SEC-003] 04_review.md セキュリティレビュー
- [ ] [PIR-SEC-003] 05_pir.md PIR会議

---

## 📚 参照ドキュメント

| ドキュメント | パス |
|-------------|------|
| Constitution | `docs/constitution/CORE_PRINCIPLES.md` |
| Sequence | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` |
| 仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` |
| Slither Report | `docs/aegis/security/SLITHER_REPORT_2025-12-25.md` |
| ZK-STARK計画 | `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` |
| SHA3_256実装 | `contracts/src/libraries/SHA3_256.sol` |

---

## 📦 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/QuantumShield.sol` | keccak256 → SHA3_256.hash() 移行 |
| `contracts/test/QuantumShieldSHA3Test.t.sol` | SHA3移行テスト（新規） |
| `docs/aegis/pir/PIR-SEC-003_REVIEW.md` | SEC-003レビューレポート |

---

## 🔧 実行順序

### Step 1: 計画策定 (01_plan.md)
- [ ] SEC-003 計画確認
- [ ] 仕様レビュー準備

### Step 2: 仕様レビュー (02_spec.md)
- [ ] QuantumShield.sol 該当箇所の仕様確認
- [ ] SHA3_256.hash() インターフェース確認
- [ ] 入出力フォーマットの互換性確認

### Step 3: 実装 (03_impl.md)
- [ ] SHA3_256ライブラリのインポート
- [ ] 3箇所のkeccak256置換
- [ ] 既存テスト実行・全PASS確認
- [ ] 新規テスト作成・実行

### Step 4: セキュリティレビュー (04_review.md)
- [ ] CP-1 完全量子耐性確認
- [ ] Slither再実行
- [ ] ガス使用量ベンチマーク

### Step 5: PIR会議 (05_pir.md)
- [ ] PIR-SEC-003 実施
- [ ] PASS判定取得

### Step 6: 状態更新 (06_update.md)
- [ ] CURRENT_STATE.md 更新
- [ ] PHASE2_CHECKLIST.md 更新

---

## ⚠️ リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | SHA3_256.hash()のGasコスト増加 | Medium | ベンチマーク実施、許容範囲確認 |
| 2 | 既存テストのハッシュ値依存 | Medium | テストのハッシュ期待値更新 |
| 3 | STARK proof検証への影響 | Medium | 統合テストで検証 |

---

## ✅ Core Principles確認

- [x] CP-1: 完全量子耐性 - **今回の修正で強化**（keccak256排除）
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

---

## ✅ 前提条件

- [x] SEC-001/SEC-002 完了
- [x] PIR-SEC-001 PASS
- [x] 557/557 テスト PASS
- [x] Slither HIGH 0 / MEDIUM 0

---

**次のステップ**: `01_plan.md` を実行してSEC-003の計画策定を開始してください。

---

**END OF CURRENT PLAN**
