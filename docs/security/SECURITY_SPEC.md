# Quantum Shield - Security Specification

> **Version**: 1.0
> **Date**: 2026-02-12
> **Status**: Draft - Security Review Required
> **Classification**: CONFIDENTIAL - Internal Use Only

---

## 1. Security Architecture Overview

### 1.1 Defense-in-Depth Layers

```
Layer 1: Network Security
  └── TLS 1.3, DDoS protection, Firewall rules

Layer 2: Authentication & Authorization
  └── SIWE (EIP-191), JWT, Role-based access

Layer 3: Cryptographic Security
  └── ML-DSA-65 (user), SPHINCS+ (prover), SHA3-256 (hashing)

Layer 4: Application Security
  └── Input validation, Rate limiting, CSRF/XSS protection

Layer 5: Financial Security
  └── Time locks, Bonds, Quadratic slashing, Multi-sig

Layer 6: Consensus Security
  └── L3 BFT (4 nodes), VRF selection, State root verification

Layer 7: Settlement Security
  └── L1 Ethereum, Smart contracts, Finality guarantees
```

### 1.2 Security Principles

| Principle | Implementation |
|-----------|---------------|
| **Zero Trust** | Every request authenticated, no implicit trust |
| **Least Privilege** | Role-based access (User, Prover, Observer, Admin) |
| **Defense in Depth** | 7 security layers, no single point of failure |
| **Fail Secure** | System defaults to locked state on error |
| **Quantum Resistance** | NIST FIPS 204/205 algorithms for all financial ops |

---

## 2. Authentication Specification

### 2.1 SIWE (Sign-In with Ethereum) - User Authentication

```
Protocol: EIP-4361 (Sign-In with Ethereum)
Signature: EIP-191 personal_sign
Nonce: Random 13-char alphanumeric, stored in Redis (1h TTL)
Message Format:
  "{domain} wants you to sign in with your Ethereum account:
   {address}
   Sign in to Quantum Shield {app_name}
   URI: {uri}
   Version: 1
   Chain ID: {chain_id}
   Nonce: {nonce}
   Issued At: {iso_timestamp}"
```

**Security Controls**:
- Nonce stored in Redis with 1-hour expiry (prevents replay)
- Address recovered from signature (prevents spoofing)
- Chain ID binding (prevents cross-chain replay)
- Domain binding (prevents phishing)

### 2.2 JWT Token Management

```yaml
Access Token:
  Algorithm: HS256
  Lifetime: 24 hours (configurable)
  Claims:
    sub: wallet_address
    role: user|prover|observer|admin
    iat: issued_at_timestamp
    exp: expiry_timestamp

Refresh Token:
  Storage: Redis (key: refresh:{token_hash})
  Lifetime: 7 days
  Rotation: New refresh token on each use
  Revocation: Delete from Redis
```

**Security Controls**:
- Short access token lifetime (24h)
- Refresh token rotation (prevents token reuse)
- Redis-based revocation (immediate effect)
- Role claim verification on every request

### 2.3 Admin Authentication

```yaml
Method: JWT with admin role
Additional Controls:
  - IP allowlisting (production)
  - Audit logging for all operations
  - Session timeout: 8 hours
Future:
  - Multi-factor: Dilithium signature + JWT
  - Multi-sig: 2/3 admin approval for critical ops
```

---

## 3. Cryptographic Specification

### 3.1 Algorithm Selection

| Operation | Algorithm | NIST Standard | Quantum Safe |
|-----------|-----------|:------------:|:------------:|
| User Asset Protection | ML-DSA-65 (Dilithium) | FIPS 204 | Yes |
| Prover Attestation | SPHINCS+-SHA2-128f | FIPS 205 | Yes |
| State Root Hashing | SHA3-256 | FIPS 202 | Yes |
| Wallet Authentication | ECDSA (secp256k1) | Pre-quantum | No* |
| JWT Signing | HMAC-SHA256 | FIPS 198-1 | Partial |

*ECDSA used only for wallet compatibility, not for financial operations.

### 3.2 ML-DSA-65 (User Signatures)

```
Standard: NIST FIPS 204 (August 2024)
Security Level: NIST Level 3 (equivalent to AES-192)
Key Sizes:
  Public Key: 1,952 bytes
  Private Key: 4,032 bytes
  Signature: 3,309 bytes
Implementation: fips204 Rust crate (constant-time)

Usage:
  - Lock: User signs lock parameters
  - Unlock: User signs unlock request
  - Emergency: User signs emergency request
  - Key binding: Public key stored with lock record
```

### 3.3 SPHINCS+-SHA2-128f (Prover Signatures)

```
Standard: NIST FIPS 205 (August 2024)
Security Level: NIST Level 1 (equivalent to AES-128)
Variant: SHA2-128f (fast variant)
Key Sizes:
  Public Key: 32 bytes
  Private Key: 64 bytes
  Signature: 7,856 bytes (15,712 hex chars)
Implementation: Custom Rust implementation

Usage:
  - Prover attestation during unlock flow
  - 2/5 threshold: 2 of 5 selected provers must sign
  - HSM requirement: Private key stored in HSM
```

