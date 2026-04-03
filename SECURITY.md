# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Quantum Shield, please report it responsibly.

**DO NOT** open a public GitHub issue for security vulnerabilities.

### How to Report

1. **Email**: Send details to **security@quantum-shield.io**
2. **Subject line**: `[SECURITY] Brief description`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix development | Depends on severity |
| Public disclosure | After fix is deployed |

### Severity Classification

| Severity | Description | Example |
|----------|-------------|---------|
| **Critical** | Fund loss or protocol compromise | Smart contract exploit, key leakage |
| **High** | Significant impact on availability or integrity | Auth bypass, DoS vulnerability |
| **Medium** | Limited impact, requires specific conditions | Rate limit bypass, info disclosure |
| **Low** | Minimal impact | UI inconsistency, minor info leak |

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| Beta (current) | Yes |
| Pre-beta | No |

---

## Security Architecture

### Cryptography (CP-1 Compliance)

Quantum Shield uses exclusively **post-quantum cryptographic algorithms**:

| Algorithm | Standard | Use Case |
|-----------|----------|----------|
| ML-DSA-65 (Dilithium) | NIST FIPS 204 | User lock/unlock signatures |
| SLH-DSA (SPHINCS+) | NIST FIPS 205 | Prover attestation signatures |
| SHA3-256 | NIST FIPS 202 | All hashing operations |

**Forbidden in application layer**: keccak256, ECDSA, RSA, or any pre-FIPS algorithm.

> Note: L1 smart contracts use EVM-native keccak256/ECDSA due to Solidity limitations.

### Authentication

- **SIWE** (Sign-In with Ethereum) for wallet authentication
- **JWT** with configurable expiry (1h production, 24h dev)
- Refresh token rotation with hash-based validation

### Rate Limiting

- Per-IP token bucket rate limiter
- Configurable limits per endpoint category
- Automatic bucket cleanup to prevent memory exhaustion

### Security Headers

All API responses include:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |

### Smart Contract Security

- **Immutable contracts**: L1 Vault and ProverRegistry are not upgradeable
- **CEI pattern**: Checks-Effects-Interactions for reentrancy prevention
- **Security Council**: 9-member multi-sig with configurable thresholds (5/9 pause, 6/9 veto, 7/9 upgrade)
- **Emergency Pause**: Protocol can be halted within minutes, max 72h duration
- **Formal Verification**: Halmos symbolic testing + Lean4 mathematical proofs

### Key Management

- L1 private keys: Environment variables only, never in config files
- JWT secrets: Environment variables with recommended 90-day rotation
- HSM attestation required for Prover key binding

---

## Security Parameters

| Parameter | Value |
|-----------|-------|
| Normal time lock | 24 hours |
| Emergency time lock | 7 days |
| Emergency timeout | 72 hours |
| Max pause duration | 72 hours |
| Emergency bond minimum | 0.5 ETH |
| Emergency bond percentage | 5% (500 bps) |
| VRF timeout | 300 seconds (5 minutes) |
| Challenge defense window | 48 hours |
| Prover unbonding period | 7 days |

---

## Bug Bounty Program

A formal bug bounty program will be announced after the public launch. In the meantime, responsible disclosure reports will be acknowledged and credited.

---

## Audit Status

| Audit | Status | Firm |
|-------|--------|------|
| Smart Contracts | Planned | TBD |
| Backend API | Planned | TBD |
| Cryptography | Internal review complete | - |
| Formal Verification | Complete (Halmos + Lean4) | - |
