//! Binding the producer side of the DAG argument to the Keccak table
//! (gap analysis §10.4-1).
//!
//! In the earlier PoC the producer table was standalone, so a prover could
//! invent a digest and declare it "produced". Here the producer **is** the
//! Keccak table: the tuple sent into the `HASH_DAG` interaction is read
//! directly out of `p3-keccak-air`'s output columns, so every digest offered
//! to a consumer is the output of a permutation the Keccak AIR has proven.
//!
//! ```text
//! [ KeccakCols (NUM_KECCAK_COLS) | is_digest | mult ]
//!                                     │         └─ times this digest is consumed
//!                                     └─ 1 on the final round row of a
//!                                        permutation that completes a hash call
//! ```
//!
//! The squeezed 16-byte digest is state words 0 and 1, which keccak-air
//! exposes as `output_limb(0..8)` (16-bit limbs). Two limbs recombine into
//! each 32-bit tuple element with a degree-1 expression, so the tuple matches
//! the consumer side's `digest_limbs` encoding exactly.

use core::borrow::Borrow;

use p3_air::{
    Air, AirBuilder, AirBuilderWithPublicValues, BaseAir, PairBuilder, PermutationAirBuilder,
};
use p3_field::{Field, PrimeCharacteristicRing};
use p3_keccak_air::{output_limb, KeccakAir, KeccakCols, NUM_KECCAK_COLS, NUM_ROUNDS};
use p3_lookup::lookup_traits::{AirLookupHandler, Direction, Kind, Lookup};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use p3_uni_stark::{SubAirBuilder, SymbolicAirBuilder, SymbolicExpression};

use crate::link::{DIGEST_LIMBS, F, INTERACTION};

/// Column holding the "this row publishes a digest" flag.
pub const COL_IS_DIGEST: usize = NUM_KECCAK_COLS;

/// Column holding how many times the published digest is consumed.
pub const COL_MULT: usize = NUM_KECCAK_COLS + 1;

/// Total width of the bound producer table.
pub const WIDTH: usize = NUM_KECCAK_COLS + 2;

/// The Keccak table, extended to publish hash-call digests into `HASH_DAG`.
#[derive(Clone, Debug, Default)]
pub struct KeccakDigestAir {
    num_lookups: usize,
}

impl KeccakDigestAir {
    pub const fn new() -> Self {
        Self { num_lookups: 0 }
    }
}

impl<T: Field> BaseAir<T> for KeccakDigestAir {
    fn width(&self) -> usize {
        WIDTH
    }
}

impl<AB> Air<AB> for KeccakDigestAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn eval(&self, builder: &mut AB) {
        // Every permutation in the table is a correct Keccak-f[1600].
        {
            let mut sub = SubAirBuilder::<AB, KeccakAir, AB::F>::new(builder, 0..NUM_KECCAK_COLS);
            KeccakAir {}.eval(&mut sub);
        }

        let main = builder.main();
        let local = main.row_slice(0).expect("empty trace");
        let kc: &KeccakCols<AB::Var> = (&(*local)[..NUM_KECCAK_COLS]).borrow();

        let is_digest: AB::Expr = (*local)[COL_IS_DIGEST].clone().into();
        let mult: AB::Expr = (*local)[COL_MULT].clone().into();
        let step_final: AB::Expr = kc.step_flags[NUM_ROUNDS - 1].clone().into();

        // The flag is a flag.
        builder.assert_bool(is_digest.clone());

        // A digest may only be published on a permutation's final round row —
        // that is where the output state (and hence the squeezed bytes) is
        // valid. Mid-permutation rows hold no digest.
        builder.assert_zero(is_digest.clone() * (AB::Expr::ONE - step_final));

        // A multiplicity may only be declared where a digest is published, so
        // padding and mid-permutation rows cannot contribute to the argument.
        builder.assert_zero(mult * (AB::Expr::ONE - is_digest));
    }
}

impl<AB> AirLookupHandler<AB> for KeccakDigestAir
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

        let symbolic = SymbolicAirBuilder::<AB::F>::new(0, WIDTH, 0, 0, 0);
        let main = symbolic.main();
        let local = main.row_slice(0).unwrap();

        let shift = SymbolicExpression::Constant(AB::F::from_u32(1 << 16));

        // element_j = low_limb + 2^16 * high_limb, i.e. bytes 4j..4j+4 of the
        // squeezed output — the same encoding as `digest_limbs`.
        let elements: Vec<SymbolicExpression<AB::F>> = (0..DIGEST_LIMBS)
            .map(|j| {
                let lo: SymbolicExpression<AB::F> = local[output_limb(2 * j)].into();
                let hi: SymbolicExpression<AB::F> = local[output_limb(2 * j + 1)].into();
                lo + shift.clone() * hi
            })
            .collect();

        let multiplicity: SymbolicExpression<AB::F> = local[COL_MULT].into();

        let inputs = vec![(elements, multiplicity, Direction::Send)];
        vec![AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(INTERACTION.to_string()),
            &inputs,
        )]
    }
}

/// Widen a `p3-keccak-air` trace with the two linking columns.
///
/// `digest_of[p]` is `Some(mult)` when permutation `p` completes a hash call
/// whose digest is consumed `mult` times, and `None` otherwise (a
/// mid-hash block, or padding).
pub fn widen_keccak_trace(
    keccak: &RowMajorMatrix<F>,
    digest_of: &[Option<u32>],
) -> RowMajorMatrix<F> {
    // `generate_trace_rows` pads to a power-of-two row count, which is not a
    // multiple of NUM_ROUNDS in general — the trailing chunk is a partial
    // padding permutation. Real permutations always come first, so indexing
    // final-round rows by `r % NUM_ROUNDS == NUM_ROUNDS - 1` stays correct.
    let height = keccak.height();

    let mut values = F::zero_vec(height * WIDTH);
    for r in 0..height {
        values[r * WIDTH..r * WIDTH + NUM_KECCAK_COLS]
            .copy_from_slice(&keccak.values[r * NUM_KECCAK_COLS..(r + 1) * NUM_KECCAK_COLS]);

        // Digests live on each permutation's final round row.
        if r % NUM_ROUNDS == NUM_ROUNDS - 1 {
            let perm = r / NUM_ROUNDS;
            if let Some(Some(mult)) = digest_of.get(perm) {
                values[r * WIDTH + COL_IS_DIGEST] = F::ONE;
                values[r * WIDTH + COL_MULT] = F::from_u32(*mult);
            }
        }
    }

    RowMajorMatrix::new(values, WIDTH)
}
