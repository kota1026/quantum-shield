//! # E2E Integration Tests (SEQ-008)
//!
//! End-to-end integration tests for the sequencer system.
//!
//! ## Test Scenarios
//!
//! 1. Full transaction lifecycle: mempool → batch → L1 submission
//! 2. Multi-sequencer coordination with rotation
//! 3. View change handling
//! 4. Stake verification and slashing
//!
//! ## Reference
//!
//! - CURRENT_PLAN.md SEQ-008
//! - L3_CHAIN_SPECIFICATION.md

use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

use crate::batch_builder::{BatchBuilder, BatchBuilderConfig};
use crate::l1_submitter::{L1Submitter, L1SubmitterConfig, SubmissionStatus};
use crate::mempool::MempoolManager;
use crate::multi_sequencer::{MultiSequencerCoordinator, MultiSequencerConfig, ConflictStrategy};
use crate::rotation::{RotationManager, RotationConfig, NodeInfo};
use crate::staking::{StakingManager, StakingConfig, MockStakingProvider, MIN_STAKE_ETH, StakeCurrency};
use crate::types::{PendingTx, TxHash, TxType, TxPriority, BatchHash};

/// Helper to create test transaction
fn create_test_tx(nonce: u64, gas_price: u128) -> PendingTx {
    let data = format!("tx_data_{}", nonce);
    PendingTx {
        hash: TxHash::hash(data.as_bytes()),
        tx_type: TxType::BridgeLock,
        sender: [1u8; 32],
        nonce,
        gas_price,
        gas_limit: 21000,
        data: data.into_bytes(),
        signature: vec![0u8; 64],
        priority: TxPriority::Normal,
        received_at: chrono::Utc::now().timestamp() as u64,
    }
}

/// Helper to create test nodes
fn create_test_nodes(count: usize) -> Vec<NodeInfo> {
    (0..count).map(|i| {
        let mut id = [0u8; 32];
        id[0] = i as u8;
        NodeInfo {
            id,
            index: i,
            active: true,
            last_block: 0,
            total_blocks: 0,
        }
    }).collect()
}

#[cfg(test)]
mod e2e_tests {
    use super::*;

    /// E2E Test 1: Full transaction lifecycle
    /// 
    /// Flow: Transaction → Mempool → BatchBuilder → Batch → L1Submitter
    #[tokio::test]
    async fn test_full_transaction_lifecycle() {
        // Setup components
        let mempool = Arc::new(MempoolManager::new(1000, 1_000_000_000)); // 1000 capacity, 1 gwei min
        let batch_config = BatchBuilderConfig::default();
        let batch_builder = BatchBuilder::new(batch_config, [1u8; 32]);
        let l1_config = L1SubmitterConfig {
            dry_run: true,
            ..Default::default()
        };
        let l1_submitter = L1Submitter::new(l1_config, [1u8; 32]);

        // Step 1: Add transactions to mempool
        for i in 0..10 {
            let tx = create_test_tx(i, 2_000_000_000 + i as u128); // Above min gas price
            mempool.add_tx(tx).await.unwrap();
        }
        assert_eq!(mempool.size().await, 10);

        // Step 2: Get transactions from mempool and enqueue to batch builder
        let pending_txs = mempool.get_batch_txs(10, 1_000_000).await.unwrap();
        for tx in pending_txs {
            batch_builder.enqueue_tx(tx).await.unwrap();
        }
        
        // Step 3: Build batch
        let parent_hash = BatchHash::from_bytes([0u8; 32]);
        let batch = batch_builder.build_batch(1, parent_hash).await.unwrap();
        
        assert_eq!(batch.number, 1);
        assert!(batch.transactions.len() > 0);
        assert_eq!(batch.sequencer, [1u8; 32]);

        // Step 4: Submit batch to L1
        let prev_state = [0u8; 32];
        let submission = l1_submitter.submit_batch(&batch, prev_state).await.unwrap();
        
        assert_eq!(submission.batch_number, 1);
        assert_eq!(submission.status, SubmissionStatus::Confirmed);

        // Verify state root was calculated
        assert_ne!(submission.state_root, [0u8; 32]);
    }

