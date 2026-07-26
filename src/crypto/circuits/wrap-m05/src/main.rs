//! M0.5 PoC — STARK proof-size sweep to establish the on-chain size floor.
//!
//! M0 found a single-config keccak-air proof is ~2.5-2.8 MB, far above the
//! ~128 KB practical L1 calldata ceiling. Before committing to a wrapping
//! strategy we need the *floor*: how small can the raw STARK get by trading
//! FRI parameters (blowup, queries), and how much security does that cost?
//! This binary sweeps those knobs on a fixed Keccak-f[1600] batch and reports
//! the serialized proof size, so the M0.5 recommendation is grounded in
//! measured numbers rather than rules of thumb.
//!
//! Feeds `docs/core/STARK_AIR_GAP_ANALYSIS.md` §6 (M0.5).

use std::time::Instant;

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

/// Conjectured FRI security in bits: log_blowup * num_queries + pow_bits.
fn fri_security_bits(log_blowup: usize, num_queries: usize, pow_bits: usize) -> usize {
    log_blowup * num_queries + pow_bits
}

fn measure(num_perms: usize, log_blowup: usize, num_queries: usize, pow_bits: usize) -> (usize, bool, f64) {
    let byte_hash = ByteHash {};
    let u64_hash = U64Hash::new(KeccakF {});
    let field_hash = FieldHash::new(u64_hash);
    let compress = MyCompress::new(u64_hash);
    let val_mmcs = ValMmcs::new(field_hash, compress);
    let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
    let dft = Dft::default();

    let fri_params = FriParameters {
        log_blowup,
        log_final_poly_len: 0,
        num_queries,
        commit_proof_of_work_bits: pow_bits,
        query_proof_of_work_bits: pow_bits,
        mmcs: challenge_mmcs,
    };

    // deterministic inputs (no RNG in this env's constraints — fixed pattern)
    let inputs: Vec<[u64; 25]> = (0..num_perms)
        .map(|i| {
            let mut s = [0u64; 25];
            s[0] = i as u64;
            s[1] = 0x1234_5678_9abc_def0 ^ (i as u64);
            s
        })
        .collect();

    let trace = generate_trace_rows::<Val>(inputs, log_blowup);
    let pcs = Pcs::new(dft, val_mmcs, fri_params);
    let challenger = Challenger::from_hasher(vec![], byte_hash);
    let config = MyConfig::new(pcs, challenger);
    let air = KeccakAir {};

    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, &[]);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);
    let ok = verify(&config, &air, &proof, &[]).is_ok();
    (size, ok, prove_ms)
}

fn main() {
    const NUM_PERMS: usize = 256;
    const L1_CALLDATA_CEILING: usize = 128 * 1024; // ~128 KB practical ceiling

    println!("# M0.5: STARK proof-size floor sweep ({NUM_PERMS} Keccak-f perms)");
    println!("# EVM calldata practical ceiling ~= {} bytes", L1_CALLDATA_CEILING);
    println!(
        "{:>10} | {:>8} | {:>8} | {:>12} | {:>10} | {:>6} | {:>4}",
        "log_blowup", "queries", "pow", "proof_bytes", "sec_bits~", "x>128K", "ok"
    );

    // Sweep from aggressive-small to conservative-large
    let configs = [
        (1usize, 30usize, 16usize),
        (1, 50, 16),
        (2, 40, 16),
        (2, 64, 16),
        (3, 80, 16),
        (3, 100, 16),
    ];

    let mut min_size = usize::MAX;
    for (lb, nq, pow) in configs {
        let (size, ok, _ms) = measure(NUM_PERMS, lb, nq, pow);
        let sec = fri_security_bits(lb, nq, pow);
        let over = size as f64 / L1_CALLDATA_CEILING as f64;
        println!(
            "{:>10} | {:>8} | {:>8} | {:>12} | {:>10} | {:>5.0}x | {:>4}",
            lb, nq, pow, size, sec, over, ok
        );
        min_size = min_size.min(size);
    }

    println!();
    println!(
        "# smallest raw STARK measured: {} bytes = {:.0}x the EVM ceiling",
        min_size,
        min_size as f64 / L1_CALLDATA_CEILING as f64
    );
    println!("# => even at aggressive (insecure) FRI params the raw STARK cannot be");
    println!("#    posted to L1. A wrapping/recursion step is mandatory, not optional.");
}
