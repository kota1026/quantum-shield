//! Shared Types for Quantum-Resistant STARK Proof System
//!
//! This crate defines the data structures exchanged between:
//! - STARK prover (generates bridge aggregation proofs)
//! - On-chain STARK verifier (verifies proofs via FRI)
//!
//! Architecture:
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────┐
//! │                    Quantum-Resistant Proof Pipeline                  │
//! ├─────────────────────────────────────────────────────────────────────┤
//! │                                                                      │
//! │  Stage 1: STARK Aggregation (Fast, Quantum-Resistant)               │
//! │  ┌─────────────────────────────────────────────────────────────┐   │
//! │  │  8 Bridge Transfers → STARK proof → ~90KB proof             │   │
//! │  │  Output: BridgeProofCommitment (public inputs + hash)        │   │
//! │  │  Quantum-safe: Hash-based, no elliptic curves                │   │
//! │  └─────────────────────────────────────────────────────────────┘   │
//! │                              │                                       │
//! │                              ▼                                       │
//! │  L1 Contract: Verify STARK proof via native FRI (~2-6M gas)         │
//! │  - Level 1: Structure + binding verification                         │
//! │  - Level 2: Full FRI low-degree test (128-bit security)             │
//! │                                                                      │
//! └─────────────────────────────────────────────────────────────────────┘
//! ```

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;
use alloc::vec::Vec;
use serde::{Deserialize, Serialize};

// ============================================================================
// Plonky2 Bridge Proof Commitment
// ============================================================================

/// Commitment from Plonky2 bridge aggregation proof
///
/// This is what SP1 verifies - the public outputs of the Plonky2 proof
/// plus a commitment hash that ties everything together.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BridgeProofCommitment {
    /// Number of transfers in this batch
    pub num_transfers: u32,

    /// Batch root hash (Poseidon hash chain of all transfers)
    /// Stored as 4 x 64-bit limbs (256-bit hash)
    pub batch_root: [u64; 4],

    /// Total amount transferred in this batch
    /// Stored as 4 x 64-bit limbs (256-bit value)
    pub total_amount: [u64; 4],

    /// Dilithium signature verification commitment
    /// Hash of all verified Dilithium public keys
    pub dilithium_commitment: [u64; 4],

    /// Plonky2 proof digest (for binding)
    /// This is a hash of the Plonky2 proof itself
    pub proof_digest: [u64; 4],

    /// Circuit identifier (version for upgradability)
    pub circuit_version: u32,
}

impl Default for BridgeProofCommitment {
    fn default() -> Self {
        Self {
            num_transfers: 0,
            batch_root: [0; 4],
            total_amount: [0; 4],
            dilithium_commitment: [0; 4],
            proof_digest: [0; 4],
            circuit_version: 1,
        }
    }
}

impl BridgeProofCommitment {
    /// Compute a binding hash of this commitment
    pub fn compute_hash(&self) -> u64 {
        let mut h: u64 = 0x5851F42D4C957F2D;

        h = hash_u32(h, self.num_transfers);
        h = hash_array(h, &self.batch_root);
        h = hash_array(h, &self.total_amount);
        h = hash_array(h, &self.dilithium_commitment);
        h = hash_array(h, &self.proof_digest);
        h = hash_u32(h, self.circuit_version);

        h
    }
}

// ============================================================================
// Individual Transfer Data
// ============================================================================

/// A single bridge transfer (serializable format)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BridgeTransferData {
    /// Sender's address (Ethereum, 160 bits as 3 x 64-bit)
    pub sender: [u64; 3],

    /// Recipient's address
    pub recipient: [u64; 3],

    /// Amount (256-bit as 4 x 64-bit)
    pub amount: [u64; 4],

    /// Dilithium signature commitment (hash of signature)
    pub sig_commitment: [u64; 4],

    /// Nonce for replay protection
    pub nonce: u64,
}

impl Default for BridgeTransferData {
    fn default() -> Self {
        Self {
            sender: [0; 3],
            recipient: [0; 3],
            amount: [0; 4],
            sig_commitment: [0; 4],
            nonce: 0,
        }
    }
}

// ============================================================================
// SP1 Input for Nested Verification
// ============================================================================

/// Input to SP1 for the nested proof verification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NestedVerificationInput {
    /// The Plonky2 proof commitment to verify
    pub plonky2_commitment: BridgeProofCommitment,

    /// Individual transfer data (for Dilithium verification)
    pub transfers: Vec<BridgeTransferData>,

    /// Dilithium verification data
    /// (public keys + signatures - in practice, these would be hashes)
    pub dilithium_data: Vec<DilithiumVerificationData>,

    /// Expected final commitment hash (for binding check)
    pub expected_commitment_hash: u64,
}

