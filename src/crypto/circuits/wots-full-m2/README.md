# wots-full-m2 — M2b-1 PoC (full WOTS+ public-key derivation)

Extends M1 (single chain) to a complete SPHINCS+-SHAKE-128s WOTS+ instance:
base-w message decomposition + checksum + all `len=35` chains, proving every
Keccak-f permutation with `p3-keccak-air`. Each F is checked against the `sha3`
reference so the proven permutations are exactly FIPS-205 F.

## Run

```bash
cargo run --release
```

Measured (single-thread, conservative FRI): full WOTS+ pubkey = 300 Keccak-f
perms, prove ~12.8s, verify ~24ms, proof ~2.7MB, ok=true. Extrapolates to a
full signature (~8k perms) at ~5.7 min — consistent with M0/M1, within NFR-3.

Scope: proves the permutations. Chaining (M2a) and binding chains to keccak-air
via a cross-table lookup (M2b-2) compose on top — see
`docs/core/STARK_AIR_GAP_ANALYSIS.md` §8.
