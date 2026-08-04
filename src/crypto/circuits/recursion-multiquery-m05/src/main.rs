//! M0.5-impl method-A recursion step (§24) — multi-query openings against a
//! single committed codeword root.
//!
//! §22/§23 bound FRI openings to commitments, but each opening had its own
//! *fabricated* root (a Merkle path built from random siblings). A real FRI
//! layer is the opposite shape: it commits **one** codeword root and opens
//! ~100 **distinct** query indices into that same root — the recursive
//! verifier re-hashes each query's authentication path back to the one
//! commitment.
//!
//! This crate builds that shape. It commits a real codeword — a vector of
//! `2^D` leaf digests — into one Poseidon2 Merkle tree, built bottom-up with
//! the **same** truncated-permutation compression the §16 AIR re-hashes, and
//! opens `K` distinct query indices. Each opening's real leaf + real sibling
//! path is fed to the §16 recursion Merkle-opening AIR, and every one is
//! proven to hash back to the **single** committed root. Tampering any one
//! query's sibling, direction bit, or leaf breaks only that query; forging the
//! shared root breaks all of them; verifying a query against another
//! codeword's root fails — the openings are bound to *this* commitment.
//!
//! This is a step past §23's per-opening fabricated roots toward full
//! recursion: the verifier now consumes a real multi-query opening set of one
//! real commitment, the structure a real inner proof's per-layer openings have.
//! Binding that root to an actual inner proof's transcript/FRI/DEEP relations
//! and regenerating the aggregated Groth16 VK remain env-gated (proving CI).
//!
//! Run: cargo run --release (FRI as in M0..M4: log_blowup=3, 100 queries).

mod merkle_air;
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
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

use merkle_air::{
    num_link_cols, num_public_values as merkle_npub, pi_dir, pi_leaf, pi_root, pi_sib,
    LinkCols, MerklePathAir, P2_COLS,
};
use poseidon::{compress, constants, CHUNK, HALF_FULL_ROUNDS, PARTIAL_ROUNDS, WIDTH};

/// Merkle tree height: the committed codeword has 2^D = 256 leaf digests.
const D: usize = 8;
/// Number of distinct query indices opened against the single committed root.
const K: usize = 8;

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

// ---- Real committed codeword: one Poseidon2 Merkle tree ------------------

/// A committed codeword: layer `l` holds the `2^(D-l)` node digests, so
/// `layers[0]` is the leaf vector and `layers[D][0]` is the committed root.
struct Codeword {
    layers: Vec<Vec<[Val; CHUNK]>>,
}

impl Codeword {
    fn root(&self) -> [Val; CHUNK] {
        self.layers[D][0]
    }
}

/// Build a real Poseidon2 Merkle tree over `2^D` leaf digests, bottom-up, with
/// the same 2-to-1 truncated permutation the §16 AIR re-hashes.
fn commit_codeword(rng: &mut SmallRng) -> Codeword {
    let (_c, b, p, e) = constants();
    let n = 1usize << D;
    let leaves: Vec<[Val; CHUNK]> = (0..n)
        .map(|_| core::array::from_fn(|_| rng.random()))
        .collect();
    let mut layers = vec![leaves];
    for l in 0..D {
        let prev = &layers[l];
        let next: Vec<[Val; CHUNK]> = (0..prev.len() / 2)
            .map(|k| compress(prev[2 * k], prev[2 * k + 1], &b, &p, &e).0)
            .collect();
        layers.push(next);
    }
    Codeword { layers }
}

struct Path {
    leaf: [Val; CHUNK],
    root: [Val; CHUNK],
    dirs: [Val; D],
    sibs: [[Val; CHUNK]; D],
    inputs: [[Val; WIDTH]; D],
}

