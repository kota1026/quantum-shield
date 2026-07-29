//! M2b — signature-verification-form WOTS+ AIR (SPHINCS+-SHAKE-128s).
//!
//! M2a proved a fixed-shape WOTS+ unit: 35 chains of the full 15 F steps
//! (the pk-generation form). Verification (`wots_pkFromSig`) instead runs
//! chain k from the k-th base-w message digit up to w-2 — variable-length,
//! message-dependent chains. This binary proves that form (see `air.rs`):
//! digits and the active-chain walk are *derived from the message by the
//! verifier* (never taken from the prover), chains with digit = w-1 are
//! checked natively (pk == sig), and the in-circuit walk is bound to the
//! public digit/next-active tables.
//!
//! The run proves the honest witness (must verify) and a battery of tampered
//! witnesses / forged public inputs (all must FAIL), plus one native-check
//! rejection that involves no proof at all. Tampered witnesses contain only
//! valid Keccak-f permutations — rejection is delivered by the link
//! constraints and public bindings alone.
//!
//! Run with: cargo run --release   (single-threaded, conservative FRI params
//! as in M0/M1/M2a: log_blowup=3, 100 queries, 16-bit PoW — ~100-bit target)

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

use air::WotsSigAir;
use trace::{build_trace, derive_public_inputs};
use wots::{build_witness, wots_digits, AdrsParams, Tamper, MAX_STEP, WOTS_LEN};

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
    let air = WotsSigAir;

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
    // Fixed message digest covering the digit edge cases: two digit-15 chains
    // (0 and 17, absent from the trace), digit-0 chains (full length), and a
    // non-zero first active chain. Checksum over these digits is 289, giving
    // checksum digits (1, 2, 1) — all three checksum chains active.
    let md: [u8; wots::N] = [
        0xF0, 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0x0F, 0x11, 0x22, 0x33, 0x44,
        0x55, 0x66, 0x77,
    ];
    let pk_seed = [0x42u8; wots::N];
    let params = AdrsParams {
        layer: 2,
        tree: *b"QSm2b-tree-1",
        keypair: 9,
    };

    let digits = wots_digits(&md);
    let active = digits.iter().filter(|&&d| (d as usize) < MAX_STEP).count();
    let total_perms: usize =
        digits.iter().map(|&d| MAX_STEP - (d as usize).min(MAX_STEP)).sum();
    println!("# M2b: signature-verification WOTS+ — digit-driven variable-length chains");
    println!(
        "# chains={WOTS_LEN} active={active} permutations={total_perms} \
         link_cols={} total_cols={} public_values={}",
        air::NUM_LINK_COLS,
        air::NUM_COLS,
        air::NUM_PUBLIC_VALUES,
    );
    println!("# digits={:?}", digits);

    let honest = build_witness(&pk_seed, &params, &digits, &Tamper::None);
    assert_eq!(honest.perms.len(), total_perms);
    let honest_pis = derive_public_inputs(&pk_seed, &params, &md, &honest.sigs, &honest.pks)
        .expect("honest witness passes native checks");
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

    // Witness tampers. Public inputs are re-derived from each tampered run's
    // sig/pk vectors (digits and the walk always come from the true message),
    // so rejection isolates the targeted constraint. Every tampered trace
    // still contains only valid Keccak-f permutations.
    let witness_cases: [(&str, Tamper); 5] = [
        ("break-chain(c5,s8)", Tamper::BreakChain { chain: 5, at_step: 8 }),
        ("wrong-start-digit(c12)", Tamper::WrongStartDigit { chain: 12 }),
        ("stop-early(c3)", Tamper::StopEarly { chain: 3 }),
        ("overrun(c20)", Tamper::Overrun { chain: 20 }),
        ("skip-chain(c9)", Tamper::SkipChain { chain: 9 }),
    ];
    for (name, tamper) in witness_cases {
        let w = build_witness(&pk_seed, &params, &digits, &tamper);
        let pis = derive_public_inputs(&pk_seed, &params, &md, &w.sigs, &w.pks)
            .expect("witness tampers keep native checks green");
        let r = run_case(build_trace(&w), &pis);
        report(name, false, &r);
    }

    // Public-input forgeries against the honest witness.
    {
        let mut sigs = honest.sigs.clone();
        sigs[1][0] ^= 0x01;
        let pis = derive_public_inputs(&pk_seed, &params, &md, &sigs, &honest.pks)
            .expect("active-chain sig forgery passes native checks");
        let r = run_case(build_trace(&honest), &pis);
        report("forged-sig(c1)", false, &r);
    }
    {
        let mut pks = honest.pks.clone();
        pks[34][0] ^= 0x01;
        let pis = derive_public_inputs(&pk_seed, &params, &md, &honest.sigs, &pks)
            .expect("checksum-chain pk forgery passes native checks");
        let r = run_case(build_trace(&honest), &pis);
        report("forged-pk(c34,csum)", false, &r);
    }

    // Native check: a digit-15 chain has no permutations to constrain, so its
    // pk element must equal its signature element — enforced by the verifier
    // before any proof is even looked at.
    {
        let mut pks = honest.pks.clone();
        pks[17][0] ^= 0x01;
        let rejected =
            derive_public_inputs(&pk_seed, &params, &md, &honest.sigs, &pks).is_none();
        all_ok &= rejected;
        println!(
            "{:>28} | {:>10} | {:>10} | {:>12} | {:>9} | {:>6}",
            "forged-pk(c17,digit15)",
            "-",
            "-",
            "-",
            "reject",
            if rejected { "PASS" } else { "FAIL" },
        );
    }

    println!();
    if all_ok {
        println!(
            "all cases behaved as expected: honest accepted, 7/7 proofs rejected, \
             1/1 native check rejected"
        );
    } else {
        println!("FAILURE: at least one case did not behave as expected");
        std::process::exit(1);
    }
}
