//! Measure the two axes ML-DSA-65 verification loads a proof system with:
//! Keccak permutations (SHAKE) and modular multiplications mod q.
//!
//! Which proof system suits a signature depends on this ratio. A hash-based
//! STARK gets hashing natively and must simulate `mod q`; a lattice-based
//! system (LaBRADOR/LaZer) gets `mod q` natively and must simulate hashing.
//! See `Strategy_weekly` note 2026-08-26-lattice-proofs-for-lattice-signatures.

use dilithium_stark::N;

/// FIPS 204 Table 1, ML-DSA-65: the matrix A is k x l.
/// Declared here because `dilithium-stark` exposes only Q and N.
const K: usize = 6;
const L: usize = 5;

/// SHAKE128 rate in bytes — one permutation per squeezed block.
const SHAKE128_RATE: usize = 168;
/// SHAKE256 rate in bytes.
const SHAKE256_RATE: usize = 136;

fn main() {
    println!("# ML-DSA-65 (Dilithium3) verification cost axes");
    println!("k={K}, l={L}, n={N}, q=8380417\n");

    // ---- axis 1: Keccak permutations -------------------------------------
    //
    // ExpandA: k*l polynomials, each rejection-sampled from SHAKE128. Each
    // coefficient consumes 3 bytes; rejection rate is (2^23 - q)/2^23, so the
    // expected byte draw is 3n / acceptance.
    let acceptance = 8_380_417.0 / 8_388_608.0; // q / 2^23
    let bytes_per_poly = (3.0 * N as f64 / acceptance).ceil();
    let perms_per_poly = (bytes_per_poly / SHAKE128_RATE as f64).ceil();
    let expand_a_perms = (K * L) as f64 * perms_per_poly;

    // mu = H(tr || M) and c~' = H(mu || w1Encode): SHAKE256.
    // w1Encode for ML-DSA-65 is k * 128 bytes (4 bits per coefficient).
    let w1_bytes = K * N / 2;
    let mu_perms = ((64.0 + 32.0) / SHAKE256_RATE as f64).ceil();
    let ctilde_perms = ((64.0 + w1_bytes as f64) / SHAKE256_RATE as f64).ceil();
    // SampleInBall expands c~ into the challenge polynomial.
    let sample_in_ball_perms = 1.0;

    let total_perms = expand_a_perms + mu_perms + ctilde_perms + sample_in_ball_perms;

    println!("## axis 1 — Keccak permutations");
    println!("  ExpandA ({} polys x {} perms) : {}", K * L, perms_per_poly, expand_a_perms);
    println!("  mu = H(tr || M)                : {mu_perms}");
    println!("  c~' = H(mu || w1Encode)        : {ctilde_perms}");
    println!("  SampleInBall                   : {sample_in_ball_perms}");
    println!("  TOTAL                          : {total_perms}");

    // ---- axis 2: modular multiplications ---------------------------------
    //
    // A NTT over n=256 is (n/2)*log2(n) = 1024 butterflies, each one
    // multiply-add mod q.
    let butterflies_per_ntt = (N / 2) * (N.trailing_zeros() as usize);

    // Verification: NTT(z) for l polys, NTT(c), NTT(t1), the k*l pointwise
    // products of A o z, and INTT of the k result polys.
    let ntt_z = L * butterflies_per_ntt;
    let ntt_c = butterflies_per_ntt;
    let ntt_t1 = K * butterflies_per_ntt;
    let pointwise_az = K * L * N;
    let pointwise_ct1 = K * N;
    let intt_w = K * butterflies_per_ntt;

    let total_mulmod = ntt_z + ntt_c + ntt_t1 + pointwise_az + pointwise_ct1 + intt_w;

    println!("\n## axis 2 — multiplications mod q");
    println!("  NTT(z), l={L}                  : {ntt_z}");
    println!("  NTT(c)                         : {ntt_c}");
    println!("  NTT(t1), k={K}                 : {ntt_t1}");
    println!("  pointwise A o z (k*l*n)        : {pointwise_az}");
    println!("  pointwise c o t1 (k*n)         : {pointwise_ct1}");
    println!("  INTT(w), k={K}                 : {intt_w}");
    println!("  TOTAL                          : {total_mulmod}");

    // ---- the ratio -------------------------------------------------------
    println!("\n## the ratio that decides the proof system");
    println!("  mod-q ops per Keccak permutation : {:.0}", total_mulmod as f64 / total_perms);
    println!("\n  For comparison, SLH-DSA-SHA2-128s verification is");
    println!("  2,174 permutations and no field arithmetic at all.");
}
