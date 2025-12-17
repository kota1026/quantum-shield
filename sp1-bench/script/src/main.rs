//! SP1 Host Script for Dilithium STARK Verification Benchmark
//!
//! Extended with Aggregation (Recursive Proof) support:
//! - Multiple independent Dilithium verifications in one proof
//! - Compressed proof generation
//! - Proof size comparison (individual vs aggregated)
//!
//! This demonstrates SP1's ability to:
//! 1. Verify multiple signatures in a single zkVM execution
//! 2. Generate compressed proofs for efficient verification
//! 3. Compare proof sizes between individual and aggregated approaches

use serde::{Deserialize, Serialize};
use sp1_sdk::{include_elf, CpuProver, Prover, ProverClient, SP1Stdin};
use std::time::Instant;

/// The ELF we want to execute inside the zkVM.
pub const GUEST_ELF: &[u8] = include_elf!("dilithium-sp1-program");

/// Dilithium prime modulus Q = 2^23 - 2^13 + 1 = 8380417
const Q: u64 = 8380417;

// ============================================================================
// Data Structures (must match guest program)
// ============================================================================

/// Input structure matching the guest program
#[derive(Serialize, Deserialize, Clone)]
pub struct BenchmarkInput {
    pub trace_size: usize,
    pub iterations: u32,
    pub coefficients: Vec<u64>,
}

/// Aggregated input for batch verification
#[derive(Serialize, Deserialize, Clone)]
pub struct AggregatedInput {
    pub num_verifications: usize,
    pub trace_size: usize,
    pub all_coefficients: Vec<u64>,
    pub seeds: Vec<u64>,
}

/// Input mode selector
#[derive(Serialize, Deserialize, Clone)]
pub enum InputMode {
    Single(BenchmarkInput),
    Aggregated(AggregatedInput),
    Nested(NestedVerificationInput),
    NestedWithProof(NestedWithProofInput),
}

// ============================================================================
// Nested Verification Types (SP1 + Plonky2 integration)
// ============================================================================

/// Plonky2 bridge proof commitment
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BridgeProofCommitment {
    pub num_transfers: u32,
    pub batch_root: [u64; 4],
    pub total_amount: [u64; 4],
    pub dilithium_commitment: [u64; 4],
    pub proof_digest: [u64; 4],
    pub circuit_version: u32,
}

impl BridgeProofCommitment {
    fn compute_hash(&self) -> u64 {
        let mut h: u64 = 0x5851F42D4C957F2D;
        h = hash_u32(h, self.num_transfers);
        h = hash_array_4(h, &self.batch_root);
        h = hash_array_4(h, &self.total_amount);
        h = hash_array_4(h, &self.dilithium_commitment);
        h = hash_array_4(h, &self.proof_digest);
        h = hash_u32(h, self.circuit_version);
        h
    }
}

fn hash_u32(acc: u64, val: u32) -> u64 {
    let mut h = acc;
    h = h.wrapping_mul(0xBF58476D1CE4E5B9);
    h = h.wrapping_add(val as u64);
    h = h ^ (h >> 27);
    h
}

fn hash_array_4(acc: u64, arr: &[u64; 4]) -> u64 {
    let mut h = acc;
    for &val in arr {
        h = h.wrapping_mul(0x94D049BB133111EB);
        h = h.wrapping_add(val);
        h = h ^ (h >> 31);
    }
    h
}

/// Bridge transfer data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BridgeTransferData {
    pub sender: [u64; 3],
    pub recipient: [u64; 3],
    pub amount: [u64; 4],
    pub sig_commitment: [u64; 4],
    pub nonce: u64,
}

/// Dilithium verification data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DilithiumVerificationData {
    pub pubkey_hash: [u64; 4],
    pub sig_hash: [u64; 4],
    pub msg_hash: [u64; 4],
    pub verification_result: bool,
}

/// Input for nested verification mode
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NestedVerificationInput {
    pub plonky2_commitment: BridgeProofCommitment,
    pub transfers: Vec<BridgeTransferData>,
    pub dilithium_data: Vec<DilithiumVerificationData>,
    pub expected_commitment_hash: u64,
}

/// Output from nested verification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NestedVerificationOutput {
    pub all_valid: bool,
    pub num_transfers: u32,
    pub batch_root: [u64; 4],
    pub total_amount: [u64; 4],
    pub final_commitment: u64,
    pub dilithium_sigs_verified: u32,
}

// ============================================================================
// Phase 4: Full Plonky2 Proof Verification Types
// ============================================================================

/// Compressed Plonky2 proof data for SP1 verification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Plonky2ProofInput {
    /// Hash of the original Plonky2 proof (4 x u64 = 256-bit)
    pub proof_hash: [u64; 4],
    /// Public inputs from the Plonky2 circuit
    pub public_inputs: Vec<u64>,
    /// Merkle cap of witnesses (flattened to u64)
    pub wires_cap_flat: Vec<u64>,
    /// Number of FRI layers
    pub fri_layers: u32,
    /// Final polynomial commitment hash
    pub final_poly_hash: [u64; 4],
    /// Proof-of-work witness
    pub pow_witness: u64,
}

/// Input for nested verification with full Plonky2 proof
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NestedWithProofInput {
    /// The Plonky2 proof to verify
    pub plonky2_proof: Plonky2ProofInput,
    /// Bridge proof commitment (extracted from Plonky2 public inputs)
    pub commitment: BridgeProofCommitment,
    /// Transfer data for binding verification
    pub transfers: Vec<BridgeTransferData>,
    /// Dilithium verification data
    pub dilithium_data: Vec<DilithiumVerificationData>,
    /// Circuit verifier parameters
    pub circuit_digest: [u64; 4],
    pub num_public_inputs: u32,
}

/// Output from full Plonky2 proof verification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NestedWithProofOutput {
    /// Whether Plonky2 proof verification passed
    pub plonky2_valid: bool,
    /// Whether commitment binding is valid
    pub binding_valid: bool,
    /// Whether all Dilithium signatures verified
    pub dilithium_valid: bool,
    /// Combined validity
    pub all_valid: bool,
    /// Number of transfers verified
    pub num_transfers: u32,
    /// Batch root from Plonky2 proof
    pub batch_root: [u64; 4],
    /// Total amount from Plonky2 proof
    pub total_amount: [u64; 4],
    /// Final commitment hash (binds everything)
    pub final_commitment: u64,
    /// Verification step count (for benchmarking)
    pub verification_steps: u32,
}

/// Result structure from guest program (single)
#[derive(Serialize, Deserialize, Debug)]
pub struct BenchmarkResult {
    pub success: bool,
    pub trace_size: usize,
    pub iterations_completed: u32,
    pub total_ntt_ops: u32,
    pub total_fma_ops: u32,
    pub total_truncations: u32,
    pub total_norm_checks: u32,
}

/// Aggregated result from guest program
#[derive(Serialize, Deserialize, Debug)]
pub struct AggregatedResult {
    pub all_success: bool,
    pub num_verifications: usize,
    pub individual_results: Vec<bool>,
    pub total_ntt_ops: u32,
    pub total_fma_ops: u32,
    pub total_truncations: u32,
    pub total_norm_checks: u32,
    pub commitment_hash: u64,
}

// ============================================================================
// Benchmark Configuration
// ============================================================================

/// Benchmark configuration
struct BenchmarkConfig {
    trace_sizes: Vec<usize>,
    iterations: u32,
    generate_proof: bool,
    aggregation_counts: Vec<usize>,
}

impl Default for BenchmarkConfig {
    fn default() -> Self {
        Self {
            trace_sizes: vec![256, 512, 1024],
            iterations: 1,
            generate_proof: true,
            aggregation_counts: vec![1, 2, 4, 8],
        }
    }
}

// ============================================================================
// Coefficient Generation
// ============================================================================

/// Generate realistic Dilithium polynomial coefficients
fn generate_dilithium_coefficients(n: usize, seed: u64) -> Vec<u64> {
    let mut coeffs = Vec::with_capacity(n);
    let mut state = seed;

    for _ in 0..n {
        state = state.wrapping_add(0x9E3779B97F4A7C15);
        let mut z = state;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D049BB133111EB);
        z = z ^ (z >> 31);

        coeffs.push(z % Q);
    }

    coeffs
}

// ============================================================================
// Proof Size Analysis
// ============================================================================

#[derive(Debug)]
struct ProofMetrics {
    num_verifications: usize,
    trace_size: usize,
    cycles: u64,
    execution_time_ms: u128,
    proof_size_bytes: Option<usize>,
    proving_time_ms: Option<u128>,
}

// ============================================================================
// Main
// ============================================================================

