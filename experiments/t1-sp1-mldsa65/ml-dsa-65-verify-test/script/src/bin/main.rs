//! T1 SP1 substrate spike runner.
//!
//! Usage:
//!   RUST_LOG=info cargo run --release -- --execute
//!   RUST_LOG=info cargo run --release -- --prove

use alloy_sol_types::SolType;
use clap::Parser;
use mldsa_lib::PublicValuesStruct;
use sp1_sdk::{
    blocking::{ProveRequest, Prover, ProverClient},
    include_elf, Elf, ProvingKey, SP1Stdin,
};

/// The ELF (executable and linkable format) file for the Succinct RISC-V zkVM.
const MLDSA_ELF: Elf = include_elf!("mldsa-program");

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(long)]
    execute: bool,

    #[arg(long)]
    prove: bool,
}

fn main() {
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    let args = Args::parse();
    if args.execute == args.prove {
        eprintln!("Error: You must specify either --execute or --prove");
        std::process::exit(1);
    }

    let client = ProverClient::from_env();
    let stdin = SP1Stdin::new();

    if args.execute {
        let t0 = std::time::Instant::now();
        let (output, report) = client.execute(MLDSA_ELF, stdin).run().expect("execute failed");
        let elapsed = t0.elapsed();

        let decoded = PublicValuesStruct::abi_decode(output.as_slice()).expect("decode failed");
        println!("verified: {}", decoded.verified);
        assert!(decoded.verified, "ML-DSA-65 verification returned false inside SP1");

        println!("=== T1 EXECUTE RESULTS ===");
        println!("cycle_count={}", report.total_instruction_count());
        println!("execute_wall_ms={}", elapsed.as_millis());
        println!("verified_inside_zkvm=true");
    } else {
        let pk = client.setup(MLDSA_ELF).expect("setup failed");

        let t0 = std::time::Instant::now();
        let proof = client
            .prove(&pk, stdin)
            .run()
            .expect("prove failed");
        let elapsed = t0.elapsed();

        let verify_t0 = std::time::Instant::now();
        client
            .verify(&proof, pk.verifying_key(), None)
            .expect("on-host proof verification failed");
        let verify_elapsed = verify_t0.elapsed();

        // Serialize proof to measure size. SP1's proof type is Serialize, but
        // bincode isn't a direct dep here; fall back to JSON which is.
        let proof_bytes = serde_json::to_vec(&proof).map(|b| b.len()).unwrap_or(0);

        println!("=== T1 PROVE RESULTS ===");
        println!("prove_wall_ms={}", elapsed.as_millis());
        println!("verify_wall_ms={}", verify_elapsed.as_millis());
        println!("proof_json_bytes={}", proof_bytes);
    }
}
