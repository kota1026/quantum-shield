# Phase 0.5 Progress Report: STARK PoC

**Date**: 2025-12-22
**Status**: In Progress
**PR**: #23

---

## Executive Summary

Phase 0.5 implements a proof-of-concept for Dilithium signature verification using native STARK (Plonky3) to compare against the SP1 zkVM baseline.

---

## Completed Work

### 1. Plonky3 PoC Implementation

| Component | File | Status |
|-----------|------|--------|
| Constants & Montgomery | `src/constants.rs` | ✅ Complete |
| AIR Constraints | `src/air.rs` | ✅ Complete |
| Trace Generation | `src/trace.rs` | ✅ Complete |
| Prover Skeleton | `src/prover.rs` | ✅ Complete |
| Benchmarks | `benches/plonky3_dilithium.rs` | ✅ Complete |

### 2. Architecture

```
circuits/plonky3-poc/
├── Cargo.toml           # Plonky3 dependencies
├── src/
│   ├── lib.rs           # Module exports
│   ├── constants.rs     # Q, R, ZETAS, Montgomery ops
│   ├── air.rs           # DilithiumAir, SimpleNttAir
│   ├── trace.rs         # DilithiumTrace generator
│   └── prover.rs        # prove_dilithium(), ProofResult
└── benches/
    └── plonky3_dilithium.rs  # Criterion benchmarks
```

### 3. Key Components

#### Montgomery Arithmetic (constants.rs)
- `Q = 8380417` (Dilithium prime)
- `montgomery_multiply()` - O(1) modular multiplication
- `ntt_butterfly()` - Butterfly for NTT

#### AIR Constraints (air.rs)
- **DilithiumAir**: Full 8-column constraint system
  - NTT butterfly: `(a-b)·ω + m·Q = diff·R`
  - Sum computation
  - Norm bound check
  - Boolean selectors
  
- **SimpleNttAir**: 4-column minimal AIR for benchmarking

#### Trace Generation (trace.rs)
- `generate_ntt_trace()` - Full Dilithium trace
- `generate_simple_trace()` - Optimized for benchmarks
- Power-of-2 padding for FFT

---

## SP1 Baseline (Existing)

From `docs/SP1_BENCHMARK_REPORT.md`:

| Trace Size | Cycles | Time (ms) | Ops/s |
|------------|--------|-----------|-------|
| 256 | 60.56K | 7 | ~146K |
| 512 | 115.20K | 7 | ~292K |
| 1024 | 224.07K | 11 | ~372K |
| 2048 | 441.92K | 18 | ~455K |
| 4096 | 875.44K | 33 | ~496K |

**Key Metrics**:
- Scaling: O(n^0.96) - near linear
- Cost: $0.0009/proof
- Efficiency: 53.4 cycles/op at N=4096

---

## Phase 0.5 Success Criteria

| Metric | Target | SP1 Baseline | Status |
|--------|--------|--------------|--------|
| Constraint Count | < 1M | 875K cycles | 🔄 Testing |
| Proof Time | < 1 second | 33ms | 🔄 Testing |
| Scaling | O(n) | O(n^0.96) | 🔄 Testing |
| Cost per Proof | < $0.01 | $0.0009 | 🔄 Testing |

---

## Remaining Work

### Immediate (Est. 2-4 hours)
1. **Complete Prover Integration**
   - Wire up full Plonky3 proving pipeline
   - Configure FRI parameters
   - Add proof verification

2. **Run Benchmarks**
   - Execute Criterion benchmarks
   - Generate comparison report
   - Document results

3. **CI/CD**
   - Add GitHub Actions workflow
   - Automate benchmark runs

### Go/No-Go Decision
After benchmark completion:
- **Go**: Plonky3 ≤ SP1 in all metrics → Proceed to Phase 1
- **No-Go**: Plonky3 > 2x SP1 → Stick with SP1 zkVM

---

## Files Changed

```
circuits/plonky3-poc/
├── Cargo.toml                    [NEW]
├── src/lib.rs                    [NEW]
├── src/constants.rs              [NEW]
├── src/air.rs                    [NEW]
├── src/trace.rs                  [NEW]
├── src/prover.rs                 [NEW]
└── benches/plonky3_dilithium.rs  [NEW]

Cargo.toml                        [MODIFIED - added workspace member]
```

---

## References

- [PR #23](https://github.com/kota1026/quantum-shield/pull/23)
- [SP1 Benchmark Report](SP1_BENCHMARK_REPORT.md)
- [SOUNDNESS_REVIEW](SOUNDNESS_REVIEW.md)
- [WBS Phase 0.5](../PROJECT_AEGIS_WBS_v1.0.md)
