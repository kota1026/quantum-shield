# Quantum Shield Requirements Specification

> **Version**: 1.0
> **Date**: 2026-01-27
> **Status**: Draft

---

## 1. Overview

### 1.1 Project Purpose

Quantum Shield is a post-quantum secure cross-chain bridge that enables users to transfer digital assets between blockchains with protection against both current and future quantum computing threats.

### 1.2 Target Users

| User Type | Description | Primary Goals |
|-----------|-------------|---------------|
| **Consumer** | Individual asset holders | Securely lock/unlock assets across chains |
| **Prover** | L3 Node Operators | Operate L3 nodes for BFT consensus AND provide SPHINCS+ signatures |
| **Observer** | Network monitors | Detect fraudulent transactions, earn rewards |
| **Delegate** | veQS holders | Participate in governance without active voting |
| **Enterprise** | Institutional users | Manage custody with enhanced controls |
| **QS Admin** | Foundation operators | Monitor and maintain protocol |

### 1.3 Success Criteria

- Zero asset loss from quantum attacks
- 24-hour normal unlock time (7 days emergency)
- 99.9% uptime for critical operations
- Support for 100,000+ concurrent locks

---

## 2. Glossary

| Term | Definition |
|------|------------|
| **ML-DSA-65** | Module-Lattice-Based Digital Signature Algorithm (NIST FIPS 204) |
| **SPHINCS+** | Stateless hash-based signature scheme for prover signatures |
| **SR_0** | State Root at lock time (SHA3-256 hash) |
| **SR_1** | State Root at unlock time (SHA3-256 hash) |
| **VRF** | Verifiable Random Function (Chainlink VRF v2.5) |
| **L3 Prover Network** | Decentralized network of L3 nodes operated by Provers for BFT consensus |
| **veQS** | Vote-escrowed QS tokens (time-locked for governance) |
| **Time Lock** | Mandatory waiting period before asset release |
| **Challenge** | Dispute against suspected fraudulent unlock |
| **Slashing** | Penalty for proven fraudulent behavior |

---

## 3. Functional Requirements

### 3.1 Lock Operations (FR-LOCK)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-LOCK-001 | User SHALL be able to lock ERC-20 assets | P0 |
| FR-LOCK-002 | Lock SHALL require ML-DSA-65 signature verification | P0 |
| FR-LOCK-003 | System SHALL compute SR_0 using SHA3-256 | P0 |
| FR-LOCK-004 | System SHALL generate unique lock_id | P0 |
| FR-LOCK-005 | System SHALL prevent nonce reuse | P0 |
| FR-LOCK-006 | Lock SHALL include expiry timestamp | P0 |
| FR-LOCK-007 | System SHALL notify Event Bridge on lock creation | P1 |
| FR-LOCK-008 | System SHALL generate SMT proof | P1 |

### 3.2 Unlock Operations (FR-UNLOCK)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-UNLOCK-001 | User SHALL be able to request normal unlock (24h) | P0 |
| FR-UNLOCK-002 | User SHALL be able to request emergency unlock (7d) | P0 |
| FR-UNLOCK-003 | Unlock SHALL require ML-DSA-65 signature verification | P0 |
| FR-UNLOCK-004 | System SHALL compute SR_1 using SHA3-256 | P0 |
| FR-UNLOCK-005 | System SHALL request VRF for prover selection | P0 |
| FR-UNLOCK-006 | System SHALL collect 2-of-5 SPHINCS+ signatures | P0 |
| FR-UNLOCK-007 | Emergency unlock SHALL require bond | P0 |
| FR-UNLOCK-008 | Bond SHALL be MAX(0.1 ETH, amount × 5%) | P0 |
| FR-UNLOCK-009 | Time lock SHALL start after signature collection | P1 |
| FR-UNLOCK-010 | Assets SHALL be claimable after time lock expires | P0 |

### 3.3 Challenge Operations (FR-CHALLENGE)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-CHALLENGE-001 | Observer SHALL be able to submit challenge | P0 |
| FR-CHALLENGE-002 | Challenge SHALL require bond: MAX(0.1 ETH, amount × 1%) | P0 |
| FR-CHALLENGE-003 | Defense period SHALL be 48 hours | P0 |
| FR-CHALLENGE-004 | Prover SHALL be able to submit defense | P0 |
| FR-CHALLENGE-005 | System SHALL auto-resolve after deadline | P0 |
| FR-CHALLENGE-006 | Slashing SHALL be quadratic: N² × 10% | P0 |
| FR-CHALLENGE-007 | Distribution SHALL be: 60% Challenger, 20% Insurance, 20% Burn | P0 |