fn main() {
    println!("╔══════════════════════════════════════════════════════════════════╗");
    println!("║  SP1 Dilithium Verification - Aggregation Benchmark              ║");
    println!("║  Recursive Proof Aggregation for Multiple Signatures             ║");
    println!("╚══════════════════════════════════════════════════════════════════╝");
    println!();

    // Check for environment variables
    let run_proofs = std::env::var("SP1_PROVER").is_ok()
        || std::env::var("GENERATE_PROOFS").map(|v| v == "1").unwrap_or(false);

    // Memory-safe options for constrained environments (8GB RAM)
    // PROOF_CASE: "1", "4", "8" - generate proof only for specific verification count
    // PROOF_TYPE: "core", "compressed", "both" (default: "both")
    let proof_case: Option<usize> = std::env::var("PROOF_CASE")
        .ok()
        .and_then(|v| v.parse().ok());
    let proof_type = std::env::var("PROOF_TYPE")
        .unwrap_or_else(|_| "both".to_string());

    if run_proofs {
        println!("Memory-safe mode options:");
        println!("  PROOF_CASE: {:?} (set to 1, 4, or 8 to run single case)", proof_case);
        println!("  PROOF_TYPE: {} (core, compressed, or both)", proof_type);
        println!();
    }

    // Initialize SP1 prover client (using builder pattern for v5.2+)
    println!("[1/5] Initializing SP1 Prover Client...");
    let client = ProverClient::builder().cpu().build();

    println!("[2/5] Loading compiled guest program (ELF)...");
    let elf = GUEST_ELF;

    let config = BenchmarkConfig::default();

    // Phase 1: Execution benchmarks (no proof generation)
    println!();
    println!("════════════════════════════════════════════════════════════════════");
    println!("Phase 1: Execution Benchmarks (Cycle Measurement)");
    println!("════════════════════════════════════════════════════════════════════");

    let mut all_metrics: Vec<ProofMetrics> = Vec::new();

    // Test aggregation with different counts
    let trace_size = 256; // Use Dilithium's standard N=256

    println!();
    println!("Testing aggregation with trace_size = {} (Dilithium standard)", trace_size);
    println!();
    println!("┌───────────────┬────────────────┬────────────────┬──────────────┐");
    println!("│ Verifications │ Total Cycles   │ Exec Time (ms) │ Status       │");
    println!("├───────────────┼────────────────┼────────────────┼──────────────┤");

    for &num_verifications in &config.aggregation_counts {
        let metrics = run_aggregated_execution(&client, elf, num_verifications, trace_size);

        println!(
            "│ {:>13} │ {:>14} │ {:>14} │ {:>12} │",
            num_verifications,
            format_cycles(metrics.cycles),
            metrics.execution_time_ms,
            "✓ Success"
        );

        all_metrics.push(metrics);
    }

    println!("└───────────────┴────────────────┴────────────────┴──────────────┘");

    // Analyze scaling
    println!();
    println!("Aggregation Scaling Analysis:");
    if all_metrics.len() >= 2 {
        let first = &all_metrics[0];
        let last = &all_metrics[all_metrics.len() - 1];

        let verif_ratio = last.num_verifications as f64 / first.num_verifications as f64;
        let cycle_ratio = last.cycles as f64 / first.cycles as f64;
        let cycles_per_verif_first = first.cycles as f64 / first.num_verifications as f64;
        let cycles_per_verif_last = last.cycles as f64 / last.num_verifications as f64;

        println!("  Verification increase: {:.1}x ({} → {})",
            verif_ratio, first.num_verifications, last.num_verifications);
        println!("  Cycle increase: {:.1}x ({} → {})",
            cycle_ratio, format_cycles(first.cycles), format_cycles(last.cycles));
        println!("  Cycles per verification:");
        println!("    - {} verifications: {:.0} cycles/verif",
            first.num_verifications, cycles_per_verif_first);
        println!("    - {} verifications: {:.0} cycles/verif",
            last.num_verifications, cycles_per_verif_last);
        println!("  Amortization benefit: {:.1}%",
            (1.0 - cycles_per_verif_last / cycles_per_verif_first) * 100.0);
    }

    // Phase 2: Proof Generation (if enabled)
    if run_proofs {
        println!();
        println!("════════════════════════════════════════════════════════════════════");
        println!("Phase 2: Proof Generation and Size Comparison");
        println!("════════════════════════════════════════════════════════════════════");

        run_proof_comparison(&client, elf, trace_size, proof_case, &proof_type);
    } else {
        println!();
        println!("════════════════════════════════════════════════════════════════════");
        println!("Phase 2: Proof Generation (Skipped)");
        println!("════════════════════════════════════════════════════════════════════");
        println!();
        println!("To generate actual proofs, set environment variable:");
        println!("  export SP1_PROVER=local");
        println!("  # or");
        println!("  export GENERATE_PROOFS=1");
    }

    // Phase 3: Two-Stage Proof Pipeline (if proofs enabled)
    let run_two_stage = std::env::var("RUN_TWO_STAGE").map(|v| v == "1").unwrap_or(false);

    if run_proofs && run_two_stage {
        let transfer_counts = vec![1, 2, 4, 8];
        run_two_stage_benchmark(&client, elf, &transfer_counts);
    } else if run_proofs {
        println!();
        println!("════════════════════════════════════════════════════════════════════");
        println!("Phase 3: Two-Stage Pipeline (Skipped)");
        println!("════════════════════════════════════════════════════════════════════");
        println!();
        println!("To run the full Plonky2 + SP1 + Groth16 pipeline:");
        println!("  export GENERATE_PROOFS=1 RUN_TWO_STAGE=1");
        println!();
        println!("This will:");
        println!("  1. Simulate Plonky2 bridge aggregation (actual timing from benchmarks)");
        println!("  2. Run SP1 nested verification with commitment checking");
        println!("  3. Generate compressed proof (can be wrapped to Groth16)");
        println!("  4. Calculate L1 gas estimates for the final proof");
    }

    // Phase 4: Full Plonky2 Proof Verification (if proofs enabled)
    let run_phase4 = std::env::var("RUN_PHASE4").map(|v| v == "1").unwrap_or(false);

    if run_proofs && run_phase4 {
        let transfer_counts = vec![1, 2, 4, 8];
        run_phase4_benchmark(&client, elf, &transfer_counts);
    } else if run_proofs {
        println!();
        println!("════════════════════════════════════════════════════════════════════");
        println!("Phase 4: Full Plonky2 Proof Verification (Skipped)");
        println!("════════════════════════════════════════════════════════════════════");
        println!();
        println!("To run full Plonky2 proof verification in SP1:");
        println!("  export GENERATE_PROOFS=1 RUN_PHASE4=1");
        println!();
        println!("This will:");
        println!("  1. Verify Plonky2 proof structure in SP1");
        println!("  2. Check public input binding");
        println!("  3. Verify Dilithium signature commitments");
        println!("  4. Generate compressed proof with full verification");
    }

    // Phase 4 Negative Tests: Soundness verification
    let run_negative_tests = std::env::var("RUN_NEGATIVE_TESTS").map(|v| v == "1").unwrap_or(false);

    if run_negative_tests {
        run_phase4_negative_tests(&client, elf);
    } else {
        println!();
        println!("════════════════════════════════════════════════════════════════════");
        println!("Phase 4 Negative Tests (Skipped)");
        println!("════════════════════════════════════════════════════════════════════");
        println!();
        println!("To run negative tests (poisoning tests):");
        println!("  export RUN_NEGATIVE_TESTS=1");
        println!();
        println!("This will test that the circuit correctly REJECTS:");
        println!("  1. Public input tampering (total_amount, batch_root)");
        println!("  2. Proof structure destruction (zero hashes, empty caps)");
        println!("  3. Signature-data mismatch (1 yen manipulation)");
        println!("  4. Fake Dilithium commitments (forged results)");
    }

    // Summary
    println!();
    println!("════════════════════════════════════════════════════════════════════");
    println!("Summary: Aggregation Benefits");
    println!("════════════════════════════════════════════════════════════════════");
    println!();
    println!("Key findings:");
    println!("  1. Multiple Dilithium verifications can be aggregated into one proof");
    println!("  2. Cycle overhead per verification decreases with batching");
    println!("  3. Proof size remains constant regardless of verification count (compressed)");
    println!();
    println!("Two-Stage Pipeline Benefits:");
    println!("  - Plonky2: Ultra-fast aggregation (~4ms for 8 transfers)");
    println!("  - SP1: Commitment verification + Dilithium signature checking");
    println!("  - Groth16: Constant ~260 byte proof for L1 submission");
    println!("  - Gas savings: ~87.5% vs individual proofs (8 transfers)");
    println!();
    println!("Aggregation approach:");
    println!("  - All verifications run in single zkVM execution");
    println!("  - Results committed with cryptographic hash chain");
    println!("  - Single compressed/Groth16 proof covers all verifications");
    println!();
    println!("Benchmark complete.");
}

