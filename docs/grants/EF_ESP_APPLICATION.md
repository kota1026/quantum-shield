# EF Ecosystem Support Program — Application Draft

## Project Name

**Quantum Shield: Post-Quantum Asset Custody Protocol**

## Category

ESP Wishlist — Cryptography

## Project Description

Quantum Shield is a post-quantum cryptographic custody protocol for Ethereum that protects user assets against quantum computer attacks. It replaces ECDSA-dependent signing with NIST-standardized post-quantum algorithms (ML-DSA-65 / SPHINCS+) while remaining fully compatible with the existing EVM.

The protocol introduces a novel dual-signature architecture: users sign with **ML-DSA-65 (FIPS 204)** for fast lock operations, while a decentralized **Prover Pool** provides **SPHINCS+** co-signatures for unlock verification — creating a defense-in-depth model where compromising one algorithm is insufficient to steal funds.

### Key Innovation: SR₀/SR₁ State Root Design

Traditional approaches to post-quantum signatures on Ethereum face a gas cost barrier — a single Dilithium verification costs ~15.5M gas, exceeding the block gas limit. Quantum Shield solves this with a state root architecture:

- **SR₀** = SHA3-256(lock_params + pk_dilithium) — computed off-chain by L3 Aegis
- Only the 32-byte SR₀ is stored on L1, reducing lock gas to ~200k
- L3 validates the full ML-DSA-65 signature; L1 stores the cryptographic commitment
- Unlock requires SR₁ with SPHINCS+ co-signatures from VRF-selected provers

## Problem Statement

1. **ECDSA is quantum-vulnerable**: Shor's algorithm on a sufficiently large quantum computer can derive private keys from public keys. Every Ethereum account that has ever sent a transaction has an exposed public key.

2. **No production-ready PQC solution exists for Ethereum**: Research papers discuss post-quantum Ethereum, but no deployed protocol offers real asset protection today.

3. **Gas cost barrier**: NIST PQC signature verification is too expensive for direct on-chain execution (ML-DSA-65: ~15.5M gas, SPHINCS+: >30M gas).

4. **Migration path needed NOW**: Quantum computers capable of breaking ECDSA may arrive within 10-15 years. Assets locked in smart contracts need protection before that deadline.

## Technical Architecture

### Layer Structure

| Layer | Technology | Purpose |
|-------|-----------|---------|
| L1 (Sepolia) | Solidity + EVM | Asset custody vault, SPHINCS+ verification |
| L3 (Aegis) | Rust/Axum | ML-DSA-65 validation, SR₀ computation, Prover coordination |
| Frontend | Next.js + WASM | Client-side Dilithium key generation and signing |

### 9 Core Protocol Sequences

| # | Sequence | Flow | Status |
|---|----------|------|--------|
| 1 | Consumer Lock | FE → BE → DB → L1 | ✅ Live |
| 2 | Normal Unlock | FE → BE → DB → L1 (24h timelock) | ✅ Live |
| 3 | Emergency Unlock | FE → BE → DB → L1 (7d + bond) | ✅ Live |
| 4 | Prover Registration | FE → BE → DB → L1 (stake) | ✅ Live |
| 5 | Observer Challenge | FE → BE → DB → L1 → VRF | ✅ Live |
| 6 | Slashing | BE → DB → L1 (quadratic) | ✅ Live |
| 7 | Governance Proposal | FE → BE → DB → L3 | ✅ Live |
| 8 | Emergency Pause | Admin → BE → L1 | ✅ Live |
| 9 | Token Hub (veQS) | FE → BE → DB → L3 | ✅ Live |

### Cryptographic Compliance (CP-1)

- **User signatures**: NIST FIPS 204 ML-DSA-65 (formerly Dilithium-III)
- **Prover co-signatures**: SPHINCS+-128s (stateless hash-based, NIST FIPS 205)
- **Hashing**: SHA3-256 for all application-layer hashing
- **Forbidden**: keccak256, ECDSA, or pre-FIPS algorithms in application layer
- L1 contracts use EVM-native keccak256/ECDSA (Solidity limitation)

### Security Parameters

| Parameter | Value |
|-----------|-------|
| Normal time lock | 24 hours |
| Emergency time lock | 7 days |
| Emergency timeout | 72 hours |
| Emergency bond minimum | 0.5 ETH |
| Emergency bond percentage | 5% (500 bps) |
| VRF timeout | 300 seconds |
| Slashing model | Quadratic (N² × 10%) |

## Deployed Infrastructure

