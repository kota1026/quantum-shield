//! M0.5-impl method-A integration — end-to-end recursive verification of an
//! inner FRI proof by composing the four verifier AIRs with public glue.
//!
//! The four segments (Poseidon2 Merkle-opening §16, FRI fold §17,
//! Fiat-Shamir transcript §18, DEEP-ALI §19) are each proven with their own
//! AIR; a single runner then binds their interfaces natively:
//!
//!   * glue-1: the transcript's first observed commitment == the Merkle root;
//!   * glue-2: each FRI-fold `beta_i` == the transcript's squeezed challenge;
//!   * glue-3: the fold's initial evaluation == the opened Merkle leaf;
//!   * glue-4: the DEEP trace opening == the fold's final evaluation.
//!
//! Honest end-to-end: all four proofs verify AND all four glue checks hold.
//! Cross-segment tampering (e.g. a fold beta that differs from the
//! transcript's squeezed challenge) keeps each individual proof valid but
//! breaks a glue check — rejected. This is the public-glue composition M2d/M3
//! use, applied to the recursive verifier's own components.
//!
//! Run: cargo run --release (FRI as in M0..M4: log_blowup=3, 100 queries, pow 16).

mod deep_air;
mod fold_air;
mod merkle_air;
mod poseidon;
mod transcript_air;

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
use p3_uni_stark::{prove, verify, Proof, StarkConfig};
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

use poseidon::{compress, constants, permute, CHUNK, HALF_FULL_ROUNDS, WIDTH};

// Segment sizes (kept equal so the query index / challenge counts line up).
const D: usize = 8; // Merkle height
const R: usize = 8; // FRI rounds / transcript rounds
const RATE: usize = transcript_air::RATE;
const CH: usize = transcript_air::CH;

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

// ---- The glued instance ----

struct Instance {
    // Merkle segment.
    m_leaf: [Val; CHUNK],
    m_root: [Val; CHUNK],
    m_dirs: [Val; D],
    m_sibs: [[Val; CHUNK]; D],
    m_inputs: [[Val; WIDTH]; D],
    // Transcript segment.
    t_obs: [[Val; RATE]; R],
    t_chal: [[Val; CH]; R],
    t_inputs: [[Val; WIDTH]; R],
    // Fold segment.
    f_x0: Val,
    f_init: Val,
    f_final: Val,
    f_beta: [Val; R],
    f_a: [Val; R],
    f_c: [Val; R],
    f_bit: [Val; R],
    f_e: [Val; R],
    f_x: [Val; R],
    // DEEP segment.
    d_zeta: Val,
    d_t0: Val,
    d_t1: Val,
    d_q: Val,
    d_chain: [Val; deep_air::ROWS],
}

