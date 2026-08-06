//! M3 PoC: linking the SPHINCS+ hash DAG with a LogUp global lookup.
//!
//! See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §9.5. M2 established that full
//! SLH-DSA verification is a DAG, not a chain, so M1's positional chaining
//! constraints do not generalise. This crate implements the replacement —
//! a cross-table LogUp argument proving that **every digest consumed as a
//! hash input was produced by some hash** — and measures what it costs, using
//! the real DAG of a real signature verification.

pub mod bound;
pub mod keccak_link;
pub mod link;
pub mod stark;
pub mod tables;
pub mod witness;

#[cfg(test)]
mod tests {
    use crate::stark::{prove_linked, verify_linked, FriSettings};
    use crate::tables::{build_tables, tamper_consumer};

    use core::convert::Infallible;
    use sphincs_m2::dag::build_dag;
    use sphincs_m2::hash::shake256_parts;
    use sphincs_m2::verify::slh_verify;

    use slh_dsa::{Shake128s, SigningKey, VerifyingKey};

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

    /// Real signature -> real verification -> real hash DAG.
    fn real_dag_tables(seed: u64) -> crate::tables::Tables {
        let msg = format!("quantum shield prover attestation {seed}");
        let mut rng = ShakeRng::new(seed);
        let sk = SigningKey::<Shake128s>::new(&mut rng);
        let vk: VerifyingKey<Shake128s> = sk.as_ref().clone();
        let sig = signature::Signer::sign(&sk, msg.as_bytes());

        let out = slh_verify(msg.as_bytes(), &sig.to_bytes(), b"", &vk.to_bytes());
        assert!(out.valid, "oracle signature must verify");

        let dag = build_dag(&out.trace);
        build_tables(&out.trace, &dag)
    }

    /// The DAG of a real verification must link: the global LogUp sum is zero
    /// and the batch proof verifies.
    #[test]
    fn links_a_real_verification_dag() {
        let tables = real_dag_tables(1);
        assert!(tables.stats.edges > 1000, "expected a substantial DAG");

        let linked = prove_linked(tables.producer, tables.consumer, FriSettings::fast());
        verify_linked(&linked).expect("a consistent DAG must verify");
    }

    /// A fabricated input digest — one that no hash produced — must break the
    /// argument. This is the property M1's positional constraints gave us for
    /// a chain and that the DAG needs a lookup to recover.
    #[test]
    fn rejects_a_fabricated_consumed_digest() {
        let mut tables = real_dag_tables(2);
        tamper_consumer(&mut tables, 0);

        let linked = prove_linked(tables.producer, tables.consumer, FriSettings::fast());
        assert!(
            verify_linked(&linked).is_err(),
            "a consumed digest that was never produced must be rejected"
        );
    }

    /// Tampering a producer's multiplicity must also be caught: the prover
    /// cannot under- or over-declare how often an output is used.
    #[test]
    fn rejects_wrong_producer_multiplicity() {
        use crate::link::{DIGEST_LIMBS, WIDTH};
        use p3_field::PrimeCharacteristicRing;

        let mut tables = real_dag_tables(3);
        // Find a producer row that is actually used, and inflate its count.
        let row = (0..tables.stats.calls)
            .find(|&r| tables.producer.values[r * WIDTH + DIGEST_LIMBS] != crate::link::F::ZERO)
            .expect("some output is consumed");
        tables.producer.values[row * WIDTH + DIGEST_LIMBS] += crate::link::F::ONE;

        let linked = prove_linked(tables.producer, tables.consumer, FriSettings::fast());
        assert!(
            verify_linked(&linked).is_err(),
            "an inflated usage count must be rejected"
        );
    }

    // ---------------------------------------------------------------------
    // Bound configuration: the Keccak table *is* the producer (§10.4-1)
    // ---------------------------------------------------------------------

    /// A consistent DAG whose digests come out of the Keccak trace must verify.
    #[test]
    fn binds_digests_to_the_keccak_trace() {
        use crate::bound::{prove_bound, verify_bound};
        use crate::tables::build_bound_tables;
        use crate::witness::fors_tree_witness;

        let settings = FriSettings::fast();
        let trace = fors_tree_witness(0x42, 1234);
        let dag = build_dag(&trace);
        let tables = build_bound_tables(&trace, &dag, settings.log_blowup);

        assert_eq!(tables.stats.edges, sphincs_m2::params::A);

        let linked = prove_bound(tables.keccak, tables.consumer, settings);
        verify_bound(&linked).expect("digests read from the Keccak trace must link");
    }

    /// The point of the binding: a consumed digest that no *proven
    /// permutation* produced is rejected. In the standalone PoC a prover
    /// could have added a producer row for it; here there is nowhere to put
    /// one, because producer rows are Keccak output columns.
    #[test]
    fn rejects_a_digest_no_permutation_produced() {
        use crate::bound::{prove_bound, verify_bound};
        use crate::tables::{build_bound_tables, tamper_bound_consumer};
        use crate::witness::fors_tree_witness;

        let settings = FriSettings::fast();
        let trace = fors_tree_witness(0x11, 77);
        let dag = build_dag(&trace);
        let mut tables = build_bound_tables(&trace, &dag, settings.log_blowup);
        tamper_bound_consumer(&mut tables, 0);

        let linked = prove_bound(tables.keccak, tables.consumer, settings);
        assert!(
            verify_bound(&linked).is_err(),
            "a digest outside the Keccak trace must be rejected"
        );
    }

    /// A digest may only be published on a permutation's final round row,
    /// where the output state is valid. Publishing mid-permutation violates
    /// the AIR and is caught while proving.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_a_digest_published_off_the_final_round() {
        use crate::bound::prove_bound;
        use crate::keccak_link::{COL_IS_DIGEST, WIDTH as KWIDTH};
        use crate::tables::build_bound_tables;
        use crate::witness::fors_tree_witness;
        use p3_field::PrimeCharacteristicRing;

        let settings = FriSettings::fast();
        let trace = fors_tree_witness(0x33, 5);
        let dag = build_dag(&trace);
        let mut tables = build_bound_tables(&trace, &dag, settings.log_blowup);

        // Row 0 is a permutation's *first* round, not its last.
        tables.keccak.values[COL_IS_DIGEST] = crate::link::F::ONE;
        assert_eq!(tables.keccak.values.len() % KWIDTH, 0);

        prove_bound(tables.keccak, tables.consumer, settings);
    }

    /// Multiplicity may only be declared where a digest is published, so
    /// padding rows cannot smuggle terms into the argument.
    #[cfg(debug_assertions)]
    #[test]
    #[should_panic(expected = "constraints had nonzero value")]
    fn rejects_multiplicity_without_a_published_digest() {
        use crate::bound::prove_bound;
        use crate::keccak_link::{COL_MULT, WIDTH as KWIDTH};
        use crate::tables::build_bound_tables;
        use crate::witness::fors_tree_witness;
        use p3_field::PrimeCharacteristicRing;

        let settings = FriSettings::fast();
        let trace = fors_tree_witness(0x55, 9);
        let dag = build_dag(&trace);
        let mut tables = build_bound_tables(&trace, &dag, settings.log_blowup);

        // Last row of the padded trace: a padding permutation, no digest.
        let last = tables.keccak.values.len() / KWIDTH - 1;
        tables.keccak.values[last * KWIDTH + COL_MULT] = crate::link::F::ONE;

        prove_bound(tables.keccak, tables.consumer, settings);
    }
}
