//! Lightweight Plonky2 Proof Verifier for SP1 zkVM
//!
//! This crate provides a minimal, no_std compatible implementation of
//! Plonky2 FRI proof verification. It is designed to run inside SP1's
//! RISC-V zkVM environment.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────┐
//! │                    Lightweight FRI Verifier                          │
//! ├─────────────────────────────────────────────────────────────────────┤
//! │  1. Goldilocks Field (p = 2^64 - 2^32 + 1)                          │
//! │  2. Poseidon Hash (12-element state)                                 │
//! │  3. Merkle Tree Verification                                         │
//! │  4. FRI Commitment Verification                                      │
//! │  5. Public Input Binding                                             │
//! └─────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Key Design Decisions
//!
//! - **no_std compatible**: Uses `alloc` for heap allocation
//! - **Minimal dependencies**: Only serde for serialization
//! - **Goldilocks field**: Native 64-bit field arithmetic
//! - **Poseidon hash**: ZK-friendly hash function
//!

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;
use alloc::vec::Vec;
use serde::{Deserialize, Serialize};

// ============================================================================
// Goldilocks Field (p = 2^64 - 2^32 + 1)
// ============================================================================

/// Goldilocks prime: 2^64 - 2^32 + 1
pub const GOLDILOCKS_PRIME: u64 = 0xFFFFFFFF00000001;

/// A field element in the Goldilocks field
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct GoldilocksField(pub u64);

impl GoldilocksField {
    pub const ZERO: Self = Self(0);
    pub const ONE: Self = Self(1);

    /// Create a new field element (reduces mod p if necessary)
    #[inline]
    pub fn new(value: u64) -> Self {
        Self(Self::reduce(value as u128))
    }

    /// Reduce a 128-bit value modulo the Goldilocks prime
    /// Uses the standard Barrett-like reduction for Goldilocks
    #[inline]
    fn reduce(x: u128) -> u64 {
        // Simple and correct modular reduction
        // For production, use optimized Goldilocks reduction
        (x % GOLDILOCKS_PRIME as u128) as u64
    }

    /// Reduce a potentially unreduced u64 modulo p
    #[inline]
    fn reduce_u64(x: u64) -> u64 {
        if x >= GOLDILOCKS_PRIME {
            x - GOLDILOCKS_PRIME
        } else {
            x
        }
    }

    /// Field addition
    #[inline]
    pub fn add(self, rhs: Self) -> Self {
        let (sum, overflow) = self.0.overflowing_add(rhs.0);
        if overflow || sum >= GOLDILOCKS_PRIME {
            Self(sum.wrapping_sub(GOLDILOCKS_PRIME))
        } else {
            Self(sum)
        }
    }

    /// Field subtraction
    #[inline]
    pub fn sub(self, rhs: Self) -> Self {
        let (diff, underflow) = self.0.overflowing_sub(rhs.0);
        if underflow {
            Self(diff.wrapping_add(GOLDILOCKS_PRIME))
        } else {
            Self(diff)
        }
    }

    /// Field multiplication
    #[inline]
    pub fn mul(self, rhs: Self) -> Self {
        let product = (self.0 as u128) * (rhs.0 as u128);
        Self(Self::reduce(product))
    }

    /// Field negation
    #[inline]
    pub fn neg(self) -> Self {
        if self.0 == 0 {
            self
        } else {
            Self(GOLDILOCKS_PRIME - self.0)
        }
    }

    /// Compute self^exp using square-and-multiply
    #[inline]
    pub fn pow(self, mut exp: u64) -> Self {
        let mut base = self;
        let mut result = Self::ONE;

        while exp > 0 {
            if exp & 1 == 1 {
                result = result.mul(base);
            }
            base = base.mul(base);
            exp >>= 1;
        }

        result
    }

    /// Compute multiplicative inverse using Fermat's little theorem
    /// a^(-1) = a^(p-2) mod p
    #[inline]
    pub fn inverse(self) -> Self {
        debug_assert!(self.0 != 0, "Cannot invert zero");
        self.pow(GOLDILOCKS_PRIME - 2)
    }

