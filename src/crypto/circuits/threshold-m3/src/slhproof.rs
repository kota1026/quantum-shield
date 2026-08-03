//! Full SLH-DSA-SHAKE-128s verification composition (M2d) as a library:
//! one signature = 15 proofs (H_msg + FORS + T_k pipeline, and per hypertree
//! layer a WOTS+ chain proof plus a T_len + XMSS pipeline proof) glued by
//! public interface values. See `slh-verify-m2d` for the standalone
//! milestone crate and battery.

use std::time::Instant;

use p3_challenger::{HashChallenger, SerializingChallenger64};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_goldilocks::Goldilocks;
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_matrix::Matrix;
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, SerializingHasher};
use p3_uni_stark::{prove, verify, Proof, StarkConfig};

use crate::chains;
use crate::pipeline::{self, derive_pis, run_plans, Side, StageBuilder, PAD_SHAKE};
use crate::refimpl::{
    adrs, compute_intermediates, h_msg_input, parse_sig, split_digest, Intermediates,
    ParsedSig, ADRS_FORS_ROOTS, ADRS_FORS_TREE, ADRS_TREE, ADRS_WOTS_PK, FORS_A, FORS_K,
    HT_D, M_DIGEST, N, WOTS_LEN,
};

pub type Val = Goldilocks;
type Challenge = BinomialExtensionField<Val, 2>;
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

pub fn make_config() -> MyConfig {
    let u64_hash = U64Hash::new(KeccakF {});
    let field_hash = FieldHash::new(u64_hash);
    let compress = MyCompress::new(u64_hash);
    let val_mmcs = ValMmcs::new(field_hash, compress);
    let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
    let fri_params = FriParameters {
        log_blowup: 3,
        log_final_poly_len: 0,
        num_queries: 100,
        commit_proof_of_work_bits: 16,
        query_proof_of_work_bits: 16,
        mmcs: challenge_mmcs,
    };
    let pcs = Pcs::new(Dft::default(), val_mmcs, fri_params);
    let challenger = Challenger::from_hasher(vec![], ByteHash {});
    MyConfig::new(pcs, challenger)
}

/// The claimed interface values a prover ships alongside the 15 proofs.
#[derive(Clone)]
pub struct Claims {
    pub digest: [u8; M_DIGEST],
    pub fors_roots: [[u8; N]; FORS_K],
    pub fors_pk: [u8; N],
    pub wots_pks: Vec<[[u8; N]; WOTS_LEN]>,
    pub roots: Vec<[u8; N]>,
}

impl Claims {
    pub fn from_intermediates(inter: &Intermediates) -> Self {
        Claims {
            digest: inter.digest.bytes,
            fors_roots: inter.fors_roots,
            fors_pk: inter.fors_pk,
            wots_pks: inter.layers.iter().map(|l| l.wots_pks).collect(),
            roots: inter.layers.iter().map(|l| l.root).collect(),
        }
    }
}

/// Proof A layout: H_msg, then per FORS tree the leaf + 12 climbs, then T_k.
pub fn plan_proof_a(
    pk_seed: &[u8; N],
    pk_root: &[u8; N],
    msg: &[u8],
    sig: &ParsedSig,
    claims: &Claims,
) -> StageBuilder {
    let d = split_digest(claims.digest);
    let mut b = StageBuilder::default();

    b.fresh_public(&h_msg_input(sig.r, pk_seed, pk_root, msg), PAD_SHAKE);
    b.bind_out(&claims.digest);

    for i in 0..FORS_K {
        let (sk, auth) = &sig.fors[i];
        let idx_global = (i as u32) * (1 << FORS_A) + d.fors_indices[i];
        let mut input = Vec::new();
        input.extend_from_slice(pk_seed);
        input.extend_from_slice(&adrs(0, d.idx_tree, ADRS_FORS_TREE, d.idx_leaf, 0, idx_global));
        input.extend_from_slice(sk);
        b.fresh_public(&input, PAD_SHAKE);
        for (j, sib) in auth.iter().enumerate() {
            let h = (j + 1) as u32;
            let bit = (d.fors_indices[i] >> j) & 1;
            let zero = [0u8; N];
            let (left, right, side) = if bit == 0 {
                (&zero[..], *sib, Side::Left16)
            } else {
                (*sib, &zero[..], Side::Right16)
            };
            let mut input = Vec::new();
            input.extend_from_slice(pk_seed);
            input.extend_from_slice(&adrs(
                0,
                d.idx_tree,
                ADRS_FORS_TREE,
                d.idx_leaf,
                h,
                idx_global >> h,
            ));
            input.extend_from_slice(left);
            input.extend_from_slice(right);
            b.fresh_chained(&input, side, PAD_SHAKE);
        }
        b.bind_out(&claims.fors_roots[i]);
    }

    let mut stream = Vec::new();
    stream.extend_from_slice(pk_seed);
    stream.extend_from_slice(&adrs(0, d.idx_tree, ADRS_FORS_ROOTS, d.idx_leaf, 0, 0));
    for r in &claims.fors_roots {
        stream.extend_from_slice(r);
    }
    b.multi_public(&stream, PAD_SHAKE);
    b.bind_out(&claims.fors_pk);
    b
}

