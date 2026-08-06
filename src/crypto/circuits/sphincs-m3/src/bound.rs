//! The bound configuration: Keccak table (producer) ↔ consumer table,
//! joined by the `HASH_DAG` global lookup.
//!
//! This is the sound version of [`crate::stark`]'s standalone PoC — here the
//! producer digests come out of `p3-keccak-air`'s own output columns, so a
//! consumed digest is necessarily the output of a proven permutation.

use p3_air::{Air, AirBuilderWithPublicValues, BaseAir, PairBuilder, PermutationAirBuilder};
use p3_batch_stark::{prove_batch, verify_batch, BatchProof, CommonData, StarkInstance};
use p3_field::Field;
use p3_lookup::logup::LogUpGadget;
use p3_lookup::lookup_traits::{AirLookupHandler, Lookup};
use p3_matrix::dense::RowMajorMatrix;
use p3_util::log2_strict_usize;

use crate::keccak_link::KeccakDigestAir;
use crate::link::{LinkAir, Side, F};
use crate::stark::{make_config, FriSettings, MyConfig};

/// Heterogeneous wrapper so both tables can be batched as one AIR type.
#[derive(Clone, Debug)]
pub enum DagAir {
    /// The Keccak table, publishing digests.
    Keccak(KeccakDigestAir),
    /// The table of consumed hash inputs.
    Consumer(LinkAir),
}

impl<T: Field> BaseAir<T> for DagAir {
    fn width(&self) -> usize {
        match self {
            Self::Keccak(a) => BaseAir::<T>::width(a),
            Self::Consumer(a) => BaseAir::<T>::width(a),
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
        }
    }

    fn get_lookups(&mut self) -> Vec<Lookup<AB::F>> {
        match self {
            Self::Keccak(a) => AirLookupHandler::<AB>::get_lookups(a),
            Self::Consumer(a) => AirLookupHandler::<AB>::get_lookups(a),
        }
    }
}

/// A proven bound pair, plus what the verifier needs.
pub struct BoundLinked {
    pub proof: BatchProof<MyConfig>,
    pub airs: [DagAir; 2],
    pub common: CommonData<MyConfig>,
    pub config: MyConfig,
}

/// Prove the Keccak table and the consumer table as one batch.
pub fn prove_bound(
    keccak: RowMajorMatrix<F>,
    consumer: RowMajorMatrix<F>,
    settings: FriSettings,
) -> BoundLinked {
    let config = make_config(settings);
    let log_degrees = [
        log2_strict_usize(keccak.values.len() / crate::keccak_link::WIDTH),
        log2_strict_usize(consumer.values.len() / crate::link::WIDTH),
    ];

    let mut airs = [
        DagAir::Keccak(KeccakDigestAir::new()),
        DagAir::Consumer(LinkAir::new(Side::Consumer)),
    ];
    let common = CommonData::<MyConfig>::from_airs_and_degrees(&config, &mut airs, &log_degrees);

    let instances =
        StarkInstance::new_multiple(&airs, &[keccak, consumer], &[vec![], vec![]], &common);

    let gadget = LogUpGadget::new();
    let proof = prove_batch(&config, &instances, &common, &gadget);

    BoundLinked { proof, airs, common, config }
}

/// Verify a bound proof. A consumed digest that no proven permutation
/// produced makes the global sum non-zero and surfaces here as an error.
pub fn verify_bound(linked: &BoundLinked) -> Result<(), String> {
    let gadget = LogUpGadget::new();
    verify_batch(
        &linked.config,
        &linked.airs,
        &linked.proof,
        &[vec![], vec![]],
        &linked.common,
        &gadget,
    )
    .map_err(|e| format!("{e:?}"))
}
