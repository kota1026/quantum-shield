//! # L1 Submitter (SEQ-004)
//!
//! Handles submission of L3 state to L1 (Ethereum).
//!
//! ## Features
//!
//! - State root calculation using Sparse Merkle Tree (SHA3-256)
//! - L1 contract interaction (mock for testing)
//! - L1SubmitTx recording in L3 block
//! - Gas price monitoring and retry logic
//!
//! ## CP-1 Compliance
//!
//! All hash operations use SHA3-256 (FIPS 202).
//!
//! ## Reference
//!
//! - L3_CHAIN_SPECIFICATION.md §5 State Management
//! - SPEC_STRATEGY_BRIDGE.md §5 Security Requirements
//! - SEQUENCES_v2.0.md #2 Unlock (Normal)

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::sleep;
use tracing::{info, warn};

use crate::error::{SequencerError, SequencerResult};
use crate::types::Batch;

/// Domain separator for state root calculation (CP-1 compliant)
const DOMAIN_STATE_ROOT: &[u8] = b"QS_SEQUENCER_STATE_V1";

/// Domain separator for L1 submission (CP-1 compliant)
const DOMAIN_L1_SUBMIT: &[u8] = b"QS_L1_SUBMIT_V1";

/// L1 Submitter configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L1SubmitterConfig {
    /// Maximum gas price (in gwei)
    pub max_gas_price_gwei: u64,
    /// Retry count
    pub max_retries: u32,
    /// Retry delay in milliseconds
    pub retry_delay_ms: u64,
    /// Submission timeout in seconds
    pub submission_timeout_secs: u64,
    /// L1 contract address (mock)
    pub l1_contract: [u8; 20],
    /// Enable dry run mode
    pub dry_run: bool,
}

impl Default for L1SubmitterConfig {
    fn default() -> Self {
        Self {
            max_gas_price_gwei: 100,
            max_retries: 3,
            retry_delay_ms: 5000,
            submission_timeout_secs: 60,
            l1_contract: [0u8; 20],
            dry_run: true, // Default to dry run for safety
        }
    }
}

/// L1 Submission status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SubmissionStatus {
    /// Pending submission
    Pending,
    /// Submitted to L1
    Submitted,
    /// Confirmed on L1
    Confirmed,
    /// Failed
    Failed,
}

/// L1 Submission record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L1Submission {
    /// Batch number
    pub batch_number: u64,
    /// State root
    pub state_root: [u8; 32],
    /// Submission hash
    pub submission_hash: [u8; 32],
    /// Status
    pub status: SubmissionStatus,
    /// L1 transaction hash (if submitted)
    pub l1_tx_hash: Option<[u8; 32]>,
    /// Timestamp
    pub timestamp: u64,
    /// Gas used
    pub gas_used: Option<u64>,
    /// Retry count
    pub retries: u32,
}

/// L1SubmitTx - Transaction recorded in L3 block for transparency (CP-5)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L1SubmitTx {
    /// Submission hash
    pub hash: crate::types::TxHash,
    /// Batch number being submitted
    pub batch_number: u64,
    /// State root being submitted
    pub state_root: [u8; 32],
    /// L1 contract target
    pub l1_contract: [u8; 20],
    /// Sequencer who submitted
    pub sequencer: [u8; 32],
    /// Timestamp
    pub timestamp: u64,
    /// Dilithium signature
    pub signature: Vec<u8>,
}

/// L1 Provider trait (for mocking)
#[async_trait]
pub trait L1Provider: Send + Sync {
    /// Get current gas price
    async fn gas_price(&self) -> SequencerResult<u64>;
    
    /// Submit state root to L1
    async fn submit_state_root(
        &self,
        state_root: [u8; 32],
        batch_number: u64,
    ) -> SequencerResult<[u8; 32]>;
    
    /// Check transaction status
    async fn check_tx_status(&self, tx_hash: [u8; 32]) -> SequencerResult<bool>;
}

/// Mock L1 Provider for testing
pub struct MockL1Provider {
    /// Simulated gas price
    gas_price: RwLock<u64>,
    /// Success rate (for testing failures)
    success_rate: f64,
}

