//! The bound configuration: the Keccak table drives every other table
//! through global lookups.
//!
//! This is the sound version of [`crate::stark`]'s standalone PoC — producer
//! digests come out of `p3-keccak-air`'s own output columns, so a consumed
//! digest is necessarily the output of a proven permutation.
//!
//! Tables are assembled as a list rather than a fixed pair, because M3 keeps
//! adding participants: the 16-byte SPHINCS+ consumer, the 32-byte registry
//! Merkle consumer, the aggregation table, and eventually one Keccak table
//! per signature.

use p3_air::{Air, AirBuilderWithPublicValues, BaseAir, PairBuilder, PermutationAirBuilder};
use p3_batch_stark::{prove_batch, verify_batch, BatchProof, CommonData, StarkInstance};
use p3_field::Field;
use p3_lookup::logup::LogUpGadget;
use p3_lookup::lookup_traits::{AirLookupHandler, Lookup};
use p3_matrix::dense::RowMajorMatrix;
use p3_util::log2_strict_usize;

use crate::agg::AggregationAir;
use crate::keccak_link::KeccakDigestAir;
use crate::link::{LinkAir, NodeLinkAir, Side, F};
use crate::stark::{make_config, FriSettings, MyConfig};

/// Heterogeneous wrapper so every table can be batched as one AIR type.
#[derive(Clone, Debug)]
pub enum DagAir {
    /// The Keccak table, publishing digests.
    Keccak(KeccakDigestAir),
    /// Consumed 16-byte SPHINCS+ hash inputs.
    Consumer(LinkAir),
    /// Consumed 32-byte registry Merkle inputs.
    NodeConsumer(NodeLinkAir),
    /// The per-slot aggregation table (threshold, dedup, verification verdict).
    Agg(AggregationAir),
}

impl<T: Field> BaseAir<T> for DagAir {
    fn width(&self) -> usize {
        match self {
            Self::Keccak(a) => BaseAir::<T>::width(a),
            Self::Consumer(a) => BaseAir::<T>::width(a),
            Self::NodeConsumer(a) => BaseAir::<T>::width(a),
            Self::Agg(a) => BaseAir::<T>::width(a),
        }
    }
}

impl<AB> Air<AB> for DagAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn eval(&self, builder: &mut AB) {
        match self {
            Self::Keccak(a) => Air::<AB>::eval(a, builder),
            Self::Consumer(a) => Air::<AB>::eval(a, builder),
            Self::NodeConsumer(a) => Air::<AB>::eval(a, builder),
            Self::Agg(a) => Air::<AB>::eval(a, builder),
        }
    }
}

impl<AB> AirLookupHandler<AB> for DagAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn add_lookup_columns(&mut self) -> Vec<usize> {
        match self {
            Self::Keccak(a) => AirLookupHandler::<AB>::add_lookup_columns(a),
            Self::Consumer(a) => AirLookupHandler::<AB>::add_lookup_columns(a),
            Self::NodeConsumer(a) => AirLookupHandler::<AB>::add_lookup_columns(a),
            Self::Agg(a) => AirLookupHandler::<AB>::add_lookup_columns(a),
        }
    }

    fn get_lookups(&mut self) -> Vec<Lookup<AB::F>> {
        match self {
            Self::Keccak(a) => AirLookupHandler::<AB>::get_lookups(a),
            Self::Consumer(a) => AirLookupHandler::<AB>::get_lookups(a),
            Self::NodeConsumer(a) => AirLookupHandler::<AB>::get_lookups(a),
            Self::Agg(a) => AirLookupHandler::<AB>::get_lookups(a),
        }
    }
}

/// One table in the batch.
pub struct Table {
    pub air: DagAir,
    pub trace: RowMajorMatrix<F>,
    pub public_values: Vec<F>,
}

impl Table {
    pub fn new(air: DagAir, trace: RowMajorMatrix<F>) -> Self {
        Self { air, trace, public_values: Vec::new() }
    }

