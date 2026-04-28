# Post-Quantum Verifier Roadmap

_Last updated: 2026-04-27_
_Owner: Kota Kato_
_Audience: Sherlock auditors, EF Post-Quantum Security team, prospective VCs_

## Why this document exists

Quantum Shield's whitepaper claims **dual NIST signature verification** (ML-DSA
+ SPHINCS+) on Ethereum. Phase 1 ships with a *simplified* SPHINCS+ verifier
(`_verifySimplified()` in `src/contracts/l1/Vault.sol`) that checks SHA3 hash
non-zero rather than running the full FIPS 205 verification path. This document
explains why, when it changes, and what guarantees hold in the meantime.

## Current state (Phase 1)

| Component | Implementation | Notes |
|---|---|---|
| ML-DSA-65 verification | Off-chain in Rust backend (`src/api/api/src/crypto/`), full FIPS 204 via `@noble/post-quantum` | Production-grade |
| SR₀/SR₁ commitment | On-chain SHA3-256, 32 bytes per lock | Production-grade |
| SPHINCS+ verification | `_verifySimplified()` non-zero hash gate on L1 | **Phase 1 placeholder** |
| Off-chain SPHINCS+ verify | Full FIPS 205 in Rust (`sphincs_service.rs`) | Real verification, just not on L1 |
| L1 SPHINCS+ Verifier contract | Deployed at `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` | Standalone, not yet wired into `Vault.sol` |

**Concrete guarantee today**: an unlock requires (a) a real ML-DSA-65 user
signature verified by the backend, (b) a real SPHINCS+ Prover co-signature
verified off-chain in `sphincs_service.rs`, (c) the 24h/7d time-lock, and
(d) the on-chain SR₀ commitment. The L1 contract treats SPHINCS+ as a hash
commitment rather than a full cryptographic verification.

**What this means for an attacker**: forging an unlock requires forging both
the off-chain SPHINCS+ check and the on-chain SR commitment. Compromise of one
is insufficient. The simplified L1 verifier reduces *defense-in-depth*, not
*defense*. Documented for honesty, not for hiding.

## Why we did not ship full on-chain SPHINCS+ at launch

A full FIPS 205 SPHINCS+-128s verification on L1 costs **>30M gas** with the
current EVM instruction set, exceeding the Ethereum block gas limit (30M).
Direct on-chain verification is **physically impossible today** — not a
prioritization choice. Three credible paths exist; we are pursuing the third.

| Path | Status | Why we are not taking it |
|---|---|---|
| (1) Wait for general gas limit increase | Won't ship | Block size is governed by node-operator economics, not us |
| (2) Move SPHINCS+ to L2 with cheaper gas | Possible | Ties our security model to a single L2; loses Ethereum L1 settlement guarantees |
| (3) **ZK proof of SPHINCS+ verification + L1 verifier contract** | **Active path** | Achievable; aligns with EF's $20M Protocol Snarkification initiative |

## Phase 2 plan

### Milestone 2.1 — ZK SPHINCS+ Verifier (target: Q3 2026)

- Implement SPHINCS+-128s verification as an arithmetic circuit
- Toolchain: `sp1` (zkVM, RISC-V Rust) for prototype; investigate `risc0` and
  hand-written Halo2 circuit for production
- Estimated proof size: ~64 KB; estimated verifier gas: <500k
- Deliverable: `src/contracts/l1/verifiers/SphincsZkVerifier.sol` with a
  Groth16 / Plonk verifier and `verifyZkProof(proof, publicInputs)` entry point

### Milestone 2.2 — NTT precompile (`0x15`) integration (target: when ETH2030 → mainnet-shadow)

- ETH2030 devnet (Feb 2026) ships 13 PQ-related precompiles, including NTT at `0x15`
- Once on Holesky / mainnet-shadow, ML-DSA-65 verification can move on-chain at <2M gas
- Quantum Shield will be the **first production custody protocol** to wire into NTT
- Deliverable: `src/contracts/l1/verifiers/NttMlDsaVerifier.sol`; update `Vault.sol`
  to call NTT verifier instead of trusting backend ML-DSA result via SR₀

### Milestone 2.3 — EIP-8141 alignment (target: when EIP-8141 reaches Final)

- EIP-8141 (Vitalik-backed, March 2026) defines EOA signature-scheme switching
  via account abstraction
- New module: `src/contracts/l1/adapters/Eip8141Adapter.sol` — wraps `Vault.lock()`
  with an 8141 scheme identifier so Quantum Shield locks are drop-in compatible
  with future 8141 EOAs
- New backend module: `src/api/api/src/crypto/scheme_registry.rs` — enum of
  `MlDsa65 | SphincsPlus | Eip8141Scheme(u32)` so signature verification routing
  is data-driven
- Deliverable: a lock created today is migratable to EIP-8141 EOA control
  without any per-record migration

### Milestone 2.4 — Slashing / VRF closure (in flight)

- ✅ **Slashing fail-hard** (Batch 2, completed 2026-04-XX): `L1SlashStatus` enum
  + `slashing_retry_service.rs` retry loop; no more `best-effort` warn-only
- ✅ **AI Prover demoted to advisory** (2026-04-27): see `docs/governance/AI_ADVISORY_ROLE.md`
- ⬜ **VRF**: replace `block.prevrandao` fallback with Chainlink VRF v2.5 mandatory mode (target: Phase 2.4)
- ⬜ **Token Hub L3 claim**: replace `"caller"` literal with SIWE wallet, wire L3 RewardRouter (target: Phase 3, deferred)

## Audit-time framing

When external review examines the SPHINCS+ verifier:

1. **Phase 1 is a labeled placeholder, not undisclosed code.** This document
   and `docs/ACTUAL_STATE.md` ship in the repo and are linked from the EF
   grant application.
2. **No silent fallback.** The simplified verifier is invoked deterministically
   based on a contract constructor parameter; there is no "if (full fails) then
   simplified" path. An auditor can trace every unlock to one verifier path.
3. **Defense-in-depth is intact off-chain.** The full FIPS 205 verification
   runs in `sphincs_service.rs` for every unlock; an attacker bypassing it
   requires compromising the backend, the SR₀ commitment, and the time-lock
   simultaneously.
4. **Migration plan is committed in code, not just in docs.** The
   `SphincsZkVerifier.sol` and `Eip8141Adapter.sol` skeletons land in Phase 2.1
   so Sherlock can audit the *interface* now and the *implementation* on each
   milestone PR.

## Risk register

| Risk | Mitigation |
|---|---|
| ZK SPHINCS+ proof generation too slow for live unlocks | Generate proofs off-chain async; submit only at unlock-claim time |
| `sp1` / `risc0` toolchain immature for production | Halo2 hand-rolled circuit as fallback; sized `~6 person-months` if zkVM path fails |
| EIP-8141 spec mutates before Final | Keep core `Vault.sol` unchanged; mutate only the adapter |
| NTT precompile delayed past 2027 | ZK verifier path is independent — does not block Phase 2.1 |
| Sherlock raises critical on simplified verifier despite this doc | Pre-empt by submitting this doc + adapter skeletons with the Sherlock package |

## Sequencing constraint

Sherlock contest submission **does not require** ZK SPHINCS+ to be implemented.
It requires:

- This document in the repo (✅ as of 2026-04-27)
- The adapter / verifier skeleton interfaces committed (target: Week 5 of the 12-week plan)
- A signed commitment from the team to publish ZK verifier audit on completion

That sequence is what `docs/PROJECT_ACCELERATION_PLAN.md` Week 5-6 assumes.
