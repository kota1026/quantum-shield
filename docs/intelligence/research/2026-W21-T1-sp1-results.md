---
date: 2026-05-09 Sat JST (sandbox executed 2026-05-12)
test: T1 — SP1 + fips204 ML-DSA-65 N=1 verification
status: PASS (substrate-level) — pending founder hardware wall-clock confirmation
parent: docs/intelligence/strategy/2026-W19-5-phase25-meeting.md
---

# T1 Result — SP1 ML-DSA-65 Substrate Spike (sandbox)

## Headline

**Architecture F is alive at the substrate level.** `fips204` v0.4.6 compiles
cleanly to SP1's `riscv64im-succinct-zkvm-elf` target with `default-features =
false`, executes correctly inside the zkVM emulator, and verifies a real
ML-DSA-65 signature in **2,739,124 RISC-V cycles** for N=1. The hardware-
independent kill tests passed. Founder must still confirm prove wall-clock on
≥32 GB dev hardware — the sandbox OOM'd at 16 GB before the proof finished.

## Sandbox environment

- SP1 cargo-prove: `cargo-prove sp1 (VERGEN_IDEMPOTENT_OUTPUT 2026-05-12T13:41:09Z)` — installed via `cargo install sp1-cli --locked` (version 6.1.0)
- SP1 SDK / zkvm / build crates: 6.1.0
- SP1 RISC-V toolchain: `succinct-1.93.0-64bit` (rustc 1.93.0-dev), downloaded from `https://github.com/succinctlabs/rust/releases/download/succinct-1.93.0-64bit/rust-toolchain-x86_64-unknown-linux-gnu.tar.gz`
- Host Rust: 1.94.1 (e408947bf 2026-03-25)
- fips204: 0.4.6
- CPU: Intel Xeon @ 2.80 GHz, 4 vCPU
- Memory: 16 GB RAM, no swap
- OS: Linux 6.18.5 x86_64
- **IMPORTANT**: not founder dev hardware. Wall-clock numbers below are sandbox baseline only.

## Phase 1: Install

- **Result**: success, but only after working around two restrictions.
- **Time**: ~10 min including troubleshooting.
- **Issues encountered**:
  - `sp1.succinct.xyz` is blocked in this sandbox (HTTP 403) — the official
    `curl -L https://sp1.succinct.xyz | bash` path is unusable.
  - `api.github.com` is also blocked (HTTP 403), so `sp1up` and
    `cargo prove install-toolchain` both fail when they call
    `https://api.github.com/repos/succinctlabs/rust/releases`.
  - **Working install path** (also useful for any restricted CI):
    1. `apt-get install -y protobuf-compiler` (required by `sp1-prover-types` build script).
    2. `cargo install sp1-cli --locked` — pulls `cargo-prove` from crates.io.
    3. Source the SP1 Rust toolchain tarball **directly** from
       `https://github.com/succinctlabs/rust/releases/download/succinct-1.93.0-64bit/rust-toolchain-x86_64-unknown-linux-gnu.tar.gz`
       (github.com/raw downloads work; only the API host is blocked).
    4. Extract to `~/.sp1/toolchains/succinct/`, then
       `rustup toolchain link succinct ~/.sp1/toolchains/succinct`.
    5. SP1 6.1.0 hard-codes `LATEST_SUPPORTED_TOOLCHAIN_VERSION_TAG = "succinct-1.93.0-64bit"` and now requires `riscv64im-succinct-zkvm-elf` (the old `v1.81.0` 32-bit release fails build with "Could not find specification for target `riscv64im-succinct-zkvm-elf`").

## Phase 2: Project setup

- **Source layout**: standard `cargo prove new --bare` scaffold (workspace with `lib/`, `program/`, `script/`), renamed crates to `mldsa-lib`, `mldsa-program`, `mldsa-script`.
- **KAT vector source**: **(c)** — generated a fresh ML-DSA-65 keypair + signature on host using `fips204` itself (`/tmp/qs-t1-sp1-spike/kat-gen`), then embedded the resulting public key and signature as `const [u8; 1952]` / `const [u8; 3309]` arrays in `mldsa-lib::kat`. Justification: NIST's KAT page is unreachable in this sandbox, and `fips204` ships its own KATs only inside its tests directory which is not exported by the crate. Generating fresh vectors with the same library guarantees the verifier inside the zkVM is exercised against bytes that decisively parse as valid input. Host verification was asserted before embedding.
- Public values committed: a single `bool verified` ABI-encoded with `alloy-sol-types`.

## Phase 3: Compile to SP1 target

- **Result**: SUCCESS.
- **fips204 features used**: `default-features = false, features = ["ml-dsa-65"]` — this is critical. The crate's `default` feature pulls in `rand_core/getrandom` which does not have a sysroot for `riscv64im-succinct-zkvm-elf` and would fail. ML-DSA-65 *verification* is RNG-free, so disabling `default-rng` removes the only blocker.
- **ELF**: `target/elf-compilation/riscv64im-succinct-zkvm-elf/release/mldsa-program` — **191,152 bytes**, statically linked RISC-V 64-bit soft-float.
- **Build time**: 63 s on sandbox (cold cache, full dep graph).
- **Warnings**: none from `fips204`. Standard SP1 cargo-prove output only.

## Phase 4: Execute (mock prove)

- **Result**: SUCCESS.
- **Cycle count**: `cycle_count=2,739,124` — reproducible across two independent runs. **This is the load-bearing hardware-independent number for the F-architecture decision.**
- **`verified=true` inside the zkVM** — the `bool` public value committed by the program matches the host-side verification, so `fips204` runs correctly under SP1's RISC-V semantics.
- **Execute wall-clock** (emulator only, no proving): 148 ms on sandbox.
- **Constraint count**: not measured — SP1 6.1.0 exposes constraint counts only during real proving; the cycle count is the relevant scaling number for prove cost.

