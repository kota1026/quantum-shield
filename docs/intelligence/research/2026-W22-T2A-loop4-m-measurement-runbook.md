---
date: 2026-06-01 (W22)
loop: 4 of 4
purpose: Founder-executable runbook to measure polynomial dimension m for N=64 ML-DSA-65 batch in slop-whir
target: r6i.4xlarge EC2 instance (32 vCPUs, 128 GB RAM) — minimum 32 GB RAM required
estimated-time: 2-4 hours (environment setup included)
prerequisite: Completed T1 SP1 guest program for ML-DSA-65 batch verify
---

# U1 Measurement Runbook: Polynomial Dimension m for N=64 ML-DSA-65

## Purpose

This runbook lets you measure the actual WHIR polynomial dimension `m` when slop-whir
proves an SP1 execution trace for N=64 ML-DSA-65 batch verification.

`m` is the single largest unknown in the QS architecture. Loop #2b estimated
m ∈ {24..36}, giving a proof-size range of 65-259 KB at 128-bit security. This
experiment collapses that range to a point estimate.

**What you are measuring:**

When slop-whir's WHIR prover commits to a multilinear polynomial, the polynomial
dimension `m = log₂(number of evaluations)` determines:
- The number of folding rounds needed.
- The Merkle tree depth at each round.
- The total proof size: `Σ_r (q_r × depth_r × 64 bytes) + 256 × 4 bytes`.

For an SP1 execution trace with T cycles and W AIR columns, the naive bound is
`m = ⌈log₂(T × W)⌉`. SP1's jagged protocol reduces sparse traces: if most columns
are zero outside a small execution window, effective m can be substantially lower.
Measuring m empirically resolves this.

**Expected output (JSON, you fill in after running):**

```json
{
  "n_sigs": 64,
  "trace_cycles": null,
  "air_columns": null,
  "m_naive": null,
  "m_effective_jagged": null,
  "proof_bytes": null,
  "prove_time_sec": null,
  "prove_peak_ram_gb": null,
  "verification_passed": null,
  "config": "big_beautiful_whir_config"
}
```

Fill in `null` values after running the experiment. Append this JSON block
to this file under the "Results" section at the bottom.

---

## Step 0: Environment Setup

### Hardware requirement

Minimum: 32 GB RAM. Recommended: r6i.4xlarge (128 GB RAM, 16 vCPUs).
SP1 proving for N=64 ML-DSA-65 (175M cycles) requires ~64-128 GB RAM for the STARK
phase. If RAM is insufficient, SP1 will OOM. Use `ulimit -v` to confirm available
virtual memory before starting.

```bash
free -h          # check available RAM
nproc            # check CPU count
```

### Rust toolchain

```bash
rustup toolchain install stable
rustup default stable
rustup target add x86_64-unknown-linux-gnu
# Optional but recommended: use a nightly toolchain for SIMD optimizations
rustup toolchain install nightly
```

### SP1 v6.2.3 (pin to specific commit)

```bash
# Install SP1 CLI
curl -L https://sp1up.dev | bash
sp1up --version 6.2.3
# Verify
cargo prove --version  # should print sp1-cli v6.2.3
```

TODO[founder]: Before pinning, confirm the SP1 v6.2.3 commit SHA from the
repository. Run: `git -C $(rustup which cargo | xargs dirname)/../.. log --oneline -1`
after `sp1up --version 6.2.3`.

---

## Step 1: Set Up the Measurement Workspace

```bash
mkdir -p ~/qs-whir-measure
cd ~/qs-whir-measure
```

### Cargo.toml

```toml
[workspace]
members = ["guest", "host"]

[workspace.dependencies]
sp1-sdk = "6.2.3"
```

---

## Step 2: SP1 Guest Program — N=64 ML-DSA-65 Batch Verify

The guest program runs inside SP1's RISC-V zkVM. It reads 64 (pk, msg, sig) tuples
from the public input, verifies each ML-DSA-65 signature, and outputs a single
1-bit "all valid" flag and a Keccak-256 commitment.

### guest/Cargo.toml

```toml
[package]
name = "ml-dsa-batch-guest"
version = "0.1.0"
edition = "2021"

[dependencies]
sp1-zkvm = { version = "6.2.3", features = ["verify"] }
# ML-DSA-65 implementation — use the pqcrypto or dilithium3 crate
pqcrypto-dilithium = "0.5.0"
pqcrypto-traits = "0.3.5"
```

