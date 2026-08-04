# recursion-merkle-m05 — M0.5-impl method-A component 1

The Poseidon2 Merkle authentication-path verifier AIR: the inner loop a
recursive FRI verifier runs for **every query opening** (§15 identified this
as the dominant in-circuit cost). Each trace row is one 2-to-1 Poseidon2
compression, constrained to be a correct permutation by `p3-poseidon2-air`
(via `SubAirBuilder`); appended link columns force the rows to form a Merkle
path and bind its leaf, root, siblings and index bits to public inputs.

Built over **BabyBear + Poseidon2** rather than Goldilocks: the pinned
Plonky3 only provides the Poseidon2 *AIR* linear layers for Monty31
(BabyBear/KoalaBear) and Mersenne31, and this is exactly §15's recommendation
— recursion belongs on a Monty31 field with the fast, in-circuit-cheap
Poseidon2.

## What it proves / what remains

- **This crate**: leaf → root Poseidon2 Merkle-path verification with
  public leaf/root/siblings/index, honest-accept + tamper-reject battery.
- **Remaining method-A components** (future M0.5-impl work): FRI folding
  (fold-and-check per round), the Fiat-Shamir transcript (challenger
  replay in-circuit), and the constraint/quotient consistency check
  (DEEP-ALI). Composed, these form the full recursive verifier AIR whose
  final proof is wrapped by the Groth16 path already built in §14.

## Measured (BabyBear, D=8, FRI log_blowup=3 / 100 queries / pow 16)

| | this AIR (Poseidon2) | M0..M4 (Keccak) |
|--|--|--|
| proof size | ~235 KB | 2.5–2.8 MB |
| verify | ~5 ms | ~35 ms |
| in-circuit re-hash / node | 1 Poseidon2-w16 (~hundreds of constraints) | Keccak-f[1600] (~150k) |

## Run

```bash
cargo run --release
```

Honest path accepts; forged root / leaf / sibling, flipped index bit, and a
wrong path against the honest root all reject. See
`docs/core/STARK_AIR_GAP_ANALYSIS.md` §16.
