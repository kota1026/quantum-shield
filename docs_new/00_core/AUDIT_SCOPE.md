# Quantum Shield - Audit Scope Definition

> **Version**: 1.0  
> **Date**: 2026-01-05  
> **Phase**: Phase 4 - Week 3
> **Prepared for**: External Security Audit (Trail of Bits / OpenZeppelin)

---

## Executive Summary

This document defines the scope of the external security audit for the Quantum Shield post-quantum secure bridge system. The audit covers smart contracts deployed on Ethereum Sepolia/Mainnet, the L3 Aegis Chain implementation, and the Client SDK.

---

## 1. Audit Scope Overview

### 1.1 In-Scope Components

| Component | Location | LOC | Priority |
|-----------|----------|-----|----------|
| L1 Smart Contracts | `contracts/src/` | ~4,500 | 🔴 Critical |
| L3 Aegis Chain | `l3-aegis/` | ~12,000 | 🔴 Critical |
| Client SDK (WASM) | `packages/sdk/wasm/` | ~500 | 🟡 High |
| Event Bridge | `services/event-bridge/` | ~2,000 | 🟡 High |
| API Layer | `services/api/` | ~1,500 | 🟢 Medium |

### 1.2 Out-of-Scope Components

| Component | Reason |
|-----------|--------|
| UI/UX Applications | Not security critical |
| Documentation | Non-executable |
| Test files | Covered by internal QA |
| Third-party libraries | Separate audit track |
| CI/CD pipelines | Infrastructure review separate |

---

## 2. Smart Contracts (L1 - Ethereum)

### 2.1 Contract List

| Contract | Path | Description | Deployed |
|----------|------|-------------|----------|
| `QuantumShieldBridge.sol` | `contracts/src/core/` | Main bridge contract | Sepolia |
| `QSToken.sol` | `contracts/src/token/` | Governance token (ERC20) | Sepolia |
| `veQSToken.sol` | `contracts/src/token/` | Vote-escrowed token | Sepolia |
| `SecurityCouncil.sol` | `contracts/src/governance/` | Multi-sig council | Sepolia |
| `EmergencyModule.sol` | `contracts/src/security/` | Emergency controls | Sepolia |
| `STARKVerifier.sol` | `contracts/src/verifier/` | ZK-STARK verifier | Sepolia |
| `DilithiumVerifier.sol` | `contracts/src/verifier/` | Dilithium sig verifier | Sepolia |
| `SHA3Lib.sol` | `contracts/src/lib/` | SHA3-256 library | Sepolia |
| `TimeLockController.sol` | `contracts/src/security/` | Time lock logic | Sepolia |
| `SlashingModule.sol` | `contracts/src/security/` | Prover slashing | Sepolia |
| `BondManager.sol` | `contracts/src/security/` | Bond management | Sepolia |

### 2.2 Critical Security Functions

| Function | Contract | Risk Level | Focus Areas |
|----------|----------|------------|-------------|
| `lock()` | QuantumShieldBridge | Critical | Reentrancy, overflow |
| `release()` | QuantumShieldBridge | Critical | Proof verification, replay |
| `emergencyUnlock()` | EmergencyModule | Critical | Bond calculation, time lock |
| `slash()` | SlashingModule | High | Quadratic calculation |
| `verifyProof()` | STARKVerifier | Critical | ZK soundness |
| `verifySignature()` | DilithiumVerifier | Critical | Cryptographic correctness |
| `pause()` | EmergencyModule | High | Access control |

### 2.3 Deployment Addresses (Sepolia)

```
QuantumShieldBridge: 0x...[to be filled after deployment]
QSToken: 0x...
veQSToken: 0x...
SecurityCouncil: 0x...
EmergencyModule: 0x...
STARKVerifier: 0x...
DilithiumVerifier: 0x...
```

---

## 3. L3 Aegis Chain

### 3.1 Crate List

| Crate | Path | Description | LOC |
|-------|------|-------------|-----|
| `aegis-consensus` | `l3-aegis/consensus/` | BFT consensus | ~2,500 |
| `aegis-state` | `l3-aegis/state/` | State management (SMT) | ~1,800 |
| `aegis-crypto` | `l3-aegis/crypto/` | Dilithium/SPHINCS+ | ~2,000 |
| `aegis-sequencer` | `l3-aegis/sequencer/` | Transaction sequencing | ~1,500 |
| `aegis-prover` | `l3-aegis/prover/` | STARK proof generation | ~2,200 |
| `aegis-relayer` | `l3-aegis/relayer/` | L1 submission | ~1,000 |
| `aegis-api` | `l3-aegis/api/` | gRPC/REST API | ~1,000 |

### 3.2 Critical Security Components

| Component | Risk Level | Focus Areas |
|-----------|------------|-------------|
| Consensus (4-node BFT) | Critical | Byzantine fault tolerance |
| State transitions | Critical | Double-spend prevention |
| Dilithium verification | Critical | FIPS 204 compliance |
| SPHINCS+ verification | Critical | FIPS 205 compliance |
| Proof generation | High | Soundness, completeness |
| L1 submission | High | Transaction atomicity |

---

## 4. Client SDK

### 4.1 Package List

| Package | Path | Description |
|---------|------|-------------|
| `@quantum-shield/wasm` | `packages/sdk/wasm/` | Dilithium WASM module |
| `@quantum-shield/sdk` | `packages/sdk/typescript/` | TypeScript SDK |
| `@quantum-shield/react` | `packages/sdk/react/` | React hooks |

### 4.2 Critical Security Functions

| Function | Package | Focus Areas |
|----------|---------|-------------|
| `keygen()` | wasm | Entropy, randomness |
| `sign()` | wasm | Side-channel, timing |
| `verify()` | wasm | Correctness |
| `signUnlockMessage()` | sdk | Message construction |

