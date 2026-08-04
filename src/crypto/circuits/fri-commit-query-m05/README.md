# fri-commit-query-m05 — M0.5-impl method-A binding step

§17 (`fri-fold-m05`) proves a per-query FRI fold chain, but takes the layer
openings `(aᵢ, cᵢ)` as **public assertions** — nothing ties them to a
commitment. §16 (`recursion-merkle-m05`) proves a Poseidon2 Merkle opening
binds a leaf to a committed root. This crate composes the two by the same
**public glue** M2d / M3 / §20 use, so the FRI query's entry opening is no
longer free:

- the **fold** proof (§17 AIR) verifies the R-round fold chain, and
- the **Merkle** proof (§16 AIR) verifies that a leaf is committed under the
  layer-0 root, and
- the **glue** requires the fold's round-0 opening pair `(a₀, c₀)` to equal
  that committed leaf (`leaf = [a₀, c₀, 0…]`).

The composition accepts iff both proofs verify **and** the glue holds. This
converts the fold entry opening from a free public input into a value provably
bound to a commitment root — closing the "openings asserted, not committed"
gap named in §20.4 / §21.5.

## Why the binding holds

For a **fixed** layer-0 root (the published commitment to the real codeword),
the Merkle AIR accepts only if `leaf‖path` hashes to that root. You cannot
produce a different leaf with a valid path to a fixed root, so the entry
opening cannot be forged:

- forge the fold `a₀` while keeping the commitment → the glue breaks (fold
  opening ≠ committed leaf);
- try to re-commit the forged opening in the Merkle leaf while keeping the root
  → the Poseidon2 path no longer hashes to the root, Merkle proof rejects.

## Tamper battery (BabyBear, R=8, D=8)

```
                        case |   total_ms |  total_bytes |  expected | result
                      honest |      352.3 |       340136 |    accept |   PASS
         forge-fold-a0(glue) |      415.0 |       340136 |    reject |   PASS   # opening != committed leaf
         recommit-leaf(root) |      215.6 |       340136 |    reject |   PASS   # forged leaf has no path to root
                  forge-root |      354.5 |       340136 |    reject |   PASS
          forge-fold-mid(r3) |      294.4 |       340136 |    reject |   PASS
            forge-fold-final |      314.0 |       340136 |    reject |   PASS
```

honest accept + 5/5 tamper reject.

## What this establishes / what remains

This anchors the FRI query to the committed codeword (layer 0). Each subsequent
FRI layer opening binds to its own per-layer root the same way — an R-fold
repetition of this construction. The remaining M0.5-impl work is unchanged and
env-gated: verify the four segment proofs *in-circuit* so the roots used here
are the inner proof's real commitments rather than supplied paths (full
recursion; the aggregated Groth16 VK regeneration needs a proving CI). See
`docs/core/STARK_AIR_GAP_ANALYSIS.md` §22.

## Run

```bash
cargo run --release
```
