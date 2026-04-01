//! L1/L3 Integration Tests
//!
//! Verifies connectivity to:
//! - L3 (local Anvil, chain 31337): 6 core contracts deployed via DeployCore.s.sol
//! - L1 (Sepolia, chain 11155111): L1Vault + SPHINCSVerifier (already deployed)
//!
//! These tests require:
//! - L3 Anvil running on port 8545
//! - L1 Sepolia accessible via Infura RPC
//! - L3 contracts deployed (run: FOUNDRY_PROFILE=l3 forge script src/l3/script/DeployCore.s.sol --rpc-url http://localhost:8545 --broadcast)

use ethers::prelude::*;
use std::sync::Arc;

// L3 Contract Addresses (from DeployCore.s.sol deployment)
const L3_CORE_LAYER: &str = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const L3_VE_QS: &str = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const L3_GOVERNOR: &str = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
const L3_INSURANCE_FUND: &str = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const L3_TREASURY: &str = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
const L3_REWARD_ROUTER: &str = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

// L1 Sepolia Addresses
const L1_VAULT: &str = "0x108A5CE65f927ACfAC55325f1c471010FdEC8599";
const L1_SPHINCS_VERIFIER: &str = "0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103";

// RPC Endpoints
const L3_RPC: &str = "http://localhost:8545";
const L1_RPC: &str = "https://rpc.sepolia.org"; // Override via L1_RPC_URL env var

// ABI bindings
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

