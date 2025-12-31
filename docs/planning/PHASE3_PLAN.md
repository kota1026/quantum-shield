# Phase 3 Plan: L3 + Token + Full Decentralization

> **Version**: 1.2  
> **Date**: 2025-01-01  
> **Status**: 📋 PLANNING  
> **Duration**: Month 10 - Month 18 (9 months)

---

## Executive Summary

Phase 3 extends Quantum Shield from L1 to a full Layer 3 solution with native token economics and complete decentralization. Building on the Phase 2 foundation (ZK-STARK proof system, 834 tests, 71% gas optimization), Phase 3 delivers the L3 infrastructure, veQS governance token, and transition to fully decentralized operations.

### Phase 3 Objectives

| # | Objective | Priority | Timeframe | IC-ID |
|---|-----------|----------|-----------|-------|
| 0 | **L3 Chain Infrastructure (4-node BFT)** | **P0** | **Month 10-12** | **IC-1** |
| 1 | L3 Bridge Contract | P0 | Month 10-12 | IC-2 |
| 2 | Sequencer Implementation | P0 | Month 11-13 | IC-3 |
| 3 | L1↔L3 State Management | P0 | Month 12-14 | IC-4 |
| 4 | veQS Token Design & Implementation | P1 | Month 13-16 | IC-5 |
| 5 | L3 Gas Fee Integration | P1 | Month 15-16 | - |
| 6 | ~~Node Expansion (4→7 nodes)~~ | ~~P1~~ | - | ❌ **不要** |

| 7 | Sepolia L3 E2E Testing | P0 | Month 14-17 | - |

> ⚠️ **重要設計変更（2025-01-01 CEO指示）**: IC-6（Node Expansion 4→7）は不要。代替として2本立て設計（Enterprise / Decentralized）を採用。
>
> **2本立て設計**:
> | Edition | L3 Nodes | 対象市場 |
> |---------|----------|----------|
> | Enterprise | 4ノード固定（全Phase） | 金融系システム会社 |
> | Decentralized | 4ノード→Permissionless（Phase 4） | DEX、ブリッジ、カストディ |

> **IC Reference**: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

---

## Phase 3 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Quantum Shield L3                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              L3 Chain Infrastructure (IC-1)              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   Node 1    │  │   Node 2    │  │   Node 3/4      │  │   │
│  │  │  (US-East)  │  │  (EU-West)  │  │ (Asia/Reserve)  │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │   │
│  │         └────────────────┴──────────────────┘            │   │
│  │                    PBFT Consensus                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  L3 Bridge  │  │  Sequencer  │  │    State Management     │  │
│  │  Contract   │  │   (IC-3)    │  │        (IC-4)           │  │
│  │   (IC-2)    │  │             │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│         └────────────────┴──────────────────────┘               │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │              L1 ↔ L3 Communication Protocol               │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     Ethereum L1                                  │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────────────────┐  │
│  │   L1Vault   │  │ STARKVerifier│  │   BatchVerifier        │  │
│  │  (Phase 2)  │  │   (Phase 2)  │  │   (Phase 2)            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 0. L3 Chain Infrastructure (IC-1) ⭐ NEW

> **Reference**: `docs/aegis/L3_CHAIN_SPECIFICATION.md`
> **Decision**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

**Purpose**: Provide the foundational 4-node BFT blockchain for L3 operations.

| Feature | Description |
|---------|-------------|
| Consensus | PBFT variant (f=1, 3/4 quorum) |
| Block Time | 5 seconds |
| Nodes | 4 (US-East, EU-West, Asia-SG, Reserve) |
| Cryptography | Dilithium-III (consensus), SHA3-256 (hashing) |
| Storage | RocksDB |
| P2P | Custom TCP + TLS 1.3 + mTLS |

**Key Requirements**:
- Must use Dilithium-III for all consensus signatures (CP-1)
- Must use SHA3-256 for all hashing (CP-1)
- Must record all transactions for transparency (CP-5)
- Must support membership expansion for Phase 3-4

**Implementation (l3-aegis)**:

```rust
// Core modules
l3-aegis/
├── aegis-consensus/     // PBFT implementation
├── aegis-crypto/        // Dilithium, SHA3-256
├── aegis-network/       // P2P, TLS 1.3
├── aegis-storage/       // RocksDB, SMT
├── aegis-node/          // Node binary
└── aegis-cli/           // CLI tools
```

**Milestones**:

