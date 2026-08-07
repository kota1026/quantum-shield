//! Threshold counting and signer deduplication (FR-THRESH-1(c)).
//!
//! One row per **active prover slot**, not per submitted signature:
//!
//! ```text
//! row i:  [ slot | valid | count ]
//!            │      │       └─ running prefix sum of `valid`
//!            │      └─ prover i contributed a signature that verified
//!            └─ constrained to be exactly i
//! ```
//!
//! Indexing by slot rather than by signature is what makes **deduplication
//! structural**: a prover has exactly one row, so it cannot be counted twice,
//! and no sorting argument or range check is needed. `slot` is pinned to the
//! row index, so the rows are in registry order and line up with the active
//! set the FR-THRESH-5 commitment covers ([`crate::registry`]).
//!
//! The final `count` is bound to the public input `valid_count`. The
//! `valid_count >= threshold` comparison is deliberately **left to L1**: the
//! count is a public input, so `L1Vault` can check it with one comparison,
//! which is far cheaper than a range check in-circuit and equally binding.
//!
//! `valid` is not a free witness: a slot may only claim `valid = 1` if it
//! exhibits a hypertree root that (a) equals the `pk_root` it declares and
//! (b) is a digest the Keccak table actually produced — the latter enforced
//! by receiving it from the `HASH_DAG` interaction with multiplicity `valid`.
//! Since a SPHINCS+ verification succeeds exactly when its recomputed
//! hypertree root equals `PK.root`, that is the verification verdict.
//!
//! Still open (see the crate README): binding `pk_root` to the registry leaf
//! requires linking hash *inputs*, not just outputs — `HASH_DAG` matches on
//! produced digests today.

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir, PairBuilder, PermutationAirBuilder};
use p3_field::{PrimeCharacteristicRing, PrimeField64};
use p3_lookup::lookup_traits::{AirLookupHandler, Direction, Kind, Lookup};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use p3_uni_stark::{SymbolicAirBuilder, SymbolicExpression};

use crate::link::{DIGEST_LIMBS, INTERACTION};
use sphincs_m2::dag::digest_limbs;

/// Column: the prover slot this row stands for.
pub const COL_SLOT: usize = 0;
/// Column: whether this slot contributed a verified signature.
pub const COL_VALID: usize = 1;
/// Column: inclusive prefix sum of `valid`.
pub const COL_COUNT: usize = 2;
/// First column of the hypertree root recomputed for this slot's signature.
pub const COL_ROOT: usize = 3;
/// First column of the `PK.root` this slot declares.
pub const COL_PK_ROOT: usize = COL_ROOT + DIGEST_LIMBS;

/// Trace width.
pub const WIDTH: usize = COL_PK_ROOT + DIGEST_LIMBS;

/// Public value: the number of valid signatures the proof attests.
pub const PV_VALID_COUNT: usize = 0;
/// Number of public values.
pub const NUM_PUBLIC_VALUES: usize = 1;

/// Threshold-counting AIR over a fixed roster of prover slots.
#[derive(Clone, Copy, Debug)]
pub struct AggregationAir;

impl<F> BaseAir<F> for AggregationAir {
    fn width(&self) -> usize {
        WIDTH
    }
}

impl<AB: AirBuilderWithPublicValues> Air<AB> for AggregationAir {
    fn eval(&self, builder: &mut AB) {
        let pvs: Vec<AB::Expr> = builder.public_values().iter().map(|&pv| pv.into()).collect();
        assert_eq!(pvs.len(), NUM_PUBLIC_VALUES);

        let main = builder.main();
        let local = main.row_slice(0).expect("empty trace");
        let next = main.row_slice(1).expect("single-row trace");

        let slot: AB::Expr = local[COL_SLOT].clone().into();
        let valid: AB::Expr = local[COL_VALID].clone().into();
        let count: AB::Expr = local[COL_COUNT].clone().into();
        let next_slot: AB::Expr = next[COL_SLOT].clone().into();
        let next_valid: AB::Expr = next[COL_VALID].clone().into();
        let next_count: AB::Expr = next[COL_COUNT].clone().into();

        // A slot either contributed or it did not.
        builder.assert_bool(valid.clone());

        // Slots are the row index: 0, 1, 2, ... — this is what makes each
        // prover appear exactly once, so double-counting is impossible.
        builder.when_first_row().assert_zero(slot);
        builder
            .when_transition()
            .assert_eq(next_slot, local[COL_SLOT].clone().into() + AB::Expr::ONE);

        // Running count of valid slots.
        builder
            .when_first_row()
            .assert_eq(count.clone(), valid.clone());
        builder
            .when_transition()
            .assert_eq(next_count, count.clone() + next_valid);

        // The attested total is public.
        builder
            .when_last_row()
            .assert_eq(count, pvs[PV_VALID_COUNT].clone());

        // A slot may only claim `valid` if the hypertree root it recomputed
        // equals the `PK.root` it declares — which is exactly the SPHINCS+
        // verification verdict. Paired with the HASH_DAG receive below (which
        // forces that root to be a digest the Keccak table produced), this is
        // what stops `valid` from being a free witness.
        for j in 0..DIGEST_LIMBS {
            let root: AB::Expr = local[COL_ROOT + j].clone().into();
            let pk_root: AB::Expr = local[COL_PK_ROOT + j].clone().into();
            builder.assert_zero(valid.clone() * (root - pk_root));
        }
    }
}

