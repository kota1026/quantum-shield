//! Bridge Aggregation Circuit for Quantum Shield Bridge
//!
//! This module implements a Plonky2 circuit for aggregating multiple
//! Dilithium signature verification results into a single proof.
//!
//! Architecture:
//! ┌─────────────────────────────────────────────────────────────────┐
//! │                    Bridge Aggregation Circuit                    │
//! ├─────────────────────────────────────────────────────────────────┤
//! │  Input: N transfer requests, each with:                          │
//! │    - sender_address                                              │
//! │    - recipient_address                                           │
//! │    - amount                                                      │
//! │    - dilithium_sig_commitment                                    │
//! │                                                                   │
//! │  Circuit Operations:                                              │
//! │    1. Hash chain all transfer data                               │
//! │    2. Aggregate signature verification commitments               │
//! │    3. Output: batch_root, total_amount, num_transfers            │
//! └─────────────────────────────────────────────────────────────────┘
//!
//! Target: 8 transfers aggregated in < 2 seconds

use anyhow::Result;
use plonky2::field::goldilocks_field::GoldilocksField;
use plonky2::field::types::Field;
use plonky2::hash::hash_types::{HashOut, RichField};
use plonky2::hash::poseidon::PoseidonHash;
use plonky2::iop::target::{BoolTarget, Target};
use plonky2::iop::witness::{PartialWitness, WitnessWrite};
use plonky2::plonk::circuit_builder::CircuitBuilder;
use plonky2::plonk::circuit_data::{CircuitConfig, CircuitData};
use plonky2::plonk::config::{GenericConfig, PoseidonGoldilocksConfig};
use plonky2::plonk::proof::ProofWithPublicInputs;
use plonky2::hash::hashing::PlonkyPermutation;

use instant::Instant;
use log::info;

type F = GoldilocksField;
type C = PoseidonGoldilocksConfig;
const D: usize = 2;

// ============================================================================
// Bridge Transfer Representation
// ============================================================================

/// A single transfer in the bridge batch
#[derive(Clone, Debug)]
pub struct BridgeTransfer {
    /// Sender's Ethereum address (160 bits, stored as 3 field elements)
    pub sender: [u64; 3],
    /// Recipient's Ethereum address
    pub recipient: [u64; 3],
    /// Transfer amount in wei (stored as 4 field elements for 256-bit value)
    pub amount: [u64; 4],
    /// Dilithium signature verification commitment hash
    /// This is the output from SP1's aggregated Dilithium verification
    pub dilithium_commitment: [u64; 4],
    /// Nonce for replay protection
    pub nonce: u64,
}

impl Default for BridgeTransfer {
    fn default() -> Self {
        Self {
            sender: [0; 3],
            recipient: [0; 3],
            amount: [0; 4],
            dilithium_commitment: [0; 4],
            nonce: 0,
        }
    }
}

/// Targets for a transfer in the circuit
#[derive(Clone)]
pub struct TransferTargets {
    pub sender: [Target; 3],
    pub recipient: [Target; 3],
    pub amount: [Target; 4],
    pub dilithium_commitment: [Target; 4],
    pub nonce: Target,
}

// ============================================================================
// Bridge Aggregation Circuit
// ============================================================================

/// Circuit for aggregating bridge transfers
pub struct BridgeAggregationCircuit {
    /// Maximum number of transfers in a batch
    pub max_batch_size: usize,
    /// Circuit data after build
    pub circuit_data: Option<CircuitData<F, C, D>>,
    /// Transfer targets
    pub transfer_targets: Vec<TransferTargets>,
    /// Number of active transfers target
    pub num_transfers_target: Option<Target>,
    /// Batch root output target (hash of all transfers)
    pub batch_root_targets: Option<[Target; 4]>,
    /// Total amount output target
    pub total_amount_targets: Option<[Target; 4]>,
}

impl BridgeAggregationCircuit {
    /// Create a new bridge aggregation circuit
    pub fn new(max_batch_size: usize) -> Self {
        Self {
            max_batch_size,
            circuit_data: None,
            transfer_targets: Vec::new(),
            num_transfers_target: None,
            batch_root_targets: None,
            total_amount_targets: None,
        }
    }

    /// Build the aggregation circuit
    pub fn build(&mut self) -> Result<()> {
        let config = CircuitConfig::standard_recursion_config();
        let mut builder = CircuitBuilder::<F, D>::new(config);

        // Number of active transfers (public input)
        let num_transfers = builder.add_virtual_target();
        builder.register_public_input(num_transfers);
        self.num_transfers_target = Some(num_transfers);

        // Create targets for each transfer
        let mut transfer_targets = Vec::with_capacity(self.max_batch_size);
        for _ in 0..self.max_batch_size {
            let targets = TransferTargets {
                sender: [
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                ],
                recipient: [
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                ],
                amount: [
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                ],
                dilithium_commitment: [
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                    builder.add_virtual_target(),
                ],
                nonce: builder.add_virtual_target(),
            };
            transfer_targets.push(targets);
        }

        // Compute hash chain of all transfers
        let batch_root = self.build_hash_chain(&mut builder, &transfer_targets);

        // Register batch root as public output
        for target in &batch_root {
            builder.register_public_input(*target);
        }
        self.batch_root_targets = Some(batch_root);

        // Compute total amount
        let total_amount = self.build_amount_sum(&mut builder, &transfer_targets);
        for target in &total_amount {
            builder.register_public_input(*target);
        }
        self.total_amount_targets = Some(total_amount);

        // Verify all Dilithium commitments are non-zero (valid signature)
        for transfer in &transfer_targets {
            self.build_commitment_check(&mut builder, &transfer.dilithium_commitment);
        }

        self.transfer_targets = transfer_targets;

        // Build the circuit
        let circuit_data = builder.build::<C>();
        self.circuit_data = Some(circuit_data);

        Ok(())
    }

