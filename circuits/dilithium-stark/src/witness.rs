//! Witness Generation for Dilithium STARK
//!
//! This module handles the generation of execution traces (witnesses)
//! from Dilithium signature verification.

use super::{Witness, PublicInputs};
use super::hash::generate_keccak_trace;
use super::verification::generate_verification_trace;

// =============================================================================
// Full Witness Generation
// =============================================================================

/// Complete execution trace for Dilithium verification STARK
pub struct FullTrace {
    /// Public inputs (commitment hash, validity)
    pub public_inputs: PublicInputs,

    /// Keccak trace for public key hash
    pub pk_hash_trace: super::hash::KeccakTrace,

    /// Keccak trace for message hash
    pub msg_hash_trace: super::hash::KeccakTrace,

    /// NTT traces for polynomial operations
    pub ntt_traces: Vec<super::ntt::NttTrace>,

    /// Verification trace
    pub verification_trace: super::verification::VerificationTrace,

    /// Flattened trace matrix (columns x rows)
    pub trace_matrix: Vec<Vec<u64>>,
}

/// Generate complete execution trace from witness
pub fn generate_full_trace(witness: &Witness, nonce: u64) -> Result<FullTrace, String> {
    // 1. Generate hash traces
    let pk_hash_trace = generate_keccak_trace(&witness.public_key);
    let msg_hash_trace = generate_keccak_trace(&witness.message);

    // 2. Generate verification trace
    let verification_trace = generate_verification_trace(
        &witness.public_key,
        &witness.message,
        &witness.signature,
    )?;

    // 3. Compute public inputs
    let public_inputs = witness.compute_public_inputs(nonce);

    // 4. Generate NTT traces for each polynomial operation
    let ntt_traces = Vec::new(); // Placeholder for full implementation

    // 5. Build flattened trace matrix
    let trace_matrix = build_trace_matrix(
        &pk_hash_trace,
        &msg_hash_trace,
        &verification_trace,
    );

    Ok(FullTrace {
        public_inputs,
        pk_hash_trace,
        msg_hash_trace,
        ntt_traces,
        verification_trace,
        trace_matrix,
    })
}

/// Build the flattened trace matrix from component traces
fn build_trace_matrix(
    _pk_hash: &super::hash::KeccakTrace,
    _msg_hash: &super::hash::KeccakTrace,
    _verification: &super::verification::VerificationTrace,
) -> Vec<Vec<u64>> {
    // This would combine all traces into a single matrix
    // Format: trace_matrix[column][row]

    // Placeholder: return empty matrix
    // Full implementation would:
    // 1. Determine total rows (power of 2)
    // 2. Interleave different operation traces
    // 3. Pad with zeros as needed

    Vec::new()
}

// =============================================================================
// Witness Serialization
// =============================================================================

/// Serialize witness for transmission
pub fn serialize_witness(witness: &Witness) -> Vec<u8> {
    let mut data = Vec::new();

    // Length-prefixed public key
    data.extend_from_slice(&(witness.public_key.len() as u32).to_le_bytes());
    data.extend_from_slice(&witness.public_key);

    // Length-prefixed message
    data.extend_from_slice(&(witness.message.len() as u32).to_le_bytes());
    data.extend_from_slice(&witness.message);

    // Length-prefixed signature
    data.extend_from_slice(&(witness.signature.len() as u32).to_le_bytes());
    data.extend_from_slice(&witness.signature);

    data
}

/// Deserialize witness from bytes
pub fn deserialize_witness(data: &[u8]) -> Result<Witness, String> {
    let mut offset = 0;

    // Read public key
    if data.len() < offset + 4 {
        return Err("Data too short for public key length".to_string());
    }
    let pk_len = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap()) as usize;
    offset += 4;

    if data.len() < offset + pk_len {
        return Err("Data too short for public key".to_string());
    }
    let public_key = data[offset..offset + pk_len].to_vec();
    offset += pk_len;

    // Read message
    if data.len() < offset + 4 {
        return Err("Data too short for message length".to_string());
    }
    let msg_len = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap()) as usize;
    offset += 4;

    if data.len() < offset + msg_len {
        return Err("Data too short for message".to_string());
    }
    let message = data[offset..offset + msg_len].to_vec();
    offset += msg_len;

    // Read signature
    if data.len() < offset + 4 {
        return Err("Data too short for signature length".to_string());
    }
    let sig_len = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap()) as usize;
    offset += 4;

    if data.len() < offset + sig_len {
        return Err("Data too short for signature".to_string());
    }
    let signature = data[offset..offset + sig_len].to_vec();

    Witness::new(public_key, message, signature)
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use pqcrypto_dilithium::dilithium3;
    #[allow(unused_imports)]
    use pqcrypto_traits::sign::{PublicKey, SecretKey, DetachedSignature};

    #[test]
    fn test_full_trace_generation() {
        let (pk, sk) = dilithium3::keypair();
        let message = b"Test message for trace";
        let sig = dilithium3::detached_sign(message, &sk);

        let witness = Witness::new(
            pk.as_bytes().to_vec(),
            message.to_vec(),
            sig.as_bytes().to_vec(),
        ).unwrap();

        let trace = generate_full_trace(&witness, 42).unwrap();

        assert!(trace.public_inputs.signature_valid);
        assert_eq!(trace.public_inputs.nonce, 42);
    }

    #[test]
    fn test_witness_serialization() {
        let (pk, sk) = dilithium3::keypair();
        let message = b"Serialization test";
        let sig = dilithium3::detached_sign(message, &sk);

        let original = Witness::new(
            pk.as_bytes().to_vec(),
            message.to_vec(),
            sig.as_bytes().to_vec(),
        ).unwrap();

        let serialized = serialize_witness(&original);
        let deserialized = deserialize_witness(&serialized).unwrap();

        assert_eq!(original.public_key, deserialized.public_key);
        assert_eq!(original.message, deserialized.message);
        assert_eq!(original.signature, deserialized.signature);
    }
}
