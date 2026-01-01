//! # Sequencer Staking (SEQ-006)
//!
//! Integration with veQS token staking for sequencer participation.
//!
//! ## Features
//!
//! - veQS token staking integration
//! - Stake verification for sequencer eligibility
//! - Slashing support integration
//! - Phase-based stake currency (ETH for Phase 1-2, $QS for Phase 3+)
//!
//! ## Reference
//!
//! - SPEC_STRATEGY_BRIDGE.md §7.2 Prover Stake Extension
//! - UNIFIED_SPEC_v2.0.md §Phase 2

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

use crate::error::SequencerResult;

/// Minimum stake for Phase 1-2 (ETH)
pub const MIN_STAKE_ETH: u128 = 400_000 * 10u128.pow(18); // $400K in ETH (assuming ETH value)

/// Minimum stake for Phase 3+ ($QS)
pub const MIN_STAKE_QS: u128 = 500_000 * 10u128.pow(18); // $500K in $QS

/// Staking configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingConfig {
    /// Minimum stake amount
    pub min_stake: u128,
    /// Stake currency
    pub currency: StakeCurrency,
    /// Lock period in seconds
    pub lock_period_secs: u64,
    /// Slashing enabled
    pub slashing_enabled: bool,
    /// Slashing rate (basis points, 10000 = 100%)
    pub slashing_rate_bps: u32,
    /// veQS contract address (if applicable)
    pub veqs_contract: Option<[u8; 20]>,
}

impl Default for StakingConfig {
    fn default() -> Self {
        Self {
            min_stake: MIN_STAKE_ETH,
            currency: StakeCurrency::ETH,
            lock_period_secs: 7 * 24 * 3600, // 7 days
            slashing_enabled: true,
            slashing_rate_bps: 1000, // 10% base rate
            veqs_contract: None,
        }
    }
}

/// Stake currency type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum StakeCurrency {
    /// ETH (Phase 1-2)
    ETH,
    /// $QS Token (Phase 3+)
    QS,
    /// veQS (vote-escrowed QS)
    VeQS,
}

impl std::fmt::Display for StakeCurrency {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StakeCurrency::ETH => write!(f, "ETH"),
            StakeCurrency::QS => write!(f, "$QS"),
            StakeCurrency::VeQS => write!(f, "veQS"),
        }
    }
}

/// Stake status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum StakeStatus {
    /// Active stake
    Active,
    /// Pending activation
    Pending,
    /// Locked (cannot withdraw)
    Locked,
    /// Exiting (withdrawal requested)
    Exiting,
    /// Slashed
    Slashed,
    /// Withdrawn
    Withdrawn,
}

/// Stake info for a sequencer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeInfo {
    /// Sequencer ID (Dilithium public key hash)
    pub sequencer_id: [u8; 32],
    /// Stake amount
    pub amount: u128,
    /// Currency
    pub currency: StakeCurrency,
    /// Status
    pub status: StakeStatus,
    /// Stake timestamp
    pub staked_at: u64,
    /// Lock end timestamp
    pub lock_end: u64,
    /// Total slashed amount
    pub slashed_amount: u128,
    /// Slash count
    pub slash_count: u32,
    /// veQS voting power (if applicable)
    pub voting_power: u128,
}

impl StakeInfo {
    /// Check if stake is eligible for sequencer duties
    pub fn is_eligible(&self, min_stake: u128) -> bool {
        self.status == StakeStatus::Active && self.amount >= min_stake
    }

    /// Get effective stake (after slashing)
    pub fn effective_stake(&self) -> u128 {
        self.amount.saturating_sub(self.slashed_amount)
    }
}

/// Staking provider trait (for mocking)
#[async_trait]
pub trait StakingProvider: Send + Sync {
    /// Get stake info for sequencer
    async fn get_stake(&self, sequencer_id: [u8; 32]) -> SequencerResult<Option<StakeInfo>>;
    
    /// Verify stake meets requirements
    async fn verify_stake(&self, sequencer_id: [u8; 32], min_stake: u128) -> SequencerResult<bool>;
    
