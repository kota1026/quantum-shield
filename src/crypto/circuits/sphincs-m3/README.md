# sphincs-m3 — DAG linking via LogUp (M3 PoC)

M3 proof-of-concept for `docs/core/STARK_AIR_GAP_ANALYSIS.md` §9.5.

M1 linked Keccak permutations with **positional** constraints, which works
because a WOTS+ chain is a line: permutation *i*'s output is permutation
*i+1*'s input, always at the same trace offset. M2 established that full
SPHINCS+ verification is a **DAG** — FORS roots feed `T_k`, the WOTS+ public
key feeds the tree hashes, each hypertree layer's root feeds the next layer's
WOTS+ message — so a consumed value's producer is not at a fixed offset and
cannot be addressed positionally.

This crate implements the replacement: a **global LogUp lookup** joining two
tables, so that *every digest consumed as a hash input was produced by some
hash*.

```text
producer table  rows: [d0 d1 d2 d3 | mult]   Send    (mult = times consumed)
consumer table  rows: [d0 d1 d2 d3 | sel ]   Receive (sel  = 1 on real rows)
                        └─ 16-byte digest as four 32-bit limbs
```

Built on `p3-lookup` (LogUp, global interactions) and `p3-batch-stark`
(multi-table proving with shared challenges), both present in the pinned
Plonky3 revision the other circuits use.

## Driven by a real DAG

The tables are not synthetic: `sphincs-m2` verifies a signature produced by
the independent RustCrypto `slh-dsa` implementation, records the hash-call
DAG, and this crate turns that DAG into the two traces.

```bash
cargo test                                  # 3 tests (see below)
cargo run --release --example link_overhead # measurement
```

## Measured (2026-08-06)

Real SLH-DSA-SHAKE-128s verification:

| | |
|---|---:|
| hash calls (produced digests) | 2,144 |
| internal edges (consumed) | 2,135 |
| external inputs (signature / public key) | 491 |
| table rows (each) | 4,096 × 5 cols |

Proving both tables (production FRI: log_blowup=3, 100 queries, pow=16):

| configuration | prove | verify |
|---|---:|---:|
| with LogUp linking | 150.2 ms | 3.7 ms |
| baseline, same traces, no lookup | 81.3 ms | — |

**Linking overhead: 1.8× on the linking tables — and negligible overall.**
The Keccak table for the same verification costs ~287 s (see `../sphincs-m2`),
so the entire DAG-linking argument adds ~0.05 % to the proof. The DAG was the
open design question after M2; it turns out not to be a cost problem.

## Tests

- `links_a_real_verification_dag` — the real DAG's global sum is zero and the
  batch proof verifies.
- `rejects_a_fabricated_consumed_digest` — an input digest no hash produced
  breaks the argument (this is the property M1 got positionally).
- `rejects_wrong_producer_multiplicity` — the prover cannot over-declare how
  often an output is used.

## Bound configuration — the producer *is* the Keccak table

The standalone tables above measure the argument; they do not make it sound,
because a prover could add a producer row for an invented digest. `bound.rs`
+ `keccak_link.rs` close that: `KeccakDigestAir` wraps `p3-keccak-air` with
two columns and sends the tuple **read straight out of the Keccak output
columns**, so a digest offered to a consumer is necessarily the output of a
permutation the Keccak AIR proved.

```text
[ KeccakCols (2633) | is_digest | mult ]   Send  (digest = output_limb(0..8))
[ d0 d1 d2 d3       | sel       ]          Receive
```

The digest is state words 0 and 1 — keccak-air's `output_limb(0..8)` in
16-bit limbs — recombined pairwise into the same four 32-bit elements the
consumer uses. Three AIR constraints keep the publication honest:

- `is_digest` is boolean;
- `is_digest ⇒ step_flags[23]` — a digest may only be published on a
  permutation's final round row, where the output state is valid;
- `mult ≠ 0 ⇒ is_digest` — padding and mid-permutation rows cannot contribute.

Tests (`witness.rs` supplies a real FORS-tree authentication-path
recomputation: a leaf `F` plus `a = 12` node hashes with genuine
`FORS_TREE` addresses):

- `binds_digests_to_the_keccak_trace` — verifies.
- `rejects_a_digest_no_permutation_produced` — a digest outside the Keccak
  trace is rejected; unlike the standalone PoC there is nowhere to add a
  producer row for it.
- `rejects_a_digest_published_off_the_final_round` — caught while proving.
- `rejects_multiplicity_without_a_published_digest` — caught while proving.

### Full-scale measurement (2026-08-06)

The bound configuration over a whole real verification — all 2,144
permutations in the Keccak table:

| | |
|---|---:|
| Keccak table | 65,536 × 2,635 |
| consumer table | 4,096 × 5 |
| prove | **345,990 ms (~5.8 min)** |
| verify | 141.5 ms |
| result | ✅ verifies |

For reference the same Keccak table with no linking at all (`../sphincs-m2`,
single-table uni-stark) proves in 287 s. The **+59 s (+21 %)** covers the whole
batch-STARK machinery — two tables, permutation traces, the two extra columns
and the LogUp argument — not the lookup alone; the standalone measurement
above puts LogUp itself at ~70 ms. Soundness for the DAG therefore costs about
a fifth of the Keccak cost, and the complete linked proof still lands at
~6 min per signature, an order of magnitude inside NFR-3.

