# l3-aegis - Quantum Shield L3 Core

> **Phase**: 3 - L3 + Token + 完全分散化
> **Version**: 0.1.0
> **Status**: Foundation Development

## Overview

l3-aegis is the Layer 3 implementation of Quantum Shield's quantum-resistant bridge system. It implements the Modular Architecture with pluggable Governance and Token layers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Pluggable Governance Layer [ON/OFF]                         │
│ └── IGovernanceSwitch.sol                                   │
├─────────────────────────────────────────────────────────────┤
│ Pluggable Token Layer [ON/OFF]                              │
│ └── ITokenSwitch.sol                                        │
├─────────────────────────────────────────────────────────────┤
│ Core Layer [ALWAYS ON]                                      │
│ ├── ICoreLayer.sol                                          │
│ └── IConstitutionLock.sol (CP-1~5 Protection)               │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles (Immutable)

| CP | Name | Protection |
|----|------|------------|
| CP-1 | Complete Quantum Resistance | IMMUTABLE |
| CP-2 | Self-Custody | IMMUTABLE |
| CP-3 | Time Lock Existence | SUPERMAJORITY |
| CP-4 | Slashing Existence | SUPERMAJORITY |
| CP-5 | Transparency | SUPERMAJORITY |

## Project Structure

```
l3-aegis/
├── src/
│   ├── core/           # Core Layer (always ON)
│   ├── governance/     # Governance Layer (pluggable)
│   ├── token/          # Token Layer (pluggable)
│   └── interfaces/     # All interface definitions
├── test/
│   ├── interfaces/     # Interface compliance tests
│   ├── core/           # Core layer tests
│   ├── governance/     # Governance tests
│   └── token/          # Token tests
├── script/             # Deployment scripts
├── crates/             # Rust components
└── foundry.toml
```

## Interfaces

### IGovernanceSwitch
Controls governance operation modes:
- CENTRALIZED: Single admin control (Phase 1)
- MULTISIG: N/M multisig approval (Phase 2)
- DECENTRALIZED: Security Council + DAO voting (Phase 3+)

### ITokenSwitch
Controls token operation modes:
- DISABLED: No token, ETH/USDC fees
- BASIC: QS Token basic functionality
- FULL: veQS + Staking + Rewards

### ICoreLayer
Implements core bridge functions (Sequences #1-4, #3'):
- lock() - Sequence #1
- unlock() - Sequence #2
- emergencyUnlock() - Sequence #3
- resync() - Sequence #3'

### IConstitutionLock
Protects Core Principles with two levels:
- IMMUTABLE: Cannot be changed (CP-1, CP-2)
- SUPERMAJORITY: 75% veQS + 6/7 SC + 30 days (CP-3, CP-4, CP-5)

## Phase 2 Asset Integration

Phase 2 assets are referenced via remappings:

- `@phase2/` → `../contracts/src/`
- STARKVerifier, SHA3Hasher, BatchVerifier from Phase 2

## Development

### Prerequisites

- Foundry (forge, cast, anvil)
- Node.js 18+
- Rust (for l3-aegis/crates)

### Build

```bash
cd l3-aegis
forge build
```

### Test

```bash
forge test
```

### Test with Verbosity

```bash
forge test -vvv
```

## Security Constants

| Parameter | Value | Source |
|-----------|-------|--------|
| Normal Time Lock | 24 hours | SEQ#2 |
| Emergency Time Lock | 7 days | SEQ#3 |
| Emergency Timeout | 72 hours | SEQ#3 |
| Emergency Bond | MAX(0.5 ETH, 5%) | SEQ#3 |
| Quadratic Slashing | N² × 10% | SEQ#4 |

## References

| Document | Path |
|----------|------|
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |
| Modular Architecture | `docs/specs/MODULAR_ARCHITECTURE.md` |
| Phase 3 Strategy | `docs/planning/PHASE3_STRATEGY.md` |
| Spec-Strategy Bridge | `docs/planning/SPEC_STRATEGY_BRIDGE.md` |
| Sequence Specifications | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` |

## License

MIT
