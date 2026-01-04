# Batch Verification Specification

> **Version**: 0.1  
> **Created**: 2025-12-27  
> **Author**: Engineer + Cryptographer  
> **Status**: DRAFT - Implementation Phase

---

## 1. Executive Summary

This document specifies the batch verification system for Quantum Shield's ZK-STARK proofs. The primary goal is to achieve ≥40% gas reduction when verifying multiple proofs by sharing Merkle path computations.

### 1.1 Key Objectives

| # | Objective | Target | Priority |
|---|-----------|--------|----------|
| 1 | Gas reduction (10-proof batch) | ≥40% | 🔴 P0 |
| 2 | Gas reduction (20-proof batch) | ≥50% | 🟠 P1 |
| 3 | CP-1 compliance | 100% | 🔴 P0 |
| 4 | Backward compatibility | Maintained | 🔴 P0 |

---

## 2. Architecture

### 2.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BatchVerifier.sol                           │
│  - Batch coordination                                           │
│  - Input validation                                             │
│  - Result aggregation                                           │
├─────────────────────────────────────────────────────────────────┤
│                     SharedMerkle.sol                            │
│  - Path caching (future)                                        │
│  - Hash optimization                                            │
│  - Merkle root computation                                      │
├─────────────────────────────────────────────────────────────────┤
│                     SHA3Hasher.sol                              │
│  - SHA3-256 implementation                                      │
│  - Domain separation                                            │
│  - CP-1 compliance                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  Proofs  │────▶│ BatchVerifier│────▶│SharedMerkle │
│  (N)     │     │              │     │             │
└──────────┘     └──────────────┘     └─────────────┘
                        │                    │
                        ▼                    ▼
                 ┌──────────────┐     ┌─────────────┐
                 │   Results    │     │ SHA3Hasher  │
                 │ (validCount) │     │ (CP-1)      │
                 └──────────────┘     └─────────────┘
```

---

## 3. Contracts

### 3.1 BatchVerifier.sol

#### Purpose
Main entry point for batch proof verification. Coordinates verification and aggregates results.

#### Key Functions

| Function | Description | Gas Estimate |
|----------|-------------|-------------|
| `verifyBatch()` | Verify N proofs, return valid count | O(N × depth × hash) |
| `verifyBatchDetailed()` | Verify with per-proof results | O(N × depth × hash) |
| `verifySTARKBatch()` | Verify STARK proofs batch | O(N × STARK) |

#### Interface

```solidity
function verifyBatch(
    bytes32[] calldata leaves,
    uint256[] calldata indices,
    bytes32[][] calldata allSiblings,
    bytes32 expectedRoot
) external view returns (uint256 validCount);
```

### 3.2 SharedMerkle.sol

#### Purpose
Optimized Merkle tree operations with path sharing capabilities.

#### Key Functions

| Function | Description | Gas Estimate |
|----------|-------------|-------------|
| `verifyProof()` | Single proof verification | O(depth × hash) |
| `verifyBatchProofs()` | Batch with sharing | O(N × depth × hash) |
| `computeRoot()` | Build tree from evaluations | O(N × hash) |

#### Optimization Strategy

1. **Current (v0.1)**: Basic batch verification
2. **Future (v0.2)**: Path segment caching
3. **Future (v0.3)**: Transient storage optimization

---

## 4. Gas Optimization Analysis

### 4.1 Cost Breakdown (Current)

| Component | Individual | Batch (10) | Reduction |
|-----------|-----------|------------|----------|
| Base call | 21,000 | 21,000 | 95.3% |
| SHA3-256 × depth | ~10M | ~10M × 10 | 0% |
| Memory alloc | 5,000 | 15,000 | 70% |
| Loop overhead | 2,000 | 10,000 | 50% |
| **Total** | ~10M | ~100M | ~5% |

### 4.2 Optimization Opportunities

| Optimization | Expected Savings | Complexity | Status |
|--------------|-----------------|------------|--------|
| Shared path segments | 20-30% | Medium | 🔜 v0.2 |
| Transient storage | 10-15% | Low | 🔜 v0.2 |
| Assembly optimization | 10-20% | High | ⬜ v0.3 |
| Precompile (future) | 50%+ | N/A | ⬜ Future |

### 4.3 SHA3-256 Gas Reality

The primary gas cost is SHA3-256 hashing (~1M gas per operation in pure Solidity). This is a known limitation of CP-1 compliance requirements.

**Mitigation strategies**:
1. Minimize hash operations per verification
2. Share computed hashes across proofs
3. Future: EIP for SHA3-256 precompile

---

## 5. Security Considerations

### 5.1 CP-1 Compliance

✅ **Required**:
- SHA3-256 (FIPS 202) for all hashing
- Domain separation for all hash operations
- 128-bit security minimum

❌ **Prohibited**:
- keccak256
- SHA-256/SHA-2 family
- Any non-NIST approved algorithms

### 5.2 Attack Vectors

| Vector | Risk | Mitigation |
|--------|------|------------|
| DoS via large batch | Medium | MAX_BATCH_SIZE limit |
| Invalid proof injection | Low | Per-proof validation |
| Root substitution | Low | Immutable root parameter |

---

## 6. Testing Requirements

### 6.1 Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Basic functionality | 5 | ✅ |
| Gas benchmarks | 3 | ✅ |
| Edge cases | 4 | ✅ |
| Fuzz tests | 2 | ✅ |
| CP-1 compliance | 2 | ✅ |
| **Total** | **16+** | ✅ |

### 6.2 Gas Benchmark Tests

```solidity
// Required benchmarks
test_Gas_IndividualVerification()
test_Gas_BatchVerification()
test_Gas_ReductionTarget()
```

---

## 7. Integration

### 7.1 With STARKVerifier

```solidity
// Current: Individual verification
for (uint i = 0; i < proofs.length; i++) {
    starkVerifier.verifyProof(proofs[i], publicInputs[i]);
}

