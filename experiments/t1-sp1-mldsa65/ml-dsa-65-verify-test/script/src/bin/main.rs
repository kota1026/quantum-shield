//! T1.5 SP1 cycle-scaling runner.
//!
//! Loads up to `--n` independent ML-DSA-65 KAT triples from a binary bundle
//! (see `kat-gen`), pushes them into `SP1Stdin`, runs the SP1 program in
//! `--execute` mode (mock prove, low RAM) and prints the resulting cycle
//! count. Real prove (`--prove`) is still supported for the N=1 baseline if
//! you have the RAM, but T1.5's purpose is execute-mode scaling.
//!
//! KAT bundle framing (little-endian, written by `kat-gen`):
//!   u32 N
//!   N * { u32 pk_len, pk_bytes, u32 msg_len, msg_bytes, u32 sig_len, sig_bytes }

use std::fs::File;
use std::io::{BufReader, Read};
use std::path::PathBuf;

use alloy_sol_types::SolType;
use clap::Parser;
use mldsa_lib::PublicValuesStruct;
use sp1_sdk::{
    blocking::{ProveRequest, Prover, ProverClient},
    include_elf, Elf, ProvingKey, SP1Stdin,
};

const MLDSA_ELF: Elf = include_elf!("mldsa-program");

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Execute (mock prove) the program in the SP1 emulator and print cycles.
    #[arg(long)]
    execute: bool,

    /// Run a real prove. Requires substantial RAM; not used by T1.5.
    #[arg(long)]
    prove: bool,

    /// How many KAT triples to feed the program. Must be <= the count in the
    /// bundle.
    #[arg(long, default_value_t = 1)]
    n: u32,

    /// Path to a binary KAT bundle produced by `kat-gen`.
    #[arg(long)]
    kat_file: PathBuf,
}

fn read_exact_or_die<R: Read>(r: &mut R, buf: &mut [u8], what: &str) {
    r.read_exact(buf)
        .unwrap_or_else(|e| panic!("read {} failed: {}", what, e));
}

fn read_u32<R: Read>(r: &mut R, what: &str) -> u32 {
    let mut b = [0u8; 4];
    read_exact_or_die(r, &mut b, what);
    u32::from_le_bytes(b)
}

fn read_len_prefixed<R: Read>(r: &mut R, what: &str) -> Vec<u8> {
    let len = read_u32(r, &format!("{} length", what)) as usize;
    let mut v = vec![0u8; len];
    read_exact_or_die(r, &mut v, what);
    v
}

fn main() {
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    let args = Args::parse();
    if args.execute == args.prove {
        eprintln!("Error: specify exactly one of --execute or --prove");
        std::process::exit(1);
    }

    // Load up to N triples from the bundle.
    let f = File::open(&args.kat_file)
        .unwrap_or_else(|e| panic!("open {}: {}", args.kat_file.display(), e));
    let mut r = BufReader::new(f);

    let bundle_n = read_u32(&mut r, "bundle N");
    if args.n > bundle_n {
        eprintln!(
            "Error: --n {} exceeds bundle size {}; regenerate bundle with kat-gen --n {}",
            args.n, bundle_n, args.n
        );
        std::process::exit(2);
    }

    let mut stdin = SP1Stdin::new();
    stdin.write::<u32>(&args.n);

    let mut total_input_bytes: usize = 0;
    for i in 0..args.n {
        let pk = read_len_prefixed(&mut r, "pk");
        let msg = read_len_prefixed(&mut r, "msg");
        let sig = read_len_prefixed(&mut r, "sig");
        total_input_bytes += pk.len() + msg.len() + sig.len();

        if pk.len() != 1952 {
            panic!("triple {}: pk length {} != 1952", i, pk.len());
        }
        if sig.len() != 3309 {
            panic!("triple {}: sig length {} != 3309", i, sig.len());
        }

        stdin.write_vec(pk);
        stdin.write_vec(msg);
        stdin.write_vec(sig);
    }

    println!("=== T1.5 run config ===");
    println!("n={}", args.n);
    println!("bundle_n={}", bundle_n);
    println!("kat_file={}", args.kat_file.display());
    println!("total_input_bytes={}", total_input_bytes);

    let client = ProverClient::from_env();

    if args.execute {
        let t0 = std::time::Instant::now();
        let (output, report) = client
            .execute(MLDSA_ELF, stdin)
            .run()
            .expect("execute failed");
        let elapsed = t0.elapsed();

        let decoded =
            PublicValuesStruct::abi_decode(output.as_slice()).expect("decode failed");
        assert!(
            decoded.verified,
            "SP1 program reported all_verified = false for n={}",
            args.n
        );

        println!("=== T1.5 EXECUTE RESULTS ===");
        println!("n={}", args.n);
        println!("cycle_count={}", report.total_instruction_count());
        println!("execute_wall_ms={}", elapsed.as_millis());
        println!("all_verified=true");
    } else {
        let pk = client.setup(MLDSA_ELF).expect("setup failed");
        let t0 = std::time::Instant::now();
        let proof = client.prove(&pk, stdin).run().expect("prove failed");
        let elapsed = t0.elapsed();

        let verify_t0 = std::time::Instant::now();
        client
            .verify(&proof, pk.verifying_key(), None)
            .expect("on-host proof verification failed");
        let verify_elapsed = verify_t0.elapsed();

        println!("=== T1.5 PROVE RESULTS ===");
        println!("n={}", args.n);
        println!("prove_wall_ms={}", elapsed.as_millis());
        println!("verify_wall_ms={}", verify_elapsed.as_millis());
    }
}
