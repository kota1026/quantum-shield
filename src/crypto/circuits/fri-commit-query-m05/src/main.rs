//! M0.5-impl method-A binding step — commitment-bound FRI query verification.
//!
//! §17 (`fri-fold-m05`) proves a per-query FRI fold chain, but takes the layer
//! openings as *public assertions*. §16 (`recursion-merkle-m05`) proves a
//! Poseidon2 Merkle opening binds a leaf to a committed root. This crate
//! composes the two by the same public glue M2d/M3/§20 use, so the FRI query's
//! entry opening is no longer free: the fold's round-0 opening pair `(a0, c0)`
//! must equal the leaf committed under the layer-0 root. Forge that opening and
//! either the glue breaks (fold opening != committed leaf) or, if you try to
//! re-commit the forged opening, the Merkle path no longer hashes to the fixed
//! root. Either way it rejects — the opening is bound to the commitment.
//!
//! This anchors the FRI query to the committed codeword (layer 0); each
//! subsequent layer opening binds to its own root the same way (an R-fold
//! repetition). Run: cargo run --release (FRI: log_blowup=3, 100 queries, pow 16).

mod fold_air;
mod merkle_air;
mod poseidon;

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
use p3_matrix::Matrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_poseidon2_air::generate_trace_rows;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::{prove, verify, StarkConfig};
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

use fold_air::{
    num_cols as fold_cols, num_public_values as fold_npub, pi_a, pi_beta, pi_bit, pi_c,
    pi_final, pi_init, pi_x0, FriCols, FriFoldAir,
};
use merkle_air::{
    num_link_cols, num_public_values as merkle_npub, pi_dir, pi_leaf, pi_root, pi_sib,
    LinkCols, MerklePathAir, P2_COLS,
};
use poseidon::{compress, constants, CHUNK, HALF_FULL_ROUNDS, PARTIAL_ROUNDS, WIDTH};

/// FRI fold rounds.
const R: usize = 8;
/// Merkle tree height for the layer-0 commitment.
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

// ---- FRI fold query (§17) ------------------------------------------------

struct FriQuery {
    x0: Val,
    init: Val,
    final_eval: Val,
    beta: [Val; R],
    a: [Val; R],
    c: [Val; R],
    bit: [Val; R],
    e: [Val; R],
    x: [Val; R],
}

fn two_inv() -> Val {
    Val::from_u8(2).inverse()
}

fn build_query() -> FriQuery {
    let ti = two_inv();
    let mut x = Val::from_u32(7);
    let init = Val::from_u32(12345);
    let mut e = init;
    let mut beta = [Val::ZERO; R];
    let mut a = [Val::ZERO; R];
    let mut c = [Val::ZERO; R];
    let mut bit = [Val::ZERO; R];
    let mut es = [Val::ZERO; R];
    let mut xs = [Val::ZERO; R];
    for i in 0..R {
        let b = (i % 2) as u32;
        bit[i] = Val::from_u32(b);
        beta[i] = Val::from_u32(100 + i as u32);
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
        let e_next = (a[i] + c[i]) * ti + beta[i] * (a[i] - c[i]) * ti * x.inverse();
        e = e_next;
        x = x * x;
    }
    FriQuery { x0: xs[0], init, final_eval: e, beta, a, c, bit, e: es, x: xs }
}

fn fold_public_inputs(q: &FriQuery) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; fold_npub::<R>()];
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

fn fold_trace(q: &FriQuery) -> RowMajorMatrix<Val> {
    let nrows = R.next_power_of_two();
    let width = fold_cols::<R>();
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

// ---- Layer-0 Merkle commitment of the entry opening (§16) ----------------

struct Path {
    leaf: [Val; CHUNK],
    root: [Val; CHUNK],
    dirs: [Val; D],
    sibs: [[Val; CHUNK]; D],
    inputs: [[Val; WIDTH]; D],
}

/// A Merkle path whose leaf packs the FRI entry opening `(a0, c0)`.
fn build_committed_path(a0: Val, c0: Val, rng: &mut SmallRng) -> Path {
    let (_c, b, p, e) = constants();
    let mut leaf = [Val::ZERO; CHUNK];
    leaf[0] = a0;
    leaf[1] = c0;
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

fn merkle_public_inputs(path: &Path) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; merkle_npub::<D>()];
    pis[pi_leaf()..pi_leaf() + CHUNK].copy_from_slice(&path.leaf);
    pis[pi_root()..pi_root() + CHUNK].copy_from_slice(&path.root);
    for lvl in 0..D {
        pis[pi_dir() + lvl] = path.dirs[lvl];
        pis[pi_sib::<D>() + lvl * CHUNK..pi_sib::<D>() + lvl * CHUNK + CHUNK]
            .copy_from_slice(&path.sibs[lvl]);
    }
    pis
}

fn merkle_trace(path: &Path) -> RowMajorMatrix<Val> {
    let (c, ..) = constants();
    let nrows = D.next_power_of_two();
    let inputs: Vec<[Val; WIDTH]> =
        (0..nrows).map(|r| if r < D { path.inputs[r] } else { [Val::ZERO; WIDTH] }).collect();
    let p2 = generate_trace_rows::<
        Val, p3_baby_bear::GenericPoseidon2LinearLayersBabyBear, WIDTH,
        { poseidon::SBOX_DEGREE }, { poseidon::SBOX_REGISTERS }, HALF_FULL_ROUNDS, PARTIAL_ROUNDS,
    >(inputs, &c, 0);
    let width = P2_COLS + num_link_cols::<D>();
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

// ---- composition ---------------------------------------------------------

fn prove_verify_fold(trace: RowMajorMatrix<Val>, pis: &[Val]) -> (bool, f64, usize) {
    let config = make_config();
    let air = FriFoldAir::<R>;
    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, &pis.to_vec());
    let ms = t0.elapsed().as_secs_f64() * 1000.0;
    let bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let ok = verify(&config, &air, &proof, &pis.to_vec()).is_ok();
    (ok, ms, bytes)
}

