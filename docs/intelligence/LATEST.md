# PQC Intelligence — Latest

_Last updated: 2026-04-28 (delta refresh; see "April 2026 Delta" section below)_

## April 2026 Delta (since 2026-04-27)

Material new signals that change strategy. Each is dated and sourced.

| # | Signal | Date | Strategic implication |
|---|---|---|---|
| ① | **EF Checkpoint #9 demoted EIP-8141** to CFI (non-headliner). FOCIL (EIP-7805) is now the sole confirmed Hegotá CL headliner. EF cited "lack of consensus" on AA implementation. [blog.ethereum.org](https://blog.ethereum.org/2026/04/10/checkpoint-9) | 2026-04-10 | Custody-first PQC has 6+ more months of relevance. Reframe pitch from "EIP-8141-ready" to "EIP-8141-when-it-ships, custody-now." |
| ② | **Coinbase Independent Advisory Board on Quantum Computing & Blockchain** published a 50-page paper. Members: Boneh, Aaronson, Drake, Lindell, Malkhi, Kannan. Verdict: "not imminent but clearly on the horizon." Flags **6.9M BTC with exposed pubkeys**. Armstrong called it "urgent" 2026-04-02. [coindesk.com](https://www.coindesk.com/tech/2026/04/21/coinbase-advisory-board-says-quantum-computing-threat-is-on-the-horizon-crypto-needs-a-plan) | 2026-04-21–25 | Marketing wedge of the year. Ship Quantum Shield response post within 7 days (deadline 2026-05-04). Anchor on the 6.9M BTC number. |
| ③ | **StarkNet S2morrow PQ wallet** shipped using Falcon-512 via native AA. First production PQ wallet on a major L2. [starknet.io](https://www.starknet.io/blog/bitcoin-has-a-quantum-problem-starknet-has-the-answer/) | 2026-04-01 | Speed pressure on Quantum Shield's consumer Lock E2E. Different niche (L2 AA wallet vs L1 custody) — competitive but not direct. |
| ④ | **StarkWare layoffs**, revenue down 99% from peak. Shinobi v0.14.2 released. [coindesk.com](https://www.coindesk.com/markets/2026/04/13/starkware-cuts-jobs-in-reorganization-as-starknet-revenue-plunges-99-from-peak) | 2026-04-13 | Reduces near-term competitive threat. Don't over-react to S2morrow. |
| ⑤ | **Quantinuum 94 protected logical qubits** with ~10⁻⁴ logical-gate error. Beats Microsoft Magne 50-LQ target on paper. [thequantuminsider.com](https://thequantuminsider.com/2026/03/10/quantinuum-researchers-demonstrates-quantum-computations-with-dozens-of-protected-logical-qubits/) | 2026-03-10 | Threat model anchor moves forward. Update `docs/threat-model.md` to Q-Day 2028-2030 (was 2030+). |
| ⑥ | **Trezor Safe 7** — first hardware wallet shipping **SLH-DSA-128** in production (firmware/auth/boot). [cryptoslate.com](https://cryptoslate.com/what-trezors-new-quantum-ready-hardware-wallet-really-means-for-bitcoin/) | 2026-04 | Validates SPHINCS+ as retail-grade. Cite in pitch: "same SLH-DSA-128 parameter set as Trezor Safe 7." |
| ⑦ | **QRL 2.0 Testnet V2 publicly active** with Hyperion (PQ Solidity fork) + QRVM. Mainnet 2026 unscheduled. [theqrl.org](https://www.theqrl.org/press/qrl-launches-testnet-v2-for-its-postquantum-evmfriendly-blockchain/) | 2026-03-31 | Confirms our "PQ-on-ETH custody" niche is uncontested. QRL is a separate chain, not an L1 ETH primitive. |
| ⑧ | **Ripple/XRPL Project Eleven** — PQ validator rollout Phase 3 in H2 2026; "quantum-proof by 2028." [coindesk.com](https://www.coindesk.com/markets/2026/04/21/ripple-wants-the-xrp-ledger-to-be-quantum-proof-by-2028-here-is-its-plan) | 2026-04-21 | Different ecosystem; not a direct competitor. Use as "industry consensus is forming" signal. |
| ⑨ | **No new EF ESP PQC-specific RFP** in April. PhD Fellowship phdfp26 only adjacent open call. [esp.ethereum.foundation](https://esp.ethereum.foundation/rounds/phdfp26) | 2026-04 | Existing ESP application quality matters more than waiting. Submit now (planned in `docs/grants/SUBMISSION_CHECKLIST.md`). |

**Strategic synthesis** is in `docs/strategy/STRATEGY_2026-04-28.md`.

---

## Executive Summary (legacy, 2026-04-27)

The PQC landscape moved decisively in Q1 2026: **Vitalik backed EIP-8141** (account-level signature switching), the **Ethereum Foundation launched a Post-Quantum Security team** with $2M in research prizes, and **ETH2030 devnet** demonstrated 13 PQC-related precompiles including an NTT precompile at `0x15`. Hardware milestones (Microsoft Magne 50 logical qubits, IBM Nighthawk 120 qubits with 10x error-correction speedup, Google Willow below-threshold) compress the threat timeline. Quantum-resistant token market cap reached **$9.37B**, validating the thesis but inviting competition.

## 1. NIST PQC Standards (FIPS 203/204/205)

- FIPS 204 (ML-DSA / Dilithium) and FIPS 205 (SLH-DSA / SPHINCS+) finalized August 2024 — **both already in Quantum Shield's stack**.
- HQC code-based KEM scheduled to finalize **2026-2027** as additional NIST KEM (alternative to ML-KEM).
- Federal mandate: critical infrastructure must transition to PQC by **2027**.
- Google: Chrome + Android default to PQ-TLS by **mid-2026**.

## 2. Ethereum Post-Quantum Efforts (highest relevance)

- **EIP-8141** (Vitalik-backed, March 2026): allows EOAs to switch signature schemes via account abstraction — **avoids a "flag day"**. This is the migration path for everyday users.
- **Ethereum Foundation Post-Quantum Security team** formed January 2026 (lead: Thomas Coratger), 10+ client teams involved, **$2M in research prizes**.
- **pq.ethereum.org** launched as central hub.
- **ETH2030 devnet** (Feb 27, 2026): 13 new EVM precompiles including **NTT precompile at `0x15`** for lattice math acceleration. Verified blocks produced on Kurtosis devnet.
- **$20M Protocol Snarkification initiative**: formal verification of SNARK primitives that underpin PQ signature aggregation.
- Vitalik's stated goal: 4-year roadmap to full quantum resistance (2026-2030).
- Quote: "ETH is already 20% of the way toward quantum resilience" (cointelegraph interview).

## 3. Competitor Landscape

- **QRL 2.0**: Quantum-safe EVM-familiar migration path. **Testnet V2 launching Q1 2026**, audit-ready. Uses XMSS (hash-based, similar threat model to our SPHINCS+).
- **StarkNet**: STARKs are already PQ-secure as a side benefit (hash-based, no ECC). Marketing this aggressively in 2026.
- **PQShield**: Hardware/HSM angle. AWS and Google emerging with PQ HSMs but **no blockchain-specific HSMs yet** — opportunity gap.
- **Quantum-resistant token market cap: $9.37B** as of 2026 — narrative is heating up.
- 8+ post-quantum blockchain projects tracked by analyst lists (Webopedia, BlockEden, Witanworld).

## 4. Quantum Hardware Milestones

| Player | 2026 Status | Implication |
|---|---|---|
| Microsoft + Atom Computing | "Magne" — **50 logical qubits / ~1,200 physical**, ops Q1 2027 | First commercially-named logical-qubit machine |
| IBM | **Nighthawk 120 qubits**, 10x error-correction speedup (1yr ahead) | Verified quantum advantage demo by EOY 2026 |
| Google | Willow chip, **below-threshold error correction** confirmed | Scaling now reduces errors — qualitative shift |
| Microsoft (separate) | Topological qubits | Hardware-level error protection R&D |

**Threat compression**: New 2025 paper estimates **~1M qubits sufficient to break RSA-2048** (down from 20M). For Bitcoin/Ethereum ECDSA, ~317 logical qubits per 2022 paper. Magne's 50 logical qubits is meaningful baseline — not break-capable, but the trajectory is clear.

## 5. Academic Papers (recent)

- **arxiv 2510.09271**: "Assessing the Impact of Post-Quantum Digital Signature Algorithms on Blockchains" (CNPq/RNP funded). Compares ML-DSA, Falcon, SLH-DSA, MAYO, CROSS vs ECDSA. **Finding: minor overhead at security level 1; some PQC schemes outperform ECDSA at higher security levels.**
- **arxiv 2512.13333**: "Quantum Disruption: An SOK of How Post-Quantum Attackers Reshape Blockchain Security and Performance" — systematization of knowledge.
- **Preprints 202509.2079**: "Hybrid Post-Quantum Signatures for Bitcoin and Ethereum: A Protocol-Level Integration Strategy" — directly relevant to our dual-signature (ML-DSA + SPHINCS+) approach.

## 6. Strategic Recommendations for Quantum Shield

1. **EIP-8141 alignment is urgent**. Quantum Shield's lock/unlock flow already needs PQ signatures — wire our ML-DSA verification to be **drop-in replaceable by EIP-8141 account abstraction** when it ships. Position as "EIP-8141-ready custody."
2. **Apply for the EF $2M PQ research prize**. We already have a working dual-signature custody protocol on Sepolia — strongest credible applicant in the custody niche. Reference `docs/grants/EF_ESP_APPLICATION.md` and add EIP-8141 + Post-Quantum Security team angle.
3. **Add NTT precompile (`0x15`) integration plan to roadmap**. When ETH2030 lands on testnet, we should be the first custody protocol to use it for lattice-math acceleration of ML-DSA verification.
4. **Differentiate from QRL/StarkNet**: QRL is hash-only (XMSS), StarkNet is hash-only (STARK). We are **dual-NIST (ML-DSA + SPHINCS+)** which hedges algorithm risk. Lead messaging with "NIST-native, dual-algorithm."
5. **Partnership angle**: PQ HSM gap is real (no blockchain-specific PQ HSMs). Conversations with PQShield / AWS Nitro / Google KMS could position us as the reference custody integration.
6. **Risk alert**: Quantum-resistant token mcap at $9.37B with no major incumbent — competition will accelerate. Time-to-mainnet matters more than feature breadth.

## Sources

- [NIST PQC Project](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Vitalik's Quantum Roadmap (CoinDesk)](https://www.coindesk.com/tech/2026/02/26/vitalik-buterin-unveils-ethereum-roadmap-to-counter-quantum-computing-threat)
- [EF Post-Quantum Security Hub (CoinDesk)](https://www.coindesk.com/tech/2026/03/25/ethereum-foundation-prepares-for-quantum-threat-with-new-cryptography-roadmap)
- [EIP-8141 Coverage (CryptoTimes)](https://www.cryptotimes.io/2026/03/23/ethereums-quantum-defense-vitalik-buterin-backs-eip-8141-upgrade/)
- [pq.ethereum.org](https://pq.ethereum.org/)
- [QRL 2.0 Roadmap](https://www.theqrl.org/blog/qrl-2.0-building-the-bridge-to-the-next-era/)
- [Quantum-Resistant Token Market $9.37B (BeInCrypto)](https://beincrypto.com/quantum-resistant-tokens-market-2026/)
- [Neutral Atom Quantum Computing 2026 (IEEE Spectrum)](https://spectrum.ieee.org/neutral-atom-quantum-computing)
- [arxiv 2510.09271 — PQC Impact on Blockchains](https://arxiv.org/abs/2510.09271)
- [arxiv 2512.13333 — Quantum Disruption SOK](https://arxiv.org/html/2512.13333v1)
- [Hybrid PQ Signatures for BTC/ETH (Preprints)](https://www.preprints.org/manuscript/202509.2079)
