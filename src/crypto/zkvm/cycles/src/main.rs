//! Run the SPHINCS+ verification guest in the SP1 executor and report cycles.
//!
//! Execute-only: a cycle count needs no proof, and proving would cost minutes
//! for a number that does not depend on it. See
//! `docs/core/STARK_AIR_GAP_ANALYSIS.md` §19 for why this path was chosen and
//! §21 for the numbers.

use sp1_sdk::{Prover, ProverClient, SP1Stdin};

const ELF: &[u8] = include_bytes!(
    "../../guest/target/elf-compilation/riscv64im-succinct-zkvm-elf/release/sphincs-guest"
);

/// Keccak-f[1600] permutations one verification performs, measured natively
/// by `sphincs-m2`'s `verify_cost` example.
const PERMUTATIONS: f64 = 2174.0;

#[tokio::main]
async fn main() {
    let client = ProverClient::builder().cpu().build().await;

    let (_public_values, report) = client
        .execute(ELF.into(), SP1Stdin::new())
        .await
        .expect("the guest must run to completion");

    let cycles = report.total_instruction_count();

    println!("# SP1 guest: one SLH-DSA-SHAKE-128s verification");
    println!("cycles                 : {cycles}");
    println!("syscalls               : {}", report.total_syscall_count());
    println!("touched memory addrs   : {}", report.touched_memory_addresses);
    println!("keccak permutations    : {PERMUTATIONS:.0}");
    println!("cycles per permutation : {:.0}", cycles as f64 / PERMUTATIONS);

    println!();
    println!("# top opcodes");
    let mut counts: Vec<_> = report
        .opcode_counts
        .iter()
        .filter(|(_, &n)| n > 0)
        .map(|(op, &n)| (n, format!("{op:?}")))
        .collect();
    counts.sort_unstable_by(|a, b| b.0.cmp(&a.0));
    for (n, op) in counts.iter().take(8) {
        println!("{op:>10} : {n}");
    }
}
