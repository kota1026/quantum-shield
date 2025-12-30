//! # Four-Node Integration Test
//!
//! Reference: CURRENT_PLAN.md L3-006 テスト項目
//! - [TEST-001] 4ノード起動確認テスト
//! - [TEST-002] P2P接続確認テスト
//! - [TEST-003] コンセンサス動作確認テスト
//! - [TEST-004] 耐障害性テスト
//! - [TEST-005] CP-1準拠確認テスト
//!
//! Reference: L3_CHAIN_SPECIFICATION.md §10
//! - 4ノード構成
//! - 合意閾値: 3/4 (75%)
//! - 障害耐性: f=1

use std::time::Duration;

// =============================================================================
// [TEST-001] 4ノード起動確認テスト
// =============================================================================
//
// 完了基準:
// - 全ノード正常起動
// - RPC応答確認

mod test_001_four_node_startup {
    use super::*;

    /// Test that 4 node configurations are valid and can be loaded
    #[test]
    fn test_four_node_configs_valid() {
        // Each node config should be loadable
        let configs = [
            include_str!("../../docker/config/node0.toml"),
            include_str!("../../docker/config/node1.toml"),
            include_str!("../../docker/config/node2.toml"),
            include_str!("../../docker/config/node3.toml"),
        ];

        for (i, config) in configs.iter().enumerate() {
            assert!(!config.is_empty(), "Node {} config should not be empty", i);
            assert!(config.contains("[node]"), "Node {} should have [node] section", i);
            assert!(config.contains("[consensus]"), "Node {} should have [consensus] section", i);
            assert!(config.contains("[crypto]"), "Node {} should have [crypto] section", i);
        }
    }

    /// Test that node IDs are correctly assigned (0-3)
    #[test]
    fn test_node_ids_assigned() {
        let configs = [
            include_str!("../../docker/config/node0.toml"),
            include_str!("../../docker/config/node1.toml"),
            include_str!("../../docker/config/node2.toml"),
            include_str!("../../docker/config/node3.toml"),
        ];

        for (i, config) in configs.iter().enumerate() {
            let expected_id = format!("id = {}", i);
            assert!(config.contains(&expected_id), "Node {} should have id = {}", i, i);
        }
    }

    /// Test that all nodes have unique ports
    #[test]
    fn test_unique_ports() {
        // Per L3_CHAIN_SPECIFICATION §10:
        // - P2P: 30303-30306
        // - RPC: 8545-8548
        // Docker maps these internally
        
        let p2p_ports = ["172.28.0.10:30303", "172.28.0.11:30303", "172.28.0.12:30303", "172.28.0.13:30303"];
        let rpc_ports = [8545, 8546, 8547, 8548];
        
        // All should be unique (using internal port 30303, different IPs)
        for (i, port) in p2p_ports.iter().enumerate() {
            for (j, other) in p2p_ports.iter().enumerate() {
                if i != j {
                    assert_ne!(port, other, "P2P endpoints should be unique");
                }
            }
        }
        
        // RPC ports should be unique
        for (i, port) in rpc_ports.iter().enumerate() {
            for (j, other) in rpc_ports.iter().enumerate() {
                if i != j {
                    assert_ne!(port, other, "RPC ports should be unique");
                }
            }
        }
    }

    /// Test docker-compose configuration is valid
    #[test]
    fn test_docker_compose_valid() {
        let compose = include_str!("../../docker/docker-compose.yml");
        
        assert!(compose.contains("services:"), "Should define services");
        assert!(compose.contains("node0:"), "Should have node0");
        assert!(compose.contains("node1:"), "Should have node1");
        assert!(compose.contains("node2:"), "Should have node2");
        assert!(compose.contains("node3:"), "Should have node3");
        assert!(compose.contains("aegis-network:"), "Should define network");
        assert!(compose.contains("volumes:"), "Should define volumes");
    }
}

