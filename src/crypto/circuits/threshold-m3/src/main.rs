//! M3 — SPHINCS+ 2/N threshold verification composition.
//!
//! Statement: "at least t distinct provers whose SLH-DSA public keys are in
//! the registry set commitment C have valid signatures on message M."
//!
//! Composition per signer: the full 15-proof SLH-DSA verification (M2d,
//! `slhproof.rs`) plus one registry-membership pipeline proof
//! (`registry.rs`: SHA3-256 leaf hash + Merkle climb bound to C). The
//! aggregation-layer facts of G2 — the threshold count, signer
//! deduplication, and the glue between membership leaves and signature
//! public keys — are checks over *public values* (signer identities are
//! public), so under the public-glue architecture they are native verifier
//! checks, not circuit constraints; on-chain they become cheap public-input
//! comparisons alongside the wrapped proofs (M0.5-C).
//!
//! Run with: cargo run --release   (single-threaded, conservative FRI params
//! as in M0..M2d: log_blowup=3, 100 queries, 16-bit PoW — ~100-bit target)

mod chains;
mod pipeline;
mod refimpl;
mod registry;
mod slhproof;

use std::time::Instant;

use fips205::slh_dsa_shake_128s::try_keygen;
use fips205::traits::{SerDes, Signer};
use p3_uni_stark::{prove, verify};

use pipeline::{derive_pis, run_plans};
use refimpl::{compute_intermediates, parse_sig, HT_D, N};
use registry::{leaf_hash, plan_membership, Registry, REG_H, REG_N};
use slhproof::{make_config, verify_signature_composed};

struct Prover {
    pk_seed: [u8; N],
    pk_root: [u8; N],
    sk: fips205::slh_dsa_shake_128s::PrivateKey,
}

