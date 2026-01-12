# L1 Vault Contract - Technical Design Document

> **Task ID**: 1.1.1  
> **Version**: 1.0  
> **Author**: Engineer Agent  
> **Date**: 2025-12-22  
> **Status**: Draft

---

## 1. Overview

L1 Vault Contractは、Quantum Shield L3ブリッジのL1（Ethereum）側コアコントラクトである。Phase 1ではSPHINCS+ 2/5署名ベースのセキュリティモデルを採用し、ZK Validity ProofはPhase 2で追加される。

### 1.1 Scope

| Feature | Phase 1 | Phase 2 |
|---------|---------|---------|
| Lock (ETH deposit) | ✅ | ✅ |
| Normal Unlock (24h) | ✅ | ✅ |
| Emergency Unlock (7d) | ✅ | ✅ |
| SPHINCS+ 2/5 Verification | ✅ | ✅ |
| Challenge/Slashing | ✅ | ✅ |
| SMT Proof Verification | ✅ | ✅ |
| ZK Validity Proof | ❌ | ✅ |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          L1 Vault Contract                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────────┐ │
│  │   Lock      │    │  Normal Unlock   │    │   Emergency Unlock     │ │
│  │   Module    │    │    (24h TL)      │    │      (7d TL)           │ │
│  └─────────────┘    └──────────────────┘    └────────────────────────┘ │
│         │                    │                         │                │
│         ▼                    ▼                         ▼                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SMT Verification Module                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                 SPHINCS+ Signature Verifier                      │   │
│  │                    (2/5 Threshold)                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                 Challenge / Slashing Module                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Structures

### 3.1 Lock

```solidity
struct Lock {
    bytes32 lockId;              // Unique identifier
    address sender;              // Original depositor
    uint256 amount;              // Locked ETH amount
    bytes32 dilithiumPubKeyHash; // Keccak256(Dilithium public key)
    uint256 lockedAt;            // Block timestamp of lock
    LockStatus status;           // Current status
}

enum LockStatus {
    ACTIVE,           // Locked, awaiting unlock
    PENDING_UNLOCK,   // Unlock requested, in time lock
    RELEASED,         // Successfully released
    CHALLENGED,       // Under challenge
    SLASHED           // Slashed due to fraud
}
```

### 3.2 Unlock Request

```solidity
struct UnlockRequest {
    bytes32 lockId;              // Associated lock
    address recipient;           // Destination address
    uint256 amount;              // Amount to unlock
    bytes32 smtProof;            // Sparse Merkle Tree proof root
    bytes32 stateRoot;           // L3 state root at unlock time
    uint256 requestedAt;         // Block timestamp of request
    uint256 unlockableAt;        // When time lock expires
    bool isEmergency;            // Emergency unlock flag
    uint256 bond;                // Emergency bond amount (0 for normal)
    bytes32[] proverSignatures;  // SPHINCS+ signatures from provers
    address[] signingProvers;    // Addresses of signing provers
}
```

### 3.3 Prover

```solidity
struct Prover {
    address proverAddress;       // Prover's ETH address
    bytes32 sphincsPubKeyHash;   // Keccak256(SPHINCS+ public key)
    uint256 stakedAmount;        // Staked ETH (Phase 1) or $QS (Phase 2)
    uint256 registeredAt;        // Registration timestamp
    bool isActive;               // Currently active
    uint256 successfulSigns;     // Successful signature count
    uint256 slashedCount;        // Times slashed
}
```

---

## 4. State Variables

```solidity
// ============ Configuration ============
uint256 public constant NORMAL_TIME_LOCK = 24 hours;
uint256 public constant EMERGENCY_TIME_LOCK = 7 days;
uint256 public constant MIN_LOCK_AMOUNT = 0.01 ether;
uint256 public constant MIN_UNLOCK_AMOUNT = 10_000 * 1e6; // $10K in USDC terms
uint256 public constant EMERGENCY_BOND_PERCENT = 5; // 5% of amount
uint256 public constant MIN_EMERGENCY_BOND = 0.5 ether;
uint256 public constant REQUIRED_SIGNATURES = 2;
uint256 public constant TOTAL_PROVERS = 5;
uint256 public constant TVL_CAP = 1_000_000 * 1e6; // $1M Phase 1 cap

// ============ State ============
uint256 public totalLocked;
uint256 public nonceCounter;
bytes32 public currentStateRoot;

// ============ Mappings ============
mapping(bytes32 => Lock) public locks;
mapping(bytes32 => UnlockRequest) public unlockRequests;
mapping(address => Prover) public provers;
mapping(bytes32 => bool) public usedNonces;
mapping(bytes32 => Challenge) public challenges;

// ============ Prover Set ============
address[] public activeProvers;
```