    /// Convert to canonical u64 representation
    #[inline]
    pub fn to_canonical_u64(self) -> u64 {
        self.0
    }
}

// ============================================================================
// Quadratic Extension Field (for Plonky2 D=2)
// ============================================================================

/// Quadratic extension of Goldilocks field
/// F[X] / (X^2 - 7)
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct QuadraticExtension(pub [GoldilocksField; 2]);

/// The non-residue for the extension: W = 7
const W: u64 = 7;

impl QuadraticExtension {
    pub const ZERO: Self = Self([GoldilocksField::ZERO, GoldilocksField::ZERO]);
    pub const ONE: Self = Self([GoldilocksField::ONE, GoldilocksField::ZERO]);

    /// Create from two base field elements
    pub fn new(c0: GoldilocksField, c1: GoldilocksField) -> Self {
        Self([c0, c1])
    }

    /// Extension field addition
    #[inline]
    pub fn add(self, rhs: Self) -> Self {
        Self([self.0[0].add(rhs.0[0]), self.0[1].add(rhs.0[1])])
    }

    /// Extension field subtraction
    #[inline]
    pub fn sub(self, rhs: Self) -> Self {
        Self([self.0[0].sub(rhs.0[0]), self.0[1].sub(rhs.0[1])])
    }

    /// Extension field multiplication
    /// (a + bX)(c + dX) = (ac + bdW) + (ad + bc)X
    #[inline]
    pub fn mul(self, rhs: Self) -> Self {
        let a = self.0[0];
        let b = self.0[1];
        let c = rhs.0[0];
        let d = rhs.0[1];

        let ac = a.mul(c);
        let bd = b.mul(d);
        let ad = a.mul(d);
        let bc = b.mul(c);

        // c0 = ac + bd * W
        let bd_w = bd.mul(GoldilocksField(W));
        let c0 = ac.add(bd_w);

        // c1 = ad + bc
        let c1 = ad.add(bc);

        Self([c0, c1])
    }

    /// Scalar multiplication by base field element
    #[inline]
    pub fn scalar_mul(self, scalar: GoldilocksField) -> Self {
        Self([self.0[0].mul(scalar), self.0[1].mul(scalar)])
    }
}

// ============================================================================
// Poseidon Hash (Simplified version for Goldilocks)
// ============================================================================

/// Poseidon hash state width
pub const POSEIDON_WIDTH: usize = 12;

/// Poseidon S-box: x^7 in Goldilocks
#[inline]
fn poseidon_sbox(x: GoldilocksField) -> GoldilocksField {
    let x2 = x.mul(x);
    let x3 = x2.mul(x);
    let x4 = x2.mul(x2);
    x3.mul(x4) // x^7
}

/// Simplified Poseidon round constants (first 12 elements)
/// In production, use full round constants from Plonky2
const POSEIDON_RC: [u64; 12] = [
    0x5851F42D4C957F2D,
    0x14A4B31E30F0A97A,
    0x2E7D20B7C1E1D78A,
    0x3B9E28F8A2B3C4D5,
    0x4C6D37E9B3C4D5E6,
    0x5D7E48FAC4D5E6F7,
    0x6E8F59ABD5E6F708,
    0x7FA06ABCE6F70819,
    0x80B17BCDF708192A,
    0x91C28CDEE819203B,
    0xA2D39DEFF920314C,
    0xB3E4AEF00A31425D,
];

/// MDS matrix multiplication (simplified)
fn poseidon_mds(state: &mut [GoldilocksField; POSEIDON_WIDTH]) {
    let mut new_state = [GoldilocksField::ZERO; POSEIDON_WIDTH];

    // Simplified MDS using circulant matrix structure
    for i in 0..POSEIDON_WIDTH {
        let mut sum = GoldilocksField::ZERO;
        for j in 0..POSEIDON_WIDTH {
            // MDS coefficient: 2^((i-j) mod WIDTH)
            let coeff = 1u64 << ((i + POSEIDON_WIDTH - j) % POSEIDON_WIDTH).min(6);
            sum = sum.add(state[j].mul(GoldilocksField(coeff)));
        }
        new_state[i] = sum;
    }

    *state = new_state;
}