### 3.4 Prover Operations (FR-PROVER)

> **Integrated Model**: Prover = L3 Node Operator (Succinct Network approach)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-PROVER-001 | Operator SHALL be able to register as Prover (L3 Node Operator) | P0 |
| FR-PROVER-002 | Registration SHALL require HSM attestation | P0 |
| FR-PROVER-003 | Registration SHALL require minimum stake ($400K equivalent) | P0 |
| FR-PROVER-004 | Prover SHALL operate L3 node for BFT consensus | P0 |
| FR-PROVER-005 | Prover SHALL use Dilithium-III for L3 block signing | P0 |
| FR-PROVER-006 | Prover SHALL be able to view signing queue | P0 |
| FR-PROVER-007 | Prover SHALL provide SPHINCS+ signature when selected by VRF | P0 |
| FR-PROVER-008 | Prover SHALL earn consensus rewards AND signature fees | P1 |
| FR-PROVER-009 | Prover SHALL be able to initiate exit | P0 |
| FR-PROVER-010 | Exit SHALL have 7-day unbonding period | P0 |
| FR-PROVER-011 | Stake withdrawal SHALL require no pending challenges | P0 |

### 3.5 Observer Operations (FR-OBSERVER)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-OBSERVER-001 | Observer SHALL be able to view pending unlocks | P0 |
| FR-OBSERVER-002 | System SHALL display risk score for transactions | P1 |
| FR-OBSERVER-003 | Observer SHALL be able to submit challenge | P0 |
| FR-OBSERVER-004 | Observer SHALL earn 60% of slashed amount | P0 |
| FR-OBSERVER-005 | Observer SHALL be able to claim earnings | P0 |

### 3.6 Governance Operations (FR-GOV)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-GOV-001 | veQS holder SHALL be able to create proposal | P1 |
| FR-GOV-002 | Proposal creation SHALL require minimum veQS | P1 |
| FR-GOV-003 | veQS holder SHALL be able to vote | P0 |
| FR-GOV-004 | Voting power SHALL be proportional to veQS | P0 |
| FR-GOV-005 | veQS holder SHALL be able to delegate voting power | P1 |
| FR-GOV-006 | Proposal SHALL require quorum to pass | P0 |
| FR-GOV-007 | Passed proposals SHALL have execution delay | P1 |

### 3.7 Token Hub Operations (FR-TOKEN)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-TOKEN-001 | User SHALL be able to lock QS for veQS | P1 |
| FR-TOKEN-002 | veQS amount SHALL depend on lock duration | P1 |
| FR-TOKEN-003 | Lock duration SHALL be 7-1460 days | P1 |
| FR-TOKEN-004 | User SHALL be able to extend lock duration | P1 |
| FR-TOKEN-005 | User SHALL be able to delegate veQS | P1 |
| FR-TOKEN-006 | User SHALL earn epoch rewards for holding veQS | P2 |
| FR-TOKEN-007 | User SHALL be able to claim accumulated rewards | P2 |

### 3.8 Authentication (FR-AUTH)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-AUTH-001 | System SHALL support SIWE authentication | P0 |
| FR-AUTH-002 | SIWE SHALL use ML-DSA-65 signature | P0 |
| FR-AUTH-003 | System SHALL issue JWT access tokens | P0 |
| FR-AUTH-004 | Access token SHALL expire in 15 minutes | P0 |
| FR-AUTH-005 | System SHALL issue refresh tokens | P0 |
| FR-AUTH-006 | Refresh token SHALL expire in 7 days | P0 |

---

## 4. Non-Functional Requirements

### 4.1 Performance (NFR-PERF)

| ID | Requirement | Target | Priority |
|----|-------------|--------|:--------:|
| NFR-PERF-001 | Lock creation latency | < 2 seconds | P0 |
| NFR-PERF-002 | Signature verification latency | < 500ms | P0 |
| NFR-PERF-003 | API response time (p95) | < 1 second | P1 |
| NFR-PERF-004 | Concurrent lock support | 100,000+ | P1 |
| NFR-PERF-005 | VRF response time | < 5 minutes | P0 |
| NFR-PERF-006 | Challenge submission latency | < 3 seconds | P1 |

