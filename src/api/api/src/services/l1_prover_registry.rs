//! L1 ProverRegistry Service
//!
//! Provides Rust bindings for the ProverRegistry contract on L1 (Sepolia).
//! Implements L1 integration for:
//! - SEQUENCES §4.7-4.8: Slashing execution on L1
//! - SEQUENCES §6: Prover Exit (requestExit + executeExit on L1)
//!
//! ## Contract Functions
//! - `slash(proverId, colludingCount, reason)` — Slash a prover (onlyOwner)
//! - `requestExit(proverId)` — Request prover exit (7-day unbonding)
//! - `executeExit(proverId)` — Execute exit after unbonding period
//! - `getProver(proverId)` — View prover details (read-only)
//! - `isActiveProver(proverId)` — Check if prover is active (read-only)
//!
//! ## Architecture
//! - PG is Source of Truth (SM-001) — L1 calls are best-effort
//! - Controlled by Feature Flags: l1.mode and l1.slashing.l1_execution
//! - Follows same pattern as L1VaultService (abigen!, SignerMiddleware)

use ethers::prelude::*;
use std::sync::Arc;
use tracing::{info, warn, instrument};

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
    /// Calls `ProverRegistry.slash(proverId, colludingCount, reason)`
    /// SEQUENCES §4.7: Quadratic slashing N² × 10%
    ///
    /// # Arguments
    /// * `prover_id` - Prover ID (bytes32)
    /// * `colluding_count` - Number of colluding provers
    /// * `reason` - Reason hash (bytes32, typically challenge_id hash)
    #[instrument(skip(self), fields(colluding_count = colluding_count))]
    pub async fn slash(
        &self,
        prover_id: [u8; 32],
        colluding_count: u64,
        reason: [u8; 32],
    ) -> Result<H256, L1Error> {
        info!("Submitting slash() to L1 ProverRegistry");

        let tx = self.contract.slash(
            prover_id,
            U256::from(colluding_count),
            reason,
        );

        let pending_tx = tx.send().await
            .map_err(|e| L1Error::TxSubmission(format!("ProverRegistry.slash() failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();

        info!(
            tx_hash = %tx_hash,
            colluding_count = colluding_count,
            "ProverRegistry.slash() transaction submitted"
        );

        Ok(tx_hash)
    }

    /// Request prover exit on L1
    ///
    /// Calls `ProverRegistry.requestExit(proverId)`
    /// SEQUENCES §6: Initiates 7-day unbonding period
    ///
    /// Note: This must be called by the prover's operator address.
    /// The API signer must be the registered operator for this call to succeed.
    #[instrument(skip(self))]
    pub async fn request_exit(
        &self,
        prover_id: [u8; 32],
    ) -> Result<H256, L1Error> {
        info!("Submitting requestExit() to L1 ProverRegistry");

        let tx = self.contract.request_exit(prover_id);

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
    /// Calls `ProverRegistry.executeExit(proverId)`
    /// Returns staked ETH to prover operator.
    /// Only succeeds after 7-day unbonding period.
    #[instrument(skip(self))]
    pub async fn execute_exit(
        &self,
        prover_id: [u8; 32],
    ) -> Result<H256, L1Error> {
        info!("Submitting executeExit() to L1 ProverRegistry");

        let tx = self.contract.execute_exit(prover_id);

        let pending_tx = tx.send().await
            .map_err(|e| L1Error::TxSubmission(format!("ProverRegistry.executeExit() failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();

        info!(
            tx_hash = %tx_hash,
            "ProverRegistry.executeExit() transaction submitted"
        );

        Ok(tx_hash)
    }

    /// Get prover details from L1 (read-only)
    ///
    /// Returns on-chain prover data including stake, status, and operator address.
    #[instrument(skip(self))]
    pub async fn get_prover(
        &self,
        prover_id: [u8; 32],
    ) -> Result<L1ProverInfo, L1Error> {
        let prover = self.contract.get_prover(prover_id).call().await
            .map_err(|e| L1Error::ContractCall(format!("getProver() failed: {}", e)))?;

        Ok(L1ProverInfo {
            operator: prover.0,
            stake: prover.3,
            status: prover.4,
            registered_at: prover.5,
            slash_count: prover.8,
        })
    }

    /// Check if prover is active on L1 (read-only)
    #[instrument(skip(self))]
    pub async fn is_active(
        &self,
        prover_id: [u8; 32],
    ) -> Result<bool, L1Error> {
        let active = self.contract.is_active_prover(prover_id).call().await
            .map_err(|e| L1Error::ContractCall(format!("isActiveProver() failed: {}", e)))?;

        Ok(active)
    }

    /// Get contract address
    pub fn address(&self) -> Address {
        self.address
    }
}

/// Parsed prover data from L1 ProverRegistry
#[derive(Debug)]
pub struct L1ProverInfo {
    pub operator: Address,
    pub stake: U256,
    pub status: u8,
    pub registered_at: U256,
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