### 3.4 SHA3-256 (Hashing)

```
Standard: NIST FIPS 202 (2015)
Output: 256 bits (32 bytes)

Usage:
  - State Root computation (SR_0, SR_1)
  - Lock ID generation
  - Challenge fraud proof hashing
  - NOT keccak256 (pre-NIST variant)
```

### 3.5 Key Lifecycle

```
Generation:
  - ML-DSA-65: Client-side (browser crypto.getRandomValues)
  - SPHINCS+: Prover HSM (hardware-generated)
  - JWT Secret: Server-side (random 256-bit)

Storage:
  - User Private Keys: Browser only (encrypted backup available)
  - User Public Keys: Stored with lock records in PostgreSQL
  - Prover Private Keys: HSM (never leaves hardware)
  - Prover Public Keys: Registered on L3 + PostgreSQL
  - JWT Secret: Environment variable (production: KMS)

Rotation:
  - User Keys: Manual (per lock, recommended annually)
  - Prover Keys: On compromise or HSM rotation
  - JWT Secret: Manual rotation, all sessions invalidated
  - Admin Keys: On compromise, multi-sig update
```

---

## 4. Financial Security Controls

### 4.1 Time Lock Mechanism

| Operation | Time Lock | Purpose |
|-----------|:---------:|---------|
| Normal Unlock | 24 hours | Monitoring window for Observers |
| Emergency Unlock | 7 days | Extended monitoring + challenge window |
| Governance Execution | 7 days | Community review period |
| Prover Exit | 7 days | Unbonding period (slashable) |

### 4.2 Bond Requirements

| Bond Type | Formula | Minimum | Purpose |
|-----------|---------|:-------:|---------|
| Emergency Unlock | `amount x 5%` | 0.5 ETH | Deter abuse of emergency path |
| Challenge | `amount x 1%` | 0.1 ETH | Deter frivolous challenges |
| Prover Stake | USD-based | $400K | Economic security |

### 4.3 Slashing Mechanism

```
Formula: N^2 x 10% of stake

Examples:
  1 fraudulent prover:  1^2 x 10% = 10% ($40K)
  2 colluding provers:  2^2 x 10% = 40% ($160K each)
  3 colluding provers:  3^2 x 10% = 90% ($360K each)
  4+ provers:           Capped at 100% ($400K each)

Distribution:
  60% -> Challenger (incentive to detect)
  20% -> Insurance Fund
  20% -> Burned (deflationary)
```

### 4.4 VRF-Based Prover Selection

```
Source: Chainlink VRF v2.5 (L1)
Fallback: block.prevrandao (if VRF timeout >5 min)
Selection: Weighted by stake amount
Pool Size: 5 candidates per unlock
Threshold: 2 of 5 must sign (40% quorum)
Binding: Selection result committed to L3 before reveal
```

---

## 5. Network Security

### 5.1 Transport Layer

| Connection | Protocol | Encryption |
|------------|----------|------------|
| User <-> Frontend | HTTPS | TLS 1.3 |
| Frontend <-> API | HTTPS | TLS 1.3 |
| API <-> PostgreSQL | TCP | SSL (required in production) |
| API <-> Redis | TCP | TLS + AUTH |
| API <-> RabbitMQ | AMQP | TLS |
| API <-> L1 | HTTPS | TLS (Infura/Alchemy) |
| API <-> L3 | HTTP | Internal network only |

### 5.2 Firewall Rules (Production)

```
Inbound:
  443 (HTTPS) -> Load Balancer -> API Servers
  (All other ports: DENY)

Internal:
  API -> PostgreSQL (5432): ALLOW
  API -> Redis (6379): ALLOW
  API -> RabbitMQ (5672): ALLOW
  API -> L3 Nodes (8545): ALLOW
  Admin Panel -> API (8080): ALLOW (IP restricted)

Outbound:
  API -> L1 RPC (443): ALLOW
  API -> DNS (53): ALLOW
  (All other: DENY)
```

### 5.3 Rate Limiting

| Endpoint Category | Rate Limit | Window | Penalty |
|------------------|:----------:|:------:|---------|
| Authentication | 10 req | 1 min | 5 min block |
| Lock/Unlock | 5 req | 1 min | 1 min block |
| Public (Explorer) | 100 req | 1 min | Throttle |
| Admin | 30 req | 1 min | Account lock |
| Health Check | Unlimited | - | None |

---

## 6. Application Security

### 6.1 Input Validation

```rust
// All API inputs validated via Rust type system + serde
#[derive(Deserialize, Validate)]
pub struct UnlockRequest {
    #[validate(length(min = 1, max = 100))]
    pub lock_id: String,
    #[validate(regex = "^0x[a-fA-F0-9]{40}$")]
    pub dest_addr: String,
    #[validate(range(min = 1))]
    pub amount: String,
    pub sig_dilithium: String,  // Base64 encoded, verified server-side
}
```

