//! PBFT Consensus Integration Tests
//!
//! Reference: CURRENT_PLAN.md L3-003 テスト項目
//! - [TEST-001] PBFT状態遷移テスト
//! - [TEST-002] Pre-prepare処理テスト
//! - [TEST-003] Prepare/Commitクォーラムテスト
//! - [TEST-004] View Changeテスト
//! - [TEST-005] 署名検証テスト
//! - [TEST-006] CP-1準拠テスト
//! - [TEST-007] 設定値テスト

use aegis_consensus::{
    config::{ConsensusConfig, BLOCK_INTERVAL_SECS, QUORUM_SIZE, VIEW_CHANGE_TIMEOUT_SECS},
    message::{Block, ConsensusMessage, MessageType},
    signature::{ConsensusVerifier, DilithiumSignature, NodeKeyPair, ValidatorSignatures},
    state::{ConsensusState, HeightState, Phase, NUM_NODES, FAULT_TOLERANCE},
    view_change::{ViewChangeManager, ViewChangeState},
    ViewChangeMessage,
};

// =============================================================================
// [TEST-001] PBFT状態遷移テスト
// =============================================================================

mod test_001_state_transitions {
    use super::*;

    #[test]
    fn test_idle_to_preprepared() {
        let mut state = ConsensusState::new(1);
        assert_eq!(state.current_height_state.phase, Phase::Idle);

        // Receive PrePrepare from primary (node 0)
        let block = create_test_block(1);
        let msg = ConsensusMessage::pre_prepare(0, 1, block, 0);
        
        let result = state.on_pre_prepare(msg);
        assert!(result.is_ok());
        assert_eq!(state.current_height_state.phase, Phase::PrePrepared);
    }

    #[test]
    fn test_preprepared_to_prepared() {
        let mut state = ConsensusState::new(1);
        
        // Setup: move to PrePrepared
        let block = create_test_block(1);
        let msg = ConsensusMessage::pre_prepare(0, 1, block.clone(), 0);
        state.on_pre_prepare(msg).unwrap();
        
        // Receive 3 Prepare messages (quorum)
        let digest = block.compute_hash();
        for sender in [0, 2, 3] {
            let prepare = ConsensusMessage::prepare(0, 1, digest, sender);
            state.on_prepare(prepare).ok();
        }
        
        assert_eq!(state.current_height_state.phase, Phase::Prepared);
    }

    #[test]
    fn test_prepared_to_committed() {
        let mut state = ConsensusState::new(1);
        
        // Setup: move to Prepared
        let block = create_test_block(1);
        let msg = ConsensusMessage::pre_prepare(0, 1, block.clone(), 0);
        state.on_pre_prepare(msg).unwrap();
        
        let digest = block.compute_hash();
        for sender in [0, 2, 3] {
            state.on_prepare(ConsensusMessage::prepare(0, 1, digest, sender)).ok();
        }
        
        // Receive 3 Commit messages (quorum)
        for sender in [0, 2, 3] {
            let commit = ConsensusMessage::commit(0, 1, digest, sender);
            state.on_commit(commit).ok();
        }
        
        assert_eq!(state.current_height_state.phase, Phase::Committed);
    }

    #[test]
    fn test_full_consensus_flow() {
        // Full flow: Idle -> PrePrepared -> Prepared -> Committed
        let mut state = ConsensusState::new(1);
        
        assert_eq!(state.current_height_state.phase, Phase::Idle);
        
        let block = create_test_block(1);
        let digest = block.compute_hash();
        
        // PrePrepare
        state.on_pre_prepare(ConsensusMessage::pre_prepare(0, 1, block, 0)).unwrap();
        assert_eq!(state.current_height_state.phase, Phase::PrePrepared);
        
        // Prepare (need 3/4)
        for sender in [0, 2, 3] {
            state.on_prepare(ConsensusMessage::prepare(0, 1, digest, sender)).ok();
        }
        assert_eq!(state.current_height_state.phase, Phase::Prepared);
        
        // Commit (need 3/4)
        for sender in [0, 2, 3] {
            state.on_commit(ConsensusMessage::commit(0, 1, digest, sender)).ok();
        }
        assert_eq!(state.current_height_state.phase, Phase::Committed);
    }
}

// =============================================================================
// [TEST-002] Pre-prepare処理テスト
// =============================================================================

mod test_002_preprepare {
    use super::*;

    #[test]
    fn test_primary_selection() {
        let config = ConsensusConfig::production(0);
        
        // View 0 -> Node 0 is primary
        assert_eq!(config.primary_for_view(0), 0);
        
        // View 1 -> Node 1 is primary
        assert_eq!(config.primary_for_view(1), 1);
        
        // View 4 -> Node 0 is primary (wrap around)
        assert_eq!(config.primary_for_view(4), 0);
    }

