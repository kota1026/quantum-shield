# ZK-STARK Implementation Plan - Phase 2

> **Version**: 1.0  
> **Created**: 2025-12-25 23:30 JST  
> **Author**: Engineer + Chief Cryptographer  
> **Status**: DRAFT - Pending CTO Review

---

## 1. Executive Summary

このドキュメントは、Phase 2におけるZK-STARK証明システムの実装計画を定義します。
目標は**Gas消費87.5%削減**を達成しつつ、CP-1（完全量子耐性）を維持することです。

### 1.1 Key Objectives

| # | 目標 | 指標 | 期限 |
|---|------|------|------|
| 1 | Gas削減 | 87.5%以上 | Month 9 |
| 2 | 証明生成時間 | <10秒 | Month 9 |
| 3 | 検証Gas | <500,000 gas | Month 9 |
| 4 | セキュリティ | 128-bit | 常時 |

---

## 2. Current State Analysis

### 2.1 Existing STARK PoC (`contracts/src/FRIVerifier.sol`)

現在のFRIVerifier.solは以下の機能を実装しています：

| 機能 | 状態 | 備考 |
|------|------|------|
| FRI低次テスト | ✅ 実装済み | Level 2実装 |
| Goldilocks Field | ✅ 実装済み | 2^64 - 2^32 + 1 |
| Merkle検証 | ⚠️ 要修正 | keccak256使用中 |
| フィールド演算 | ✅ 実装済み | modExp, modInverse |
| 多項式評価 | ✅ 実装済み | Horner's method |

### 2.2 Critical Issue: keccak256 Usage

⚠️ **CP-1違反リスク**: `FRIVerifier.sol` Line 191付近

```solidity
// CURRENT (違反)
bytes32 leaf = keccak256(abi.encodePacked(eval0, eval1));

// REQUIRED (SHA3-256)
bytes32 leaf = SHA3_256.hash(abi.encodePacked(eval0, eval1));
```

**対応優先度**: 🔴 HIGH - Phase 2 Week 1で修正必須

### 2.3 Gas Baseline (Phase 1 Final)

| 操作 | 現在のGas | 目標Gas | 削減率 |
|------|----------|---------|--------|
| SHA3-256 (32B) | 1,032,000 | - | - |
| SHAKE256 (32B) | 1,046,420 | - | - |
| 署名検証 (SPHINCS+) | ~50-100M (est.) | <6.25M | 87.5% |
| 状態証明検証 | TBD | <500,000 | - |

---

## 3. Architecture Design

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Off-Chain (Prover)                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ Transaction │ -> │ STARK Prover│ -> │ Compressed Proof    │ │
│  │   Data      │    │   (Rust)    │    │   (~100KB)          │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
└────────────────────────────│────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     On-Chain (Verifier)                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ L1Vault.sol │ <- │ STARKVerify │ <- │ Proof Decompression │ │
│  │             │    │   .sol      │    │   & Validation      │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Breakdown

| コンポーネント | 場所 | 責務 |
|--------------|------|------|
| STARKProver | Off-chain (Rust) | 証明生成 |
| STARKVerifier.sol | On-chain | 証明検証 |
| FRIVerifier.sol | On-chain (既存) | FRI低次テスト |
| SHA3Hasher.sol | On-chain (新規) | SHA3-256ラッパー |
| ProofCodec.sol | On-chain (新規) | 証明エンコード/デコード |

### 3.3 Proof Structure

```solidity
struct STARKProof {
    // Commitment Phase
    bytes32 traceCommitment;        // Trace polynomial commitment
    bytes32 constraintCommitment;   // Constraint polynomial commitment
    
    // FRI Phase
    bytes32[] friCommitments;       // FRI layer commitments
    uint256[] friChallenges;        // Verifier challenges
    
    // Query Phase
    uint256[] queryIndices;         // Random query positions
    bytes32[][] merkleProofs;       // Merkle proofs for queries
    uint256[][] evaluations;        // Polynomial evaluations
    
    // Final Phase
    uint256[] finalPolynomial;      // Low-degree polynomial coefficients
}
```

---

## 4. Implementation Phases

### Phase 2.1: Foundation (Week 1-4)

| Week | タスク | 成果物 | 担当 |
|------|--------|--------|------|
| 1 | FRIVerifier SHA3-256移行 | Updated FRIVerifier.sol | Engineer |
| 2 | SHA3Hasher.sol作成 | New contract | Engineer |
| 3 | ProofCodec.sol作成 | New contract | Engineer |
| 4 | 単体テスト | 100% coverage | QA |

### Phase 2.2: Core Implementation (Week 5-8)

| Week | タスク | 成果物 | 担当 |
|------|--------|--------|------|
| 5 | STARKVerifier基本構造 | STARKVerifier.sol v0.1 | Engineer |
| 6 | トレース検証実装 | Trace verification | Engineer |
| 7 | 制約システム実装 | Constraint system | Cryptographer |
| 8 | 統合テスト | Integration tests | QA |

### Phase 2.3: Optimization (Week 9-12)

| Week | タスク | 成果物 | 担当 |
|------|--------|--------|------|
| 9 | Gas最適化 | Optimized contracts | Engineer |
| 10 | ベンチマーク | Gas report | QA |
| 11 | セキュリティレビュー | PIR report | CSO |
| 12 | 外部監査準備 | Audit package | Team |

---

## 5. Gas Optimization Strategy