| Milestone | Target | Description |
|-----------|--------|-------------|
| L3-INFRA-1 | Month 10 | Single-node dev mode working |
| L3-INFRA-2 | Month 11 | 4-node local consensus |
| L3-INFRA-3 | Month 12 | Testnet deployment (4 nodes) |

### 1. L3 Bridge Contract (IC-2)

**Purpose**: Facilitate secure asset bridging between L1 and L3.

| Feature | Description |
|---------|-------------|
| Deposit | L1→L3 asset transfer with ZK-STARK proof |
| Withdrawal | L3→L1 with proof and time lock |
| Message Passing | Arbitrary data L1↔L3 |
| Fraud Proof | Challenge mechanism for invalid state |

**Key Requirements**:
- Must integrate with existing L1Vault
- Must use SHA3-256 for all hashing (CP-1)
- Must maintain time lock constraints (CP-3)
- Must support batch operations for gas efficiency

**Interface Draft**:
```solidity
interface IL3Bridge {
    function depositToL3(
        uint256 amount,
        bytes32 l3Recipient,
        bytes calldata dilithiumSignature
    ) external payable returns (bytes32 depositId);
    
    function initiateWithdrawal(
        bytes32 depositId,
        uint256 amount,
        bytes calldata starkProof
    ) external returns (bytes32 withdrawalId);
    
    function finalizeWithdrawal(
        bytes32 withdrawalId
    ) external;
    
    function verifyStateRoot(
        bytes32 proposedRoot,
        bytes calldata starkProof
    ) external returns (bool);
}
```

### 2. Sequencer (IC-3)

**Purpose**: Order and batch L3 transactions for L1 submission.

| Feature | Description |
|---------|-------------|
| Transaction Ordering | Deterministic ordering |
| Batch Creation | Aggregate transactions into batches |
| State Transition | Compute state transitions |
| Proof Generation | Generate ZK-STARK proofs |

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                     Sequencer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Mempool    │→ │  Batch      │→ │  Proof Generator    │  │
│  │  Manager    │  │  Builder    │  │  (ZK-STARK)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         ↑                                    │               │
│         │                                    ↓               │
│  ┌──────┴──────┐                   ┌─────────────────────┐  │
│  │  RPC Server │                   │  L1 Submitter       │  │
│  └─────────────┘                   └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Requirements**:
- Decentralization path from day 1 design
- Support multiple sequencer rotation
- Economic incentives via veQS staking

### 3. State Management (IC-4)

**Purpose**: Maintain L3 state with L1 anchoring.

| Component | Description |
|-----------|-------------|
| State Tree | Sparse Merkle Tree (SMT) |
| State Root | SHA3-256 computed root |
| State Diff | Delta encoding for efficiency |
| Data Availability | Calldata or alternative DA |

**State Transition Function**:
```
NewState = STF(CurrentState, Transactions)
Proof = ZK-STARK(CurrentState, NewState, Transactions)
```

---

## Token Design: veQS (Vote-Escrowed Quantum Shield) (IC-5)

### Overview

veQS is the governance and utility token for Quantum Shield, following the vote-escrowed model for long-term alignment.

### Token Economics

| Parameter | Value | Notes |
|-----------|-------|-------|
| Max Supply | 1,000,000,000 veQS | Fixed cap |
| Initial Distribution | TBD | Team, investors, community |
| Vesting Schedule | 4 years | Linear unlock |
| Lock Duration | 1 week - 4 years | Longer lock = more voting power |

### Utility

| Use Case | Description |
|----------|-------------|
| **Governance** | Protocol parameter changes |
| **Sequencer Staking** | Become a sequencer |
| **Fee Sharing** | Proportion of L3 fees |
| **Security Council** | Voting for council members |

### L3 Gas Fee Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    Gas Fee Flow                              │
│                                                              │
│   User → [L3 Transaction] → Sequencer                       │
│                   │                                          │
│                   ↓                                          │
│   Gas Fee = Base Fee + Priority Fee                          │
│              (in veQS or ETH)                                │
│                   │                                          │
│                   ↓                                          │
│   Distribution:                                              │
│   - 70% → Sequencer (execution)                             │
│   - 20% → veQS Stakers (security)                           │
│   - 10% → Treasury (development)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Node Expansion: 4→7 Nodes (IC-6) ⭐ NEW

> **Reference**: `docs/aegis/L3_CHAIN_SPECIFICATION.md` §9
> **Reference**: `docs/planning/DEVELOPMENT_STRATEGY_v2.0.md` §3

### Purpose

Expand L3 from 4 nodes to 7 nodes for increased decentralization and fault tolerance.