// New: Batch verification
batchVerifier.verifySTARKBatch(proofs, publicInputs);
```

### 7.2 With L1Vault

Batch verification integrates with withdrawal validation:

```solidity
// Batch validate withdrawal proofs
uint256 validCount = batchVerifier.verifyBatch(
    withdrawalLeaves,
    withdrawalIndices,
    withdrawalProofs,
    stateRoot
);
require(validCount == withdrawals.length, "Invalid proofs");
```

---

## 8. Deployment

### 8.1 Deployment Order

1. Deploy `SharedMerkle.sol`
2. Deploy `BatchVerifier.sol` with SharedMerkle address
3. Verify both on Etherscan
4. Integration tests on Sepolia

### 8.2 Constructor Parameters

| Contract | Parameter | Value |
|----------|-----------|-------|
| SharedMerkle | (none) | - |
| BatchVerifier | _sharedMerkle | SharedMerkle address |

---

## 9. Future Enhancements

### 9.1 v0.2 Roadmap

| Feature | Description | Target Week |
|---------|-------------|-------------|
| Path caching | Cache intermediate nodes | Week 10 |
| Transient storage | EIP-1153 optimization | Week 10 |
| Proof compression | Reduce calldata | Week 11 |

### 9.2 v0.3 Roadmap

| Feature | Description | Target Week |
|---------|-------------|-------------|
| Assembly optimization | Inline assembly for hot paths | Week 11 |
| Precompile integration | When available | Future |

---

## 10. References

| Document | Path |
|----------|------|
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |
| STARK Verifier | `contracts/src/STARKVerifier.sol` |
| SHA3 Implementation | `contracts/src/libraries/SHA3_256.sol` |
| Phase 2.3 Plan | `docs/planning/PHASE2_3_PLAN.md` |

---

## 11. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-12-27 | Initial specification |

---

**BATCH VERIFICATION SPEC v0.1 - DRAFT**

**END OF DOCUMENT**