    /// E2E Test 2: Multi-sequencer coordination with rotation
    #[tokio::test]
    async fn test_multi_sequencer_coordination() {
        // Setup 4-node sequencer network
        let nodes = create_test_nodes(4);
        let local_id = nodes[0].id;

        // Initialize rotation manager
        let rotation_config = RotationConfig::default();
        let rotation = Arc::new(RotationManager::new(rotation_config, local_id));
        rotation.initialize(nodes.clone()).await.unwrap();

        // Initialize multi-sequencer coordinator
        let multi_config = MultiSequencerConfig {
            conflict_strategy: ConflictStrategy::HighestStake,
            stake_weighted: true,
            ..Default::default()
        };
        let coordinator = MultiSequencerCoordinator::new(multi_config, local_id);

        // Register sequencers with different stakes
        for (i, node) in nodes.iter().enumerate() {
            let stake = MIN_STAKE_ETH + (i as u128 * 100_000 * 10u128.pow(18));
            if node.id == local_id {
                coordinator.register_local(stake).await.unwrap();
            } else {
                coordinator.register_sequencer(node.id, stake).await.unwrap();
            }
        }

        assert_eq!(coordinator.sequencer_count().await, 4);
        assert_eq!(coordinator.active_sequencer_count().await, 4);

        // Verify rotation
        assert!(rotation.is_leader().await); // Node 0 is initial leader
        
        let new_leader = rotation.rotate(1).await.unwrap();
        assert_eq!(new_leader, nodes[1].id);
        assert!(!rotation.is_leader().await);

        // Continue rotation
        let _ = rotation.rotate(2).await.unwrap();
        let _ = rotation.rotate(3).await.unwrap();
        let leader_after_wrap = rotation.rotate(4).await.unwrap();
        assert_eq!(leader_after_wrap, nodes[0].id); // Wrapped around
    }

    /// E2E Test 3: Batch building with gas limits
    #[tokio::test]
    async fn test_batch_building_gas_limits() {
        let config = BatchBuilderConfig {
            max_txs_per_batch: 100,
            max_gas_per_batch: 1_000_000, // Limited gas
            batch_timeout_ms: 5000,
            min_txs_for_batch: 1,
            strict_fifo: true,
        };
        let batch_builder = BatchBuilder::new(config, [1u8; 32]);

        // Create transactions that exceed gas limit
        for i in 0..100 {
            let mut tx = create_test_tx(i, 2_000_000_000);
            tx.gas_limit = 50_000; // Each tx uses 50k gas
            batch_builder.enqueue_tx(tx).await.unwrap();
        }

        // Build batch - should be limited by gas
        let parent_hash = BatchHash::from_bytes([0u8; 32]);
        let batch = batch_builder.build_batch(1, parent_hash).await.unwrap();

        // Should have at most 20 transactions (1M / 50k = 20)
        assert!(batch.transactions.len() <= 20);
        assert!(batch.gas_used <= 1_000_000);
    }

    /// E2E Test 4: Staking verification
    #[tokio::test]
    async fn test_staking_verification_lifecycle() {
        let provider = Arc::new(MockStakingProvider::new());
        let sequencer_id = [1u8; 32];
        
        let config = StakingConfig::default();
        let manager = StakingManager::with_provider(config, sequencer_id, provider.clone());

        // Initially no stake - should not be eligible
        assert!(!manager.has_sufficient_stake().await.unwrap());

        // Add insufficient stake
        provider.add_stake(sequencer_id, MIN_STAKE_ETH / 2, StakeCurrency::ETH).await;
        assert!(!manager.has_sufficient_stake().await.unwrap());

        // Remove and add sufficient stake
        provider.remove_stake(sequencer_id).await;
        provider.add_stake(sequencer_id, MIN_STAKE_ETH, StakeCurrency::ETH).await;
        assert!(manager.has_sufficient_stake().await.unwrap());

        // Verify stake info
        let info = manager.get_stake_info().await.unwrap().unwrap();
        assert_eq!(info.amount, MIN_STAKE_ETH);
        assert_eq!(info.currency, StakeCurrency::ETH);
    }

