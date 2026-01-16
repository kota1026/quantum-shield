# Lookup Table Optimization Design

## Overview

This document describes the Lookup Table optimization strategy for reducing STARK circuit constraints in the Dilithium signature verification system.

## Current State

### Constraint Counts (Without Lookup)

| Component | Constraints | % of Total |
|-----------|------------|------------|
| NTT Forward (256-point) | ~65,000 | 40% |
| NTT Inverse (256-point) | ~65,000 | 40% |
| Keccak256 (per hash) | ~25,000 | 15% |
| Montgomery Reduction | ~5,000 | 3% |
| Range Checks | ~3,000 | 2% |
| **Total** | **~163,000** | 100% |

### Proof Generation Time

- Current: ~30 seconds
- Target: ~3 seconds (10x improvement)

## Lookup Table Strategy

### 1. NTT Twiddle Factor Lookup

**Problem**: Each NTT butterfly requires computing ζ^k for various k values.

**Solution**: Precompute ZETAS table and use lookup arguments.

```
┌─────────────────────────────────────────────────────────────┐
│                  NTT Lookup Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Preprocessing (One-time):                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ZETAS_TABLE[0..255] = {ζ^brv(0), ζ^brv(1), ..., ζ^brv(255)} ││
│  │ in Montgomery form                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Runtime (Per Butterfly):                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. lookup(k) → ω = ZETAS_TABLE[k]    [1 lookup constraint]││
│  │ 2. t = montgomery_mul(ω, b)          [1 constraint]      ││
│  │ 3. a' = a + t                        [1 constraint]      ││
│  │ 4. b' = a - t                        [1 constraint]      ││
│  │ Total: 4 constraints vs ~30 without lookup               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Constraint Reduction: ~87% (30 → 4 per butterfly)           │
└─────────────────────────────────────────────────────────────┘
```

**Implementation**:

```rust
// Plonky3 Lookup Table for ZETAS
struct NttLookupTable {
    zetas: Vec<Goldilocks>,  // 256 entries
}

impl Air<Goldilocks> for NttCircuit {
    fn lookup_gates(&self) -> Vec<LookupGate> {
        vec![
            LookupGate::new("zetas_lookup", self.zetas_table_id)
        ]
    }
}
```

### 2. Keccak S-box Lookup

**Problem**: Keccak χ step requires 5-bit S-box operations, each needing ~20 constraints.

**Solution**: Precompute all 32 possible S-box outputs.

```
┌─────────────────────────────────────────────────────────────┐
│                Keccak S-box Lookup                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  S-box Definition:                                           │
│  S(x) = x ⊕ ((¬x₁) ∧ x₂)  where x = (x₀, x₁, x₂) are bits   │
│                                                              │
│  Lookup Table (32 entries):                                  │
│  ┌────────┬────────┐                                         │
│  │ Input  │ Output │                                         │
│  ├────────┼────────┤                                         │
│  │ 00000  │ 00000  │                                         │
│  │ 00001  │ 00001  │                                         │
│  │ ...    │ ...    │                                         │
│  │ 11111  │ 11011  │                                         │
│  └────────┴────────┘                                         │
│                                                              │
│  Per χ step: 320 S-box operations                            │
│  Without lookup: 320 × 20 = 6,400 constraints                │
│  With lookup: 320 × 1 = 320 constraints                      │
│                                                              │
│  Reduction: 95% per χ step                                   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Range Check Lookup

**Problem**: Verifying coefficients are within [-γ, γ] requires many comparison constraints.

**Solution**: Use range lookup tables.

```rust
// Range check: value ∈ [0, 2^16)
struct RangeTable {
    max_bits: usize,
    entries: Vec<u64>,  // 0..2^max_bits
}

// For coefficient bound check:
// Check |coeff| < γ1 using decomposition + lookup
fn check_bound(coeff: i32, gamma: i32) -> bool {
    // Decompose into base-2^8 digits
    // Lookup each digit in range table
}
```

## Expected Results

### Constraint Reduction

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| NTT Twiddle | 60,000 | 6,000 | 90% |
| Keccak S-box | 20,000 | 2,000 | 90% |
| Range Checks | 3,000 | 500 | 83% |
| **Total** | **163,000** | **~20,000** | **88%** |

### Performance Impact

```
Proof Generation Time:
├── Current: 30 seconds
├── With Lookups: 3-5 seconds
└── Target achieved: 10x improvement ✓

Verification Gas (on-chain):
├── Current: ~4M gas
├── With Lookups: ~500K gas (8x reduction)
└── Reason: Smaller proof size + simpler verifier
```

## Implementation Roadmap

### Phase 1: NTT Lookup (Week 1-2)

1. Implement ZETAS lookup table in Plonky3
2. Modify NTT circuit to use lookup constraints
3. Verify correctness with KAT tests
4. Benchmark constraint reduction

### Phase 2: Keccak Lookup (Week 3-4)

1. Generate S-box lookup table
2. Replace χ step constraints with lookups
3. Verify Keccak output matches reference
4. Measure performance improvement

### Phase 3: Range Check Lookup (Week 5)

1. Implement configurable range tables
2. Replace coefficient bound checks
3. Optimize table sizes for proof efficiency

### Phase 4: Integration & Testing (Week 6)

1. Full integration testing
2. Security review of lookup argument soundness
3. Performance benchmarking
4. Documentation update

## Technical Considerations

### Lookup Argument Soundness

The lookup argument must satisfy:
1. **Completeness**: Valid lookups always succeed
2. **Soundness**: Invalid lookups fail with overwhelming probability
3. **Zero-knowledge**: Table entries don't leak witness information

### Table Size Trade-offs

```
Larger Tables:
├── ✓ Fewer constraints per lookup
├── ✓ More operations can be "looked up"
├── ✗ Larger proving key
└── ✗ More memory during proving

Optimal Size:
├── ZETAS: 256 entries (required for NTT)
├── Keccak S-box: 32 entries (5-bit input)
└── Range: 2^16 entries (covers coefficient bound)
```

## Code Examples

### Plonky3 Lookup Definition

```rust
use p3_air::{Air, LookupGate};
use p3_field::Field;

pub struct DilithiumCircuit<F: Field> {
    // Main columns
    pub ntt_input: Vec<F>,
    pub ntt_output: Vec<F>,

    // Lookup tables
    pub zetas_table_id: usize,
    pub sbox_table_id: usize,
    pub range_table_id: usize,
}

impl<F: Field> Air<F> for DilithiumCircuit<F> {
    fn lookup_tables(&self) -> Vec<LookupTable<F>> {
        vec![
            // ZETAS table: 256 entries
            LookupTable::new(
                self.zetas_table_id,
                (0..256).map(|i| vec![F::from(i), F::from(ZETAS[i])]).collect()
            ),
            // S-box table: 32 entries
            LookupTable::new(
                self.sbox_table_id,
                (0..32).map(|i| vec![F::from(i), F::from(sbox(i))]).collect()
            ),
            // Range table: 2^16 entries
            LookupTable::new(
                self.range_table_id,
                (0..(1<<16)).map(|i| vec![F::from(i)]).collect()
            ),
        ]
    }
}
```

## References

1. Plookup: A simplified polynomial protocol for lookup tables
   https://eprint.iacr.org/2020/315

2. Halo2 Lookup Argument
   https://zcash.github.io/halo2/design/proving-system/lookup.html

3. Dilithium NIST Specification (FIPS 204)
   https://csrc.nist.gov/pubs/fips/204/final
