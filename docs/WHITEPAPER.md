# Quantum Shield: Post-Quantum Asset Protection Protocol

## Technical Whitepaper v1.0 — April 2026

---

## Abstract

Quantum Shield is the first production-ready, application-layer protocol that protects Ethereum smart contract assets against quantum computing threats using **dual NIST-standardized post-quantum signature schemes** — ML-DSA (FIPS 204, Dilithium) and SLH-DSA (FIPS 205, SPHINCS+).

Unlike proposals to modify Ethereum's consensus layer, Quantum Shield provides quantum-safe protection **today** through a 3-layer defense architecture combining cryptographic hardness, economic security (Prover Pool with quadratic slashing), and temporal security (24-hour time locks).

**Live Demo**: [quantum-shield.xyz](https://quantum-shield.xyz)
**Source Code**: [github.com/kota1026/quantum-shield](https://github.com/kota1026/quantum-shield)

---

## 1. The Quantum Threat

### 1.1 Timeline

| Date | Event |
|------|-------|
| Aug 2024 | NIST publishes final PQ standards (FIPS 203, 204, 205) |
| 2025-2028 | US federal agencies required to transition (Executive Order 14110) |
| ~2028 | Ethereum Foundation's estimated PQ upgrade timeline |

### 1.2 The Gap

Between now and Ethereum's protocol-level quantum upgrade, **all ECDSA-secured assets are vulnerable** to:

- **Harvest Now, Decrypt Later (HNDL)** — adversaries collecting transaction data for future quantum decryption
- **Key Extraction** — deriving private keys from exposed public keys
- **Signature Forgery** — quantum-forged ECDSA signatures enabling unauthorized transfers

### 1.3 Scale

- **$2.5T+** in smart contract TVL uses ECDSA
- **$20B+** in institutional custody relies on ECDSA-based wallets
- **Zero** production-ready application-layer PQ protection exists on Ethereum

---

## 2. Architecture

### 2.1 Three-Layer Defense Model

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: L1 Vault (Ethereum)                            │
│ ├── Immutable smart contract holding locked assets      │
│ ├── SPHINCS+ (SLH-DSA, FIPS 205) on-chain verification │
│ ├── 24-hour time lock for normal unlocks                │
│ └── 7-day emergency recovery path                       │
├─────────────────────────────────────────────────────────┤
│ Layer 2: L3 Aegis (Off-chain BFT Consensus)             │
│ ├── Dilithium (ML-DSA, FIPS 204) signature verification │
│ ├── Gas-free signature operations (93% cost reduction)  │
│ ├── Byzantine Fault Tolerant 4-node consensus           │
│ └── State Root computation via SHA3-256                 │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Prover Pool (Decentralized Operators)          │
│ ├── VRF-based random Prover selection (Chainlink)       │
│ ├── Quadratic Slashing (N² penalty for collusion)       │
│ ├── Economic stake as security bond                     │
│ └── Observer challenge mechanism for fraud detection    │
└─────────────────────────────────────────────────────────┘
```

> **Phase 1 disclosure (2026-04-11)**: In the current Sepolia deployment, the
> Prover Pool role is operated by an **AI Prover Agent** that uses an Anthropic
> Claude model to compute a confidence score for each unlock request. If the
> confidence score is ≥ 0.99, the agent signs with a real FIPS 205 SLH-DSA-SHAKE-128s
> key pair; otherwise the request is escalated. The cryptography is real, but
> the signing decision is LLM-driven. Phase 2 replaces this with HSM-bound
> human operators (or rule-based automation with governance approval). See
> [`docs/ACTUAL_STATE.md`](./ACTUAL_STATE.md) for the full Phase 1 vs Phase 2
> matrix.

### 2.2 Dual Post-Quantum Algorithms

| Algorithm | NIST Standard | Layer | Security Basis | Performance |
|-----------|--------------|-------|----------------|-------------|
| **ML-DSA-65 (Dilithium)** | FIPS 204 | L3 (off-chain) | Lattice-based | 1.2ms verify, 3.3KB sig |
| **SLH-DSA (SPHINCS+)** | FIPS 205 | L1 (on-chain) | Hash-based | Slower, theoretically unbreakable |

**Why two?** Defense in depth. If lattice-based cryptography is compromised, the hash-based SPHINCS+ layer remains secure.

### 2.3 Cryptographic Policy (CP-1)

| Allowed | Forbidden (application layer) |
|---------|------------------------------|
| NIST FIPS 204 ML-DSA-65 | ECDSA |
| SHA3-256 | keccak256 |
| SPHINCS+ (FIPS 205) | Pre-FIPS algorithms |

---

## 3. Core Protocol

### 3.1 Lock Flow

User generates Dilithium keypair in-browser (WASM) → signs lock request → L3 verifies and computes State Root → submits to L1 Vault → assets locked on-chain.

### 3.2 Normal Unlock (24h Time Lock)

User signs unlock → L3 verifies → VRF selects 2 random Provers → Provers co-sign with SPHINCS+ → 24h time lock → Auto-Claim releases assets.

> **Phase 1 note**: VRF falls back to `block.prevrandao` when the Chainlink VRF
> contract is not configured, and the Prover signing step is performed by the
> AI Prover Agent (see §2.1 disclosure). When fewer than 2 active Provers are
> available, the unlock request returns `InsufficientProvers` (HTTP 503) rather
> than silently falling back to a placeholder address.

### 3.3 Emergency Unlock (7-day)

User deposits bond (min 0.5 ETH or 5%) → 7-day time lock → if unchallenged, assets released + bond returned.

> **Phase 1 note**: Emergency bond is currently *calculated and displayed* but
> **not collected on-chain**. The full bond collection / challenge / slashing
> pipeline ships in Phase 2. Users see the bond requirement in the response,
> but no ETH actually leaves their wallet during emergency unlock as of
> 2026-04-11.

### 3.4 Challenge & Quadratic Slashing

Observers detect fraud → submit challenge → if valid, Prover slashed N² (quadratic penalty). Makes collusion exponentially expensive.

> **Phase 1 note**: The slashing calculation (`N² × 10%`) is implemented and
> tested, and the L1 `ProverRegistry.slash()` call is wired. However, the
> current implementation treats the L1 write as "best-effort" — if the
> on-chain call fails, the slashing is recorded in the backend database but
> not on L1. Batch 2 of the 2026-04-11 spec-drift fix introduces fail-hard
> semantics + a retry queue so this silent failure cannot persist.

---

## 4. Token Economics (QS)

### veQS (Voting Escrow)
Lock QS tokens (1-4 years) → receive veQS → governance voting + reward multiplier.

### Reward Distribution
| Recipient | Share |
|-----------|-------|
| Provers | 40% |
| veQS Holders | 30% |
| Observers | 10% |
| Insurance Fund | 10% |
| Treasury | 10% |

---

## 5. Implementation Status

**Phase 1** is the current Sepolia deployment (2026-04-11) with honest operational
trade-offs documented in [`docs/ACTUAL_STATE.md`](./ACTUAL_STATE.md).
**Phase 2** targets the same feature surface but replaces every Phase 1 bridge
with a production-grade implementation.

| Component | Phase 1 (now) | Phase 2 (target) |
|-----------|---------------|-------------------|
| L1 Smart Contracts (Sepolia) | Deployed & verified, `_verifySimplified` identity gate | Full FIPS 205 on-chain verification (`useFullVerification=true`) |
| L3 Governance Contracts (Arbitrum Sepolia) | 12 contracts deployed | Live voting via wagmi frontend |
| Backend API (Rust/Axum) | 202 endpoints, PostgreSQL, config-driven time-locks with production guards | Same + Token Hub L3 writes, slashing fail-hard + retry queue |
| Frontend (Next.js) | 11 apps, 175+ pages, Phase 1 disclosure badges | Real Governor data, VRF status badges, bond collection UI |
| WASM Signature Module | ML-DSA-65 keygen/sign/verify in browser | Same |
| Dilithium + SPHINCS+ Integration | Real FIPS 204 / 205 via `@noble/post-quantum` + `slh-dsa` Rust crate | Same + external audit |
| Prover Pool | **AI Prover Agent (Claude-assisted confidence scoring + real SLH-DSA signing)** | HSM-bound human operators OR rule-based with governance approval |
| VRF Prover Selection | Chainlink VRF v2.5 when configured, `block.prevrandao` fallback | Chainlink VRF v2.5 always |
| Emergency Bond | Calculated & displayed only | Collected on-chain + slashing on failed challenges |
| Token Hub Reward Claim | DB-only write (Phase 8-D placeholder) | L3 `RewardRouter.claimReward()` with auth context |

---

## 5.5. The Convergence Pattern (added v3, 2026-04-27)

Quantum Shield's core architecture — **off-chain dual signature + on-chain SR₀ commitment + Prover Pool attestation** — was originally designed for asset custody. Strategic re-evaluation in April 2026 revealed that the same pattern resolves a structurally identical problem in cross-chain bridges:

### Bridge problem (2025–2026 reality)

- $2.8B+ stolen from bridges since 2021; $3B in H1 2025 alone (Web3's largest single attack surface).
- Every leading bridge depends on ECDSA / Schnorr.
- Direct PQ adoption is impractical: an ML-DSA signature is ~3,300 bytes; multiplied by N guardians and Ethereum calldata pricing, the per-swap cost reaches several USD on L1.
- No major bridge publishes a PQ roadmap.

### Convergence: same pattern, different domain

| Custody (current) | Bridge (proposed via the same pattern) |
|---|---|
| User signs lock with ML-DSA-65 | Source-chain message signed with ML-DSA-65 |
| Off-chain backend computes SR₀ = SHA3-256(params ‖ pk) | Off-chain bridge relayer computes SR₀ over the source message |
| 32-byte SR₀ stored on L1 vault | 32-byte SR₀ stored on destination chain |
| Prover Pool (VRF-selected) co-signs SLH-DSA on unlock | Bridge guardians (= Prover Pool members) co-sign SLH-DSA on dest-chain release |
| Quadratic slashing on observer challenge | Same slashing curve secures bridge guardians |
| 24h time-lock + 7d emergency path | Configurable per source/destination pair |

### Implication

The same SR₀/SR₁ pipeline + Prover Pool runtime that protects user funds today is the **architecture-level answer** to the bridge security crisis. Quantum Shield's strategic positioning therefore expands from _"PQ custody on Ethereum"_ to _**"the PQ-Secure Custody-Bridge Convergence Pattern"**_.

The Q2–Q3 2026 roadmap (see `docs/intelligence/STRATEGY_2026-04-27_v3.md`) includes a 3-chain bridge demo (Track 6) and outreach to bridge protocols and institutional custodians (Tracks 7 + 8) to validate this pattern beyond custody.

### Three-Tier Moat under Constitution v2

| Tier | Asset | Strategic posture |
|---|---|---|
| 1. Cryptography (ML-DSA / SLH-DSA / NTT impls) | Adopt EIP-8051 / EIP-7885 / EIP-8141 when shipped |
| 2. Pattern (SR₀/SR₁ + Prover Pool + VRF) | License as SDK + reference implementation |
| 3. Network (EF/NIST channels, operational record, RFP relationships) | Primary durable moat |

Constitution v2 (`docs/CONSTITUTION_v2_DRAFT.md`) introduces **CP-6 (Network Principle)** to formalize this layering.

---

## 6. Comparison

| Feature | Quantum Shield | AA-based PQ | Consensus PQ |
|---------|---------------|-------------|-------------|
| Available today | ✅ | ❌ | ❌ (2028+) |
| No protocol changes | ✅ | Partial | ❌ |
| Dual PQ algorithms | ✅ | ❌ | TBD |
| Economic security | ✅ | ❌ | ❌ |
| Gas-efficient | ✅ (93% savings) | ❌ | N/A |

---

## 7. Roadmap

| Phase | Timeline | Milestones |
|-------|----------|-----------|
| Beta (Current) | Q1-Q2 2026 | Sepolia testnet, 11 apps, core flows |
| Convergence Validation | Q2 2026 | EF Grant, arxiv draft, 3-chain bridge demo, EIP-8141/8051 readiness spike |
| Security Audit | Q2-Q3 2026 | External audit, VRF production |
| Mainnet Alpha | Q3 2026 | Ethereum mainnet, limited TVL |
| Mainnet Production | Q4 2026 | Full mainnet, multi-chain |
| Institutional | 2027 | HSM, enterprise API, compliance |
| Bridge / Custodian Partnerships | 2027+ | Pattern-license pilots, M&A conversations (see Strategy v3) |

---

## References

1. NIST FIPS 204 — ML-DSA (2024)
2. NIST FIPS 205 — SLH-DSA (2024)
3. Vitalik Buterin, "How to hard-fork to save most users' funds in a quantum emergency" (2024)
4. NIST PQ Standardization Process (2016-2024)

---

*© 2026 Quantum Shield*
