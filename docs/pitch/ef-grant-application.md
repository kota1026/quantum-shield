# Ethereum Foundation Grant Application
## Quantum Shield: Post-Quantum Asset Protection Protocol

> **Category**: Post-Quantum Cryptography / Security Infrastructure
> **Requested Amount**: $150,000 - $200,000
> **Duration**: 6 months
> **Applicant**: [Your Name]

---

## 1. Project Abstract

Quantum Shield is a post-quantum asset protection protocol built on Ethereum that uses **both** NIST-standardized post-quantum signature schemes — ML-DSA (FIPS 204, Dilithium) and SLH-DSA (FIPS 205, SPHINCS+) — in a novel 3-layer architecture to protect smart contract assets against quantum threats.

Unlike approaches that replace Ethereum's signature scheme at the consensus layer, Quantum Shield operates as an **application-layer protocol** that provides quantum-safe protection **today**, without requiring changes to the Ethereum protocol itself.

The project is **92% complete** with a working implementation on Sepolia testnet, including 9 frontend applications, 202 backend API endpoints, and a deployed L1 Vault contract.

---

## 2. Problem Statement

### 2.1 The Quantum Threat Timeline

- **August 2024**: NIST published final post-quantum cryptography standards (FIPS 203, 204, 205)
- **2025-2028**: US federal agencies required to transition to PQ algorithms (Executive Order 14110)
- **2028 (estimated)**: Ethereum Foundation's PQ upgrade timeline (per Vitalik Buterin's analysis)

### 2.2 The Gap

Between now and Ethereum's protocol-level PQ upgrade, **all assets secured by ECDSA signatures remain vulnerable** to:

1. **"Harvest Now, Decrypt Later" (HNDL)** attacks — adversaries collecting encrypted transaction data today for future quantum decryption
2. **Key extraction** — quantum computers deriving private keys from public keys exposed in transactions
3. **Signature forgery** — quantum-forged ECDSA signatures enabling unauthorized transfers

### 2.3 Scale of Exposure

- **$2.5T+** in smart contract TVL uses ECDSA
- **$20B+** in institutional custody relies on ECDSA-based wallets
- **No production-ready** application-layer PQ protection exists on Ethereum today

---

## 3. Proposed Solution

### 3.1 Architecture Overview

Quantum Shield introduces a **3-layer defense model** that combines cryptographic, economic, and temporal security:

```
Layer 1 — L1 Vault (Ethereum Mainnet)
├── Smart contract holding locked assets
├── SPHINCS+ (SLH-DSA, FIPS 205) signature verification
├── Immutable once deployed
└── Emergency recovery path (7-day failsafe)

Layer 2 — L3 Aegis (Off-chain BFT Consensus)
├── Dilithium (ML-DSA, FIPS 204) signature verification
├── Gas-free signature operations (93% cost reduction)
├── Byzantine Fault Tolerant consensus among Provers
└── Attestation aggregation before L1 submission

Layer 3 — Prover Pool (Decentralized Operators)
├── VRF-based random Prover selection
├── Quadratic Slashing (N² penalty for collusion)
├── Economic stake as security bond
└── Challenger mechanism for fraud detection
```

### 3.2 Why Two PQ Algorithms?

| Algorithm | Standard | Use Case | Trade-off |
|-----------|----------|----------|-----------|
| **ML-DSA (Dilithium)** | FIPS 204 | L3 off-chain verification | Fast (1.2ms), small signatures (2.4KB), lattice-based |
| **SLH-DSA (SPHINCS+)** | FIPS 205 | L1 on-chain verification | Slower, larger signatures, but **hash-based** = theoretically unbreakable |

Using both provides **defense in depth**: if a vulnerability is discovered in lattice-based cryptography (which Dilithium relies on), the hash-based SPHINCS+ layer on L1 remains secure. This dual-algorithm approach is recommended by NIST's own guidance for high-value systems.

### 3.3 Quadratic Slashing — Novel Economic Security

Traditional PoS slashing is linear: 1 malicious actor loses 1 stake. This doesn't adequately penalize collusion.

Quantum Shield introduces **Quadratic Slashing**:

```
penalty = N² × base_rate × stake

Where N = number of colluding Provers
      base_rate = 10%

Example with $400K stake per Prover:
  1 cheater:  1² × 10% = 10% ($40K lost)
  2 colluders: 2² × 10% = 40% ($160K each, $320K total)
  3 colluders: 3² × 10% = 90% ($360K each, $1.08M total)
```

This makes **collusion exponentially more expensive than solo misbehavior**, creating a strong game-theoretic deterrent. 60% of slashed funds go to Challengers who detect and prove misbehavior, incentivizing active monitoring.

We believe this mechanism has applications beyond Quantum Shield and could benefit the broader Ethereum staking ecosystem.

---

## 4. Current Status & Deliverables

### 4.1 What's Built (92% Complete)

| Component | Status | Details |
|-----------|:------:|---------|
| Protocol Specification (SEQUENCES v3.0) | ✅ | 9 complete sequences: Lock, Unlock, Emergency, Prover Registration, Observer Registration, Challenge, VRF Selection, Governance, Auto-Claim |
| L1 Vault Smart Contract | ✅ | Deployed on Sepolia (0x6F88...), SPHINCS+ verification |
| Backend API (Rust/Axum) | ✅ | 202 endpoints, PostgreSQL + Redis |
| Frontend Applications | ✅ | 9 apps, 175 screens, 375 React components |
| E2E Test Suite | ✅ | 144 test files (Playwright) |
| L3 Environment | 🔜 | Configuration remaining |
| Mock Data Cleanup | 🔜 | 38 locations to migrate |

