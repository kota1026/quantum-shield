//! SHAKE256 (FIPS 202) sponge on top of the Plonky3 Keccak-f[1600]
//! permutation.
//!
//! This is the witness-side reference implementation: the same permutation
//! that `p3-keccak-air` proves is used here to absorb/squeeze, so a trace
//! generated from these states is consistent with the AIR by construction.
//! Correctness of the whole sponge (padding, byte order, squeezing) is pinned
//! against independently generated FIPS 202 vectors (Python `hashlib`).

use p3_keccak::KeccakF;
use p3_symmetric::Permutation;

/// SHAKE256 rate in bytes (1088 bits).
pub const RATE: usize = 136;

/// Number of 64-bit words in the rate portion of the state.
pub const RATE_WORDS: usize = RATE / 8;

/// SHAKE domain-separation byte (FIPS 202: 0x1F for SHAKE, 0x06 for SHA3).
pub const SHAKE_DOMAIN: u8 = 0x1f;

/// Apply Keccak-f[1600] in place.
pub fn keccak_f(state: &mut [u64; 25]) {
    KeccakF.permute_mut(state);
}

/// Absorb `input` with SHAKE padding and return `out_len` squeezed bytes.
pub fn shake256(input: &[u8], out_len: usize) -> Vec<u8> {
    let mut padded = input.to_vec();
    padded.push(SHAKE_DOMAIN);
    while padded.len() % RATE != 0 {
        padded.push(0);
    }
    let last = padded.len() - 1;
    padded[last] |= 0x80;

    let mut state = [0u64; 25];
    for block in padded.chunks(RATE) {
        for (i, chunk) in block.chunks(8).enumerate() {
            state[i] ^= u64::from_le_bytes(chunk.try_into().unwrap());
        }
        keccak_f(&mut state);
    }

    let mut out = Vec::with_capacity(out_len);
    loop {
        for word in state.iter().take(RATE_WORDS) {
            for b in word.to_le_bytes() {
                out.push(b);
                if out.len() == out_len {
                    return out;
                }
            }
        }
        keccak_f(&mut state);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{b:02x}")).collect()
    }

    /// FIPS 202 vectors generated independently with Python hashlib.shake_256.
    #[test]
    fn shake256_kat_empty() {
        assert_eq!(
            hex(&shake256(b"", 32)),
            "46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f"
        );
    }

    #[test]
    fn shake256_kat_abc() {
        assert_eq!(
            hex(&shake256(b"abc", 32)),
            "483366601360a8771c6863080cc4114d8db44530f8f1e1ee4f94ea37e78b5739"
        );
    }

    /// Multi-block absorb (1024 bytes = 8 rate blocks) — exercises block
    /// chaining and padding in a full block boundary case.
    #[test]
    fn shake256_kat_multiblock() {
        let msg: Vec<u8> = (0..=255u8).cycle().take(1024).collect();
        assert_eq!(
            hex(&shake256(&msg, 32)),
            "60aff3fd4c0f158ba0ed6890336a907451281739d48cc8315211b36660619742"
        );
    }
}