    /// Get total staked amount
    async fn total_staked(&self) -> SequencerResult<u128>;
    
    /// Get sequencer count with active stakes
    async fn active_sequencer_count(&self) -> SequencerResult<usize>;
}

/// Mock staking provider for testing
pub struct MockStakingProvider {
    /// Stakes
    stakes: RwLock<HashMap<[u8; 32], StakeInfo>>,
}

impl MockStakingProvider {
    /// Create new mock provider
    pub fn new() -> Self {
        Self {
            stakes: RwLock::new(HashMap::new()),
        }
    }

    /// Add stake
    pub async fn add_stake(&self, sequencer_id: [u8; 32], amount: u128, currency: StakeCurrency) {
        let stake = StakeInfo {
            sequencer_id,
            amount,
            currency,
            status: StakeStatus::Active,
            staked_at: chrono::Utc::now().timestamp() as u64,
            lock_end: (chrono::Utc::now().timestamp() + 7 * 24 * 3600) as u64,
            slashed_amount: 0,
            slash_count: 0,
            voting_power: amount, // Simplified: 1:1 voting power
        };

        let mut stakes = self.stakes.write().await;
        stakes.insert(sequencer_id, stake);
    }

    /// Remove stake
    pub async fn remove_stake(&self, sequencer_id: [u8; 32]) {
        let mut stakes = self.stakes.write().await;
        stakes.remove(&sequencer_id);
    }
}

impl Default for MockStakingProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl StakingProvider for MockStakingProvider {
    async fn get_stake(&self, sequencer_id: [u8; 32]) -> SequencerResult<Option<StakeInfo>> {
        let stakes = self.stakes.read().await;
        Ok(stakes.get(&sequencer_id).cloned())
    }

    async fn verify_stake(&self, sequencer_id: [u8; 32], min_stake: u128) -> SequencerResult<bool> {
        let stakes = self.stakes.read().await;
        match stakes.get(&sequencer_id) {
            Some(stake) => Ok(stake.is_eligible(min_stake)),
            None => Ok(false),
        }
    }

    async fn total_staked(&self) -> SequencerResult<u128> {
        let stakes = self.stakes.read().await;
        let total: u128 = stakes.values()
            .filter(|s| s.status == StakeStatus::Active)
            .map(|s| s.effective_stake())
            .sum();
        Ok(total)
    }

    async fn active_sequencer_count(&self) -> SequencerResult<usize> {
        let stakes = self.stakes.read().await;
        let count = stakes.values()
            .filter(|s| s.status == StakeStatus::Active)
            .count();
        Ok(count)
    }
}

/// Staking manager for sequencer stake verification
pub struct StakingManager {
    /// Configuration
    config: StakingConfig,
    /// Staking provider
    provider: Arc<dyn StakingProvider>,
    /// Local sequencer ID
    sequencer_id: [u8; 32],
}

impl StakingManager {
    /// Create new staking manager with mock provider
    pub fn new(config: StakingConfig, sequencer_id: [u8; 32]) -> Self {
        Self {
            config,
            provider: Arc::new(MockStakingProvider::new()),
            sequencer_id,
        }
    }

    /// Create with custom provider
    pub fn with_provider(
        config: StakingConfig,
        sequencer_id: [u8; 32],
        provider: Arc<dyn StakingProvider>,
    ) -> Self {
        Self {
            config,
            provider,
            sequencer_id,
        }
    }

    /// Get configuration
    pub fn config(&self) -> &StakingConfig {
        &self.config
    }

    /// Update configuration (for phase transitions)
    pub fn update_config(&mut self, config: StakingConfig) {
        info!(
            "Staking config updated: min_stake={}, currency={}",
            config.min_stake, config.currency
        );
        self.config = config;
    }

    /// Check if local sequencer has sufficient stake
    pub async fn has_sufficient_stake(&self) -> SequencerResult<bool> {
        self.provider.verify_stake(self.sequencer_id, self.config.min_stake).await
    }