    /// E2E Test 5: Quadratic slashing calculation
    #[tokio::test]
    async fn test_quadratic_slashing() {
        let config = StakingConfig::default();
        let manager = StakingManager::new(config, [1u8; 32]);
        
        let stake = 1_000_000 * 10u128.pow(18); // 1M tokens

        // Progressive slashing
        let slash1 = manager.calculate_slash_amount(stake, 1); // 1² × 10% = 10%
        let slash2 = manager.calculate_slash_amount(stake, 2); // 2² × 10% = 40%
        let slash3 = manager.calculate_slash_amount(stake, 3); // 3² × 10% = 90%
        let slash4 = manager.calculate_slash_amount(stake, 4); // 4² × 10% = 160% → 100%

        assert_eq!(slash1, stake / 10);
        assert_eq!(slash2, stake * 4 / 10);
        assert_eq!(slash3, stake * 9 / 10);
        assert_eq!(slash4, stake); // Capped at 100%
    }

    /// E2E Test 6: Consensus and voting
    #[tokio::test]
    async fn test_consensus_voting() {
        let config = MultiSequencerConfig {
            stake_weighted: false, // Simple majority for testing
            ..Default::default()
        };
        let local_id = [1u8; 32];
        let coordinator = MultiSequencerCoordinator::new(config, local_id);

        // Register 4 sequencers (quorum = 3)
        for i in 1..=4 {
            let mut id = [0u8; 32];
            id[0] = i;
            if i == 1 {
                coordinator.register_local(1000).await.unwrap();
            } else {
                coordinator.register_sequencer(id, 1000).await.unwrap();
            }
        }

        // Create batch and proposal
        let batch_builder = BatchBuilder::new(Default::default(), local_id);
        for i in 0..5 {
            let tx = create_test_tx(i, 2_000_000_000);
            batch_builder.enqueue_tx(tx).await.unwrap();
        }
        let parent_hash = BatchHash::from_bytes([0u8; 32]);
        let batch = batch_builder.build_batch(1, parent_hash).await.unwrap();
        let proposal = coordinator.create_proposal(batch).await.unwrap();

        // Not enough votes yet
        assert!(!coordinator.check_consensus(proposal.id).await.unwrap());

        // Add votes from other sequencers
        for i in 2..=4 {
            let mut voter = [0u8; 32];
            voter[0] = i;
            
            let vote = crate::multi_sequencer::ProposalVote {
                voter,
                proposal_id: proposal.id,
                accept: true,
                stake: 1000,
                timestamp: chrono::Utc::now().timestamp() as u64,
                signature: vec![],
            };
            coordinator.receive_vote(vote).await.unwrap();
        }

        // Should have consensus now (3 votes = quorum)
        assert!(coordinator.check_consensus(proposal.id).await.unwrap());
    }

    /// E2E Test 7: View change on timeout
    #[tokio::test]
    async fn test_view_change_on_timeout() {
        let config = RotationConfig {
            view_change_timeout_secs: 0, // Immediate timeout for testing
            ..Default::default()
        };
        let local_id = [0u8; 32];
        let rotation = RotationManager::new(config, local_id);

        let nodes = create_test_nodes(4);
        rotation.initialize(nodes.clone()).await.unwrap();

        // Initial state
        let state = rotation.get_state().await;
        assert_eq!(state.view, 0);
        assert_eq!(state.leader_id, nodes[0].id);

        // Wait for timeout
        sleep(Duration::from_millis(100)).await;
        assert!(rotation.should_view_change().await);

        // Initiate view change
        let msg = rotation.initiate_view_change().await.unwrap();
        assert_eq!(msg.new_view, 1);

        // Process view change messages (simulate quorum)
        for i in 0..3 {
            let mut sender = [0u8; 32];
            sender[0] = i as u8;
            
            let msg = crate::rotation::ViewChangeMessage {
                new_view: 1,
                sender,
                signature: vec![],
                timestamp: chrono::Utc::now().timestamp() as u64,
            };
            rotation.process_view_change(msg).await.unwrap();
        }

        // Verify view changed
        let state = rotation.get_state().await;
        assert_eq!(state.view, 1);
        assert_eq!(state.leader_id, nodes[1].id); // New leader
    }

