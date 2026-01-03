//! # Sequencer Failover (DECEN-015)
//!
//! Multi-sequencer failover management with health monitoring.
//!
//! ## Features
//!
//! - Heartbeat monitoring (30s intervals)
//! - Failure detection (10s timeout, 2 consecutive misses)
//! - Integration with RotationManager
//! - Auto-recovery support
//!
//! ## Reference
//!
//! - L3_CHAIN_SPECIFICATION.md §3.4 View Change
//! - SEQUENCES SEQ#5 Prover Registration

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{info, warn, error};

use crate::error::{SequencerError, SequencerResult};
use crate::rotation::RotationManager;

/// Failover timeout in seconds (from L3_CHAIN_SPECIFICATION.md §3.4)
pub const FAILOVER_TIMEOUT_SECS: u64 = 10;

/// Heartbeat interval in seconds
pub const HEARTBEAT_INTERVAL_SECS: u64 = 30;

/// Maximum consecutive misses before failover trigger
pub const MAX_CONSECUTIVE_MISSES: u32 = 2;

/// Failover configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailoverConfig {
    /// Failover timeout in seconds
    pub timeout_secs: u64,
    /// Heartbeat interval in seconds
    pub heartbeat_interval_secs: u64,
    /// Maximum consecutive misses before failover
    pub max_consecutive_misses: u32,
    /// Enable auto-failover
    pub auto_failover: bool,
    /// Recovery cooldown period in seconds
    pub recovery_cooldown_secs: u64,
}

impl Default for FailoverConfig {
    fn default() -> Self {
        Self {
            timeout_secs: FAILOVER_TIMEOUT_SECS,
            heartbeat_interval_secs: HEARTBEAT_INTERVAL_SECS,
            max_consecutive_misses: MAX_CONSECUTIVE_MISSES,
            auto_failover: true,
            recovery_cooldown_secs: 60,
        }
    }
}

/// Health status for a sequencer
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HealthStatus {
    /// Sequencer is healthy
    Healthy,
    /// Sequencer missed some heartbeats
    Degraded,
    /// Sequencer is suspended
    Suspended,
    /// Sequencer is inactive
    Inactive,
}

impl Default for HealthStatus {
    fn default() -> Self {
        Self::Healthy
    }
}

/// Health information for a sequencer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequencerHealth {
    /// Node ID
    pub node_id: [u8; 32],
    /// Current health status
    pub status: HealthStatus,
    /// Last heartbeat timestamp
    pub last_heartbeat: u64,
    /// Consecutive missed heartbeats
    pub consecutive_misses: u32,
    /// Total missed heartbeats
    pub total_misses: u64,
    /// Last failure timestamp (if any)
    pub last_failure: Option<u64>,
    /// Recovery timestamp (if recovered)
    pub last_recovery: Option<u64>,
}

impl SequencerHealth {
    pub fn new(node_id: [u8; 32]) -> Self {
        Self {
            node_id,
            status: HealthStatus::Healthy,
            last_heartbeat: chrono::Utc::now().timestamp() as u64,
            consecutive_misses: 0,
            total_misses: 0,
            last_failure: None,
            last_recovery: None,
        }
    }
}

/// Failover event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FailoverEvent {
    /// Failure detected
    FailureDetected {
        node_id: [u8; 32],
        consecutive_misses: u32,
        timestamp: u64,
    },
    /// Failover triggered
    FailoverTriggered {
        old_leader: [u8; 32],
        new_leader: [u8; 32],
        timestamp: u64,
    },
    /// Sequencer recovered
    SequencerRecovered {
        node_id: [u8; 32],
        timestamp: u64,
    },
    /// Heartbeat received
    HeartbeatReceived {
        node_id: [u8; 32],
        timestamp: u64,
    },
}

/// Failover manager for multi-sequencer coordination
pub struct FailoverManager {
    /// Configuration
    config: FailoverConfig,
    /// Health tracking per node
    health: RwLock<HashMap<[u8; 32], SequencerHealth>>,
    /// Failover events
    events: RwLock<Vec<FailoverEvent>>,
    /// Last check time
    last_check: RwLock<Instant>,
}

