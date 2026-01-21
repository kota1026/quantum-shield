# L3-Aegis Integration Plan

> **Version**: 1.0.0
> **Created**: 2025-12-28
> **Status**: Active

## 1. Overview

Phase 2 assets integration into l3-aegis Core Layer.

### 1.1 Success Criteria

| Criteria | Target | Method |
|----------|--------|--------|
| Test Pass Rate | 100% | forge test |
| CP-1 Compliance | 100% | No keccak256 |
| Gas Efficiency | plus/minus 5% | gas-report |

## 2. Integration Targets

### Priority 1: Core Libraries

| File | Function | Dependencies |
|------|----------|--------------|
| SHA3_256.sol | Pure Solidity SHA3-256 | None |
| SHA3Hasher.sol | SHA3-256 wrapper | SHA3_256 |
| OptimizedField.sol | Optimized arithmetic | None |

### Priority 2: Verification Contracts

| File | Function | Dependencies |
|------|----------|--------------|
| STARKVerifier.sol | STARK proof verification | SHA3Hasher, OptimizedField, ProofCodec |
| FRIVerifier.sol | FRI verification | SHA3Hasher |
| BatchVerifier.sol | Batch verification | SHA3Hasher, SharedMerkle, ProofCodec |

### Priority 3: Supporting Libraries

| File | Function |
|------|----------|
| ProofCodec.sol | Proof encode/decode |
| SharedMerkle.sol | Shared Merkle optimization |
| ProofCompressor.sol | Proof compression |
| ProofDecoder.sol | Proof expansion |
| SparseMerkleTree.sol | SMT implementation |

## 3. Directory Structure After Integration

```
l3-aegis/
├── src/
│   ├── interfaces/
│   ├── core/
│   │   ├── CoreBridge.sol
│   │   ├── STARKVerifier.sol
│   │   ├── BatchVerifier.sol
│   │   ├── libraries/
│   │   │   ├── SHA3_256.sol
│   │   │   ├── SHA3Hasher.sol
│   │   │   └── ProofCodec.sol
│   │   └── lib/
│   │       ├── OptimizedField.sol
│   │       └── SharedMerkle.sol
│   ├── governance/
│   └── token/
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── foundry.toml
```

## 4. Integration Steps

### Phase 1: Library Integration (Day 1-2)

```bash
mkdir -p l3-aegis/src/core/libraries
mkdir -p l3-aegis/src/core/lib
cp contracts/src/libraries/SHA3_256.sol l3-aegis/src/core/libraries/
cp contracts/src/libraries/SHA3Hasher.sol l3-aegis/src/core/libraries/
cp contracts/src/lib/OptimizedField.sol l3-aegis/src/core/lib/
cd l3-aegis && forge build
```

### Phase 2: Verification Contract Integration (Day 3-4)

```bash
cp contracts/src/libraries/ProofCodec.sol l3-aegis/src/core/libraries/
cp contracts/src/lib/SharedMerkle.sol l3-aegis/src/core/lib/
cp contracts/src/STARKVerifier.sol l3-aegis/src/core/
cp contracts/src/BatchVerifier.sol l3-aegis/src/core/
```

### Phase 3: Test Migration (Day 5-6)

```bash
mkdir -p l3-aegis/test/unit/core
mkdir -p l3-aegis/test/integration
cp contracts/test/STARKVerifier.t.sol l3-aegis/test/unit/core/
cd l3-aegis && forge test -vvv
```

## 5. Test Plan

### 5.1 Unit Tests

| Test | File | Purpose |
|------|------|---------|
| SHA3Hasher | SHA3Hasher.t.sol | NIST compliance |
| STARKVerifier | STARKVerifier.t.sol | Proof verification |
| BatchVerifier | BatchVerifier.t.sol | Batch verification |

### 5.2 Integration Tests

| Test | File | Purpose |
|------|------|---------|
| CoreLayer | CoreLayerIntegration.t.sol | Layer integration |
| ProofFlow | ProofFlow.t.sol | E2E proof verification |

## 6. Risk Management

| ID | Risk | Impact | Probability | Mitigation |
|----|------|--------|-------------|------------|
| R1 | Import path mismatch | Medium | High | Auto-fix script |
| R2 | Gas efficiency drop | Low | Medium | Continuous benchmark |
| R3 | Test compatibility | Medium | Medium | Path adjustment |
| R4 | CP-1 violation | High | Low | CI/CD auto-check |

## 7. Schedule

| Week | Task | Owner | Status |
|------|------|-------|--------|
| W1 | Integration plan | Engineer | Done |
| W1 | CI/CD workflow | Engineer | Done |
| W2 | Library integration | Engineer | Planned |
| W2 | Test migration | QA | Planned |
| W3 | CoreBridge impl | Engineer | Planned |

---

**END OF INTEGRATION PLAN**
