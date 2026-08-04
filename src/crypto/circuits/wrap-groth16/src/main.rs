//! M0.5-impl on-chain plumbing — real BN254 Groth16 proof generation for
//! the ThresholdVerifier wrap path.
//!
//! The proof's public inputs are the two 128-bit halves of
//! publicInputsDigest = SHA3-256(message || pk_0 || ... || pk_{k-1}) as
//! computed by ThresholdVerifier.sol, so the on-chain verifier binds the
//! wrapped proof to the exact signer set and message. The Groth16
//! *statement* here is a placeholder relation over those inputs — the real
//! M0.5-impl circuit (the STARK-composition verifier in R1CS) replaces the
//! ConstraintSynthesizer below without touching any of the on-chain
//! plumbing this binary exercises: trusted setup, proof generation, EVM
//! calldata encoding (G1/G2 point serialization matching the pairing
//! precompiles), and the Solidity fixture.
//!
//! Run with: cargo run --release
//! Prints the verifying key, an accepting proof for a demo digest, and the
//! public inputs, formatted for Groth16WrapVerifierTest.t.sol.

use ark_bn254::{Bn254, Fr};
use ark_ec::AffineRepr;
use ark_ff::{BigInteger, Field, PrimeField};
use ark_groth16::{Groth16, PreparedVerifyingKey, Proof, VerifyingKey};
use ark_relations::lc;
use ark_relations::r1cs::{
    ConstraintSynthesizer, ConstraintSystemRef, SynthesisError, Variable,
};
use ark_snark::SNARK;
use ark_std::rand::rngs::StdRng;
use ark_std::rand::SeedableRng;
use sha3::{Digest, Sha3_256};

/// Placeholder wrap statement: prover knows w with (d0 + d1) * w = 1, i.e.
/// w = (d0 + d1)^-1 — satisfiable for any digest with d0 + d1 != 0 and
/// touching both public inputs. The STARK-verifier circuit replaces this.
struct PlaceholderWrap {
    d0: Option<Fr>,
    d1: Option<Fr>,
}

impl ConstraintSynthesizer<Fr> for PlaceholderWrap {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        let d0 = cs.new_input_variable(|| self.d0.ok_or(SynthesisError::AssignmentMissing))?;
        let d1 = cs.new_input_variable(|| self.d1.ok_or(SynthesisError::AssignmentMissing))?;
        let w = cs.new_witness_variable(|| {
            let s = self.d0.ok_or(SynthesisError::AssignmentMissing)?
                + self.d1.ok_or(SynthesisError::AssignmentMissing)?;
            s.inverse().ok_or(SynthesisError::Unsatisfiable)
        })?;
        cs.enforce_constraint(lc!() + d0 + d1, lc!() + w, lc!() + Variable::One)?;
        Ok(())
    }
}

/// The digest ThresholdVerifier computes: SHA3-256(message || pks...).
fn public_inputs_digest(message: &[u8; 32], pks: &[[u8; 32]]) -> [u8; 32] {
    let mut h = Sha3_256::new();
    Digest::update(&mut h, message);
    for pk in pks {
        Digest::update(&mut h, pk);
    }
    h.finalize().into()
}

/// Split the 32-byte digest into two 128-bit field elements (big-endian),
/// matching Groth16WrapVerifier.sol's uint256(digest) >> 128 / & mask.
fn digest_to_field(d: &[u8; 32]) -> (Fr, Fr) {
    let hi = Fr::from_be_bytes_mod_order(&d[0..16]);
    let lo = Fr::from_be_bytes_mod_order(&d[16..32]);
    (hi, lo)
}

fn u256_hex(limbs: &[u8]) -> String {
    let mut s = String::from("0x");
    for b in limbs {
        s.push_str(&format!("{b:02x}"));
    }
    s
}

fn g1_coords(p: &ark_bn254::G1Affine) -> (String, String) {
    let x = p.x().expect("nonzero").into_bigint().to_bytes_be();
    let y = p.y().expect("nonzero").into_bigint().to_bytes_be();
    (u256_hex(&pad32(&x)), u256_hex(&pad32(&y)))
}

