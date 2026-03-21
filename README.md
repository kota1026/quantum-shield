# Quantum Shield

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Rust](https://img.shields.io/badge/rust-stable-orange.svg)](https://www.rust-lang.org/)
[![Solidity](https://img.shields.io/badge/solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org/)

> **Post-Quantum Asset Custody Protocol: Dual NIST Signatures (FIPS 204 + 205), Prover Pool, VRF, Time Lock**

Quantum Shield protects Ethereum assets against quantum threats using both NIST post-quantum signature standards in a 3-layer architecture combining cryptographic, economic, and temporal security.

## Why Quantum Shield

- **NIST FIPS 204** published August 2024 — PQ migration is no longer theoretical
- **US Executive Order 14110** mandates federal PQ transition by 2028
- **EU DORA** requires quantum-resistant cryptography for financial infrastructure
- **$2.5T+** in smart contract TVL uses ECDSA — all vulnerable to quantum attack
- Ethereum's native PQ upgrade estimated **2028-2029** — leaving a 2-3 year gap

Quantum Shield provides application-layer PQ protection **today**, without requiring Ethereum protocol changes.

## Architecture

```
Layer 1 — L1 Vault (Ethereum)
├── SPHINCS+ (SLH-DSA, FIPS 205) on-chain verification
├── Immutable smart contract holding locked assets
├── 24h timelock with Auto-Claim
└── Emergency recovery path (7-day failsafe)

Layer 2 — L3 Aegis (Arbitrum)
├── Dilithium (ML-DSA, FIPS 204) off-chain verification
├── Gas-free signature operations (93% cost reduction)
├── veQS governance token + Governor contract
└── Treasury, InsuranceFund, RewardRouter

Layer 3 — Prover Pool (Decentralized Operators)
├── VRF-based random Prover selection (Chainlink VRF v2.5)
├── Quadratic Slashing: N² penalty for collusion
├── Observer Challenge mechanism for fraud detection
└── Economic stake as security bond
```

### Quadratic Slashing — Novel Economic Security

```
penalty = N² × base_rate × stake

1 cheater:   1² × 10% = 10%  ($40K lost)
2 colluders: 2² × 10% = 40%  ($160K each)
3 colluders: 3² × 10% = 90%  ($360K each)
```

Collusion is exponentially more expensive than solo misbehavior.

## Deployed Contracts

### L1 — Ethereum Sepolia (Chain 11155111)

| Contract | Address |
|----------|---------|
| L1 Vault | `0x43aF0A4b58CC3f040eF05746e72021dE6D35115B` |
| ProverRegistry | `0x08e1fc1A0d614bc132B48950760c7A291cCB8946` |
| SPHINCS+ Verifier | `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` |

### L3 — Arbitrum Sepolia (Chain 421614)

| Contract | Address |
|----------|---------|
| CoreLayer | `0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0` |
| veQS | `0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE` |
| Governor | `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B` |
| RewardRouter | `0x83E9818ead29B8884d2E49eA3c4b7d5d72824319` |
| InsuranceFund | `0x9357e01Bf1ABdE8f3b32DEbaf853a0BAB9aaDfB6` |
| Treasury | `0x9Dc3249c8BDcEA8693e73e3BaA071B17Dd84bD55` |
| QSToken | `0xBD66beBE19E664dF143da54808d746192e4f2ee2` |
| SecurityCouncil | `0xE8278a98e6fe4ecBe19fC9192036C6FaCCD720FF` |

All 12 L3 contracts Sourcify verified with `exact_match` (deployed 2026-03-03).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rust, Axum, sqlx, PostgreSQL 16, Redis 7, RabbitMQ |
| Frontend | Next.js 15, React 19, TanStack Query, Wagmi, RainbowKit |
| L1 Contracts | Solidity 0.8.20, Foundry |
| L3 Contracts | Solidity, deployed via Foundry |
| Cryptography | ML-DSA-65 (FIPS 204), SLH-DSA-128s (FIPS 205), SHA3-256 |
| Testing | Playwright (E2E), cargo test, Foundry |
| i18n | next-intl (Japanese + English) |

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d postgres redis rabbitmq l3-node minio minio-init

# 2. Run database migrations
cd src/api/api
DATABASE_URL="postgresql://quantum:quantum_dev@localhost:5432/quantum_shield" \
  sqlx migrate run

# 3. Start backend API (port 8080)
cargo run --bin api-server

# 4. Start frontend (port 3000)
cd src/frontend/web
pnpm install && pnpm dev
```

## Project Structure

```
src/
├── api/api/              Rust/Axum backend (460+ endpoints)
│   ├── src/routes/       API route handlers
│   ├── src/services/     Business logic, L1/L3 clients
│   ├── src/crypto/       ML-DSA-65 signature verification
│   ├── migrations/       17 PostgreSQL migrations
│   └── config/           YAML configuration
├── frontend/web/         Next.js frontend (251 pages)
│   ├── src/app/          App Router pages ([locale]/*)
│   ├── src/components/   489 React components
│   ├── src/hooks/        React Query hooks
│   └── src/locales/      i18n (ja/en)
├── contracts/            Solidity contracts
│   ├── l1/               L1 Vault, ProverRegistry
│   └── l3/               CoreLayer, veQS, Governor
├── crypto/               PQ cryptography
│   ├── circuits/         Dilithium STARK circuits
│   └── proofs/           Lean4 formal proofs
└── l3/                   L3 Aegis BFT consensus
```

## 9 Core Sequences

| # | Sequence | Flow | Status |
|---|----------|------|--------|
| 1 | Consumer Lock | FE → BE → DB → L1 | Tested |
| 2 | Normal Unlock | FE → BE → DB → L1 (24h timelock) | Tested |
| 3 | Emergency Unlock | FE → BE → DB → L1 (7d + bond) | Tested |
| 4 | Observer Challenge | FE → BE → DB → L1 → VRF | Tested |
| 5 | Prover Registration | FE → BE → DB → L1 (stake) | Tested |
| 6 | Prover Exit | FE → BE → DB → L1 (7d unbond) | Tested |
| 7 | Governance Proposal | FE → BE → DB → L3 | Tested |
| 8 | Emergency Pause | Admin → BE → L1 (72h max) | Tested |
| 9 | Token Hub (veQS) | FE → BE → DB → L3 | Tested |

107 integration tests covering all 9 sequences. 137/137 E2E tests passing.

## Security

### Cryptography (CP-1 Compliance)
- **NIST FIPS 204 ML-DSA-65** for user signatures
- **NIST FIPS 205 SLH-DSA-128s** for on-chain verification
- **SHA3-256** for all hashing
- **Forbidden**: keccak256, ECDSA, or pre-FIPS algorithms in application layer

### Security Parameters
- Normal time lock: 24 hours
- Emergency time lock: 7 days
- Emergency timeout: 72 hours
- Max pause duration: 72 hours
- Emergency bond: 0.5 ETH minimum or 5% of amount

### Production Guards
The API server panics on startup if `RUN_MODE=production` and:
- Signature verification is skipped
- TOTP verification is skipped
- JWT secret is the development default
- Rate limiting is disabled
- L1 min_stake < 1 ETH in mainnet mode

## Testing

```bash
# Backend
cd src/api/api
cargo test                              # All tests
SQLX_OFFLINE=true cargo test            # Skip DB compile-time check

# Frontend E2E
cd src/frontend/web
npx playwright test                     # All E2E tests

# Solidity
cd src/contracts/l1
forge test -vv

# Stub detection (should return 0 results)
grep -rn "MOCK_\|FALLBACK_\|DEMO_" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v mock.ts | grep -v .test. | grep -v .spec.
```

## Documentation

- [Core Sequences](docs/core/SEQUENCES.md) — 9 protocol sequences in detail
- [Actual State](docs/ACTUAL_STATE.md) — Code-verified implementation status
- [Integration Methodology](docs/INTEGRATION_METHODOLOGY_v2.md) — Phase 0-5 plan

## NIST Standards Referenced

| Standard | Algorithm | Use Case |
|----------|-----------|----------|
| FIPS 204 (ML-DSA) | Dilithium Level 3 | L3 off-chain verification |
| FIPS 205 (SLH-DSA) | SPHINCS+ Level 3 | L1 on-chain verification |
| FIPS 203 (ML-KEM) | Kyber | Future: encrypted channels |

## License

MIT License — see [LICENSE](LICENSE).

## Acknowledgments

- [NIST PQC Standardization](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Ethereum Foundation PQ Security Team](https://ethereum.org)
- [Arbitrum Foundation](https://arbitrum.foundation)
- [Plonky2](https://github.com/0xPolygonZero/plonky2)
- [Foundry](https://github.com/foundry-rs/foundry)
