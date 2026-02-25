//! Event definitions for L1↔L3 synchronization
//!
//! All events use SHA3-256 for hashing (CP-1 compliant).

use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};

/// Security Parameters (from SEQUENCES.md)
pub mod security {
    /// Normal path time lock: 24 hours
    pub const NORMAL_TIMELOCK_HOURS: u64 = 24;
    pub const NORMAL_TIMELOCK_SECONDS: u64 = NORMAL_TIMELOCK_HOURS * 3600;

    /// Emergency path time lock: 7 days
    pub const EMERGENCY_TIMELOCK_DAYS: u64 = 7;
    pub const EMERGENCY_TIMELOCK_SECONDS: u64 = EMERGENCY_TIMELOCK_DAYS * 24 * 3600;

    /// Emergency timeout: 72 hours (triggers emergency path)
    pub const EMERGENCY_TIMEOUT_HOURS: u64 = 72;
    pub const EMERGENCY_TIMEOUT_SECONDS: u64 = EMERGENCY_TIMEOUT_HOURS * 3600;

    /// Maximum pause duration: 72 hours
    pub const MAX_PAUSE_DURATION_HOURS: u64 = 72;
    pub const MAX_PAUSE_DURATION_SECONDS: u64 = MAX_PAUSE_DURATION_HOURS * 3600;

    /// Defense period: 48 hours
    pub const DEFENSE_PERIOD_HOURS: u64 = 48;
    pub const DEFENSE_PERIOD_SECONDS: u64 = DEFENSE_PERIOD_HOURS * 3600;

    /// Confirmation blocks for reorg protection
    pub const CONFIRMATION_BLOCKS: u64 = 12;

    /// Emergency bond minimum: 0.5 ETH
    pub const EMERGENCY_BOND_MIN_WEI: u128 = 500_000_000_000_000_000; // 0.5 ETH
    /// Emergency bond percentage: 5%
    pub const EMERGENCY_BOND_PERCENTAGE: u64 = 5;

    /// Challenge bond minimum: 0.1 ETH
    pub const CHALLENGE_BOND_MIN_WEI: u128 = 100_000_000_000_000_000; // 0.1 ETH
    /// Challenge bond percentage: 1%
    pub const CHALLENGE_BOND_PERCENTAGE: u64 = 1;

    /// Calculate emergency bond: MAX(0.5 ETH, amount × 5%)
    pub fn calculate_emergency_bond(amount_wei: u128) -> u128 {
        let percentage_bond = amount_wei * EMERGENCY_BOND_PERCENTAGE as u128 / 100;
        std::cmp::max(EMERGENCY_BOND_MIN_WEI, percentage_bond)
    }

    /// Calculate challenge bond: MAX(0.1 ETH, amount × 1%)
    pub fn calculate_challenge_bond(amount_wei: u128) -> u128 {
        let percentage_bond = amount_wei * CHALLENGE_BOND_PERCENTAGE as u128 / 100;
        std::cmp::max(CHALLENGE_BOND_MIN_WEI, percentage_bond)
    }

    /// Quadratic slashing calculation: N² × 10%
    pub fn calculate_quadratic_slashing(stake: u128, concurrent_violations: u64) -> u128 {
        let n_squared = concurrent_violations * concurrent_violations;
        let slashing_percentage = std::cmp::min(n_squared * 10, 100); // Max 100%
        stake * slashing_percentage as u128 / 100
    }
}

/// L1 Locked Event (Sequence #1)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockedEvent {
    /// Unique lock identifier
    pub lock_id: [u8; 32],
    /// Asset owner address
    pub owner: [u8; 20],
    /// Target chain ID
    pub chain_id: u64,
    /// Asset contract address
    pub asset: [u8; 20],
    /// Amount locked
    pub amount: u128,
    /// Destination address (on target chain)
    pub dest_addr: Vec<u8>,
    /// Expiry timestamp (Unix)
    pub expiry: u64,
    /// Nonce for replay protection
    pub nonce: u64,
    /// State Root 0 (initial state)
    pub sr0: [u8; 32],
    /// L1 block number where event occurred
    pub l1_block_number: u64,
    /// L1 transaction hash
    pub l1_tx_hash: [u8; 32],
}

impl LockedEvent {
    /// Compute SR_0 using SHA3-256 (CP-1 compliant)
    pub fn compute_sr0(&self) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        
        // Domain separator
        hasher.update(b"QS_LOCK_V1");
        hasher.update(self.chain_id.to_be_bytes());
        hasher.update(&self.asset);
        hasher.update(self.amount.to_be_bytes());
        hasher.update(&self.dest_addr);
        hasher.update(self.expiry.to_be_bytes());
        hasher.update(self.nonce.to_be_bytes());
        // Note: pk_dilithium would be included here in full implementation
        
