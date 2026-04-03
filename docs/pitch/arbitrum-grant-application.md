# Arbitrum Foundation Grant Application
## Quantum Shield: Post-Quantum Asset Protection on Arbitrum

> **Category**: Security Infrastructure / Post-Quantum Cryptography
> **Requested Amount**: $50,000 - $100,000
> **Duration**: 4 months

---

## 1. Project Summary

Quantum Shield is a **live, working** post-quantum asset protection protocol that uses dual NIST-standardized signatures (ML-DSA + SPHINCS+) to protect smart contract assets against quantum threats.

**We have already deployed 12 governance contracts to Arbitrum Sepolia** and are seeking grant funding to bring full quantum-safe asset protection to Arbitrum mainnet.

- **Live Demo**: [quantum-shield.xyz](https://quantum-shield.xyz)
- **GitHub**: [github.com/kota1026/quantum-shield](https://github.com/kota1026/quantum-shield)
- **L3 Contracts (Arbitrum Sepolia)**: CoreLayer, veQS, Governor, QSToken, RewardRouter, InsuranceFund, Treasury, GovernanceSwitch, SecurityCouncil, VeQSRewardDistributor, ProverRewardPool, ObserverRewardPool

---

## 2. Why Arbitrum?

### 2.1 Already Building on Arbitrum

Quantum Shield's L3 governance layer is **already deployed on Arbitrum Sepolia** with 12 verified contracts. This isn't a proposal to start building — it's a proposal to take what's already working to mainnet.

### 2.2 Technical Alignment

| Feature | Why Arbitrum is Ideal |
|---------|----------------------|
| **Low gas costs** | PQ signatures are large (3.3KB Dilithium, 7.8KB SPHINCS+). Arbitrum's L2 cost structure makes on-chain PQ verification economically viable |
| **EVM compatibility** | All L1 contracts (Vault, ProverRegistry) are EVM-native and directly deployable |
| **Arbitrum Orbit** | Future L3 appchain for dedicated quantum-safe execution environment |
| **Ecosystem** | Arbitrum's DeFi TVL ($2.5B+) represents the largest pool of assets needing PQ protection |

### 2.3 Value to Arbitrum Ecosystem

- **First PQ protocol on Arbitrum** — positions Arbitrum as quantum-ready
- **Security infrastructure** — benefits all Arbitrum DeFi protocols
- **Novel cryptography** — dual NIST algorithm implementation as reference for ecosystem

---

## 3. What's Already Built

| Component | Status |
|-----------|--------|
| Frontend (11 apps, 175+ pages) | ✅ Live at quantum-shield.xyz |
| Backend API (202 endpoints, Rust) | ✅ Deployed on Railway |
| L1 Contracts (Ethereum Sepolia) | ✅ Vault, ProverRegistry, SPHINCS+ Verifier |
| **L3 Contracts (Arbitrum Sepolia)** | ✅ **12 contracts deployed & verified** |
| WASM Signature Module | ✅ ML-DSA-65 in-browser |
| Lock/Unlock Flow | ✅ Verified working |
| Whitepaper | ✅ [docs/WHITEPAPER.md](https://github.com/kota1026/quantum-shield/blob/main/docs/WHITEPAPER.md) |

---

## 4. Grant Deliverables

| Month | Deliverable | Verification |
|:-----:|-------------|-------------|
| 1 | **Arbitrum Mainnet Deployment**: Deploy all 12 L3 contracts to Arbitrum One | Verified contract addresses on Arbiscan |
| 2 | **Cross-chain Bridge**: L1 Vault ↔ Arbitrum L3 state sync | Bridge transaction logs, sync latency metrics |
| 3 | **Prover Network Pilot**: 4-8 Provers running on Arbitrum with real veQS staking | Prover uptime metrics, staking dashboard |
| 4 | **Security Audit + Documentation**: External audit of Arbitrum-specific contracts | Audit report, deployment guide |

---

## 5. Budget

| Category | Amount | Details |
|----------|-------:|---------|
| Arbitrum Mainnet deployment + gas | $10,000 | 12 contracts + bridge setup |
| Cross-chain bridge development | $25,000 | L1↔Arbitrum state sync |
| Security audit (Arbitrum contracts) | $25,000 | External auditor |
| Prover infrastructure (4 months) | $15,000 | 4-8 node operation |
| Documentation + developer guides | $5,000 | Arbitrum-specific docs |
| **Total** | **$80,000** | |

---

## 6. Team

- **Solo Founder / Full-stack Developer**: Built 100% of the system using AI-assisted development (Claude Code)
- Deployed live demo at quantum-shield.xyz with working Lock/Unlock on Sepolia
- Full-stack: Solidity, Rust, React, PostgreSQL
- Deep expertise in both NIST PQ standards and Ethereum/Arbitrum architecture

---

## 7. Existing Arbitrum Sepolia Deployment

| Contract | Address |
|----------|---------|
| CoreLayer | `0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0` |
| veQS | `0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE` |
| RewardRouter | `0x83E9818ead29B8884d2E49eA3c4b7d5d72824319` |
| Governor | `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B` |
| InsuranceFund | `0x9357e01Bf1ABdE8f3b32DEbaf853a0BAB9aaDfB6` |
| Treasury | `0x9Dc3249c8BDcEA8693e73e3BaA071B17Dd84bD55` |
| QSToken | `0xBD66beBE19E664dF143da54808d746192e4f2ee2` |
| GovernanceSwitch | `0x898e26853675368AC051b74809Ac5d0b02f19937` |
| SecurityCouncil | `0xE8278a98e6fe4ecBe19fC9192036C6FaCCD720FF` |
| VeQSRewardDistributor | `0x904F0c22fAB3dfB193D482593BBFAdeE2FBae2FF` |
| ProverRewardPool | `0x24A7958fa27ce160425a9D4204aFF53010e1f77E` |
| ObserverRewardPool | `0xCDb0C88d6711c29ED25BA63888B91F216Acc6784` |

All contracts verified on Sourcify (exact_match).

---

*© 2026 Quantum Shield*
