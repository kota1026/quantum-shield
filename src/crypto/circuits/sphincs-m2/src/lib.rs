//! M2: SLH-DSA-SHAKE-128s full verification circuit witness.
//!
//! The verification core (`params`, `adrs`, `hash`, `verify`) is `no_std` +
//! `alloc`, so it compiles for a bare-metal RISC-V target and can be dropped
//! into a zkVM guest unchanged — see `docs/core/STARK_AIR_GAP_ANALYSIS.md`
//! §19.4, where running this verification directly inside a zkVM came out
//! 228x cheaper than verifying our own STARK proof of it. `dag` needs a hash
//! map and is therefore gated behind the default `std` feature; a guest needs
//! the verdict, not the witness DAG.
//!
//! See `docs/core/STARK_AIR_GAP_ANALYSIS.md` (G1/G7, milestone M2). Extends
//! M1 (`sphincs-m1`, a single WOTS+ chain) to the complete FIPS 205
//! verification path — FORS, the WOTS+ layer, and the d=7 hypertree —
//! recording every Keccak-f[1600] permutation so the AIR trace and the
//! reference implementation are the same code path.

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub mod adrs;
#[cfg(feature = "std")]
pub mod dag;
pub mod hash;
pub mod keccak;
pub mod params;
pub mod public_values;
pub mod registry;
pub mod threshold;
pub mod verify;

#[cfg(test)]
mod tests {
    use crate::hash::shake256_parts;
    use crate::params::*;
    use crate::verify::slh_verify;

    use core::convert::Infallible;
    use slh_dsa::{Shake128s, SigningKey, VerifyingKey};

    /// Deterministic test RNG: `SHAKE256(seed ‖ counter)`. Only used to make
    /// the oracle's key generation reproducible across runs.
    struct ShakeRng {
        seed: u64,
        counter: u64,
        buf: Vec<u8>,
        pos: usize,
    }

    impl ShakeRng {
        fn new(seed: u64) -> Self {
            Self { seed, counter: 0, buf: Vec::new(), pos: 0 }
        }

        fn next_byte(&mut self) -> u8 {
            if self.pos >= self.buf.len() {
                self.buf = shake256_parts(
                    &[&self.seed.to_le_bytes(), &self.counter.to_le_bytes()],
                    128,
                    None,
                );
                self.counter += 1;
                self.pos = 0;
            }
            let b = self.buf[self.pos];
            self.pos += 1;
            b
        }
    }

    impl rand_core::TryRng for ShakeRng {
        type Error = Infallible;

        fn try_next_u32(&mut self) -> Result<u32, Infallible> {
            let mut b = [0u8; 4];
            self.try_fill_bytes(&mut b)?;
            Ok(u32::from_le_bytes(b))
        }

        fn try_next_u64(&mut self) -> Result<u64, Infallible> {
            let mut b = [0u8; 8];
            self.try_fill_bytes(&mut b)?;
            Ok(u64::from_le_bytes(b))
        }

        fn try_fill_bytes(&mut self, dst: &mut [u8]) -> Result<(), Infallible> {
            for slot in dst.iter_mut() {
                *slot = self.next_byte();
            }
            Ok(())
        }
    }

    impl rand_core::TryCryptoRng for ShakeRng {}

    /// Build a keypair + signature with the independent RustCrypto
    /// implementation, and return the raw bytes our verifier consumes.
    fn oracle_case(seed: u64, msg: &[u8]) -> (Vec<u8>, Vec<u8>) {
        let mut rng = ShakeRng::new(seed);
        let sk = SigningKey::<Shake128s>::new(&mut rng);
        let vk: VerifyingKey<Shake128s> = sk.as_ref().clone();

        let sig = signature::Signer::sign(&sk, msg);
        (vk.to_bytes().to_vec(), sig.to_bytes().to_vec())
    }

    /// The independent implementation's own sizes must match FIPS 205 Table 2
    /// — this also guards against accidentally testing a different parameter
    /// set than the one the L1 contracts assume.
    #[test]
    fn oracle_sizes_match_parameter_set() {
        let (pk, sig) = oracle_case(1, b"quantum shield");
        assert_eq!(pk.len(), PK_BYTES);
        assert_eq!(sig.len(), SIG_BYTES, "SLH-DSA-SHAKE-128s signature is 7856 bytes");
    }