        let result = hasher.finalize();
        let mut sr0 = [0u8; 32];
        sr0.copy_from_slice(&result);
        sr0
    }

    /// Validate the SR0 matches computed value
    pub fn validate_sr0(&self) -> bool {
        self.compute_sr0() == self.sr0
    }

    /// Generate unique event ID for idempotency
    pub fn event_id(&self) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(b"EVENT_ID");
        hasher.update(&self.lock_id);
        hasher.update(&self.l1_tx_hash);
        hasher.update(self.l1_block_number.to_be_bytes());
        
        let result = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&result);
        id
    }
}

/// L3 Unlock Ready Event (Sequence #2)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnlockReadyEvent {
    /// Lock ID being unlocked
    pub lock_id: [u8; 32],
    /// State Root 0 (from lock)
    pub sr0: [u8; 32],
    /// State Root 1 (after unlock)
    pub sr1: [u8; 32],
    /// SMT proof
    pub smt_proof: Vec<u8>,
    /// Unlock data
    pub unlock_data: Vec<u8>,
    /// SPHINCS+ signatures (2 of 5 required)
    pub sphincs_signatures: Vec<SphincsSignature>,
    /// L3 block number
    pub l3_block_number: u64,
}

impl UnlockReadyEvent {
    /// Compute SR_1 using SHA3-256 (CP-1 compliant)
    pub fn compute_sr1(&self, dest_addr: &[u8], amount: u128, nonce: u64) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        
        // Domain separator
        hasher.update(b"QS_UNLOCK_V1");
        hasher.update(&self.sr0);
        hasher.update(&self.lock_id);
        hasher.update(dest_addr);
        hasher.update(amount.to_be_bytes());
        hasher.update(nonce.to_be_bytes());
        
        let result = hasher.finalize();
        let mut sr1 = [0u8; 32];
        sr1.copy_from_slice(&result);
        sr1
    }

    /// Generate unique event ID for idempotency
    pub fn event_id(&self) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(b"UNLOCK_EVENT_ID");
        hasher.update(&self.lock_id);
        hasher.update(&self.sr1);
        hasher.update(self.l3_block_number.to_be_bytes());
        
        let result = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&result);
        id
    }
}

/// SPHINCS+ Signature (8KB per signature)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SphincsSignature {
    /// Prover ID
    pub prover_id: [u8; 32],
    /// Signature bytes (~8KB)
    pub signature: Vec<u8>,
    /// Prover public key
    pub public_key: Vec<u8>,
}

/// Emergency Unlock Event (Sequence #3)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmergencyUnlockEvent {
    /// Lock ID
    pub lock_id: [u8; 32],
    /// State Root 0
    pub sr0: [u8; 32],
    /// State Root 1
    pub sr1: [u8; 32],
    /// SMT proof
    pub smt_proof: Vec<u8>,
    /// Unlock data
    pub unlock_data: Vec<u8>,
    /// Bond amount (MAX(0.5 ETH, amount × 5%))
    pub bond_amount: u128,
    /// L1 block number
    pub l1_block_number: u64,
    /// L1 transaction hash
    pub l1_tx_hash: [u8; 32],
}

/// Lock status on L3
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LockStatus {
    /// Locked - waiting for unlock
    Locked,
    /// Pending unlock - in time lock period
    PendingUnlock,
    /// Emergency unlock initiated
    EmergencyPending,
    /// Unlocked - funds released
    Unlocked,
    /// Challenged - under dispute
    Challenged,
    /// Slashed - prover was malicious
    Slashed,
}

/// Event types for queue routing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum BridgeEvent {
    /// L1 → L3: Lock event
    Locked(LockedEvent),
    /// L3 → L1: Unlock ready
    UnlockReady(UnlockReadyEvent),
    /// L1 → L3: Emergency unlock initiated
    EmergencyUnlock(EmergencyUnlockEvent),
    /// Heartbeat for sync verification
    Heartbeat {
        timestamp: u64,
        l1_block: u64,
        l3_block: u64,
    },
}