### 4.2 Security (NFR-SEC)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| NFR-SEC-001 | ALL user signatures SHALL use ML-DSA-65 (FIPS 204) | P0 |
| NFR-SEC-002 | ALL prover unlock signatures SHALL use SPHINCS+-128s | P0 |
| NFR-SEC-002a | ALL L3 consensus signatures SHALL use Dilithium-III (FIPS 204) | P0 |
| NFR-SEC-003 | ALL hashing SHALL use SHA3-256 (FIPS 202) | P0 |
| NFR-SEC-004 | NO keccak256 or ECDSA SHALL be used for security-critical operations | P0 |
| NFR-SEC-005 | Prover keys SHALL be stored in HSM | P0 |
| NFR-SEC-006 | JWT tokens SHALL be signed with HS256 minimum | P1 |
| NFR-SEC-007 | API SHALL enforce rate limiting | P1 |
| NFR-SEC-008 | System SHALL maintain audit logs for all operations | P1 |

### 4.2.1 Quantum Resistance (NFR-QR) ★NEW

> **原則**: Quantum Shieldエコシステム全体を量子耐性化

| ID | Requirement | Priority |
|----|-------------|:--------:|
| NFR-QR-001 | ALL value-transfer operations SHALL be authorized via L3 with Dilithium | P0 |
| NFR-QR-002 | veQS staking operations SHALL require L3 Dilithium signature | P0 |
| NFR-QR-003 | Governance voting SHALL require L3 Dilithium signature | P0 |
| NFR-QR-004 | Treasury transfers SHALL require L3 multisig Dilithium approval | P0 |
| NFR-QR-005 | Large QS token transfers (>10K) SHALL require L3 approval | P0 |
| NFR-QR-006 | L1 contracts SHALL verify L3 proofs before execution | P0 |
| NFR-QR-007 | Admin emergency operations SHALL require L3 multisig (3/5) | P0 |
| NFR-QR-008 | L3 SHALL be the source of truth for governance state | P0 |
| NFR-QR-009 | L1 SHALL act as Settlement Layer executing L3 decisions | P0 |

### 4.3 Availability (NFR-AVAIL)

| ID | Requirement | Target | Priority |
|----|-------------|--------|:--------:|
| NFR-AVAIL-001 | System uptime | 99.9% | P0 |
| NFR-AVAIL-002 | L1 contract availability | 99.99% | P0 |
| NFR-AVAIL-003 | API availability | 99.9% | P1 |
| NFR-AVAIL-004 | VRF fallback mechanism | < 5 min timeout | P0 |
| NFR-AVAIL-005 | Recovery Time Objective (RTO) | < 1 hour | P1 |
| NFR-AVAIL-006 | Recovery Point Objective (RPO) | < 5 minutes | P1 |

### 4.4 Scalability (NFR-SCALE)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| NFR-SCALE-001 | System SHALL support horizontal scaling | P1 |
| NFR-SCALE-002 | Database SHALL support sharding | P2 |
| NFR-SCALE-003 | Message queue SHALL handle 10,000+ msgs/sec | P1 |
| NFR-SCALE-004 | System SHALL support multi-chain deployment | P2 |

### 4.5 Compliance (NFR-COMP)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| NFR-COMP-001 | Cryptography SHALL comply with NIST PQC standards | P0 |
| NFR-COMP-002 | System SHALL maintain GDPR compliance | P1 |
| NFR-COMP-003 | System SHALL support audit trail for 7 years | P1 |
| NFR-COMP-004 | System SHALL support KYB for institutional users | P2 |

---

## 5. Constraints

### 5.1 Technical Constraints