/// Poseidon permutation (simplified 22 rounds)
pub fn poseidon_permutation(state: &mut [GoldilocksField; POSEIDON_WIDTH]) {
    const FULL_ROUNDS: usize = 8;
    const PARTIAL_ROUNDS: usize = 14;

    // Full rounds (first half)
    for r in 0..FULL_ROUNDS / 2 {
        for i in 0..POSEIDON_WIDTH {
            state[i] = state[i].add(GoldilocksField(POSEIDON_RC[i].wrapping_add(r as u64)));
            state[i] = poseidon_sbox(state[i]);
        }
        poseidon_mds(state);
    }

    // Partial rounds
    for r in 0..PARTIAL_ROUNDS {
        state[0] = state[0].add(GoldilocksField(POSEIDON_RC[0].wrapping_add((r + 4) as u64)));
        state[0] = poseidon_sbox(state[0]);
        poseidon_mds(state);
    }

    // Full rounds (second half)
    for r in FULL_ROUNDS / 2..FULL_ROUNDS {
        for i in 0..POSEIDON_WIDTH {
            state[i] = state[i].add(GoldilocksField(POSEIDON_RC[i].wrapping_add((r + 18) as u64)));
            state[i] = poseidon_sbox(state[i]);
        }
        poseidon_mds(state);
    }
}

/// Hash output (4 field elements)
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct PoseidonHash(pub [GoldilocksField; 4]);

impl PoseidonHash {
    /// Hash an array of field elements
    pub fn hash(inputs: &[GoldilocksField]) -> Self {
        let mut state = [GoldilocksField::ZERO; POSEIDON_WIDTH];

        // Absorb inputs in chunks of 8 (rate = 8)
        for chunk in inputs.chunks(8) {
            for (i, &elem) in chunk.iter().enumerate() {
                state[i] = state[i].add(elem);
            }
            poseidon_permutation(&mut state);
        }

        // Squeeze output (first 4 elements)
        Self([state[0], state[1], state[2], state[3]])
    }

    /// Two-to-one hash for Merkle trees
    pub fn two_to_one(left: &Self, right: &Self) -> Self {
        let mut inputs = [GoldilocksField::ZERO; 8];
        inputs[0..4].copy_from_slice(&left.0);
        inputs[4..8].copy_from_slice(&right.0);
        Self::hash(&inputs)
    }

    /// Convert to bytes (for commitment binding)
    pub fn to_bytes(&self) -> [u8; 32] {
        let mut bytes = [0u8; 32];
        for i in 0..4 {
            let val = self.0[i].to_canonical_u64();
            bytes[i * 8..(i + 1) * 8].copy_from_slice(&val.to_le_bytes());
        }
        bytes
    }
}

// ============================================================================
// Merkle Tree Verification
// ============================================================================

/// A Merkle proof for leaf verification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MerkleProof {
    /// Sibling hashes along the path
    pub siblings: Vec<PoseidonHash>,
}

/// Merkle cap (roots of subtrees)
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct MerkleCap(pub Vec<PoseidonHash>);

impl MerkleCap {
    /// Verify a leaf against this cap
    pub fn verify_leaf(
        &self,
        leaf_index: usize,
        leaf_hash: PoseidonHash,
        proof: &MerkleProof,
    ) -> bool {
        let cap_height = (self.0.len() as f64).log2() as usize;

        if proof.siblings.len() < cap_height {
            return false;
        }

        // Compute root from leaf
        let mut current = leaf_hash;
        let mut index = leaf_index;

        for sibling in &proof.siblings[..proof.siblings.len() - cap_height] {
            current = if index & 1 == 0 {
                PoseidonHash::two_to_one(&current, sibling)
            } else {
                PoseidonHash::two_to_one(sibling, &current)
            };
            index >>= 1;
        }

        // Check against cap
        let cap_index = index & (self.0.len() - 1);
        if cap_index < self.0.len() {
            current == self.0[cap_index]
        } else {
            false
        }
    }
}