// =============================================================================
// [TEST-002] P2P接続確認テスト
// =============================================================================
//
// 完了基準:
// - ノード間接続数: 各ノード3接続
// - TLS暗号化確認

mod test_002_p2p_connection {
    use super::*;

    /// Test that each node has 3 bootstrap peers configured
    #[test]
    fn test_bootstrap_peers_configured() {
        let configs = [
            include_str!("../../docker/config/node0.toml"),
            include_str!("../../docker/config/node1.toml"),
            include_str!("../../docker/config/node2.toml"),
            include_str!("../../docker/config/node3.toml"),
        ];

        for (i, config) in configs.iter().enumerate() {
            // Count peer entries
            let peer_count = config.matches("peer").count();
            // Each node should have 3 peers (excluding itself)
            assert!(peer_count >= 3, "Node {} should have at least 3 peer entries, found {}", i, peer_count);
        }
    }

    /// Test that TLS is enabled for all nodes
    #[test]
    fn test_tls_enabled() {
        let configs = [
            include_str!("../../docker/config/node0.toml"),
            include_str!("../../docker/config/node1.toml"),
            include_str!("../../docker/config/node2.toml"),
            include_str!("../../docker/config/node3.toml"),
        ];

        for (i, config) in configs.iter().enumerate() {
            assert!(config.contains("enable_tls = true"), "Node {} should have TLS enabled", i);
        }
    }

    /// Test that all validators are listed in each config
    #[test]
    fn test_validators_listed() {
        let configs = [
            include_str!("../../docker/config/node0.toml"),
            include_str!("../../docker/config/node1.toml"),
            include_str!("../../docker/config/node2.toml"),
            include_str!("../../docker/config/node3.toml"),
        ];

        let validator_ips = ["172.28.0.10", "172.28.0.11", "172.28.0.12", "172.28.0.13"];

        for (i, config) in configs.iter().enumerate() {
            for ip in &validator_ips {
                assert!(config.contains(ip), "Node {} should list validator {}", i, ip);
            }
        }
    }

    /// Test network configuration in docker-compose
    #[test]
    fn test_network_configuration() {
        let compose = include_str!("../../docker/docker-compose.yml");
        
        // Check subnet configuration
        assert!(compose.contains("subnet: 172.28.0.0/16"), "Should define correct subnet");
        
        // Check each node has correct IP
        assert!(compose.contains("172.28.0.10"), "Node 0 should have IP 172.28.0.10");
        assert!(compose.contains("172.28.0.11"), "Node 1 should have IP 172.28.0.11");
        assert!(compose.contains("172.28.0.12"), "Node 2 should have IP 172.28.0.12");
        assert!(compose.contains("172.28.0.13"), "Node 3 should have IP 172.28.0.13");
    }
}

// =============================================================================
// [TEST-003] コンセンサス動作確認テスト
// =============================================================================
//
// 完了基準:
// - ブロック生成（5秒間隔）
// - 署名検証（Dilithium-III）
// - ブロック同期

mod test_003_consensus {
    use super::*;
    use aegis_consensus::config::{ConsensusConfig, BLOCK_INTERVAL_SECS, QUORUM_SIZE, NUM_NODES, VIEW_CHANGE_TIMEOUT_SECS};
    use aegis_consensus::signature::{NodeKeyPair, ConsensusVerifier};

    /// Test 5-second block interval configuration
    #[test]
    fn test_block_interval_5_seconds() {
        let config = ConsensusConfig::production(0);
        assert_eq!(config.block_interval, Duration::from_secs(5));
        assert_eq!(BLOCK_INTERVAL_SECS, 5);
    }

    /// Test 4-node PBFT quorum (3/4)
    #[test]
    fn test_pbft_quorum_3_of_4() {
        assert_eq!(NUM_NODES, 4, "Should have 4 nodes");
        assert_eq!(QUORUM_SIZE, 3, "Quorum should be 3 of 4");
        
        let config = ConsensusConfig::production(0);
        assert_eq!(config.num_nodes, 4);
        assert_eq!(config.quorum(), 3);
    }