Note: `pqcrypto-dilithium` implements Dilithium3 (equivalent to ML-DSA-65 in the
NIST PQC context). If your T1 guest already uses a different crate, substitute it.
The `pqcrypto-dilithium` crate compiles to RISC-V via `no_std`. Verify this with
`cargo build --target riscv32im-succinct-zkvm-elf` in the guest directory.

TODO[founder]: Confirm which ML-DSA-65 crate was used in T1 and substitute here
if different from `pqcrypto-dilithium`.

### guest/src/main.rs

```rust
#![no_std]
#![no_main]

extern crate alloc;
use alloc::vec::Vec;

sp1_zkvm::entrypoint!(main);

use pqcrypto_dilithium::dilithium3;
use pqcrypto_traits::sign::DetachedSignature;
use pqcrypto_traits::sign::PublicKey;
use pqcrypto_traits::sign::SignedMessage;

/// ML-DSA-65 public key bytes (1952 bytes for Dilithium3 / ML-DSA-65).
const PK_BYTES: usize = 1952;
/// ML-DSA-65 signature bytes (3293 bytes for Dilithium3 / ML-DSA-65).
const SIG_BYTES: usize = 3293;
/// Number of signatures in the batch.
const N: usize = 64;

fn main() {
    // Read all inputs from public input stream.
    // Format: for each i in 0..N: [pk_i (PK_BYTES)] [msg_len (4 bytes LE)] [msg_i] [sig_i (SIG_BYTES)]
    let mut all_valid = true;
    let mut keccak_input: Vec<u8> = Vec::new();

    for _i in 0..N {
        // Read public key
        let pk_bytes: Vec<u8> = sp1_zkvm::io::read_vec();
        // Read message
        let msg_bytes: Vec<u8> = sp1_zkvm::io::read_vec();
        // Read signature
        let sig_bytes: Vec<u8> = sp1_zkvm::io::read_vec();

        // Verify ML-DSA-65 signature
        let pk = dilithium3::PublicKey::from_bytes(&pk_bytes).expect("invalid pk");
        let sig = dilithium3::DetachedSignature::from_bytes(&sig_bytes).expect("invalid sig");
        let valid = dilithium3::verify_detached_signature(&sig, &msg_bytes, &pk).is_ok();
        all_valid &= valid;

        // Accumulate into Keccak commitment input
        keccak_input.extend_from_slice(&pk_bytes);
        keccak_input.extend_from_slice(&msg_bytes);
    }

    // Commit to the batch: write public outputs
    sp1_zkvm::io::commit(&all_valid);
    // Write Keccak-256 commitment (using SP1's built-in keccak256 syscall)
    let commitment = sp1_zkvm::lib::keccak256(&keccak_input);
    sp1_zkvm::io::commit(&commitment);
}
```

**Build the guest ELF:**

```bash
cd ~/qs-whir-measure/guest
cargo prove build
# Output: target/elf/riscv32im-succinct-zkvm-elf/release/ml-dsa-batch-guest
```

If the build fails with `pqcrypto-dilithium` on RISC-V, it may require `no_std` feature flags.
Check: `cargo prove build 2>&1 | grep -E "error|warning" | head -30`.

---

## Step 3: Generate NIST KAT Test Vectors

The guest requires 64 valid (pk, msg, sig) tuples. Use the NIST KAT (Known Answer Test)
vectors for Dilithium3.

**NIST KAT source:**

The official NIST KAT file for Dilithium3 (ML-DSA-65) is available at:
`https://csrc.nist.gov/Projects/post-quantum-cryptography/selected-algorithms-2022`

Download: `PQCsignKAT_Dilithium3.rsp`

Format: The `.rsp` file contains `count = 0..99` entries with `pk`, `sk`, `smlen`, `sm`
fields in hex. Each `sm` is a signed message (signature prepended to message).

**Parsing the KAT file (Python helper):**

