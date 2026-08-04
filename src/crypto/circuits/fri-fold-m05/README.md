# fri-fold-m05 — M0.5-impl method-A component 2

The FRI folding-consistency AIR: the fold-and-check a recursive FRI verifier
runs for **every query**, as a native-field AIR. Together with the Poseidon2
Merkle-opening AIR (`../recursion-merkle-m05`, §16) it covers the two
per-query inner loops of recursive FRI verification (§15, method A).

## What it checks

Per FRI query, each row is one folding round holding the running evaluation
`e_i`, the two sibling openings `a_i = p_i(x_i)`, `c_i = p_i(-x_i)`, the round
challenge `beta_i` and the domain point `x_i`. Constraints:

- **consistency** — `e_i` equals the opening at the actual query point (the
  public index bit selects `a_i` or `c_i`);
- **fold** — `2*x_i*e_{i+1} = x_i*(a_i + c_i) + beta_i*(a_i - c_i)`, i.e.
  `e_{i+1} = (a+c)/2 + beta*(a-c)/(2x)`, chained into the next round;
- **domain squaring** — `x_{i+1} = x_i^2`;
- **boundary** — first round binds the initial layer evaluation and domain
  point; the last round binds the final folded value.

Openings, challenges and index bits are public (from the FRI proof and the
transcript); the running evaluation and domain point are witnessed and
chained. All constraints are degree ≤ 3. FRI folding runs in the extension
field in production; the fold relation is field-agnostic, so the demo uses
base-field BabyBear.

## Remaining method-A components

Fiat-Shamir transcript replay (deriving `beta_i` and query indices
in-circuit) and the constraint/quotient consistency check (DEEP-ALI). With
those, the Merkle-opening (§16) and fold (§17) AIRs compose into the full
recursive verifier, whose final proof is wrapped by the Groth16 path (§14).

## Measured (BabyBear, R=8)

honest accepts (~148 ms prove, ~2 ms verify, ~105 KB proof); forged opening /
flipped index bit / wrong challenge / forged final / forged initial all
reject. See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §17.

## Run

```bash
cargo run --release
```
