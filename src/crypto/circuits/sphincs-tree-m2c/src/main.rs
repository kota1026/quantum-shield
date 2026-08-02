//! M2c — SPHINCS+ tree pipeline AIR (SPHINCS+-SHAKE-128s).
//!
//! M2b closed the signature-verification form of the WOTS+ chains; the
//! remaining tree-side mechanisms are (a) multi-block SHAKE256 absorption —
//! T_len over the 35 WOTS+ pk elements and T_k over the 14 FORS roots, whose
//! inputs exceed the 136-byte rate and need `state XOR next-block` linking —
//! and (b) Merkle auth-path verification with direction bits (FORS a=12,
//! XMSS h'=9). This binary proves a fixed 30-permutation pipeline covering
//! all of them (see `air.rs`), with in-trace glue between adjacent stages
//! (FORS root -> T_k, T_len leaf -> XMSS climb) and public-table binding of
//! every structural byte.
//!
//! The run proves the honest witness (must verify) and a battery of tampered
//! witnesses / forged public inputs (all must FAIL). Tampered witnesses
//! contain only valid Keccak-f permutations — rejection is delivered by the
//! link constraints and public bindings alone.
//!
//! Run with: cargo run --release   (single-threaded, conservative FRI params
//! as in M0..M2b: log_blowup=3, 100 queries, 16-bit PoW — ~100-bit target)

mod air;
mod sphincs;
mod trace;

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
use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::Shake256;

use air::SphincsTreeAir;
use sphincs::{AdrsParams, Instance, Tamper, FORS_A, FORS_K, N, NUM_SLOTS, WOTS_LEN, XMSS_H};
use trace::{build_trace, derive_public_inputs};

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
    let air = SphincsTreeAir;

    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, pis);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let proof_bytes = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

    let t1 = Instant::now();
    let accepted = verify(&config, &air, &proof, pis).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;

    CaseResult { prove_ms, verify_ms, proof_bytes, accepted }
}

fn det16(label: &str, i: u32) -> [u8; N] {
    let mut h = Shake256::default();
    h.update(label.as_bytes());
    h.update(&i.to_be_bytes());
    let mut o = [0u8; N];
    h.finalize_xof().read(&mut o);
    o
}

fn main() {
    let inst = Instance {
        pk_seed: [0x42u8; N],
        params: AdrsParams {
            layer: 0,
            tree: *b"QSm2c-tree-1",
            kp: 9, // XMSS leaf index: bits 100100000 -> both climb directions
        },
        i_tree: 3,
        i_leaf: 2748, // bits 101010111100 -> both FORS climb directions
        sk: det16("qs-m2c-sk", 0),
        fors_auth: core::array::from_fn(|j| det16("qs-m2c-fauth", j as u32)),
        roots_rest: core::array::from_fn(|i| det16("qs-m2c-root", i as u32 + 1)),
        pk_elems: core::array::from_fn(|k| det16("qs-m2c-pk", k as u32)),
        xmss_auth: core::array::from_fn(|j| det16("qs-m2c-xauth", j as u32)),
    };

    println!("# M2c: SPHINCS+ tree pipeline — multi-block absorption + auth paths");
    println!(
        "# slots={NUM_SLOTS} (FORS leaf + {FORS_A} climbs | T_k {k} roots x3 blocks | \
         T_len {len} pks x5 blocks | XMSS {h} climbs) link_cols={} total_cols={} \
         public_values={}",
        air::NUM_LINK_COLS,
        air::NUM_COLS,
        air::NUM_PUBLIC_VALUES,
        k = FORS_K,
        len = WOTS_LEN,
        h = XMSS_H,
    );

    let honest = sphincs::build_witness(&inst, &Tamper::None);
    let honest_pis = derive_public_inputs(&inst, &honest.fors_pk, &honest.root);
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

    // Witness tampers. Publics are re-derived with the tampered run's outputs
    // (tables always come from the honest instance), so rejection isolates
    // the targeted constraint. Every tampered trace still contains only
    // valid Keccak-f permutations.
    let witness_cases: [(&str, Tamper); 5] = [
        ("tampered-tlen-block(b2)", Tamper::TlenBlock { block: 2, byte: 10 }),
        ("broken-capacity(s17)", Tamper::BreakCapacity { after_slot: 17 }),
        ("wrong-auth-node(f6)", Tamper::WrongAuthNode { fors_j: 6 }),
        ("wrong-direction(x4)", Tamper::WrongDirection { xmss_j: 4 }),
        ("wrong-tree-height(f8)", Tamper::WrongTreeHeight { fors_j: 8 }),
    ];
    for (name, tamper) in witness_cases {
        let w = sphincs::build_witness(&inst, &tamper);
        let pis = derive_public_inputs(&inst, &w.fors_pk, &w.root);
        let r = run_case(build_trace(&w), &pis);
        report(name, false, &r);
    }

    // Public-input forgeries against the honest witness.
    {
        let mut i2 = inst.clone();
        i2.sk[0] ^= 0x01;
        let pis = derive_public_inputs(&i2, &honest.fors_pk, &honest.root);
        let r = run_case(build_trace(&honest), &pis);
        report("forged-sk", false, &r);
    }
    {
        let mut i2 = inst.clone();
        i2.pk_elems[0][0] ^= 0x01; // lives in T_len block 0 (fresh, table-bound)
        let pis = derive_public_inputs(&i2, &honest.fors_pk, &honest.root);
        let r = run_case(build_trace(&honest), &pis);
        report("forged-pk0(fresh-block)", false, &r);
    }
    {
        let mut i2 = inst.clone();
        i2.pk_elems[20][0] ^= 0x01; // lives in T_len block 2 (XOR-linked bits)
        let pis = derive_public_inputs(&i2, &honest.fors_pk, &honest.root);
        let r = run_case(build_trace(&honest), &pis);
        report("forged-pk20(cont-block)", false, &r);
    }
    {
        let mut fp = honest.fors_pk;
        fp[0] ^= 0x01;
        let pis = derive_public_inputs(&inst, &fp, &honest.root);
        let r = run_case(build_trace(&honest), &pis);
        report("forged-fors-pk", false, &r);
    }
    {
        let mut rt = honest.root;
        rt[0] ^= 0x01;
        let pis = derive_public_inputs(&inst, &honest.fors_pk, &rt);
        let r = run_case(build_trace(&honest), &pis);
        report("forged-root", false, &r);
    }

    println!();
    if all_ok {
        println!("all cases behaved as expected: honest accepted, 10/10 tampers rejected");
    } else {
        println!("FAILURE: at least one case did not behave as expected");
        std::process::exit(1);
    }
}