impl<AB> AirLookupHandler<AB> for AggregationAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn add_lookup_columns(&mut self) -> Vec<usize> {
        vec![0]
    }

    fn get_lookups(&mut self) -> Vec<Lookup<AB::F>> {
        let symbolic = SymbolicAirBuilder::<AB::F>::new(0, WIDTH, 0, 0, 0);
        let main = symbolic.main();
        let local = main.row_slice(0).unwrap();

        // Consume this slot's hypertree root from the hash DAG, but only on
        // rows that claim to be valid.
        let elements: Vec<SymbolicExpression<AB::F>> =
            (0..DIGEST_LIMBS).map(|j| local[COL_ROOT + j].into()).collect();
        let multiplicity: SymbolicExpression<AB::F> = local[COL_VALID].into();

        let inputs = vec![(elements, multiplicity, Direction::Receive)];
        vec![AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(INTERACTION.to_string()),
            &inputs,
        )]
    }
}

/// What one prover slot contributes to the aggregate.
#[derive(Clone, Copy, Debug, Default)]
pub struct Slot {
    /// The slot's signature verified.
    pub valid: bool,
    /// Hypertree root recomputed from the signature (`[0; 16]` when absent).
    pub computed_root: [u8; 16],
    /// `PK.root` from the registered public key.
    pub pk_root: [u8; 16],
}

impl Slot {
    /// A slot whose signature verified: both roots are the same value.
    pub fn verified(root: [u8; 16]) -> Self {
        Self { valid: true, computed_root: root, pk_root: root }
    }

    /// A slot that did not contribute.
    pub fn absent() -> Self {
        Self::default()
    }
}

/// Build the trace for a roster of prover slots. Returns the trace and the
/// public values.
pub fn build_trace<F: PrimeField64>(slots: &[Slot]) -> (RowMajorMatrix<F>, Vec<F>) {
    let rows = slots.len();
    assert!(rows.is_power_of_two(), "roster size must be a power of two");
    assert!(rows >= 2, "the AIR needs at least one transition");

    let mut values = F::zero_vec(rows * WIDTH);
    let mut count = 0u64;
    for (i, slot) in slots.iter().enumerate() {
        if slot.valid {
            count += 1;
        }
        values[i * WIDTH + COL_SLOT] = F::from_u64(i as u64);
        values[i * WIDTH + COL_VALID] = F::from_bool(slot.valid);
        values[i * WIDTH + COL_COUNT] = F::from_u64(count);

        for (j, limb) in digest_limbs(&slot.computed_root).iter().enumerate() {
            values[i * WIDTH + COL_ROOT + j] = F::from_u32(*limb);
        }
        for (j, limb) in digest_limbs(&slot.pk_root).iter().enumerate() {
            values[i * WIDTH + COL_PK_ROOT + j] = F::from_u32(*limb);
        }
    }

    (RowMajorMatrix::new(values, WIDTH), vec![F::from_u64(count)])
}