fn main() {
    println!("# M3: SPHINCS+ 2/N threshold — registry membership + SLH composition");
    let mut all_ok = true;

    // ---- Registry setup: N=5 real SLH-DSA keypairs ------------------------
    let t0 = Instant::now();
    let provers: Vec<Prover> = (0..REG_N)
        .map(|_| {
            let (pk, sk) = try_keygen().expect("keygen");
            let pkb = pk.into_bytes();
            Prover {
                pk_seed: pkb[0..N].try_into().unwrap(),
                pk_root: pkb[N..2 * N].try_into().unwrap(),
                sk,
            }
        })
        .collect();
    let reg = Registry::new(
        &provers.iter().map(|p| (p.pk_seed, p.pk_root)).collect::<Vec<_>>(),
    );
    let c = reg.root();
    println!(
        "# registry: {REG_N} provers, height {REG_H}, keygen {:.1}s, C={}",
        t0.elapsed().as_secs_f64(),
        hex(&c)
    );

    let msg = b"qs-m3 unlock request #42";
    let threshold = 2usize;
    let signer_idx = [1usize, 3usize];

    // ---- Honest 2/5 composed verification ---------------------------------
    println!();
    println!(
        "{:>16} | {:>10} | {:>10} | {:>12} | {:>8}",
        "component", "prove_ms", "verify_ms", "proof_bytes", "result"
    );
    let mut total_prove = 0.0;
    let mut total_verify = 0.0;
    let mut total_bytes = 0usize;
    let mut signer_pks: Vec<([u8; N], [u8; N])> = Vec::new();
    let mut member_artifacts = Vec::new();

    for &i in &signer_idx {
        let p = &provers[i];
        let sig = p.sk.try_sign(msg, &[], true).expect("sign");

        let r = verify_signature_composed(&p.pk_seed, &p.pk_root, msg, &sig);
        all_ok &= r.conforms;
        println!(
            "{:>16} | {:>10.1} | {:>10.1} | {:>12} | {:>8}",
            format!("slh(p{i})x15"),
            r.prove_ms,
            r.verify_ms,
            r.proof_bytes,
            if r.conforms { "PASS" } else { "FAIL" }
        );
        total_prove += r.prove_ms;
        total_verify += r.verify_ms;
        total_bytes += r.proof_bytes;

        // Membership proof.
        let path = reg.path(i);
        assert_eq!(
            Registry::climb(leaf_hash(&p.pk_seed, &p.pk_root), i, &path),
            c,
            "member path must climb to C"
        );
        let b = plan_membership(&p.pk_seed, &p.pk_root, i, &path, &c);
        let air = b.air();
        let (pre, post) = run_plans(&b.plans);
        let trace = pipeline::build_trace(&air, &pre, &post);
        let pis = derive_pis(&air, &b.plans, &b.outs);
        let config = make_config();
        let t0 = Instant::now();
        let proof = prove(&config, &air, trace, &pis);
        let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
        let bytes = bincode::serialize(&proof).map(|v| v.len()).unwrap_or(0);
        let t1 = Instant::now();
        let ok = verify(&config, &air, &proof, &pis).is_ok();
        let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
        all_ok &= ok;
        println!(
            "{:>16} | {:>10.1} | {:>10.1} | {:>12} | {:>8}",
            format!("member(p{i})"),
            prove_ms,
            verify_ms,
            bytes,
            if ok { "PASS" } else { "FAIL" }
        );
        total_prove += prove_ms;
        total_verify += verify_ms;
        total_bytes += bytes;
        member_artifacts.push((i, b, air, proof));
        signer_pks.push((p.pk_seed, p.pk_root));
    }

    // Native aggregation checks over public values.
    let distinct = signer_pks[0] != signer_pks[1];
    let count_ok = signer_pks.len() >= threshold;
    all_ok &= distinct && count_ok;
    println!(
        "# native: distinct={distinct} count {}>={threshold}: ok; total prove {:.1}s, \
         verify {:.1}ms, proofs {:.1}MB",
        signer_pks.len(),
        total_prove / 1000.0,
        total_verify,
        total_bytes as f64 / 1e6
    );

    // ---- Battery ----------------------------------------------------------
    println!();
    println!("## battery");
    let mut check = |name: &str, rejected: bool| {
        all_ok &= rejected;
        println!(
            "{:>28} | {:>9} | {:>6}",
            name,
            "reject",
            if rejected { "PASS" } else { "FAIL" }
        );
    };
    let config = make_config();

    // Non-member prover claims membership under C: their honest climb ends
    // at a different root, so a proof claiming C must reject.
    {
        let (pk6, _sk6) = try_keygen().expect("keygen");
        let pkb = pk6.into_bytes();
        let seed: [u8; N] = pkb[0..N].try_into().unwrap();
        let root: [u8; N] = pkb[N..2 * N].try_into().unwrap();
        let path = reg.path(5); // an unused (zero-leaf) slot
        let b = plan_membership(&seed, &root, 5, &path, &c);
        let air = b.air();
        let (pre, post) = run_plans(&b.plans);
        let trace = pipeline::build_trace(&air, &pre, &post);
        let pis = derive_pis(&air, &b.plans, &b.outs);
        let proof = prove(&config, &air, trace, &pis);
        check("non-member-signer", verify(&config, &air, &proof, &pis).is_err());
    }
    // A member proving with another slot's index/path also cannot reach C.
    {
        let p = &provers[1];
        let path = reg.path(3);
        let b = plan_membership(&p.pk_seed, &p.pk_root, 3, &path, &c);
        let air = b.air();
        let (pre, post) = run_plans(&b.plans);
        let trace = pipeline::build_trace(&air, &pre, &post);
        let pis = derive_pis(&air, &b.plans, &b.outs);
        let proof = prove(&config, &air, trace, &pis);
        check("wrong-leaf-slot", verify(&config, &air, &proof, &pis).is_err());
    }
    // Honest membership proof re-verified against a forged root claim.
    {
        let (i, b, air, proof) = &member_artifacts[0];
        let mut c2 = c;
        c2[0] ^= 0x01;
        let p = &provers[*i];
        let b2 = plan_membership(&p.pk_seed, &p.pk_root, *i, &reg.path(*i), &c2);
        let pis2 = derive_pis(&b.air(), &b2.plans, &b2.outs);
        check("forged-registry-root", verify(&config, air, proof, &pis2).is_err());
    }
    // Duplicate signer set fails the native distinctness check.
    {
        let dup = [&provers[1], &provers[1]];
        let distinct = dup[0].pk_seed != dup[1].pk_seed || dup[0].pk_root != dup[1].pk_root;
        check("duplicate-signer", !distinct);
    }
    // One signer is below the threshold.
    {
        check("below-threshold", 1 < threshold);
    }
    // A tampered signature from a member fails the native final-root check
    // of its (internally consistent) composition.
    {
        let p = &provers[1];
        let mut sig = p.sk.try_sign(msg, &[], true).expect("sign").to_vec();
        sig[3000] ^= 0x01;
        let parsed = parse_sig(&sig);
        let inter = compute_intermediates(&p.pk_seed, &p.pk_root, msg, &parsed);
        check(
            "invalid-signature",
            inter.layers[HT_D - 1].root != p.pk_root,
        );
    }

    println!();
    if all_ok {
        println!(
            "2/{REG_N} threshold verified: 2x(15+1) proofs accepted, native checks passed, \
             6/6 battery cases rejected"
        );
    } else {
        println!("FAILURE: at least one case did not behave as expected");
        std::process::exit(1);
    }
}

fn hex(b: &[u8]) -> String {
    b.iter().map(|x| format!("{x:02x}")).collect()
}