### 5.1 Optimization Techniques

| 技法 | 期待削減 | 優先度 | 複雑性 |
|------|---------|--------|--------|
| Batch verification | 40-60% | 🔴 HIGH | Medium |
| Proof compression | 20-30% | 🔴 HIGH | High |
| Assembly optimization | 10-20% | 🟡 MEDIUM | High |
| Storage layout optimization | 5-10% | 🟢 LOW | Low |

### 5.2 Target Gas Breakdown

| 操作 | 現在 | 目標 | 戦略 |
|------|------|------|------|
| Merkle検証 | ~50,000 | <10,000 | Batch hashing |
| FRI検証 | ~500,000 | <100,000 | Layer compression |
| フィールド演算 | ~100,000 | <50,000 | Assembly |
| 合計 | ~1,000,000 | <200,000 | - |

### 5.3 Proof Size vs Gas Tradeoff

```
Proof Size (KB)    Gas Cost      Verification Time
     50            ~150,000            0.5s
    100            ~300,000            1.0s
    200            ~500,000            2.0s
    
Target: 100KB proof, <300,000 gas, <1s verification
```

---

## 6. Security Considerations

### 6.1 Cryptographic Requirements (CP-1 Compliance)

| 要件 | 実装 | 検証方法 |
|------|------|----------|
| ハッシュ関数 | SHA3-256 only | 静的解析 |
| フィールド | Goldilocks (2^64-2^32+1) | 形式検証 |
| セキュリティレベル | 128-bit | 暗号学的レビュー |
| 量子耐性 | Post-quantum safe | NIST準拠確認 |

### 6.2 Attack Vectors & Mitigations

| 攻撃ベクトル | リスク | 対策 |
|-------------|--------|------|
| Grinding attack | MEDIUM | Verifier-chosen challenges |
| Merkle collision | LOW | SHA3-256使用 |
| Field overflow | LOW | Modular arithmetic |
| Replay attack | LOW | Nonce inclusion |

### 6.3 Formal Verification Plan

| 対象 | ツール | 期限 |
|------|--------|------|
| フィールド演算 | Lean4 | Month 8 |
| FRI soundness | Lean4 | Month 9 |
| 全体安全性 | Certora | Month 10 |

---

## 7. Dependencies

### 7.1 External Libraries

| ライブラリ | 用途 | ライセンス | リスク |
|-----------|------|-----------|--------|
| None (Pure Solidity) | - | - | - |

### 7.2 Internal Dependencies

| 依存 | バージョン | 必須 |
|------|-----------|------|
| SHA3_256.sol | v1.0 | Yes |
| SHAKE256.sol | v1.0 | Yes |
| SparseMerkleTree.sol | v1.0 | Yes |

---

## 8. Testing Strategy

### 8.1 Test Categories

| カテゴリ | テスト数 | カバレッジ目標 |
|---------|---------|---------------|
| 単体テスト | ~50 | 100% |
| 統合テスト | ~20 | 90% |
| Fuzzテスト | ~10 | - |
| Gasテスト | ~10 | - |

### 8.2 Test Vectors

| ソース | ベクター数 | 用途 |
|--------|-----------|------|
| Custom (generated) | 100+ | 基本検証 |
| StarkWare reference | TBD | 互換性 |
| Edge cases | 50+ | 境界条件 |

---

## 9. Milestones & Deliverables

### 9.1 Month 7 (Current)

- [x] ZK-STARK実装計画策定
- [ ] FRIVerifier SHA3-256移行
- [ ] 基本テストスイート

### 9.2 Month 8

- [ ] STARKVerifier.sol v0.1
- [ ] テストネットデプロイ準備
- [ ] Gas目標50%達成

### 9.3 Month 9

- [ ] STARKVerifier.sol v1.0
- [ ] Gas目標87.5%達成
- [ ] 形式検証完了

---

## 10. Risk Analysis

### 10.1 Technical Risks

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| Gas目標未達成 | MEDIUM | HIGH | 段階的最適化 |
| 実装遅延 | MEDIUM | MEDIUM | Buffer期間確保 |
| セキュリティ脆弱性 | LOW | HIGH | 複数レビュー |

### 10.2 Mitigation Plan

```
IF Gas目標未達成:
  → Layer 2ソリューション検討
  → Proof aggregation実装

IF 実装遅延:
  → スコープ調整（Phase 3へ一部移行）
  → リソース追加

IF セキュリティ脆弱性発見:
  → 即座に開発停止
  → PIR緊急招集
```

---

## 11. Next Steps

### Immediate Actions (Week 1)

1. [ ] このドキュメントのCTOレビュー
2. [ ] FRIVerifier.sol keccak256→SHA3-256移行
3. [ ] Compiler Warnings対応
4. [ ] Gasベースライン取得

### Approval Required

| 承認者 | 項目 | 状態 |
|--------|------|------|
| CTO | 全体計画 | ⬜ Pending |
| Cryptographer | 暗号学的正確性 | ⬜ Pending |
| CSO | セキュリティ方針 | ⬜ Pending |

---

## 12. References

| ドキュメント | パス |
|-------------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| Gas Benchmark | `docs/planning/archive/GAS_BENCHMARK_2025-12-26.md` |
| FRIVerifier | `contracts/src/FRIVerifier.sol` |
| SHA3_256 | `contracts/src/libraries/SHA3_256.sol` |

---

**END OF ZK-STARK IMPLEMENTATION PLAN**
