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
3. **Single signature.** N-of-M aggregation, threshold counting, signer
   deduplication, and binding the `ProverRegistry` active-set commitment
   (FR-THRESH-5, gap analysis §6) all fit this same framework — each signature
   as its own table — but are not implemented yet.

```bash
cargo run --release --example bound_full   # full-scale bound measurement
```