    /// The Keccak table (producer for every interaction).
    pub fn keccak(trace: RowMajorMatrix<F>) -> Self {
        Self::new(DagAir::Keccak(KeccakDigestAir::new()), trace)
    }

    /// The 16-byte SPHINCS+ consumer table.
    pub fn consumer(trace: RowMajorMatrix<F>) -> Self {
        Self::new(DagAir::Consumer(LinkAir::new(Side::Consumer)), trace)
    }

    /// The 32-byte registry Merkle consumer table.
    pub fn node_consumer(trace: RowMajorMatrix<F>) -> Self {
        Self::new(DagAir::NodeConsumer(NodeLinkAir::new()), trace)
    }

    /// The aggregation table.
    pub fn aggregation(trace: RowMajorMatrix<F>, pvs: Vec<F>) -> Self {
        Self { air: DagAir::Agg(AggregationAir::new()), trace, public_values: pvs }
    }

    fn log_degree(&self) -> usize {
        let width = <DagAir as BaseAir<F>>::width(&self.air);
        log2_strict_usize(self.trace.values.len() / width)
    }
}

/// A proven batch, plus what the verifier needs.
pub struct Bound {
    pub proof: BatchProof<MyConfig>,
    pub airs: Vec<DagAir>,
    pub common: CommonData<MyConfig>,
    pub config: MyConfig,
    pub public_values: Vec<Vec<F>>,
}

/// Prove a set of tables as one batch, joined by their global lookups.
pub fn prove_tables(tables: Vec<Table>, settings: FriSettings) -> Bound {
    assert!(!tables.is_empty(), "a batch needs at least one table");

    let config = make_config(settings);
    let log_degrees: Vec<usize> = tables.iter().map(Table::log_degree).collect();

    let mut airs: Vec<DagAir> = tables.iter().map(|t| t.air.clone()).collect();
    let common = CommonData::<MyConfig>::from_airs_and_degrees(&config, &mut airs, &log_degrees);

    let traces: Vec<RowMajorMatrix<F>> = tables.iter().map(|t| t.trace.clone()).collect();
    let public_values: Vec<Vec<F>> = tables.iter().map(|t| t.public_values.clone()).collect();

    let instances = StarkInstance::new_multiple(&airs, &traces, &public_values, &common);

    let gadget = LogUpGadget::new();
    let proof = prove_batch(&config, &instances, &common, &gadget);

    Bound { proof, airs, common, config, public_values }
}

/// Verify a batch. A consumed digest that no proven permutation produced
/// makes the global sum non-zero and surfaces here as an error.
pub fn verify_tables(bound: &Bound) -> Result<(), String> {
    let gadget = LogUpGadget::new();
    verify_batch(
        &bound.config,
        &bound.airs,
        &bound.proof,
        &bound.public_values,
        &bound.common,
        &gadget,
    )
    .map_err(|e| format!("{e:?}"))
}

/// Convenience: the two-table Keccak + SPHINCS+ consumer configuration.
pub fn prove_bound(
    keccak: RowMajorMatrix<F>,
    consumer: RowMajorMatrix<F>,
    settings: FriSettings,
) -> Bound {
    prove_tables(vec![Table::keccak(keccak), Table::consumer(consumer)], settings)
}

/// Convenience: Keccak + SPHINCS+ consumer + aggregation.
pub fn prove_bound_with_agg(
    keccak: RowMajorMatrix<F>,
    consumer: RowMajorMatrix<F>,
    agg: RowMajorMatrix<F>,
    agg_public_values: Vec<F>,
    settings: FriSettings,
) -> Bound {
    prove_tables(
        vec![
            Table::keccak(keccak),
            Table::consumer(consumer),
            Table::aggregation(agg, agg_public_values),
        ],
        settings,
    )
}

/// Verification entry points for the convenience constructors above.
pub use verify_tables as verify_bound;
pub use verify_tables as verify_bound_with_agg;
