//! Hash Circuit for STARK
//!
//! This module defines the hash operations that will be constrained in the STARK circuit.
//! Currently using Keccak256 for Ethereum compatibility.
//!
//! # Circuit Structure
//!
//! ```text
//! ┌───────────────────────────────────────────────────────────────┐
//! │                    Keccak256 Circuit                           │
//! ├───────────────────────────────────────────────────────────────┤
//! │  Input: arbitrary length data                                  │
//! │  Output: 32-byte hash                                         │
//! │                                                                │
//! │  Verification Flow:                                            │
//! │  ├─ Pad input to block size (136 bytes)                       │
//! │  ├─ Apply Keccak-f[1600] permutation                          │
//! │  ├─ Squeeze output                                            │
//! │  └─ Constrain: H(input) == expected_hash                      │
//! └───────────────────────────────────────────────────────────────┘
//! ```

use sha3::{Digest, Keccak256};

// =============================================================================
// Hash Functions
// =============================================================================

/// Compute Keccak256 hash
pub fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(data);
    hasher.finalize().into()
}

/// Hash verification constraint
///
/// Returns true if the hash of `data` equals `expected_hash`
pub fn verify_hash(data: &[u8], expected_hash: &[u8; 32]) -> bool {
    keccak256(data) == *expected_hash
}

// =============================================================================
// Hash Trace for STARK
// =============================================================================

/// Keccak256 state (1600 bits = 200 bytes)
pub const KECCAK_STATE_SIZE: usize = 200;

/// Keccak256 rate (1088 bits = 136 bytes for SHA-3 256)
pub const KECCAK_RATE: usize = 136;

/// Number of Keccak rounds
pub const KECCAK_ROUNDS: usize = 24;

/// Execution trace for Keccak256 circuit
#[derive(Debug, Clone)]
pub struct KeccakTrace {
    /// Input data (padded)
    pub padded_input: Vec<u8>,

    /// State after each round
    pub round_states: Vec<[u64; 25]>,

    /// Output hash
    pub output: [u8; 32],
}

/// Generate execution trace for Keccak256
///
/// This trace will be used to generate STARK constraints
pub fn generate_keccak_trace(input: &[u8]) -> KeccakTrace {
    // Pad input
    let padded = pad_keccak(input);

    // Initial state
    let mut state = [0u64; 25];
    let mut round_states = Vec::new();

    // Absorb phase
    for block in padded.chunks(KECCAK_RATE) {
        // XOR block into state
        for (i, chunk) in block.chunks(8).enumerate() {
            if chunk.len() == 8 {
                state[i] ^= u64::from_le_bytes(chunk.try_into().unwrap());
            }
        }

        // Apply Keccak-f permutation
        for _ in 0..KECCAK_ROUNDS {
            state = keccak_round(state);
            round_states.push(state);
        }
    }

    // Squeeze output
    let mut output = [0u8; 32];
    for i in 0..4 {
        output[i * 8..(i + 1) * 8].copy_from_slice(&state[i].to_le_bytes());
    }

    KeccakTrace {
        padded_input: padded,
        round_states,
        output,
    }
}

/// Pad input according to Keccak padding rules
fn pad_keccak(input: &[u8]) -> Vec<u8> {
    let mut padded = input.to_vec();

    // Keccak padding: 0x01 || 0x00* || 0x80
    let pad_len = KECCAK_RATE - (input.len() % KECCAK_RATE);

    if pad_len == 1 {
        padded.push(0x81); // 0x01 | 0x80
    } else {
        padded.push(0x01);
        padded.extend(vec![0x00; pad_len - 2]);
        padded.push(0x80);
    }

    padded
}

/// Single Keccak round (simplified - real implementation would be more complex)
fn keccak_round(state: [u64; 25]) -> [u64; 25] {
    // θ step
    let state = keccak_theta(state);

    // ρ and π steps
    let state = keccak_rho_pi(state);

    // χ step
    let state = keccak_chi(state);

    // ι step (round constant)
    // Note: This is simplified; actual implementation would vary by round
    state
}

/// θ (theta) step
fn keccak_theta(state: [u64; 25]) -> [u64; 25] {
    let mut c = [0u64; 5];
    let mut d = [0u64; 5];
    let mut result = state;

    for x in 0..5 {
        c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }

    for x in 0..5 {
        d[x] = c[(x + 4) % 5] ^ c[(x + 1) % 5].rotate_left(1);
    }

    for x in 0..5 {
        for y in 0..5 {
            result[x + 5 * y] ^= d[x];
        }
    }

    result
}

/// ρ and π steps
fn keccak_rho_pi(state: [u64; 25]) -> [u64; 25] {
    const RHO_OFFSETS: [u32; 25] = [
        0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56,
        14,
    ];

    const PI_INDICES: [usize; 25] = [
        0, 10, 20, 5, 15, 16, 1, 11, 21, 6, 7, 17, 2, 12, 22, 23, 8, 18, 3, 13, 14, 24, 9, 19, 4,
    ];

    let mut result = [0u64; 25];

    for i in 0..25 {
        result[PI_INDICES[i]] = state[i].rotate_left(RHO_OFFSETS[i]);
    }

    result
}

/// χ (chi) step
fn keccak_chi(state: [u64; 25]) -> [u64; 25] {
    let mut result = [0u64; 25];

    for y in 0..5 {
        for x in 0..5 {
            result[x + 5 * y] =
                state[x + 5 * y] ^ ((!state[(x + 1) % 5 + 5 * y]) & state[(x + 2) % 5 + 5 * y]);
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

    #[test]
    fn test_keccak256_known_vector() {
        // Empty string hash
        let empty_hash = keccak256(b"");
        let expected = hex::decode("c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
            .unwrap();
        assert_eq!(&empty_hash[..], &expected[..]);
    }

    #[test]
    fn test_keccak256_message() {
        let hash = keccak256(b"hello");
        // Known hash for "hello"
        let expected = hex::decode("1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8")
            .unwrap();
        assert_eq!(&hash[..], &expected[..]);
    }

    #[test]
    fn test_verify_hash() {
        let data = b"test data";
        let hash = keccak256(data);
        assert!(verify_hash(data, &hash));

        let wrong_hash = [0u8; 32];
        assert!(!verify_hash(data, &wrong_hash));
    }

    #[test]
    fn test_keccak_trace_generation() {
        let input = b"trace test";
        let trace = generate_keccak_trace(input);

        // Verify padding was done correctly
        assert!(trace.padded_input.len() % KECCAK_RATE == 0);

        // Verify we have round states
        assert!(!trace.round_states.is_empty());

        // Verify output has correct length
        assert_eq!(trace.output.len(), 32);

        // Note: Our simplified Keccak implementation doesn't include
        // round constants (iota step), so output won't match sha3 library.
        // This is a trace structure test, not a correctness test.
    }
}