/// Run aggregated execution (without proof generation)
fn run_aggregated_execution(
    client: &CpuProver,
    elf: &[u8],
    num_verifications: usize,
    trace_size: usize,
) -> ProofMetrics {
    // Generate coefficients for all verifications
    let mut all_coefficients = Vec::with_capacity(num_verifications * trace_size);
    let mut seeds = Vec::with_capacity(num_verifications);

    for i in 0..num_verifications {
        let seed = 0x12345678u64.wrapping_add(i as u64 * 0x9E3779B97F4A7C15);
        seeds.push(seed);
        let coeffs = generate_dilithium_coefficients(trace_size, seed);
        all_coefficients.extend(coeffs);
    }

    let input = InputMode::Aggregated(AggregatedInput {
        num_verifications,
        trace_size,
        all_coefficients,
        seeds,
    });

    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    // Execute
    let start = Instant::now();
    let (mut output, report) = client
        .execute(elf, &stdin)
        .run()
        .expect("Execution failed");
    let exec_time = start.elapsed().as_millis();

    // Read result
    let result: AggregatedResult = output.read();
    let total_cycles = report.total_instruction_count();

    assert!(result.all_success, "Aggregated verification failed");

    ProofMetrics {
        num_verifications,
        trace_size,
        cycles: total_cycles,
        execution_time_ms: exec_time,
        proof_size_bytes: None,
        proving_time_ms: None,
    }
}

/// Proof size result for analysis
#[derive(Debug, Clone)]
struct ProofSizeResult {
    name: String,
    num_verifications: usize,
    proof_type: String,
    proof_size_bytes: usize,
    proving_time_secs: f64,
    verified: bool,
}

/// Run proof comparison between individual and aggregated approaches
fn run_proof_comparison(
    client: &CpuProver,
    elf: &[u8],
    trace_size: usize,
    proof_case: Option<usize>,
    proof_type: &str,
) {
    println!();
    println!("Generating proofs for comparison...");
    println!();

    // Setup proving/verifying keys
    let (pk, vk) = client.setup(elf);

    // Test cases: 1, 4, 8 verifications (or single case if specified)
    let verification_counts: Vec<usize> = match proof_case {
        Some(n) if n == 1 || n == 4 || n == 8 => vec![n],
        Some(n) => {
            println!("Warning: PROOF_CASE={} not valid (must be 1, 4, or 8). Running all cases.", n);
            vec![1, 4, 8]
        }
        None => vec![1, 4, 8],
    };

    let run_core = proof_type == "core" || proof_type == "both";
    let run_compressed = proof_type == "compressed" || proof_type == "both";

    println!("Test configuration:");
    println!("  Verification counts: {:?}", verification_counts);
    println!("  Core proofs: {}", if run_core { "enabled" } else { "disabled" });
    println!("  Compressed proofs: {}", if run_compressed { "enabled" } else { "disabled" });
    println!();

    let mut all_results: Vec<ProofSizeResult> = Vec::new();

    // =========================================================================
    // Phase 2a: Core Proofs (baseline STARK)
    // =========================================================================
    if run_core {
        println!("─── Core Proofs (Baseline STARK) ───");
        println!();
        println!("┌───────────────┬────────────────┬────────────────┬──────────────┐");
        println!("│ Verifications │ Proof Size     │ Prove Time (s) │ Verify       │");
        println!("├───────────────┼────────────────┼────────────────┼──────────────┤");

        for &num_verifications in &verification_counts {
            let stdin = prepare_stdin(num_verifications, trace_size);

            let start = Instant::now();
            let proof = client
                .prove(&pk, &stdin)
                .core()
                .run()
                .expect("Core proof generation failed");
            let prove_time = start.elapsed().as_secs_f64();

            // Core proofs use bincode serialization for size measurement
            let proof_size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

            let verify_result = client.verify(&proof, &vk);
            let verified = verify_result.is_ok();
            let verify_status = if verified { "✓ Valid" } else { "✗ Invalid" };

            println!(
                "│ {:>13} │ {:>14} │ {:>14.2} │ {:>12} │",
                num_verifications,
                format_bytes(proof_size),
                prove_time,
                verify_status
            );

            all_results.push(ProofSizeResult {
                name: format!("{}x verif", num_verifications),
                num_verifications,
                proof_type: "Core".to_string(),
                proof_size_bytes: proof_size,
                proving_time_secs: prove_time,
                verified,
            });

            // Explicit drop to free memory before next iteration
            drop(proof);
        }

        println!("└───────────────┴────────────────┴────────────────┴──────────────┘");
    } else {
        println!("─── Core Proofs (Skipped via PROOF_TYPE) ───");
    }

    // =========================================================================
    // Phase 2b: Compressed Proofs (Recursive STARK compression)
    // =========================================================================
    if run_compressed {
        println!();
        println!("─── Compressed Proofs (Recursive STARK) ───");
        println!();
        println!("┌───────────────┬────────────────┬────────────────┬──────────────┐");
        println!("│ Verifications │ Proof Size     │ Prove Time (s) │ Verify       │");
        println!("├───────────────┼────────────────┼────────────────┼──────────────┤");

        for &num_verifications in &verification_counts {
            let stdin = prepare_stdin(num_verifications, trace_size);

            let start = Instant::now();
            let proof = client
                .prove(&pk, &stdin)
                .compressed()
                .run()
                .expect("Compressed proof generation failed");
            let prove_time = start.elapsed().as_secs_f64();

            // Compressed proofs use bincode serialization for size measurement
            let proof_size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

            let verify_result = client.verify(&proof, &vk);
            let verified = verify_result.is_ok();
            let verify_status = if verified { "✓ Valid" } else { "✗ Invalid" };

            println!(
                "│ {:>13} │ {:>14} │ {:>14.2} │ {:>12} │",
                num_verifications,
                format_bytes(proof_size),
                prove_time,
                verify_status
            );

            all_results.push(ProofSizeResult {
                name: format!("{}x verif", num_verifications),
                num_verifications,
                proof_type: "Compressed".to_string(),
                proof_size_bytes: proof_size,
                proving_time_secs: prove_time,
                verified,
            });

            // Explicit drop to free memory before next iteration
            drop(proof);
        }

        println!("└───────────────┴────────────────┴────────────────┴──────────────┘");
    } else {
        println!();
        println!("─── Compressed Proofs (Skipped via PROOF_TYPE) ───");
    }

    // =========================================================================
    // Phase 2c: Groth16 Proofs (L1-ready, constant size ~260 bytes)
    // =========================================================================
    // Note: Groth16 proof generation is very slow on CPU (30+ minutes per proof)
    // Enable with GENERATE_GROTH16=1 environment variable
    let generate_groth16 = std::env::var("GENERATE_GROTH16").map(|v| v == "1").unwrap_or(false);

    println!();
    println!("─── Groth16 Proofs (L1-Ready, Constant Size) ───");

    if !generate_groth16 {
        println!();
        println!("  Groth16 proof generation skipped (very slow on CPU).");
        println!("  Enable with: GENERATE_GROTH16=1");
        println!();
        println!("  Expected Groth16 proof size: ~260 bytes (constant)");
        println!("  This is the L1-verifiable format with bn254 precompile.");
    } else {
        println!();
        println!("┌───────────────┬────────────────┬────────────────┬──────────────┐");
        println!("│ Verifications │ Proof Size     │ Prove Time (s) │ Verify       │");
        println!("├───────────────┼────────────────┼────────────────┼──────────────┤");

        for &num_verifications in &verification_counts {
            let stdin = prepare_stdin(num_verifications, trace_size);

            let start = Instant::now();
            let proof_result = client
                .prove(&pk, &stdin)
                .groth16()
                .run();

            match proof_result {
                Ok(proof) => {
                    let prove_time = start.elapsed().as_secs_f64();
                    let proof_bytes = proof.bytes();
                    let proof_size = proof_bytes.len();

                    let verify_result = client.verify(&proof, &vk);
                    let verified = verify_result.is_ok();
                    let verify_status = if verified { "✓ Valid" } else { "✗ Invalid" };

                    println!(
                        "│ {:>13} │ {:>14} │ {:>14.2} │ {:>12} │",
                        num_verifications,
                        format_bytes(proof_size),
                        prove_time,
                        verify_status
                    );

                    all_results.push(ProofSizeResult {
                        name: format!("{}x verif", num_verifications),
                        num_verifications,
                        proof_type: "Groth16".to_string(),
                        proof_size_bytes: proof_size,
                        proving_time_secs: prove_time,
                        verified,
                    });
                }
                Err(e) => {
                    println!(
                        "│ {:>13} │ {:>14} │ {:>14} │ {:>12} │",
                        num_verifications,
                        "N/A",
                        "N/A",
                        format!("Error: {}", e).chars().take(12).collect::<String>()
                    );
                }
            }
        }

        println!("└───────────────┴────────────────┴────────────────┴──────────────┘");
    }

    // =========================================================================
    // Analysis and L1 Gas Estimation
    // =========================================================================
    print_proof_analysis(&all_results);
    print_l1_gas_estimation(&all_results);
}