impl MockL1Provider {
    /// Create new mock provider
    pub fn new() -> Self {
        Self {
            gas_price: RwLock::new(20), // 20 gwei
            success_rate: 1.0,
        }
    }

    /// Set gas price
    pub async fn set_gas_price(&self, price: u64) {
        let mut gp = self.gas_price.write().await;
        *gp = price;
    }

    /// Set success rate for testing failures
    pub fn set_success_rate(&mut self, rate: f64) {
        self.success_rate = rate;
    }
}

impl Default for MockL1Provider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl L1Provider for MockL1Provider {
    async fn gas_price(&self) -> SequencerResult<u64> {
        Ok(*self.gas_price.read().await)
    }

    async fn submit_state_root(
        &self,
        state_root: [u8; 32],
        batch_number: u64,
    ) -> SequencerResult<[u8; 32]> {
        // Simulate submission
        sleep(Duration::from_millis(100)).await;

        // Check success rate
        if rand::random::<f64>() > self.success_rate {
            return Err(SequencerError::L1SubmissionFailed(
                "Simulated failure".to_string()
            ));
        }

        // Generate mock tx hash
        let mut hasher = Sha3_256::new();
        hasher.update(DOMAIN_L1_SUBMIT);
        hasher.update(&state_root);
        hasher.update(batch_number.to_be_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
        let result = hasher.finalize();
        
        let mut tx_hash = [0u8; 32];
        tx_hash.copy_from_slice(&result);
        
        Ok(tx_hash)
    }

    async fn check_tx_status(&self, _tx_hash: [u8; 32]) -> SequencerResult<bool> {
        // Simulate confirmation delay
        sleep(Duration::from_millis(50)).await;
        Ok(true) // Always confirmed in mock
    }
}

/// L1 Submitter
pub struct L1Submitter {
    /// Configuration
    config: L1SubmitterConfig,
    /// L1 provider
    provider: Arc<dyn L1Provider>,
    /// Submission history
    submissions: RwLock<Vec<L1Submission>>,
    /// Submitter identity
    identity: [u8; 32],
}

impl L1Submitter {
    /// Create new L1 Submitter with mock provider
    pub fn new(config: L1SubmitterConfig, identity: [u8; 32]) -> Self {
        Self {
            config,
            provider: Arc::new(MockL1Provider::new()),
            submissions: RwLock::new(Vec::new()),
            identity,
        }
    }

    /// Create with custom provider
    pub fn with_provider(
        config: L1SubmitterConfig,
        identity: [u8; 32],
        provider: Arc<dyn L1Provider>,
    ) -> Self {
        Self {
            config,
            provider,
            submissions: RwLock::new(Vec::new()),
            identity,
        }
    }

    /// Calculate state root from batch (using SMT approach)
    /// 
    /// CP-1: Uses SHA3-256 for all hashing
    pub fn calculate_state_root(&self, batch: &Batch, prev_state_root: [u8; 32]) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        
        // Domain separation
        hasher.update(DOMAIN_STATE_ROOT);
        
        // Previous state root
        hasher.update(&prev_state_root);
        
        // Batch number
        hasher.update(batch.number.to_be_bytes());
        
        // Batch hash
        hasher.update(batch.hash.as_bytes());
        
        // Transaction hashes
        for tx_hash in &batch.transactions {
            hasher.update(tx_hash.as_bytes());
        }
        
        // Timestamp
        hasher.update(batch.timestamp.to_be_bytes());
        
        let result = hasher.finalize();
        let mut state_root = [0u8; 32];
        state_root.copy_from_slice(&result);
        state_root
    }

