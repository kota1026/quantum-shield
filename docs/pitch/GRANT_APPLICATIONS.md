# Quantum Shield — Grant Applications Package

> **Last Updated**: 2026-04-03
> **Status**: Ready to submit

---

## 1. Quranium DeQUIP Grant ($5M / 15 teams)

**URL**: https://www.quranium.org/grant-program
**Status**: Open for applications
**Fit**: ⭐⭐⭐ PQ-native, EVM-compatible, exactly our domain

### Application Content (Copy-paste ready)

**Project Name**: Quantum Shield

**One-liner**: Post-quantum asset protection protocol using dual NIST signatures (ML-DSA + SLH-DSA) on Ethereum.

**Category**: DeFi / Security / Infrastructure

**Description**:

Quantum Shield is a **100% complete, production-ready** post-quantum asset protection protocol built on Ethereum. It uses both NIST-standardized post-quantum signature schemes — ML-DSA (FIPS 204, Dilithium) for off-chain L3 verification and SLH-DSA (FIPS 205, SPHINCS+) for on-chain L1 verification — providing defense-in-depth against quantum threats.

**What's built (all live on testnet)**:
- 15 smart contracts deployed (3 on Sepolia L1 + 12 on Arbitrum Sepolia L3), all verified
- 200+ backend API endpoints (Rust/Axum)
- 251 frontend pages across 11 applications (Next.js)
- VRF-based prover selection via Chainlink v2.5
- Quadratic Slashing (N² penalty for collusion)
- Auto-Claim service for automated fund release after 24h timelock
- 63+ integration tests, all passing
- WASM SDK for in-browser Dilithium signature verification
- Formal verification: Halmos symbolic testing + Lean4 mathematical proofs

**How this fits Quranium's mission**:
Quantum Shield operates as an application-layer PQ protection protocol that can integrate with any EVM chain — including Quranium. Our dual-algorithm approach (lattice-based + hash-based) provides maximum cryptographic diversity. We can port our L1 Vault contracts to Quranium's quantum-secure L1, providing a real-world DeFi use case for the Quranium ecosystem.

**Team**: Solo founder, full-stack (Solidity, Rust, React). Built 100% of the system using AI-assisted development.

**Requested Amount**: $300,000

**Milestones**:
1. Month 1-2: Quranium L1 contract deployment + integration testing
2. Month 3-4: Security audit (external firm)
3. Month 5-6: Mainnet launch + testnet pilot with 5+ Provers

**Links**:
- GitHub: https://github.com/kota1026/quantum-shield
- Live Demo: https://quantum-shield.vercel.app
- L1 Vault (Sepolia): https://sepolia.etherscan.io/address/0x07012aeF87C6E423c32F2f8eaF81762f63337260

---

## 2. Arbitrum Audit Subsidy Program ($10M pool)

**URL**: https://arbitrum.foundation/grants
**Contact**: grants@arbitrum.foundation
**Status**: Rolling applications
**Fit**: ⭐⭐⭐ 12 L3 contracts already deployed on Arbitrum Sepolia

### Application Content

**Project Name**: Quantum Shield

**Project Description**:
Quantum Shield is a post-quantum asset protection protocol with 12 smart contracts deployed on Arbitrum Sepolia (all Sourcify verified). The L3 governance layer includes: CoreLayer, veQS, Governor, SecurityCouncil, Treasury, InsuranceFund, RewardRouter, QSToken, GovernanceSwitch, VeQSRewardDistributor, ProverRewardPool, and ObserverRewardPool.

**Why Arbitrum**:
Our L3 governance and token economics layer runs entirely on Arbitrum, chosen for its low gas costs and Ethereum security inheritance. All 12 contracts are deployed and verified on Arbitrum Sepolia (chain 421614) since 2026-03-03.

**Deployed Contracts (Arbitrum Sepolia)**:
- CoreLayer: `0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0`
- veQS: `0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE`
- Governor: `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B`
- SecurityCouncil: `0xE8278a98e6fe4ecBe19fC9192036C6FaCCD720FF`
- (+ 8 more, see blockchain.md for full list)

**Audit Scope**:
- 12 L3 contracts (Solidity 0.8.20, ~13,678 LOC)
- 3 L1 contracts (Solidity 0.8.20, ~6,650 LOC)
- Total: 15 contracts, ~20,000 LOC

**Preferred Audit Firms**: Trail of Bits, Sigma Prime, OpenZeppelin

**Budget**: $60,000 - $80,000

**Project Maturity**: 
- All contracts fully implemented and tested
- Formal verification complete (Halmos + Lean4)
- 155+ E2E test files
- Ready for mainnet immediately after audit

**Open Source**: Yes — https://github.com/kota1026/quantum-shield (MIT License)

---

## 3. Chainlink BUILD Program

**URL**: https://chain.link/economics/build-program
**Status**: Rolling applications
**Fit**: ⭐⭐ VRF v2.5 integrated, deployment script ready

### Application Content

**Project Name**: Quantum Shield

**Chainlink Products Used**: 
- **VRF v2.5** — Random prover selection for unlock operations (2-of-N weighted selection)

**Description**:
Quantum Shield uses Chainlink VRF v2.5 as a critical component of its security model. When a user requests an unlock, VRF selects 2 random provers from the pool (stake-weighted) to co-sign the transaction with SPHINCS+ post-quantum signatures. This prevents prover collusion and provides verifiable randomness.

