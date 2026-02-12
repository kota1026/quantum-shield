# Quantum Shield - Threat Model

> **Version**: 1.0
> **Date**: 2026-02-12
> **Status**: Draft - Security Review Required
> **Classification**: CONFIDENTIAL - Internal Use Only

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Trust Boundaries](#2-trust-boundaries)
3. [Threat Categories (STRIDE)](#3-threat-categories)
4. [Asset Inventory](#4-asset-inventory)
5. [Attack Surface Analysis](#5-attack-surface-analysis)
6. [Threat Scenarios](#6-threat-scenarios)
7. [Cryptographic Threat Analysis](#7-cryptographic-threat-analysis)
8. [Cross-Chain Bridge Threats](#8-cross-chain-bridge-threats)
9. [Governance & Economic Threats](#9-governance--economic-threats)
10. [Operational Security](#10-operational-security)
11. [Mitigation Matrix](#11-mitigation-matrix)
12. [Risk Register](#12-risk-register)

---

## 1. System Overview

### 1.1 Architecture Layers

```
                    +-----------------+
                    |   End Users     |  (Consumer App, Mobile Browser)
                    +--------+--------+
                             |
                    +--------v--------+
                    | Frontend (Next.js)|  Trust Boundary 1
                    | 12 Apps, 136 pages|
                    +--------+--------+
                             |  HTTPS / JWT
                    +--------v--------+
                    | Backend API      |  Trust Boundary 2
                    | (Rust / Axum)    |
                    +---+----+----+---+
                        |    |    |
              +---------+    |    +--------+
              |              |             |
     +--------v--+  +-------v---+  +------v-----+
     | PostgreSQL |  |   Redis   |  |  RabbitMQ  |
     | (SoT)     |  | (Cache)   |  | (Queue)    |
     +--------+--+  +-----------+  +------------+
              |
     +--------v-----------+
     |  L3 Aegis           |  Trust Boundary 3
     |  (4-node BFT)       |
     +--------+------------+
              |
     +--------v-----------+
     |  L1 Ethereum        |  Trust Boundary 4
     |  (Sepolia/Mainnet)  |
     +---------------------+
```

### 1.2 Core Assets Protected

| Asset | Value | Protection Mechanism |
|-------|-------|---------------------|
| User ETH Deposits | Variable (target: 1000+ ETH TVL) | Vault contract + Dilithium signatures |
| Prover Bonds | $400K USD per prover | Staking contract + Slashing |
| User Private Keys | Priceless | Client-side only, never transmitted |
| Dilithium Key Pairs | Critical | Generated client-side, encrypted backup |
| JWT Sessions | Medium | Redis TTL + Refresh rotation |
| Admin Access | Critical | JWT + role-based access |

---

## 2. Trust Boundaries

### TB-1: User Browser <-> Frontend

| Property | Implementation |
|----------|---------------|
| Transport | HTTPS/TLS 1.3 |
| Authentication | SIWE (EIP-191) + JWT |
| Session | Access token (short) + Refresh token (7d) |
| Trust Level | Untrusted (user-controlled environment) |

### TB-2: Frontend <-> Backend API

| Property | Implementation |
|----------|---------------|
| Transport | HTTPS (internal: HTTP in dev) |
| Authentication | JWT Bearer tokens |
| Authorization | Role-based (User, Prover, Observer, Admin) |
| Input Validation | Rust type system + serde deserialization |
| Trust Level | Semi-trusted (controlled infrastructure) |

### TB-3: Backend <-> L3 Aegis

| Property | Implementation |
|----------|---------------|
| Transport | JSON-RPC over HTTP |
| Verification | BFT consensus (3/4 nodes) |
| Signature | SPHINCS+ for prover operations |
| Trust Level | Trusted (controlled validator set) |

### TB-4: L3 <-> L1 Ethereum

| Property | Implementation |
|----------|---------------|
| Transport | JSON-RPC (Infura/Alchemy) |
| Verification | Smart contract logic + State Roots |
| Finality | L1 block confirmations |
| Trust Level | Trustless (blockchain consensus) |

---

## 3. Threat Categories (STRIDE)

### 3.1 Spoofing

| # | Threat | Target | Severity | Mitigation | Status |
|:-:|--------|--------|:--------:|------------|:------:|
| S-1 | Wallet address spoofing | Authentication | HIGH | SIWE signature verification (EIP-191) | Implemented |
| S-2 | JWT token forgery | Session | HIGH | HMAC-SHA256 signing, short TTL | Implemented |
| S-3 | Admin impersonation | Admin routes | CRITICAL | JWT + role check in middleware | Implemented |
| S-4 | Prover identity spoofing | Unlock signing | CRITICAL | SPHINCS+ signature binding to prover ID | Implemented |
| S-5 | Dilithium key spoofing | Lock/Unlock | CRITICAL | Key bound to lock at creation time | Implemented |

### 3.2 Tampering

| # | Threat | Target | Severity | Mitigation | Status |
|:-:|--------|--------|:--------:|------------|:------:|
| T-1 | Transaction data modification | Unlock flow | CRITICAL | ML-DSA-65 signature covers all fields | Implemented |
| T-2 | State root manipulation | L3 state | CRITICAL | SHA3-256 + BFT consensus | Implemented |
| T-3 | Database record tampering | PostgreSQL | HIGH | Access control + audit trail | Partial |
| T-4 | Redis cache poisoning | Session/cache | MEDIUM | AUTH enabled, isolated network | Partial |
| T-5 | Smart contract state | L1 contracts | CRITICAL | Immutable + time locks | Implemented |

### 3.3 Repudiation

| # | Threat | Target | Severity | Mitigation | Status |
|:-:|--------|--------|:--------:|------------|:------:|
| R-1 | User denies lock request | Financial | MEDIUM | Dilithium signature + L1 receipt | Implemented |
| R-2 | Prover denies signing | Unlock flow | HIGH | SPHINCS+ signature stored in DB + L3 | Implemented |
| R-3 | Admin denies action | Governance | HIGH | Audit log (BE-003 logging) | Implemented |

### 3.4 Information Disclosure

| # | Threat | Target | Severity | Mitigation | Status |
|:-:|--------|--------|:--------:|------------|:------:|
| I-1 | Private key exposure | User funds | CRITICAL | Client-side only, never transmitted | Implemented |
| I-2 | JWT leak via logs | Session | MEDIUM | Structured logging without secrets | Implemented |
| I-3 | Database credential exposure | Infrastructure | HIGH | Environment variables | Partial |
| I-4 | API response over-sharing | User data | LOW | Scoped responses per role | Implemented |
| I-5 | L1 RPC key exposure | Infrastructure | MEDIUM | Server-side only | Implemented |

### 3.5 Denial of Service

| # | Threat | Target | Severity | Mitigation | Status |
|:-:|--------|--------|:--------:|------------|:------:|
| D-1 | API rate limiting bypass | Backend | HIGH | Per-user rate limiting | Implemented |
| D-2 | L3 node flooding | Consensus | HIGH | BFT + message filtering | Partial |
| D-3 | Database exhaustion | Storage | MEDIUM | Connection pool limits (50 max) | Implemented |
| D-4 | Redis memory exhaustion | Cache | MEDIUM | TTL enforcement | Implemented |
| D-5 | Frontend DDoS | User access | HIGH | CDN/CloudFlare required | NOT STARTED |

### 3.6 Elevation of Privilege

| # | Threat | Target | Severity | Mitigation | Status |
|:-:|--------|--------|:--------:|------------|:------:|
| E-1 | User -> Admin escalation | Admin routes | CRITICAL | Role-based JWT claims | Implemented |
| E-2 | Observer -> Prover | Role abuse | HIGH | Separate registration + stake | Implemented |
| E-3 | Single prover -> quorum | Unlock fraud | CRITICAL | VRF random selection, 2/5 threshold | Implemented |

---

## 4. Asset Inventory

### 4.1 Cryptographic Keys

| Key Type | Algorithm | Size | Storage | Rotation |
|----------|-----------|------|---------|----------|
| User Signing Key | ML-DSA-65 (FIPS 204) | 1952B pub / 4032B priv | Client-side (browser) | User-managed |
| Prover Signing Key | SPHINCS+-SHA2-128f | 32B pub / 64B priv | HSM (required) | On compromise |
| JWT Secret | HMAC-SHA256 | 256-bit | Environment variable | Manual |
| Admin API Key | Random | 256-bit | Environment variable | Manual |
| L1 Private Key | secp256k1 | 32B | Environment variable | Manual |

### 4.2 Data Classification

| Classification | Examples | Protection |
|---------------|----------|------------|
| **CRITICAL** | Private keys, vault balances | Encryption at rest, HSM |
| **HIGH** | User addresses, lock amounts, JWT tokens | TLS, access control |
| **MEDIUM** | Transaction history, prover metrics | Authentication required |
| **LOW** | Public chain data, governance proposals | Public by design |

---

## 5. Attack Surface Analysis

### 5.1 External Attack Surface

| Surface | Entry Points | Protocols | Risk |
|---------|-------------|-----------|:----:|
| Frontend | 12 web applications | HTTPS | MEDIUM |
| API Server | 102 endpoints | HTTPS + JSON | HIGH |
| L1 Contracts | Public functions | Ethereum TX | CRITICAL |
| L3 Nodes | RPC endpoints | JSON-RPC | HIGH |
| Database | Port 5432 | TCP | CRITICAL |
| Redis | Port 6379 | RESP | HIGH |
| RabbitMQ | Port 5672/15672 | AMQP | MEDIUM |

### 5.2 API Endpoint Risk Classification

| Category | Endpoints | Auth Required | Risk Level |
|----------|:---------:|:------------:|:----------:|
| Lock/Unlock | 5 | SIWE + Dilithium | CRITICAL |
| Emergency | 3 | SIWE + Dilithium + Bond | CRITICAL |
| Prover Operations | 6 | SPHINCS+ | HIGH |
| Observer/Challenge | 4 | SIWE + Bond | HIGH |
| Governance | 5 | SIWE + veQS | HIGH |
| Admin | 65 | JWT (Admin role) | CRITICAL |
| Public (Explorer) | 10+ | None | LOW |
| Health/Status | 2 | None | LOW |

---

## 6. Threat Scenarios

### 6.1 TS-001: Unauthorized Unlock (CRITICAL)

```
Attacker Goal: Steal locked ETH without proper authorization
Attack Path:
  1. Obtain user's wallet address (public)
  2. Attempt unlock without Dilithium signature
  3. OR: Forge/replay Dilithium signature
  4. OR: Compromise 2/5 Provers for SPHINCS+ signatures

Mitigations:
  [x] ML-DSA-65 signature required (quantum-resistant)
  [x] 2/5 Prover threshold with SPHINCS+
  [x] VRF-based random Prover selection
  [x] 24-hour time lock for monitoring
  [x] State root verification on L1
  [ ] Finality confirmation (32 L1 blocks) - NEEDS IMPLEMENTATION

Residual Risk: LOW (multi-layer protection)
```

### 6.2 TS-002: Prover Collusion Attack (HIGH)

```
Attacker Goal: 2+ Provers collude to approve fraudulent unlock
Attack Path:
  1. Register 2+ Prover nodes ($400K stake each)
  2. Wait for VRF to select both compromised provers
  3. Both sign fraudulent unlock
  4. Extract funds before 24h monitoring period

Mitigations:
  [x] Quadratic slashing: N^2 x 10%
       - 2 provers: 40% stake ($160K each)
       - 3 provers: 90% stake ($360K each)
  [x] VRF random selection (unpredictable assignment)
  [x] 24-hour monitoring window
  [x] Observer challenge system
  [x] Prover bond: $400K minimum

Risk Calculation:
  - Cost to attack (2 provers): $800K stake, -$320K slashing = $480K at risk
  - Probability of 2/5 selection: ~10% per unlock
  - Expected loss: -$320K per attempt
  - Economic incentive: Negative (unless stealing >$480K)

Residual Risk: MEDIUM (economically irrational for amounts <$500K)
```

### 6.3 TS-003: Emergency Path Abuse (HIGH)

```
Attacker Goal: Bypass normal security by triggering emergency unlock
Attack Path:
  1. DDoS all Provers to create 72h timeout
  2. Trigger emergency unlock path
  3. Post bond (5% of amount)
  4. Claim after 7-day waiting

Mitigations:
  [x] Bond: MAX(0.5 ETH, amount x 5%) - economic deterrent
  [x] 7-day time lock (10x longer than normal)
  [x] Extended monitoring by Observers
  [x] Lower challenge threshold during emergency
  [ ] Prover availability monitoring - PARTIAL
  [ ] DDoS protection for Prover nodes - NEEDS IMPLEMENTATION

Residual Risk: MEDIUM (7-day window allows detection)
```

### 6.4 TS-004: Governance Attack (HIGH)

```
Attacker Goal: Pass malicious governance proposal
Attack Paths:
  A. Flash loan governance (acquire veQS temporarily)
  B. Whale vote buying
  C. Security Council capture (5/9 members)

Mitigations:
  [x] Snapshot voting at proposal creation block (prevents flash loans)
  [x] Type-specific quorum: 3%-15%
  [x] 7-day discussion + 7-day voting + 7-day time lock
  [x] Security Council veto (6/9 for principle violations)
  [x] Council changes require 15% quorum token vote
  [ ] On-chain snapshot verification - PARTIAL (L3 only)

Residual Risk: MEDIUM (21-day total delay allows community response)
```

### 6.5 TS-005: Cross-Chain Bridge Exploit (CRITICAL)

```
Attacker Goal: Exploit L3<->L1 bridge to drain vault
Attack Path:
  1. Manipulate L3 state root (SR_1)
  2. Submit fraudulent proof to L1 vault
  3. Withdraw funds

Mitigations:
  [x] SHA3-256 state root computation (collision-resistant)
  [x] BFT consensus (3/4 agreement required)
  [x] SMT inclusion proofs
  [x] Prover attestation (2/5 SPHINCS+)
  [x] Time lock on L1 claims
  [ ] L1 finality verification (32 blocks) - NEEDS IMPLEMENTATION
  [ ] Fraud proof system - NEEDS DESIGN

Residual Risk: MEDIUM (multi-layer but single-chain verification)
```

### 6.6 TS-006: Admin Key Compromise (CRITICAL)

```
Attacker Goal: Use compromised admin credentials to manipulate system
Attack Paths:
  1. Steal admin JWT token
  2. Compromise admin wallet private key
  3. Social engineering admin credentials

Impact:
  - Emergency pause abuse
  - Treasury manipulation
  - Prover/Observer management
  - Data exfiltration

Mitigations:
  [x] JWT-based admin auth with role verification
  [x] Audit logging (BE-003) for all admin actions
  [ ] Multi-sig admin operations - NEEDS IMPLEMENTATION
  [ ] HSM/KMS for admin keys - NEEDS IMPLEMENTATION
  [ ] IP allowlisting for admin routes - NEEDS IMPLEMENTATION

Residual Risk: HIGH (single-key admin access)
```

---

## 7. Cryptographic Threat Analysis

### 7.1 Quantum Computing Threats

| Algorithm | Quantum Risk | NIST Status | Our Usage | Risk Level |
|-----------|:----------:|:-----------:|-----------|:----------:|
| ML-DSA-65 | Resistant | FIPS 204 (2024) | User Lock/Unlock | LOW |
| SPHINCS+ | Resistant | FIPS 205 (2024) | Prover signatures | LOW |
| SHA3-256 | Resistant | FIPS 202 (2015) | State roots, hashing | LOW |
| secp256k1 (ECDSA) | Vulnerable | Pre-quantum | SIWE auth only | MEDIUM |
| AES-256 | Grover's sqrt | NIST approved | Not used directly | N/A |

**Assessment**: Core financial operations use quantum-resistant algorithms (ML-DSA-65, SPHINCS+). ECDSA is only used for wallet compatibility (SIWE authentication), not for asset protection.

### 7.2 Implementation Risks

| Risk | Description | Severity | Mitigation |
|------|-------------|:--------:|------------|
| Side-channel leakage | Timing attacks on signature verification | MEDIUM | `fips204` crate uses constant-time ops |
| Nonce reuse (ML-DSA-65) | Deterministic nonce from spec | LOW | FIPS 204 specifies deterministic nonce |
| Key generation entropy | Weak RNG for key generation | HIGH | Client-side `crypto.getRandomValues()` |
| Signature size mismatch | SPHINCS+ size: 7856 bytes | LOW | Fixed in BUG-001 (2026-02-08) |

### 7.3 Dev Mode Signature Bypass

```rust
// CRITICAL: This bypass exists in unlock.rs
// Must be removed or gated for production builds
#[cfg(debug_assertions)]
fn verify_dilithium_signature(...) -> Result<bool> {
    // Dev mode: skip verification
    return Ok(true);
}
```

**Status**: EXISTS in codebase
**Required Action**: Ensure production builds compile with `--release` flag
**Verification**: `grep -r "debug_assertions" services/api/src/`

---

## 8. Cross-Chain Bridge Threats

### 8.1 L3 Aegis Consensus

| Property | Value | Threat |
|----------|-------|--------|
| Node count | 4 | 1 Byzantine tolerance |
| Consensus | PBFT variant | 3/4 agreement needed |
| Block time | ~2 seconds | Fast finality |
| Validator set | Fixed (Foundation) | Centralization risk |

**Threat**: If attacker controls 2/4 L3 nodes, consensus breaks.
**Mitigation**: L3 validators are Foundation-operated; expansion to 7+ planned for Phase 2.

### 8.2 State Root Verification

```
Lock Flow:
  User -> L1 Vault (deposit) -> Event emitted
  L3 monitors L1 events -> Creates lock record
  L3 computes SR_0 = SHA3(lock_data) -> Stores in SMT

Unlock Flow:
  User -> L3 (unlock request + Dilithium sig)
  L3 -> VRF -> Select Provers -> Collect SPHINCS+ sigs
  L3 computes SR_1 = SHA3(unlock_data + prover_sigs)
  SR_1 submitted to L1 -> Vault verifies SR_0 match -> Release funds
```

**Gap**: L1 finality check not implemented (L1 reorg could invalidate lock).

### 8.3 Bridge-Specific Threats

| Threat | Impact | Probability | Mitigation |
|--------|:------:|:-----------:|------------|
| L1 reorg after lock confirmation | Loss of funds tracking | LOW | Wait 32 blocks (needs implementation) |
| L3 consensus split | Double-spend | VERY LOW | 4-node BFT + monitoring |
| SR forgery | Unauthorized withdrawal | VERY LOW | SHA3-256 + BFT + Prover attestation |
| Event replay | Duplicate lock creation | LOW | Nonce + event deduplication |

---

## 9. Governance & Economic Threats

### 9.1 Economic Attack Vectors

| Attack | Cost | Expected Return | Profitable? |
|--------|:----:|:---------------:|:-----------:|
| 2-Prover collusion | $800K stake | -$320K (slashing) | No (<$500K target) |
| Emergency path abuse | 5% bond | -7 day delay | No (monitoring) |
| Governance takeover | >4% veQS supply | Variable | Possible (whale risk) |
| Challenge griefing | 0.1 ETH bond | -bond if invalid | No (bond forfeit) |
| Flash loan vote | Token purchase | N/A | No (snapshot voting) |

### 9.2 veQS Economic Model

```
Voting Power = Locked QS x (Remaining Time / 4 years)
Max Lock: 4 years = 1.0x ratio
Min Lock: 6 months = 0.125x ratio

Attack Cost (governance takeover with 4% quorum):
  Total QS Supply: TBD
  Required: 4% of locked veQS
  Lock period: Must lock for meaningful voting power
  Cost: Significant capital lockup + opportunity cost
```

---

## 10. Operational Security

### 10.1 Infrastructure Requirements

| Component | Current | Production Required | Gap |
|-----------|---------|-------------------|:---:|
| Database | Single PostgreSQL | Primary + Read replica | GAP |
| Cache | Single Redis | Redis Cluster or Sentinel | GAP |
| API Server | Single instance | 3+ instances + LB | GAP |
| L3 Nodes | 4 nodes (dev) | 7+ nodes (production) | GAP |
| Monitoring | Basic logging | Grafana + PagerDuty | GAP |
| Backup | None | Daily encrypted backups | GAP |
| DDoS | None | CloudFlare/AWS Shield | GAP |
| Secret Mgmt | Env vars | HashiCorp Vault/AWS KMS | GAP |

### 10.2 Access Control Matrix

| Role | API Access | Admin Panel | L3 Operations | L1 Operations |
|------|:----------:|:-----------:|:------------:|:------------:|
| End User | Read + Lock/Unlock | None | Via API | Via L3 |
| Prover | Prover endpoints | None | Sign operations | Via L3 |
| Observer | Observer endpoints | None | Monitor only | None |
| Admin | All endpoints | Full access | Admin operations | Emergency only |
| Super Admin | All + system | Full + config | All operations | All operations |

### 10.3 Incident Classification

| Level | Description | Response Time | Examples |
|:-----:|------------|:------------:|---------|
| P0 | Fund loss or imminent risk | 15 minutes | Exploit detected, key compromise |
| P1 | Service degradation | 1 hour | API down, L3 consensus stall |
| P2 | Feature malfunction | 4 hours | Failed unlock, wrong calculation |
| P3 | Minor issue | 24 hours | UI bug, slow response |

---

## 11. Mitigation Matrix

### 11.1 Pre-Launch (Must Complete)

| # | Mitigation | Threat Addressed | Priority | Effort | Status |
|:-:|------------|-----------------|:--------:|:------:|:------:|
| M-01 | Remove dev mode signature bypass | TS-001 | P0 | 1 day | PENDING |
| M-02 | Implement L1 finality check (32 blocks) | TS-005 | P0 | 2 days | PENDING |
| M-03 | PostgreSQL nonce fallback (Redis failure) | S-2 | P0 | 1 day | PENDING |
| M-04 | Admin multi-sig requirement | TS-006 | P0 | 3 days | PENDING |
| M-05 | HSM/KMS integration for admin keys | TS-006 | P0 | 5 days | PENDING |
| M-06 | DDoS protection (CloudFlare) | D-5 | P1 | 2 days | PENDING |
| M-07 | Database encryption at rest | I-3 | P1 | 1 day | PENDING |
| M-08 | Prover exit pending queue check | TS-002 | P1 | 1 day | PENDING |
| M-09 | Dependency vulnerability scan | General | P1 | 1 day | PENDING |
| M-10 | CSP/CSRF header verification | T-1 | P1 | 1 day | PENDING |

### 11.2 Phase 2 (Post-Audit)

| # | Mitigation | Threat Addressed | Priority |
|:-:|------------|-----------------|:--------:|
| M-11 | Formal verification of smart contracts | TS-005 | P2 |
| M-12 | L3 validator expansion (4 -> 7+) | TS-005 | P2 |
| M-13 | Decentralized Observer network | TS-003 | P2 |
| M-14 | Insurance coverage (Nexus Mutual) | General | P2 |
| M-15 | Bug bounty program | General | P1 |

---

## 12. Risk Register

### 12.1 Current Risk Summary

| ID | Risk | Impact | Likelihood | Current Level | Target Level |
|:--:|------|:------:|:----------:|:------------:|:------------:|
| R-01 | Smart contract exploit | CRITICAL | Low | HIGH | LOW |
| R-02 | Prover collusion | CRITICAL | Very Low | MEDIUM | LOW |
| R-03 | Admin key compromise | CRITICAL | Medium | HIGH | LOW |
| R-04 | L3 consensus failure | HIGH | Low | MEDIUM | LOW |
| R-05 | Governance takeover | HIGH | Low | MEDIUM | LOW |
| R-06 | Emergency path abuse | HIGH | Low | MEDIUM | LOW |
| R-07 | Cross-chain bridge exploit | CRITICAL | Very Low | MEDIUM | LOW |
| R-08 | Quantum computing advancement | HIGH | Very Low | LOW | LOW |
| R-09 | DDoS attack | MEDIUM | Medium | HIGH | LOW |
| R-10 | Key management failure | HIGH | Medium | HIGH | LOW |

### 12.2 Risk Acceptance Criteria

```
Acceptable: All risks at LOW level
Launch Blocker: Any CRITICAL risk at HIGH level
Conditional: HIGH risks with documented mitigation timeline
```

### 12.3 Current Launch Readiness (Security)

```
Blocking Issues (must resolve):
  [x] FIX-001~027 complete (crash/mock/params)
  [ ] M-01: Remove dev mode signature bypass
  [ ] M-02: L1 finality check
  [ ] M-04: Admin multi-sig
  [ ] M-05: HSM/KMS integration
  [ ] External audit (Smart Contracts + Backend)

Conditional (timeline required):
  [ ] M-03: PostgreSQL nonce fallback
  [ ] M-06: DDoS protection
  [ ] M-08: Prover exit queue check
  [ ] M-15: Bug bounty program
```

---

## Appendix A: STRIDE Analysis Diagram

```
+------------------+     +------------------+     +------------------+
|   SPOOFING       |     |   TAMPERING      |     |  REPUDIATION     |
|                  |     |                  |     |                  |
| S-1: Wallet      |     | T-1: TX data     |     | R-1: Lock deny   |
| S-2: JWT         |     | T-2: State root  |     | R-2: Prover deny |
| S-3: Admin       |     | T-3: DB records  |     | R-3: Admin deny  |
| S-4: Prover ID   |     | T-4: Redis cache |     |                  |
| S-5: Dilithium   |     | T-5: Contract    |     |                  |
+------------------+     +------------------+     +------------------+

+------------------+     +------------------+     +------------------+
| INFO DISCLOSURE  |     |   DENIAL OF SVC  |     |  ELEV. PRIVILEGE |
|                  |     |                  |     |                  |
| I-1: Private key |     | D-1: Rate limit  |     | E-1: User->Admin |
| I-2: JWT leak    |     | D-2: L3 flood    |     | E-2: Obs->Prover |
| I-3: DB creds    |     | D-3: DB exhaust  |     | E-3: Single->All |
| I-4: API over    |     | D-4: Redis OOM   |     |                  |
| I-5: RPC key     |     | D-5: DDoS        |     |                  |
+------------------+     +------------------+     +------------------+
```

## Appendix B: Threat Scenario Priority

```
                    HIGH IMPACT
                        ^
                        |
            TS-001      |     TS-005
           (Unauth     |    (Bridge
            Unlock)     |     Exploit)
                        |
                  TS-006 |
                 (Admin  |
                  Key)   |
    +-----------+--------+-----------+
                |        |
            TS-002      | TS-004
           (Prover      | (Governance)
            Collusion)  |
                        |
            TS-003      |
           (Emergency   |
            Abuse)      |
                        |
                        v
                    LOW IMPACT

    LOW PROBABILITY  <------>  HIGH PROBABILITY
```

---

*Generated: 2026-02-12*
*Next Review: Before External Audit (Phase C)*
*Owner: Development Team + CEO*
