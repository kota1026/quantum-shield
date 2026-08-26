//! Generate a real proof of the FR-THRESH-1 guest (M5).
//!
//! ```bash
//! cargo run --release --bin prove -- core        # shard proofs only
//! cargo run --release --bin prove -- compressed  # recursively compressed
//! cargo run --release --bin prove -- groth16     # EVM-verifiable wrap
//! ```
//!
//! `groth16` is the mode `ThresholdProofVerifier` consumes. It downloads
//! Succinct's gnark artifacts on first use and is the memory-hungry step.

use std::time::Instant;

use sp1_sdk::{HashableKey, ProveRequest, Prover, ProverClient, ProvingKey, SP1ProofMode, SP1Stdin};
use sphincs_m2::public_values::{PublicValues, PUBLIC_VALUES_LEN};

const ELF: &[u8] = include_bytes!(
    "../../../guest/target/elf-compilation/riscv64im-succinct-zkvm-elf/release/sphincs-guest"
);

#[tokio::main]
async fn main() {
    let mode = std::env::args().nth(1).unwrap_or_else(|| "core".into());

    let client = ProverClient::builder().cpu().build().await;
    let pk = client.setup(ELF.into()).await.expect("setup must succeed");
    let vk = pk.verifying_key().clone();  // ProvingKey trait

    println!("vkey: {}", vk.bytes32());
    println!("mode: {mode}");

    let started = Instant::now();
    let selected = match mode.as_str() {
        "core" => SP1ProofMode::Core,
        "compressed" => SP1ProofMode::Compressed,
        "groth16" => SP1ProofMode::Groth16,
        other => panic!("unknown mode {other}"),
    };
    let proof = client
        .prove(&pk, SP1Stdin::new())
        .mode(selected)
        .await
        .expect("proving must succeed");
    let elapsed = started.elapsed();

    // The committed values must still be the ones the contract binds.
    let committed = proof.public_values.as_slice();
    assert_eq!(committed.len(), PUBLIC_VALUES_LEN);
    let pv = PublicValues::decode(committed).expect("committed values must decode");
    assert_eq!(pv.valid_count, 2, "the 2-of-4 fixture must prove two signers");

    client.verify(&proof, &vk, None).expect("the proof must verify");

    println!("proving time: {:.1} s", elapsed.as_secs_f64());
    println!("valid_count : {}", pv.valid_count);
    println!("verified    : yes");

    let path = format!("proof-{mode}.bin");
    proof.save(&path).expect("the proof must save");
    println!("saved       : {path}");
}
