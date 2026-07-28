//! M2a PoC — the chaining constraint.
//!
//! M1 proved, via p3-keccak-air, that each Keccak-f permutation in a WOTS+
//! chain is a correct Keccak-f. What it did NOT constrain is that the chain is
//! actually *chained*: that step i's output is step i+1's input. Without that,
//! a prover could supply 15 unrelated valid permutations. Closing this gap is
//! the core of M2, and the open question was whether a Plonky3 uni-stark AIR
//! can express "next row = round(this row)" with public start/end binding.
//!
//! This binary answers YES with a custom `ChainAir`:
//!   - column `state` holds the chained value at each step,
//!   - a TRANSITION constraint enforces `next.state == round(local.state)`,
//!   - BOUNDARY constraints bind row 0 to the public `start` and the last row
//!     to the public `end`.
//! It proves a valid chain (verify = ok) AND shows a TAMPERED chain (one step
//! altered) FAILS verification — evidence the constraint actually binds.
//!
//! `round(x) = x^5 + RC` is a low-degree algebraic stand-in for the SPHINCS+
//! tweakable hash F. In production F is SHAKE256 (a Keccak-f permutation), and
//! this chaining constraint composes with M1's keccak-air via a lookup argument:
//! the `state` column here is looked up against the keccak-air input/output
//! table, so "round" is replaced by "the Keccak-f keccak-air already proved".
//! M2a de-risks the chaining mechanism independently of that integration.
//!
//! Feeds `docs/core/STARK_AIR_GAP_ANALYSIS.md` M2.

use core::borrow::Borrow;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_baby_bear::{BabyBear, Poseidon2BabyBear};
use p3_challenger::DuplexChallenger;
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_field::{Field, PrimeCharacteristicRing};
use p3_fri::{create_test_fri_params, TwoAdicFriPcs};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{PaddingFreeSponge, TruncatedPermutation};
use p3_uni_stark::{prove, verify, StarkConfig};
use rand::rngs::SmallRng;
use rand::SeedableRng;

// round constant for round(x) = x^5 + RC
const RC: u64 = 0x9e3779b1;
const NUM_COLS: usize = 1;

/// AIR: state' = state^5 + RC, with public [start, end] bound to first/last row.
struct ChainAir;

impl<F> BaseAir<F> for ChainAir {
    fn width(&self) -> usize {
        NUM_COLS
    }
}

impl<AB: AirBuilderWithPublicValues> Air<AB> for ChainAir {
    fn eval(&self, builder: &mut AB) {
        let main = builder.main();
        let pis = builder.public_values();
        let start = pis[0];
        let end = pis[1];

        let local = main.row_slice(0).expect("empty matrix");
        let next = main.row_slice(1).expect("only one row");
        let local: &ChainRow<AB::Var> = (*local).borrow();
        let next: &ChainRow<AB::Var> = (*next).borrow();

        // boundary: first row == public start
        builder.when_first_row().assert_eq(local.state.clone(), start);

        // transition: next == local^5 + RC
        let s = local.state.clone().into();
        let round = pow5::<AB>(s) + AB::Expr::from(AB::F::from_u64(RC));
        builder.when_transition().assert_eq(next.state.clone(), round);

        // boundary: last row == public end
        builder.when_last_row().assert_eq(local.state.clone(), end);
    }
}

fn pow5<AB: AirBuilder>(x: AB::Expr) -> AB::Expr {
    let x2 = x.clone() * x.clone();
    let x4 = x2.clone() * x2;
    x4 * x
}

fn round_native(x: BabyBear) -> BabyBear {
    x.exp_u64(5) + BabyBear::from_u64(RC)
}

#[repr(C)]
struct ChainRow<F> {
    state: F,
}

impl<F> Borrow<ChainRow<F>> for [F] {
    fn borrow(&self) -> &ChainRow<F> {
        debug_assert_eq!(self.len(), NUM_COLS);
        let (prefix, shorts, suffix) = unsafe { self.align_to::<ChainRow<F>>() };
        debug_assert!(prefix.is_empty());
        debug_assert!(suffix.is_empty());
        &shorts[0]
    }
}

/// Build a valid chain trace of `n` rows (n-1 steps) starting from `start`.
/// Returns (trace, end).
fn gen_trace(start: BabyBear, n: usize) -> (RowMajorMatrix<BabyBear>, BabyBear) {
    assert!(n.is_power_of_two());
    let mut vals = BabyBear::zero_vec(n);
    vals[0] = start;
    for i in 1..n {
        vals[i] = round_native(vals[i - 1]);
    }
    let end = vals[n - 1];
    (RowMajorMatrix::new(vals, NUM_COLS), end)
}

