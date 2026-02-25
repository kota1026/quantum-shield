//! Dilithium Signature Verification Logic
//!
//! This module implements the core verification logic for Dilithium signatures.
//! The verification will be converted into STARK constraints.
//!
//! # Dilithium Verification Algorithm (FIPS 204)
//!
//! ```text
//! Input: pk = (ρ, t1), msg, σ = (c̃, z, h)
//!
//! 1. Expand ρ to matrix A (NTT domain)
//! 2. Compute c = H(μ || w1_encode) where μ = H(tr || msg)
//! 3. Verify ||z||∞ ≤ γ1 - β
//! 4. Compute w' = Az - ct1·2^d
//! 5. Use hint h to recover w1 from w'
//! 6. Check c̃ = H(μ || w1_encode)
//! ```

use super::{Q, N};
use super::ntt::{ntt_mul, caddq};
use pqcrypto_dilithium::dilithium3;
use pqcrypto_traits::sign::{PublicKey, DetachedSignature};

// =============================================================================
// Dilithium Level 3 Parameters
// =============================================================================

/// Number of rows in matrix A (k)
pub const K: usize = 6;

/// Number of columns in matrix A (l)
pub const L: usize = 5;

/// Coefficient bound for z (γ1)
pub const GAMMA1: i32 = 1 << 19;

/// Coefficient bound for hints (γ2)
pub const GAMMA2: i32 = (Q as i32 - 1) / 32;

/// β = τ * η
pub const BETA: i32 = 196;

/// Power of 2 for rounding (d)
pub const D: u32 = 13;

// =============================================================================
// Verification
// =============================================================================

/// Verify a Dilithium signature
///
/// Returns true if the signature is valid, false otherwise.
pub fn verify_signature(
    public_key: &[u8],
    message: &[u8],
    signature: &[u8],
) -> Result<bool, String> {
    // Use pqcrypto for actual verification
    let pk = dilithium3::PublicKey::from_bytes(public_key)
        .map_err(|_| "Invalid public key".to_string())?;

    let sig = dilithium3::DetachedSignature::from_bytes(signature)
        .map_err(|_| "Invalid signature".to_string())?;

    Ok(dilithium3::verify_detached_signature(&sig, message, &pk).is_ok())
}

/// Verification trace for STARK circuit
///
/// Contains all intermediate values needed to constrain the verification in STARK
#[derive(Debug, Clone)]
pub struct VerificationTrace {
    /// Input public key
    pub public_key: Vec<u8>,

    /// Input message
    pub message: Vec<u8>,

    /// Input signature
    pub signature: Vec<u8>,

    /// Expanded matrix A (in NTT domain)
    pub matrix_a_ntt: Vec<[i32; N]>,

    /// z vector from signature
    pub z: Vec<[i32; N]>,

    /// Challenge polynomial c
    pub c_poly: [i32; N],

    /// t1 from public key
    pub t1: Vec<[i32; N]>,

    /// Computed w'
    pub w_prime: Vec<[i32; N]>,

    /// Hint vector h
    pub hints: Vec<u8>,

    /// Recovered w1
    pub w1: Vec<[i32; N]>,

    /// Final verification result
    pub is_valid: bool,
}

/// Generate verification trace for STARK
///
/// This captures all intermediate values for constraint generation
pub fn generate_verification_trace(
    public_key: &[u8],
    message: &[u8],
    signature: &[u8],
) -> Result<VerificationTrace, String> {
    // For now, we perform the verification and record the result
    // A full implementation would decompose each step

    let is_valid = verify_signature(public_key, message, signature)?;

    // Parse public key to extract t1
    let t1 = parse_t1_from_public_key(public_key)?;

    // Parse signature to extract z, c, h
    let (z, c_poly, hints) = parse_signature(signature)?;

    // Placeholder for matrix A expansion (seed ρ from public key)
    let matrix_a_ntt = expand_matrix_a_placeholder(public_key);

    // Placeholder for w' computation
    let w_prime = vec![[0i32; N]; K];

    // Placeholder for w1 recovery
    let w1 = vec![[0i32; N]; K];

    Ok(VerificationTrace {
        public_key: public_key.to_vec(),
        message: message.to_vec(),
        signature: signature.to_vec(),
        matrix_a_ntt,
        z,
        c_poly,
        t1,
        w_prime,
        hints,
        w1,
        is_valid,
    })
}

// =============================================================================
// Parsing Helpers
// =============================================================================