impl BridgeEvent {
    /// Get event type name
    pub fn event_type(&self) -> &'static str {
        match self {
            BridgeEvent::Locked(_) => "Locked",
            BridgeEvent::UnlockReady(_) => "UnlockReady",
            BridgeEvent::EmergencyUnlock(_) => "EmergencyUnlock",
            BridgeEvent::Heartbeat { .. } => "Heartbeat",
        }
    }

    /// Get unique event ID
    pub fn event_id(&self) -> [u8; 32] {
        match self {
            BridgeEvent::Locked(e) => e.event_id(),
            BridgeEvent::UnlockReady(e) => e.event_id(),
            BridgeEvent::EmergencyUnlock(e) => {
                let mut hasher = Sha3_256::new();
                hasher.update(b"EMERGENCY_EVENT_ID");
                hasher.update(&e.lock_id);
                hasher.update(&e.l1_tx_hash);
                let result = hasher.finalize();
                let mut id = [0u8; 32];
                id.copy_from_slice(&result);
                id
            }
            BridgeEvent::Heartbeat { timestamp, l1_block, l3_block } => {
                let mut hasher = Sha3_256::new();
                hasher.update(b"HEARTBEAT");
                hasher.update(timestamp.to_be_bytes());
                hasher.update(l1_block.to_be_bytes());
                hasher.update(l3_block.to_be_bytes());
                let result = hasher.finalize();
                let mut id = [0u8; 32];
                id.copy_from_slice(&result);
                id
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_emergency_bond_calculation() {
        // Test minimum bond (0.5 ETH)
        let small_amount = 1_000_000_000_000_000_000u128; // 1 ETH
        let bond = security::calculate_emergency_bond(small_amount);
        assert_eq!(bond, security::EMERGENCY_BOND_MIN_WEI); // 0.5 ETH minimum

        // Test percentage bond (5% > 0.5 ETH)
        let large_amount = 100_000_000_000_000_000_000u128; // 100 ETH
        let bond = security::calculate_emergency_bond(large_amount);
        assert_eq!(bond, 5_000_000_000_000_000_000u128); // 5 ETH (5%)
    }

    #[test]
    fn test_challenge_bond_calculation() {
        // Test minimum bond (0.1 ETH)
        let small_amount = 1_000_000_000_000_000_000u128; // 1 ETH
        let bond = security::calculate_challenge_bond(small_amount);
        assert_eq!(bond, security::CHALLENGE_BOND_MIN_WEI); // 0.1 ETH minimum

        // Test percentage bond (1% > 0.1 ETH)
        let large_amount = 100_000_000_000_000_000_000u128; // 100 ETH
        let bond = security::calculate_challenge_bond(large_amount);
        assert_eq!(bond, 1_000_000_000_000_000_000u128); // 1 ETH (1%)
    }

    #[test]
    fn test_quadratic_slashing() {
        let stake = 400_000_000_000_000_000_000_000u128; // $400K

        // 1 violation: 10%
        let slash_1 = security::calculate_quadratic_slashing(stake, 1);
        assert_eq!(slash_1, stake * 10 / 100);

        // 2 violations: 40%
        let slash_2 = security::calculate_quadratic_slashing(stake, 2);
        assert_eq!(slash_2, stake * 40 / 100);

        // 3 violations: 90%
        let slash_3 = security::calculate_quadratic_slashing(stake, 3);
        assert_eq!(slash_3, stake * 90 / 100);

        // 4+ violations: 100% (capped)
        let slash_4 = security::calculate_quadratic_slashing(stake, 4);
        assert_eq!(slash_4, stake); // 100%
    }

    #[test]
    fn test_security_constants() {
        assert_eq!(security::NORMAL_TIMELOCK_SECONDS, 24 * 3600);
        assert_eq!(security::EMERGENCY_TIMELOCK_SECONDS, 7 * 24 * 3600);
        assert_eq!(security::EMERGENCY_TIMEOUT_SECONDS, 72 * 3600);
        assert_eq!(security::MAX_PAUSE_DURATION_SECONDS, 72 * 3600);
        assert_eq!(security::DEFENSE_PERIOD_SECONDS, 48 * 3600);
        assert_eq!(security::CONFIRMATION_BLOCKS, 12);
    }

    #[test]
    fn test_locked_event_sr0() {
        let event = LockedEvent {
            lock_id: [1u8; 32],
            owner: [2u8; 20],
            chain_id: 11155111, // Sepolia
            asset: [3u8; 20],
            amount: 1_000_000_000_000_000_000, // 1 ETH
            dest_addr: vec![4u8; 20],
            expiry: 1704067200,
            nonce: 1,
            sr0: [0u8; 32], // Will be computed
            l1_block_number: 12345678,
            l1_tx_hash: [5u8; 32],
        };

        let computed_sr0 = event.compute_sr0();
        assert_ne!(computed_sr0, [0u8; 32]); // Should be non-zero

        // Event ID should be unique
        let event_id = event.event_id();
        assert_ne!(event_id, [0u8; 32]);
    }
}
