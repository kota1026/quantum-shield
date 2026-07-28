//! M2a — linking AIR for a full 35-chain WOTS+ unit (SPHINCS+-SHAKE-128s).
//!
//! M1 proved that the permutations a WOTS+ chain performs are real Keccak-f,
//! but left the *linking structure* unconstrained: nothing forced consecutive
//! permutations to chain (output -> next input) or the ADRS/padding bytes to
//! be well-formed. This binary closes exactly that gap (see `air.rs`):
//! keccak-air runs unmodified over the leading columns, and a set of
//! degree-<=3 link constraints over appended columns force chaining, the
//! FIPS 205 WOTS_HASH ADRS layout, SHAKE256 pad10*1 structure, and the
//! binding of chain start/end values to public inputs.
//!
//! The run proves the honest witness (must verify) and a battery of tampered
//! witnesses / forged public inputs (all must FAIL verification). Tampered
//! witnesses still contain only valid Keccak-f permutations — M1's circuit
//! would accept every one of them; rejection demonstrates the link AIR works.
//!
//! Run with: cargo run --release   (single-threaded, conservative FRI params
//! as in M0/M1: log_blowup=3, 100 queries, 16-bit PoW — ~100-bit target)

mod air;
mod trace;
mod wots;

use std::time::Instant;

use p3_challenger::{HashChallenger, SerializingChallenger64};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_goldilocks::Goldilocks;
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::{prove, verify, StarkConfig};

use air::WotsLinkAir;
use trace::{build_trace, public_inputs};
use wots::{build_witness, AdrsParams, Tamper, CHAIN_STEPS, TOTAL_PERMS, WOTS_LEN};

type Val = Goldilocks;
type Challenge = BinomialExtensionField<Val, 2>;
type ByteHash = Keccak256Hash;
type U64Hash = PaddingFreeSponge<KeccakF, 25, 17, 4>;
type FieldHash = SerializingHasher<U64Hash>;
type MyCompress = CompressionFunctionFromHasher<U64Hash, 2, 4>;
type ValMmcs = MerkleTreeMmcs<
    [Val; p3_keccak::VECTOR_LEN],
    [u64; p3_keccak::VECTOR_LEN],
    FieldHash,
    MyCompress,
    4,
>;
type ChallengeMmcs = ExtensionMmcs<Val, Challenge, ValMmcs>;
type Dft = Radix2DitParallel<Val>;
type Challenger = SerializingChallenger64<Val, HashChallenger<u8, ByteHash, 32>>;
type Pcs = TwoAdicFriPcs<Val, Dft, ValMmcs, ChallengeMmcs>;
type MyConfig = StarkConfig<Pcs, Challenge, Challenger>;

fn make_config() -> MyConfig {
    let u64_hash = U64Hash::new(KeccakF {});
    let field_hash = FieldHash::new(u64_hash);
    let compress = MyCompress::new(u64_hash);
    let val_mmcs = ValMmcs::new(field_hash, compress);
    let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
    let fri_params = FriParameters {
        log_blowup: 3,
        log_final_poly_len: 0,
        num_queries: 100,
        commit_proof_of_work_bits: 16,
        query_proof_of_work_bits: 16,
        mmcs: challenge_mmcs,
    };
    let pcs = Pcs::new(Dft::default(), val_mmcs, fri_params);
    let challenger = Challenger::from_hasher(vec![], ByteHash {});
    MyConfig::new(pcs, challenger)
}

struct CaseResult {
    prove_ms: f64,
    verify_ms: f64,
    proof_bytes: usize,
    accepted: bool,
}

fn run_case(trace: RowMajorMatrix<Val>, pis: &[Val]) -> CaseResult {
    let config = make_config();
    let air = WotsLinkAir;

    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, pis);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let proof_bytes = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

    let t1 = Instant::now();
    let accepted = verify(&config, &air, &proof, pis).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;

    CaseResult { prove_ms, verify_ms, proof_bytes, accepted }
}