### Expansion Plan

| Phase | Nodes | Fault Tolerance | Quorum | Target |
|-------|-------|-----------------|--------|--------|
| Phase 1-2 | 4 | f=1 | 3/4 (75%) | Month 10-15 |
| Phase 3 | 7 | f=2 | 5/7 (71%) | Month 16-18 |

### New Node Requirements

| Node | Region | Operator | Selection |
|------|--------|----------|-----------|
| Node 5 | LATAM | Partner | SC Approval |
| Node 6 | MENA | Partner | SC Approval |
| Node 7 | ANZ | Partner | SC Approval |

### Technical Changes

```rust
// Membership expansion
pub struct CouncilMembershipManager {
    nodes: Vec<NodeConfig>,
    council: SecurityCouncil,
    pending_additions: Vec<PendingNode>,
}

impl CouncilMembershipManager {
    pub fn propose_node(&mut self, node: NodeConfig) -> ProposalId;
    pub fn approve_node(&mut self, proposal_id: ProposalId) -> Result<()>;
    pub fn activate_node(&mut self, node_id: NodeId) -> Result<()>;
}
```

### Milestones

| Milestone | Target | Description |
|-----------|--------|-------------|
| NODE-EXP-1 | Month 16 | Council membership implementation |
| NODE-EXP-2 | Month 17 | Partner onboarding (3 nodes) |
| NODE-EXP-3 | Month 18 | 7-node consensus live |

---

## Full Decentralization Roadmap

### Stage 1: Training Wheels (Month 10-14)

| Item | Status |
|------|--------|
| Single Sequencer | Operated by team |
| Upgrades | Team controlled |
| Security Council | Team multisig |
| Emergency Actions | Team authorized |
| **L3 Nodes** | **4 nodes (QS operated)** |

### Stage 2: Limited Decentralization (Month 14-16)

| Item | Status |
|------|--------|
| Sequencer Rotation | 3-5 sequencers |
| Upgrades | Security Council vote |
| Security Council | Elected via veQS |
| Emergency Actions | Council + time lock |
| **L3 Nodes** | **4 nodes (preparing expansion)** |

### Stage 3: Full Decentralization (Month 16-18)

| Item | Status |
|------|--------|
| Sequencer | Open set, veQS staking |
| Upgrades | veQS token vote |
| Security Council | Fully elected |
| Emergency Actions | DAO governance |
| **L3 Nodes** | **7 nodes (SC approved partners)** |

---

## Development Milestones

### Month 10-11: L3 Foundation

- [ ] **L3 Chain Infrastructure v0.1 (IC-1)**
  - [ ] Single-node dev mode
  - [ ] Basic PBFT implementation
  - [ ] Dilithium consensus signatures
- [ ] L3 Bridge Contract v0.1 (IC-2)
- [ ] Basic Sequencer implementation (IC-3)
- [ ] State tree structure (IC-4)
- [ ] Internal testing framework

### Month 12-13: Core Integration

- [ ] **L3 Chain Infrastructure v1.0 (IC-1)**
  - [ ] 4-node local consensus
  - [ ] RocksDB storage
  - [ ] P2P networking
- [ ] L3 Bridge v1.0 (IC-2)
- [ ] Sequencer batch processing (IC-3)
- [ ] L1↔L3 message passing
- [ ] State proof generation (IC-4)

### Month 14-15: Token & Testing

- [ ] veQS token contract (IC-5)
- [ ] Staking mechanism
- [ ] Sepolia L3 deployment
- [ ] E2E testing framework

### Month 16-17: Node Expansion & Decentralization

- [ ] **Council membership implementation (IC-6)**
- [ ] **Partner node onboarding (3 new nodes)**
- [ ] Multi-sequencer support
- [ ] Governance contracts
- [ ] Security Council transition
- [ ] Fee distribution

### Month 18: Phase 3 Close

- [ ] **7-node consensus live (IC-6)**
- [ ] Full E2E on Sepolia
- [ ] Documentation complete
- [ ] Phase 4 handoff
- [ ] PIR final review

---

## Success Criteria

