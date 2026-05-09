<!-- Status: DRAFT — founder must review every slide before any external send -->

# Quantum Shield — Pitch Deck V1 Outline

**Status: DRAFT — founder must review every slide before any external send**

Version: 2026-05-09 (W19)
Prepared by: qs-investor-relations (L4 agent)
Target audiences: Robot Ventures, Variant, SBI Holdings, Mistletoe (Taizo Son)
Language: English (Japanese deck to follow separately)
Tone target: institutional-grade. No superlatives, no market-size projections not grounded in cited sources.

---

## Slide 1: Hook — The Clock Is Running

**Elevator (30 sec):** A cryptographically relevant quantum computer is not a 2035 problem. Three hardware milestones in the last 18 months have moved the credible threat window to 2027–2030 — and regulators in the US, EU, and Japan have already set compliance deadlines that expire before that window.

**Content:**

- Google Willow (Dec 2024): demonstrated below-threshold quantum error correction — the qualitative inflection point the field had been waiting for.
- Microsoft/Atom Computing "Magne": 50 logical qubits operational Q1 2027. IBM Nighthawk targets 120 qubits with 10x error-correction speedup by EOY 2026.
- Regulatory deadlines already in force: NSA CNSA 2.0 requires PQC for national-security systems by 2033–2035; EU DORA (effective Jan 2025) mandates crypto-agility for financial institutions; JFSA crypto-asset guidance incorporates NISC PQC transition direction; OMB M-23-02 sets 2027 for US critical infrastructure.
- The threat for long-lived custody control keys is **online forgery**, not harvest-now-decrypt-later. Governance keys, multisig roots, and recovery seeds that remain valid for years are the actual exposure.

**Speaker note:** Do NOT open with "harvest-now-decrypt-later" (HNDL) FUD. Sophisticated CISOs at the target funds know HNDL does not apply to short-lived custody authorizations; leading with it signals weak threat modeling. Lead with regulatory deadlines and long-lived key forgery risk. The W19 strategy memo (Threat agent) flags this explicitly.

---

## Slide 2: Problem — MPC Custodians Have a Gap They Cannot Fill Internally

**Elevator (30 sec):** Every major institutional custodian today is built on MPC or HSM-backed ECDSA. They know PQC is coming. None of them has shipped it. Building PQC in-house means re-designing signing ceremonies from scratch — and no single-family PQC scheme has the regulator-approved audit trail that a compliance officer can sign off on today.

**Content:**

- Fireblocks, BitGo, Anchorage, SBI VC Trade, bitFlyer: zero indexed job postings contain "post-quantum", "ML-DSA", "FIPS 204", "Dilithium", or "SPHINCS+" as of W19 2026. PQC commitment exists at the blog and advisory-board level only (source: W19 job-posting scan, `docs/intelligence/discovery/W19-job-postings.md`).
- Coinbase CEO publicly committed to "quantum-proof" custody by late 2026 (April 2026 advisory council). No PQC-specific hiring line exists yet — the gap between stated ambition and execution capacity is measurable.
- Fireblocks blog (2026): "PQC is a strategic priority … we are actively building our roadmap." Explicitly frames PQC as additive on top of MPC, not a replacement. This is the integration wedge.
- The compliance gap: NIST FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) are final standards (published August 2024). An institution that cannot demonstrate NIST-aligned PQC signing by 2027 has a regulatory audit problem, not just a roadmap problem.

**Speaker note:** Do not overstate the urgency at Japanese custodians specifically. The W19 job-posting scan showed zero PQC hiring signal from SBI VC Trade and bitFlyer — this is a market-readiness signal (early), not proof of demand. Present it as "the window is open, not yet crowded."

---

## Slide 3: Insight — The Composable Layer Wedge

**Elevator (30 sec):** Quantum Shield does not replace MPC custody. It is the attestation layer that MPC custodians plug into to claim NIST-compliant PQC signing — without re-architecting their existing infrastructure.

**Content:**

- MPC distributes *key material risk* across co-signers. Quantum Shield distributes *algorithm risk* across two mathematically independent NIST families (lattice + hash). The two compose naturally.
- Custodians keep their existing signing infrastructure. QS provides the PQC attestation primitive: an on-chain cryptographic commitment (SR₀) that any auditor or regulator can verify, with a SPHINCS+ co-signature quorum for withdrawal authorization.
- The wedge is positioning, not just technology: "PQC attestation layer" maps directly to the compliance checklist item DORA/CNSA 2.0/JFSA auditors will ask about. A custodian that integrates QS can answer "yes, we have NIST FIPS 204/205 compliant PQC signing in production" without a multi-year re-architecture.
- Japan is the NIST-bloc APAC anchor. China's BSN mandates SM2/SM3 successors; Japan, Korea, Taiwan, ASEAN, and EU sit on the NIST side. Being JP-domiciled, NIST-aligned, and EVM-native is a distribution moat that US-coastal competitors cannot cheaply replicate (source: qs-compete W19, `docs/intelligence/strategy/2026-W19/qs-compete.md`).