---

## 5. Core Functions

### 5.1 Lock

```solidity
/// @notice Lock ETH for cross-chain transfer
/// @param recipient L3 recipient address (can be same as sender)
/// @param dilithiumPubKey Full Dilithium public key (1952 bytes for Level 3)
/// @return lockId Unique lock identifier
function lock(
    address recipient,
    bytes calldata dilithiumPubKey
) external payable returns (bytes32 lockId);
```

**Flow:**
1. Validate `msg.value >= MIN_LOCK_AMOUNT`
2. Validate `totalLocked + msg.value <= TVL_CAP`
3. Compute `dilithiumPubKeyHash = keccak256(dilithiumPubKey)`
4. Generate `lockId = keccak256(sender, amount, dilithiumPubKeyHash, nonce, block.timestamp)`
5. Store Lock struct
6. Update `totalLocked`
7. Emit `LockEvent(lockId, sender, recipient, amount, dilithiumPubKeyHash)`

**Gas Estimate:** ~135K gas

### 5.2 Request Unlock (Normal)

```solidity
/// @notice Request normal unlock with Prover signatures
/// @param lockId Lock to unlock
/// @param recipient ETH recipient address
/// @param smtProof Sparse Merkle Tree inclusion proof
/// @param stateRoot L3 state root
/// @param dilithiumSignature User's Dilithium signature
/// @param sphincsSignatures Array of SPHINCS+ signatures (min 2)
/// @param signingProvers Array of prover addresses who signed
function requestUnlock(
    bytes32 lockId,
    address recipient,
    bytes32[] calldata smtProof,
    bytes32 stateRoot,
    bytes calldata dilithiumSignature,
    bytes[] calldata sphincsSignatures,
    address[] calldata signingProvers
) external;
```

**Flow:**
1. Validate lock exists and is ACTIVE
2. Verify Dilithium signature (off-chain verification, on-chain hash check)
3. Verify SMT proof against stateRoot
4. Verify >= 2 valid SPHINCS+ signatures from registered provers
5. Create UnlockRequest with `unlockableAt = block.timestamp + 24 hours`
6. Update lock status to PENDING_UNLOCK
7. Emit `UnlockRequested(lockId, recipient, amount, unlockableAt)`

**Gas Estimate:** ~490K gas (SPHINCS+ verification is expensive)

### 5.3 Execute Unlock

```solidity
/// @notice Execute unlock after time lock expires
/// @param lockId Lock to execute unlock for
function executeUnlock(bytes32 lockId) external;
```

**Flow:**
1. Validate UnlockRequest exists
2. Validate `block.timestamp >= unlockRequest.unlockableAt`
3. Validate no pending challenge
4. Transfer ETH to recipient
5. Update lock status to RELEASED
6. Update `totalLocked`
7. Emit `UnlockExecuted(lockId, recipient, amount)`

**Gas Estimate:** ~50K gas

### 5.4 Request Emergency Unlock

```solidity
/// @notice Request emergency unlock (bypass L3, requires bond)
/// @param lockId Lock to unlock
/// @param recipient ETH recipient address
function requestEmergencyUnlock(
    bytes32 lockId,
    address recipient
) external payable;
```

**Flow:**
1. Validate lock exists and is ACTIVE
2. Validate `msg.value >= max(MIN_EMERGENCY_BOND, amount * EMERGENCY_BOND_PERCENT / 100)`
3. Create UnlockRequest with `unlockableAt = block.timestamp + 7 days`, `isEmergency = true`
4. Store bond amount
5. Emit `EmergencyUnlockRequested(lockId, recipient, amount, bond, unlockableAt)`

### 5.5 Challenge

```solidity
/// @notice Challenge a pending unlock
/// @param lockId Lock being unlocked
/// @param fraudProof Proof of fraud (depends on fraud type)
function challenge(
    bytes32 lockId,
    bytes calldata fraudProof
) external payable;
```

**Flow:**
1. Validate UnlockRequest exists and is within challenge period
2. Validate challenge bond (if required)
3. Update status to CHALLENGED
4. Emit `ChallengeFiled(lockId, challenger, fraudType)`
5. (Phase 1) Escalate to Security Council for resolution
6. (Phase 2) Verify with ZK Validity Proof

### 5.6 Resolve Challenge

```solidity
/// @notice Resolve a challenge (Security Council in Phase 1)
/// @param lockId Challenged lock
/// @param challengeValid Whether the challenge is valid
function resolveChallenge(
    bytes32 lockId,
    bool challengeValid
) external onlySecurityCouncil;
```

