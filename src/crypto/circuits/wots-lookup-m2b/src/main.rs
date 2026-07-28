//! M2b-2 PoC — cross-table lookup wiring (the composition step).
//!
//! M2a proved chaining inside one AIR; M1 proved Keccak-f permutations in
//! keccak-air. M2b-2 is the piece that JOINS them: a "chain" table whose
//! transitions are bound, via a global logup lookup, to a separate "producer"
//! table that independently attests each (input, output) pair. In production
//! the producer is keccak-air (its `export`/`preimage`/output columns Send the
//! proven Keccak-f I/O); here the producer is an algebraic stand-in so the
//! lookup WIRING itself is demonstrated end-to-end in one batch STARK.
//!
//! Chain table (2 cols: state, next_state):
//!   - transition constraint next_state(row i) == state(row i+1) ties the
//!     redundant `next_state` column to the actual next row,
//!   - RECEIVES (state, next_state) on every row (global "step").
//! Producer table (2 cols: in, out):
//!   - SENDS (in, out) on every row (global "step").
//! If the two multisets of (in,out) pairs are equal the logup balances and the
//! batch verifies. A tampered producer row (so a chain-required pair is not
//! produced) breaks the balance and MUST fail — proving the lookup binds the
//! chain's transitions to the producer's attested pairs.
//!
//! Uses p3-batch-stark + p3-lookup (LogUpGadget), confirmed present in the
//! pinned Plonky3 rev. Feeds STARK_AIR_GAP_ANALYSIS.md §11 (M2b-2).

use core::borrow::Borrow;
use core::fmt::Debug;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir, PairBuilder, PermutationAirBuilder};
use p3_baby_bear::{BabyBear, Poseidon2BabyBear};
use p3_batch_stark::prover::prove_batch;
use p3_batch_stark::verifier::verify_batch;
use p3_batch_stark::{CommonData, StarkInstance};
use p3_challenger::DuplexChallenger;
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_field::{Field, PrimeCharacteristicRing};
use p3_fri::{create_test_fri_params, TwoAdicFriPcs};
use p3_lookup::logup::LogUpGadget;
use p3_lookup::lookup_traits::{AirLookupHandler, Direction, Kind, Lookup};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{PaddingFreeSponge, TruncatedPermutation};
use p3_uni_stark::{StarkConfig, SymbolicAirBuilder, SymbolicExpression};
use rand::rngs::SmallRng;
use rand::SeedableRng;

const STEP: &str = "step";

// ---------------- Producer AIR: SENDS (in, out) ----------------
#[derive(Clone, Copy)]
struct ProducerAir {
    num_lookups: usize,
}
impl<F> BaseAir<F> for ProducerAir {
    fn width(&self) -> usize {
        2
    }
}
impl<AB: AirBuilderWithPublicValues> Air<AB> for ProducerAir {
    fn eval(&self, _builder: &mut AB) {
        // No main constraint: the producer only attests membership via the
        // lookup. In production this is keccak-air constraining out = keccak(in).
    }
}
impl<AB> AirLookupHandler<AB> for ProducerAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn add_lookup_columns(&mut self) -> Vec<usize> {
        let idx = self.num_lookups;
        self.num_lookups += 1;
        vec![idx]
    }
    fn get_lookups(&mut self) -> Vec<Lookup<AB::F>> {
        self.num_lookups = 0;
        let sab = SymbolicAirBuilder::<AB::F>::new(0, 2, 0, 0, 0);
        let main = sab.main();
        let row = main.row_slice(0).unwrap();
        let inp = row[0];
        let out = row[1];
        let inputs = vec![(
            vec![inp.into(), out.into()],
            SymbolicExpression::Constant(AB::F::ONE),
            Direction::Send,
        )];
        vec![AirLookupHandler::<AB>::register_lookup(self, Kind::Global(STEP.to_string()), &inputs)]
    }
}

