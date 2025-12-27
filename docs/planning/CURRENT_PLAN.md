# Current Plan

> **Generated**: 2025-12-28 22:30 JST
> **Phase**: 2 - Security Council + Token
> **Week**: 11

## 対象チェックリスト
`docs/planning/PHASE2_CHECKLIST.md` / `docs/planning/PHASE2_3_PLAN.md`

## 前回レビュー課題

> PIR-P2-010 ✅ PASS - 課題なし

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし | - |

---

## 今回のスコープ

### Week 11 概要: STARKVerifier v1.0 統合 & E2Eテスト

Week 10で OptimizedField.sol が完了（Gas目標を大幅達成）したため、Week 11では以下に集中：

1. **STARKVerifier v1.0 アップグレード** - 全最適化コンポーネントの統合
2. **E2Eテスト** - 完全なSTARK証明検証フローのテスト
3. **追加Assembly最適化** - 残存ホットスポットの最適化
4. **Etherscan検証** - デプロイ済みコントラクトの検証

---

### 実装項目

- [ ] [IMPL-015] STARKVerifier v1.0 統合アップグレード
  - OptimizedField統合
  - ProofCompressor/Decoder統合
  - BatchVerifier連携強化
  
- [ ] [IMPL-016] Assembly最適化（追加）
  - FRIVerifier評価ループ最適化
  - AIRConstraints演算最適化
  - SHA3Hasherバッチ最適化（可能な範囲）

- [ ] [IMPL-017] STARKVerifier.verify() 統合実装
  - 完全なverify()関数の実装
  - 全サブコンポーネント呼び出し統合

### テスト項目

- [ ] [TEST-029] E2E STARKVerifierTest
  - 完全な証明検証フロー（20+テスト）
  - Lock → Proof生成 → Verify → Release
  
- [ ] [TEST-030] Gas Regression Tests
  - Gas目標維持の確認
  - 統合後のオーバーヘッド計測
  
- [ ] [TEST-031] Integration Stress Tests
  - 大量証明バッチ（100件）
  - Edge cases（空証明、不正証明）

### インフラ項目

- [ ] [INFRA-004] Etherscan コントラクト検証
  - 7 Sepolia contracts verified
  - ソースコード公開確認

### ドキュメント項目

- [ ] [DOC-003] STARKVerifier v1.0 API仕様書
- [ ] [DOC-004] Gas Optimization Final Report

---

### 参照ドキュメント

| タイプ | パス |
|--------|------|
| 仕様 | `docs/planning/PHASE2_3_PLAN.md` |
| Proof Compression | `docs/planning/PROOF_COMPRESSION_SPEC.md` |
| Batch Verification | `docs/planning/BATCH_VERIFICATION_SPEC.md` |
| Sequence | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` |
| Gas Baseline | `docs/deployments/GAS_BASELINE_SEPOLIA.md` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `src/STARKVerifier.sol` | v1.0 統合アップグレード |
| `src/lib/OptimizedFRI.sol` | FRI Assembly最適化（新規） |
| `test/STARKVerifierE2E.t.sol` | E2Eテストスイート |
| `test/GasRegressionTest.t.sol` | Gas回帰テスト |
| `docs/planning/GAS_OPTIMIZATION_REPORT.md` | 最終Gasレポート |

---

## 実行順序

### Day 1-2: 統合設計 & 準備

1. 現在のSTARKVerifier.solコード分析
2. OptimizedField統合ポイント特定
3. ProofCompressor/Decoder統合設計
4. 統合テスト戦略策定

### Day 3-4: STARKVerifier v1.0 実装

5. OptimizedField統合実装
6. verify()関数完全実装
7. 内部コンポーネント連携
8. 単体テスト作成・実行

### Day 5-6: E2Eテスト & Assembly最適化

9. E2Eテストスイート作成
10. Lock→Verify→Releaseフロー検証
11. FRIVerifier Assembly最適化
12. Gas回帰テスト実行

### Day 7: 検証 & ドキュメント

13. Etherscanコントラクト検証
14. Gas Optimization Report作成
15. API仕様書作成
16. PIR-P2-011準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（keccak256/SHA-256使用禁止維持）
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

---

## 成功基準

### Must Have (P0)

- [ ] STARKVerifier v1.0 統合完了
- [ ] E2Eテスト 20件以上 PASS
- [ ] Gas目標維持（87.5%削減継続）
- [ ] 全テスト PASS（753+ tests）
- [ ] Slither HIGH 0 / MEDIUM 0 維持

### Should Have (P1)

- [ ] Etherscan検証 7/7 contracts
- [ ] 追加Assembly最適化 10%以上削減
- [ ] 完全なAPI仕様書

### Nice to Have (P2)

- [ ] Proof aggregation PoC
- [ ] L2最適化調査

---

## Gas目標確認

| コンポーネント | Week 10達成値 | Week 11目標 |
|--------------|---------------|-------------|
| modExp | 787 gas ✅ | 維持 |
| modInverse | 1,969 gas ✅ | 維持 |
| batchMulMod | 1,487 gas/10要素 ✅ | 維持 |
| STARK証明検証 | ~1,000,000 gas | <500,000 gas |
| 署名検証全体 | 71%削減達成 ✅ | 87.5%目標継続 |

---

## リスク・懸念事項

| # | リスク | 確率 | 影響 | 対策 |
|---|--------|------|------|------|
| 1 | 統合時のGas増加 | MEDIUM | MEDIUM | 統合前後でベンチマーク比較 |
| 2 | E2Eテスト複雑性 | MEDIUM | LOW | 段階的テスト追加 |
| 3 | Etherscan検証失敗 | LOW | LOW | 手動検証フォールバック |
| 4 | Assembly最適化バグ | MEDIUM | HIGH | 詳細な単体テスト |

---

## 依存関係

| 依存 | 状態 | 備考 |
|------|------|------|
| OptimizedField.sol | ✅ 完了 | PIR-P2-010 PASS |
| ProofCompressor.sol | ✅ 完了 | Week 10 |
| ProofDecoder.sol | ✅ 完了 | Week 10 |
| BatchVerifier.sol | ✅ 完了 | Week 9 |
| Sepoliaデプロイ | ✅ 完了 | 7 contracts |

---

**Plan Created by**: Engineer  
**Reviewed by**: CTO  
**Date**: 2025-12-28

---

**次のステップ**: 02_spec.md 実行 → IMPL-015 仕様レビュー

---

**END OF CURRENT PLAN**
