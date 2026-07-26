# keccak-m0 — M0 PoC benchmark

Real Plonky3 `p3-keccak-air` benchmark for **Keccak-f[1600]** proving —
the permutation underlying SHAKE256, the core hash of SPHINCS+-SHAKE-128s
(the Prover signature scheme that FR-THRESH-1 must prove in-circuit).

This is the M0 milestone of `docs/core/STARK_AIR_GAP_ANALYSIS.md`
(R-2 / FR-THRESH-1): a **build-vs-buy** measurement for the SPHINCS+ AIR.

Unlike the sibling `../plonky3-poc` (which *simulates* FRI and no longer
compiles against the pinned Plonky3 revision), this crate drives the real
`prove` / `verify` path and reports wall-clock time and serialized proof size.

## Run

```bash
cargo run --release
```

Output columns: batch permutation count, prove ms, verify ms, serialized
proof bytes, µs per permutation, verification result.

## Config

- Field: Goldilocks + degree-2 extension
- Commitment: Keccak-based Merkle MMCS, `TwoAdicFriPcs`
- FRI: `log_blowup=3` (8×), `num_queries=100`, `pow=16` — conservative
  ~100-bit settings, not the library's benchmark defaults.
- Single-threaded (the `parallel` feature is intentionally off so the
  numbers are a floor; enable `p3-maybe-rayon/parallel` for multicore).

## Key finding

Proof size is ~2.5–2.8 MB regardless of batch — far above the L1 calldata
limit. On-chain verification therefore needs a wrapping/recursion step
(milestone M0.5), not a direct submission of the raw STARK. See
`docs/core/STARK_AIR_GAP_ANALYSIS.md` §5 for the full analysis.