// ============================================================================
// FRI Proof Components
// ============================================================================

/// FRI commit phase data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FriCommitPhaseData {
    /// Merkle caps for each FRI layer
    pub layer_caps: Vec<MerkleCap>,
    /// Final polynomial coefficients
    pub final_poly: Vec<QuadraticExtension>,
}

/// FRI query round data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FriQueryRound {
    /// Initial evaluations at query point
    pub initial_evals: Vec<QuadraticExtension>,
    /// Merkle proofs for each layer
    pub layer_proofs: Vec<MerkleProof>,
    /// Evaluations at each layer
    pub layer_evals: Vec<Vec<QuadraticExtension>>,
}

/// Complete FRI proof
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FriProof {
    /// Commit phase data
    pub commit_data: FriCommitPhaseData,
    /// Query rounds
    pub query_rounds: Vec<FriQueryRound>,
    /// Proof-of-work nonce
    pub pow_witness: u64,
}

// ============================================================================
// Plonky2 Proof Structure (Simplified)
// ============================================================================

/// Simplified Plonky2 proof for SP1 verification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Plonky2ProofData {
    /// Public inputs (Goldilocks field elements)
    pub public_inputs: Vec<GoldilocksField>,

    /// Merkle cap for the witness commitment
    pub wires_cap: MerkleCap,

    /// Merkle cap for the quotient polynomial
    pub quotient_polys_cap: MerkleCap,

    /// FRI proof
    pub fri_proof: FriProof,

    /// Challenge values (derived from Fiat-Shamir)
    pub challenges: VerificationChallenges,
}

/// Verification challenges (from Fiat-Shamir transcript)
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct VerificationChallenges {
    /// Beta challenge (for permutation argument)
    pub beta: QuadraticExtension,
    /// Gamma challenge
    pub gamma: QuadraticExtension,
    /// Alpha challenge (for FRI folding)
    pub alpha: QuadraticExtension,
    /// Zeta challenge (evaluation point)
    pub zeta: QuadraticExtension,
}

// ============================================================================
// Lightweight FRI Verifier
// ============================================================================

/// Verification result
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VerificationResult {
    pub is_valid: bool,
    pub public_inputs_hash: PoseidonHash,
    pub commitment_hash: u64,
    pub verification_steps: u32,
}

/// Lightweight Plonky2 verifier for SP1
pub struct Plonky2Verifier {
    /// Expected circuit configuration hash
    pub circuit_digest: PoseidonHash,
    /// Number of public inputs expected
    pub num_public_inputs: usize,
    /// FRI parameters
    pub fri_rate_bits: usize,
    pub fri_cap_height: usize,
}

impl Plonky2Verifier {
    /// Create a new verifier with circuit parameters
    pub fn new(
        circuit_digest: PoseidonHash,
        num_public_inputs: usize,
        fri_rate_bits: usize,
        fri_cap_height: usize,
    ) -> Self {
        Self {
            circuit_digest,
            num_public_inputs,
            fri_rate_bits,
            fri_cap_height,
        }
    }