    /// Our verifier must accept signatures produced by an independently
    /// written FIPS 205 implementation. This is the M2 correctness criterion
    /// (a self-consistency test would not catch a shared misreading of the
    /// spec).
    #[test]
    fn accepts_independent_implementation_signatures() {
        for seed in 0..3u64 {
            let msg = format!("message {seed}");
            let (pk, sig) = oracle_case(seed, msg.as_bytes());
            let out = slh_verify(msg.as_bytes(), &sig, b"", &pk);
            assert!(out.valid, "seed {seed}: valid signature must verify");
            assert!(!out.trace.is_empty());
        }
    }

    /// Empty and long messages exercise the H_msg block boundary.
    #[test]
    fn accepts_empty_and_long_messages() {
        for msg in [vec![], vec![0xABu8; 5000]] {
            let (pk, sig) = oracle_case(9, &msg);
            assert!(slh_verify(&msg, &sig, b"", &pk).valid);
        }
    }

    /// Every tampering class must be rejected.
    #[test]
    fn rejects_tampered_inputs() {
        let msg = b"quantum shield";
        let (pk, sig) = oracle_case(7, msg);
        assert!(slh_verify(msg, &sig, b"", &pk).valid);

        // Tampered message.
        assert!(!slh_verify(b"quantum shielc", &sig, b"", &pk).valid);

        // Tampered randomizer R (changes the digest, hence every index).
        let mut bad = sig.clone();
        bad[0] ^= 1;
        assert!(!slh_verify(msg, &bad, b"", &pk).valid);

        // Tampered FORS signature.
        let mut bad = sig.clone();
        bad[N + 5] ^= 1;
        assert!(!slh_verify(msg, &bad, b"", &pk).valid);

        // Tampered hypertree signature (last layer's auth path).
        let mut bad = sig.clone();
        let last = bad.len() - 1;
        bad[last] ^= 1;
        assert!(!slh_verify(msg, &bad, b"", &pk).valid);

        // Tampered public key root.
        let mut bad_pk = pk.clone();
        bad_pk[PK_BYTES - 1] ^= 1;
        assert!(!slh_verify(msg, &sig, b"", &bad_pk).valid);

        // Wrong context.
        assert!(!slh_verify(msg, &sig, b"ctx", &pk).valid);
    }

    /// The permutation count must match the structural prediction, and must
    /// be stable across signatures: WOTS+ chain lengths vary with the digest,
    /// so only the total is expected to move within a narrow band.
    #[test]
    fn permutation_count_matches_structure() {
        let msg = b"quantum shield";
        let (pk, sig) = oracle_case(3, msg);
        let out = slh_verify(msg, &sig, b"", &pk);
        assert!(out.valid);

        // Fixed cost: H_msg (1) + FORS trees (k * (1 + a)) + FORS T_k (3)
        //           + per layer: T_len (5) + h' tree hashes (9), d layers.
        let fixed = 1 + K * (1 + A) + 3 + D * (5 + H_PRIME);
        // Variable cost: WOTS+ chains, sum over all d*len chains of
        // (w - 1 - digit) F calls, so between 0 and d*len*(w-1).
        let max_variable = D * LEN * (W as usize - 1);

        let total = out.trace.len();
        assert!(
            total >= fixed && total <= fixed + max_variable,
            "total {total} outside [{fixed}, {}]",
            fixed + max_variable
        );
        // Sanity: the expected average is fixed + d*len*(w-1)/2 ≈ 2077.
        assert!((1500..2700).contains(&total), "unexpected total {total}");
    }

    /// The DAG that M3 has to link: most hash inputs are produced internally,
    /// and the external ones are exactly the signature/public-key values.
    #[test]
    fn dag_structure_of_a_real_verification() {
        use crate::dag::build_dag;

        let msg = b"quantum shield";
        let (pk, sig) = oracle_case(11, msg);
        let out = slh_verify(msg, &sig, b"", &pk);
        assert!(out.valid);

        let dag = build_dag(&out.trace);
        assert_eq!(dag.calls, out.trace.calls.len());
        assert_eq!(dag.edges.len() + dag.external_inputs, dag.total_inputs);

        // Every hypertree/FORS node hash consumes one internal value and one
        // external auth sibling, and every chain step after the first is
        // internal — so internal edges must dominate but not be everything.
        assert!(dag.edges.len() > dag.external_inputs / 2, "too few internal edges");
        assert!(dag.external_inputs > 0, "auth paths and signatures are external");

        // Acyclicity by construction: a producer always precedes its consumer.
        for e in &dag.edges {
            assert!(e.producer < e.consumer);
        }

        // No output is consumed more often than the structure allows.
        assert!(dag.usage_counts().iter().all(|&c| c <= 2));
    }
}
