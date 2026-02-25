//! L1 Vault Service
//!
//! Provides Rust bindings for the L1Vault contract on Sepolia (v2.0.0).
//! Uses `lockWithSR0()` for gas-optimized lock operations with pre-computed state roots.
//!
//! ## Contract Functions
//! - `lockWithSR0(lockId, sr0, recipient, expiry)` — Lock ETH with pre-computed SR_0
//! - `requestUnlock(lockId, recipient, smtProof, expectedSR1, sphincsSignatures, signingProvers)`
//! - `executeUnlock(lockId)` — Execute after timelock expires
//! - `getLock(lockId)` — View lock details
//! - `getUnlockRequest(lockId)` — View unlock request details

use ethers::prelude::*;
use std::sync::Arc;
use tracing::{info, warn, instrument};

use super::l1_client::L1Error;

// Generate Rust bindings from the L1Vault ABI
abigen!(
    L1VaultContract,
    "abi/L1Vault.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

/// L1 Vault service wrapping the contract bindings with a signer
pub struct L1VaultService {
    contract: L1VaultContract<SignerMiddleware<Provider<Http>, LocalWallet>>,
    address: Address,
}

impl L1VaultService {
    /// Create a new L1VaultService with signer
    ///
    /// # Arguments
    /// * `provider` - HTTP provider connected to Sepolia
    /// * `vault_address` - L1Vault contract address
    /// * `private_key` - Signer private key (hex, without 0x prefix)
    /// * `chain_id` - Chain ID (11155111 for Sepolia)
    pub async fn new(
        provider: Arc<Provider<Http>>,
        vault_address: &str,
        private_key: &str,
        chain_id: u64,
    ) -> Result<Self, L1Error> {
        let address: Address = vault_address.parse()
            .map_err(|_| L1Error::ContractCall("Invalid vault address".into()))?;

        // Strip 0x prefix if present
        let key_hex = private_key.strip_prefix("0x").unwrap_or(private_key);

        let wallet: LocalWallet = key_hex.parse::<LocalWallet>()
            .map_err(|e| L1Error::ContractCall(format!("Invalid private key: {}", e)))?
            .with_chain_id(chain_id);

        let signer = SignerMiddleware::new((*provider).clone(), wallet);
        let contract = L1VaultContract::new(address, Arc::new(signer));

        info!(
            vault_address = %vault_address,
            chain_id = chain_id,
            "L1VaultService initialized"
        );

        Ok(Self { contract, address })
    }

    /// Lock ETH in the vault with pre-computed SR_0
    ///
    /// Calls `lockWithSR0(lockId, sr0, recipient, expiry)` with ETH value.
    /// This is the SEQUENCES.md-compliant lock function (v2.0.0).
    ///
    /// # Arguments
    /// * `lock_id` - Lock ID (bytes32, hex with 0x prefix)
    /// * `sr_0` - State Root 0 (bytes32, hex with 0x prefix)
    /// * `recipient` - Recipient address
    /// * `expiry` - Expiry timestamp
    /// * `amount_wei` - Amount of ETH to lock in wei
    #[instrument(skip(self), fields(lock_id = %lock_id, amount_wei = %amount_wei))]
    pub async fn deposit(
        &self,
        lock_id: &str,
        sr_0: &str,
        recipient: &str,
        expiry: u64,
        amount_wei: U256,
    ) -> Result<H256, L1Error> {
        info!("Submitting lockWithSR0 to L1 Vault");

        let lock_id_bytes: [u8; 32] = hex_to_bytes32(lock_id)?;
        let sr0_bytes: [u8; 32] = hex_to_bytes32(sr_0)?;
        let recipient_addr: Address = recipient.parse()
            .map_err(|_| L1Error::ContractCall("Invalid recipient address".into()))?;

        let tx = self.contract
            .lock_with_sr0(lock_id_bytes, sr0_bytes, recipient_addr, U256::from(expiry))
            .value(amount_wei);

        let pending_tx = tx.send().await
            .map_err(|e| L1Error::TxSubmission(format!("lockWithSR0 failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();

        info!(
            tx_hash = %tx_hash,
            lock_id = %lock_id,
            amount_wei = %amount_wei,
            "lockWithSR0 transaction submitted"
        );

        Ok(tx_hash)
    }

    /// Request unlock on L1 with SPHINCS+ signatures and SMT proof
    ///
    /// Calls `requestUnlock(lockId, recipient, smtProof, expectedSR1, sphincsSignatures, signingProvers)`
    #[instrument(skip(self, smt_proof, sphincs_signatures, signing_provers), fields(lock_id = %lock_id))]
    pub async fn request_unlock(
        &self,
        lock_id: &str,
        recipient: &str,
        smt_proof: Vec<[u8; 32]>,
        expected_sr1: &str,
        sphincs_signatures: Vec<Bytes>,
        signing_provers: Vec<Address>,
    ) -> Result<H256, L1Error> {
        info!(
            signature_count = sphincs_signatures.len(),
            prover_count = signing_provers.len(),
            "Submitting requestUnlock to L1 Vault"
        );

        let lock_id_bytes: [u8; 32] = hex_to_bytes32(lock_id)?;
        let recipient_addr: Address = recipient.parse()
            .map_err(|_| L1Error::ContractCall("Invalid recipient address".into()))?;
        let sr1_bytes: [u8; 32] = hex_to_bytes32(expected_sr1)?;

        let tx = self.contract.request_unlock(
            lock_id_bytes,
            recipient_addr,
            smt_proof,
            sr1_bytes,
            sphincs_signatures,
            signing_provers,
        );

        let pending_tx = tx.send().await
            .map_err(|e| L1Error::TxSubmission(format!("requestUnlock failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();

        info!(
            tx_hash = %tx_hash,
            lock_id = %lock_id,
            "requestUnlock transaction submitted"
        );

        Ok(tx_hash)
    }

    /// Execute unlock after timelock expiry
    ///
    /// Calls `executeUnlock(lockId)` — only succeeds if timelock has passed
    #[instrument(skip(self), fields(lock_id = %lock_id))]
    pub async fn execute_unlock(&self, lock_id: &str) -> Result<H256, L1Error> {
        info!("Submitting executeUnlock to L1 Vault");

        let lock_id_bytes: [u8; 32] = hex_to_bytes32(lock_id)?;

        let tx = self.contract.execute_unlock(lock_id_bytes);

        let pending_tx = tx.send().await
            .map_err(|e| L1Error::TxSubmission(format!("executeUnlock failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();

        info!(
            tx_hash = %tx_hash,
            lock_id = %lock_id,
            "executeUnlock transaction submitted"
        );

        Ok(tx_hash)
    }

    /// Get lock details from L1 Vault
    #[instrument(skip(self), fields(lock_id = %lock_id))]
    pub async fn get_lock(&self, lock_id: &str) -> Result<L1VaultLock, L1Error> {
        let lock_id_bytes: [u8; 32] = hex_to_bytes32(lock_id)?;

        let lock = self.contract.get_lock(lock_id_bytes).call().await
            .map_err(|e| L1Error::ContractCall(format!("getLock failed: {}", e)))?;

        info!(
            lock_id = %lock_id,
            amount = %lock.amount,
            status = lock.status,
            "Got lock from L1 Vault"
        );

        Ok(L1VaultLock {
            sender: lock.sender,
            recipient: lock.recipient,
            amount: lock.amount,
            state_root: lock.state_root,
            locked_at: lock.locked_at,
            status: lock.status,
            expiry: lock.expiry,
        })
    }

    /// Get unlock request details from L1 Vault
    #[instrument(skip(self), fields(lock_id = %lock_id))]
    pub async fn get_unlock_request(&self, lock_id: &str) -> Result<L1VaultUnlockRequest, L1Error> {
        let lock_id_bytes: [u8; 32] = hex_to_bytes32(lock_id)?;

        let req = self.contract.get_unlock_request(lock_id_bytes).call().await
            .map_err(|e| L1Error::ContractCall(format!("getUnlockRequest failed: {}", e)))?;

        Ok(L1VaultUnlockRequest {
            lock_id: req.lock_id,
            recipient: req.recipient,
            amount: req.amount,
            unlockable_at: req.unlockable_at,
            is_emergency: req.is_emergency,
            signature_count: req.signature_count,
        })
    }

    /// Get vault contract address
    pub fn address(&self) -> Address {
        self.address
    }

    /// Get current unlock nonce counter from L1 Vault
    ///
    /// This is needed to compute SR_1 that matches the contract's computation.
    /// The nonce is incremented atomically during requestUnlock, so there's a
    /// potential race condition if multiple unlocks are processed simultaneously.
    #[instrument(skip(self))]
    pub async fn get_unlock_nonce_counter(&self) -> Result<U256, L1Error> {
        let nonce = self.contract.unlock_nonce_counter().call().await
            .map_err(|e| L1Error::ContractCall(format!("unlockNonceCounter failed: {}", e)))?;

        info!(
            unlock_nonce_counter = %nonce,
            "Got unlockNonceCounter from L1 Vault"
        );

        Ok(nonce)
    }

    /// Get lock's state root (SR_0) from L1 Vault
    ///
    /// Returns the SR_0 stored when the lock was created.
    #[instrument(skip(self), fields(lock_id = %lock_id))]
    pub async fn get_lock_state_root(&self, lock_id: &str) -> Result<[u8; 32], L1Error> {
        let lock = self.get_lock(lock_id).await?;
        Ok(lock.state_root)
    }
}

/// Parsed lock data from L1 Vault
#[derive(Debug)]
pub struct L1VaultLock {
    pub sender: Address,
    pub recipient: Address,
    pub amount: U256,
    pub state_root: [u8; 32],
    pub locked_at: U256,
    pub status: u8,
    pub expiry: U256,
}

/// Parsed unlock request data from L1 Vault
#[derive(Debug)]
pub struct L1VaultUnlockRequest {
    pub lock_id: [u8; 32],
    pub recipient: Address,
    pub amount: U256,
    pub unlockable_at: U256,
    pub is_emergency: bool,
    pub signature_count: U256,
}

/// Parse hex string (with or without 0x prefix) to [u8; 32]
fn hex_to_bytes32(hex_str: &str) -> Result<[u8; 32], L1Error> {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hex_to_bytes32() {
        let hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        let result = hex_to_bytes32(hex);
        assert!(result.is_ok());
        let bytes = result.unwrap();
        assert_eq!(bytes[0], 0x12);
        assert_eq!(bytes[31], 0xef);
    }

    #[test]
    fn test_hex_to_bytes32_no_prefix() {
        let hex = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        let result = hex_to_bytes32(hex);
        assert!(result.is_ok());
    }

    #[test]
    fn test_hex_to_bytes32_wrong_length() {
        let hex = "0x1234";
        let result = hex_to_bytes32(hex);
        assert!(result.is_err());
    }
}
