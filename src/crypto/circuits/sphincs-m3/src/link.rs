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

// =============================================================================
// 32-byte registry Merkle chain
// =============================================================================

/// Digest limbs for a 32-byte value (registry leaves and Merkle nodes).
pub const NODE_LIMBS: usize = 8;

/// Trace width of the 32-byte consumer table.
pub const NODE_WIDTH: usize = NODE_LIMBS + 1;

/// Interaction carrying 32-byte registry digests.
///
/// Kept separate from [`INTERACTION`] rather than widening it: SPHINCS+
/// digests are 16 bytes and registry nodes are 32, so one interaction would
/// need either zero-padding plus a kind tag (and a degree-2 masking
/// expression on the producer side) or a lossy encoding. Two narrow
/// interactions are cheaper and cannot confuse the two value spaces.
pub const MERKLE_INTERACTION: &str = "MERKLE_DAG";

/// Consumer side of the registry Merkle chain: every 32-byte value fed into
/// a node hash must be one the Keccak table produced.
#[derive(Clone, Debug, Default)]
pub struct NodeLinkAir {
    num_lookups: usize,
}

impl NodeLinkAir {
    pub const fn new() -> Self {
        Self { num_lookups: 0 }
    }
}

impl<T: Field> BaseAir<T> for NodeLinkAir {
    fn width(&self) -> usize {
        NODE_WIDTH
    }
}

impl<AB> Air<AB> for NodeLinkAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn eval(&self, builder: &mut AB) {
        // The selector is a flag, so padding rows cannot smuggle a fractional
        // multiplicity into the argument.
        let main = builder.main();
        let local = main.row_slice(0).expect("empty trace");
        let sel = local[NODE_LIMBS].clone();
        builder.assert_bool(sel);
    }
}

impl<AB> AirLookupHandler<AB> for NodeLinkAir
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

        let symbolic = SymbolicAirBuilder::<AB::F>::new(0, NODE_WIDTH, 0, 0, 0);
        let main = symbolic.main();
        let local = main.row_slice(0).unwrap();

        let elements: Vec<SymbolicExpression<AB::F>> =
            (0..NODE_LIMBS).map(|i| local[i].into()).collect();
        let multiplicity: SymbolicExpression<AB::F> = local[NODE_LIMBS].into();

        let inputs = vec![(elements, multiplicity, Direction::Receive)];
        vec![AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(MERKLE_INTERACTION.to_string()),
            &inputs,
        )]
    }
}


// =============================================================================
// Public-key binding (FR-THRESH-1(b), input side)
// =============================================================================

/// Interaction tying a registered public key's hash to the `PK.root` inside it.
///
/// Every other interaction matches on hash *outputs*. This one also exposes an
/// *input* field: the tuple is `(sha3(PK.seed ‖ PK.root), PK.root)`, read from
/// the Keccak table's output and preimage columns respectively. Without it a
/// slot could pair a legitimately-registered public-key hash with a `PK.root`
/// of its choosing.
pub const PUBKEY_INTERACTION: &str = "PUBKEY_BIND";

/// Tuple width: the 32-byte public-key hash plus the 16-byte `PK.root`.
pub const PUBKEY_TUPLE_LIMBS: usize = NODE_LIMBS + DIGEST_LIMBS;