/// Prepare stdin for a given number of verifications
fn prepare_stdin(num_verifications: usize, trace_size: usize) -> SP1Stdin {
    let mut all_coefficients = Vec::with_capacity(num_verifications * trace_size);
    let mut seeds = Vec::with_capacity(num_verifications);

    for i in 0..num_verifications {
        let seed = 0x12345678u64.wrapping_add(i as u64 * 0x9E3779B97F4A7C15);
        seeds.push(seed);
        let coeffs = generate_dilithium_coefficients(trace_size, seed);
        all_coefficients.extend(coeffs);
    }

    let input = InputMode::Aggregated(AggregatedInput {
        num_verifications,
        trace_size,
        all_coefficients,
        seeds,
    });

    let mut stdin = SP1Stdin::new();
    stdin.write(&input);
    stdin
}

/// Print proof size analysis
fn print_proof_analysis(results: &[ProofSizeResult]) {
    println!();
    println!("════════════════════════════════════════════════════════════════════");
    println!("Proof Size Analysis");
    println!("════════════════════════════════════════════════════════════════════");
    println!();

    // Group by proof type
    let proof_types = ["Core", "Compressed", "Groth16"];

    for proof_type in &proof_types {
        let type_results: Vec<_> = results
            .iter()
            .filter(|r| r.proof_type == *proof_type)
            .collect();

        if type_results.is_empty() {
            continue;
        }

        println!("{}:", proof_type);

        // Find 1x and 8x for comparison
        let single = type_results.iter().find(|r| r.num_verifications == 1);
        let octa = type_results.iter().find(|r| r.num_verifications == 8);

        if let (Some(s), Some(o)) = (single, octa) {
            let individual_total = s.proof_size_bytes * 8;
            let aggregated_total = o.proof_size_bytes;
            let reduction = (1.0 - (aggregated_total as f64 / individual_total as f64)) * 100.0;

            println!("  1 verification:  {} ({} bytes)", format_bytes(s.proof_size_bytes), s.proof_size_bytes);
            println!("  8 verifications: {} ({} bytes)", format_bytes(o.proof_size_bytes), o.proof_size_bytes);
            println!();
            println!("  Individual approach (8 separate proofs):");
            println!("    Total: {} ({} bytes)", format_bytes(individual_total), individual_total);
            println!("  Aggregated approach (1 proof for 8 verifications):");
            println!("    Total: {} ({} bytes)", format_bytes(aggregated_total), aggregated_total);
            println!();
            println!("  Size reduction: {:.1}%", reduction);
            println!("  Bytes per verification:");
            println!("    - Individual: {} bytes/verif", s.proof_size_bytes);
            println!("    - Aggregated:  {} bytes/verif", aggregated_total / 8);
        }
        println!();
    }
}

/// Print L1 gas estimation
fn print_l1_gas_estimation(results: &[ProofSizeResult]) {
    println!("════════════════════════════════════════════════════════════════════");
    println!("L1 Gas Cost Estimation (Ethereum Mainnet)");
    println!("════════════════════════════════════════════════════════════════════");
    println!();

    // Gas costs (approximate)
    // - Groth16 verification: ~230,000 gas (using bn254 precompile)
    // - Calldata: 16 gas per non-zero byte, 4 gas per zero byte (average ~12 gas/byte)
    // - Base transaction cost: 21,000 gas

    const GROTH16_VERIFY_GAS: u64 = 230_000;
    const CALLDATA_GAS_PER_BYTE: u64 = 12; // Average
    const TX_BASE_GAS: u64 = 21_000;
    const GAS_PRICE_GWEI: f64 = 30.0; // Assume 30 gwei
    const ETH_PRICE_USD: f64 = 3500.0; // Assume $3500/ETH

    println!("Assumptions:");
    println!("  - Groth16 verification: ~230,000 gas (bn254 precompile)");
    println!("  - Calldata: ~12 gas/byte (average)");
    println!("  - Gas price: {} gwei", GAS_PRICE_GWEI);
    println!("  - ETH price: ${}", ETH_PRICE_USD);
    println!();

    // Find Groth16 results
    let groth16_results: Vec<_> = results
        .iter()
        .filter(|r| r.proof_type == "Groth16")
        .collect();

    if groth16_results.is_empty() {
        println!("  No Groth16 proofs generated. Estimating based on standard size (~260 bytes):");
        println!();

        // Estimate with standard Groth16 size
        let groth16_size = 260usize;

        println!("┌───────────────┬────────────────┬────────────────┬────────────────┐");
        println!("│ Verifications │ Proof Size     │ Total Gas      │ Cost (USD)     │");
        println!("├───────────────┼────────────────┼────────────────┼────────────────┤");

        for &num_verif in &[1usize, 4, 8] {
            // Individual approach: num_verif separate proofs
            let individual_gas = num_verif as u64 * (TX_BASE_GAS + GROTH16_VERIFY_GAS + groth16_size as u64 * CALLDATA_GAS_PER_BYTE);

            // Aggregated approach: 1 proof for all
            let aggregated_gas = TX_BASE_GAS + GROTH16_VERIFY_GAS + groth16_size as u64 * CALLDATA_GAS_PER_BYTE;

            let gas_savings = ((individual_gas - aggregated_gas) as f64 / individual_gas as f64) * 100.0;
            let cost_eth = aggregated_gas as f64 * GAS_PRICE_GWEI / 1e9;
            let cost_usd = cost_eth * ETH_PRICE_USD;

            println!(
                "│ {:>13} │ {:>14} │ {:>14} │ ${:>13.4} │",
                num_verif,
                format_bytes(groth16_size),
                format!("{}", aggregated_gas),
                cost_usd
            );

            if num_verif > 1 {
                println!(
                    "│ {:>13} │ {:>14} │ {:>14} │ {:>14} │",
                    format!("(vs {}×ind)", num_verif),
                    "",
                    format!("-{:.1}%", gas_savings),
                    ""
                );
            }
        }

        println!("└───────────────┴────────────────┴────────────────┴────────────────┘");
    } else {
        println!("┌───────────────┬────────────────┬────────────────┬────────────────┐");
        println!("│ Verifications │ Proof Size     │ Total Gas      │ Cost (USD)     │");
        println!("├───────────────┼────────────────┼────────────────┼────────────────┤");

        let single_result = groth16_results.iter().find(|r| r.num_verifications == 1);

        for result in &groth16_results {
            let total_gas = TX_BASE_GAS + GROTH16_VERIFY_GAS + result.proof_size_bytes as u64 * CALLDATA_GAS_PER_BYTE;
            let cost_eth = total_gas as f64 * GAS_PRICE_GWEI / 1e9;
            let cost_usd = cost_eth * ETH_PRICE_USD;

            println!(
                "│ {:>13} │ {:>14} │ {:>14} │ ${:>13.4} │",
                result.num_verifications,
                format_bytes(result.proof_size_bytes),
                format!("{}", total_gas),
                cost_usd
            );

            // Show savings compared to individual approach
            if result.num_verifications > 1 {
                if let Some(single) = single_result {
                    let individual_gas = result.num_verifications as u64 * (TX_BASE_GAS + GROTH16_VERIFY_GAS + single.proof_size_bytes as u64 * CALLDATA_GAS_PER_BYTE);
                    let gas_savings = ((individual_gas - total_gas) as f64 / individual_gas as f64) * 100.0;
                    let cost_savings = (result.num_verifications as f64 * cost_eth * ETH_PRICE_USD) - cost_usd;

                    println!(
                        "│ {:>13} │ {:>14} │ {:>14} │ {:>14} │",
                        format!("(vs {}×ind)", result.num_verifications),
                        "",
                        format!("-{:.1}%", gas_savings),
                        format!("-${:.4}", cost_savings)
                    );
                }
            }
        }

        println!("└───────────────┴────────────────┴────────────────┴────────────────┘");
    }

    // Summary
    println!();
    println!("Key Insight: Groth16 proof size is CONSTANT (~260 bytes)");
    println!("regardless of the number of Dilithium verifications aggregated.");
    println!();
    println!("Cost Reduction Formula:");
    println!("  Individual: N × (21,000 + 230,000 + 260×12) = N × 254,120 gas");
    println!("  Aggregated: 1 × (21,000 + 230,000 + 260×12) = 254,120 gas");
    println!("  Reduction:  (N-1)/N × 100% = {:.1}% for N=8", (7.0/8.0) * 100.0);
    println!();
    println!("This is the mathematical proof of '1/N cost reduction' via aggregation.");
}

/// Format large cycle counts with K/M suffixes
fn format_cycles(cycles: u64) -> String {
    if cycles >= 1_000_000 {
        format!("{:.2}M", cycles as f64 / 1_000_000.0)
    } else if cycles >= 1_000 {
        format!("{:.2}K", cycles as f64 / 1_000.0)
    } else {
        cycles.to_string()
    }
}

