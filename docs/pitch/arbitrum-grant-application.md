# Arbitrum Foundation Grant Application
## Quantum Shield: Post-Quantum Custody on Arbitrum

> **Program**: Arbitrum Foundation Grants
> **Category**: Security Infrastructure / L3 Innovation
> **Requested Amount**: $75,000 - $150,000
> **Duration**: 4 months
> **Date**: March 2026

---

## Executive Summary

Quantum Shield is a post-quantum asset custody protocol that has **already deployed 12 smart contracts on Arbitrum Sepolia** (2026-03-03, all Sourcify verified). We're applying for funding to:

1. **Deploy to Arbitrum One** (mainnet)
2. **Open-source our L3 contract framework** as reusable PQ security infrastructure for the Arbitrum ecosystem
3. **Run a Prover testnet pilot** with 4-8 operators on Arbitrum

This is not a proposal to build — it's a proposal to **launch what's already built**.

---

## What We've Built on Arbitrum

### Deployed Contracts (Arbitrum Sepolia, Chain 421614)

| Contract | Address | Function |
|----------|---------|----------|
| CoreLayer | `0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0` | Main protocol logic |
| veQS | `0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE` | Vote-escrowed governance token |
| RewardRouter | `0x83E9818ead29B8884d2E49eA3c4b7d5d72824319` | Reward distribution |
| Governor | `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B` | On-chain governance |
| InsuranceFund | `0x9357e01Bf1ABdE8f3b32DEbaf853a0BAB9aaDfB6` | Protocol insurance |
| Treasury | `0x9Dc3249c8BDcEA8693e73e3BaA071B17Dd84bD55` | Protocol treasury |
| QSToken | `0xBD66beBE19E664dF143da54808d746192e4f2ee2` | Utility token |
| GovernanceSwitch | `0x898e26853675368AC051b74809Ac5d0b02f19937` | Governance activation |
| SecurityCouncil | `0xE8278a98e6fe4ecBe19fC9192036C6FaCCD720FF` | Emergency multisig |
| VeQSRewardDistributor | `0x904F0c22fAB3dfB193D482593BBFAdeE2FBae2FF` | Staking rewards |
| ProverRewardPool | `0x24A7958fa27ce160425a9D4204aFF53010e1f77E` | Prover incentives |
| ObserverRewardPool | `0xCDb0C88d6711c29ED25BA63888B91F216Acc6784` | Observer incentives |

**Deployer**: `0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3`
**Verification**: 12/12 contracts with `exact_match` on Sourcify

---

## Why Arbitrum

1. **Low gas for PQ signatures**: SPHINCS+ signatures are 7,856 bytes — L1 verification costs ~$50, Arbitrum costs ~$0.50
2. **Orbit compatibility**: Our L3 framework can be deployed as an Orbit chain for dedicated PQ throughput
3. **Ecosystem fit**: DeFi protocols on Arbitrum (GMX, Camelot, Radiant) manage billions in TVL needing PQ protection
4. **Stylus potential**: Rust-native smart contracts via Stylus could further optimize our PQ verification costs

---

## Grant Deliverables

### Phase 1: Mainnet Deployment (Month 1-2) — $50K

| Deliverable | Metric |
|-------------|--------|
| Deploy 12 contracts to Arbitrum One | All verified on Arbiscan |
| Production backend connected to Arbitrum One | Health check passing |
| Prover registration open on mainnet | First 4 Provers registered |
| veQS staking live | TVL tracking dashboard |

### Phase 2: Ecosystem Integration (Month 2-3) — $50K

| Deliverable | Metric |
|-------------|--------|
| Open-source L3 contract framework | GitHub repo with MIT license |
| Integration guide for Arbitrum DeFi protocols | Published documentation |
| SDK for Arbitrum developers to add PQ protection | npm package published |
| Prover Pool testnet: 4-8 operators for 30 days | 99% uptime, transaction logs |

### Phase 3: Growth & Documentation (Month 3-4) — $50K

| Deliverable | Metric |
|-------------|--------|
| Partnership with 1+ Arbitrum DeFi protocol | MOU signed |
| Arbitrum PQ security report | Published research |
| Community Prover onboarding program | 8+ community Provers |
| Governance activation (Governor contract) | First proposal executed |

---

## Budget

| Category | Amount |
|----------|-------:|
| Arbitrum One deployment + gas | $10,000 |
| Infrastructure (RPC, monitoring, Prover nodes) | $30,000 |
| Open-source tooling development | $40,000 |
| Security review (Arbitrum-specific) | $30,000 |
| Community & documentation | $15,000 |
| Contingency | $25,000 |
| **Total** | **$150,000** |

**Minimum viable**: $75K (deploy + open-source, defer community program)

---

## Traction & Evidence

| Metric | Value |
|--------|-------|
| Contracts deployed (Arb Sepolia) | 12, all Sourcify verified |
| Frontend pages | 251 (full governance, token hub, prover portal) |
| Integration tests | 107 (all 9 core sequences) |
| E2E tests | 137/137 passed |
| Code completeness | 100% (zero mock/fallback data) |

---

## Team

- **Solo founder** who built 200K+ LOC production system
- Full-stack: Solidity, Rust, React, PostgreSQL
- AI-assisted development methodology (Claude Code) enabling startup-speed delivery
- Seeking to hire with grant funding: 1 Rust engineer, 1 DevOps

---

## Contact

- Email: [your-email]
- GitHub: [repo-url]
- Demo: Available upon request
