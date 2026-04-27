# Competitive Landscape — 2026-04-27

_Companion to `STRATEGY_2026-04-27_v3.md`. Updated monthly via `weekly-research.yml`._

---

## Quadrant Map

```
                    Strong PQ Story
                          │
                          │
    QRL 2.0 ◯       ◯ Quantum Shield (us)
   (own-L1, XMSS)         │   (Ethereum-native, dual NIST)
                          │
                          │
   ─────────────────────┼─────────────────────  Ethereum-native
                          │
                          │
   StarkNet ◯             │     ◯ EF Post-Quantum Team
   (PQ proofs only,       │       (research, not product)
    user-EOA still ECDSA) │
                          │
                          │
                    Weak PQ Story
```

Quantum Shield is **alone in the upper-right quadrant** (strong PQ story + Ethereum-native production runtime).

---

## Direct Competitors

### QRL 2.0 (Quantum Resistant Ledger)
- **Approach**: Own L1 + XMSS (hash-only, stateful)
- **Status**: Testnet V2 Q1 2026, audit-ready
- **Strength**: 7 years of PQ-specific operation
- **Weakness**: Not Ethereum, single-algorithm, stateful (more user friction)
- **Threat to us**: 40% — if institutional players accept "leave Ethereum for PQ," they leak
- **Counter**: We are EVM-native + dual-algorithm

### StarkNet
- **Approach**: STARK proofs are PQ-secure (FRI hash-based)
- **Strength**: $5B+ TVL, mature ecosystem, true PQ-secure proof system
- **Weakness**: User EOAs still ECDSA — not PQ-secure at the signing layer
- **Threat to us**: 20% — addresses a different layer than custody
- **Counter**: We focus on signing/custody; they focus on proof systems

### Ethereum Foundation Post-Quantum Security Team
- **Status**: Formed Jan 2026, $2M research prize, lead Thomas Coratger
- **Threat to us**: ⚠️ This is who we should align with, not compete against
- **Posture**: Apply for Grant, submit arxiv paper, propose collaboration

### PQShield (UK)
- **Approach**: PQC IP/HW for chips, firmware, government
- **Funding**: $63M+, not acquired
- **Threat to us**: 10% — they sell IP, not custody products
- **Opportunity**: Potential partnership for HSM/TEE integration

---

## Adjacent (Ethereum-side EIPs)

| EIP | Stage | Threat / Opportunity |
|---|---|---|
| **EIP-8141** Frame Transactions | CFI for Hegotá H2 2026 | ⚠️ Commoditizes signature-scheme switching. Adopt early. |
| **EIP-8051** ML-DSA precompile | Draft Oct 2025 | ⚠️⚠️ Reduces ML-DSA verification 1000×. Largest single threat to our SR₀/SR₁ moat. |
| **EIP-7885** NTT precompile | Pre-draft | Building block for EIP-8051. Adopt when stable. |
| **EIP-8052** Falcon precompile | Draft Oct 2025 | Less direct (we don't use Falcon yet) but signals lattice-PQ ecosystem maturation. |
| **EIP-8182** Native private transfers | Draft Apr 2026 | Privacy + native — opens door to "PQ + private" combined story. |

---

## Potential Acquirers (Tier-3 Network mapping)

### Bridge Protocols (highest-probability acquirer per v3)

| Protocol | Why they'd want us | Approach |
|---|---|---|
| **Wormhole** | $3B+ in cross-chain assets, no PQ roadmap, recent hack history | Research forum / GitHub issue first |
| **LayerZero** | Massive guardian network, enterprise focus | Research grants channel |
| **Axelar** | Cosmos-Ethereum focus, validator economics fit our slashing | Dev forum |
| **Chainlink CCIP** | Largest oracle player, would value pattern license | LinkedIn / partnership |

### Institutional Custodians

| Custodian | Why they'd want us | Status (2026) |
|---|---|---|
| **Fireblocks** | IPO'd Jan 2026, OCC charter, $30M+ insurance, no PQ in production | Public company — partnership easier than acquisition |
| **Anchorage** | Federal bank charter, $350M+ insurance, "PQ pilot" claimed | Innovation Lab is the entry point |
| **BitGo** | $250M insurance, banks eyeing takeover | Trust division most relevant |
| **Coinbase Prime** | $320M insurance, retail leader | Lower priority — they prefer in-house |
| **Hex Trust** | Acquired by Ripple Jan 2026 | **Precedent** for our acquisition path |

### Chain / L2 Players

| Chain | Why they'd want us | Notes |
|---|---|---|
| **Polygon** | STARK + SNARK hybrid; would benefit from PQ-safe pattern | zkEVM team is the contact |
| **Arbitrum** | Largest L2, no PQ story | Foundation grants channel |
| **Optimism** | RetroPGF model fits our open-source profile | Round 6 likely H2 2026 |
| **zkSync** | SNARK-based, quantum-vulnerable today | Partnership opportunity |

---

## Quantum Hardware Threat (timeline accelerator)

| Player | 2026 Status | Implication |
|---|---|---|
| Microsoft + Atom | Magne 50 logical / ~1,200 physical, ops Q1 2027 | First commercially-named logical-qubit machine |
| IBM | Nighthawk 120 qubit, 10× error correction speedup | "Verified quantum advantage" target EOY 2026 |
| Google | Willow chip, below-threshold error correction confirmed | Scaling now reduces errors qualitatively |

**New estimate**: ~1M qubits to break RSA-2048 (down from 20M). Bitcoin/Ethereum ECDSA needs ~317 logical qubits per 2022 paper.

---

## Bridge Hack Severity (v3 driver)

| Year | Total stolen from bridges | Major incidents |
|---|---|---|
| 2021–2024 | $2.8B+ | Wormhole ($320M), Ronin ($625M), Nomad ($190M) |
| 2025 H1 | $3B (119 attacks) | KelpDAO ($292M) |
| 2026 Q1 | Worst month in 1+ year | CrossCurve ($3M), Aethir ($90K), $606M April |

**None of the major bridges has a published PQ roadmap.**
**ML-DSA × N guardians directly = several USD per swap on Ethereum (impractical).**

→ **Quantum Shield's SR₀/SR₁ + Prover Pool is the only viable PQ pattern at bridge scale.**

---

## Movement to Watch (next 90 days)

1. EIP-8141 inclusion decision for Hegotá fork
2. EF Post-Quantum Security Team's first published deliverable
3. EIP-8051 status change (predraft → draft → CFI)
4. Bridge protocol hack response (any post-incident PQ announcement)
5. Vitalik's next public statement on PQ migration
6. SP1 Hypercube's first ML-DSA proof benchmark (we should produce ours first)

---

## Update Cadence

This file is updated:
- **Weekly**: by `weekly-research.yml` automated PR (currently being repaired in Track 0)
- **Monthly**: full re-read and quadrant map update by Researcher
- **Event-driven**: Vitalik post / EF announcement / bridge hack triggers immediate update

Last update: 2026-04-27 (manual, Strategic Meeting v3 + v4 follow-up)