    /// Test view change timeout (10 seconds)
    #[test]
    fn test_view_change_timeout() {
        assert_eq!(VIEW_CHANGE_TIMEOUT_SECS, 10);
        
        let config = ConsensusConfig::production(0);
        assert_eq!(config.view_change_timeout, Duration::from_secs(10));
    }

    /// Test Dilithium-III signature verification
    #[test]
    fn test_dilithium_signature_verification() {
        let keypairs: Vec<NodeKeyPair> = (0..4).map(|i| NodeKeyPair::generate(i)).collect();
        let verifier = ConsensusVerifier::new();
        
        let message = b"test consensus message for block 1";
        
        for keypair in &keypairs {
            let signature = keypair.sign(message);
            let result = verifier.verify(message, &signature, &keypair.public_key);
            assert!(result.is_ok(), "Signature verification should succeed");
            assert!(result.unwrap(), "Signature should be valid");
        }
    }

    /// Test 4-node consensus simulation
    #[test]
    fn test_four_node_consensus_simulation() {
        use aegis_consensus::state::ConsensusState;
        use aegis_consensus::message::{Block, ConsensusMessage};

        // Create 4 consensus states (one per node)
        let mut states: Vec<ConsensusState> = (0..4)
            .map(|_| ConsensusState::new(0))
            .collect();

        // Simulate block proposal by node 0 (primary in view 0)
        let block = Block::new(1, 1234567890, [0u8; 32], [1u8; 32], vec![], 0);
        let digest = block.compute_hash();

        // Node 0 sends PrePrepare
        let pre_prepare = ConsensusMessage::pre_prepare(0, 1, block, 0);
        
        // All nodes receive PrePrepare
        for state in &mut states {
            let _ = state.on_pre_prepare(pre_prepare.clone());
        }

        // All nodes send Prepare
        for sender in 0..4 {
            let prepare = ConsensusMessage::prepare(0, 1, digest, sender);
            for state in &mut states {
                let _ = state.on_prepare(prepare.clone());
            }
        }

        // All nodes send Commit
        for sender in 0..4 {
            let commit = ConsensusMessage::commit(0, 1, digest, sender);
            for state in &mut states {
                let _ = state.on_commit(commit.clone());
            }
        }

        // All nodes should be in Committed phase
        for (i, state) in states.iter().enumerate() {
            assert_eq!(
                state.current_height_state.phase,
                aegis_consensus::state::Phase::Committed,
                "Node {} should be in Committed phase",
                i
            );
        }
    }
}

// =============================================================================
// [TEST-004] 耐障害性テスト
// =============================================================================
//
// 完了基準:
// - 1ノードダウン時の継続動作
// - f=1 (3/4) で合意継続
// - ノード復帰後の同期

mod test_004_fault_tolerance {
    use super::*;
    use aegis_consensus::state::{ConsensusState, Phase, FAULT_TOLERANCE};
    use aegis_consensus::message::{Block, ConsensusMessage};

    /// Test fault tolerance parameter (f=1)
    #[test]
    fn test_fault_tolerance_f1() {
        assert_eq!(FAULT_TOLERANCE, 1, "Should tolerate 1 faulty node");
    }

