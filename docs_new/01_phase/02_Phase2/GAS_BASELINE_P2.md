# Gas Baseline Report - Phase 2 Start

> **Date**: 2025-12-25 23:40 JST  
> **Phase**: 2 - Security Council + Token  
> **Day**: 1  
> **Task**: [TEST-P2-02] Gas消費ベースライン取得

---

## 1. Executive Summary

Phase 2開始時点のGas消費ベースラインです。
Phase 1最終ベンチマーク（2025-12-26）を基準とし、Phase 2での87.5%削減目標との差分を追跡します。

### 1.1 Key Metrics

| 指標 | Phase 1 Final | Phase 2 Target | 差分 |
|------|--------------|----------------|------|
| SHA3-256 (32B) | 1,032,000 gas | - | Baseline |
| SHAKE256 (32B) | 1,046,420 gas | - | Baseline |
| 署名検証 (est.) | ~50-100M gas | <6.25M gas | **-87.5%** |
| 証明検証 | N/A | <500,000 gas | New |

---

## 2. Phase 1 Baseline Reference

### 2.1 Cryptographic Operations

| Operation | Gas | Source |
|-----------|-----|--------|
| SHA3-256 (0 bytes) | 1,030,000 | SHA3_256GasTest |
| SHA3-256 (32 bytes) | 1,032,000 | SHA3_256GasTest |
| SHA3-256 (56 bytes) | 1,035,000 | SHA3_256GasTest |
| SHAKE256 (32 bytes) | 1,046,420 | SHAKE256Test |
| SHAKE256 (64 bytes) | 1,060,836 | SHAKE256Test |
| computePublicKeyHash | 1,036,378 | SPHINCSVerifierSHAKETest |

### 2.2 L1Vault Operations

| Operation | Gas | Notes |
|-----------|-----|-------|
| deposit() | TBD | Phase 2 measurement |
| initiateWithdrawal() | TBD | Phase 2 measurement |
| executeWithdrawal() | TBD | Phase 2 measurement |
| emergencyUnlock() | TBD | Phase 2 measurement |

### 2.3 VRF Operations

| Operation | Gas | Notes |
|-----------|-----|-------|
| requestRandomWords() | TBD | Phase 2 measurement |
| fulfillRandomWords() | TBD | Phase 2 measurement |
| selectProver() | TBD | Phase 2 measurement |

---

## 3. Phase 2 Targets

### 3.1 ZK-STARK Proof Verification

| Component | Target Gas | Notes |
|-----------|-----------|-------|
| FRI Verification | <100,000 | 80 queries, 16 layers |
| Merkle Proofs | <50,000 | Batch verification |
| Field Operations | <50,000 | Assembly optimized |
| **Total** | **<500,000** | Target ceiling |

### 3.2 Gas Reduction Roadmap

```
Phase 1 End:    ████████████████████████████████ 100% (~50-100M gas)
Month 7:        ████████████████████████░░░░░░░░  75% (~37-75M gas)
Month 8:        ████████████████░░░░░░░░░░░░░░░░  50% (~25-50M gas)
Month 9:        ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  12.5% (<6.25M gas) ✓ TARGET
```

### 3.3 Incremental Targets

| Milestone | Target | Date | Status |
|-----------|--------|------|--------|
| Baseline established | 100% | 2025-12-25 | ✅ |
| 25% reduction | 75% | 2026-01-15 | ⬜ |
| 50% reduction | 50% | 2026-02-01 | ⬜ |
| 75% reduction | 25% | 2026-02-15 | ⬜ |
| **87.5% reduction** | **12.5%** | **2026-03-01** | ⬜ |

---

## 4. Measurement Methodology

### 4.1 Test Commands

```bash
# Full gas report
cd contracts
forge test --gas-report > gas_report_$(date +%Y%m%d).txt

# Specific contract
forge test --match-contract L1Vault --gas-report

# With verbosity
forge test --gas-report -vvv
```

### 4.2 Benchmark Test Locations

| Contract | Test File | Key Functions |
|----------|-----------|---------------|
| SHA3_256 | test/SHA3_256.t.sol | test_Gas_* |
| SHAKE256 | test/SHAKE256.t.sol | test_Gas_* |
| SPHINCSVerifier | test/SPHINCSVerifierSHAKE.t.sol | test_Gas_* |
| L1Vault | test/L1Vault.t.sol | test_Gas_* (to add) |