// ---------------- Chain AIR: RECEIVES (state, next_state) ----------------
#[derive(Clone, Copy)]
struct ChainAir {
    num_lookups: usize,
}
impl<F> BaseAir<F> for ChainAir {
    fn width(&self) -> usize {
        2
    }
}
impl<AB: AirBuilderWithPublicValues> Air<AB> for ChainAir {
    fn eval(&self, builder: &mut AB) {
        let main = builder.main();
        let local = main.row_slice(0).expect("empty");
        let next = main.row_slice(1).expect("one row");
        let local: &ChainRow<AB::Var> = (*local).borrow();
        let next: &ChainRow<AB::Var> = (*next).borrow();
        // tie the redundant next_state column to the actual next row's state
        builder
            .when_transition()
            .assert_eq(local.next_state.clone(), next.state.clone());
    }
}
impl<AB> AirLookupHandler<AB> for ChainAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn add_lookup_columns(&mut self) -> Vec<usize> {
        let idx = self.num_lookups;
        self.num_lookups += 1;
        vec![idx]
    }
    fn get_lookups(&mut self) -> Vec<Lookup<AB::F>> {
        self.num_lookups = 0;
        let sab = SymbolicAirBuilder::<AB::F>::new(0, 2, 0, 0, 0);
        let main = sab.main();
        let row = main.row_slice(0).unwrap();
        let state = row[0];
        let next_state = row[1];
        let inputs = vec![(
            vec![state.into(), next_state.into()],
            SymbolicExpression::Constant(AB::F::ONE),
            Direction::Receive,
        )];
        vec![AirLookupHandler::<AB>::register_lookup(self, Kind::Global(STEP.to_string()), &inputs)]
    }
}

#[repr(C)]
struct ChainRow<F> {
    state: F,
    next_state: F,
}
impl<F> Borrow<ChainRow<F>> for [F] {
    fn borrow(&self) -> &ChainRow<F> {
        debug_assert_eq!(self.len(), 2);
        let (p, s, suf) = unsafe { self.align_to::<ChainRow<F>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &s[0]
    }
}

// ---------------- enum wrapper for batching ----------------
#[derive(Clone, Copy)]
enum M2bAir {
    Producer(ProducerAir),
    Chain(ChainAir),
}
impl<F: Field> BaseAir<F> for M2bAir {
    fn width(&self) -> usize {
        match self {
            Self::Producer(a) => <ProducerAir as BaseAir<F>>::width(a),
            Self::Chain(a) => <ChainAir as BaseAir<F>>::width(a),
        }
    }
}
impl<AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues> Air<AB> for M2bAir {
    fn eval(&self, builder: &mut AB) {
        match self {
            Self::Producer(a) => <ProducerAir as Air<AB>>::eval(a, builder),
            Self::Chain(a) => <ChainAir as Air<AB>>::eval(a, builder),
        }
    }
}
impl<AB> AirLookupHandler<AB> for M2bAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn add_lookup_columns(&mut self) -> Vec<usize> {
        match self {
            Self::Producer(a) => <ProducerAir as AirLookupHandler<AB>>::add_lookup_columns(a),
            Self::Chain(a) => <ChainAir as AirLookupHandler<AB>>::add_lookup_columns(a),
        }
    }
    fn get_lookups(&mut self) -> Vec<Lookup<AB::F>> {
        match self {
            Self::Producer(a) => <ProducerAir as AirLookupHandler<AB>>::get_lookups(a),
            Self::Chain(a) => <ChainAir as AirLookupHandler<AB>>::get_lookups(a),
        }
    }
}

// ---------------- config (mirrors batch-stark simple test) ----------------
type Val = BabyBear;
type Challenge = BinomialExtensionField<Val, 4>;
type Perm = Poseidon2BabyBear<16>;
type MyHash = PaddingFreeSponge<Perm, 16, 8, 8>;
type MyCompress = TruncatedPermutation<Perm, 2, 8, 16>;
type ValMmcs = MerkleTreeMmcs<<Val as Field>::Packing, <Val as Field>::Packing, MyHash, MyCompress, 8>;
type ChallengeMmcs = ExtensionMmcs<Val, Challenge, ValMmcs>;
type Challenger = DuplexChallenger<Val, Perm, 16, 8>;
type Dft = Radix2DitParallel<Val>;
type MyPcs = TwoAdicFriPcs<Val, Dft, ValMmcs, ChallengeMmcs>;
type MyConfig = StarkConfig<MyPcs, Challenge, Challenger>;

