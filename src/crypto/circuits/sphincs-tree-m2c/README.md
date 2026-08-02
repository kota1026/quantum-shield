# sphincs-tree-m2c — M2c SPHINCS+ tree pipeline AIR (SPHINCS+-SHAKE-128s)

M2b (`../wots-sig-m2b`) closed the signature-verification form of the WOTS+
chains. This crate closes the remaining *tree-side* mechanisms of a SPHINCS+
signature in a fixed pipeline of 30 Keccak-f[1600] permutations:

| Slots | Stage | Mechanism |
|-------|-------|-----------|
| 0 | FORS leaf F(sk) | fresh single-block absorption |
| 1-12 | FORS auth path (a=12) | H climbs, direction-bit chaining |
| 13-15 | T_k over 14 FORS roots (272 B) | **multi-block: 2 data + 1 pad block** |
| 16-20 | T_len over 35 WOTS+ pk elements (608 B) | **multi-block: 5 blocks** |
| 21-29 | XMSS auth path (h'=9) | H climbs, direction-bit chaining |

## New mechanisms over M2a/M2b

- **XOR-linked multi-block absorption** (the M2c core risk, per §9.5 of the
  gap analysis): continuation permutations must satisfy
  `input = previous output XOR next block` on the rate and a verbatim
  capacity carry. 1,088 committed columns hold the bit decomposition of the
  feeding permutation's rate output (bound by booleanity + limb
  recomposition); the absorbed blocks are *public* (pk elements, sibling
  roots, padding), so `o XOR b = o + b - 2bo` stays linear in the committed
  bits and every constraint remains within keccak-air's degree-3 budget.
  No lookup argument is needed.
- **Merkle auth-path chaining**: the running node lands in the left or right
  H-input position according to the public direction bit (c67/c89 flags);
  the sibling auth node is public-table-bound in the other position.
- **In-trace stage glue**: adjacent stages chain directly (FORS root ->
  T_k block 0, T_len output -> XMSS climb 1), so only the pipeline's outer
  interfaces (FORS pk = the WOTS+ message, XMSS root) are public outputs.
- **Public-table binding of all structure**: PK.seed, the per-slot FIPS 205
  ADRS (types FORS_TREE / FORS_ROOTS / WOTS_PK / TREE, tree heights and
  indices), SHAKE256 padding, and zero capacity are bound through per-slot
  public rate tables derived natively by the verifier — nothing structural
  is taken from the prover.

## What is NOT yet constrained (M2d)

- The WOTS+ chains themselves (M2b's circuit — the two traces are glued via
  the public pk elements and the FORS pk / message digits, not yet unified).
- H_msg (binding the FORS indices and message digest to the signed message),
  the 7-layer hypertree repetition, and FIPS 205 KAT.

## Run

```bash
cargo run --release
```

Proves the honest witness (must accept) and 10 tampered cases (tampered
continuation block, broken capacity carry, wrong auth node, wrong climb
direction, wrong ADRS tree height, forged sk / pk element in a fresh block /
pk element in a continuation block / FORS pk / root — all must reject).
Every tampered trace still contains only valid Keccak-f permutations. FRI
parameters match M0..M2b (log_blowup=3, 100 queries, 16-bit PoW,
single-threaded).

Results feed `docs/core/STARK_AIR_GAP_ANALYSIS.md` §10.
