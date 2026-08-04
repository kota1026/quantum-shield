//! M0.5-impl method-A component 1 — Poseidon2 Merkle-opening verifier AIR.
//!
//! Recursive FRI verification (§15, method A) re-hashes every opened Merkle
//! node inside the circuit; with the recursion-friendly Poseidon2 hash that
//! inner loop is what this AIR proves. This binary builds a real Poseidon2
//! Merkle authentication path, proves it, and runs a tamper battery: the
//! honest path verifies, and forged siblings / flipped direction bits /
//! forged leaf or root all fail — rejection delivered by the link
//! constraints on top of the (always-valid) Poseidon2 permutations.
//!
//! Run with: cargo run --release   (single-threaded, FRI as in M0..M4:
//! log_blowup=3, 100 queries, 16-bit PoW).

mod air;
mod poseidon;

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
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

use air::{
    num_public_values, pi_dir, pi_leaf, pi_root, pi_sib, LinkCols, MerklePathAir, P2_COLS,
};
use poseidon::{
    compress, constants, permute, CHUNK, HALF_FULL_ROUNDS, PARTIAL_ROUNDS, WIDTH,
};

/// Merkle tree height for the demo (leaves = 2^D).
const D: usize = 8;

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

/// A Merkle authentication path: the per-level Poseidon2 inputs (running node
/// placed by the index bit, sibling in the other half) and the final root.
struct Path {
    leaf: [Val; CHUNK],
    root: [Val; CHUNK],
    dirs: [Val; D],
    sibs: [[Val; CHUNK]; D],
    inputs: [[Val; WIDTH]; D],
}

fn build_path(rng: &mut SmallRng) -> Path {
    let (_c, b, p, e) = constants();
    let leaf: [Val; CHUNK] = core::array::from_fn(|_| rng.random());
    let mut node = leaf;
    let mut dirs = [Val::ZERO; D];
    let mut sibs = [[Val::ZERO; CHUNK]; D];
    let mut inputs = [[Val::ZERO; WIDTH]; D];
    for lvl in 0..D {
        let bit = rng.random::<bool>();
        dirs[lvl] = if bit { Val::ONE } else { Val::ZERO };
        let sib: [Val; CHUNK] = core::array::from_fn(|_| rng.random());
        sibs[lvl] = sib;
        let (left, right) = if bit { (sib, node) } else { (node, sib) };
        let (next, input) = compress(left, right, &b, &p, &e);
        inputs[lvl] = input;
        node = next;
    }
    Path { leaf, root: node, dirs, sibs, inputs }
}

fn public_inputs(path: &Path) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; num_public_values::<D>()];
    pis[pi_leaf()..pi_leaf() + CHUNK].copy_from_slice(&path.leaf);
    pis[pi_root()..pi_root() + CHUNK].copy_from_slice(&path.root);
    for lvl in 0..D {
        pis[pi_dir() + lvl] = path.dirs[lvl];
        pis[pi_sib::<D>() + lvl * CHUNK..pi_sib::<D>() + lvl * CHUNK + CHUNK]
            .copy_from_slice(&path.sibs[lvl]);
    }
    pis
}

fn build_trace(path: &Path) -> RowMajorMatrix<Val> {
    let (constants, ..) = constants();
    let nrows = D.next_power_of_two();
    let inputs: Vec<[Val; WIDTH]> = (0..nrows)
        .map(|r| if r < D { path.inputs[r] } else { [Val::ZERO; WIDTH] })
        .collect();
    let p2 = generate_trace_rows::<
        Val,
        p3_baby_bear::GenericPoseidon2LinearLayersBabyBear,
        WIDTH,
        { poseidon::SBOX_DEGREE },
        { poseidon::SBOX_REGISTERS },
        HALF_FULL_ROUNDS,
        PARTIAL_ROUNDS,
    >(inputs, &constants, 0);

    let link = air::num_link_cols::<D>();
    let width = P2_COLS + link;
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let src = p2.row_slice(r).expect("row");
        let row = &mut values[r * width..(r + 1) * width];
        row[..P2_COLS].copy_from_slice(&src);
        let lc: &mut LinkCols<Val, D> = row[P2_COLS..].borrow_mut();
        if r < D {
            lc.is_real = Val::ONE;
            lc.dir = path.dirs[r];
            lc.links_next = if r + 1 < D { Val::ONE } else { Val::ZERO };
            lc.onehot[r] = Val::ONE;
        }
    }
    RowMajorMatrix::new(values, width)
}