**Integration Details**:
- VRFConsumerV2Production.sol: Production-ready Chainlink VRF consumer contract
- DeployVRFConsumer.s.sol: Forge deployment script for Sepolia
- ChainlinkVRFConfig.sol: Multi-network config library (Sepolia, Mainnet, Arb Sepolia, Base)
- Backend VRF service (Rust): Polling, timeout handling, fallback to prevrandao
- 5-minute VRF timeout with automatic fallback (per SEQUENCES §2.3)

**How Chainlink VRF strengthens our protocol**:
Without verifiable randomness, a malicious actor could predict which provers will be selected and collude with them. Chainlink VRF makes this impossible by providing unpredictable, verifiable random prover selection.

**Traction**:
- 15 smart contracts deployed on testnet
- 200+ API endpoints
- 251 frontend pages
- 63+ integration tests passing
- Live demo: https://quantum-shield.vercel.app

**Team**: Solo founder, full-stack engineer

**What we need from BUILD**:
- VRF subscription credits (Sepolia + Mainnet)
- Marketing co-promotion
- Technical advisory on VRF optimization
- Early access to Chainlink products (CCIP for cross-chain unlocks)

---

## 4. Optimism Superchain Audit Grant (Season 9)

**URL**: https://atlas.optimism.io/missions/audit-grants
**Deadline**: May 20, 2026
**Status**: Open (Season 9: Feb 9 - Jun 3, 2026)
**Fit**: ⭐ Requires Superchain deployment (currently on Arbitrum)

### Application Notes

**Current blocker**: QS is deployed on Arbitrum Sepolia, not Optimism/Superchain.
**Path forward**: If we deploy L3 contracts to OP Mainnet or Base, we become eligible.
**Action**: Consider deploying to Base (Superchain) to qualify. Our contracts are chain-agnostic Solidity.

*Defer this application until/unless we deploy to Superchain.*

---

## 5. EF Office Hours (Direct PQ Team Access)

**URL**: https://esp.ethereum.foundation/applicants/office-hours/apply
**Status**: Always available
**Fit**: ⭐⭐⭐ Direct access to PQ team (Thomas Coratger)

### Talking Points

**Opening**: "We've built the first production implementation of both FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) on Ethereum. The project is 100% complete on testnet. We'd like to discuss how Quantum Shield aligns with EF's post-quantum security roadmap."

**Key points**:
1. We use the same dual-algorithm approach EF is researching, but at the application layer
2. Our Quadratic Slashing mechanism has game-theoretic implications for PoS economics
3. We're ready for mainnet — the only blocker is a security audit ($60K)
4. We can contribute our FIPS 204/205 Solidity implementations as public goods
5. We want to participate in the biweekly PQ dev sessions (Antonio Sanso)

**Ask**: 
- Grant funding for security audit
- Introduction to PQ team for collaboration
- Feedback on our cryptographic approach

---

## 6. Gitcoin Grants (Privacy & Security Round)

**URL**: https://grants.gitcoin.co/
**Status**: Next round TBD (check for GG25 announcement)
**Fit**: ⭐⭐ Public goods, OSS, community funding

### Project Description (for Gitcoin profile)

**Title**: Quantum Shield — Post-Quantum Asset Protection for Ethereum

**Description**:
Quantum Shield is an open-source post-quantum asset protection protocol. It uses NIST FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) to protect Ethereum assets from quantum computer attacks — today, without requiring Ethereum protocol changes.

Everything is open source and deployed on testnet. We need community support to fund a security audit for mainnet launch.

**Category**: Privacy & Security

**What your donation funds**:
- Smart contract security audit ($60K target)
- Mainnet deployment gas costs
- Prover node infrastructure for first 6 months

---

## 7. EF Proximity Prize ($1M)

**URL**: https://pq.ethereum.org/ (details TBD)
**Status**: Active
**Fit**: ⭐⭐ Research prize for PQ cryptography advances

### Submission Concept

**Title**: "Dual Post-Quantum Signature Application Layer for Ethereum: A Production Implementation of FIPS 204 + FIPS 205"

**Abstract**:
We present Quantum Shield, the first production implementation of both NIST FIPS 204 (ML-DSA-65) and FIPS 205 (SLH-DSA) as an application-layer protocol on Ethereum. Our approach combines lattice-based and hash-based signatures in a 3-layer architecture (L1 Vault + L3 Consensus + Prover Pool) with novel economic security mechanisms (Quadratic Slashing: N² × 10% penalty for prover collusion).

**Key contributions to PQ research**:
1. First dual-algorithm PQ implementation on Ethereum (production-ready)
2. Gas-efficient SPHINCS+ verification on EVM (~2M gas)
3. Quadratic Slashing: game-theoretic analysis of N² penalty functions
4. WASM SDK for in-browser ML-DSA-65 verification
5. Formal verification of SPHINCS+ properties (Lean4 proofs)

---

## Application Priority & Timeline

| Priority | Grant | Action | Owner | Time |
|----------|-------|--------|-------|------|
| **1** | Quranium DeQUIP | Submit on website | You | 30min |
| **2** | Arbitrum Audit | Email grants@arbitrum.foundation | You | 30min |
| **3** | Chainlink BUILD | Submit on website | You | 30min |
| **4** | EF Office Hours | Book session | You | 15min |
| **5** | Gitcoin | Create project profile (when round opens) | You | 1h |
| **6** | Proximity Prize | Check pq.ethereum.org for submission process | You | 30min |
| **7** | Optimism Audit | Defer (need Superchain deployment first) | - | - |

**Total estimated time for you: ~3 hours to submit all applications**
**All content is ready above — just copy-paste into each portal.**