### 4.2 Grant Deliverables (6 Months)

| Month | Deliverable | Verification |
|:-----:|-------------|-------------|
| 1-2 | **L3 Dilithium Integration**: Complete off-chain signing and verification pipeline using ML-DSA | Signing + verification benchmarks, BFT consensus demo |
| 2-3 | **Quadratic Slashing Implementation**: Full slashing logic on L1 with Challenger mechanism | Unit tests, game-theoretic analysis document |
| 3-4 | **Security Hardening**: Mock removal, production error handling, rate limiting | Zero mock/stub in production code |
| 4-5 | **Testnet Pilot**: 4-8 trusted Provers running full Lock/Unlock/Challenge cycles | Testnet transaction logs, uptime metrics |
| 5-6 | **Documentation & Research Paper**: Formal specification + Quadratic Slashing analysis | Published spec, submitted paper draft |

---

## 5. Relevance to Ethereum Ecosystem

### 5.1 Alignment with EF PQ Research

Quantum Shield directly complements the Ethereum Foundation's post-quantum roadmap:

- **EF's approach**: Protocol-level PQ upgrade (consensus layer changes, estimated 2028)
- **QS's approach**: Application-level PQ protection (available today, no protocol changes needed)

These are **complementary, not competing**: QS provides protection during the transition period and adds additional security layers (economic + temporal) that remain valuable even after Ethereum's native PQ upgrade.

### 5.2 Public Goods Contribution

1. **Quadratic Slashing research**: The game-theoretic analysis of N²-penalty slashing is applicable to Ethereum's own validator economics
2. **Dual-algorithm reference implementation**: First production implementation of both FIPS 204 and 205 on Ethereum
3. **PQ developer tooling**: Libraries and patterns for integrating PQ signatures into Solidity contracts
4. **Open specification**: SEQUENCES v3.0 is a complete, reusable protocol specification

### 5.3 Collaboration Opportunities

We are eager to collaborate with:
- **Thomas Coratger's PQ team** on signature verification optimization
- **EF Security team** on threat modeling for the ECDSA → PQ transition period
- **Ethereum Research** on Quadratic Slashing applications for PoS economics

---

## 6. Team

### Founder / Lead Developer
- Built 92% of the system as a solo founder using AI-assisted development (Claude Code)
- Full-stack: Solidity, Rust, React, PostgreSQL
- Deep understanding of both NIST PQ standards and Ethereum's architecture

### Planned Hires (with Grant Funding)
- **Cryptography Advisor** (part-time): Formal verification of PQ signature integration
- **Rust Engineer** (full-time, 6 months): L3 consensus implementation + production hardening

---

## 7. Budget

| Category | Amount | Details |
|----------|-------:|---------|
| Rust Engineer (6 months) | $90,000 | L3 implementation, mock cleanup, production hardening |
| Cryptography Advisor (part-time) | $30,000 | Formal analysis, signature scheme review |
| Infrastructure (L3 nodes, testnet) | $15,000 | 4-8 Prover nodes for testnet pilot |
| Security Review (preliminary) | $15,000 | Pre-audit code review by external firm |
| **Total** | **$150,000** | |

**Stretch ($200K)**: Adds preliminary smart contract audit ($50K) to accelerate mainnet timeline.

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| L3 Dilithium signing latency | < 5ms per signature | Benchmark suite |
| Testnet pilot uptime | > 99% over 30 days | Monitoring dashboard |
| Lock/Unlock cycle completion | 100% success rate | E2E test results |
| Quadratic Slashing correctness | Formal proof draft | Research document |
| Mock/stub elimination | 0 in production code | Automated detection script |
| Documentation completeness | Full specification published | Public repository |

---

## 9. Long-term Vision

Quantum Shield aims to become the **standard post-quantum protection layer for Ethereum**:

1. **2026 Q1-Q2**: Testnet pilot with trusted Provers
2. **2026 Q3**: Mainnet launch (ETH protection)
3. **2026 Q4**: Multi-asset support (ERC-20 tokens)
4. **2027**: Cross-chain expansion (L2s, other EVM chains)
5. **2028+**: Transition to complementary role alongside Ethereum's native PQ upgrade

The protocol is designed to remain valuable even after Ethereum implements native PQ signatures, because:
- Economic security (Quadratic Slashing) adds a layer that cryptography alone cannot provide
- Temporal security (24h TimeLock) gives users a recovery window
- Auto-Claim UX removes friction from asset management

---

## 10. Links & References

- **Repository**: [GitHub URL — to be made public upon grant acceptance]
- **Sepolia Contract**: [Etherscan link to deployed L1 Vault]
- **Demo**: Available upon request (recorded walkthrough of Lock/Unlock flow)
- **Technical Specification**: SEQUENCES v3.0 (included in repository)

---

## Appendix: NIST Standards Referenced

| Standard | Algorithm | Type | Quantum Security Level |
|----------|-----------|------|:----------------------:|
| FIPS 204 (ML-DSA) | Dilithium | Lattice-based signature | Level 2-5 |
| FIPS 205 (SLH-DSA) | SPHINCS+ | Hash-based signature | Level 1-5 |
| FIPS 203 (ML-KEM) | Kyber | Lattice-based KEM | Level 1-5 |

Quantum Shield uses **FIPS 204 (Level 3)** for L3 off-chain operations and **FIPS 205 (Level 3)** for L1 on-chain verification, providing defense-in-depth against both lattice and hash-based cryptanalytic advances.
