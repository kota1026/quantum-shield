//! # Multi-Sequencer (SEQ-007)
//!
//! Multi-sequencer coordination and competition management.
//!
//! ## Features
//!
//! - Multiple sequencer coordination
//! - Leader election during conflicts
//! - Batch proposal arbitration
//! - Sequencer health monitoring
//!
//! ## Reference
//!
//! - L3_CHAIN_SPECIFICATION.md §9 Extensions
//! - SPEC_STRATEGY_BRIDGE.md §10 IC Traceability

use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

use crate::error::{SequencerError, SequencerResult};
use crate::rotation::RotationManager;
use crate::staking::StakingManager;
use crate::types::Batch;

/// Domain separator for batch proposals (CP-1 compliant)
const DOMAIN_BATCH_PROPOSAL: &[u8] = b"QS_MULTI_SEQ_PROPOSAL_V1";

/// Multi-sequencer configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultiSequencerConfig {
    /// Maximum concurrent proposals
    pub max_concurrent_proposals: usize,
    /// Proposal timeout in milliseconds
    pub proposal_timeout_ms: u64,
    /// Conflict resolution strategy
    pub conflict_strategy: ConflictStrategy,
    /// Enable stake-weighted voting
    pub stake_weighted: bool,
    /// Health check interval in seconds
    pub health_check_interval_secs: u64,
}

impl Default for MultiSequencerConfig {
    fn default() -> Self {
        Self {
            max_concurrent_proposals: 4,
            proposal_timeout_ms: 2000,
            conflict_strategy: ConflictStrategy::HighestStake,
            stake_weighted: true,
            health_check_interval_secs: 5,
        }
    }
}

/// Conflict resolution strategy
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConflictStrategy {
    /// First valid proposal wins
    FirstValid,
    /// Highest stake wins
    HighestStake,
    /// Random selection (VRF-based)
    Random,
    /// Longest transaction list wins
    MostTransactions,
}

/// Sequencer status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SequencerStatus {
    /// Active and healthy
    Active,
    /// Unresponsive
    Unresponsive,
    /// Failed health check
    Unhealthy,
    /// Temporarily suspended
    Suspended,
    /// Removed from network
    Removed,
}

/// Sequencer info for multi-sequencer coordination
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequencerInfo {
    /// Sequencer ID (Dilithium public key hash)
    pub id: [u8; 32],
    /// Current status
    pub status: SequencerStatus,
    /// Stake amount
    pub stake: u128,
    /// Last seen timestamp
    pub last_seen: u64,
    /// Blocks produced
    pub blocks_produced: u64,
    /// Current proposal (if any)
    pub current_proposal: Option<BatchProposal>,
    /// Health score (0-100)
    pub health_score: u8,
}

/// Batch proposal from a sequencer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProposal {
    /// Proposal ID
    pub id: [u8; 32],
    /// Proposer ID
    pub proposer: [u8; 32],
    /// Proposed batch
    pub batch: Batch,
    /// Proposal timestamp
    pub timestamp: u64,
    /// Dilithium signature
    pub signature: Vec<u8>,
    /// Votes received
    pub votes: Vec<ProposalVote>,
}

/// Vote on a batch proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProposalVote {
    /// Voter ID
    pub voter: [u8; 32],
    /// Proposal ID being voted on
    pub proposal_id: [u8; 32],
    /// Accept or reject
    pub accept: bool,
    /// Voter stake (for weighted voting)
    pub stake: u128,
    /// Timestamp
    pub timestamp: u64,
    /// Signature
    pub signature: Vec<u8>,
}

/// Multi-sequencer coordinator
pub struct MultiSequencerCoordinator {
    /// Configuration
    config: MultiSequencerConfig,
    /// Local sequencer ID
    local_id: [u8; 32],
    /// Known sequencers
    sequencers: RwLock<HashMap<[u8; 32], SequencerInfo>>,
    /// Active proposals
    proposals: RwLock<HashMap<[u8; 32], BatchProposal>>,
    /// Rotation manager reference
    rotation: Option<Arc<RotationManager>>,
    /// Staking manager reference
    staking: Option<Arc<StakingManager>>,
    /// Last health check
    last_health_check: RwLock<Instant>,
}

impl MultiSequencerCoordinator {
    /// Create new coordinator
    pub fn new(config: MultiSequencerConfig, local_id: [u8; 32]) -> Self {
        Self {
            config,
            local_id,
            sequencers: RwLock::new(HashMap::new()),
            proposals: RwLock::new(HashMap::new()),
            rotation: None,
            staking: None,
            last_health_check: RwLock::new(Instant::now()),
        }
    }