| ID | Constraint | Rationale |
|----|------------|-----------|
| TC-001 | Must use ML-DSA-65 for user signatures | NIST FIPS 204 compliance |
| TC-002 | Must use SPHINCS+-128s for prover signatures | Post-quantum security |
| TC-003 | Must use SHA3-256 for all hashing | NIST FIPS 202 compliance |
| TC-004 | Must integrate Chainlink VRF v2.5 | Verifiable randomness |
| TC-005 | 24-hour minimum time lock | Challenge window requirement |
| TC-006 | 2-of-5 prover SPHINCS+ signature requirement | Byzantine fault tolerance |
| TC-007 | Prover network requires 3/4 BFT consensus (Dilithium-III) | L3 block finality |
| TC-008 | Each Prover operates L3 node AND provides signatures | Integrated model (Succinct approach) |

### 5.2 Business Constraints

| ID | Constraint | Rationale |
|----|------------|-----------|
| BC-001 | Must support Japanese language | Primary market |
| BC-002 | Must support English language | Global market |
| BC-003 | Must be deployed on Ethereum (L1) | Primary chain |
| BC-004 | Must support ERC-20 tokens | Standard assets |

---

## 6. Assumptions

| ID | Assumption |
|----|------------|
| A-001 | Users have compatible Web3 wallets |
| A-002 | Users can generate ML-DSA-65 keypairs |
| A-003 | Chainlink VRF is available on target chains |
| A-004 | L1 Ethereum provides sufficient finality |
| A-005 | Provers have access to HSM infrastructure |
| A-006 | Minimum 5 active provers in the network |
| A-007 | Provers have capability to run L3 nodes (infrastructure requirements) |
| A-008 | L3 Prover Network achieves 3/4 BFT consensus |

---

## 7. Dependencies

| ID | Dependency | Type | Status |
|----|------------|------|--------|
| D-001 | Ethereum L1 | External | Active |
| D-002 | Chainlink VRF v2.5 | External | Active |
| D-003 | fips204 Rust crate | Library | Active |
| D-004 | fips205 Rust crate | Library | Active |
| D-005 | sha3 Rust crate | Library | Active |
| D-006 | PostgreSQL 16 | Infrastructure | Active |
| D-007 | Redis 7 | Infrastructure | Active |
| D-008 | RabbitMQ 3.13 | Infrastructure | Active |

---

## 8. Admin Operations (FR-ADMIN)

> **QS Foundation Admin**: Protocol management dashboard for foundation operators

### 8.1 Admin Authentication (FR-ADMIN-AUTH)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-ADMIN-AUTH-001 | Admin SHALL authenticate via wallet signature | P0 |
| FR-ADMIN-AUTH-002 | System SHALL support 2FA for admin accounts | P0 |
| FR-ADMIN-AUTH-003 | Admin sessions SHALL expire after 30 minutes of inactivity | P1 |
| FR-ADMIN-AUTH-004 | System SHALL maintain admin session audit logs | P0 |

### 8.2 Admin User Management (FR-ADMIN-USER)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-ADMIN-USER-001 | Superadmin SHALL be able to create admin accounts | P0 |
| FR-ADMIN-USER-002 | Superadmin SHALL be able to assign roles to admins | P0 |
| FR-ADMIN-USER-003 | System SHALL support 4 permission levels (Superadmin, Admin, Operator, Viewer) | P0 |
| FR-ADMIN-USER-004 | Superadmin SHALL be able to suspend/revoke admin access | P0 |

### 8.3 Prover Application Management (FR-ADMIN-PROVER)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-ADMIN-PROVER-001 | Admin SHALL be able to view pending prover applications | P0 |
| FR-ADMIN-PROVER-002 | Admin SHALL be able to approve prover applications | P0 |
| FR-ADMIN-PROVER-003 | Admin SHALL be able to reject prover applications with reason | P0 |
| FR-ADMIN-PROVER-004 | System SHALL verify HSM attestation before approval | P0 |
| FR-ADMIN-PROVER-005 | System SHALL verify stake amount before approval | P0 |

### 8.4 Challenge Intervention (FR-ADMIN-CHALLENGE)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-ADMIN-CHALLENGE-001 | Admin SHALL be able to view all challenges | P0 |
| FR-ADMIN-CHALLENGE-002 | Admin SHALL be able to intervene in challenges | P1 |
| FR-ADMIN-CHALLENGE-003 | Admin intervention SHALL require Security Council approval | P0 |
| FR-ADMIN-CHALLENGE-004 | System SHALL log all challenge interventions | P0 |

