# Sepolia Gas Baseline Report

**Date**: 2025-12-27  
**Network**: Sepolia Testnet  
**Phase**: 2.3 Gas Optimization  

---

## Summary

First real-world gas measurements for Quantum Shield on Sepolia testnet.

**Key Finding**: SHA3-256 (FIPS 202) implementation in pure Solidity consumes significant gas, confirming the need for BatchVerifier optimization.

---

## Gas Measurements

### L1Vault.lock()

| Metric | Value |
|--------|-------|
| **Gas Used** | 4,319,591 |
| **Effective Gas Price** | 1,227,550 wei |
| **Total Cost** | ~0.0053 ETH |
| **TX Hash** | [0x297ebb7a...](https://sepolia.etherscan.io/tx/0x297ebb7aff9bfaa7cae5a4737c828d553865ff4b21709413c88f922d79737f11) |

#### Test Parameters
- Lock Amount: 0.01 ETH
- Recipient: Deployer address
- Dilithium PubKey: 32 bytes (dummy)

---

## Gas Breakdown Analysis

### SHA3-256 Cost Components

| Operation | Estimated Gas | Notes |
|-----------|---------------|-------|
| Keccak-f permutation (24 rounds) | ~2,000,000 | Core SHA3 computation |
| State manipulation | ~1,500,000 | Memory operations |
| StateRootCalculator.computeSR0 | ~500,000 | SR0 computation |
| Lock struct storage | ~200,000 | SSTORE operations |
| Event emission | ~50,000 | Locked event |
| Other overhead | ~70,000 | Call data, etc |
| **Total** | **~4,320,000** | |

---

## Comparison with Industry Standards

| Protocol | Lock/Deposit Gas | Notes |
|----------|------------------|-------|
| Uniswap V3 Swap | ~150,000 | keccak256 based |
| Aave Deposit | ~250,000 | keccak256 based |
| Compound Supply | ~200,000 | keccak256 based |
| **Quantum Shield** | **~4,320,000** | **SHA3-256 (Quantum Resistant)** |

**Trade-off**: ~20x more gas for quantum resistance (CP-1 compliance).

---

## Optimization Roadmap

### Current State (v0.1)
- Individual proof verification
- Pure Solidity SHA3-256
- Gas: ~4.3M per lock

### Phase 2.3 Target (v0.2) - BatchVerifier
- Batch verification (10-100 proofs)
- Shared Merkle path caching
- **Target**: 40% reduction → ~2.6M per lock

### Future (v0.3+)
- Assembly-optimized SHA3-256
- EIP-1153 transient storage
- **Target**: 60%+ reduction → ~1.7M per lock

### Long-term (v1.0)
- Native SHA3-256 precompile (EIP proposal)
- **Target**: 90%+ reduction → ~400K per lock

---

## Deployed Contract Addresses

| Contract | Address | Verified |
|----------|---------|----------|
| L1Vault | `0xAdEB23203bf5C45e3CbD3406122aED067E41255D` | ⏳ |
| STARKVerifier | `0x93f550917E45b6BDA45dE4fE3e0bAB09FfC38848` | ⏳ |
| SPHINCSVerifier | `0xd5F3cEA1fE247fff7e15cBA00C1f804D2Bd126f3` | ⏳ |

---

## Test Transaction Details

```
Lock ID: 0xeba42771fa25f9bb35d5b5d5430629f9c9825a8cf1eea6bb53f03fe3397cb4c7
Block: 9922698
Timestamp: 2025-12-27T13:41:52Z
```

---

## Conclusions

1. **SHA3-256 is expensive but necessary** - CP-1 quantum resistance requires this trade-off
2. **Batching is critical** - BatchVerifier will amortize fixed costs across multiple proofs
3. **Future precompile needed** - Long-term solution requires EVM-level SHA3-256 support
4. **Current gas is acceptable for high-value transfers** - Cost is justified for quantum-resistant cross-chain bridges

---

## Next Steps

1. [ ] Deploy BatchVerifier and SharedMerkle
2. [ ] Measure batch verification gas (10, 50, 100 proofs)
3. [ ] Compare individual vs batch gas savings
4. [ ] Document optimization opportunities for v0.3