/// The number of valid signatures a roster attests, for callers that want to
/// apply the threshold rule off-circuit (as L1 does).
pub fn valid_count(slots: &[Slot]) -> usize {
    slots.iter().filter(|s| s.valid).count()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stark::{make_config, FriSettings};
    use p3_goldilocks::Goldilocks;
    use p3_uni_stark::{prove, verify};

    type F = Goldilocks;

    /// A distinct, deterministic root per slot.
    fn root_for(i: usize) -> [u8; 16] {
        let mut r = [0u8; 16];
        for (j, b) in r.iter_mut().enumerate() {
            *b = (i as u8).wrapping_mul(37).wrapping_add(j as u8);
        }
        r
    }

    fn roster(indices: &[usize], size: usize) -> Vec<Slot> {
        let mut slots = vec![Slot::absent(); size];
        for &i in indices {
            slots[i] = Slot::verified(root_for(i));
        }
        slots
    }

    fn prove_verify(slots: &[Slot], claimed: Option<u64>) -> Result<(), String> {
        let settings = FriSettings::fast();
        let config = make_config(settings);
        let (trace, mut pvs) = build_trace::<F>(slots);
        if let Some(c) = claimed {
            pvs[PV_VALID_COUNT] = F::from_u64(c);
        }
        let proof = prove(&config, &AggregationAir, trace, &pvs);
        verify(&config, &AggregationAir, &proof, &pvs).map_err(|e| format!("{e:?}"))
    }

    /// A 2-of-64 roster proves a count of 2.
    #[test]
    fn counts_a_two_of_n_roster() {
        let slots = roster(&[3, 40], 64);
        assert_eq!(valid_count(&slots), 2);
        prove_verify(&slots, None).expect("honest count must verify");
    }

    /// Boundary cases: nobody signed, everybody signed.
    #[test]
    fn counts_empty_and_full_rosters() {
        prove_verify(&roster(&[], 64), None).expect("zero valid must verify");
        prove_verify(&roster(&(0..64).collect::<Vec<_>>(), 64), None)
            .expect("all valid must verify");
    }

    /// Deduplication is structural: one row per slot means the same prover
    /// cannot be counted twice. Naming a signer repeatedly is not even
    /// expressible — it collapses to that slot's single row — so the count
    /// stays 1.
    #[test]
    fn slots_are_unique_by_construction() {
        let slots = roster(&[7, 7, 7], 64);
        assert_eq!(valid_count(&slots), 1);
        prove_verify(&slots, None).expect("must verify as a count of 1");
    }

    /// Over-claiming the number of valid signatures — the attack the
    /// threshold rule exists to stop — must fail. Under debug assertions the
    /// constraint check aborts proving; in release the same violation is
    /// caught at verification.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_an_inflated_valid_count() {
        prove_verify(&roster(&[3, 40], 64), Some(3)).ok();
    }

    /// Under-claiming must fail too: the count is exact, not a lower bound.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_a_deflated_valid_count() {
        prove_verify(&roster(&[3, 40], 64), Some(1)).ok();
    }

    /// The verification verdict: a slot cannot claim `valid` while its
    /// recomputed hypertree root differs from the `PK.root` it declares.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_valid_with_a_mismatched_root() {
        let mut slots = roster(&[3, 40], 64);
        slots[3].computed_root[0] ^= 1;
        prove_verify(&slots, None).ok();
    }

    /// An absent slot is free to carry any roots, since it claims nothing.
    #[test]
    fn absent_slots_may_carry_arbitrary_roots() {
        let mut slots = roster(&[3], 64);
        slots[10].computed_root = root_for(99);
        slots[10].pk_root = root_for(123);
        prove_verify(&slots, None).expect("an absent slot constrains nothing");
    }

    /// A tampered running count must be caught.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_a_broken_count_chain() {
        let settings = FriSettings::fast();
        let config = make_config(settings);
        let (mut trace, pvs) = build_trace::<F>(&roster(&[3, 40], 64));
        trace.values[10 * WIDTH + COL_COUNT] += F::ONE;
        prove(&config, &AggregationAir, trace, &pvs);
    }

    /// A non-boolean `valid` (the other way to fake a count) must be caught.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_a_non_boolean_valid() {
        let settings = FriSettings::fast();
        let config = make_config(settings);
        let (mut trace, pvs) = build_trace::<F>(&roster(&[3, 40], 64));
        trace.values[5 * WIDTH + COL_VALID] = F::from_u64(2);
        prove(&config, &AggregationAir, trace, &pvs);
    }

    /// Slots must be the row index; permuting them would let a row point at a
    /// different registry member than its position implies.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_permuted_slots() {
        let settings = FriSettings::fast();
        let config = make_config(settings);
        let (mut trace, pvs) = build_trace::<F>(&roster(&[3, 40], 64));
        trace.values[9 * WIDTH + COL_SLOT] = F::from_u64(42);
        prove(&config, &AggregationAir, trace, &pvs);
    }
}
