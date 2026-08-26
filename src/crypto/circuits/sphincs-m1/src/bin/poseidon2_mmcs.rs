//! M0.5 strategy-A input data: what does switching the Merkle commitment
//! (MMCS) from Keccak to Poseidon2 cost at proving time?
//!
//! Strategy A (SNARK wrap) requires the inner STARK's Merkle openings to be
//! SNARK-friendly — verifying Keccak Merkle paths inside a Groth16/PLONK
//! circuit is prohibitively expensive, Poseidon2 paths are standard. This
//! bench proves the same WOTS+ chain as `sphincs-m1` with a Poseidon2 MMCS
//! and reports prove/verify time and proof size next to the Keccak baseline.

use std::time::Instant;

use p3_challenger::DuplexChallenger;
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_field::Field;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_goldilocks::{Goldilocks, Poseidon2Goldilocks};
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{PaddingFreeSponge, TruncatedPermutation};
use p3_uni_stark::{prove, verify, StarkConfig};
use rand::rngs::SmallRng;
use rand::SeedableRng;

use sphincs_m1::air::{build_trace, WotsChainAir};
use sphincs_m1::stark::{prove_chain, verify_chain, FriSettings};
use sphincs_m1::wots::{chain_witness, Adrs, N};

type Val = Goldilocks;
type Challenge = BinomialExtensionField<Val, 2>;
type Perm8 = Poseidon2Goldilocks<8>;
type Perm12 = Poseidon2Goldilocks<12>;
// Digest = 4 Goldilocks elements (~256 bits). Sponge: width 12, rate 8.
type P2Sponge = PaddingFreeSponge<Perm12, 12, 8, 4>;
type P2Compress = TruncatedPermutation<Perm8, 2, 4, 8>;
type P2ValMmcs =
    MerkleTreeMmcs<<Val as Field>::Packing, <Val as Field>::Packing, P2Sponge, P2Compress, 4>;
type P2ChallengeMmcs = ExtensionMmcs<Val, Challenge, P2ValMmcs>;
type P2Challenger = DuplexChallenger<Val, Perm12, 12, 8>;
type Dft = Radix2DitParallel<Val>;
type P2Pcs = TwoAdicFriPcs<Val, Dft, P2ValMmcs, P2ChallengeMmcs>;
type P2Config = StarkConfig<P2Pcs, Challenge, P2Challenger>;

fn main() {
    let mut adrs = Adrs::new();
    adrs.set_type(Adrs::TYPE_WOTS_HASH);
    adrs.set_key_pair(1);
    let pk_seed = [0xA7u8; N];
    let x = [0x5Cu8; N];
    let witness = chain_witness(&pk_seed, &adrs, &x, 0, 15);

    let log_blowup = 3usize;
    let num_queries = 100usize;
    let pow_bits = 16usize;

    println!("# M0.5 strategy A: Poseidon2 MMCS vs Keccak MMCS (WOTS+ chain, 15 steps)");
    println!("# FRI: log_blowup=3 queries=100 pow=16");
    println!(
        "{:>10} | {:>12} | {:>12} | {:>14} | {:>7}",
        "mmcs", "prove_ms", "verify_ms", "proof_bytes", "ok"
    );

    // --- Keccak baseline (same code path as `cargo run --release`) ---
    {
        let settings = FriSettings { log_blowup, num_queries, proof_of_work_bits: pow_bits };
        let t0 = Instant::now();
        let (proof, pvs) = prove_chain(&witness, settings);
        let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
        let size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);
        let t1 = Instant::now();
        let ok = verify_chain(&proof, &pvs, settings).is_ok();
        let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
        println!(
            "{:>10} | {:>12.1} | {:>12.1} | {:>14} | {:>7}",
            "keccak", prove_ms, verify_ms, size, ok
        );
    }

    // --- Poseidon2 MMCS ---
    {
        let mut rng = SmallRng::seed_from_u64(1);
        let perm8 = Perm8::new_from_rng_128(&mut rng);
        let perm12 = Perm12::new_from_rng_128(&mut rng);
        let sponge = P2Sponge::new(perm12.clone());
        let compress = P2Compress::new(perm8);
        let val_mmcs = P2ValMmcs::new(sponge, compress);
        let challenge_mmcs = P2ChallengeMmcs::new(val_mmcs.clone());
        let dft = Dft::default();

        let fri_params = FriParameters {
            log_blowup,
            log_final_poly_len: 0,
            num_queries,
            commit_proof_of_work_bits: pow_bits,
            query_proof_of_work_bits: pow_bits,
            mmcs: challenge_mmcs,
        };
        let pcs = P2Pcs::new(dft, val_mmcs, fri_params);
        let challenger = P2Challenger::new(perm12);
        let config = P2Config::new(pcs, challenger);

        let (trace, pvs) = build_trace::<Val>(&witness, log_blowup);

        let t0 = Instant::now();
        let proof = prove(&config, &WotsChainAir {}, trace, &pvs);
        let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
        let size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);
        let t1 = Instant::now();
        let ok = verify(&config, &WotsChainAir {}, &proof, &pvs).is_ok();
        let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
        println!(
            "{:>10} | {:>12.1} | {:>12.1} | {:>14} | {:>7}",
            "poseidon2", prove_ms, verify_ms, size, ok
        );
    }
}
