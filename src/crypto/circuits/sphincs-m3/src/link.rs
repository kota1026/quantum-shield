//! The DAG-linking AIRs and their LogUp global lookup.
//!
//! Two tables joined by one global interaction named `HASH_DAG`:
//!
//! ```text
//! producer table  rows: [d0 d1 d2 d3 | mult]   Send    (mult = times consumed)
//! consumer table  rows: [d0 d1 d2 d3 | sel ]   Receive (sel  = 1 on real rows)
//! ```
//!
//! LogUp forces the signed multiset sum to zero, i.e. **every digest consumed
//! as a hash input was produced by some hash** — the property M1's positional
//! constraints gave us for a chain and which no longer works for a DAG.
//!
//! Scope note: in the finished M3 the producer table *is* the Keccak table,
//! so its digests are outputs the Keccak AIR already constrains. Here the
//! producer table stands alone, so this PoC demonstrates and measures the
//! cross-table argument itself; binding it to the Keccak trace is the
//! remaining M3 work.

use p3_air::{
    Air, AirBuilder, AirBuilderWithPublicValues, BaseAir, PairBuilder, PermutationAirBuilder,
};
use p3_field::Field;
use p3_goldilocks::Goldilocks;
use p3_lookup::lookup_traits::{AirLookupHandler, Direction, Kind, Lookup};
use p3_matrix::Matrix;
use p3_uni_stark::{SymbolicAirBuilder, SymbolicExpression};

use p3_field::extension::BinomialExtensionField;

pub type F = Goldilocks;
pub type EF = BinomialExtensionField<Goldilocks, 2>;

/// Digest limbs per lookup tuple (16-byte digest as four 32-bit limbs).
pub const DIGEST_LIMBS: usize = 4;

/// Trace width of both tables: the digest limbs plus a multiplicity column.
pub const WIDTH: usize = DIGEST_LIMBS + 1;

/// Name of the global interaction both tables take part in.
pub const INTERACTION: &str = "HASH_DAG";

/// Which side of the interaction a table is on.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Side {
    /// Digests produced by hash calls.
    Producer,
    /// Digests consumed as hash inputs.
    Consumer,
}

/// One side of the DAG-linking argument.
#[derive(Clone, Debug)]
pub struct LinkAir {
    pub side: Side,
    num_lookups: usize,
}

impl LinkAir {
    pub const fn new(side: Side) -> Self {
        Self { side, num_lookups: 0 }
    }
}

impl<T: Field> BaseAir<T> for LinkAir {
    fn width(&self) -> usize {
        WIDTH
    }
}

impl<AB> Air<AB> for LinkAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn eval(&self, builder: &mut AB) {
        // The consumer's selector is a flag, so padding rows cannot smuggle a
        // fractional multiplicity into the argument. The producer's
        // multiplicity is a genuine count and is left unconstrained here — it
        // is pinned by the interaction summing to zero.
        if self.side == Side::Consumer {
            let main = builder.main();
            let local = main.row_slice(0).expect("empty trace");
            let sel = local[DIGEST_LIMBS].clone();
            builder.assert_bool(sel);
        }
    }
}

impl<AB> AirLookupHandler<AB> for LinkAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn add_lookup_columns(&mut self) -> Vec<usize> {
        // Re-registering must be idempotent: `get_lookups` is called by both
        // the prover and the verifier on the same AIR value.
        let idx = self.num_lookups;
        self.num_lookups += 1;
        vec![idx]
    }

    fn get_lookups(&mut self) -> Vec<Lookup<AB::F>> {
        self.num_lookups = 0;

        let symbolic = SymbolicAirBuilder::<AB::F>::new(0, WIDTH, 0, 0, 0);
        let main = symbolic.main();
        let local = main.row_slice(0).unwrap();

        let elements: Vec<SymbolicExpression<AB::F>> =
            (0..DIGEST_LIMBS).map(|i| local[i].into()).collect();
        let multiplicity: SymbolicExpression<AB::F> = local[DIGEST_LIMBS].into();

        let direction = match self.side {
            Side::Producer => Direction::Send,
            Side::Consumer => Direction::Receive,
        };

        let inputs = vec![(elements, multiplicity, direction)];
        vec![AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(INTERACTION.to_string()),
            &inputs,
        )]
    }
}