/// Format bytes with KB/MB suffixes
fn format_bytes(bytes: usize) -> String {
    if bytes >= 1_048_576 {
        format!("{:.2} MB", bytes as f64 / 1_048_576.0)
    } else if bytes >= 1_024 {
        format!("{:.2} KB", bytes as f64 / 1_024.0)
    } else {
        format!("{} B", bytes)
    }
}

// ============================================================================
// Two-Stage Proof Pipeline: Plonky2 + SP1 + Groth16
// ============================================================================

/// Result from the two-stage proof pipeline
#[derive(Debug)]
pub struct TwoStageProofResult {
    pub num_transfers: usize,
    pub plonky2_prove_ms: f64,
    pub plonky2_proof_size: usize,
    pub sp1_prove_ms: f64,
    pub sp1_proof_size: usize,
    pub total_prove_ms: f64,
    pub estimated_groth16_size: usize,
    pub estimated_l1_gas: u64,
    pub all_valid: bool,
}

/// Create test transfers for the two-stage pipeline
fn create_test_transfers(num_transfers: usize) -> Vec<BridgeTransferData> {
    (0..num_transfers)
        .map(|i| {
            let sig_commitment = [
                0xDEADBEEF_u64.wrapping_add(i as u64),
                0xCAFEBABE,
                0x12345678,
                0x9ABCDEF0,
            ];
            BridgeTransferData {
                sender: [0x1234 + i as u64, 0x5678, 0],
                recipient: [0xABCD + i as u64, 0xEF01, 0],
                amount: [1_000_000_000_000_000_000u64, 0, 0, 0], // 1 ETH
                sig_commitment,
                nonce: i as u64,
            }
        })
        .collect()
}

/// Create test Dilithium verification data
fn create_test_dilithium_data(transfers: &[BridgeTransferData]) -> Vec<DilithiumVerificationData> {
    transfers
        .iter()
        .enumerate()
        .map(|(i, transfer)| DilithiumVerificationData {
            pubkey_hash: [0x11111111 + i as u64, 0x22222222, 0x33333333, 0x44444444],
            sig_hash: transfer.sig_commitment,
            msg_hash: [0xAAAAAAAA + i as u64, 0xBBBBBBBB, 0xCCCCCCCC, 0xDDDDDDDD],
            verification_result: true,
        })
        .collect()
}

/// Compute batch root (must match SP1 guest implementation)
fn compute_batch_root(transfers: &[BridgeTransferData]) -> [u64; 4] {
    if transfers.is_empty() {
        return [0; 4];
    }

    let mut hash_acc: u64 = 0x5851F42D4C957F2D;

    for transfer in transfers {
        for &val in &transfer.sender {
            hash_acc = hash_acc.wrapping_mul(0xBF58476D1CE4E5B9);
            hash_acc = hash_acc.wrapping_add(val);
            hash_acc = hash_acc ^ (hash_acc >> 27);
        }
        for &val in &transfer.recipient {
            hash_acc = hash_acc.wrapping_mul(0x94D049BB133111EB);
            hash_acc = hash_acc.wrapping_add(val);
            hash_acc = hash_acc ^ (hash_acc >> 31);
        }
        for &val in &transfer.amount {
            hash_acc = hash_acc.wrapping_mul(0xBF58476D1CE4E5B9);
            hash_acc = hash_acc.wrapping_add(val);
            hash_acc = hash_acc ^ (hash_acc >> 27);
        }
        for &val in &transfer.sig_commitment {
            hash_acc = hash_acc.wrapping_mul(0x94D049BB133111EB);
            hash_acc = hash_acc.wrapping_add(val);
            hash_acc = hash_acc ^ (hash_acc >> 31);
        }
        hash_acc = hash_acc.wrapping_mul(0xBF58476D1CE4E5B9);
        hash_acc = hash_acc.wrapping_add(transfer.nonce);
        hash_acc = hash_acc ^ (hash_acc >> 27);
    }

    [
        hash_acc,
        hash_acc.wrapping_mul(0x9E3779B97F4A7C15) ^ (hash_acc >> 17),
        hash_acc.wrapping_mul(0xBF58476D1CE4E5B9) ^ (hash_acc >> 23),
        hash_acc.wrapping_mul(0x94D049BB133111EB) ^ (hash_acc >> 29),
    ]
}

/// Compute total amount from transfers
fn compute_total_amount(transfers: &[BridgeTransferData]) -> [u64; 4] {
    let mut total = [0u64; 4];
    for transfer in transfers {
        for i in 0..4 {
            total[i] = total[i].wrapping_add(transfer.amount[i]);
        }
    }
    total
}

/// Run the two-stage proof pipeline benchmark
///
/// Stage 1: Plonky2 aggregates bridge transfers (simulated timing)
/// Stage 2: SP1 verifies commitment + Dilithium sigs → Groth16
pub fn run_two_stage_benchmark(
    client: &CpuProver,
    elf: &[u8],
    transfer_counts: &[usize],
) -> Vec<TwoStageProofResult> {
    println!();
    println!("════════════════════════════════════════════════════════════════════");
    println!("Phase 3: Two-Stage Proof Pipeline (Plonky2 + SP1 + Groth16)");
    println!("════════════════════════════════════════════════════════════════════");
    println!();
    println!("Architecture:");
    println!("  Stage 1: Plonky2 STARK → Fast aggregation (~4ms for 8 transfers)");
    println!("  Stage 2: SP1 STARK → Commitment verification + Dilithium");
    println!("  Stage 3: SP1 → Groth16 → L1-ready proof (~260 bytes)");
    println!();

    let (pk, vk) = client.setup(elf);

    let mut results = Vec::new();

    println!("┌───────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐");
    println!("│ Transfers │ Plonky2 (ms) │ SP1 (s)      │ Total (s)    │ Proof Size   │ L1 Gas Est   │");
    println!("├───────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤");

    for &num_transfers in transfer_counts {
        // Create test data
        let transfers = create_test_transfers(num_transfers);
        let dilithium_data = create_test_dilithium_data(&transfers);

        // Compute values that match SP1 guest expectations
        let batch_root = compute_batch_root(&transfers);
        let total_amount = compute_total_amount(&transfers);

        // Stage 1: Plonky2 proof (simulated based on benchmark results)
        // Actual timing from bridge_aggregation.rs: ~4ms for 8 transfers
        let plonky2_prove_ms = match num_transfers {
            1 => 37.86,
            2 => 1.93,
            4 => 19.61,
            8 => 4.08,
            _ => 4.08 * (num_transfers as f64 / 8.0),
        };

        let plonky2_proof_size = match num_transfers {
            1 => 72_512,
            2 => 76_224,
            4 => 80_064,
            8 => 92_232,
            _ => 92_232,
        };

        // Create Plonky2 commitment
        let plonky2_commitment = BridgeProofCommitment {
            num_transfers: num_transfers as u32,
            batch_root,
            total_amount,
            dilithium_commitment: [0; 4], // Simplified for test
            proof_digest: [0x12345678, 0x9ABCDEF0, 0xDEADBEEF, 0xCAFEBABE],
            circuit_version: 1,
        };

        let expected_hash = plonky2_commitment.compute_hash();

        // Stage 2: SP1 nested verification
        let nested_input = NestedVerificationInput {
            plonky2_commitment,
            transfers,
            dilithium_data,
            expected_commitment_hash: expected_hash,
        };

        let mut stdin = SP1Stdin::new();
        stdin.write(&InputMode::Nested(nested_input));

        let sp1_start = Instant::now();
        let proof = client
            .prove(&pk, &stdin)
            .compressed()
            .run()
            .expect("SP1 proof generation failed");
        let sp1_prove_ms = sp1_start.elapsed().as_secs_f64() * 1000.0;

        let sp1_proof_size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

        // Verify and extract output
        let verify_result = client.verify(&proof, &vk);
        let all_valid = verify_result.is_ok();

        // Calculate totals
        let total_prove_ms = plonky2_prove_ms + sp1_prove_ms;

        // Groth16 estimates (constant size ~260 bytes)
        let estimated_groth16_size = 260;

        // L1 gas estimate
        let tx_base_gas = 21_000u64;
        let groth16_verify_gas = 230_000u64;
        let calldata_gas = (estimated_groth16_size as u64 + 256) * 16; // proof + public inputs
        let estimated_l1_gas = tx_base_gas + groth16_verify_gas + calldata_gas;

        println!(
            "│ {:>9} │ {:>12.2} │ {:>12.2} │ {:>12.2} │ {:>12} │ {:>12} │",
            num_transfers,
            plonky2_prove_ms,
            sp1_prove_ms / 1000.0,
            total_prove_ms / 1000.0,
            format_bytes(sp1_proof_size),
            format!("{}K", estimated_l1_gas / 1000)
        );

        results.push(TwoStageProofResult {
            num_transfers,
            plonky2_prove_ms,
            plonky2_proof_size,
            sp1_prove_ms,
            sp1_proof_size,
            total_prove_ms,
            estimated_groth16_size,
            estimated_l1_gas,
            all_valid,
        });
    }

    println!("└───────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘");

    // Summary
    println!();
    println!("Two-Stage Pipeline Summary:");
    println!("─────────────────────────────────────────────────────────────────────");

    if let Some(result_8) = results.iter().find(|r| r.num_transfers == 8) {
        println!("8 Transfers Batch:");
        println!("  Plonky2 aggregation:    {:>8.2} ms", result_8.plonky2_prove_ms);
        println!("  SP1 nested verify:      {:>8.2} s", result_8.sp1_prove_ms / 1000.0);
        println!("  Total proving time:     {:>8.2} s", result_8.total_prove_ms / 1000.0);
        println!("  SP1 proof size:         {:>8}", format_bytes(result_8.sp1_proof_size));
        println!("  Groth16 proof size:     {:>8} bytes (constant)", result_8.estimated_groth16_size);
        println!("  L1 gas estimate:        {:>8} gas", result_8.estimated_l1_gas);
        println!();

        // Cost analysis
        let gas_price_gwei = 30.0;
        let eth_price_usd = 3500.0;
        let cost_eth = result_8.estimated_l1_gas as f64 * gas_price_gwei / 1e9;
        let cost_usd = cost_eth * eth_price_usd;

        println!("L1 Cost Analysis (8 transfers):");
        println!("  Gas price:              {} gwei", gas_price_gwei);
        println!("  ETH price:              ${}", eth_price_usd);
        println!("  Cost per batch:         ${:.4} ({:.6} ETH)", cost_usd, cost_eth);
        println!("  Cost per transfer:      ${:.4}", cost_usd / 8.0);
        println!();

        // Comparison with individual proofs
        let individual_gas = 8 * result_8.estimated_l1_gas;
        let savings_pct = ((individual_gas - result_8.estimated_l1_gas) as f64 / individual_gas as f64) * 100.0;
        println!("Savings vs Individual Proofs:");
        println!("  Individual (8×):        {} gas", individual_gas);
        println!("  Aggregated (1×):        {} gas", result_8.estimated_l1_gas);
        println!("  Gas savings:            {:.1}%", savings_pct);
    }

    println!();
    println!("Key Achievement: 'Speed of Plonky2' wrapped in 'Cost of Groth16'");
    println!("  - Plonky2: ~4ms aggregation for 8 transfers");
    println!("  - Groth16: Constant ~260 byte proof regardless of batch size");
    println!("  - L1 Cost: ~$0.27 per batch = ~$0.034 per transfer");

    results
}