```python
#!/usr/bin/env python3
"""
parse_kat.py — extract 64 (pk, msg, sig) tuples from NIST Dilithium3 KAT file.
Output: binary file `kat_inputs.bin` for use by the Rust host.
"""
import struct

def parse_kat(kat_path, n=64):
    entries = []
    with open(kat_path, 'r') as f:
        current = {}
        for line in f:
            line = line.strip()
            if '=' in line:
                k, v = line.split(' = ', 1)
                current[k.strip()] = bytes.fromhex(v.strip())
            elif line == '' and current:
                entries.append(current)
                current = {}
                if len(entries) >= n:
                    break
    # Dilithium3 signature is prepended to message in sm
    SIG_BYTES = 3293
    result = []
    for e in entries[:n]:
        pk = e['pk']
        sm = e['sm']
        sig = sm[:SIG_BYTES]
        msg = sm[SIG_BYTES:]
        result.append((pk, msg, sig))
    return result

def write_binary(entries, out_path):
    with open(out_path, 'wb') as f:
        for (pk, msg, sig) in entries:
            # Write pk (1952 bytes)
            f.write(struct.pack('<I', len(pk)))
            f.write(pk)
            # Write msg
            f.write(struct.pack('<I', len(msg)))
            f.write(msg)
            # Write sig (3293 bytes)
            f.write(struct.pack('<I', len(sig)))
            f.write(sig)

if __name__ == '__main__':
    import sys
    kat_path = sys.argv[1] if len(sys.argv) > 1 else 'PQCsignKAT_Dilithium3.rsp'
    entries = parse_kat(kat_path)
    print(f"Parsed {len(entries)} entries.")
    write_binary(entries, 'kat_inputs.bin')
    print("Wrote kat_inputs.bin")
```

Run:
```bash
wget https://csrc.nist.gov/CSRC/media/Projects/post-quantum-cryptography/documents/round-3/submissions/Dilithium-Round3.zip
# Extract and locate PQCsignKAT_Dilithium3.rsp
unzip Dilithium-Round3.zip
find . -name "PQCsignKAT_Dilithium3.rsp" | head -1
python3 parse_kat.py <path-to-kat-file>
```

TODO[founder]: If the NIST zip URL has changed, navigate to
`https://csrc.nist.gov/Projects/post-quantum-cryptography/selected-algorithms-2022`
and download the Dilithium submission package manually.

---

## Step 4: Host Program — SP1 Proving with slop-whir

The host program drives SP1 execution and then calls slop-whir directly as a Rust
library to generate the WHIR proof. It instruments to extract `m`.

### host/Cargo.toml

```toml
[package]
name = "whir-measure-host"
version = "0.1.0"
edition = "2021"

[dependencies]
sp1-sdk = "6.2.3"
slop-whir = { path = "PATH_TO_SP1_REPO/slop/crates/whir" }
slop-koala-bear = { path = "PATH_TO_SP1_REPO/slop/crates/koala-bear" }
slop-challenger = { path = "PATH_TO_SP1_REPO/slop/crates/challenger" }
serde_json = "1.0"
anyhow = "1.0"

[build-dependencies]
sp1-build = "6.2.3"
```

TODO[founder]: Replace `PATH_TO_SP1_REPO` with the actual path to the SP1 source
repository (cloned from `git clone https://github.com/succinctlabs/sp1`).
Pin to the commit hash corresponding to v6.2.3.

**Why use path dependencies:** slop-whir is not published to crates.io (it's a
workspace crate in the SP1 monorepo). You must reference it as a path dependency
from a local SP1 clone.

### host/src/main.rs

