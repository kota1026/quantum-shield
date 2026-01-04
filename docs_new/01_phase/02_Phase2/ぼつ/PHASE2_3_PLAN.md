# Phase 2.3 Gas Optimization Plan

> **Version**: 1.0  
> **Created**: 2025-12-27 02:00 JST  
> **Author**: Engineer + CTO  
> **Status**: APPROVED

---

## 1. Executive Summary

このドキュメントは、Phase 2.3におけるGas最適化計画を定義します。
目標は**署名検証で87.5%以上のGas削減**を達成し、ZK-STARK証明システムの本番運用に向けた基盤を完成させることです。

### 1.1 Key Objectives

| # | 目標 | 現在値 | 目標値 | 期限 |
|---|------|--------|--------|------|
| 1 | 署名検証Gas削減 | ~50-100M gas | <6.25M gas | Week 12 |
| 2 | STARK証明検証 | N/A | <500,000 gas | Week 12 |
| 3 | Batch Verification | N/A | 実装完了 | Week 10 |
| 4 | Proof Compression | N/A | 50%以上圧縮 | Week 11 |

---

## 2. Current State

### 2.1 Gas Baseline (Phase 2.2 End)

参照: `docs/planning/GAS_BASELINE_P2.md`

| 操作 | 現在Gas | 備考 |
|------|---------|------|
| SHA3-256 (32B) | 1,032,000 | CP-1準拠（変更不可） |
| SHAKE256 (32B) | 1,046,420 | CP-1準拠（変更不可） |
| computePublicKeyHash | 1,036,378 | SPHINCS+ |
| L1Vault.deposit() | TBD | 測定必要 |
| L1Vault.withdrawal() | TBD | 測定必要 |

### 2.2 Completed Components (Phase 2.1-2.2)

| コンポーネント | 状態 | テスト |
|--------------|------|--------|
| FRIVerifier.sol (SHA3-256) | ✅ 完了 | 32/32 PASS |
| SHA3Hasher.sol | ✅ 完了 | 24/24 PASS |
| ProofCodec.sol | ✅ 完了 | 18/18 PASS |
| AIRConstraints.sol | ✅ 完了 | 23/23 PASS |
| ConstraintEvaluator.sol | ✅ 完了 | 15/15 PASS |
| STARKVerifier.sol v0.1 | ✅ 完了 | 36/36 PASS |

---

## 3. Optimization Strategy

### 3.1 Three-Pillar Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                    Gas Optimization Strategy                     │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Batch Verify   │  Proof Compress │  Assembly Optimization      │
│  (40-60% ↓)     │  (20-30% ↓)     │  (10-20% ↓)                │
├─────────────────┼─────────────────┼─────────────────────────────┤
│  Week 9-10      │  Week 10-11     │  Week 11-12                 │
│  🔴 HIGH        │  🔴 HIGH        │  🟡 MEDIUM                  │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 3.2 Batch Verification

**目標**: 複数の証明を一括検証し、Merkleハッシュ計算を共有化

```solidity
// Before: 個別検証
for (uint i = 0; i < proofs.length; i++) {
    verifyProof(proofs[i]); // 各回 ~500,000 gas
}

// After: バッチ検証
verifyBatchProofs(proofs); // 合計で ~500,000 + n*50,000 gas
```

**実装計画**:

| タスク | 担当 | 期限 | 成果物 |
|--------|------|------|--------|
| BatchVerifier.sol設計 | Engineer | Week 9 | 設計ドキュメント |
| BatchVerifier.sol実装 | Engineer | Week 9 | Contract |
| 単体テスト | QA | Week 10 | 20+ tests |
| Gas計測 | QA | Week 10 | Benchmark |

### 3.3 Proof Compression

**目標**: 証明サイズを50%以上圧縮し、calldata費用を削減

**技法**:

| 技法 | 圧縮率 | 複雑性 |
|------|--------|--------|
| Merkle Path共有 | 20-30% | Low |
| Evaluation圧縮 | 10-15% | Medium |
| Challenge再計算 | 15-20% | Low |

**実装計画**:

| タスク | 担当 | 期限 | 成果物 |
|--------|------|------|--------|
| ProofCompressor.sol設計 | Cryptographer | Week 10 | 設計ドキュメント |
| ProofCompressor.sol実装 | Engineer | Week 10 | Contract |
| 圧縮テスト | QA | Week 11 | Compression tests |
| 統合テスト | QA | Week 11 | Integration tests |

### 3.4 Assembly Optimization

**目標**: フィールド演算をインラインアセンブリで最適化

**対象関数**:

| 関数 | 現在 | 目標 | 戦略 |
|------|------|------|------|
| modExp | ~5,000 gas | <2,000 gas | Precompile利用 |
| modInverse | ~10,000 gas | <5,000 gas | Extended Euclidean |
| batchMulMod | ~50,000 gas | <20,000 gas | SIMD-like |

---

## 4. Week-by-Week Schedule

### Week 9: Batch Verification Foundation

| Day | タスク | 成果物 |
|-----|--------|--------|
| 1-2 | BatchVerifier設計 | DESIGN.md |
| 3-4 | 基本実装 | BatchVerifier.sol v0.1 |
| 5-6 | Merkle共有実装 | SharedMerkle.sol |
| 7 | テスト作成 | test/BatchVerifier.t.sol |

**Week 9 成功基準**:
- [ ] BatchVerifier.sol基本動作
- [ ] 10件以上のバッチで40%以上Gas削減確認
- [ ] テスト15件以上PASS

### Week 10: Proof Compression

| Day | タスク | 成果物 |
|-----|--------|--------|
| 1-2 | 圧縮アルゴリズム設計 | COMPRESSION.md |
| 3-4 | ProofCompressor実装 | ProofCompressor.sol |
| 5-6 | Decoder実装 | ProofDecoder.sol |
| 7 | 統合テスト | Integration tests |

**Week 10 成功基準**:
- [ ] 証明サイズ50%以上圧縮
- [ ] 解凍Gas < 100,000
- [ ] テスト20件以上PASS

### Week 11: Assembly Optimization & Integration

| Day | タスク | 成果物 |
|-----|--------|--------|
| 1-3 | フィールド演算最適化 | OptimizedField.sol |
| 4-5 | 全コンポーネント統合 | STARKVerifier v1.0 |
| 6-7 | E2Eテスト | Full integration tests |

**Week 11 成功基準**:
- [ ] 全体Gas 87.5%削減達成
- [ ] E2Eテスト PASS
- [ ] Slither HIGH 0 / MEDIUM 0 維持

### Week 12: Security Review & Documentation

| Day | タスク | 成果物 |
|-----|--------|--------|
| 1-2 | 内部セキュリティレビュー | Security Report |
| 3-4 | ドキュメント整備 | API Docs |
| 5-6 | 外部監査準備 | Audit Package |
| 7 | PIR-P2-008 準備 | PIR Report |

**Week 12 成功基準**:
- [ ] セキュリティレビュー PASS
- [ ] 完全なドキュメント
- [ ] PIR-P2-008 PASS判定

---

## 5. Gas Target Breakdown

### 5.1 Current vs Target

| コンポーネント | 現在 (est.) | 目標 | 削減率 |
|--------------|-------------|------|--------|
| SPHINCS+署名検証 | ~50-100M | <6.25M | **87.5%** |
| STARK証明検証 | ~1,000,000 | <500,000 | 50% |
| Merkle検証 | ~50,000 | <10,000 | 80% |
| フィールド演算 | ~100,000 | <50,000 | 50% |
| **合計** | **~100M** | **<7M** | **93%** |

### 5.2 Milestone Checkpoints

```
Week 8 (現在):  ████████████████████████████████ 100%
Week 9 目標:    ████████████████████░░░░░░░░░░░░  62.5% (-37.5%)
Week 10 目標:   ████████████░░░░░░░░░░░░░░░░░░░░  37.5% (-25%)
Week 11 目標:   ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  12.5% (-25%) ✓ TARGET
Week 12 目標:   ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  12.5% (維持 + 安定化)
```

---

## 6. Risk Assessment

### 6.1 Technical Risks

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| 87.5%目標未達成 | MEDIUM | HIGH | Layer 2フォールバック |
| 圧縮によるセキュリティ低下 | LOW | HIGH | 暗号学的レビュー |
| Assembly バグ | MEDIUM | HIGH | Formal verification |
| 統合時の互換性問題 | MEDIUM | MEDIUM | 段階的統合 |