// ---- Plonky3 config (BabyBear + Poseidon2, mirrors the uni-stark fib test) ----
type Val = BabyBear;
type Perm = Poseidon2BabyBear<16>;
type MyHash = PaddingFreeSponge<Perm, 16, 8, 8>;
type MyCompress = TruncatedPermutation<Perm, 2, 8, 16>;
type ValMmcs = MerkleTreeMmcs<<Val as Field>::Packing, <Val as Field>::Packing, MyHash, MyCompress, 8>;
type Challenge = BinomialExtensionField<Val, 4>;
type ChallengeMmcs = ExtensionMmcs<Val, Challenge, ValMmcs>;
type Challenger = DuplexChallenger<Val, Perm, 16, 8>;
type Dft = Radix2DitParallel<Val>;
type Pcs = TwoAdicFriPcs<Val, Dft, ValMmcs, ChallengeMmcs>;
type MyConfig = StarkConfig<Pcs, Challenge, Challenger>;

fn make_config() -> (MyConfig, Perm) {
    // Deterministic Poseidon2: seed the RNG identically each call so prove and
    // verify share the same permutation constants.
    let mut rng = SmallRng::seed_from_u64(1);
    let perm = Perm::new_from_rng_128(&mut rng);
    let hash = MyHash::new(perm.clone());
    let compress = MyCompress::new(perm.clone());
    let val_mmcs = ValMmcs::new(hash, compress);
    let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
    let dft = Dft::default();
    let fri_params = create_test_fri_params(challenge_mmcs, 0);
    let pcs = Pcs::new(dft, val_mmcs, fri_params);
    (MyConfig::new(pcs, Challenger::new(perm.clone())), perm)
}

fn main() {
    const N: usize = 16; // 15 chain steps (WOTS+ w-1 for w=16)
    let start = BabyBear::from_u64(0x1234_5678);

    println!("# M2a: hash-chain linking AIR (BabyBear, round(x)=x^5+RC)");
    println!("# chain rows = {N} ({} steps), public inputs = [start, end]", N - 1);

    // ---- valid chain: must verify ----
    let (trace, end) = gen_trace(start, N);
    let pis = vec![start, end];
    let (config, _perm) = make_config();
    let proof = prove(&config, &ChainAir, trace, &pis);
    let (config_v, _) = make_config();
    let ok = verify(&config_v, &ChainAir, &proof, &pis).is_ok();
    println!("valid chain:    prove ok, verify = {ok}");
    assert!(ok, "valid chain must verify");

    // ---- negative test 1: tampered end (public) must fail ----
    let wrong_end = end + BabyBear::ONE;
    let (config_n, _) = make_config();
    let bad_pis = vec![start, wrong_end];
    let neg1 = verify(&config_n, &ChainAir, &proof, &bad_pis).is_err();
    println!("tampered end:   verify rejected = {neg1}");
    assert!(neg1, "tampered public end must be rejected");

    // ---- negative test 2: tampered trace (break one chain step) must fail ----
    let (mut bad_trace, end2) = gen_trace(start, N);
    // corrupt the middle row so row[8] != round(row[7])
    bad_trace.values[N / 2] += BabyBear::ONE;
    let (config_p, _) = make_config();
    let pis2 = vec![start, end2];
    // prover over an invalid trace: prove may succeed but verify MUST fail
    let neg2 = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let bad_proof = prove(&config_p, &ChainAir, bad_trace, &pis2);
        let (config_pv, _) = make_config();
        verify(&config_pv, &ChainAir, &bad_proof, &pis2).is_err()
    }))
    .unwrap_or(true); // a prover-side constraint panic also counts as rejection
    println!("tampered step:  rejected = {neg2}");
    assert!(neg2, "a broken chain step must not yield a verifying proof");

    println!();
    println!("# RESULT: the chaining constraint binds — valid chains verify, tampered");
    println!("# chains (bad public end OR broken intermediate step) are rejected.");
    println!("# M2 chaining mechanism DE-RISKED. Production replaces round(x) with the");
    println!("# Keccak-f permutation (M1) via a lookup between this state column and the");
    println!("# keccak-air I/O table.");
}
