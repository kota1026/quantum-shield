//! M0.5-impl method-A public-surface reduction — interface-commitment AIR.
//!
//! Absorbs the recursive verifier's public interface set (§20 glue values)
//! into a Poseidon2 sponge and proves a single digest binding it. That digest
//! is what the §14 Groth16 wrap consumes. Honest accept + tamper battery: any
//! change to an interface value with the honest digest, or a forged digest,
//! rejects — the digest binds the whole set.
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
    num_link_cols, num_public_values, pi_digest, pi_iface, AggregateAir, LinkCols, NBLOCKS,
    P2_COLS, RATE,
};
use poseidon::{constants, permute, WIDTH};

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

/// The interface set arranged as NBLOCKS rate blocks, plus its digest.
struct Iface {
    blocks: [[Val; RATE]; NBLOCKS],
    digest: [Val; RATE],
    inputs: [[Val; WIDTH]; NBLOCKS],
}

fn build_iface() -> Iface {
    let (_c, b, p, e) = constants();
    // Representative interface values (would come from the four segment
    // proofs' public interfaces: Merkle root, fold betas, f_init/f_final,
    // DEEP opening).
    let mut blocks = [[Val::ZERO; RATE]; NBLOCKS];
    blocks[0] = core::array::from_fn(|i| Val::from_u32(3000 + i as u32)); // Merkle root
    blocks[1] = core::array::from_fn(|i| Val::from_u32(100 + i as u32)); // fold betas
    // [f_init, f_final, d_t0, pad...]
    blocks[2][0] = Val::from_u32(424242);
    blocks[2][1] = Val::from_u32(818181);
    blocks[2][2] = Val::from_u32(999983);

    let mut inputs = [[Val::ZERO; WIDTH]; NBLOCKS];
    let mut cap = [Val::ZERO; RATE];
    let mut digest = [Val::ZERO; RATE];
    for r in 0..NBLOCKS {
        let mut input = [Val::ZERO; WIDTH];
        input[..RATE].copy_from_slice(&blocks[r]);
        input[RATE..].copy_from_slice(&cap);
        inputs[r] = input;
        let out = permute(input, &b, &p, &e);
        digest = core::array::from_fn(|i| out[i]);
        cap = core::array::from_fn(|i| out[RATE + i]);
    }
    Iface { blocks, digest, inputs }
}

fn public_inputs(f: &Iface) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; num_public_values()];
    for r in 0..NBLOCKS {
        pis[pi_iface() + r * RATE..pi_iface() + r * RATE + RATE].copy_from_slice(&f.blocks[r]);
    }
    pis[pi_digest()..pi_digest() + RATE].copy_from_slice(&f.digest);
    pis
}

fn build_trace(f: &Iface) -> RowMajorMatrix<Val> {
    let (c, ..) = constants();
    let nrows = NBLOCKS.next_power_of_two();
    let inputs: Vec<[Val; WIDTH]> =
        (0..nrows).map(|r| if r < NBLOCKS { f.inputs[r] } else { [Val::ZERO; WIDTH] }).collect();
    let p2 = generate_trace_rows::<
        Val, p3_baby_bear::GenericPoseidon2LinearLayersBabyBear, WIDTH,
        { poseidon::SBOX_DEGREE }, { poseidon::SBOX_REGISTERS }, { poseidon::HALF_FULL_ROUNDS },
        { poseidon::PARTIAL_ROUNDS },
    >(inputs, &c, 0);
    let width = P2_COLS + num_link_cols();
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let src = p2.row_slice(r).expect("row");
        let row = &mut values[r * width..(r + 1) * width];
        row[..P2_COLS].copy_from_slice(&src);
        let lc: &mut LinkCols<Val> = row[P2_COLS..].borrow_mut();
        if r < NBLOCKS {
            lc.is_real = Val::ONE;
            lc.links_next = if r + 1 < NBLOCKS { Val::ONE } else { Val::ZERO };
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

fn run(trace: RowMajorMatrix<Val>, pis: &[Val], air: &AggregateAir) -> Res {
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
    println!("# M0.5 method-A public-surface reduction: interface-commitment AIR (BabyBear)");
    let (c, ..) = constants();
    let air = AggregateAir::new(c);
    println!("# poseidon2_cols={P2_COLS} link_cols={} public_values={} (iface {} + digest {RATE})",
        num_link_cols(), num_public_values(), NBLOCKS * RATE);

    let f = build_iface();

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

    let r = run(build_trace(&f), &public_inputs(&f), &air);
    report("honest", true, &r);

    // Forge an interface value (Merkle root lane) keeping the honest digest.
    {
        let mut p = public_inputs(&f);
        p[pi_iface()] += Val::ONE;
        let r = run(build_trace(&f), &p, &air);
        report("forged-iface(root)", false, &r);
    }
    // Forge a fold-beta lane.
    {
        let mut p = public_inputs(&f);
        p[pi_iface() + RATE] += Val::ONE;
        let r = run(build_trace(&f), &p, &air);
        report("forged-iface(beta)", false, &r);
    }
    // Forge the f_final interface value.
    {
        let mut p = public_inputs(&f);
        p[pi_iface() + 2 * RATE + 1] += Val::ONE;
        let r = run(build_trace(&f), &p, &air);
        report("forged-iface(f_final)", false, &r);
    }
    // Forge the digest itself.
    {
        let mut p = public_inputs(&f);
        p[pi_digest()] += Val::ONE;
        let r = run(build_trace(&f), &p, &air);
        report("forged-digest", false, &r);
    }

    println!();
    if all_ok {
        println!("honest interface commitment verified; 4/4 tamper cases rejected");
        println!("# the recursive verifier's public surface is now one Poseidon2 digest \
                  (§21) — the single input the §14 Groth16 wrap binds. Remaining M0.5-impl: \
                  verify the four segment proofs in-circuit so the committed values are \
                  bound to real proofs (full recursion, env-gated).");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
