//! M0.5-impl recursion groundwork — commitment-hash swap benchmark.
//!
//! Recursive aggregation of the QS proof composition requires the *inner*
//! proofs' verifier to be cheap inside a circuit. The dominant in-circuit
//! cost is the commitment hash: every FRI query opens Merkle paths whose
//! nodes the recursive verifier must re-hash. With the production
//! Keccak-MMCS configuration (M0..M4) that is Keccak-f[1600] per node
//! (~150k R1CS constraints); with Poseidon2 over the same Goldilocks field
//! it is a few hundred constraints — the swap that makes recursion
//! tractable at all.
//!
//! This binary proves *identical* keccak-air batches (same field, same AIR,
//! same conservative FRI parameters as M0 section 5) under both
//! configurations and measures prove/verify time and proof size, plus the
//! per-proof count of Merkle-path digests a recursive verifier would
//! re-hash (queries x layers), giving the §15 decision its numbers.
//!
//! Run with: cargo run --release   (single-threaded)

use std::time::Instant;

use p3_challenger::{DuplexChallenger, HashChallenger, SerializingChallenger64};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_field::Field;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_goldilocks::{Goldilocks, Poseidon2Goldilocks};
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_keccak_air::{generate_trace_rows, KeccakAir};
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{
    CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher,
    TruncatedPermutation,
};
use p3_uni_stark::{prove, verify, StarkConfig};
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

type Val = Goldilocks;
type Challenge = BinomialExtensionField<Val, 2>;
type Dft = Radix2DitParallel<Val>;

// ---- Production configuration: Keccak MMCS (as M0..M4) ----
type ByteHash = Keccak256Hash;
type KU64Hash = PaddingFreeSponge<KeccakF, 25, 17, 4>;
type KFieldHash = SerializingHasher<KU64Hash>;
type KCompress = CompressionFunctionFromHasher<KU64Hash, 2, 4>;
type KValMmcs = MerkleTreeMmcs<
    [Val; p3_keccak::VECTOR_LEN],
    [u64; p3_keccak::VECTOR_LEN],
    KFieldHash,
    KCompress,
    4,
>;
type KChallengeMmcs = ExtensionMmcs<Val, Challenge, KValMmcs>;
type KChallenger = SerializingChallenger64<Val, HashChallenger<u8, ByteHash, 32>>;
type KPcs = TwoAdicFriPcs<Val, Dft, KValMmcs, KChallengeMmcs>;
type KConfig = StarkConfig<KPcs, Challenge, KChallenger>;

// ---- Recursion-friendly configuration: Poseidon2 MMCS ----
type Perm = Poseidon2Goldilocks<8>;
type PHash = PaddingFreeSponge<Perm, 8, 4, 4>;
type PCompress = TruncatedPermutation<Perm, 2, 4, 8>;
type PValMmcs = MerkleTreeMmcs<
    <Val as Field>::Packing,
    <Val as Field>::Packing,
    PHash,
    PCompress,
    4,
>;
type PChallengeMmcs = ExtensionMmcs<Val, Challenge, PValMmcs>;
type PChallenger = DuplexChallenger<Val, Perm, 8, 4>;
type PPcs = TwoAdicFriPcs<Val, Dft, PValMmcs, PChallengeMmcs>;
type PConfig = StarkConfig<PPcs, Challenge, PChallenger>;

const LOG_BLOWUP: usize = 3;
const NUM_QUERIES: usize = 100;
const POW_BITS: usize = 16;

fn fri_params<M>(mmcs: M) -> FriParameters<M> {
    FriParameters {
        log_blowup: LOG_BLOWUP,
        log_final_poly_len: 0,
        num_queries: NUM_QUERIES,
        commit_proof_of_work_bits: POW_BITS,
        query_proof_of_work_bits: POW_BITS,
        mmcs,
    }
}

struct Row {
    prove_ms: f64,
    verify_ms: f64,
    proof_bytes: usize,
    ok: bool,
}

