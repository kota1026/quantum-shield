# sphincs-m2 — full SLH-DSA-SHAKE-128s verification witness

M2 milestone of `docs/core/STARK_AIR_GAP_ANALYSIS.md` (G1/G7 of FR-THRESH-1).

M1 (`../sphincs-m1`) proved a single WOTS+ chain. This crate implements the
**complete FIPS 205 verification path** — `H_msg`, FORS (k=14 trees of height
a=12), the WOTS+ layer (len=35 chains), and the d=7 hypertree — emitting every
Keccak-f[1600] permutation input so the AIR trace and the reference
implementation are literally the same code path.

## Correctness: cross-validated, not self-consistent

The crate's own tests would not catch a shared misreading of the spec, so
correctness is pinned against the **independent RustCrypto `slh-dsa`
implementation** (dev-dependency): it generates the keypairs and signatures,
and our verifier must accept them and reject every tampering class
(message, randomizer R, FORS signature, hypertree auth path, public key root,
context).

```bash
cargo test    # 15 tests: FIPS 202 KATs, parameter-set sizes, address encoding,
              # block-structure permutation counts, oracle acceptance, tampering
```

## Measured (2026-08-06)

```bash
cargo run --release --example prove_verification
```

Permutations per full verification, over 8 real signatures:

| | permutations |
|---|---:|
| structural fixed cost | 284 |
| measured min | 1,994 |
| measured avg | **2,144** |
| measured max | 2,354 |

The variable part is the WOTS+ chains: each of the `d × len = 245` chains runs
`w - 1 - digit` times, so the total moves with the message digest.

Proving that batch with `p3-keccak-air` (production FRI: log_blowup=3,
100 queries, pow=16; 8 cores):

| perms | rows | prove | verify | proof |
|------:|-----:|------:|-------:|------:|
| 2,084 | 65,536 | **287 s** | 17.3 ms | 2,899,532 B |

### Caveats on that number

- **Memory-bound on this host.** The trace alone is 65,536 × 2,633 × 8 B ≈
  1.38 GB, and the 8× LDE multiplies that, on an 8 GB machine. Per-permutation
  cost here (138 ms) is ~2.3× the M0 single-threaded figure (59 ms) — that is
  hardware pressure, not algorithmic growth. Treat 287 s as an **upper bound**;
  a proving host with adequate RAM will be substantially faster.
- **Permutations only.** The cross-hash linking constraints (which output feeds
  which input) are M3 work — see below. This measures the Keccak cost, which is
  the dominant term, not the finished circuit.

### NFR-3 verdict

NFR-3 requires proof generation ≤ 1 h (p99). One signature costs ~5 min on a
deliberately under-provisioned host; a 2-of-N threshold proof is ~2× that.
**NFR-3 has more than an order of magnitude of margin** — the binding
constraint for FR-THRESH-1 remains proof *size* (M0.5 wrapping), not time.

## What M3 needs (and why it is not here)

M1's AIR could link permutations with plain positional constraints because a
WOTS+ chain is a **line**: permutation *i*'s output is permutation *i+1*'s
input, always at the same trace offset. Full SPHINCS+ verification is a
**DAG** — FORS roots feed `T_k`, the WOTS+ public key feeds the tree hashes,
each layer's root feeds the next layer's WOTS+ message — so the producer of a
given input is not at a fixed offset and cannot be addressed positionally.

The pinned Plonky3 revision ships what this needs:

- `p3-lookup` — LogUp (`logup.rs`, `lookup_traits.rs`), including **global**
  lookups across tables (`LookupData`), and
- `p3-batch-stark` — multi-table proving with shared challenges.

The M3 design is therefore: a Keccak table (this witness) plus a linking table,
joined by a LogUp argument over `(hash_id, digest)` tuples — every consumed
input must be provably some produced output. That also solves M3's other
requirements (aggregating N signatures, threshold counting, binding the
`ProverRegistry` active-set commitment from FR-THRESH-5) in the same framework,
and it keeps the per-signature traces separate rather than forcing one
65K+ row monolith — which the memory note above shows matters.
