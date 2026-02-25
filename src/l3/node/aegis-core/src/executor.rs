//! Transaction executor for L3 Aegis Chain

use thiserror::Error;
use aegis_types::{Transaction, Block, BlockBody, Hash256};
use crate::state::{StateManager, StateError};

#[derive(Error, Debug)]
pub enum ExecutorError {
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),
    #[error("State error: {0}")]
    State(#[from] StateError),
    #[error("Block validation failed: {0}")]
    BlockValidation(String),
}

pub type ExecutorResult<T> = Result<T, ExecutorError>;

pub struct Executor {
    state: StateManager,
}

impl Executor {
    pub fn new(state: StateManager) -> Self { Self { state } }
    pub fn with_fresh_state() -> Self { Self::new(StateManager::new()) }
    pub fn state(&self) -> &StateManager { &self.state }
    pub fn state_mut(&mut self) -> &mut StateManager { &mut self.state }

    pub fn validate_transaction(&self, tx: &Transaction) -> ExecutorResult<()> {
        match tx {
            Transaction::UnlockRequest(t) => {
                if t.amount == 0 { return Err(ExecutorError::InvalidTransaction("Amount must be > 0".into())); }
                if t.owner_signature.is_empty() { return Err(ExecutorError::InvalidTransaction("Signature required".into())); }
            }
            Transaction::VRFResult(t) => {
                if t.selected_provers.is_empty() { return Err(ExecutorError::InvalidTransaction("Provers required".into())); }
                if t.vrf_proof.is_empty() { return Err(ExecutorError::InvalidTransaction("VRF proof required".into())); }
            }
            Transaction::ProverSignature(t) => {
                if t.signature.0.is_empty() { return Err(ExecutorError::InvalidTransaction("Signature required".into())); }
            }
            Transaction::L1Submit(_) => {}
        }
        Ok(())
    }

    pub fn execute_transaction(&mut self, tx: &Transaction) -> ExecutorResult<()> {
        self.validate_transaction(tx)?;
        self.state.apply_transaction(tx)?;
        Ok(())
    }

    pub fn execute_block(&mut self, block: &Block) -> ExecutorResult<Hash256> {
        self.state.set_height(block.height());
        for tx in &block.body.transactions {
            self.execute_transaction(tx)?;
        }
        Ok(self.state.state_root())
    }

    pub fn compute_tx_root(body: &BlockBody) -> Hash256 { body.compute_tx_root() }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aegis_types::transaction::{UnlockRequestTx, Address, DilithiumPublicKey};

    #[test]
    fn test_executor() {
        let mut exec = Executor::with_fresh_state();
        let tx = Transaction::UnlockRequest(UnlockRequestTx {
            unlock_id: Hash256::hash(b"u1"), lock_id: Hash256::hash(b"l1"),
            dest_addr: Address::zero(), amount: 1000,
            owner_pk: DilithiumPublicKey(vec![1,2,3]), owner_signature: vec![4,5,6], timestamp: 123,
        });
        exec.execute_transaction(&tx).unwrap();
        assert_eq!(exec.state().unlock_count(), 1);
    }
}
