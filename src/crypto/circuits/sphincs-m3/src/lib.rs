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

    /// One prover's complete witness: a FORS tree (standing in for the
    /// signature), the hash of its registered public key, and a one-member
    /// registry whose commitment covers it.
    struct Verdict {
        tables: crate::tables::FullTables,
        root: [u8; 16],
        pk_hash: [u8; 32],
        commitment: [u8; 32],
    }

    fn verdict_fixture(seed: u8, leaf_index: u32) -> Verdict {
        use crate::registry::{
            build_node_dag, compute_commitment_traced, compute_leaf, pubkey_hash, Member,
        };
        use crate::tables::build_full_tables;
        use crate::witness::fors_tree_witness;

        let settings = FriSettings::fast();
        let mut trace = fors_tree_witness(seed, leaf_index);
        let root_call = trace.calls.len() - 1;
        let root = trace.calls[root_call].output;

        // The registered public key is `PK.seed ‖ PK.root`.
        let mut key = [0u8; 32];
        key[..16].copy_from_slice(&[seed; 16]);
        key[16..].copy_from_slice(&root);
        let pk_hash = pubkey_hash(&key, Some(&mut trace));
        let pubkey_call = trace.node_calls.len() - 1;

        // A one-member registry: the tree needs no node hashes, so the root
        // is the leaf itself.
        let mut address = [0u8; 20];
        address[19] = seed;
        let member = Member { address, pubkey_hash: pk_hash };
        let leaf = compute_leaf(&member, Some(&mut trace));
        let commitment = compute_commitment_traced(&leaf, 1, Some(&mut trace));
        let commit_call = trace.node_calls.len() - 1;

        let dag = build_dag(&trace);
        let node_dag = build_node_dag(&trace);

        // The aggregation table consumes the hypertree root and the commitment.
        let mut extra_digest = vec![0u32; trace.calls.len()];
        extra_digest[root_call] = 1;
        let mut extra_node = vec![0u32; trace.node_calls.len()];
        extra_node[commit_call] = 1;

        let tables = build_full_tables(
            &trace,
            &dag,
            &node_dag,
            settings.log_blowup,
            &extra_digest,
            &extra_node,
            &[(pubkey_call, 1)],
            &[],
        );
        Verdict { tables, root, pk_hash, commitment }
    }

    fn prove_verdict(
        tables: crate::tables::FullTables,
        slots: &[crate::agg::Slot],
        commitment: &[u8; 32],
    ) -> Result<(), String> {
        use crate::agg::build_trace;
        use crate::bound::{prove_tables, verify_tables, Table};

        let settings = FriSettings::fast();
        let (agg_trace, agg_pvs) = build_trace::<crate::link::F>(slots, commitment);
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

    /// The full chain: signature root, registered public key, and the
    /// active-set commitment, all bound in one batch.
    #[test]
    fn aggregation_verdict_binds_the_whole_chain() {
        use crate::agg::Slot;

        let v = verdict_fixture(0x42, 1234);
        let mut slots = vec![Slot::absent(); 64];
        slots[5] = Slot::verified_with_key(v.root, v.pk_hash);

        prove_verdict(v.tables, &slots, &v.commitment).expect("a fully bound verdict must link");
    }

    /// A slot cannot claim a verdict over a root no permutation produced.
    #[test]
    fn rejects_a_verdict_over_an_unproduced_root() {
        use crate::agg::Slot;

        let v = verdict_fixture(0x42, 1234);
        let mut root = v.root;
        root[0] ^= 1;

        let mut slots = vec![Slot::absent(); 64];
        slots[5] = Slot::verified_with_key(root, v.pk_hash);

        assert!(
            prove_verdict(v.tables, &slots, &v.commitment).is_err(),
            "a verdict over an unproduced root must be rejected"
        );
    }

    /// FR-THRESH-1(b), input side: a slot cannot pair a legitimately hashed
    /// public key with a `PK.root` of its choosing.
    #[test]
    fn rejects_a_pk_root_that_is_not_in_the_hashed_key() {
        use crate::agg::Slot;

        let v = verdict_fixture(0x42, 1234);
        let mut other = v.root;
        other[0] ^= 1;

        let mut slots = vec![Slot::absent(); 64];
        slots[5] = Slot::verified_with_key(other, v.pk_hash);

        assert!(
            prove_verdict(v.tables, &slots, &v.commitment).is_err(),
            "PK.root must be the one inside the hashed public key"
        );
    }

    /// The commitment is a public input now: claiming a different active set
    /// than the one the circuit built is rejected.
    #[test]
    fn rejects_a_commitment_the_chain_did_not_produce() {
        use crate::agg::Slot;

        let v = verdict_fixture(0x42, 1234);
        let mut slots = vec![Slot::absent(); 64];
        slots[5] = Slot::verified_with_key(v.root, v.pk_hash);

        let mut wrong = v.commitment;
        wrong[0] ^= 1;

        assert!(
            prove_verdict(v.tables, &slots, &wrong).is_err(),
            "the public commitment must be the one the registry chain produced"
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
        // pubkey hash + leaf + 3 tree levels + the commitment
        assert_eq!(node_dag.calls, 6);
        // leaf consumes the pubkey hash, each level the previous node, and
        // the commitment the root
        assert_eq!(node_dag.edges.len(), 5);

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

    // ---------------------------------------------------------------------
    // Per-signature tables (§12.3-3): N signatures, N Keccak tables
    // ---------------------------------------------------------------------

    /// One signature's own witness: FORS tree, registered public key hash.
    struct SigWitness {
        tables: crate::tables::FullTables,
        root: [u8; 16],
        pk_hash: [u8; 32],
        member: crate::registry::Member,
    }

    /// Build a signature table whose public-key hash is consumed by a
    /// *separate* registry table.
    fn signature_witness(seed: u8, leaf_index: u32) -> SigWitness {
        use crate::registry::{build_node_dag, pubkey_hash, Member};
        use crate::tables::build_full_tables;
        use crate::witness::fors_tree_witness;

        let settings = FriSettings::fast();
        let mut trace = fors_tree_witness(seed, leaf_index);
        let root_call = trace.calls.len() - 1;
        let root = trace.calls[root_call].output;

        let mut key = [0u8; 32];
        key[..16].copy_from_slice(&[seed; 16]);
        key[16..].copy_from_slice(&root);
        let pk_hash = pubkey_hash(&key, Some(&mut trace));
        let pubkey_call = trace.node_calls.len() - 1;

        let dag = build_dag(&trace);
        let node_dag = build_node_dag(&trace);

        let mut extra_digest = vec![0u32; trace.calls.len()];
        extra_digest[root_call] = 1; // the aggregation table takes the root
        let mut extra_node = vec![0u32; trace.node_calls.len()];
        extra_node[pubkey_call] = 1; // the registry table's leaf takes the hash

        let tables = build_full_tables(
            &trace,
            &dag,
            &node_dag,
            settings.log_blowup,
            &extra_digest,
            &extra_node,
            &[(pubkey_call, 1)],
            &[],
        );

        let mut address = [0u8; 20];
        address[19] = seed;
        SigWitness {
            tables,
            root,
            pk_hash,
            member: Member { address, pubkey_hash: pk_hash },
        }
    }

    /// Two signatures with their **own** Keccak tables, plus a third table
    /// holding the shared registry they are both members of. The
    /// interactions are global, so a leaf in the registry table can consume a
    /// public-key hash produced in a signature table — which is what lets N
    /// signatures avoid one monolithic 65K-row trace (§9.4-2).
    #[test]
    fn two_signatures_share_a_registry_across_tables() {
        use crate::agg::{build_trace, Slot};
        use crate::bound::{prove_tables, verify_tables, Table};
        use crate::registry::{
            build_node_dag, compute_commitment_traced, compute_leaf, hash_node,
        };
        use crate::tables::build_full_tables;
        use sphincs_m2::dag::build_dag as build_digest_dag;
        use sphincs_m2::hash::PermTrace;

        let settings = FriSettings::fast();
        let a = signature_witness(0x11, 7);
        let b = signature_witness(0x22, 91);

        // The registry table: two leaves, one node, one commitment.
        let mut reg = PermTrace::default();
        let leaf_a = compute_leaf(&a.member, Some(&mut reg));
        let leaf_b = compute_leaf(&b.member, Some(&mut reg));
        let root = hash_node(&leaf_a, &leaf_b, Some(&mut reg));
        let commitment = compute_commitment_traced(&root, 2, Some(&mut reg));
        let commit_call = reg.node_calls.len() - 1;

        let reg_dag = build_digest_dag(&reg);
        let reg_node_dag = build_node_dag(&reg);
        let mut reg_extra_node = vec![0u32; reg.node_calls.len()];
        reg_extra_node[commit_call] = 1; // the aggregation table binds it

        let reg_tables = build_full_tables(
            &reg,
            &reg_dag,
            &reg_node_dag,
            settings.log_blowup,
            &[],
            &reg_extra_node,
            &[],
            &[a.pk_hash, b.pk_hash], // produced in the signature tables
        );

        let mut slots = vec![Slot::absent(); 64];
        slots[2] = Slot::verified_with_key(a.root, a.pk_hash);
        slots[40] = Slot::verified_with_key(b.root, b.pk_hash);
        let (agg_trace, agg_pvs) = build_trace::<crate::link::F>(&slots, &commitment);
        {
            use p3_field::PrimeCharacteristicRing;
            assert_eq!(agg_pvs[crate::agg::PV_VALID_COUNT], crate::link::F::from_u64(2));
        }

        let bound = prove_tables(
            vec![
                Table::keccak(a.tables.keccak),
                Table::consumer(a.tables.consumer),
                Table::node_consumer(a.tables.node_consumer),
                Table::keccak(b.tables.keccak),
                Table::consumer(b.tables.consumer),
                Table::node_consumer(b.tables.node_consumer),
                Table::keccak(reg_tables.keccak),
                Table::consumer(reg_tables.consumer),
                Table::node_consumer(reg_tables.node_consumer),
                Table::aggregation(agg_trace, agg_pvs),
            ],
            settings,
        );
        verify_tables(&bound).expect("a shared registry must link across tables");
    }

    /// A slot claiming a verdict for a signature that is not in the batch must
    /// fail: its root has no producer among the per-signature Keccak tables.
    #[test]
    fn rejects_a_slot_without_a_matching_signature_table() {
        use crate::agg::Slot;

        let v = verdict_fixture(0x11, 7);
        let mut slots = vec![Slot::absent(); 64];
        slots[2] = Slot::verified_with_key(v.root, v.pk_hash);
        slots[40] = Slot::verified_with_key(v.root, v.pk_hash);

        assert!(
            prove_verdict(v.tables, &slots, &v.commitment).is_err(),
            "a second verdict needs a second signature's producer"
        );
    }
}