    /// Get local sequencer stake info
    pub async fn get_stake_info(&self) -> SequencerResult<Option<StakeInfo>> {
        self.provider.get_stake(self.sequencer_id).await
    }

    /// Verify another sequencer's stake
    pub async fn verify_sequencer(&self, sequencer_id: [u8; 32]) -> SequencerResult<bool> {
        self.provider.verify_stake(sequencer_id, self.config.min_stake).await
    }

    /// Get stake info for another sequencer
    pub async fn get_sequencer_stake(&self, sequencer_id: [u8; 32]) -> SequencerResult<Option<StakeInfo>> {
        self.provider.get_stake(sequencer_id).await
    }

    /// Get total staked amount
    pub async fn total_staked(&self) -> SequencerResult<u128> {
        self.provider.total_staked().await
    }

    /// Get active sequencer count
    pub async fn active_count(&self) -> SequencerResult<usize> {
        self.provider.active_sequencer_count().await
    }

    /// Calculate slashing amount
    /// 
    /// Uses quadratic slashing: N² × 10%
    /// Reference: SEQ#4 in SEQUENCES_v2.0.md
    pub fn calculate_slash_amount(&self, stake_amount: u128, offense_count: u32) -> u128 {
        if !self.config.slashing_enabled || offense_count == 0 {
            return 0;
        }

        // Quadratic slashing: N² × base_rate
        let n_squared = (offense_count as u128).saturating_mul(offense_count as u128);
        let base_rate = self.config.slashing_rate_bps as u128;
        
        // Calculate: amount × N² × rate / 10000
        let slash = stake_amount
            .saturating_mul(n_squared)
            .saturating_mul(base_rate)
            / 10000;
        
        // Cap at total stake
        slash.min(stake_amount)
    }

    /// Create config for Phase 1-2 (ETH staking)
    pub fn phase1_2_config() -> StakingConfig {
        StakingConfig {
            min_stake: MIN_STAKE_ETH,
            currency: StakeCurrency::ETH,
            lock_period_secs: 7 * 24 * 3600,
            slashing_enabled: true,
            slashing_rate_bps: 1000,
            veqs_contract: None,
        }
    }

