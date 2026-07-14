# Post-Quantum Competitive Landscape & External Environment Analysis

**Prepared for:** Quantum Shield (post-quantum asset custody protocol — dual NIST signatures Dilithium/ML-DSA-65 + SPHINCS+/SLH-DSA, Prover Pool, VRF, Time Lock; L1 Ethereum Sepolia, L3 Arbitrum-based)
**Date:** 2026-07-13
**Author:** Competitive research (external environment scan, 2025–2026 sources)

## Executive summary

Post-quantum cryptography (PQC) has crossed from research into deployment. The three core NIST standards Quantum Shield relies on — ML-KEM (FIPS 203), ML-DSA/Dilithium (FIPS 204) and SLH-DSA/SPHINCS+ (FIPS 205) — were finalized in August 2024, the FALCON-based FN-DSA (FIPS 206) is still in draft (expected ~2027), and a second "on-ramp" competition is narrowing toward Round 3. Government timelines are now concrete: NSA's CNSA 2.0 pushes national-security systems to phase out classical crypto by 2030–2033 and reach full quantum resistance by 2035. The threat itself remains years out — no cryptographically-relevant quantum computer (CRQC) exists and none is close — but expert surveys in 2025–2026 put the 10-year probability at its highest ever (~28–49%), and "harvest-now-decrypt-later" plus long-lived custodied assets make the risk actionable today. The competitive field is real but fragmented: dedicated PQ L1s (QRL/Zond, QANplatform, Cellframe, Abelian, Naoris), Bitcoin/Ethereum's own PQ migration roadmaps (BIP-360/361, Vitalik's Feb-2026 "Lean Ethereum" plan), and institutional custodians (Fireblocks, Ledger) beginning PQC audits. Quantum Shield's genuine differentiators are its **dual/hybrid signature redundancy** (lattice + hash-based, hedging a single-family break) and its **custody-specific mechanics** (prover pool, VRF, timelock) — but its single biggest strategic threat is Ethereum shipping native PQ account abstraction, which could erode the moat for a *separate* custody layer. The most defensible positioning is to be the PQ custody/policy layer that survives regardless of which base-chain migration path wins.

---

## 1. NIST / Standards landscape (current status)

### 1.1 The three finalized standards (the ones Quantum Shield uses)
On **13 August 2024** NIST published its first three PQC standards as final FIPS ([Federal Register](https://www.federalregister.gov/documents/2024/08/14/2024-17956/announcing-issuance-of-federal-information-processing-standards-fips-fips-203-module-lattice-based), [CSA](https://cloudsecurityalliance.org/blog/2024/08/15/nist-fips-203-204-and-205-finalized-an-important-step-towards-a-quantum-safe-future)):

| FIPS | Name | Derived from | Type | Quantum Shield relevance |
|------|------|--------------|------|--------------------------|
| **203** | ML-KEM | CRYSTALS-Kyber | Key encapsulation | (transport/session, not signatures) |
| **204** | ML-DSA | CRYSTALS-Dilithium | Lattice signature | **Primary signature** (ML-DSA-65) |
| **205** | SLH-DSA | SPHINCS+ | Stateless hash-based signature | **Secondary signature** |

Quantum Shield's dual-signature choice (ML-DSA-65 + SLH-DSA) is squarely inside the finalized, standardized set — a defensible, conservative posture rather than a bet on a draft or candidate scheme.

### 1.2 FIPS 206 (FN-DSA / FALCON)
Still a **draft**; the standard for the FALCON-derived FN-DSA is expected to be finalized around **2027** ([entangledfuture summary](https://entangledfuture.com/guides/nist-pqc-standards/)). FN-DSA is attractive for its compact signatures (~666 B at level 512) but harder to implement safely (floating-point Gaussian sampling), which is why it trailed the others. NIST also selected **HQC** (code-based KEM) for standardization on **11 March 2025** as a non-lattice backup to ML-KEM ([entangledfuture](https://entangledfuture.com/guides/nist-pqc-standards/)).

### 1.3 Additional-signature "on-ramp"
NIST is running a second competition specifically to diversify signature schemes beyond lattices ([NIST PQC-dig-sig](https://csrc.nist.gov/Projects/pqc-dig-sig/news)):
- **Round 2 (announced Oct 2024):** 14 candidates — CROSS, FAEST, HAWK, LESS, MAYO, Mirath, MQOM, PERK, QR-UOV, RYDE, SDitH, SNOVA, SQIsign, UOV ([NIST news](https://www.nist.gov/news-events/news/2024/10/nist-announces-14-candidates-advance-second-round-additional-digital)).
- **Round 3:** reporting indicates **9 schemes advanced** — FAEST, HAWK, MAYO, MQOM, QR-UOV, SDitH, SNOVA, SQIsign, UOV — with the next PQC Standardization Conference targeted for **H1 2027** ([Project Eleven](https://www.projecteleven.com/blog/nine-schemes-advance-to-round-3-of-nists-additional-digital-signatures-process)).

*Caveat: the exact Round-3 list and timing are drawn from secondary/industry reporting; treat as high-confidence-but-verify against the official CSRC page before publishing externally.*

Implication for Quantum Shield: none of the on-ramp schemes is standardized yet, so building on ML-DSA + SLH-DSA today is correct. SQIsign (very short signatures, isogeny-based) is the one worth tracking for a future third option if signature size ever becomes a custody constraint.

### 1.4 CNSA 2.0 and government migration deadlines
NSA's **Commercial National Security Algorithm Suite 2.0** specifies **ML-KEM-1024** and **ML-DSA-87** (plus AES-256, SHA-384/512) and sets a staggered schedule ([QuSecure](https://www.qusecure.com/cnsa-2-0-pqc-requirements-timelines-federal-impact/), [postquantum.com](https://postquantum.com/quantum-policy/nsa-cnsa-2-0-pqc/)):

| Milestone | Requirement |
|-----------|-------------|
| **Jan 1, 2027** | New deployments expected to support CNSA 2.0 |
| **2030** | Legacy equipment that can't support CNSA 2.0 must be phased out |
| **2031** | CNSA 2.0 use mandatory across covered categories |
| **2033** | OS, custom apps, cloud services must use CNSA 2.0 exclusively |
| **2035** | Full quantum resistance across all National Security Systems (aligned to NSM-10) |

Note NSA specifies **ML-DSA-87** (highest security level) for national-security signatures; Quantum Shield's ML-DSA-**65** is one tier below — adequate for commercial custody, but if the protocol ever targets government/regulated-defense custody, level-87 parameters may be required. Broader "quantum security deadlines are here" framing across government + industry is summarized by [The Quantum Insider (May 2026)](https://thequantuminsider.com/2026/05/08/post-quantum-migration-timelines-government-industry-impact/).

---

## 2. Quantum threat timeline (external environment)

### 2.1 Expert estimates for a CRQC
The most-cited longitudinal source is the **Global Risk Institute / Mosca–Piani Quantum Threat Timeline**. The 2025–2026 edition surveyed **26 experts** and found the averaged probability of a CRQC within **10 years at ~28–49%** — described as the highest 10-year estimate in the report's seven-year history — with roughly half of experts placing a likely CRQC in the **2035–2040** window ([postquantum.com summary](https://postquantum.com/security-pqc/quantum-threat-timeline-report-2025/)). *(The GRI original PDF returned 403 on direct fetch; figures here are from the secondary summary and should be checked against the GRI original.)*

Consensus of the current state: **no CRQC exists, none is close, and no vendor claims one.** Breaking RSA-2048 / 256-bit ECC needs thousands of *logical* (error-corrected) qubits running deep circuits; every current machine is many generations short ([QuantumZeitgeist CRQC guide](https://quantumzeitgeist.com/cryptographically-relevant-quantum-computer/)).

### 2.2 Vendor roadmaps and 2025–2026 milestones
| Vendor | 2025–2026 milestone | Gap to CRQC |
|--------|--------------------|-------------|
| **Google** | Willow (105 qubits) demonstrated **below-threshold** error correction — errors shrink as the code grows; targets useful fault-tolerance ~end of decade toward 1M physical qubits | Still no logical-qubit machine at code-breaking scale |
| **IBM** | Fault-tolerant roadmap: **Starling ~200 logical qubits by 2029**, ~100M error-corrected ops; "Loon" validating architecture | Even Starling is **not** a CRQC |
| **QuEra** | Neutral-atom: below-threshold correction with **up to 96 logical qubits** in 2025 | Early logical, not code-breaking |
| **Quantinuum** | ~**94 logical qubits** on H-series (with Microsoft) | Early logical, not code-breaking |

Sources: [SpinQ 2025 milestones](https://www.spinquanta.com/news-detail/quantum-computing-industry-trends-2025-breakthrough-milestones-commercial-transition), [Technerdo 2026](https://www.technerdo.com/blog/quantum-computing-milestones-2026), [The Quantum Insider (Nov 2025): error correction is now the defining challenge](https://thequantuminsider.com/2025/11/19/quantum-report-says-error-correction-now-the-industrys-defining-challenge/). The dominant 2025–2026 narrative shift is from *raw qubit count* to *error correction / logical qubits* as the true bottleneck — good news for defenders, because it makes near-term surprise less likely but keeps the 2030s firmly in scope.

### 2.3 Real-world "break" demonstrations (calibration, not alarm)
Project Eleven's **Q-Day Prize** (1 BTC) was awarded in April 2026 for breaking a **15-bit elliptic-curve key** on real quantum hardware via Shor's algorithm — up from a 6-bit break in Sept 2025 ([The Quantum Insider](https://thequantuminsider.com/2026/04/24/project-eleven-q-day-prize-quantum-ecc-attack/)). Context: 256-bit ECC (Bitcoin/Ethereum) is ~2^241× harder. These are milestones proving the *method*, not imminent breaks.

### 2.4 Harvest-now-decrypt-later (HNDL) and custody relevance
HNDL — capturing ciphertext/signatures now to decrypt/forge later — is the reason PQC is urgent *before* a CRQC exists. For a **custody** protocol this is acute: custodied assets are long-lived, and an on-chain public key is permanently exposed. Both Bitcoin and Ethereum migration discussions cite that **34%+ of BTC (≈6.2–6.7M BTC, ~$500B) already have exposed public keys** and would be directly stealable by a CRQC ([Bitcoin Magazine on BIP-361](https://bitcoinmagazine.com/news/bitcoin-developers-propose-quantum-plan)). Custody's value proposition is precisely to hold assets under signatures that remain unforgeable across that horizon — Quantum Shield's core thesis is sound.

---

## 3. Direct competitors — PQ blockchains, custody, wallets

### 3.1 Quantum Resistant Ledger (QRL) / Project Zond — **verified, active**
The original PQ blockchain (mainnet since 2018, XMSS hash-based signatures, PoW). **QRL 2.0 / Zond** is a ground-up rebuild: **EVM-compatible L1**, moving PoW→PoS, using **ML-DSA-87 (Dilithium-5)** across the stack (go-zond, Qrysm, "Hyperion" Solidity fork). Roadmap: **Testnet V2 in Q1 2026** with an audit push, **mainnet targeted 2026**; a PQ→PQ user-initiated claim migration from XMSS to ML-DSA-87 is planned ([theqrl.org](https://www.theqrl.org/blog/qrl-2.0-building-the-bridge-to-the-next-era/), [qrlhub Zond](https://qrlhub.com/en/zond)).
- **Weakness:** small ecosystem/liquidity, long timeline (8+ years), no smart-contract mainnet yet. **Not a custody product** — it's a base chain. Closest philosophical competitor but different layer.

### 3.2 QANplatform — **verified, active**
EVM-compatible L1. Its **QAN XLINK** protocol is a "cross-signer" that adds **ML-DSA-65** quantum-safe signatures on top of existing EVM wallets (MetaMask, Trust) rather than replacing the chain — a migration-bridge model. **Mainnet launched 2025**; XLINK passed a **Hacken audit (Nov 2025)**; roadmap includes Ledger firmware with ML-DSA keys and a government digital-ID sandbox by ~July 2026 ([The Quantum Insider](https://thequantuminsider.com/2025/11/20/qan-xlink-hacken-audit/), [QANplatform 2025 recap](https://medium.com/qanplatform/qanplatforms-2025-the-year-of-audits-expansion-f7a99404c1e7)).
- **Note:** QANplatform also uses **ML-DSA-65**, the *same* primary signature as Quantum Shield — a direct overlap. Its "add PQ signatures to existing EVM wallets" angle competes conceptually with a PQ custody layer.

### 3.3 Cellframe — **verified, active**
L0 service-oriented blockchain with PQC at the protocol level. Distinctive feature: **variable/agile PQC** — supports multiple PQ signatures simultaneously and can **swap algorithms without hard forks**, designed to absorb NIST changes. Building **cBTC**, a quantum-secure Bitcoin hedge ([cellframe.net manifesto](https://cellframe.net/blog/quantum-resistant-blockchain-manifesto-cellframe/)).
- **Strength vs. Quantum Shield:** crypto-agility is a real architectural edge; Quantum Shield's fixed dual-scheme is more rigid. **Weakness:** broad/diffuse product focus, modest traction.

### 3.4 Abelian — **verified, active**
PQ **privacy** L1 using lattice primitives (Dilithium + Kyber); has signed real mainnet transactions under a lattice PQ scheme **since April 2022**. Positions as "post-quantum digital gold" combining privacy + auditability ([pqabelian.io](https://www.pqabelian.io/blog/quantum-resistant-blockchain-is-here-what-makes-abelian-the-digital-gold-2-0)).
- **Different niche** (privacy coin, not custody). Long on-chain track record is a genuine credibility point; not a direct custody competitor.

### 3.5 Naoris Protocol — **verified, active, but marketing-heavy**
Post-quantum **cybersecurity/DePIN** L1 using **Dilithium-5**. **$NAORIS TGE July 31, 2025** (~$500M FDV, listed on Binance Alpha/Perps, MEXC, Gate.io); **mainnet launched April 2026**; claims 105M+ PQ transactions, 1M+ nodes, up to 70k TPS ([The Quantum Insider mainnet](https://thequantuminsider.com/2026/04/01/naoris-protocol-launches-mainnet-introducing-post-quantum-layer-1-blockchain/), [token launch](https://thequantuminsider.com/2025/07/30/naoris-protocol-to-launch-token-for-quantum-resistant-blockchain/)).
- **Caveat:** throughput/threat-mitigation numbers are self-reported marketing metrics; treat as unverified. Different niche (device/endpoint security), not custody.

### 3.6 BTQ Technologies — **verified, active (public company)**
Publicly traded (**Nasdaq: BTQ**, also Cboe Canada / Frankfurt). Products: **Bitcoin Quantum** (permissionless quantum-safe BTC fork replacing ECDSA with ML-DSA), **QSSN** (quantum-secure validation/wallet infra), and **QCIM** hardware (PQC in silicon, $15M JV with ICTK). Testnet v0.3.0 (Mar 2026) implements BIP-360 **P2MR** with ML-DSA opcodes. Cash ~**C$20.9M** at end-2025 ([Nasdaq press release](https://www.nasdaq.com/press-release/btq-technologies-demonstrates-quantum-safe-bitcoin-using-nist-standardized-post), [StockTitan SEC filing](https://www.stocktitan.net/sec-filings/BTQ/6-k-btq-technologies-corp-current-report-foreign-issuer-066c852c3ee3.html)).
- **Most credible institutional PQ-crypto player** here (public financials, hardware, standards involvement). Focus is Bitcoin + silicon, not Ethereum custody — adjacent, not head-on.

### 3.7 PQ-focused custody / MPC incumbents
- **Fireblocks** (~$8B valuation, added NYDFS-chartered trust in 2025): **auditing its full internal crypto stack** (certs, TLS, data-at-rest, integrations) for PQ readiness, and publicly flags that **MPC / threshold signatures are the hardest PQC gap** — there is no drop-in threshold version of ML-DSA/SLH-DSA yet ([Fireblocks blog](https://www.fireblocks.com/blog/google-quantum-research-institutional-crypto-security)). This is a **key insight for Quantum Shield**: MPC custodians have a real technical hole, which a natively-PQ signature custody design could exploit as differentiation.
- **Ledger:** CTO publicly called the quantum transition a **"Y2K-scale" crisis** and is pushing PQC in firmware/enterprise ([Crypto Times, Apr 2026](https://www.cryptotimes.io/2026/04/23/crypto-faces-y2k-scale-crisis-says-ledger-cto-amid-quantum-push/)).
- **Coinbase Custody / BitGo / Anchorage:** no verified shipped PQC custody product found as of mid-2026 — mostly monitoring/roadmap. *(Absence of evidence, not evidence of absence.)*

### 3.8 Ethereum's own PQ roadmap — **the most strategically important "competitor"**
In **Feb 2026** Vitalik Buterin published a quantum roadmap; Ethereum's approach ("**Lean Ethereum**") rebuilds around quantum-safe primitives ([ethereum.org quantum-resistance](https://ethereum.org/roadmap/future-proofing/quantum-resistance/), [DL News](https://www.dlnews.com/articles/defi/vitalik-proposes-quantum-roadmap-for-ethereum/)):
- **Account abstraction for signature agility** — via **EIP-8141** (considered for the *Hegotá* fork, H2 2026): individual accounts can switch to a PQ signature scheme *without* a protocol-wide migration.
- **Hash-based signatures** (Winternitz variants / **leanXMSS**) to replace BLS validator signatures.
- **STARKs** (hash-based, already quantum-safe) for proof aggregation.
- Core PQ infrastructure targeted for completion **~2029**.

This matters enormously: if Ethereum lets any account natively adopt PQ signatures via AA, a large part of the rationale for a *separate* PQ custody protocol on Ethereum weakens (see §5).

### 3.9 Bitcoin's PQ migration (context)
**BIP-360** (Pay-to-Merkle-Root, P2MR) and **BIP-361** ("Post Quantum Migration and Legacy Signature Sunset," assigned Feb 11 2026, co-authored incl. Casa's Jameson Lopp) propose a phased freeze of quantum-vulnerable legacy coins ([bips.dev/361](https://bips.dev/361/), [Bitcoin Magazine](https://bitcoinmagazine.com/news/bitcoin-developers-propose-quantum-plan)). Still drafts, no activation date. Shows even the most conservative chain is moving.

---

## 4. Adjacent moves by incumbents (PQC going mainstream)

Consumer/enterprise PQC deployment is now real and largely invisible to users — the "PQC is mainstream" backdrop that helps Quantum Shield's narrative ([Cloudflare](https://developers.cloudflare.com/ssl/post-quantum-cryptography/), [IANIX deployment tracker](https://ianix.com/pqcrypto/pqcrypto-deployment.html)):
- **Apple:** PQ3 in iMessage since **iOS 17.4 (2024)**.
- **Signal:** PQXDH deployed — chats already PQ-protected.
- **Google Chrome:** hybrid PQ key exchange default since Chrome 124; **ML-KEM** standardized in Chrome 131.
- **Cloudflare:** expects the **majority of its traffic PQ-protected on both ends by end of 2026**.
- **AWS / Microsoft / Google:** rolling out ML-KEM in TLS at scale.

**Key nuance:** nearly all mainstream deployment is **ML-KEM (key exchange / confidentiality)**, driven by HNDL on encrypted data. **PQ *signatures* (Quantum Shield's domain) lag** — signatures aren't retroactively forgeable, so the urgency curve is different and slightly later. This is both an opportunity (less crowded) and a caution (slower near-term customer pull for PQ signatures specifically).

Custodians/exchanges/L1s announcing PQ plans in 2025–2026: Fireblocks (audit), Ledger (firmware/"Y2K" messaging), QANplatform (Ledger integration), plus the Bitcoin (BIP-360/361) and Ethereum (Lean Ethereum) protocol efforts above.

---

## 5. Positioning analysis for Quantum Shield

### 5.1 Where the design sits
Quantum Shield's design = **dual/hybrid signature (ML-DSA-65 + SLH-DSA) custody + prover pool + VRF + timelock**, on Ethereum L1 (Sepolia today) + an Arbitrum-based L3.

- **Dual-signature redundancy is the standout differentiator.** Most competitors commit to a *single* family — usually lattice (ML-DSA): QRL/Zond, QANplatform, Naoris, Abelian all lean lattice; Cellframe is agile but not fixed-dual. Combining **lattice (ML-DSA) + hash-based (SLH-DSA)** hedges the tail risk of a lattice cryptanalysis breakthrough, since hash-based security rests on entirely different assumptions. For *custody* specifically — where a single break = catastrophic, permanent asset loss — this belt-and-suspenders design is genuinely well-motivated and hard for single-scheme chains to match. Notably, **Ethereum itself is betting on hash-based (leanXMSS/Winternitz)**, which validates SLH-DSA-style choices.
- **Cost of that redundancy:** SLH-DSA signatures are large (KBs) and slow; carrying two schemes doubles verification cost and on-chain footprint. On L1 Ethereum this is expensive — hence the sensible push to an L3.
- **Prover pool + VRF + timelock** are custody/security-process mechanics, not cryptographic novelty. They're the actual product moat: no PQ *base chain* (QRL, Abelian, Cellframe) offers custody-grade unlock delays, emergency flows, challenge/observer mechanics. This is where Quantum Shield is a *product*, not a chain.

### 5.2 Realistic threats to the thesis
1. **Ethereum native PQ account abstraction (biggest threat).** If EIP-8141-style AA lets any account adopt a PQ signature scheme directly (~2027–2029), the need for a *separate custody protocol just to get PQ signatures* shrinks. Quantum Shield must be more than "PQ signatures on Ethereum" — the prover-pool/timelock/policy layer must carry the value.
2. **Commoditization of PQ signatures.** ML-DSA/SLH-DSA are open standards; anyone can integrate them. The signature scheme is not defensible IP.
3. **Custodian incumbents close the gap.** Fireblocks/Coinbase/BitGo have distribution and AUM; when they ship PQC custody, a startup protocol's window narrows. (Offset: the MPC-threshold-PQC gap gives a 1–3 year head-start window.)
4. **Timeline risk cuts both ways.** No CRQC before ~2030s means slow near-term buyer urgency for PQ *signatures* specifically → revenue/adoption may lag the technical readiness.
5. **Base-chain dependency.** Anchoring to Ethereum L1 means Quantum Shield inherits Ethereum's own (still-classical, ECDSA/BLS) security until Ethereum's PQ migration lands — a narrative vulnerability ("your custody is PQ but your settlement layer isn't yet").

### 5.3 SWOT

**Strengths**
- Dual lattice+hash signature redundancy — rare, defensible for custody's zero-tolerance failure mode.
- Uses *finalized* NIST standards (204/205), not drafts or candidates — conservative, auditable.
- Custody-specific process layer (prover pool, VRF, timelock, emergency flows) that base PQ chains lack.
- Rides the MPC-PQC gap that incumbent custodians publicly admit.

**Weaknesses**
- ML-DSA-**65** (vs CNSA 2.0's ML-DSA-87) limits government/defense addressability.
- Heavy dual-signature footprint (SLH-DSA size/cost); L1 economics forced onto an L3.
- Signature scheme itself is commodity IP.
- Security depends on an underlying chain (Ethereum) that is still classically secured for now.
- Early-stage; no evidence of AUM/traction vs. named competitors.

**Opportunities**
- Position as the **PQ custody/policy layer that is chain-migration-agnostic** — survives whether Ethereum, Bitcoin, or an L2 wins its PQ path.
- Target the **MPC threshold-signature gap** custodians can't yet solve.
- Regulatory tailwind: CNSA 2.0 (2030–2035), potential EU/financial-sector PQ mandates create compliance-driven demand.
- Partner with / integrate the on-ramp's short-signature schemes (e.g., SQIsign) or FN-DSA when finalized to cut footprint.
- Crypto-agility (à la Cellframe) as a roadmap feature to avoid being locked to today's parameters.

**Threats**
- Ethereum native PQ AA (~2027–2029) eroding the "separate custody" rationale.
- Well-funded incumbents (Fireblocks $8B, public BTQ, Coinbase) shipping PQC.
- CRQC arriving *slower* than hyped → weak near-term demand, funding pressure.
- CRQC arriving via a modality that breaks *lattices* specifically → validates the dual design but also triggers industry-wide scramble that commoditizes the response.
- Marketing-saturated category ("quantum-safe" is a token-pump buzzword) risks credibility-by-association with weaker projects.

---

## 6. Key takeaways & recommendations

1. **Lead with the dual/hybrid (lattice + hash) redundancy** — it is the one design choice most competitors lack and it directly fits custody's catastrophic-failure model. Make it the headline, with SLH-DSA framed as the "lattice-break insurance" layer (and note Ethereum itself is going hash-based).
2. **Reframe from "PQ signatures on Ethereum" to "PQ custody & policy layer"** — the prover pool, VRF, timelock and emergency flows must be the moat, because native Ethereum PQ account abstraction (EIP-8141, ~2027–2029) will commoditize PQ signatures themselves. This is the single most important strategic pivot.
3. **Attack the MPC/threshold-PQC gap** that Fireblocks itself flags as unsolved — a natively-PQ signature custody design is a credible answer that incumbents can't yet ship. Time-boxed 1–3 year window.
4. **Plan for crypto-agility now** (Cellframe-style hot-swap of schemes) so you can adopt ML-DSA-87 (for CNSA 2.0 / government custody), FN-DSA (FIPS 206, ~2027), or SQIsign (short signatures) without a hard migration. Fixed dual-scheme is a future liability.
5. **Align to CNSA 2.0 milestones (2027 support, 2030 phase-out, 2035 full)** as the demand clock — but internally plan for a CRQC in the **2035–2040 median** (per Mosca survey), i.e., prioritize HNDL-resistant, long-lived-asset custody rather than betting on an imminent Q-Day.
6. **Own an L2/L3 cost story explicitly** — dual SLH-DSA signatures are expensive on L1; document why the Arbitrum-based L3 is the settlement home and how L1 anchoring stays economical.
7. **Differentiate on credibility, not hype** — publish audits (like QANplatform's Hacken audit), use only finalized FIPS, and avoid the self-reported-throughput marketing style that erodes trust in this category.
8. **Track the two roadmaps that can obsolete or validate you:** Ethereum's Lean Ethereum / EIP-8141 (H2 2026 fork discussion → ~2029) and Bitcoin's BIP-360/361. Set explicit trigger conditions in the roadmap for "if Ethereum ships native PQ AA, pivot custody value to X."

---

## Claims I could NOT fully verify (flagged for honesty)
- **Mosca/GRI 2025 survey exact percentages** (28–49% / 10yr; ~50% by 2035–2040): from a secondary summary; the GRI original PDF returned HTTP 403. Directionally consistent across sources but verify exact numbers.
- **On-ramp Round 3 exact 9-scheme list and H1-2027 conference date:** from industry blogs, not confirmed against the official CSRC page in this pass.
- **Naoris throughput/metrics** (70k TPS, 105M PQ tx, 1M nodes, $500M FDV): self-reported marketing figures.
- **BTQ testnet stats** (50+ miners, 100k+ blocks) and precise roadmap dates: from press releases/secondary reporting.
- **Coinbase/BitGo/Anchorage PQC custody:** no shipped product found — treated as "not evidenced," not confirmed-absent.
- Some threat-timeline "as early as 2027–2030" figures are attributed to McKinsey via BIP-361 commentary; not independently checked.

---

## Sources
**NIST / standards**
- https://www.federalregister.gov/documents/2024/08/14/2024-17956/announcing-issuance-of-federal-information-processing-standards-fips-fips-203-module-lattice-based
- https://cloudsecurityalliance.org/blog/2024/08/15/nist-fips-203-204-and-205-finalized-an-important-step-towards-a-quantum-safe-future
- https://csrc.nist.gov/projects/post-quantum-cryptography/post-quantum-cryptography-standardization
- https://csrc.nist.gov/Projects/pqc-dig-sig/news
- https://www.nist.gov/news-events/news/2024/10/nist-announces-14-candidates-advance-second-round-additional-digital
- https://www.projecteleven.com/blog/nine-schemes-advance-to-round-3-of-nists-additional-digital-signatures-process
- https://entangledfuture.com/guides/nist-pqc-standards/

**Government timelines**
- https://www.qusecure.com/cnsa-2-0-pqc-requirements-timelines-federal-impact/
- https://postquantum.com/quantum-policy/nsa-cnsa-2-0-pqc/
- https://thequantuminsider.com/2026/05/08/post-quantum-migration-timelines-government-industry-impact/

**Quantum threat timeline**
- https://postquantum.com/security-pqc/quantum-threat-timeline-report-2025/
- https://quantumzeitgeist.com/cryptographically-relevant-quantum-computer/
- https://www.spinquanta.com/news-detail/quantum-computing-industry-trends-2025-breakthrough-milestones-commercial-transition
- https://www.technerdo.com/blog/quantum-computing-milestones-2026
- https://thequantuminsider.com/2025/11/19/quantum-report-says-error-correction-now-the-industrys-defining-challenge/
- https://thequantuminsider.com/2026/04/24/project-eleven-q-day-prize-quantum-ecc-attack/
- https://www.coindesk.com/tech/2025/06/19/project-eleven-raises-6m-to-defend-bitcoin-from-the-coming-quantum-threat

**Competitors — PQ chains/custody**
- https://www.theqrl.org/blog/qrl-2.0-building-the-bridge-to-the-next-era/
- https://qrlhub.com/en/zond
- https://thequantuminsider.com/2025/11/20/qan-xlink-hacken-audit/
- https://medium.com/qanplatform/qanplatforms-2025-the-year-of-audits-expansion-f7a99404c1e7
- https://cellframe.net/blog/quantum-resistant-blockchain-manifesto-cellframe/
- https://www.pqabelian.io/blog/quantum-resistant-blockchain-is-here-what-makes-abelian-the-digital-gold-2-0
- https://thequantuminsider.com/2026/04/01/naoris-protocol-launches-mainnet-introducing-post-quantum-layer-1-blockchain/
- https://thequantuminsider.com/2025/07/30/naoris-protocol-to-launch-token-for-quantum-resistant-blockchain/
- https://www.nasdaq.com/press-release/btq-technologies-demonstrates-quantum-safe-bitcoin-using-nist-standardized-post
- https://www.stocktitan.net/sec-filings/BTQ/6-k-btq-technologies-corp-current-report-foreign-issuer-066c852c3ee3.html

**Custody incumbents**
- https://www.fireblocks.com/blog/google-quantum-research-institutional-crypto-security
- https://www.cryptotimes.io/2026/04/23/crypto-faces-y2k-scale-crisis-says-ledger-cto-amid-quantum-push/

**Ethereum / Bitcoin PQ roadmaps**
- https://ethereum.org/roadmap/future-proofing/quantum-resistance/
- https://www.dlnews.com/articles/defi/vitalik-proposes-quantum-roadmap-for-ethereum/
- https://bips.dev/361/
- https://bitcoinmagazine.com/news/bitcoin-developers-propose-quantum-plan

**Mainstream PQC deployment**
- https://developers.cloudflare.com/ssl/post-quantum-cryptography/
- https://ianix.com/pqcrypto/pqcrypto-deployment.html