**Controls**:
- Rust's type system prevents type confusion
- serde deserialization rejects malformed JSON
- sqlx parameterized queries prevent SQL injection
- Content-Type enforcement (JSON only)

### 6.2 Frontend Security

| Control | Implementation | Status |
|---------|---------------|:------:|
| CSP Headers | Next.js config | NEEDS VERIFICATION |
| XSS Prevention | React default escaping | Implemented |
| CSRF Protection | SameSite cookies + CORS | NEEDS VERIFICATION |
| Subresource Integrity | Next.js build hashes | Implemented |
| Clickjacking | X-Frame-Options: DENY | NEEDS VERIFICATION |

### 6.3 Error Handling

```
Principle: Fail secure, never expose internals

API Errors:
  400 Bad Request: "Invalid request parameters"
  401 Unauthorized: "Authentication required"
  403 Forbidden: "Insufficient permissions"
  404 Not Found: "Resource not found"
  409 Conflict: "Resource already exists"
  429 Too Many Requests: "Rate limit exceeded"
  500 Internal Error: "Internal server error" (no stack trace)

Logging:
  - Full error details logged server-side (BE-003)
  - Client receives generic error message
  - No database errors or stack traces exposed
```

---

## 7. Data Security

### 7.1 Data at Rest

| Data Store | Encryption | Access Control |
|------------|:----------:|----------------|
| PostgreSQL | TDE (production) | Role-based (quantum user) |
| Redis | N/A (in-memory) | AUTH + network isolation |
| L1 Blockchain | Public | Smart contract logic |
| L3 Blockchain | BFT validated | Validator set |
| Backups | AES-256 (required) | Admin only |

### 7.2 Data in Transit

All data encrypted via TLS 1.3 in production. Internal services may use plaintext in isolated networks (development only).

### 7.3 Data Retention

| Data Type | Retention | Deletion |
|-----------|:---------:|----------|
| Lock records | Permanent | Never (audit trail) |
| Unlock records | Permanent | Never (audit trail) |
| JWT sessions | 7 days | Auto-expire (Redis TTL) |
| API logs | 90 days | Auto-rotate |
| Error logs | 30 days | Auto-rotate |
| User addresses | Permanent | Per GDPR/APPI request |

---

## 8. Audit & Compliance

### 8.1 Audit Trail Requirements

All state-changing operations MUST log:
1. **Timestamp** (UTC ISO 8601)
2. **Actor** (wallet address or admin ID)
3. **Action** (operation type)
4. **Target** (affected resource)
5. **Result** (success/failure)
6. **IP Address** (for admin operations)

### 8.2 Compliance Requirements

| Regulation | Scope | Status |
|-----------|-------|:------:|
| APPI (Japan) | Personal data protection | NEEDS REVIEW |
| FSA Guidelines | Crypto asset regulations | NEEDS REVIEW |
| NIST FIPS 204/205 | Cryptographic compliance | Compliant |
| WCAG 2.1 AA | Accessibility | Implemented |

---

## 9. Security Testing Requirements

### 9.1 Pre-Launch Testing

| Test Type | Scope | Frequency | Status |
|-----------|-------|:---------:|:------:|
| Unit Tests | All modules | Every commit | 148 passing |
| E2E Tests | 144 test files | Every PR | All passing |
| SAST | Rust + TypeScript | Weekly | NEEDED |
| DAST | API endpoints | Monthly | NEEDED |
| Penetration Test | Full stack | Pre-launch | NEEDED |
| Crypto Review | ML-DSA-65 + SPHINCS+ | Pre-launch | NEEDED |

### 9.2 Post-Launch Testing

| Test Type | Frequency | Responsible |
|-----------|:---------:|------------|
| Dependency Scan | Weekly | Automated (Dependabot) |
| Penetration Test | Quarterly | External vendor |
| Disaster Recovery | Quarterly | Operations team |
| Incident Response Drill | Semi-annual | Full team |

---

## 10. Security Configuration Checklist

### 10.1 Production Deployment

```yaml
Must Complete Before Launch:
  [ ] TLS 1.3 on all external endpoints
  [ ] Database SSL enabled
  [ ] Redis AUTH + TLS enabled
  [ ] JWT secret rotated from development value
  [ ] Admin IP allowlisting configured
  [ ] Rate limiting enabled on all endpoints
  [ ] DDoS protection active (CloudFlare)
  [ ] Monitoring + alerting configured
  [ ] Backup strategy implemented and tested
  [ ] dev mode signature bypass removed (--release build)
  [ ] Secret management via KMS (not env vars)
  [ ] CSP headers configured
  [ ] CORS restricted to production domains
  [ ] Error pages do not expose stack traces
  [ ] All default credentials changed
```

---

*Generated: 2026-02-12*
*Next Review: Before External Audit*
