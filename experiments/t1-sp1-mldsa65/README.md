# T1 — SP1 + fips204 ML-DSA-65 substrate spike

Source code for the Phase 2.5 T1 gate test. Results and reproduction
instructions live in
[`docs/intelligence/research/2026-W21-T1-sp1-results.md`](../../docs/intelligence/research/2026-W21-T1-sp1-results.md).

## Layout

- `kat-gen/` — host-side helper that produces a fresh ML-DSA-65 keypair
  and signature, then prints them as Rust `const` byte arrays. Output is
  vendored into `ml-dsa-65-verify-test/lib/src/kat.rs`.
- `ml-dsa-65-verify-test/` — SP1 `cargo prove new --bare` workspace:
  - `lib/` — shared types (`PublicValuesStruct { bool verified; }`) and
    the embedded KAT constants.
  - `program/` — the SP1 zkVM program. Calls `fips204::ml_dsa_65::verify`
    on the embedded KAT and commits the resulting `bool`.
  - `script/` — host runner with `--execute` and `--prove` flags.

## Quick start

```bash
# 1. Build the SP1 ELF.
(cd ml-dsa-65-verify-test/program && cargo prove build)

# 2. Execute in the SP1 emulator and capture cycle count.
(cd ml-dsa-65-verify-test/script && RUST_LOG=info cargo run --release -- --execute)

# 3. Real prove (needs >16 GB RAM).
(cd ml-dsa-65-verify-test/script && /usr/bin/time -v cargo run --release -- --prove)
```

## Regenerating the KAT vectors

```bash
(cd kat-gen && cargo run --release) > ml-dsa-65-verify-test/lib/src/kat.rs
```

The current vectors were generated 2026-05-12 with `fips204 0.4.6` on
sandbox hardware. Vectors are deterministic across rebuilds of `kat-gen`
only if you fix the RNG seed — current `kat-gen` uses `OsRng`, so each
run produces fresh bytes. A fresh KAT is fine for substrate validation
(verification correctness is the property under test, not vector
stability).