| Criteria | Target | IC-ID |
|----------|--------|-------|
| L3 Chain Operational | 4 nodes running, <10s blocks | IC-1 |
| L3 Bridge Functional | L1↔L3 deposit/withdraw | IC-2 |
| Sequencer Operating | 99% uptime on testnet | IC-3 |
| State Proofs | ZK-STARK verified on L1 | IC-4 |
| veQS Token | Deployed and staking active | IC-5 |
| Node Expansion | 7 nodes operational | IC-6 |
| Test Coverage | >800 tests passing | - |
| Sepolia L3 E2E | Complete flow success | - |
| Decentralization | Stage 3 achieved | - |

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **L3 chain complexity underestimated** | 🔴 High | 🟡 Medium | Reference L3_CHAIN_SPECIFICATION.md |
| L3 bridge complexity underestimated | 🔴 High | 🟡 Medium | Reference existing L3 implementations |
| Sequencer centralization | 🟡 Medium | 🟢 Low | Design decentralization from start |
| Token regulatory issues | 🟡 Medium | 🟡 Medium | Legal consultation |
| Gas costs on L1 | 🟡 Medium | 🟢 Low | Batch optimization (Phase 2 71%) |
| Security vulnerabilities | 🔴 High | 🟢 Low | Continue PIR process |
| **Node expansion delays** | 🟡 Medium | 🟡 Medium | Early partner engagement |

---

## Resource Requirements

### Development

| Role | Count | Duration |
|------|-------|----------|
| **Rust Engineers (L3 Chain)** | **2** | **9 months** |
| Smart Contract Engineers | 2 | 9 months |
| Backend Engineers (Sequencer) | 2 | 6 months |
| Security Engineers | 1 | 9 months |
| DevOps | 1 | 6 months |

### Infrastructure

| Item | Purpose |
|------|---------|
| **L3 Testnet Nodes (4)** | **L3 chain testing** |
| Sepolia L3 | Testing environment |
| Sequencer Servers | 3+ for decentralization |
| Monitoring | 24/7 uptime tracking |
| CI/CD | GitHub Actions extension |

---

## Integration with Phase 2

### Assets Inherited

| Asset | Status | Usage |
|-------|--------|-------|
| L1Vault | ✅ Deployed | L3 Bridge integration |
| STARKVerifier | ✅ Deployed | L3 proof verification |
| BatchVerifier | ✅ Deployed | Batch proof processing |
| Test Suite | ✅ 834 tests | Extend for L3 |
| PIR Process | ✅ 13 reviews | Continue for L3 |

### Compatibility Requirements

| Requirement | Description | IC-ID |
|-------------|-------------|-------|
| CP-1 Compliance | SHA3-256 only in L3 | IC-1 |
| CP-2 Self-Custody | User key management | IC-2 |
| CP-3 Time Lock | L3→L1 withdrawals | IC-2 |
| CP-4 Slashing | Sequencer misbehavior | IC-3 |
| CP-5 Transparency | All on-chain verifiable | IC-1 |

---

## Reference Documents

| Document | Path | Relevance |
|----------|------|-----------|
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` | Immutable constraints |
| **L3 Chain Specification** | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | **IC-1 details, 2本立て設計** |
| **L3 Infrastructure Decision** | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | **Technical decisions** |
| **Development Strategy** | `docs/planning/DEVELOPMENT_STRATEGY_v2.0.md` | **2-track strategy** |
| **Spec-Strategy Bridge** | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | **IC traceability** |
| L3 Strategy (Draft) | `docs/planning/L3_STRATEGY.md` | Legacy reference |
| Phase 2 Report | `docs/planning/PHASE2_COMPLETION_REPORT.md` | Baseline |
| Phase Restructure | `docs/planning/PHASE_RESTRUCTURE.md` | Phase definitions |

---

## Next Steps

1. **Month 10 Kickoff**
   - [ ] **L3 Chain Infrastructure specification review (IC-1)**
   - [ ] L3 Bridge specification review (IC-2)
   - [ ] Sequencer architecture design (IC-3)
   - [ ] Team resource allocation

2. **Infrastructure Setup**
   - [ ] **L3 testnet environment (4 nodes)**
   - [ ] Sepolia L3 environment
   - [ ] CI/CD extension for L3
   - [ ] Monitoring setup

3. **Development Start**
   - [ ] **l3-aegis single-node mode (IC-1)**
   - [ ] L3 Bridge v0.1 implementation (IC-2)
   - [ ] Unit test framework for L3

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-28 | Initial draft |
| 1.1 | 2025-12-29 | Add IC-1 (L3 Chain Infrastructure), IC-6 (Node Expansion), IC references throughout |
| 1.2 | 2025-01-01 | ❌ IC-6不要（CEO指示）、2本立て設計（Enterprise/Decentralized）追加 |

---

**Phase 3 Status: 📋 PLANNING - Ready for Execution**

---

**END OF PHASE 3 PLAN**