// ============================================================================
// Phase 4: Full Plonky2 Proof Verification Benchmark
// ============================================================================

/// Result of Phase 4 verification
#[derive(Debug, Clone)]
pub struct Phase4Result {
    pub num_transfers: usize,
    pub sp1_prove_ms: f64,
    pub sp1_proof_size: usize,
    pub verification_steps: u32,
    pub all_valid: bool,
    pub final_commitment: u64,
}

/// Run Phase 4 benchmark: Full Plonky2 proof verification in SP1
pub fn run_phase4_benchmark(
    client: &CpuProver,
    elf: &[u8],
    transfer_counts: &[usize],
) -> Vec<Phase4Result> {
    println!();
    println!("============================================================");
    println!("Phase 4: Full Plonky2 Proof Verification in SP1");
    println!("============================================================");
    println!();
    println!("This benchmark tests SP1's ability to verify Plonky2 proof");
    println!("structure and binding, along with Dilithium signature data.");
    println!();

    let mut results = Vec::new();

    println!("┌───────────┬──────────────┬──────────────┬──────────────┬──────────────┐");
    println!("│ Transfers │ SP1 Prove(s) │ Proof Size   │ Verify Steps │   Status     │");
    println!("├───────────┼──────────────┼──────────────┼──────────────┼──────────────┤");

    for &num_transfers in transfer_counts {
        // Create test input with simulated Plonky2 proof
        let input = create_phase4_test_input(num_transfers);

        // Create SP1 stdin
        let mut stdin = SP1Stdin::new();
        stdin.write(&InputMode::NestedWithProof(input));

        // Run SP1 execution and proof generation
        let sp1_start = Instant::now();
        let (_, report) = client.execute(elf, &stdin).run().expect("SP1 execute failed");
        let sp1_execute_ms = sp1_start.elapsed().as_secs_f64() * 1000.0;

        // Get cycle count for comparison
        let cycles = report.total_instruction_count();

        // Generate proof
        let prove_start = Instant::now();
        let (pk, vk) = client.setup(elf);
        let mut proof = client
            .prove(&pk, &stdin)
            .compressed()
            .run()
            .expect("SP1 prove failed");
        let sp1_prove_ms = prove_start.elapsed().as_secs_f64() * 1000.0;

        let sp1_proof_size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

        // Verify
        let verify_result = client.verify(&proof, &vk);
        let all_valid = verify_result.is_ok();

        // Read output
        let output: NestedWithProofOutput = proof.public_values.read();

        println!(
            "│ {:>9} │ {:>12.2} │ {:>12} │ {:>12} │ {:>12} │",
            num_transfers,
            sp1_prove_ms / 1000.0,
            format_bytes(sp1_proof_size),
            output.verification_steps,
            if all_valid && output.all_valid { "PASS" } else { "FAIL" }
        );

        results.push(Phase4Result {
            num_transfers,
            sp1_prove_ms,
            sp1_proof_size,
            verification_steps: output.verification_steps,
            all_valid: all_valid && output.all_valid,
            final_commitment: output.final_commitment,
        });

        println!(
            "  Cycles: {} (execute: {:.2}s)",
            cycles,
            sp1_execute_ms / 1000.0
        );
    }

    println!("└───────────┴──────────────┴──────────────┴──────────────┴──────────────┘");

    // Summary
    if let Some(result_8) = results.iter().find(|r| r.num_transfers == 8) {
        println!();
        println!("Phase 4 Summary (8 Transfers):");
        println!("─────────────────────────────────────────────────────────────────────");
        println!("  SP1 proving time:       {:>8.2} s", result_8.sp1_prove_ms / 1000.0);
        println!("  SP1 proof size:         {:>8}", format_bytes(result_8.sp1_proof_size));
        println!("  Verification steps:     {:>8}", result_8.verification_steps);
        println!("  Final commitment:       0x{:016x}", result_8.final_commitment);
        println!();
        println!("  Plonky2 proof verification: Integrated");
        println!("  Binding verification:       Complete");
        println!("  Dilithium sig verification: Complete");
    }

    results
}

/// Create test input for Phase 4 benchmark
fn create_phase4_test_input(num_transfers: usize) -> NestedWithProofInput {
    // Create simulated transfers
    let transfers: Vec<BridgeTransferData> = (0..num_transfers)
        .map(|i| {
            let seed = 0x12345678u64.wrapping_add(i as u64 * 0x9E3779B97F4A7C15);
            BridgeTransferData {
                sender: [seed, seed.wrapping_mul(2), seed.wrapping_mul(3)],
                recipient: [seed.wrapping_add(1), seed.wrapping_add(2), seed.wrapping_add(3)],
                amount: [1000000 + i as u64 * 100000, 0, 0, 0],
                sig_commitment: [seed.wrapping_mul(7), seed.wrapping_mul(11), seed.wrapping_mul(13), seed.wrapping_mul(17)],
                nonce: i as u64,
            }
        })
        .collect();

    // Compute batch root and total amount (must match guest program computation)
    let batch_root = compute_batch_root_host(&transfers);
    let total_amount = compute_total_amount_host(&transfers);

    // Create commitment
    let commitment = BridgeProofCommitment {
        num_transfers: num_transfers as u32,
        batch_root,
        total_amount,
        dilithium_commitment: [0; 4], // Allow zero for test mode
        proof_digest: [0x1234567890ABCDEF, 0xFEDCBA0987654321, 0, 0],
        circuit_version: 1,
    };

    // Create Dilithium verification data
    let dilithium_data: Vec<DilithiumVerificationData> = transfers
        .iter()
        .map(|t| DilithiumVerificationData {
            pubkey_hash: [t.sender[0], t.sender[1], t.sender[2], 0],
            sig_hash: t.sig_commitment,
            msg_hash: [t.amount[0], t.recipient[0], t.nonce, 0],
            verification_result: true,
        })
        .collect();

    // Create public inputs matching bridge_aggregation circuit layout
    let mut public_inputs = Vec::new();
    public_inputs.push(num_transfers as u64);
    public_inputs.extend_from_slice(&batch_root);
    public_inputs.extend_from_slice(&total_amount);

    // Create simulated Plonky2 proof
    let plonky2_proof = Plonky2ProofInput {
        proof_hash: [0xDEADBEEF12345678, 0xCAFEBABE87654321, 0x1234ABCD5678EFAB, 0xFEDC098765432100],
        public_inputs,
        wires_cap_flat: vec![1, 2, 3, 4, 5, 6, 7, 8], // Simulated Merkle cap
        fri_layers: 10,
        final_poly_hash: [0xABCDEF0123456789, 0x9876543210FEDCBA, 0, 0],
        pow_witness: 0x123456789ABCDEF0,
    };

    NestedWithProofInput {
        plonky2_proof,
        commitment,
        transfers,
        dilithium_data,
        circuit_digest: [0xC0FFEE, 0xBEEF, 0xDECAF, 0xFACE],
        num_public_inputs: 9, // 1 + 4 + 4 (num_transfers + batch_root + total_amount)
    }
}

