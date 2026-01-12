//! State management for L3 Aegis Chain
//!
//! Implements state transitions per L3_CHAIN_SPECIFICATION.md §5

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use aegis_types::{Hash256, Transaction};
use aegis_types::transaction::{Address, UnlockStatus, DilithiumPublicKey, UnlockRequestTx, VRFResultTx, ProverSignatureTx, L1SubmitTx};

/// State management errors
#[derive(Error, Debug)]
pub enum StateError {
    #[error("Lock not found: {0}")]
    LockNotFound(String),
    
    #[error("Unlock not found: {0}")]
    UnlockNotFound(String),
    
    #[error("Invalid state transition: {0}")]
    InvalidTransition(String),
    
    #[error("Duplicate entry: {0}")]
    DuplicateEntry(String),
    
    #[error("Serialization error: {0}")]
    Serialization(String),
}

pub type StateResult<T> = Result<T, StateError>;

/// Lock state as per L3_CHAIN_SPECIFICATION.md §5.3
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LockState {
    pub lock_id: Hash256,
    pub amount: u128,
    pub owner_pk: DilithiumPublicKey,
    pub status: LockStatus,
    pub created_at: u64,
}

/// Lock status
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum LockStatus {
    Active,
    UnlockRequested,
    Unlocked,
}

/// Unlock state as per L3_CHAIN_SPECIFICATION.md §5.3
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UnlockState {
    pub unlock_id: Hash256,
    pub lock_id: Hash256,
    pub dest_addr: Address,
    pub amount: u128,
    pub selected_provers: Vec<Hash256>,
    pub prover_signatures: Vec<ProverSigRecord>,
    pub status: UnlockStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Prover signature record
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProverSigRecord {
    pub prover_id: Hash256,
    pub signature: Vec<u8>,
    pub timestamp: u64,
}

/// Global state manager
#[derive(Clone, Debug, Default)]
pub struct StateManager {
    locks: HashMap<Hash256, LockState>,
    unlocks: HashMap<Hash256, UnlockState>,
    state_root: Hash256,
    current_height: u64,
}

impl StateManager {
    pub fn new() -> Self { Self::default() }
    pub fn state_root(&self) -> Hash256 { self.state_root }
    pub fn current_height(&self) -> u64 { self.current_height }
    pub fn set_height(&mut self, height: u64) { self.current_height = height; }

    pub fn apply_transaction(&mut self, tx: &Transaction) -> StateResult<()> {
        match tx {
            Transaction::UnlockRequest(t) => self.process_unlock_request(t),
            Transaction::VRFResult(t) => self.process_vrf_result(t),
            Transaction::ProverSignature(t) => self.process_prover_signature(t),
            Transaction::L1Submit(t) => self.process_l1_submit(t),
        }?;
        self.recompute_state_root();
        Ok(())
    }

    fn process_unlock_request(&mut self, tx: &UnlockRequestTx) -> StateResult<()> {
        if self.unlocks.contains_key(&tx.unlock_id) {
            return Err(StateError::DuplicateEntry(format!("Unlock {} exists", tx.unlock_id)));
        }
        self.unlocks.insert(tx.unlock_id, UnlockState {
            unlock_id: tx.unlock_id, lock_id: tx.lock_id, dest_addr: tx.dest_addr,
            amount: tx.amount, selected_provers: vec![], prover_signatures: vec![],
            status: UnlockStatus::Pending, created_at: self.current_height, updated_at: self.current_height,
        });
        Ok(())
    }

    fn process_vrf_result(&mut self, tx: &VRFResultTx) -> StateResult<()> {
        let unlock = self.unlocks.get_mut(&tx.unlock_id)
            .ok_or_else(|| StateError::UnlockNotFound(tx.unlock_id.to_string()))?;
        if unlock.status != UnlockStatus::Pending {
            return Err(StateError::InvalidTransition(format!("Cannot assign provers in {:?}", unlock.status)));
        }
        unlock.selected_provers = tx.selected_provers.clone();
        unlock.status = UnlockStatus::ProversAssigned;
        unlock.updated_at = self.current_height;
        Ok(())
    }

    fn process_prover_signature(&mut self, tx: &ProverSignatureTx) -> StateResult<()> {
        let unlock = self.unlocks.get_mut(&tx.unlock_id)
            .ok_or_else(|| StateError::UnlockNotFound(tx.unlock_id.to_string()))?;
        if unlock.status != UnlockStatus::ProversAssigned {
            return Err(StateError::InvalidTransition(format!("Cannot add sig in {:?}", unlock.status)));
        }
        unlock.prover_signatures.push(ProverSigRecord {
            prover_id: tx.prover_id, signature: tx.signature.0.clone(), timestamp: tx.timestamp,
        });
        unlock.updated_at = self.current_height;
        let required = (unlock.selected_provers.len() * 2 + 4) / 5;
        if unlock.prover_signatures.len() >= required {
            unlock.status = UnlockStatus::SignaturesCollected;
        }
        Ok(())
    }

    fn process_l1_submit(&mut self, tx: &L1SubmitTx) -> StateResult<()> {
        let unlock = self.unlocks.get_mut(&tx.unlock_id)
            .ok_or_else(|| StateError::UnlockNotFound(tx.unlock_id.to_string()))?;
        if unlock.status != UnlockStatus::SignaturesCollected {
            return Err(StateError::InvalidTransition(format!("Cannot submit L1 in {:?}", unlock.status)));
        }
        unlock.status = UnlockStatus::SubmittedToL1;
        unlock.updated_at = self.current_height;
        Ok(())
    }

    fn recompute_state_root(&mut self) {
        let mut data = Vec::new();
        let mut ids: Vec<_> = self.unlocks.keys().cloned().collect();
        ids.sort_by(|a, b| a.as_bytes().cmp(b.as_bytes()));
        for id in ids {
            if let Some(u) = self.unlocks.get(&id) {
                data.extend_from_slice(id.as_bytes());
                data.push(match u.status {
                    UnlockStatus::Pending => 0, UnlockStatus::ProversAssigned => 1,
                    UnlockStatus::SignaturesCollected => 2, UnlockStatus::SubmittedToL1 => 3,
                    UnlockStatus::Completed => 4, UnlockStatus::Failed => 5,
                });
            }
        }
        self.state_root = if data.is_empty() { Hash256::zero() } else { Hash256::hash(&data) };
    }

    pub fn get_lock(&self, id: &Hash256) -> Option<&LockState> { self.locks.get(id) }
    pub fn get_unlock(&self, id: &Hash256) -> Option<&UnlockState> { self.unlocks.get(id) }
    pub fn unlock_count(&self) -> usize { self.unlocks.len() }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_manager() {
        let mut state = StateManager::new();
        assert!(state.state_root().is_zero());
        let tx = Transaction::UnlockRequest(UnlockRequestTx {
            unlock_id: Hash256::hash(b"u1"), lock_id: Hash256::hash(b"l1"),
            dest_addr: Address::zero(), amount: 1000,
            owner_pk: DilithiumPublicKey(vec![1,2,3]), owner_signature: vec![4,5,6], timestamp: 123,
        });
        state.apply_transaction(&tx).unwrap();
        assert_eq!(state.unlock_count(), 1);
    }
}