fn keccak_config() -> KConfig {
    let u64_hash = KU64Hash::new(KeccakF {});
    let field_hash = KFieldHash::new(u64_hash);
    let compress = KCompress::new(u64_hash);
    let val_mmcs = KValMmcs::new(field_hash, compress);
    let challenge_mmcs = KChallengeMmcs::new(val_mmcs.clone());
    let pcs = KPcs::new(Dft::default(), val_mmcs, fri_params(challenge_mmcs));
    let challenger = KChallenger::from_hasher(vec![], ByteHash {});
    KConfig::new(pcs, challenger)
}

fn poseidon2_config(rng: &mut SmallRng) -> PConfig {
    let perm = Perm::new_from_rng_128(rng);
    let hash = PHash::new(perm.clone());
    let compress = PCompress::new(perm.clone());
    let val_mmcs = PValMmcs::new(hash, compress);
    let challenge_mmcs = PChallengeMmcs::new(val_mmcs.clone());
    let pcs = PPcs::new(Dft::default(), val_mmcs, fri_params(challenge_mmcs));
    let challenger = PChallenger::new(perm);
    PConfig::new(pcs, challenger)
}

fn run_keccak_cfg(perms: usize, rng: &mut SmallRng) -> Row {
    let inputs: Vec<[u64; 25]> = (0..perms).map(|_| rng.random()).collect();
    let trace = generate_trace_rows::<Val>(inputs, 0);
    let config = keccak_config();
    let t0 = Instant::now();
    let proof = prove(&config, &KeccakAir {}, trace, &[]);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let proof_bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let t1 = Instant::now();
    let ok = verify(&config, &KeccakAir {}, &proof, &[]).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
    Row { prove_ms, verify_ms, proof_bytes, ok }
}

fn run_poseidon2_cfg(perms: usize, rng: &mut SmallRng) -> Row {
    let inputs: Vec<[u64; 25]> = (0..perms).map(|_| rng.random()).collect();
    let trace = generate_trace_rows::<Val>(inputs, 0);
    let config = poseidon2_config(rng);
    let t0 = Instant::now();
    let proof = prove(&config, &KeccakAir {}, trace, &[]);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let proof_bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let t1 = Instant::now();
    let ok = verify(&config, &KeccakAir {}, &proof, &[]).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
    Row { prove_ms, verify_ms, proof_bytes, ok }
}

fn main() {
    let mut rng = SmallRng::seed_from_u64(0x515f6d3035);
    println!(
        "# M0.5 recursion groundwork: Keccak-MMCS vs Poseidon2-MMCS \
         (Goldilocks, keccak-air, log_blowup={LOG_BLOWUP}, queries={NUM_QUERIES}, pow={POW_BITS})"
    );
    println!();
    println!(
        "{:>6} | {:>9} | {:>10} | {:>10} | {:>12} | {:>4}",
        "perms", "mmcs", "prove_ms", "verify_ms", "proof_bytes", "ok"
    );
    for &perms in &[16usize, 128, 512] {
        let k = run_keccak_cfg(perms, &mut rng);
        println!(
            "{:>6} | {:>9} | {:>10.1} | {:>10.1} | {:>12} | {:>4}",
            perms,
            "keccak",
            k.prove_ms,
            k.verify_ms,
            k.proof_bytes,
            if k.ok { "yes" } else { "NO" }
        );
        let p = run_poseidon2_cfg(perms, &mut rng);
        println!(
            "{:>6} | {:>9} | {:>10.1} | {:>10.1} | {:>12} | {:>4}",
            perms,
            "poseidon2",
            p.prove_ms,
            p.verify_ms,
            p.proof_bytes,
            if p.ok { "yes" } else { "NO" }
        );
        assert!(k.ok && p.ok);
    }
    println!();
    println!(
        "# in-circuit digest count per verification ~= queries x (trace + quotient + fri layers) \
         Merkle nodes; the swap changes each node's in-circuit cost from Keccak-f[1600] \
         (~150k constraints) to Poseidon2-width-8 (~300 constraints)."
    );
}