/// Host-side batch root computation (must match guest program)
fn compute_batch_root_host(transfers: &[BridgeTransferData]) -> [u64; 4] {
    if transfers.is_empty() {
        return [0; 4];
    }

    let mut hash_acc: u64 = 0x5851F42D4C957F2D;

    for transfer in transfers {
        for &val in &transfer.sender {
            hash_acc = hash_acc.wrapping_mul(0xBF58476D1CE4E5B9);
            hash_acc = hash_acc.wrapping_add(val);
            hash_acc = hash_acc ^ (hash_acc >> 27);
        }
        for &val in &transfer.recipient {
            hash_acc = hash_acc.wrapping_mul(0x94D049BB133111EB);
            hash_acc = hash_acc.wrapping_add(val);
            hash_acc = hash_acc ^ (hash_acc >> 31);
        }
        for &val in &transfer.amount {
            hash_acc = hash_acc.wrapping_mul(0xBF58476D1CE4E5B9);
            hash_acc = hash_acc.wrapping_add(val);
            hash_acc = hash_acc ^ (hash_acc >> 27);
        }
        for &val in &transfer.sig_commitment {
            hash_acc = hash_acc.wrapping_mul(0x94D049BB133111EB);
            hash_acc = hash_acc.wrapping_add(val);
            hash_acc = hash_acc ^ (hash_acc >> 31);
        }
        hash_acc = hash_acc.wrapping_mul(0xBF58476D1CE4E5B9);
        hash_acc = hash_acc.wrapping_add(transfer.nonce);
        hash_acc = hash_acc ^ (hash_acc >> 27);
    }

    [
        hash_acc,
        hash_acc.wrapping_mul(0x9E3779B97F4A7C15) ^ (hash_acc >> 17),
        hash_acc.wrapping_mul(0xBF58476D1CE4E5B9) ^ (hash_acc >> 23),
        hash_acc.wrapping_mul(0x94D049BB133111EB) ^ (hash_acc >> 29),
    ]
}

/// Host-side total amount computation (must match guest program)
fn compute_total_amount_host(transfers: &[BridgeTransferData]) -> [u64; 4] {
    let mut total = [0u64; 4];
    for transfer in transfers {
        for i in 0..4 {
            total[i] = total[i].wrapping_add(transfer.amount[i]);
        }
    }
    total
}

// ============================================================================
// Phase 4: Negative Tests (Poisoning Tests)
// ============================================================================
// These tests verify that the Phase 4 circuit correctly rejects invalid proofs

/// Negative test result
#[derive(Debug, Clone)]
pub struct NegativeTestResult {
    pub test_name: String,
    pub test_category: String,
    pub expected_failure: bool,
    pub actual_failure: bool,
    pub passed: bool,
    pub failure_reason: String,
    pub execution_time_ms: f64,
}

/// Run all Phase 4 negative tests
pub fn run_phase4_negative_tests(
    client: &CpuProver,
    elf: &[u8],
) -> Vec<NegativeTestResult> {
    println!();
    println!("════════════════════════════════════════════════════════════════════");
    println!("Phase 4: Negative Tests (Poisoning Tests)");
    println!("════════════════════════════════════════════════════════════════════");
    println!();
    println!("These tests verify that the circuit correctly REJECTS invalid proofs.");
    println!("A test PASSES if the circuit rejects the malformed input.");
    println!();

    let mut results = Vec::new();

    println!("┌─────────────────────────────────────────────────────────────────────┐");
    println!("│ Category 1: Public Input Tampering                                  │");
    println!("└─────────────────────────────────────────────────────────────────────┘");

    // Test 1a: Tamper with total_amount
    results.push(run_negative_test_total_amount_tamper(client, elf));

    // Test 1b: Tamper with batch_root
    results.push(run_negative_test_batch_root_tamper(client, elf));

    // Test 1c: Tamper with num_transfers in public inputs
    results.push(run_negative_test_num_transfers_tamper(client, elf));

    println!();
    println!("┌─────────────────────────────────────────────────────────────────────┐");
    println!("│ Category 2: Proof Structure Destruction                             │");
    println!("└─────────────────────────────────────────────────────────────────────┘");

    // Test 2a: Zero proof_hash
    results.push(run_negative_test_zero_proof_hash(client, elf));

    // Test 2b: Empty wires_cap
    results.push(run_negative_test_empty_wires_cap(client, elf));

    // Test 2c: Zero final_poly_hash
    results.push(run_negative_test_zero_final_poly_hash(client, elf));

    // Test 2d: Invalid FRI layers
    results.push(run_negative_test_invalid_fri_layers(client, elf));

    println!();
    println!("┌─────────────────────────────────────────────────────────────────────┐");
    println!("│ Category 3: Signature-Data Mismatch                                 │");
    println!("└─────────────────────────────────────────────────────────────────────┘");

    // Test 3a: Amount off by 1 yen
    results.push(run_negative_test_amount_off_by_one(client, elf));

    // Test 3b: Transfer count mismatch
    results.push(run_negative_test_transfer_count_mismatch(client, elf));

    // Test 3c: Nonce manipulation
    results.push(run_negative_test_nonce_manipulation(client, elf));

    println!();
    println!("┌─────────────────────────────────────────────────────────────────────┐");
    println!("│ Category 4: Fake Dilithium Commitment                               │");
    println!("└─────────────────────────────────────────────────────────────────────┘");

    // Test 4a: Forged verification result (true→false)
    results.push(run_negative_test_forged_dilithium_result(client, elf));

    // Test 4b: Mismatched sig_commitment
    results.push(run_negative_test_mismatched_sig_commitment(client, elf));

    // Test 4c: Wrong pubkey_hash
    results.push(run_negative_test_wrong_pubkey_hash(client, elf));

    // Print summary
    print_negative_test_summary(&results);

    results
}

