//! Run the SPHINCS+ verification guest in the SP1 executor and report cycles.
//!
//! Execute-only: a cycle count needs no proof, and proving would cost minutes
//! for a number that does not depend on it. See
//! `docs/core/STARK_AIR_GAP_ANALYSIS.md` §19 for why this path was chosen and
//! §21 for the numbers.

use sp1_sdk::{Prover, ProverClient, SP1Stdin};
use sphincs_m2::public_values::{PublicValues, PUBLIC_VALUES_LEN};

const ELF: &[u8] = include_bytes!(
    "../../guest/target/elf-compilation/riscv64im-succinct-zkvm-elf/release/sphincs-guest"
);

/// Signatures the embedded 2-of-4 vector carries.
const SIGNATURES: f64 = 2.0;

#[tokio::main]
async fn main() {
    let client = ProverClient::builder().cpu().build().await;

    let (public_values, report) = client
        .execute(ELF.into(), SP1Stdin::new())
        .await
        .expect("the guest must run to completion");

    let cycles = report.total_instruction_count();

    println!("# SP1 guest: FR-THRESH-1 statement, 2-of-4 threshold");
    println!("cycles                 : {cycles}");
    println!("syscalls (keccak-f)    : {}", report.total_syscall_count());
    println!("signatures verified    : {SIGNATURES:.0}");
    println!("cycles per signature   : {:.0}", cycles as f64 / SIGNATURES);
    // Close the loop: the committed bytes must be exactly the layout
    // `ThresholdProofVerifier.decodePublicValues` reads, and must carry the
    // count the fixture was built for.
    let committed = public_values.as_slice();
    assert_eq!(committed.len(), PUBLIC_VALUES_LEN, "committed layout must match the contract");
    let pv = PublicValues::decode(committed).expect("committed values must decode");
    assert_eq!(pv.valid_count, 2, "the 2-of-4 fixture must prove two signers");

    println!("committed public values: {} bytes", committed.len());
    println!("  valid_count          : {}", pv.valid_count);
    println!("  lock_id[0]           : 0x{:02x}", pv.lock_id[0]);
    println!("  set_commitment[0]    : 0x{:02x}", pv.set_commitment[0]);

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
