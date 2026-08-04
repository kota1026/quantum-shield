//! M0.5-impl method-A component 3 — Fiat-Shamir transcript-replay AIR.
//!
//! Runs a real Poseidon2 duplex-sponge transcript over a sequence of
//! observed commitments, proves the replay AIR, and runs a tamper battery:
//! the honest transcript verifies, and forging an observed commitment or a
//! claimed challenge (both of which the FRI folding AIR would consume) fails.
//!
//! Run: cargo run --release (FRI as in M0..M4: log_blowup=3, 100 queries, pow 16).

mod air;
mod poseidon;

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
use p3_matrix::Matrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_poseidon2_air::generate_trace_rows;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::{prove, verify, StarkConfig};

use air::{
    num_link_cols, num_public_values, pi_chal, pi_obs, LinkCols, TranscriptAir, CH, P2_COLS,
    RATE,
};
use poseidon::{constants, permute, WIDTH};

/// Transcript rounds for the demo.
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

struct Transcript {
    obs: [[Val; RATE]; R],
    chal: [[Val; CH]; R],
    inputs: [[Val; WIDTH]; R],
}

fn build_transcript() -> Transcript {
    let (_c, b, p, e) = constants();
    let mut obs = [[Val::ZERO; RATE]; R];
    let mut chal = [[Val::ZERO; CH]; R];
    let mut inputs = [[Val::ZERO; WIDTH]; R];
    let mut cap = [Val::ZERO; RATE]; // capacity IV = 0
    for r in 0..R {
        let o: [Val; RATE] = core::array::from_fn(|i| Val::from_u32(1000 + (r * RATE + i) as u32));
        obs[r] = o;
        let mut input = [Val::ZERO; WIDTH];
        input[..RATE].copy_from_slice(&o);
        input[RATE..].copy_from_slice(&cap);
        inputs[r] = input;
        let output = permute(input, &b, &p, &e);
        chal[r] = core::array::from_fn(|j| output[j]);
        cap = core::array::from_fn(|i| output[RATE + i]);
    }
    Transcript { obs, chal, inputs }
}

fn public_inputs(t: &Transcript) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; num_public_values::<R>()];
    for r in 0..R {
        pis[pi_obs() + r * RATE..pi_obs() + r * RATE + RATE].copy_from_slice(&t.obs[r]);
        pis[pi_chal::<R>() + r * CH..pi_chal::<R>() + r * CH + CH].copy_from_slice(&t.chal[r]);
    }
    pis
}