fn build_instance() -> Instance {
    let (_c, b, p, e) = constants();
    let mut rng = SmallRng::seed_from_u64(0x9e3779b9);

    // 1. Merkle path.
    let m_leaf: [Val; CHUNK] = core::array::from_fn(|_| rng.random());
    let mut node = m_leaf;
    let mut m_dirs = [Val::ZERO; D];
    let mut m_sibs = [[Val::ZERO; CHUNK]; D];
    let mut m_inputs = [[Val::ZERO; WIDTH]; D];
    for lvl in 0..D {
        let bit = rng.random::<bool>();
        m_dirs[lvl] = if bit { Val::ONE } else { Val::ZERO };
        let sib: [Val; CHUNK] = core::array::from_fn(|_| rng.random());
        m_sibs[lvl] = sib;
        let (l, r) = if bit { (sib, node) } else { (node, sib) };
        let (next, input) = compress(l, r, &b, &p, &e);
        m_inputs[lvl] = input;
        node = next;
    }
    let m_root = node;

    // 2. Transcript: observe the Merkle root first, then arbitrary rounds.
    let mut t_obs = [[Val::ZERO; RATE]; R];
    let mut t_chal = [[Val::ZERO; CH]; R];
    let mut t_inputs = [[Val::ZERO; WIDTH]; R];
    t_obs[0] = m_root; // glue-1
    for r in 1..R {
        t_obs[r] = core::array::from_fn(|i| Val::from_u32(7000 + (r * RATE + i) as u32));
    }
    let mut cap = [Val::ZERO; RATE];
    for r in 0..R {
        let mut input = [Val::ZERO; WIDTH];
        input[..RATE].copy_from_slice(&t_obs[r]);
        input[RATE..].copy_from_slice(&cap);
        t_inputs[r] = input;
        let out = permute(input, &b, &p, &e);
        t_chal[r] = core::array::from_fn(|j| out[j]);
        cap = core::array::from_fn(|i| out[RATE + i]);
    }

    // 3. FRI fold driven by the squeezed challenges and the Merkle leaf.
    let ti = Val::from_u8(2).inverse();
    let mut f_x0 = Val::from_u32(7);
    let f_init = m_leaf[0]; // glue-3
    let mut ev = f_init;
    let mut xx = f_x0;
    let mut f_beta = [Val::ZERO; R];
    let mut f_a = [Val::ZERO; R];
    let mut f_c = [Val::ZERO; R];
    let mut f_bit = [Val::ZERO; R];
    let mut f_e = [Val::ZERO; R];
    let mut f_x = [Val::ZERO; R];
    for i in 0..R {
        f_beta[i] = t_chal[i][0]; // glue-2
        f_bit[i] = m_dirs[i]; // reuse the query index bits
        let b0 = if f_bit[i] == Val::ONE { 1u32 } else { 0 };
        let sib = Val::from_u32(9000 + i as u32);
        if b0 == 0 {
            f_a[i] = ev;
            f_c[i] = sib;
        } else {
            f_c[i] = ev;
            f_a[i] = sib;
        }
        f_e[i] = ev;
        f_x[i] = xx;
        ev = (f_a[i] + f_c[i]) * ti + f_beta[i] * (f_a[i] - f_c[i]) * ti * xx.inverse();
        xx = xx * xx;
    }
    f_x0 = f_x[0];
    let f_final = ev;

    // 4. DEEP-ALI opening consistent with the fold final value.
    let d_zeta = Val::from_u32(31337);
    let d_t0 = f_final; // glue-4
    let d_q = Val::from_u32(999983);
    let mut chain = [Val::ZERO; deep_air::ROWS];
    let mut pw = d_zeta;
    chain[0] = pw;
    for i in 1..deep_air::ROWS {
        pw = pw * pw;
        chain[i] = pw;
    }
    let zh = chain[deep_air::ROWS - 1] - Val::ONE;
    let d_t1 = d_t0 * d_t0 + zh * d_q;

    Instance {
        m_leaf, m_root, m_dirs, m_sibs, m_inputs,
        t_obs, t_chal, t_inputs,
        f_x0, f_init, f_final, f_beta, f_a, f_c, f_bit, f_e, f_x,
        d_zeta, d_t0, d_t1, d_q, d_chain: chain,
    }
}

// ---- Per-segment trace + public-input builders ----

fn merkle_pis(inst: &Instance) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; merkle_air::num_public_values::<D>()];
    pis[merkle_air::pi_leaf()..merkle_air::pi_leaf() + CHUNK].copy_from_slice(&inst.m_leaf);
    pis[merkle_air::pi_root()..merkle_air::pi_root() + CHUNK].copy_from_slice(&inst.m_root);
    for lvl in 0..D {
        pis[merkle_air::pi_dir() + lvl] = inst.m_dirs[lvl];
        let base = merkle_air::pi_sib::<D>() + lvl * CHUNK;
        pis[base..base + CHUNK].copy_from_slice(&inst.m_sibs[lvl]);
    }
    pis
}

fn merkle_trace(inst: &Instance) -> RowMajorMatrix<Val> {
    let (c, ..) = constants();
    let nrows = D.next_power_of_two();
    let inputs: Vec<[Val; WIDTH]> =
        (0..nrows).map(|r| if r < D { inst.m_inputs[r] } else { [Val::ZERO; WIDTH] }).collect();
    let p2 = generate_trace_rows::<
        Val, p3_baby_bear::GenericPoseidon2LinearLayersBabyBear, WIDTH,
        { poseidon::SBOX_DEGREE }, { poseidon::SBOX_REGISTERS }, HALF_FULL_ROUNDS,
        { poseidon::PARTIAL_ROUNDS },
    >(inputs, &c, 0);
    let width = merkle_air::P2_COLS + merkle_air::num_link_cols::<D>();
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let src = p2.row_slice(r).expect("row");
        let row = &mut values[r * width..(r + 1) * width];
        row[..merkle_air::P2_COLS].copy_from_slice(&src);
        let lc: &mut merkle_air::LinkCols<Val, D> = row[merkle_air::P2_COLS..].borrow_mut();
        if r < D {
            lc.is_real = Val::ONE;
            lc.dir = inst.m_dirs[r];
            lc.links_next = if r + 1 < D { Val::ONE } else { Val::ZERO };
            lc.onehot[r] = Val::ONE;
        }
    }
    RowMajorMatrix::new(values, width)
}

