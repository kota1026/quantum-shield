//! The values a threshold proof commits, and their on-chain encoding.
//!
//! This is the contract between the zkVM guest and
//! `src/l1/contracts/src/wrap/ThresholdProofVerifier.sol`. Both sides are
//! pinned to the same bytes by golden tests — the Rust one below and
//! `ThresholdProofVerifier.t.sol`'s `testDecodesTheGoldenVector` — so the
//! encoding cannot drift on one side only.
//!
//! ```text
//! [ 0..32)  lockId          the unlock request being served
//! [32..64)  stateRoot       the state root the signatures cover
//! [64..96)  setCommitment   ProverRegistry active-set commitment (FR-THRESH-5)
//! [96..100) validCount      distinct active provers whose signatures verified
//! ```
//!
//! Packed and fixed-width: the verifier reads it with `calldata` slices, and a
//! variable-length encoding would let a prover pad the tail.

use alloc::vec::Vec;

/// Length of the encoded public values.
pub const PUBLIC_VALUES_LEN: usize = 100;

/// What a threshold proof attests.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PublicValues {
    pub lock_id: [u8; 32],
    pub state_root: [u8; 32],
    pub set_commitment: [u8; 32],
    pub valid_count: u32,
}

impl PublicValues {
    /// Encode for `ThresholdProofVerifier.decodePublicValues`.
    pub fn encode(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(PUBLIC_VALUES_LEN);
        out.extend_from_slice(&self.lock_id);
        out.extend_from_slice(&self.state_root);
        out.extend_from_slice(&self.set_commitment);
        out.extend_from_slice(&self.valid_count.to_be_bytes());
        debug_assert_eq!(out.len(), PUBLIC_VALUES_LEN);
        out
    }

    /// Decode, rejecting anything that is not exactly the fixed layout.
    pub fn decode(bytes: &[u8]) -> Option<Self> {
        if bytes.len() != PUBLIC_VALUES_LEN {
            return None;
        }
        Some(Self {
            lock_id: bytes[0..32].try_into().ok()?,
            state_root: bytes[32..64].try_into().ok()?,
            set_commitment: bytes[64..96].try_into().ok()?,
            valid_count: u32::from_be_bytes(bytes[96..100].try_into().ok()?),
        })
    }
}

/// The message a Prover signs for an unlock: `SHA3-256(lockId ‖ stateRoot)`.
///
/// Mirrors `L1Vault._verifyThresholdSignatures`, which computes
/// `SHA3_256.hashPair(lockId, stateRoot)`. The guest has to derive it the same
/// way, or it would verify signatures over a message the vault never asked for.
pub fn unlock_message(lock_id: &[u8; 32], state_root: &[u8; 32]) -> [u8; 32] {
    crate::hash::sha3_256_parts(&[lock_id, state_root], None)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn golden() -> PublicValues {
        PublicValues {
            lock_id: [0x11; 32],
            state_root: [0x22; 32],
            set_commitment: [0x33; 32],
            valid_count: 2,
        }
    }

    #[test]
    fn encode_decode_roundtrip() {
        let pv = golden();
        assert_eq!(PublicValues::decode(&pv.encode()), Some(pv));
    }

    #[test]
    fn encoding_is_exactly_the_documented_layout() {
        let bytes = golden().encode();
        assert_eq!(bytes.len(), PUBLIC_VALUES_LEN);
        assert!(bytes[0..32].iter().all(|&b| b == 0x11));
        assert!(bytes[32..64].iter().all(|&b| b == 0x22));
        assert!(bytes[64..96].iter().all(|&b| b == 0x33));
        assert_eq!(&bytes[96..100], &[0, 0, 0, 2]);
    }

    /// The golden vector the Solidity side decodes. Changing either encoder
    /// without the other breaks both tests.
    #[test]
    fn golden_vector_hex() {
        let hex: alloc::string::String = golden()
            .encode()
            .iter()
            .map(|b| alloc::format!("{b:02x}"))
            .collect();
        assert_eq!(
            hex,
            "1111111111111111111111111111111111111111111111111111111111111111\
             2222222222222222222222222222222222222222222222222222222222222222\
             3333333333333333333333333333333333333333333333333333333333333333\
             00000002"
        );
    }

    #[test]
    fn wrong_length_is_rejected() {
        assert_eq!(PublicValues::decode(&[0u8; 99]), None);
        assert_eq!(PublicValues::decode(&[0u8; 101]), None);
    }
}
