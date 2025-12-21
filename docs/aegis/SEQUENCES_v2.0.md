# Quantum Shield L3 - Sequence Diagrams v2.0

> **Document Version**: 2.0  
> **Last Updated**: 2025-12-21

---

## 1. Lock Flow (L1 → L3)

```mermaid
sequenceDiagram
    participant User
    participant L1_Vault as L1 Vault Contract
    participant L3_Aegis as L3 Aegis Network
    participant SMT as Sparse Merkle Tree

    User->>L1_Vault: lock(amount, recipient, dilithiumPubkey)
    L1_Vault->>L1_Vault: Validate amount >= minLock
    L1_Vault->>L1_Vault: Transfer ETH to vault
    L1_Vault->>L1_Vault: Emit LockEvent(lockId, amount, recipient, pubkey)
    
    L3_Aegis->>L1_Vault: Monitor LockEvent
    L3_Aegis->>L3_Aegis: Validate event data
    L3_Aegis->>SMT: Insert leaf(lockId, amount, recipient, pubkey)
    L3_Aegis->>L3_Aegis: BFT consensus on state update
    L3_Aegis->>L3_Aegis: Emit L3LockConfirmed(lockId, stateRoot)
```

---

## 2. Normal Unlock Flow (L3 → L1)

```mermaid
sequenceDiagram
    participant User
    participant L3_Aegis as L3 Aegis
    participant VRF as Chainlink VRF
    participant Provers as Prover Pool (5)
    participant L1_Vault as L1 Vault

    User->>L3_Aegis: requestUnlock(lockId, amount, dilithiumSig)
    L3_Aegis->>L3_Aegis: Verify Dilithium signature
    L3_Aegis->>L3_Aegis: Validate SMT proof
    L3_Aegis->>VRF: Request random seed
    VRF-->>L3_Aegis: Random seed
    L3_Aegis->>L3_Aegis: Select 2 Provers via VRF
    
    L3_Aegis->>Provers: Request SPHINCS+ signatures
    Provers->>Provers: Verify request validity
    Provers->>Provers: Sign with SPHINCS+-128s
    Provers-->>L3_Aegis: SPHINCS+ signatures (2/5)
    
    L3_Aegis->>L1_Vault: submitUnlock(lockId, amount, proof, signatures)
    L1_Vault->>L1_Vault: Verify SMT proof
    L1_Vault->>L1_Vault: Verify 2/5 SPHINCS+ signatures
    L1_Vault->>L1_Vault: Start 24h Time Lock
    
    Note over L1_Vault: 24 hours later...
    
    User->>L1_Vault: executeUnlock(lockId)
    L1_Vault->>L1_Vault: Check time lock expired
    L1_Vault->>L1_Vault: Check no challenge pending
    L1_Vault->>User: Transfer ETH
```

---

## 3. Emergency Unlock Flow

```mermaid
sequenceDiagram
    participant User
    participant L1_Vault as L1 Vault
    participant Watchers as Watchers/Community

    User->>L1_Vault: requestEmergencyUnlock(lockId, bond)
    L1_Vault->>L1_Vault: Validate bond >= MAX(0.5 ETH, amount × 5%)
    L1_Vault->>L1_Vault: Start 7-day Time Lock
    L1_Vault->>L1_Vault: Emit EmergencyUnlockRequested
    
    alt No Challenge
        Note over L1_Vault: 7 days later...
        User->>L1_Vault: executeEmergencyUnlock(lockId)
        L1_Vault->>User: Transfer ETH + bond
    else Challenge Raised
        Watchers->>L1_Vault: challenge(lockId, proof)
        L1_Vault->>L1_Vault: Verify challenge proof
        alt Challenge Valid
            L1_Vault->>Watchers: Transfer bond to challenger
            L1_Vault->>L1_Vault: Cancel emergency unlock
        else Challenge Invalid
            L1_Vault->>L1_Vault: Slash challenger
        end
    end
```

---

## 4. Challenge Flow (Phase 2+)

