# Quantum Shield: Post-Quantum Asset Protection Protocol

## Technical Whitepaper v1.0 — April 2026

---

## Abstract

Quantum Shield is the first production-ready, application-layer protocol that protects Ethereum smart contract assets against quantum computing threats using **dual NIST-standardized post-quantum signature schemes** — ML-DSA (FIPS 204, Dilithium) and SLH-DSA (FIPS 205, SPHINCS+).

Unlike proposals to modify Ethereum's consensus layer, Quantum Shield provides quantum-safe protection **today** through a 3-layer defense architecture combining cryptographic hardness, economic security (Prover Pool with quadratic slashing), and temporal security (24-hour time locks).

**Live Demo**: [quantum-shield.xyz](https://quantum-shield.xyz)
**Source Code**: [github.com/kota1026/quantum-shield](https://github.com/kota1026/quantum-shield)

---

## 1. The Quantum Threat

### 1.1 Timeline

| Date | Event |
|------|-------|
| Aug 2024 | NIST publishes final PQ standards (FIPS 203, 204, 205) |
| 2025-2028 | US federal agencies required to transition (Executive Order 14110) |
| ~2028 | Ethereum Foundation's estimated PQ upgrade timeline |

### 1.2 The Gap

Between now and Ethereum's protocol-level quantum upgrade, **all ECDSA-secured assets are vulnerable** to:

- **Harvest Now, Decrypt Later (HNDL)** — adversaries collecting transaction data for future quantum decryption
- **Key Extraction** — deriving private keys from exposed public keys
- **Signature Forgery** — quantum-forged ECDSA signatures enabling unauthorized transfers

### 1.3 Scale

- **$2.5T+** in smart contract TVL uses ECDSA
- **$20B+** in institutional custody relies on ECDSA-based wallets
- **Zero** production-ready application-layer PQ protection exists on Ethereum

---

## 2. Architecture

### 2.1 Three-Layer Defense Model

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: L1 Vault (Ethereum)                            │
│ ├── Immutable smart contract holding locked assets      │
│ ├── SPHINCS+ (SLH-DSA, FIPS 205) on-chain verification │
│ ├── 24-hour time lock for normal unlocks                │
│ └── 7-day emergency recovery path                       │
├─────────────────────────────────────────────────────────┤
│ Layer 2: L3 Aegis (Off-chain BFT Consensus)             │
│ ├── Dilithium (ML-DSA, FIPS 204) signature verification │
│ ├── Gas-free signature operations (93% cost reduction)  │
│ ├── Byzantine Fault Tolerant 4-node consensus           │
│ └── State Root computation via SHA3-256                 │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Prover Pool (Decentralized Operators)          │
│ ├── VRF-based random Prover selection (Chainlink)       │
│ ├── Quadratic Slashing (N² penalty for collusion)       │
│ ├── Economic stake as security bond                     │
│ └── Observer challenge mechanism for fraud detection    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Dual Post-Quantum Algorithms

| Algorithm | NIST Standard | Layer | Security Basis | Performance |
|-----------|--------------|-------|----------------|-------------|
| **ML-DSA-65 (Dilithium)** | FIPS 204 | L3 (off-chain) | Lattice-based | 1.2ms verify, 3.3KB sig |
| **SLH-DSA (SPHINCS+)** | FIPS 205 | L1 (on-chain) | Hash-based | Slower, theoretically unbreakable |

**Why two?** Defense in depth. If lattice-based cryptography is compromised, the hash-based SPHINCS+ layer remains secure.

### 2.3 Cryptographic Policy (CP-1)

| Allowed | Forbidden (application layer) |
|---------|------------------------------|
| NIST FIPS 204 ML-DSA-65 | ECDSA |
| SHA3-256 | keccak256 |
| SPHINCS+ (FIPS 205) | Pre-FIPS algorithms |

---

## 3. Core Protocol

### 3.1 Lock Flow

User generates Dilithium keypair in-browser (WASM) → signs lock request → L3 verifies and computes State Root → submits to L1 Vault → assets locked on-chain.

### 3.2 Normal Unlock (24h Time Lock)

User signs unlock → L3 verifies → VRF selects 2 random Provers → Provers co-sign with SPHINCS+ → 24h time lock → Auto-Claim releases assets.

### 3.3 Emergency Unlock (7-day)

User deposits bond (min 0.5 ETH or 5%) → 7-day time lock → if unchallenged, assets released + bond returned.

### 3.4 Challenge & Quadratic Slashing

Observers detect fraud → submit challenge → if valid, Prover slashed N² (quadratic penalty). Makes collusion exponentially expensive.

---

## 4. Token Economics (QS)

### veQS (Voting Escrow)
Lock QS tokens (1-4 years) → receive veQS → governance voting + reward multiplier.

### Reward Distribution
| Recipient | Share |
|-----------|-------|
| Provers | 40% |
| veQS Holders | 30% |
| Observers | 10% |
| Insurance Fund | 10% |
| Treasury | 10% |

---

## 5. Implementation Status

| Component | Status |
|-----------|--------|
| L1 Smart Contracts (Sepolia) | Deployed & verified |
| L3 Governance Contracts (Arbitrum Sepolia) | 12 contracts deployed |
| Backend API (Rust/Axum) | 202 endpoints, PostgreSQL |
| Frontend (Next.js) | 11 apps, 175+ pages |
| WASM Signature Module | ML-DSA-65 keygen/sign/verify |
| Dilithium + SPHINCS+ Integration | Complete |

---

## 6. Comparison

| Feature | Quantum Shield | AA-based PQ | Consensus PQ |
|---------|---------------|-------------|-------------|
| Available today | ✅ | ❌ | ❌ (2028+) |
| No protocol changes | ✅ | Partial | ❌ |
| Dual PQ algorithms | ✅ | ❌ | TBD |
| Economic security | ✅ | ❌ | ❌ |
| Gas-efficient | ✅ (93% savings) | ❌ | N/A |

---

## 7. Roadmap

| Phase | Timeline | Milestones |
|-------|----------|-----------|
| Beta (Current) | Q1-Q2 2026 | Sepolia testnet, 11 apps, core flows |
| Security Audit | Q2 2026 | External audit, VRF production |
| Mainnet Alpha | Q3 2026 | Ethereum mainnet, limited TVL |
| Mainnet Production | Q4 2026 | Full mainnet, multi-chain |
| Institutional | 2027 | HSM, enterprise API, compliance |

---

## References

1. NIST FIPS 204 — ML-DSA (2024)
2. NIST FIPS 205 — SLH-DSA (2024)
3. Vitalik Buterin, "How to hard-fork to save most users' funds in a quantum emergency" (2024)
4. NIST PQ Standardization Process (2016-2024)

---

*© 2026 Quantum Shield*
