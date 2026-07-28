# wots-link-m2 — M2a PoC (chaining constraint)

De-risks the core of milestone M2: proving **in one AIR** that a hash chain is
correctly chained (step i's output is step i+1's input), which M1's
`p3-keccak-air` alone cannot express.

A custom Plonky3 `ChainAir` constrains `next.state == round(local.state)` as a
transition constraint, with public `[start, end]` bound to the first/last rows.
`round(x) = x^5 + RC` is a low-degree algebraic stand-in for the SPHINCS+
tweakable hash F; production replaces it with the Keccak-f permutation (M1) via
a lookup between this `state` column and the keccak-air I/O table.

## Run

```bash
cargo run --release
```

Output demonstrates the constraint binds:
- valid chain → verify ok
- tampered public `end` → rejected
- tampered intermediate step → rejected

See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §8 for how this fits M2.
