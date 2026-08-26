//! Concrete STARK configuration (mirrors keccak-m0: Goldilocks, degree-2
//! extension, Keccak Merkle MMCS, TwoAdicFriPcs) plus prove/verify entry
//! points for the WOTS+ chain AIR.

use p3_challenger::{HashChallenger, SerializingChallenger64};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_goldilocks::Goldilocks;
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::{prove, verify, Proof, StarkConfig};

use crate::air::{build_trace, WotsChainAir};
use crate::wots::ChainWitness;

pub type Val = Goldilocks;
pub type Challenge = BinomialExtensionField<Val, 2>;
type ByteHash = Keccak256Hash;
type U64Hash = PaddingFreeSponge<KeccakF, 25, 17, 4>;
type FieldHash = SerializingHasher<U64Hash>;
type MyCompress = CompressionFunctionFromHasher<U64Hash, 2, 4>;
type ValMmcs = MerkleTreeMmcs<
    [Val; p3_keccak::VECTOR_LEN],
    [u64; p3_keccak::VECTOR_LEN],
    FieldHash,
    MyCompress,
    4,
>;
type ChallengeMmcs = ExtensionMmcs<Val, Challenge, ValMmcs>;
type Dft = Radix2DitParallel<Val>;
type Challenger = SerializingChallenger64<Val, HashChallenger<u8, ByteHash, 32>>;
type Pcs = TwoAdicFriPcs<Val, Dft, ValMmcs, ChallengeMmcs>;
pub type MyConfig = StarkConfig<Pcs, Challenge, Challenger>;

/// FRI knobs. `production()` matches the conservative M0 settings;
/// `fast()` is for tests only (real proofs, reduced query count).
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

fn make_config(settings: FriSettings) -> MyConfig {
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
    MyConfig::new(pcs, challenger)
}

/// Prove one WOTS+ chain. Returns the proof and the public values the
/// verifier must be given.
pub fn prove_chain(
    witness: &ChainWitness,
    settings: FriSettings,
) -> (Proof<MyConfig>, Vec<Val>) {
    let config = make_config(settings);
    let (trace, public_values) = build_trace::<Val>(witness, settings.log_blowup);
    let proof = prove(&config, &WotsChainAir {}, trace, &public_values);
    (proof, public_values)
}

/// Verify a WOTS+ chain proof against public values.
pub fn verify_chain(
    proof: &Proof<MyConfig>,
    public_values: &[Val],
    settings: FriSettings,
) -> Result<(), String> {
    let config = make_config(settings);
    verify(&config, &WotsChainAir {}, proof, public_values).map_err(|e| format!("{e:?}"))
}
