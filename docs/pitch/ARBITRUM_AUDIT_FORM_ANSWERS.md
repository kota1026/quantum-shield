# Arbitrum Audit Subsidy — コピペ用回答シート

> **応募URL**: https://tally.so/r/3xzEzv?program=aap
> **プログラム**: Arbitrum Audit Program (AAP)
> **フォーム**: Tally form

---

## フォーム回答（各フィールドをそのままコピペ）

### Project Name
```
Quantum Shield
```

### Project Website
```
https://quantum-shield.vercel.app
```

### Project Description (short)
```
Post-quantum asset protection protocol using dual NIST signatures (ML-DSA-65 + SLH-DSA) on Ethereum L1 and Arbitrum L3. Protects smart contract assets from quantum computer attacks today, without requiring Ethereum protocol changes.
```

### Project Description (detailed)
```
Quantum Shield is a 100% complete post-quantum asset protection protocol with a 3-layer architecture:

Layer 1 (Ethereum Sepolia): L1 Vault for asset custody with SPHINCS+ signature verification, ProverRegistry for decentralized prover management, and SPHINCS+ Verifier for on-chain quantum-resistant signature validation.

Layer 3 (Arbitrum Sepolia): 12 governance and token economics contracts including CoreLayer, veQS (vote-escrowed token), Governor, SecurityCouncil (9-member multi-sig), Treasury, InsuranceFund, RewardRouter, QSToken, GovernanceSwitch, VeQSRewardDistributor, ProverRewardPool, and ObserverRewardPool.

Novel mechanisms: Quadratic Slashing (N² × 10% penalty for prover collusion), VRF-based random prover selection via Chainlink v2.5, and Auto-Claim service for automated fund release after 24h timelock.

The protocol uses both NIST-standardized PQ signature schemes — FIPS 204 (ML-DSA-65, Dilithium) for off-chain L3 verification and FIPS 205 (SLH-DSA, SPHINCS+) for on-chain L1 verification — providing defense-in-depth against quantum threats.
```

### GitHub Repository
```
https://github.com/kota1026/quantum-shield
```

### Contracts deployed on Arbitrum? (Yes/No)
```
Yes — 12 contracts on Arbitrum Sepolia (chain 421614), deployed 2026-03-03, all verified on Sourcify with exact_match.
```

### Contract Addresses (Arbitrum)
```
Arbitrum Sepolia (chain 421614):
- CoreLayer: 0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0
- veQS: 0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE
- RewardRouter: 0x83E9818ead29B8884d2E49eA3c4b7d5d72824319
- Governor: 0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B
- InsuranceFund: 0x9357e01Bf1ABdE8f3b32DEbaf853a0BAB9aaDfB6
- Treasury: 0x9Dc3249c8BDcEA8693e73e3BaA071B17Dd84bD55
- QSToken: 0xBD66beBE19E664dF143da54808d746192e4f2ee2
- GovernanceSwitch: 0x898e26853675368AC051b74809Ac5d0b02f19937
- SecurityCouncil: 0xE8278a98e6fe4ecBe19fC9192036C6FaCCD720FF
- VeQSRewardDistributor: 0x904F0c22fAB3dfB193D482593BBFAdeE2FBae2FF
- ProverRewardPool: 0x24A7958fa27ce160425a9D4204aFF53010e1f77E
- ObserverRewardPool: 0xCDb0C88d6711c29ED25BA63888B91F216Acc6784
```

### Contract Addresses (L1 Sepolia, if asked)
```
Ethereum Sepolia (chain 11155111):
- L1Vault: 0x07012aeF87C6E423c32F2f8eaF81762f63337260
- ProverRegistry: 0x08e1fc1A0d614bc132B48950760c7A291cCB8946
- SPHINCSVerifier: 0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103
```

### Audit Scope
```
Full scope: 15 smart contracts across L1 and L3

L3 Contracts (Arbitrum, primary scope):
- 12 Solidity contracts, ~13,678 LOC
- Governance: Governor, SecurityCouncil, GovernanceSwitch
- Token Economics: veQS, QSToken, RewardRouter, VeQSRewardDistributor
- Security: InsuranceFund, ProverRewardPool, ObserverRewardPool
- Core: CoreLayer, Treasury

L1 Contracts (Ethereum Sepolia, secondary scope):
- 3 Solidity contracts, ~6,650 LOC
- L1Vault (asset custody + SPHINCS+ verification)
- ProverRegistry (prover stake management)
- SPHINCSVerifier (on-chain PQ signature verification)

Total: ~20,000 LOC, Solidity 0.8.20, compiled with via_ir + 200 optimizer runs

Existing security measures:
- Formal verification: Halmos symbolic testing + Lean4 mathematical proofs
- CEI pattern (Checks-Effects-Interactions) for reentrancy prevention
- 155+ E2E test files, 63+ integration tests all passing
- Zero-address validation on all constructors
```

### Preferred Audit Timeline
```
Q2-Q3 2026 (flexible). Ready to begin immediately — all contracts are feature-complete and deployed on testnet.
```

### Preferred Auditor (if any)
```
No strong preference. Open to any approved auditor. Would particularly welcome:
- Trail of Bits (experience with cryptographic protocols)
- Sigma Prime (Ethereum ecosystem expertise)
- OpenZeppelin (broad Solidity coverage)
- Nethermind Security (Arbitrum ecosystem familiarity)
```

### Budget Estimate
```
$60,000 - $80,000 (based on ~20K LOC across 15 contracts)
```

### Is your project open source?
```
Yes — MIT License
https://github.com/kota1026/quantum-shield
```

### Team Information
```
Solo founder, full-stack engineer (Solidity, Rust, React/Next.js, PostgreSQL).
Built 100% of the system (251 frontend pages, 200+ API endpoints, 15 smart contracts) using AI-assisted development with Claude Code.
```

### Contact Email
```
[あなたのメールアドレスを入力]
```

### Contact Telegram/Discord (if asked)
```
[あなたのTelegram/Discordを入力]
```

### Wallet Address (if asked)
```
[あなたのウォレットアドレスを入力]
```

### Additional Information
```
Quantum Shield addresses a critical and timely need: the Ethereum Foundation designated post-quantum security as its top strategic priority in January 2026, and Google estimates PQ migration must happen by 2029.

Our project is the first production implementation of both NIST FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) as an application-layer protocol on Ethereum + Arbitrum. The security audit is the final blocker for mainnet deployment.

Key differentiators:
- Dual PQ algorithm approach (lattice + hash-based) for defense-in-depth
- Quadratic Slashing: N² penalty makes collusion exponentially expensive
- VRF-based prover selection via Chainlink v2.5
- Auto-Claim: automated fund release after 24h timelock
- Complete formal verification (Halmos + Lean4)
- 9-member SecurityCouncil with configurable thresholds (5/9 pause, 6/9 veto, 7/9 upgrade)

Live testnet links:
- Frontend: https://quantum-shield.vercel.app
- L1 Vault tx: https://sepolia.etherscan.io/address/0x07012aeF87C6E423c32F2f8eaF81762f63337260
- L3 contracts: All 12 verified on Sourcify (Arbitrum Sepolia)
```

---

## 手順

1. https://tally.so/r/3xzEzv?program=aap を開く
2. 上記の回答を各フィールドにコピペ
3. メールアドレス・ウォレットアドレスだけ自分で入力
4. 送信！

**所要時間: 約15-20分**
