# Quantum Shield Threat Model

_Last updated: 2026-04-28._
_Anchor: Quantinuum 94 protected logical qubits + 10⁻⁴ logical-gate error
(March 2026); Coinbase Independent Advisory Board paper (April 2026)._
_Audience: Sherlock auditors, EF Post-Quantum Security team, prospective VCs._

## Q-Day window

**Estimate: 8–12 years median, 5-year tail risk.**

The credible Q-Day estimate moved forward in March 2026 when Quantinuum
demonstrated 94 protected logical qubits with ~10⁻⁴ logical-gate error
([Quantum Insider](https://thequantuminsider.com/2026/03/10/quantinuum-researchers-demonstrates-quantum-computations-with-dozens-of-protected-logical-qubits/)).
That number alone does not run Shor's algorithm against secp256k1 — the
academic estimate for 24-hour factoring of RSA-2048 is approximately
2,300 logical qubits at 10⁻⁶ error, with ECDLP roughly 1.5× harder. But
the trajectory is the relevant variable: doubling logical-qubit count
every ~14 months projects a crypto-relevant scale into the
**2034–2038** range.

The "5-year tail" reflects two scenarios that compress the timeline:

1. A breakthrough in physical-qubit fidelity that reduces the
   physical-to-logical ratio below the current ~10:1 baseline.
2. An algorithmic improvement that reduces the logical-qubit count
   required for Shor on secp256k1 below current bounds.

Either event would move credible Q-Day inside the migration window for
Ethereum L1 custody. Custody migrations on a chain with 11M+ addresses
take 5+ years even with full protocol support. **The latest moment to
start migrating is materially earlier than the latest moment a CRQC
arrives.**

## Threat models in scope

### TM-1: Harvest-now-decrypt-later (HNDL) — primary threat

An adversary records on-chain transactions today (every signature is a
public reveal of structure under ECDSA) and stores ciphertext / public
keys against future quantum decryption. **Coinbase Advisory Board
(April 2026) flags 6.9M BTC** in pubkey-exposed wallets — a comparable
analysis on Ethereum yields ~30M+ ETH addresses with exposed pubkeys
from past transactions.

**Quantum Shield's mitigation**: a lock under Quantum Shield exposes
*no* ECDSA-derived public key — the lock is gated on ML-DSA-65 (FIPS
204) signature verification with the user-supplied Dilithium pubkey,
which has no known classical-or-quantum reduction. SR₀ commits to the
Dilithium pubkey on L1 without exposing it. HNDL on Quantum Shield
locks does not yield an offline crackable artifact.

### TM-2: Direct CRQC attack on Ethereum L1

A Cryptographically Relevant Quantum Computer (CRQC) is operational
and used to derive the private key from a publicly-known ECDSA pubkey
in time bounded by transaction propagation (~12 seconds per block).

**Quantum Shield's mitigation**: locks held by a CRQC-vulnerable EOA
are not protected by EOA security — they are protected by the L1Vault
contract's `executeUnlock` requirement, which demands ML-DSA-65 +
SPHINCS+ co-signatures regardless of who controls the EOA. An attacker
who derives an EOA's private key cannot unilaterally drain locks.

The asset is only at risk if both the user's Dilithium key *and* the
prover pool's SPHINCS+ keys are compromised. The latter is held by
distributed provers under economic stake (per SEQUENCES §4); the
former lives client-side in WASM with no on-chain reveal.

### TM-3: Single-algorithm break (NIST FIPS 204 or 205 individually)

A cryptanalytic advance breaks ML-DSA (lattice-based) but not
SPHINCS+ (hash-based), or vice versa.

**Quantum Shield's mitigation**: dual-NIST signatures. A successful
unlock requires *both* an ML-DSA-65 signature (user) *and* a SPHINCS+
co-signature (prover quorum). Breaking one family is insufficient. This
is the architectural invariant locked in by Seat 1 (Technical Architect)
in the 11-seat strategy council on 2026-04-28.

### TM-4: Supply-chain compromise of the PQ implementation

A compromised version of `pqcrypto-dilithium`, `@noble/post-quantum`,
or the SP1 zkVM toolchain produces signatures that look valid but
encode a side-channel.

**Mitigation**:

- Pinned exact versions in `Cargo.lock` and `pnpm-lock.yaml`,
  `--frozen-lockfile` enforced in CI.
- `cargo vet` and `pnpm audit` in the CI pipeline.
- Reference test vectors (KAT) shipped in `tests/fixtures/` are
  recomputed on every release to detect implementation drift.
- Constant-time assertions (`dudect`-style) in CI for the WASM SDK.

### TM-5: VRF / prover-selection manipulation

An attacker manipulates the random prover selection to route unlocks
through compromised provers.

**Status (pre-Sherlock)**: previously the `VRFConsumer.onlyVRFCoordinator`
modifier permitted any EOA to call `rawFulfillRandomWords` when the
coordinator was unset. Fixed 2026-04-28 (`VRFConsumer.sol:148-156`).
See `docs/security/PRE_SHERLOCK_BLOCKERS.md` CRITICAL-1.

**Mitigation**: production deployment requires a configured Chainlink
VRF v2.5 coordinator. The fix-fast modifier rejects all callbacks
when `vrfCoordinator == address(0)`.

### TM-6: Slashing-formula collapse via collusion-count bypass

If an adversary causes the slashing formula `N² × 10%` to evaluate
with `N=1` regardless of actual collusion, three colluding provers
are slashed at 10% instead of 90% — economic security collapses.

**Status (pre-Sherlock)**: `routes/challenge.rs:236` previously hardcoded
`colluding_count = 1u64`. Fixed 2026-04-28 by deriving the count from
`signing_queue` evidence. See CRITICAL-2 in
`docs/security/PRE_SHERLOCK_BLOCKERS.md`.

## Out-of-scope (Phase 1)

The following are known limitations and explicitly out of Sherlock
scope per `docs/ROADMAP_PQ_VERIFIER.md`:

- **L1 SPHINCS+ verification is simplified** (`_verifySimplified()` at
  `Vault.sol`). Full FIPS 205 verification on L1 is gas-prohibitive
  (>30M); migration is via SP1-based ZK proof in Phase 2 (target
  Q3 2026).
- **AI Prover service** is advisory-only since 2026-04-27; signing is
  gated by deterministic verification + human/HSM approval. See
  `docs/governance/AI_ADVISORY_ROLE.md`.
- **Token Hub L3 claim path** (`token_hub.rs`) currently uses a `caller`
  literal rather than the SIWE-authenticated wallet address. Internal
  DB-only; no fund movement risk. Deferred to Phase 3.

## Sherlock-scope assumptions block

For the Sherlock contest README, the following assumptions must be
explicit so wardens are not surprised:

1. The protocol assumes the L1Vault is the sole settlement authority.
   L3 (Aegis / Arbitrum Sepolia) is a coordination layer; compromise
   of L3 must not affect L1 funds.
2. The prover pool is assumed to have at most 33% Byzantine fraction
   under the Quadratic Slashing economic model (SEQUENCES §4.7).
3. The Q-Day window is taken as 2028–2030 lower bound. Any vulnerability
   that requires CRQC capability beyond ~150 LQ at 10⁻⁵ error is out of
   scope for this contest.
4. The dual-NIST commitment (TM-3 mitigation) is invariant. A finding
   that requires breaking both ML-DSA-65 and SPHINCS+-128s
   simultaneously is informational, not critical.
5. Sidechannel attacks against the WASM SDK in browser contexts are
   in scope; sidechannel attacks against the AI Prover advisory
   service are out of scope (it has no key material).

## References

- Coinbase Advisory Board paper, 2026-04-21–25.
  [coindesk.com](https://www.coindesk.com/tech/2026/04/21/coinbase-advisory-board-says-quantum-computing-threat-is-on-the-horizon-crypto-needs-a-plan)
- Quantinuum 94 protected logical qubits, 2026-03-10.
  [thequantuminsider.com](https://thequantuminsider.com/2026/03/10/quantinuum-researchers-demonstrates-quantum-computations-with-dozens-of-protected-logical-qubits/)
- NIST FIPS 204 (ML-DSA),
  [csrc.nist.gov/pubs/fips/204/final](https://csrc.nist.gov/pubs/fips/204/final).
- NIST FIPS 205 (SLH-DSA),
  [csrc.nist.gov/pubs/fips/205/final](https://csrc.nist.gov/pubs/fips/205/final).
- Trezor Safe 7 SLH-DSA-128 retail validation, 2026-04.
- arxiv 2510.09271 — PQC blockchain impact.
- arxiv 2512.13333 — Quantum Disruption SOK.