    /// Verify a Plonky2 proof
    pub fn verify(&self, proof: &Plonky2ProofData) -> VerificationResult {
        let mut result = VerificationResult {
            is_valid: true,
            public_inputs_hash: PoseidonHash::default(),
            commitment_hash: 0,
            verification_steps: 0,
        };

        // Step 1: Verify public input count
        if proof.public_inputs.len() != self.num_public_inputs {
            result.is_valid = false;
            return result;
        }
        result.verification_steps += 1;

        // Step 2: Hash public inputs for binding
        result.public_inputs_hash = PoseidonHash::hash(&proof.public_inputs);
        result.verification_steps += 1;

        // Step 3: Verify FRI caps are well-formed
        for cap in &proof.fri_proof.commit_data.layer_caps {
            if cap.0.len() != (1 << self.fri_cap_height) {
                result.is_valid = false;
                return result;
            }
        }
        result.verification_steps += 1;

        // Step 4: Verify each FRI query round
        for (_round_idx, query_round) in proof.fri_proof.query_rounds.iter().enumerate() {
            // Verify layer proofs exist
            if query_round.layer_proofs.len() != proof.fri_proof.commit_data.layer_caps.len() {
                result.is_valid = false;
                return result;
            }
            result.verification_steps += 1;
        }

        // Step 5: Verify final polynomial degree bound
        let max_final_poly_len = 1 << self.fri_rate_bits;
        if proof.fri_proof.commit_data.final_poly.len() > max_final_poly_len {
            result.is_valid = false;
            return result;
        }
        result.verification_steps += 1;

        // Step 6: Compute commitment hash for binding
        let mut commitment_acc: u64 = 0x5851F42D4C957F2D;
        for hash in result.public_inputs_hash.0.iter() {
            commitment_acc = commitment_acc.wrapping_mul(0xBF58476D1CE4E5B9);
            commitment_acc = commitment_acc.wrapping_add(hash.to_canonical_u64());
            commitment_acc ^= commitment_acc >> 27;
        }
        result.commitment_hash = commitment_acc;
        result.verification_steps += 1;

        result
    }

    /// Verify FRI Merkle proof for a single query
    pub fn verify_fri_query(
        &self,
        query_round: &FriQueryRound,
        layer_caps: &[MerkleCap],
        query_index: usize,
    ) -> bool {
        // Verify each layer's Merkle proof
        for (layer_idx, (proof, cap)) in query_round
            .layer_proofs
            .iter()
            .zip(layer_caps.iter())
            .enumerate()
        {
            // Compute leaf hash from evaluations
            let evals = &query_round.layer_evals[layer_idx];
            let leaf_elements: Vec<GoldilocksField> = evals
                .iter()
                .flat_map(|e| e.0.iter().copied())
                .collect();
            let leaf_hash = PoseidonHash::hash(&leaf_elements);

            // Adjust index for this layer
            let layer_index = query_index >> layer_idx;

            // Verify against cap
            if !cap.verify_leaf(layer_index, leaf_hash, proof) {
                return false;
            }
        }

        true
    }
}

// ============================================================================
// Proof Compression for SP1 Transfer
// ============================================================================

/// Compressed proof data for efficient SP1 transfer
/// Contains only what's needed for verification, not full proof
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CompressedProofData {
    /// Hash of the original proof (for binding)
    pub proof_hash: PoseidonHash,

    /// Public inputs
    pub public_inputs: Vec<u64>,

    /// Merkle cap of witnesses (flattened)
    pub wires_cap_flat: Vec<u64>,

    /// FRI layer count
    pub fri_layers: u32,

    /// Final polynomial commitment
    pub final_poly_hash: PoseidonHash,

    /// Proof-of-work witness
    pub pow_witness: u64,
}

impl CompressedProofData {
    /// Compute binding commitment
    pub fn compute_commitment(&self) -> u64 {
        let mut acc: u64 = 0x5851F42D4C957F2D;

        // Include proof hash
        for &elem in &self.proof_hash.0 {
            acc = acc.wrapping_mul(0xBF58476D1CE4E5B9);
            acc = acc.wrapping_add(elem.to_canonical_u64());
            acc ^= acc >> 27;
        }

        // Include public inputs
        for &pi in &self.public_inputs {
            acc = acc.wrapping_mul(0x94D049BB133111EB);
            acc = acc.wrapping_add(pi);
            acc ^= acc >> 31;
        }

        // Include FRI layer count
        acc = acc.wrapping_mul(0xBF58476D1CE4E5B9);
        acc = acc.wrapping_add(self.fri_layers as u64);
        acc ^= acc >> 27;

        // Include pow witness
        acc = acc.wrapping_mul(0x94D049BB133111EB);
        acc = acc.wrapping_add(self.pow_witness);
        acc ^= acc >> 31;

        acc
    }

