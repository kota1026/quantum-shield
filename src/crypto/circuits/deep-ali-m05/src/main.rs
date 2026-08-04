//! M0.5-impl method-A component 4 (final) — DEEP-ALI consistency AIR.
//!
//! Constructs a consistent DEEP opening for the demo constraint
//! `C = t(zeta*g) - t(zeta)^2` (`t1 = t0^2 + (zeta^n - 1)*q`), proves the
//! DEEP-ALI identity AIR over it, and runs a tamper battery: the honest
//! opening verifies, and a forged trace opening, a forged quotient, or a
//! forged out-of-domain point (which changes zeta^n) all reject.
//!
//! Run: cargo run --release (FRI as in M0..M4: log_blowup=3, 100 queries, pow 16).

mod air;

use core::borrow::BorrowMut;
use std::time::Instant;

use p3_baby_bear::BabyBear;
use p3_challenger::{HashChallenger, SerializingChallenger32};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_field::PrimeCharacteristicRing;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_matrix::dense::RowMajorMatrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::{prove, verify, StarkConfig};

use air::{
    num_cols, Cols, DeepAliAir, LOG_N, NUM_PUBLIC_VALUES, PI_Q, PI_T0, PI_T1, PI_ZETA, ROWS,
};

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

struct Opening {
    zeta: Val,
    t0: Val,
    t1: Val,
    q: Val,
    chain: [Val; ROWS],
}

fn zeta_pow_n(zeta: Val) -> (Val, [Val; ROWS]) {
    let mut chain = [Val::ZERO; ROWS];
    let mut p = zeta;
    chain[0] = p;
    for i in 1..ROWS {
        p = p * p;
        chain[i] = p;
    }
    (chain[ROWS - 1], chain)
}

/// A consistent DEEP opening: t1 is forced so C = Z_H(zeta)*q holds.
fn build_opening() -> Opening {
    let zeta = Val::from_u32(31337);
    let t0 = Val::from_u32(424242);
    let q = Val::from_u32(999983);
    let (zn, chain) = zeta_pow_n(zeta);
    let zh = zn - Val::ONE;
    let t1 = t0 * t0 + zh * q; // C = t1 - t0^2 = Z_H(zeta)*q
    Opening { zeta, t0, t1, q, chain }
}

fn public_inputs(o: &Opening) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; NUM_PUBLIC_VALUES];
    pis[PI_ZETA] = o.zeta;
    pis[PI_T0] = o.t0;
    pis[PI_T1] = o.t1;
    pis[PI_Q] = o.q;
    pis
}

fn build_trace(o: &Opening) -> RowMajorMatrix<Val> {
    let nrows = ROWS.next_power_of_two();
    let width = num_cols();
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let row = &mut values[r * width..(r + 1) * width];
        let c: &mut Cols<Val> = row.borrow_mut();
        if r < ROWS {
            c.is_real = Val::ONE;
            c.links_next = if r + 1 < ROWS { Val::ONE } else { Val::ZERO };
            c.p = o.chain[r];
            c.onehot[r] = Val::ONE;
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
    let air = DeepAliAir;
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
    println!("# M0.5 method-A component 4 (final): DEEP-ALI consistency AIR (BabyBear, n=2^{LOG_N})");
    println!("# cols={} public_values={} chain_rows={ROWS}", num_cols(), NUM_PUBLIC_VALUES);
    let o = build_opening();

    println!();
    println!("{:>22} | {:>10} | {:>10} | {:>12} | {:>9} | {:>6}",
        "case", "prove_ms", "verify_ms", "proof_bytes", "expected", "result");
    let mut all_ok = true;
    let mut report = |name: &str, exp: bool, r: &Res| {
        let pass = r.accepted == exp;
        all_ok &= pass;
        println!("{:>22} | {:>10.1} | {:>10.1} | {:>12} | {:>9} | {:>6}",
            name, r.prove_ms, r.verify_ms, r.proof_bytes,
            if exp { "accept" } else { "reject" },
            if pass { "PASS" } else { "FAIL" });
    };

    let r = run(build_trace(&o), &public_inputs(&o));
    report("honest", true, &r);

    // Forge the trace opening t1.
    {
        let mut p = public_inputs(&o);
        p[PI_T1] += Val::ONE;
        let r = run(build_trace(&o), &p);
        report("forged-opening(t1)", false, &r);
    }
    // Forge t0 (breaks C = t1 - t0^2).
    {
        let mut p = public_inputs(&o);
        p[PI_T0] += Val::ONE;
        let r = run(build_trace(&o), &p);
        report("forged-opening(t0)", false, &r);
    }
    // Forge the quotient.
    {
        let mut p = public_inputs(&o);
        p[PI_Q] += Val::ONE;
        let r = run(build_trace(&o), &p);
        report("forged-quotient", false, &r);
    }
    // Forge zeta in the public input while keeping the honest chain: the
    // first-row binding p_0 == zeta fails.
    {
        let mut p = public_inputs(&o);
        p[PI_ZETA] += Val::ONE;
        let r = run(build_trace(&o), &p);
        report("forged-zeta(pub)", false, &r);
    }
    // Forge zeta consistently in the chain (so p_0==zeta holds) but keep the
    // honest t1/q: zeta^n changes, so the DEEP identity fails.
    {
        let mut o2 = build_opening();
        o2.zeta += Val::ONE;
        let (_zn, chain) = zeta_pow_n(o2.zeta);
        o2.chain = chain;
        let mut p = public_inputs(&o); // honest t0,t1,q
        p[PI_ZETA] = o2.zeta;
        let r = run(build_trace(&o2), &p);
        report("wrong-ood-point", false, &r);
    }

    println!();
    if all_ok {
        println!("honest DEEP opening verified; 5/5 tamper cases rejected");
        println!("# in-circuit DEEP-ALI: C(openings) == Z_H(zeta)*q with zeta^n recomputed \
                  by an in-AIR squaring chain (§19) — method A's 4th and final component. \
                  §16 Merkle-opening + §17 fold + §18 transcript + §19 DEEP-ALI compose \
                  into the recursive verifier AIR, wrapped by the §14 Groth16 path.");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
