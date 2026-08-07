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
//! Not yet wired (see the crate README): `valid` is a witness column here.
//! Forcing `valid = 1` to mean "this slot's SPHINCS+ signature verified
//! against a Merkle-proven registry member" is the remaining M3 linkage.

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_field::{PrimeCharacteristicRing, PrimeField64};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;

/// Column: the prover slot this row stands for.
pub const COL_SLOT: usize = 0;
/// Column: whether this slot contributed a verified signature.
pub const COL_VALID: usize = 1;
/// Column: inclusive prefix sum of `valid`.
pub const COL_COUNT: usize = 2;

/// Trace width.
pub const WIDTH: usize = 3;

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
            .assert_eq(count.clone(), valid);
        builder
            .when_transition()
            .assert_eq(next_count, count.clone() + next_valid);

        // The attested total is public.
        builder
            .when_last_row()
            .assert_eq(count, pvs[PV_VALID_COUNT].clone());
    }
}

/// Build the trace for a roster of `slots` provers, `valid[i]` telling whether
/// slot `i` contributed a verified signature. Returns the trace and the
/// public values.
pub fn build_trace<F: PrimeField64>(valid: &[bool]) -> (RowMajorMatrix<F>, Vec<F>) {
    let rows = valid.len();
    assert!(rows.is_power_of_two(), "roster size must be a power of two");
    assert!(rows >= 2, "the AIR needs at least one transition");

    let mut values = F::zero_vec(rows * WIDTH);
    let mut count = 0u64;
    for (i, &v) in valid.iter().enumerate() {
        if v {
            count += 1;
        }
        values[i * WIDTH + COL_SLOT] = F::from_u64(i as u64);
        values[i * WIDTH + COL_VALID] = F::from_bool(v);
        values[i * WIDTH + COL_COUNT] = F::from_u64(count);
    }

    (RowMajorMatrix::new(values, WIDTH), vec![F::from_u64(count)])
}

/// The number of valid signatures a trace attests, for callers that want to
/// apply the threshold rule off-circuit (as L1 does).
pub fn valid_count(valid: &[bool]) -> usize {
    valid.iter().filter(|&&v| v).count()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stark::{make_config, FriSettings};
    use p3_goldilocks::Goldilocks;
    use p3_uni_stark::{prove, verify};

    type F = Goldilocks;

    fn roster(indices: &[usize], size: usize) -> Vec<bool> {
        let mut v = vec![false; size];
        for &i in indices {
            v[i] = true;
        }
        v
    }

    fn prove_verify(valid: &[bool], claimed: Option<u64>) -> Result<(), String> {
        let settings = FriSettings::fast();
        let config = make_config(settings);
        let (trace, mut pvs) = build_trace::<F>(valid);
        if let Some(c) = claimed {
            pvs[PV_VALID_COUNT] = F::from_u64(c);
        }
        let proof = prove(&config, &AggregationAir, trace, &pvs);
        verify(&config, &AggregationAir, &proof, &pvs).map_err(|e| format!("{e:?}"))
    }

    /// A 2-of-64 roster proves a count of 2.
    #[test]
    fn counts_a_two_of_n_roster() {
        let valid = roster(&[3, 40], 64);
        assert_eq!(valid_count(&valid), 2);
        prove_verify(&valid, None).expect("honest count must verify");
    }

    /// Boundary cases: nobody signed, everybody signed.
    #[test]
    fn counts_empty_and_full_rosters() {
        prove_verify(&roster(&[], 64), None).expect("zero valid must verify");
        prove_verify(&roster(&(0..64).collect::<Vec<_>>(), 64), None)
            .expect("all valid must verify");
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

    /// Deduplication is structural: one row per slot means the same prover
    /// cannot be counted twice. Naming a signer repeatedly is not even
    /// expressible — it collapses to that slot's single row — so the count
    /// stays 1. The closest a prover can get is marking two *different*
    /// slots, which is exactly two distinct signers.
    #[test]
    fn slots_are_unique_by_construction() {
        let valid = roster(&[7, 7, 7], 64);
        assert_eq!(valid_count(&valid), 1);
        prove_verify(&valid, None).expect("must verify as a count of 1");
    }

    /// A tampered running count must be caught. Constraint violations surface
    /// while proving under debug assertions.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_a_broken_count_chain() {
        let settings = FriSettings::fast();
        let config = make_config(settings);
        let (mut trace, pvs) = build_trace::<F>(&roster(&[3, 40], 64));

        // Inflate an intermediate count without a corresponding `valid`.
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

    /// Slots must be the row index; permuting them would let a prover point a
    /// row at a different registry member than its position implies.
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
