//! M0.5-impl method-A component 2 — FRI folding-consistency AIR.
//!
//! Builds a real per-query FRI folding transcript (running evaluation folded
//! round by round), proves the fold-consistency AIR over it, and runs a
//! tamper battery: the honest fold verifies, and a forged opening, a flipped
//! index bit, a wrong round challenge, or a forged final value all reject.
//!
//! FRI folding runs in the challenge (extension) field in production; the
//! fold relation is field-agnostic, so this demonstration uses the base
//! field BabyBear. Run: cargo run --release (log_blowup=3, 100 queries, pow 16).

mod air;

use core::borrow::BorrowMut;
use std::time::Instant;

use p3_baby_bear::BabyBear;
use p3_challenger::{HashChallenger, SerializingChallenger32};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_field::{Field, PrimeCharacteristicRing};
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_matrix::dense::RowMajorMatrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::{prove, verify, StarkConfig};

use air::{
    num_cols, num_public_values, pi_a, pi_beta, pi_bit, pi_c, pi_final, pi_init, pi_x0,
    FriCols, FriFoldAir,
};

/// FRI rounds for the demo.
const R: usize = 8;

type Val = BabyBear;
type Challenge = BinomialExtensionField<Val, 4>;
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
type Challenger = SerializingChallenger32<Val, HashChallenger<u8, ByteHash, 32>>;
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

struct FriQuery {
    x0: Val,
    init: Val,
    final_eval: Val,
    beta: [Val; R],
    a: [Val; R],
    c: [Val; R],
    bit: [Val; R],
    // Witness: running eval and domain point per round.
    e: [Val; R],
    x: [Val; R],
}

fn two_inv() -> Val {
    Val::from_u8(2).inverse()
}

/// Build a consistent FRI folding transcript. The opening at the query point
/// is forced to the running eval; the sibling opening is free.
fn build_query() -> FriQuery {
    let ti = two_inv();
    let mut x = Val::from_u32(7); // some domain point (nonzero)
    let init = Val::from_u32(12345);
    let mut e = init;
    let mut beta = [Val::ZERO; R];
    let mut a = [Val::ZERO; R];
    let mut c = [Val::ZERO; R];
    let mut bit = [Val::ZERO; R];
    let mut es = [Val::ZERO; R];
    let mut xs = [Val::ZERO; R];
    for i in 0..R {
        let b = (i % 2) as u32; // deterministic index bits
        bit[i] = Val::from_u32(b);
        beta[i] = Val::from_u32(100 + i as u32);
        // Opening at the query point must equal e; the sibling is free.
        let sib = Val::from_u32(9000 + i as u32);
        if b == 0 {
            a[i] = e;
            c[i] = sib;
        } else {
            c[i] = e;
            a[i] = sib;
        }
        es[i] = e;
        xs[i] = x;
        // Fold: e_next = (a+c)/2 + beta*(a-c)/(2x).
        let e_next = (a[i] + c[i]) * ti + beta[i] * (a[i] - c[i]) * ti * x.inverse();
        e = e_next;
        x = x * x;
    }
    FriQuery { x0: xs[0], init, final_eval: e, beta, a, c, bit, e: es, x: xs }
}

fn public_inputs(q: &FriQuery) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; num_public_values::<R>()];
    pis[pi_x0()] = q.x0;
    pis[pi_init()] = q.init;
    pis[pi_final()] = q.final_eval;
    for i in 0..R {
        pis[pi_beta() + i] = q.beta[i];
        pis[pi_a::<R>() + i] = q.a[i];
        pis[pi_c::<R>() + i] = q.c[i];
        pis[pi_bit::<R>() + i] = q.bit[i];
    }
    pis
}

fn build_trace(q: &FriQuery) -> RowMajorMatrix<Val> {
    let nrows = R.next_power_of_two();
    let width = num_cols::<R>();
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let row = &mut values[r * width..(r + 1) * width];
        let fc: &mut FriCols<Val, R> = row.borrow_mut();
        if r < R {
            fc.is_real = Val::ONE;
            fc.links_next = if r + 1 < R { Val::ONE } else { Val::ZERO };
            fc.dir = q.bit[r];
            fc.e = q.e[r];
            fc.x = q.x[r];
            fc.onehot[r] = Val::ONE;
        }
    }
    RowMajorMatrix::new(values, width)
}

struct Res {
    prove_ms: f64,
    verify_ms: f64,
    proof_bytes: usize,
    accepted: bool,
}

fn run(trace: RowMajorMatrix<Val>, pis: &[Val]) -> Res {
    let config = make_config();
    let air = FriFoldAir::<R>;
    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, &pis.to_vec());
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let proof_bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let t1 = Instant::now();
    let accepted = verify(&config, &air, &proof, &pis.to_vec()).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
    Res { prove_ms, verify_ms, proof_bytes, accepted }
}

fn main() {
    println!("# M0.5 method-A component 2: FRI folding-consistency AIR (BabyBear, R={R})");
    println!("# cols={} public_values={}", num_cols::<R>(), num_public_values::<R>());
    let q = build_query();

    println!();
    println!("{:>24} | {:>10} | {:>10} | {:>12} | {:>9} | {:>6}",
        "case", "prove_ms", "verify_ms", "proof_bytes", "expected", "result");

    let mut all_ok = true;
    let mut report = |name: &str, exp: bool, r: &Res| {
        let pass = r.accepted == exp;
        all_ok &= pass;
        println!("{:>24} | {:>10.1} | {:>10.1} | {:>12} | {:>9} | {:>6}",
            name, r.prove_ms, r.verify_ms, r.proof_bytes,
            if exp { "accept" } else { "reject" },
            if pass { "PASS" } else { "FAIL" });
    };

    let r = run(build_trace(&q), &public_inputs(&q));
    report("honest", true, &r);

    // Forge a sibling opening (round 3).
    {
        let mut p = public_inputs(&q);
        // round 3 has bit=1 so the sibling is `a`.
        p[pi_a::<R>() + 3] += Val::ONE;
        let r = run(build_trace(&q), &p);
        report("forged-opening(r3)", false, &r);
    }
    // Flip an index bit (round 4).
    {
        let mut p = public_inputs(&q);
        let idx = pi_bit::<R>() + 4;
        p[idx] = Val::ONE - p[idx];
        let r = run(build_trace(&q), &p);
        report("flipped-bit(r4)", false, &r);
    }
    // Wrong round challenge (round 2).
    {
        let mut p = public_inputs(&q);
        p[pi_beta() + 2] += Val::ONE;
        let r = run(build_trace(&q), &p);
        report("wrong-beta(r2)", false, &r);
    }
    // Forge the final folded value.
    {
        let mut p = public_inputs(&q);
        p[pi_final()] += Val::ONE;
        let r = run(build_trace(&q), &p);
        report("forged-final", false, &r);
    }
    // Forge the initial evaluation.
    {
        let mut p = public_inputs(&q);
        p[pi_init()] += Val::ONE;
        let r = run(build_trace(&q), &p);
        report("forged-init", false, &r);
    }

    println!();
    if all_ok {
        println!("honest fold verified; 5/5 tamper cases rejected");
        println!("# per-query fold-and-check as a native-field AIR — method-A component 2 \
                  (§17); composes with the Poseidon2 Merkle-opening AIR (§16) and the \
                  pending transcript / DEEP-ALI components into the recursive verifier.");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