/// Dilithium signature verification data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DilithiumVerificationData {
    /// Hash of Dilithium public key
    pub pubkey_hash: [u64; 4],

    /// Hash of signature
    pub sig_hash: [u64; 4],

    /// Message hash that was signed
    pub msg_hash: [u64; 4],

    /// Pre-computed verification result (true if valid)
    /// In production, SP1 would verify the actual signature
    pub verification_result: bool,
}

impl Default for DilithiumVerificationData {
    fn default() -> Self {
        Self {
            pubkey_hash: [0; 4],
            sig_hash: [0; 4],
            msg_hash: [0; 4],
            verification_result: false,
        }
    }
}

// ============================================================================
// STARK Output (public inputs for on-chain verification)
// ============================================================================

/// Output from STARK nested verification
///
/// This becomes the public inputs for on-chain STARK verification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NestedVerificationOutput {
    /// Whether all verifications passed
    pub all_valid: bool,

    /// Number of transfers verified
    pub num_transfers: u32,

    /// Final batch root (from Plonky2)
    pub batch_root: [u64; 4],

    /// Total amount in batch
    pub total_amount: [u64; 4],

    /// Combined commitment hash (binds everything)
    pub final_commitment: u64,

    /// Number of Dilithium signatures verified
    pub dilithium_sigs_verified: u32,
}

impl Default for NestedVerificationOutput {
    fn default() -> Self {
        Self {
            all_valid: false,
            num_transfers: 0,
            batch_root: [0; 4],
            total_amount: [0; 4],
            final_commitment: 0,
            dilithium_sigs_verified: 0,
        }
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Simple hash function for commitment computation
fn hash_u32(acc: u64, val: u32) -> u64 {
    let mut h = acc;
    h = h.wrapping_mul(0xBF58476D1CE4E5B9);
    h = h.wrapping_add(val as u64);
    h = h ^ (h >> 27);
    h
}

fn hash_array(acc: u64, arr: &[u64]) -> u64 {
    let mut h = acc;
    for &val in arr {
        h = h.wrapping_mul(0x94D049BB133111EB);
        h = h.wrapping_add(val);
        h = h ^ (h >> 31);
    }
    h
}

// ============================================================================
// Performance Constants
// ============================================================================

/// Expected STARK proof size for 8 transfers (~90KB)
pub const STARK_PROOF_SIZE_8_TRANSFERS: usize = 92_232;

/// Expected compressed STARK proof size (~50KB)
pub const STARK_COMPRESSED_PROOF_SIZE: usize = 50_000;

/// L1 gas cost for STARK verification Level 1 (~500K gas)
pub const STARK_LEVEL1_VERIFICATION_GAS: u64 = 500_000;

/// L1 gas cost for STARK verification Level 2 (~2-6M gas)
pub const STARK_LEVEL2_VERIFICATION_GAS: u64 = 4_000_000;

/// L1 gas cost for calldata (proof + public inputs)
/// ~50KB proof + ~256 bytes public inputs
/// At 16 gas/byte = ~800K gas
pub const STARK_CALLDATA_GAS: u64 = 800_000;

/// Total estimated L1 gas for STARK verification (Level 2)
pub const TOTAL_L1_GAS_ESTIMATE: u64 = STARK_LEVEL2_VERIFICATION_GAS + STARK_CALLDATA_GAS;

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_commitment_hash_deterministic() {
        let commitment = BridgeProofCommitment {
            num_transfers: 8,
            batch_root: [1, 2, 3, 4],
            total_amount: [1000, 0, 0, 0],
            dilithium_commitment: [0xDEADBEEF, 0xCAFEBABE, 0, 0],
            proof_digest: [0x12345678, 0, 0, 0],
            circuit_version: 1,
        };

        let hash1 = commitment.compute_hash();
        let hash2 = commitment.compute_hash();

        assert_eq!(hash1, hash2, "Hash should be deterministic");
        assert_ne!(hash1, 0, "Hash should be non-zero");
    }

    #[test]
    fn test_different_commitments_different_hashes() {
        let commitment1 = BridgeProofCommitment {
            num_transfers: 8,
            ..Default::default()
        };

        let commitment2 = BridgeProofCommitment {
            num_transfers: 4,
            ..Default::default()
        };

        assert_ne!(
            commitment1.compute_hash(),
            commitment2.compute_hash(),
            "Different commitments should have different hashes"
        );
    }

    #[test]
    fn test_default_values() {
        let commitment = BridgeProofCommitment::default();
        assert_eq!(commitment.num_transfers, 0);
        assert_eq!(commitment.circuit_version, 1);

        let transfer = BridgeTransferData::default();
        assert_eq!(transfer.nonce, 0);
    }
}