## Registry membership — FR-THRESH-1(b)

`registry.rs` recomputes the FR-THRESH-5 active-set commitment
(`ProverRegistry.sol`, gap analysis §6) on the circuit side and verifies
Merkle inclusion **with permutation recording**, so a membership check lands
in the same Keccak witness as the signature verification:

```text
leaf = keccak256(LEAF_DOMAIN ‖ proverAddress(20B) ‖ sphincsPubKeyHash(32B))
node = keccak256(NODE_DOMAIN ‖ left ‖ right)
root = dense tree, zero-padded to a power of two (bytes32(0) when empty)
commitment = keccak256(SET_DOMAIN ‖ root ‖ uint256(count))
```

Correctness is pinned against **the contract, not against this code**: the
test vectors come from `src/l1/contracts/test/ProverSetCommitmentVectors.t.sol`
(`forge test --match-contract ProverSetCommitmentVectors -vv`), covering the
three domain separators, the leaf encoding, and root/commitment for sets of
0–5 members — the empty set, the single-leaf case with no node hashing, an
exact power of two, and two zero-padded sizes. Membership tests also reject
an outsider, a member claiming the wrong position, and a stale member count.

`sphincsPubKeyHash` stays SHA3-256 (CP-1) while the tree is keccak256, the
documented EVM-native exception; both are the same permutation, so both prove
in one Keccak table. `sphincs-m2`'s sponge is now domain-parameterised
(`shake256_parts` / `sha3_256_parts` / `keccak256_parts`) so all three share
one recording path.

## Threshold and deduplication — FR-THRESH-1(c)

`agg.rs` counts valid signatures over a fixed roster, one row per **active
prover slot** rather than per submitted signature:

```text
row i:  [ slot | valid | count | computed_root[4] | pk_root[4] ]
```

Indexing by slot is what makes **deduplication structural** — a prover has
exactly one row, so it cannot be counted twice, and no sorting argument or
range check is needed. `slot` is constrained to the row index, `valid` to be
boolean, `count` to be the running prefix sum, and the final `count` is bound
to the public input `valid_count`.

**`valid` is not a free witness.** A slot may claim `valid = 1` only if

- `computed_root == pk_root` — a SPHINCS+ verification succeeds exactly when
  the recomputed hypertree root equals `PK.root`, so this *is* the verdict; and
- `computed_root` is received from the `HASH_DAG` interaction with
  multiplicity `valid`, so it must be a digest the Keccak table produced.

Together these stop a prover from asserting a verdict over a root the circuit
never computed (`rejects_a_verdict_over_an_unproduced_root`).

`valid_count >= threshold` is deliberately left to L1: the count is a public
input, so `L1Vault` checks it with one comparison — cheaper than an in-circuit
range check and equally binding.

Tests cover 2-of-64, the empty and full rosters, and reject an inflated count,
a deflated count, a broken count chain, a non-boolean `valid`, and permuted
slots.

## Three interactions

| interaction | tuple | carries |
|---|---|---|
| `HASH_DAG` | 4 × 32-bit | 16-byte SPHINCS+ digests |
| `MERKLE_DAG` | 8 × 32-bit | 32-byte registry leaves and nodes |
| `PUBKEY_BIND` | 8 + 4 × 32-bit | `(sha3(PK.seed ‖ PK.root), PK.root)` |

The first two match on hash **outputs**. `PUBKEY_BIND` is the odd one out: it
also exposes a hash **input**, read from keccak-air's preimage columns
(`input_limb(8..16)` is `PK.root`, bytes 16..32 of the registered key).
Without it a slot could pair a legitimately-registered public-key hash with a
`PK.root` of its own choosing — output-only matching cannot see that.

Keeping 16- and 32-byte values in separate interactions, rather than padding
them into one tuple with a kind tag, avoids a degree-2 masking expression on
the producer side and makes confusing the two value spaces impossible.

## Scope — what this does *not* yet do

Deliberately, so the numbers above are not read as more than they are:

1. **Multi-block hash calls are only partly pinned.** A digest is published on
   a permutation's final round row, but nothing yet forces that permutation to
   be the *last block* of its hash call rather than an intermediate one. For
   `F` and `H` — single-block, and the overwhelming majority of the 2,144
   calls — there is no gap; it applies to `T_l` (3 or 5 blocks) and `H_msg`.
   Closing it needs the sponge/absorb structure in-circuit.
2. **Which producer feeds which consumer is not bound here.** A multiset
   argument proves a value *was produced*, not *where it belongs*; the
   surrounding AIR's address (`ADRS`) columns are what pin position in the
   real circuit.
3. **The Merkle root is not yet bound to a public commitment.** The chain
   `pubkey_hash -> leaf -> nodes -> root` is linked, but the final equality
   `keccak(SET_DOMAIN ‖ root ‖ count) == commitment` is still checked outside
   the circuit; it needs to become a public input.
4. **The aggregation slot is not yet tied to a specific signature's witness.**
   The verdict chain proves *a* root and *a* registered key; associating slot
   `i` with signature `i`'s own trace is the next step.
5. **Multiple signatures share one Keccak table today.** Giving each signature
   its own table (which `p3-batch-stark` supports directly) is what keeps the
   §9.4-2 memory ceiling manageable at N signatures.

```bash
cargo run --release --example bound_full   # full-scale bound measurement
```
