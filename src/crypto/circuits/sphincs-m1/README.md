# sphincs-m1 — SHAKE256 permutation AIR + WOTS+ chain circuit

M1 milestone of `docs/core/STARK_AIR_GAP_ANALYSIS.md` (G1 / FR-THRESH-1):
the first circuit that proves a real piece of SPHINCS+-SHAKE-128s
verification — a WOTS+ hash chain — rather than isolated permutations.

Builds on the M0 "buy" decision: `p3-keccak-air` (pinned Plonky3 revision,
same as `../keccak-m0`) proves each Keccak-f[1600] permutation; this crate
adds what keccak-air does not constrain:

- **Sponge/witness layer** (`shake.rs`, `wots.rs`): SHAKE256 (FIPS 202,
  KAT-pinned against Python `hashlib`), the FIPS 205 F function
  (`SHAKE256(pk_seed ‖ ADRS ‖ value, 16)` — exactly one permutation per
  call for the 128s parameter set), and `chain()` witness generation.
- **Chaining AIR** (`air.rs`): 4 extra columns over `KeccakCols`
  (`is_real`, `is_result`, `inv`, `seen`). Cross-permutation constraints
  enforce that each next preimage is the previous block with
  (value ← squeezed output, hash address += 1), the initial sponge state is
  pinned to public values on the first row, and the chain result is bound
  to public values on a result row whose position is *forced* by an is-zero
  gadget on the hash address (existence via the `seen` accumulator,
  uniqueness via booleanness). KeccakAir itself is reused unmodified via
  `SubAirBuilder`.

## Statement

Public inputs (109 Goldilocks elements): initial sponge state (100 limbs),
final hash-address limb, 16-byte chain result (8 limbs). The proof attests:
starting from the public block, F was applied step-by-step (hash address
incrementing) until the public end address, yielding the public result.

## Run

```bash
cargo test           # KATs, witness consistency, prove/verify, 3 tamper-rejection tests
cargo run --release  # production-FRI benchmark (log_blowup=3, 100 queries, pow=16)
```

## Measured (2026-08-06, single-threaded, production FRI)

| steps | rows | prove (ms) | verify (ms) | proof (bytes) |
|------:|-----:|-----------:|------------:|--------------:|
| 7 | 256 | 356 | 11.9 | 2,465,820 |
| 15 (full chain) | 512 | 380 | 12.2 | 2,509,860 |

Proof size stays ~2.5 MB (dominated by FRI query openings — same M0
finding), reconfirming that **M0.5 (proof wrapping) is required before any
on-chain integration**. Prove time for a full chain is far below the M2
budget (NFR-3 ≤ 1h).

## M0.5 inputs

Two additional binaries feed the wrapping analysis
(`docs/core/STARK_AIR_GAP_ANALYSIS.md` §8):

```bash
cargo run --release --bin fri_scan        # proof size vs FRI params at ~constant security
cargo run --release --bin poseidon2_mmcs  # strategy A: Poseidon2 vs Keccak MMCS cost
```

Findings: even at 256× blowup the raw STARK stays ~1.07 MB (wrapping is
mandatory); switching the MMCS to Poseidon2 (SNARK-wrap prerequisite) costs
~4.8× prove time (0.4 s → 2.0 s) with identical proof size — negligible
against NFR-3.

## Not yet covered (M2+)

- T_l / PRF tree hashes with longer inputs (multi-block absorb in-circuit)
- FORS + hypertree verification (M2), aggregation + registry commitment (M3)
- The message-digit → chain-length mapping (base-w encoding) — the chain
  length here is a public input, not yet derived from a signed message