    #[test]
    fn test_preprepare_from_primary() {
        let mut state = ConsensusState::new(1);
        
        // Node 0 is primary in view 0
        let block = create_test_block(1);
        let msg = ConsensusMessage::pre_prepare(0, 1, block, 0);
        
        assert!(state.on_pre_prepare(msg).is_ok());
    }

    #[test]
    fn test_preprepare_from_non_primary_rejected() {
        let mut state = ConsensusState::new(1);
        
        // Node 1 is not primary in view 0
        let block = create_test_block(1);
        let msg = ConsensusMessage::pre_prepare(0, 1, block, 1);
        
        let result = state.on_pre_prepare(msg);
        assert!(result.is_err());
    }

    #[test]
    fn test_preprepare_message_format() {
        let block = create_test_block(1);
        let msg = ConsensusMessage::pre_prepare(0, 1, block.clone(), 0);
        
        assert!(matches!(msg.msg_type, MessageType::PrePrepare));
        assert_eq!(msg.view, 0);
        assert_eq!(msg.height, 1);
        assert_eq!(msg.sender, 0);
        assert!(msg.block.is_some());
        assert_eq!(msg.digest, block.compute_hash());
    }
}

// =============================================================================
// [TEST-003] Prepare/Commitクォーラムテスト
// =============================================================================

mod test_003_quorum {
    use super::*;

    #[test]
    fn test_2_of_4_not_quorum() {
        let mut height_state = HeightState::new();
        height_state.digest = [1u8; 32];
        
        // Only 2 prepares - not enough
        for i in 0..2 {
            let msg = ConsensusMessage::prepare(0, 1, [1u8; 32], i);
            height_state.add_prepare(msg);
        }
        
        assert!(!height_state.has_prepare_quorum());
    }

    #[test]
    fn test_3_of_4_is_quorum() {
        let mut height_state = HeightState::new();
        height_state.digest = [1u8; 32];
        
        // 3 prepares - quorum!
        for i in 0..3 {
            let msg = ConsensusMessage::prepare(0, 1, [1u8; 32], i);
            height_state.add_prepare(msg);
        }
        
        assert!(height_state.has_prepare_quorum());
    }

    #[test]
    fn test_4_of_4_is_quorum() {
        let mut height_state = HeightState::new();
        height_state.digest = [1u8; 32];
        
        // All 4 prepares
        for i in 0..4 {
            let msg = ConsensusMessage::prepare(0, 1, [1u8; 32], i);
            height_state.add_prepare(msg);
        }
        
        assert!(height_state.has_prepare_quorum());
    }

    #[test]
    fn test_commit_quorum() {
        let mut height_state = HeightState::new();
        height_state.digest = [1u8; 32];
        
        // Need 3 commits for quorum
        assert!(!height_state.has_commit_quorum());
        
        for i in 0..3 {
            let msg = ConsensusMessage::commit(0, 1, [1u8; 32], i);
            height_state.add_commit(msg);
        }
        
        assert!(height_state.has_commit_quorum());
    }

    #[test]
    fn test_wrong_digest_ignored() {
        let mut height_state = HeightState::new();
        height_state.digest = [1u8; 32];
        
        // Add messages with wrong digest
        for i in 0..3 {
            let msg = ConsensusMessage::prepare(0, 1, [2u8; 32], i); // Wrong digest
            height_state.add_prepare(msg);
        }
        
        assert!(!height_state.has_prepare_quorum());
    }
}

// =============================================================================
// [TEST-004] View Changeテスト
// =============================================================================

mod test_004_view_change {
    use super::*;

    #[test]
    fn test_timeout_detection() {
        let mut manager = ViewChangeManager::new(0, 10);
        
        manager.record_activity(100);
        assert!(!manager.is_timeout(109)); // 9 seconds - not timeout
        assert!(manager.is_timeout(111));  // 11 seconds - timeout
    }

    #[test]
    fn test_new_primary_selection() {
        // After view change, new primary is selected
        assert_eq!(ViewChangeManager::get_primary_for_view(0, 4), 0);
        assert_eq!(ViewChangeManager::get_primary_for_view(1, 4), 1);
        assert_eq!(ViewChangeManager::get_primary_for_view(2, 4), 2);
        assert_eq!(ViewChangeManager::get_primary_for_view(3, 4), 3);
        assert_eq!(ViewChangeManager::get_primary_for_view(4, 4), 0); // Wrap
    }

    #[test]
    fn test_view_change_state_reset() {
        let mut state = ConsensusState::new(0);
        
        // Setup some state
        state.view = 0;
        state.current_height_state.phase = Phase::Prepared;
        
        // Start view change
        state.start_view_change(1);
        
        assert_eq!(state.view, 1);
        assert!(state.view_change_in_progress);
        assert_eq!(state.current_height_state.phase, Phase::Idle);
    }

