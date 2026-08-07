//! M3 PoC: linking the SPHINCS+ hash DAG with a LogUp global lookup.
//!
//! See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §9.5. M2 established that full
//! SLH-DSA verification is a DAG, not a chain, so M1's positional chaining
//! constraints do not generalise. This crate implements the replacement —
//! a cross-table LogUp argument proving that **every digest consumed as a
//! hash input was produced by some hash** — and measures what it costs, using
//! the real DAG of a real signature verification.

pub mod agg;
pub mod bound;
pub mod keccak_link;
pub mod link;
pub mod registry;
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

    // ---------------------------------------------------------------------
    // Three-table batch: the aggregation verdict is tied to the Keccak table
    // ---------------------------------------------------------------------

    /// The full verdict chain: a slot may claim `valid` only when it exhibits
    /// a hypertree root the Keccak table produced *and* a
    /// (public-key hash, `PK.root`) pair the Keccak table hashed.
    #[test]
    fn aggregation_verdict_binds_to_a_produced_root() {
        use crate::agg::{build_trace, Slot};
        use crate::bound::{prove_tables, verify_tables, Table};
        use crate::registry::{build_node_dag, pubkey_hash};
        use crate::tables::build_full_tables;
        use crate::witness::fors_tree_witness;

        let settings = FriSettings::fast();
        let mut trace = fors_tree_witness(0x42, 1234);
        let root_call = trace.calls.len() - 1;
        let root = trace.calls[root_call].output;

        // The registered public key is `PK.seed ‖ PK.root`; hashing it in the
        // same witness is what lets the slot bind its declared PK.root.
        let mut key = [0u8; 32];
        key[..16].copy_from_slice(&[0xAB; 16]);
        key[16..].copy_from_slice(&root);
        let pk_hash = pubkey_hash(&key, Some(&mut trace));

        let dag = build_dag(&trace);
        let node_dag = build_node_dag(&trace);

        let mut extra = vec![0u32; trace.calls.len()];
        extra[root_call] = 1;
        let pubkey_call = trace.node_calls.len() - 1;

        let tables = build_full_tables(
            &trace,
            &dag,
            &node_dag,
            settings.log_blowup,
            &extra,
            &[(pubkey_call, 1)],
        );

        let mut slots = vec![Slot::absent(); 64];
        slots[5] = Slot::verified_with_key(root, pk_hash);
        let (agg_trace, agg_pvs) = build_trace::<crate::link::F>(&slots);

        let bound = prove_tables(
            vec![
                Table::keccak(tables.keccak),
                Table::consumer(tables.consumer),
                Table::node_consumer(tables.node_consumer),
                Table::aggregation(agg_trace, agg_pvs),
            ],
            settings,
        );
        verify_tables(&bound).expect("a fully bound verdict must link");
    }

    /// Shared setup for the verdict tests: a FORS tree plus the hash of a
    /// public key whose `PK.root` is that tree's root.
    #[allow(clippy::type_complexity)]
    fn verdict_fixture() -> (
        crate::tables::FullTables,
        [u8; 16],
        [u8; 32],
    ) {
        use crate::registry::{build_node_dag, pubkey_hash};
        use crate::tables::build_full_tables;
        use crate::witness::fors_tree_witness;

        let settings = FriSettings::fast();
        let mut trace = fors_tree_witness(0x42, 1234);
        let root_call = trace.calls.len() - 1;
        let root = trace.calls[root_call].output;

        let mut key = [0u8; 32];
        key[..16].copy_from_slice(&[0xAB; 16]);
        key[16..].copy_from_slice(&root);
        let pk_hash = pubkey_hash(&key, Some(&mut trace));

        let dag = build_dag(&trace);
        let node_dag = build_node_dag(&trace);
        let mut extra = vec![0u32; trace.calls.len()];
        extra[root_call] = 1;
        let pubkey_call = trace.node_calls.len() - 1;

        let tables = build_full_tables(
            &trace,
            &dag,
            &node_dag,
            settings.log_blowup,
            &extra,
            &[(pubkey_call, 1)],
        );
        (tables, root, pk_hash)
    }

    fn prove_verdict(
        tables: crate::tables::FullTables,
        slots: &[crate::agg::Slot],
    ) -> Result<(), String> {
        use crate::agg::build_trace;
        use crate::bound::{prove_tables, verify_tables, Table};

        let settings = FriSettings::fast();
        let (agg_trace, agg_pvs) = build_trace::<crate::link::F>(slots);
        let bound = prove_tables(
            vec![
                Table::keccak(tables.keccak),
                Table::consumer(tables.consumer),
                Table::node_consumer(tables.node_consumer),
                Table::aggregation(agg_trace, agg_pvs),
            ],
            settings,
        );
        verify_tables(&bound)
    }

    /// The point of the wiring: a slot cannot claim a verdict over a root no
    /// permutation produced. Without this, `valid` was a free witness.
    #[test]
    fn rejects_a_verdict_over_an_unproduced_root() {
        use crate::agg::Slot;

        let (tables, mut root, pk_hash) = verdict_fixture();
        root[0] ^= 1; // a root the circuit never computed

        let mut slots = vec![Slot::absent(); 64];
        slots[5] = Slot::verified_with_key(root, pk_hash);

        assert!(
            prove_verdict(tables, &slots).is_err(),
            "a verdict over an unproduced root must be rejected"
        );
    }

    /// FR-THRESH-1(b), input side: a slot cannot pair a legitimately hashed
    /// public key with a `PK.root` of its choosing. `HASH_DAG` alone would
    /// not catch this, since it only matches produced digests.
    #[test]
    fn rejects_a_pk_root_that_is_not_in_the_hashed_key() {
        use crate::agg::Slot;

        let (tables, root, pk_hash) = verdict_fixture();

        let mut slots = vec![Slot::absent(); 64];
        // Both roots agree (so the verdict constraint holds) and the public
        // key hash is genuine — but this root is not the one inside that key.
        let mut other = root;
        other[0] ^= 1;
        slots[5] = Slot::verified_with_key(other, pk_hash);

        assert!(
            prove_verdict(tables, &slots).is_err(),
            "PK.root must be the one inside the hashed public key"
        );
    }

    // ---------------------------------------------------------------------
    // Registry Merkle chain, linked through MERKLE_DAG (32-byte values)
    // ---------------------------------------------------------------------

    /// A membership witness whose 32-byte chain is consistent must link:
    /// pubkey hash -> leaf -> node -> ... -> root.
    #[test]
    fn links_a_registry_membership_chain() {
        use crate::bound::{prove_tables, verify_tables, Table};
        use crate::registry::{
            build_node_dag, commit_members, compute_leaf, merkle_path, pubkey_hash,
            verify_membership, Member,
        };
        use crate::tables::build_registry_tables;
        use sphincs_m2::hash::PermTrace;

        let settings = FriSettings::fast();

        let members: Vec<Member> = (0..5)
            .map(|i| {
                let mut address = [0u8; 20];
                address[18..].copy_from_slice(&((0x1000 + i) as u16).to_be_bytes());
                let key = [i as u8 + 1; 32];
                Member { address, pubkey_hash: pubkey_hash(&key, None) }
            })
            .collect();
        let leaves: Vec<_> = members.iter().map(|m| compute_leaf(m, None)).collect();
        let (_, commitment) = commit_members(&members);
        let path = merkle_path(&leaves, 2);

        // Record the whole chain, starting from the public key itself.
        let mut trace = PermTrace::default();
        let key = [3u8; 32];
        let recomputed = pubkey_hash(&key, Some(&mut trace));
        assert_eq!(recomputed, members[2].pubkey_hash);
        assert!(verify_membership(
            &members[2],
            2,
            &path,
            5,
            &commitment,
            Some(&mut trace)
        ));

        let node_dag = build_node_dag(&trace);
        // pubkey hash + leaf + 3 tree levels
        assert_eq!(node_dag.calls, 5);
        // leaf consumes the pubkey hash; each level consumes the previous node
        assert_eq!(node_dag.edges.len(), 4);

        let tables = build_registry_tables(&trace, &node_dag, settings.log_blowup);
        let bound = prove_tables(
            vec![
                Table::keccak(tables.keccak),
                Table::node_consumer(tables.node_consumer),
            ],
            settings,
        );
        verify_tables(&bound).expect("a consistent registry chain must link");
    }

    /// A 32-byte value no permutation produced — e.g. a forged intermediate
    /// node — must break the chain.
    #[test]
    fn rejects_a_forged_registry_node() {
        use crate::bound::{prove_tables, verify_tables, Table};
        use crate::registry::{
            build_node_dag, commit_members, compute_leaf, merkle_path, pubkey_hash,
            verify_membership, Member,
        };
        use crate::tables::{build_registry_tables, tamper_node_consumer};
        use sphincs_m2::hash::PermTrace;

        let settings = FriSettings::fast();

        let members: Vec<Member> = (0..5)
            .map(|i| {
                let mut address = [0u8; 20];
                address[18..].copy_from_slice(&((0x1000 + i) as u16).to_be_bytes());
                let key = [i as u8 + 1; 32];
                Member { address, pubkey_hash: pubkey_hash(&key, None) }
            })
            .collect();
        let leaves: Vec<_> = members.iter().map(|m| compute_leaf(m, None)).collect();
        let (_, commitment) = commit_members(&members);
        let path = merkle_path(&leaves, 2);

        let mut trace = PermTrace::default();
        pubkey_hash(&[3u8; 32], Some(&mut trace));
        assert!(verify_membership(&members[2], 2, &path, 5, &commitment, Some(&mut trace)));

        let node_dag = build_node_dag(&trace);
        let mut tables = build_registry_tables(&trace, &node_dag, settings.log_blowup);
        tamper_node_consumer(&mut tables, 0);

        let bound = prove_tables(
            vec![
                Table::keccak(tables.keccak),
                Table::node_consumer(tables.node_consumer),
            ],
            settings,
        );
        assert!(
            verify_tables(&bound).is_err(),
            "a forged registry node must be rejected"
        );
    }
}
