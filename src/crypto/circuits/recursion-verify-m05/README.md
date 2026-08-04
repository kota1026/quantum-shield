# recursion-verify-m05 — M0.5-impl method-A integration

Composes the four recursive-verifier AIRs into end-to-end verification of an
inner FRI proof:

| Segment | AIR | crate |
|--|--|--|
| Poseidon2 Merkle-opening (per-query re-hash) | `merkle_air` | §16 |
| FRI fold (per-query fold-and-check) | `fold_air` | §17 |
| Fiat-Shamir transcript replay | `transcript_air` | §18 |
| DEEP-ALI constraint consistency | `deep_air` | §19 |

A single runner proves each segment with its own AIR and binds their
interfaces by **public glue** — the same composition M2d (15-proof
signature) and M3 (threshold) use:

- **glue-1**: the transcript's first observed commitment == the Merkle root;
- **glue-2**: each FRI-fold `beta_i` == the transcript's squeezed challenge;
- **glue-3**: the fold's initial evaluation == the opened Merkle leaf;
- **glue-4**: the DEEP trace opening == the fold's final evaluation.

Honest: all four proofs verify and all four glue checks hold. Each
cross-segment tamper (a fold beta ≠ the transcript's challenge, an observed
root ≠ the Merkle root, …) keeps every individual proof valid but breaks a
glue link — rejected.

## What this establishes / what remains

This shows the four AIRs verify an inner proof end-to-end when their
interfaces are consistent — the recursive verifier's logic is complete and
composable. The remaining M0.5-impl work is to make the composition itself
*succinct*: either (a) fold the four segments into a single trace with the
glue enforced by in-AIR constraints instead of a native runner, or (b)
recursively aggregate the four proofs, and then wrap the final proof with
the Groth16 path already built and gas-measured in §14 (a verifying-key
swap in `Groth16WrapVerifier.sol`).

## Measured (BabyBear)

honest end-to-end accepts (4 proofs, ~0.9 s total prove, ~0.7 MB total);
breaking any of the four glue links is rejected. See
`docs/core/STARK_AIR_GAP_ANALYSIS.md` §20.

## Run

```bash
cargo run --release
```
