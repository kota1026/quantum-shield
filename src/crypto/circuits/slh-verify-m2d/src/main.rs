//! M2d — full SLH-DSA-SHAKE-128s signature verification as a proof
//! composition (SPHINCS+-SHAKE-128s).
//!
//! Integration method (the M2d selection): rather than one monolithic trace,
//! the signature is verified by **15 proofs glued with public interface
//! values** — the architecture that feeds directly into M3 aggregation and
//! the M0.5 recursion/wrap plan:
//!
//!   - proof A: H_msg + all 14 FORS trees + T_k (186 slots, pipeline AIR),
//!   - per hypertree layer l = 0..6:
//!       - chain proof: WOTS+ digit-driven chains (M2b AIR, ported),
//!       - tree proof: T_len + XMSS auth path (14 slots, pipeline AIR).
//!
//! Claimed interface values (H_msg digest, FORS roots, FORS pk, per-layer
//! WOTS+ pk elements and XMSS roots) are each bound by their producing proof
//! and natively derived into their consumers' public inputs; the final
//! native check is root == PK.root. Signatures come from the `fips205`
//! reference implementation (keygen/sign), so acceptance is an end-to-end
//! FIPS 205 conformance check of the whole constraint stack.
//!
//! Run with: cargo run --release   (single-threaded, conservative FRI params
//! as in M0..M2c: log_blowup=3, 100 queries, 16-bit PoW — ~100-bit target)

mod chains;
mod pipeline;
mod refimpl;

use std::time::Instant;

use fips205::slh_dsa_shake_128s::try_keygen;
use fips205::traits::{SerDes, Signer};
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

use pipeline::{derive_pis, out16, run_plans, Side, StageBuilder};
use refimpl::{
    adrs, compute_intermediates, h_msg_input, parse_sig, split_digest, Intermediates,
    ParsedSig, ADRS_FORS_ROOTS, ADRS_FORS_TREE, ADRS_TREE, ADRS_WOTS_PK, FORS_A, FORS_K,
    HT_D, M_DIGEST, N, WOTS_LEN,
};

type Val = Goldilocks;
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
type MyConfig = StarkConfig<Pcs, Challenge, Challenger>;

