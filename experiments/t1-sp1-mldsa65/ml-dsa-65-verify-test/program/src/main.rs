//! T1.5 SP1 cycle-scaling program: verify N independent ML-DSA-65 signatures
//! supplied via stdin and commit a single bool indicating whether *all* of
//! them verified.
//!
//! Stdin protocol (matches the host runner):
//!   1. `u32 n`             — bincode (via `sp1_zkvm::io::read::<u32>()`)
//!   2. for i in 0..n:
//!         `Vec<u8> pk`     — raw bytes via `sp1_zkvm::io::read_vec()`
//!         `Vec<u8> msg`    — raw bytes via `sp1_zkvm::io::read_vec()`
//!         `Vec<u8> sig`    — raw bytes via `sp1_zkvm::io::read_vec()`
//!
//! Empty context (`ctx = b""`) matches `kat-gen`.

#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_sol_types::SolType;
use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Verifier};
use mldsa_lib::PublicValuesStruct;

const PK_LEN: usize = 1952;
const SIG_LEN: usize = 3309;

pub fn main() {
    let n: u32 = sp1_zkvm::io::read::<u32>();
    let mut all_verified = true;

    for _ in 0..n {
        let pk_bytes_vec: Vec<u8> = sp1_zkvm::io::read_vec();
        let msg: Vec<u8> = sp1_zkvm::io::read_vec();
        let sig_bytes_vec: Vec<u8> = sp1_zkvm::io::read_vec();

        // Convert to fixed-size arrays expected by fips204. Panic on bad
        // length — there is no recovery path inside the zkVM and a wrong
        // length means the host produced a malformed batch.
        let pk_arr: [u8; PK_LEN] = pk_bytes_vec
            .as_slice()
            .try_into()
            .expect("pk wrong length");
        let sig_arr: [u8; SIG_LEN] = sig_bytes_vec
            .as_slice()
            .try_into()
            .expect("sig wrong length");

        let pk = ml_dsa_65::PublicKey::try_from_bytes(pk_arr).expect("pk decode failed");
        let ctx: &[u8] = b"";
        let verified = pk.verify(&msg, &sig_arr, ctx);

        // Accumulate with `&` (not short-circuit `&&`) so every signature is
        // actually verified — short-circuiting would let a later malformed
        // input silently shrink the per-N workload.
        all_verified &= verified;
    }

    let bytes = PublicValuesStruct::abi_encode(&PublicValuesStruct {
        verified: all_verified,
    });
    sp1_zkvm::io::commit_slice(&bytes);
}
