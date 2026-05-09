//! L1 ProverRegistry Service
//!
//! Provides Rust bindings for the ProverRegistry contract on L1 (Sepolia).
//! Implements L1 integration for:
//! - SEQUENCES §4.7-4.8: Slashing execution on L1
//! - SEQUENCES §6: Prover Exit (requestExit + completeExit on L1)
//!
//! ## Phase 3 PR1/5 (2026-05-09) ABI alignment
//!
//! The previously-bundled ABI (`abi/ProverRegistry.json`) and the matching
//! Rust signatures were generated against the alternate
//! `src/l1/contracts/src/prover/ProverRegistry.sol` source — the one keyed by
//! `bytes32 proverId`. The contract actually deployed on Sepolia at
//! `0x08e1fc1A0d614bc132B48950760c7A291cCB8946` is the canonical
//! `src/l1/contracts/src/ProverRegistry.sol`, which is keyed by
//! `address proverAddress`.
//!
//! Verified on-chain 2026-05-09 via `cast call` on Sepolia:
//!   - `MIN_STAKE_MAINNET()` returns `1e18` (canonical contract)
//!   - `MIN_STAKE_PHASE1()` reverts (alternate not deployed)
//!   - `testnetMode()` returns `true` (registration is free, no msg.value)
//!   - `authorizedSlashers(VAULT)` returns `true` (Vault may already slash)
//!
//! As a result this binding now models the canonical, on-chain ABI — every
//! prior `slash(bytes32,...)`, `getProver(bytes32)`, `isActiveProver(bytes32)`
//! call would have hit a 4-byte selector mismatch and been silently swallowed
//! by the existing best-effort wrappers. Same precedent as Phase 2 PR1 (#179).
//!
//! ## Contract Functions (deployed canonical)
//! - `slash(address proverAddress, uint256 amount, bytes32 reason)` — onlyAuthorizedSlasher
//! - `requestExit()` — caller (msg.sender) requests their own exit
//! - `completeExit()` — caller (msg.sender) finishes after unbonding
//! - `getProver(address)` — returns Prover{address,bytes32,bytes,uint256,uint256,bool,uint256,uint256}
//! - `isActiveProver(address)` — bool, returns the stored isActive flag
//!
//! ## Architecture
//! - PG is Source of Truth (SM-001) — L1 calls are best-effort
//! - Controlled by Feature Flags: l1.mode and l1.slashing.l1_execution
//! - Follows same pattern as L1VaultService (abigen!, SignerMiddleware)

use ethers::prelude::*;
use std::sync::Arc;
use tracing::{info, instrument};

use super::l1_client::L1Error;

