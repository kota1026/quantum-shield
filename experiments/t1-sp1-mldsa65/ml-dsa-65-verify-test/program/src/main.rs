//! T1 SP1 substrate spike: verify a single ML-DSA-65 signature using the
//! `fips204` crate inside the SP1 zkVM. Commits a `bool` indicating
//! whether the embedded signature verified.

#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_sol_types::SolType;
use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Verifier};
use mldsa_lib::kat::{MSG, PK, SIG};
use mldsa_lib::PublicValuesStruct;

pub fn main() {
    // Reconstruct the public key from its serialized form.
    let pk_bytes: [u8; 1952] = PK;
    let pk = ml_dsa_65::PublicKey::try_from_bytes(pk_bytes).expect("pk decode failed");

    // Verify the signature over MSG with empty context, matching kat-gen.
    let sig_bytes: [u8; 3309] = SIG;
    let ctx: &[u8] = b"";
    let verified = pk.verify(MSG, &sig_bytes, ctx);

    // Commit a single bool to the public values.
    let bytes = PublicValuesStruct::abi_encode(&PublicValuesStruct { verified });
    sp1_zkvm::io::commit_slice(&bytes);
}