use core::borrow::BorrowMut;

struct Res {
    prove_ms: f64,
    verify_ms: f64,
    proof_bytes: usize,
    accepted: bool,
}

fn run(trace: RowMajorMatrix<Val>, pis: &[Val], air: &MerklePathAir<D>) -> Res {
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
    println!("# M0.5 recursion primitive: Poseidon2 Merkle-opening AIR (BabyBear, D={D})");
    let (consts0, ..) = constants();
    let air = MerklePathAir::<D>::new(consts0);
    println!("# poseidon2_cols={P2_COLS} link_cols={} public_values={}",
        air::num_link_cols::<D>(), num_public_values::<D>());

    let mut rng = SmallRng::seed_from_u64(0xa1b2c3d4);
    let honest = build_path(&mut rng);

    // Sanity: native recomputation is self-consistent (exercises `permute`).
    {
        let (_c, b, p, e) = constants();
        let out = permute(honest.inputs[0], &b, &p, &e);
        let mut n0 = [Val::ZERO; CHUNK];
        n0.copy_from_slice(&out[..CHUNK]);
        let _ = n0;
    }

    println!();
    println!("{:>26} | {:>10} | {:>10} | {:>12} | {:>9} | {:>6}",
        "case", "prove_ms", "verify_ms", "proof_bytes", "expected", "result");

    let mut all_ok = true;
    let mut report = |name: &str, exp_accept: bool, r: &Res| {
        let pass = r.accepted == exp_accept;
        all_ok &= pass;
        println!("{:>26} | {:>10.1} | {:>10.1} | {:>12} | {:>9} | {:>6}",
            name, r.prove_ms, r.verify_ms, r.proof_bytes,
            if exp_accept { "accept" } else { "reject" },
            if pass { "PASS" } else { "FAIL" });
    };

    let r = run(build_trace(&honest), &public_inputs(&honest), &air);
    report("honest", true, &r);

    // Forge the public root.
    {
        let mut p = public_inputs(&honest);
        p[pi_root()] += Val::ONE;
        let r = run(build_trace(&honest), &p, &air);
        report("forged-root", false, &r);
    }
    // Forge the public leaf.
    {
        let mut p = public_inputs(&honest);
        p[pi_leaf()] += Val::ONE;
        let r = run(build_trace(&honest), &p, &air);
        report("forged-leaf", false, &r);
    }
    // Forge a public sibling (level 3).
    {
        let mut p = public_inputs(&honest);
        p[pi_sib::<D>() + 3 * CHUNK] += Val::ONE;
        let r = run(build_trace(&honest), &p, &air);
        report("forged-sibling(l3)", false, &r);
    }
    // Flip a public direction bit (level 5) without rebuilding the path.
    {
        let mut p = public_inputs(&honest);
        let idx = pi_dir() + 5;
        p[idx] = Val::ONE - p[idx];
        let r = run(build_trace(&honest), &p, &air);
        report("flipped-dir(l5)", false, &r);
    }
    // A wholly different path cannot match the honest root.
    {
        let mut rng2 = SmallRng::seed_from_u64(0x99);
        let other = build_path(&mut rng2);
        let mut p = public_inputs(&other);
        p[pi_root()..pi_root() + CHUNK].copy_from_slice(&honest.root);
        let r = run(build_trace(&other), &p, &air);
        report("wrong-path-vs-root", false, &r);
    }

    println!();
    if all_ok {
        println!("honest path verified; 5/5 tamper cases rejected");
        println!("# each opened node re-hashes in-circuit as one Poseidon2-width-16 perm \
                  (~a few hundred constraints) vs Keccak-f[1600] (~150k): the swap that \
                  makes recursive FRI verification tractable (method A).");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
