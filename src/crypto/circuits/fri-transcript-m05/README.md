# fri-transcript-m05 — M0.5-impl method-A component 3

The Fiat-Shamir transcript-replay AIR: a recursive verifier must derive its
own FRI challenges (`beta_i`, query indices) in-circuit from the prover's
observed commitments, rather than trusting the prover's claimed challenges.
This crate does that with a **Poseidon2 duplex sponge** (overwrite mode,
rate = capacity = 8) over the same BabyBear width-16 permutation as
`../recursion-merkle-m05`.

## What it checks

Each row is one transcript round: it absorbs the round's observed commitment
into the rate lanes, keeps the running capacity, permutes (constrained by
`p3-poseidon2-air` via `SubAirBuilder`), and the squeezed output rate lanes
are the round's challenges. Constraints:

- **absorb** — input rate lanes equal the public observed commitment;
- **capacity IV** — first round's capacity is zero;
- **squeeze** — output rate lanes equal the public round challenges (which
  the FRI folding AIR, §17, consumes);
- **capacity carry** — each round's input capacity is the previous round's
  output capacity (the sponge chain);
- one-hot round walk (as §16/§17).

A forged observed commitment changes the derived challenge; a forged claimed
challenge fails the squeeze binding; reordering the transcript breaks the
capacity chain — all rejected.

## Remaining method-A component

DEEP-ALI: the constraint/quotient consistency check binding the opened
evaluations to the AIR constraints (§19, pending). With it, the four AIRs
(§16 Merkle-opening, §17 FRI fold, §18 transcript, §19 DEEP-ALI) compose into
the full recursive verifier, whose proof is wrapped by the Groth16 path
(§14).

## Measured (BabyBear, R=8)

honest accepts (~186 ms prove, ~5 ms verify, ~234 KB proof); forged observed
commitment / forged challenge / forged index lane / reordered transcript all
reject. See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §18.

## Run

```bash
cargo run --release
```
