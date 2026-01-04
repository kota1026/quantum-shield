# Precompile Strategy for Post-Quantum STARK Verification

## Executive Summary

This document outlines a three-phase strategy for reducing the gas cost of Dilithium STARK verification on Ethereum, from ~4M gas today to <100K gas with native precompile support.

## Current State

```
┌─────────────────────────────────────────────────────────────┐
│           Current Gas Costs (Ethereum L1)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STARK Verification: ~4,000,000 gas                          │
│  ├── FRI Verification: ~3,000,000 gas (75%)                  │
│  ├── Merkle Proofs: ~500,000 gas (12.5%)                     │
│  ├── Keccak Hashing: ~300,000 gas (7.5%)                     │
│  └── Public Input Validation: ~200,000 gas (5%)              │
│                                                              │
│  At 30 gwei gas price:                                       │
│  Cost per verification: ~0.12 ETH (~$360 @ $3000/ETH)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Three-Phase Strategy

### Phase 1: Lookup Table Optimization (Short-term)

**Timeline**: 1-2 months
**Target**: 4M → 500K gas (8x reduction)

**Approach**:
- Implement lookup tables for NTT twiddle factors
- Use Plonky3 recursive proofs to compress verification
- Optimize FRI parameters for on-chain verification

```
┌─────────────────────────────────────────────────────────────┐
│                  Phase 1 Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Off-chain (Prover):                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Dilithium Sign → NTT Circuit → Lookup-optimized STARK   ││
│  │                                     │                    ││
│  │                    Recursive compression                 ││
│  │                                     ↓                    ││
│  │                           Compressed Proof (~10KB)       ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                               │
│  On-chain (Verifier):        ↓                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ QuantumShield Contract                                   ││
│  │ ├── Level 1: Format validation (~50K gas)                ││
│  │ ├── Level 2: FRI check (optimized) (~300K gas)           ││
│  │ └── Level 3: Full verify (~150K gas)                     ││
│  │                                                          ││
│  │ Total: ~500K gas                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: L2 Native Support (Medium-term)

**Timeline**: 3-6 months
**Target**: <50K gas on L2

**Approach**:
- Deploy on StarkNet (native STARK verification)
- Deploy on zkSync (native proof verification)
- Bridge assets with L1 settlement

```
┌─────────────────────────────────────────────────────────────┐
│                  Phase 2: L2 Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ StarkNet    │    │   zkSync    │    │  Polygon    │      │
│  │ (Native     │    │   Era       │    │  zkEVM      │      │
│  │  STARK)     │    │   (Native   │    │  (Groth16   │      │
│  │             │    │    STARK)   │    │   based)    │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────┴────────┐                        │
│                   │   L1 Bridge     │                        │
│                   │   Contract      │                        │
│                   │  (Ethereum)     │                        │
│                   └─────────────────┘                        │
│                                                              │
│  Verification Cost by Platform:                              │
│  ├── StarkNet: ~10K gas (native support)                     │
│  ├── zkSync Era: ~20K gas (native STARK)                     │
│  └── L1 Ethereum: ~500K gas (optimized)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Ethereum Precompile (Long-term)

**Timeline**: 12-24 months (depends on EIP process)
**Target**: <100K gas on L1 Ethereum

**Approach**:
- Draft EIP for STARK/Dilithium precompile
- Coordinate with Ethereum Foundation
- Implementation in geth/reth clients

```
┌─────────────────────────────────────────────────────────────┐
│           Phase 3: EIP Precompile Proposal                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Proposed Precompile: 0x0B (STARK_VERIFY)                    │
│                                                              │
│  Input Format:                                               │
│  ├── bytes32 publicInputsHash                                │
│  ├── bytes32 traceCommitment                                 │
│  ├── bytes friProof                                          │
│  └── bytes32[] queryResponses                                │
│                                                              │
│  Output:                                                     │
│  └── bool success                                            │
│                                                              │
│  Gas Cost Formula:                                           │
│  ├── Base cost: 3,000 gas                                    │
│  ├── Per FRI layer: 500 gas                                  │
│  └── Per query: 100 gas                                      │
│                                                              │
│  Estimated total: ~50,000 gas for 128-bit security           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## EIP Draft

### EIP-XXXX: STARK Proof Verification Precompile

**Abstract**:
Introduces a precompiled contract for verifying STARK proofs, enabling efficient on-chain verification of post-quantum cryptographic operations.

