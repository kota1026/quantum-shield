# wots-link-m2a — M2a linking AIR (SPHINCS+-SHAKE-128s)

M1 (`../wots-m1`) proved that the Keccak-f[1600] permutations a WOTS+ chain
performs are genuine, but keccak-air alone does not constrain *how the
permutations relate to each other*. This crate closes that gap — the explicit
M1 leftovers (a) inter-permutation chaining and (b) ADRS/padding structure —
for a full 35-chain WOTS+ unit (525 permutations).

## What is constrained

The trace is the unmodified p3-keccak-air trace horizontally extended with 42
link columns (`is_real`, `chain_step`, `links_next`, chain-first/last flags
with inverse witnesses, and a 35-wide one-hot chain selector). On top of the
full keccak-air round constraints (evaluated through `p3_uni_stark::SubAirBuilder`),
degree-≤3 constraints force:

1. **SHAKE256 absorption structure** — pad10*1 bytes (0x1F / 0x80) and zero
   capacity lanes for every real permutation.
2. **FIPS 205 ADRS layout** (WOTS_HASH) — public layer/tree/keypair, type = 0,
   chain address = one-hot chain index, hash address = step counter.
3. **Chaining** — the first 16 output bytes of step s are the message input of
   step s+1 (`links_next`-gated transition constraint).
4. **Public binding** — each chain's first message equals the public start
   value; each chain's final output equals the public end value (one-hot
   selected public inputs, 578 public values total).
5. **Shape** — the one-hot must walk chains 0..35 in order, 15 steps each;
   padding cannot begin early and is terminal, and the last trace row must be
   padding (backported from M2b: without it, a proof at a dishonestly small
   trace height could end mid-walk and leave later chains' end values
   unbound). The statement shape is fully
   forced by the constraint system.

## What is NOT yet constrained (M2b+)

- Variable-length chains driven by message digits (signature verification
  runs `w-1-digit` steps); M2a proves fixed full-length chains (pk-gen form).
- WOTS+ pk compression (T_len), FORS, and the hypertree — the remaining M2
  scope, plus FIPS 205 KAT.

## Run

```bash
cargo run --release
```

Proves the honest witness (must accept) and 7 tampered cases (broken chain
link, wrong hash/chain address, wrong ADRS type, forged start/end/pk_seed
public inputs — all must reject). Every tampered trace still contains only
valid Keccak-f permutations, i.e. M1's circuit accepts all of them; rejection
is delivered by the link constraints alone. FRI parameters match M0/M1
(log_blowup=3, 100 queries, 16-bit PoW, single-threaded).

Results feed `docs/core/STARK_AIR_GAP_ANALYSIS.md` §8.
