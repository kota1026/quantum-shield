//! M0.5-impl method-A binding step (§23) — all-layer commitment-bound FRI query.
//!
//! §22 (`fri-commit-query-m05`) bound only the FRI *entry* opening `(a0, c0)`
//! to the layer-0 Poseidon2 commitment: the fold's round-0 pair had to equal
//! a leaf committed under a fixed layer-0 root. Every *inner* layer opening
//! `(a_i, c_i)` for `i > 0` was still a free public input — self-consistent
//! within the fold chain, but not tied to that layer's real commitment.
//!
//! This crate closes that residual gap by the R-fold repetition §22.5 named:
//! each round `i` gets its own committed Merkle path whose leaf packs that
//! round's opening pair `(a_i, c_i)` under an independent layer root `root_i`,
//! and the same §20-style public glue ties the fold's round-`i` pair to that
//! layer's committed leaf. The fold chain proves the openings fold correctly;
//! the R Merkle proofs prove each opening is a committed value; the R glue
//! checks tie the two together. Forge any layer's opening and either its glue
//! breaks (opening != committed leaf) or, if you re-commit the forgery, that
//! layer's Poseidon2 path no longer hashes to the fixed root. Swap one layer's
//! root for another's and the path hashes to the wrong committed value.
//!
//! The FRI query is now anchored to a committed codeword at *every* layer, not
//! just the entry. Run: cargo run --release (FRI: log_blowup=3, 100 queries).

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

/// FRI fold rounds == number of FRI layers whose opening is commitment-bound.
const R: usize = 8;
/// Merkle tree height for each per-layer commitment.
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

// ---- Per-layer Merkle commitment of each round's opening (§16) ------------

struct Path {
    leaf: [Val; CHUNK],
    root: [Val; CHUNK],
    dirs: [Val; D],
    sibs: [[Val; CHUNK]; D],
    inputs: [[Val; WIDTH]; D],
}