**Flow:**
1. If `challengeValid`:
   - Cancel unlock
   - Slash involved provers (Quadratic: N² × 10%)
   - Reward challenger
2. If not valid:
   - Resume unlock
   - Slash challenger's bond

---

## 6. SPHINCS+ Signature Verification

### 6.1 On-Chain Verification Approach

SPHINCS+-128s signatures are ~8KB each. Full on-chain verification is expensive (~2-3M gas per signature). 

**Phase 1 Strategy:** Optimized hash-based verification

```solidity
/// @notice Verify SPHINCS+ signature
/// @dev Uses SHA3-256 for hash operations (FIPS 202 compliant)
/// @param pubKeyHash Hash of SPHINCS+ public key
/// @param message Message that was signed
/// @param signature SPHINCS+ signature (~8KB)
/// @return valid Whether signature is valid
function verifySPHINCSSignature(
    bytes32 pubKeyHash,
    bytes32 message,
    bytes calldata signature
) internal view returns (bool valid);
```

**Gas Optimization:**
- Precomputed public key hashes stored on-chain
- Signature structure validation before full verification
- Early exit on invalid format

### 6.2 Threshold Verification

```solidity
/// @notice Verify 2-of-5 SPHINCS+ threshold signatures
function verifyThresholdSignatures(
    bytes32 message,
    bytes[] calldata signatures,
    address[] calldata signers
) internal view returns (bool) {
    require(signatures.length >= REQUIRED_SIGNATURES, "Insufficient signatures");
    require(signatures.length == signers.length, "Length mismatch");
    
    uint256 validCount = 0;
    for (uint i = 0; i < signatures.length; i++) {
        if (verifySPHINCSSignature(
            provers[signers[i]].sphincsPubKeyHash,
            message,
            signatures[i]
        )) {
            validCount++;
        }
    }
    
    return validCount >= REQUIRED_SIGNATURES;
}
```

---

## 7. SMT Verification

### 7.1 Sparse Merkle Tree Proof

```solidity
/// @notice Verify SMT inclusion proof
/// @param leaf Leaf value (lock data hash)
/// @param proof Merkle proof path
/// @param root Expected root
/// @return valid Whether proof is valid
function verifySMTProof(
    bytes32 leaf,
    bytes32[] calldata proof,
    bytes32 root
) internal pure returns (bool valid) {
    bytes32 computedRoot = leaf;
    for (uint i = 0; i < proof.length; i++) {
        if (computedRoot < proof[i]) {
            computedRoot = keccak256(abi.encodePacked(computedRoot, proof[i]));
        } else {
            computedRoot = keccak256(abi.encodePacked(proof[i], computedRoot));
        }
    }
    return computedRoot == root;
}
```

---

## 8. Slashing Mechanism

### 8.1 Quadratic Slashing

```solidity
/// @notice Calculate slash amount using quadratic formula
/// @param numColluding Number of colluding provers
/// @param totalStake Total stake of colluding provers
/// @return slashAmount Amount to slash
function calculateSlash(
    uint256 numColluding,
    uint256 totalStake
) internal pure returns (uint256 slashAmount) {
    // Quadratic: N² × 10%
    // 1 prover = 10%, 2 provers = 40%, 3 provers = 90%
    uint256 slashPercent = numColluding * numColluding * 10;
    if (slashPercent > 100) slashPercent = 100;
    return totalStake * slashPercent / 100;
}
```

### 8.2 Slash Distribution

| Recipient | Percentage |
|-----------|------------|
| Insurance Fund | 50% |
| Challenger | 30% |
| Burn | 20% |

---

## 9. Security Considerations

### 9.1 Access Control

| Function | Access |
|----------|--------|
| lock | Public |
| requestUnlock | Public |
| executeUnlock | Public |
| requestEmergencyUnlock | Public |
| challenge | Public |
| resolveChallenge | Security Council (5/6) |
| registerProver | Owner (Phase 1) / Auto (Phase 2) |
| pause | Security Council (5/9) |
| upgradeContract | Security Council (7/9) + 48h timelock |

### 9.2 Reentrancy Protection

All ETH transfers use checks-effects-interactions pattern with `ReentrancyGuard`.

### 9.3 Integer Overflow

Solidity 0.8+ built-in overflow checks. Additional SafeMath for critical calculations.

### 9.4 Front-Running Mitigation

- Lock ID includes block.timestamp and nonce
- Unlock request commits to specific state root
- Challenge window prevents immediate execution

---

## 10. Events

