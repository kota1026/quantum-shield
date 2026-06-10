# T1 / T1.5 — SP1 + fips204 ML-DSA-65 substrate + scaling spike

Source code for the Phase 2.5 substrate-validation gate. Result write-ups:

- T1 (N=1 substrate validation): [`docs/intelligence/research/2026-W21-T1-sp1-results.md`](../../docs/intelligence/research/2026-W21-T1-sp1-results.md).
- T1.5 (N=1..128 cycle-count scaling): [`docs/intelligence/research/2026-W21-T15-cycle-scaling.md`](../../docs/intelligence/research/2026-W21-T15-cycle-scaling.md).

## Layout

- `kat-gen/` — host-side helper. Emits **N independent** ML-DSA-65 KAT
  triples (fresh keypair + fresh message + fresh signature per triple) into a
  flat little-endian binary bundle. Host-verifies every triple before
  writing so a corrupted batch fails loud at generation time.
- `ml-dsa-65-verify-test/` — SP1 `cargo prove new --bare` workspace:
  - `lib/` — shared types (`PublicValuesStruct { bool verified; }`) plus a
    legacy single-vector `kat.rs` (vendored for T1 N=1; not used by T1.5).
  - `program/` — SP1 zkVM program. Reads `(N, then N triples of pk/msg/sig)`
    from stdin, calls `fips204::ml_dsa_65::verify` on each, commits a single
    `bool all_verified` over the whole batch.
  - `script/` — host runner with `--execute` / `--prove` and `--n` /
    `--kat-file` flags.

## Quick start (T1.5 scaling sweep)

```bash
# 1. Build KAT generator (workspace-isolated).
cd kat-gen && cargo build --release

# 2. Generate a 128-triple bundle.
./target/release/kat-gen --n 128 --out ../kat_n128.bin

# 3. Build the SP1 ELF.
(cd ../ml-dsa-65-verify-test/program && cargo prove build)

# 4. Build the host runner.
(cd ../ml-dsa-65-verify-test/script && cargo build --release)

# 5. Sweep N.
cd ..
for N in 1 4 16 64 128; do
  echo "=== N=$N ==="
  RUST_LOG=warn \
  ml-dsa-65-verify-test/target/release/mldsa \
    --execute --n $N --kat-file kat_n128.bin \
    | tail -8
done
```

## Real prove (needs ≥ 32 GB RAM)

```bash
RUST_LOG=info \
ml-dsa-65-verify-test/target/release/mldsa \
  --prove --n 1 --kat-file kat_n128.bin
```

Sandbox (16 GB) OOM's during prove. Real prove is run on founder hardware
only; see T1 doc for the wall-clock measurement plan.

## Binary KAT bundle format

```
u32 N
N × { u32 pk_len, pk_bytes, u32 msg_len, msg_bytes, u32 sig_len, sig_bytes }
```

All integers little-endian. `pk_len` is always 1952, `sig_len` always 3309
for ML-DSA-65; `msg_len` defaults to 32 (configurable via
`kat-gen --msg-len`). The host runner pushes the bundle to SP1 stdin as
`u32 N` (bincode) followed by `3*N` `write_vec` calls; the program reads via
`io::read::<u32>()` and `io::read_vec()`.

`kat_*.bin` files are git-ignored — regenerate locally per the steps above.