/// A Merkle path whose leaf packs one FRI layer's opening pair `(a_i, c_i)`.
fn build_committed_path(a_i: Val, c_i: Val, rng: &mut SmallRng) -> Path {
    let (_c, b, p, e) = constants();
    let mut leaf = [Val::ZERO; CHUNK];
    leaf[0] = a_i;
    leaf[1] = c_i;
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

/// glue for layer i: the fold's round-i opening pair (a_i, c_i) equals the
/// leaf committed under that layer's root.
fn glue_layer_ok(fold_pis: &[Val], merkle_pis: &[Val], i: usize) -> bool {
    fold_pis[pi_a::<R>() + i] == merkle_pis[pi_leaf()]
        && fold_pis[pi_c::<R>() + i] == merkle_pis[pi_leaf() + 1]
}

struct Res {
    accepted: bool,
    ms: f64,
    bytes: usize,
}

/// Run the full composition: the fold proof verifies, and for every layer the
/// Merkle proof verifies AND the glue ties that layer's opening to its commit.
fn run(
    fold_pis: &[Val],
    layer_paths: &[Path],
    layer_pis: &[Vec<Val>],
    q: &FriQuery,
    air: &MerklePathAir<D>,
) -> Res {
    let (f_ok, mut ms, mut bytes) = prove_verify_fold(fold_trace(q), fold_pis);
    let mut all_layers_ok = true;
    for i in 0..R {
        let (m_ok, m_ms, m_by) = prove_verify_merkle(merkle_trace(&layer_paths[i]), &layer_pis[i], air);
        ms += m_ms;
        bytes += m_by;
        let g = glue_layer_ok(fold_pis, &layer_pis[i], i);
        all_layers_ok &= m_ok && g;
    }
    Res { accepted: f_ok && all_layers_ok, ms, bytes }
}

fn main() {
    println!("# M0.5 method-A binding (§23): all-layer commitment-bound FRI query (BabyBear, R={R}, D={D})");
    let (consts0, ..) = constants();
    let air = MerklePathAir::<D>::new(consts0);
    println!("# fold_cols={} merkle_cols={} (P2={P2_COLS}+link {}); {R} layer commitments",
        fold_cols::<R>(), P2_COLS + num_link_cols::<D>(), num_link_cols::<D>());

    let q = build_query();
    let mut rng = SmallRng::seed_from_u64(0xa11a);
    // Commit each FRI layer's opening pair (a_i, c_i) under its own root_i.
    let layer_paths: Vec<Path> = (0..R).map(|i| build_committed_path(q.a[i], q.c[i], &mut rng)).collect();
    let fold_pis = fold_public_inputs(&q);
    let layer_pis: Vec<Vec<Val>> = layer_paths.iter().map(merkle_public_inputs).collect();

    // Two representative inner layers to tamper: a mid round and the last round
    // (the last-layer binding is precisely what §22's entry-only anchor lacked).
    const MID: usize = 4;
    const LAST: usize = R - 1;

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

    // Honest: fold verifies and every layer opening matches its commitment.
    let r = run(&fold_pis, &layer_paths, &layer_pis, &q, &air);
    report("honest", true, &r);

    // Forge a mid-layer fold opening a[MID] (keep commitments): glue at MID breaks.
    {
        let mut fp = fold_pis.clone();
        fp[pi_a::<R>() + MID] += Val::ONE;
        let r = run(&fp, &layer_paths, &layer_pis, &q, &air);
        report("forge-fold-a[mid](glue)", false, &r);
    }
    // Re-commit a forged opening in the MID layer leaf (keep root): path breaks.
    {
        let mut lp = layer_pis.clone();
        lp[MID][pi_leaf()] += Val::ONE;
        let r = run(&fold_pis, &layer_paths, &lp, &q, &air);
        report("recommit-leaf[mid](root)", false, &r);
    }
    // Forge the MID layer's committed root: that layer's Merkle opening fails.
    {
        let mut lp = layer_pis.clone();
        lp[MID][pi_root()] += Val::ONE;
        let r = run(&fold_pis, &layer_paths, &lp, &q, &air);
        report("forge-root[mid]", false, &r);
    }
    // Re-commit a forged opening in the LAST layer leaf: the property §22 lacked.
    {
        let mut lp = layer_pis.clone();
        lp[LAST][pi_leaf() + 1] += Val::ONE;
        let r = run(&fold_pis, &layer_paths, &lp, &q, &air);
        report("recommit-leaf[last]", false, &r);
    }
    // Forge the LAST layer's committed root: last-layer opening fails.
    {
        let mut lp = layer_pis.clone();
        lp[LAST][pi_root()] += Val::ONE;
        let r = run(&fold_pis, &layer_paths, &lp, &q, &air);
        report("forge-root[last]", false, &r);
    }
    // Cross-layer root swap: give layer MID the root committed for layer LAST
    // (and vice-versa). Each honest path hashes to its own root, so both fail.
    {
        let mut lp = layer_pis.clone();
        for i in 0..CHUNK {
            lp[MID][pi_root() + i] = layer_pis[LAST][pi_root() + i];
            lp[LAST][pi_root() + i] = layer_pis[MID][pi_root() + i];
        }
        let r = run(&fold_pis, &layer_paths, &lp, &q, &air);
        report("cross-layer-root-swap", false, &r);
    }
    // Forge the final folded value: the fold chain fails.
    {
        let mut fp = fold_pis.clone();
        fp[pi_final()] += Val::ONE;
        let r = run(&fp, &layer_paths, &layer_pis, &q, &air);
        report("forge-fold-final", false, &r);
    }

    println!();
    if all_ok {
        println!("honest all-layer commitment-bound query verified; 7/7 tamper cases rejected");
        println!("# every FRI layer opening (a_i, c_i), not just the entry, is now bound to that \
                  layer's Poseidon2 commitment (§23, R-fold of §22): forging any layer's opening \
                  breaks its glue or its Merkle path, and swapping one layer's root for another's \
                  breaks the path. Remaining M0.5-impl: verify the segment proofs in-circuit so \
                  each layer root is the inner proof's real commitment (full recursion, env-gated).");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
