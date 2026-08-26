//! The SHA2 hash constructions of FIPS 205 (Table 2, security category 1).
//!
//! Every one of these is a component the Solidity verifier must reproduce
//! exactly. They are kept separate — rather than inlined into `verify` — so a
//! differential test can pin them one at a time; an end-to-end pass/fail gives
//! no way to locate a mismatch.
//!
//! For n = 16 the padding after `PK.seed` is `64 - n = 48` zero bytes, which
//! makes the SHA-256 input block-aligned before the address.

use sha2::{Digest, Sha256};

use crate::adrs::Adrs;
use crate::params::{M, N};

/// Zero padding between `PK.seed` and the compressed address.
const PAD: [u8; 64 - N] = [0u8; 64 - N];

fn sha256(parts: &[&[u8]]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    for part in parts {
        hasher.update(part);
    }
    hasher.finalize().into()
}

fn trunc_n(digest: [u8; 32]) -> [u8; N] {
    digest[..N].try_into().unwrap()
}

/// `F(PK.seed, ADRS, M_1) = Trunc_n(SHA-256(PK.seed ‖ toByte(0, 64-n) ‖ ADRS^c ‖ M_1))`
pub fn f(pk_seed: &[u8; N], adrs: &Adrs, m1: &[u8; N]) -> [u8; N] {
    trunc_n(sha256(&[pk_seed, &PAD, &adrs.compressed(), m1]))
}

/// `H(PK.seed, ADRS, M_1 ‖ M_2)` — same construction as `F`, two messages.
pub fn h(pk_seed: &[u8; N], adrs: &Adrs, m1: &[u8; N], m2: &[u8; N]) -> [u8; N] {
    trunc_n(sha256(&[pk_seed, &PAD, &adrs.compressed(), m1, m2]))
}

/// `T_l(PK.seed, ADRS, M_l)` — same construction, `l` messages.
pub fn t_l(pk_seed: &[u8; N], adrs: &Adrs, messages: &[[u8; N]]) -> [u8; N] {
    let mut hasher = Sha256::new();
    hasher.update(pk_seed);
    hasher.update(PAD);
    hasher.update(adrs.compressed());
    for message in messages {
        hasher.update(message);
    }
    trunc_n(hasher.finalize().into())
}

/// `MGF1-SHA-256(seed, len)` (RFC 8017).
pub fn mgf1(seed: &[&[u8]], out_len: usize) -> Vec<u8> {
    let mut out = Vec::with_capacity(out_len.next_multiple_of(32));
    let mut counter: u32 = 0;
    while out.len() < out_len {
        let mut hasher = Sha256::new();
        for part in seed {
            hasher.update(part);
        }
        hasher.update(counter.to_be_bytes());
        out.extend_from_slice(&hasher.finalize());
        counter += 1;
    }
    out.truncate(out_len);
    out
}

/// `H_msg(R, PK.seed, PK.root, M)
///   = MGF1-SHA-256(R ‖ PK.seed ‖ SHA-256(R ‖ PK.seed ‖ PK.root ‖ M), m)`
pub fn h_msg(r: &[u8; N], pk_seed: &[u8; N], pk_root: &[u8; N], msg: &[u8]) -> [u8; M] {
    let inner = sha256(&[r, pk_seed, pk_root, msg]);
    let out = mgf1(&[r, pk_seed, &inner], M);
    out.try_into().unwrap()
}
