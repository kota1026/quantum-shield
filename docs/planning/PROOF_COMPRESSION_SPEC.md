# Proof Compression Specification

> **Version**: 0.1  
> **Created**: 2025-12-27  
> **Author**: Engineer + Cryptographer  
> **Status**: DRAFT - Implementation Phase

---

## 1. Executive Summary

This document specifies the proof compression system for Quantum Shield's ZK-STARK proofs. The primary goal is to achieve ≥50% compression ratio for proof data to reduce calldata costs.

### 1.1 Key Objectives

| # | Objective | Target | Priority |
|---|-----------|--------|----------|
| 1 | Compression ratio | ≥50% | 🔴 P0 |
| 2 | Decompression gas | <100,000 gas | 🔴 P0 |
| 3 | CP-1 compliance | 100% | 🔴 P0 |
| 4 | Roundtrip integrity | 100% | 🔴 P0 |

---

## 2. Architecture

### 2.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ProofCompressor.sol                         │
│  - Merkle path compression (RLE)                                │
│  - Evaluation compression (Delta encoding)                      │
│  - Full STARK proof compression                                 │
├─────────────────────────────────────────────────────────────────┤
│                     ProofDecoder.sol                            │
│  - Merkle path decompression                                    │
│  - Evaluation decompression                                     │
│  - Full STARK proof decompression                               │
├─────────────────────────────────────────────────────────────────┤
│                     BatchVerifier.sol                           │
│  - Uses decompressed proofs for verification                    │
│  - Integration with SharedMerkle                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
┌──────────────┐     ┌────────────────┐     ┌─────────────────┐
│  Uncompressed│────▶│ ProofCompressor│────▶│ Compressed Data │
│    Proof     │     │                │     │  (calldata)     │
└──────────────┘     └────────────────┘     └─────────────────┘
                                                    │
                                                    ▼
┌──────────────┐     ┌────────────────┐     ┌─────────────────┐
│   Verified   │◀────│ BatchVerifier  │◀────│  ProofDecoder   │
│   Result     │     │                │     │                 │
└──────────────┘     └────────────────┘     └─────────────────┘
```

---

## 3. Compression Techniques

### 3.1 Merkle Path Compression (RLE)

Run-Length Encoding for Merkle sibling hashes:

| Type Code | Description | Format |
|-----------|-------------|--------|
| 0 | Raw value | `[0][32 bytes]` |
| 1 | Zero run | `[1][count:1 byte]` |
| 2 | Repeated value | `[2][count:1 byte][32 bytes]` |

**Expected Compression**: 20-30%

#### Example

```
Original: [hash1, 0, 0, 0, hash2, hash2, hash2]
Compressed: [0][hash1][1][3][2][3][hash2]
           = 1 + 32 + 1 + 1 + 1 + 1 + 32 = 69 bytes
Original size: 7 * 32 = 224 bytes
Compression: 69/224 = 31%
```

### 3.2 Evaluation Compression (Delta Encoding)

Delta encoding for sequential field element evaluations:

| Type Code | Description | Format |
|-----------|-------------|--------|
| 0 | Full value | `[0][32 bytes]` |
| 1 | Small delta (-32768 to 32767) | `[1][2 bytes]` |
| 2 | Medium delta | `[2][4 bytes]` |

**Expected Compression**: 10-20%

#### Example

```
Original: [1000000, 1000100, 1000150, 1000200]
Compressed: [1000000][1][100][1][50][1][50]
          = 32 + 3 + 3 + 3 = 41 bytes
Original: 4 * 32 = 128 bytes
Compression: 41/128 = 32%
```

### 3.3 Full Proof Format

```
┌─────────────────────────────────────────────────────────────┐
│ Header (24 bytes)                                           │
├─────────────────────────────────────────────────────────────┤
│ [version:4][flags:4][friCount:4][traceCount:4]              │
│ [constraintCount:4][reserved:4]                             │
├─────────────────────────────────────────────────────────────┤
│ Commitments (64 bytes)                                      │
├─────────────────────────────────────────────────────────────┤
│ [traceCommitment:32][constraintCommitment:32]               │
├─────────────────────────────────────────────────────────────┤
│ FRI Commitments (variable)                                  │
├─────────────────────────────────────────────────────────────┤
│ [length:2][commitment:32][commitment:32]...                 │
├─────────────────────────────────────────────────────────────┤
│ Trace Evaluations (variable, delta-encoded)                 │
├─────────────────────────────────────────────────────────────┤
│ [length:2][first:32][delta...][delta...]...                 │
├─────────────────────────────────────────────────────────────┤
│ Constraint Evaluations (variable, delta-encoded)            │
├─────────────────────────────────────────────────────────────┤
│ [length:2][first:32][delta...][delta...]...                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Compression Analysis

### 4.1 Typical Proof Sizes

| Component | Uncompressed | Compressed | Ratio |
|-----------|-------------|------------|-------|
| Header | - | 24 bytes | Fixed |
| Commitments | 64 bytes | 64 bytes | 100% |
| FRI (10 layers) | 320 bytes | 322 bytes | ~100% |
| Trace Evals (64) | 2048 bytes | ~500 bytes | ~25% |
| Constraint Evals (32) | 1024 bytes | ~250 bytes | ~25% |
| **Total** | **3456 bytes** | **~1160 bytes** | **~34%** |