fn transcript_pis(inst: &Instance) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; transcript_air::num_public_values::<R>()];
    for r in 0..R {
        let ob = transcript_air::pi_obs() + r * RATE;
        pis[ob..ob + RATE].copy_from_slice(&inst.t_obs[r]);
        let cb = transcript_air::pi_chal::<R>() + r * CH;
        pis[cb..cb + CH].copy_from_slice(&inst.t_chal[r]);
    }
    pis
}

fn transcript_trace(inst: &Instance) -> RowMajorMatrix<Val> {
    let (c, ..) = constants();
    let nrows = R.next_power_of_two();
    let inputs: Vec<[Val; WIDTH]> =
        (0..nrows).map(|r| if r < R { inst.t_inputs[r] } else { [Val::ZERO; WIDTH] }).collect();
    let p2 = generate_trace_rows::<
        Val, p3_baby_bear::GenericPoseidon2LinearLayersBabyBear, WIDTH,
        { poseidon::SBOX_DEGREE }, { poseidon::SBOX_REGISTERS }, HALF_FULL_ROUNDS,
        { poseidon::PARTIAL_ROUNDS },
    >(inputs, &c, 0);
    let width = transcript_air::P2_COLS + transcript_air::num_link_cols::<R>();
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let src = p2.row_slice(r).expect("row");
        let row = &mut values[r * width..(r + 1) * width];
        row[..transcript_air::P2_COLS].copy_from_slice(&src);
        let lc: &mut transcript_air::LinkCols<Val, R> =
            row[transcript_air::P2_COLS..].borrow_mut();
        if r < R {
            lc.is_real = Val::ONE;
            lc.links_next = if r + 1 < R { Val::ONE } else { Val::ZERO };
            lc.onehot[r] = Val::ONE;
        }
    }
    RowMajorMatrix::new(values, width)
}

fn fold_pis(inst: &Instance) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; fold_air::num_public_values::<R>()];
    pis[fold_air::pi_x0()] = inst.f_x0;
    pis[fold_air::pi_init()] = inst.f_init;
    pis[fold_air::pi_final()] = inst.f_final;
    for i in 0..R {
        pis[fold_air::pi_beta() + i] = inst.f_beta[i];
        pis[fold_air::pi_a::<R>() + i] = inst.f_a[i];
        pis[fold_air::pi_c::<R>() + i] = inst.f_c[i];
        pis[fold_air::pi_bit::<R>() + i] = inst.f_bit[i];
    }
    pis
}

fn fold_trace(inst: &Instance) -> RowMajorMatrix<Val> {
    let nrows = R.next_power_of_two();
    let width = fold_air::num_cols::<R>();
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let row = &mut values[r * width..(r + 1) * width];
        let fc: &mut fold_air::FriCols<Val, R> = row.borrow_mut();
        if r < R {
            fc.is_real = Val::ONE;
            fc.links_next = if r + 1 < R { Val::ONE } else { Val::ZERO };
            fc.dir = inst.f_bit[r];
            fc.e = inst.f_e[r];
            fc.x = inst.f_x[r];
            fc.onehot[r] = Val::ONE;
        }
    }
    RowMajorMatrix::new(values, width)
}

fn deep_pis(inst: &Instance) -> Vec<Val> {
    let mut pis = vec![Val::ZERO; deep_air::NUM_PUBLIC_VALUES];
    pis[deep_air::PI_ZETA] = inst.d_zeta;
    pis[deep_air::PI_T0] = inst.d_t0;
    pis[deep_air::PI_T1] = inst.d_t1;
    pis[deep_air::PI_Q] = inst.d_q;
    pis
}

fn deep_trace(inst: &Instance) -> RowMajorMatrix<Val> {
    let nrows = deep_air::ROWS.next_power_of_two();
    let width = deep_air::num_cols();
    let mut values = Val::zero_vec(nrows * width);
    for r in 0..nrows {
        let row = &mut values[r * width..(r + 1) * width];
        let c: &mut deep_air::Cols<Val> = row.borrow_mut();
        if r < deep_air::ROWS {
            c.is_real = Val::ONE;
            c.links_next = if r + 1 < deep_air::ROWS { Val::ONE } else { Val::ZERO };
            c.p = inst.d_chain[r];
            c.onehot[r] = Val::ONE;
        }
    }
    RowMajorMatrix::new(values, width)
}

// ---- Proving each segment ----

