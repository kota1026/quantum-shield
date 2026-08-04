# fri-alllayer-query-m05 — M0.5-impl method-A binding step (§23)

§22 (`fri-commit-query-m05`) bound only the FRI **entry** opening `(a₀, c₀)` to
the layer-0 Poseidon2 commitment. Every **inner** layer opening `(aᵢ, cᵢ)` for
`i > 0` was still a free public input — self-consistent within the fold chain,
but not tied to that layer's real commitment. This crate closes that residual
gap by the **R-fold repetition** §22.5 named: it applies the §22 construction to
every FRI fold round.

- the **fold** proof (§17 AIR) verifies the R-round fold chain, and
- for **each** layer `i`, a **Merkle** proof (§16 AIR) verifies that layer's
  opening leaf `[aᵢ, cᵢ, 0…]` is committed under an independent layer root
  `rootᵢ`, and
- the per-layer **glue** requires the fold's round-`i` opening pair `(aᵢ, cᵢ)`
  to equal that layer's committed leaf.

The composition accepts iff the fold proof verifies **and**, for every layer,
its Merkle proof verifies **and** its glue holds. The FRI query is now anchored
to a committed codeword at **every** layer, not just the entry.

## Why the per-layer binding holds

Each layer `i` has its **own** fixed root `rootᵢ` (the published commitment to
that layer's codeword). The Merkle AIR for layer `i` accepts only if
`leafᵢ‖pathᵢ` hashes to `rootᵢ`, so no layer's opening can be forged:

- forge the fold `aᵢ` while keeping the commitments → layer `i`'s glue breaks;
- re-commit the forged opening in layer `i`'s leaf while keeping `rootᵢ` → that
  layer's Poseidon2 path no longer hashes to `rootᵢ`;
- **swap** one layer's root for another's → each honest path hashes to its own
  root, so the layer whose PI root was replaced no longer matches. The fold
  chain cannot catch this (openings unchanged, chain still valid) — only the
  per-layer commitment binding does. This is the distinctive §23 property.

## Tamper battery (BabyBear, R=8, D=8; MID=4, LAST=7)

```
                        case |   total_ms |  total_bytes |  expected | result
                      honest |      761.6 |      1983540 |    accept |   PASS
     forge-fold-a[mid](glue) |      799.6 |      1983540 |    reject |   PASS   # opening != committed leaf
    recommit-leaf[mid](root) |      757.0 |      1983540 |    reject |   PASS   # forged mid leaf has no path to root
             forge-root[mid] |      844.8 |      1983540 |    reject |   PASS
         recommit-leaf[last] |      705.7 |      1983540 |    reject |   PASS   # last layer now bound (§22 lacked this)
            forge-root[last] |      796.3 |      1983540 |    reject |   PASS
       cross-layer-root-swap |      753.4 |      1983540 |    reject |   PASS   # layer bound to ITS OWN commitment
            forge-fold-final |      913.6 |      1983540 |    reject |   PASS
```

honest accept + 7/7 tamper reject. Proof volume = fold proof + R=8 per-layer
Merkle proofs.

## What this establishes / what remains

Every FRI layer opening the fold chain consumes is now bound to a per-layer
Poseidon2 commitment — the FRI query is anchored to a committed codeword at each
layer. The remaining M0.5-impl work is unchanged and env-gated: verify the four
segment proofs *in-circuit* so the layer roots used here are the inner proof's
real commitments rather than supplied paths (full recursion; the aggregated
Groth16 VK regeneration needs a proving CI). See
`docs/core/STARK_AIR_GAP_ANALYSIS.md` §23.

## Run

```bash
cargo run --release
```