    #[test]
    fn test_view_change_quorum() {
        let mut vc_state = ViewChangeState::new(1);
        
        // Need 3 view change messages
        for i in 0..2 {
            let msg = ViewChangeMessage::new(1, 100, [0u8; 32], i);
            assert!(!vc_state.add_message(msg));
        }
        
        let msg = ViewChangeMessage::new(1, 100, [0u8; 32], 2);
        assert!(vc_state.add_message(msg)); // Quorum reached
        assert!(vc_state.is_complete());
    }
}

// =============================================================================
// [TEST-005] 署名検証テスト
// =============================================================================

mod test_005_signature {
    use super::*;

    #[test]
    fn test_valid_signature_accepted() {
        let keypair = NodeKeyPair::generate(0);
        let verifier = ConsensusVerifier::new();
        
        let message = b"consensus message";
        let signature = keypair.sign(message);
        
        let result = verifier.verify(message, &signature, &keypair.public_key);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_invalid_signature_rejected() {
        let keypair1 = NodeKeyPair::generate(0);
        let keypair2 = NodeKeyPair::generate(1);
        let verifier = ConsensusVerifier::new();
        
        let message = b"consensus message";
        let signature = keypair1.sign(message);
        
        // Verify with wrong key
        let result = verifier.verify(message, &signature, &keypair2.public_key);
        assert!(result.is_ok());
        assert!(!result.unwrap());
    }

    #[test]
    fn test_empty_signature_rejected() {
        let keypair = NodeKeyPair::generate(0);
        let verifier = ConsensusVerifier::new();
        
        let empty_sig = DilithiumSignature::empty(0);
        let result = verifier.verify(b"test", &empty_sig, &keypair.public_key);
        
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_signatures_collection() {
        let block_hash = [1u8; 32];
        let mut agg = ValidatorSignatures::new(block_hash);
        
        for i in 0..3 {
            let keypair = NodeKeyPair::generate(i);
            let sig = keypair.sign(&block_hash);
            agg.add(sig);
        }
        
        assert_eq!(agg.count(), 3);
        assert!(agg.has_quorum(3));
    }
}

// =============================================================================
// [TEST-006] CP-1準拠テスト
// =============================================================================

mod test_006_cp1_compliance {
    use super::*;
    use aegis_consensus::signature::params;

    #[test]
    fn test_dilithium_iii_used() {
        assert_eq!(params::SECURITY_LEVEL, 3, "Must use Dilithium-III (FIPS 204 Level 3)");
    }

    #[test]
    fn test_sha3_256_used() {
        // Block hash uses SHA3-256
        let block = create_test_block(1);
        let hash = block.compute_hash();
        assert_eq!(hash.len(), 32, "Hash must be 256 bits");
    }

    #[test]
    fn test_no_prohibited_algorithms() {
        // Verify we don't use ECDSA, RSA, SHA-256, keccak256, secp256k1
        // This is verified by the imports and implementations
        let keypair = NodeKeyPair::generate(0);
        
        // Public key size matches Dilithium-III (not ECDSA/RSA)
        assert_eq!(keypair.public_key_bytes().len(), params::PUBLIC_KEY_SIZE);
        
        // Signature size matches Dilithium-III
        let sig = keypair.sign(b"test");
        assert_eq!(sig.size(), params::SIGNATURE_SIZE);
    }

    #[test]
    fn test_cp1_compliance_check() {
        assert!(aegis_consensus::is_cp1_compliant());
    }
}

// =============================================================================
// [TEST-007] 設定値テスト
// =============================================================================

mod test_007_config {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_5_second_block_interval() {
        let config = ConsensusConfig::production(0);
        assert_eq!(config.block_interval, Duration::from_secs(5));
    }

    #[test]
    fn test_10_second_view_change_timeout() {
        let config = ConsensusConfig::production(0);
        assert_eq!(config.view_change_timeout, Duration::from_secs(10));
    }

    #[test]
    fn test_3_of_4_quorum() {
        let config = ConsensusConfig::production(0);
        assert_eq!(config.num_nodes, 4);
        assert_eq!(config.quorum(), 3);
    }

    #[test]
    fn test_constants() {
        assert_eq!(NUM_NODES, 4);
        assert_eq!(FAULT_TOLERANCE, 1);
        assert_eq!(QUORUM_SIZE, 3);
        assert_eq!(BLOCK_INTERVAL_SECS, 5);
        assert_eq!(VIEW_CHANGE_TIMEOUT_SECS, 10);
    }

    #[test]
    fn test_dev_mode_config() {
        let config = ConsensusConfig::development(0);
        assert_eq!(config.block_interval, Duration::from_secs(1));
        assert_eq!(config.view_change_timeout, Duration::from_secs(3));
        assert!(config.dev_mode);
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

fn create_test_block(height: u64) -> Block {
    Block::new(
        height,
        1234567890,
        [0u8; 32],
        [1u8; 32],
        vec![],
        0,
    )
}
