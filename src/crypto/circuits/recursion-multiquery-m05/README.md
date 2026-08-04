# recursion-multiquery-m05 — M0.5-impl method-A recursion step (§24)

§22 (`fri-commit-query-m05`) and §23 (`fri-alllayer-query-m05`) bound FRI
openings to Poseidon2 commitments, but each opening had its **own fabricated
root** — a Merkle path built from random siblings. A real FRI layer is the
opposite shape: it commits **one** codeword root and opens ~100 **distinct**
query indices into that same root. The recursive verifier re-hashes each
query's authentication path back to the one commitment.

This crate builds that shape:

- **commit** a real codeword — a vector of `2^D = 256` leaf digests — into one
  Poseidon2 Merkle tree, built bottom-up with the **same** 2-to-1 truncated
  permutation the §16 AIR re-hashes (`layers[D][0]` is the committed root);
- **open** `K = 8` distinct query indices, each yielding a real leaf, its real
  sibling digests along the path, and per-level direction bits from the index;
- **verify** each opening with the §16 recursion Merkle-opening AIR, and require
  every query to carry the **same** root.

Honest: all `K` query openings hash back to the single committed root.

## Why the single-root binding holds

Each query's path is the real node chain the tree built, so it hashes to the
real root. The verifier accepts a query only if `leaf‖path` hashes to the root
it claims:

- forge one query's **sibling** or **leaf**, or flip a **direction bit** → only
  that query's path fails to reach the root;
- forge the **shared root** → every query fails (single-root binding);
- verify a query against a **foreign codeword's** root → fails; the openings are
  bound to *this* commitment.

## Tamper battery (BabyBear, D=8, K=8; indices 5,42,79,116,153,190,227,8; Q=3)

```
                        case |   total_ms |  total_bytes |  expected | result
    honest(K queries,1 root) |      765.5 |      1878176 |    accept |   PASS
            forge-sibling[q] |      716.7 |      1878176 |    reject |   PASS
             flip-dir-bit[q] |      836.3 |      1878176 |    reject |   PASS
               forge-leaf[q] |      890.4 |      1878176 |    reject |   PASS
      forge-shared-root(all) |     1001.3 |      1878176 |    reject |   PASS
             foreign-root[q] |      759.8 |      1878176 |    reject |   PASS
```

honest `8/8` queries verified against one committed root + 5/5 tamper reject.

## What this establishes / what remains

The recursion Merkle-opening verifier now consumes a **real multi-query opening
set of one real commitment** — the structure a real inner proof's per-layer
openings have, a step past §23's per-opening fabricated roots. The remaining
M0.5-impl work is env-gated: bind this root to an actual inner proof's
transcript / FRI / DEEP relations (so the root is the inner proof's real
commitment) and regenerate the aggregated Groth16 VK (needs a proving CI). M5
testnet E2E stays gated on RPC allowlist + a funded `QS__L1_PRIVATE_KEY`
(§14.5 / §15.6). See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §24.

## Run

```bash
cargo run --release
```