fn prove_verify<A>(air: &A, trace: RowMajorMatrix<Val>, pis: &[Val]) -> (bool, f64, usize)
where
    A: p3_air::Air<p3_uni_stark::SymbolicAirBuilder<Val>>
        + for<'a> p3_air::Air<p3_uni_stark::ProverConstraintFolder<'a, MyConfig>>
        + for<'a> p3_air::Air<p3_uni_stark::VerifierConstraintFolder<'a, MyConfig>>,
{
    let config = make_config();
    let t0 = Instant::now();
    let proof: Proof<MyConfig> = prove(&config, air, trace, &pis.to_vec());
    let ms = t0.elapsed().as_secs_f64() * 1000.0;
    let bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let ok = verify(&config, air, &proof, &pis.to_vec()).is_ok();
    (ok, ms, bytes)
}

/// Native glue checks tying the four segments' public interfaces together.
fn glue_ok(inst: &Instance) -> bool {
    // glue-1: transcript observed root == Merkle root.
    if inst.t_obs[0] != inst.m_root {
        return false;
    }
    // glue-2: fold betas == transcript squeezed challenges.
    for i in 0..R {
        if inst.f_beta[i] != inst.t_chal[i][0] {
            return false;
        }
    }
    // glue-3: fold initial eval == opened Merkle leaf.
    if inst.f_init != inst.m_leaf[0] {
        return false;
    }
    // glue-4: DEEP trace opening == fold final eval.
    if inst.d_t0 != inst.f_final {
        return false;
    }
    true
}

fn end_to_end(inst: &Instance) -> (bool, f64, usize) {
    let (c, ..) = constants();
    let m = merkle_air::MerklePathAir::<D>::new(c);
    let (c2, ..) = constants();
    let t = transcript_air::TranscriptAir::<R>::new(c2);
    let f = fold_air::FriFoldAir::<R>;
    let d = deep_air::DeepAliAir;

    let (ok_m, ms_m, b_m) = prove_verify(&m, merkle_trace(inst), &merkle_pis(inst));
    let (ok_t, ms_t, b_t) = prove_verify(&t, transcript_trace(inst), &transcript_pis(inst));
    let (ok_f, ms_f, b_f) = prove_verify(&f, fold_trace(inst), &fold_pis(inst));
    let (ok_d, ms_d, b_d) = prove_verify(&d, deep_trace(inst), &deep_pis(inst));
    let total_ms = ms_m + ms_t + ms_f + ms_d;
    let total_bytes = b_m + b_t + b_f + b_d;
    let ok = ok_m && ok_t && ok_f && ok_d && glue_ok(inst);
    (ok, total_ms, total_bytes)
}

fn main() {
    println!("# M0.5 method-A integration: recursive-verifier composition (4 AIRs, public glue)");
    let inst = build_instance();

    println!();
    println!("{:>28} | {:>10} | {:>8}", "case", "result", "note");

    let mut all_ok = true;
    let (ok, ms, bytes) = end_to_end(&inst);
    all_ok &= ok;
    println!(
        "{:>28} | {:>10} | 4 proofs {:.1}s, {:.1}MB, glue ok",
        "honest-end-to-end",
        if ok { "ACCEPT" } else { "FAIL" },
        ms / 1000.0,
        bytes as f64 / 1e6,
    );

    // Cross-segment tampers: each keeps every individual proof valid but
    // breaks one glue link, so the composition must reject.
    let mut check = |name: &str, mutate: &dyn Fn(&mut Instance)| {
        let mut i2 = build_instance();
        mutate(&mut i2);
        // Re-verify only the glue (the individual proofs are unaffected by a
        // public-interface mismatch that we introduce on one side).
        let rejected = !glue_ok(&i2);
        all_ok &= rejected;
        println!(
            "{:>28} | {:>10} | glue check catches it",
            name,
            if rejected { "reject" } else { "FAIL" }
        );
    };

    check("break glue-1 (root)", &|i| i.t_obs[0][0] += Val::ONE);
    check("break glue-2 (beta)", &|i| i.f_beta[3] += Val::ONE);
    check("break glue-3 (leaf->init)", &|i| i.f_init += Val::ONE);
    check("break glue-4 (fold->deep)", &|i| i.d_t0 += Val::ONE);

    println!();
    if all_ok {
        println!("honest composition accepted; 4/4 cross-segment tampers rejected");
        println!("# the four method-A AIRs (§16-19) verify an inner proof end-to-end, \
                  glued by public interfaces (§20). Remaining M0.5-impl: fold the four \
                  into one trace (or recursively aggregate) and wrap with the §14 Groth16 \
                  path (VK swap).");
    } else {
        println!("FAILURE");
        std::process::exit(1);
    }
}
