# External Security Audit RFP (Draft)

> **Version**: 0.1 (Draft)  
> **Created**: 2025-12-26 JST  
> **Author**: CSO  
> **Status**: 📝 DRAFT - Pending CTO/CEO Review

---

## 1. Executive Summary

### 1.1 Project Overview

**Project Name**: Quantum Shield L3  
**Organization**: Project Aegis  
**Website**: [TBD]  
**GitHub**: https://github.com/kota1026/quantum-shield

Quantum Shield L3は、量子耐性暗号を使用した次世代クロスチェーンブリッジおよびL3バリデーション層です。NIST承認の耐量子暗号アルゴリズム（Dilithium-III、SPHINCS+-128s、SHA3-256）とZK-STARK証明を組み合わせ、量子コンピュータ時代においても安全な資産管理を実現します。

### 1.2 Audit Objectives

1. スマートコントラクトの包括的なセキュリティ評価
2. 暗号実装の正確性検証
3. 経済的攻撃ベクターの分析
4. ガバナンス機構のセキュリティ評価
5. 量子耐性要件の遵守確認

---

## 2. Scope of Audit

### 2.1 In-Scope Contracts

| Contract | Path | LOC (Est.) | Priority |
|----------|------|------------|----------|
| L1Vault.sol | contracts/src/L1Vault.sol | ~800 | 🔴 CRITICAL |
| QuantumShield.sol | contracts/src/QuantumShield.sol | ~200 | 🔴 CRITICAL |
| STARKVerifier.sol | contracts/src/STARKVerifier.sol | ~500 | 🔴 CRITICAL |
| FRIVerifier.sol | contracts/src/FRIVerifier.sol | ~400 | 🔴 CRITICAL |
| SPHINCSVerifier.sol | contracts/src/SPHINCSVerifier.sol | ~300 | 🟡 HIGH |
| VRFConsumer.sol | contracts/src/VRFConsumer.sol | ~150 | 🟡 HIGH |
| ProverSelector.sol | contracts/src/ProverSelector.sol | ~200 | 🟡 HIGH |

### 2.2 In-Scope Libraries

| Library | Path | LOC (Est.) | Priority |
|---------|------|------------|----------|
| SHA3_256.sol | contracts/src/libraries/SHA3_256.sol | ~600 | 🔴 CRITICAL |
| SHAKE256.sol | contracts/src/libraries/SHAKE256.sol | ~700 | 🔴 CRITICAL |
| SparseMerkleTree.sol | contracts/src/libraries/SparseMerkleTree.sol | ~200 | 🟡 HIGH |
| StateRootCalculator.sol | contracts/src/libraries/StateRootCalculator.sol | ~150 | 🟡 HIGH |
| Dilithium3.sol | contracts/src/libraries/Dilithium3.sol | ~300 | 🟡 HIGH |

### 2.3 Total Estimated LOC

**~4,500 Lines of Code** (Production contracts only, excluding tests)

### 2.4 Out of Scope

- Test files (`*.t.sol`)
- Mock contracts (`*Mock.sol`)
- Script files (`*.s.sol`)
- Frontend/Backend code
- Off-chain prover implementation

---

## 3. Security Requirements

### 3.1 Core Principles (Must Not Violate)

| # | Principle | Description | Verification Method |
|---|-----------|-------------|---------------------|
| CP-1 | Complete Quantum Resistance | NIST-compliant algorithms only | Code review + Static analysis |
| CP-2 | Self-Custody | User controls private keys | Architecture review |
| CP-3 | Time Lock Exists | Cannot set to 0 | Invariant testing |
| CP-4 | Slashing Exists | Cannot remove mechanism | Invariant testing |
| CP-5 | Transparency | All verifiable on-chain | Code review |

### 3.2 Cryptographic Requirements

**Mandatory Algorithms:**
- User Signature: Dilithium-III (FIPS 204)
- Prover Signature: SPHINCS+-128s (FIPS 205)
- State Hash: SHA3-256 (FIPS 202)
- ZK Proof: ZK-STARK (128-bit security)

**Prohibited Algorithms (Must NOT appear in codebase):**
- ❌ ECDSA
- ❌ RSA
- ❌ SHA-256 / SHA-2 family
- ❌ keccak256 (except for EVM-required interfaces)
- ❌ secp256k1
- ❌ ecrecover (except for legacy compatibility)

### 3.3 Security Parameters

| Parameter | Value | Constraint |
|-----------|-------|------------|
| Normal Time Lock | 24 hours | Cannot shorten |
| Emergency Time Lock | 7 days | Cannot shorten |
| Emergency Bond | MAX(0.5 ETH, amount × 5%) | Adjustable |
| Challenge Bond | MAX(0.1 ETH, amount × 1%) | Adjustable |
| Defense Period | 48 hours | Cannot shorten |
| Slashing Rate | N² × 10% (Quadratic) | Cannot remove |

---

## 4. Expected Audit Activities

### 4.1 Manual Code Review

- Line-by-line review of all in-scope contracts
- Business logic verification
- Access control analysis
- State machine verification
- Edge case identification

### 4.2 Automated Analysis

- Static analysis (Slither, Mythril)
- Symbolic execution
- Property-based fuzzing
- Formal verification support (optional but preferred)

### 4.3 Cryptographic Review

- Algorithm implementation correctness
- Side-channel resistance analysis
- Randomness source evaluation
- Key management review

### 4.4 Economic Security Analysis

- MEV attack vectors
- Flash loan scenarios
- Oracle manipulation risks
- Governance attack vectors

