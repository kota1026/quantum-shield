//! Batch-STARK configuration and prove/verify entry points for the two
//! linked tables (same Goldilocks + Keccak-MMCS setup as M0/M1/M2).

use p3_batch_stark::{prove_batch, verify_batch, BatchProof, CommonData, StarkInstance};
use p3_challenger::{HashChallenger, SerializingChallenger64};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_lookup::logup::LogUpGadget;
use p3_matrix::dense::RowMajorMatrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::StarkConfig;
use p3_util::log2_strict_usize;

use crate::link::{LinkAir, Side, EF, F};

type ByteHash = Keccak256Hash;
type U64Hash = PaddingFreeSponge<KeccakF, 25, 17, 4>;
type FieldHash = SerializingHasher<U64Hash>;
type MyCompress = CompressionFunctionFromHasher<U64Hash, 2, 4>;
type ValMmcs = MerkleTreeMmcs<
    [F; p3_keccak::VECTOR_LEN],
    [u64; p3_keccak::VECTOR_LEN],
    FieldHash,
    MyCompress,
    4,
>;
type ChallengeMmcs = ExtensionMmcs<F, EF, ValMmcs>;
type Dft = Radix2DitParallel<F>;
type Challenger = SerializingChallenger64<F, HashChallenger<u8, ByteHash, 32>>;
type Pcs = TwoAdicFriPcs<F, Dft, ValMmcs, ChallengeMmcs>;
pub type MyConfig = StarkConfig<Pcs, EF, Challenger>;

/// FRI knobs; `fast` keeps the PoC's proofs real but quick.
#[derive(Clone, Copy, Debug)]
pub struct FriSettings {
    pub log_blowup: usize,
    pub num_queries: usize,
    pub proof_of_work_bits: usize,
}

impl FriSettings {
    pub fn production() -> Self {
        Self { log_blowup: 3, num_queries: 100, proof_of_work_bits: 16 }
    }

    pub fn fast() -> Self {
        Self { log_blowup: 3, num_queries: 16, proof_of_work_bits: 1 }
    }
}

pub fn make_config(settings: FriSettings) -> MyConfig {
    let byte_hash = ByteHash {};
    let u64_hash = U64Hash::new(KeccakF {});
    let field_hash = FieldHash::new(u64_hash);
    let compress = MyCompress::new(u64_hash);
    let val_mmcs = ValMmcs::new(field_hash, compress);
    let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
    let dft = Dft::default();

    let fri_params = FriParameters {
        log_blowup: settings.log_blowup,
        log_final_poly_len: 0,
        num_queries: settings.num_queries,
        commit_proof_of_work_bits: settings.proof_of_work_bits,
        query_proof_of_work_bits: settings.proof_of_work_bits,
        mmcs: challenge_mmcs,
    };

    let pcs = Pcs::new(dft, val_mmcs, fri_params);
    let challenger = Challenger::from_hasher(vec![], byte_hash);
    StarkConfig::new(pcs, challenger)
}

/// Prove the linked pair. Returns the proof plus everything the verifier
/// needs to check it.
pub struct Linked {
    pub proof: BatchProof<MyConfig>,
    pub airs: [LinkAir; 2],
    pub common: CommonData<MyConfig>,
    pub config: MyConfig,
}

/// Prove `producer` and `consumer` as one batch joined by the global LogUp
/// interaction.
pub fn prove_linked(
    producer: RowMajorMatrix<F>,
    consumer: RowMajorMatrix<F>,
    settings: FriSettings,
) -> Linked {
    let config = make_config(settings);
    let log_degrees = [
        log2_strict_usize(producer.values.len() / crate::link::WIDTH),
        log2_strict_usize(consumer.values.len() / crate::link::WIDTH),
    ];

    let mut airs = [LinkAir::new(Side::Producer), LinkAir::new(Side::Consumer)];
    let common = CommonData::<MyConfig>::from_airs_and_degrees(&config, &mut airs, &log_degrees);

    let instances = StarkInstance::new_multiple(
        &airs,
        &[producer, consumer],
        &[vec![], vec![]],
        &common,
    );

    let gadget = LogUpGadget::new();
    let proof = prove_batch(&config, &instances, &common, &gadget);

    Linked { proof, airs, common, config }
}

/// Verify a linked proof. An input digest that was never produced makes the
/// global LogUp sum non-zero, which surfaces here as an error.
pub fn verify_linked(linked: &Linked) -> Result<(), String> {
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