    /// Create config for Phase 3+ ($QS staking)
    pub fn phase3_config(veqs_contract: [u8; 20]) -> StakingConfig {
        StakingConfig {
            min_stake: MIN_STAKE_QS,
            currency: StakeCurrency::QS,
            lock_period_secs: 14 * 24 * 3600, // 14 days for veQS
            slashing_enabled: true,
            slashing_rate_bps: 1000,
            veqs_contract: Some(veqs_contract),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_staking_manager_creation() {
        let config = StakingConfig::default();
        let manager = StakingManager::new(config, [1u8; 32]);
        
        assert_eq!(manager.config().currency, StakeCurrency::ETH);
        assert_eq!(manager.config().min_stake, MIN_STAKE_ETH);
    }

    #[tokio::test]
    async fn test_mock_staking_provider() {
        let provider = MockStakingProvider::new();
        
        let sequencer_id = [1u8; 32];
        
        // No stake initially
        let stake = provider.get_stake(sequencer_id).await.unwrap();
        assert!(stake.is_none());
        
        // Add stake
        provider.add_stake(sequencer_id, MIN_STAKE_ETH, StakeCurrency::ETH).await;
        
        // Verify stake exists
        let stake = provider.get_stake(sequencer_id).await.unwrap();
        assert!(stake.is_some());
        assert_eq!(stake.unwrap().amount, MIN_STAKE_ETH);
    }

    #[tokio::test]
    async fn test_verify_stake() {
        let provider = Arc::new(MockStakingProvider::new());
        let sequencer_id = [1u8; 32];
        
        let config = StakingConfig::default();
        let manager = StakingManager::with_provider(config, sequencer_id, provider.clone());
        
        // No stake - should fail
        let result = manager.has_sufficient_stake().await.unwrap();
        assert!(!result);
        
        // Add sufficient stake
        provider.add_stake(sequencer_id, MIN_STAKE_ETH, StakeCurrency::ETH).await;
        
        // Should pass now
        let result = manager.has_sufficient_stake().await.unwrap();
        assert!(result);
    }

    #[tokio::test]
    async fn test_insufficient_stake() {
        let provider = Arc::new(MockStakingProvider::new());
        let sequencer_id = [1u8; 32];
        
        let config = StakingConfig::default();
        let manager = StakingManager::with_provider(config, sequencer_id, provider.clone());
        
        // Add insufficient stake
        provider.add_stake(sequencer_id, MIN_STAKE_ETH / 2, StakeCurrency::ETH).await;
        
        // Should fail
        let result = manager.has_sufficient_stake().await.unwrap();
        assert!(!result);
    }

    #[tokio::test]
    async fn test_total_staked() {
        let provider = Arc::new(MockStakingProvider::new());
        
        // Add multiple stakes
        for i in 0..4 {
            let mut id = [0u8; 32];
            id[0] = i as u8;
            provider.add_stake(id, MIN_STAKE_ETH, StakeCurrency::ETH).await;
        }
        
        let config = StakingConfig::default();
        let manager = StakingManager::with_provider(config, [0u8; 32], provider);
        
        let total = manager.total_staked().await.unwrap();
        assert_eq!(total, MIN_STAKE_ETH * 4);
        
        let count = manager.active_count().await.unwrap();
        assert_eq!(count, 4);
    }

    #[tokio::test]
    async fn test_quadratic_slashing() {
        let config = StakingConfig::default();
        let manager = StakingManager::new(config, [1u8; 32]);
        
        let stake = 100_000 * 10u128.pow(18); // 100k tokens
        
        // First offense: 1² × 10% = 10%
        let slash1 = manager.calculate_slash_amount(stake, 1);
        assert_eq!(slash1, stake / 10);
        
        // Second offense: 2² × 10% = 40%
        let slash2 = manager.calculate_slash_amount(stake, 2);
        assert_eq!(slash2, stake * 4 / 10);
        
        // Third offense: 3² × 10% = 90%
        let slash3 = manager.calculate_slash_amount(stake, 3);
        assert_eq!(slash3, stake * 9 / 10);
        
        // Fourth offense: 4² × 10% = 160% (capped at 100%)
        let slash4 = manager.calculate_slash_amount(stake, 4);
        assert_eq!(slash4, stake);
    }

    #[tokio::test]
    async fn test_phase_configs() {
        let phase1_2 = StakingManager::phase1_2_config();
        assert_eq!(phase1_2.currency, StakeCurrency::ETH);
        assert_eq!(phase1_2.min_stake, MIN_STAKE_ETH);
        
        let phase3 = StakingManager::phase3_config([0u8; 20]);
        assert_eq!(phase3.currency, StakeCurrency::QS);
        assert_eq!(phase3.min_stake, MIN_STAKE_QS);
        assert!(phase3.veqs_contract.is_some());
    }

    #[tokio::test]
    async fn test_stake_eligibility() {
        let stake = StakeInfo {
            sequencer_id: [1u8; 32],
            amount: MIN_STAKE_ETH,
            currency: StakeCurrency::ETH,
            status: StakeStatus::Active,
            staked_at: 0,
            lock_end: 0,
            slashed_amount: 0,
            slash_count: 0,
            voting_power: MIN_STAKE_ETH,
        };
        
        assert!(stake.is_eligible(MIN_STAKE_ETH));
        assert!(!stake.is_eligible(MIN_STAKE_ETH + 1));
        
        // Check slashed stake
        let slashed = StakeInfo {
            slashed_amount: MIN_STAKE_ETH / 2,
            ..stake.clone()
        };
        assert_eq!(slashed.effective_stake(), MIN_STAKE_ETH / 2);
        
        // Inactive stake should not be eligible
        let inactive = StakeInfo {
            status: StakeStatus::Exiting,
            ..stake
        };
        assert!(!inactive.is_eligible(MIN_STAKE_ETH));
    }
}