```rust
use anyhow::Result;
use sp1_sdk::{ProverClient, SP1Stdin, SP1ProofWithPublicValues};
use std::fs;
use std::time::Instant;

const ELF: &[u8] = include_bytes!(
    "../../guest/target/elf/riscv32im-succinct-zkvm-elf/release/ml-dsa-batch-guest"
);

fn main() -> Result<()> {
    // Step 1: Load KAT inputs
    let kat_data = fs::read("kat_inputs.bin")?;
    let mut stdin = SP1Stdin::new();
    // Parse and feed the 64 (pk, msg, sig) tuples into stdin
    let mut cursor = 0usize;
    for _i in 0..64 {
        let pk_len = u32::from_le_bytes(kat_data[cursor..cursor+4].try_into().unwrap()) as usize;
        cursor += 4;
        let pk = &kat_data[cursor..cursor+pk_len];
        cursor += pk_len;
        let msg_len = u32::from_le_bytes(kat_data[cursor..cursor+4].try_into().unwrap()) as usize;
        cursor += 4;
        let msg = &kat_data[cursor..cursor+msg_len];
        cursor += msg_len;
        let sig_len = u32::from_le_bytes(kat_data[cursor..cursor+4].try_into().unwrap()) as usize;
        cursor += 4;
        let sig = &kat_data[cursor..cursor+sig_len];
        cursor += sig_len;
        stdin.write_slice(pk);
        stdin.write_slice(msg);
        stdin.write_slice(sig);
    }

    // Step 2: SP1 Execute (dry run to get trace shape — fast, no proving)
    let client = ProverClient::local();
    let (pk_vk, vk) = client.setup(ELF);

    println!("=== SP1 EXECUTE (trace shape measurement) ===");
    let t_execute = Instant::now();
    let (public_values, execution_report) = client.execute(ELF, stdin.clone())
        .expect("SP1 execute failed");
    let execute_elapsed = t_execute.elapsed();

    println!("Execute time: {:.2}s", execute_elapsed.as_secs_f64());
    println!("all_valid: {:?}", public_values.read::<bool>());

    // Step 3: Extract trace shape from execution report
    // SP1's execution report contains cycle count and shape info
    // The exact API depends on SP1 SDK version — check sp1_sdk::ExecutionReport
    println!("=== TRACE SHAPE ===");
    // TODO[founder]: The ExecutionReport struct may expose:
    //   - total_cycles: u64
    //   - shape: Option<CoreShapeConfig> or similar
    // Print the debug representation to find the relevant fields:
    println!("Execution report: {:#?}", execution_report);

    // Step 4: SP1 Compressed Proof (generates STARK proof via hypercube)
    // This is the step that exercises slop-whir internally.
    // WARNING: This will take 15-60 minutes and require 64-128 GB RAM for N=64.
    println!("=== SP1 COMPRESSED PROVE (slop-whir internally) ===");
    let t_prove = Instant::now();

    // MEMORY PROFILING: use /usr/bin/time -v or valgrind --tool=massif
    // Start peak RAM measurement (Linux)
    let pid = std::process::id();
    let peak_ram_before = read_peak_ram(pid);

    let proof: SP1ProofWithPublicValues = client
        .prove(&pk_vk, stdin)
        .compressed()
        .run()
        .expect("SP1 prove failed");
    let prove_elapsed = t_prove.elapsed();
    let peak_ram_after = read_peak_ram(pid);

    println!("Prove time: {:.2}s", prove_elapsed.as_secs_f64());
    println!("Peak RAM delta: {:.2} GB", (peak_ram_after - peak_ram_before) as f64 / 1e9);

    // Step 5: Measure the compressed proof size
    // The compressed proof is serialized to bytes via bincode or serde
    let proof_bytes = bincode::serialize(&proof).expect("serialize failed");
    println!("Compressed proof bytes: {}", proof_bytes.len());

    // Step 6: Extract the WhirProofShape from the compressed proof.
    // The compressed proof (SP1ProofWithPublicValues) wraps a CompressedProof
    // which contains the WHIR proof committed via slop-whir.
    // The shape (m, rounds, domain sizes) is encoded in the WhirProofShape struct.
    //
    // TODO[founder]: Introspect the compressed proof to find the WhirProofShape.
    // The compressed proof type hierarchy is:
    //   SP1ProofWithPublicValues.proof -> SP1Proof::Compressed(CompressedProof)
    //   CompressedProof -> (internal to sp1_sdk, check source)
    //
    // The WhirProofShape is defined in:
    //   slop/crates/whir/src/config.rs
    // Fields: initial_domain_log_size, rounds: Vec<RoundConfig>, final_poly_log_degree
    // The polynomial dimension m = initial_domain_log_size (before folding)
    // After jagged protocol: effective m = initial_domain_log_size - log(sparsity factor)
    //
    // Print all available fields:
    println!("=== PROOF STRUCTURE ===");
    println!("Proof: {:#?}", proof.proof);

    // Step 7: Output JSON measurement result
    let result = serde_json::json!({
        "n_sigs": 64,
        "trace_cycles": null,  // TODO: fill from execution_report
        "air_columns": null,   // TODO: fill from execution_report.shape
        "m_naive": null,       // log2(trace_cycles * air_columns)
        "m_effective_jagged": null,  // TODO: fill from WhirProofShape.initial_domain_log_size
        "proof_bytes": proof_bytes.len(),
        "prove_time_sec": prove_elapsed.as_secs_f64(),
        "prove_peak_ram_gb": (peak_ram_after - peak_ram_before) as f64 / 1e9,
        "verification_passed": null  // TODO: fill after verification
    });
    println!("\n=== MEASUREMENT RESULT (JSON) ===");
    println!("{}", serde_json::to_string_pretty(&result)?);
    fs::write("measurement_result.json", serde_json::to_string_pretty(&result)?)?;
    println!("\nSaved to measurement_result.json");

    Ok(())
}

/// Read peak resident set size from /proc/<pid>/status (Linux).
fn read_peak_ram(pid: u32) -> u64 {
    let path = format!("/proc/{}/status", pid);
    let content = fs::read_to_string(&path).unwrap_or_default();
    for line in content.lines() {
        if line.starts_with("VmRSS:") {
            // VmRSS: <kb> kB
            let kb: u64 = line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
            return kb * 1024;
        }
    }
    0
}
```