fn prove_verify_merkle(
    trace: RowMajorMatrix<Val>,
    pis: &[Val],
    air: &MerklePathAir<D>,
) -> (bool, f64, usize) {
    let config = make_config();
    let t0 = Instant::now();
    let proof = prove(&config, air, trace, &pis.to_vec());
    let ms = t0.elapsed().as_secs_f64() * 1000.0;
    let bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let ok = verify(&config, air, &proof, &pis.to_vec()).is_ok();
    (ok, ms, bytes)
}

/// glue: the fold entry opening (a0, c0) equals the committed Merkle leaf.
fn glue_ok(fold_pis: &[Val], merkle_pis: &[Val]) -> bool {
    fold_pis[pi_a::<R>()] == merkle_pis[pi_leaf()]
        && fold_pis[pi_c::<R>()] == merkle_pis[pi_leaf() + 1]
}

struct Res {
    accepted: bool,
    ms: f64,
    bytes: usize,
}

/// Run the full composition: both proofs verify AND the glue holds.
fn run(
    fold_pis: &[Val],
    merkle_path: &Path,
    merkle_pis: &[Val],
    q: &FriQuery,
    air: &MerklePathAir<D>,
) -> Res {
    let (f_ok, f_ms, f_by) = prove_verify_fold(fold_trace(q), fold_pis);
    let (m_ok, m_ms, m_by) = prove_verify_merkle(merkle_trace(merkle_path), merkle_pis, air);
    let g = glue_ok(fold_pis, merkle_pis);
    Res { accepted: f_ok && m_ok && g, ms: f_ms + m_ms, bytes: f_by + m_by }
}

fn main() {
    println!("# M0.5 method-A binding: commitment-bound FRI query (BabyBear, R={R}, D={D})");
    let (consts0, ..) = constants();
    let air = MerklePathAir::<D>::new(consts0);
    println!("# fold_cols={} merkle_cols={} (P2={P2_COLS}+link {})",
        fold_cols::<R>(), P2_COLS + num_link_cols::<D>(), num_link_cols::<D>());

    let q = build_query();
    let mut rng = SmallRng::seed_from_u64(0xf1c0);
    // Commit the FRI entry opening (round-0 pair) under the layer-0 root.
    let path = build_committed_path(q.a[0], q.c[0], &mut rng);
    let fold_pis = fold_public_inputs(&q);
    let merkle_pis = merkle_public_inputs(&path);

    println!();
    println!("{:>28} | {:>10} | {:>12} | {:>9} | {:>6}",
        "case", "total_ms", "total_bytes", "expected", "result");
    let mut all_ok = true;
    let mut report = |name: &str, exp: bool, r: &Res| {
        let pass = r.accepted == exp;
        all_ok &= pass;
        println!("{:>28} | {:>10.1} | {:>12} | {:>9} | {:>6}",
            name, r.ms, r.bytes, if exp { "accept" } else { "reject" },
            if pass { "PASS" } else { "FAIL" });
    };

    // Honest: both proofs verify and the entry opening matches the commitment.
    let r = run(&fold_pis, &path, &merkle_pis, &q, &air);
    report("honest", true, &r);

    // Forge the fold entry opening a0 (keep the commitment): glue breaks.
    {
        let mut fp = fold_pis.clone();
        fp[pi_a::<R>()] += Val::ONE;
        let r = run(&fp, &path, &merkle_pis, &q, &air);
        report("forge-fold-a0(glue)", false, &r);
    }
    // Re-commit a forged opening in the Merkle leaf (keep root): path breaks.
    {
        let mut mp = merkle_pis.clone();
        mp[pi_leaf()] += Val::ONE;
        let r = run(&fold_pis, &path, &mp, &q, &air);
        report("recommit-leaf(root)", false, &r);
    }
    // Forge the committed layer-0 root: Merkle opening fails.
    {
        let mut mp = merkle_pis.clone();
        mp[pi_root()] += Val::ONE;
        let r = run(&fold_pis, &path, &mp, &q, &air);
        report("forge-root", false, &r);
    }
    // Forge a mid-round fold opening (round 3): fold chain fails.
    {
        let mut fp = fold_pis.clone();
        fp[pi_a::<R>() + 3] += Val::ONE;
        let r = run(&fp, &path, &merkle_pis, &q, &air);
        report("forge-fold-mid(r3)", false, &r);
    }
    // Forge the final folded value: fold chain fails.
    {
        let mut fp = fold_pis.clone();
        fp[pi_final()] += Val::ONE;
        let r = run(&fp, &path, &merkle_pis, &q, &air);
        report("forge-fold-final", false, &r);
    }

    println!();
    if all_ok {
        println!("honest commitment-bound query verified; 5/5 tamper cases rejected");
        println!("# the FRI entry opening is now bound to the layer-0 Poseidon2 commitment \
                  (§22): forging it breaks the glue or the Merkle path. Remaining M0.5-impl: \
                  bind every layer opening (R-fold) and verify the segment proofs in-circuit \
                  so the roots are the inner proof's real commitments (full recursion, env-gated).");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
