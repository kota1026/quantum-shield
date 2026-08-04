# wrap-recursion-m05 — M0.5-impl recursion groundwork

Recursive aggregation of the QS proof composition (M2d/M3) needs the inner
proofs' verifier to be cheap **inside a circuit**. The dominant in-circuit
cost is the commitment hash re-evaluated on every opened Merkle node. This
crate measures the swap that makes recursion tractable: the production
**Keccak-MMCS** (M0..M4) vs a recursion-friendly **Poseidon2-MMCS**, proving
identical keccak-air batches over the same Goldilocks field and FRI
parameters.

## Finding

Proof size is identical and native verify is the same order under both;
native prove is ~4x slower under Poseidon2 **only because the pinned
Plonky3 `Poseidon2Goldilocks` is an unoptimized implementation** (its source
says so; the BabyBear variant is vectorized). The metric that matters for
recursion — in-circuit cost per Merkle node — drops from Keccak-f[1600]
(~150k constraints) to Poseidon2-width-8 (~300 constraints), ~500x. The swap
is therefore the mandatory first step of M0.5-impl (recursion method A).

See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §15 for the full table and the
recursion-architecture decision matrix.

## Run

```bash
cargo run --release
```