**Motivation**:
1. **Post-Quantum Security**: Current Ethereum precompiles (ECRECOVER, ECADD) are vulnerable to quantum attacks
2. **Gas Efficiency**: STARK verification in EVM costs ~4M gas; native implementation reduces to ~50K
3. **Ecosystem Demand**: Multiple projects need efficient ZK verification (StarkNet, zkSync, Polygon)

**Specification**:

```solidity
// Precompile address: 0x0B
// Gas cost: 3000 + 500 * numFriLayers + 100 * numQueries

function starkVerify(
    bytes32 publicInputsHash,
    bytes32 traceCommitment,
    bytes memory friProof,
    bytes32[] memory queryResponses
) external view returns (bool);
```

**Security Considerations**:
1. Input validation to prevent DoS
2. Maximum proof size limits
3. Cryptographic soundness of FRI parameters

## Dilithium-Specific Precompile

In addition to generic STARK verification, we propose a Dilithium-specific precompile:

### EIP-XXXX: Dilithium Signature Verification Precompile

```solidity
// Precompile address: 0x0C
// Gas cost: 20,000 (fixed for ML-DSA-65)

function dilithiumVerify(
    bytes32 publicKeyHash,  // Keccak256(publicKey)
    bytes32 messageHash,    // Keccak256(message)
    bytes memory signature  // 3309 bytes for Level 3
) external view returns (bool);
```

**Benefits**:
- Direct quantum-resistant signature verification
- No need for STARK proof overhead
- Gas cost: ~20K (vs ~4M for STARK wrapper)

## Migration Path

```
┌─────────────────────────────────────────────────────────────┐
│                    Migration Timeline                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  2024 Q1-Q2: Phase 1 (Lookup Optimization)                   │
│  ├── Implement lookup tables                                 │
│  ├── Deploy optimized verifier                               │
│  └── Target: 500K gas                                        │
│                                                              │
│  2024 Q3-Q4: Phase 2 (L2 Deployment)                         │
│  ├── Deploy on StarkNet                                      │
│  ├── Deploy on zkSync Era                                    │
│  └── Target: 10-50K gas on L2                                │
│                                                              │
│  2025: Phase 3 (EIP Process)                                 │
│  ├── Q1: Draft EIP submission                                │
│  ├── Q2: Community review                                    │
│  ├── Q3: Implementation in clients                           │
│  └── Q4: Mainnet activation                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Comparison with Existing Precompiles

| Precompile | Operation | Gas Cost | Quantum-Safe |
|------------|-----------|----------|--------------|
| ECRECOVER (0x01) | ECDSA recovery | 3,000 | ❌ |
| SHA256 (0x02) | Hash | 60 + 12/word | ✓ |
| RIPEMD160 (0x03) | Hash | 600 + 120/word | ✓ |
| ECADD (0x06) | BN128 add | 150 | ❌ |
| ECMUL (0x07) | BN128 mul | 6,000 | ❌ |
| PAIRING (0x08) | BN128 pairing | 45K-113K | ❌ |
| **STARK_VERIFY** | STARK verify | ~50K | ✓ |
| **DILITHIUM_VERIFY** | PQ signature | ~20K | ✓ |

## Risk Assessment

### Technical Risks

1. **EIP Adoption**: No guarantee EIP will be accepted
   - Mitigation: Build strong community support, demonstrate demand

2. **Implementation Bugs**: Native code could have vulnerabilities
   - Mitigation: Formal verification, extensive testing, security audits

3. **Parameter Changes**: NIST may update Dilithium parameters
   - Mitigation: Design precompile for parameter flexibility

### Timeline Risks

1. **EIP Process Delays**: Could take longer than expected
   - Mitigation: Phase 2 (L2) provides immediate benefits

2. **Hard Fork Timing**: Precompile requires hard fork
   - Mitigation: Coordinate with major Ethereum upgrades

## Conclusion

This three-phase strategy provides a clear path from current ~4M gas verification costs to <100K gas with native precompile support:

1. **Short-term**: Lookup optimization (8x improvement)
2. **Medium-term**: L2 deployment (100x improvement)
3. **Long-term**: Ethereum precompile (best UX, lowest cost)

The Quantum Shield project demonstrates real-world demand for post-quantum verification, making it an ideal candidate for EIP sponsorship.