---

## 5. Security Requirements

### 5.1 Core Principles (Must Verify)

| # | Principle | Verification Method |
|---|-----------|--------------------|
| CP-1 | Complete Quantum Resistance | Code review: no ECDSA, RSA, SHA-256, keccak256 |
| CP-2 | Self-Custody | Code review: no server-side secret key storage |
| CP-3 | Time Lock Existence | Invariant testing: time lock > 0 always |
| CP-4 | Slashing Existence | Invariant testing: slashing cannot be disabled |
| CP-5 | Transparency | Code review: all operations on-chain |

### 5.2 Security Parameters (Must Verify)

| Parameter | Required Value | Verification |
|-----------|---------------|---------------|
| Normal Time Lock | 24 hours | Constant check |
| Emergency Time Lock | 7 days | Constant check |
| Emergency Timeout | 72 hours | Constant check |
| Max Pause Duration | 72 hours | Constant check |
| Defense Period | 48 hours | Constant check |
| Emergency Bond | MAX(0.5 ETH, amount × 5%) | Formula verification |
| Challenge Bond | MAX(0.1 ETH, amount × 1%) | Formula verification |
| Slashing Rate | N² × 10% | Formula verification |

### 5.3 Cryptographic Requirements

| Requirement | Specification | Standard |
|-------------|---------------|----------|
| User Signatures | Dilithium-III | FIPS 204 ML-DSA-65 |
| Prover Signatures | SPHINCS+-128s | FIPS 205 |
| State Hash | SHA3-256 | FIPS 202 |
| ZK Proofs | ZK-STARK | Permitted (quantum-safe) |

### 5.4 Forbidden Algorithms (Must Verify Absence)

| Algorithm | Reason |
|-----------|--------|
| ECDSA | Quantum-vulnerable (Shor's algorithm) |
| RSA | Quantum-vulnerable (Shor's algorithm) |
| secp256k1 | Quantum-vulnerable |
| SHA-256 / SHA-2 | Grover's algorithm risk |
| keccak256 | Use SHA3-256 instead |

---

## 6. Attack Vectors to Test

### 6.1 Smart Contract Attacks

| Attack Vector | Priority | Contracts |
|---------------|----------|----------|
| Reentrancy | Critical | Bridge, Token |
| Integer Overflow/Underflow | High | Bond, Slashing |
| Front-running | High | Lock, Unlock |
| Flash Loan | High | Bridge |
| Oracle Manipulation | Medium | None (no oracles) |
| Signature Replay | Critical | Bridge, Unlock |
| Access Control Bypass | Critical | Council, Emergency |
| DOS via Gas | Medium | Verifier |

### 6.2 Cryptographic Attacks

| Attack Vector | Priority | Components |
|---------------|----------|------------|
| Side-channel (timing) | High | WASM, Dilithium |
| Weak Randomness | Critical | Keygen |
| Signature Malleability | High | Dilithium, SPHINCS+ |
| Hash Collision | Medium | SHA3-256 |
| Proof Forgery | Critical | STARK Verifier |

### 6.3 Protocol-Level Attacks

| Attack Vector | Priority | Components |
|---------------|----------|------------|
| Double-spend | Critical | L3 State |
| Long-range attack | High | Consensus |
| Eclipse attack | Medium | P2P Network |
| Censorship | Medium | Sequencer |

---

## 7. Testing Requirements

### 7.1 Existing Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| Solidity Unit Tests | 628 | ~95% |
| Rust Unit Tests | 264 | ~90% |
| API Tests | 42 | ~85% |
| Event Bridge Tests | 26 | ~80% |
| Invariant Tests | 8 invariants | 1M+ calls |
| Fuzz Tests | 768 runs | Key functions |

### 7.2 Required Audit Tests

| Test Type | Scope | Priority |
|-----------|-------|----------|
| Formal Verification | Core invariants | High |
| Fuzzing (Extended) | All inputs | High |
| Symbolic Execution | Critical paths | Medium |
| Manual Code Review | Entire scope | Critical |

---

## 8. Deliverables Expected

### 8.1 From Auditor

1. **Preliminary Report** (Week 2)
   - Initial findings
   - High/Critical issues

2. **Final Report** (Week 4)
   - Complete findings
   - Severity classifications
   - Remediation recommendations

3. **Verification Report** (Week 5)
   - Confirmation of fixes
   - Remaining issues

### 8.2 Severity Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Fund loss possible | Immediate |
| High | Significant impact | 24-48 hours |
| Medium | Limited impact | 1 week |
| Low | Minor issues | Next release |
| Informational | Best practices | As appropriate |

---

## 9. Access Requirements

### 9.1 Repository Access

- GitHub: `kota1026/quantum-shield`
- Branch: `dev/phase2-native-stark`
- Access Level: Read-only

### 9.2 Environment Access

- Sepolia RPC: Provided
- Test accounts: Provided with test ETH
- Documentation: Full access

### 9.3 Communication

- Primary: Slack channel `#audit-2026`
- Escalation: Direct email to security team
- Weekly sync: Fridays 10:00 UTC

---

## 10. Timeline

| Week | Phase | Activities |
|------|-------|------------|
| W1 | Kickoff | Scope review, environment setup |
| W2 | Analysis | Automated scanning, initial review |
| W3 | Deep Dive | Manual review, fuzzing |
| W4 | Reporting | Final report preparation |
| W5 | Remediation | Fix verification |

---

## 11. Contact Information

| Role | Contact |
|------|--------|
| Project Lead | [kota@quantumshield.io] |
| Security Lead | [security@quantumshield.io] |
| Technical Contact | [dev@quantumshield.io] |

---

**END OF AUDIT SCOPE DEFINITION**