/// Parse t1 vectors from public key
fn parse_t1_from_public_key(public_key: &[u8]) -> Result<Vec<[i32; N]>, String> {
    if public_key.len() != super::PUBLIC_KEY_BYTES {
        return Err("Invalid public key length".to_string());
    }

    // Public key format: ρ (32 bytes) || t1 (320 * K bytes)
    // t1 is packed with 10 bits per coefficient

    let mut t1 = vec![[0i32; N]; K];

    // Skip ρ (32 bytes)
    let t1_bytes = &public_key[32..];

    // Unpack t1 (10 bits per coefficient)
    for i in 0..K {
        let poly_start = i * 320;
        for j in 0..N / 4 {
            let byte_idx = poly_start + j * 5;
            if byte_idx + 5 <= t1_bytes.len() {
                // Unpack 4 coefficients from 5 bytes (10 bits each)
                let b0 = t1_bytes[byte_idx] as i32;
                let b1 = t1_bytes[byte_idx + 1] as i32;
                let b2 = t1_bytes[byte_idx + 2] as i32;
                let b3 = t1_bytes[byte_idx + 3] as i32;
                let b4 = t1_bytes[byte_idx + 4] as i32;

                t1[i][j * 4] = b0 | ((b1 & 0x03) << 8);
                t1[i][j * 4 + 1] = (b1 >> 2) | ((b2 & 0x0F) << 6);
                t1[i][j * 4 + 2] = (b2 >> 4) | ((b3 & 0x3F) << 4);
                t1[i][j * 4 + 3] = (b3 >> 6) | (b4 << 2);
            }
        }
    }

    Ok(t1)
}

/// Parse signature into components
fn parse_signature(signature: &[u8]) -> Result<(Vec<[i32; N]>, [i32; N], Vec<u8>), String> {
    // Accept signature lengths within expected range for Dilithium Level 3
    if signature.len() < 3200 || signature.len() > 3400 {
        return Err(format!("Invalid signature length: {}", signature.len()));
    }

    // Signature format: c̃ (32 bytes) || z (L * 640 bytes) || h (ω + K bytes)
    // This is a simplified parsing; actual format is more complex

    let z = vec![[0i32; N]; L]; // Placeholder
    let c_poly = [0i32; N]; // Placeholder
    let hints_start = std::cmp::min(32 + L * 640, signature.len());
    let hints = signature[hints_start..].to_vec();

    Ok((z, c_poly, hints))
}

/// Placeholder for matrix A expansion
fn expand_matrix_a_placeholder(_public_key: &[u8]) -> Vec<[i32; N]> {
    // In a real implementation, this would:
    // 1. Extract ρ from public key (first 32 bytes)
    // 2. Use SHAKE128 to expand into K * L polynomials
    // 3. Convert to NTT domain

    vec![[0i32; N]; K * L]
}

// =============================================================================
// Constraint Generation Helpers
// =============================================================================

/// Check coefficient bounds
///
/// Returns true if all coefficients of poly satisfy |c| < bound
pub fn check_coefficient_bound(poly: &[i32; N], bound: i32) -> bool {
    for &c in poly.iter() {
        // Reduce to centered representation if needed
        let c_reduced = caddq(c);
        let c_centered = if c_reduced > super::ntt::Q / 2 {
            c_reduced - super::ntt::Q
        } else {
            c_reduced
        };
        if c_centered.abs() >= bound {
            return false;
        }
    }
    true
}

/// Compute matrix-vector product A * z (NTT domain)
pub fn matrix_vector_mul(a: &[[i32; N]], z: &[[i32; N]]) -> Vec<[i32; N]> {
    let mut result = vec![[0i32; N]; K];

    for i in 0..K {
        for j_idx in 0..L {
            let prod = ntt_mul(&a[i * L + j_idx], &z[j_idx]);
            for k in 0..N {
                result[i][k] = result[i][k] + prod[k];
            }
        }
    }

    result
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    #[allow(unused_imports)]
    use pqcrypto_traits::sign::{PublicKey, SecretKey, DetachedSignature};

    #[test]
    fn test_verify_valid_signature() {
        let (pk, sk) = dilithium3::keypair();
        let message = b"Test message for verification";
        let sig = dilithium3::detached_sign(message, &sk);

        let result = verify_signature(
            pk.as_bytes(),
            message,
            sig.as_bytes(),
        ).unwrap();

        assert!(result);
    }

    #[test]
    fn test_verify_invalid_signature() {
        let (pk, _sk) = dilithium3::keypair();
        let (_, other_sk) = dilithium3::keypair();
        let message = b"Test message";
        let wrong_sig = dilithium3::detached_sign(message, &other_sk);

        let result = verify_signature(
            pk.as_bytes(),
            message,
            wrong_sig.as_bytes(),
        ).unwrap();

        assert!(!result);
    }

    #[test]
    fn test_generate_trace() {
        let (pk, sk) = dilithium3::keypair();
        let message = b"Trace test";
        let sig = dilithium3::detached_sign(message, &sk);

        let trace = generate_verification_trace(
            pk.as_bytes(),
            message,
            sig.as_bytes(),
        ).unwrap();

        assert!(trace.is_valid);
        assert_eq!(trace.t1.len(), K);
    }

    #[test]
    fn test_coefficient_bound_check() {
        let mut poly = [0i32; N];
        for i in 0..N {
            poly[i] = (i as i32) % 100;
        }

        assert!(check_coefficient_bound(&poly, 100));
        assert!(!check_coefficient_bound(&poly, 50));
    }
}