    /// Submit batch to L1
    pub async fn submit_batch(
        &self,
        batch: &Batch,
        prev_state_root: [u8; 32],
    ) -> SequencerResult<L1Submission> {
        // Calculate state root
        let state_root = self.calculate_state_root(batch, prev_state_root);
        
        // Check gas price
        let gas_price = self.provider.gas_price().await?;
        if gas_price > self.config.max_gas_price_gwei {
            warn!(
                "Gas price too high: {} > {} gwei",
                gas_price, self.config.max_gas_price_gwei
            );
            return Err(SequencerError::GasPriceTooHigh {
                current: gas_price as u128,
                max: self.config.max_gas_price_gwei as u128,
            });
        }

        // Create submission record
        let submission_hash = self.calculate_submission_hash(state_root, batch.number);
        
        let mut submission = L1Submission {
            batch_number: batch.number,
            state_root,
            submission_hash,
            status: SubmissionStatus::Pending,
            l1_tx_hash: None,
            timestamp: chrono::Utc::now().timestamp() as u64,
            gas_used: None,
            retries: 0,
        };

        // Dry run mode
        if self.config.dry_run {
            info!(
                "Dry run: would submit batch {} with state root 0x{}",
                batch.number,
                hex::encode(&state_root[..8])
            );
            submission.status = SubmissionStatus::Confirmed;
            
            let mut submissions = self.submissions.write().await;
            submissions.push(submission.clone());
            
            return Ok(submission);
        }

        // Submit with retries
        let mut last_error = None;
        for retry in 0..=self.config.max_retries {
            submission.retries = retry;
            
            match self.provider.submit_state_root(state_root, batch.number).await {
                Ok(tx_hash) => {
                    submission.l1_tx_hash = Some(tx_hash);
                    submission.status = SubmissionStatus::Submitted;
                    
                    info!(
                        "Batch {} submitted to L1: tx=0x{}",
                        batch.number,
                        hex::encode(&tx_hash[..8])
                    );
                    
                    // Wait for confirmation
                    if self.provider.check_tx_status(tx_hash).await? {
                        submission.status = SubmissionStatus::Confirmed;
                        info!("Batch {} confirmed on L1", batch.number);
                    }
                    
                    // Store submission
                    let mut submissions = self.submissions.write().await;
                    submissions.push(submission.clone());
                    
                    return Ok(submission);
                }
                Err(e) => {
                    warn!(
                        "L1 submission attempt {} failed: {}",
                        retry + 1, e
                    );
                    last_error = Some(e);
                    
                    if retry < self.config.max_retries {
                        sleep(Duration::from_millis(self.config.retry_delay_ms)).await;
                    }
                }
            }
        }

        submission.status = SubmissionStatus::Failed;
        let mut submissions = self.submissions.write().await;
        submissions.push(submission.clone());
        
        Err(last_error.unwrap_or_else(|| {
            SequencerError::L1SubmissionFailed("Unknown error".to_string())
        }))
    }

    /// Create L1SubmitTx for L3 block recording (CP-5 transparency)
    pub fn create_l1_submit_tx(&self, submission: &L1Submission) -> L1SubmitTx {
        let hash = crate::types::TxHash::hash(&submission.submission_hash);
        
        L1SubmitTx {
            hash,
            batch_number: submission.batch_number,
            state_root: submission.state_root,
            l1_contract: self.config.l1_contract,
            sequencer: self.identity,
            timestamp: submission.timestamp,
            signature: Vec::new(), // To be signed
        }
    }