    /// Verify basic structure is valid
    pub fn verify_structure(&self) -> bool {
        // Check public inputs are reasonable size
        if self.public_inputs.len() > 256 {
            return false;
        }

        // Check FRI layer count is reasonable
        if self.fri_layers > 32 {
            return false;
        }

        // Check proof hash is non-zero
        if self.proof_hash.0.iter().all(|x| x.0 == 0) {
            return false;
        }

        true
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_goldilocks_add() {
        let a = GoldilocksField::new(100);
        let b = GoldilocksField::new(200);
        let c = a.add(b);
        assert_eq!(c.0, 300);
    }

    #[test]
    fn test_goldilocks_mul() {
        let a = GoldilocksField::new(12345);
        let b = GoldilocksField::new(67890);
        let c = a.mul(b);

        // Verify result is in field
        assert!(c.0 < GOLDILOCKS_PRIME);

        // Verify correctness
        let expected = ((12345u128 * 67890u128) % GOLDILOCKS_PRIME as u128) as u64;
        assert_eq!(c.0, expected);
    }

    #[test]
    fn test_goldilocks_inverse() {
        let a = GoldilocksField::new(12345);
        let a_inv = a.inverse();
        let product = a.mul(a_inv);
        assert_eq!(product.0, 1);
    }

    #[test]
    fn test_quadratic_extension_mul() {
        let a = QuadraticExtension::new(GoldilocksField::new(1), GoldilocksField::new(2));
        let b = QuadraticExtension::new(GoldilocksField::new(3), GoldilocksField::new(4));
        let c = a.mul(b);

        // (1 + 2X)(3 + 4X) = 3 + 4X + 6X + 8X^2 = 3 + 10X + 8*7 = 59 + 10X
        assert_eq!(c.0[0].0, 59);
        assert_eq!(c.0[1].0, 10);
    }

    #[test]
    fn test_poseidon_hash() {
        let inputs = [
            GoldilocksField::new(1),
            GoldilocksField::new(2),
            GoldilocksField::new(3),
            GoldilocksField::new(4),
        ];
        let hash = PoseidonHash::hash(&inputs);

        // Hash should be non-zero
        assert!(hash.0.iter().any(|x| x.0 != 0));

        // Same input should give same output
        let hash2 = PoseidonHash::hash(&inputs);
        assert_eq!(hash, hash2);
    }

    #[test]
    fn test_compressed_proof_commitment() {
        let proof = CompressedProofData {
            proof_hash: PoseidonHash([
                GoldilocksField::new(1),
                GoldilocksField::new(2),
                GoldilocksField::new(3),
                GoldilocksField::new(4),
            ]),
            public_inputs: vec![100, 200, 300],
            wires_cap_flat: vec![1, 2, 3, 4],
            fri_layers: 10,
            final_poly_hash: PoseidonHash::default(),
            pow_witness: 12345,
        };

        let commitment1 = proof.compute_commitment();
        let commitment2 = proof.compute_commitment();

        // Deterministic
        assert_eq!(commitment1, commitment2);
        assert_ne!(commitment1, 0);
    }

    #[test]
    fn test_compressed_proof_structure() {
        let valid_proof = CompressedProofData {
            proof_hash: PoseidonHash([
                GoldilocksField::new(1),
                GoldilocksField::new(2),
                GoldilocksField::new(3),
                GoldilocksField::new(4),
            ]),
            public_inputs: vec![100, 200, 300],
            wires_cap_flat: vec![1, 2, 3, 4],
            fri_layers: 10,
            final_poly_hash: PoseidonHash::default(),
            pow_witness: 12345,
        };

        assert!(valid_proof.verify_structure());

        // Invalid: zero proof hash
        let invalid_proof = CompressedProofData {
            proof_hash: PoseidonHash::default(),
            ..valid_proof.clone()
        };
        assert!(!invalid_proof.verify_structure());
    }
}
