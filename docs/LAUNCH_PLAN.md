# Quantum Shield - S-in Launch Plan & Post-Launch Strategy

> **Version**: 1.0
> **Date**: 2026-02-12
> **Status**: Draft - CEO Review Required
> **Current Readiness**: 92% (LAUNCH_READINESS.md)

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [S-in Prerequisites (Must Complete Before Launch)](#2-s-in-prerequisites)
3. [Phase Plan: S-in Roadmap](#3-phase-plan-s-in-roadmap)
4. [Security Checklist](#4-security-checklist)
5. [Required Documentation](#5-required-documentation)
6. [Audit Plan](#6-audit-plan)
7. [User Acceptance Testing (UAT) Plan](#7-user-acceptance-testing-plan)
8. [Post-Launch Strategy](#8-post-launch-strategy)
9. [Risk Matrix](#9-risk-matrix)
10. [Timeline](#10-timeline)

---

## 1. Current State Assessment

### 1.1 What's Complete

| Layer | Component | Status | Evidence |
|-------|-----------|:------:|----------|
| **Frontend** | 12 applications (136+ pages) | 100% | All apps rendered |
| **Frontend** | E2E Tests (144 files, ~1,062 tests) | 100% | All passing |
| **Frontend** | i18n (Japanese + English) | 100% | All screens |
| **Frontend** | React Hooks (9 apps) | 100% | Connected to API |
| **Backend** | Rust API (202 functions) | 100% | All endpoints implemented |
| **Backend** | Unit/Integration Tests (~148) | 100% | All passing |
| **Backend** | PostgreSQL + Redis | 100% | Schema + Migrations |
| **Crypto** | ML-DSA-65 (FIPS 204) | 100% | Sign/Verify working |
| **Crypto** | SPHINCS+ (Prover) | 100% | Implemented |
| **L1** | Sepolia Testnet | 100% | Connected |
| **L3** | l3-aegis (4-node BFT) | 95% | Client impl, env pending |
| **Docs** | Architecture (150+ files) | 95% | Comprehensive |

### 1.2 What Remains (Critical Gap Analysis)

| # | Item | Severity | Effort | Description |
|:-:|------|:--------:|:------:|-------------|
| 1 | **Mock Data Removal** | CRITICAL | 2-3 weeks | 107/159 screens still use DEMO_*/FALLBACK_* |
| 2 | **SEQUENCES.md Alignment** | HIGH | 1 week | Only 2/9 sequences fully aligned with code |
| 3 | **L3 Environment Setup** | HIGH | 1 week | Production L3 node configuration |
| 4 | **Screen Review** | MEDIUM | 3 days | 17/151 screens pending final review |
| 5 | **FIX Plan Execution** | HIGH | 2-3 weeks | 27 FIX items (Phase 1-6) |
| 6 | **Security Audit** | CRITICAL | 4-8 weeks | External smart contract + backend audit |
| 7 | **UAT (User Testing)** | HIGH | 2 weeks | Owner-conducted acceptance testing |
| 8 | **Security Documentation** | CRITICAL | 1-2 weeks | Threat model, incident response |
| 9 | **Specification Finalization** | HIGH | 1 week | API spec, sequence spec freeze |
| 10 | **Performance Testing** | MEDIUM | 1 week | Load test (100K concurrent locks target) |

---

## 2. S-in Prerequisites

### 2.1 Technical Prerequisites (Must Complete)

```
Priority: P0 = Launch Blocker / P1 = Required / P2 = Recommended

P0-1: Mock Data Complete Removal
     - Remove all DEMO_* / FALLBACK_* constants from production code
     - Verify all screens render with real API data
     - Status: 30/159 clean, 107 need cleanup, 19 crash fixes first

P0-2: FIX Execution Plan Phase 1-4
     - Phase 1 (FIX-001~004): Crash fixes + Emergency Unlock
     - Phase 2 (FIX-005~008): SEQUENCES.md parameter unification
     - Phase 3 (FIX-009~012): Silent Mock removal
     - Phase 4 (FIX-013~016): Remaining Mock/FALLBACK removal

P0-3: Smart Contract Audit
     - L1 contracts (Solidity)
     - L3 Aegis contracts (Rust)
     - Cryptographic implementation review

P0-4: Security Documentation
     - Threat model document
     - Incident response plan
     - Key management procedures

P1-1: L3 Production Environment
     - 4-node BFT cluster deployment
     - Monitoring + alerting setup
     - Failover configuration

P1-2: Cross-browser Full Test Run
     - All 144 E2E files on 5 browser targets
     - Mobile responsive verification
     - Accessibility compliance (WCAG 2.1 AA)

P1-3: API Specification Freeze
     - OpenAPI spec finalized
     - Sequence diagrams updated
     - Breaking change window closed

P2-1: Performance Testing
     - Load test: 100K concurrent locks
     - Stress test: surge scenarios
     - Gas optimization verification (87.5% reduction target)

P2-2: Documentation Completion
     - User guide (Japanese + English)
     - API developer documentation
     - Operations runbook
```

### 2.2 Business Prerequisites

```
B-1: Legal Review
     - Terms of Service
     - Privacy Policy
     - Token classification opinion (if applicable)

B-2: Compliance
     - KYC/AML requirements assessment
     - Regulatory landscape analysis (Japan FSA)
     - Data protection compliance (APPI)

B-3: Insurance
     - Smart contract coverage evaluation
     - Bug bounty program setup

B-4: Support Infrastructure
     - Support channel setup (Discord/Telegram)
     - FAQ documentation
     - Escalation procedures
```

---

## 3. Phase Plan: S-in Roadmap

### Phase A: Code Hardening (Weeks 1-3)

**Goal**: Remove all mock data, fix crashes, align sequences

| Week | Tasks | Owner | Deliverable |
|:----:|-------|-------|-------------|
| W1 | FIX Phase 1-2 (P0 crash fixes + params) | Dev (Claude) | 8 FIX items resolved |
| W2 | FIX Phase 3-4 (Mock removal) | Dev (Claude) | 8 FIX items resolved |
| W3 | FIX Phase 5-6 (i18n/UX + docs) | Dev (Claude) | 11 FIX items resolved |

**Gate**: All 27 FIX items complete, 0 crashes, 0 Mock data in production paths

### Phase B: Security Hardening (Weeks 2-5)

**Goal**: Complete security documentation and prepare for audit

| Week | Tasks | Owner | Deliverable |
|:----:|-------|-------|-------------|
| W2-3 | Threat model document | Dev + CEO | THREAT_MODEL.md |
| W3-4 | Security specification | Dev + CEO | SECURITY_SPEC.md |
| W4 | Incident response plan | CEO | INCIDENT_RESPONSE.md |
| W4-5 | Key management procedures | Dev + CEO | KEY_MANAGEMENT.md |
| W3-5 | Penetration test prep | Dev | Hardened endpoints |

**Gate**: All security docs complete, zero known critical vulnerabilities

### Phase C: External Audit (Weeks 5-12)

**Goal**: Independent security validation

| Task | Scope | Duration | Vendor (Candidates) |
|------|-------|:--------:|---------------------|
| Smart Contract Audit | L1 Solidity + L3 Rust | 4-6 weeks | Trail of Bits / OpenZeppelin / Quantstamp |
| Backend Audit | Rust API + Crypto impl | 2-4 weeks | NCC Group / Cure53 |
| Cryptographic Review | ML-DSA-65 + SPHINCS+ usage | 2-3 weeks | Specialized crypto auditor |

**Gate**: All critical/high findings resolved, audit report published

### Phase D: User Acceptance Testing (Weeks 8-10)

**Goal**: CEO conducts real-world testing of all flows

| # | Test Scenario | Persona | Priority |
|:-:|---------------|---------|:--------:|
| 1 | Lock ETH via Consumer App | End User (Tanaka-san) | P0 |
| 2 | Normal Unlock (24h wait) | End User | P0 |
| 3 | Emergency Unlock (7d + bond) | End User | P0 |
| 4 | View assets in Explorer | End User | P1 |
| 5 | Prover registration & monitoring | Prover Operator | P1 |
| 6 | Observer dashboard review | Observer | P1 |
| 7 | Create & vote on governance proposal | Governance Participant | P1 |
| 8 | Lock veQS & delegate | Token Holder | P1 |
| 9 | QS Admin: monitor + emergency actions | QS Foundation Admin | P0 |
| 10 | Enterprise: API key + webhook setup | Enterprise Client | P2 |

**UAT Checklist for CEO**:
```
[ ] All 9 core sequences execute end-to-end
[ ] Error messages are clear and actionable (Japanese)
[ ] Mobile experience is smooth (iPhone/Android)
[ ] Loading times are acceptable (<3s per page)
[ ] All tooltips explain crypto terms correctly
[ ] Emergency operations work under stress
[ ] Admin can monitor and intervene in real-time
```

**Gate**: CEO signs off on all P0/P1 scenarios

### Phase E: Pre-Launch (Weeks 10-12)

**Goal**: Final preparations for public launch

| Task | Owner | Deliverable |
|------|-------|-------------|
| Production infrastructure deployment | Dev | Deployed infra |
| DNS + SSL setup | Dev | Production domain |
| Monitoring + alerting | Dev | Grafana dashboards |
| Legal docs finalized | CEO + Legal | TOS, Privacy Policy |
| Bug bounty program launch | CEO | Immunefi/HackerOne setup |
| Support channels ready | CEO | Discord + docs |
| Press/announcement prep | CEO | Blog post, social media |

**Gate**: All systems operational, monitoring confirmed, support ready

---

## 4. Security Checklist

### 4.1 Smart Contract Security

| # | Item | Status | Priority |
|:-:|------|:------:|:--------:|
| 1 | Reentrancy protection | Implemented | P0 |
| 2 | Integer overflow/underflow | Rust-safe | P0 |
| 3 | Access control (role-based) | Implemented | P0 |
| 4 | Time lock enforcement | Implemented | P0 |
| 5 | Emergency pause mechanism | Implemented | P0 |
| 6 | Slashing calculation | Implemented | P0 |
| 7 | External audit | **NOT STARTED** | P0 |
| 8 | Formal verification (optional) | NOT STARTED | P2 |

### 4.2 Backend Security

| # | Item | Status | Priority |
|:-:|------|:------:|:--------:|
| 1 | Input validation (all endpoints) | Implemented | P0 |
| 2 | Rate limiting | Implemented | P0 |
| 3 | Authentication (JWT + SIWE) | Implemented | P0 |
| 4 | SQL injection prevention (sqlx) | Protected | P0 |
| 5 | CORS configuration | Configured | P1 |
| 6 | TLS enforcement | Required for prod | P0 |
| 7 | Secret management | Env vars (needs vault) | P1 |
| 8 | Dependency vulnerability scan | **NEEDED** | P1 |
| 9 | API rate limiting per user | Implemented | P1 |
| 10 | Logging & audit trail | Implemented (BE-003) | P1 |

### 4.3 Frontend Security

| # | Item | Status | Priority |
|:-:|------|:------:|:--------:|
| 1 | CSP headers | Need verification | P1 |
| 2 | XSS prevention | React default | P1 |
| 3 | CSRF protection | Need verification | P1 |
| 4 | Sensitive data in localStorage | Auth tokens (acceptable) | P1 |
| 5 | Wallet connection security | wagmi/rainbowkit | P0 |
| 6 | Transaction signing UX | Confirmation dialogs | P0 |

### 4.4 Infrastructure Security

| # | Item | Status | Priority |
|:-:|------|:------:|:--------:|
| 1 | Network segmentation | Needed for prod | P0 |
| 2 | Database encryption at rest | PostgreSQL config | P1 |
| 3 | Backup & recovery | Needed | P0 |
| 4 | DDoS protection | Needed (CloudFlare) | P1 |
| 5 | Monitoring & alerting | Needed (Grafana/PagerDuty) | P0 |
| 6 | Incident response playbook | **NEEDED** | P0 |

---

## 5. Required Documentation

### 5.1 Security Documents (Must Create)

| # | Document | Purpose | Status | Effort |
|:-:|----------|---------|:------:|:------:|
| 1 | **THREAT_MODEL.md** | Attack vectors & mitigations | NOT STARTED | 3-5 days |
| 2 | **SECURITY_SPEC.md** | Security architecture & controls | NOT STARTED | 3-5 days |
| 3 | **INCIDENT_RESPONSE.md** | How to handle security incidents | NOT STARTED | 2-3 days |
| 4 | **KEY_MANAGEMENT.md** | Key generation, storage, rotation | NOT STARTED | 2-3 days |
| 5 | **AUDIT_PREPARATION.md** | Scope, timeline, vendor selection | NOT STARTED | 1-2 days |

### 5.2 Specification Documents (Must Finalize)

| # | Document | Purpose | Status | Action |
|:-:|----------|---------|:------:|--------|
| 1 | API_SPECIFICATION.yaml | OpenAPI spec | EXISTS | Freeze & version |
| 2 | SEQUENCES.md | 9 core sequences | EXISTS | Align with code (2/9 done) |
| 3 | TECHNICAL_SPEC.md | Crypto & architecture | EXISTS | Update for L3 |
| 4 | DATA_MODEL.md | Entity & type definitions | EXISTS | Freeze & version |
| 5 | REQUIREMENTS.md | Functional requirements | EXISTS | Final review |

### 5.3 Operational Documents (Must Create for Production)

| # | Document | Purpose | Status |
|:-:|----------|---------|:------:|
| 1 | **OPERATIONS_RUNBOOK.md** | Day-to-day operations | NOT STARTED |
| 2 | **DEPLOYMENT_GUIDE.md** | How to deploy & update | NOT STARTED |
| 3 | **MONITORING_GUIDE.md** | What to monitor & thresholds | NOT STARTED |
| 4 | **DISASTER_RECOVERY.md** | Backup & recovery procedures | NOT STARTED |

### 5.4 User-facing Documents

| # | Document | Purpose | Status |
|:-:|----------|---------|:------:|
| 1 | User Guide (ja/en) | How to use Quantum Shield | NOT STARTED |
| 2 | FAQ | Common questions | NOT STARTED |
| 3 | Terms of Service | Legal agreement | NOT STARTED |
| 4 | Privacy Policy | Data handling | NOT STARTED |

---

## 6. Audit Plan

### 6.1 Audit Scope

```
Scope A: Smart Contracts (L1 + L3)
├── L1 Solidity Contracts
│   ├── Lock/Unlock logic
│   ├── Emergency mechanisms
│   ├── Slashing calculations
│   └── Dilithium signature verification
├── L3 Aegis (Rust)
│   ├── BFT consensus
│   ├── SPHINCS+ verification
│   ├── Block production
│   └── Cross-chain messaging
└── Estimated Duration: 4-6 weeks

Scope B: Backend API (Rust)
├── Authentication & authorization
├── Input validation
├── Business logic correctness
├── Database security
├── Cryptographic implementation
│   ├── ML-DSA-65 usage
│   ├── Key derivation
│   └── Signature verification
└── Estimated Duration: 2-4 weeks

Scope C: Cryptographic Review (Specialized)
├── NIST FIPS 204 compliance (ML-DSA-65)
├── SPHINCS+ parameter selection
├── Goldilocks field operations
├── Gas optimization impact on security
└── Estimated Duration: 2-3 weeks
```

### 6.2 Audit Vendor Candidates

| Vendor | Specialty | Estimated Cost | Timeline |
|--------|-----------|:--------------:|:--------:|
| **Trail of Bits** | Smart contracts + Rust | $150K-300K | 6-8 weeks |
| **OpenZeppelin** | Smart contracts | $100K-200K | 4-6 weeks |
| **NCC Group** | Backend + crypto | $100K-250K | 4-6 weeks |
| **Cure53** | Web application | $50K-100K | 2-4 weeks |
| **Quantstamp** | Smart contracts | $80K-150K | 4-6 weeks |

### 6.3 Audit Timeline

```
Week 1-2:  Prepare audit documentation & scope
Week 3:    Vendor selection & contract signing
Week 4-9:  Audit execution
Week 10:   Findings review & prioritization
Week 11-12: Critical/High finding remediation
Week 13:   Re-verification of fixes
Week 14:   Final audit report published
```

### 6.4 Pre-Audit Preparation (Claude Can Help)

| Task | Description | Effort |
|------|-------------|:------:|
| Code documentation | Add inline comments to critical paths | 3-5 days |
| Test coverage report | Generate coverage metrics | 1 day |
| Architecture diagram | Visual system overview | 1-2 days |
| Known issues list | Document known limitations | 1 day |
| Threat model draft | Preliminary threat analysis | 2-3 days |

---

## 7. User Acceptance Testing Plan

### 7.1 UAT Environment Setup

```
Environment: Staging (Sepolia Testnet)
Database: Fresh PostgreSQL instance
L3: 4-node testnet cluster
Frontend: Production build on staging domain
```

### 7.2 Test Scenarios (CEO Execution)

#### Scenario 1: Consumer Journey (P0)

```
Actors: CEO as "Tanaka-san" (35, non-technical user)

Steps:
1. Open Consumer App (mobile browser)
2. Connect wallet (MetaMask)
3. View dashboard - verify balance display
4. Lock 1 ETH
   - Select amount
   - Confirm Dilithium signature
   - Wait for confirmation
   - Verify lock appears in dashboard
5. Wait 24 hours (or use testnet time skip)
6. Unlock 1 ETH
   - Request unlock
   - Confirm signature
   - Wait for unlock period
   - Verify ETH returned
7. Test Emergency Unlock
   - Lock ETH
   - Request emergency unlock
   - Confirm bond payment
   - Verify 7-day waiting period shown

Pass Criteria:
- All operations complete without errors
- Japanese text is natural and clear
- Loading states are visible
- Error messages are actionable
- Mobile layout works on iPhone
```

#### Scenario 2: Admin Operations (P0)

```
Actor: CEO as QS Foundation Admin

Steps:
1. Login to QS Admin
2. View dashboard metrics
3. Monitor active transactions
4. Review prover status
5. Test emergency pause (testnet)
6. Review treasury balance
7. Process a governance proposal

Pass Criteria:
- Real-time data visible
- Emergency controls work
- Audit trail complete
```

#### Scenario 3: Full Ecosystem (P1)

```
Steps:
1. Prover registration & bond posting
2. Observer monitoring setup
3. Governance: create proposal, vote, execute
4. Token Hub: lock veQS, delegate, claim rewards
5. Explorer: verify all transactions visible
6. Enterprise: API key generation, webhook setup
```

### 7.3 UAT Sign-off Template

```markdown
## UAT Sign-off

Date: ________
Tester: ________

### Scenario Results
| # | Scenario | Result | Notes |
|:-:|----------|:------:|-------|
| 1 | Consumer Journey | PASS/FAIL | |
| 2 | Admin Operations | PASS/FAIL | |
| 3 | Full Ecosystem | PASS/FAIL | |

### Issues Found
| # | Issue | Severity | Status |
|:-:|-------|:--------:|:------:|

### Sign-off
[ ] All P0 scenarios passed
[ ] All P1 scenarios passed (or deferred with justification)
[ ] No critical/high issues remaining

Signature: ________________
Date: ________________
```

---

## 8. Post-Launch Strategy

### 8.1 Launch Phases

#### Phase 1: Closed Alpha (Week 0-4)

```
Participants: 10-50 invited users
Objective: Validate core flows with real users
Scope:
  - Consumer App only (Lock/Unlock/Emergency)
  - Sepolia testnet
  - Manual onboarding support
  - Daily monitoring by team

Success Metrics:
  - 0 critical bugs
  - <5s page load time
  - >90% task completion rate
  - User satisfaction >4/5

Exit Criteria:
  - 100+ successful lock/unlock cycles
  - 0 asset loss incidents
  - Feedback incorporated
```

#### Phase 2: Open Beta (Week 4-12)

```
Participants: 500-5,000 users
Objective: Scale testing and community building
Scope:
  - All 9 applications
  - Mainnet deployment (with caps)
  - Lock amount cap: 10 ETH per user
  - Total TVL cap: 1,000 ETH
  - Bug bounty program active

New Features:
  - Governance live
  - Prover onboarding
  - Observer network active
  - Token Hub (veQS)

Success Metrics:
  - 99.9% uptime
  - <3s page load (P95)
  - 0 security incidents
  - Growing TVL week-over-week
```

#### Phase 3: General Availability (Week 12+)

```
Participants: Unlimited
Objective: Full production launch
Scope:
  - No amount caps
  - Enterprise API available
  - Full governance active
  - Multi-chain support roadmap

Requirements:
  - Audit report published
  - Insurance coverage active
  - 24/7 monitoring
  - Support team operational
```

### 8.2 Post-Launch Monitoring

| Metric | Target | Alert Threshold |
|--------|:------:|:---------------:|
| Uptime | 99.9% | <99.5% |
| Page Load (P95) | <3s | >5s |
| API Response (P95) | <500ms | >2s |
| Error Rate | <0.1% | >1% |
| TVL Growth | Week-over-week | Sudden drop >10% |
| Active Users | Growing | Drop >20% |
| Gas Costs | Within budget | >2x estimate |
| L3 Block Time | <2s | >10s |
| Prover Response | <5s | >30s |

### 8.3 Post-Launch Development Roadmap

| Quarter | Focus | Features |
|:-------:|-------|----------|
| Q1 (Launch) | Stability | Bug fixes, performance tuning, user feedback |
| Q2 | Growth | Multi-chain support, advanced governance, mobile app |
| Q3 | Enterprise | Enterprise dashboard, SLA tiers, custom integrations |
| Q4 | Ecosystem | SDK release, third-party prover network, L2 bridges |

### 8.4 Operational Runbook (Post-Launch)

```
Daily:
  - Monitor dashboard metrics
  - Review error logs
  - Check L3 node health
  - Review new prover/observer applications

Weekly:
  - Security scan (dependencies)
  - Performance report review
  - User feedback triage
  - Team sync meeting

Monthly:
  - Infrastructure cost review
  - Security assessment update
  - Roadmap progress review
  - Community update publication

Quarterly:
  - Dependency audit
  - Disaster recovery drill
  - Penetration test (external)
  - Audit re-engagement (if needed)
```

---

## 9. Risk Matrix

| # | Risk | Impact | Probability | Mitigation |
|:-:|------|:------:|:-----------:|------------|
| 1 | Smart contract exploit | CRITICAL | Low | Audit + Bug bounty + Insurance |
| 2 | Quantum computer advancement | HIGH | Very Low | NIST-compliant crypto (ML-DSA-65) |
| 3 | L3 consensus failure | HIGH | Low | 4-node BFT + monitoring + manual recovery |
| 4 | Key compromise (user) | HIGH | Medium | Education + hardware wallet support |
| 5 | Regulatory change (Japan) | HIGH | Medium | Legal counsel + compliance monitoring |
| 6 | Gas price spike | MEDIUM | Medium | Gas optimization (87.5% reduction) + L3 |
| 7 | Low adoption | MEDIUM | Medium | Marketing + partnerships + UX focus |
| 8 | DDoS attack | MEDIUM | Medium | CloudFlare + rate limiting |
| 9 | Team scaling | LOW | High | Documentation + automation |
| 10 | Dependency vulnerability | MEDIUM | Medium | Automated scanning + rapid patching |

---

## 10. Timeline

```
               2026
  Feb    Mar    Apr    May    Jun    Jul    Aug
  |------|------|------|------|------|------|------|

  [======] Phase A: Code Hardening (W1-3)
     [=========] Phase B: Security Docs (W2-5)
              [==================] Phase C: External Audit (W5-12)
                       [======] Phase D: UAT (W8-10)
                             [====] Phase E: Pre-Launch (W10-12)
                                   |
                                   v
                              S-in Launch
                              (Closed Alpha)
                                   |
                              [==========] Phase 1: Closed Alpha (4 weeks)
                                         [================] Phase 2: Open Beta (8 weeks)
                                                           |
                                                      General Availability

  KEY MILESTONES:
  * Feb W3: FIX Plan Phase 1-4 complete
  * Mar W1: Security docs complete
  * Mar W2: Audit vendor selected
  * Apr W2: Audit execution starts
  * May W3: Audit findings resolved
  * Jun W1: UAT complete, CEO sign-off
  * Jun W2: S-in (Closed Alpha launch)
  * Jul W2: Open Beta launch
  * Aug+:   General Availability
```

---

## Appendix A: Action Items (Immediate Next Steps)

### For Claude (Dev):

| # | Task | Priority | Estimated Effort |
|:-:|------|:--------:|:----------------:|
| 1 | Execute FIX-001~004 (crash fixes) | P0 | 2-3 days |
| 2 | Execute FIX-005~016 (mock removal) | P0 | 1-2 weeks |
| 3 | Create THREAT_MODEL.md draft | P0 | 2-3 days |
| 4 | Create SECURITY_SPEC.md draft | P0 | 2-3 days |
| 5 | Create INCIDENT_RESPONSE.md draft | P1 | 1-2 days |
| 6 | L3 environment configuration | P1 | 2-3 days |
| 7 | Cross-browser full test run | P1 | 1 day |
| 8 | Pre-audit code documentation | P1 | 3-5 days |

### For CEO:

| # | Task | Priority | Estimated Effort |
|:-:|------|:--------:|:----------------:|
| 1 | Review & approve this launch plan | P0 | 1 day |
| 2 | Select audit vendor (3 candidates) | P0 | 1-2 weeks |
| 3 | Review THREAT_MODEL.md when drafted | P0 | 1 day |
| 4 | Prepare legal documents (TOS, Privacy) | P1 | 2-4 weeks |
| 5 | Plan UAT schedule | P1 | 1 day |
| 6 | Conduct UAT scenarios | P0 | 1-2 weeks |
| 7 | Set up bug bounty program | P1 | 1 week |
| 8 | Support channel setup (Discord) | P2 | 1 week |
| 9 | Insurance coverage evaluation | P2 | 2-4 weeks |
| 10 | Post-launch marketing plan | P2 | 2 weeks |

---

*Generated: 2026-02-12*
*This document should be reviewed and updated regularly as the project progresses toward S-in.*