```solidity
event Locked(
    bytes32 indexed lockId,
    address indexed sender,
    address indexed recipient,
    uint256 amount,
    bytes32 dilithiumPubKeyHash
);

event UnlockRequested(
    bytes32 indexed lockId,
    address indexed recipient,
    uint256 amount,
    uint256 unlockableAt
);

event UnlockExecuted(
    bytes32 indexed lockId,
    address indexed recipient,
    uint256 amount
);

event EmergencyUnlockRequested(
    bytes32 indexed lockId,
    address indexed recipient,
    uint256 amount,
    uint256 bond,
    uint256 unlockableAt
);

event ChallengeFiled(
    bytes32 indexed lockId,
    address indexed challenger,
    bytes32 fraudProofHash
);

event ChallengeResolved(
    bytes32 indexed lockId,
    bool challengeValid,
    uint256 slashedAmount
);

event ProverSlashed(
    address indexed prover,
    uint256 amount,
    bytes32 reason
);

event StateRootUpdated(
    bytes32 indexed newRoot,
    uint256 indexed blockNumber
);
```

---

## 11. Gas Estimates

| Operation | Estimated Gas | USD @ 20 gwei |
|-----------|---------------|---------------|
| lock | 135,000 | ~$7 |
| requestUnlock | 490,000 | ~$27 |
| executeUnlock | 50,000 | ~$3 |
| requestEmergencyUnlock | 80,000 | ~$4 |
| challenge | 100,000 | ~$5 |
| resolveChallenge | 150,000 | ~$8 |

---

## 12. Contract Interfaces

### 12.1 IL1Vault

```solidity
interface IL1Vault {
    function lock(address recipient, bytes calldata dilithiumPubKey) 
        external payable returns (bytes32 lockId);
    
    function requestUnlock(
        bytes32 lockId,
        address recipient,
        bytes32[] calldata smtProof,
        bytes32 stateRoot,
        bytes calldata dilithiumSignature,
        bytes[] calldata sphincsSignatures,
        address[] calldata signingProvers
    ) external;
    
    function executeUnlock(bytes32 lockId) external;
    
    function requestEmergencyUnlock(bytes32 lockId, address recipient) 
        external payable;
    
    function challenge(bytes32 lockId, bytes calldata fraudProof) 
        external payable;
    
    function getLock(bytes32 lockId) external view returns (Lock memory);
    
    function getUnlockRequest(bytes32 lockId) 
        external view returns (UnlockRequest memory);
}
```

### 12.2 ISPHINCSVerifier

```solidity
interface ISPHINCSVerifier {
    function verify(
        bytes32 pubKeyHash,
        bytes32 message,
        bytes calldata signature
    ) external view returns (bool);
}
```

---

## 13. Upgrade Path

### 13.1 Phase 1 → Phase 2

1. Deploy ZK Verifier contract
2. Add `zkVerifier` address to L1Vault
3. Update `resolveChallenge` to use ZK proof instead of Council vote
4. Migrate prover stakes from ETH to $QS

### 13.2 Proxy Pattern

Use TransparentUpgradeableProxy for safe upgrades:

```
┌───────────────────┐     ┌───────────────────┐
│  Proxy Contract   │────▶│  Implementation   │
│  (Storage)        │     │  (Logic)          │
└───────────────────┘     └───────────────────┘
         │
         ▼
┌───────────────────┐
│  ProxyAdmin       │
│  (48h Timelock)   │
└───────────────────┘
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

| Category | Tests |
|----------|-------|
| Lock | lock success, min amount, TVL cap, duplicate prevention |
| Unlock | normal flow, time lock, signature verification, SMT proof |
| Emergency | bond calculation, 7-day lock, challenge period |
| Challenge | valid challenge, invalid challenge, slashing |
| Prover | registration, threshold, slashing |

### 14.2 Integration Tests

- Full lock → unlock flow
- Emergency unlock with challenge
- Multi-prover signature aggregation
- State root synchronization

### 14.3 Fuzzing

- Random lock amounts
- Random signature combinations
- SMT proof edge cases

---

## 15. Dependencies

| Dependency | Purpose |
|------------|---------|
| OpenZeppelin Contracts | Access control, ReentrancyGuard, Pausable |
| Foundry | Testing framework |
| SPHINCS+ Library | Signature verification (custom or adapted) |

---

## 16. Next Steps

1. **1.1.2**: Implement L1Vault.sol based on this design
2. **1.1.3**: Implement SPHINCSVerifier.sol
3. **1.1.4**: Implement SMT verification module
4. **1.1.5**: Implement Time Lock mechanism
5. **1.1.6**: Implement Emergency Path
6. **1.1.7**: Implement Challenge/Slashing

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-22 | Engineer | Initial design |

---

**END OF DOCUMENT**