### L1 Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| L1Vault | `0x07012aeF87C6E423c32F2f8eaF81762f63337260` |
| ProverRegistry | `0x08e1fc1A0d614bc132B48950760c7A291cCB8946` |
| SPHINCSVerifier | `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` |

### L3 Contracts (Arbitrum Sepolia)

| Contract | Address |
|----------|---------|
| CoreLayer | `0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0` |
| veQS | `0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE` |
| Governor | `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B` |
| QSToken | `0xBD66beBE19E664dF143da54808d746192e4f2ee2` |
| SecurityCouncil | `0xE8278a98e6fe4ecBe19fC9192036C6FaCCD720FF` |

### Live Application

- **Frontend**: https://quantum-shield.xyz (Next.js 15 + React 19)
- **Backend**: Rust/Axum on Railway (PostgreSQL + Redis + RabbitMQ)
- **GitHub**: https://github.com/kota1026/quantum-shield

## Team

**Kota Kato** — Founder & Lead Developer
- Full-stack blockchain developer
- Background in cryptographic protocol design
- Solo developer building the complete protocol stack

## Deliverables & Milestones

### Phase 1: Core Protocol (COMPLETED)
- ✅ L1Vault with lockWithSR0 / requestUnlock / executeUnlock
- ✅ ML-DSA-65 signature validation in Rust backend
- ✅ SR₀/SR₁ state root computation with SHA3-256
- ✅ Consumer Lock/Unlock full-stack E2E flow
- ✅ VRF-based prover selection

### Phase 2: Decentralized Verification (IN PROGRESS)
- Prover Pool with SPHINCS+ co-signing
- Observer Challenge system with quadratic slashing
- AI Prover service for automated signing
- Auto-claim service for time-locked unlocks

### Phase 3: On-Chain Verification Optimization (3 months)
- SPHINCS+ verification gas optimization (<5M gas target)
- Batch verification for multiple signatures
- Precompile proposal research (EIP draft)

### Phase 4: Mainnet Preparation (2 months)
- Security audit (Trail of Bits or OpenZeppelin)
- Formal verification of L1Vault invariants
- Mainnet deployment on Ethereum L1
- Migration tooling for existing ECDSA-protected assets

### Phase 5: Ecosystem Integration (2 months)
- SDK for wallet integration (MetaMask Snap)
- Multi-chain expansion (Arbitrum, Optimism, Base)
- Documentation and developer guides
- Community prover onboarding program

## Budget Request

**Total: $150,000 USD** (12-month timeline)

| Category | Amount | Details |
|----------|--------|---------|
| Development | $80,000 | 12 months full-time development |
| Security Audit | $40,000 | Professional audit of L1 contracts |
| Infrastructure | $15,000 | Testnet nodes, RPC, hosting, CI/CD |
| Research | $15,000 | PQC precompile EIP research, gas optimization |

## Alignment with Ethereum Foundation Mission

### ESP Wishlist — Cryptography

This project directly addresses the ESP Wishlist priority for **cryptography** research and implementation:

1. **Post-quantum readiness**: Provides a working implementation that Ethereum users can adopt today to protect against future quantum threats

2. **NIST compliance**: First Ethereum protocol to implement FIPS 204 (ML-DSA-65) and FIPS 205 (SPHINCS+) — the final NIST post-quantum standards

3. **Gas optimization research**: The SR₀/SR₁ design pattern can be generalized for other PQC schemes on EVM chains

4. **Open source**: All code is open source under MIT license, enabling the broader ecosystem to build on this work

5. **Precompile pathway**: Research into EVM precompiles for PQC verification could benefit all Ethereum users

### Broader Impact

- Protects Ethereum's $400B+ TVL from quantum threats
- Provides migration path for existing DeFi protocols
- Contributes to Ethereum's long-term security roadmap
- Demonstrates viability of PQC on EVM-compatible chains

## Existing Traction

- Live beta on Sepolia testnet with real transactions
- 6 deployed smart contracts across L1 and L3
- Full-stack application with Japanese/English i18n
- 9 core protocol sequences implemented
- Comprehensive test suite (Rust + Playwright E2E)

## References

- NIST FIPS 204: ML-DSA (Dilithium) — https://csrc.nist.gov/pubs/fips/204/final
- NIST FIPS 205: SLH-DSA (SPHINCS+) — https://csrc.nist.gov/pubs/fips/205/final
- Ethereum Foundation ESP: https://esp.ethereum.foundation
- EIP-7560: Post-quantum account abstraction (related work)