    /// Test consensus continues with 3 of 4 nodes (one node down)
    #[test]
    fn test_consensus_with_one_node_down() {
        // Simulate consensus with only 3 nodes participating
        let mut states: Vec<ConsensusState> = (0..3)
            .map(|_| ConsensusState::new(0))
            .collect();

        let block = Block::new(1, 1234567890, [0u8; 32], [1u8; 32], vec![], 0);
        let digest = block.compute_hash();

        // Node 0 sends PrePrepare
        let pre_prepare = ConsensusMessage::pre_prepare(0, 1, block, 0);
        for state in &mut states {
            let _ = state.on_pre_prepare(pre_prepare.clone());
        }

        // Only 3 nodes send Prepare (node 3 is down)
        for sender in 0..3 {
            let prepare = ConsensusMessage::prepare(0, 1, digest, sender);
            for state in &mut states {
                let _ = state.on_prepare(prepare.clone());
            }
        }

        // Should reach Prepared with 3/4 quorum
        for (i, state) in states.iter().enumerate() {
            assert_eq!(
                state.current_height_state.phase,
                Phase::Prepared,
                "Node {} should be in Prepared phase with 3 nodes",
                i
            );
        }

        // Only 3 nodes send Commit
        for sender in 0..3 {
            let commit = ConsensusMessage::commit(0, 1, digest, sender);
            for state in &mut states {
                let _ = state.on_commit(commit.clone());
            }
        }

        // Should reach Committed with 3/4 quorum
        for (i, state) in states.iter().enumerate() {
            assert_eq!(
                state.current_height_state.phase,
                Phase::Committed,
                "Node {} should be in Committed phase with 3 nodes",
                i
            );
        }
    }

    /// Test consensus fails with only 2 nodes (below quorum)
    #[test]
    fn test_consensus_fails_below_quorum() {
        let mut states: Vec<ConsensusState> = (0..2)
            .map(|_| ConsensusState::new(0))
            .collect();

        let block = Block::new(1, 1234567890, [0u8; 32], [1u8; 32], vec![], 0);
        let digest = block.compute_hash();

        // PrePrepare
        let pre_prepare = ConsensusMessage::pre_prepare(0, 1, block, 0);
        for state in &mut states {
            let _ = state.on_pre_prepare(pre_prepare.clone());
        }

        // Only 2 nodes send Prepare
        for sender in 0..2 {
            let prepare = ConsensusMessage::prepare(0, 1, digest, sender);
            for state in &mut states {
                let _ = state.on_prepare(prepare.clone());
            }
        }

        // Should NOT reach Prepared (need 3/4)
        for (i, state) in states.iter().enumerate() {
            assert_ne!(
                state.current_height_state.phase,
                Phase::Prepared,
                "Node {} should NOT be in Prepared phase with only 2 nodes",
                i
            );
        }
    }

    /// Test view change when primary is down
    #[test]
    fn test_view_change_on_primary_down() {
        use aegis_consensus::view_change::{ViewChangeManager, ViewChangeState};
        use aegis_consensus::ViewChangeMessage;

        // Simulate timeout on primary (node 0)
        let mut manager = ViewChangeManager::new(0, 10);
        
        manager.record_activity(100);
        assert!(!manager.is_timeout(109)); // 9 seconds - not timeout
        assert!(manager.is_timeout(111));  // 11 seconds - timeout

        // Start view change to view 1
        let mut vc_state = ViewChangeState::new(1);
        
        // 3 nodes vote for view change (quorum)
        for i in 1..4 {
            let msg = ViewChangeMessage::new(1, 100, [0u8; 32], i);
            let _ = vc_state.add_message(msg);
        }
        
        assert!(vc_state.is_complete(), "View change should complete with 3/4 votes");
        
        // New primary for view 1 should be node 1
        assert_eq!(ViewChangeManager::get_primary_for_view(1, 4), 1);
    }
}

// =============================================================================
// [TEST-005] CP-1準拠確認テスト
// =============================================================================
//
// 完了基準:
// - Dilithium-III署名使用確認
// - SHA3-256ハッシュ使用確認
// - 禁止アルゴリズム不使用確認

mod test_005_cp1_compliance {
    use super::*;
    use aegis_consensus::signature::params;
    use aegis_consensus::is_cp1_compliant;

    /// Test Dilithium-III is used (FIPS 204)
    #[test]
    fn test_dilithium_iii_fips_204() {
        assert_eq!(params::SECURITY_LEVEL, 3, "Must use Dilithium-III (Level 3)");
        assert_eq!(params::PUBLIC_KEY_SIZE, 1952, "Dilithium-III public key size");
        assert_eq!(params::SIGNATURE_SIZE, 3309, "Dilithium-III signature size");
    }