// Generate Rust bindings from the ProverRegistry ABI
abigen!(
    ProverRegistryContract,
    "abi/ProverRegistry.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

/// L1 ProverRegistry service for slash/exit operations
pub struct L1ProverRegistryService {
    contract: ProverRegistryContract<SignerMiddleware<Provider<Http>, LocalWallet>>,
    address: Address,
}

impl L1ProverRegistryService {
    /// Create a new L1ProverRegistryService with signer
    ///
    /// # Arguments
    /// * `provider` - HTTP provider connected to Sepolia
    /// * `registry_address` - ProverRegistry contract address
    /// * `private_key` - Signer private key (hex, with or without 0x prefix)
    /// * `chain_id` - Chain ID (11155111 for Sepolia)
    pub async fn new(
        provider: Arc<Provider<Http>>,
        registry_address: &str,
        private_key: &str,
        chain_id: u64,
    ) -> Result<Self, L1Error> {
        let address: Address = registry_address.parse()
            .map_err(|_| L1Error::ContractCall("Invalid ProverRegistry address".into()))?;

        // Strip 0x prefix if present
        let key_hex = private_key.strip_prefix("0x").unwrap_or(private_key);

        let wallet: LocalWallet = key_hex.parse::<LocalWallet>()
            .map_err(|e| L1Error::ContractCall(format!("Invalid private key: {}", e)))?
            .with_chain_id(chain_id);

        let signer = SignerMiddleware::new((*provider).clone(), wallet);
        let contract = ProverRegistryContract::new(address, Arc::new(signer));

        info!(
            registry_address = %registry_address,
            chain_id = chain_id,
            "L1ProverRegistryService initialized"
        );

        Ok(Self { contract, address })
    }

    /// Slash a prover on L1
    ///
    /// Calls `ProverRegistry.slash(address proverAddress, uint256 amount, bytes32 reason)`
    /// on the deployed canonical contract.
    /// SEQUENCES §4.7: Quadratic slashing N² × 10% — the caller computes the
    /// final wei amount and passes it here. (The alternate, non-deployed
    /// contract took `colludingCount` and computed the slash on-chain; the
    /// canonical contract takes `amount` directly.)
    ///
    /// # Arguments
    /// * `prover_address` - Prover operator wallet (`provers.operator_addr`)
    /// * `amount` - Slash amount in wei (already-computed quadratic share)
    /// * `reason` - Reason hash (bytes32, typically challenge_id hash)
    #[instrument(skip(self), fields(prover_address = ?prover_address, amount = %amount))]
    pub async fn slash(
        &self,
        prover_address: Address,
        amount: U256,
        reason: [u8; 32],
    ) -> Result<H256, L1Error> {
        info!("Submitting slash() to L1 ProverRegistry");

        let tx = self.contract.slash(prover_address, amount, reason);

        let pending_tx = tx.send().await
            .map_err(|e| L1Error::TxSubmission(format!("ProverRegistry.slash() failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();

        info!(
            tx_hash = %tx_hash,
            prover_address = ?prover_address,
            amount = %amount,
            "ProverRegistry.slash() transaction submitted"
        );

        Ok(tx_hash)
    }

    /// Request prover exit on L1
    ///
    /// Calls `ProverRegistry.requestExit()` on the deployed canonical contract.
    /// SEQUENCES §6: Initiates 7-day unbonding period.
    ///
    /// ABI note (Phase 3 PR1/5): The canonical deployed contract identifies
    /// the prover by `msg.sender`, not by an explicit `proverId` parameter —
    /// the alternate (non-deployed) contract took `bytes32 proverId`. The
    /// `_prover_id` arg is preserved on the Rust signature for source-compat
    /// with existing call sites in `services/mod.rs` (which are out of this
    /// PR's file-touch budget); Phase 3 PR2-5 may revisit it once the prover
    /// registration binding lands.
    ///
    /// Note: This must be called by the prover's operator address.
    /// The API signer must be the registered operator for this call to succeed.
    #[instrument(skip(self))]
    pub async fn request_exit(
        &self,
        _prover_id: [u8; 32],
    ) -> Result<H256, L1Error> {
        info!("Submitting requestExit() to L1 ProverRegistry");

        let tx = self.contract.request_exit();

        let pending_tx = tx.send().await
            .map_err(|e| L1Error::TxSubmission(format!("ProverRegistry.requestExit() failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();

        info!(
            tx_hash = %tx_hash,
            "ProverRegistry.requestExit() transaction submitted"
        );

        Ok(tx_hash)
    }

    /// Execute prover exit on L1 (after unbonding period)
    ///
    /// Calls `ProverRegistry.completeExit()` on the deployed canonical
    /// contract (the alternate non-deployed contract called this `executeExit`).
    /// Returns staked ETH to prover operator.
    /// Only succeeds after the 7-day unbonding period.
    ///
    /// ABI note (Phase 3 PR1/5): same `_prover_id` source-compat shim as
    /// `request_exit` — caller is identified by `msg.sender` on-chain.
    #[instrument(skip(self))]
    pub async fn execute_exit(
        &self,
        _prover_id: [u8; 32],
    ) -> Result<H256, L1Error> {
        info!("Submitting completeExit() to L1 ProverRegistry");

        let tx = self.contract.complete_exit();

        let pending_tx = tx.send().await
            .map_err(|e| L1Error::TxSubmission(format!("ProverRegistry.completeExit() failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();

        info!(
            tx_hash = %tx_hash,
            "ProverRegistry.completeExit() transaction submitted"
        );

        Ok(tx_hash)
    }

    /// Get prover details from L1 (read-only)
    ///
    /// Calls `ProverRegistry.getProver(address)` on the deployed canonical
    /// contract and maps the returned `Prover` struct to `L1ProverInfo`.
    ///
    /// Canonical struct field order (`IProverRegistry.Prover`):
    ///   0. proverAddress (address)
    ///   1. sphincsPubKeyHash (bytes32)
    ///   2. sphincsPublicKey (bytes)
    ///   3. stakedAmount (uint256)
    ///   4. registeredAt (uint256)
    ///   5. isActive (bool)
    ///   6. successfulSigns (uint256)
    ///   7. slashedCount (uint256)
    #[instrument(skip(self))]
    pub async fn get_prover(
        &self,
        prover_address: Address,
    ) -> Result<L1ProverInfo, L1Error> {
        let prover = self.contract.get_prover(prover_address).call().await
            .map_err(|e| L1Error::ContractCall(format!("getProver() failed: {}", e)))?;

        Ok(L1ProverInfo {
            operator: prover.prover_address,
            stake: prover.staked_amount,
            registered_at: prover.registered_at,
            is_active: prover.is_active,
            slash_count: prover.slashed_count,
        })
    }

    /// Check if prover is active on L1 (read-only)
    ///
    /// Calls `ProverRegistry.isActiveProver(address)` on the deployed
    /// canonical contract.
    #[instrument(skip(self))]
    pub async fn is_active(
        &self,
        prover_address: Address,
    ) -> Result<bool, L1Error> {
        let active = self.contract.is_active_prover(prover_address).call().await
            .map_err(|e| L1Error::ContractCall(format!("isActiveProver() failed: {}", e)))?;

        Ok(active)
    }

    /// Get contract address
    pub fn address(&self) -> Address {
        self.address
    }
}

/// Parsed prover data from L1 ProverRegistry.
///
/// Phase 3 PR1/5: realigned to the canonical deployed contract's `Prover`
/// struct (address-keyed). The previous version had a `status: u8` field
/// because the alternate (non-deployed) contract exposed an enum; the
/// canonical contract exposes a plain `bool isActive` instead. Slashing
/// activity is tracked via `slash_count` (was field index 8 in the alternate
/// ABI; is field index 7 in the canonical ABI).
#[derive(Debug)]
pub struct L1ProverInfo {
    pub operator: Address,
    pub stake: U256,
    pub registered_at: U256,
    pub is_active: bool,
    pub slash_count: U256,
}

/// Parse hex string (with or without 0x prefix) to [u8; 32]
/// Shared utility for converting between Rust String prover_ids and Solidity bytes32
pub fn hex_to_bytes32(hex_str: &str) -> Result<[u8; 32], L1Error> {
    let clean = hex_str.strip_prefix("0x").unwrap_or(hex_str);
    let bytes = hex::decode(clean)
        .map_err(|e| L1Error::ContractCall(format!("Invalid hex: {}", e)))?;
    if bytes.len() != 32 {
        return Err(L1Error::ContractCall(format!(
            "Expected 32 bytes, got {}",
            bytes.len()
        )));
    }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Ok(arr)
}

/// Convert hex string to bytes32, returning zero bytes on failure
/// Used in best-effort L1 calls where we don't want to fail the DB operation
pub fn hex_to_bytes32_or_zero(hex_str: &str) -> [u8; 32] {
    hex_to_bytes32(hex_str).unwrap_or([0u8; 32])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hex_to_bytes32_valid() {
        let hex = "0x7a3246d8fd465f83700c112d20acb07da57c9d25c00535e51a1f7d524cdabf04";
        let result = hex_to_bytes32(hex);
        assert!(result.is_ok());
        let bytes = result.unwrap();
        assert_eq!(bytes[0], 0x7a);
        assert_eq!(bytes[31], 0x04);
    }

    #[test]
    fn test_hex_to_bytes32_no_prefix() {
        let hex = "7a3246d8fd465f83700c112d20acb07da57c9d25c00535e51a1f7d524cdabf04";
        let result = hex_to_bytes32(hex);
        assert!(result.is_ok());
    }

    #[test]
    fn test_hex_to_bytes32_wrong_length() {
        let hex = "0x1234";
        let result = hex_to_bytes32(hex);
        assert!(result.is_err());
    }

    #[test]
    fn test_hex_to_bytes32_or_zero_invalid() {
        let result = hex_to_bytes32_or_zero("invalid");
        assert_eq!(result, [0u8; 32]);
    }

    #[test]
    fn test_hex_to_bytes32_or_zero_valid() {
        let hex = "0x7a3246d8fd465f83700c112d20acb07da57c9d25c00535e51a1f7d524cdabf04";
        let result = hex_to_bytes32_or_zero(hex);
        assert_eq!(result[0], 0x7a);
    }
}
