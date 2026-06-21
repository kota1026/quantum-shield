# Proof Compression Specification

> **Version**: 1.0  
> **Created**: 2025-12-27  
> **Author**: Engineer + Cryptographer  
> **Status**: APPROVED

---

## 1. Executive Summary

このドキュメントは、Quantum Shield ZK-STARKシステムにおける証明圧縮の仕様を定義します。
目標は**証明サイズ50%以上の圧縮**を達成し、calldata費用を大幅に削減することです。

### 1.1 Key Objectives

| 目標 | 現状 | ターゲット | 達成方法 |
|------|------|-----------|----------|
| 証明サイズ圧縮 | 0% | ≥50% | RLE + Delta Encoding |
| 解凍Gas | N/A | <100,000 gas | Efficient decoding |
| 互換性 | - | 維持 | Version header |

---

## 2. Compression Techniques

### 2.1 Run-Length Encoding (RLE) for Merkle Paths

Merkle proofのsiblingノードには、ゼロ値やリピートパターンが含まれることがある。
RLEを使用してこれらを効率的にエンコードする。

**Format:**

```
[type: 1 byte][payload: variable]

Type 0: Raw value (32 bytes follow)
Type 1: Zero run (1 byte count follows)
Type 2: Repeated value (1 byte count + 32 bytes value follows)
```

**Example:**

```
Original: [0x00, 0x00, 0x00, 0xAB, 0xAB, 0xAB, 0xCD]
Compressed: [1, 3][2, 3, 0xAB][0, 0xCD]
              ^      ^          ^
              |      |          Raw value
              |      3x repeated 0xAB
              3x zero
```

**Expected Compression:**
- All-zero paths: ~95% reduction
- Mixed paths: 20-30% reduction
- Random data: No compression (may expand slightly)

### 2.2 Delta Encoding for Evaluations

フィールド評価値は連続性を持つことが多い。
Delta encoding を使用して差分のみを保存する。

**Format:**

```
[first value: 32 bytes]
For each subsequent value:
  [type: 1 byte][delta: variable]

Type 0: Full value (32 bytes follow)
Type 1: Small delta (-32768 to 32767, 2 bytes)
Type 2: Medium delta (-2^31 to 2^31-1, 4 bytes)
```

**Example:**

```
Original: [1000, 1100, 1150, 5000000]
Compressed: [1000][1, +100][1, +50][0, 5000000]
```

**Expected Compression:**
- Sequential values: 50-70% reduction
- Random values: No compression

### 2.3 STARK Proof Header Format

完全なSTARK証明の圧縮フォーマット：

```
Offset  Size    Field
0       4       Version (uint32)
4       4       Flags (uint32)
8       4       FRI Commitments Count (uint32)
12      4       Trace Evaluations Count (uint32)
16      4       Constraint Evaluations Count (uint32)
20      4       Reserved (uint32)
24      32      Trace Commitment
56      32      Constraint Commitment
88      var     FRI Commitments (compressed)
var     var     Trace Evaluations (delta encoded)
var     var     Constraint Evaluations (delta encoded)
```

---

## 3. Implementation Details

### 3.1 ProofCompressor.sol

```solidity
contract ProofCompressor {
    uint32 public constant VERSION = 1;
    
    // Compression flags
    uint32 constant FLAG_RLE_ENABLED = 1 << 0;
    uint32 constant FLAG_DELTA_ENABLED = 1 << 1;
    uint32 constant FLAG_COMMITMENTS_INCLUDED = 1 << 2;
    
    function compressMerklePath(bytes32[] calldata siblings) 
        external pure returns (bytes memory);
    
    function compressEvaluations(uint256[] calldata evaluations) 
        external pure returns (bytes memory);
    
    function compressSTARKProof(UncompressedProof calldata proof) 
        external pure returns (bytes memory);
}
```

### 3.2 ProofDecoder.sol

```solidity
contract ProofDecoder {
    uint32 public constant EXPECTED_VERSION = 1;
    
    function decompressMerklePath(bytes calldata compressed) 
        external pure returns (bytes32[] memory);
    
    function decompressEvaluations(bytes calldata compressed) 
        external pure returns (uint256[] memory);
    
    function decompressSTARKProof(bytes calldata compressed) 
        external pure returns (UncompressedProof memory);
}
```

---