### 4.3 New Benchmark Tests to Add

```solidity
// test/GasBaseline.t.sol (New)
contract GasBaselineTest is Test {
    function test_Gas_L1Vault_Deposit() public {
        // Measure deposit gas
    }
    
    function test_Gas_L1Vault_Withdrawal() public {
        // Measure withdrawal gas
    }
    
    function test_Gas_STARK_Verification() public {
        // Measure STARK proof verification gas
        // Target: <500,000 gas
    }
}
```

---

## 5. Comparison: Phase 1 vs Phase 2 Targets

### 5.1 SHA3-256 vs keccak256

| Function | Gas | Ratio to keccak256 |
|----------|-----|-------------------|
| keccak256 (EVM native) | 36 | 1x |
| SHA3-256 (Pure Solidity) | 1,032,000 | ~28,667x |

**Note**: This overhead is accepted for CP-1 compliance. Phase 2 ZK-STARK proofs will move heavy computation off-chain.

### 5.2 SPHINCS+ Verification Path

| Path | Current | Target | Strategy |
|------|---------|--------|----------|
| Full verification | ~50-100M | <6.25M | ZK-STARK proof |
| Validation only | ~8,300 | ~8,300 | Keep as-is |
| Public key hash | ~1.03M | ~1.03M | Keep as-is |

---

## 6. Gas Optimization Opportunities

### 6.1 Identified Optimizations

| Optimization | Expected Savings | Complexity | Priority |
|--------------|-----------------|------------|----------|
| ZK-STARK proofs | 87.5%+ | HIGH | 🔴 P1 |
| Batch Merkle verification | 30-50% | MEDIUM | 🔴 P1 |
| Assembly in field ops | 10-20% | HIGH | 🟡 P2 |
| Storage slot packing | 5-10% | LOW | 🟢 P3 |

### 6.2 Layer 2 Considerations

| L2 Solution | Estimated Savings | Integration Effort |
|-------------|------------------|-------------------|
| Arbitrum | 90-95% | MEDIUM |
| Optimism | 90-95% | MEDIUM |
| zkSync | 95-99% | HIGH |
| StarkNet | 95-99% | LOW (native STARK) |

---

## 7. Tracking Dashboard

### 7.1 Weekly Gas Tracking

| Week | SHA3-256 | SHAKE256 | STARK Verify | Notes |
|------|----------|----------|--------------|-------|
| W1 (Baseline) | 1,032,000 | 1,046,420 | N/A | Phase 2 start |
| W2 | - | - | - | - |
| W3 | - | - | - | - |
| W4 | - | - | - | - |

### 7.2 Update Protocol

1. Run `forge test --gas-report` weekly
2. Update this document with new measurements
3. Flag any unexpected increases (>5%)
4. Report progress in PIR meetings

---

## 8. Test Suite Status

### 8.1 Current Tests (Phase 1 Final)

```
Ran 19 test suites: 423 tests passed, 0 failed, 0 skipped
```

### 8.2 Phase 2 Test Additions Required

| Test | Purpose | Priority |
|------|---------|----------|
| GasBaselineTest | Weekly gas tracking | 🔴 HIGH |
| STARKVerifierGasTest | STARK proof verification | 🔴 HIGH |
| L1VaultGasTest | Vault operation costs | 🟡 MEDIUM |

---

## 9. Risk Assessment

### 9.1 Gas Target Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 87.5% unachievable | LOW | HIGH | Layer 2 fallback |
| Regression | MEDIUM | MEDIUM | CI gas checks |
| Mainnet variations | LOW | LOW | Buffer margin |

### 9.2 Contingency Plan

```
IF Gas reduction < 80% by Month 8:
  → Evaluate Layer 2 deployment
  → Consider proof aggregation
  → Adjust Phase 2 timeline

IF Gas regression detected:
  → Immediate PIR review
  → Rollback to last known good
  → Root cause analysis
```

---

## 10. References

| Document | Path |
|----------|------|
| Phase 1 Gas Benchmark | `docs/planning/archive/GAS_BENCHMARK_2025-12-26.md` |
| ZK-STARK Plan | `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` |
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |

---

## 11. Next Actions

1. [ ] Add GasBaselineTest.sol to test suite
2. [ ] Run full gas report and capture all operations
3. [ ] Establish CI pipeline for gas tracking
4. [ ] Create weekly gas report automation

---

**END OF GAS BASELINE REPORT**