```mermaid
sequenceDiagram
    participant Watcher
    participant L1_Vault as L1 Vault
    participant ZK_Verifier as ZK Verifier
    participant Council as Security Council

    Watcher->>L1_Vault: challenge(unlockId, fraudProof)
    L1_Vault->>L1_Vault: Pause unlock execution
    L1_Vault->>L1_Vault: Emit ChallengePending
    
    alt ZK Validity Proof Available (Phase 2+)
        L1_Vault->>ZK_Verifier: verifyProof(unlockId, zkProof)
        ZK_Verifier-->>L1_Vault: Proof valid/invalid
        
        alt Proof Valid
            L1_Vault->>L1_Vault: Resume unlock
            L1_Vault->>L1_Vault: Slash challenger
        else Proof Invalid
            L1_Vault->>L1_Vault: Cancel unlock
            L1_Vault->>Watcher: Reward challenger
        end
    else No ZK (Phase 1)
        L1_Vault->>Council: Escalate to Security Council
        Council->>Council: 7/9 vote on validity
        Council-->>L1_Vault: Decision
    end
```

---

## 5. Prover Registration Flow

```mermaid
sequenceDiagram
    participant NewProver as New Prover
    participant Staking as Staking Contract
    participant Council as Security Council
    participant Registry as Prover Registry

    NewProver->>Staking: stake($QS or ETH, amount >= minStake)
    Staking->>Staking: Lock stake
    
    NewProver->>Registry: registerProver(hsmProof, multisigConfig)
    Registry->>Registry: Validate HSM proof
    Registry->>Registry: Validate 2-of-3 multisig
    
    alt Phase 1 (Permissioned)
        Registry->>Council: Request approval
        Council->>Council: 3/6 vote
        Council-->>Registry: Approval decision
    else Phase 2+ (Auto-approval)
        Registry->>Registry: Auto-approve if conditions met
    end
    
    Registry->>Registry: Add to active prover set
    Registry->>Registry: Emit ProverRegistered
```

---

## 6. Slashing Flow

```mermaid
sequenceDiagram
    participant Monitor as Monitoring Bot
    participant L1_Vault as L1 Vault
    participant Staking as Staking Contract
    participant Insurance as Insurance Fund

    Monitor->>L1_Vault: detectMaliciousSignature(proverId, proof)
    L1_Vault->>L1_Vault: Verify fraud proof
    
    alt Single Violation
        L1_Vault->>Staking: slash(proverId, 10%)
        Staking->>Insurance: Transfer 50% of slashed
        Staking->>L1_Vault: Burn 50% of slashed
    else Collusion (N provers)
        L1_Vault->>Staking: slashQuadratic(proverIds, N² × 10%)
        Note over Staking: E.g., 2 provers = 40% slash
    end
    
    Staking->>Staking: Emit Slashed(proverId, amount)
```

---

## 7. Governance Vote Flow

```mermaid
sequenceDiagram
    participant Proposer
    participant veQS as veQS Contract
    participant Governor as Governor Contract
    participant Timelock as Timelock
    participant Purpose as Purpose Committee

    Proposer->>Governor: propose(targets, values, calldatas)
    Governor->>veQS: Check proposer voting power
    Governor->>Governor: Create proposal (7-day discussion)
    
    Purpose->>Governor: Check proposal against principles
    alt Principle Violation
        Purpose->>Governor: Veto proposal
    else Approved
        Note over Governor: 7-day voting period
        
        loop For each voter
            veQS->>Governor: castVote(proposalId, support)
        end
        
        Governor->>Governor: Tally votes
        
        alt Quorum reached & majority
            Governor->>Timelock: queue(proposalId)
            Note over Timelock: 7-day timelock
            Governor->>Timelock: execute(proposalId)
        else Failed
            Governor->>Governor: Mark as defeated
        end
    end
```

---

## 8. State Sync Flow (L1 ↔ L3)

```mermaid
sequenceDiagram
    participant L1 as L1 (Ethereum)
    participant Bridge as Bridge Relay
    participant L3 as L3 Aegis
    participant SMT as Sparse Merkle Tree

    loop Every block
        L1->>Bridge: New block with events
        Bridge->>Bridge: Filter Lock/Unlock events
        Bridge->>L3: Forward events
        L3->>L3: Validate event signatures
        L3->>SMT: Update state
        L3->>L3: BFT consensus
        L3->>L3: Compute new state root
    end
    
    L3->>Bridge: Periodic state root commitment
    Bridge->>L1: Submit state root (with SPHINCS+ sigs)
    L1->>L1: Store state root
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-21 | Initial diagrams |
| 2.0 | 2025-12-21 | Added ZK Validity, Governance flows |

---

**END OF DOCUMENT**