### 8.5 Treasury Management (FR-ADMIN-TREASURY)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-ADMIN-TREASURY-001 | System SHALL support 5 treasury wallets | P0 |
| FR-ADMIN-TREASURY-002 | Treasury transfers SHALL require multisig approval | P0 |
| FR-ADMIN-TREASURY-003 | Admin SHALL be able to create expense requests | P1 |
| FR-ADMIN-TREASURY-004 | System SHALL track budget allocations | P1 |
| FR-ADMIN-TREASURY-005 | System SHALL generate financial reports | P2 |

### 8.6 Emergency Controls (FR-ADMIN-EMERGENCY)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-ADMIN-EMERGENCY-001 | Superadmin SHALL be able to pause system | P0 |
| FR-ADMIN-EMERGENCY-002 | System pause SHALL require Security Council multisig | P0 |
| FR-ADMIN-EMERGENCY-003 | Superadmin SHALL be able to resume system | P0 |
| FR-ADMIN-EMERGENCY-004 | System SHALL log all emergency actions | P0 |

### 8.7 Support Operations (FR-ADMIN-SUPPORT)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-ADMIN-SUPPORT-001 | Admin SHALL be able to manage support tickets | P1 |
| FR-ADMIN-SUPPORT-002 | Admin SHALL be able to create announcements | P1 |
| FR-ADMIN-SUPPORT-003 | System SHALL support ticket assignment | P1 |
| FR-ADMIN-SUPPORT-004 | System SHALL track ticket SLA | P2 |

### 8.8 Audit & Compliance (FR-ADMIN-AUDIT)

| ID | Requirement | Priority |
|----|-------------|:--------:|
| FR-ADMIN-AUDIT-001 | System SHALL log all admin actions | P0 |
| FR-ADMIN-AUDIT-002 | Admin SHALL be able to view audit logs | P0 |
| FR-ADMIN-AUDIT-003 | Audit logs SHALL be immutable | P0 |
| FR-ADMIN-AUDIT-004 | System SHALL support audit log export | P1 |

---

## 9. Traceability Matrix

### 9.1 Requirements to Sequences

| Requirement | Sequence | Section |
|-------------|----------|---------|
| FR-LOCK-* | Sequence #1: Lock | SEQUENCES.md §1 |
| FR-UNLOCK-001 | Sequence #2: Normal Unlock | SEQUENCES.md §2 |
| FR-UNLOCK-002 | Sequence #3: Emergency Unlock | SEQUENCES.md §3 |
| FR-CHALLENGE-* | Sequence #4: Challenge | SEQUENCES.md §4 |
| FR-PROVER-001-006 | Sequence #5: Prover Registration | SEQUENCES.md §5 |
| FR-PROVER-007-009 | Sequence #6: Prover Exit | SEQUENCES.md §6 |
| FR-GOV-* | Sequence #7: Governance | SEQUENCES.md §7 |

### 9.2 Requirements to API Endpoints

| Requirement | API Endpoint |
|-------------|--------------|
| FR-LOCK-001 | POST /v1/lock |
| FR-UNLOCK-001 | POST /v1/unlock |
| FR-UNLOCK-002 | POST /v1/unlock/emergency |
| FR-CHALLENGE-001 | POST /v1/challenge |
| FR-PROVER-001 | POST /v1/prover/register |
| FR-GOV-001 | POST /v1/governance/proposals |
| FR-GOV-003 | POST /v1/governance/vote |
| FR-ADMIN-AUTH-001 | POST /admin/auth/login |
| FR-ADMIN-USER-001 | POST /admin/settings/users |
| FR-ADMIN-PROVER-002 | POST /admin/applications/prover/:id/approve |
| FR-ADMIN-CHALLENGE-002 | POST /admin/challenges/:id/intervene |
| FR-ADMIN-TREASURY-003 | POST /admin/treasury/expenses |
| FR-ADMIN-EMERGENCY-001 | POST /admin/emergency/pause |
| FR-ADMIN-SUPPORT-002 | POST /admin/support/announcements |
| FR-ADMIN-AUDIT-002 | GET /admin/audit/logs |

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-27 | System | Initial creation |
| 1.1 | 2026-01-27 | System | Integrated model: Prover = L3 Node Operator (Succinct approach) |
| 1.2 | 2026-01-27 | System | Added FR-ADMIN-* requirements for QS Foundation Admin |