/// Per-layer tree proof: T_len over the claimed pk elements, then the XMSS
/// auth path chained from the T_len output.
pub fn plan_layer_tree(
    pk_seed: &[u8; N],
    layer: u32,
    tree: u64,
    kp: u32,
    wots_pks: &[[u8; N]; WOTS_LEN],
    xmss_auth: &[&[u8]],
    root_claim: &[u8; N],
) -> StageBuilder {
    let mut b = StageBuilder::default();
    let mut stream = Vec::new();
    stream.extend_from_slice(pk_seed);
    stream.extend_from_slice(&adrs(layer, tree, ADRS_WOTS_PK, kp, 0, 0));
    for e in wots_pks {
        stream.extend_from_slice(e);
    }
    b.multi_public(&stream, PAD_SHAKE);

    for (j, sib) in xmss_auth.iter().enumerate() {
        let h = (j + 1) as u32;
        let bit = (kp >> j) & 1;
        let zero = [0u8; N];
        let (left, right, side) = if bit == 0 {
            (&zero[..], *sib, Side::Left16)
        } else {
            (*sib, &zero[..], Side::Right16)
        };
        let mut input = Vec::new();
        input.extend_from_slice(pk_seed);
        input.extend_from_slice(&adrs(layer, tree, ADRS_TREE, 0, h, kp >> h));
        input.extend_from_slice(left);
        input.extend_from_slice(right);
        b.fresh_chained(&input, side, PAD_SHAKE);
    }
    b.bind_out(root_claim);
    b
}

pub struct Timing {
    pub prove_ms: f64,
    pub verify_ms: f64,
    pub proof_bytes: usize,
    #[allow(dead_code)]
    pub rows: usize,
}

/// Prove + verify one pipeline stage; panics if the honest proof rejects.
pub fn run_pipeline_stage(
    name: &str,
    b: &StageBuilder,
) -> (pipeline::PipelineAir, Proof<MyConfig>, Timing) {
    let air = b.air();
    let (pre, post) = run_plans(&b.plans);
    let trace = pipeline::build_trace(&air, &pre, &post);
    let rows = trace.height();
    let pis = derive_pis(&air, &b.plans, &b.outs);
    let config = make_config();
    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, &pis);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let proof_bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let t1 = Instant::now();
    let ok = verify(&config, &air, &proof, &pis).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
    assert!(ok, "honest {name} proof must verify");
    (air, proof, Timing { prove_ms, verify_ms, proof_bytes, rows })
}

pub fn run_chain_stage(name: &str, inst: &chains::ChainInstance) -> (Proof<MyConfig>, Timing) {
    let perms = chains::build_witness(inst);
    let trace = chains::build_trace(&perms);
    let rows = trace.height();
    let pis = chains::derive_pis(inst).expect("native digit-15 checks pass");
    let config = make_config();
    let air = chains::air::WotsSigAir;
    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, &pis);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let proof_bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
    let t1 = Instant::now();
    let ok = verify(&config, &air, &proof, &pis).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
    assert!(ok, "honest {name} proof must verify");
    (proof, Timing { prove_ms, verify_ms, proof_bytes, rows })
}

pub fn chain_instance(
    pk_seed: &[u8; N],
    l: usize,
    inter: &Intermediates,
    sig: &ParsedSig,
    claims: &Claims,
) -> chains::ChainInstance {
    let lv = &inter.layers[l];
    let digits = crate::refimpl::wots_digits(if l == 0 {
        &claims.fors_pk
    } else {
        &claims.roots[l - 1]
    });
    chains::ChainInstance {
        pk_seed: *pk_seed,
        layer: l as u32,
        tree: lv.tree,
        kp: lv.kp,
        digits,
        sigs: core::array::from_fn(|k| sig.ht[l].0[k].try_into().expect("n bytes")),
        pks: claims.wots_pks[l],
    }
}

pub struct CompositionResult {
    pub prove_ms: f64,
    pub verify_ms: f64,
    pub proof_bytes: usize,
    pub conforms: bool,
}

/// Full 15-proof composition for one signature; all proofs must accept
/// (honest prover), `conforms` reports the final native root comparison.
pub fn verify_signature_composed(
    pk_seed: &[u8; N],
    pk_root: &[u8; N],
    msg: &[u8],
    sig_bytes: &[u8],
) -> CompositionResult {
    let sig = parse_sig(sig_bytes);
    let inter = compute_intermediates(pk_seed, pk_root, msg, &sig);
    let claims = Claims::from_intermediates(&inter);

    let mut prove_ms = 0.0;
    let mut verify_ms = 0.0;
    let mut proof_bytes = 0usize;

    let ba = plan_proof_a(pk_seed, pk_root, msg, &sig, &claims);
    let (_a, _p, t) = run_pipeline_stage("A", &ba);
    prove_ms += t.prove_ms;
    verify_ms += t.verify_ms;
    proof_bytes += t.proof_bytes;

    for l in 0..HT_D {
        let ci = chain_instance(pk_seed, l, &inter, &sig, &claims);
        let (_p, t) = run_chain_stage(&format!("chain{l}"), &ci);
        prove_ms += t.prove_ms;
        verify_ms += t.verify_ms;
        proof_bytes += t.proof_bytes;

        let lv = &inter.layers[l];
        let bt = plan_layer_tree(
            pk_seed,
            l as u32,
            lv.tree,
            lv.kp,
            &claims.wots_pks[l],
            &sig.ht[l].1,
            &claims.roots[l],
        );
        let (_a, _p, t) = run_pipeline_stage(&format!("tree{l}"), &bt);
        prove_ms += t.prove_ms;
        verify_ms += t.verify_ms;
        proof_bytes += t.proof_bytes;
    }

    CompositionResult {
        prove_ms,
        verify_ms,
        proof_bytes,
        conforms: claims.roots[HT_D - 1] == *pk_root,
    }
}