fn build_trace(t: &Transcript) -> RowMajorMatrix<Val> {
    let (c, ..) = constants();
    let nrows = R.next_power_of_two();
    let inputs: Vec<[Val; WIDTH]> = (0..nrows)
        .map(|r| if r < R { t.inputs[r] } else { [Val::ZERO; WIDTH] })
        .collect();
    let p2 = generate_trace_rows::<
        Val,
        p3_baby_bear::GenericPoseidon2LinearLayersBabyBear,
        WIDTH,
        { poseidon::SBOX_DEGREE },
        { poseidon::SBOX_REGISTERS },
        { poseidon::HALF_FULL_ROUNDS },
        { poseidon::PARTIAL_ROUNDS },
    >(inputs, &c, 0);

    let width = P2_COLS + num_link_cols::<R>();
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let src = p2.row_slice(r).expect("row");
        let row = &mut values[r * width..(r + 1) * width];
        row[..P2_COLS].copy_from_slice(&src);
        let lc: &mut LinkCols<Val, R> = row[P2_COLS..].borrow_mut();
        if r < R {
            lc.is_real = Val::ONE;
            lc.links_next = if r + 1 < R { Val::ONE } else { Val::ZERO };
            lc.onehot[r] = Val::ONE;
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

fn run(trace: RowMajorMatrix<Val>, pis: &[Val], air: &TranscriptAir<R>) -> Res {
    let config = make_config();
    let t0 = Instant::now();
    let proof = prove(&config, air, trace, &pis.to_vec());
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let proof_bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let t1 = Instant::now();
    let accepted = verify(&config, air, &proof, &pis.to_vec()).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
    Res { prove_ms, verify_ms, proof_bytes, accepted }
}

fn main() {
    println!("# M0.5 method-A component 3: Fiat-Shamir transcript-replay AIR (BabyBear, R={R})");
    let (c, ..) = constants();
    let air = TranscriptAir::<R>::new(c);
    println!("# poseidon2_cols={P2_COLS} link_cols={} public_values={}",
        num_link_cols::<R>(), num_public_values::<R>());

    let t = build_transcript();

    println!();
    println!("{:>26} | {:>10} | {:>10} | {:>12} | {:>9} | {:>6}",
        "case", "prove_ms", "verify_ms", "proof_bytes", "expected", "result");
    let mut all_ok = true;
    let mut report = |name: &str, exp: bool, r: &Res| {
        let pass = r.accepted == exp;
        all_ok &= pass;
        println!("{:>26} | {:>10.1} | {:>10.1} | {:>12} | {:>9} | {:>6}",
            name, r.prove_ms, r.verify_ms, r.proof_bytes,
            if exp { "accept" } else { "reject" },
            if pass { "PASS" } else { "FAIL" });
    };

    let r = run(build_trace(&t), &public_inputs(&t), &air);
    report("honest", true, &r);

    // Forge an observed commitment (round 4): the derived challenge no longer
    // matches the public challenge.
    {
        let mut p = public_inputs(&t);
        p[pi_obs() + 4 * RATE] += Val::ONE;
        let r = run(build_trace(&t), &p, &air);
        report("forged-observed(r4)", false, &r);
    }
    // Forge a claimed challenge (round 2).
    {
        let mut p = public_inputs(&t);
        p[pi_chal::<R>() + 2 * CH] += Val::ONE;
        let r = run(build_trace(&t), &p, &air);
        report("forged-challenge(r2)", false, &r);
    }
    // Forge the second challenge lane (round 6) — e.g. a query index.
    {
        let mut p = public_inputs(&t);
        p[pi_chal::<R>() + 6 * CH + 1] += Val::ONE;
        let r = run(build_trace(&t), &p, &air);
        report("forged-index-lane(r6)", false, &r);
    }
    // Swap two observed commitments: transcript order matters (capacity chain).
    {
        let mut t2 = build_transcript();
        t2.obs.swap(1, 5);
        // Recompute a consistent trace for the swapped observed sequence but
        // keep the honest (unswapped) public challenges: must reject.
        let (_c, b, p_, e) = constants();
        let mut cap = [Val::ZERO; RATE];
        for r in 0..R {
            let mut input = [Val::ZERO; WIDTH];
            input[..RATE].copy_from_slice(&t2.obs[r]);
            input[RATE..].copy_from_slice(&cap);
            t2.inputs[r] = input;
            let output = permute(input, &b, &p_, &e);
            cap = core::array::from_fn(|i| output[RATE + i]);
        }
        let mut pubs = public_inputs(&t2); // observed swapped, challenges from t2
        // Overwrite challenges with the honest (unswapped) ones -> mismatch.
        for r in 0..R {
            pubs[pi_chal::<R>() + r * CH..pi_chal::<R>() + r * CH + CH]
                .copy_from_slice(&t.chal[r]);
        }
        let r = run(build_trace(&t2), &pubs, &air);
        report("reordered-transcript", false, &r);
    }

    println!();
    if all_ok {
        println!("honest transcript verified; 4/4 tamper cases rejected");
        println!("# in-circuit Fiat-Shamir: challenges derived from observed commitments \
                  via a Poseidon2 sponge and bound to the fold AIR's public inputs \
                  (§18) — method-A component 3. Remaining: DEEP-ALI (§19).");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