### 4.5 Gas Analysis

- DoS via gas exhaustion
- Unbounded loops detection
- Storage optimization review

---

## 5. Deliverables

### 5.1 Required Deliverables

| Deliverable | Format | Due |
|-------------|--------|-----|
| Preliminary Report | PDF | Week 2 |
| Final Report | PDF | Week 4 |
| Executive Summary | PDF | Week 4 |
| Finding Details | CSV/JSON | Week 4 |
| Remediation Verification | PDF | Week 5 |

### 5.2 Finding Classification

| Severity | Description | SLA |
|----------|-------------|-----|
| Critical | Direct loss of funds, system compromise | Immediate notification, fix within 24h |
| High | Significant loss potential, major function broken | Fix within 7 days |
| Medium | Limited impact, workaround exists | Fix within 14 days |
| Low | Minor issues, code quality | Fix before mainnet |
| Informational | Best practices, optimizations | Advisory only |

---

## 6. Timeline

### 6.1 Proposed Schedule

| Phase | Duration | Target Date |
|-------|----------|-------------|
| RFP Finalization | 1 week | Month 7 Week 4 |
| Vendor Selection | 2 weeks | Month 8 Week 2 |
| Contract Signing | 1 week | Month 8 Week 3 |
| Audit Kickoff | - | Month 9 Week 1 |
| Audit Execution | 4 weeks | Month 9-10 |
| Remediation | 2 weeks | Month 10 Week 3-4 |
| Final Report | 1 week | Month 10 Week 5 |

### 6.2 Key Milestones

- **Month 9 Week 1**: Audit kickoff, codebase freeze
- **Month 9 Week 2**: Preliminary findings call
- **Month 9 Week 4**: Draft report delivery
- **Month 10 Week 2**: Remediation complete
- **Month 10 Week 4**: Final report with "All Fixed" status

---

## 7. Vendor Requirements

### 7.1 Mandatory Qualifications

| Requirement | Evidence |
|-------------|----------|
| 3+ years smart contract auditing | Portfolio |
| 5+ DeFi protocol audits | References |
| Cryptography expertise | Team CVs |
| ZK proof experience | Past audits |
| NIST PQC familiarity | Technical assessment |

### 7.2 Preferred Qualifications

- Formal verification capability (Certora, Halmos)
- Previous L2/L3 bridge audits
- Academic cryptography background
- Published security research

### 7.3 Team Requirements

| Role | Count | Expertise |
|------|-------|-----------|
| Lead Auditor | 1 | 5+ years, cryptography |
| Senior Auditor | 2 | 3+ years, DeFi |
| Cryptographer | 1 | PQC specialist |
| Formal Verification Specialist | 1 (optional) | Certora/Lean |

---

## 8. Budget & Commercial Terms

### 8.1 Budget Range

**Estimated Budget**: $80,000 - $150,000 USD

Breakdown expectations:
- Manual review: 60-70%
- Automated analysis: 15-20%
- Cryptographic review: 15-20%
- Remediation verification: Included

### 8.2 Payment Terms

- 30% upon contract signing
- 40% upon preliminary report
- 30% upon final report delivery

### 8.3 IP and Confidentiality

- Audit firm may publish summary after 90 days
- Full report remains confidential unless disclosed by Project Aegis
- Source code under NDA until public disclosure

---

## 9. Submission Instructions

### 9.1 Proposal Contents

1. Company overview and relevant experience
2. Proposed team with CVs
3. Technical approach and methodology
4. Timeline and availability
5. Pricing breakdown
6. References (3 minimum)

### 9.2 Submission Details

**Deadline**: [TBD - Month 8 Week 1]  
**Format**: PDF  
**Email**: [TBD - security@project-aegis.com]  
**Subject**: "Quantum Shield Audit Proposal - [Company Name]"

### 9.3 Evaluation Criteria

| Criteria | Weight |
|----------|--------|
| Technical expertise | 35% |
| Relevant experience | 25% |
| Team composition | 20% |
| Timeline fit | 10% |
| Price | 10% |

---

## 10. Contact Information

**Primary Contact**: CSO, Project Aegis  
**Technical Contact**: CTO, Project Aegis  
**Email**: [TBD]  
**Telegram**: [TBD]

---

## 11. Appendices

### Appendix A: Repository Access

Repository: https://github.com/kota1026/quantum-shield  
Branch: `dev/phase2-native-stark` (audit branch to be created)

### Appendix B: Documentation

| Document | Purpose |
|----------|---------|
| CORE_PRINCIPLES.md | Immutable security principles |
| QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md | Protocol flows |
| QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md | Full specification |
| ZK_STARK_IMPLEMENTATION_PLAN.md | ZK implementation details |

### Appendix C: Existing Security Measures

- 433+ automated tests (100% pass)
- Formal verification (Lean4) for Dilithium/SPHINCS+
- 11 internal PIR reviews passed
- NIST KAT test vectors validated

---

**END OF RFP DRAFT**

---

## Internal Notes (Remove before publication)

### TODO before finalization:
- [ ] CEO/CTO review
- [ ] Legal review of commercial terms
- [ ] Contact information populated
- [ ] Budget approval
- [ ] Timeline confirmation with DevOps

### Candidate Auditors (Initial Research):
1. Trail of Bits
2. OpenZeppelin
3. Consensys Diligence
4. Halborn
5. Quantstamp
6. Zellic
7. Spearbit

### Risk Considerations:
- Holiday scheduling (Dec-Jan)
- Post-quantum expertise scarcity
- ZK-STARK audit complexity