    /// Set rotation manager
    pub fn set_rotation(&mut self, rotation: Arc<RotationManager>) {
        self.rotation = Some(rotation);
    }

    /// Set staking manager
    pub fn set_staking(&mut self, staking: Arc<StakingManager>) {
        self.staking = Some(staking);
    }

    /// Register local sequencer
    pub async fn register_local(&self, stake: u128) -> SequencerResult<()> {
        let info = SequencerInfo {
            id: self.local_id,
            status: SequencerStatus::Active,
            stake,
            last_seen: chrono::Utc::now().timestamp() as u64,
            blocks_produced: 0,
            current_proposal: None,
            health_score: 100,
        };

        let mut sequencers = self.sequencers.write().await;
        sequencers.insert(self.local_id, info);

        info!("Local sequencer registered: 0x{}", hex::encode(&self.local_id[..8]));
        Ok(())
    }

    /// Register remote sequencer
    pub async fn register_sequencer(&self, id: [u8; 32], stake: u128) -> SequencerResult<()> {
        let info = SequencerInfo {
            id,
            status: SequencerStatus::Active,
            stake,
            last_seen: chrono::Utc::now().timestamp() as u64,
            blocks_produced: 0,
            current_proposal: None,
            health_score: 100,
        };

        let mut sequencers = self.sequencers.write().await;
        sequencers.insert(id, info);

        info!("Sequencer registered: 0x{}", hex::encode(&id[..8]));
        Ok(())
    }

    /// Get sequencer count
    pub async fn sequencer_count(&self) -> usize {
        self.sequencers.read().await.len()
    }

    /// Get active sequencer count
    pub async fn active_sequencer_count(&self) -> usize {
        let sequencers = self.sequencers.read().await;
        sequencers.values()
            .filter(|s| s.status == SequencerStatus::Active)
            .count()
    }

    /// Create batch proposal
    pub async fn create_proposal(&self, batch: Batch) -> SequencerResult<BatchProposal> {
        // Check if we can create more proposals
        let proposals = self.proposals.read().await;
        if proposals.len() >= self.config.max_concurrent_proposals {
            return Err(SequencerError::InternalError(
                "Too many concurrent proposals".to_string()
            ));
        }
        drop(proposals);

        // Generate proposal ID
        let proposal_id = self.generate_proposal_id(&batch);

        let proposal = BatchProposal {
            id: proposal_id,
            proposer: self.local_id,
            batch,
            timestamp: chrono::Utc::now().timestamp() as u64,
            signature: Vec::new(), // To be signed
            votes: Vec::new(),
        };

        // Store proposal
        {
            let mut proposals = self.proposals.write().await;
            proposals.insert(proposal_id, proposal.clone());
        }

        // Update local sequencer state
        {
            let mut sequencers = self.sequencers.write().await;
            if let Some(info) = sequencers.get_mut(&self.local_id) {
                info.current_proposal = Some(proposal.clone());
            }
        }

        info!(
            "Created proposal 0x{} for batch {}",
            hex::encode(&proposal_id[..8]),
            proposal.batch.number
        );

        Ok(proposal)
    }