Add `bincode = "1.3"` to host/Cargo.toml dependencies.

---

## Step 5: Extracting m from the WhirProofShape

After Step 4 succeeds, the key field to extract is the polynomial dimension `m`.

In slop-whir, the WHIR proof's configuration is carried in `WhirProofShape<F>`, which
contains:
- `initial_domain_log_size: usize` — the log₂ of the initial evaluation domain.
- `rounds: Vec<RoundConfig>` — per-round query counts and rate parameters.
- `final_poly_log_degree: usize` — log₂ of the final polynomial degree.

The effective polynomial dimension `m` relates to `initial_domain_log_size` as follows:
- Before folding: the polynomial has 2^initial_domain_log_size evaluations,
  so m = initial_domain_log_size.
- After SP1's jagged protocol reduces the trace, the `initial_domain_log_size` will
  be smaller than `⌈log₂(T × W)⌉`.

**To read WhirProofShape from the compressed proof:**

The `CompressedProof` is not directly accessible via the public SDK API. Instead,
use the approach of inspecting the shape at the prover level. The SP1 codebase
exposes `SP1InnerPcsProver` and `SP1OuterPcsProver` in `crates/hypercube/src/prover/`.
For instrumentation purposes, the simplest approach is:

```rust
// After client.prove() completes, inspect the proof bytes:
// 1. Deserialize the compressed proof from bincode bytes
// 2. Navigate to the inner WHIR proof structure
// 3. Read WhirProofShape.initial_domain_log_size

// Alternative (simpler): add a println! to slop-whir/src/prover.rs directly,
// in the prove() function, to print the config shape:
//
// In slop/crates/whir/src/prover.rs, function prove():
//   eprintln!("[QS_MEASURE] WhirProofShape: initial_domain_log_size={}, rounds={:?}, final_poly_log_degree={}",
//       config.initial_domain_log_size,
//       config.rounds.iter().map(|r| r.num_queries).collect::<Vec<_>>(),
//       config.final_poly_log_degree);
```

