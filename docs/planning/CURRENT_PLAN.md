# Current Plan

> **Generated**: 2025-12-25 23:30 JST
> **Phase**: 2 - Security Council + Token
> **Week**: 5 (→ Week 6 準備)

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md`

## 前回レビュー課題

> CURRENT_STATE.md より自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | ✅ Resolved | ~~L1Vault リエントランシー (SL-001〜004)~~ | SEC-001で修正完了 |
| 2 | ✅ Resolved | ~~Missing Events/Zero-Check (SL-006〜015)~~ | SEC-002で修正完了 |
| 3 | 🟠 High | **QuantumShield.sol keccak256使用 (ISSUE-001)** | 今回のスコープ (SEC-003) |

## 今回のスコープ

### 即時アクション（PIR会議）

- [ ] [PIR-SEC-001] SEC-001/SEC-002 セキュリティレビュー最終確認
- [ ] [PIR-SEC-001] Slither結果レビュー（HIGH 0, MEDIUM 0達成確認）
- [ ] [PIR-SEC-001] テスト結果確認（557/557 PASS）
- [ ] [PIR-SEC-001] 次フェーズ（SEC-003）計画承認

### 修正項目（レビュー課題より）

- [ ] [FIX-SEC-003-1] QuantumShield.sol `lock()` - keccak256 → SHA3_256.hash()
- [ ] [FIX-SEC-003-2] QuantumShield.sol `_hashPublicInputs()` - keccak256 → SHA3_256.hash()
- [ ] [FIX-SEC-003-3] QuantumShield.sol `_verifyStarkProofInternal()` - keccak256 → SHA3_256.hash()

### 実装項目

- [ ] [IMPL-SEC-003] SHA3_256ライブラリを使用した3箇所の移行実装
- [ ] [IMPL-SEC-003-MIGRATE] 既存SHA3_256.solインポートと統合

### テスト項目

- [ ] [TEST-SEC-003-1] QuantumShield SHA3移行後の既存テスト全PASS確認
- [ ] [TEST-SEC-003-2] lock() ハッシュ互換性テスト
- [ ] [TEST-SEC-003-3] publicInputs ハッシュ整合性テスト
- [ ] [TEST-SEC-003-4] STARK proof検証のSHA3対応テスト
- [ ] [TEST-REGRESSION] 全557テストの回帰テスト

### 参照ドキュメント

- Constitution: `docs/constitution/CORE_PRINCIPLES.md`
- Sequence: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md`
- 仕様: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md`
- Slither Report: `docs/aegis/security/SLITHER_REPORT_2025-12-25.md`
- ZK-STARK計画: `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md`

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/QuantumShield.sol` | keccak256 → SHA3_256.hash() 移行 |
| `contracts/test/QuantumShieldSHA3Test.t.sol` | SHA3移行テスト（新規） |
| `docs/aegis/pir/PIR-SEC-003_REVIEW.md` | SEC-003レビューレポート |

## 実行順序

### Phase A: PIR会議完了（即時）

1. 05_pir.md 実行 - SEC-001/SEC-002 最終確認
2. PIR会議でSEC-003計画承認取得
3. 06_state.md でCURRENT_STATE更新

### Phase B: SEC-003実装（Week 6）

1. QuantumShield.sol の該当3箇所を特定
2. SHA3_256.sol のインポート追加
3. 各関数でkeccak256 → SHA3_256.hash() に置換
4. 既存テスト全実行（557テスト回帰確認）
5. 新規SHA3移行テスト作成・実行
6. Slither再実行・HIGH/MEDIUM 0件確認
7. 04_review.md によるセキュリティレビュー
8. 05_pir.md PIR-SEC-003会議

## Core Principles確認

- [x] CP-1: 完全量子耐性 - **今回の修正で強化**（keccak256排除）
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | SHA3_256.hash()のGasコスト増加 | Medium | ベンチマーク実施、許容範囲確認 |
| 2 | 既存テストのハッシュ値依存 | Medium | テストのハッシュ期待値更新 |
| 3 | STARK proof検証への影響 | Medium | 統合テストで検証 |

## 前提条件

- [x] SEC-001/SEC-002 完了
- [x] 557/557 テスト PASS
- [x] Slither HIGH 0 / MEDIUM 0
- [ ] PIR会議承認（Phase A で取得）

---

**次のステップ**: `05_pir.md` を実行してPIR会議を完了させてください。

---

**END OF CURRENT PLAN**