fn main() {
    println!("# M2a: linking AIR — full 35-chain WOTS+ unit (SPHINCS+-SHAKE-128s)");
    println!(
        "# chains={WOTS_LEN} steps/chain={CHAIN_STEPS} permutations={TOTAL_PERMS} \
         link_cols={} total_cols={} public_values={}",
        air::NUM_LINK_COLS,
        air::NUM_COLS,
        air::NUM_PUBLIC_VALUES,
    );

    let pk_seed = [0x42u8; wots::N];
    let params = AdrsParams {
        layer: 2,
        tree: *b"QSm2a-tree-1",
        keypair: 9,
    };

    let honest = build_witness(&pk_seed, &params, &Tamper::None);
    let honest_pis = public_inputs(&pk_seed, &params, &honest.starts, &honest.ends);
    let trace = build_trace(&honest);
    println!("# trace: {} rows x {} cols", trace.height(), trace.width());

    println!();
    println!(
        "{:>28} | {:>10} | {:>10} | {:>12} | {:>9} | {:>6}",
        "case", "prove_ms", "verify_ms", "proof_bytes", "expected", "result"
    );

    let mut all_ok = true;
    let mut report = |name: &str, expected_accept: bool, r: &CaseResult| {
        let pass = r.accepted == expected_accept;
        all_ok &= pass;
        println!(
            "{:>28} | {:>10.1} | {:>10.1} | {:>12} | {:>9} | {:>6}",
            name,
            r.prove_ms,
            r.verify_ms,
            r.proof_bytes,
            if expected_accept { "accept" } else { "reject" },
            if pass { "PASS" } else { "FAIL" },
        );
    };

    // Positive control: the honest witness must verify.
    let r = run_case(trace, &honest_pis);
    report("honest", true, &r);

    // Witness tampers. Public inputs are recomputed from each tampered run so
    // start/end bindings hold and rejection isolates the targeted constraint.
    // Every tampered trace still contains only valid Keccak-f permutations —
    // M1 (keccak-air alone) accepts all of them.
    let witness_cases: [(&str, Tamper); 4] = [
        ("break-chain(c12,s7)", Tamper::BreakChain { chain: 12, step: 7 }),
        ("wrong-hash-addr(c3)", Tamper::WrongHashAddr { chain: 3 }),
        ("wrong-chain-addr(c5)", Tamper::WrongChainAddr { chain: 5 }),
        ("wrong-adrs-type(c0)", Tamper::WrongAdrsType { chain: 0 }),
    ];
    for (name, tamper) in witness_cases {
        let w = build_witness(&pk_seed, &params, &tamper);
        let pis = public_inputs(&pk_seed, &params, &w.starts, &w.ends);
        let r = run_case(build_trace(&w), &pis);
        report(name, false, &r);
    }

    // Public-input forgeries against the honest witness.
    {
        let mut ends = honest.ends.clone();
        ends[20][0] ^= 0x01;
        let pis = public_inputs(&pk_seed, &params, &honest.starts, &ends);
        let r = run_case(build_trace(&honest), &pis);
        report("forged-end(c20)", false, &r);
    }
    {
        let mut starts = honest.starts.clone();
        starts[0][0] ^= 0x01;
        let pis = public_inputs(&pk_seed, &params, &starts, &honest.ends);
        let r = run_case(build_trace(&honest), &pis);
        report("forged-start(c0)", false, &r);
    }
    {
        let mut seed = pk_seed;
        seed[0] ^= 0x01;
        let pis = public_inputs(&seed, &params, &honest.starts, &honest.ends);
        let r = run_case(build_trace(&honest), &pis);
        report("forged-pk-seed", false, &r);
    }

    println!();
    if all_ok {
        println!("all cases behaved as expected: honest accepted, 7/7 tampers rejected");
    } else {
        println!("FAILURE: at least one case did not behave as expected");
        std::process::exit(1);
    }
}