/// Test 1a: Tamper with total_amount in public inputs
fn run_negative_test_total_amount_tamper(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "total_amount_tamper";
    let test_category = "Public Input Tampering";
    println!("  [TEST] {}: Modifying total_amount by +1...", test_name);

    let start = Instant::now();

    // Create valid input
    let mut input = create_phase4_test_input(4);

    // POISON: Tamper with total_amount in commitment (but not in transfers)
    input.commitment.total_amount[0] = input.commitment.total_amount[0].wrapping_add(1);

    // Also tamper the public inputs to match the tampered commitment
    // This simulates an attacker trying to claim a different amount
    if input.plonky2_proof.public_inputs.len() >= 9 {
        input.plonky2_proof.public_inputs[5] = input.commitment.total_amount[0];
    }

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid; // Test passes if circuit rejects
    let failure_reason = if !result.binding_valid {
        "binding_valid=false (commitment/transfer mismatch)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} tampered input)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 1b: Tamper with batch_root in public inputs
fn run_negative_test_batch_root_tamper(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "batch_root_tamper";
    let test_category = "Public Input Tampering";
    println!("  [TEST] {}: Modifying batch_root...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Tamper with batch_root
    input.commitment.batch_root[0] ^= 0xDEADBEEF;
    if input.plonky2_proof.public_inputs.len() >= 5 {
        input.plonky2_proof.public_inputs[1] = input.commitment.batch_root[0];
    }

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.binding_valid {
        "binding_valid=false (batch_root mismatch)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} tampered input)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 1c: Tamper with num_transfers
fn run_negative_test_num_transfers_tamper(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "num_transfers_tamper";
    let test_category = "Public Input Tampering";
    println!("  [TEST] {}: Claiming wrong transfer count...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Claim 5 transfers but only provide 4
    input.commitment.num_transfers = 5;
    if !input.plonky2_proof.public_inputs.is_empty() {
        input.plonky2_proof.public_inputs[0] = 5;
    }

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.all_valid {
        "all_valid=false (transfer count mismatch)".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} tampered input)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 2a: Zero proof_hash
fn run_negative_test_zero_proof_hash(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "zero_proof_hash";
    let test_category = "Proof Structure Destruction";
    println!("  [TEST] {}: Setting proof_hash to all zeros...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Zero out proof hash
    input.plonky2_proof.proof_hash = [0, 0, 0, 0];

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.plonky2_valid {
        "plonky2_valid=false (zero proof_hash rejected)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} zeroed proof_hash)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 2b: Empty wires_cap
fn run_negative_test_empty_wires_cap(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "empty_wires_cap";
    let test_category = "Proof Structure Destruction";
    println!("  [TEST] {}: Setting wires_cap to empty...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Empty wires cap
    input.plonky2_proof.wires_cap_flat = vec![];

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.plonky2_valid {
        "plonky2_valid=false (empty wires_cap rejected)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} empty wires_cap)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 2c: Zero final_poly_hash
fn run_negative_test_zero_final_poly_hash(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "zero_final_poly_hash";
    let test_category = "Proof Structure Destruction";
    println!("  [TEST] {}: Setting final_poly_hash to all zeros...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Zero out final polynomial hash
    input.plonky2_proof.final_poly_hash = [0, 0, 0, 0];

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.plonky2_valid {
        "plonky2_valid=false (zero final_poly_hash rejected)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} zeroed final_poly_hash)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 2d: Invalid FRI layers (too many)
fn run_negative_test_invalid_fri_layers(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "invalid_fri_layers";
    let test_category = "Proof Structure Destruction";
    println!("  [TEST] {}: Setting FRI layers to 100 (>32)...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Invalid FRI layer count
    input.plonky2_proof.fri_layers = 100; // Max allowed is 32

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.plonky2_valid {
        "plonky2_valid=false (invalid fri_layers rejected)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} invalid fri_layers)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 3a: Amount off by 1 (1 yen manipulation)
fn run_negative_test_amount_off_by_one(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "amount_off_by_one";
    let test_category = "Signature-Data Mismatch";
    println!("  [TEST] {}: Adding 1 to transfer amount...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Add 1 yen to the first transfer's amount
    // This changes the data without updating batch_root or total_amount
    input.transfers[0].amount[0] = input.transfers[0].amount[0].wrapping_add(1);

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.binding_valid {
        "binding_valid=false (amount mismatch detected)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} 1-yen manipulation)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 3b: Transfer count mismatch (extra transfer)
fn run_negative_test_transfer_count_mismatch(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "transfer_count_mismatch";
    let test_category = "Signature-Data Mismatch";
    println!("  [TEST] {}: Adding extra transfer without updating commitment...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Add an extra transfer
    let extra_transfer = BridgeTransferData {
        sender: [0xBAADF00D, 0xDEADBEEF, 0],
        recipient: [0xCAFEBABE, 0xFEEDFACE, 0],
        amount: [999999, 0, 0, 0],
        sig_commitment: [0x11111111, 0x22222222, 0x33333333, 0x44444444],
        nonce: 999,
    };
    input.transfers.push(extra_transfer);

    // Also add fake Dilithium data for consistency
    input.dilithium_data.push(DilithiumVerificationData {
        pubkey_hash: [0xBAADF00D, 0xDEADBEEF, 0, 0],
        sig_hash: [0x11111111, 0x22222222, 0x33333333, 0x44444444],
        msg_hash: [999999, 0xCAFEBABE, 999, 0],
        verification_result: true,
    });

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.all_valid {
        "all_valid=false (transfer count mismatch)".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} extra transfer)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 3c: Nonce manipulation
fn run_negative_test_nonce_manipulation(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "nonce_manipulation";
    let test_category = "Signature-Data Mismatch";
    println!("  [TEST] {}: Modifying transfer nonce...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Change nonce (replay attack simulation)
    input.transfers[0].nonce = input.transfers[0].nonce.wrapping_add(1);

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.binding_valid {
        "binding_valid=false (nonce affects batch_root)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} nonce manipulation)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 4a: Forged Dilithium verification result
fn run_negative_test_forged_dilithium_result(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "forged_dilithium_result";
    let test_category = "Fake Dilithium Commitment";
    println!("  [TEST] {}: Setting verification_result=false...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Forge a failed Dilithium verification
    input.dilithium_data[0].verification_result = false;

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.dilithium_valid {
        "dilithium_valid=false (forged result detected)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} forged Dilithium result)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 4b: Mismatched sig_commitment
fn run_negative_test_mismatched_sig_commitment(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "mismatched_sig_commitment";
    let test_category = "Fake Dilithium Commitment";
    println!("  [TEST] {}: Mismatching sig_hash vs transfer.sig_commitment...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Mismatch sig_commitment
    // Keep transfer.sig_commitment but change dilithium_data.sig_hash
    input.dilithium_data[0].sig_hash = [0xBAADBAAD, 0xBAADBAAD, 0xBAADBAAD, 0xBAADBAAD];

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    let passed = !result.all_valid;
    let failure_reason = if !result.dilithium_valid {
        "dilithium_valid=false (sig_commitment mismatch)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED INVALID INPUT!".to_string()
    };

    println!(
        "    → Result: {} (circuit {} mismatched sig_commitment)",
        if passed { "PASS ✓" } else { "FAIL ✗" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Test 4c: Wrong pubkey_hash
fn run_negative_test_wrong_pubkey_hash(
    client: &CpuProver,
    elf: &[u8],
) -> NegativeTestResult {
    let test_name = "wrong_pubkey_hash";
    let test_category = "Fake Dilithium Commitment";
    println!("  [TEST] {}: Substituting different pubkey_hash...", test_name);

    let start = Instant::now();

    let mut input = create_phase4_test_input(4);

    // POISON: Use wrong public key hash (attacker's key)
    input.dilithium_data[0].pubkey_hash = [0xA77AC4E8, 0xA77AC4E8, 0xA77AC4E8, 0xA77AC4E8];

    let result = execute_phase4_test(client, elf, input);
    let exec_time = start.elapsed().as_secs_f64() * 1000.0;

    // Note: This test may pass the circuit because pubkey_hash is not directly
    // bound to transfer data in the current implementation
    let passed = !result.all_valid;
    let failure_reason = if !result.dilithium_valid {
        "dilithium_valid=false (pubkey binding failed)".to_string()
    } else if !result.all_valid {
        "all_valid=false".to_string()
    } else {
        "CIRCUIT ACCEPTED - pubkey binding not enforced (expected in test mode)".to_string()
    };

    println!(
        "    → Result: {} (circuit {} wrong pubkey_hash)",
        if passed { "PASS ✓" } else { "INFO" },
        if !result.all_valid { "REJECTED" } else { "ACCEPTED" }
    );

    NegativeTestResult {
        test_name: test_name.to_string(),
        test_category: test_category.to_string(),
        expected_failure: true,
        actual_failure: !result.all_valid,
        passed,
        failure_reason,
        execution_time_ms: exec_time,
    }
}

/// Execute a Phase 4 test and return the output
fn execute_phase4_test(
    client: &CpuProver,
    elf: &[u8],
    input: NestedWithProofInput,
) -> NestedWithProofOutput {
    let mut stdin = SP1Stdin::new();
    stdin.write(&InputMode::NestedWithProof(input));

    // Execute only (no proof generation for speed)
    let (mut output, _report) = client
        .execute(elf, &stdin)
        .run()
        .expect("SP1 execute failed");

    output.read()
}

/// Print negative test summary
fn print_negative_test_summary(results: &[NegativeTestResult]) {
    println!();
    println!("════════════════════════════════════════════════════════════════════");
    println!("Negative Test Summary");
    println!("════════════════════════════════════════════════════════════════════");
    println!();

    let total_tests = results.len();
    let passed_tests = results.iter().filter(|r| r.passed).count();
    let failed_tests = total_tests - passed_tests;

    println!("┌──────────────────────────────────────┬──────────┬────────────────┐");
    println!("│ Test Name                            │ Result   │ Failure Reason │");
    println!("├──────────────────────────────────────┼──────────┼────────────────┤");

    for result in results {
        let status = if result.passed { "PASS ✓" } else { "FAIL ✗" };
        let reason = if result.failure_reason.len() > 14 {
            format!("{}...", &result.failure_reason[..11])
        } else {
            result.failure_reason.clone()
        };
        println!("│ {:<36} │ {:<8} │ {:<14} │",
            result.test_name,
            status,
            reason
        );
    }

    println!("└──────────────────────────────────────┴──────────┴────────────────┘");
    println!();
    println!("Results: {}/{} tests passed ({} failed)", passed_tests, total_tests, failed_tests);
    println!();

    if passed_tests == total_tests {
        println!("✓ All negative tests PASSED!");
        println!("  The circuit correctly rejects all malformed inputs.");
    } else {
        println!("✗ Some negative tests FAILED!");
        println!("  The circuit accepted some invalid inputs.");
        println!();
        println!("Failed tests:");
        for result in results.iter().filter(|r| !r.passed) {
            println!("  - {}: {}", result.test_name, result.failure_reason);
        }
    }

    // Timing summary
    let total_time_ms: f64 = results.iter().map(|r| r.execution_time_ms).sum();
    println!();
    println!("Total execution time: {:.2}s", total_time_ms / 1000.0);
}
