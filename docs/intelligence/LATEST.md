# PQC Intelligence — Latest

_Last updated: 2026-04-27 (manual session research)_

## Executive Summary

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
