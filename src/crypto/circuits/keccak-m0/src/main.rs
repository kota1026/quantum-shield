//! M0 PoC — real Plonky3 `p3-keccak-air` benchmark (R-2 / FR-THRESH-1).
//!
//! Keccak-f[1600] is the permutation underlying SHAKE256, which is the core
//! hash of SPHINCS+-SHAKE-128s (the Prover signature scheme FR-THRESH-1 must
//! prove in-circuit). This binary measures — with the real Plonky3 keccak-air
//! AIR, not a simulation — how long it takes to PROVE and VERIFY a batch of
//! Keccak-f permutations, and how large the resulting STARK proof is.
//!
//! Output feeds `docs/core/STARK_AIR_GAP_ANALYSIS.md` M0 (build vs buy).
//!
//! Config mirrors the keccak-air Goldilocks example: Goldilocks field, degree-2
//! extension, Keccak-based Merkle MMCS, TwoAdicFriPcs. FRI params are set to a
//! conservative security level (log_blowup=3, 100 queries) rather than the
//! library's benchmark defaults, so the numbers reflect production settings.

use core::fmt::Debug;

use p3_challenger::{HashChallenger, SerializingChallenger64};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_goldilocks::Goldilocks;
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_keccak_air::{generate_trace_rows, KeccakAir};
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::{prove, verify, StarkConfig};
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};
use std::time::Instant;

type Val = Goldilocks;
type Challenge = BinomialExtensionField<Val, 2>;
type ByteHash = Keccak256Hash;
type U64Hash = PaddingFreeSponge<KeccakF, 25, 17, 4>;
type FieldHash = SerializingHasher<U64Hash>;
type MyCompress = CompressionFunctionFromHasher<U64Hash, 2, 4>;
type ValMmcs =
    MerkleTreeMmcs<[Val; p3_keccak::VECTOR_LEN], [u64; p3_keccak::VECTOR_LEN], FieldHash, MyCompress, 4>;
type ChallengeMmcs = ExtensionMmcs<Val, Challenge, ValMmcs>;
type Dft = Radix2DitParallel<Val>;
type Challenger = SerializingChallenger64<Val, HashChallenger<u8, ByteHash, 32>>;
type Pcs = TwoAdicFriPcs<Val, Dft, ValMmcs, ChallengeMmcs>;
type MyConfig = StarkConfig<Pcs, Challenge, Challenger>;

/// One Keccak-f[1600] permutation ≈ 24 rounds; each SPHINCS+-SHAKE-128s
/// signature verification needs on the order of 10^3–10^4 permutations, so
/// batches of hundreds-to-thousands are the relevant regime.
const BATCH_SIZES: &[usize] = &[16, 128, 512, 1365];

fn run_batch(num_permutations: usize) -> (f64, f64, usize, bool) {
    let byte_hash = ByteHash {};
    let u64_hash = U64Hash::new(KeccakF {});
    let field_hash = FieldHash::new(u64_hash);
    let compress = MyCompress::new(u64_hash);
    let val_mmcs = ValMmcs::new(field_hash, compress);
    let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
    let dft = Dft::default();

    // Conservative production-grade FRI params (~100-bit): 8x blowup, 100 queries
    let fri_params = FriParameters {
        log_blowup: 3,
        log_final_poly_len: 0,
        num_queries: 100,
        commit_proof_of_work_bits: 16,
        query_proof_of_work_bits: 16,
        mmcs: challenge_mmcs,
    };

    let mut rng = SmallRng::seed_from_u64(1);
    let inputs = (0..num_permutations).map(|_| rng.random()).collect::<Vec<_>>();

    let trace = generate_trace_rows::<Val>(inputs, fri_params.log_blowup);

    let pcs = Pcs::new(dft, val_mmcs, fri_params);
    let challenger = Challenger::from_hasher(vec![], byte_hash);
    let config = MyConfig::new(pcs, challenger);

    let air = KeccakAir {};

    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, &[]);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;

    let proof_size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

    let t1 = Instant::now();
    let ok = verify(&config, &air, &proof, &[]).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;

    (prove_ms, verify_ms, proof_size, ok)
}

fn main() -> Result<(), impl Debug> {
    println!("# M0: Plonky3 p3-keccak-air Keccak-f[1600] benchmark");
    println!("# field=Goldilocks  ext=2  FRI: log_blowup=3 queries=100 pow=16");
    println!(
        "{:>10} | {:>12} | {:>12} | {:>14} | {:>12} | {:>7}",
        "perms", "prove_ms", "verify_ms", "proof_bytes", "us/perm", "ok"
    );
    let mut last: Result<(), String> = Ok(());
    for &n in BATCH_SIZES {
        let (prove_ms, verify_ms, size, ok) = run_batch(n);
        let us_per_perm = prove_ms * 1000.0 / n as f64;
        println!(
            "{:>10} | {:>12.1} | {:>12.1} | {:>14} | {:>12.1} | {:>7}",
            n, prove_ms, verify_ms, size, us_per_perm, ok
        );
        if !ok {
            last = Err(format!("verification failed for n={n}"));
        }
    }
    last
}