    /// E2E Test 8: Conflict resolution with highest stake
    #[tokio::test]
    async fn test_conflict_resolution_highest_stake() {
        let config = MultiSequencerConfig {
            conflict_strategy: ConflictStrategy::HighestStake,
            ..Default::default()
        };
        let coordinator = MultiSequencerCoordinator::new(config, [1u8; 32]);

        // Register sequencers with different stakes
        coordinator.register_local(100).await.unwrap();
        coordinator.register_sequencer([2u8; 32], 200).await.unwrap();
        coordinator.register_sequencer([3u8; 32], 300).await.unwrap();

        // Create batch and proposal from local sequencer
        let batch_builder1 = BatchBuilder::new(Default::default(), [1u8; 32]);
        for i in 0..3 {
            let tx = create_test_tx(i, 2_000_000_000);
            batch_builder1.enqueue_tx(tx).await.unwrap();
        }
        let parent_hash = BatchHash::from_bytes([0u8; 32]);
        let batch1 = batch_builder1.build_batch(1, parent_hash).await.unwrap();
        coordinator.create_proposal(batch1).await.unwrap();

        // Simulate proposal from higher-stake sequencer
        let batch_builder3 = BatchBuilder::new(Default::default(), [3u8; 32]);
        for i in 10..15 {
            let tx = create_test_tx(i, 2_000_000_000);
            batch_builder3.enqueue_tx(tx).await.unwrap();
        }
        let batch3 = batch_builder3.build_batch(1, parent_hash).await.unwrap();
        let proposal3 = crate::multi_sequencer::BatchProposal {
            id: [99u8; 32],
            proposer: [3u8; 32],
            batch: batch3,
            timestamp: chrono::Utc::now().timestamp() as u64,
            signature: vec![],
            votes: vec![],
        };
        coordinator.receive_proposal(proposal3).await.unwrap();

        // Resolve conflict - should pick sequencer 3 (highest stake)
        let winner = coordinator.resolve_conflict(1).await.unwrap().unwrap();
        assert_eq!(winner.proposer, [3u8; 32]);
    }

    /// E2E Test 9: L1 submission with state chain
    #[tokio::test]
    async fn test_l1_state_chain() {
        let l1_config = L1SubmitterConfig {
            dry_run: true,
            ..Default::default()
        };
        let l1_submitter = L1Submitter::new(l1_config, [1u8; 32]);

        // Submit multiple batches and verify state chain
        let mut prev_state = [0u8; 32];
        let mut state_roots = Vec::new();

        for batch_num in 1u64..=5 {
            // Create batch builder for each batch
            let batch_builder = BatchBuilder::new(Default::default(), [1u8; 32]);
            for i in 0..3 {
                let tx = create_test_tx(i + batch_num * 10, 2_000_000_000);
                batch_builder.enqueue_tx(tx).await.unwrap();
            }
            let parent_hash = BatchHash::from_bytes(prev_state);
            let batch = batch_builder.build_batch(batch_num, parent_hash).await.unwrap();
            
            let submission = l1_submitter.submit_batch(&batch, prev_state).await.unwrap();
            
            assert_eq!(submission.batch_number, batch_num);
            assert_eq!(submission.status, SubmissionStatus::Confirmed);
            assert_ne!(submission.state_root, prev_state); // State should change
            
            state_roots.push(submission.state_root);
            prev_state = submission.state_root;
        }

        // Verify all state roots are unique
        for i in 0..state_roots.len() {
            for j in (i + 1)..state_roots.len() {
                assert_ne!(state_roots[i], state_roots[j], "State roots should be unique");
            }
        }
    }

    /// E2E Test 10: Health monitoring
    #[tokio::test]
    async fn test_health_monitoring() {
        let config = MultiSequencerConfig {
            health_check_interval_secs: 1,
            ..Default::default()
        };
        let coordinator = MultiSequencerCoordinator::new(config, [1u8; 32]);

        coordinator.register_local(1000).await.unwrap();
        coordinator.register_sequencer([2u8; 32], 1000).await.unwrap();
        coordinator.register_sequencer([3u8; 32], 1000).await.unwrap();

        assert_eq!(coordinator.active_sequencer_count().await, 3);

        // Simulate stale sequencer - mark as last seen in past
        coordinator.mark_sequencer_stale([2u8; 32]).await;

        // Run health check
        coordinator.run_health_check().await;

        // Verify sequencer marked as unresponsive
        let status = coordinator.get_sequencer_status([2u8; 32]).await;
        assert!(status.is_some());
        assert_eq!(status.unwrap(), crate::multi_sequencer::SequencerStatus::Unresponsive);
    }
}