impl FailoverManager {
    /// Create new failover manager
    pub fn new(config: FailoverConfig) -> Self {
        Self {
            config,
            health: RwLock::new(HashMap::new()),
            events: RwLock::new(Vec::new()),
            last_check: RwLock::new(Instant::now()),
        }
    }

    /// Register a sequencer for health monitoring
    pub async fn register_sequencer(&self, node_id: [u8; 32]) -> SequencerResult<()> {
        let mut health = self.health.write().await;
        
        if health.contains_key(&node_id) {
            return Err(SequencerError::InternalError(
                "Sequencer already registered".to_string()
            ));
        }
        
        health.insert(node_id, SequencerHealth::new(node_id));
        
        info!(
            "Registered sequencer for health monitoring: 0x{}",
            hex::encode(&node_id[..8])
        );
        
        Ok(())
    }

    /// Unregister a sequencer
    pub async fn unregister_sequencer(&self, node_id: [u8; 32]) -> SequencerResult<()> {
        let mut health = self.health.write().await;
        
        if health.remove(&node_id).is_none() {
            return Err(SequencerError::InternalError(
                "Sequencer not found".to_string()
            ));
        }
        
        info!(
            "Unregistered sequencer: 0x{}",
            hex::encode(&node_id[..8])
        );
        
        Ok(())
    }

