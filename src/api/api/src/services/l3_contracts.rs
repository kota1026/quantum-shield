//! L3 Contract Bindings Module
//!
//! Provides ethers `abigen!` Rust bindings for 6 core L3 contracts:
//! - CoreLayer: SMT root recording, Lock state, Bridge transactions
//! - veQS: Vote-escrowed QS token (balance, voting power, delegation)
//! - RewardRouter: Reward distribution (50% veQS, 30% Prover, 10% Observer, 10% Treasury)
//! - Governor: Governance proposals, voting, execution
//! - InsuranceFund: Insurance fund management
//! - Treasury: Treasury management with multi-sig
//!
//! ## Architecture
//! Each contract is accessed via read-only Provider for view calls.
//! Write operations go through SignerMiddleware (when L3 signer is configured).
//! In dev mode (no L3 endpoint), all methods return stub values.

use ethers::prelude::*;
use std::sync::Arc;
use tracing::{info, warn};

use crate::error::ApiError;

// ============================================================================
// ABI Bindings
// ============================================================================

abigen!(
    CoreLayerContract,
    "abi/CoreLayer.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

abigen!(
    VeQSContract,
    "abi/veQS.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

abigen!(
    RewardRouterContract,
    "abi/RewardRouter.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

abigen!(
    GovernorContract,
    "abi/Governor.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

abigen!(
    InsuranceFundContract,
    "abi/InsuranceFund.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

abigen!(
    TreasuryContract,
    "abi/Treasury.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

// ============================================================================
// L3 Contracts Service
// ============================================================================

/// Configuration for L3 contract addresses
#[derive(Debug, Clone)]
pub struct L3ContractAddresses {
    pub core_layer: Address,
    pub ve_qs: Address,
    pub reward_router: Address,
    pub governor: Address,
    pub insurance_fund: Address,
    pub treasury: Address,
}

impl Default for L3ContractAddresses {
    fn default() -> Self {
        Self {
            core_layer: Address::zero(),
            ve_qs: Address::zero(),
            reward_router: Address::zero(),
            governor: Address::zero(),
            insurance_fund: Address::zero(),
            treasury: Address::zero(),
        }
    }
}

/// L3 Contracts — read-only bindings for querying L3 state
pub struct L3Contracts {
    pub core_layer: Option<CoreLayerContract<Provider<Http>>>,
    pub ve_qs: Option<VeQSContract<Provider<Http>>>,
    pub reward_router: Option<RewardRouterContract<Provider<Http>>>,
    pub governor: Option<GovernorContract<Provider<Http>>>,
    pub insurance_fund: Option<InsuranceFundContract<Provider<Http>>>,
    pub treasury: Option<TreasuryContract<Provider<Http>>>,
    connected: bool,
}

impl L3Contracts {
    /// Create L3 contract bindings.
    /// If `endpoint` is None or addresses are zero, operates in dev mode (no real calls).
    pub fn new(
        endpoint: Option<&str>,
        addresses: &L3ContractAddresses,
    ) -> Result<Self, ApiError> {
        let endpoint = match endpoint {
            Some(ep) if !ep.is_empty() => ep,
            _ => {
                info!("L3Contracts: no endpoint configured, running in dev mode");
                return Ok(Self {
                    core_layer: None,
                    ve_qs: None,
                    reward_router: None,
                    governor: None,
                    insurance_fund: None,
                    treasury: None,
                    connected: false,
                });
            }
        };

        let provider = Provider::<Http>::try_from(endpoint)
            .map_err(|e| ApiError::Internal(format!("L3 provider error: {}", e)))?;
        let provider = Arc::new(provider);

        let core_layer = if addresses.core_layer != Address::zero() {
            Some(CoreLayerContract::new(addresses.core_layer, provider.clone()))
        } else {
            None
        };

        let ve_qs = if addresses.ve_qs != Address::zero() {
            Some(VeQSContract::new(addresses.ve_qs, provider.clone()))
        } else {
            None
        };

        let reward_router = if addresses.reward_router != Address::zero() {
            Some(RewardRouterContract::new(addresses.reward_router, provider.clone()))
        } else {
            None
        };

        let governor = if addresses.governor != Address::zero() {
            Some(GovernorContract::new(addresses.governor, provider.clone()))
        } else {
            None
        };

        let insurance_fund = if addresses.insurance_fund != Address::zero() {
            Some(InsuranceFundContract::new(addresses.insurance_fund, provider.clone()))
        } else {
            None
        };

        let treasury = if addresses.treasury != Address::zero() {
            Some(TreasuryContract::new(addresses.treasury, provider.clone()))
        } else {
            None
        };

        let connected = core_layer.is_some() || ve_qs.is_some();
        info!(
            "L3Contracts initialized: connected={}, core_layer={}, ve_qs={}, governor={}, treasury={}",
            connected,
            core_layer.is_some(),
            ve_qs.is_some(),
            governor.is_some(),
            treasury.is_some(),
        );

        Ok(Self {
            core_layer,
            ve_qs,
            reward_router,
            governor,
            insurance_fund,
            treasury,
            connected,
        })
    }

    /// Whether the L3 contracts are connected
    pub fn is_connected(&self) -> bool {
        self.connected
    }

    // ========================================================================
    // veQS Read Operations
    // ========================================================================

    /// Get voting power for an address
    pub async fn get_voting_power(&self, user: Address) -> Result<U256, ApiError> {
        if let Some(contract) = &self.ve_qs {
            let power = contract.get_voting_power(user).call().await
                .map_err(|e| ApiError::Internal(format!("veQS.getVotingPower failed: {}", e)))?;
            Ok(power)
        } else {
            // Dev mode: return 1 (allows governance participation in dev)
            Ok(U256::from(1))
        }
    }

    /// Get effective voting power (own + delegated)
    pub async fn get_effective_voting_power(&self, user: Address) -> Result<U256, ApiError> {
        if let Some(contract) = &self.ve_qs {
            let power = contract.get_effective_voting_power(user).call().await
                .map_err(|e| ApiError::Internal(format!("veQS.getEffectiveVotingPower failed: {}", e)))?;
            Ok(power)
        } else {
            Ok(U256::from(1))
        }
    }

    /// Get total voting power across all users
    pub async fn get_total_voting_power(&self) -> Result<U256, ApiError> {
        if let Some(contract) = &self.ve_qs {
            let total = contract.get_total_voting_power().call().await
                .map_err(|e| ApiError::Internal(format!("veQS.getTotalVotingPower failed: {}", e)))?;
            Ok(total)
        } else {
            Ok(U256::from(100))
        }
    }

    /// Get delegate for a user
    pub async fn get_delegate(&self, user: Address) -> Result<Address, ApiError> {
        if let Some(contract) = &self.ve_qs {
            let delegate = contract.get_delegate(user).call().await
                .map_err(|e| ApiError::Internal(format!("veQS.getDelegate failed: {}", e)))?;
            Ok(delegate)
        } else {
            Ok(user) // Dev mode: self-delegation
        }
    }

    // ========================================================================
    // Governor Read Operations
    // ========================================================================

    /// Get proposal count
    pub async fn get_proposal_count(&self) -> Result<U256, ApiError> {
        if let Some(contract) = &self.governor {
            let count = contract.proposal_count().call().await
                .map_err(|e| ApiError::Internal(format!("Governor.proposalCount failed: {}", e)))?;
            Ok(count)
        } else {
            Ok(U256::zero())
        }
    }

    /// Get quorum for a proposal category
    pub async fn get_quorum(&self, category: u8) -> Result<U256, ApiError> {
        if let Some(contract) = &self.governor {
            let quorum = contract.quorum(category).call().await
                .map_err(|e| ApiError::Internal(format!("Governor.quorum failed: {}", e)))?;
            Ok(quorum)
        } else {
            // Dev mode defaults per SEQUENCES
            let default_quorum = match category {
                0 => U256::from(4),  // Parameter: 4%
                1 => U256::from(8),  // Upgrade: 8%
                2 => U256::from(15), // Council: 15%
                _ => U256::from(4),
            };
            Ok(default_quorum)
        }
    }

    // ========================================================================
    // CoreLayer Read Operations
    // ========================================================================

    /// Get current state root
    pub async fn get_state_root(&self) -> Result<[u8; 32], ApiError> {
        if let Some(contract) = &self.core_layer {
            let root = contract.get_state_root().call().await
                .map_err(|e| ApiError::Internal(format!("CoreLayer.getStateRoot failed: {}", e)))?;
            Ok(root)
        } else {
            Ok([0u8; 32]) // Dev mode: zero root
        }
    }

    /// Check if a transaction is locked
    pub async fn is_locked(&self, tx_hash: [u8; 32]) -> Result<bool, ApiError> {
        if let Some(contract) = &self.core_layer {
            let locked = contract.is_locked(tx_hash).call().await
                .map_err(|e| ApiError::Internal(format!("CoreLayer.isLocked failed: {}", e)))?;
            Ok(locked)
        } else {
            Ok(false)
        }
    }

    // ========================================================================
    // InsuranceFund Read Operations
    // ========================================================================

    /// Get insurance fund balance
    pub async fn get_insurance_balance(&self) -> Result<U256, ApiError> {
        if let Some(contract) = &self.insurance_fund {
            let balance = contract.get_balance().call().await
                .map_err(|e| ApiError::Internal(format!("InsuranceFund.getBalance failed: {}", e)))?;
            Ok(balance)
        } else {
            Ok(U256::zero())
        }
    }

    // ========================================================================
    // Treasury Read Operations
    // ========================================================================

    /// Get treasury balance
    pub async fn get_treasury_balance(&self) -> Result<U256, ApiError> {
        if let Some(contract) = &self.treasury {
            let balance = contract.get_balance().call().await
                .map_err(|e| ApiError::Internal(format!("Treasury.getBalance failed: {}", e)))?;
            Ok(balance)
        } else {
            Ok(U256::zero())
        }
    }

    /// Get treasury proposal count
    pub async fn get_treasury_proposal_count(&self) -> Result<U256, ApiError> {
        if let Some(contract) = &self.treasury {
            let count = contract.get_proposal_count().call().await
                .map_err(|e| ApiError::Internal(format!("Treasury.getProposalCount failed: {}", e)))?;
            Ok(count)
        } else {
            Ok(U256::zero())
        }
    }

    // ========================================================================
    // RewardRouter Read Operations
    // ========================================================================

    /// Get total distributed rewards
    pub async fn get_total_distributed(&self) -> Result<U256, ApiError> {
        if let Some(contract) = &self.reward_router {
            let total = contract.total_distributed().call().await
                .map_err(|e| ApiError::Internal(format!("RewardRouter.totalDistributed failed: {}", e)))?;
            Ok(total)
        } else {
            Ok(U256::zero())
        }
    }

    /// Get pending balance to distribute
    pub async fn get_pending_rewards(&self) -> Result<U256, ApiError> {
        if let Some(contract) = &self.reward_router {
            let pending = contract.pending_balance().call().await
                .map_err(|e| ApiError::Internal(format!("RewardRouter.pendingBalance failed: {}", e)))?;
            Ok(pending)
        } else {
            Ok(U256::zero())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dev_mode_creation() {
        let contracts = L3Contracts::new(None, &L3ContractAddresses::default()).unwrap();
        assert!(!contracts.is_connected());
        assert!(contracts.core_layer.is_none());
        assert!(contracts.ve_qs.is_none());
    }

    #[test]
    fn test_zero_address_no_binding() {
        // Even with an endpoint, zero addresses should not create bindings
        let contracts = L3Contracts::new(
            Some("http://localhost:8545"),
            &L3ContractAddresses::default(),
        ).unwrap();
        assert!(!contracts.is_connected());
    }

    #[test]
    fn test_partial_address_config() {
        let mut addrs = L3ContractAddresses::default();
        addrs.ve_qs = "0x0000000000000000000000000000000000000001".parse().unwrap();

        let contracts = L3Contracts::new(
            Some("http://localhost:8545"),
            &addrs,
        ).unwrap();
        assert!(contracts.is_connected());
        assert!(contracts.ve_qs.is_some());
        assert!(contracts.core_layer.is_none());
    }

    #[tokio::test]
    async fn test_dev_mode_voting_power() {
        let contracts = L3Contracts::new(None, &L3ContractAddresses::default()).unwrap();
        let power = contracts.get_voting_power(Address::zero()).await.unwrap();
        assert_eq!(power, U256::from(1)); // Dev mode default
    }

    #[tokio::test]
    async fn test_dev_mode_state_root() {
        let contracts = L3Contracts::new(None, &L3ContractAddresses::default()).unwrap();
        let root = contracts.get_state_root().await.unwrap();
        assert_eq!(root, [0u8; 32]); // Dev mode: zero root
    }

    #[tokio::test]
    async fn test_dev_mode_quorum() {
        let contracts = L3Contracts::new(None, &L3ContractAddresses::default()).unwrap();
        let q_param = contracts.get_quorum(0).await.unwrap();
        let q_upgrade = contracts.get_quorum(1).await.unwrap();
        let q_council = contracts.get_quorum(2).await.unwrap();
        assert_eq!(q_param, U256::from(4));
        assert_eq!(q_upgrade, U256::from(8));
        assert_eq!(q_council, U256::from(15));
    }
}