/// Open one real query index: extract its leaf, its real sibling digests along
/// the path, and the per-level direction bits from the index. Reconstructs the
/// same node chain the tree built, so the path hashes back to the real root.
fn open_query(cw: &Codeword, index: usize) -> Path {
    let (_c, b, p, e) = constants();
    let mut node = cw.layers[0][index];
    let leaf = node;
    let mut dirs = [Val::ZERO; D];
    let mut sibs = [[Val::ZERO; CHUNK]; D];
    let mut inputs = [[Val::ZERO; WIDTH]; D];
    let mut m = index;
    for lvl in 0..D {
        let sib = cw.layers[lvl][m ^ 1];
        let dir = m & 1; // 0 => running node is the left child.
        dirs[lvl] = Val::from_u32(dir as u32);
        sibs[lvl] = sib;
        let (left, right) = if dir == 0 { (node, sib) } else { (sib, node) };
        let (next, input) = compress(left, right, &b, &p, &e);
        inputs[lvl] = input;
        node = next;
        m >>= 1;
    }
    Path { leaf, root: cw.root(), dirs, sibs, inputs }
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

struct Res {
    accepted: bool,
    ms: f64,
    bytes: usize,
}

/// Prove/verify every query's opening, and require all to carry the same root.
/// accepted iff every Merkle proof verifies AND all queries share one root.
fn run(paths: &[Path], pis: &[Vec<Val>], air: &MerklePathAir<D>) -> Res {
    let mut ms = 0.0;
    let mut bytes = 0;
    let mut all_ok = true;
    let root0 = &pis[0][pi_root()..pi_root() + CHUNK];
    for (path, p) in paths.iter().zip(pis) {
        let (ok, m, by) = prove_verify_merkle(merkle_trace(path), p, air);
        ms += m;
        bytes += by;
        let same_root = &p[pi_root()..pi_root() + CHUNK] == root0;
        all_ok &= ok && same_root;
    }
    Res { accepted: all_ok, ms, bytes }
}

fn main() {
    println!("# M0.5 method-A recursion (§24): multi-query openings vs one committed root (BabyBear, D={D}, K={K})");
    let (consts0, ..) = constants();
    let air = MerklePathAir::<D>::new(consts0);

    let mut rng = SmallRng::seed_from_u64(0xc0de);
    let cw = commit_codeword(&mut rng);
    // K distinct query indices spread across the 2^D-leaf codeword.
    let indices: [usize; K] = core::array::from_fn(|i| (i * 37 + 5) & ((1 << D) - 1));
    let paths: Vec<Path> = indices.iter().map(|&i| open_query(&cw, i)).collect();
    let pis: Vec<Vec<Val>> = paths.iter().map(merkle_public_inputs).collect();

    // A second, independent codeword — its root is a foreign commitment.
    let mut rng2 = SmallRng::seed_from_u64(0xbeef);
    let cw_other = commit_codeword(&mut rng2);

    println!("# one committed root over 2^{D}=256 leaves; {K} distinct query indices: {indices:?}");
    println!("# merkle_cols={} (P2={P2_COLS}+link {})", P2_COLS + num_link_cols::<D>(), num_link_cols::<D>());
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

    const Q: usize = 3; // a representative query to tamper.

    // Honest: all K query openings hash back to the single committed root.
    let r = run(&paths, &pis, &air);
    report("honest(K queries,1 root)", true, &r);

    // Forge one query's sibling (keep the root): only that path breaks.
    {
        let mut tp = pis.clone();
        tp[Q][pi_sib::<D>() + 2 * CHUNK] += Val::ONE; // sibling at level 2.
        let r = run(&paths, &tp, &air);
        report("forge-sibling[q]", false, &r);
    }
    // Flip one query's direction bit at a level: index binding breaks.
    {
        let mut tp = pis.clone();
        let lvl = 3;
        tp[Q][pi_dir() + lvl] = Val::ONE - tp[Q][pi_dir() + lvl];
        let r = run(&paths, &tp, &air);
        report("flip-dir-bit[q]", false, &r);
    }
    // Forge one query's leaf (keep path+root): opening no longer hashes to root.
    {
        let mut tp = pis.clone();
        tp[Q][pi_leaf()] += Val::ONE;
        let r = run(&paths, &tp, &air);
        report("forge-leaf[q]", false, &r);
    }
    // Forge the shared committed root: every query rejects (single-root binding).
    {
        let mut tp = pis.clone();
        for p in tp.iter_mut() {
            p[pi_root()] += Val::ONE;
        }
        let r = run(&paths, &tp, &air);
        report("forge-shared-root(all)", false, &r);
    }
    // Verify one query against a foreign codeword's root: not this commitment.
    {
        let mut tp = pis.clone();
        let other_root = cw_other.root();
        tp[Q][pi_root()..pi_root() + CHUNK].copy_from_slice(&other_root);
        let r = run(&paths, &tp, &air);
        report("foreign-root[q]", false, &r);
    }

    println!();
    if all_ok {
        println!("honest {K}/{K} queries verified against one committed root; 5/5 tamper cases rejected");
        println!("# the recursion Merkle-opening verifier now consumes a real multi-query opening \
                  set of a SINGLE committed codeword (§24): every query's authentication path \
                  re-hashes to the one root, tampering any query breaks only it, forging the root \
                  breaks all. Remaining M0.5-impl (env-gated): bind this root to an actual inner \
                  proof's transcript/FRI/DEEP relations and regenerate the aggregated Groth16 VK \
                  (proving CI).");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