fn make_config() -> MyConfig {
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
struct Claims {
    digest: [u8; M_DIGEST],
    fors_roots: [[u8; N]; FORS_K],
    fors_pk: [u8; N],
    /// Per layer: WOTS+ pk elements and recovered XMSS root.
    wots_pks: Vec<[[u8; N]; WOTS_LEN]>,
    roots: Vec<[u8; N]>,
}

impl Claims {
    fn from_intermediates(inter: &Intermediates) -> Self {
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
fn plan_proof_a(
    pk_seed: &[u8; N],
    pk_root: &[u8; N],
    msg: &[u8],
    sig: &ParsedSig,
    claims: &Claims,
) -> StageBuilder {
    let d = split_digest(claims.digest);
    let mut b = StageBuilder::default();

    b.fresh_public(&h_msg_input(sig.r, pk_seed, pk_root, msg));
    b.bind_out(&claims.digest);

    for i in 0..FORS_K {
        let (sk, auth) = &sig.fors[i];
        let idx_global = (i as u32) * (1 << FORS_A) + d.fors_indices[i];
        let mut input = Vec::new();
        input.extend_from_slice(pk_seed);
        input.extend_from_slice(&adrs(0, d.idx_tree, ADRS_FORS_TREE, d.idx_leaf, 0, idx_global));
        input.extend_from_slice(sk);
        b.fresh_public(&input);
        for (j, sib) in auth.iter().enumerate() {
            let h = (j + 1) as u32;
            let bit = (d.fors_indices[i] >> j) & 1;
            let zero = [0u8; N];
            let (left, right, side) = if bit == 0 {
                (&zero[..], *sib, Side::Left)
            } else {
                (*sib, &zero[..], Side::Right)
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
            b.fresh_chained(&input, side);
        }
        b.bind_out(&claims.fors_roots[i]);
    }

    let mut stream = Vec::new();
    stream.extend_from_slice(pk_seed);
    stream.extend_from_slice(&adrs(0, d.idx_tree, ADRS_FORS_ROOTS, d.idx_leaf, 0, 0));
    for r in &claims.fors_roots {
        stream.extend_from_slice(r);
    }
    b.multi_public(&stream);
    b.bind_out(&claims.fors_pk);
    b
}

/// Per-layer tree proof: T_len over the claimed pk elements, then the XMSS
/// auth path chained from the T_len output.
fn plan_layer_tree(
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
    b.multi_public(&stream);

    for (j, sib) in xmss_auth.iter().enumerate() {
        let h = (j + 1) as u32;
        let bit = (kp >> j) & 1;
        let zero = [0u8; N];
        let (left, right, side) = if bit == 0 {
            (&zero[..], *sib, Side::Left)
        } else {
            (*sib, &zero[..], Side::Right)
        };
        let mut input = Vec::new();
        input.extend_from_slice(pk_seed);
        input.extend_from_slice(&adrs(layer, tree, ADRS_TREE, 0, h, kp >> h));
        input.extend_from_slice(left);
        input.extend_from_slice(right);
        b.fresh_chained(&input, side);
    }
    b.bind_out(root_claim);
    b
}

struct Timing {
    prove_ms: f64,
    verify_ms: f64,
    proof_bytes: usize,
    rows: usize,
}

/// Prove + verify one pipeline stage; panics if the honest proof rejects.
fn run_pipeline_stage(name: &str, b: &StageBuilder) -> (pipeline::PipelineAir, Proof<MyConfig>, Timing) {
    use p3_matrix::Matrix;
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

fn run_chain_stage(name: &str, inst: &chains::ChainInstance) -> (Proof<MyConfig>, Timing) {
    use p3_matrix::Matrix;
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

fn chain_instance(
    pk_seed: &[u8; N],
    l: usize,
    inter: &Intermediates,
    sig: &ParsedSig,
    claims: &Claims,
) -> chains::ChainInstance {
    let lv = &inter.layers[l];
    let digits = refimpl::wots_digits(if l == 0 { &claims.fors_pk } else { &claims.roots[l - 1] });
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

fn main() {
    println!("# M2d: full SLH-DSA-SHAKE-128s verification — 15-proof composition");
    let mut all_ok = true;

    // ---- Honest full verifications over fips205-generated signatures ------
    let mut totals: Vec<f64> = Vec::new();
    for run in 0..2 {
        let (pk, sk) = try_keygen().expect("keygen");
        let msg = format!("qs-m2d conformance message {run}");
        let sig_bytes = sk.try_sign(msg.as_bytes(), &[], true).expect("sign");
        let pkb = pk.into_bytes();
        let pk_seed: [u8; N] = pkb[0..N].try_into().unwrap();
        let pk_root: [u8; N] = pkb[N..2 * N].try_into().unwrap();

        let sig = parse_sig(&sig_bytes);
        let inter = compute_intermediates(&pk_seed, &pk_root, msg.as_bytes(), &sig);
        let claims = Claims::from_intermediates(&inter);

        println!();
        println!(
            "## run {run}: idx_tree={} idx_leaf={}",
            inter.digest.idx_tree, inter.digest.idx_leaf
        );
        println!(
            "{:>16} | {:>6} | {:>10} | {:>10} | {:>12}",
            "proof", "rows", "prove_ms", "verify_ms", "proof_bytes"
        );

        let mut total_prove = 0.0;
        let mut total_verify = 0.0;
        let mut total_bytes = 0usize;

        let ba = plan_proof_a(&pk_seed, &pk_root, msg.as_bytes(), &sig, &claims);
        let (pre_a, post_a) = run_plans(&ba.plans);
        assert_eq!(out16(post_a.last().unwrap()), claims.fors_pk);
        drop((pre_a, post_a));
        let (_air_a, _proof_a, t) = run_pipeline_stage("A", &ba);
        println!(
            "{:>16} | {:>6} | {:>10.1} | {:>10.1} | {:>12}",
            "A(hmsg+fors)", t.rows, t.prove_ms, t.verify_ms, t.proof_bytes
        );
        total_prove += t.prove_ms;
        total_verify += t.verify_ms;
        total_bytes += t.proof_bytes;

        for l in 0..HT_D {
            let ci = chain_instance(&pk_seed, l, &inter, &sig, &claims);
            let (_p, t) = run_chain_stage(&format!("chain{l}"), &ci);
            println!(
                "{:>16} | {:>6} | {:>10.1} | {:>10.1} | {:>12}",
                format!("chain L{l}"),
                t.rows,
                t.prove_ms,
                t.verify_ms,
                t.proof_bytes
            );
            total_prove += t.prove_ms;
            total_verify += t.verify_ms;
            total_bytes += t.proof_bytes;

            let lv = &inter.layers[l];
            let bt = plan_layer_tree(
                &pk_seed,
                l as u32,
                lv.tree,
                lv.kp,
                &claims.wots_pks[l],
                &sig.ht[l].1,
                &claims.roots[l],
            );
            let (_a, _p, t) = run_pipeline_stage(&format!("tree{l}"), &bt);
            println!(
                "{:>16} | {:>6} | {:>10.1} | {:>10.1} | {:>12}",
                format!("tree L{l}"),
                t.rows,
                t.prove_ms,
                t.verify_ms,
                t.proof_bytes
            );
            total_prove += t.prove_ms;
            total_verify += t.verify_ms;
            total_bytes += t.proof_bytes;
        }

        let conforms = claims.roots[HT_D - 1] == pk_root;
        all_ok &= conforms;
        println!(
            "## run {run}: total prove {:.1}s, total verify {:.1}ms, proofs {:.1}MB, \
             root==PK.root: {}",
            total_prove / 1000.0,
            total_verify,
            total_bytes as f64 / 1e6,
            conforms
        );
        totals.push(total_prove);
    }

    // ---- Forged-claim battery: honest proofs, forged public interfaces ----
    // Re-verifying an honest proof against publics derived from a forged
    // claim must fail — no re-proving involved.
    println!();
    println!("## forged-claim battery (honest proofs vs forged public inputs)");
    {
        let (pk, sk) = try_keygen().expect("keygen");
        let msg = b"qs-m2d forged-claim battery";
        let sig_bytes = sk.try_sign(msg, &[], true).expect("sign");
        let pkb = pk.into_bytes();
        let pk_seed: [u8; N] = pkb[0..N].try_into().unwrap();
        let pk_root: [u8; N] = pkb[N..2 * N].try_into().unwrap();
        let sig = parse_sig(&sig_bytes);
        let inter = compute_intermediates(&pk_seed, &pk_root, msg, &sig);
        let claims = Claims::from_intermediates(&inter);
        let config = make_config();

        let mut check = |name: &str, rejected: bool| {
            all_ok &= rejected;
            println!(
                "{:>28} | {:>9} | {:>6}",
                name,
                "reject",
                if rejected { "PASS" } else { "FAIL" }
            );
        };

        // Proof A once, honestly.
        let ba = plan_proof_a(&pk_seed, &pk_root, msg, &sig, &claims);
        let (air_a, proof_a, _t) = run_pipeline_stage("A", &ba);

        {
            let mut c2 = claims.clone();
            c2.digest[0] ^= 0x01;
            let b2 = plan_proof_a(&pk_seed, &pk_root, msg, &sig, &c2);
            let pis = derive_pis(&b2.air(), &b2.plans, &b2.outs);
            check(
                "forged-digest",
                verify(&config, &air_a, &proof_a, &pis).is_err(),
            );
        }
        {
            let mut c2 = claims.clone();
            c2.fors_roots[5][0] ^= 0x01;
            let b2 = plan_proof_a(&pk_seed, &pk_root, msg, &sig, &c2);
            let pis = derive_pis(&b2.air(), &b2.plans, &b2.outs);
            check(
                "forged-fors-root(5)",
                verify(&config, &air_a, &proof_a, &pis).is_err(),
            );
        }
        {
            let mut c2 = claims.clone();
            c2.fors_pk[0] ^= 0x01;
            let b2 = plan_proof_a(&pk_seed, &pk_root, msg, &sig, &c2);
            let pis = derive_pis(&b2.air(), &b2.plans, &b2.outs);
            check(
                "forged-fors-pk",
                verify(&config, &air_a, &proof_a, &pis).is_err(),
            );
        }

        // Layer-2 chain proof once, honestly.
        let ci = chain_instance(&pk_seed, 2, &inter, &sig, &claims);
        let perms = chains::build_witness(&ci);
        let trace = chains::build_trace(&perms);
        let pis = chains::derive_pis(&ci).unwrap();
        let cair = chains::air::WotsSigAir;
        let cproof = prove(&config, &cair, trace, &pis);
        assert!(verify(&config, &cair, &cproof, &pis).is_ok());
        {
            let mut ci2 = chain_instance(&pk_seed, 2, &inter, &sig, &claims);
            ci2.pks[3][0] ^= 0x01;
            match chains::derive_pis(&ci2) {
                Some(pis2) => check(
                    "forged-wots-pk(L2,c3)",
                    verify(&config, &cair, &cproof, &pis2).is_err(),
                ),
                None => check("forged-wots-pk(L2,c3)", true),
            }
        }

        // Layer-5 tree proof once, honestly.
        let lv = &inter.layers[5];
        let bt = plan_layer_tree(
            &pk_seed,
            5,
            lv.tree,
            lv.kp,
            &claims.wots_pks[5],
            &sig.ht[5].1,
            &claims.roots[5],
        );
        let (tair, tproof, _t) = run_pipeline_stage("tree5", &bt);
        {
            let mut root2 = claims.roots[5];
            root2[0] ^= 0x01;
            let b2 = plan_layer_tree(
                &pk_seed,
                5,
                lv.tree,
                lv.kp,
                &claims.wots_pks[5],
                &sig.ht[5].1,
                &root2,
            );
            let pis2 = derive_pis(&b2.air(), &b2.plans, &b2.outs);
            check(
                "forged-root(L5)",
                verify(&config, &tair, &tproof, &pis2).is_err(),
            );
        }

        // ---- Input tampers: honest prover, tampered signature/pk ----------
        // The composition stays internally consistent, so every proof still
        // verifies — rejection is the final native root comparison, exactly
        // as in native SLH-DSA verification.
        let mut native = |name: &str, sig_mut: &mut [u8], pk_root_used: &[u8; N]| {
            let s2 = parse_sig(sig_mut);
            let i2 = compute_intermediates(&pk_seed, pk_root_used, msg, &s2);
            let rejected = i2.layers[HT_D - 1].root != *pk_root_used;
            all_ok &= rejected;
            println!(
                "{:>28} | {:>9} | {:>6}",
                name,
                "reject",
                if rejected { "PASS" } else { "FAIL" }
            );
        };
        {
            let mut s2 = sig_bytes.to_vec();
            s2[N + 5] ^= 0x01; // a FORS sk element
            native("tampered-sig(fors-sk)", &mut s2, &pk_root);
        }
        {
            let mut s2 = sig_bytes.to_vec();
            s2[3000] ^= 0x01; // a layer-0 WOTS sig element
            native("tampered-sig(wots)", &mut s2, &pk_root);
        }
        {
            let mut s2 = sig_bytes.to_vec();
            s2[0] ^= 0x01; // R -> different digest/indices
            native("tampered-R", &mut s2, &pk_root);
        }
        {
            let mut root2 = pk_root;
            root2[0] ^= 0x01;
            let mut s2 = sig_bytes.to_vec();
            native("wrong-pk-root", &mut s2, &root2);
        }
    }

    println!();
    println!(
        "# NFR-3: full-signature prove totals: {:?} s (single-threaded); target p99 <= 1h",
        totals.iter().map(|t| (t / 1000.0 * 10.0).round() / 10.0).collect::<Vec<_>>()
    );
    if all_ok {
        println!("all runs conform and all 9 tamper/forgery cases rejected");
    } else {
        println!("FAILURE: at least one case did not behave as expected");
        std::process::exit(1);
    }
}