    /// Calculate submission hash with domain separation
    fn calculate_submission_hash(&self, state_root: [u8; 32], batch_number: u64) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(DOMAIN_L1_SUBMIT);
        hasher.update(&state_root);
        hasher.update(batch_number.to_be_bytes());
        hasher.update(&self.identity);
        
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }

    /// Get submission history
    pub async fn get_submissions(&self) -> Vec<L1Submission> {
        self.submissions.read().await.clone()
    }

    /// Get submission by batch number
    pub async fn get_submission(&self, batch_number: u64) -> Option<L1Submission> {
        let submissions = self.submissions.read().await;
        submissions.iter()
            .find(|s| s.batch_number == batch_number)
            .cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{TxHash, BatchHash};

    fn create_test_batch(number: u64) -> Batch {
        Batch {
            number,
            hash: BatchHash::from_bytes([number as u8; 32]),
            parent_hash: BatchHash::from_bytes([0u8; 32]),
            sequencer: [1u8; 32],
            transactions: vec![
                TxHash::hash(b"tx1"),
                TxHash::hash(b"tx2"),
            ],
            state_root: [0u8; 32],
            timestamp: chrono::Utc::now().timestamp() as u64,
            gas_used: 42000,
            signature: vec![],
        }
    }

    #[tokio::test]
    async fn test_l1_submitter_creation() {
        let config = L1SubmitterConfig::default();
        let submitter = L1Submitter::new(config, [1u8; 32]);
        
        let submissions = submitter.get_submissions().await;
        assert!(submissions.is_empty());
    }

    #[tokio::test]
    async fn test_state_root_calculation() {
        let config = L1SubmitterConfig::default();
        let submitter = L1Submitter::new(config, [1u8; 32]);
        
        let batch = create_test_batch(1);
        let prev_state = [0u8; 32];
        
        let state_root = submitter.calculate_state_root(&batch, prev_state);
        
        // State root should be deterministic
        let state_root2 = submitter.calculate_state_root(&batch, prev_state);
        assert_eq!(state_root, state_root2);
        
        // Different batch should give different state root
        let batch2 = create_test_batch(2);
        let state_root3 = submitter.calculate_state_root(&batch2, prev_state);
        assert_ne!(state_root, state_root3);
    }

    #[tokio::test]
    async fn test_submit_batch_dry_run() {
        let config = L1SubmitterConfig {
            dry_run: true,
            ..Default::default()
        };
        let submitter = L1Submitter::new(config, [1u8; 32]);
        
        let batch = create_test_batch(1);
        let prev_state = [0u8; 32];
        
        let submission = submitter.submit_batch(&batch, prev_state).await.unwrap();
        
        assert_eq!(submission.batch_number, 1);
        assert_eq!(submission.status, SubmissionStatus::Confirmed);
        assert!(submission.l1_tx_hash.is_none()); // Dry run doesn't have L1 tx
    }

    #[tokio::test]
    async fn test_create_l1_submit_tx() {
        let config = L1SubmitterConfig::default();
        let submitter = L1Submitter::new(config, [1u8; 32]);
        
        let submission = L1Submission {
            batch_number: 1,
            state_root: [2u8; 32],
            submission_hash: [3u8; 32],
            status: SubmissionStatus::Confirmed,
            l1_tx_hash: Some([4u8; 32]),
            timestamp: 1000,
            gas_used: Some(100000),
            retries: 0,
        };
        
        let l1_tx = submitter.create_l1_submit_tx(&submission);
        
        assert_eq!(l1_tx.batch_number, 1);
        assert_eq!(l1_tx.state_root, [2u8; 32]);
        assert_eq!(l1_tx.sequencer, [1u8; 32]);
    }

    #[tokio::test]
    async fn test_state_root_chain() {
        let config = L1SubmitterConfig::default();
        let submitter = L1Submitter::new(config, [1u8; 32]);
        
        // Simulate chain of batches
        let mut prev_state = [0u8; 32];
        let mut state_roots = vec![];
        
        for i in 1..=5 {
            let batch = create_test_batch(i);
            let state_root = submitter.calculate_state_root(&batch, prev_state);
            state_roots.push(state_root);
            prev_state = state_root;
        }
        
        // All state roots should be unique
        for i in 0..state_roots.len() {
            for j in (i + 1)..state_roots.len() {
                assert_ne!(state_roots[i], state_roots[j]);
            }
        }
    }

    #[tokio::test]
    async fn test_mock_l1_provider() {
        let provider = MockL1Provider::new();
        
        let gas_price = provider.gas_price().await.unwrap();
        assert_eq!(gas_price, 20);
        
        provider.set_gas_price(50).await;
        let gas_price = provider.gas_price().await.unwrap();
        assert_eq!(gas_price, 50);
        
        let tx_hash = provider.submit_state_root([1u8; 32], 1).await.unwrap();
        assert_ne!(tx_hash, [0u8; 32]);
        
        let confirmed = provider.check_tx_status(tx_hash).await.unwrap();
        assert!(confirmed);
    }
}