    /// Generate proposal ID using SHA3-256
    fn generate_proposal_id(&self, batch: &Batch) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(DOMAIN_BATCH_PROPOSAL);
        hasher.update(&self.local_id);
        hasher.update(batch.number.to_be_bytes());
        hasher.update(batch.hash.as_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
        
        let result = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&result);
        id
    }

    /// Receive and process proposal from another sequencer
    pub async fn receive_proposal(&self, proposal: BatchProposal) -> SequencerResult<()> {
        // Validate proposer exists
        {
            let sequencers = self.sequencers.read().await;
            if !sequencers.contains_key(&proposal.proposer) {
                return Err(SequencerError::InternalError(
                    "Unknown proposer".to_string()
                ));
            }
        }

        // Store proposal
        {
            let mut proposals = self.proposals.write().await;
            proposals.insert(proposal.id, proposal.clone());
        }

        debug!(
            "Received proposal 0x{} from 0x{}",
            hex::encode(&proposal.id[..8]),
            hex::encode(&proposal.proposer[..8])
        );

        Ok(())
    }

    /// Vote on a proposal
    pub async fn vote(&self, proposal_id: [u8; 32], accept: bool) -> SequencerResult<ProposalVote> {
        // Get local stake
        let stake = {
            let sequencers = self.sequencers.read().await;
            sequencers.get(&self.local_id)
                .map(|s| s.stake)
                .unwrap_or(0)
        };

        let vote = ProposalVote {
            voter: self.local_id,
            proposal_id,
            accept,
            stake,
            timestamp: chrono::Utc::now().timestamp() as u64,
            signature: Vec::new(), // To be signed
        };

        // Add vote to proposal
        {
            let mut proposals = self.proposals.write().await;
            if let Some(proposal) = proposals.get_mut(&proposal_id) {
                // Check for duplicate votes
                if proposal.votes.iter().any(|v| v.voter == self.local_id) {
                    return Err(SequencerError::InternalError(
                        "Already voted on this proposal".to_string()
                    ));
                }
                proposal.votes.push(vote.clone());
            } else {
                return Err(SequencerError::InternalError(
                    "Proposal not found".to_string()
                ));
            }
        }

        Ok(vote)
    }

    /// Receive vote from another sequencer
    pub async fn receive_vote(&self, vote: ProposalVote) -> SequencerResult<()> {
        let mut proposals = self.proposals.write().await;
        
        if let Some(proposal) = proposals.get_mut(&vote.proposal_id) {
            // Check for duplicate votes
            if proposal.votes.iter().any(|v| v.voter == vote.voter) {
                return Ok(()); // Ignore duplicate
            }
            proposal.votes.push(vote);
        }

        Ok(())
    }

    /// Check if proposal has reached consensus
    pub async fn check_consensus(&self, proposal_id: [u8; 32]) -> SequencerResult<bool> {
        let proposals = self.proposals.read().await;
        let sequencers = self.sequencers.read().await;

        let proposal = proposals.get(&proposal_id)
            .ok_or_else(|| SequencerError::InternalError("Proposal not found".to_string()))?;

        let active_count = sequencers.values()
            .filter(|s| s.status == SequencerStatus::Active)
            .count();

        if active_count == 0 {
            return Ok(false);
        }

        // Calculate quorum (2f+1)
        let f = (active_count.saturating_sub(1)) / 3;
        let quorum = 2 * f + 1;

        if self.config.stake_weighted {
            // Stake-weighted consensus
            let total_stake: u128 = sequencers.values()
                .filter(|s| s.status == SequencerStatus::Active)
                .map(|s| s.stake)
                .sum();

            let accept_stake: u128 = proposal.votes.iter()
                .filter(|v| v.accept)
                .map(|v| v.stake)
                .sum();

            // Need >2/3 of stake to accept
            Ok(accept_stake * 3 > total_stake * 2)
        } else {
            // Simple majority
            let accept_count = proposal.votes.iter()
                .filter(|v| v.accept)
                .count();

            Ok(accept_count >= quorum)
        }
    }

    /// Resolve conflicts between multiple proposals
    pub async fn resolve_conflict(&self, batch_number: u64) -> SequencerResult<Option<BatchProposal>> {
        let proposals = self.proposals.read().await;
        
        let competing: Vec<&BatchProposal> = proposals.values()
            .filter(|p| p.batch.number == batch_number)
            .collect();

        if competing.is_empty() {
            return Ok(None);
        }

        if competing.len() == 1 {
            return Ok(Some(competing[0].clone()));
        }

        // Resolve based on strategy
        let winner = match self.config.conflict_strategy {
            ConflictStrategy::FirstValid => {
                competing.iter()
                    .min_by_key(|p| p.timestamp)
                    .map(|p| (*p).clone())
            }
            ConflictStrategy::HighestStake => {
                let sequencers = self.sequencers.read().await;
                competing.iter()
                    .max_by_key(|p| {
                        sequencers.get(&p.proposer)
                            .map(|s| s.stake)
                            .unwrap_or(0)
                    })
                    .map(|p| (*p).clone())
            }
            ConflictStrategy::MostTransactions => {
                competing.iter()
                    .max_by_key(|p| p.batch.transactions.len())
                    .map(|p| (*p).clone())
            }
            ConflictStrategy::Random => {
                // VRF-based selection would go here
                // For now, use timestamp as pseudo-random
                competing.iter()
                    .min_by_key(|p| {
                        let mut hasher = Sha3_256::new();
                        hasher.update(&p.id);
                        hasher.update(batch_number.to_be_bytes());
                        let result = hasher.finalize();
                        u64::from_be_bytes(result[..8].try_into().unwrap())
                    })
                    .map(|p| (*p).clone())
            }
        };

        if let Some(ref w) = winner {
            info!(
                "Resolved conflict for batch {}: winner 0x{} using {:?}",
                batch_number,
                hex::encode(&w.proposer[..8]),
                self.config.conflict_strategy
            );
        }

        Ok(winner)
    }

    /// Update sequencer health
    pub async fn update_health(&self, sequencer_id: [u8; 32]) {
        let mut sequencers = self.sequencers.write().await;
        
        if let Some(info) = sequencers.get_mut(&sequencer_id) {
            info.last_seen = chrono::Utc::now().timestamp() as u64;
            info.health_score = 100;
        }
    }

    /// Mark a sequencer as stale (for testing health check)
    pub async fn mark_sequencer_stale(&self, sequencer_id: [u8; 32]) {
        let mut sequencers = self.sequencers.write().await;
        
        if let Some(info) = sequencers.get_mut(&sequencer_id) {
            // Set last_seen to 100 seconds in the past
            info.last_seen = chrono::Utc::now().timestamp() as u64 - 100;
        }
    }

    /// Get sequencer status by ID
    pub async fn get_sequencer_status(&self, sequencer_id: [u8; 32]) -> Option<SequencerStatus> {
        self.sequencers.read().await
            .get(&sequencer_id)
            .map(|info| info.status)
    }

    /// Run health check on all sequencers
    pub async fn run_health_check(&self) {
        let now = chrono::Utc::now().timestamp() as u64;
        let timeout = self.config.health_check_interval_secs * 2;

        let mut sequencers = self.sequencers.write().await;
        
        for (id, info) in sequencers.iter_mut() {
            if *id == self.local_id {
                continue; // Skip self
            }

            let age = now.saturating_sub(info.last_seen);
            
            if age > timeout {
                if info.status == SequencerStatus::Active {
                    info.status = SequencerStatus::Unresponsive;
                    warn!(
                        "Sequencer 0x{} marked unresponsive",
                        hex::encode(&id[..8])
                    );
                }
                info.health_score = 0;
            } else {
                // Decay health score based on age
                info.health_score = ((100 - age * 100 / timeout) as u8).max(50);
            }
        }

        // Update last health check time
        {
            let mut last = self.last_health_check.write().await;
            *last = Instant::now();
        }
    }

    /// Get all proposals
    pub async fn get_proposals(&self) -> Vec<BatchProposal> {
        self.proposals.read().await.values().cloned().collect()
    }

    /// Clean up old proposals
    pub async fn cleanup_proposals(&self, max_age_secs: u64) {
        let now = chrono::Utc::now().timestamp() as u64;
        
        let mut proposals = self.proposals.write().await;
        proposals.retain(|_, p| now.saturating_sub(p.timestamp) < max_age_secs);
    }

    /// Get sequencer info
    pub async fn get_sequencer(&self, id: [u8; 32]) -> Option<SequencerInfo> {
        self.sequencers.read().await.get(&id).cloned()
    }

    /// Get all sequencers
    pub async fn get_all_sequencers(&self) -> Vec<SequencerInfo> {
        self.sequencers.read().await.values().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{TxHash, BatchHash};

    fn create_test_batch(number: u64, proposer: [u8; 32]) -> Batch {
        Batch {
            number,
            hash: BatchHash::from_bytes([number as u8; 32]),
            parent_hash: BatchHash::from_bytes([0u8; 32]),
            sequencer: proposer,
            transactions: vec![TxHash::hash(b"tx1")],
            state_root: [0u8; 32],
            timestamp: chrono::Utc::now().timestamp() as u64,
            gas_used: 21000,
            signature: vec![],
        }
    }

    #[tokio::test]
    async fn test_coordinator_creation() {
        let config = MultiSequencerConfig::default();
        let coordinator = MultiSequencerCoordinator::new(config, [1u8; 32]);
        
        assert_eq!(coordinator.sequencer_count().await, 0);
    }

    #[tokio::test]
    async fn test_register_sequencers() {
        let config = MultiSequencerConfig::default();
        let coordinator = MultiSequencerCoordinator::new(config, [1u8; 32]);
        
        coordinator.register_local(1000).await.unwrap();
        assert_eq!(coordinator.sequencer_count().await, 1);
        
        coordinator.register_sequencer([2u8; 32], 2000).await.unwrap();
        assert_eq!(coordinator.sequencer_count().await, 2);
    }

    #[tokio::test]
    async fn test_create_proposal() {
        let config = MultiSequencerConfig::default();
        let local_id = [1u8; 32];
        let coordinator = MultiSequencerCoordinator::new(config, local_id);
        
        coordinator.register_local(1000).await.unwrap();
        
        let batch = create_test_batch(1, local_id);
        let proposal = coordinator.create_proposal(batch).await.unwrap();
        
        assert_eq!(proposal.proposer, local_id);
        assert_eq!(proposal.batch.number, 1);
    }

    #[tokio::test]
    async fn test_voting() {
        let config = MultiSequencerConfig::default();
        let local_id = [1u8; 32];
        let coordinator = MultiSequencerCoordinator::new(config, local_id);
        
        coordinator.register_local(1000).await.unwrap();
        
        let batch = create_test_batch(1, local_id);
        let proposal = coordinator.create_proposal(batch).await.unwrap();
        
        let vote = coordinator.vote(proposal.id, true).await.unwrap();
        assert!(vote.accept);
        assert_eq!(vote.voter, local_id);
    }

    #[tokio::test]
    async fn test_conflict_resolution() {
        let config = MultiSequencerConfig {
            conflict_strategy: ConflictStrategy::HighestStake,
            ..Default::default()
        };
        let local_id = [1u8; 32];
        let coordinator = MultiSequencerCoordinator::new(config, local_id);
        
        // Register sequencers with different stakes
        coordinator.register_local(1000).await.unwrap();
        coordinator.register_sequencer([2u8; 32], 2000).await.unwrap();
        
        // Create competing proposals
        let batch1 = create_test_batch(1, local_id);
        coordinator.create_proposal(batch1).await.unwrap();
        
        let batch2 = create_test_batch(1, [2u8; 32]);
        let proposal2 = BatchProposal {
            id: [99u8; 32],
            proposer: [2u8; 32],
            batch: batch2,
            timestamp: chrono::Utc::now().timestamp() as u64,
            signature: vec![],
            votes: vec![],
        };
        coordinator.receive_proposal(proposal2).await.unwrap();
        
        // Resolve - should pick higher stake
        let winner = coordinator.resolve_conflict(1).await.unwrap().unwrap();
        assert_eq!(winner.proposer, [2u8; 32]); // Higher stake
    }

    #[tokio::test]
    async fn test_consensus() {
        let config = MultiSequencerConfig {
            stake_weighted: false,
            ..Default::default()
        };
        let local_id = [1u8; 32];
        let coordinator = MultiSequencerCoordinator::new(config, local_id);
        
        // Register 4 sequencers
        for i in 1..=4 {
            let mut id = [0u8; 32];
            id[0] = i;
            if i == 1 {
                coordinator.register_local(1000).await.unwrap();
            } else {
                coordinator.register_sequencer(id, 1000).await.unwrap();
            }
        }
        
        let batch = create_test_batch(1, local_id);
        let proposal = coordinator.create_proposal(batch).await.unwrap();
        
        // Not enough votes yet
        assert!(!coordinator.check_consensus(proposal.id).await.unwrap());
        
        // Add 3 votes (quorum for 4 nodes)
        for i in 2..=4 {
            let mut voter = [0u8; 32];
            voter[0] = i;
            let vote = ProposalVote {
                voter,
                proposal_id: proposal.id,
                accept: true,
                stake: 1000,
                timestamp: chrono::Utc::now().timestamp() as u64,
                signature: vec![],
            };
            coordinator.receive_vote(vote).await.unwrap();
        }
        
        // Now should have consensus
        assert!(coordinator.check_consensus(proposal.id).await.unwrap());
    }

    #[tokio::test]
    async fn test_health_check() {
        let config = MultiSequencerConfig {
            health_check_interval_secs: 1,
            ..Default::default()
        };
        let coordinator = MultiSequencerCoordinator::new(config, [1u8; 32]);
        
        coordinator.register_local(1000).await.unwrap();
        coordinator.register_sequencer([2u8; 32], 2000).await.unwrap();
        
        // Mark sequencer as stale using public method
        coordinator.mark_sequencer_stale([2u8; 32]).await;
        
        coordinator.run_health_check().await;
        
        let info = coordinator.get_sequencer([2u8; 32]).await.unwrap();
        assert_eq!(info.status, SequencerStatus::Unresponsive);
    }
}