    /// Build hash chain: H(H(H(t0) || t1) || t2) ...
    fn build_hash_chain(
        &self,
        builder: &mut CircuitBuilder<F, D>,
        transfers: &[TransferTargets],
    ) -> [Target; 4] {
        // Start with hash of first transfer
        let mut current_hash = self.hash_transfer(builder, &transfers[0]);

        // Chain remaining transfers
        for transfer in transfers.iter().skip(1) {
            let transfer_hash = self.hash_transfer(builder, transfer);

            // Combine: H(current_hash || transfer_hash)
            let mut combined = Vec::with_capacity(8);
            combined.extend_from_slice(&current_hash);
            combined.extend_from_slice(&transfer_hash);

            let new_hash = builder.hash_n_to_hash_no_pad::<PoseidonHash>(combined);
            current_hash = new_hash.elements;
        }

        current_hash
    }

    /// Hash a single transfer
    fn hash_transfer(
        &self,
        builder: &mut CircuitBuilder<F, D>,
        transfer: &TransferTargets,
    ) -> [Target; 4] {
        let mut inputs = Vec::with_capacity(15);

        // sender (3) + recipient (3) + amount (4) + commitment (4) + nonce (1) = 15
        inputs.extend_from_slice(&transfer.sender);
        inputs.extend_from_slice(&transfer.recipient);
        inputs.extend_from_slice(&transfer.amount);
        inputs.extend_from_slice(&transfer.dilithium_commitment);
        inputs.push(transfer.nonce);

        let hash = builder.hash_n_to_hash_no_pad::<PoseidonHash>(inputs);
        hash.elements
    }

    /// Sum all transfer amounts
    fn build_amount_sum(
        &self,
        builder: &mut CircuitBuilder<F, D>,
        transfers: &[TransferTargets],
    ) -> [Target; 4] {
        let zero = builder.zero();
        let mut total = [zero, zero, zero, zero];

        for transfer in transfers {
            // Simple addition (in practice, need carry handling for 256-bit)
            for i in 0..4 {
                total[i] = builder.add(total[i], transfer.amount[i]);
            }
        }

        total
    }

    /// Verify Dilithium commitment is non-zero
    fn build_commitment_check(
        &self,
        builder: &mut CircuitBuilder<F, D>,
        commitment: &[Target; 4],
    ) {
        // At least one element should be non-zero
        let zero = builder.zero();
        let mut is_all_zero = builder.is_equal(commitment[0], zero);

        for &elem in commitment.iter().skip(1) {
            let is_zero = builder.is_equal(elem, zero);
            is_all_zero = builder.and(is_all_zero, is_zero);
        }

        // Invert: we want NOT all_zero
        let one = builder.one();
        let is_valid = builder.sub(one, is_all_zero.target);

        // Assert non-zero (is_valid == 1)
        builder.connect(is_valid, one);
    }

    /// Generate proof for a batch of transfers
    pub fn prove(&self, transfers: &[BridgeTransfer]) -> Result<ProofWithPublicInputs<F, C, D>> {
        let circuit_data = self.circuit_data.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Circuit not built"))?;

        let mut pw = PartialWitness::new();

        // Set number of transfers
        pw.set_target(
            self.num_transfers_target.unwrap(),
            F::from_canonical_usize(transfers.len()),
        );

        // Set transfer data
        for (i, transfer_target) in self.transfer_targets.iter().enumerate() {
            let transfer = transfers.get(i).cloned().unwrap_or_default();

            for (j, &target) in transfer_target.sender.iter().enumerate() {
                pw.set_target(target, F::from_canonical_u64(transfer.sender[j]));
            }
            for (j, &target) in transfer_target.recipient.iter().enumerate() {
                pw.set_target(target, F::from_canonical_u64(transfer.recipient[j]));
            }
            for (j, &target) in transfer_target.amount.iter().enumerate() {
                pw.set_target(target, F::from_canonical_u64(transfer.amount[j]));
            }
            for (j, &target) in transfer_target.dilithium_commitment.iter().enumerate() {
                pw.set_target(target, F::from_canonical_u64(transfer.dilithium_commitment[j]));
            }
            pw.set_target(transfer_target.nonce, F::from_canonical_u64(transfer.nonce));
        }

        let proof = circuit_data.prove(pw)?;
        Ok(proof)
    }

