# deep-ali-m05 — M0.5-impl method-A component 4 (final)

The DEEP-ALI constraint-consistency AIR: the last step of STARK verification,
recomputed in-circuit. A recursive verifier must check that the opened trace
and quotient evaluations satisfy the AIR constraints at a random
out-of-domain point `zeta`, via the DEEP quotient identity

```
C(t(zeta), t(zeta*g)) = Z_H(zeta) * q(zeta)
```

where `Z_H(x) = x^n - 1` vanishes on the size-`n` trace domain.

## What it checks

For the demo inner constraint `C = t(zeta*g) - t(zeta)^2` (a squaring
transition), the AIR:

- recomputes `Z_H(zeta) = zeta^n - 1` through an **in-AIR squaring chain**
  (`p_0 = zeta`, `p_{i+1} = p_i^2`, `p_LOG_N = zeta^n`), so the prover cannot
  lie about `zeta^n`;
- binds the openings `t0 = t(zeta)`, `t1 = t(zeta*g)`, the quotient
  `q = q(zeta)` and `zeta` to public inputs;
- asserts `t1 - t0^2 == (zeta^n - 1) * q` on the last chain row.

Forged trace openings, a forged quotient, or a forged out-of-domain point
(which changes `zeta^n`) all reject. Degree ≤ 3.

## Method A is now component-complete

The four recursive-verifier components are implemented and measured:

| Component | Crate | Doc |
|--|--|--|
| Merkle-opening (per-query re-hash) | `recursion-merkle-m05` | §16 |
| FRI fold (per-query fold-and-check) | `fri-fold-m05` | §17 |
| Fiat-Shamir transcript replay | `fri-transcript-m05` | §18 |
| DEEP-ALI constraint consistency | `deep-ali-m05` | §19 |

Remaining M0.5-impl work is **integration**: stitch the four into one
recursive-verifier AIR that verifies a full inner proof, and wrap its final
proof with the Groth16 path already built and gas-measured in §14.

## Measured (BabyBear, n=2^10)

honest accepts (~142 ms prove, ~2 ms verify, ~129 KB proof); forged t1 / t0 /
quotient / zeta / out-of-domain point all reject. See
`docs/core/STARK_AIR_GAP_ANALYSIS.md` §19.

## Run

```bash
cargo run --release
```
