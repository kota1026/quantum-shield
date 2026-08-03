# threshold-m3 — M3 SPHINCS+ 2/N threshold verification composition

Statement: *at least t distinct provers whose SLH-DSA public keys are in the
registry set commitment C have valid signatures on message M* — the circuit
side of FR-THRESH-1 (with FR-THRESH-5's set commitment).

## Composition (2/5 demo, real fips205 keys and signatures)

Per signer:

| Component | Proofs | Source |
|-----------|-------:|--------|
| Full SLH-DSA-SHAKE-128s verification | 15 | M2d composition (`slhproof.rs`, library form of `slh-verify-m2d`) |
| Registry membership: SHA3-256 leaf hash + Merkle climb to C | 1 | `registry.rs` over the extended pipeline AIR |

## Design decisions

- **G2's aggregation layer is native, not circuit.** Threshold count, signer
  deduplication, and the identity glue (membership leaf = SHA3-256 of the
  same public key the signature composition verifies under) are checks over
  *public values* — signer identities are public in FR-THRESH-1. Under the
  public-glue architecture they are verifier-side comparisons; on-chain they
  become cheap public-input checks alongside the wrapped proofs (M0.5-C).
  Nothing secret flows between signatures, so no cross-signature circuit is
  needed.
- **SHA3-256 through the same pipeline AIR.** SHA3-256 shares Keccak-f[1600]
  and the 136-byte rate with SHAKE256; only the domain pad byte (0x06 vs
  0x1F) differs, and pads live in the public block bytes. `pipeline.rs` (v2)
  adds 32-byte value groups — masks/rates for lanes 0-3 and 4-7 and 32-byte
  chains c03/c47 from output lanes 0-3 — so 2-child SHA3-256 Merkle nodes
  H(left‖right) chain through the same constraint machinery as the 16-byte
  SHAKE256 tweakable hashes (still degree ≤ 3).
- **Registry**: N=5 provers, leaves = SHA3-256(PK.seed‖PK.root) padded to 8,
  height 3. FR-THRESH-5's on-chain commitment maintenance is a separate
  work item; this crate covers the in-circuit membership verification.

## Run

```bash
cargo run --release
```

- Registry setup: 5 real SLH-DSA-SHAKE-128s keypairs, commitment C.
- Honest 2/5: signers 1 and 3 sign M; per signer 15+1 proofs must accept;
  native checks (distinct, count ≥ t, final root == PK.root) must pass.
- Battery (all must reject): non-member signer under C, member using another
  leaf slot, forged registry root against an honest proof, duplicate signer
  set (native), below-threshold set (native), tampered member signature
  (native final-root check).

FRI parameters match M0..M2d (log_blowup=3, 100 queries, 16-bit PoW,
single-threaded).

Results feed `docs/core/STARK_AIR_GAP_ANALYSIS.md` §12.