This instrumentation approach (adding a temporary `eprintln!` to slop-whir's prover.rs)
is the most reliable path. It does not require understanding the internal proof
serialization format.

**Instructions:**
1. Clone the SP1 repository: `git clone https://github.com/succinctlabs/sp1 && cd sp1 && git checkout v6.2.3`
2. Edit `slop/crates/whir/src/prover.rs`, add the eprintln! at the top of `prove()`:
   ```rust
   pub fn prove(&self, ...) -> WhirProof<GC> {
       eprintln!("[QS_MEASURE] initial_domain_log_size={}", config.initial_domain_log_size);
       eprintln!("[QS_MEASURE] rounds={:?}", config.rounds);
       // ... rest of function
   ```
3. Update host/Cargo.toml to use path = "<your SP1 clone>/slop/crates/whir" etc.
4. Re-run the host program.
5. Look for `[QS_MEASURE]` lines in stderr output.

Source for WhirProofShape struct:
`raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/src/config.rs`
(fetched 2026-06-01). The struct is defined in config.rs and carries all the
information needed to reconstruct proof size analytically.

---

## Step 6: Validate Proof Size Formula

After extracting `m = WhirProofShape.initial_domain_log_size` and the rounds,
compute the expected proof size and cross-check against the measured `proof_bytes`.

**Formula from Loop #3 (Lemma 4 in the proposed paper):**

```
proof_bytes = Σ_r (q_r × depth_r × 64) + n_roots × 32 + final_poly_bytes
```

Where:
- `q_r` = number of queries in round r (from `rounds[r].num_queries`)
- `depth_r` = log₂(domain_size_at_round_r) (initial_domain_log_size - r × folding_factor)
- `64` bytes per Merkle path node (32-byte sibling hash + 32-byte leaf value estimate)
- `n_roots` = number of Merkle root commitments = number of rounds + 1
- `final_poly_bytes` = 2^final_poly_log_degree × 4 bytes (KoalaBear elements)

**Cross-check script:**

```python
#!/usr/bin/env python3
"""cross_check_proof_size.py — validate the proof size formula."""
import sys, json

with open("measurement_result.json") as f:
    r = json.load(f)

# TODO: fill these from the [QS_MEASURE] output
m = int(input("m (initial_domain_log_size): "))
rounds = []  # list of (num_queries, depth) tuples
n_rounds = int(input("number of rounds: "))
for i in range(n_rounds):
    q = int(input(f"  round {i} queries: "))
    # depth = m - i * folding_factor (folding_factor typically 2 or 4)
    folding_factor = int(input(f"  round {i} folding_factor (2 or 4): "))
    depth = m - i * folding_factor
    rounds.append((q, depth))
final_poly_log_degree = int(input("final_poly_log_degree: "))

# Formula
query_phase = sum(q * depth * 64 for (q, depth) in rounds)
n_roots = n_rounds + 1
commit_phase = n_roots * 32
final_poly = (2 ** final_poly_log_degree) * 4
total_formula = query_phase + commit_phase + final_poly

print(f"\nFormula breakdown:")
print(f"  Query phase:   {query_phase:,} bytes")
print(f"  Commit phase:  {commit_phase:,} bytes")
print(f"  Final poly:    {final_poly:,} bytes")
print(f"  TOTAL (formula): {total_formula:,} bytes ({total_formula/1024:.1f} KB)")
print(f"  Measured proof_bytes: {r['proof_bytes']:,} bytes ({r['proof_bytes']/1024:.1f} KB)")
print(f"  Ratio (formula/measured): {total_formula/r['proof_bytes']:.3f}")
print()
if abs(total_formula - r['proof_bytes']) / r['proof_bytes'] < 0.1:
    print("PASS: formula within 10% of measured")
else:
    print("FAIL: discrepancy > 10%. Check serialization overhead.")
```

A discrepancy > 10% means the 64 bytes/node estimate is wrong (may need adjustment
for extension field elements vs base field elements) or there is serialization framing
overhead (length prefixes, etc.). Adjust the 64-byte constant by computing:
`measured_per_node = (proof_bytes - commit_phase - final_poly) / sum(q_r × depth_r)`.

---

## Step 7: Record and Append Results

After running, fill in this JSON block and append it to the bottom of this file:

```json
{
  "measurement_date": "TODO[founder]: fill in date",
  "n_sigs": 64,
  "trace_cycles": "TODO[founder]",
  "air_columns": "TODO[founder]",
  "m_naive_estimate": "TODO[founder: log2(trace_cycles * air_columns)]",
  "m_effective_jagged": "TODO[founder: read from [QS_MEASURE] output]",
  "proof_bytes_sp1_compressed": "TODO[founder]",
  "prove_time_sec": "TODO[founder]",
  "prove_peak_ram_gb": "TODO[founder]",
  "formula_check_ratio": "TODO[founder: from cross_check_proof_size.py]",
  "verification_passed": "TODO[founder]",
  "machine": "r6i.4xlarge",
  "sp1_version": "6.2.3",
  "sp1_commit": "TODO[founder: pin this]",
  "config": "KoalaBearDegree4Duplex / big_beautiful_whir_config"
}
```

---

## Step 8: Interpret the Results

Once you have `m_effective_jagged`, use the following table to read off the implications:

| m | Proof size (128-bit, formula) | Charter Q4 target | Charter stretch |
|---|-------------------------------|-------------------|-----------------|
| 24 | ~65 KB  | PASS (< 200 KB) | PASS (< 80 KB) |
| 26 | ~96 KB  | PASS            | PASS (< 80 KB)? — borderline |
| 28 | ~128 KB | PASS            | FAIL (> 80 KB) |
| 30 | ~160 KB | PASS            | FAIL |
| 32 | ~192 KB | PASS (barely)   | FAIL |
| 34 | ~225 KB | FAIL            | FAIL |
| 36 | ~259 KB | FAIL            | FAIL |

"128-bit" means using the big_beautiful_whir_config (84+21+12+9 queries, 16-bit PoW).

If m ≥ 34, the Q4 proof-size target is missed. Options to recover:
1. Reduce N from 64 to 32 (halves trace, reduces m by 1). Proof size drops by ~7%.
2. Reduce to 100-bit security (reduce queries). Proof size drops ~30%.
3. Use EIP-4844 blob posting — proof size irrelevant for gas; only execution gas
   (~146K) matters. This is the recommended path regardless of m.

**The proof-size constraint is NOT a blocker for the gas KPI** if EIP-4844 is used.
The charter §1.3 stretch gas target (< 20K/sig at N=64) is met via EIP-4844
execution cost (~146K total / 64 = ~2.3K/sig) regardless of proof size.

The proof-size constraint matters only for the IEEE S&P 2027 paper's claim about
proof efficiency. If m ≥ 34, the paper should present the 128-bit proof size as
~225-259 KB with a note on EIP-4844 deployment, and present a 100-bit variant for
the sub-80 KB claim.

---

## Appendix A: Diagnostic Commands

```bash
# Monitor RAM during proving
watch -n 5 "free -h && cat /proc/$(pgrep -f whir-measure-host)/status | grep VmRSS"

# Check if SP1 is using WHIR internally (look for slop-whir in the binary)
strings target/release/whir-measure-host | grep -i whir | head -10

# Measure disk I/O during proving (proving generates temp files)
iostat -x 5

# Check CPU utilization (should be near 100% on all cores during NTT)
htop
```

---

## Appendix B: Expected Failure Modes

| Failure | Symptom | Fix |
|---------|---------|-----|
| OOM during proving | `Killed` or `Cannot allocate memory` | Reduce N (try N=8, N=16 first to validate pipeline) |
| `pqcrypto-dilithium` not no_std | Compile error in guest | Use `dilithium3` crate with `no_std` feature or use `ml-dsa` crate |
| SP1 version mismatch | ABI errors in slop-whir path dependencies | Pin all SP1 crates to exact same commit |
| Keccak syscall not found | `sp1_zkvm::lib::keccak256` missing | Use `sp1_zkvm::io::commit_slice(&sha256_input)` and switch to SHA256 for the commitment (not ideal but works for trace measurement purposes — the commitment hash does not affect the STARK trace significantly) |
| WhirProofShape not in compressed proof | Proof struct doesn't expose shape fields | Use the eprintln! instrumentation approach in Step 5 |

---

## Appendix C: U3 Theorem 4.8 Founder Checklist

(Full checklist is in the companion document: `2026-W22-T2A-loop4-final-derisk.md`)

**Quick reference for the paper read (Section 4 of eprint 2024/1586):**

1. Verify constants: `7·log₂(10)`, `3.5·log₂(1/ρ)`, `2·log₂(k)` in Theorem 4.8.
2. Confirm: list decoding branch uses provable Johnson bound (`δ = 1 - √ρ`), NOT proximity gap conjecture.
3. Confirm: soundness proof is in the Random Oracle Model.
4. Confirm: round-by-round (RBR) soundness composition via min() across rounds.
5. Confirm: proof size formula matches `Σ_r (q_r × depth_r × hash_size) + O(1)`.
6. Note: any caveats about "univariate skip" optimization's effect on Theorem 4.8.
7. Note: any "open problems" about tightness of the bound.

These are 7 specific claims that can be verified in < 90 minutes without reading
the full 60-page paper.

---

## Results (founder fills in after running)

```
[PLACEHOLDER — append JSON measurement block here after running Step 7]
```