### 4.2 Calldata Cost Savings

```
Original calldata cost (assuming 75% non-zero):
  3456 bytes × 0.75 × 16 gas + 3456 × 0.25 × 4 gas = 41,472 + 3,456 = 44,928 gas

Compressed calldata cost:
  1160 bytes × 0.75 × 16 gas + 1160 × 0.25 × 4 gas = 13,920 + 1,160 = 15,080 gas

Savings: 44,928 - 15,080 = 29,848 gas per proof (~66%)
```

---

## 5. CP-1 Compliance

### 5.1 Requirements

✅ **Required**:
- SHA3-256 (FIPS 202) for any hashing within compression
- No weakening of cryptographic security
- Domain separation maintained

❌ **Prohibited**:
- keccak256 usage
- SHA-256/SHA-2 family
- Any modification to commitment values

### 5.2 Security Considerations

| Concern | Mitigation |
|---------|------------|
| Compression oracle attacks | Not applicable (proofs are public) |
| Decompression bombs | MAX_DECOMPRESSED_SIZE limit |
| Version confusion | Strict version checking |
| Data integrity | Roundtrip verification tests |

---

## 6. Testing Requirements

### 6.1 Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Unit tests (ProofCompressor) | 15+ | ✅ |
| Roundtrip tests | 10+ | ✅ |
| Benchmark tests | 5+ | ✅ |
| Integration tests | 10+ | ✅ |
| Fuzz tests | 2+ | ✅ |
| **Total** | **45+** | ✅ |

### 6.2 Key Test Scenarios

1. **Basic Compression**: Single path/evaluation compression
2. **Roundtrip**: Compress → Decompress → Verify equality
3. **Edge Cases**: Empty inputs, max depth, all zeros
4. **Gas Benchmarks**: Measure compression/decompression costs
5. **Integration**: End-to-end with BatchVerifier

---

## 7. Gas Budget

### 7.1 Target Gas Costs

| Operation | Target | Status |
|-----------|--------|--------|
| Compress Merkle path (8 depth) | <50,000 | TBD |
| Decompress Merkle path (8 depth) | <30,000 | TBD |
| Compress full proof | <100,000 | TBD |
| Decompress full proof | <100,000 | ✅ Target |

### 7.2 Gas Optimization Strategies

1. **Inline assembly** for hot paths (future)
2. **Minimal memory allocation** during decompression
3. **Early exit** on invalid data
4. **Efficient type conversions** using calldata slicing

---

## 8. Integration

### 8.1 With BatchVerifier

```solidity
// Compressed proof storage
mapping(bytes32 => bytes) public compressedProofs;

// Verification flow
function verifyCompressedBatch(
    bytes[] calldata compressedPaths,
    bytes32[] calldata leaves,
    uint256[] calldata indices,
    bytes32 expectedRoot
) external returns (uint256 validCount) {
    bytes32[][] memory decompressedPaths = new bytes32[][](compressedPaths.length);
    
    for (uint256 i = 0; i < compressedPaths.length; i++) {
        decompressedPaths[i] = decoder.decompressMerklePath(compressedPaths[i]);
    }
    
    return batchVerifier.verifyBatch(leaves, indices, decompressedPaths, expectedRoot);
}
```

### 8.2 With L1Vault

```solidity
// Store compressed proofs for withdrawals
function submitCompressedWithdrawalProof(
    bytes calldata compressedProof,
    uint256 amount,
    address recipient
) external {
    // Decompress and verify
    ProofCompressor.UncompressedProof memory proof = decoder.decompressSTARKProof(compressedProof);
    
    // Verify proof
    require(starkVerifier.verifyProof(proof), "Invalid proof");
    
    // Process withdrawal
    _processWithdrawal(amount, recipient);
}
```

---

## 9. Deployment

### 9.1 Deployment Order

1. Deploy `ProofCompressor.sol`
2. Deploy `ProofDecoder.sol` with ProofCompressor address
3. Update BatchVerifier to support compressed inputs (v0.2)
4. Verify all contracts on Etherscan

### 9.2 Constructor Parameters

| Contract | Parameter | Value |
|----------|-----------|-------|
| ProofCompressor | (none) | - |
| ProofDecoder | _compressor | ProofCompressor address |

---

## 10. Future Enhancements

### 10.1 v0.2 Roadmap

| Feature | Description | Target Week |
|---------|-------------|-------------|
| Assembly optimization | Inline assembly for decompression | Week 11 |
| Batch compression | Compress multiple proofs with shared data | Week 11 |
| Transient storage | EIP-1153 for temp decompression | Week 11 |

### 10.2 v0.3 Roadmap

| Feature | Description | Target |
|---------|-------------|--------|
| Challenge re-computation | Store seeds instead of full challenges | Week 12 |
| Proof aggregation | Combine multiple proofs | Future |

---

## 11. References

| Document | Path |
|----------|------|
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |
| Batch Verification | `docs/planning/BATCH_VERIFICATION_SPEC.md` |
| Phase 2.3 Plan | `docs/planning/PHASE2_3_PLAN.md` |
| ProofCodec | `contracts/src/libraries/ProofCodec.sol` |

---

## 12. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-12-27 | Initial specification |

---

**PROOF COMPRESSION SPEC v0.1 - DRAFT**

**END OF DOCUMENT**