### 6.2 Contingency Plans

```
IF Week 10終了時点で50%削減未達成:
  → Week 11-12でLayer 2オプション検討
  → Proof aggregation優先実装

IF セキュリティ脆弱性発見:
  → 即座に開発停止
  → PIR緊急招集
  → 根本原因分析

IF 統合テスト失敗:
  → コンポーネント分離テスト実施
  → インターフェース見直し
```

---

## 7. Testing Strategy

### 7.1 Test Categories

| カテゴリ | テスト数 | カバレッジ目標 |
|---------|---------|---------------|
| 単体テスト | +40 | 100% |
| 統合テスト | +15 | 90% |
| Gasテスト | +10 | - |
| Fuzzテスト | +5 | - |
| セキュリティテスト | +10 | - |

### 7.2 Gas Benchmark Tests

```solidity
// test/GasOptimizationTest.t.sol
contract GasOptimizationTest is Test {
    function test_Gas_BatchVerify_10Proofs() public {
        // Target: 40% reduction vs individual
    }
    
    function test_Gas_CompressedProof() public {
        // Target: 50% size reduction
    }
    
    function test_Gas_FullSTARKVerification() public {
        // Target: <500,000 gas
    }
}
```

---

## 8. Deliverables

### 8.1 New Contracts

| ファイル | 説明 | 期限 |
|---------|------|------|
| `src/BatchVerifier.sol` | バッチ証明検証 | Week 10 |
| `src/ProofCompressor.sol` | 証明圧縮 | Week 11 |
| `src/ProofDecoder.sol` | 証明解凍 | Week 11 |
| `src/OptimizedField.sol` | 最適化フィールド演算 | Week 11 |

### 8.2 Updated Contracts

| ファイル | 変更内容 | 期限 |
|---------|----------|------|
| `src/STARKVerifier.sol` | v1.0アップグレード | Week 11 |
| `src/FRIVerifier.sol` | バッチ対応 | Week 10 |

### 8.3 Documentation

| ドキュメント | 説明 | 期限 |
|-------------|------|------|
| `GAS_OPTIMIZATION_REPORT.md` | 最終Gasレポート | Week 12 |
| `BATCH_VERIFICATION_SPEC.md` | バッチ検証仕様 | Week 9 |
| `PROOF_COMPRESSION_SPEC.md` | 圧縮仕様 | Week 10 |
| `AUDIT_PACKAGE.md` | 監査パッケージ | Week 12 |

---

## 9. Success Criteria

### 9.1 Must Have (P0)

- [ ] 署名検証Gas 87.5%削減（<6.25M gas）
- [ ] STARK証明検証 <500,000 gas
- [ ] 全テスト PASS (600+ tests)
- [ ] Slither HIGH 0 / MEDIUM 0
- [ ] CP-1完全準拠維持

### 9.2 Should Have (P1)

- [ ] 証明サイズ 50%以上圧縮
- [ ] バッチ検証 40%以上削減
- [ ] 形式検証完了

### 9.3 Nice to Have (P2)

- [ ] Layer 2最適化検証
- [ ] Proof aggregation PoC

---

## 10. References

| ドキュメント | パス |
|-------------|------|
| Gas Baseline | `docs/planning/GAS_BASELINE_P2.md` |
| ZK-STARK計画 | `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` |
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |
| STARKVerifier | `contracts/src/STARKVerifier.sol` |

---

## 11. Approvals

| 承認者 | 項目 | 状態 | 日付 |
|--------|------|------|------|
| CTO | 全体計画 | ✅ Approved | 2025-12-27 |
| Cryptographer | 暗号学的正確性 | ✅ Approved | 2025-12-27 |
| CSO | セキュリティ方針 | ✅ Approved | 2025-12-27 |
| CFO | コスト見積もり | ✅ Approved | 2025-12-27 |

---

**Phase 2.3 Gas Optimization: APPROVED ✅**

**開始日**: Week 9 (2025-12-30 予定)

---

**END OF PHASE 2.3 PLAN**