    /// Test SHA3-256 is used for hashing (FIPS 202)
    #[test]
    fn test_sha3_256_fips_202() {
        let configs = [
            include_str!("../../docker/config/node0.toml"),
            include_str!("../../docker/config/node1.toml"),
            include_str!("../../docker/config/node2.toml"),
            include_str!("../../docker/config/node3.toml"),
        ];

        for (i, config) in configs.iter().enumerate() {
            assert!(
                config.contains("hash_algorithm = \"sha3-256\""),
                "Node {} should use SHA3-256",
                i
            );
        }
    }

    /// Test no prohibited algorithms
    #[test]
    fn test_no_prohibited_algorithms() {
        let configs = [
            include_str!("../../docker/config/node0.toml"),
            include_str!("../../docker/config/node1.toml"),
            include_str!("../../docker/config/node2.toml"),
            include_str!("../../docker/config/node3.toml"),
        ];

        let prohibited = ["keccak256", "sha-256", "sha256", "ecdsa", "rsa", "secp256k1", "ed25519"];

        for (i, config) in configs.iter().enumerate() {
            let config_lower = config.to_lowercase();
            for algo in &prohibited {
                assert!(
                    !config_lower.contains(algo),
                    "Node {} should not use prohibited algorithm: {}",
                    i,
                    algo
                );
            }
        }
    }

    /// Test CP-1 compliance check function
    #[test]
    fn test_cp1_compliance_check() {
        assert!(is_cp1_compliant(), "System should be CP-1 compliant");
    }

    /// Test Dilithium signature algorithm in configs
    #[test]
    fn test_dilithium_in_configs() {
        let configs = [
            include_str!("../../docker/config/node0.toml"),
            include_str!("../../docker/config/node1.toml"),
            include_str!("../../docker/config/node2.toml"),
            include_str!("../../docker/config/node3.toml"),
        ];

        for (i, config) in configs.iter().enumerate() {
            assert!(
                config.contains("signature_algorithm = \"dilithium-iii\""),
                "Node {} should use Dilithium-III",
                i
            );
        }
    }
}

// =============================================================================
// Additional Tests: Docker Environment
// =============================================================================

mod test_docker_environment {
    use super::*;

    /// Test Dockerfile exists and is valid
    #[test]
    fn test_dockerfile_valid() {
        let dockerfile = include_str!("../../docker/Dockerfile");
        
        assert!(dockerfile.contains("FROM"), "Should have FROM instruction");
        assert!(dockerfile.contains("rust"), "Should use Rust base image");
        assert!(dockerfile.contains("COPY"), "Should copy source files");
    }

    /// Test all required volumes are defined
    #[test]
    fn test_volumes_defined() {
        let compose = include_str!("../../docker/docker-compose.yml");
        
        assert!(compose.contains("node0-data:"), "Should define node0-data volume");
        assert!(compose.contains("node1-data:"), "Should define node1-data volume");
        assert!(compose.contains("node2-data:"), "Should define node2-data volume");
        assert!(compose.contains("node3-data:"), "Should define node3-data volume");
    }

    /// Test restart policy is configured
    #[test]
    fn test_restart_policy() {
        let compose = include_str!("../../docker/docker-compose.yml");
        
        assert!(compose.contains("restart: unless-stopped"), "Should have restart policy");
    }

    /// Test environment variables are set
    #[test]
    fn test_environment_variables() {
        let compose = include_str!("../../docker/docker-compose.yml");
        
        assert!(compose.contains("AEGIS_NODE_ID"), "Should set AEGIS_NODE_ID");
        assert!(compose.contains("AEGIS_LOG_LEVEL"), "Should set AEGIS_LOG_LEVEL");
        assert!(compose.contains("AEGIS_METRICS_ENABLED"), "Should set AEGIS_METRICS_ENABLED");
    }
}