## Phase 5: Real prove (attempted)

- **Result**: **INCONCLUSIVE in sandbox** — OOM killed at 15.88 GB RSS / 18.41 GB total VM after ~150 s wall-clock, before proof finished.
- dmesg confirms:
  > `Out of memory: Killed process 26343 (mldsa) total-vm:18409468kB, anon-rss:15879732kB, ...`
- The sandbox has 16 GB RAM and no swap. SP1's CPU prover allocation pattern for a ~2.7 M-cycle program peaked above the available RAM.
- This is **not** a fundamental viability failure for Architecture F — it is a sandbox memory ceiling. Real prove must be measured on founder hardware (typically 32–64 GB RAM dev box).
- No proof wall-clock or proof size from sandbox.

## Conclusion

**Hardware-independent verdict on F: ALIVE.**

Two of the three load-bearing kill tests passed unambiguously:

1. `fips204` ML-DSA-65 **compiles** to SP1's `riscv64im-succinct-zkvm-elf` target with `default-features = false, features = ["ml-dsa-65"]`. No code changes to `fips204` required.
2. The compiled program **executes** under SP1's RISC-V emulator and produces the correct verification result. **2,739,124 cycles for N=1 ML-DSA-65 verification.**

For context against the Phase 2.5 thresholds:
- The cycle count is small enough that 30 s on dev hardware is plausible (≈11 k cycles/ms = 11 MHz effective prove throughput — well within published SP1 prover ranges for similar program sizes on modern Ryzen / Xeon).
- **MARGINAL territory** would require ≥20 s prove wall-clock on dev hardware. **FAIL territory** would require >60 s.
- Real prove wall-clock on founder hardware is the remaining unknown.

**What founder must verify on dev hardware:**
1. `cargo prove build` succeeds (re-confirm — should be deterministic).
2. `cargo run --release -- --execute` prints `cycle_count=2739124` exactly. If this number differs by more than ~1 %, something in the build is non-deterministic and needs investigation.
3. `cargo run --release -- --prove` completes on a 32+ GB box. Record:
   - Wall-clock from "initializing cpu prover" log line to "Successfully verified proof!" line.
   - Peak RSS via `/usr/bin/time -v`.
   - Proof size (the script prints `proof_json_bytes=…`).
4. Compare wall-clock against thresholds:
   - **≤ 30 s** → PASS, F proceeds to batch-N spike (T1.5).
   - **30–60 s** → MARGINAL, revisit Architecture F granularity.
   - **> 60 s** → FAIL, redirect to Architecture A-only.

## Reproduction for founder dev hardware

```bash
# Prereqs: rustup, protobuf-compiler, build-essential.
sudo apt-get install -y protobuf-compiler

# 1. Install SP1 CLI (cargo-prove). Skip sp1.succinct.xyz on networks that block it.
cargo install sp1-cli --locked

# 2. Install the SP1 Rust toolchain. Default path uses GitHub API. If that
#    works on the dev machine, simply run:
cargo prove install-toolchain
#    Otherwise mirror the manual path (only when api.github.com is blocked):
mkdir -p ~/.sp1/toolchains/succinct
cd ~/.sp1/toolchains/succinct
curl -L -o rust-toolchain.tar.gz \
  https://github.com/succinctlabs/rust/releases/download/succinct-1.93.0-64bit/rust-toolchain-x86_64-unknown-linux-gnu.tar.gz
tar -xzf rust-toolchain.tar.gz
rustup toolchain link succinct ~/.sp1/toolchains/succinct

# 3. Get the test project.
git clone <quantum-shield repo, branch claude/quantum-shield-updates-aXLIl>
cd quantum-shield/experiments/t1-sp1-mldsa65/ml-dsa-65-verify-test

# 4. Compile the SP1 program.
(cd program && cargo prove build)
# Expected: target/elf-compilation/riscv64im-succinct-zkvm-elf/release/mldsa-program ~191 KB.

# 5. Execute (cycle count must match sandbox to confirm determinism).
(cd script && RUST_LOG=info cargo run --release -- --execute)
# Expected output line: cycle_count=2739124

# 6. Real prove on founder hardware (≥32 GB RAM).
(cd script && /usr/bin/time -v cargo run --release -- --prove 2>&1 | tee /tmp/sp1-prove.log)
# Expected lines:
#   "Successfully generated proof!"
#   "Successfully verified proof!"
#   "prove_wall_ms=…" (this is the threshold-comparison value)
#   "proof_json_bytes=…"
# Also note "Maximum resident set size" from /usr/bin/time -v — needs >16 GB.
```

## Files generated

- `/tmp/qs-t1-sp1-spike/kat-gen/` — host-side KAT generator (vendored into `mldsa-lib::kat` in source form).
- `/tmp/qs-t1-sp1-spike/ml-dsa-65-verify-test/` — the SP1 test project.
- Both will be committed to the repo at `experiments/t1-sp1-mldsa65/` for founder reproduction.

## Appendix — exact execute output

```
2026-05-12T14:06:23.848711Z  INFO public_value_stream: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
2026-05-12T14:06:23.965427Z  INFO execute_program: close time.busy=2.14ms time.idle=147ms
verified: true
=== T1 EXECUTE RESULTS ===
cycle_count=2739124
execute_wall_ms=148
verified_inside_zkvm=true
```

The trailing `1` in `public_value_stream` is the ABI-encoded `bool verified = true` — 32 bytes, last byte set.