**Speaker note:** This is the single most important strategic reframe from the W19 memo (decision #3 for the founder). The deck stands or falls on whether this wedge is credible. If a VC challenges "can't Fireblocks just build this?", the answer is: yes they can, and they are — but they are 18 months behind on shipping, and they will want an integration partner, not an in-house rebuild, because PQC is not their core product. Do not oversell exclusivity.

---

## Slide 4: Product — ML-DSA-65 + SLH-DSA Dual Signature Protocol

**Elevator (30 sec):** Two NIST-final algorithms, two independent mathematical families, one on-chain custody flow — shipped on Ethereum Sepolia today.

**Content:**

- **Hot path — ML-DSA-65 (FIPS 204, lattice-based):** User signs every lock request. Validated off-chain in the Rust/Axum backend. SR₀ = SHA3-256(lock_params + pk_dilithium) stored on L1 at ~200k gas — solving the on-chain gas barrier (direct ML-DSA-65 verification: ~15.5M gas, exceeding block limit).
- **Cold path — SLH-DSA / SPHINCS+ (FIPS 205, stateless hash-based):** A VRF-selected quorum of Provers co-sign withdrawal authorization. Hash-based security is independent of lattice assumptions — if one family is broken, the other holds.
- **Security model:** 24-hour time-lock on all withdrawals; 7-day emergency time-lock with 0.5 ETH bond; quadratic slashing for Prover misbehavior. Emergency path is SPHINCS+ cold-storage attestation; normal path is ML-DSA-65 hot signing.
- **Marketing lead is ML-DSA-65 + crypto-agility**, not dual-sig complexity. The dual-signature architecture is engineering hygiene and regulatory depth. Compliance buyers understand "FIPS 204 certified"; they do not need to follow the dual-family argument on first contact.

**Speaker note:** Founders decision #6 (W19 memo): drop dual-sig as marketing centerpiece; lead with ML-DSA-65. On this slide, mention both, but sequence them as "ML-DSA-65 for daily operations, SPHINCS+ for defense-in-depth" — not as co-equal selling points. SENSITIVE: do not quote gas numbers as a benchmark claim without confirming they remain accurate on current Sepolia testnet.

---

## Slide 5: Architecture — SR₀/SR₁ State Root Design

**Elevator (30 sec):** The SR₀/SR₁ state root pattern is Quantum Shield's core technical innovation: it makes NIST-final PQC signatures affordable on current Ethereum without waiting for hardware precompiles.

**Content:**

- **Three-layer architecture:** L1 (Ethereum Sepolia, chain 11155111) holds the custody vault and SPHINCS+ verifier on-chain. L3 (Arbitrum Sepolia, chain 421614, deployed 2026-03-03) handles governance, VRF prover selection, and reward economics. Backend (Rust/Axum) handles ML-DSA-65 validation and SR₀ computation off-chain.
- **SR₀ = SHA3-256(lock_params + pk_dilithium):** Only the 32-byte commitment is stored on L1 at ~200k gas. Full PQC signature validation lives off-chain — making the system compatible with current Ethereum block limits today.
- **SR₁ = withdrawal authorization:** Requires 2-of-N SPHINCS+ co-signatures from a VRF-selected Prover quorum, verified on-chain by the deployed `SPHINCSVerifier` contract (`0xD090b5A6…0103`, Sepolia).
- **EIP-8141 and NTT precompile readiness:** Architecture anticipates Vitalik's 4-year PQC roadmap (Feb 2026). When the ETH2030 NTT precompile at `0x15` reaches testnet, QS can shift ML-DSA-65 validation on-chain without re-architecting the custody flow.

**Speaker note:** Reference the lock flow sequence diagram in `docs/grants/architecture/QS_LOCK_FLOW_diagram.md` as the basis for any visual on this slide. Recommend founder exports the Mermaid diagram to PNG for the actual deck. Do not present the three-layer structure as finalized production — it is deployed on testnets, not mainnet.

---

## Slide 6: Demand Signal — Regulators Are Pulling, Custodians Are Unprepared

**Elevator (30 sec):** The gap between regulatory mandates and custodian PQC readiness is widening in real time. That gap is the addressable market.

**Content:**

- **Regulatory pull (named mandates):** NSA CNSA 2.0 (2033–2035 deadline for national-security systems); EU DORA (crypto-agility mandate, in force Jan 2025); JFSA crypto-asset guidance incorporating NISC PQC direction; OMB M-23-02 (2027 critical-infrastructure deadline). Any custodian serving US, EU, or JP institutional clients faces at least one of these.
- **Corporate commitment gap (demand signal):** Coinbase CEO: "quantum-proof custody by late 2026" (April 2026 advisory paper). Fireblocks: "PQC is a strategic priority … actively building our roadmap" (2026 blog). Neither has indexed PQC job postings. Execution capacity lags stated ambition by at least 12–18 months.
- **Japan signal:** SBI VC Trade and bitFlyer show zero PQC hiring signal (W19 scan). JFSA regulatory pressure exists. Japan-based custodians will need a compliance answer before a domestic competitor or regulator forces the question.
- **Quantum-resistant token market cap reached $9.37B in 2026** (cited in EF ESP application, `docs/grants/EF_ESP_APPLICATION.md`). Institutional demand is measurable, not speculative.

**Speaker note:** The W19 discovery scan (`docs/intelligence/discovery/W19-job-postings.md`) also flags a disconfirming signal: zero PQC keywords in eight custodian job postings. Present both the demand signal and the early-market caveat honestly. Do not imply signed LOIs or customer commitments. SENSITIVE — this slide requires founder approval before sharing; no customer names have confirmed interest.

---

## Slide 7: Competitive — One Shipped Protocol, Many Roadmaps

**Elevator (30 sec):** Every competitor is either on a different chain, building only one NIST family, or still at the whitepaper stage. Quantum Shield is the only deployed dual-NIST-family custody protocol on Ethereum today.

**Content:**

- **PQShield:** Hardware-focused (AWS/Google PQ-HSM partnerships); no blockchain-specific HSM, no on-chain custody product. Partnership opportunity, not direct competitor.
- **SandboxAQ:** Enterprise PQC consulting and SDK. Not a protocol; not on-chain; not custody. Complements enterprise sales motion QS could partner with, not displace.
- **QRL 2.0:** Hash-only (XMSS/SPHINCS+); separate L1 — not Ethereum-compatible. Single-family algorithm risk. Testnet V2 Q1 2026, audit-ready but liquidity-trapped on its own chain.
- **StarkNet:** Hash-only (STARK proofs marketed as PQ-secure); user signatures remain ECDSA. No custody product.
- **EIP-8141 reference implementations (in progress):** Account-abstraction primitives only — no lock/unlock flow. Quantum Shield is the custody layer these implementations assume but do not provide.
- **Fireblocks/BitGo (MPC incumbents):** Distribution moat, no PQC shipped. Framing in their own docs is "PQC additive on top of MPC" — which is exactly the QS integration proposition.

**Speaker note:** The competitive matrix is sourced from qs-compete W19 and the EF ESP application. Do not imply that any named competitor has approached QS for partnership discussions. Adjust the framing per audience: Paradigm will ask about the technical moat; SBI will ask about the Japan regulatory moat; Robot Ventures and Variant will ask about distribution. The one-liner for each competitor above is designed to be defensible under technical questioning — do not embellish.

---

## Slide 8: Traction — What Is Shipped Today

**Elevator (30 sec):** This is not a whitepaper. Six smart contracts are live on public testnets. All nine core protocol sequences are implemented. An EF ESP grant application is in review.

**Content:**

- **Deployed contracts:** L1Vault (`0x07012aeF…7260`, Sepolia), ProverRegistry (`0x08e1fc1A…8946`, Sepolia), SPHINCSVerifier (`0xD090b5A6…0103`, Sepolia); CoreLayer, veQS, Governor, QSToken, SecurityCouncil on Arbitrum Sepolia (deployed 2026-03-03).
- **Protocol sequences implemented (9 of 9):** Consumer Lock, Normal Unlock, Emergency Unlock, Prover Registration, Observer Challenge, Slashing, Governance Proposal, Emergency Pause, Token Hub (veQS). All implemented in Rust/Axum backend + Next.js frontend with full-stack E2E test coverage.
- **EF Ecosystem Support Program (ESP) Track A application submitted 2026-05-11** (pending confirmation). Positions QS as reference custody integration for the EF Post-Quantum Security team's $2M research prize program. Application cites live Sepolia deployment as empirical gas/latency benchmark.
- **Audit-ready codebase:** NIST FIPS 204/205 compliant, open source (MIT), with Playwright E2E tests. Rust backend compiles without stubs or fallback data.

**Speaker note:** SENSITIVE — the ESP application submission date (2026-05-11) requires founder confirmation that the application was actually submitted. Do not present this as "submitted" until the founder confirms. The "9 of 9 sequences implemented" claim is sourced from `docs/grants/EF_ESP_APPLICATION.md` — founder should verify this is current against `docs/ACTUAL_STATE.md` before the deck is shown externally. Do not add customer counts, transaction volumes, or revenue figures that are not in the source documents.

---

## Slide 9: Team — Solo Founder, Japan-Based, Full-Stack PQC

**Elevator (30 sec):** One person built the complete protocol stack — L1 contracts, Rust backend, ML-DSA-65 implementation, frontend, test suite. The founding constraint is the moat: no committee, no architectural debt from multiple opinions.

**Content:**

- **Kota Kato — Founder and Lead Developer:** Full-stack blockchain developer with background in cryptographic protocol design. Built all six deployed contracts, the Rust/Axum backend, NIST FIPS 204 ML-DSA-65 implementation in Rust, and the Next.js/i18n frontend independently.
- **Japan-based, JP-regulated rails:** Direct access to JFSA regulatory discourse, Japan ETH community (Fracton, Stake Technologies), and NTT/NEC research network. JP domicile is a distribution asset for the JFSA/NISC compliance angle — not replicable by US-coastal teams.
- **Grants pipeline:** EF ESP Track A in review. Potential extensions: NEDO Quantum Technology EOI (June 公募), JIC strategic alignment, 防衛装備庁 (Defense Procurement Agency) EOI. Grants backstop runway independent of VC timing.
- **Agentic operating model (internal advantage):** Daily autonomous research across NIST/EIP/arxiv signals, weekly strategy synthesis, and competitive monitoring — operating at a velocity inconsistent with the headcount.

**Speaker note:** Solo founder is both the strongest and most scrutinized data point. Investors will ask about bus-factor risk. The prepared answer: (a) the codebase is open source and MIT-licensed, (b) the agentic operating model creates institutional memory that survives any single contributor, (c) the hire plan triggered by grant/VC close is a security audit partner + one cryptography engineer. Do not present the agentic operating model as a replacement for human team — it is an operating leverage tool. SENSITIVE: team slide requires founder approval on how much to disclose about the agent infrastructure; some institutional investors may find it novel, others may find it off-putting.

---

## Slide 10: Business Model — Licensing and Integration Revenue, Not Token

**Elevator (30 sec):** Quantum Shield's revenue model is institutional software licensing and integration fees. There is no token sale, no retail speculation layer, and no dependency on crypto market conditions for the core custody product.

**Content:**

- **Primary revenue stream — attestation SDK licensing:** Custodians and exchanges license the PQC attestation layer as a compliance module. Pricing model is SaaS per-seat or per-custody-seat, anchored to the custodian's AUM tier. (Specific pricing: TBD — requires buyer-call validation from W19 discovery calls.)
- **Secondary revenue stream — integration services:** Custom integration engineering for custodians that want QS deployed into their existing MPC infrastructure. One-time fees plus ongoing support retinue.
- **Not a token business (for institutional buyers):** The QS protocol has an internal governance token (veQS) for Prover/Observer incentives, but the B2B custody product does not require institutional buyers to hold or trade tokens. The token layer is explicitly separated from the compliance layer in all institutional-facing materials.
- **Japan regulatory fit:** JFSA and FSA permit licensing arrangements for cryptographic software providers. The non-token B2B model is the path of least resistance through Japanese financial institution procurement.

**Speaker note:** The business model is a hypothesis at W19. The W19 strategy memo explicitly deferred pricing validation to buyer-discovery calls (5 calls by 2026-05-17). Do not quote pricing figures or ARR projections — none exist in any source document. For Variant/Robot Ventures (Web3-native), acknowledge the veQS governance layer exists but explain the separation. For SBI Holdings/Mistletoe, lead with the licensing model and the FSA-compatible framing. SENSITIVE: any revenue projections or unit economics must be founder-approved before inclusion.

---

## Slide 11: Milestones and Ask

**Elevator (30 sec):** The next 12 months have four concrete gates: security audit, one named pilot, mainnet deployment, and SDK general availability. The ask funds those gates.

**Content:**

- **Q2 2026 (current):** ESP grant decision; 5 buyer-discovery calls completed; Phase 1 Consumer Lock E2E fully integrated (FE→BE→DB→L1); competitive matrix published.
- **Q3 2026:** Security audit (Trail of Bits or OpenZeppelin target); first named institutional pilot integration agreement (non-binding); SPHINCS+ gas optimization below 5M gas target.
- **Q4 2026:** Attestation SDK alpha release; NTT precompile (`0x15`) integration prototype (if ETH2030 reaches Holesky); NEDO/JIC grant EOI submitted.
- **Q1 2027:** Mainnet deployment on Ethereum L1; SDK general availability; second institutional pilot.
- **The ask:** [AMOUNT — SEE OPEN QUESTIONS] Pre-seed / Seed round. Use of proceeds: security audit ($40k), 12 months development ($80k), infrastructure ($15k), PQC precompile research ($15k). (Figures sourced from EF ESP budget as a baseline — require founder confirmation for VC ask sizing.)

**Speaker note:** SENSITIVE — the ask amount and round structure are the most sensitive items in this deck. See "Open Questions for Founder" below. Do not present a specific dollar figure without founder confirmation. The milestone sequencing above is drawn from the EF ESP application phases — founder should verify against current `docs/INTEGRATION_METHODOLOGY_v2.md` before the deck is shown externally. The "named institutional pilot" milestone in Q3 is aspirational; the W19 memo sets 5 buyer calls as the pre-condition for any pilot discussion.

---

## Slide 12: Contact and Next Step

**Elevator (30 sec):** The founder takes all relationship calls personally. This deck is the artifact; the conversation is where conviction is built.

**Content:**

- **Kota Kato** — Founder, Quantum Shield
- GitHub: `github.com/kota1026/quantum-shield` (open source, MIT)
- Live testnet: `quantum-shield.xyz`
- EF ESP application: on file (Track A, Cryptography wishlist)
- **Proposed next step for each target fund:**
  - Robot Ventures / Variant: 30-minute technical call; founder demos the live lock flow on Sepolia.
  - SBI Holdings: Introduction via Japan ETH community or JFSA-adjacent network; compliance angle first.
  - Mistletoe (Taizo Son): Quantum + AI thesis alignment; Japan domicile; solo-founder narrative.
- No cold outreach to any VC until founder confirms readiness and intro path.

**Speaker note:** This slide is a placeholder. Founder owns all relationship decisions, all call scheduling, all emails sent. The agent's role ends with this outline. Intro paths for SBI and Mistletoe likely require a warm introduction — founder should identify who in the Japan ETH / VC community can make that introduction before targeting either fund. Robot Ventures and Variant are more accessible via cold outreach or AngelList/Twitter DM given their pre-seed / seed stage and crypto-native posture.

---

## Open Questions for Founder

Five items only the founder can decide. These must be resolved before any slide is sent externally.

1. **Ask amount and round structure:** What is the pre-seed / seed raise target? Is this a SAFE, convertible note, or priced round? The EF ESP application budget ($150k) is a grant baseline, not a VC ask — the VC ask is almost certainly a different number. This determines whether Slide 11 is credible.

2. **Named lead investor preference:** Is there a preferred lead for this round — or is the strategy to run a parallel process across all four target funds? The answer changes the sequencing of outreach and whether the deck is customized per fund or sent as-is.

3. **Cap table disclosure:** Are there any existing investors, SAFEs, convertible notes, grants with equity provisions, or advisor warrants that a VC will see in diligence? The cap table must be disclosed before any term sheet conversation. Currently marked SENSITIVE — founder-only.

4. **Pilot / LOI status:** Do any of the 5 buyer-discovery calls (W19 target) produce a non-binding expression of interest or pilot agreement? If yes, this replaces Slide 6's "demand signal" framing with named traction — the single most impactful deck upgrade available. If no, the deck is presented as pre-commercial.

5. **Team disclosure level for the agentic operating model:** The agentic infrastructure (6 L1 strategy agents, daily-plan workflow, L4 front-of-house agents) is a genuine operational differentiator but an unusual story for institutional VCs. Does the founder want to reference it on the team slide, mention it only if asked, or omit it entirely from external materials? This is a judgment call on audience sophistication and narrative risk.

---

*This outline is a draft artifact produced by the qs-investor-relations agent (L4). Founder makes all relationship decisions, all calls, and all external sends. No part of this document should be shared with any third party without explicit founder review and approval of each slide.*

*Sources: `docs/intelligence/strategy/2026-W19.md`, `docs/grants/EF_ESP_APPLICATION.md`, `docs/grants/architecture/QS_LOCK_FLOW_diagram.md`, `docs/intelligence/discovery/W19-job-postings.md`, `docs/intelligence/strategy/2026-W19/qs-compete.md`, `.claude/charter.md`, `.claude/rules/blockchain.md`*