/// EVM pairing precompile G2 encoding: (x_c1, x_c0, y_c1, y_c0).
fn g2_coords(p: &ark_bn254::G2Affine) -> (String, String, String, String) {
    let x = p.x().expect("nonzero");
    let y = p.y().expect("nonzero");
    (
        u256_hex(&pad32(&x.c1.into_bigint().to_bytes_be())),
        u256_hex(&pad32(&x.c0.into_bigint().to_bytes_be())),
        u256_hex(&pad32(&y.c1.into_bigint().to_bytes_be())),
        u256_hex(&pad32(&y.c0.into_bigint().to_bytes_be())),
    )
}

fn pad32(b: &[u8]) -> Vec<u8> {
    let mut v = vec![0u8; 32 - b.len()];
    v.extend_from_slice(b);
    v
}

fn print_vk(vk: &VerifyingKey<Bn254>) {
    let (ax, ay) = g1_coords(&vk.alpha_g1);
    println!("alpha = G1({ax}, {ay})");
    let (bx1, bx0, by1, by0) = g2_coords(&vk.beta_g2);
    println!("beta  = G2({bx1}, {bx0}, {by1}, {by0})");
    let (gx1, gx0, gy1, gy0) = g2_coords(&vk.gamma_g2);
    println!("gamma = G2({gx1}, {gx0}, {gy1}, {gy0})");
    let (dx1, dx0, dy1, dy0) = g2_coords(&vk.delta_g2);
    println!("delta = G2({dx1}, {dx0}, {dy1}, {dy0})");
    for (i, ic) in vk.gamma_abc_g1.iter().enumerate() {
        let (x, y) = g1_coords(ic);
        println!("ic[{i}] = G1({x}, {y})");
    }
}

fn main() {
    let mut rng = StdRng::seed_from_u64(0x51_5f_6d_30_35);

    // Demo digest: the message/pk values are arbitrary here; ThresholdVerifier
    // recomputes the digest on-chain from its calldata, so the binding is
    // exercised end-to-end in the forge tests.
    let message: [u8; 32] = Sha3_256::digest(b"qs-m05impl unlock request #42").into();
    let mut pks: Vec<[u8; 32]> = vec![
        Sha3_256::digest(b"qs-m05impl signer pk a").into(),
        Sha3_256::digest(b"qs-m05impl signer pk b").into(),
    ];
    // ThresholdVerifier requires signers sorted by ascending leaf hash and
    // concatenates in that order — mirror it here.
    pks.sort_by_key(|pk| <[u8; 32]>::from(Sha3_256::digest(pk)));
    let (pk_a, pk_b) = (pks[0], pks[1]);
    let digest = public_inputs_digest(&message, &[pk_a, pk_b]);
    let (d0, d1) = digest_to_field(&digest);

    let (pk, vk) = Groth16::<Bn254>::circuit_specific_setup(
        PlaceholderWrap { d0: None, d1: None },
        &mut rng,
    )
    .expect("setup");

    let proof: Proof<Bn254> = Groth16::<Bn254>::prove(
        &pk,
        PlaceholderWrap { d0: Some(d0), d1: Some(d1) },
        &mut rng,
    )
    .expect("prove");

    let pvk: PreparedVerifyingKey<Bn254> = ark_groth16::prepare_verifying_key(&vk);
    assert!(
        Groth16::<Bn254>::verify_with_processed_vk(&pvk, &[d0, d1], &proof).expect("verify"),
        "proof must verify natively"
    );
    // Wrong publics must fail natively (sanity before the Solidity battery).
    assert!(
        !Groth16::<Bn254>::verify_with_processed_vk(&pvk, &[d1, d0], &proof).expect("verify"),
        "swapped publics must not verify"
    );

    println!("// generated by wrap-groth16 (seed 0x515f6d3035)");
    println!("message = {}", u256_hex(&message));
    println!("pk_a    = {}", u256_hex(&pk_a));
    println!("pk_b    = {}", u256_hex(&pk_b));
    println!("digest  = {}", u256_hex(&digest));
    print_vk(&vk);
    let (pax, pay) = g1_coords(&proof.a);
    println!("proof.a = G1({pax}, {pay})");
    let (pbx1, pbx0, pby1, pby0) = g2_coords(&proof.b);
    println!("proof.b = G2({pbx1}, {pbx0}, {pby1}, {pby0})");
    let (pcx, pcy) = g1_coords(&proof.c);
    println!("proof.c = G1({pcx}, {pcy})");
    println!("native verify: ok (accept honest, reject swapped publics)");
}
