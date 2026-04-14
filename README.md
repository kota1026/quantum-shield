# Quantum Shield

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Rust](https://img.shields.io/badge/rust-1.75%2B-orange.svg)](https://www.rust-lang.org/)
[![Solidity](https://img.shields.io/badge/solidity-0.8.24-blue.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

> Post-quantum asset protection protocol for Ethereum using NIST-standardized cryptography

## Live Demo

| | URL |
|--|-----|
| Frontend | [https://quantum-shield.xyz](https://quantum-shield.xyz) |
| Backend API | [https://quantum-shield-production-8f2b.up.railway.app/v1/health](https://quantum-shield-production-8f2b.up.railway.app/v1/health) |
| Network | Ethereum Sepolia (testnet) |

## Quick Links

- [Whitepaper](docs/WHITEPAPER.md)
- [Launch Plan](docs/LAUNCH_MASTER_PLAN.md)
- [GitHub](https://github.com/kota1026/quantum-shield)

## What is Quantum Shield?

Quantum Shield protects smart contract assets against quantum computing threats using **NIST FIPS 204 (ML-DSA/Dilithium)** and **FIPS 205 (SLH-DSA/SPHINCS+)** dual post-quantum signatures, combined with a decentralized Prover Pool, VRF-based selection, and time-locked custody.

### Key Features

- **Dual PQC Signatures** — ML-DSA-65 + SLH-DSA for defense-in-depth
- **Prover Pool** — Decentralized verification with stake-weighted selection via VRF
- **Time-Locked Custody** — 24h normal unlock, 7-day emergency path with bond
- **Observer Network** — Independent challenge system with quadratic slashing
- **On-Chain Governance** — veQS token voting, security council, insurance fund
- **11 Sub-Applications** — Consumer, Prover, Observer, Explorer, Enterprise, Governance, Admin

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 15)         11 apps, 136 routes, ja/en i18n │
├─────────────────────────────────────────────────────────────────┤
│  Backend API (Rust/Axum)       REST API, SIWE auth, Auto-Claim │
├──────────────────┬──────────────────────────────────────────────┤
│  L1: Sepolia     │  L3: Arbitrum Sepolia                       │
│  • Vault         │  • CoreLayer    • Governor                  │
│  • ProverRegistry│  • veQS         • RewardRouter              │
│  • SPHINCS+ Vfy  │  • QSToken      • InsuranceFund             │
└──────────────────┴──────────────────────────────────────────────┘
```

### 9 Core Sequences

| # | Flow | Path |
|---|------|------|
| 1 | Consumer Lock | Frontend → API → DB → L1 Vault |
| 2 | Normal Unlock | 24h timelock → Prover verification → L1 claim |
| 3 | Emergency Unlock | Bond deposit → 7-day lock → Emergency path |
| 4 | Prover Registration | Stake → VRF selection → Proof generation |
| 5 | Observer Challenge | Monitor → Challenge → VRF arbitration |
| 6 | Slashing | Quadratic penalty → L1 ProverRegistry |
| 7 | Governance | veQS voting → Proposal execution on L3 |
| 8 | Emergency Pause | Security council → L1 pause |
| 9 | Token Hub | Stake QS → veQS → Rewards |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Wagmi, RainbowKit |
| Backend | Rust, Axum, PostgreSQL, Redis, RabbitMQ |
| Contracts | Solidity 0.8.24 (Foundry), deployed to Sepolia + Arbitrum Sepolia |
| Cryptography | NIST FIPS 204 (ML-DSA-65), FIPS 205 (SLH-DSA), SHA3-256 |
| SDK | WASM (Rust → wasm-pack), npm-publishable |
| Testing | Playwright (E2E), Vitest, cargo test, Foundry forge test |

## Deployed Contracts

### L1: Ethereum Sepolia

| Contract | Address |
|----------|---------|
| Vault | `0x07012aeF87C6E423c32F2f8eaF81762f63337260` |
| ProverRegistry | `0x08e1fc1A0d614bc132B48950760c7A291cCB8946` |
| SPHINCS+ Verifier | `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` |

### L3: Arbitrum Sepolia (12 contracts)

| Contract | Address |
|----------|---------|
| CoreLayer | `0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0` |
| veQS | `0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE` |
| Governor | `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B` |
| QSToken | `0xBD66beBE19E664dF143da54808d746192e4f2ee2` |

All L3 contracts verified on [Sourcify](https://sourcify.dev/).

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Rust 1.75+ with cargo
- Node.js 20+ with pnpm
- Foundry (forge, anvil)

### Development Setup

```bash
# 1. Start infrastructure
docker compose up -d postgres redis rabbitmq l3-node minio minio-init

# 2. Run database migrations
cd src/api/api
DATABASE_URL="postgresql://quantum:quantum_dev@localhost:5432/quantum_shield" sqlx migrate run

# 3. Start backend API (port 8080)
cargo run --bin api-server

# 4. Start frontend (port 3000)
cd src/frontend/web
pnpm install
pnpm dev
```

### Verify

```bash
curl http://localhost:8080/v1/health
# {"status":"healthy"}
```

## Project Structure

```
quantum-shield/
├── src/
│   ├── api/api/              # Rust/Axum backend
│   │   ├── src/routes/       # API route handlers
│   │   ├── src/services/     # Business logic
│   │   ├── migrations/       # PostgreSQL migrations (17 files)
│   │   └── config/           # YAML configuration
│   ├── frontend/web/         # Next.js 15 frontend
│   │   ├── src/app/          # App Router pages (11 apps)
│   │   ├── src/components/   # 300+ React components
│   │   ├── src/hooks/        # React Query hooks per app
│   │   └── locales/          # ja/en translations
│   ├── l1/contracts/         # L1 Solidity contracts (Foundry)
│   ├── l3/                   # L3 governance contracts
│   └── frontend/sdk/wasm/    # WASM SDK (Dilithium + SPHINCS+)
├── docs/
│   ├── core/SEQUENCES.md     # 9 core sequence specifications
│   ├── ACTUAL_STATE.md       # Current implementation state
│   └── pitch/                # Pitch deck, grant applications
├── docker-compose.yml        # Development infrastructure
└── .github/workflows/        # CI/CD pipelines
```

## Testing

```bash
# Backend
cd src/api/api && cargo test

# Frontend E2E
cd src/frontend/web && npx playwright test

# Smart Contracts
cd src/l1/contracts && forge test
```

**Test Coverage**: 137 E2E tests passing, 107 integration tests, 0 failures.

## Security

- **Cryptography**: NIST FIPS 204 ML-DSA-65 + FIPS 205 SLH-DSA (post-quantum)
- **Hashing**: SHA3-256 (no keccak256 in application layer)
- **Authentication**: SIWE (Sign-In with Ethereum) + JWT
- **Time Locks**: 24h normal, 7-day emergency with bond collateral
- **Slashing**: Quadratic penalty for malicious provers

### Audit Status

- [x] Internal code review
- [ ] External audit (planned)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Built for a post-quantum future.**