fn make_config(seed: u64) -> MyConfig {
    let mut rng = SmallRng::seed_from_u64(seed);
    let perm = Perm::new_from_rng_128(&mut rng);
    let hash = MyHash::new(perm.clone());
    let compress = MyCompress::new(perm.clone());
    let val_mmcs = ValMmcs::new(hash, compress);
    let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
    let dft = Dft::default();
    let fri_params = create_test_fri_params(challenge_mmcs, 2);
    let pcs = MyPcs::new(dft, val_mmcs, fri_params);
    StarkConfig::new(pcs, Challenger::new(perm))
}

/// A cyclic sequence s of length H (H power of two, distinct values).
fn sequence(h: usize) -> Vec<Val> {
    (0..h).map(|i| Val::from_u64(0x1000 + i as u64 * 7 + 3)).collect()
}

/// Chain trace: row i = (s[i], s[(i+1) % H]).
fn chain_trace(s: &[Val]) -> RowMajorMatrix<Val> {
    let h = s.len();
    let mut v = Val::zero_vec(h * 2);
    for i in 0..h {
        v[2 * i] = s[i];
        v[2 * i + 1] = s[(i + 1) % h];
    }
    RowMajorMatrix::new(v, 2)
}

/// Producer trace: row j = (s[j], s[(j+1) % H]); optionally tamper one out cell.
fn producer_trace(s: &[Val], tamper: Option<usize>) -> RowMajorMatrix<Val> {
    let h = s.len();
    let mut v = Val::zero_vec(h * 2);
    for j in 0..h {
        v[2 * j] = s[j];
        v[2 * j + 1] = s[(j + 1) % h];
    }
    if let Some(k) = tamper {
        v[2 * k + 1] += Val::ONE; // produce a wrong (in,out) pair
    }
    RowMajorMatrix::new(v, 2)
}

fn run(tamper_producer: Option<usize>) -> Result<(), impl Debug> {
    let config = make_config(1337);
    let h = 8usize;
    let s = sequence(h);

    let mut airs = [
        M2bAir::Chain(ChainAir { num_lookups: 0 }),
        M2bAir::Producer(ProducerAir { num_lookups: 0 }),
    ];
    let log_h = h.trailing_zeros() as usize;
    let common = CommonData::<MyConfig>::from_airs_and_degrees(&config, &mut airs, &[log_h, log_h]);

    let traces = vec![chain_trace(&s), producer_trace(&s, tamper_producer)];
    let pvs = vec![vec![], vec![]];
    let instances = StarkInstance::new_multiple(&airs, &traces, &pvs, &common);

    let gadget = LogUpGadget::new();
    let proof = prove_batch(&config, &instances, &common, &gadget);
    verify_batch(&config, &airs, &proof, &pvs, &common, &gadget)
}

fn main() {
    println!("# M2b-2: cross-table lookup — chain transitions bound to a producer table");
    println!("# tables: Chain(receives (state,next)) <-logup-> Producer(sends (in,out))");

    // valid: producer contains exactly the chain's transition pairs -> verifies
    let ok = run(None);
    println!("valid composition:     verify = {}", ok.is_ok());
    assert!(ok.is_ok(), "matching multisets must verify");

    // tampered: one producer pair altered -> a chain-required pair is unbacked
    let bad = std::panic::catch_unwind(|| run(Some(3)).is_err()).unwrap_or(true);
    println!("tampered producer:     rejected = {bad}");
    assert!(bad, "an unbacked chain transition must be rejected by the lookup");

    println!();
    println!("# RESULT: the cross-table lookup binds each chain transition to a");
    println!("# producer-attested (in,out) pair in ONE batch STARK. Swap the algebraic");
    println!("# producer for keccak-air (export/preimage/output columns) and this is the");
    println!("# full M2 composition: chaining (M2a) + Keccak-f correctness (M1) in one proof.");
}