    /// Verify a proof
    pub fn verify(&self, proof: &ProofWithPublicInputs<F, C, D>) -> Result<()> {
        let circuit_data = self.circuit_data.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Circuit not built"))?;

        circuit_data.verify(proof.clone())?;
        Ok(())
    }
}

// ============================================================================
// Benchmark Functions
// ============================================================================

/// Run bridge aggregation benchmark
pub fn run_bridge_benchmark(batch_sizes: &[usize]) -> Result<Vec<BridgeBenchResult>> {
    let mut results = Vec::new();

    println!();
    println!("═══════════════════════════════════════════════════════════════════");
    println!("Bridge Aggregation Circuit Benchmark");
    println!("Target: 8 transfers in < 2 seconds");
    println!("═══════════════════════════════════════════════════════════════════");
    println!();

    for &batch_size in batch_sizes {
        info!("Testing batch_size = {}", batch_size);

        // Build circuit
        let build_start = Instant::now();
        let mut circuit = BridgeAggregationCircuit::new(batch_size);
        circuit.build()?;
        let build_time = build_start.elapsed().as_secs_f64();

        let circuit_data = circuit.circuit_data.as_ref().unwrap();
        let common_data = &circuit_data.common;

        // Create test transfers
        let transfers: Vec<BridgeTransfer> = (0..batch_size)
            .map(|i| BridgeTransfer {
                sender: [0x1234 + i as u64, 0x5678, 0],
                recipient: [0xABCD + i as u64, 0xEF01, 0],
                amount: [1_000_000_000_000_000_000u64, 0, 0, 0], // 1 ETH
                dilithium_commitment: [
                    0xDEADBEEF + i as u64,
                    0xCAFEBABE,
                    0x12345678,
                    0x9ABCDEF0,
                ],
                nonce: i as u64,
            })
            .collect();

        // Generate proof
        let prove_start = Instant::now();
        let proof = circuit.prove(&transfers)?;
        let prove_time = prove_start.elapsed().as_secs_f64();

        // Verify proof
        let verify_start = Instant::now();
        circuit.verify(&proof)?;
        let verify_time = verify_start.elapsed().as_secs_f64();

        // Serialize proof to get size
        let proof_bytes = bincode::serialize(&proof)?;

        let result = BridgeBenchResult {
            batch_size,
            circuit_build_ms: build_time * 1000.0,
            prove_ms: prove_time * 1000.0,
            verify_ms: verify_time * 1000.0,
            proof_size_bytes: proof_bytes.len(),
            num_gates: common_data.degree(),
            meets_target: prove_time < 2.0,
        };

        println!(
            "Batch {:>2}: prove={:>7.2}ms verify={:>6.2}ms size={:>7} gates={:>6} {}",
            batch_size,
            result.prove_ms,
            result.verify_ms,
            format_bytes(result.proof_size_bytes),
            result.num_gates,
            if result.meets_target { "✓" } else { "✗" }
        );

        results.push(result);
    }

    Ok(results)
}

/// Benchmark result for bridge aggregation
#[derive(Debug)]
pub struct BridgeBenchResult {
    pub batch_size: usize,
    pub circuit_build_ms: f64,
    pub prove_ms: f64,
    pub verify_ms: f64,
    pub proof_size_bytes: usize,
    pub num_gates: usize,
    pub meets_target: bool,
}

fn format_bytes(bytes: usize) -> String {
    if bytes >= 1_048_576 {
        format!("{:.2}MB", bytes as f64 / 1_048_576.0)
    } else if bytes >= 1024 {
        format!("{:.2}KB", bytes as f64 / 1024.0)
    } else {
        format!("{}B", bytes)
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_transfer() -> Result<()> {
        let mut circuit = BridgeAggregationCircuit::new(1);
        circuit.build()?;

        let transfer = BridgeTransfer {
            sender: [0x1234, 0x5678, 0],
            recipient: [0xABCD, 0xEF01, 0],
            amount: [1_000_000_000, 0, 0, 0],
            dilithium_commitment: [0xDEADBEEF, 0xCAFEBABE, 0x12345678, 0x9ABCDEF0],
            nonce: 1,
        };

        let proof = circuit.prove(&[transfer])?;
        circuit.verify(&proof)?;

        Ok(())
    }

    #[test]
    fn test_batch_8_transfers() -> Result<()> {
        let mut circuit = BridgeAggregationCircuit::new(8);
        circuit.build()?;

        let transfers: Vec<BridgeTransfer> = (0..8)
            .map(|i| BridgeTransfer {
                sender: [0x1234 + i, 0x5678, 0],
                recipient: [0xABCD + i, 0xEF01, 0],
                amount: [1_000_000_000, 0, 0, 0],
                dilithium_commitment: [0xDEADBEEF, 0xCAFEBABE, 0x12345678, 0x9ABCDEF0],
                nonce: i,
            })
            .collect();

        let proof = circuit.prove(&transfers)?;
        circuit.verify(&proof)?;

        Ok(())
    }
}