    /// Record heartbeat from sequencer
    pub async fn record_heartbeat(&self, node_id: [u8; 32]) -> SequencerResult<()> {
        let mut health = self.health.write().await;
        
        let entry = health.get_mut(&node_id).ok_or_else(|| {
            SequencerError::InternalError("Sequencer not registered".to_string())
        })?;
        
        let now = chrono::Utc::now().timestamp() as u64;
        entry.last_heartbeat = now;
        entry.consecutive_misses = 0;
        
        // Recover if was degraded
        if entry.status == HealthStatus::Degraded {
            entry.status = HealthStatus::Healthy;
            entry.last_recovery = Some(now);
            
            // Record recovery event
            let mut events = self.events.write().await;
            events.push(FailoverEvent::SequencerRecovered {
                node_id,
                timestamp: now,
            });
        }
        
        // Record heartbeat event
        let mut events = self.events.write().await;
        events.push(FailoverEvent::HeartbeatReceived {
            node_id,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Check for failures and trigger failover if needed
    pub async fn detect_failures(&self) -> Vec<[u8; 32]> {
        let mut failed_nodes = Vec::new();
        let now = chrono::Utc::now().timestamp() as u64;
        let timeout = self.config.timeout_secs;
        
        let mut health = self.health.write().await;
        
        for (node_id, entry) in health.iter_mut() {
            // Skip already suspended/inactive nodes
            if entry.status == HealthStatus::Suspended || 
               entry.status == HealthStatus::Inactive {
                continue;
            }
            
            // Check if heartbeat is expired
            let elapsed = now.saturating_sub(entry.last_heartbeat);
            
            if elapsed > timeout {
                entry.consecutive_misses += 1;
                entry.total_misses += 1;
                
                warn!(
                    "Sequencer 0x{} missed heartbeat (consecutive: {})",
                    hex::encode(&node_id[..8]),
                    entry.consecutive_misses
                );
                
                // Check for failover threshold
                if entry.consecutive_misses >= self.config.max_consecutive_misses {
                    entry.status = HealthStatus::Suspended;
                    entry.last_failure = Some(now);
                    failed_nodes.push(*node_id);
                    
                    error!(
                        "Sequencer 0x{} suspended after {} consecutive misses",
                        hex::encode(&node_id[..8]),
                        entry.consecutive_misses
                    );
                } else {
                    entry.status = HealthStatus::Degraded;
                }
            }
        }
        
        // Record failure events
        if !failed_nodes.is_empty() {
            let mut events = self.events.write().await;
            for node_id in &failed_nodes {
                let entry = health.get(node_id).unwrap();
                events.push(FailoverEvent::FailureDetected {
                    node_id: *node_id,
                    consecutive_misses: entry.consecutive_misses,
                    timestamp: now,
                });
            }
        }
        
        // Update last check time
        {
            let mut last_check = self.last_check.write().await;
            *last_check = Instant::now();
        }
        
        failed_nodes
    }

    /// Trigger failover for a specific node
    pub async fn trigger_failover(
        &self,
        old_leader: [u8; 32],
        rotation_manager: &RotationManager,
    ) -> SequencerResult<[u8; 32]> {
        // Get current view and calculate next leader
        let state = rotation_manager.get_state().await;
        let new_leader = rotation_manager.calculate_leader(state.view + 1).await?;
        
        let now = chrono::Utc::now().timestamp() as u64;
        
        // Record failover event
        {
            let mut events = self.events.write().await;
            events.push(FailoverEvent::FailoverTriggered {
                old_leader,
                new_leader,
                timestamp: now,
            });
        }
        
        info!(
            "Failover triggered: 0x{} -> 0x{}",
            hex::encode(&old_leader[..8]),
            hex::encode(&new_leader[..8])
        );
        
        Ok(new_leader)
    }

    /// Recover a suspended sequencer
    pub async fn recover_sequencer(&self, node_id: [u8; 32]) -> SequencerResult<()> {
        let mut health = self.health.write().await;
        
        let entry = health.get_mut(&node_id).ok_or_else(|| {
            SequencerError::InternalError("Sequencer not found".to_string())
        })?;
        
        // Check recovery cooldown
        let now = chrono::Utc::now().timestamp() as u64;
        if let Some(last_failure) = entry.last_failure {
            let elapsed = now.saturating_sub(last_failure);
            if elapsed < self.config.recovery_cooldown_secs {
                return Err(SequencerError::InternalError(
                    format!(
                        "Recovery cooldown not elapsed: {}s remaining",
                        self.config.recovery_cooldown_secs - elapsed
                    )
                ));
            }
        }
        
        entry.status = HealthStatus::Healthy;
        entry.consecutive_misses = 0;
        entry.last_heartbeat = now;
        entry.last_recovery = Some(now);
        
        // Record recovery event
        {
            let mut events = self.events.write().await;
            events.push(FailoverEvent::SequencerRecovered {
                node_id,
                timestamp: now,
            });
        }
        
        info!(
            "Sequencer recovered: 0x{}",
            hex::encode(&node_id[..8])
        );
        
        Ok(())
    }

    /// Get health status for a specific node
    pub async fn get_health(&self, node_id: [u8; 32]) -> Option<SequencerHealth> {
        let health = self.health.read().await;
        health.get(&node_id).cloned()
    }

    /// Get health status for all nodes
    pub async fn get_all_health(&self) -> Vec<SequencerHealth> {
        let health = self.health.read().await;
        health.values().cloned().collect()
    }

    /// Get healthy sequencer count
    pub async fn healthy_count(&self) -> usize {
        let health = self.health.read().await;
        health.values()
            .filter(|h| h.status == HealthStatus::Healthy)
            .count()
    }

    /// Get total registered sequencer count
    pub async fn total_count(&self) -> usize {
        self.health.read().await.len()
    }

    /// Check if failover is needed for current leader
    pub async fn should_failover(&self, current_leader: [u8; 32]) -> bool {
        let health = self.health.read().await;
        
        if let Some(entry) = health.get(&current_leader) {
            entry.status == HealthStatus::Suspended ||
            entry.status == HealthStatus::Inactive
        } else {
            false
        }
    }

    /// Get recent events
    pub async fn get_recent_events(&self, count: usize) -> Vec<FailoverEvent> {
        let events = self.events.read().await;
        events.iter()
            .rev()
            .take(count)
            .cloned()
            .collect()
    }

    /// Clear old events (keep last N)
    pub async fn cleanup_events(&self, keep_count: usize) {
        let mut events = self.events.write().await;
        if events.len() > keep_count {
            events.drain(0..(events.len() - keep_count));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_node_id(id: u8) -> [u8; 32] {
        let mut node_id = [0u8; 32];
        node_id[0] = id;
        node_id
    }

    #[tokio::test]
    async fn test_failover_manager_creation() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        assert_eq!(manager.total_count().await, 0);
        assert_eq!(manager.healthy_count().await, 0);
    }

    #[tokio::test]
    async fn test_register_sequencer() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        manager.register_sequencer(node_id).await.unwrap();
        
        assert_eq!(manager.total_count().await, 1);
        assert_eq!(manager.healthy_count().await, 1);
        
        let health = manager.get_health(node_id).await.unwrap();
        assert_eq!(health.status, HealthStatus::Healthy);
    }

    #[tokio::test]
    async fn test_register_duplicate_fails() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        manager.register_sequencer(node_id).await.unwrap();
        
        let result = manager.register_sequencer(node_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_record_heartbeat() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        manager.register_sequencer(node_id).await.unwrap();
        
        manager.record_heartbeat(node_id).await.unwrap();
        
        let health = manager.get_health(node_id).await.unwrap();
        assert_eq!(health.status, HealthStatus::Healthy);
        assert_eq!(health.consecutive_misses, 0);
    }

    #[tokio::test]
    async fn test_heartbeat_unregistered_fails() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        let result = manager.record_heartbeat(node_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_unregister_sequencer() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        manager.register_sequencer(node_id).await.unwrap();
        manager.unregister_sequencer(node_id).await.unwrap();
        
        assert_eq!(manager.total_count().await, 0);
    }

    #[tokio::test]
    async fn test_should_failover() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        manager.register_sequencer(node_id).await.unwrap();
        
        // Initially should not failover
        assert!(!manager.should_failover(node_id).await);
        
        // Manually set to suspended
        {
            let mut health = manager.health.write().await;
            if let Some(entry) = health.get_mut(&node_id) {
                entry.status = HealthStatus::Suspended;
            }
        }
        
        // Now should failover
        assert!(manager.should_failover(node_id).await);
    }

    #[tokio::test]
    async fn test_recover_sequencer() {
        let config = FailoverConfig {
            recovery_cooldown_secs: 0, // Disable cooldown for test
            ..Default::default()
        };
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        manager.register_sequencer(node_id).await.unwrap();
        
        // Set to suspended
        {
            let mut health = manager.health.write().await;
            if let Some(entry) = health.get_mut(&node_id) {
                entry.status = HealthStatus::Suspended;
            }
        }
        
        // Recover
        manager.recover_sequencer(node_id).await.unwrap();
        
        let health = manager.get_health(node_id).await.unwrap();
        assert_eq!(health.status, HealthStatus::Healthy);
    }

    #[tokio::test]
    async fn test_get_all_health() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        for i in 0..4 {
            let node_id = create_test_node_id(i);
            manager.register_sequencer(node_id).await.unwrap();
        }
        
        let all_health = manager.get_all_health().await;
        assert_eq!(all_health.len(), 4);
    }

    #[tokio::test]
    async fn test_events_recorded() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        manager.register_sequencer(node_id).await.unwrap();
        manager.record_heartbeat(node_id).await.unwrap();
        
        let events = manager.get_recent_events(10).await;
        assert!(!events.is_empty());
        
        // Should have HeartbeatReceived event
        let has_heartbeat = events.iter().any(|e| {
            matches!(e, FailoverEvent::HeartbeatReceived { .. })
        });
        assert!(has_heartbeat);
    }

    #[tokio::test]
    async fn test_cleanup_events() {
        let config = FailoverConfig::default();
        let manager = FailoverManager::new(config);
        
        let node_id = create_test_node_id(1);
        manager.register_sequencer(node_id).await.unwrap();
        
        // Generate many events
        for _ in 0..20 {
            manager.record_heartbeat(node_id).await.unwrap();
        }
        
        let events_before = manager.get_recent_events(100).await.len();
        assert!(events_before >= 20);
        
        manager.cleanup_events(5).await;
        
        let events_after = manager.get_recent_events(100).await.len();
        assert_eq!(events_after, 5);
    }
}
