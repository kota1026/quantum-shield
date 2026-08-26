//! The statement a threshold proof attests (FR-THRESH-1).
//!
//! This is what runs inside the zkVM guest. Keeping it here rather than in the
//! guest crate means it is testable on the host, where a failure is a test
//! result instead of a panic buried in an executor trace.
//!
//! For a given `(lockId, stateRoot)` and a claimed `setCommitment`, it checks
//! each submitted signature:
//!
//! 1. the signer is a member of the registry set the commitment covers
//!    (Merkle inclusion, FR-THRESH-1(b));
//! 2. the SPHINCS+ signature verifies over
//!    `SHA3-256(lockId ‖ stateRoot)` under that signer's registered public key
//!    (FR-THRESH-1(a));
//!
//! and counts the ones that pass (FR-THRESH-1(c)).
//!
//! Signers must be given in strictly increasing address order. That is the
//! deduplication: a repeated signer cannot appear twice in a strictly
//! increasing sequence, so no sorting network or set argument is needed.
//!
//! The threshold itself is deliberately absent — `L1Vault` applies it to the
//! committed `validCount`, so changing the threshold needs no new circuit.

use alloc::vec::Vec;

use crate::public_values::{unlock_message, PublicValues};
use crate::registry::{verify_membership, Digest, Member};
use crate::verify::slh_verify;

/// One submitted signature and everything needed to attribute it.
#[derive(Clone, Debug)]
pub struct SignerClaim {
    /// The prover's registry address.
    pub address: [u8; 20],
    /// Registered SPHINCS+ public key (`PK.seed ‖ PK.root`).
    pub public_key: Vec<u8>,
    /// The signature over the unlock message.
    pub signature: Vec<u8>,
    /// Position in the registry's active list.
    pub index: u32,
    /// Merkle path from the leaf to the set root.
    pub path: Vec<Digest>,
}

/// Everything the guest is given.
#[derive(Clone, Debug)]
pub struct ThresholdInput {
    pub lock_id: [u8; 32],
    pub state_root: [u8; 32],
    pub set_commitment: Digest,
    /// Active prover count the commitment was computed over.
    pub member_count: u32,
    pub claims: Vec<SignerClaim>,
}

/// Why a set of claims could not be evaluated at all.
///
/// These are malformed inputs, not failed signatures — a failed signature just
/// does not count toward the total.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ThresholdError {
    /// Signers were not in strictly increasing address order, so the same
    /// prover could have been counted more than once.
    SignersNotStrictlyIncreasing,
}

/// Evaluate the claims and produce the values a proof commits.
pub fn evaluate(input: &ThresholdInput) -> Result<PublicValues, ThresholdError> {
    // Deduplication: strictly increasing addresses.
    for pair in input.claims.windows(2) {
        if pair[1].address <= pair[0].address {
            return Err(ThresholdError::SignersNotStrictlyIncreasing);
        }
    }

    let message = unlock_message(&input.lock_id, &input.state_root);

    let mut valid_count = 0u32;
    for claim in &input.claims {
        let member = Member {
            address: claim.address,
            pubkey_hash: crate::registry::pubkey_hash(&claim.public_key, None),
        };

        let is_member = verify_membership(
            &member,
            claim.index as usize,
            &claim.path,
            input.member_count as usize,
            &input.set_commitment,
            None,
        );
        if !is_member {
            continue;
        }

        // The signature covers the unlock message, not the raw lock id: this
        // is the same derivation `L1Vault._verifyThresholdSignatures` uses.
        //
        // FIPS 205 `slh_verify` with an empty context — the pure variant every
        // conforming signer produces by default. The on-chain
        // `SPHINCSVerifier` must use the same variant, or a signature that
        // passes here would fail the FR-THRESH-4 fallback path and vice versa.
        if slh_verify(&message, &claim.signature, b"", &claim.public_key).valid {
            valid_count += 1;
        }
    }

    Ok(PublicValues {
        lock_id: input.lock_id,
        state_root: input.state_root,
        set_commitment: input.set_commitment,
        valid_count,
    })
}

// =============================================================================
// Wire format
// =============================================================================

/// Serialised layout, so the guest can embed or read one blob:
///
/// ```text
/// lockId          32
/// stateRoot       32
/// setCommitment   32
/// memberCount     4   (big-endian u32)
/// claimCount      4   (big-endian u32)
/// per claim:
///   address       20
///   pkLen         4   + pkLen bytes
///   sigLen        4   + sigLen bytes
///   index         4
///   pathLen       4   + pathLen * 32 bytes
/// ```
impl ThresholdInput {
    pub fn encode(&self) -> Vec<u8> {
        let mut out = Vec::new();
        out.extend_from_slice(&self.lock_id);
        out.extend_from_slice(&self.state_root);
        out.extend_from_slice(&self.set_commitment);
        out.extend_from_slice(&self.member_count.to_be_bytes());
        out.extend_from_slice(&(self.claims.len() as u32).to_be_bytes());
        for c in &self.claims {
            out.extend_from_slice(&c.address);
            out.extend_from_slice(&(c.public_key.len() as u32).to_be_bytes());
            out.extend_from_slice(&c.public_key);
            out.extend_from_slice(&(c.signature.len() as u32).to_be_bytes());
            out.extend_from_slice(&c.signature);
            out.extend_from_slice(&c.index.to_be_bytes());
            out.extend_from_slice(&(c.path.len() as u32).to_be_bytes());
            for node in &c.path {
                out.extend_from_slice(node);
            }
        }
        out
    }

    /// Decode, returning `None` on any truncation. A guest that cannot parse
    /// its input must not silently prove a smaller claim.
    pub fn decode(bytes: &[u8]) -> Option<Self> {
        let mut p = 0usize;
        let take = |p: &mut usize, n: usize| -> Option<&[u8]> {
            let s = bytes.get(*p..*p + n)?;
            *p += n;
            Some(s)
        };
        let u32_at = |p: &mut usize| -> Option<u32> {
            Some(u32::from_be_bytes(take(p, 4)?.try_into().ok()?))
        };

        let lock_id: [u8; 32] = take(&mut p, 32)?.try_into().ok()?;
        let state_root: [u8; 32] = take(&mut p, 32)?.try_into().ok()?;
        let set_commitment: Digest = take(&mut p, 32)?.try_into().ok()?;
        let member_count = u32_at(&mut p)?;
        let claim_count = u32_at(&mut p)?;

        let mut claims = Vec::with_capacity(claim_count as usize);
        for _ in 0..claim_count {
            let address: [u8; 20] = take(&mut p, 20)?.try_into().ok()?;
            let pk_len = u32_at(&mut p)? as usize;
            let public_key = take(&mut p, pk_len)?.to_vec();
            let sig_len = u32_at(&mut p)? as usize;
            let signature = take(&mut p, sig_len)?.to_vec();
            let index = u32_at(&mut p)?;
            let path_len = u32_at(&mut p)? as usize;
            let mut path = Vec::with_capacity(path_len);
            for _ in 0..path_len {
                path.push(take(&mut p, 32)?.try_into().ok()?);
            }
            claims.push(SignerClaim { address, public_key, signature, index, path });
        }

        if p != bytes.len() {
            return None;
        }
        Some(Self { lock_id, state_root, set_commitment, member_count, claims })
    }
}