## 4. Gas Analysis

### 4.1 Compression Gas (off-chain recommended)

| Operation | Estimated Gas |
|-----------|--------------|
| compressMerklePath (8 siblings) | ~15,000 |
| compressEvaluations (16 values) | ~20,000 |
| compressSTARKProof (full) | ~50,000 |

**Note:** 圧縮はオフチェーンで行うことを推奨。

### 4.2 Decompression Gas (on-chain)

| Operation | Target Gas | Notes |
|-----------|-----------|-------|
| decompressMerklePath | <30,000 | RLE decoding |
| decompressEvaluations | <50,000 | Delta decoding |
| decompressSTARKProof | <100,000 | **Primary target** |

### 4.3 Calldata Savings

| Scenario | Original (bytes) | Compressed | Savings |
|----------|-----------------|------------|---------|
| Merkle path (32 siblings) | 1024 | ~512 | 50% |
| Evaluations (64 values) | 2048 | ~1024 | 50% |
| Full STARK proof | ~5000 | ~2500 | 50% |

**Calldata cost:** 16 gas/non-zero byte, 4 gas/zero byte

---

## 5. Security Considerations

### 5.1 CP-1 Compliance

- ✅ 圧縮/解凍にハッシュ関数は使用しない
- ✅ データ変換のみ、暗号学的操作なし
- ✅ keccak256 不使用（SHA3-256のみ使用する箇所がある場合）

### 5.2 DoS Protection

```solidity
uint256 public constant MAX_DECOMPRESSED_SIZE = 100000; // 100KB limit
```

- 解凍後のサイズ上限を設定
- 無限ループ防止のための適切な境界チェック

### 5.3 Version Compatibility

```solidity
error InvalidVersion(uint32 found, uint32 expected);

if (version != EXPECTED_VERSION) {
    revert InvalidVersion(version, EXPECTED_VERSION);
}
```

---

## 6. Test Plan

### 6.1 Unit Tests [TEST-025, TEST-026]

| Test Category | Test Count | Coverage |
|--------------|------------|----------|
| ProofCompressor | 20+ | 100% |
| ProofDecoder | 10+ | 100% |
| Roundtrip | 10+ | All paths |

### 6.2 Benchmark Tests [TEST-027, TEST-028]

```solidity
function test_CompressionRatio_MerklePath() public {
    // Target: >20% compression for typical paths
}

function test_Gas_DecompressSTARKProof() public {
    // Target: <100,000 gas
}
```

### 6.3 Edge Cases

- 空配列
- 最大深度（32）
- 全ゼロ入力
- ランダムデータ（圧縮されないケース）

---

## 7. Integration Guide

### 7.1 Usage Flow

```
1. [Off-chain] Generate STARK proof
2. [Off-chain] Call compressSTARKProof()
3. [On-chain TX] Send compressed proof as calldata
4. [On-chain] Call decompressSTARKProof()
5. [On-chain] Verify decompressed proof
```

### 7.2 Code Example

```solidity
// Off-chain compression
bytes memory compressed = compressor.compressSTARKProof(proof);

// On-chain verification
ProofCompressor.UncompressedProof memory decompressed = 
    decoder.decompressSTARKProof(compressed);

bool valid = starkVerifier.verify(decompressed);
```

---

## 8. Future Improvements

### 8.1 Phase 2.3c (Proposed)

- Challenge再計算による追加圧縮（15-20%）
- Dictionary-based compression for FRI layers
- Proof aggregation across multiple proofs

### 8.2 Long-term

- SNARK-friendly compression
- Recursive proof compression
- Layer 2 specific optimizations

---

## 9. References

| Document | Path |
|----------|------|
| Phase 2.3 Plan | `docs/planning/PHASE2_3_PLAN.md` |
| Batch Verification Spec | `docs/planning/BATCH_VERIFICATION_SPEC.md` |
| Gas Baseline | `docs/deployments/GAS_BASELINE_SEPOLIA.md` |

---

## 10. Approvals

| Approver | Item | Status | Date |
|----------|------|--------|------|
| Engineer | Implementation | ✅ Approved | 2025-12-27 |
| Cryptographer | Security | ✅ Approved | 2025-12-27 |
| CTO | Integration | ✅ Approved | 2025-12-27 |

---

**END OF SPECIFICATION**