abigen!(
    RewardRouterContract,
    "abi/RewardRouter.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

abigen!(
    L1VaultContract,
    "abi/L1Vault.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

// =============================================================================
// L3 CONNECTIVITY TESTS (Local Anvil)
// =============================================================================

#[cfg(test)]
mod l3_tests {
    use super::*;

    fn l3_provider() -> Arc<Provider<Http>> {
        Arc::new(Provider::<Http>::try_from(L3_RPC).expect("L3 provider"))
    }

    #[tokio::test]
    async fn test_l3_chain_id() {
        let provider = l3_provider();
        let chain_id = provider.get_chainid().await.expect("get chain ID");
        assert_eq!(chain_id.as_u64(), 31337, "L3 Anvil chain ID should be 31337");
    }

    #[tokio::test]
    async fn test_l3_core_layer_state_root() {
        let provider = l3_provider();
        let addr: Address = L3_CORE_LAYER.parse().unwrap();
        let contract = CoreLayerContract::new(addr, provider);
        let root = contract.get_state_root().call().await.expect("getStateRoot");
        // Initial state root is zero bytes
        assert_eq!(root, [0u8; 32], "Initial state root should be zero");
    }

    #[tokio::test]
    async fn test_l3_core_layer_is_locked() {
        let provider = l3_provider();
        let addr: Address = L3_CORE_LAYER.parse().unwrap();
        let contract = CoreLayerContract::new(addr, provider);
        let locked = contract.is_locked([0u8; 32]).call().await.expect("isLocked");
        assert!(!locked, "Non-existent tx should not be locked");
    }

    #[tokio::test]
    async fn test_l3_veqs_voting_power() {
        let provider = l3_provider();
        let addr: Address = L3_VE_QS.parse().unwrap();
        let contract = VeQSContract::new(addr, provider);
        let power = contract
            .get_voting_power(Address::zero())
            .call()
            .await
            .expect("getVotingPower");
        assert_eq!(power, U256::zero(), "Zero address should have 0 voting power");
    }

    #[tokio::test]
    async fn test_l3_veqs_total_voting_power() {
        let provider = l3_provider();
        let addr: Address = L3_VE_QS.parse().unwrap();
        let contract = VeQSContract::new(addr, provider);
        let total = contract
            .get_total_voting_power()
            .call()
            .await
            .expect("getTotalVotingPower");
        assert_eq!(total, U256::zero(), "Initial total voting power should be 0");
    }

    #[tokio::test]
    async fn test_l3_governor_proposal_count() {
        let provider = l3_provider();
        let addr: Address = L3_GOVERNOR.parse().unwrap();
        let contract = GovernorContract::new(addr, provider);
        let count = contract.proposal_count().call().await.expect("proposalCount");
        assert_eq!(count, U256::zero(), "Initial proposal count should be 0");
    }

    #[tokio::test]
    async fn test_l3_insurance_fund_balance() {
        let provider = l3_provider();
        let addr: Address = L3_INSURANCE_FUND.parse().unwrap();
        let contract = InsuranceFundContract::new(addr, provider);
        let balance = contract.get_balance().call().await.expect("getBalance");
        assert_eq!(balance, U256::zero(), "Initial insurance fund balance should be 0");
    }

    #[tokio::test]
    async fn test_l3_treasury_balance() {
        let provider = l3_provider();
        let addr: Address = L3_TREASURY.parse().unwrap();
        let contract = TreasuryContract::new(addr, provider);
        let balance = contract.get_balance().call().await.expect("getBalance");
        assert_eq!(balance, U256::zero(), "Initial treasury balance should be 0");
    }

    #[tokio::test]
    async fn test_l3_reward_router_total_distributed() {
        let provider = l3_provider();
        let addr: Address = L3_REWARD_ROUTER.parse().unwrap();
        let contract = RewardRouterContract::new(addr, provider);
        let total = contract.total_distributed().call().await.expect("totalDistributed");
        assert_eq!(total, U256::zero(), "Initial total distributed should be 0");
    }
}

// =============================================================================
// L1 CONNECTIVITY TESTS (Sepolia)
// =============================================================================

#[cfg(test)]
mod l1_tests {
    use super::*;

    fn l1_provider() -> Arc<Provider<Http>> {
        Arc::new(Provider::<Http>::try_from(L1_RPC).expect("L1 provider"))
    }

    #[tokio::test]
    async fn test_l1_chain_id() {
        let provider = l1_provider();
        let chain_id = provider.get_chainid().await.expect("get L1 chain ID");
        assert_eq!(chain_id.as_u64(), 11155111, "L1 Sepolia chain ID should be 11155111");
    }

    #[tokio::test]
    async fn test_l1_vault_code_exists() {
        let provider = l1_provider();
        let addr: Address = L1_VAULT.parse().unwrap();
        let code = provider.get_code(addr, None).await.expect("get code");
        assert!(!code.is_empty(), "L1Vault contract should have code deployed");
    }

    #[tokio::test]
    async fn test_l1_vault_owner() {
        let provider = l1_provider();
        let addr: Address = L1_VAULT.parse().unwrap();
        let contract = L1VaultContract::new(addr, provider);
        let owner = contract.owner().call().await.expect("owner");
        let expected_owner: Address = "0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3".parse().unwrap();
        assert_eq!(owner, expected_owner, "L1Vault owner should be the deployer");
    }

    #[tokio::test]
    async fn test_l1_sphincs_verifier_code_exists() {
        let provider = l1_provider();
        let addr: Address = L1_SPHINCS_VERIFIER.parse().unwrap();
        let code = provider.get_code(addr, None).await.expect("get code");
        assert!(!code.is_empty(), "SPHINCSVerifier contract should have code deployed");
    }

    #[tokio::test]
    async fn test_l1_vault_get_lock_nonexistent() {
        let provider = l1_provider();
        let addr: Address = L1_VAULT.parse().unwrap();
        let contract = L1VaultContract::new(addr, provider);
        // Query a lock that doesn't exist (zero hash)
        let result = contract.get_lock([0u8; 32]).call().await;
        // Should either return empty/zero or revert — both are acceptable
        match result {
            Ok(lock) => {
                assert_eq!(lock.amount, U256::zero(), "Non-existent lock amount should be 0");
            }
            Err(_) => {
                // Revert is also acceptable for non-existent locks
            }
        }
    }
}

// =============================================================================
// CROSS-LAYER CONNECTIVITY TEST
// =============================================================================

#[cfg(test)]
mod cross_layer_tests {
    use super::*;

    #[tokio::test]
    async fn test_both_layers_accessible() {
        // L3 Anvil
        let l3 = Provider::<Http>::try_from(L3_RPC).expect("L3 provider");
        let l3_chain = l3.get_chainid().await.expect("L3 chain ID");
        assert_eq!(l3_chain.as_u64(), 31337);

        // L1 Sepolia
        let l1 = Provider::<Http>::try_from(L1_RPC).expect("L1 provider");
        let l1_chain = l1.get_chainid().await.expect("L1 chain ID");
        assert_eq!(l1_chain.as_u64(), 11155111);

        // Verify they're different chains
        assert_ne!(l3_chain, l1_chain, "L3 and L1 should be different chains");
    }

    #[tokio::test]
    async fn test_l3_contracts_all_have_code() {
        let provider = Arc::new(Provider::<Http>::try_from(L3_RPC).expect("L3 provider"));

        let addresses = [
            ("CoreLayer", L3_CORE_LAYER),
            ("veQS", L3_VE_QS),
            ("Governor", L3_GOVERNOR),
            ("InsuranceFund", L3_INSURANCE_FUND),
            ("Treasury", L3_TREASURY),
            ("RewardRouter", L3_REWARD_ROUTER),
        ];

        for (name, addr_str) in addresses {
            let addr: Address = addr_str.parse().unwrap();
            let code = provider.get_code(addr, None).await
                .unwrap_or_else(|_| panic!("{} code fetch failed", name));
            assert!(!code.is_empty(), "{} at {} should have code", name, addr_str);
        }
    }
}
